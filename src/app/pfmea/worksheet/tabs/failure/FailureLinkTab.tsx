/**
 * @file FailureLinkTab.tsx
 * @description 고장연결 탭 - FM 중심 연결 관리 (전면 재작성 버전)
 * 
 * 핵심 구조:
 * - FE(고장영향): L1.failureScopes에서 추출
 * - FM(고장형태): L2.failureModes에서 추출
 * - FC(고장원인): L3.failureCauses에서 추출
 * - 연결: FM을 중심으로 FE와 FC를 연결 (1:N 관계)
 * 
 * 데이터 구조 (정규화):
 * failureLinks: Array<{
 *   fmId: string;      // FK: L2.failureModes.id
 *   fmText: string;    // 고장형태 텍스트
 *   fmProcess: string; // 공정명
 *   feId: string;      // FK: L1.failureScopes.id (빈 문자열 가능)
 *   feText: string;    // 고장영향 텍스트
 *   feScope: string;   // 구분 (Your Plant/Ship to Plant/User)
 *   severity: number;  // 심각도
 *   fcId: string;      // FK: L3.failureCauses.id (빈 문자열 가능)
 *   fcText: string;    // 고장원인 텍스트
 *   fcProcess: string; // 공정명
 *   fcM4: string;      // 4M
 *   fcWorkElem: string;// 작업요소명
 * }>
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { FailureTabProps } from './types';
import { uid, COLORS, FONT_SIZES } from '../../constants';
import { groupFailureLinksByFM, calculateLastRowMerge } from '../../utils';
import FailureLinkTables from './FailureLinkTables';
import FailureLinkDiagram from './FailureLinkDiagram';
import FailureLinkResult from './FailureLinkResult';
import { useSVGLines } from './hooks/useSVGLines';
import { 
  containerStyle, rightPanelStyle, rightHeaderStyle, modeButtonStyle, 
  resultButtonStyle, fmeaNameStyle, actionButtonGroupStyle, actionButtonStyle
} from './FailureLinkStyles';
import { saveToAIHistory } from '@/lib/ai-recommendation';

// 타입 정의
interface FEItem { 
  id: string; 
  scope: string; 
  feNo: string; 
  text: string; 
  severity?: number; 
}

interface FMItem { 
  id: string; 
  fmNo: string; 
  processName: string; 
  text: string; 
}

interface FCItem { 
  id: string; 
  fcNo: string; 
  processName: string; 
  m4: string; 
  workElem: string; 
  text: string; 
}

interface LinkResult { 
  fmId: string; 
  feId: string; 
  feNo: string; 
  feScope: string; 
  feText: string; 
  severity: number; 
  fmText: string; 
  fmProcess: string; 
  fcId: string; 
  fcNo: string; 
  fcProcess: string; 
  fcM4: string; 
  fcWorkElem: string; 
  fcText: string; 
}

export default function FailureLinkTab({ state, setState, setDirty, saveToLocalStorage }: FailureTabProps) {
  // ========== 상태 관리 ==========
  const [currentFMId, setCurrentFMId] = useState<string | null>(null);
  const [linkedFEs, setLinkedFEs] = useState<Map<string, FEItem>>(new Map());
  const [linkedFCs, setLinkedFCs] = useState<Map<string, FCItem>>(new Map());
  const [savedLinks, setSavedLinks] = useState<LinkResult[]>([]);
  const [editMode, setEditMode] = useState<'edit' | 'confirm'>('edit');
  const [viewMode, setViewMode] = useState<'diagram' | 'result'>('diagram');
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [fcLinkScope, setFcLinkScope] = useState<'current' | 'all'>('current');
  
  // 고장연결 확정 상태
  const isConfirmed = (state as any).failureLinkConfirmed || false;
  
  // Refs
  const chainAreaRef = useRef<HTMLDivElement>(null);
  const fmNodeRef = useRef<HTMLDivElement>(null);
  const feColRef = useRef<HTMLDivElement>(null);
  const fcColRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // ========== 초기 데이터 로드 (화면 전환 시에도 항상 복원) ==========
  useEffect(() => {
    const stateLinks = (state as any).failureLinks || [];
    // ✅ 수정: isInitialLoad 조건 제거 - state.failureLinks가 있으면 항상 복원
    if (stateLinks.length > 0) {
      console.log('[FailureLinkTab] 데이터 복원: state.failureLinks →', stateLinks.length, '개');
      setSavedLinks(stateLinks);
      // ✅ 고장사슬을 기본값으로 유지 (result 화면으로 자동 전환하지 않음)
      isInitialLoad.current = false;
    }
  }, [(state as any).failureLinks]);

  // ========== FE 데이터 추출 (확정된 것만 사용 + 중복 제거) ==========
  const isL1Confirmed = state.failureL1Confirmed || false;
  
  const feData: FEItem[] = useMemo(() => {
    // ✅ 핵심: 1L 고장영향 분석이 확정되지 않으면 FE 데이터 반환 안함
    if (!isL1Confirmed) {
      console.log('[FE 데이터] 1L 고장분석 미확정 → 빈 배열 반환');
      return [];
    }
    
    const items: FEItem[] = [];
    const seen = new Set<string>(); // 구분+고장영향 조합으로 중복 체크
    const counters: Record<string, number> = { 'Your Plant': 0, 'Ship to Plant': 0, 'User': 0 };
    
    (state.l1?.failureScopes || []).forEach((fs: any) => {
      if (!fs.effect || !fs.id) return;
      
      // 구분(scope) 찾기: reqId로 type 조회
      let scope = 'Your Plant';
      if (fs.reqId) {
        (state.l1?.types || []).forEach((type: any) => {
          (type.functions || []).forEach((fn: any) => {
            (fn.requirements || []).forEach((req: any) => {
              if (req.id === fs.reqId) scope = type.name || 'Your Plant';
            });
          });
        });
      }
      
      // 중복 체크: 동일 구분 + 동일 고장영향은 하나로 통합
      const key = `${scope}|${fs.effect}`;
      if (seen.has(key)) {
        console.log('[FE 중복 제거]', scope, '-', fs.effect);
        return; // 중복이면 스킵
      }
      seen.add(key);
      
      // 번호 생성
      const prefix = scope === 'Your Plant' ? 'Y' : scope === 'Ship to Plant' ? 'S' : scope === 'User' ? 'U' : 'X';
      counters[scope] = (counters[scope] || 0) + 1;
      const feNo = `${prefix}${counters[scope]}`;
      
      items.push({ 
        id: fs.id, 
        scope, 
        feNo, 
        text: fs.effect, 
        severity: fs.severity || 0 
      });
    });
    
    console.log('[FE 데이터]', items.length, '개 (확정됨 + 중복 제거됨):', items.map(f => `${f.feNo}:${f.text.substring(0, 20)}`));
    return items;
  }, [state.l1, isL1Confirmed]);

  // ========== FM 데이터 추출 (확정된 것만 사용 + 중복 제거) ==========
  const isL2Confirmed = state.failureL2Confirmed || false;
  
  const fmData: FMItem[] = useMemo(() => {
    // ✅ 핵심: 2L 고장형태 분석이 확정되지 않으면 FM 데이터 반환 안함
    if (!isL2Confirmed) {
      console.log('[FM 데이터] 2L 고장분석 미확정 → 빈 배열 반환');
      return [];
    }
    
    const items: FMItem[] = [];
    const seen = new Set<string>(); // 공정명+고장형태 조합으로 중복 체크
    let counter = 1;
    
    (state.l2 || []).forEach((proc: any) => {
      if (!proc.name || proc.name.includes('클릭')) return;
      
      (proc.failureModes || []).forEach((fm: any) => {
        if (!fm.name || fm.name.includes('클릭') || fm.name.includes('추가')) return;
        if (!fm.id) fm.id = uid(); // ID 보장
        
        // 중복 체크: 동일 공정 + 동일 고장형태는 하나로 통합
        const key = `${proc.name}|${fm.name}`;
        if (seen.has(key)) {
          console.log('[FM 중복 제거]', proc.name, '-', fm.name);
          return; // 중복이면 스킵
        }
        seen.add(key);
        
        items.push({ 
          id: fm.id, 
          fmNo: `M${counter}`, 
          processName: proc.name, 
          text: fm.name 
        });
        counter++;
      });
    });
    
    console.log('[FM 데이터]', items.length, '개 (확정됨 + 중복 제거됨):', items.map(f => `${f.fmNo}:${f.text.substring(0, 20)}`));
    return items;
  }, [state.l2, isL2Confirmed]);

  // ========== FC 데이터 추출 (확정된 것만 사용 + 중복 제거) ==========
  const isL3Confirmed = state.failureL3Confirmed || false;
  
  const fcData: FCItem[] = useMemo(() => {
    // ✅ 핵심: 3L 고장원인 분석이 확정되지 않으면 FC 데이터 반환 안함
    if (!isL3Confirmed) {
      console.log('[FC 데이터] 3L 고장분석 미확정 → 빈 배열 반환');
      return [];
    }
    
    const items: FCItem[] = [];
    const seen = new Set<string>(); // 공정명+작업요소+고장원인 조합으로 중복 체크
    let counter = 1;
    
    (state.l2 || []).forEach((proc: any) => {
      if (!proc.name || proc.name.includes('클릭')) return;
      
      // ✅ 수정: proc.failureCauses (공정 레벨에 저장됨) 우선 확인
      // CASCADE 구조: 고장원인은 공정 레벨에 저장되고, processCharId로 공정특성과 연결됨
      const procFailureCauses = proc.failureCauses || [];
      
      if (procFailureCauses.length > 0) {
        // proc.failureCauses 사용 (새로운 CASCADE 구조)
        procFailureCauses.forEach((fc: any) => {
          if (!fc.name || fc.name.includes('클릭') || fc.name.includes('추가')) return;
          if (!fc.id) fc.id = uid();
          
          // 작업요소 정보 찾기
          let weName = '';
          let m4 = 'MN';
          (proc.l3 || []).forEach((we: any) => {
            (we.functions || []).forEach((fn: any) => {
              (fn.processChars || []).forEach((pc: any) => {
                if (pc.id === fc.processCharId) {
                  weName = we.name || '';
                  m4 = we.m4 || we.fourM || 'MN';
                }
              });
            });
          });
          
          const key = `${proc.name}|${weName}|${fc.name}`;
          if (seen.has(key)) return;
          seen.add(key);
          
          items.push({ 
            id: fc.id, 
            fcNo: `C${counter}`, 
            processName: proc.name, 
            m4, 
            workElem: weName, 
            text: fc.name 
          });
          counter++;
        });
      } else {
        // 하위호환: we.failureCauses 사용 (기존 구조)
        (proc.l3 || []).forEach((we: any) => {
          if (!we.name || we.name.includes('클릭') || we.name.includes('추가')) return;
          
          const m4 = we.m4 || we.fourM || 'MN';
          
          (we.failureCauses || []).forEach((fc: any) => {
            if (!fc.name || fc.name.includes('클릭') || fc.name.includes('추가')) return;
            if (!fc.id) fc.id = uid();
            
            const key = `${proc.name}|${we.name}|${fc.name}`;
            if (seen.has(key)) return;
            seen.add(key);
            
            items.push({ 
              id: fc.id, 
              fcNo: `C${counter}`, 
              processName: proc.name, 
              m4, 
              workElem: we.name, 
              text: fc.name 
            });
            counter++;
          });
        });
      }
    });
    
    console.log('[FC 데이터]', items.length, '개 (확정됨 + 중복 제거됨):', items.map(f => `${f.fcNo}:${f.text.substring(0, 20)}`));
    return items;
  }, [state.l2, isL3Confirmed]);

  // ========== 현재 선택된 FM ==========
  const currentFM = useMemo(() => fmData.find(f => f.id === currentFMId), [fmData, currentFMId]);

  // ========== 첫 번째 FM 자동 선택 (고장사슬 기본 표시) ==========
  useEffect(() => {
    // FM 데이터가 있고 현재 선택된 FM이 없으면 첫 번째 FM 자동 선택
    if (fmData.length > 0 && !currentFMId) {
      const firstFM = fmData[0];
      console.log('[FailureLinkTab] 첫 번째 FM 자동 선택:', firstFM.fmNo, firstFM.text);
      setCurrentFMId(firstFM.id);
      setSelectedProcess(firstFM.processName);
      setViewMode('diagram');
    }
  }, [fmData, currentFMId]);

  // ========== SVG 연결선 ==========
  const { svgPaths, drawLines } = useSVGLines(
    chainAreaRef, fmNodeRef, feColRef, fcColRef, linkedFEs, linkedFCs, currentFM
  );

  // ========== 연결 통계 계산 ==========
  const linkStats = useMemo(() => {
    // ID 기반 연결 확인 (빈 문자열 제외)
    const feLinkedIds = new Set<string>();
    const fcLinkedIds = new Set<string>();
    const fmLinkedIds = new Set<string>();
    const fmLinkCounts = new Map<string, { feCount: number; fcCount: number }>();
    
    savedLinks.forEach(link => {
      if (link.fmId) fmLinkedIds.add(link.fmId);
      if (link.feId && link.feId.trim() !== '') feLinkedIds.add(link.feId);
      if (link.fcId && link.fcId.trim() !== '') fcLinkedIds.add(link.fcId);
      
      // FM별 연결 카운트
      if (!fmLinkCounts.has(link.fmId)) {
        fmLinkCounts.set(link.fmId, { feCount: 0, fcCount: 0 });
      }
      const counts = fmLinkCounts.get(link.fmId)!;
      if (link.feId && link.feId.trim() !== '') counts.feCount++;
      if (link.fcId && link.fcId.trim() !== '') counts.fcCount++;
    });
    
    // 하위호환: 텍스트 기반 매칭
    const feLinkedTexts = new Set<string>(savedLinks.filter(l => l.feText).map(l => l.feText));
    const fcLinkedTexts = new Set<string>(savedLinks.filter(l => l.fcText).map(l => l.fcText));
    
    const feLinkedCount = feData.filter(fe => feLinkedIds.has(fe.id) || feLinkedTexts.has(fe.text)).length;
    const fcLinkedCount = fcData.filter(fc => fcLinkedIds.has(fc.id) || fcLinkedTexts.has(fc.text)).length;
    const fmLinkedCount = fmData.filter(fm => fmLinkedIds.has(fm.id)).length;
    
    return {
      feLinkedIds, feLinkedTexts, feLinkedCount, feMissingCount: feData.length - feLinkedCount,
      fcLinkedIds, fcLinkedTexts, fcLinkedCount, fcMissingCount: fcData.length - fcLinkedCount,
      fmLinkedIds, fmLinkedCount, fmMissingCount: fmData.length - fmLinkedCount,
      fmLinkCounts
    };
  }, [savedLinks, feData, fmData, fcData]);

  // ========== FM 선택 시 연결된 FE/FC 로드 ==========
  useEffect(() => {
    if (!currentFMId) {
      setLinkedFEs(new Map());
      setLinkedFCs(new Map());
      return;
    }
    
    const newFEs = new Map<string, FEItem>();
    const newFCs = new Map<string, FCItem>();
    
    savedLinks.filter(l => l.fmId === currentFMId).forEach(link => {
      // FE 로드 (ID 기반 → 텍스트 기반 폴백)
      if (link.feId && link.feId.trim() !== '') {
        const feItem = feData.find(f => f.id === link.feId) || feData.find(f => f.text === link.feText);
        if (feItem) newFEs.set(feItem.id, feItem);
      }
      
      // FC 로드 (ID 기반 → 텍스트 기반 폴백)
      if (link.fcId && link.fcId.trim() !== '') {
        const fcItem = fcData.find(f => f.id === link.fcId) || fcData.find(f => f.text === link.fcText);
        if (fcItem) newFCs.set(fcItem.id, fcItem);
      }
    });
    
    setLinkedFEs(newFEs);
    setLinkedFCs(newFCs);
    console.log('[FM 선택]', currentFMId, '→ FE:', newFEs.size, 'FC:', newFCs.size);
  }, [currentFMId, savedLinks, feData, fcData]);

  // ========== FM 선택 ==========
  const selectFM = useCallback((id: string) => {
    if (currentFMId === id) {
      // 선택 해제
      setCurrentFMId(null);
      setLinkedFEs(new Map());
      setLinkedFCs(new Map());
      setViewMode('diagram');
    } else {
      // 새로 선택
      setCurrentFMId(id);
      setViewMode('diagram');
      const fm = fmData.find(f => f.id === id);
      if (fm) setSelectedProcess(fm.processName);
    }
    setTimeout(drawLines, 50);
  }, [currentFMId, fmData, drawLines]);

  // ========== FE 토글 (연결/해제) - N:M 관계 지원 ==========
  // 하나의 FE는 여러 FM에 연결될 수 있음
  const toggleFE = useCallback((id: string) => {
    const fe = feData.find(f => f.id === id);
    if (!fe) return;
    
    // FM이 선택되지 않은 경우
    if (!currentFMId) {
      alert('⚠️ 고장형태(FM)를 먼저 선택해주세요.\n\n하나의 고장영향(FE)은 여러 고장형태(FM)에 연결될 수 있습니다.');
      return;
    }
    
    // 현재 FM과의 연결만 확인 (다른 FM과의 연결은 유지)
    const existingLink = savedLinks.find(l => l.fmId === currentFMId && l.feId === id);
    
    if (existingLink) {
      // 현재 FM과의 연결만 해제 (다른 FM과의 연결은 유지됨)
      const filtered = savedLinks.filter(l => !(l.fmId === currentFMId && l.feId === id));
      
      console.log('[FE 연결 해제]', fe.text, 'from FM:', currentFMId, '(다른 FM 연결 유지)');
      
      setSavedLinks(filtered);
      setState((prev: any) => ({ ...prev, failureLinks: filtered }));
      setDirty(true);
      requestAnimationFrame(() => saveToLocalStorage?.());
      
      setLinkedFEs(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    } else if (editMode === 'edit') {
      // 새 연결 추가 (기존 다른 FM과의 연결과 별개로 추가됨)
      setLinkedFEs(prev => {
        const next = new Map(prev);
        next.set(id, fe);
        return next;
      });
      console.log('[FE 선택]', fe.text, 'to FM:', currentFMId, '(연결확정으로 저장)');
    }
    
    setTimeout(drawLines, 50);
  }, [currentFMId, editMode, feData, savedLinks, setState, setDirty, saveToLocalStorage, drawLines]);

  // ========== FC 클릭 (연결 추가) ==========
  const toggleFC = useCallback((id: string) => {
    const fc = fcData.find(f => f.id === id);
    if (!fc) return;
    
    // FM이 선택되지 않은 경우
    if (!currentFMId) {
      alert('⚠️ 고장형태(FM)를 먼저 선택해주세요.\n\n하나의 고장원인(FC)은 여러 고장형태(FM)에 연결될 수 있습니다.');
      return;
    }
    
    // 이미 연결된 경우 - 안내 메시지
    const existingLink = savedLinks.find(l => l.fmId === currentFMId && l.fcId === id);
    if (existingLink) {
      console.log('[FC 이미 연결됨] 더블클릭으로 해제하세요:', fc.text);
      return; // 이미 연결된 경우 클릭으로는 해제 안함
    }
    
    // 편집 모드에서만 연결 추가
    if (editMode === 'edit') {
      setLinkedFCs(prev => {
        const next = new Map(prev);
        next.set(id, fc);
        return next;
      });
      console.log('[FC 선택 → 연결]', fc.text, 'to FM:', currentFMId);
    }
    
    setTimeout(drawLines, 50);
  }, [currentFMId, editMode, fcData, savedLinks, drawLines]);

  // ========== FC 더블클릭 (연결 해제) ==========
  const unlinkFC = useCallback((id: string) => {
    const fc = fcData.find(f => f.id === id);
    if (!fc) return;
    
    // FM이 선택되지 않은 경우
    if (!currentFMId) {
      alert('⚠️ 고장형태(FM)를 먼저 선택해주세요.');
      return;
    }
    
    // 현재 FM과의 연결 확인
    const existingLink = savedLinks.find(l => l.fmId === currentFMId && l.fcId === id);
    
    if (existingLink) {
      // 연결 해제
      const filtered = savedLinks.filter(l => !(l.fmId === currentFMId && l.fcId === id));
      
      console.log('[FC 연결 해제 (더블클릭)]', fc.text, 'from FM:', currentFMId);
      
      setSavedLinks(filtered);
      setState((prev: any) => ({ ...prev, failureLinks: filtered }));
      setDirty(true);
      requestAnimationFrame(() => saveToLocalStorage?.());
      
      setLinkedFCs(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      
      setTimeout(drawLines, 50);
    } else {
      // 연결되지 않은 경우 - linkedFCs에서만 제거 (아직 저장 안된 상태)
      setLinkedFCs(prev => {
        const next = new Map(prev);
        if (next.has(id)) {
          next.delete(id);
          console.log('[FC 선택 해제 (더블클릭)]', fc.text);
        }
        return next;
      });
      setTimeout(drawLines, 50);
    }
  }, [currentFMId, fcData, savedLinks, setState, setDirty, saveToLocalStorage, drawLines]);

  // ========== 연결 확정 ==========
  const confirmLink = useCallback(() => {
    if (!currentFMId || !currentFM) return;
    
    const feArray = Array.from(linkedFEs.values());
    const fcArray = Array.from(linkedFCs.values());
    
    // 검증: FE와 FC 모두 필요
    if (feArray.length === 0 && fcArray.length === 0) {
      alert('⚠️ 연결할 FE 또는 FC를 선택해주세요.');
      return;
    }
    
    // 기존 연결 제거 후 새 연결 추가
    let newLinks = savedLinks.filter(l => l.fmId !== currentFMId);
    
    // FE 연결 추가
    feArray.forEach(fe => {
      newLinks.push({
        fmId: currentFMId,
        fmText: currentFM.text,
        fmProcess: currentFM.processName,
        feId: fe.id,
        feNo: fe.feNo,
        feScope: fe.scope,
        feText: fe.text,
        severity: fe.severity || 0,
        fcId: '',
        fcNo: '',
        fcProcess: '',
        fcM4: '',
        fcWorkElem: '',
        fcText: ''
      });
    });
    
    // FC 연결 추가
    fcArray.forEach(fc => {
      newLinks.push({
        fmId: currentFMId,
        fmText: currentFM.text,
        fmProcess: currentFM.processName,
        feId: '',
        feNo: '',
        feScope: '',
        feText: '',
        severity: 0,
        fcId: fc.id,
        fcNo: fc.fcNo,
        fcProcess: fc.processName,
        fcM4: fc.m4,
        fcWorkElem: fc.workElem,
        fcText: fc.text
      });
    });
    
    console.log('[연결 확정]', currentFM.text, '→ FE:', feArray.length, 'FC:', fcArray.length, '총:', newLinks.length);
    
    setSavedLinks(newLinks);
    setState((prev: any) => ({ ...prev, failureLinks: newLinks }));
    setDirty(true);
    requestAnimationFrame(() => saveToLocalStorage?.());
    
    setViewMode('result');
    alert(`✅ ${currentFM.text} 연결 완료!\n\nFE: ${feArray.length}개, FC: ${fcArray.length}개`);
  }, [currentFMId, currentFM, linkedFEs, linkedFCs, savedLinks, setState, setDirty, saveToLocalStorage]);

  // ========== 고장연결 전체 확정 ==========
  const handleConfirmAll = useCallback(() => {
    // 모든 FM이 FE와 FC에 연결되어 있는지 확인
    const unlinkedFMs = fmData.filter(fm => {
      const counts = linkStats.fmLinkCounts.get(fm.id) || { feCount: 0, fcCount: 0 };
      return counts.feCount === 0 || counts.fcCount === 0;
    });
    
    if (unlinkedFMs.length > 0) {
      const unlinkedList = unlinkedFMs.slice(0, 5).map(fm => `  • ${fm.fmNo}: ${fm.text}`).join('\n');
      alert(`⚠️ 고장연결 확정 불가\n\n연결이 완료되지 않은 FM이 ${unlinkedFMs.length}건 있습니다:\n\n${unlinkedList}${unlinkedFMs.length > 5 ? `\n  ... 외 ${unlinkedFMs.length - 5}건` : ''}\n\n모든 FM에 FE와 FC를 연결해주세요.`);
      return;
    }
    
    setState((prev: any) => ({ ...prev, failureLinkConfirmed: true }));
    setDirty(true);
    saveToLocalStorage?.();
    
    // ===== AI 학습 데이터 저장 =====
    // 확정된 고장연결 데이터를 AI 시스템에 저장하여 학습
    try {
      savedLinks.forEach(link => {
        saveToAIHistory({
          processName: link.fmProcess || '',
          workElement: link.fcWorkElem || '',
          m4Category: link.fcM4 || '',
          categoryType: link.feScope || '',
          failureEffect: link.feText || '',
          failureMode: link.fmText || '',
          failureCause: link.fcText || '',
          severity: link.severity || 0,
          projectId: state.l1?.name || '',
        });
      });
      console.log(`[AI 학습] ${savedLinks.length}건의 고장연결 데이터가 AI 시스템에 저장되었습니다.`);
    } catch (e) {
      console.error('[AI 학습 오류]', e);
    }
    
    alert(`✅ 고장연결이 확정되었습니다!\n\nFM: ${fmData.length}개\nFE: ${linkStats.feLinkedCount}개\nFC: ${linkStats.fcLinkedCount}개\n\n🤖 AI 학습 데이터 ${savedLinks.length}건 저장됨`);
  }, [fmData, linkStats, savedLinks, state.l1, setState, setDirty, saveToLocalStorage]);

  // ========== 고장연결 수정 모드 ==========
  const handleEditMode = useCallback(() => {
    setState((prev: any) => ({ ...prev, failureLinkConfirmed: false }));
    setDirty(true);
    alert('📝 고장연결 수정 모드로 전환되었습니다.');
  }, [setState, setDirty]);

  // ========== 초기화 ==========
  const handleClearAll = useCallback(() => {
    if (!confirm('⚠️ 모든 고장연결 데이터를 초기화하시겠습니까?')) return;
    
    setSavedLinks([]);
    setLinkedFEs(new Map());
    setLinkedFCs(new Map());
    setCurrentFMId(null);
    setState((prev: any) => ({ ...prev, failureLinks: [], failureLinkConfirmed: false }));
    setDirty(true);
    saveToLocalStorage?.();
    setViewMode('diagram');
    alert('✅ 모든 고장연결이 초기화되었습니다.');
  }, [setState, setDirty, saveToLocalStorage]);

  // ========== 역전개 ==========
  const handleReverseGenerate = useCallback(() => {
    if (savedLinks.length === 0) {
      alert('⚠️ 연결된 고장이 없습니다.');
      return;
    }
    
    let msg = '📊 역전개 - FK 연결 상태\n\n';
    
    // FE-요구사항 연결 확인
    const feConnections: { fe: string; req: string | null }[] = [];
    savedLinks.filter(l => l.feId).forEach(link => {
      const fs = (state.l1?.failureScopes || []).find((f: any) => f.id === link.feId);
      let reqName: string | null = null;
      if (fs?.reqId) {
        (state.l1?.types || []).forEach((t: any) => {
          (t.functions || []).forEach((f: any) => {
            const req = (f.requirements || []).find((r: any) => r.id === fs.reqId);
            if (req) reqName = req.name;
          });
        });
      }
      if (!feConnections.some(c => c.fe === link.feText)) {
        feConnections.push({ fe: link.feText, req: reqName });
      }
    });
    
    msg += '【FE ↔ 요구사항】\n';
    feConnections.forEach(c => {
      msg += c.req ? `  ✅ ${c.fe} → ${c.req}\n` : `  ❌ ${c.fe} → (없음)\n`;
    });
    
    alert(msg);
  }, [savedLinks, state.l1]);

  // ========== 필수 분석 확정 여부 체크 ==========
  const allAnalysisConfirmed = isL1Confirmed && isL2Confirmed && isL3Confirmed;
  const missingAnalysis: string[] = [];
  if (!isL1Confirmed) missingAnalysis.push('1L 고장영향');
  if (!isL2Confirmed) missingAnalysis.push('2L 고장형태');
  if (!isL3Confirmed) missingAnalysis.push('3L 고장원인');

  // ========== 렌더링 ==========
  
  // ✅ 미확정 상태 경고 화면
  if (!allAnalysisConfirmed) {
    return (
      <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e65100' }}>
          고장분석이 완료되지 않았습니다
        </div>
        <div style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 1.8 }}>
          고장연결을 진행하려면 아래 분석을 먼저 완료하고 확정해주세요:
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {missingAnalysis.map(name => (
              <div key={name} style={{ 
                padding: '8px 20px', 
                background: '#fff3e0', 
                border: '1px solid #ffb74d', 
                borderRadius: 6, 
                color: '#e65100',
                fontWeight: 600
              }}>
                ❌ {name} 분석 미확정
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: '#999' }}>
          각 분석 탭에서 "확정" 버튼을 눌러 분석을 완료해주세요
        </div>
      </div>
    );
  }
  
  return (
    <div style={containerStyle}>
      {/* 좌측: 3개 테이블 (60%) */}
      <FailureLinkTables
        feData={feData}
        fmData={fmData}
        fcData={fcData}
        currentFMId={currentFMId}
        linkStats={linkStats}
        selectedProcess={selectedProcess}
        fcLinkScope={fcLinkScope}
        onSelectFM={selectFM}
        onToggleFE={toggleFE}
        onToggleFC={toggleFC}
        onUnlinkFC={unlinkFC}
        onProcessChange={setSelectedProcess}
        onFcScopeChange={setFcLinkScope}
      />

      {/* 우측: 토글 화면 (40%) */}
      <div style={rightPanelStyle}>
        {/* 헤더 */}
        <div style={rightHeaderStyle}>
          <button onClick={() => setViewMode('diagram')} style={modeButtonStyle(viewMode === 'diagram')}>
            고장사슬
          </button>
          
          <div className="flex-1 flex gap-1 min-w-0">
            <button onClick={() => setViewMode('result')} style={resultButtonStyle(viewMode === 'result')}>
              분석결과
            </button>
            {/* 확정 상태 배지 */}
            {isConfirmed && (
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: 4, 
                background: '#4caf50', 
                color: '#fff', 
                fontSize: 11, 
                fontWeight: 700,
                marginLeft: 4
              }}>
                ✅ 확정완료
              </span>
            )}
          </div>
          
          <div style={actionButtonGroupStyle}>
            {/* 개별 FM 연결확정 */}
            <button 
              onClick={confirmLink} 
              disabled={isConfirmed || !currentFMId || (linkedFEs.size === 0 && linkedFCs.size === 0)}
              style={actionButtonStyle({
                bg: '#2196f3', color: '#fff',
                opacity: (isConfirmed || !currentFMId || (linkedFEs.size === 0 && linkedFCs.size === 0)) ? 0.5 : 1
              })}
            >
              연결확정
            </button>
            
            {/* 전체 확정/수정 버튼 */}
            {!isConfirmed ? (
              <button 
                onClick={handleConfirmAll} 
                disabled={savedLinks.length === 0}
                style={actionButtonStyle({ 
                  bg: '#4caf50', color: '#fff', 
                  opacity: savedLinks.length === 0 ? 0.5 : 1
                })}
              >
                ✅ 전체확정
              </button>
            ) : (
              <button 
                onClick={handleEditMode}
                style={actionButtonStyle({ 
                  bg: '#ff9800', color: '#fff'
                })}
              >
                ✏️ 수정
              </button>
            )}
          </div>
        </div>
        
        {/* 콘텐츠 */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'diagram' && (
            <FailureLinkDiagram
              currentFM={currentFM}
              linkedFEs={linkedFEs}
              linkedFCs={linkedFCs}
              svgPaths={svgPaths}
              chainAreaRef={chainAreaRef}
              fmNodeRef={fmNodeRef}
              feColRef={feColRef}
              fcColRef={fcColRef}
            />
          )}
          {viewMode === 'result' && (
            <FailureLinkResult savedLinks={savedLinks} fmData={fmData} />
          )}
        </div>
      </div>
    </div>
  );
}
