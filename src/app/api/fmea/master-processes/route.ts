/**
 * 마스터 FMEA 공정 목록 API
 * - GET: Master/Family FMEA의 L2 공정 목록 반환
 * - public 스키마 사용 (fmeaId로 구분)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'DB 연결 실패', processes: [] });
  }
  
  const { searchParams } = new URL(req.url);
  const fmeaId = searchParams.get('fmeaId') || 'pfm26-M001';
  const type = searchParams.get('type') || 'M'; // M, F, P
  
  try {
    // public 스키마에서 Master/Family 공정 조회
    const processes = await prisma.l2Structure.findMany({
      where: {
        fmeaId: {
          // Master: pfm26-M001, Family: pfm26-F001 형식
          startsWith: type === 'M' ? 'pfm26-M' : type === 'F' ? 'pfm26-F' : fmeaId
        }
      },
      orderBy: [
        { order: 'asc' },
        { no: 'asc' }
      ],
      select: {
        id: true,
        no: true,
        name: true,
        fmeaId: true
      }
    });
    
    // 특정 FMEA ID로 조회된 공정이 없으면 Master에서 가져옴
    let result = processes;
    if (result.length === 0 && type !== 'M' && prisma) {
      result = await prisma.l2Structure.findMany({
        where: { fmeaId: { startsWith: 'pfm26-M' } },
        orderBy: [{ order: 'asc' }, { no: 'asc' }],
        select: { id: true, no: true, name: true, fmeaId: true }
      });
    }
    
    const mapped = result.map(row => ({
      id: row.id,
      no: row.no || '',
      name: row.name || '',
      fmeaId: row.fmeaId
    }));
    
    console.log(`✅ 공정 ${mapped.length}개 반환 (type=${type}, fmeaId=${fmeaId})`);
    
    return NextResponse.json({ 
      success: true, 
      processes: mapped,
      source: 'public-schema',
      type,
      requestedFmeaId: fmeaId
    });
    
  } catch (error: any) {
    console.error('공정 조회 오류:', error.message);
    return NextResponse.json({ 
      success: false, 
      processes: [],
      error: error.message 
    });
  }
}
