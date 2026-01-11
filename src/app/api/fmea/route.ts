/**
 * @file route.ts
 * @description FMEA 데이터 저장/로드 API 라우트
 * 
 * ★★★ 근본적인 해결책: 레거시 데이터 = Single Source of Truth ★★★
 * - 저장 시: 레거시 데이터를 FmeaLegacyData 테이블에 JSON으로 직접 저장
 * - 로드 시: FmeaLegacyData에서 직접 가져오고, 원자성 DB는 PFD/CP/WS/PM 연동용으로만 사용
 * - 이를 통해 원자성 DB ↔ 레거시 변환 과정에서의 데이터 손실 문제 해결
 * 
 * POST /api/fmea - FMEA 데이터 저장
 * GET /api/fmea?fmeaId=xxx - FMEA 데이터 로드
 */

import { NextRequest, NextResponse } from 'next/server';
import type { FMEAWorksheetDB } from '@/app/pfmea/worksheet/schema';
import { getBaseDatabaseUrl, getPrisma, getPrismaForSchema } from '@/lib/prisma';
import { upsertActiveMasterFromWorksheetTx } from '@/app/api/pfmea/master/sync';
import { ensureProjectSchemaReady, getProjectSchemaName } from '@/lib/project-schema';
import { Pool } from 'pg';

// 레거시 데이터 스키마 버전
const LEGACY_DATA_VERSION = '1.0.0';

function computeLegacyCompletenessScore(legacy: any): number {
  if (!legacy) return 0;
  let score = 0;
  const l1Name = String(legacy?.l1?.name || '').trim();
  if (l1Name) score += 50;

  const l2 = Array.isArray(legacy?.l2) ? legacy.l2 : [];
  const meaningfulProcs = l2.filter((p: any) => String(p?.name || p?.no || '').trim());
  score += meaningfulProcs.length * 20;

  const l3Count = l2.reduce((acc: number, p: any) => acc + (Array.isArray(p?.l3) ? p.l3.length : 0), 0);
  score += l3Count * 5;

  const fmCount = l2.reduce((acc: number, p: any) => acc + (Array.isArray(p?.failureModes) ? p.failureModes.length : 0), 0);
  const fcCount = l2.reduce((acc: number, p: any) => acc + (Array.isArray(p?.failureCauses) ? p.failureCauses.length : 0), 0);
  score += (fmCount + fcCount) * 2;

  const feCount = Array.isArray(legacy?.l1?.failureScopes) ? legacy.l1.failureScopes.length : 0;
  score += feCount * 2;

  return score;
}

// ✅ Prisma는 Node.js 런타임에서만 안정적으로 동작 (edge/browser 번들 방지)
export const runtime = 'nodejs';

// 트랜잭션 타임아웃 (30초)
const TRANSACTION_TIMEOUT = 30000;

/**
 * FMEA 데이터 저장 (배치 처리 최적화)
 */
export async function POST(request: NextRequest) {
  try {
    const baseUrl = getBaseDatabaseUrl();
    if (!baseUrl) {
      console.warn('[API] Prisma 미활성(null), 저장 스킵 (localStorage 폴백 사용)');
      return NextResponse.json(
        { 
          success: false,
          message: 'DATABASE_URL not configured, using localStorage fallback', 
          fmeaId: null,
          fallback: true 
        },
        { status: 200 }
      );
    }

    const requestBody = await request.json();
    const db: FMEAWorksheetDB = requestBody;
    const legacyData = requestBody.legacyData; // ✅ 레거시 데이터 (Single Source of Truth)
    const forceOverwrite = Boolean(requestBody.forceOverwrite); // ✅ 서버 가드 우회 (디버깅/관리자용)
    
    console.log(`[API] FMEA 저장 시작: ID=${db.fmeaId}, 스키마 타겟팅 준비`);
    console.log(`[API] 📊 전송받은 데이터:`, {
      fmeaId: db.fmeaId,
      hasL1Structure: !!db.l1Structure,
      l1StructureName: db.l1Structure?.name,
      l2StructuresCount: db.l2Structures?.length || 0,
      l3StructuresCount: db.l3Structures?.length || 0,
      l1FunctionsCount: db.l1Functions?.length || 0,
      l2FunctionsCount: db.l2Functions?.length || 0,
      l3FunctionsCount: db.l3Functions?.length || 0,
      // ★★★ 고장 데이터 개수 로깅 ★★★
      failureEffectsCount: db.failureEffects?.length || 0,
      failureModesCount: db.failureModes?.length || 0,
      failureCausesCount: db.failureCauses?.length || 0,
      failureLinksCount: db.failureLinks?.length || 0,
      hasLegacyData: !!legacyData,
      legacyL1Name: legacyData?.l1?.name,
      legacyL2Count: legacyData?.l2?.length || 0,
    });
    
    // ★★★ 고장 데이터 상세 로깅 ★★★
    if (db.failureModes?.length > 0) {
      console.log('[API] 📋 FM 샘플:', db.failureModes.slice(0, 2).map(fm => ({
        id: fm.id,
        mode: fm.mode?.substring(0, 20),
        l2FuncId: fm.l2FuncId,
        l2StructId: fm.l2StructId,
      })));
    }
    if (db.failureCauses?.length > 0) {
      console.log('[API] 📋 FC 샘플:', db.failureCauses.slice(0, 2).map(fc => ({
        id: fc.id,
        cause: fc.cause?.substring(0, 20),
        l3FuncId: fc.l3FuncId,
        l3StructId: fc.l3StructId,
      })));
    }
    if (db.failureEffects?.length > 0) {
      console.log('[API] 📋 FE 샘플:', db.failureEffects.slice(0, 2).map(fe => ({
        id: fe.id,
        effect: fe.effect?.substring(0, 20),
        l1FuncId: fe.l1FuncId,
      })));
    }
    
    // ✅ FMEA ID는 항상 대문자로 정규화 (DB 일관성 보장)
    if (db.fmeaId) {
      db.fmeaId = db.fmeaId.toUpperCase();
    }
    
    if (!db.fmeaId) {
      console.error('[API] FMEA ID가 없습니다.');
      return NextResponse.json(
        { error: 'FMEA ID is required' },
        { status: 400 }
      );
    }

    // ✅ 프로젝트별 DB(스키마) 규칙: fmeaId 기준으로 스키마 자동 생성/초기화 후 그 스키마에 저장
    const schema = getProjectSchemaName(db.fmeaId);
    console.log(`[API] 프로젝트 스키마: ${schema}`);
    await ensureProjectSchemaReady({ baseDatabaseUrl: baseUrl, schema });
    const prisma = getPrismaForSchema(schema);
    if (!prisma) {
      console.warn('[API] Prisma 미활성(null), 저장 스킵 (localStorage 폴백 사용)');
      return NextResponse.json(
        { 
          success: false,
          message: 'DATABASE_URL not configured, using localStorage fallback', 
          fmeaId: null,
          fallback: true 
        },
        { status: 200 }
      );
    }

    // ✅ DB 연결 테스트 (스키마별 Prisma)
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (connError: any) {
      console.error('[API] DB 연결 실패:', connError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed',
          message: '데이터베이스 연결에 실패했습니다. localStorage로 폴백됩니다.',
          details: connError.message,
          fallback: true
        },
        { status: 200 }
      );
    }

    const incomingLegacyScore = legacyData ? computeLegacyCompletenessScore(legacyData) : 0;

    // ✅ 서버-사이드 보호 가드:
    // - 기존 레거시 데이터가 충분히 풍부한데, 들어온 legacyData가 빈/저품질이면 덮어쓰기 차단
    // - 자동저장 타이밍 이슈로 “빈 상태 저장”이 발생해도 DB가 망가지지 않도록 보호
    if (!forceOverwrite && legacyData) {
      try {
        const existing = await prisma.fmeaLegacyData.findUnique({ where: { fmeaId: db.fmeaId } });
        if (existing?.data) {
          const incomingScore = computeLegacyCompletenessScore(legacyData);
          const existingScore = computeLegacyCompletenessScore(existing.data);
          const incomingL2Count = Array.isArray((legacyData as any)?.l2) ? (legacyData as any).l2.length : 0;
          const existingL2Count = Array.isArray((existing.data as any)?.l2) ? (existing.data as any).l2.length : 0;

          const looksLikeWipe =
            (incomingScore === 0 && existingScore >= 50) ||
            (incomingL2Count === 0 && existingL2Count > 0) ||
            (incomingScore < existingScore && incomingScore <= 20);

          if (looksLikeWipe) {
            console.warn('[API] 🛡️ 덮어쓰기 차단: 기존 레거시가 더 풍부함', {
              fmeaId: db.fmeaId,
              incomingScore,
              existingScore,
              incomingL2Count,
              existingL2Count,
            });
            // 200으로 반환하여 클라이언트가 에러로 간주하지 않게 하고, 기존 DB 데이터 보존
            return NextResponse.json(
              {
                success: true,
                preventedOverwrite: true,
                message: 'Prevented overwriting existing legacy data with an empty/low-quality payload.',
                incomingScore,
                existingScore,
              },
              { status: 200 }
            );
          }
        }
      } catch (e: any) {
        // 테이블 없거나 접근 실패 시 가드 스킵 (하위 호환)
        if (e?.code !== 'P2021') {
          console.warn('[API] 레거시 덮어쓰기 가드 오류(무시):', e.message);
        }
      }
    }

    // 트랜잭션으로 모든 데이터 저장 (배치 처리)
    await prisma.$transaction(async (tx: any) => {
      // ✅ 강력한 스키마 강제: 트랜잭션 시작 시 search_path 명시적 설정
      console.log(`[API] 트랜잭션 시작: SET search_path TO ${schema}, public`);
      await tx.$executeRawUnsafe(`SET search_path TO ${schema}, public`);

      // ✅ 표준화: 원자성 DB는 "현재 payload"와 정확히 일치해야 함
      if (legacyData && incomingLegacyScore > 0) {
        console.log(`[API] 원자성 DB 초기화: ${schema}.l1_structures 삭제 중...`);
        await tx.l1Structure.deleteMany({ where: { fmeaId: db.fmeaId } });
      }

      // 1. L1Structure 저장
      if (db.l1Structure) {
        console.log(`[API] L1Structure 저장: ${db.l1Structure.name}`);
        await tx.l1Structure.create({
          data: {
            id: db.l1Structure.id,
            fmeaId: db.fmeaId,
            name: db.l1Structure.name,
            confirmed: db.l1Structure.confirmed ?? false,
          },
        });
      }

      // 2. L2Structures 배치 저장
      if (db.l2Structures.length > 0) {
        console.log(`[API] L2Structures 저장: ${db.l2Structures.length}개`);
        await tx.l2Structure.createMany({
          data: db.l2Structures.map(l2 => ({
            id: l2.id,
            fmeaId: db.fmeaId,
            l1Id: l2.l1Id,
            no: l2.no,
            name: l2.name,
            order: l2.order,
          })),
          skipDuplicates: true,
        });
      }

      // 3. L3Structures 배치 저장
      if (db.l3Structures.length > 0) {
        await tx.l3Structure.createMany({
          data: db.l3Structures.map(l3 => ({
            id: l3.id,
            fmeaId: db.fmeaId,
            l1Id: l3.l1Id,
            l2Id: l3.l2Id,
            m4: l3.m4 || null,
            name: l3.name,
            order: l3.order,
          })),
          skipDuplicates: true,
        });
      }

      // 4. L1Functions 배치 저장
      if (db.l1Functions.length > 0) {
        await tx.l1Function.createMany({
          data: db.l1Functions.map(f => ({
            id: f.id,
            fmeaId: db.fmeaId,
            l1StructId: f.l1StructId,
            category: f.category,
            functionName: f.functionName,
            requirement: f.requirement,
          })),
          skipDuplicates: true,
        });
      }

      // 5. L2Functions 배치 저장
      if (db.l2Functions.length > 0) {
        await tx.l2Function.createMany({
          data: db.l2Functions.map(f => ({
            id: f.id,
            fmeaId: db.fmeaId,
            l2StructId: f.l2StructId,
            functionName: f.functionName,
            productChar: f.productChar,
            specialChar: f.specialChar || null,
          })),
          skipDuplicates: true,
        });
      }

      // 6. L3Functions 배치 저장
      if (db.l3Functions.length > 0) {
        await tx.l3Function.createMany({
          data: db.l3Functions.map(f => ({
            id: f.id,
            fmeaId: db.fmeaId,
            l3StructId: f.l3StructId,
            l2StructId: f.l2StructId,
            functionName: f.functionName,
            processChar: f.processChar,
            specialChar: f.specialChar || null,
          })),
          skipDuplicates: true,
        });
      }

      // 7. FailureEffects 배치 저장 - ★★★ FK 검증 후 저장 ★★★
      if (db.failureEffects.length > 0) {
        const l1FuncIdSet = new Set(db.l1Functions.map(f => f.id));
        
        const validFEs = db.failureEffects.filter(fe => 
          !!fe.l1FuncId && l1FuncIdSet.has(fe.l1FuncId)
        );
        
        if (validFEs.length !== db.failureEffects.length) {
          console.warn('[API] ⚠️ FailureEffects FK 불일치 제외:', {
            total: db.failureEffects.length,
            valid: validFEs.length,
            dropped: db.failureEffects.length - validFEs.length,
          });
        }
        
        if (validFEs.length > 0) {
          await tx.failureEffect.createMany({
            data: validFEs.map(fe => ({
              id: fe.id,
              fmeaId: db.fmeaId,
              l1FuncId: fe.l1FuncId,
              category: fe.category,
              effect: fe.effect,
              severity: fe.severity,
              // ★★★ 하이브리드 ID 시스템 필드 ★★★
              parentId: fe.parentId || null,
              mergeGroupId: fe.mergeGroupId || null,
              rowSpan: fe.rowSpan || 1,
              colSpan: fe.colSpan || 1,
            })),
            skipDuplicates: true,
          });
          console.log(`[API] ✅ FailureEffects 저장: ${validFEs.length}개`);
        }
      }

      // 8. FailureModes 배치 저장 - ★★★ FK 검증 후 저장 ★★★
      if (db.failureModes.length > 0) {
        const l2FuncIdSet = new Set(db.l2Functions.map(f => f.id));
        const l2StructIdSet = new Set(db.l2Structures.map(s => s.id));
        
        const validFMs = db.failureModes.filter(fm => 
          !!fm.l2FuncId && !!fm.l2StructId &&
          l2FuncIdSet.has(fm.l2FuncId) &&
          l2StructIdSet.has(fm.l2StructId)
        );
        
        if (validFMs.length !== db.failureModes.length) {
          console.warn('[API] ⚠️ FailureModes FK 불일치 제외:', {
            total: db.failureModes.length,
            valid: validFMs.length,
            dropped: db.failureModes.length - validFMs.length,
          });
        }
        
        if (validFMs.length > 0) {
          await tx.failureMode.createMany({
            data: validFMs.map(fm => ({
              id: fm.id,
              fmeaId: db.fmeaId,
              l2FuncId: fm.l2FuncId,
              l2StructId: fm.l2StructId,
              productCharId: fm.productCharId || null,
              mode: fm.mode,
              specialChar: fm.specialChar ?? false,
              // ★★★ 하이브리드 ID 시스템 필드 ★★★
              parentId: fm.parentId || null,
              mergeGroupId: fm.mergeGroupId || null,
              rowSpan: fm.rowSpan || 1,
              colSpan: fm.colSpan || 1,
            })),
            skipDuplicates: true,
          });
          console.log(`[API] ✅ FailureModes 저장: ${validFMs.length}개`);
        }
      }

      // 9. FailureCauses 배치 저장 - ★★★ FK 검증 후 저장 ★★★
      if (db.failureCauses.length > 0) {
        const l3FuncIdSet = new Set(db.l3Functions.map(f => f.id));
        const l3StructIdSet = new Set(db.l3Structures.map(s => s.id));
        
        const validFCs = db.failureCauses.filter(fc => 
          !!fc.l3FuncId && !!fc.l3StructId &&
          l3FuncIdSet.has(fc.l3FuncId) &&
          l3StructIdSet.has(fc.l3StructId)
        );
        
        if (validFCs.length !== db.failureCauses.length) {
          console.warn('[API] ⚠️ FailureCauses FK 불일치 제외:', {
            total: db.failureCauses.length,
            valid: validFCs.length,
            dropped: db.failureCauses.length - validFCs.length,
          });
        }
        
        if (validFCs.length > 0) {
          await tx.failureCause.createMany({
            data: validFCs.map(fc => ({
              id: fc.id,
              fmeaId: db.fmeaId,
              l3FuncId: fc.l3FuncId,
              l3StructId: fc.l3StructId,
              l2StructId: fc.l2StructId,
              processCharId: fc.processCharId || null,
              cause: fc.cause,
              occurrence: fc.occurrence || null,
              // ★★★ 하이브리드 ID 시스템 필드 ★★★
              parentId: fc.parentId || null,
              mergeGroupId: fc.mergeGroupId || null,
              rowSpan: fc.rowSpan || 1,
              colSpan: fc.colSpan || 1,
            })),
            skipDuplicates: true,
          });
          console.log(`[API] ✅ FailureCauses 저장: ${validFCs.length}개`);
        }
      }

      // 10. FailureLinks 저장 (기존 링크 삭제 후 재생성)
      if (db.failureLinks.length > 0) {
        // ✅ 강력한 원자성 보장:
        // - failure_links는 fmId/feId/fcId 모두 유효 FK여야만 저장 가능
        // - UI 편집 중(부분 연결) 또는 id 불일치가 섞이면 FK(P2003)로 전체 트랜잭션 롤백 → 새로고침 시 "사라짐" 발생
        // - 해결: atomic 테이블에 실제로 생성된 id 집합으로 필터링하여 "완전한 링크만" 저장
        const fmIdSet = new Set(db.failureModes.map(fm => fm.id));
        const feIdSet = new Set(db.failureEffects.map(fe => fe.id));
        const fcIdSet = new Set(db.failureCauses.map(fc => fc.id));

        const validLinks = db.failureLinks.filter(link =>
          !!link.fmId && !!link.feId && !!link.fcId &&
          fmIdSet.has(link.fmId) &&
          feIdSet.has(link.feId) &&
          fcIdSet.has(link.fcId)
        );

        const dropped = db.failureLinks.length - validLinks.length;
        if (dropped > 0) {
          console.warn('[API] ⚠️ failureLinks 중 FK 불일치/부분 연결 제외:', {
            fmeaId: db.fmeaId,
            total: db.failureLinks.length,
            valid: validLinks.length,
            dropped,
            sampleDropped: db.failureLinks
              .filter(l => !validLinks.includes(l))
              .slice(0, 3)
              .map(l => ({ fmId: l.fmId, feId: l.feId, fcId: l.fcId })),
          });
        }

        await tx.failureLink.createMany({
          data: validLinks.map(link => ({
            id: link.id,
            fmeaId: db.fmeaId,
            fmId: link.fmId,
            feId: link.feId,
            fcId: link.fcId,
            // ★★★ 하이브리드 ID 시스템 필드 ★★★
            fmSeq: link.fmSeq || null,
            feSeq: link.feSeq || null,
            fcSeq: link.fcSeq || null,
            fmPath: link.fmPath || null,
            fePath: link.fePath || null,
            fcPath: link.fcPath || null,
            parentId: link.parentId || null,
            mergeGroupId: link.mergeGroupId || null,
            rowSpan: link.rowSpan || 1,
            colSpan: link.colSpan || 1,
          })),
          skipDuplicates: true,
        });
      }

      // 11. FailureAnalyses 저장 (고장분석 통합 데이터 - All 화면 렌더링용)
      // 고장연결 확정 시 자동 생성된 고장분석 통합 데이터 저장
      if (db.failureAnalyses && db.failureAnalyses.length > 0) {
        // 기존 고장분석 데이터 삭제 (고장연결 재확정 시 재생성)
        await tx.failureAnalysis.deleteMany({ where: { fmeaId: db.fmeaId } });
        
        await tx.failureAnalysis.createMany({
          data: db.failureAnalyses.map(fa => ({
            id: fa.id,
            fmeaId: db.fmeaId,
            linkId: fa.linkId,
            
            // 고장연결 정보
            fmId: fa.fmId,
            fmText: fa.fmText,
            fmProcessName: fa.fmProcessName,
            
            feId: fa.feId,
            feText: fa.feText,
            feCategory: fa.feCategory,
            feSeverity: fa.feSeverity,
            
            fcId: fa.fcId,
            fcText: fa.fcText,
            fcOccurrence: fa.fcOccurrence || null,
            fcWorkElementName: fa.fcWorkElementName,
            fcM4: fa.fcM4 || null,
            
            // 역전개 기능분석 정보
            l1FuncId: fa.l1FuncId,
            l1Category: fa.l1Category,
            l1FuncName: fa.l1FuncName,
            l1Requirement: fa.l1Requirement,
            
            l2FuncId: fa.l2FuncId,
            l2FuncName: fa.l2FuncName,
            l2ProductChar: fa.l2ProductChar,
            l2SpecialChar: fa.l2SpecialChar || null,
            
            l3FuncId: fa.l3FuncId,
            l3FuncName: fa.l3FuncName,
            l3ProcessChar: fa.l3ProcessChar,
            l3SpecialChar: fa.l3SpecialChar || null,
            
            // 역전개 구조분석 정보
            l1StructId: fa.l1StructId,
            l1StructName: fa.l1StructName,
            
            l2StructId: fa.l2StructId,
            l2StructNo: fa.l2StructNo,
            l2StructName: fa.l2StructName,
            
            l3StructId: fa.l3StructId,
            l3StructM4: fa.l3StructM4 || null,
            l3StructName: fa.l3StructName,
            
            // 메타데이터
            order: fa.order || 0,
            confirmed: fa.confirmed || false,
          })),
          skipDuplicates: true,
        });
        
        console.log(`[API] ✅ FailureAnalyses 저장 완료: ${db.failureAnalyses.length}개`);
      } else {
        // 고장연결이 확정되지 않았거나 없으면 기존 데이터 삭제
        await tx.failureAnalysis.deleteMany({ where: { fmeaId: db.fmeaId } });
      }

      // 12. RiskAnalyses 배치 저장
      if (db.riskAnalyses.length > 0) {
        await Promise.all(
          db.riskAnalyses.map(risk =>
            tx.riskAnalysis.upsert({
              where: { id: risk.id },
              create: {
                id: risk.id,
                fmeaId: db.fmeaId,
                linkId: risk.linkId,
                severity: risk.severity,
                occurrence: risk.occurrence,
                detection: risk.detection,
                ap: risk.ap,
                preventionControl: risk.preventionControl || null,
                detectionControl: risk.detectionControl || null,
              },
              update: {
                linkId: risk.linkId,
                severity: risk.severity,
                occurrence: risk.occurrence,
                detection: risk.detection,
                ap: risk.ap,
                preventionControl: risk.preventionControl || null,
                detectionControl: risk.detectionControl || null,
              },
            })
          )
        );
      }

      // 13. Optimizations 배치 저장
      if (db.optimizations.length > 0) {
        await Promise.all(
          db.optimizations.map(opt =>
            tx.optimization.upsert({
              where: { id: opt.id },
              create: {
                id: opt.id,
                fmeaId: db.fmeaId,
                riskId: opt.riskId,
                recommendedAction: opt.recommendedAction,
                responsible: opt.responsible,
                targetDate: opt.targetDate,
                newSeverity: opt.newSeverity || null,
                newOccurrence: opt.newOccurrence || null,
                newDetection: opt.newDetection || null,
                newAP: opt.newAP || null,
                status: opt.status,
                completedDate: opt.completedDate || null,
              },
              update: {
                riskId: opt.riskId,
                recommendedAction: opt.recommendedAction,
                responsible: opt.responsible,
                targetDate: opt.targetDate,
                newSeverity: opt.newSeverity || null,
                newOccurrence: opt.newOccurrence || null,
                newDetection: opt.newDetection || null,
                newAP: opt.newAP || null,
                status: opt.status,
                completedDate: opt.completedDate || null,
              },
            })
          )
        );
      }

      // ✅ PFMEA Master 자동 업데이트 (프로젝트 신규 데이터 추출 → 마스터 누적)
      // 마스터 DB는 공용(public)으로 유지 (프로젝트별 DB와 분리)
      const publicPrisma = getPrisma();
      if (publicPrisma) {
        await publicPrisma.$transaction(async (pubTx: any) => {
          await upsertActiveMasterFromWorksheetTx(pubTx, db);
        });
      }

      // 13. FmeaConfirmedState 저장 (확정 상태)
      if (db.confirmed) {
        try {
          await tx.fmeaConfirmedState.upsert({
            where: { fmeaId: db.fmeaId },
            create: {
              fmeaId: db.fmeaId,
              structureConfirmed: db.confirmed.structure || false,
              l1FunctionConfirmed: db.confirmed.l1Function || false,
              l2FunctionConfirmed: db.confirmed.l2Function || false,
              l3FunctionConfirmed: db.confirmed.l3Function || false,
              failureL1Confirmed: db.confirmed.l1Failure || false,
              failureL2Confirmed: db.confirmed.l2Failure || false,
              failureL3Confirmed: db.confirmed.l3Failure || false,
              failureLinkConfirmed: db.confirmed.failureLink || false,
              riskConfirmed: db.confirmed.risk || false,
              optimizationConfirmed: db.confirmed.optimization || false,
            },
            update: {
              structureConfirmed: db.confirmed.structure || false,
              l1FunctionConfirmed: db.confirmed.l1Function || false,
              l2FunctionConfirmed: db.confirmed.l2Function || false,
              l3FunctionConfirmed: db.confirmed.l3Function || false,
              failureL1Confirmed: db.confirmed.l1Failure || false,
              failureL2Confirmed: db.confirmed.l2Failure || false,
              failureL3Confirmed: db.confirmed.l3Failure || false,
              failureLinkConfirmed: db.confirmed.failureLink || false,
              riskConfirmed: db.confirmed.risk || false,
              optimizationConfirmed: db.confirmed.optimization || false,
            },
          });
          console.log('[API] ✅ fmeaConfirmedState 저장:', db.confirmed);
        } catch (e: any) {
          // 테이블이 없으면 스킵 (마이그레이션 전)
          if (e?.code !== 'P2021') {
            console.warn('[API] 확정 상태 저장 오류 (무시):', e.message);
          }
        }
        
      }
      
      // ✅ FmeaInfo 테이블의 structureConfirmed 업데이트 (직접 pg Pool 사용 - Prisma 트랜잭션 외부)
      // Prisma 트랜잭션이 public 스키마를 사용하므로, 프로젝트 스키마 업데이트는 별도 연결 필요
      if (db.confirmed) {
        try {
          const pool = new Pool({ connectionString: baseUrl });
          await pool.query(`
            UPDATE "${schema}"."FmeaInfo" 
            SET "structureConfirmed" = $1, "updatedAt" = NOW()
            WHERE "fmeaId" = $2
          `, [db.confirmed.structure || false, db.fmeaId]);
          await pool.end();
          console.log('[API] ✅ FmeaInfo.structureConfirmed 업데이트 (직접 Pool):', db.confirmed.structure, '스키마:', schema);
        } catch (e: any) {
          console.warn('[API] FmeaInfo 업데이트 오류:', e.message);
        }
      }
      
      // ★★★ 14. FmeaLegacyData 저장 (Single Source of Truth) ★★★
      // 레거시 데이터를 JSON으로 직접 저장하여 원자성 DB ↔ 레거시 변환 문제 방지
      // ✅ 기존 등록정보(fmeaInfo, project, cftMembers)는 유지하고 워크시트 데이터만 업데이트
      if (legacyData) {
        try {
          // 기존 데이터 조회 (등록정보 보존용)
          const existingLegacy = await tx.fmeaLegacyData.findUnique({
            where: { fmeaId: db.fmeaId }
          }).catch(() => null);
          
          // 기존 등록정보 보존 (있으면 유지, 없으면 새 데이터 사용)
          const existingData = existingLegacy?.data as any || {};
          const mergedLegacyData = {
            ...legacyData,  // 워크시트 데이터 (l1, l2, failureLinks 등)
            // ✅ 기존 등록정보 보존 (워크시트 저장 시 덮어쓰지 않음)
            fmeaInfo: legacyData.fmeaInfo || existingData.fmeaInfo,
            project: legacyData.project || existingData.project,
            cftMembers: legacyData.cftMembers || existingData.cftMembers,
            fmeaType: legacyData.fmeaType || existingData.fmeaType,
            parentFmeaId: legacyData.parentFmeaId || existingData.parentFmeaId,
            parentFmeaType: legacyData.parentFmeaType || existingData.parentFmeaType,
          };
          
          await tx.fmeaLegacyData.upsert({
            where: { fmeaId: db.fmeaId },
            create: {
              fmeaId: db.fmeaId,
              data: mergedLegacyData,
              version: LEGACY_DATA_VERSION,
            },
            update: {
              data: mergedLegacyData,
              version: LEGACY_DATA_VERSION,
            },
          });
          console.log('[API] ✅ 레거시 데이터 DB 저장 완료 (등록정보 보존됨)');
        } catch (e: any) {
          // 테이블이 없으면 스킵 (마이그레이션 전)
          if (e?.code !== 'P2021') {
            console.warn('[API] 레거시 데이터 저장 오류 (무시):', e.message);
          }
        }
      }
    }, {
      timeout: TRANSACTION_TIMEOUT,
    });

    return NextResponse.json({
      success: true,
      message: 'FMEA data saved successfully',
      fmeaId: db.fmeaId,
      savedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] FMEA 저장 오류:', error);
    
    // 연결 에러인 경우 localStorage 폴백 가능하도록 200 반환
    const isConnectionError = 
      error.code === 'P1001' || // Connection timeout
      error.code === 'P1002' || // Database server connection timeout
      error.code === 'P1003' || // Database does not exist
      error.code === 'P1017' || // Server has closed the connection
      error.message?.includes('connect') ||
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNREFUSED');
    
    if (isConnectionError) {
      console.warn('[API] DB 연결 에러 - localStorage 폴백 가능:', error.message);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection error',
          message: '데이터베이스 연결 오류가 발생했습니다. localStorage로 폴백됩니다.',
          code: error.code,
          details: error.message,
          fallback: true
        },
        { status: 200 } // 200으로 반환하여 클라이언트가 localStorage로 폴백할 수 있도록
      );
    }
    
    // Prisma 에러 상세 정보
    if (error.code) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save FMEA data',
          code: error.code,
          details: error.meta || error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save FMEA data', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * FMEA 데이터 로드
 * 
 * ★★★ 근본적인 해결책: 레거시 데이터 우선 로드 ★★★
 * 1. FmeaLegacyData 테이블에서 레거시 데이터 로드 (Single Source of Truth)
 * 2. 레거시 데이터가 있으면 그것을 직접 사용 (역변환 과정 없음!)
 * 3. 레거시 데이터가 없으면 원자성 DB에서 역변환 (하위 호환성)
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = getBaseDatabaseUrl();
    if (!baseUrl) {
      console.warn('[API] Prisma 미활성(null), null 반환 (localStorage 폴백 사용)');
      return NextResponse.json(null);
    }

    const searchParams = request.nextUrl.searchParams;
    // ✅ FMEA ID는 항상 대문자로 정규화 (DB 일관성 보장)
    const fmeaId = searchParams.get('fmeaId')?.toUpperCase();
    const format = searchParams.get('format'); // 'atomic' | undefined

    if (!fmeaId) {
      return NextResponse.json(
        { error: 'fmeaId parameter is required' },
        { status: 400 }
      );
    }

    // ✅ format=atomic이면 legacy 우선 로드를 스킵하고 원자성 DB를 그대로 반환
    // (복구/검증/타 모듈 연동을 위해 raw atomic이 필요할 때 사용)
    const forceAtomic = format === 'atomic';

    // ✅ 프로젝트별 DB(스키마) 규칙 적용
    const schema = getProjectSchemaName(fmeaId);
    await ensureProjectSchemaReady({ baseDatabaseUrl: baseUrl, schema });
    const prisma = getPrismaForSchema(schema);
    if (!prisma) {
      console.warn('[API] Prisma 미활성(null), null 반환 (localStorage 폴백 사용)');
      return NextResponse.json(null);
    }
    
    // ✅ 강력한 스키마 강제: 조회 전 search_path 설정
    await prisma.$executeRawUnsafe(`SET search_path TO ${schema}, public`);
    
    // ★★★ 1단계: 레거시 데이터 우선 로드 (Single Source of Truth) ★★★
    let legacyDataRecord: any = null;
    try {
      legacyDataRecord = await prisma.fmeaLegacyData.findUnique({
        where: { fmeaId }
      });
    } catch (e: any) {
      // 테이블이 없으면 스킵 (마이그레이션 전)
      if (e?.code !== 'P2021') {
        console.warn('[API] 레거시 데이터 로드 오류 (무시):', e.message);
      }
    }

    // ✅ 프로젝트 스키마에 레거시가 없으면 public(기존 저장소)에서 1회 마이그레이션
    if (!legacyDataRecord?.data) {
      const publicPrisma = getPrisma();
      const fromPublic = await publicPrisma?.fmeaLegacyData.findUnique({ where: { fmeaId } }).catch(() => null);
      if (fromPublic?.data) {
        await prisma.fmeaLegacyData.upsert({
          where: { fmeaId },
          create: { fmeaId, data: fromPublic.data, version: fromPublic.version || '1.0.0' },
          update: { data: fromPublic.data, version: fromPublic.version || '1.0.0' },
        });
        legacyDataRecord = await prisma.fmeaLegacyData.findUnique({ where: { fmeaId } }).catch(() => null);
      }
    }
    
    // ★★★ 레거시 데이터가 있으면 직접 반환 (역변환 과정 없음!) ★★★
    if (!forceAtomic && legacyDataRecord && legacyDataRecord.data) {
      console.log('[API] ✅ 레거시 데이터 DB에서 직접 로드 (Single Source of Truth)');
      
      // 확정 상태도 함께 로드
      const confirmedState = await prisma.fmeaConfirmedState.findUnique({
        where: { fmeaId }
      }).catch(() => null);
      
      // 레거시 데이터에 confirmed 상태 추가
      const legacyWithConfirmed = {
        ...legacyDataRecord.data,
        confirmed: {
          structure: confirmedState?.structureConfirmed ?? false,
          l1Function: confirmedState?.l1FunctionConfirmed ?? false,
          l2Function: confirmedState?.l2FunctionConfirmed ?? false,
          l3Function: confirmedState?.l3FunctionConfirmed ?? false,
          l1Failure: confirmedState?.failureL1Confirmed ?? false,
          l2Failure: confirmedState?.failureL2Confirmed ?? false,
          l3Failure: confirmedState?.failureL3Confirmed ?? false,
          failureLink: confirmedState?.failureLinkConfirmed ?? false,
          risk: confirmedState?.riskConfirmed ?? false,
          optimization: confirmedState?.optimizationConfirmed ?? false,
        },
        // 프론트엔드에서 레거시 데이터임을 알 수 있도록 플래그 추가
        _isLegacyDirect: true,
        _legacyVersion: legacyDataRecord.version,
        _loadedAt: new Date().toISOString(),
      };
      
      return NextResponse.json(legacyWithConfirmed);
    }
    
    if (forceAtomic) {
      console.log('[API] format=atomic 요청 - 원자성 DB를 그대로 반환');
    } else {
      console.log('[API] ⚠️ 레거시 데이터 없음, 원자성 DB에서 역변환 (하위 호환성)');
    }

    // 모든 데이터를 병렬로 조회 (하위 호환성)
    // ✅ failureAnalysis는 별도로 처리 (테이블이 없을 수 있음)
    let failureAnalyses: any[] = [];
    try {
      failureAnalyses = await prisma.failureAnalysis.findMany({ 
        where: { fmeaId }, 
        orderBy: { order: 'asc' } 
      });
    } catch (e: any) {
      // 테이블이 없거나 모델이 없으면 빈 배열 반환 (하위 호환성)
      if (e?.code === 'P2021' || e?.message?.includes('does not exist')) {
        console.warn('[API] failure_analyses 테이블 없음, 빈 배열 반환 (하위 호환성)');
      } else {
        console.warn('[API] failure_analyses 조회 오류:', e.message);
      }
    }
    
    const [
      l1Structure,
      l2Structures,
      l3Structures,
      l1Functions,
      l2Functions,
      l3Functions,
      failureEffects,
      failureModes,
      failureCauses,
      failureLinks,
      riskAnalyses,
      optimizations,
      confirmedState,
    ] = await Promise.all([
      prisma.l1Structure.findFirst({ where: { fmeaId } }),
      prisma.l2Structure.findMany({ where: { fmeaId }, orderBy: { order: 'asc' } }),
      prisma.l3Structure.findMany({ where: { fmeaId }, orderBy: { order: 'asc' } }),
      prisma.l1Function.findMany({ where: { fmeaId } }),
      prisma.l2Function.findMany({ where: { fmeaId } }),
      prisma.l3Function.findMany({ where: { fmeaId } }),
      prisma.failureEffect.findMany({ where: { fmeaId } }),
      prisma.failureMode.findMany({ where: { fmeaId } }),
      prisma.failureCause.findMany({ where: { fmeaId } }),
      prisma.failureLink.findMany({ where: { fmeaId } }),
      prisma.riskAnalysis.findMany({ where: { fmeaId } }),
      prisma.optimization.findMany({ where: { fmeaId } }),
      // 확정 상태 로드 (테이블 없으면 null 반환)
      prisma.fmeaConfirmedState.findUnique({ where: { fmeaId } }).catch(() => null),
    ]);

    // 데이터가 없으면 null 반환
    if (!l1Structure && l2Structures.length === 0) {
      return NextResponse.json(null);
    }

    // FMEAWorksheetDB 형식으로 변환
    const db: FMEAWorksheetDB = {
      fmeaId,
      savedAt: l1Structure?.updatedAt.toISOString() || new Date().toISOString(),
      l1Structure: l1Structure ? {
        id: l1Structure.id,
        fmeaId: l1Structure.fmeaId,
        name: l1Structure.name,
        confirmed: l1Structure.confirmed ?? false,
        createdAt: l1Structure.createdAt.toISOString(),
        updatedAt: l1Structure.updatedAt.toISOString(),
      } : null,
      l2Structures: l2Structures.map((l2: any) => ({
        id: l2.id,
        fmeaId: l2.fmeaId,
        l1Id: l2.l1Id,
        no: l2.no,
        name: l2.name,
        order: l2.order,
        createdAt: l2.createdAt.toISOString(),
        updatedAt: l2.updatedAt.toISOString(),
      })),
      l3Structures: l3Structures.map((l3: any) => ({
        id: l3.id,
        fmeaId: l3.fmeaId,
        l1Id: l3.l1Id,
        l2Id: l3.l2Id,
        m4: (l3.m4 as any) || '',
        name: l3.name,
        order: l3.order,
        createdAt: l3.createdAt.toISOString(),
        updatedAt: l3.updatedAt.toISOString(),
      })),
      l1Functions: l1Functions.map((f: any) => ({
        id: f.id,
        fmeaId: f.fmeaId,
        l1StructId: f.l1StructId,
        category: f.category as any,
        functionName: f.functionName,
        requirement: f.requirement,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      l2Functions: l2Functions.map((f: any) => ({
        id: f.id,
        fmeaId: f.fmeaId,
        l2StructId: f.l2StructId,
        functionName: f.functionName,
        productChar: f.productChar,
        specialChar: f.specialChar || undefined,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      l3Functions: l3Functions.map((f: any) => ({
        id: f.id,
        fmeaId: f.fmeaId,
        l3StructId: f.l3StructId,
        l2StructId: f.l2StructId,
        functionName: f.functionName,
        processChar: f.processChar,
        specialChar: f.specialChar || undefined,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      failureEffects: failureEffects.map((fe: any) => ({
        id: fe.id,
        fmeaId: fe.fmeaId,
        l1FuncId: fe.l1FuncId,
        category: fe.category as any,
        effect: fe.effect,
        severity: fe.severity,
        createdAt: fe.createdAt.toISOString(),
        updatedAt: fe.updatedAt.toISOString(),
      })),
      failureModes: failureModes.map((fm: any) => ({
        id: fm.id,
        fmeaId: fm.fmeaId,
        l2FuncId: fm.l2FuncId,
        l2StructId: fm.l2StructId,
        productCharId: fm.productCharId || undefined,
        mode: fm.mode,
        specialChar: fm.specialChar ?? false,
        createdAt: fm.createdAt.toISOString(),
        updatedAt: fm.updatedAt.toISOString(),
      })),
      failureCauses: failureCauses.map((fc: any) => ({
        id: fc.id,
        fmeaId: fc.fmeaId,
        l3FuncId: fc.l3FuncId,
        l3StructId: fc.l3StructId,
        l2StructId: fc.l2StructId,
        cause: fc.cause,
        occurrence: fc.occurrence || undefined,
        createdAt: fc.createdAt.toISOString(),
        updatedAt: fc.updatedAt.toISOString(),
      })),
      failureLinks: failureLinks.map((link: any) => ({
        id: link.id,
        fmeaId: link.fmeaId,
        fmId: link.fmId,
        feId: link.feId,
        fcId: link.fcId,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      })),
      // 고장분석 통합 데이터 (All 화면 렌더링용)
      failureAnalyses: (failureAnalyses || []).map((fa: any) => ({
        id: fa.id,
        fmeaId: fa.fmeaId,
        linkId: fa.linkId,
        // 고장연결 정보
        fmId: fa.fmId,
        fmText: fa.fmText,
        fmProcessName: fa.fmProcessName,
        feId: fa.feId,
        feText: fa.feText,
        feCategory: fa.feCategory,
        feSeverity: fa.feSeverity,
        fcId: fa.fcId,
        fcText: fa.fcText,
        fcOccurrence: fa.fcOccurrence || undefined,
        fcWorkElementName: fa.fcWorkElementName,
        fcM4: fa.fcM4 || undefined,
        // 역전개 기능분석
        l1FuncId: fa.l1FuncId,
        l1Category: fa.l1Category,
        l1FuncName: fa.l1FuncName,
        l1Requirement: fa.l1Requirement,
        l2FuncId: fa.l2FuncId,
        l2FuncName: fa.l2FuncName,
        l2ProductChar: fa.l2ProductChar,
        l2SpecialChar: fa.l2SpecialChar || undefined,
        l3FuncId: fa.l3FuncId,
        l3FuncName: fa.l3FuncName,
        l3ProcessChar: fa.l3ProcessChar,
        l3SpecialChar: fa.l3SpecialChar || undefined,
        // 역전개 구조분석
        l1StructId: fa.l1StructId,
        l1StructName: fa.l1StructName,
        l2StructId: fa.l2StructId,
        l2StructNo: fa.l2StructNo,
        l2StructName: fa.l2StructName,
        l3StructId: fa.l3StructId,
        l3StructM4: fa.l3StructM4 || undefined,
        l3StructName: fa.l3StructName,
        // 메타데이터
        order: fa.order,
        confirmed: fa.confirmed,
        createdAt: fa.createdAt.toISOString(),
        updatedAt: fa.updatedAt.toISOString(),
      })),
      riskAnalyses: riskAnalyses.map((risk: any) => ({
        id: risk.id,
        fmeaId: risk.fmeaId,
        linkId: risk.linkId,
        severity: risk.severity,
        occurrence: risk.occurrence,
        detection: risk.detection,
        ap: risk.ap as any,
        preventionControl: risk.preventionControl || undefined,
        detectionControl: risk.detectionControl || undefined,
        createdAt: risk.createdAt.toISOString(),
        updatedAt: risk.updatedAt.toISOString(),
      })),
      optimizations: optimizations.map((opt: any) => ({
        id: opt.id,
        fmeaId: opt.fmeaId,
        riskId: opt.riskId,
        recommendedAction: opt.recommendedAction,
        responsible: opt.responsible,
        targetDate: opt.targetDate,
        newSeverity: opt.newSeverity || undefined,
        newOccurrence: opt.newOccurrence || undefined,
        newDetection: opt.newDetection || undefined,
        newAP: opt.newAP as any || undefined,
        status: opt.status as any,
        completedDate: opt.completedDate || undefined,
        createdAt: opt.createdAt.toISOString(),
        updatedAt: opt.updatedAt.toISOString(),
      })),
      confirmed: {
        structure: confirmedState?.structureConfirmed ?? l1Structure?.confirmed ?? false,
        l1Function: confirmedState?.l1FunctionConfirmed ?? false,
        l2Function: confirmedState?.l2FunctionConfirmed ?? false,
        l3Function: confirmedState?.l3FunctionConfirmed ?? false,
        l1Failure: confirmedState?.failureL1Confirmed ?? false,
        l2Failure: confirmedState?.failureL2Confirmed ?? false,
        l3Failure: confirmedState?.failureL3Confirmed ?? false,
        failureLink: confirmedState?.failureLinkConfirmed ?? false,
        risk: confirmedState?.riskConfirmed ?? false,
        optimization: confirmedState?.optimizationConfirmed ?? false,
      },
    };

    return NextResponse.json(db);
  } catch (error: any) {
    console.error('[API] FMEA 로드 오류:', error);
    
    // Prisma 에러 상세 정보
    if (error.code) {
      return NextResponse.json(
        { 
          error: 'Failed to load FMEA data',
          code: error.code,
          details: error.meta || error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to load FMEA data', details: error.message },
      { status: 500 }
    );
  }
}
