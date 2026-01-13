/**
 * @file hooks/useRowSpan.ts
 * @description rowSpan 계산 훅 (공정, 공정설명, 설비 그룹별)
 */

import { useMemo } from 'react';
import { CPItem, SpanInfo } from '../types';

/**
 * 공정번호+공정명 기준 rowSpan 계산
 */
export function useProcessRowSpan(items: CPItem[]): SpanInfo[] {
  return useMemo(() => {
    const result: SpanInfo[] = [];
    let i = 0;
    
    while (i < items.length) {
      const currentItem = items[i];
      const processKey = `${currentItem.processNo}-${currentItem.processName}`;
      
      // 같은 공정의 연속 행 수 계산
      let span = 1;
      while (i + span < items.length) {
        const nextItem = items[i + span];
        const nextKey = `${nextItem.processNo}-${nextItem.processName}`;
        if (nextKey === processKey) {
          span++;
        } else {
          break;
        }
      }
      
      // 첫 번째 행은 isFirst=true, span 설정
      result[i] = { isFirst: true, span };
      // 나머지 행은 isFirst=false
      for (let j = 1; j < span; j++) {
        result[i + j] = { isFirst: false, span: 0 };
      }
      
      i += span;
    }
    
    return result;
  }, [items]);
}

/**
 * 공정+레벨+공정설명 기준 rowSpan 계산
 */
export function useDescRowSpan(items: CPItem[]): SpanInfo[] {
  return useMemo(() => {
    const result: SpanInfo[] = [];
    let i = 0;
    
    while (i < items.length) {
      const currentItem = items[i];
      // 공정번호+공정명+레벨+공정설명 조합으로 그룹핑
      const descKey = `${currentItem.processNo}-${currentItem.processName}-${currentItem.processLevel}-${currentItem.processDesc}`;
      
      // 같은 그룹의 연속 행 수 계산
      let span = 1;
      while (i + span < items.length) {
        const nextItem = items[i + span];
        const nextKey = `${nextItem.processNo}-${nextItem.processName}-${nextItem.processLevel}-${nextItem.processDesc}`;
        if (nextKey === descKey) {
          span++;
        } else {
          break;
        }
      }
      
      // 첫 번째 행은 isFirst=true, span 설정
      result[i] = { isFirst: true, span };
      // 나머지 행은 isFirst=false
      for (let j = 1; j < span; j++) {
        result[i + j] = { isFirst: false, span: 0 };
      }
      
      i += span;
    }
    
    return result;
  }, [items]);
}

/**
 * 공정+레벨+공정설명+설비 기준 rowSpan 계산
 */
export function useWorkRowSpan(items: CPItem[]): SpanInfo[] {
  return useMemo(() => {
    const result: SpanInfo[] = [];
    let i = 0;
    
    while (i < items.length) {
      const currentItem = items[i];
      // 공정번호+공정명+레벨+공정설명+설비 조합으로 그룹핑
      const workKey = `${currentItem.processNo}-${currentItem.processName}-${currentItem.processLevel}-${currentItem.processDesc}-${currentItem.workElement}`;
      
      // 같은 그룹의 연속 행 수 계산
      let span = 1;
      while (i + span < items.length) {
        const nextItem = items[i + span];
        const nextKey = `${nextItem.processNo}-${nextItem.processName}-${nextItem.processLevel}-${nextItem.processDesc}-${nextItem.workElement}`;
        if (nextKey === workKey) {
          span++;
        } else {
          break;
        }
      }
      
      // 첫 번째 행은 isFirst=true, span 설정
      result[i] = { isFirst: true, span };
      // 나머지 행은 isFirst=false
      for (let j = 1; j < span; j++) {
        result[i + j] = { isFirst: false, span: 0 };
      }
      
      i += span;
    }
    
    return result;
  }, [items]);
}


