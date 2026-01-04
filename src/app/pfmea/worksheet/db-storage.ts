/**
 * @file db-storage.ts
 * @description 워크시트 데이터 저장/로드 함수
 * 
 * ✅ 핵심 원칙:
 * 1. localStorage를 항상 우선 사용 (가장 안정적)
 * 2. API는 백업용으로만 사용 (실패해도 무시)
 * 3. 저장 시 레거시 키 + 원자성 키 양쪽에 저장
 * 4. 로드 시 레거시 키 우선 로드
 */

import type { FMEAWorksheetDB } from './schema';

// 키 상수
const LEGACY_KEY_PREFIX = 'pfmea_worksheet_';
const ATOMIC_KEY_PREFIX = 'pfmea_atomic_';

/**
 * 워크시트 데이터 저장 (localStorage 우선)
 */
export async function saveWorksheetDB(db: FMEAWorksheetDB): Promise<void> {
  const fmeaId = db.fmeaId;
  
  // ✅ 1. localStorage에 원자성 DB 저장 (항상 먼저)
  if (typeof window !== 'undefined') {
    try {
      const atomicKey = `${ATOMIC_KEY_PREFIX}${fmeaId}`;
      localStorage.setItem(atomicKey, JSON.stringify(db));
      console.log('[저장] localStorage (원자성):', atomicKey);
    } catch (e) {
      console.error('[저장] localStorage 원자성 저장 실패:', e);
    }
  }
  
  // ✅ 2. API로 저장 시도 (백업용, 실패해도 계속 진행)
  try {
    const response = await fetch('/api/fmea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db),
    });

    if (response.ok) {
      console.log('[저장] API 저장 완료:', fmeaId);
    } else {
      console.warn('[저장] API 저장 실패 (무시):', response.status);
    }
  } catch (error) {
    // API 에러는 무시 (localStorage에 이미 저장됨)
    console.warn('[저장] API 저장 오류 (무시):', error);
  }
}

/**
 * 워크시트 데이터 로드 (localStorage 우선)
 */
export async function loadWorksheetDB(fmeaId: string): Promise<FMEAWorksheetDB | null> {
  // ✅ 1. localStorage 원자성 키에서 로드 시도 (가장 먼저)
  if (typeof window !== 'undefined') {
    try {
      const atomicKey = `${ATOMIC_KEY_PREFIX}${fmeaId}`;
      const atomicData = localStorage.getItem(atomicKey);
      if (atomicData) {
        const db = JSON.parse(atomicData) as FMEAWorksheetDB;
        console.log('[로드] localStorage (원자성) 발견:', {
          fmeaId: db.fmeaId,
          l2Count: db.l2Structures?.length || 0,
          l3Count: db.l3Structures?.length || 0,
          feCount: db.failureEffects?.length || 0,
          fmCount: db.failureModes?.length || 0,
          fcCount: db.failureCauses?.length || 0,
          linkCount: db.failureLinks?.length || 0,
        });
        return db;
      }
    } catch (e) {
      console.warn('[로드] localStorage 원자성 파싱 실패:', e);
    }
    
    // ✅ 2. localStorage 레거시 키에서 로드 시도
    try {
      const legacyKey = `${LEGACY_KEY_PREFIX}${fmeaId}`;
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        console.log('[로드] localStorage (레거시) 발견, 원자성 DB로 변환 필요');
        // 레거시 데이터는 useWorksheetState에서 처리
        return null; // 레거시 데이터 존재 알림
      }
    } catch (e) {
      console.warn('[로드] localStorage 레거시 확인 실패:', e);
    }
  }
  
  // ✅ 3. API에서 로드 시도 (백업)
  try {
    const response = await fetch(`/api/fmea?fmeaId=${encodeURIComponent(fmeaId)}`);

    if (response.ok) {
      const db = await response.json();
      if (db && db.fmeaId) {
        console.log('[로드] API에서 로드 완료:', fmeaId);
        
        // API에서 로드 성공 시 localStorage에도 저장 (싱크)
        if (typeof window !== 'undefined') {
          try {
            const atomicKey = `${ATOMIC_KEY_PREFIX}${fmeaId}`;
            localStorage.setItem(atomicKey, JSON.stringify(db));
            console.log('[로드] API 데이터를 localStorage에 동기화');
          } catch (e) {
            // 무시
          }
        }
        
        return db as FMEAWorksheetDB;
      }
    }
  } catch (error) {
    // API 에러는 무시
    console.warn('[로드] API 로드 오류 (무시):', error);
  }
  
  console.log('[로드] 데이터 없음:', fmeaId);
  return null;
}

/**
 * 레거시 데이터 직접 저장 (saveToLocalStorage에서 호출)
 */
export function saveLegacyData(fmeaId: string, data: any): void {
  if (typeof window !== 'undefined') {
    try {
      const legacyKey = `${LEGACY_KEY_PREFIX}${fmeaId}`;
      localStorage.setItem(legacyKey, JSON.stringify(data));
      console.log('[저장] 레거시 데이터 저장:', legacyKey);
    } catch (e) {
      console.error('[저장] 레거시 데이터 저장 실패:', e);
    }
  }
}

/**
 * 레거시 데이터 직접 로드
 */
export function loadLegacyData(fmeaId: string): any | null {
  if (typeof window !== 'undefined') {
    try {
      const legacyKey = `${LEGACY_KEY_PREFIX}${fmeaId}`;
      const data = localStorage.getItem(legacyKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('[로드] 레거시 데이터 로드 실패:', e);
    }
  }
  return null;
}

/**
 * 모든 저장된 FMEA 데이터 확인 (디버깅용)
 */
export function debugLocalStorageData(fmeaId: string): void {
  if (typeof window === 'undefined') return;
  
  console.log('='.repeat(50));
  console.log('[DEBUG] localStorage 데이터 확인:', fmeaId);
  console.log('='.repeat(50));
  
  const atomicKey = `${ATOMIC_KEY_PREFIX}${fmeaId}`;
  const legacyKey = `${LEGACY_KEY_PREFIX}${fmeaId}`;
  
  const atomicData = localStorage.getItem(atomicKey);
  const legacyData = localStorage.getItem(legacyKey);
  
  console.log('[원자성 키]', atomicKey, ':', atomicData ? `${atomicData.length} bytes` : 'NULL');
  console.log('[레거시 키]', legacyKey, ':', legacyData ? `${legacyData.length} bytes` : 'NULL');
  
  if (atomicData) {
    try {
      const db = JSON.parse(atomicData);
      console.log('[원자성 DB 내용]:', {
        l1Structure: db.l1Structure?.name || 'N/A',
        l2Structures: db.l2Structures?.length || 0,
        l3Structures: db.l3Structures?.length || 0,
        failureEffects: db.failureEffects?.length || 0,
        failureModes: db.failureModes?.length || 0,
        failureCauses: db.failureCauses?.length || 0,
        failureLinks: db.failureLinks?.length || 0,
      });
    } catch (e) {
      console.error('[원자성 DB 파싱 오류]:', e);
    }
  }
  
  if (legacyData) {
    try {
      const legacy = JSON.parse(legacyData);
      console.log('[레거시 데이터 내용]:', {
        l1Name: legacy.l1?.name || 'N/A',
        l2Count: legacy.l2?.length || 0,
        failureScopesCount: legacy.l1?.failureScopes?.length || 0,
        tab: legacy.tab || 'N/A',
        structureConfirmed: legacy.structureConfirmed || false,
        savedAt: legacy.savedAt || 'N/A',
      });
    } catch (e) {
      console.error('[레거시 데이터 파싱 오류]:', e);
    }
  }
  
  console.log('='.repeat(50));
}
