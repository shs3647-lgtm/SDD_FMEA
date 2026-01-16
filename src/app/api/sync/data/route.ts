/**
 * @file api/sync/data/route.ts
 * @description 데이터 동기화 API (양방향)
 * @module sync/api
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// ============================================================================
// 타입 정의
// ============================================================================

type ConflictPolicy = 'ask' | 'fmea-wins' | 'cp-wins' | 'latest-wins' | 'skip';

interface DataSyncRequest {
  fmeaId: string;
  cpNo: string;
  fields?: string[];
  conflictPolicy?: ConflictPolicy;
  resolutions?: Array<{
    field: string;
    resolution: 'use-fmea' | 'use-cp' | 'skip';
  }>;
}

interface SyncConflict {
  field: string;
  fieldLabel: string;
  fmeaValue: string;
  cpValue: string;
  fmeaUpdatedAt?: Date;
  cpUpdatedAt?: Date;
}

// ============================================================================
// 필드 매핑 (L2Structure 스키마 기준)
// ============================================================================

const FIELD_MAPPINGS = [
  { fmeaField: 'no', cpField: 'processNo', label: '공정번호' },
  { fmeaField: 'name', cpField: 'processName', label: '공정명' },
];

// ============================================================================
// POST: 데이터 동기화
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body: DataSyncRequest = await req.json();
    const { fmeaId, cpNo, fields, conflictPolicy = 'ask', resolutions } = body;

    // 필수 파라미터 검증
    if (!fmeaId || !cpNo) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터 누락 (fmeaId, cpNo)' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'DB 연결 실패' },
        { status: 500 }
      );
    }

    // 1. FMEA 데이터 조회 (L2Structure)
    const l2Structures = await prisma.l2Structure.findMany({
      where: { fmeaId },
      include: {
        l3Structures: true,
      },
      orderBy: { order: 'asc' },
    });

    // 2. CP 데이터 조회
    const cp = await prisma.controlPlan.findUnique({
      where: { cpNo },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!l2Structures.length || !cp?.items?.length) {
      return NextResponse.json({
        success: false,
        error: 'FMEA 또는 CP 데이터가 없습니다',
      });
    }

    // 3. 충돌 감지
    const conflicts: SyncConflict[] = [];
    const fieldsToSync = fields || FIELD_MAPPINGS.map(m => m.cpField);

    // 공정번호로 매칭
    const l2ByNo = new Map(l2Structures.map(l2 => [l2.no, l2]));
    const cpItemsByNo = new Map(cp.items.map((item: any) => [item.processNo, item]));

    for (const [processNo, cpItem] of cpItemsByNo) {
      const l2 = l2ByNo.get(processNo);
      if (!l2) continue;

      for (const mapping of FIELD_MAPPINGS) {
        if (!fieldsToSync.includes(mapping.cpField)) continue;

        // FMEA 값 추출 (L2에서)
        const fmeaValue = (l2 as any)[mapping.fmeaField] || '';

        // CP 값 추출
        const cpValue = (cpItem as any)[mapping.cpField] || '';

        // 값이 다르면 충돌
        if (fmeaValue.trim() !== cpValue.trim()) {
          conflicts.push({
            field: mapping.cpField,
            fieldLabel: mapping.label,
            fmeaValue,
            cpValue,
            fmeaUpdatedAt: l2.updatedAt,
            cpUpdatedAt: (cpItem as any).updatedAt,
          });
        }
      }
    }

    // 4. 충돌 정책에 따라 처리
    if (conflicts.length > 0 && conflictPolicy === 'ask' && !resolutions) {
      // 충돌만 반환, 사용자 결정 대기
      return NextResponse.json({
        success: false,
        synced: 0,
        conflicts,
        skipped: 0,
        message: '충돌이 감지되었습니다. 해결 방법을 선택해주세요.',
      });
    }

    // 5. 동기화 실행
    let synced = 0;
    let skipped = 0;

    for (const conflict of conflicts) {
      // 해결 방법 결정
      let resolution: 'use-fmea' | 'use-cp' | 'skip';
      
      const userResolution = resolutions?.find(r => r.field === conflict.field);
      if (userResolution) {
        resolution = userResolution.resolution;
      } else if (conflictPolicy === 'fmea-wins') {
        resolution = 'use-fmea';
      } else if (conflictPolicy === 'cp-wins') {
        resolution = 'use-cp';
      } else if (conflictPolicy === 'latest-wins') {
        const fmeaTime = conflict.fmeaUpdatedAt?.getTime() || 0;
        const cpTime = conflict.cpUpdatedAt?.getTime() || 0;
        resolution = fmeaTime > cpTime ? 'use-fmea' : 'use-cp';
      } else {
        resolution = 'skip';
      }

      // 적용
      if (resolution === 'skip') {
        skipped++;
        continue;
      }

      const valueToUse = resolution === 'use-fmea' ? conflict.fmeaValue : conflict.cpValue;
      const mapping = FIELD_MAPPINGS.find(m => m.cpField === conflict.field);
      if (!mapping) continue;

      // CP 업데이트 (use-fmea인 경우)
      if (resolution === 'use-fmea') {
        for (const cpItem of cp.items) {
          if (cpItemsByNo.has((cpItem as any).processNo)) {
            await prisma.controlPlanItem.update({
              where: { id: (cpItem as any).id },
              data: { [mapping.cpField]: valueToUse },
            });
          }
        }
      }

      // FMEA 업데이트 (use-cp인 경우)
      if (resolution === 'use-cp') {
        for (const l2 of l2Structures) {
          if (l2ByNo.has(l2.no)) {
            // L2 업데이트
            await prisma.l2Structure.update({
              where: { id: l2.id },
              data: { [mapping.fmeaField]: valueToUse },
            });
          }
        }
      }

      synced++;
    }

    // 6. 동기화 로그 저장
    await prisma.syncLog.create({
      data: {
        sourceType: 'both',
        sourceId: fmeaId,
        targetType: 'both',
        targetId: cpNo,
        action: 'sync',
        status: skipped > 0 ? 'partial' : 'synced',
        fieldChanges: conflicts.length > 0 ? JSON.stringify(conflicts) : null,
        syncedAt: new Date(),
      },
    });

    console.log(`✅ 데이터 동기화 완료: ${synced}개 동기화, ${skipped}개 스킵`);

    return NextResponse.json({
      success: true,
      synced,
      conflicts: [],
      skipped,
    });

  } catch (error: any) {
    console.error('[API] 데이터 동기화 실패:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류' },
      { status: 500 }
    );
  }
}
