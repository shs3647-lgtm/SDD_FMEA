/**
 * @file useRelationData.ts
 * @description 관계형 데이터 필터링 및 통계 계산 훅
 */

import { useMemo } from 'react';
import { ImportedFlatData } from '../types';

interface RelationDataRow {
  A1: string;
  A2?: string;
  A3?: string;
  A4?: string;
  A5?: string;
  A6?: string;
  B1?: string;
  B2?: string;
  B3?: string;
  B4?: string;
  B5?: string;
  C1?: string;
  C2?: string;
  C3?: string;
  C4?: string;
  note?: string;
}

interface Stats {
  total: number;
  processCount: number;
  aCount: number;
  bCount: number;
  cCount: number;
  missing: number;
}

export function useRelationData(flatData: ImportedFlatData[], relationTab: 'A' | 'B' | 'C') {
  
  // 통계 계산
  const stats = useMemo<Stats>(() => ({
    total: flatData.length,
    processCount: new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo)).size,
    aCount: flatData.filter(d => d.itemCode?.startsWith('A')).length,
    bCount: flatData.filter(d => d.itemCode?.startsWith('B')).length,
    cCount: flatData.filter(d => d.itemCode?.startsWith('C')).length,
    missing: flatData.filter(d => !d.value || d.value?.trim() === '').length,
  }), [flatData]);

  // 관계형 데이터 필터링
  const getRelationData = (tabOverride?: 'A' | 'B' | 'C'): RelationDataRow[] => {
    const tab = tabOverride || relationTab;
    
    if (tab === 'A') {
      const processes = [...new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo))];
      return processes.map(pNo => ({
        A1: pNo,
        A2: flatData.find(d => d.processNo === pNo && d.itemCode === 'A2')?.value || '',
        A3: flatData.find(d => d.processNo === pNo && d.itemCode === 'A3')?.value || '',
        A4: flatData.find(d => d.processNo === pNo && d.itemCode === 'A4')?.value || '',
        A5: flatData.find(d => d.processNo === pNo && d.itemCode === 'A5')?.value || '',
        A6: flatData.find(d => d.processNo === pNo && d.itemCode === 'A6')?.value || '',
      }));
    } else if (tab === 'B') {
      const processes = [...new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo))];
      return processes.map(pNo => ({
        A1: pNo,
        B1: flatData.find(d => d.processNo === pNo && d.itemCode === 'B1')?.value || '',
        B2: flatData.find(d => d.processNo === pNo && d.itemCode === 'B2')?.value || '',
        B3: flatData.find(d => d.processNo === pNo && d.itemCode === 'B3')?.value || '',
        B4: flatData.find(d => d.processNo === pNo && d.itemCode === 'B4')?.value || '',
        B5: flatData.find(d => d.processNo === pNo && d.itemCode === 'B5')?.value || '',
      }));
    } else {
      // C 레벨
      const c1Data = flatData.filter(d => d.itemCode === 'C1');
      const c2Data = flatData.filter(d => d.itemCode === 'C2');
      const c3Data = flatData.filter(d => d.itemCode === 'C3');
      const c4Data = flatData.filter(d => d.itemCode === 'C4');
      
      if (c1Data.length > 0) {
        return c1Data.map((p, idx) => ({
          A1: p.processNo !== 'ALL' ? p.processNo : String(idx + 1),
          C1: p.value,
          C2: c2Data[idx]?.value || '',
          C3: c3Data[idx]?.value || '',
          C4: c4Data[idx]?.value || '',
          note: '',
        }));
      }
      
      const maxLen = Math.max(c2Data.length, c3Data.length, c4Data.length, 1);
      return Array.from({ length: maxLen }).map((_, idx) => ({
        A1: String(idx + 1),
        C1: c1Data[idx]?.value || '',
        C2: c2Data[idx]?.value || '',
        C3: c3Data[idx]?.value || '',
        C4: c4Data[idx]?.value || '',
        note: '',
      }));
    }
  };

  const relationData = useMemo(() => getRelationData(), [flatData, relationTab]);

  return {
    stats,
    getRelationData,
    relationData,
  };
}


