/**
 * 마스터 FMEA 공정 목록 API
 * - GET: Master FMEA 기초정보에서 공정 목록 반환
 * - pfmea_master_flat_items 테이블에서 A1(공정번호), A2(공정명) 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'DB 연결 실패', processes: [] });
  }
  
  try {
    // 1. 활성화된 Master Dataset 조회
    const activeDataset = await prisma.pfmeaMasterDataset.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    if (!activeDataset) {
      console.log('⚠️ 활성화된 Master Dataset 없음');
      return NextResponse.json({ 
        success: true, 
        processes: [],
        source: 'none',
        message: 'Master FMEA 기초정보가 없습니다. 먼저 기초정보를 Import해주세요.'
      });
    }
    
    // 2. Master Dataset의 공정 데이터 조회 (A1: 공정번호, A2: 공정명)
    const flatItems = await prisma.pfmeaMasterFlatItem.findMany({
      where: { 
        datasetId: activeDataset.id,
        itemCode: { in: ['A1', 'A2', 'L2-1', 'L2-2'] }  // 공정번호, 공정명
      },
      orderBy: { processNo: 'asc' }
    });
    
    // 3. processNo별로 공정 데이터 그룹핑
    const processMap = new Map<string, { no: string; name: string }>();
    
    flatItems.forEach((item: any) => {
      const processNo = item.processNo || '';
      if (!processMap.has(processNo)) {
        processMap.set(processNo, { no: '', name: '' });
      }
      const proc = processMap.get(processNo)!;
      
      // A1 또는 L2-1 = 공정번호
      if (item.itemCode === 'A1' || item.itemCode === 'L2-1') {
        proc.no = item.value || '';
      }
      // A2 또는 L2-2 = 공정명
      if (item.itemCode === 'A2' || item.itemCode === 'L2-2') {
        proc.name = item.value || '';
      }
    });
    
    // 4. 공정 목록 생성 (공정명이 있는 것만)
    const processes = Array.from(processMap.entries())
      .filter(([_, proc]) => proc.name && proc.name.trim() !== '')
      .map(([processNo, proc], idx) => ({
        id: `master_proc_${processNo}_${idx}`,
        no: proc.no || String((idx + 1) * 10),
        name: proc.name
      }));
    
    console.log(`✅ Master 공정 ${processes.length}개 반환 (dataset: ${activeDataset.name})`);
    
    return NextResponse.json({ 
      success: true, 
      processes,
      source: 'pfmea_master_flat_items',
      datasetId: activeDataset.id,
      datasetName: activeDataset.name
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
