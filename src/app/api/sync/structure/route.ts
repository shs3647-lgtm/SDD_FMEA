/**
 * @file api/sync/structure/route.ts
 * @description 구조 동기화 API
 * @module sync/api
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, getPrismaForSchema, getBaseDatabaseUrl } from '@/lib/prisma';
import { getProjectSchemaName, ensureProjectSchemaReady } from '@/lib/project-schema';

// ============================================================================
// 타입 정의
// ============================================================================

type SyncDirection = 
  | 'fmea-to-cp' | 'cp-to-fmea' 
  | 'pfd-to-fmea' | 'fmea-to-pfd'
  | 'pfd-to-cp' | 'cp-to-pfd';

interface StructureSyncRequest {
  direction: SyncDirection;
  sourceId: string;
  targetId?: string;
  data?: any;
  options?: {
    overwrite?: boolean;
    createEmpty?: boolean;
    preserveTarget?: string[];
  };
}

// ============================================================================
// POST: 구조 동기화
// ============================================================================

// GET: 구조 데이터 조회 (디버깅용)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fmeaId = searchParams.get('fmeaId');
    
    if (!fmeaId) {
      return NextResponse.json({ success: false, error: 'fmeaId 필요' });
    }
    
    const prisma = getPrisma();
    
    // L2Structure 조회 (관련 데이터 포함)
    const l2Structures = await prisma.l2Structure.findMany({
      where: { fmeaId },
      include: {
        l3Structures: {
          include: { l3Functions: true },
        },
        l2Functions: true,
      },
      orderBy: { order: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      fmeaId,
      l2Count: l2Structures.length,
      l2Structures: l2Structures.map(l2 => ({
        id: l2.id,
        no: l2.no,
        name: l2.name,
        l3Count: l2.l3Structures?.length || 0,
        l2FunctionCount: l2.l2Functions?.length || 0,
        l3Structures: l2.l3Structures?.map(l3 => ({
          id: l3.id,
          name: l3.name,
          m4: l3.m4,
          l3FunctionCount: l3.l3Functions?.length || 0,
          l3Functions: l3.l3Functions?.map(fn => ({
            processChar: fn.processChar,
            specialChar: fn.specialChar,
          })),
        })),
        l2Functions: l2.l2Functions?.map(fn => ({
          productChar: fn.productChar,
          specialChar: fn.specialChar,
        })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: StructureSyncRequest = await req.json();
    const { direction, sourceId, targetId, data, options } = body;

    // 필수 파라미터 검증
    if (!direction || !sourceId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터 누락 (direction, sourceId)' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // 방향에 따라 처리
    switch (direction) {
      case 'fmea-to-cp':
        return await syncFmeaToCp(prisma, sourceId, targetId, options);
      case 'cp-to-fmea':
        return await syncCpToFmea(prisma, sourceId, targetId, data, options);
      case 'pfd-to-fmea':
        return await syncPfdToFmea(prisma, sourceId, targetId, options);
      case 'fmea-to-pfd':
        return await syncFmeaToPfd(prisma, sourceId, targetId, options);
      case 'pfd-to-cp':
        return await syncPfdToCp(prisma, sourceId, targetId, options);
      case 'cp-to-pfd':
        return await syncCpToPfd(prisma, sourceId, targetId, options);
      default:
        return NextResponse.json(
          { success: false, error: '잘못된 동기화 방향' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[API] 구조 동기화 실패:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류' },
      { status: 500 }
    );
  }
}

// ============================================================================
// FMEA → CP 구조 동기화
// ============================================================================

async function syncFmeaToCp(
  prisma: any,
  fmeaId: string,
  cpNo?: string,
  options?: any
): Promise<NextResponse> {
  try {
    // ★ 2026-01-16: 프로젝트 스키마에서 FMEA 데이터 조회
    const baseUrl = getBaseDatabaseUrl();
    const fmeaIdLower = fmeaId.toLowerCase();
    const schema = getProjectSchemaName(fmeaIdLower);
    
    let projectPrisma = prisma;
    if (baseUrl) {
      await ensureProjectSchemaReady({ baseDatabaseUrl: baseUrl, schema });
      projectPrisma = getPrismaForSchema(schema) || prisma;
      console.log(`[SYNC] 프로젝트 스키마 사용: ${schema}`);
    }
    
    // 1. FMEA 데이터 조회 (L2Structures + L3Structures + Functions)
    let l2Structures = await projectPrisma.l2Structure.findMany({
      where: {
        fmeaId: fmeaId,
      },
      include: {
        l3Structures: {
          include: {
            l3Functions: true, // 공정특성
          },
          orderBy: { order: 'asc' },
        },
        l2Functions: true, // 제품특성
      },
      orderBy: { order: 'asc' },
    });

    // ★ 2026-01-16: L2Structure가 없으면 fmea_legacy_data 또는 fmea_worksheet_data에서 레거시 데이터 조회
    if (!l2Structures || l2Structures.length === 0) {
      console.log('[SYNC] L2Structure 없음, 레거시 데이터 조회 시도');
      
      try {
        // 1차: fmea_legacy_data 조회
        let legacyL2: any[] = [];
        const legacyData = await projectPrisma.fmeaLegacyData.findUnique({
          where: { fmeaId: fmeaIdLower },
        }).catch(() => null);
        
        if (legacyData?.data) {
          const data = legacyData.data as any;
          legacyL2 = data.l2 || [];
          console.log(`[SYNC] fmea_legacy_data에서 ${legacyL2.length}개 공정 발견`);
        }
        
        // 2차: fmea_worksheet_data 조회 (1차에서 못 찾은 경우)
        if (legacyL2.length === 0) {
          const worksheetData = await projectPrisma.fmeaWorksheetData.findUnique({
            where: { fmeaId: fmeaIdLower },
          }).catch(() => null);
          
          if (worksheetData?.l2Data) {
            legacyL2 = worksheetData.l2Data as any[];
            console.log(`[SYNC] fmea_worksheet_data에서 ${legacyL2.length}개 공정 발견`);
          }
        }
        
        if (legacyL2.length > 0) {
          
          // 레거시 데이터를 L2Structures 형식으로 변환
          l2Structures = legacyL2.map((l2: any, idx: number) => ({
            id: l2.id || `legacy-l2-${idx}`,
            fmeaId: fmeaId,
            no: l2.no || String((idx + 1) * 10),
            name: l2.name || '',
            order: idx,
            // L3 작업요소
            l3Structures: (l2.l3 || []).map((l3: any, l3Idx: number) => ({
              id: l3.id || `legacy-l3-${idx}-${l3Idx}`,
              name: l3.name || '',
              m4: l3.m4 || '',
              order: l3Idx,
              // L3 Functions (공정특성)
              l3Functions: (l3.functions || []).map((fn: any) => ({
                id: fn.id || `legacy-fn-${idx}-${l3Idx}`,
                processChar: fn.processChars?.[0]?.name || '',
                specialChar: fn.processChars?.[0]?.specialChar || '',
              })),
            })),
            // L2 Functions (제품특성)
            l2Functions: (l2.functions || []).map((fn: any) => ({
              id: fn.id || `legacy-l2fn-${idx}`,
              productChar: fn.productChars?.[0]?.name || '',
              specialChar: fn.productChars?.[0]?.specialChar || '',
            })),
          }));
        }
      } catch (e: any) {
        console.warn('[SYNC] 레거시 데이터 조회 실패:', e.message);
      }
    }

    if (!l2Structures || l2Structures.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'FMEA 구조 데이터가 없습니다',
      });
    }

    // 2. CP 헤더 조회 또는 생성
    let cp;
    if (cpNo) {
      cp = await prisma.controlPlan.findUnique({
        where: { cpNo },
      });
    }

    if (!cp) {
      return NextResponse.json({
        success: false,
        error: 'CP를 찾을 수 없습니다. 먼저 CP를 생성하세요.',
      });
    }

    // 3. 기존 CP 항목 삭제 (overwrite 옵션)
    if (options?.overwrite) {
      await prisma.controlPlanItem.deleteMany({
        where: { cpId: cp.id },
      });
    }

    // 4. FMEA 구조 → CP 항목 변환 및 저장
    // ★ 2026-01-16: 원자성 데이터 구조 - 각 특성을 별도 행으로 분리, charIndex 부여
    const cpItems: any[] = [];
    let sortOrder = 0;

    for (const l2 of l2Structures) {
      // L2Function에서 제품특성 추출 (각각 별도 행)
      const l2Functions = l2.l2Functions || [];
      const productCharList = l2Functions
        .filter((f: any) => f.productChar)
        .map((f: any) => ({
          name: f.productChar,
          specialChar: f.specialChar || ''
        }));
      
      // L3Structure + L3Function에서 공정특성 추출 (각각 별도 행)
      const l3Structures = l2.l3Structures || [];
      
      // 설비/금형/지그 연동: MC, IM, EN만 (MN 제외)
      const equipmentL3s = l3Structures.filter((l3: any) => 
        l3.m4 && ['MC', 'IM', 'EN'].includes(l3.m4)
      );
      const equipmentNames = equipmentL3s.map((l3: any) => l3.name).filter(Boolean);
      
      // 공정특성 추출 (L3Function에서)
      const processCharList: { name: string; specialChar: string }[] = [];
      for (const l3 of l3Structures) {
        if (l3.l3Functions) {
          for (const func of l3.l3Functions) {
            if (func.processChar) {
              processCharList.push({
                name: func.processChar,
                specialChar: func.specialChar || ''
              });
            }
          }
        }
      }
      
      // 작업요소명 (첫 번째 L3)
      const firstL3 = l3Structures[0];
      const workElement = firstL3?.name || '';
      
      // ★ 원자성: 제품특성 각각 별도 행으로 생성
      let charIndex = 0;
      for (const pChar of productCharList) {
        cpItems.push({
          cpId: cp.id,
          processNo: l2.no || '',
          processName: l2.name || '',
          processLevel: 'Main',
          processDesc: workElement,
          workElement: workElement,
          equipment: equipmentNames.join(', '),
          // ★ 한 셀에 하나의 제품특성만
          productChar: pChar.name,
          processChar: '',
          specialChar: pChar.specialChar,
          charIndex: charIndex++,  // 원자성 인덱스
          specTolerance: '',
          evalMethod: '',
          sampleSize: '',
          sampleFreq: '',
          controlMethod: '',
          reactionPlan: '',
          pfmeaRowUid: l2.id,
          pfmeaProcessId: l2.id,
          sortOrder: sortOrder++,
        });
      }
      
      // ★ 원자성: 공정특성 각각 별도 행으로 생성
      for (const pcChar of processCharList) {
        cpItems.push({
          cpId: cp.id,
          processNo: l2.no || '',
          processName: l2.name || '',
          processLevel: 'Main',
          processDesc: workElement,
          workElement: workElement,
          equipment: equipmentNames.join(', '),
          productChar: '',
          // ★ 한 셀에 하나의 공정특성만
          processChar: pcChar.name,
          specialChar: pcChar.specialChar,
          charIndex: charIndex++,  // 원자성 인덱스
          specTolerance: '',
          evalMethod: '',
          sampleSize: '',
          sampleFreq: '',
          controlMethod: '',
          reactionPlan: '',
          pfmeaRowUid: l2.id,
          pfmeaProcessId: l2.id,
          sortOrder: sortOrder++,
        });
      }
      
      // ★ 제품특성/공정특성 없으면 빈 행 1개 생성
      if (productCharList.length === 0 && processCharList.length === 0) {
        cpItems.push({
          cpId: cp.id,
          processNo: l2.no || '',
          processName: l2.name || '',
          processLevel: 'Main',
          processDesc: workElement,
          workElement: workElement,
          equipment: equipmentNames.join(', '),
          productChar: '',
          processChar: '',
          specialChar: '',
          charIndex: 0,
          specTolerance: '',
          evalMethod: '',
          sampleSize: '',
          sampleFreq: '',
          controlMethod: '',
          reactionPlan: '',
          pfmeaRowUid: l2.id,
          pfmeaProcessId: l2.id,
          sortOrder: sortOrder++,
        });
      }
    }

    // 5. 일괄 저장 (개별 create로 안정성 확보)
    for (const item of cpItems) {
      await prisma.controlPlanItem.create({
        data: {
          cpId: item.cpId,
          processNo: item.processNo,
          processName: item.processName,
          processLevel: item.processLevel,
          processDesc: item.processDesc,
          workElement: item.workElement,
          equipment: item.equipment,
          productChar: item.productChar,
          processChar: item.processChar,
          specialChar: item.specialChar,
          charIndex: item.charIndex,
          specTolerance: item.specTolerance,
          evalMethod: item.evalMethod,
          sampleSize: item.sampleSize,
          sampleFreq: item.sampleFreq,
          controlMethod: item.controlMethod,
          reactionPlan: item.reactionPlan,
          pfmeaRowUid: item.pfmeaRowUid,
          pfmeaProcessId: item.pfmeaProcessId,
          sortOrder: item.sortOrder,
        },
      });
    }

    // 6. 동기화 로그 저장
    await prisma.syncLog.create({
      data: {
        sourceType: 'fmea',
        sourceId: fmeaId,
        targetType: 'cp',
        targetId: cp.cpNo,
        action: 'create',
        status: 'synced',
        fieldChanges: JSON.stringify({ 
          itemCount: cpItems.length,
          syncedFields: ['processNo', 'processName', 'workElement', 'equipment', 'productChar', 'processChar', 'specialChar', 'charIndex']
        }),
        syncedAt: new Date(),
      },
    });

    console.log(`✅ FMEA→CP 구조 동기화 완료: ${cpItems.length}개 항목 (원자성 데이터 구조)`);

    return NextResponse.json({
      success: true,
      synced: cpItems.length,
      conflicts: [],
      skipped: 0,
      targetId: cp.cpNo,
    });

  } catch (error: any) {
    console.error('[API] FMEA→CP 동기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      synced: 0,
      conflicts: [],
      skipped: 0,
    });
  }
}

// ============================================================================
// CP → FMEA 구조 동기화
// ============================================================================

async function syncCpToFmea(
  prisma: any,
  cpNo: string,
  fmeaId?: string,
  data?: any,
  options?: any
): Promise<NextResponse> {
  try {
    // 1. CP 데이터 조회
    const cp = await prisma.controlPlan.findUnique({
      where: { cpNo },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!cp || !cp.items || cp.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'CP 데이터가 없습니다',
      });
    }

    // 2. FMEA 조회
    if (!fmeaId) {
      return NextResponse.json({
        success: false,
        error: 'FMEA ID가 필요합니다',
      });
    }

    const fmeaIdLower = fmeaId.toLowerCase();
    const baseUrl = getBaseDatabaseUrl();
    const schema = getProjectSchemaName(fmeaIdLower);
    let projectPrisma = prisma;

    if (baseUrl) {
      await ensureProjectSchemaReady({ baseDatabaseUrl: baseUrl, schema });
      projectPrisma = getPrismaForSchema(schema) || prisma;
      console.log(`[SYNC] CP→FMEA 프로젝트 스키마 사용: ${schema}`);
    }

    // L1 조회 (FMEA에 L1이 있어야 L2 생성 가능)
    const l1 = await projectPrisma.l1Structure.findFirst({
      where: { fmeaId: fmeaIdLower },
      orderBy: { order: 'asc' },
    });

    if (!l1) {
      return NextResponse.json({
        success: false,
        error: 'FMEA L1 구조가 없습니다. 먼저 FMEA 구조를 생성하세요.',
      });
    }

    // 3. CP 항목 → FMEA L2 구조로 변환
    // 공정번호+공정명으로 그룹화
    const processGroups = new Map<string, any[]>();
    
    cp.items.forEach((item: any) => {
      const key = `${item.processNo}_${item.processName}`;
      if (!processGroups.has(key)) {
        processGroups.set(key, []);
      }
      processGroups.get(key)!.push(item);
    });

    // 4. L2 구조 생성
    let l2Count = 0;
    
    for (const [key, items] of processGroups) {
      const firstItem = items[0];
      
      // L2 생성 (스키마에 맞게)
      const l2 = await projectPrisma.l2Structure.create({
        data: {
          fmeaId: fmeaIdLower,
          l1Id: l1.id,
          no: firstItem.processNo || String((l2Count + 1) * 10),
          name: firstItem.processName || '',
          order: l2Count,
        },
      });

      // L3 생성 (workElement가 있는 경우)
      if (firstItem.workElement) {
        await projectPrisma.l3Structure.create({
          data: {
            fmeaId: fmeaIdLower,
            l1Id: l1.id,
            l2Id: l2.id,
            name: firstItem.workElement,
            order: 0,
          },
        });
      }

      l2Count++;
    }

    // 5. 동기화 로그 저장
    await prisma.syncLog.create({
      data: {
        sourceType: 'cp',
        sourceId: cpNo,
        targetType: 'fmea',
        targetId: fmeaId,
        action: 'create',
        status: 'synced',
        fieldChanges: JSON.stringify({ l2Count }),
        syncedAt: new Date(),
      },
    });

    console.log(`✅ CP→FMEA 구조 동기화 완료: ${l2Count}개 공정`);

    return NextResponse.json({
      success: true,
      synced: l2Count,
      conflicts: [],
      skipped: 0,
      targetId: fmeaId,
    });

  } catch (error: any) {
    console.error('[API] CP→FMEA 동기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      synced: 0,
      conflicts: [],
      skipped: 0,
    });
  }
}

// ============================================================================
// PFD → FMEA 구조 동기화
// ============================================================================

async function syncPfdToFmea(
  prisma: any,
  pfdId: string,
  fmeaId?: string,
  options?: any
): Promise<NextResponse> {
  try {
    // 1. PFD 데이터 조회
    const pfd = await prisma.pfdRegistration.findFirst({
      where: {
        OR: [{ id: pfdId }, { pfdNo: pfdId }],
      },
      include: {
        items: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!pfd || !pfd.items || pfd.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'PFD 데이터가 없습니다',
      });
    }

    // 2. FMEA 확인 (없으면 오류)
    if (!fmeaId) {
      fmeaId = pfd.fmeaId;
    }
    
    if (!fmeaId) {
      return NextResponse.json({
        success: false,
        error: 'FMEA ID가 필요합니다',
      });
    }

    // L1 조회
    const l1 = await prisma.l1Structure.findFirst({
      where: { fmeaId },
      orderBy: { order: 'asc' },
    });

    if (!l1) {
      return NextResponse.json({
        success: false,
        error: 'FMEA L1 구조가 없습니다. 먼저 FMEA 구조를 생성하세요.',
      });
    }

    // 3. PFD 항목 → FMEA L2/L3 구조로 변환
    let l2Count = 0;
    const processGroups = new Map<string, any[]>();
    
    pfd.items.forEach((item: any) => {
      const key = `${item.processNo}_${item.processName}`;
      if (!processGroups.has(key)) {
        processGroups.set(key, []);
      }
      processGroups.get(key)!.push(item);
    });

    for (const [key, items] of processGroups) {
      const firstItem = items[0];
      
      // L2 생성
      const l2 = await prisma.l2Structure.create({
        data: {
          fmeaId: fmeaId,
          l1Id: l1.id,
          no: firstItem.processNo || String((l2Count + 1) * 10),
          name: firstItem.processName || '',
          order: l2Count,
        },
      });

      // L3 생성 (workElement가 있는 경우)
      if (firstItem.workElement) {
        await prisma.l3Structure.create({
          data: {
            fmeaId: fmeaId,
            l1Id: l1.id,
            l2Id: l2.id,
            name: firstItem.workElement,
            order: 0,
          },
        });
      }

      // PFD 항목에 FMEA 연결 정보 업데이트
      await prisma.pfdItem.update({
        where: { id: firstItem.id },
        data: { fmeaL2Id: l2.id },
      });

      l2Count++;
    }

    // 4. 문서 링크 업데이트
    await prisma.documentLink.upsert({
      where: {
        sourceType_sourceId_targetType_targetId: {
          sourceType: 'pfd',
          sourceId: pfd.id,
          targetType: 'fmea',
          targetId: fmeaId,
        },
      },
      create: {
        sourceType: 'pfd',
        sourceId: pfd.id,
        targetType: 'fmea',
        targetId: fmeaId,
        linkType: 'synced_with',
        lastSyncAt: new Date(),
      },
      update: {
        lastSyncAt: new Date(),
      },
    });

    // 5. 동기화 로그
    await prisma.syncLog.create({
      data: {
        sourceType: 'pfd',
        sourceId: pfdId,
        targetType: 'fmea',
        targetId: fmeaId,
        action: 'structure_sync',
        status: 'synced',
        fieldChanges: JSON.stringify({ l2Count }),
        syncedAt: new Date(),
      },
    });

    console.log(`✅ PFD→FMEA 구조 동기화 완료: ${l2Count}개 공정`);

    return NextResponse.json({
      success: true,
      synced: l2Count,
      conflicts: [],
      skipped: 0,
      targetId: fmeaId,
    });

  } catch (error: any) {
    console.error('[API] PFD→FMEA 동기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      synced: 0,
      conflicts: [],
      skipped: 0,
    });
  }
}

// ============================================================================
// FMEA → PFD 구조 동기화
// ============================================================================

async function syncFmeaToPfd(
  prisma: any,
  fmeaId: string,
  pfdId?: string,
  options?: any
): Promise<NextResponse> {
  try {
    // 1. FMEA 데이터 조회
    const l2Structures = await prisma.l2Structure.findMany({
      where: { fmeaId },
      include: { l3Structures: true },
      orderBy: { order: 'asc' },
    });

    if (!l2Structures || l2Structures.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'FMEA 구조 데이터가 없습니다',
      });
    }

    // 2. PFD 확인 또는 조회
    let pfd;
    if (pfdId) {
      pfd = await prisma.pfdRegistration.findFirst({
        where: {
          OR: [{ id: pfdId }, { pfdNo: pfdId }],
        },
      });
    }

    if (!pfd) {
      return NextResponse.json({
        success: false,
        error: 'PFD를 찾을 수 없습니다. 먼저 PFD를 생성하세요.',
      });
    }

    // 3. 기존 PFD 항목 삭제 (overwrite 옵션)
    if (options?.overwrite) {
      await prisma.pfdItem.updateMany({
        where: { pfdId: pfd.id },
        data: { isDeleted: true },
      });
    }

    // 4. FMEA 구조 → PFD 항목 변환
    const pfdItems: any[] = [];
    let sortOrder = 0;

    for (const l2 of l2Structures) {
      const firstL3 = l2.l3Structures?.[0];
      
      pfdItems.push({
        pfdId: pfd.id,
        processNo: l2.no || '',
        processName: l2.name || '',
        processDesc: firstL3?.name || '',
        workElement: firstL3?.name || '',
        equipment: '',
        productChar: '',
        processChar: '',
        specialChar: '',
        fmeaL2Id: l2.id,
        fmeaL3Id: firstL3?.id || null,
        sortOrder: sortOrder++,
        isDeleted: false,
      });
    }

    // 5. 일괄 저장
    await prisma.pfdItem.createMany({
      data: pfdItems,
    });

    // 6. 문서 링크 업데이트
    await prisma.documentLink.upsert({
      where: {
        sourceType_sourceId_targetType_targetId: {
          sourceType: 'fmea',
          sourceId: fmeaId,
          targetType: 'pfd',
          targetId: pfd.id,
        },
      },
      create: {
        sourceType: 'fmea',
        sourceId: fmeaId,
        targetType: 'pfd',
        targetId: pfd.id,
        linkType: 'synced_with',
        lastSyncAt: new Date(),
      },
      update: {
        lastSyncAt: new Date(),
      },
    });

    // 7. 동기화 로그
    await prisma.syncLog.create({
      data: {
        sourceType: 'fmea',
        sourceId: fmeaId,
        targetType: 'pfd',
        targetId: pfd.id,
        action: 'structure_sync',
        status: 'synced',
        fieldChanges: JSON.stringify({ itemCount: pfdItems.length }),
        syncedAt: new Date(),
      },
    });

    console.log(`✅ FMEA→PFD 구조 동기화 완료: ${pfdItems.length}개 항목`);

    return NextResponse.json({
      success: true,
      synced: pfdItems.length,
      conflicts: [],
      skipped: 0,
      targetId: pfd.pfdNo,
    });

  } catch (error: any) {
    console.error('[API] FMEA→PFD 동기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      synced: 0,
      conflicts: [],
      skipped: 0,
    });
  }
}

// ============================================================================
// PFD → CP 구조 동기화
// ============================================================================

async function syncPfdToCp(
  prisma: any,
  pfdId: string,
  cpNo?: string,
  options?: any
): Promise<NextResponse> {
  try {
    // 1. PFD 데이터 조회
    const pfd = await prisma.pfdRegistration.findFirst({
      where: {
        OR: [{ id: pfdId }, { pfdNo: pfdId }],
      },
      include: {
        items: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!pfd || !pfd.items || pfd.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'PFD 데이터가 없습니다',
      });
    }

    // 2. CP 확인
    if (!cpNo) {
      cpNo = pfd.cpNo;
    }
    
    let cp;
    if (cpNo) {
      cp = await prisma.controlPlan.findUnique({
        where: { cpNo },
      });
    }

    if (!cp) {
      return NextResponse.json({
        success: false,
        error: 'CP를 찾을 수 없습니다. 먼저 CP를 생성하세요.',
      });
    }

    // 3. 기존 CP 항목 삭제 (overwrite 옵션)
    if (options?.overwrite) {
      await prisma.controlPlanItem.deleteMany({
        where: { cpId: cp.id },
      });
    }

    // 4. PFD 항목 → CP 항목 변환 및 저장
    let sortOrder = 0;
    let itemCount = 0;

    for (const item of pfd.items) {
      await prisma.controlPlanItem.create({
        data: {
          cpId: cp.id,
          processNo: item.processNo || '',
          processName: item.processName || '',
          processLevel: 'Main',
          processDesc: item.processDesc || '',
          workElement: item.workElement || '',
          equipment: item.equipment || '',
          productChar: item.productChar || '',
          processChar: item.processChar || '',
          specialChar: item.specialChar || '',
          charIndex: sortOrder,  // 원자성 인덱스
          specTolerance: '',
          evalMethod: '',
          sampleSize: '',
          sampleFreq: '',
          controlMethod: '',
          reactionPlan: '',
          sortOrder: sortOrder++,
        },
      });
      itemCount++;
    }

    // 5. 저장 완료

    // 6. 문서 링크 업데이트
    await prisma.documentLink.upsert({
      where: {
        sourceType_sourceId_targetType_targetId: {
          sourceType: 'pfd',
          sourceId: pfd.id,
          targetType: 'cp',
          targetId: cp.id,
        },
      },
      create: {
        sourceType: 'pfd',
        sourceId: pfd.id,
        targetType: 'cp',
        targetId: cp.id,
        linkType: 'synced_with',
        lastSyncAt: new Date(),
      },
      update: {
        lastSyncAt: new Date(),
      },
    });

    // 7. 동기화 로그
    await prisma.syncLog.create({
      data: {
        sourceType: 'pfd',
        sourceId: pfdId,
        targetType: 'cp',
        targetId: cp.cpNo,
        action: 'structure_sync',
        status: 'synced',
        fieldChanges: JSON.stringify({ itemCount }),
        syncedAt: new Date(),
      },
    });

    console.log(`✅ PFD→CP 구조 동기화 완료: ${itemCount}개 항목`);

    return NextResponse.json({
      success: true,
      synced: itemCount,
      conflicts: [],
      skipped: 0,
      targetId: cp.cpNo,
    });

  } catch (error: any) {
    console.error('[API] PFD→CP 동기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      synced: 0,
      conflicts: [],
      skipped: 0,
    });
  }
}

// ============================================================================
// CP → PFD 구조 동기화
// ============================================================================

async function syncCpToPfd(
  prisma: any,
  cpNo: string,
  pfdId?: string,
  options?: any
): Promise<NextResponse> {
  try {
    // 1. CP 데이터 조회
    const cp = await prisma.controlPlan.findUnique({
      where: { cpNo },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!cp || !cp.items || cp.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'CP 데이터가 없습니다',
      });
    }

    // 2. PFD 확인
    let pfd;
    if (pfdId) {
      pfd = await prisma.pfdRegistration.findFirst({
        where: {
          OR: [{ id: pfdId }, { pfdNo: pfdId }],
        },
      });
    }

    if (!pfd) {
      return NextResponse.json({
        success: false,
        error: 'PFD를 찾을 수 없습니다. 먼저 PFD를 생성하세요.',
      });
    }

    // 3. 기존 PFD 항목 삭제 (overwrite 옵션)
    if (options?.overwrite) {
      await prisma.pfdItem.updateMany({
        where: { pfdId: pfd.id },
        data: { isDeleted: true },
      });
    }

    // 4. CP 항목 → PFD 항목 변환
    const pfdItems: any[] = [];
    let sortOrder = 0;

    for (const item of cp.items) {
      pfdItems.push({
        pfdId: pfd.id,
        processNo: item.processNo || '',
        processName: item.processName || '',
        processDesc: item.processDesc || '',
        workElement: item.workElement || '',
        equipment: item.equipment || '',
        productChar: item.productChar || '',
        processChar: item.processChar || '',
        specialChar: item.specialChar || '',
        cpItemId: item.id,
        sortOrder: sortOrder++,
        isDeleted: false,
      });
    }

    // 5. 일괄 저장
    await prisma.pfdItem.createMany({
      data: pfdItems,
    });

    // 6. 문서 링크 업데이트
    await prisma.documentLink.upsert({
      where: {
        sourceType_sourceId_targetType_targetId: {
          sourceType: 'cp',
          sourceId: cp.id,
          targetType: 'pfd',
          targetId: pfd.id,
        },
      },
      create: {
        sourceType: 'cp',
        sourceId: cp.id,
        targetType: 'pfd',
        targetId: pfd.id,
        linkType: 'synced_with',
        lastSyncAt: new Date(),
      },
      update: {
        lastSyncAt: new Date(),
      },
    });

    // 7. 동기화 로그
    await prisma.syncLog.create({
      data: {
        sourceType: 'cp',
        sourceId: cpNo,
        targetType: 'pfd',
        targetId: pfd.pfdNo,
        action: 'structure_sync',
        status: 'synced',
        fieldChanges: JSON.stringify({ itemCount: pfdItems.length }),
        syncedAt: new Date(),
      },
    });

    console.log(`✅ CP→PFD 구조 동기화 완료: ${pfdItems.length}개 항목`);

    return NextResponse.json({
      success: true,
      synced: pfdItems.length,
      conflicts: [],
      skipped: 0,
      targetId: pfd.pfdNo,
    });

  } catch (error: any) {
    console.error('[API] CP→PFD 동기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      synced: 0,
      conflicts: [],
      skipped: 0,
    });
  }
}
