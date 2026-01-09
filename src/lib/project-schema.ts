/**
 * @file project-schema.ts
 * @description 프로젝트별 DB(스키마) 자동 생성/초기화 유틸
 *
 * 정책:
 * - 프로젝트 등록/저장 시 프로젝트 ID 기준으로 schema를 생성하여 "프로젝트별 DB"처럼 분리 저장
 * - 스키마명 규칙: pfmea_{projectId} (안전한 sanitize 후 소문자)
 * - public 스키마의 테이블 구조를 프로젝트 스키마로 복제하여 Prisma가 즉시 사용할 수 있게 함
 */

import { Client } from 'pg';

// PFMEA에서 프로젝트별로 분리 저장할 테이블들 (prisma @@map 기준)
const PROJECT_TABLES = [
  'l1_structures',
  'l2_structures',
  'l3_structures',
  'l1_functions',
  'l2_functions',
  'l3_functions',
  'failure_effects',
  'failure_modes',
  'failure_causes',
  'failure_links',
  'risk_analyses',
  'optimizations',
  'fmea_confirmed_states',
  'fmea_legacy_data',
] as const;

export function getProjectSchemaName(fmeaId: string): string {
  const base = String(fmeaId || '').trim().toLowerCase();
  // allow a-z0-9_ only
  const safe = base.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  // prefix ensures it starts with a letter
  return `pfmea_${safe || 'unknown'}`;
}

function quoteIdent(ident: string): string {
  // Minimal quote for identifiers
  return `"${ident.replace(/"/g, '""')}"`;
}

/**
 * Ensure the project schema exists and contains the required tables.
 * This clones public.<table> into <schema>.<table> using LIKE INCLUDING ALL.
 */
export async function ensureProjectSchemaReady(params: {
  baseDatabaseUrl: string;
  schema: string;
}): Promise<void> {
  const { baseDatabaseUrl, schema } = params;

  const client = new Client({ connectionString: baseDatabaseUrl });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)}`);

    for (const table of PROJECT_TABLES) {
      // Copy table structure from public if not exists
      // INCLUDING ALL copies defaults, constraints, indexes, etc.
      await client.query(
        `CREATE TABLE IF NOT EXISTS ${quoteIdent(schema)}.${quoteIdent(table)} (LIKE public.${quoteIdent(table)} INCLUDING ALL)`
      );
    }
  } finally {
    await client.end().catch(() => {});
  }
}




