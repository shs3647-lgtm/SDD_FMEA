/**
 * @file prisma.ts
 * @description Prisma Client 싱글톤 (Lazy Loading)
 * 
 * Next.js에서 Prisma Client를 재사용하기 위한 싱글톤 패턴
 * DATABASE_URL이 없을 때는 Prisma Client를 생성하지 않음
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
  prismaBySchema: Map<string, PrismaClient> | undefined;
  pgPoolBySchema: Map<string, Pool> | undefined;
};

function ensureDatabaseUrlLoaded(): void {
  if (process.env.DATABASE_URL) return;

  // Try a few sensible locations without logging secrets
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    // When started from workspace root
    path.resolve(process.cwd(), 'fmea-onpremise', '.env'),
    // npm sets INIT_CWD to original working directory
    process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD, '.env') : null,
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    dotenv.config({ path: p });
    if (process.env.DATABASE_URL) return;
  }
}

/**
 * Prisma Client 싱글톤 (Lazy Loading)
 * DATABASE_URL이 있을 때만 생성
 */
function getPrismaClient(): PrismaClient | null {
  ensureDatabaseUrlLoaded();

  // DATABASE_URL 확인
  if (!process.env.DATABASE_URL) {
    return null;
  }

  // 이미 생성된 인스턴스가 있으면 재사용
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    // Prisma 7.x: engine type "client" requires adapter (direct DB connection)
    const pool =
      globalForPrisma.pgPool ??
      new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.pgPool = pool;
    }

    // Prisma Client 생성
    const client = new PrismaClient({
      adapter: new PrismaPg(pool),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // 개발 환경에서만 global에 저장
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }

    return client;
  } catch (error) {
    console.error('[Prisma] Prisma Client 생성 실패:', error);
    return null;
  }
}

// Lazy getter export (API에서 요청 시점에 호출)
export function getPrisma(): PrismaClient | null {
  return getPrismaClient();
}

function buildDatabaseUrlWithSchema(baseUrl: string, schema: string): string {
  // Avoid logging secrets; use URL to safely manipulate query params
  const u = new URL(baseUrl);
  u.searchParams.set('schema', schema);
  return u.toString();
}

/**
 * 프로젝트별 스키마용 Prisma Client
 * - DATABASE_URL을 기반으로 ?schema=...만 바꿔서 각 스키마 전용 client를 생성/캐시
 */
export function getPrismaForSchema(schema: string): PrismaClient | null {
  ensureDatabaseUrlLoaded();
  if (!process.env.DATABASE_URL) return null;

  const targetSchema = String(schema || 'public');
  const cacheKey = targetSchema;

  globalForPrisma.prismaBySchema ??= new Map<string, PrismaClient>();
  globalForPrisma.pgPoolBySchema ??= new Map<string, Pool>();

  const existing = globalForPrisma.prismaBySchema.get(cacheKey);
  if (existing) return existing;

  const url = buildDatabaseUrlWithSchema(process.env.DATABASE_URL, targetSchema);

  // pg.Pool does not automatically set search_path from query param
  // We need to set it explicitly or ensure Prisma handles it.
  // Prisma with adapter-pg requires the search path to be set on the connection.
  const pool =
    globalForPrisma.pgPoolBySchema.get(cacheKey) ??
    new Pool({
      connectionString: url,
      // For PostgreSQL, we can set the search path in the connection options
      options: `-c search_path=${targetSchema},public`
    });
  globalForPrisma.pgPoolBySchema.set(cacheKey, pool);

  const client = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  globalForPrisma.prismaBySchema.set(cacheKey, client);
  return client;
}

export function getBaseDatabaseUrl(): string | null {
  ensureDatabaseUrlLoaded();
  return process.env.DATABASE_URL || null;
}

