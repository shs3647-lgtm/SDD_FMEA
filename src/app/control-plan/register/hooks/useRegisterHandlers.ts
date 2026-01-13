/**
 * @file hooks/useRegisterHandlers.ts
 * @description CP 등록 핸들러 훅
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CPInfo, CPType, FmeaSelectItem, CpSelectItem, SaveStatus } from '../types';

/**
 * CP ID 생성 규칙
 * 형식: cp{YY}-{type}{NNN}
 * 예: cp26-m001, cp26-f001, cp26-p001
 * ★ 2026-01-13: 소문자로 통일 (DB 일관성, PostgreSQL 호환성)
 */
export function generateCPId(type: CPType = 'P'): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const typeChar = type.toLowerCase(); // ★ 소문자로 변환
  try {
    const stored = localStorage.getItem('cp-projects');
    if (stored) {
      const projects = JSON.parse(stored);
      const prefix = `cp${year}-${typeChar}`;
      const currentIds = projects
        .filter((p: { id: string }) => p.id?.toLowerCase().startsWith(prefix))
        .map((p: { id: string }) => {
          const match = p.id.match(/\d{3}$/);
          return match ? parseInt(match[0]) : 0;
        });
      if (currentIds.length > 0) {
        const maxSeq = Math.max(...currentIds);
        return `cp${year}-${typeChar}${(maxSeq + 1).toString().padStart(3, '0')}`;
      }
    }
  } catch (e) {
    console.error('ID 생성 중 오류:', e);
  }
  return `cp${year}-${typeChar}001`;
}

interface UseRegisterHandlersProps {
  cpInfo: CPInfo;
  setCpInfo: React.Dispatch<React.SetStateAction<CPInfo>>;
  cpId: string;
  setCpId: React.Dispatch<React.SetStateAction<string>>;
  cftMembers: any[];
  selectedParentApqp: string | null;   // ★ 상위 APQP (최상위)
  selectedParentFmea: string | null;   // 상위 FMEA
  selectedBaseCp: string | null;       // 상위 CP
  setSaveStatus: React.Dispatch<React.SetStateAction<SaveStatus>>;
  setShowMissingFields: React.Dispatch<React.SetStateAction<boolean>>;
  setAvailableFmeas: React.Dispatch<React.SetStateAction<FmeaSelectItem[]>>;
  setFmeaSelectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setFmeaSelectType: React.Dispatch<React.SetStateAction<'M' | 'F' | 'P' | 'ALL'>>;
  setAvailableCps: React.Dispatch<React.SetStateAction<CpSelectItem[]>>;
  setCpSelectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCpSelectType: React.Dispatch<React.SetStateAction<'M' | 'F' | 'P'>>;
  isEditMode?: boolean;  // 수정 모드 여부
}

export function useRegisterHandlers({
  cpInfo,
  setCpInfo,
  cpId,
  setCpId,
  cftMembers,
  selectedParentApqp,
  selectedParentFmea,
  selectedBaseCp,
  setSaveStatus,
  setShowMissingFields,
  setAvailableFmeas,
  setFmeaSelectModalOpen,
  setFmeaSelectType,
  setAvailableCps,
  setCpSelectModalOpen,
  setCpSelectType,
  isEditMode = false,
}: UseRegisterHandlersProps) {
  const router = useRouter();
  
  // CP 유형 변경 시 ID 재생성
  const handleCpTypeChange = useCallback((newType: CPType) => {
    setCpInfo(prev => ({ ...prev, cpType: newType }));
    setCpId(generateCPId(newType));
  }, [setCpInfo, setCpId]);
  
  // 필드 업데이트
  const updateField = useCallback((field: keyof CPInfo, value: string) => {
    setCpInfo(prev => ({ ...prev, [field]: value }));
  }, [setCpInfo]);
  
  // FMEA 선택 모달 열기
  const openFmeaSelectModal = useCallback(async (type: 'M' | 'F' | 'P' | 'ALL' = 'ALL') => {
    setFmeaSelectType(type);
    try {
      const res = await fetch('/api/fmea/projects');
      if (!res.ok) throw new Error('DB 로드 실패');
      
      const data = await res.json();
      const projects = data.projects || data || [];
      
      const filtered = projects
        .filter((p: any) => {
          if (type === 'ALL') return p.id !== cpId;
          const fmeaType = p.fmeaInfo?.fmeaType || p.id.match(/pfm\d{2}-([MFP])/i)?.[1] || 'P';
          return fmeaType.toLowerCase() === type.toLowerCase() && p.id !== cpId;
        })
        .map((p: any) => {
          let fmeaType = 'P';
          if (p.fmeaInfo?.fmeaType) {
            fmeaType = p.fmeaInfo.fmeaType.toLowerCase();
          } else {
            const match = p.id.match(/pfm\d{2}-([MFP])/i);
            if (match) fmeaType = match[1].toLowerCase();
          }
          return {
            id: p.id,
            subject: p.fmeaInfo?.subject || p.project?.productName || p.name || '제목 없음',
            type: fmeaType
          };
        });
      
      if (filtered.length === 0) {
        alert(type === 'ALL' ? '등록된 FMEA가 없습니다.' : `등록된 ${type} FMEA가 없습니다.`);
        return;
      }
      
      setAvailableFmeas(filtered);
      setFmeaSelectModalOpen(true);
    } catch (e) {
      console.error('FMEA 목록 로드 실패:', e);
      alert('FMEA 목록을 불러올 수 없습니다.');
    }
  }, [cpId, setAvailableFmeas, setFmeaSelectModalOpen, setFmeaSelectType]);
  
  // CP 선택 모달 열기 (기초정보용)
  const openCpSelectModal = useCallback(async (type: 'M' | 'F' | 'P') => {
    setCpSelectType(type);
    try {
      const stored = localStorage.getItem('cp-projects');
      if (!stored) {
        alert(`등록된 ${type === 'M' ? 'Master' : type === 'F' ? 'Family' : 'Part'} CP가 없습니다.`);
        return;
      }
      
      const projects = JSON.parse(stored);
      const filtered = projects
        .filter((p: any) => {
          const cpType = p.cpInfo?.cpType || p.id.match(/CP\d{2}-([MFP])/i)?.[1] || 'P';
          return cpType.toLowerCase() === type.toLowerCase() && p.id !== cpId;
        })
        .map((p: any) => ({
          id: p.id,
          subject: p.cpInfo?.subject || '제목 없음',
          type: type
        }));
      
      if (filtered.length === 0) {
        alert(`등록된 ${type === 'M' ? 'Master' : type === 'F' ? 'Family' : 'Part'} CP가 없습니다.`);
        return;
      }
      
      setAvailableCps(filtered);
      setCpSelectModalOpen(true);
    } catch (e) {
      console.error('CP 목록 로드 실패:', e);
      alert('CP 목록을 불러올 수 없습니다.');
    }
  }, [cpId, setAvailableCps, setCpSelectModalOpen, setCpSelectType]);
  
  // 저장 (DB API 호출)
  const handleSave = useCallback(async () => {
    if (!cpInfo.subject.trim()) {
      alert('CP명을 입력해주세요.');
      return;
    }

    setSaveStatus('saving');
    
    try {
      // 1. DB에 저장
      const response = await fetch('/api/control-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpNo: cpId,
          cpInfo,
          cftMembers: cftMembers.filter((m: any) => m.name), // 빈 멤버 제외
          parentApqpNo: selectedParentApqp,  // ★ 상위 APQP (최상위)
          parentFmeaId: selectedParentFmea,  // 상위 FMEA
          baseCpId: selectedBaseCp,          // 상위 CP
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'DB 저장 실패');
      }

      console.log('✅ CP DB 저장 완료:', result.cpNo);

      // 2. localStorage에도 백업 (오프라인 지원)
      const data = {
        id: cpId,
        cpInfo,
        cftMembers,
        parentApqpNo: selectedParentApqp,
        parentFmeaId: selectedParentFmea,
        baseCpId: selectedBaseCp,
        createdAt: new Date().toISOString(),
        dbSynced: true,
      };
      
      let projects = [];
      const stored = localStorage.getItem('cp-projects');
      if (stored) projects = JSON.parse(stored);
      projects = projects.filter((p: any) => p.id !== cpId);
      projects.unshift(data);
      localStorage.setItem('cp-projects', JSON.stringify(projects));
      
      // ★ 마지막 작업 CP ID 저장 (다음 방문 시 자동 로드용)
      localStorage.setItem('cp-last-edited', cpId);
      
      setSaveStatus('saved');
      setShowMissingFields(true);
      
      // ★ 저장 후 URL을 수정 모드로 업데이트 (새로고침 시 데이터 유지)
      if (!isEditMode) {
        router.replace(`/control-plan/register?id=${cpId}`);
      }
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error('저장 실패:', error);
      
      // DB 실패 시 localStorage만 저장 (폴백)
      try {
        const data = {
          id: cpId,
          cpInfo,
          cftMembers,
          parentFmeaId: selectedParentFmea,
          baseCpId: selectedBaseCp,
          createdAt: new Date().toISOString(),
          dbSynced: false,
        };
        
        let projects = [];
        const stored = localStorage.getItem('cp-projects');
        if (stored) projects = JSON.parse(stored);
        projects = projects.filter((p: any) => p.id !== cpId);
        projects.unshift(data);
        localStorage.setItem('cp-projects', JSON.stringify(projects));
        
        setSaveStatus('saved');
        alert('DB 연결 실패. 로컬에 임시 저장되었습니다.');
      } catch (localError) {
        alert('저장에 실패했습니다: ' + error.message);
        setSaveStatus('idle');
      }
    }
  }, [cpInfo, cpId, cftMembers, selectedParentFmea, selectedBaseCp, setSaveStatus, setShowMissingFields]);
  
  return {
    handleCpTypeChange,
    updateField,
    openFmeaSelectModal,
    openCpSelectModal,
    handleSave,
  };
}


