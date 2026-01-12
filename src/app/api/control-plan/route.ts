/**
 * @file route.ts
 * @description Control Plan CRUD API
 * - POST: CP 생성
 * - GET: CP 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// CP 번호 생성 (CP26-M001 형식)
function generateCpNo(type: string = 'M'): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `cp${year}-${type}${seq}`;
}

// GET: CP 목록 조회
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'DB 연결 실패' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const fmeaId = searchParams.get('fmeaId');
    
    const whereClause = fmeaId ? { fmeaId } : {};
    
    const controlPlans = await prisma.controlPlan.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          take: 5, // 목록에서는 5개만
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      success: true, 
      data: controlPlans,
      count: controlPlans.length,
    });
  } catch (error) {
    console.error('CP 목록 조회 오류:', error);
    return NextResponse.json({ success: false, error: 'CP 목록 조회 실패' }, { status: 500 });
  }
}

// POST: CP 생성
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'DB 연결 실패' }, { status: 500 });
    }

    const body = await request.json();
    const { 
      fmeaId, 
      fmeaNo,
      projectName,
      partName, 
      partNo, 
      customer,
      preparedBy,
      cpInfo,  // 기존 프론트엔드 호환
    } = body;

    if (!fmeaId) {
      return NextResponse.json({ success: false, error: '상위 FMEA ID가 필요합니다' }, { status: 400 });
    }

    // CP 번호 생성 (fmeaNo 기반)
    let cpNo = body.cpNo;
    if (!cpNo) {
      if (fmeaNo) {
        // pfm26-M001 → cp26-M001
        cpNo = fmeaNo.replace('pfm', 'cp');
      } else {
        cpNo = generateCpNo();
      }
    }

    // 중복 체크 - 이미 있으면 번호 재생성
    const existing = await prisma.controlPlan.findUnique({ where: { cpNo } });
    if (existing) {
      // 시퀀스 증가
      const seq = parseInt(cpNo.slice(-3)) + 1;
      cpNo = cpNo.slice(0, -3) + seq.toString().padStart(3, '0');
    }

    // CP 생성
    const newCP = await prisma.controlPlan.create({
      data: {
        cpNo,
        fmeaId,
        fmeaNo: fmeaNo || null,
        fmeaRev: 1,
        projectName: projectName || cpInfo?.cpProjectName || null,
        partName: partName || cpInfo?.subject || null,
        partNo: partNo || null,
        customer: customer || cpInfo?.customerName || null,
        preparedBy: preparedBy || cpInfo?.cpResponsibleName || null,
        status: 'draft',
        syncStatus: 'new',
      },
    });

    console.log('✅ CP 생성 완료:', newCP.cpNo);

    return NextResponse.json({ 
      success: true, 
      data: newCP,
      message: `CP ${newCP.cpNo} 생성 완료`,
    });
  } catch (error) {
    console.error('CP 생성 오류:', error);
    return NextResponse.json({ success: false, error: 'CP 생성 실패' }, { status: 500 });
  }
}



