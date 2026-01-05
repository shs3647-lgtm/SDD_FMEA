/**
 * @file route.ts
 * @description 전체화면(ALL) 데이터 API - 원자성 DB에서 JOIN으로 CASCADE 역전개
 * 
 * ★★★ 핵심 아키텍처 ★★★
 * 고장연결(FailureLink) 결과를 기반으로:
 * - FailureMode → L2Function → L2Structure (메인공정)
 * - FailureEffect → L1Function → L1Structure (완제품)
 * - FailureCause → L3Function → L3Structure (작업요소)
 * 
 * 이 API는 AI 분석 및 고장예측을 위한 기반 데이터를 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBaseDatabaseUrl, getPrismaForSchema } from '@/lib/prisma';
import { ensureProjectSchemaReady, getProjectSchemaName } from '@/lib/project-schema';

export const runtime = 'nodejs';

/**
 * 전체화면 데이터 구조 (CASCADE 역전개 결과)
 */
interface AllViewRow {
  // 구조분석
  l1StructName: string;      // 완제품 공정명
  l2StructNo: string;        // 공정번호
  l2StructName: string;      // 공정명
  l3M4: string;              // 4M
  l3Name: string;            // 작업요소
  
  // 기능분석
  l1FuncCategory: string;    // 범위 (Your Plant/Ship to Plant/User)
  l1FuncName: string;        // 완제품 기능
  l1Requirement: string;     // 요구사항
  l2FuncName: string;        // 메인공정 기능
  l2ProductChar: string;     // 제품특성
  l2SpecialChar: string;     // 특별특성 (2L)
  l3FuncName: string;        // 작업요소 기능
  l3ProcessChar: string;     // 공정특성
  l3SpecialChar: string;     // 특별특성 (3L)
  
  // 고장분석
  feEffect: string;          // 고장영향
  feSeverity: number;        // 심각도
  fmMode: string;            // 고장형태
  fcCause: string;           // 고장원인
  fcOccurrence: number | null; // 발생도
  
  // 리스크분석 (있는 경우)
  riskSeverity: number | null;
  riskOccurrence: number | null;
  riskDetection: number | null;
  riskAP: string | null;
  preventionControl: string | null;
  detectionControl: string | null;
  
  // 최적화 (있는 경우)
  optAction: string | null;
  optResponsible: string | null;
  optTargetDate: string | null;
  optStatus: string | null;
  optRemarks: string | null;
  
  // 메타데이터
  linkId: string;
  fmId: string;
  feId: string;
  fcId: string;
}

/**
 * 전체화면 데이터 조회 (원자성 DB에서 CASCADE JOIN)
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = getBaseDatabaseUrl();
    if (!baseUrl) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fmeaId = searchParams.get('fmeaId');

    if (!fmeaId) {
      return NextResponse.json({ error: 'fmeaId is required' }, { status: 400 });
    }

    // 프로젝트별 스키마 사용
    const schema = getProjectSchemaName(fmeaId);
    await ensureProjectSchemaReady({ baseDatabaseUrl: baseUrl, schema });
    const prisma = getPrismaForSchema(schema);
    
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`[ALL-VIEW API] 원자성 DB에서 CASCADE JOIN 시작: ${fmeaId}`);

    // ★★★ 원자성 DB에서 JOIN으로 전체 데이터 가져오기 ★★★
    const failureLinks = await prisma.failureLink.findMany({
      where: { fmeaId },
      include: {
        // FM → L2Function → L2Structure
        failureMode: {
          include: {
            l2Function: true,
            l2Structure: {
              include: {
                l1Structure: true, // L1Structure (완제품)
              }
            }
          }
        },
        // FE → L1Function
        failureEffect: {
          include: {
            l1Function: true,
          }
        },
        // FC → L3Function → L3Structure
        failureCause: {
          include: {
            l3Function: true,
            l3Structure: true,
          }
        },
        // RiskAnalysis → Optimization
        riskAnalyses: {
          include: {
            optimizations: true,
          }
        },
      },
      orderBy: [
        { failureMode: { l2Structure: { order: 'asc' } } }, // 공정 순서
      ]
    });

    console.log(`[ALL-VIEW API] FailureLinks 조회 완료: ${failureLinks.length}개`);

    // 데이터 변환
    const rows: AllViewRow[] = failureLinks.map(link => {
      const fm = link.failureMode;
      const fe = link.failureEffect;
      const fc = link.failureCause;
      const risk = link.riskAnalyses?.[0]; // 첫 번째 리스크분석
      const opt = risk?.optimizations?.[0]; // 첫 번째 최적화

      return {
        // 구조분석
        l1StructName: fm?.l2Structure?.l1Structure?.name || '',
        l2StructNo: fm?.l2Structure?.no || '',
        l2StructName: fm?.l2Structure?.name || '',
        l3M4: fc?.l3Structure?.m4 || '',
        l3Name: fc?.l3Structure?.name || '',
        
        // 기능분석
        l1FuncCategory: fe?.l1Function?.category || '',
        l1FuncName: fe?.l1Function?.functionName || '',
        l1Requirement: fe?.l1Function?.requirement || '',
        l2FuncName: fm?.l2Function?.functionName || '',
        l2ProductChar: fm?.l2Function?.productChar || '',
        l2SpecialChar: fm?.l2Function?.specialChar || '',
        l3FuncName: fc?.l3Function?.functionName || '',
        l3ProcessChar: fc?.l3Function?.processChar || '',
        l3SpecialChar: fc?.l3Function?.specialChar || '',
        
        // 고장분석
        feEffect: fe?.effect || '',
        feSeverity: fe?.severity || 0,
        fmMode: fm?.mode || '',
        fcCause: fc?.cause || '',
        fcOccurrence: fc?.occurrence || null,
        
        // 리스크분석
        riskSeverity: risk?.severity || null,
        riskOccurrence: risk?.occurrence || null,
        riskDetection: risk?.detection || null,
        riskAP: risk?.ap || null,
        preventionControl: risk?.preventionControl || null,
        detectionControl: risk?.detectionControl || null,
        
        // 최적화
        optAction: opt?.recommendedAction || null,
        optResponsible: opt?.responsible || null,
        optTargetDate: opt?.targetDate || null,
        optStatus: opt?.status || null,
        optRemarks: opt?.remarks || null,
        
        // 메타
        linkId: link.id,
        fmId: link.fmId,
        feId: link.feId,
        fcId: link.fcId,
      };
    });

    // 통계 정보
    const stats = {
      totalLinks: rows.length,
      processCount: new Set(rows.map(r => r.l2StructNo)).size,
      fmCount: new Set(rows.map(r => r.fmId)).size,
      feCount: new Set(rows.map(r => r.feId)).size,
      fcCount: new Set(rows.map(r => r.fcId)).size,
      withRisk: rows.filter(r => r.riskSeverity !== null).length,
      withOptimization: rows.filter(r => r.optAction !== null).length,
    };

    console.log(`[ALL-VIEW API] 변환 완료:`, stats);

    return NextResponse.json({
      success: true,
      fmeaId,
      rows,
      stats,
      loadedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[ALL-VIEW API] 오류:', error);
    return NextResponse.json(
      { error: 'Failed to load all-view data', details: error.message },
      { status: 500 }
    );
  }
}

