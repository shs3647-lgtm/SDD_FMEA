/**
 * @file migration.ts
 * @description 기존 중첩 구조 → 원자성 DB 구조 마이그레이션
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  FMEAWorksheetDB,
  L1Structure,
  L2Structure,
  L3Structure,
  L1Function,
  L2Function,
  L3Function,
  FailureEffect,
  FailureMode,
  FailureCause,
  FailureLink,
  uid,
  createEmptyDB,
  getLinkedDataByFK,
  linkFunctionToStructure,
  linkFailureToFunction,
} from './schema';
import { 
  createHybridId, 
  createL1Path, 
  createL2Path, 
  createL3Path, 
  createLinkId,
  createMergeGroupId,
  extractFmeaSeq,
  parseHybridId,
  AtomicType,
} from './constants';
import { buildFailureAnalyses } from './utils/failure-analysis-builder';
import { calculateAP } from './tabs/all/apCalculator';
import type { RiskAnalysis } from './schema';

// Re-export for external use
export { getLinkedDataByFK, linkFunctionToStructure, linkFailureToFunction };

// 기존 데이터 타입 (하위호환)
interface OldL1Type {
  id: string;
  name: string;
  functions: Array<{
    id: string;
    name: string;
    requirements: Array<{
      id: string;
      name: string;
      failureEffect?: string;
      severity?: number;
    }>;
  }>;
}

interface OldProcess {
  id: string;
  no: string;
  name: string;
  order: number;
  functions?: Array<{
    id: string;
    name: string;
    productChars?: Array<{ id: string; name: string; specialChar?: string }>;
  }>;
  failureModes?: Array<{ id: string; name: string; sc?: boolean; productCharId?: string }>;
  failureCauses?: Array<{ id: string; name: string; occurrence?: number; processCharId?: string }>;
  l3: Array<{
    id: string;
    m4: string;
    name: string;
    order: number;
    functions?: Array<{
      id: string;
      name: string;
      processChars?: Array<{ id: string; name: string; specialChar?: string }>;
    }>;
    failureCauses?: Array<{ id: string; name: string; occurrence?: number; processCharId?: string }>;
  }>;
}

interface OldL1Data {
  id: string;
  name: string;
  types: OldL1Type[];
  failureScopes?: Array<{
    id: string;
    name: string;
    reqId?: string; // FK: 요구사항 ID (하위호환용)
    requirement?: string; // 연결된 요구사항 (텍스트)
    scope?: string;
    effect?: string;
    severity?: number;
  }>;
}

interface OldWorksheetData {
  fmeaId: string;
  l1: OldL1Data;
  l2: OldProcess[];
  failureLinks?: Array<{
    fmId: string;
    fmText: string;
    fmProcess: string;
    feId?: string;
    feScope?: string;
    feText?: string;
    severity?: number;
    fcId?: string;
    fcText?: string;
    fcWorkElem?: string;
    fcProcess?: string;
  }>;
  structureConfirmed?: boolean;
  l1Confirmed?: boolean;
  l2Confirmed?: boolean;
  l3Confirmed?: boolean;
  failureL1Confirmed?: boolean;
  failureL2Confirmed?: boolean;
  failureL3Confirmed?: boolean;
  failureLinkConfirmed?: boolean;  // ✅ 고장연결 확정 상태
}

/**
 * 기존 중첩 구조 데이터를 원자성 DB 구조로 마이그레이션
 */
export function migrateToAtomicDB(oldData: OldWorksheetData | any): FMEAWorksheetDB {
  const db = createEmptyDB(oldData.fmeaId);
  
  console.log('[마이그레이션] 시작:', oldData.fmeaId);
  
  // ★★★ 고장 데이터 입력 확인 ★★★
  const inputL2 = oldData.l2 || [];
  const totalFMCount = inputL2.reduce((acc: number, p: any) => acc + (Array.isArray(p?.failureModes) ? p.failureModes.length : 0), 0);
  const totalFCCount = inputL2.reduce((acc: number, p: any) => acc + (Array.isArray(p?.failureCauses) ? p.failureCauses.length : 0), 0);
  const totalL3FCCount = inputL2.reduce((acc: number, p: any) => {
    const l3s = Array.isArray(p?.l3) ? p.l3 : [];
    return acc + l3s.reduce((a2: number, we: any) => a2 + (Array.isArray(we?.failureCauses) ? we.failureCauses.length : 0), 0);
  }, 0);
  const feCount = Array.isArray(oldData?.l1?.failureScopes) ? oldData.l1.failureScopes.length : 0;
  const linkCount = Array.isArray(oldData?.failureLinks) ? oldData.failureLinks.length : 0;
  
  console.log('[마이그레이션] 📊 고장 데이터 입력 현황:', {
    procFM: totalFMCount,
    procFC: totalFCCount,
    weFC: totalL3FCCount,
    FE: feCount,
    links: linkCount,
    l2Length: inputL2.length,
  });
  
  // 1. L1 구조분석 (완제품 공정)
  if (oldData.l1) {
    db.l1Structure = {
      id: oldData.l1.id || uid(),
      fmeaId: oldData.fmeaId,
      name: oldData.l1.name || '',
      confirmed: oldData.structureConfirmed || false,
    };
  }
  
  // 2. L1 기능분석 (구분 → 기능 → 요구사항)
  const l1FuncMap = new Map<string, L1Function>();
  const l1Types = oldData.l1?.types || [];
  l1Types.forEach((type: { name?: string; functions?: any[] }) => {
    const category = type.name as 'Your Plant' | 'Ship to Plant' | 'User';
    const functions = type.functions || [];
    
    functions.forEach((func: { name?: string; requirements?: any[] }) => {
      const requirements = func.requirements || [];
      
      if (requirements.length === 0) {
        // 요구사항 없는 경우에도 기능은 저장
        const l1Func: L1Function = {
          id: uid(),
          fmeaId: oldData.fmeaId,
          l1StructId: db.l1Structure?.id || '',
          category: category,
          functionName: func.name || '',
          requirement: '',
        };
        db.l1Functions.push(l1Func);
        l1FuncMap.set(l1Func.id, l1Func);
      } else {
        requirements.forEach((req: { id?: string; name?: string; failureEffect?: string; severity?: number }) => {
          const l1Func: L1Function = {
            id: req.id || uid(),  // 요구사항 ID 유지 (FE와 연결용)
            fmeaId: oldData.fmeaId,
            l1StructId: db.l1Structure?.id || '',
            category: category,
            functionName: func.name || '',
            requirement: req.name || '',
          };
          db.l1Functions.push(l1Func);
          l1FuncMap.set(l1Func.id, l1Func);
          
          // 요구사항에 고장영향이 있으면 FE 생성
          if (req.failureEffect) {
            db.failureEffects.push({
              id: uid(),
              fmeaId: oldData.fmeaId,
              l1FuncId: l1Func.id,
              category: category,
              effect: req.failureEffect,
              severity: req.severity || 0,
            });
          }
        });
      }
    });
  });

  // 2-1. L1 고장영향(failureScopes) → FailureEffect로 승격 (요구사항 FK 기준)
  // ★★★ FK 원자성 보장 + 인덱싱 ID 적용 + 누락 절대 금지 ★★★
  const legacyScopes = oldData.l1?.failureScopes || [];
  console.log('[마이그레이션] failureScopes 변환 시작:', legacyScopes.length, '개');
  let feIdx = 0; // FE 항목 인덱스
  legacyScopes.forEach((fs: { id?: string; reqId?: string; effect?: string; name?: string; severity?: number; scope?: string; requirement?: string }, fsLocalIdx: number) => {
    // reqId로 l1Function 찾기
    let targetFunc = fs.reqId ? l1FuncMap.get(fs.reqId) : null;
    
    // reqId 매칭 실패 시, effect 텍스트로 요구사항을 찾아보기 (fallback)
    if (!targetFunc && fs.effect) {
      const matchedFunc = Array.from(l1FuncMap.values()).find(f => f.requirement === fs.requirement);
      if (matchedFunc) targetFunc = matchedFunc;
    }
    
    // 여전히 못 찾으면 첫 번째 함수 사용 (최후의 수단)
    if (!targetFunc && l1FuncMap.size > 0) {
      targetFunc = Array.from(l1FuncMap.values())[0];
      console.warn('[마이그레이션] failureScope reqId 매칭 실패, 첫 번째 함수 사용:', fs.reqId, fs.effect);
    }
    
    // ★★★ targetFunc가 없으면 자동 생성 (누락 금지) ★★★
    if (!targetFunc) {
      // L1Function 자동 생성
      const tempL1FuncId = createIndexedId({
        type: 'L1F', level: 1, funcIdx: 0, itemIdx: feIdx
      });
      targetFunc = {
        id: tempL1FuncId,
        fmeaId: oldData.fmeaId,
        l1StructId: db.l1Structure?.id || '',
        category: (fs.scope as any) || 'Your Plant',
        functionName: '(자동생성)',
        requirement: fs.requirement || '',
      };
      db.l1Functions.push(targetFunc);
      l1FuncMap.set(targetFunc.id, targetFunc);
      console.warn('[마이그레이션] FE용 임시 L1Function 생성:', fs.effect);
    }
    
    const category = (fs.scope as any) || targetFunc.category || 'Your Plant';
    
    // ★★★ 인덱싱 ID: 단계+행+열+병합여부 인코딩 ★★★
    const feId = fs.id || createIndexedId({
      type: 'FE',
      level: 1,
      procIdx: 0,
      weIdx: 0,
      funcIdx: Array.from(l1FuncMap.values()).findIndex(f => f.id === targetFunc!.id),
      charIdx: 0,
      itemIdx: feIdx,
      isMerged: false,
    });
    
    db.failureEffects.push({
      id: feId,
      fmeaId: oldData.fmeaId,
      l1FuncId: targetFunc.id,
      category,
      effect: fs.effect || fs.name || '',
      severity: fs.severity ?? 0,
    });
    feIdx++;
  });
  console.log('[마이그레이션] failureScopes → FailureEffect 변환 완료:', db.failureEffects.length, '개');
  
  // 3. L2 구조분석 (메인공정) + L2 기능분석 + L3 구조/기능분석
  const l2Data = oldData.l2 || [];
  l2Data.forEach((proc: any, pIdx: number) => {
    // 빈 공정 스킵
    if (!proc.name || proc.name.includes('클릭') || proc.name.includes('선택')) {
      return;
    }
    
    // L2 구조분석
    const l2Struct: L2Structure = {
      id: proc.id || uid(),
      fmeaId: oldData.fmeaId,
      l1Id: db.l1Structure?.id || '',
      no: proc.no || '',
      name: proc.name,
      order: proc.order || 0,
    };
    db.l2Structures.push(l2Struct);
    
    // L2 기능분석 (메인공정 기능 → 제품특성)
    const procFuncs = proc.functions || [];
    procFuncs.forEach((func: any) => {
      const productChars = func.productChars || [];
      
      if (productChars.length === 0) {
        db.l2Functions.push({
          id: uid(),
          fmeaId: oldData.fmeaId,
          l2StructId: l2Struct.id,
          functionName: func.name,
          productChar: '',
        });
      } else {
        productChars.forEach((pc: any) => {
          const l2Func: L2Function = {
            id: pc.id || uid(),  // 제품특성 ID 유지 (FM과 연결용)
            fmeaId: oldData.fmeaId,
            l2StructId: l2Struct.id,
            functionName: func.name,
            productChar: pc.name,
            specialChar: pc.specialChar,
          };
          db.l2Functions.push(l2Func);
        });
      }
    });
    
    // L2 고장형태 (FM) - ✅ productCharId 보존
    // ★★★ 하이브리드 ID + 모자관계 + 병합그룹 ★★★
    const fmeaSeq = extractFmeaSeq(oldData.fmeaId);
    const failureModes = proc.failureModes || [];
    let fmIdx = 0; // FM 항목 인덱스 (1-based)
    
    failureModes.forEach((fm: any, fmLocalIdx: number) => {
      if (!fm.name || fm.name.includes('클릭') || fm.name.includes('추가')) {
        return; // 빈 FM 스킵
      }
      
      // productCharId가 있으면 해당 제품특성의 L2Function 연결
      let relatedL2Func = fm.productCharId 
        ? db.l2Functions.find(f => f.id === fm.productCharId)
        : null;
      // 없으면 첫 번째 L2Function 사용
      if (!relatedL2Func) {
        relatedL2Func = db.l2Functions.find(f => f.l2StructId === l2Struct.id);
      }
      // ★★★ 핵심: L2Function이 없으면 기본 생성하여 FK 오류 방지 ★★★
      if (!relatedL2Func && db.l2Functions.length > 0) {
        relatedL2Func = db.l2Functions[0];
      }
      // L2Function이 여전히 없으면 임시 생성
      if (!relatedL2Func) {
        const tempPath = createL2Path(pIdx + 1, 0, 0);
        const tempL2FuncId = createHybridId({ 
          fmeaSeq, type: 'L2F', path: tempPath, seq: 1 
        });
        const tempL2Func = {
          id: tempL2FuncId,
          fmeaId: oldData.fmeaId,
          l1FuncId: db.l1Functions[0]?.id || '',
          l2StructId: l2Struct.id,
          parentId: l2Struct.id, // ★ 모자관계
          name: '(자동생성)',
          productChar: '',
          specialChar: '',
        };
        db.l2Functions.push(tempL2Func);
        relatedL2Func = tempL2Func;
        console.warn('[마이그레이션] FM용 임시 L2Function 생성:', fm.name);
      }
      
      fmIdx++;
      
      // ★★★ 하이브리드 ID: {FMEA_SEQ}-FM-{PATH}-{SEQ} ★★★
      const funcIdx = db.l2Functions.findIndex(f => f.id === relatedL2Func!.id);
      const charIdx = fm.productCharId ? 1 : 0;
      const fmPath = createL2Path(pIdx + 1, funcIdx + 1, charIdx);
      const fmId = fm.id || createHybridId({
        fmeaSeq,
        type: 'FM',
        path: fmPath,
        seq: fmIdx,
      });
      
      // ★★★ 병합 그룹: 같은 공정+특성은 같은 그룹 ★★★
      const mergeGroupId = createMergeGroupId(fmeaSeq, 'FM', fmPath);
      
      db.failureModes.push({
        id: fmId,
        fmeaId: oldData.fmeaId,
        l2FuncId: relatedL2Func.id, // ★ 항상 유효한 ID
        l2StructId: l2Struct.id,
        productCharId: fm.productCharId || null,
        mode: fm.name,
        specialChar: fm.sc,
        // ★★★ 모자관계 + 병합그룹 ★★★
        parentId: relatedL2Func.id,  // 부모: L2Function (제품특성)
        mergeGroupId,                 // 병합 그룹
        rowSpan: 1,                   // 기본값 (렌더링 시 계산)
      });
    });
    
    // L3 구조분석 (작업요소) + L3 기능분석
    const l3Data = proc.l3 || [];
    l3Data.forEach((we: any) => {
      // 빈 작업요소 스킵
      if (!we.name || we.name.includes('클릭') || we.name.includes('추가')) {
        return;
      }
      
      // L3 구조분석
      const l3Struct: L3Structure = {
        id: we.id || uid(),
        fmeaId: oldData.fmeaId,
        l1Id: db.l1Structure?.id || '',
        l2Id: l2Struct.id,
        m4: (we.m4 as any) || '',
        name: we.name,
        order: we.order || 0,
      };
      db.l3Structures.push(l3Struct);
      
      // L3 기능분석 (작업요소 기능 → 공정특성)
      const weFuncs = we.functions || [];
      weFuncs.forEach((func: any) => {
        const processChars = func.processChars || [];
        
        if (processChars.length === 0) {
          db.l3Functions.push({
            id: uid(),
            fmeaId: oldData.fmeaId,
            l3StructId: l3Struct.id,
            l2StructId: l2Struct.id,
            functionName: func.name,
            processChar: '',
          });
        } else {
          processChars.forEach((pc: any) => {
            const l3Func: L3Function = {
              id: pc.id || uid(),  // 공정특성 ID 유지 (FC와 연결용)
              fmeaId: oldData.fmeaId,
              l3StructId: l3Struct.id,
              l2StructId: l2Struct.id,
              functionName: func.name,
              processChar: pc.name,
              specialChar: pc.specialChar,
            };
            db.l3Functions.push(l3Func);
          });
        }
      });
    });
    
    // ✅ L3 고장원인 (FC) - proc.failureCauses에서 읽기
    // ★★★ 하이브리드 ID + 모자관계 + 병합그룹 ★★★
    const procFailureCauses = proc.failureCauses || [];
    let fcIdx = 0; // FC 항목 인덱스 (1-based)
    
    procFailureCauses.forEach((fc: any, fcLocalIdx: number) => {
      if (!fc.name || fc.name.includes('클릭') || fc.name.includes('추가')) {
        return; // 빈 FC 스킵
      }
      
      // processCharId가 있으면 해당 공정특성의 L3Function 연결
      let relatedL3Func = fc.processCharId 
        ? db.l3Functions.find(f => f.id === fc.processCharId)
        : null;
      // 없으면 해당 공정의 첫 번째 L3Function 사용
      if (!relatedL3Func) {
        relatedL3Func = db.l3Functions.find(f => f.l2StructId === l2Struct.id);
      }
      // ★★★ 핵심: L3Function이 없으면 자동 생성 (누락 금지) ★★★
      if (!relatedL3Func) {
        // 먼저 L3Structure가 있는지 확인
        let targetL3Struct = db.l3Structures.find(s => s.l2Id === l2Struct.id);
        if (!targetL3Struct) {
          // L3Structure 자동 생성 (하이브리드 ID)
          const tempL3Path = createL3Path(pIdx + 1, 0);
          const tempL3StructId = createHybridId({
            fmeaSeq, type: 'L3S', path: tempL3Path, seq: 1
          });
          targetL3Struct = {
            id: tempL3StructId,
            fmeaId: oldData.fmeaId,
            l1Id: db.l1Structure?.id || '',
            l2Id: l2Struct.id,
            parentId: l2Struct.id, // ★ 모자관계
            m4: '',
            name: '(자동생성-작업요소)',
            order: 0,
          };
          db.l3Structures.push(targetL3Struct);
          console.warn('[마이그레이션] FC용 임시 L3Structure 생성:', fc.name);
        }
        // L3Function 자동 생성 (하이브리드 ID)
        const tempL3FuncPath = createL3Path(pIdx + 1, 0, 0, 0);
        const tempL3FuncId = createHybridId({
          fmeaSeq, type: 'L3F', path: tempL3FuncPath, seq: 1
        });
        relatedL3Func = {
          id: tempL3FuncId,
          fmeaId: oldData.fmeaId,
          l3StructId: targetL3Struct.id,
          l2StructId: l2Struct.id,
          parentId: targetL3Struct.id, // ★ 모자관계
          functionName: '(자동생성)',
          processChar: '',
          specialChar: '',
        };
        db.l3Functions.push(relatedL3Func);
        console.warn('[마이그레이션] FC용 임시 L3Function 생성:', fc.name);
      }
      
      fcIdx++;
      
      // ★★★ 하이브리드 ID: {FMEA_SEQ}-FC-{PATH}-{SEQ} ★★★
      const weIdx = db.l3Structures.findIndex(s => s.id === relatedL3Func!.l3StructId);
      const funcIdx = db.l3Functions.findIndex(f => f.id === relatedL3Func!.id);
      const charIdx = fc.processCharId ? 1 : 0;
      const fcPath = createL3Path(pIdx + 1, weIdx + 1, funcIdx + 1, charIdx);
      const fcId = fc.id || createHybridId({
        fmeaSeq,
        type: 'FC',
        path: fcPath,
        seq: fcIdx,
      });
      
      // ★★★ 병합 그룹: 같은 공정+작업요소+특성은 같은 그룹 ★★★
      const fcMergeGroupId = createMergeGroupId(fmeaSeq, 'FC', fcPath);
      
      db.failureCauses.push({
        id: fcId,
        fmeaId: oldData.fmeaId,
        l3FuncId: relatedL3Func.id, // ★ 항상 유효한 ID
        l3StructId: relatedL3Func.l3StructId, // ★ 항상 유효한 ID
        l2StructId: l2Struct.id,
        processCharId: fc.processCharId || null,
        cause: fc.name,
        occurrence: fc.occurrence,
        // ★★★ 모자관계 + 병합그룹 ★★★
        parentId: relatedL3Func.id, // 부모: L3Function (공정특성)
        mergeGroupId: fcMergeGroupId,
        rowSpan: 1,
      });
      fcIdx++;
    });
    
    // ✅ 하위 호환: we.failureCauses도 확인 (기존 데이터 마이그레이션용)
    l3Data.forEach((we: any) => {
      if (we.failureCauses && we.failureCauses.length > 0) {
        console.warn('[마이그레이션] 하위 호환: we.failureCauses 발견, proc.failureCauses로 마이그레이션:', we.failureCauses.length, '개');
        // l3Struct 찾기
        const l3Struct = db.l3Structures.find(s => s.id === we.id);
        if (l3Struct) {
          we.failureCauses.forEach((fc: any) => {
            // 가장 최근 L3Function을 상위로 연결
            const relatedL3Func = db.l3Functions.find(f => f.l3StructId === l3Struct.id);
            if (relatedL3Func) {
              db.failureCauses.push({
                id: fc.id || uid(),
                fmeaId: oldData.fmeaId,
                l3FuncId: relatedL3Func.id,
                l3StructId: relatedL3Func.l3StructId,
                l2StructId: relatedL3Func.l2StructId,
                cause: fc.name,
                occurrence: fc.occurrence,
              });
            }
          });
        }
      }
    });
  });
  
  // 4. 기존 고장연결 데이터 마이그레이션
  // ★★★ FK 원자성 보장 + 인덱싱 ID 적용 + 누락 절대 금지 ★★★
  const oldLinks = oldData.failureLinks || [];
  let linkIdx = 0; // Link 항목 인덱스
  oldLinks.forEach((oldLink: any, linkLocalIdx: number) => {
    // FM 찾기
    let fm = db.failureModes.find(m => m.id === oldLink.fmId || m.mode === oldLink.fmText);
    if (!fm) {
      console.warn('[마이그레이션] FailureLink: FM 없음, 텍스트로 검색 시도:', oldLink.fmText?.substring(0, 20));
      // FM 자동 생성 (누락 금지)
      if (oldLink.fmText && db.l2Functions.length > 0) {
        const tempFmId = createIndexedId({
          type: 'FM', level: 2, procIdx: 0, itemIdx: db.failureModes.length
        });
        fm = {
          id: tempFmId,
          fmeaId: oldData.fmeaId,
          l2FuncId: db.l2Functions[0].id,
          l2StructId: db.l2Structures[0]?.id || '',
          productCharId: null,
          mode: oldLink.fmText,
          specialChar: false,
        };
        db.failureModes.push(fm);
        console.warn('[마이그레이션] Link용 FM 자동 생성:', oldLink.fmText?.substring(0, 20));
      } else {
        console.error('[마이그레이션] FailureLink 저장 불가 (FM 생성 실패):', oldLink);
        return;
      }
    }
    
    // FE 찾기 (ID 또는 텍스트로)
    let fe = db.failureEffects.find(e => e.id === oldLink.feId);
    if (!fe && oldLink.feText) {
      fe = db.failureEffects.find(e => e.effect === oldLink.feText);
    }
    // FE 자동 생성 (누락 금지) - 하이브리드 ID
    if (!fe && oldLink.feId && db.l1Functions.length > 0) {
      const linkFmeaSeq = extractFmeaSeq(oldData.fmeaId);
      const tempFePath = createL1Path(1, 1, db.failureEffects.length + 1);
      const tempFeId = createHybridId({
        fmeaSeq: linkFmeaSeq, type: 'FE', path: tempFePath, seq: db.failureEffects.length + 1
      });
      fe = {
        id: tempFeId,
        fmeaId: oldData.fmeaId,
        l1FuncId: db.l1Functions[0].id,
        category: oldLink.feScope || 'Your Plant',
        effect: oldLink.feText || '(자동생성)',
        severity: oldLink.severity || 0,
        parentId: db.l1Functions[0].id, // ★ 모자관계
      };
      db.failureEffects.push(fe);
      console.warn('[마이그레이션] Link용 FE 자동 생성:', oldLink.feText?.substring(0, 20));
    }
    
    // FC 찾기 (ID 또는 텍스트로)
    let fc = db.failureCauses.find(c => c.id === oldLink.fcId);
    if (!fc && oldLink.fcText) {
      fc = db.failureCauses.find(c => c.cause === oldLink.fcText);
    }
    // FC 자동 생성 (누락 금지) - 하이브리드 ID
    if (!fc && oldLink.fcId && db.l3Functions.length > 0) {
      const linkFmeaSeq = extractFmeaSeq(oldData.fmeaId);
      const tempFcPath = createL3Path(1, 1, 1, db.failureCauses.length + 1);
      const tempFcId = createHybridId({
        fmeaSeq: linkFmeaSeq, type: 'FC', path: tempFcPath, seq: db.failureCauses.length + 1
      });
      fc = {
        id: tempFcId,
        fmeaId: oldData.fmeaId,
        l3FuncId: db.l3Functions[0].id,
        l3StructId: db.l3Functions[0].l3StructId,
        l2StructId: db.l3Functions[0].l2StructId,
        cause: oldLink.fcText || '(자동생성)',
        occurrence: null,
        parentId: db.l3Functions[0].id, // ★ 모자관계
      };
      db.failureCauses.push(fc);
      console.warn('[마이그레이션] Link용 FC 자동 생성:', oldLink.fcText?.substring(0, 20));
    }
    
    // ★★★ 핵심: FM, FE, FC 모두 유효해야 저장 ★★★
    if (fm && fe && fc) {
      linkIdx++;
      
      // ★★★ 하이브리드 ID: {FMEA_SEQ}-LK-FM{SEQ}-FE{SEQ}-FC{SEQ} ★★★
      // ID만 보고도 어떤 FM, FE, FC와 연결되어 있는지 알 수 있음
      const fmSeq = db.failureModes.findIndex(m => m.id === fm!.id) + 1;
      const feSeq = db.failureEffects.findIndex(e => e.id === fe!.id) + 1;
      const fcSeq = db.failureCauses.findIndex(c => c.id === fc!.id) + 1;
      const linkFmeaSeq = extractFmeaSeq(oldData.fmeaId);
      const linkId = createLinkId(linkFmeaSeq, fmSeq, feSeq, fcSeq);
      
      // FM 경로에서 추출 (역전개 추적용)
      const fmParsed = parseHybridId(fm.id);
      const feParsed = parseHybridId(fe.id);
      const fcParsed = parseHybridId(fc.id);
      
      db.failureLinks.push({
        id: linkId,
        fmeaId: oldData.fmeaId,
        fmId: fm.id,
        feId: fe.id,
        fcId: fc.id,
        // ★★★ 순번 및 경로 정보 (역전개 추적용) ★★★
        fmSeq,
        feSeq,
        fcSeq,
        fmPath: fmParsed?.path || '',
        fePath: feParsed?.path || '',
        fcPath: fcParsed?.path || '',
        // ★★★ 모자관계: FM이 Link의 부모 ★★★
        parentId: fm.id,
        mergeGroupId: createMergeGroupId(linkFmeaSeq, 'LK', `FM${fmSeq.toString().padStart(3, '0')}`),
        rowSpan: 1,
        cache: {
          fmText: fm.mode,
          fmProcess: oldLink.fmProcess || '',
          feText: fe.effect || oldLink.feText || '',
          feCategory: fe.category || oldLink.feScope || '',
          feSeverity: fe.severity || oldLink.severity || 0,
          fcText: fc.cause || oldLink.fcText || '',
          fcWorkElem: oldLink.fcWorkElem || '',
          fcProcess: oldLink.fcProcess || '',
        },
      });
    } else {
      console.warn('[마이그레이션] FailureLink 스킵 (FK 불완전):', {
        hasFM: !!fm,
        hasFE: !!fe,
        hasFC: !!fc,
        fmText: oldLink.fmText?.substring(0, 20),
      });
    }
  });
  
  // 5. 확정 상태 마이그레이션
  db.confirmed = {
    structure: oldData.structureConfirmed || false,
    l1Function: oldData.l1Confirmed || false,
    l2Function: oldData.l2Confirmed || false,
    l3Function: oldData.l3Confirmed || false,
    l1Failure: oldData.failureL1Confirmed || false,
    l2Failure: oldData.failureL2Confirmed || false,
    l3Failure: oldData.failureL3Confirmed || false,
    failureLink: oldData.failureLinkConfirmed || false,
    risk: false,
    optimization: false,
  };
  
  console.log('[마이그레이션] 확정 상태:', db.confirmed);
  
  // ============ 고장분석 통합 데이터 생성 ============
  // 고장연결 확정 시 자동 생성 (역전개 기능분석 + 역전개 구조분석 포함)
  if (db.failureLinks.length > 0 && db.confirmed.failureLink) {
    try {
      db.failureAnalyses = buildFailureAnalyses(db);
      console.log('[마이그레이션] 고장분석 통합 데이터 생성:', db.failureAnalyses.length, '개');
    } catch (error) {
      console.warn('[마이그레이션] 고장분석 통합 데이터 생성 실패:', error);
      db.failureAnalyses = [];
    }
  } else {
    db.failureAnalyses = [];
  }
  
  // ============ 리스크분석 데이터 생성 ============
  // riskData를 riskAnalyses로 변환
  const riskData = (oldData as any).riskData || {};
  db.riskAnalyses = [];
  
  console.log('[마이그레이션] 리스크 데이터 변환 시작:', {
    failureLinksCount: db.failureLinks.length,
    riskDataCount: Object.keys(riskData).length,
    riskDataKeys: Object.keys(riskData).slice(0, 10),  // 처음 10개 키만 표시
  });
  
  if (Object.keys(riskData).length > 0) {
    // ★ 1. failureLinks가 있으면 fmId-fcId 기반으로 변환
    if (db.failureLinks.length > 0) {
      db.failureLinks.forEach((link, linkIdx) => {
        const uniqueKey = `${link.fmId}-${link.fcId}`;
        
        // riskData에서 SOD 값 추출
        const oKey = `risk-${uniqueKey}-O`;
        const dKey = `risk-${uniqueKey}-D`;
        const preventionKey = `prevention-${uniqueKey}`;
        const detectionKey = `detection-${uniqueKey}`;
        
        const occurrence = typeof riskData[oKey] === 'number' && riskData[oKey] >= 1 && riskData[oKey] <= 10 
          ? riskData[oKey] 
          : 0;
        const detection = typeof riskData[dKey] === 'number' && riskData[dKey] >= 1 && riskData[dKey] <= 10 
          ? riskData[dKey] 
          : 0;
        
        // 심각도는 failureLink에서 가져오거나 failureEffects에서 최대값
        let severity = 0;
        if (link.cache?.feSeverity) {
          severity = link.cache.feSeverity;
        } else {
          // failureEffects에서 해당 feId의 심각도 찾기
          const fe = db.failureEffects.find(e => e.id === link.feId);
          if (fe && fe.severity) {
            severity = fe.severity;
          }
        }
        
        const preventionControl = typeof riskData[preventionKey] === 'string' ? riskData[preventionKey] : undefined;
        const detectionControl = typeof riskData[detectionKey] === 'string' ? riskData[detectionKey] : undefined;
        
        // ★★★ 하나라도 값이 있으면 RiskAnalysis 생성 (조건 완화) ★★★
        if (severity > 0 || occurrence > 0 || detection > 0 || preventionControl || detectionControl) {
          const ap = (severity > 0 && occurrence > 0 && detection > 0) 
            ? calculateAP(severity, occurrence, detection) 
            : '';
          
          const riskAnalysis: RiskAnalysis = {
            id: uid(),
            fmeaId: db.fmeaId,
            linkId: link.id,
            severity,
            occurrence,
            detection,
            ap,
            preventionControl,
            detectionControl,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          db.riskAnalyses.push(riskAnalysis);
        }
        
        // 첫 5개 링크에 대해 디버깅 출력
        if (linkIdx < 5) {
          console.log(`[마이그레이션] 링크 ${linkIdx}: uniqueKey=${uniqueKey}, S=${severity}, O=${occurrence}, D=${detection}`);
        }
      });
    }
    
    // ★ 2. rowIndex 기반 키도 처리 (failureLinks가 없거나 rowIndex 기반 데이터가 있는 경우)
    const rowIndexPattern = /^risk-(\d+)-[OD]$/;
    const rowIndexKeys = Object.keys(riskData).filter(k => rowIndexPattern.test(k));
    
    if (rowIndexKeys.length > 0) {
      console.log('[마이그레이션] rowIndex 기반 riskData 발견:', rowIndexKeys.length, '개');
      
      // rowIndex에서 고유 인덱스 추출
      const rowIndices = new Set<number>();
      rowIndexKeys.forEach(k => {
        const match = k.match(rowIndexPattern);
        if (match) rowIndices.add(parseInt(match[1], 10));
      });
      
      rowIndices.forEach(rowIdx => {
        const oKey = `risk-${rowIdx}-O`;
        const dKey = `risk-${rowIdx}-D`;
        
        const occurrence = typeof riskData[oKey] === 'number' ? riskData[oKey] : 0;
        const detection = typeof riskData[dKey] === 'number' ? riskData[dKey] : 0;
        
        // rowIndex 기반은 severity를 직접 가져올 수 없으므로 0으로 설정
        // (실제 사용 시 failureLinks가 있어야 severity를 알 수 있음)
        if (occurrence > 0 || detection > 0) {
          // failureLinks에서 해당 rowIndex에 매칭되는 link 찾기 시도
          const matchingLink = db.failureLinks[rowIdx];
          const linkId = matchingLink?.id || `row-${rowIdx}`;
          
          // 이미 fmId-fcId 기반으로 추가된 것과 중복 방지
          const alreadyExists = db.riskAnalyses.some(r => r.linkId === linkId);
          if (!alreadyExists) {
            const riskAnalysis: RiskAnalysis = {
              id: uid(),
              fmeaId: db.fmeaId,
              linkId,
              severity: 0,
              occurrence,
              detection,
              ap: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            db.riskAnalyses.push(riskAnalysis);
          }
        }
      });
    }
    
    console.log('[마이그레이션] 리스크분석 데이터 생성:', db.riskAnalyses.length, '개');
  }
  
  console.log('[마이그레이션] 완료:', {
    l1Structure: db.l1Structure?.name,
    l2Structures: db.l2Structures.length,
    l3Structures: db.l3Structures.length,
    l1Functions: db.l1Functions.length,
    l2Functions: db.l2Functions.length,
    l3Functions: db.l3Functions.length,
    failureEffects: db.failureEffects.length,
    failureModes: db.failureModes.length,
    failureCauses: db.failureCauses.length,
    failureLinks: db.failureLinks.length,
    failureAnalyses: db.failureAnalyses.length,
    riskAnalyses: db.riskAnalyses.length,
  });
  
  return db;
}

/**
 * 원자성 DB를 기존 중첩 구조로 역변환 (하위호환용)
 */
export function convertToLegacyFormat(db: FMEAWorksheetDB): OldWorksheetData {
  const result: OldWorksheetData = {
    fmeaId: db.fmeaId,
    l1: {
      id: db.l1Structure?.id || uid(),
      name: db.l1Structure?.name || '',
      types: [],
      failureScopes: [], // 초기값으로 빈 배열 설정
    },
    l2: [],
    failureLinks: [],
    structureConfirmed: db.confirmed.structure,
    l1Confirmed: db.confirmed.l1Function,
    l2Confirmed: db.confirmed.l2Function,
    l3Confirmed: db.confirmed.l3Function,
    failureL1Confirmed: db.confirmed.l1Failure,
    failureL2Confirmed: db.confirmed.l2Failure,
    failureL3Confirmed: db.confirmed.l3Failure,
    failureLinkConfirmed: db.confirmed.failureLink,  // ✅ 고장연결 확정 상태 추가
  };
  
  console.log('[역변환] 확정 상태:', result);
  
  console.log('[역변환] 시작, failureEffects:', db.failureEffects.length, '개');
  
  // FE를 다시 failureScopes로 역변환 (요구사항 기준)
  const l1FuncMap = new Map<string, { reqName: string; category: string }>();
  db.l1Functions.forEach((f: any) => {
    l1FuncMap.set(f.id, { reqName: f.requirement, category: f.category });
  });
  const failureScopes = (db.failureEffects || []).map(fe => ({
    id: fe.id,
    reqId: fe.l1FuncId,
    requirement: l1FuncMap.get(fe.l1FuncId)?.reqName || '',
    scope: l1FuncMap.get(fe.l1FuncId)?.category || fe.category || 'Your Plant',
    effect: fe.effect,
    severity: fe.severity,
  }));
  // failureScopes 항상 설정 (빈 배열도 포함)
  (result.l1 as any).failureScopes = failureScopes;
  console.log('[역변환] failureScopes 복원:', failureScopes.length, '개');

  // L1 기능 → types 구조로 변환
  const categoryGroups = new Map<string, Map<string, L1Function[]>>();
  db.l1Functions.forEach((f: any) => {
    if (!categoryGroups.has(f.category)) {
      categoryGroups.set(f.category, new Map());
    }
    const funcGroups = categoryGroups.get(f.category)!;
    if (!funcGroups.has(f.functionName)) {
      funcGroups.set(f.functionName, []);
    }
    funcGroups.get(f.functionName)!.push(f);
  });
  
  categoryGroups.forEach((funcGroups, category) => {
    const typeObj: OldL1Type = {
      id: uid(),
      name: category,
      functions: [],
    };
    
    funcGroups.forEach((funcs, funcName) => {
      typeObj.functions.push({
        id: funcs[0]?.id || uid(),
        name: funcName,
        requirements: funcs.map(f => ({
          id: f.id,
          name: f.requirement,
        })),
      });
    });
    
    result.l1.types.push(typeObj);
  });
  
  // L2/L3 구조 → 중첩 구조로 변환
  db.l2Structures.forEach(l2 => {
    const procObj: OldProcess = {
      id: l2.id,
      no: l2.no,
      name: l2.name,
      order: l2.order,
      functions: [],
      failureModes: [],
      l3: [],
    };
    
    // L2 기능 그룹화
    const l2Funcs = db.l2Functions.filter(f => f.l2StructId === l2.id);
    const funcGroups = new Map<string, L2Function[]>();
    l2Funcs.forEach((f: any) => {
      if (!funcGroups.has(f.functionName)) {
        funcGroups.set(f.functionName, []);
      }
      funcGroups.get(f.functionName)!.push(f);
    });
    
    funcGroups.forEach((funcs, funcName) => {
      procObj.functions!.push({
        id: funcs[0]?.id || uid(),
        name: funcName,
        productChars: funcs.map(f => ({
          id: f.id,
          name: f.productChar,
          specialChar: f.specialChar,
        })),
      });
    });
    
    // FM - ✅ productCharId 복원
    const fms = db.failureModes.filter(m => m.l2StructId === l2.id);
    procObj.failureModes = fms.map(m => ({
      id: m.id,
      name: m.mode,
      sc: m.specialChar,
      productCharId: m.productCharId || '', // ✅ productCharId 복원
    }));
    
    // L3
    const l3s = db.l3Structures.filter(s => s.l2Id === l2.id);
    l3s.forEach(l3 => {
      const weObj: OldProcess['l3'][0] = {
        id: l3.id,
        m4: l3.m4,
        name: l3.name,
        order: l3.order,
        functions: [],
        failureCauses: [], // ⚠️ 빈 배열로 유지 (실제로는 proc.failureCauses에 저장됨)
      };
      
      // L3 기능 그룹화
      const l3Funcs = db.l3Functions.filter(f => f.l3StructId === l3.id);
      const l3FuncGroups = new Map<string, L3Function[]>();
      l3Funcs.forEach((f: any) => {
        if (!l3FuncGroups.has(f.functionName)) {
          l3FuncGroups.set(f.functionName, []);
        }
        l3FuncGroups.get(f.functionName)!.push(f);
      });
      
      l3FuncGroups.forEach((funcs, funcName) => {
        weObj.functions!.push({
          id: funcs[0]?.id || uid(),
          name: funcName,
          processChars: funcs.map(f => ({
            id: f.id,
            name: f.processChar,
            specialChar: f.specialChar,
          })),
        });
      });
      
      procObj.l3.push(weObj);
    });
    
    // ✅ FC는 proc.failureCauses에 저장 (l2StructId 기준으로 그룹화)
    // ✅ processCharId 직접 복원 (FailureMode의 productCharId 패턴과 동일)
    const allFcs = db.failureCauses.filter(c => c.l2StructId === l2.id);
    procObj.failureCauses = allFcs.map(fc => ({
      id: fc.id,
      name: fc.cause,
      occurrence: fc.occurrence,
      processCharId: fc.processCharId || '', // ✅ processCharId 직접 복원
    }));
    
    result.l2.push(procObj);
  });
  
  // FailureLinks 변환
  db.failureLinks.forEach((link: any) => {
    result.failureLinks!.push({
      fmId: link.fmId,
      fmText: link.cache?.fmText || '',
      fmProcess: link.cache?.fmProcess || '',
      feId: link.feId,
      feScope: link.cache?.feCategory,
      feText: link.cache?.feText,
      severity: link.cache?.feSeverity,
      fcId: link.fcId,
      fcText: link.cache?.fcText,
      fcWorkElem: link.cache?.fcWorkElem,
      fcProcess: link.cache?.fcProcess,
    });
  });
  
  return result;
}

/**
 * localStorage에서 데이터 로드 (마이그레이션 자동 적용)
 */
export function loadWorksheetDB(fmeaId: string): FMEAWorksheetDB | null {
  if (typeof window === 'undefined') return null;
  
  const keys = [`pfmea_atomic_${fmeaId}`, `pfmea_worksheet_${fmeaId}`, `fmea-worksheet-${fmeaId}`];
  
  for (const key of keys) {
    const stored = localStorage.getItem(key);
    if (!stored) continue;
    
    try {
      const parsed = JSON.parse(stored);
      
      // 이미 원자성 DB인 경우
      if (parsed.l1Structure !== undefined && parsed.l2Structures !== undefined) {
        console.log('[로드] 원자성 DB 발견:', key);
        return parsed as FMEAWorksheetDB;
      }
      
      // 기존 중첩 구조인 경우 마이그레이션
      if (parsed.l1 && parsed.l2) {
        console.log('[로드] 기존 구조 발견, 마이그레이션 수행:', key);
        const migrated = migrateToAtomicDB(parsed);
        // 마이그레이션 결과 저장
        saveWorksheetDB(migrated);
        return migrated;
      }
    } catch (e) {
      console.error('[로드] 파싱 오류:', key, e);
    }
  }
  
  console.log('[로드] 저장된 데이터 없음, 새 DB 생성');
  return createEmptyDB(fmeaId);
}

/**
 * localStorage에 원자성 DB 저장
 */
export function saveWorksheetDB(db: FMEAWorksheetDB): void {
  if (typeof window === 'undefined') return;
  
  db.savedAt = new Date().toISOString();
  const key = `pfmea_atomic_${db.fmeaId}`;
  localStorage.setItem(key, JSON.stringify(db));
  
  // 하위호환을 위해 기존 키에도 저장 (legacy format)
  const legacy = convertToLegacyFormat(db);
  localStorage.setItem(`pfmea_worksheet_${db.fmeaId}`, JSON.stringify(legacy));
  
  console.log('[저장] 원자성 DB 저장 완료:', db.fmeaId);
}

/**
 * 고장연결 확정 및 저장
 * - 자동 변환 없음! 사용자가 입력한 FK 관계만 저장
 * - 확정 상태 업데이트
 */
export function confirmFailureLink(db: FMEAWorksheetDB): FMEAWorksheetDB {
  console.log('[고장연결 확정] 시작...');
  
  // DB 복사
  const confirmedDB = { ...db };
  
  // 확정 상태 업데이트
  confirmedDB.confirmed.failureLink = true;
  
  // 저장
  saveWorksheetDB(confirmedDB);
  
  // FK 관계 기반 데이터 조회 (검증용)
  const linkedData = getLinkedDataByFK(confirmedDB);
  
  console.log('[고장연결 확정] 완료:', {
    failureLinks: confirmedDB.failureLinks.length,
    linkedRows: linkedData.rows.length,
    l1Functions: confirmedDB.l1Functions.length,
    l2Functions: confirmedDB.l2Functions.length,
    l3Functions: confirmedDB.l3Functions.length,
  });
  
  return confirmedDB;
}

