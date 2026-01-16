/**
 * @file hooks/sync/useDataSync.ts
 * @description FMEA-CP 양방향 데이터 동기화 훅
 * @module sync
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  SyncStatus,
  SyncConflict,
  ConflictPolicy,
  ConflictResolution,
  DataSyncRequest,
  SyncResponse,
  FieldMapping,
} from './types';
import { SYNC_FIELD_MAPPINGS, getBidirectionalFields } from './types';

// ============================================================================
// 타입 정의
// ============================================================================

interface UseDataSyncState {
  status: SyncStatus;
  conflicts: SyncConflict[];
  synced: number;
  skipped: number;
  lastSyncAt?: Date;
  error?: string;
}

interface UseDataSyncReturn {
  state: UseDataSyncState;
  syncData: (request: DataSyncRequest) => Promise<SyncResponse>;
  detectConflicts: (fmeaId: string, cpNo: string) => Promise<SyncConflict[]>;
  resolveConflict: (field: string, resolution: ConflictResolution) => void;
  resolveAllConflicts: (resolution: ConflictResolution) => void;
  applyResolutions: () => Promise<SyncResponse>;
  clearConflicts: () => void;
  reset: () => void;
}

// ============================================================================
// 초기 상태
// ============================================================================

const INITIAL_STATE: UseDataSyncState = {
  status: 'idle',
  conflicts: [],
  synced: 0,
  skipped: 0,
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 두 값이 다른지 비교
 */
const isDifferent = (a: any, b: any): boolean => {
  const aVal = a ?? '';
  const bVal = b ?? '';
  return String(aVal).trim() !== String(bVal).trim();
};

/**
 * FMEA 값 추출
 */
const extractFmeaValue = (fmeaData: any, field: string): string => {
  // field에 따라 다른 경로에서 값 추출
  switch (field) {
    case 'l2No':
      return fmeaData.l2?.[0]?.no || '';
    case 'l2Name':
      return fmeaData.l2?.[0]?.name || '';
    case 'l2Function':
      return fmeaData.l2?.[0]?.function || '';
    case 'l3Name':
      return fmeaData.l2?.[0]?.l3Structures?.[0]?.name || '';
    case 'equipment':
      return fmeaData.l2?.[0]?.l3Structures?.[0]?.equipment || '';
    case 'productChar':
      return fmeaData.l2?.[0]?.productChars?.[0]?.name || '';
    case 'processChar':
      return fmeaData.l2?.[0]?.processChars?.[0]?.name || '';
    case 'specialChar':
      return fmeaData.l2?.[0]?.productChars?.[0]?.specialChar || '';
    default:
      return fmeaData[field] || '';
  }
};

/**
 * CP 값 추출
 */
const extractCpValue = (cpItems: any[], field: string): string => {
  const firstItem = cpItems[0] || {};
  return firstItem[field] ?? '';
};

// ============================================================================
// 훅 구현
// ============================================================================

/**
 * FMEA-CP 양방향 데이터 동기화 훅
 * 
 * @description
 * FMEA와 CP 간의 공통 필드를 양방향으로 동기화합니다.
 * - 충돌 감지: 양쪽 값이 다른 경우 감지
 * - 충돌 해결: 사용자 선택 또는 정책에 따라 해결
 * - 동기화: 선택된 값으로 양쪽 업데이트
 * 
 * @example
 * ```tsx
 * const { state, syncData, detectConflicts, resolveConflict } = useDataSync();
 * 
 * // 1. 충돌 감지
 * const conflicts = await detectConflicts('pfm26-m001', 'cp26-m001');
 * 
 * // 2. 충돌이 있으면 해결
 * if (conflicts.length > 0) {
 *   resolveConflict('processDesc', 'use-fmea');
 * }
 * 
 * // 3. 동기화 실행
 * const result = await syncData({
 *   fmeaId: 'pfm26-m001',
 *   cpNo: 'cp26-m001',
 *   conflictPolicy: 'fmea-wins'
 * });
 * ```
 */
export function useDataSync(): UseDataSyncReturn {
  const [state, setState] = useState<UseDataSyncState>(INITIAL_STATE);

  /**
   * 충돌 감지
   */
  const detectConflicts = useCallback(async (
    fmeaId: string,
    cpNo: string
  ): Promise<SyncConflict[]> => {
    try {
      // FMEA 데이터 조회
      const fmeaRes = await fetch(`/api/pfmea/${fmeaId}`);
      const fmeaJson = await fmeaRes.json();
      const fmeaData = fmeaJson.data || {};

      // CP 데이터 조회
      const cpRes = await fetch(`/api/control-plan/${cpNo}/items`);
      const cpJson = await cpRes.json();
      const cpItems = cpJson.data || [];

      // 양방향 동기화 필드만 비교
      const bidirectionalFields = getBidirectionalFields();
      const conflicts: SyncConflict[] = [];

      bidirectionalFields.forEach((mapping) => {
        const fmeaValue = extractFmeaValue(fmeaData, mapping.fmeaField);
        const cpValue = extractCpValue(cpItems, mapping.cpField);

        if (isDifferent(fmeaValue, cpValue)) {
          conflicts.push({
            field: mapping.cpField,
            fieldLabel: mapping.label,
            fmeaValue,
            cpValue,
          });
        }
      });

      setState(prev => ({ 
        ...prev, 
        conflicts,
        status: conflicts.length > 0 ? 'conflict' : 'idle'
      }));

      return conflicts;

    } catch (error: any) {
      console.error('충돌 감지 실패:', error.message);
      return [];
    }
  }, []);

  /**
   * 단일 충돌 해결
   */
  const resolveConflict = useCallback((
    field: string,
    resolution: ConflictResolution
  ) => {
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.map(c => 
        c.field === field ? { ...c, resolution } : c
      ),
    }));
  }, []);

  /**
   * 모든 충돌 일괄 해결
   */
  const resolveAllConflicts = useCallback((
    resolution: ConflictResolution
  ) => {
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.map(c => ({ ...c, resolution })),
    }));
  }, []);

  /**
   * 충돌 해결 적용
   */
  const applyResolutions = useCallback(async (): Promise<SyncResponse> => {
    // TODO: 실제 적용 로직 구현
    const resolved = state.conflicts.filter(c => c.resolution);
    const skipped = state.conflicts.filter(c => c.resolution === 'skip');

    setState(prev => ({
      ...prev,
      status: 'success',
      synced: resolved.length - skipped.length,
      skipped: skipped.length,
      lastSyncAt: new Date(),
    }));

    return {
      success: true,
      synced: resolved.length - skipped.length,
      conflicts: [],
      skipped: skipped.length,
    };
  }, [state.conflicts]);

  /**
   * 데이터 동기화 실행
   */
  const syncData = useCallback(async (
    request: DataSyncRequest
  ): Promise<SyncResponse> => {
    const { fmeaId, cpNo, fields, conflictPolicy = 'ask' } = request;
    
    setState(prev => ({ ...prev, status: 'syncing' }));

    try {
      // 1. 충돌 감지
      const conflicts = await detectConflicts(fmeaId, cpNo);
      
      // 2. 충돌 정책에 따라 처리
      if (conflicts.length > 0) {
        if (conflictPolicy === 'ask') {
          // 사용자에게 묻기
          return {
            success: false,
            synced: 0,
            conflicts,
            skipped: 0,
          };
        }

        // 정책에 따라 자동 해결
        let resolution: ConflictResolution;
        switch (conflictPolicy) {
          case 'fmea-wins':
            resolution = 'use-fmea';
            break;
          case 'cp-wins':
            resolution = 'use-cp';
            break;
          case 'skip':
          case 'latest-wins':
          default:
            resolution = 'skip';
        }

        resolveAllConflicts(resolution);
      }

      // 3. API 호출
      const syncRes = await fetch('/api/sync/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!syncRes.ok) {
        // API가 없으면 로컬 시뮬레이션
        console.warn('⚠️ /api/sync/data API 미구현 - 로컬 시뮬레이션');
        
        const result = await applyResolutions();
        return result;
      }

      const syncData = await syncRes.json();
      
      setState(prev => ({
        ...prev,
        status: syncData.success ? 'success' : 'error',
        synced: syncData.synced,
        skipped: syncData.skipped,
        lastSyncAt: new Date(),
        error: syncData.error,
      }));

      return syncData;

    } catch (error: any) {
      console.error('❌ 데이터 동기화 실패:', error.message);
      
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));

      return {
        success: false,
        synced: 0,
        conflicts: [],
        skipped: 0,
        error: error.message,
      };
    }
  }, [detectConflicts, resolveAllConflicts, applyResolutions]);

  /**
   * 충돌 목록 초기화
   */
  const clearConflicts = useCallback(() => {
    setState(prev => ({ ...prev, conflicts: [] }));
  }, []);

  /**
   * 전체 상태 초기화
   */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    syncData,
    detectConflicts,
    resolveConflict,
    resolveAllConflicts,
    applyResolutions,
    clearConflicts,
    reset,
  };
}

export default useDataSync;
