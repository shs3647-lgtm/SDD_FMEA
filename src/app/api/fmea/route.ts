/**
 * @file route.ts
 * @description FMEA 데이터 저장/로드 API 라우트
 * 
 * POST /api/fmea - FMEA 데이터 저장
 * GET /api/fmea?fmeaId=xxx - FMEA 데이터 로드
 */

import { NextRequest, NextResponse } from 'next/server';
import type { FMEAWorksheetDB } from '@/app/pfmea/worksheet/schema';
import { getPrisma } from '@/lib/prisma';

// ✅ Prisma는 Node.js 런타임에서만 안정적으로 동작 (edge/browser 번들 방지)
export const runtime = 'nodejs';

// 트랜잭션 타임아웃 (30초)
const TRANSACTION_TIMEOUT = 30000;

/**
 * FMEA 데이터 저장 (배치 처리 최적화)
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    // ✅ Prisma 연결 확인
    if (!prisma) {
      console.warn('[API] Prisma 미활성(null), 저장 스킵 (localStorage 폴백 사용)');
      return NextResponse.json(
        { message: 'DATABASE_URL not configured, using localStorage fallback', fmeaId: null },
        { status: 200 }
      );
    }

    const db: FMEAWorksheetDB = await request.json();
    
    if (!db.fmeaId) {
      return NextResponse.json(
        { error: 'FMEA ID is required' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 모든 데이터 저장 (배치 처리)
    await prisma.$transaction(async (tx: any) => {
      // 1. L1Structure 저장
      if (db.l1Structure) {
        await tx.l1Structure.upsert({
          where: { id: db.l1Structure.id },
          create: {
            id: db.l1Structure.id,
            fmeaId: db.fmeaId,
            name: db.l1Structure.name,
            confirmed: db.l1Structure.confirmed ?? false,
          },
          update: {
            name: db.l1Structure.name,
            confirmed: db.l1Structure.confirmed ?? false,
          },
        });
      }

      // 2. L2Structures 배치 저장
      if (db.l2Structures.length > 0) {
        await Promise.all(
          db.l2Structures.map(l2 =>
            tx.l2Structure.upsert({
              where: { id: l2.id },
              create: {
                id: l2.id,
                fmeaId: db.fmeaId,
                l1Id: l2.l1Id,
                no: l2.no,
                name: l2.name,
                order: l2.order,
              },
              update: {
                l1Id: l2.l1Id,
                no: l2.no,
                name: l2.name,
                order: l2.order,
              },
            })
          )
        );
      }

      // 3. L3Structures 배치 저장
      if (db.l3Structures.length > 0) {
        await Promise.all(
          db.l3Structures.map(l3 =>
            tx.l3Structure.upsert({
              where: { id: l3.id },
              create: {
                id: l3.id,
                fmeaId: db.fmeaId,
                l1Id: l3.l1Id,
                l2Id: l3.l2Id,
                m4: l3.m4 || null,
                name: l3.name,
                order: l3.order,
              },
              update: {
                l1Id: l3.l1Id,
                l2Id: l3.l2Id,
                m4: l3.m4 || null,
                name: l3.name,
                order: l3.order,
              },
            })
          )
        );
      }

      // 4. L1Functions 배치 저장
      if (db.l1Functions.length > 0) {
        await Promise.all(
          db.l1Functions.map(l1Func =>
            tx.l1Function.upsert({
              where: { id: l1Func.id },
              create: {
                id: l1Func.id,
                fmeaId: db.fmeaId,
                l1StructId: l1Func.l1StructId,
                category: l1Func.category,
                functionName: l1Func.functionName,
                requirement: l1Func.requirement,
              },
              update: {
                l1StructId: l1Func.l1StructId,
                category: l1Func.category,
                functionName: l1Func.functionName,
                requirement: l1Func.requirement,
              },
            })
          )
        );
      }

      // 5. L2Functions 배치 저장
      if (db.l2Functions.length > 0) {
        await Promise.all(
          db.l2Functions.map(l2Func =>
            tx.l2Function.upsert({
              where: { id: l2Func.id },
              create: {
                id: l2Func.id,
                fmeaId: db.fmeaId,
                l2StructId: l2Func.l2StructId,
                functionName: l2Func.functionName,
                productChar: l2Func.productChar,
                specialChar: l2Func.specialChar || null,
              },
              update: {
                l2StructId: l2Func.l2StructId,
                functionName: l2Func.functionName,
                productChar: l2Func.productChar,
                specialChar: l2Func.specialChar || null,
              },
            })
          )
        );
      }

      // 6. L3Functions 배치 저장
      if (db.l3Functions.length > 0) {
        await Promise.all(
          db.l3Functions.map(l3Func =>
            tx.l3Function.upsert({
              where: { id: l3Func.id },
              create: {
                id: l3Func.id,
                fmeaId: db.fmeaId,
                l3StructId: l3Func.l3StructId,
                l2StructId: l3Func.l2StructId,
                functionName: l3Func.functionName,
                processChar: l3Func.processChar,
                specialChar: l3Func.specialChar || null,
              },
              update: {
                l3StructId: l3Func.l3StructId,
                l2StructId: l3Func.l2StructId,
                functionName: l3Func.functionName,
                processChar: l3Func.processChar,
                specialChar: l3Func.specialChar || null,
              },
            })
          )
        );
      }

      // 7. FailureEffects 배치 저장
      if (db.failureEffects.length > 0) {
        await Promise.all(
          db.failureEffects.map(fe =>
            tx.failureEffect.upsert({
              where: { id: fe.id },
              create: {
                id: fe.id,
                fmeaId: db.fmeaId,
                l1FuncId: fe.l1FuncId,
                category: fe.category,
                effect: fe.effect,
                severity: fe.severity,
              },
              update: {
                l1FuncId: fe.l1FuncId,
                category: fe.category,
                effect: fe.effect,
                severity: fe.severity,
              },
            })
          )
        );
      }

      // 8. FailureModes 배치 저장
      if (db.failureModes.length > 0) {
        await Promise.all(
          db.failureModes.map(fm =>
            tx.failureMode.upsert({
              where: { id: fm.id },
              create: {
                id: fm.id,
                fmeaId: db.fmeaId,
                l2FuncId: fm.l2FuncId,
                l2StructId: fm.l2StructId,
                productCharId: fm.productCharId || null,
                mode: fm.mode,
                specialChar: fm.specialChar ?? false,
              },
              update: {
                l2FuncId: fm.l2FuncId,
                l2StructId: fm.l2StructId,
                productCharId: fm.productCharId || null,
                mode: fm.mode,
                specialChar: fm.specialChar ?? false,
              },
            })
          )
        );
      }

      // 9. FailureCauses 배치 저장
      if (db.failureCauses.length > 0) {
        await Promise.all(
          db.failureCauses.map(fc =>
            tx.failureCause.upsert({
              where: { id: fc.id },
              create: {
                id: fc.id,
                fmeaId: db.fmeaId,
                l3FuncId: fc.l3FuncId,
                l3StructId: fc.l3StructId,
                l2StructId: fc.l2StructId,
                cause: fc.cause,
                occurrence: fc.occurrence || null,
              },
              update: {
                l3FuncId: fc.l3FuncId,
                l3StructId: fc.l3StructId,
                l2StructId: fc.l2StructId,
                cause: fc.cause,
                occurrence: fc.occurrence || null,
              },
            })
          )
        );
      }

      // 10. FailureLinks 저장 (기존 링크 삭제 후 재생성)
      await tx.failureLink.deleteMany({
        where: { fmeaId: db.fmeaId },
      });
      if (db.failureLinks.length > 0) {
        await tx.failureLink.createMany({
          data: db.failureLinks.map(link => ({
            id: link.id,
            fmeaId: db.fmeaId,
            fmId: link.fmId,
            feId: link.feId,
            fcId: link.fcId,
          })),
          skipDuplicates: true,
        });
      }

      // 11. RiskAnalyses 배치 저장
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

      // 12. Optimizations 배치 저장
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
    
    // Prisma 에러 상세 정보
    if (error.code) {
      return NextResponse.json(
        { 
          error: 'Failed to save FMEA data',
          code: error.code,
          details: error.meta || error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save FMEA data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * FMEA 데이터 로드
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    // ✅ Prisma 연결 확인
    if (!prisma) {
      console.warn('[API] Prisma 미활성(null), null 반환 (localStorage 폴백 사용)');
      return NextResponse.json(null);
    }

    const searchParams = request.nextUrl.searchParams;
    const fmeaId = searchParams.get('fmeaId');

    if (!fmeaId) {
      return NextResponse.json(
        { error: 'fmeaId parameter is required' },
        { status: 400 }
      );
    }

    // 모든 데이터를 병렬로 조회
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
        structure: l1Structure?.confirmed ?? false,
        l1Function: false, // TODO: 확정 상태를 별도 테이블에 저장
        l2Function: false,
        l3Function: false,
        l1Failure: false,
        l2Failure: false,
        l3Failure: false,
        failureLink: false,
        risk: false,
        optimization: false,
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
