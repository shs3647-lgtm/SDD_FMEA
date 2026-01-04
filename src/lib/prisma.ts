/**
 * @file prisma.ts
 * @description Prisma Client 싱글톤 (Lazy Loading)
 * 
 * Next.js에서 Prisma Client를 재사용하기 위한 싱글톤 패턴
 * DATABASE_URL이 없을 때는 Prisma Client를 생성하지 않음
 */

import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client 싱글톤 (Lazy Loading)
 * DATABASE_URL이 있을 때만 생성
 */
function getPrismaClient(): PrismaClient | null {
  // DATABASE_URL 확인
  if (!process.env.DATABASE_URL) {
    return null;
  }

  // 이미 생성된 인스턴스가 있으면 재사용
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    // Prisma Client 생성
    const client = new PrismaClient({
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

// Lazy getter로 export
export const prisma = getPrismaClient();

