/**
 * @file api/sync/data/route.ts
 * @description 데이터 동기화 API (양방향)
 * @module sync/api
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBaseDatabaseUrl, getPrisma, getPrismaForSchema } from '@/lib/prisma';
import { ensureProjectSchemaReady, getProjectSchemaName } from '@/lib/project-schema';

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
  { cpField: 'processNo', label: '공정번호', syncDirection: 'bidirectional' },
  { cpField: 'processName', label: '공정명', syncDirection: 'bidirectional' },
  { cpField: 'processDesc', label: '공정설명', syncDirection: 'bidirectional' },
  { cpField: 'workElement', label: '작업요소', syncDirection: 'bidirectional' },
  { cpField: 'equipment', label: '설비/금형/지그', syncDirection: 'fmea-to-cp-readonly' },
  { cpField: 'productChar', label: '제품특성', syncDirection: 'fmea-to-cp-readonly' },
  { cpField: 'processChar', label: '공정특성', syncDirection: 'fmea-to-cp-readonly' },
  { cpField: 'specialChar', label: '특별특성', syncDirection: 'fmea-to-cp-readonly' },
];

type SyncDirection =
  | 'bidirectional'
  | 'fmea-to-cp-readonly';

const isCharacteristicField = (field: string) =>
  ['productChar', 'processChar', 'specialChar'].includes(field);

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

    const fmeaIdLower = fmeaId.toLowerCase();
    const baseUrl = getBaseDatabaseUrl();
    const schema = getProjectSchemaName(fmeaIdLower);
    let projectPrisma = prisma;

    if (baseUrl) {
      await ensureProjectSchemaReady({ baseDatabaseUrl: baseUrl, schema });
      projectPrisma = getPrismaForSchema(schema) || prisma;
    }

    // 1. FMEA 데이터 조회 (프로젝트 스키마, 원자성 기준)
    const l2Structures = await projectPrisma.l2Structure.findMany({
      where: { fmeaId: fmeaIdLower },
      include: {
        l3Structures: {
          include: {
            l3Functions: true,
          },
          orderBy: { order: 'asc' },
        },
        l2Functions: true,
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

    // 3. FMEA 값 집계
    const fmeaByProcessId = new Map<string, any>();
    const fmeaByProcessNo = new Map<string, any>();

    l2Structures.forEach((l2: any) => {
      const l3Structures = l2.l3Structures || [];
      const firstL3 = l3Structures[0];
      const equipmentL3s = l3Structures.filter((l3: any) =>
        l3.m4 && ['MC', 'IM', 'EN'].includes(l3.m4)
      );
      const equipmentNames = equipmentL3s.map((l3: any) => l3.name).filter(Boolean);

      const productChars = (l2.l2Functions || [])
        .filter((f: any) => f.productChar)
        .map((f: any) => ({
          name: f.productChar,
          specialChar: f.specialChar || '',
        }));

      const processChars: Array<{ name: string; specialChar: string }> = [];
      l3Structures.forEach((l3: any) => {
        (l3.l3Functions || []).forEach((fn: any) => {
          if (fn.processChar) {
            processChars.push({
              name: fn.processChar,
              specialChar: fn.specialChar || '',
            });
          }
        });
      });

      const fmeaEntry = {
        id: l2.id,
        processNo: l2.no || '',
        processName: l2.name || '',
        processDesc: firstL3?.name || '',
        workElement: firstL3?.name || '',
        equipment: equipmentNames.join(', '),
        productChars,
        processChars,
        l3Structures,
      };

      fmeaByProcessId.set(l2.id, fmeaEntry);
      if (fmeaEntry.processNo) {
        fmeaByProcessNo.set(fmeaEntry.processNo, fmeaEntry);
      }
    });

    // 4. 충돌 감지
    const conflicts: SyncConflict[] = [];
    const fieldsToSync = fields || FIELD_MAPPINGS.map(m => m.cpField);

    const conflictsByKey = new Set<string>();
    const cpItemsByProcessId = new Map<string, any[]>();
    const cpItemsByProcessNo = new Map<string, any[]>();

    cp.items.forEach((item: any) => {
      if (item.pfmeaProcessId) {
        if (!cpItemsByProcessId.has(item.pfmeaProcessId)) {
          cpItemsByProcessId.set(item.pfmeaProcessId, []);
        }
        cpItemsByProcessId.get(item.pfmeaProcessId)!.push(item);
      }
      if (item.processNo) {
        if (!cpItemsByProcessNo.has(item.processNo)) {
          cpItemsByProcessNo.set(item.processNo, []);
        }
        cpItemsByProcessNo.get(item.processNo)!.push(item);
      }
    });

    for (const cpItem of cp.items) {
      const fmeaEntry =
        (cpItem.pfmeaProcessId && fmeaByProcessId.get(cpItem.pfmeaProcessId)) ||
        (cpItem.processNo && fmeaByProcessNo.get(cpItem.processNo));

      if (!fmeaEntry) continue;

      const productCharMap = new Map(
        fmeaEntry.productChars.map((c: any) => [c.name, c])
      );
      const processCharMap = new Map(
        fmeaEntry.processChars.map((c: any) => [c.name, c])
      );

      for (const mapping of FIELD_MAPPINGS) {
        if (!fieldsToSync.includes(mapping.cpField)) continue;

        let fmeaValue = '';
        if (mapping.cpField === 'processNo') fmeaValue = fmeaEntry.processNo;
        if (mapping.cpField === 'processName') fmeaValue = fmeaEntry.processName;
        if (mapping.cpField === 'processDesc') fmeaValue = fmeaEntry.processDesc;
        if (mapping.cpField === 'workElement') fmeaValue = fmeaEntry.workElement;
        if (mapping.cpField === 'equipment') fmeaValue = fmeaEntry.equipment;
        if (mapping.cpField === 'productChar') {
          fmeaValue = productCharMap.has(cpItem.productChar || '')
            ? (cpItem.productChar || '')
            : '';
        }
        if (mapping.cpField === 'processChar') {
          fmeaValue = processCharMap.has(cpItem.processChar || '')
            ? (cpItem.processChar || '')
            : '';
        }
        if (mapping.cpField === 'specialChar') {
          if (cpItem.productChar) {
            fmeaValue = productCharMap.get(cpItem.productChar)?.specialChar || '';
          } else if (cpItem.processChar) {
            fmeaValue = processCharMap.get(cpItem.processChar)?.specialChar || '';
          } else {
            fmeaValue = '';
          }
        }

        const cpValue = (cpItem as any)[mapping.cpField] || '';
        const conflictKey = isCharacteristicField(mapping.cpField)
          ? `${cpItem.id}:${mapping.cpField}`
          : `${fmeaEntry.id}:${mapping.cpField}`;

        if (conflictsByKey.has(conflictKey)) continue;
        if (String(fmeaValue).trim() !== String(cpValue).trim()) {
          conflictsByKey.add(conflictKey);
          conflicts.push({
            field: conflictKey,
            fieldLabel: mapping.label,
            fmeaValue: String(fmeaValue || ''),
            cpValue: String(cpValue || ''),
            fmeaUpdatedAt: l2Structures.find((l2: any) => l2.id === fmeaEntry.id)?.updatedAt,
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
      const [rowKey, fieldName] = conflict.field.split(':');
      const mapping = FIELD_MAPPINGS.find(m => m.cpField === fieldName);
      if (!mapping) continue;

      // CP 업데이트 (use-fmea인 경우)
      if (resolution === 'use-fmea') {
        let targetItems: any[] = [];
        if (isCharacteristicField(mapping.cpField)) {
          targetItems = cp.items.filter((item: any) => item.id === rowKey);
        } else {
          targetItems = cpItemsByProcessId.get(rowKey) || [];
          if (!targetItems.length) {
            const fmeaEntry = fmeaByProcessId.get(rowKey);
            if (fmeaEntry?.processNo) {
              targetItems = cpItemsByProcessNo.get(fmeaEntry.processNo) || [];
            }
          }
        }

        for (const cpItem of targetItems) {
          await prisma.controlPlanItem.update({
            where: { id: (cpItem as any).id },
            data: { [mapping.cpField]: valueToUse },
          });
        }
      }

      // FMEA 업데이트 (use-cp인 경우)
      if (resolution === 'use-cp' && mapping.syncDirection === 'bidirectional') {
        const fmeaEntry = fmeaByProcessId.get(rowKey);
        if (!fmeaEntry) continue;

        if (mapping.cpField === 'processNo') {
          await projectPrisma.l2Structure.update({
            where: { id: fmeaEntry.id },
            data: { no: valueToUse },
          });
        }
        if (mapping.cpField === 'processName') {
          await projectPrisma.l2Structure.update({
            where: { id: fmeaEntry.id },
            data: { name: valueToUse },
          });
        }
        if (mapping.cpField === 'processDesc' || mapping.cpField === 'workElement') {
          const targetL3 = (fmeaEntry.l3Structures || [])[0];
          if (targetL3) {
            await projectPrisma.l3Structure.update({
              where: { id: targetL3.id },
              data: { name: valueToUse },
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
