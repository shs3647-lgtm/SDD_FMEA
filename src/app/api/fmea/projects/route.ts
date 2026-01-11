/**
 * FMEA 프로젝트 API - 분리된 테이블 구조
 * 
 * 테이블 구조:
 * - fmea_projects: 프로젝트 기본 정보
 * - fmea_registrations: 등록 정보 (기획 및 준비 1단계)
 * - fmea_cft_members: CFT 멤버 정보
 * - fmea_worksheet_data: 워크시트 데이터
 * - fmea_confirmed_states: 확정 상태
 * 
 * GET /api/fmea/projects - 프로젝트 목록 조회
 * GET /api/fmea/projects?id=xxx - 특정 프로젝트 조회
 * POST /api/fmea/projects - 프로젝트 생성/수정
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// ============ GET: 프로젝트 목록 조회 ============
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database not configured', projects: [] }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const targetId = searchParams.get('id')?.toUpperCase() || null;

  try {
    // 프로젝트 목록 조회 (등록정보, CFT 멤버 포함)
    const whereClause = targetId ? { fmeaId: targetId } : {};
    
    const projects = await prisma.fmeaProject.findMany({
      where: whereClause,
      include: {
        registration: true,
        cftMembers: {
          orderBy: { order: 'asc' }
        },
      },
      orderBy: [
        { fmeaType: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // 레거시 데이터도 확인 (마이그레이션 중 하위호환)
    const legacyProjects = await prisma.fmeaLegacyData.findMany({
      where: targetId ? { fmeaId: targetId } : {}
    });
    const legacyMap = new Map(legacyProjects.map(l => [l.fmeaId, l.data as any]));

    // 응답 형식으로 변환
    const result = projects.map(p => {
      const legacyData = legacyMap.get(p.fmeaId);
      
      return {
        id: p.fmeaId,
        fmeaType: p.fmeaType,
        parentFmeaId: p.parentFmeaId,
        parentFmeaType: p.parentFmeaType,
        status: p.status,
        step: p.step,
        revisionNo: p.revisionNo,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        // 등록 정보 (fmea_registrations 테이블)
        fmeaInfo: p.registration ? {
          companyName: p.registration.companyName || '',
          engineeringLocation: p.registration.engineeringLocation || '',
          customerName: p.registration.customerName || '',
          modelYear: p.registration.modelYear || '',
          subject: p.registration.subject || '',
          fmeaStartDate: p.registration.fmeaStartDate || '',
          fmeaRevisionDate: p.registration.fmeaRevisionDate || '',
          fmeaProjectName: p.registration.fmeaProjectName || '',
          fmeaId: p.fmeaId,
          fmeaType: p.fmeaType,
          designResponsibility: p.registration.designResponsibility || '',
          confidentialityLevel: p.registration.confidentialityLevel || '',
          fmeaResponsibleName: p.registration.fmeaResponsibleName || '',
        } : (legacyData?.fmeaInfo || { subject: p.fmeaId }),
        // 프로젝트 정보 (등록정보에서 파생)
        project: p.registration ? {
          projectName: p.registration.fmeaProjectName || p.registration.subject || p.fmeaId,
          customer: p.registration.customerName || '',
          productName: p.registration.subject || '',
          department: p.registration.designResponsibility || '',
          leader: p.registration.fmeaResponsibleName || '',
          startDate: p.registration.fmeaStartDate || '',
        } : (legacyData?.project || { projectName: p.fmeaId }),
        // CFT 멤버 (fmea_cft_members 테이블)
        cftMembers: p.cftMembers.length > 0 
          ? p.cftMembers.map(m => ({
              id: m.id,
              role: m.role,
              name: m.name || '',
              department: m.department || '',
              position: m.position || '',
              responsibility: m.responsibility || '',
              email: m.email || '',
              phone: m.phone || '',
              remarks: m.remarks || '',
            }))
          : (legacyData?.cftMembers || []),
      };
    });

    // 레거시에만 있고 프로젝트 테이블에 없는 데이터 추가 (마이그레이션 중)
    for (const [fmeaId, data] of legacyMap.entries()) {
      if (!projects.find(p => p.fmeaId === fmeaId)) {
        const type = fmeaId.includes('-M') ? 'M' : fmeaId.includes('-F') ? 'F' : 'P';
        result.push({
          id: fmeaId,
          fmeaType: type,
          parentFmeaId: type === 'M' ? fmeaId : null,
          parentFmeaType: type === 'M' ? 'M' : null,
          status: 'active',
          step: 1,
          revisionNo: 'Rev.01',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fmeaInfo: data?.fmeaInfo || { subject: fmeaId },
          project: data?.project || { projectName: fmeaId },
          cftMembers: data?.cftMembers || [],
        });
      }
    }

    // 유형별 정렬 (M → F → P)
    const typeOrder: Record<string, number> = { 'M': 1, 'F': 2, 'P': 3 };
    result.sort((a, b) => {
      const orderA = typeOrder[a.fmeaType] || 3;
      const orderB = typeOrder[b.fmeaType] || 3;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ success: true, projects: result });

  } catch (error: any) {
    console.error('❌ FMEA 목록 조회 실패:', error.message);
    return NextResponse.json({ success: false, error: error.message, projects: [] }, { status: 500 });
  }
}

// ============ POST: 프로젝트 생성/수정 ============
export async function POST(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const fmeaId = body.fmeaId?.toUpperCase();
    const { fmeaType, project, fmeaInfo, cftMembers, parentFmeaId, parentFmeaType } = body;

    if (!fmeaId) {
      return NextResponse.json({ success: false, error: 'fmeaId is required' }, { status: 400 });
    }

    const actualType = fmeaType || (fmeaId.includes('-M') ? 'M' : fmeaId.includes('-F') ? 'F' : 'P');
    const parentId = parentFmeaId || (actualType === 'M' ? fmeaId : null);
    const parentType = parentFmeaType || (actualType === 'M' ? 'M' : null);

    // 트랜잭션으로 모든 테이블 저장
    await prisma.$transaction(async (tx) => {
      // 1. fmea_projects 테이블 저장/수정
      await tx.fmeaProject.upsert({
        where: { fmeaId },
        create: {
          fmeaId,
          fmeaType: actualType,
          parentFmeaId: parentId,
          parentFmeaType: parentType,
          status: 'active',
          step: 1,
        },
        update: {
          fmeaType: actualType,
          parentFmeaId: parentId,
          parentFmeaType: parentType,
          updatedAt: new Date(),
        },
      });

      // 2. fmea_registrations 테이블 저장/수정
      if (fmeaInfo) {
        await tx.fmeaRegistration.upsert({
          where: { fmeaId },
          create: {
            fmeaId,
            companyName: fmeaInfo.companyName || '',
            engineeringLocation: fmeaInfo.engineeringLocation || '',
            customerName: fmeaInfo.customerName || '',
            modelYear: fmeaInfo.modelYear || '',
            subject: fmeaInfo.subject || '',
            fmeaStartDate: fmeaInfo.fmeaStartDate || '',
            fmeaRevisionDate: fmeaInfo.fmeaRevisionDate || '',
            fmeaProjectName: fmeaInfo.fmeaProjectName || project?.projectName || '',
            designResponsibility: fmeaInfo.designResponsibility || '',
            confidentialityLevel: fmeaInfo.confidentialityLevel || '',
            fmeaResponsibleName: fmeaInfo.fmeaResponsibleName || '',
          },
          update: {
            companyName: fmeaInfo.companyName || undefined,
            engineeringLocation: fmeaInfo.engineeringLocation || undefined,
            customerName: fmeaInfo.customerName || undefined,
            modelYear: fmeaInfo.modelYear || undefined,
            subject: fmeaInfo.subject || undefined,
            fmeaStartDate: fmeaInfo.fmeaStartDate || undefined,
            fmeaRevisionDate: fmeaInfo.fmeaRevisionDate || undefined,
            fmeaProjectName: fmeaInfo.fmeaProjectName || project?.projectName || undefined,
            designResponsibility: fmeaInfo.designResponsibility || undefined,
            confidentialityLevel: fmeaInfo.confidentialityLevel || undefined,
            fmeaResponsibleName: fmeaInfo.fmeaResponsibleName || undefined,
            updatedAt: new Date(),
          },
        });
      }

      // 3. fmea_cft_members 테이블 저장 (전체 교체)
      if (cftMembers && Array.isArray(cftMembers)) {
        // 기존 멤버 삭제
        await tx.fmeaCftMember.deleteMany({ where: { fmeaId } });
        
        // 새 멤버 추가
        if (cftMembers.length > 0) {
          await tx.fmeaCftMember.createMany({
            data: cftMembers.map((m: any, idx: number) => ({
              fmeaId,
              role: m.role || 'CFT 팀원',
              name: m.name || '',
              department: m.department || '',
              position: m.position || '',
              responsibility: m.responsibility || '',
              email: m.email || '',
              phone: m.phone || '',
              remarks: m.remarks || '',
              order: idx,
            })),
          });
        }
      }

      // 4. fmea_legacy_data에도 저장 (하위호환)
      const existingLegacy = await tx.fmeaLegacyData.findUnique({ where: { fmeaId } });
      const existingData = (existingLegacy?.data as any) || {};
      
      await tx.fmeaLegacyData.upsert({
        where: { fmeaId },
        create: {
          fmeaId,
          data: {
            ...existingData,
            fmeaInfo,
            project,
            cftMembers,
            fmeaType: actualType,
            parentFmeaId: parentId,
            parentFmeaType: parentType,
            savedAt: new Date().toISOString(),
          },
        },
        update: {
          data: {
            ...existingData,
            fmeaInfo,
            project,
            cftMembers,
            fmeaType: actualType,
            parentFmeaId: parentId,
            parentFmeaType: parentType,
            savedAt: new Date().toISOString(),
          },
        },
      });
    });

    console.log(`✅ FMEA 프로젝트 저장 완료: ${fmeaId}`);

    return NextResponse.json({
      success: true,
      fmeaId,
      parentFmeaId: parentId,
      parentFmeaType: parentType,
      message: 'FMEA 프로젝트가 저장되었습니다.',
    });

  } catch (error: any) {
    console.error('❌ FMEA 프로젝트 저장 실패:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ============ DELETE: 프로젝트 삭제 ============
export async function DELETE(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { fmeaId } = await req.json();
    
    if (!fmeaId) {
      return NextResponse.json({ success: false, error: 'fmeaId is required' }, { status: 400 });
    }

    const normalizedId = fmeaId.toUpperCase();

    // CASCADE 삭제 (registration, cftMembers, worksheetData 자동 삭제)
    await prisma.fmeaProject.delete({
      where: { fmeaId: normalizedId }
    });

    // 레거시 데이터도 삭제
    await prisma.fmeaLegacyData.deleteMany({
      where: { fmeaId: normalizedId }
    });

    console.log(`✅ FMEA 프로젝트 삭제 완료: ${normalizedId}`);

    return NextResponse.json({
      success: true,
      fmeaId: normalizedId,
      message: 'FMEA 프로젝트가 삭제되었습니다.',
    });

  } catch (error: any) {
    console.error('❌ FMEA 프로젝트 삭제 실패:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
