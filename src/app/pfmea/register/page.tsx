/**
 * @file page.tsx
 * @description PFMEA 등록 페이지 - 표준 CFT 테이블 사용
 * @version 9.0.0
 * @created 2025-12-27
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BizInfoSelectModal } from '@/components/modals/BizInfoSelectModal';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { CFTAccessLogTable } from '@/components/tables/CFTAccessLogTable';
import { CFTRegistrationTable, CFTMember, createInitialCFTMembers } from '@/components/tables/CFTRegistrationTable';
import { BizInfoProject } from '@/types/bizinfo';
import { UserInfo } from '@/types/user';
import { CFTAccessLog } from '@/types/project-cft';
import PFMEATopNav from '@/components/layout/PFMEATopNav';
import { getAIStatus } from '@/lib/ai-recommendation';

// =====================================================
// 타입 정의
// =====================================================

/**
 * FMEA 유형 구분
 * - M: Master FMEA (마스터)
 * - F: Family FMEA (패밀리)
 * - P: Part FMEA (부품)
 */
type FMEAType = 'M' | 'F' | 'P';

interface FMEAInfo {
  companyName: string;
  engineeringLocation: string;
  customerName: string;
  modelYear: string;
  subject: string;
  fmeaStartDate: string;
  fmeaRevisionDate: string;
  fmeaProjectName: string;
  fmeaId: string;
  fmeaType: FMEAType;  // FMEA 유형 (M/F/P)
  designResponsibility: string;
  confidentialityLevel: string;
  fmeaResponsibleName: string;
}

// =====================================================
// 초기 데이터
// =====================================================
const INITIAL_FMEA: FMEAInfo = {
  companyName: '',
  engineeringLocation: '',
  customerName: '',
  modelYear: '',
  subject: '',
  fmeaStartDate: '',
  fmeaRevisionDate: '',
  fmeaProjectName: '',
  fmeaId: '',
  fmeaType: 'P',  // 기본값: Part FMEA
  designResponsibility: '',
  confidentialityLevel: '',
  fmeaResponsibleName: '',
};

/**
 * FMEA ID 생성 규칙
 * 형식: pfm{YY}-{T}{NNN}
 * - pfm: PFMEA 약어 (소문자)
 * - YY: 연도 뒤 2자리 (예: 26 = 2026년)
 * - T: 유형 구분자 (M=Master, F=Family, P=Part)
 * - NNN: 시리얼 번호 3자리 (001, 002, ...)
 * 예시: pfm26-M001 (Master), pfm26-F001 (Family), pfm26-P001 (Part)
 */
function generateFMEAId(fmeaType: FMEAType = 'P'): string {
  const year = new Date().getFullYear().toString().slice(-2);
  
  // ✅ 기존 프로젝트에서 해당 유형의 최대 ID 찾아서 순차 증가
  try {
    const stored = localStorage.getItem('pfmea-projects');
    if (stored) {
      const projects = JSON.parse(stored);
      // 해당 연도 + 유형의 ID 찾기 (예: PFM26-M, PFM26-F, PFM26-P)
      const prefix = `PFM${year}-${fmeaType}`.toUpperCase();
      const currentTypeIds = projects
        .filter((p: { id: string }) => p.id?.toUpperCase().startsWith(prefix))
        .map((p: { id: string }) => {
          // pfm26-M001 -> 001 추출
          const match = p.id.match(/\d{3}$/);
          return match ? parseInt(match[0]) : 0;
        });
      
      if (currentTypeIds.length > 0) {
        const maxSeq = Math.max(...currentTypeIds);
        return `PFM${year}-${fmeaType}${(maxSeq + 1).toString().padStart(3, '0')}`;
      }
    }
  } catch (e) {
    console.error('ID 생성 중 오류:', e);
  }
  
  return `pfm${year}-${fmeaType}001`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
function PFMEARegisterPageContent() {
  const searchParams = useSearchParams();
  // ✅ FMEA ID는 항상 대문자로 정규화 (DB, localStorage 일관성 보장)
  const editId = searchParams.get('id')?.toUpperCase() || null; // 수정 모드일 때 ID
  const isEditMode = !!editId;

  const [fmeaInfo, setFmeaInfo] = useState<FMEAInfo>(INITIAL_FMEA);
  const [cftMembers, setCftMembers] = useState<CFTMember[]>(createInitialCFTMembers());
  const [fmeaId, setFmeaId] = useState('');
  
  // 모달 상태
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [userModalTarget, setUserModalTarget] = useState<'responsible' | 'cft'>('cft');
  
  // FMEA 선택 모달 상태
  const [fmeaSelectModalOpen, setFmeaSelectModalOpen] = useState(false);
  const [fmeaSelectType, setFmeaSelectType] = useState<'M' | 'F' | 'P' | 'ALL'>('M');
  const [availableFmeas, setAvailableFmeas] = useState<Array<{id: string; subject: string; type: string}>>([]);
  const [selectedBaseFmea, setSelectedBaseFmea] = useState<string | null>(null);
  
  // 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [cftSaveStatus, setCftSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  // 미입력 필드 표시 여부 (저장 후에만 표시)
  const [showMissingFields, setShowMissingFields] = useState(false);
  
  // FMEA 선택 모달 열기 (DB에서 로드)
  const openFmeaSelectModal = async (type: 'M' | 'F' | 'P' | 'ALL') => {
    try {
      // DB에서 FMEA 프로젝트 목록 가져오기
      const res = await fetch('/api/fmea/projects');
      if (!res.ok) throw new Error('DB 로드 실패');
      
      const data = await res.json();
      const projects = data.projects || data || [];
      
      // 타입별 필터링 (ALL이면 현재 자신 제외한 모든 FMEA, 아니면 타입별 필터링)
      let filtered: Array<{id: string; subject: string; type: string}>;
      
      if (type === 'ALL') {
        // 자신을 제외한 모든 FMEA
        filtered = projects
          .filter((p: any) => p.id !== fmeaId)  // 자신 제외
          .map((p: any) => {
            // 타입 추출
            let fmeaType = 'P';
            if (p.fmeaType) {
              fmeaType = p.fmeaType.toUpperCase();
            } else {
              const match = p.id.match(/pfm\d{2}-([MFP])/i);
              if (match) fmeaType = match[1].toUpperCase();
            }
            return {
              id: p.id,
              subject: p.fmeaInfo?.subject || p.project?.productName || p.name || '제목 없음',
              type: fmeaType
            };
          });
      } else {
        // 타입별 필터링 (fmeaType 필드 우선 사용)
        filtered = projects.filter((p: any) => {
          // fmeaType 필드가 있으면 사용
          if (p.fmeaType) {
            return p.fmeaType.toUpperCase() === type;
          }
          // 없으면 ID에서 추출
          const match = p.id.match(/pfm\d{2}-([MFP])/i);
          return match && match[1].toUpperCase() === type;
        }).map((p: any) => ({
          id: p.id,
          subject: p.fmeaInfo?.subject || p.project?.productName || p.name || '제목 없음',
          type: type
        }));
      }
      
      console.log(`[FMEA 선택] 타입: ${type}, 필터링 결과:`, filtered);
      
      // FMEA 리스트가 없으면 자신 ID를 상위 FMEA로 설정
      if (filtered.length === 0) {
        if (type === 'ALL') {
          // 상위 FMEA 선택 시 리스트가 없으면 자신 ID 입력
          setSelectedBaseFmea(fmeaId);
          setShowMissingFields(false);
          console.log('[상위 FMEA] 리스트 없음, 자신 ID로 설정:', fmeaId);
          return;
        } else {
          alert(`등록된 ${type === 'M' ? 'Master' : type === 'F' ? 'Family' : 'Part'} FMEA가 없습니다.`);
          return;
        }
      }
      
      setAvailableFmeas(filtered);
      setFmeaSelectType(type);
      setFmeaSelectModalOpen(true);
    } catch (e) {
      console.error('FMEA 목록 로드 실패:', e);
      // 에러 발생 시에도 자신 ID로 설정
      if (type === 'ALL') {
        setSelectedBaseFmea(fmeaId);
        setShowMissingFields(false);
        console.log('[상위 FMEA] 로드 실패, 자신 ID로 설정:', fmeaId);
      } else {
        alert('FMEA 목록을 불러올 수 없습니다. DB 연결을 확인하세요.');
      }
    }
  };
  
  // FMEA 선택 완료
  const handleFmeaSelect = (selectedId: string) => {
    setSelectedBaseFmea(selectedId);
    setFmeaSelectModalOpen(false);
    // 선택한 FMEA 기반으로 워크시트 이동
    window.location.href = `/pfmea/worksheet?id=${fmeaId}&baseId=${selectedId}&mode=inherit`;
  };

  // ✅ 초기화 및 수정 모드 데이터 로드 - DB API 우선, localStorage 폴백
  useEffect(() => {
    const loadProjectData = async () => {
      const targetId = isEditMode && editId ? editId : null;
      
      if (targetId) {
        // ========== 수정 모드: DB API에서 데이터 로드 ==========
        console.log('[PFMEA 등록] 수정 모드 - DB에서 로드 시도:', targetId);
        
        try {
          // 1. DB API 호출
          const res = await fetch(`/api/fmea/projects?id=${targetId}`);
          if (res.ok) {
            const data = await res.json();
            const project = data.projects?.find((p: any) => p.id === targetId);
            
            if (project) {
              console.log('[PFMEA 등록] ✅ DB에서 프로젝트 로드 성공:', project.id);
              setFmeaId(project.id);
              
              // DB 데이터를 등록화면 형식으로 변환
              const dbFmeaInfo: FMEAInfo = {
                companyName: project.project?.customer || project.fmeaInfo?.companyName || '',
                engineeringLocation: project.fmeaInfo?.engineeringLocation || '',
                customerName: project.project?.customer || project.fmeaInfo?.customerName || '',
                modelYear: project.fmeaInfo?.modelYear || '',
                subject: project.fmeaInfo?.subject || project.project?.projectName || '',
                fmeaStartDate: project.fmeaInfo?.fmeaStartDate || '',
                fmeaRevisionDate: project.fmeaInfo?.fmeaRevisionDate || '',
                fmeaProjectName: project.project?.projectName || '',
                fmeaId: project.id,
                fmeaType: (project.fmeaType || 'P') as FMEAType,
                designResponsibility: project.fmeaInfo?.designResponsibility || '',
                confidentialityLevel: project.fmeaInfo?.confidentialityLevel || '',
                fmeaResponsibleName: project.fmeaInfo?.fmeaResponsibleName || '',
              };
              setFmeaInfo(dbFmeaInfo);
              
              // CFT 멤버 로드
              if (project.cftMembers && project.cftMembers.length > 0) {
                setCftMembers(project.cftMembers);
              }
              
              // ✅ 상위 FMEA 로드
              if (project.parentFmeaId) {
                setSelectedBaseFmea(project.parentFmeaId);
                console.log('[PFMEA 등록] 상위 FMEA 로드:', project.parentFmeaId);
              }
              
              // localStorage에도 동기화 (캐시)
              syncToLocalStorage(project.id, dbFmeaInfo, project.cftMembers || []);
              return; // DB에서 성공적으로 로드됨
            }
          }
        } catch (e) {
          console.warn('[PFMEA 등록] DB 로드 실패, localStorage 폴백:', e);
        }
        
        // 2. DB 실패 시 localStorage 폴백
        const storedProjects = localStorage.getItem('pfmea-projects');
        if (storedProjects) {
          try {
            const projects = JSON.parse(storedProjects);
            const existingProject = projects.find((p: { id: string }) => p.id === targetId);
            if (existingProject) {
              console.log('[PFMEA 등록] localStorage에서 로드:', targetId);
              setFmeaId(existingProject.id);
              if (existingProject.fmeaInfo) {
                setFmeaInfo(existingProject.fmeaInfo);
              }
              if (existingProject.cftMembers && existingProject.cftMembers.length > 0) {
                setCftMembers(existingProject.cftMembers);
              }
            }
          } catch (e) {
            console.error('localStorage 로드 실패:', e);
          }
        }
      } else {
        // ========== 신규 등록 모드 ==========
        // DB에서 최근 프로젝트 확인
        try {
          const res = await fetch('/api/fmea/projects');
          if (res.ok) {
            const data = await res.json();
            if (data.projects && data.projects.length > 0) {
              const lastProject = data.projects[0];
              console.log('[PFMEA 등록] DB에서 최근 프로젝트 로드:', lastProject.id);
              setFmeaId(lastProject.id);
              
              const dbFmeaInfo: FMEAInfo = {
                companyName: lastProject.project?.customer || '',
                engineeringLocation: lastProject.fmeaInfo?.engineeringLocation || '',
                customerName: lastProject.project?.customer || '',
                modelYear: lastProject.fmeaInfo?.modelYear || '',
                subject: lastProject.fmeaInfo?.subject || lastProject.project?.projectName || '',
                fmeaStartDate: lastProject.fmeaInfo?.fmeaStartDate || '',
                fmeaRevisionDate: lastProject.fmeaInfo?.fmeaRevisionDate || '',
                fmeaProjectName: lastProject.project?.projectName || '',
                fmeaId: lastProject.id,
                fmeaType: (lastProject.fmeaType || 'P') as FMEAType,
                designResponsibility: lastProject.fmeaInfo?.designResponsibility || '',
                confidentialityLevel: lastProject.fmeaInfo?.confidentialityLevel || '',
                fmeaResponsibleName: lastProject.fmeaInfo?.fmeaResponsibleName || '',
              };
              setFmeaInfo(dbFmeaInfo);
              
              if (lastProject.cftMembers && lastProject.cftMembers.length > 0) {
                setCftMembers(lastProject.cftMembers);
              }
              
              syncToLocalStorage(lastProject.id, dbFmeaInfo, lastProject.cftMembers || []);
              return;
            }
          }
        } catch (e) {
          console.warn('[PFMEA 등록] DB 조회 실패:', e);
        }
        
        // DB에 프로젝트 없으면 localStorage 확인
        const storedProjects = localStorage.getItem('pfmea-projects');
        if (storedProjects) {
          try {
            const projects = JSON.parse(storedProjects);
            if (projects.length > 0) {
              const lastProject = projects[0];
              setFmeaId(lastProject.id);
              if (lastProject.fmeaInfo) {
                setFmeaInfo(lastProject.fmeaInfo);
              }
              if (lastProject.cftMembers && lastProject.cftMembers.length > 0) {
                setCftMembers(lastProject.cftMembers);
              }
              console.log('[PFMEA 등록] localStorage에서 최근 프로젝트 로드:', lastProject.id);
              return;
            }
          } catch (e) {
            console.error('localStorage 로드 실패:', e);
          }
        }
        
        // 아무 데이터도 없으면 새 ID 생성
        setFmeaId(generateFMEAId());
      }
    };
    
    // localStorage 동기화 헬퍼
    const syncToLocalStorage = (id: string, info: FMEAInfo, cft: CFTMember[]) => {
      try {
        let projects = [];
        const stored = localStorage.getItem('pfmea-projects');
        if (stored) projects = JSON.parse(stored);
        projects = projects.filter((p: any) => p.id !== id);
        projects.unshift({ id, fmeaInfo: info, cftMembers: cft, updatedAt: new Date().toISOString() });
        localStorage.setItem('pfmea-projects', JSON.stringify(projects));
      } catch (e) {
        console.error('localStorage 동기화 실패:', e);
      }
    };
    
    loadProjectData();
    
    // URL 해시가 있으면 해당 섹션으로 스크롤 (CFT 섹션 등)
    if (typeof window !== 'undefined' && window.location.hash) {
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [isEditMode, editId]);

  // ✅ 새로 등록 - 초기화 후 새 ID 생성
  const handleNewRegister = () => {
    if (confirm('새로운 FMEA를 등록하시겠습니까?\n현재 화면의 내용은 초기화됩니다.')) {
      setFmeaInfo(INITIAL_FMEA);
      setCftMembers(createInitialCFTMembers());
      setFmeaId(generateFMEAId());
      localStorage.removeItem('pfmea-register-draft');
    }
  };

  // 필드 업데이트
  const updateField = (field: keyof FMEAInfo, value: string) => {
    setFmeaInfo(prev => ({ ...prev, [field]: value }));
  };

  // 기초정보 선택
  const handleBizInfoSelect = (info: BizInfoProject) => {
    setFmeaInfo(prev => ({
      ...prev,
      companyName: info.customerName || '',
      customerName: info.customerName || '',
      modelYear: info.modelYear || '',
      fmeaProjectName: info.program || '',
      // ✅ FMEA명(subject)은 기존 값이 있으면 유지, 없으면 기초정보에서 가져옴
      subject: prev.subject?.trim() ? prev.subject : (info.productName || ''),
    }));
    setBizInfoModalOpen(false);
  };

  // 사용자 선택
  const handleUserSelect = (user: UserInfo) => {
    if (userModalTarget === 'responsible') {
      setFmeaInfo(prev => ({
        ...prev,
        fmeaResponsibleName: user.name || '',
        designResponsibility: user.department || '',
      }));
    } else if (selectedMemberIndex !== null) {
      const updated = [...cftMembers];
      updated[selectedMemberIndex] = {
        ...updated[selectedMemberIndex],
        name: user.name || '',
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
        email: user.email || '',
      };
      setCftMembers(updated);
    }
    setUserModalOpen(false);
    setSelectedMemberIndex(null);
  };

  // CFT 사용자 검색
  const handleCftUserSearch = (index: number) => {
    setSelectedMemberIndex(index);
    setUserModalTarget('cft');
    setUserModalOpen(true);
  };

  // CFT 저장
  const handleCftSave = () => {
    localStorage.setItem('pfmea-cft-data', JSON.stringify(cftMembers));
    setCftSaveStatus('saved');
    setShowMissingFields(false);  // CFT 저장 시 미입력 표시 숨김
    setTimeout(() => setCftSaveStatus('idle'), 3000);
  };

  // CFT 초기화
  const handleCftReset = () => {
    if (confirm('CFT 목록을 초기화하시겠습니까?')) {
      localStorage.removeItem('pfmea-cft-data');
      setCftMembers(createInitialCFTMembers());
    }
  };

  // 저장 (신규 등록 또는 수정) - DB API 호출
  const handleSave = async () => {
    if (!fmeaInfo.subject.trim()) {
      alert('FMEA명을 입력해주세요.');
      return;
    }

    setSaveStatus('saving' as any);
    
    try {
      const projectData = {
        projectName: fmeaInfo.fmeaProjectName || fmeaInfo.subject,
        customer: fmeaInfo.customerName,
        productName: fmeaInfo.subject,
        partNo: '',
        department: fmeaInfo.designResponsibility,
        leader: fmeaInfo.fmeaResponsibleName,
        startDate: fmeaInfo.fmeaStartDate,
        endDate: '',
      };
      
      // ✅ fmeaInfo 객체에 모든 필드 명시적으로 포함
      const fmeaInfoToSave = {
        companyName: fmeaInfo.companyName || '',
        engineeringLocation: fmeaInfo.engineeringLocation || '',
        customerName: fmeaInfo.customerName || '',
        modelYear: fmeaInfo.modelYear || '',
        subject: fmeaInfo.subject || '',
        fmeaStartDate: fmeaInfo.fmeaStartDate || '',
        fmeaRevisionDate: fmeaInfo.fmeaRevisionDate || '',
        fmeaProjectName: fmeaInfo.fmeaProjectName || '',
        fmeaId: fmeaId,
        fmeaType: fmeaInfo.fmeaType || 'P',
        designResponsibility: fmeaInfo.designResponsibility || '',
        confidentialityLevel: fmeaInfo.confidentialityLevel || '',
        fmeaResponsibleName: fmeaInfo.fmeaResponsibleName || '',
      };
      
      console.log('[PFMEA 등록] 저장할 fmeaInfo:', fmeaInfoToSave);
      console.log('[PFMEA 등록] 저장할 CFT 멤버:', cftMembers);
      
      // ✅ parentFmeaId 결정: 선택된 상위 FMEA 또는 Master는 본인 ID
      const actualFmeaType = fmeaInfo.fmeaType || 'P';
      const parentId = selectedBaseFmea || (actualFmeaType === 'M' ? fmeaId : null);
      const parentType = selectedBaseFmea 
        ? (selectedBaseFmea.match(/PFM\d{2}-([MFP])/i)?.[1]?.toUpperCase() || 'M')
        : (actualFmeaType === 'M' ? 'M' : null);
      
      console.log('[PFMEA 등록] 상위 FMEA 저장:', { parentFmeaId: parentId, parentFmeaType: parentType });
      
      // 1. DB에 프로젝트 생성/수정 (CFT 멤버 + 상위 FMEA 포함)
      const response = await fetch('/api/fmea/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fmeaId,
          fmeaType: fmeaInfo.fmeaType,
          project: projectData,
          fmeaInfo: fmeaInfoToSave,  // ✅ 모든 필드 포함
          cftMembers,  // ✅ CFT 멤버도 DB에 저장
          parentFmeaId: parentId,  // ✅ 상위 FMEA ID 저장
          parentFmeaType: parentType,  // ✅ 상위 FMEA 유형 저장
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '저장 실패');
      }
      
      // 2. localStorage에도 백업 저장
      const existing = JSON.parse(localStorage.getItem('pfmea-projects') || '[]');
      const data = { 
        id: fmeaId, 
        project: projectData,
        fmeaInfo,
        cftMembers, 
        createdAt: new Date().toISOString(),
        status: 'active',
        step: 1,
        revisionNo: 'Rev.00',
      };
      
      const existingIndex = existing.findIndex((p: any) => p.id === fmeaId);
      if (existingIndex >= 0) {
        existing[existingIndex] = { ...existing[existingIndex], ...data, updatedAt: new Date().toISOString() };
      } else {
        existing.unshift(data);
      }
      localStorage.setItem('pfmea-projects', JSON.stringify(existing));
      
      // 3. 저장 완료 이벤트 발생
      window.dispatchEvent(new Event('fmea-projects-updated'));
      
      // 4. iframe인 경우 부모 창에 저장 완료 메시지 전송
      if (window.parent !== window) {
        window.parent.postMessage('fmea-saved', '*');
      }
      
      setSaveStatus('saved');
      setShowMissingFields(true);  // ✅ 저장 후 미입력 필드 표시 활성화
      console.log('✅ FMEA DB 저장 완료:', fmeaId);
      
      setTimeout(() => {
        setSaveStatus('idle');
        window.location.href = '/pfmea/list';
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ FMEA 저장 실패:', error);
      alert('저장에 실패했습니다: ' + error.message);
      setSaveStatus('idle');
    }
  };

  // 새로고침 (새로 등록과 동일)
  const handleRefresh = handleNewRegister;

  // CFT 접속 로그
  const [accessLogs] = useState<CFTAccessLog[]>([
    { id: 1, projectId: fmeaId, userName: '김철수', loginTime: '2025-12-26 09:00', logoutTime: '2025-12-26 12:30', action: '수정', itemType: 'PFMEA', cellAddress: 'A1:B5', description: 'PFMEA 프로젝트 정보 수정' },
    { id: 2, projectId: fmeaId, userName: '이영희', loginTime: '2025-12-26 10:15', logoutTime: '2025-12-26 11:45', action: '추가', itemType: 'CFT', cellAddress: 'C3', description: 'CFT 팀원 추가' },
    { id: 3, projectId: fmeaId, userName: '박지민', loginTime: '2025-12-26 14:00', logoutTime: null, action: '수정', itemType: 'PFMEA', cellAddress: 'D10:F15', description: '고장형태 분석 업데이트' },
  ]);

  // AI 상태 조회
  const [aiStatus, setAiStatus] = useState<{ historyCount: number; isReady: boolean; stats: { uniqueModes: number; uniqueCauses: number; uniqueEffects: number } } | null>(null);
  
  useEffect(() => {
    // 클라이언트에서만 AI 상태 조회
    if (typeof window !== 'undefined') {
      setAiStatus(getAIStatus());
    }
  }, []);

  // 테이블 셀 스타일
  const headerCell = "bg-[#00587a] text-white px-2 py-1.5 border border-white font-semibold text-xs text-center align-middle";
  const inputCell = "border border-gray-300 px-1 py-0.5";
  const yellowCell = "bg-yellow-100";

  // CFT 멤버 이름 목록 (상호기능팀용)
  const cftNames = cftMembers.filter(m => m.name).map(m => m.name).join(', ');

  return (
    <>
      {/* 상단 고정 바로가기 메뉴 */}
      <PFMEATopNav selectedFmeaId={fmeaId} />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isEditMode ? '✏️' : '📝'}</span>
            <h1 className="text-sm font-bold text-gray-800">P-FMEA {isEditMode ? '수정' : '등록'}</h1>
            <span className="text-xs text-gray-500 ml-2">ID: {fmeaId?.toUpperCase()}</span>
            {isEditMode && <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded font-bold">수정모드</span>}
          </div>
        <div className="flex gap-2">
          <button onClick={handleNewRegister} className="px-3 py-1.5 bg-green-100 border border-green-400 text-green-700 text-xs rounded hover:bg-green-200 font-semibold">
            ➕ 새로 등록
          </button>
          <button 
            onClick={handleSave}
            className={`px-4 py-1.5 text-xs font-bold rounded ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-[#1976d2] text-white hover:bg-[#1565c0]'}`}
          >
            {saveStatus === 'saved' ? '✓ 저장됨' : '💾 저장'}
          </button>
        </div>
      </div>

      {/* ===== 기획 및 준비 (1단계) ===== */}
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      <div className="bg-white rounded border border-gray-300 mb-3">
        <div className="bg-[#e3f2fd] px-3 py-1.5 border-b border-gray-300">
          <h2 className="text-xs font-bold text-gray-700">기획 및 준비 (1단계)</h2>
        </div>
        
        <table className="w-full border-collapse text-xs">
          <tbody>
            {/* 1행 - 파란색 (총 100%) */}
            <tr className="bg-[#e3f2fd] h-8">
              <td className={`${headerCell} w-[11%] whitespace-nowrap`}>회사 명</td>
              <td className={`${inputCell} w-[14%] relative`}>
                {showMissingFields && !fmeaInfo.companyName && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">
                    미입력
                  </span>
                )}
                <input 
                  type="text" 
                  name="fmea-company-name-x1" 
                  autoComplete="new-password" 
                  data-lpignore="true" 
                  data-form-type="other" 
                  value={fmeaInfo.companyName} 
                  onChange={(e) => {
                    updateField('companyName', e.target.value);
                    setShowMissingFields(false);  // 입력 시 미입력 표시 숨김
                  }}
                  className={`w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400 ${showMissingFields && !fmeaInfo.companyName ? 'text-transparent' : ''}`}
                  placeholder="공정 FMEA에 책임이 있는 회사 명" 
                />
              </td>
              <td className={`${headerCell} w-[7%] whitespace-nowrap`}>FMEA명</td>
              <td className={`${inputCell} w-[23%] relative`}>
                {showMissingFields && !fmeaInfo.subject && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">
                    미입력
                  </span>
                )}
                <input 
                  type="text" 
                  name="fmea-subject-x1" 
                  autoComplete="new-password" 
                  data-lpignore="true" 
                  data-form-type="other" 
                  value={fmeaInfo.subject} 
                  onChange={(e) => {
                    updateField('subject', e.target.value);
                    setShowMissingFields(false);
                  }}
                  className={`w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400 ${showMissingFields && !fmeaInfo.subject ? 'text-transparent' : ''}`}
                  placeholder="시스템, 서브시스템 및/또는 구성품" 
                />
              </td>
              <td className={`${headerCell} w-[7%] whitespace-nowrap`}>FMEA ID</td>
              <td className={`${inputCell} w-[10%]`}>
                <span className="px-2 text-xs font-semibold text-blue-600">{fmeaId?.toUpperCase()}</span>
              </td>
              <td className={`${headerCell} w-[8%] whitespace-nowrap`}>상위 FMEA</td>
              <td 
                className={`${inputCell} w-[20%] cursor-pointer hover:bg-gray-100 relative`}
                onClick={() => openFmeaSelectModal('ALL')}
                title="상위 FMEA 선택 (클릭하여 FMEA 리스트 보기)"
              >
                {selectedBaseFmea ? (
                  <div className="flex items-center gap-1 px-2">
                      <span className="px-1 py-0 rounded text-[9px] font-bold text-white bg-purple-500">
                      {selectedBaseFmea?.toUpperCase().match(/PFM\d{2}-([MFP])/)?.[1] || 'M'}
                    </span>
                    <span className="text-xs font-semibold text-purple-600">{selectedBaseFmea?.toUpperCase()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFmeaSelectModal('ALL');
                      }}
                      className="ml-1 text-blue-500 hover:text-blue-700 text-[10px]"
                      title="FMEA 리스트 보기"
                    >
                      🔍
                    </button>
                  </div>
                ) : (
                  <span className={`px-2 text-xs ${showMissingFields ? 'text-orange-400' : 'text-gray-400'}`}>
                    {showMissingFields ? '미입력 (클릭하여 선택)' : '- (클릭하여 선택)'}
                  </span>
                )}
              </td>
            </tr>
            
            {/* 2행 - 흰색 */}
            <tr className="bg-white h-8">
              <td className={`${headerCell} whitespace-nowrap`}>엔지니어링 위치</td>
              <td className={`${inputCell} relative`}>
                {showMissingFields && !fmeaInfo.engineeringLocation && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">
                    미입력
                  </span>
                )}
                <input 
                  type="text" 
                  name="fmea-location-x1" 
                  autoComplete="new-password" 
                  data-lpignore="true" 
                  data-form-type="other" 
                  value={fmeaInfo.engineeringLocation} 
                  onChange={(e) => {
                    updateField('engineeringLocation', e.target.value);
                    setShowMissingFields(false);
                  }}
                  className={`w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400 ${showMissingFields && !fmeaInfo.engineeringLocation ? 'text-transparent' : ''}`}
                  placeholder="지리적 위치" 
                />
              </td>
              <td className={`${headerCell} whitespace-nowrap`}>시작 일자</td>
              <td className={`${inputCell} relative`}>
                {showMissingFields && !fmeaInfo.fmeaStartDate && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none z-10">
                    미입력
                  </span>
                )}
                <input 
                  type="date" 
                  name="fmea-start-date-x1" 
                  autoComplete="new-password" 
                  value={fmeaInfo.fmeaStartDate} 
                  onChange={(e) => {
                    updateField('fmeaStartDate', e.target.value);
                    setShowMissingFields(false);
                  }}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none"
                />
              </td>
              <td className={`${headerCell} whitespace-nowrap`}>공정 책임</td>
              <td className={`${inputCell}`} colSpan={3}>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {showMissingFields && !fmeaInfo.designResponsibility && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">
                        미입력
                      </span>
                    )}
                    <input 
                      type="text" 
                      name="fmea-dept-x1" 
                      autoComplete="new-password" 
                      data-lpignore="true" 
                      data-form-type="other" 
                      value={fmeaInfo.designResponsibility} 
                      onChange={(e) => {
                        updateField('designResponsibility', e.target.value);
                        setShowMissingFields(false);
                      }}
                      className={`w-24 h-7 px-2 text-xs border border-gray-300 rounded bg-transparent focus:outline-none placeholder:text-gray-400 ${showMissingFields && !fmeaInfo.designResponsibility ? 'text-transparent' : ''}`}
                      placeholder="부서" 
                    />
                  </div>
                  <div className="relative flex-1">
                    {showMissingFields && !fmeaInfo.fmeaResponsibleName && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">
                        미입력
                      </span>
                    )}
                    <input 
                      type="text" 
                      name="fmea-responsible-x1" 
                      autoComplete="new-password" 
                      data-lpignore="true" 
                      data-form-type="other" 
                      value={fmeaInfo.fmeaResponsibleName} 
                      onChange={(e) => {
                        updateField('fmeaResponsibleName', e.target.value);
                        setShowMissingFields(false);
                      }}
                      className={`flex-1 h-7 px-2 text-xs border border-gray-300 rounded bg-transparent focus:outline-none placeholder:text-gray-400 ${showMissingFields && !fmeaInfo.fmeaResponsibleName ? 'text-transparent' : ''}`}
                      placeholder="책임자 성명" 
                    />
                  </div>
                  <button onClick={() => { setUserModalTarget('responsible'); setUserModalOpen(true); }} className="text-blue-500 hover:text-blue-700 px-1">🔍</button>
                </div>
              </td>
            </tr>
            
            {/* 3행 - 파란색 */}
            <tr className="bg-[#e3f2fd] h-8">
              <td className={`${headerCell} whitespace-nowrap`}>고객 명</td>
              <td className={`${inputCell} relative`}>
                {showMissingFields && !fmeaInfo.customerName && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">
                    미입력
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <input 
                    type="text" 
                    name="fmea-customer-x1" 
                    autoComplete="new-password" 
                    data-lpignore="true" 
                    data-form-type="other" 
                    value={fmeaInfo.customerName} 
                    onChange={(e) => {
                      updateField('customerName', e.target.value);
                      setShowMissingFields(false);
                    }}
                    className={`flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400 ${showMissingFields && !fmeaInfo.customerName ? 'text-transparent' : ''}`}
                    placeholder="고객(들) 또는 제품 패밀리 명" 
                  />
                  <button onClick={() => setBizInfoModalOpen(true)} className="text-blue-500 hover:text-blue-700" title="고객정보 검색">🔍</button>
                </div>
              </td>
              <td className={`${headerCell} whitespace-nowrap`}>개정 일자</td>
              <td className={`${inputCell} relative`}>
                {showMissingFields && !fmeaInfo.fmeaRevisionDate && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none z-10">
                    미입력
                  </span>
                )}
                <input 
                  type="date" 
                  name="fmea-revision-date-x1" 
                  autoComplete="new-password" 
                  value={fmeaInfo.fmeaRevisionDate} 
                  onChange={(e) => {
                    updateField('fmeaRevisionDate', e.target.value);
                    setShowMissingFields(false);
                  }}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none"
                />
              </td>
              <td className={`${headerCell} whitespace-nowrap`}>기밀유지 수준</td>
              <td className={`${inputCell} relative`} colSpan={3}>
                {showMissingFields && !fmeaInfo.confidentialityLevel && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none z-10">
                    미입력
                  </span>
                )}
                <select 
                  value={fmeaInfo.confidentialityLevel} 
                  onChange={(e) => {
                    updateField('confidentialityLevel', e.target.value);
                    setShowMissingFields(false);
                  }}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-600"
                >
                  <option value="">선택</option>
                  <option value="사업용도">사업용도</option>
                  <option value="독점">독점</option>
                  <option value="기밀">기밀</option>
                </select>
              </td>
            </tr>
            
            {/* 4행 - 흰색 */}
            <tr className="bg-white h-8">
              <td className={`${headerCell} whitespace-nowrap`}>모델 연식 / 플랫폼</td>
              <td className={`${inputCell} relative`}>
                {showMissingFields && !fmeaInfo.modelYear && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">
                    미입력
                  </span>
                )}
                <input 
                  type="text" 
                  name="fmea-model-year-x1" 
                  autoComplete="new-password" 
                  data-lpignore="true" 
                  data-form-type="other" 
                  value={fmeaInfo.modelYear} 
                  onChange={(e) => {
                    updateField('modelYear', e.target.value);
                    setShowMissingFields(false);
                  }}
                  className={`w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400 ${showMissingFields && !fmeaInfo.modelYear ? 'text-transparent' : ''}`}
                  placeholder="고객 어플리케이션 또는 회사 모델/스타일" 
                />
              </td>
              <td className={`${headerCell} whitespace-nowrap`}>FMEA 유형</td>
              <td className={`${inputCell}`}>
                <select 
                  value={fmeaInfo.fmeaType} 
                  onChange={(e) => {
                    const newType = e.target.value as FMEAType;
                    updateField('fmeaType', newType);
                    // 유형 변경 시 ID 재생성
                    setFmeaId(generateFMEAId(newType));
                  }}
                  className="w-full h-7 px-2 text-xs border border-gray-300 bg-white text-gray-700 font-semibold rounded focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="M">M - Master FMEA</option>
                  <option value="F">F - Family FMEA</option>
                  <option value="P">P - Part FMEA</option>
                </select>
              </td>
              <td className={`${headerCell} whitespace-nowrap`}>상호기능팀</td>
              <td className={`${inputCell}`} colSpan={3}>
                {cftNames ? (
                  <span className="text-xs text-gray-700 px-2">{cftNames}</span>
                ) : (
                  <span 
                    className={`text-xs px-2 cursor-pointer hover:bg-yellow-50 rounded ${showMissingFields ? 'text-orange-400' : 'text-gray-400'}`}
                    onClick={() => {
                      // CFT 섹션으로 스크롤
                      const cftSection = document.getElementById('cft-section');
                      if (cftSection) {
                        cftSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="CFT 리스트로 이동"
                  >
                    {showMissingFields ? '미입력' : '-'}
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </form>

      {/* ===== FMEA 기초정보 등록 옵션 (테이블) - AI 예측과 동일한 5컬럼 ===== */}
      <div className="mb-3 mt-4">
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr className="h-8">
              <td className="w-[12%] bg-[#00587a] text-white px-3 py-1.5 border border-gray-400 font-bold text-center whitespace-nowrap">
                FMEA 기초 정보등록
              </td>
              <td 
                onClick={() => openFmeaSelectModal('M')}
                className="w-[18%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-purple-200 whitespace-nowrap font-semibold text-purple-700 bg-purple-100"
                title="Master FMEA를 선택하여 기초정보 사용"
              >
                🟣 Master Data 사용
              </td>
              <td 
                onClick={() => openFmeaSelectModal('F')}
                className="w-[25%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-blue-200 whitespace-nowrap font-semibold text-blue-700 bg-[#e3f2fd]"
                title="Family FMEA를 선택하여 기초정보 사용"
              >
                🔵 Family Data 사용
              </td>
              <td 
                onClick={() => openFmeaSelectModal('P')}
                className="w-[30%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-green-200 whitespace-nowrap font-semibold text-green-700 bg-[#e8f5e9]"
                title="기존 Part FMEA를 선택하여 기초정보 사용"
              >
                🟢 Part FMEA 사용
              </td>
              <td 
                onClick={() => window.location.href = `/pfmea/import?id=${fmeaId}&mode=new`}
                className="w-[15%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-amber-200 whitespace-nowrap font-semibold text-amber-700 bg-amber-100"
              >
                ✏️ 신규 입력
              </td>
            </tr>
          </tbody>
        </table>
        {selectedBaseFmea && (
          <div className="mt-2 text-xs text-blue-600">
            📌 선택된 기반 FMEA: <span className="font-bold">{selectedBaseFmea?.toUpperCase()}</span>
          </div>
        )}
      </div>
      
      {/* FMEA 선택 모달 */}
      {fmeaSelectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[500px] overflow-hidden">
            <div className={`px-4 py-3 flex justify-between items-center ${
              fmeaSelectType === 'M' ? 'bg-purple-600' : 
              fmeaSelectType === 'F' ? 'bg-blue-600' : 
              fmeaSelectType === 'P' ? 'bg-green-600' : 
              'bg-gray-600'
            } text-white`}>
              <h3 className="font-bold">
                {fmeaSelectType === 'M' ? '🟣 Master FMEA 선택' : 
                 fmeaSelectType === 'F' ? '🔵 Family FMEA 선택' : 
                 fmeaSelectType === 'P' ? '🟢 Part FMEA 선택' : 
                 '📋 FMEA 리스트 선택'}
              </h3>
              <button onClick={() => setFmeaSelectModalOpen(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {availableFmeas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {fmeaSelectType === 'ALL' ? '등록된 FMEA가 없습니다. 자신의 FMEA ID가 상위 FMEA로 설정됩니다.' : 
                   `등록된 ${fmeaSelectType === 'M' ? 'Master' : fmeaSelectType === 'F' ? 'Family' : 'Part'} FMEA가 없습니다.`}
                </div>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">FMEA ID</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">FMEA명</th>
                      <th className="border border-gray-300 px-3 py-2 text-center w-20">선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableFmeas.map((fmea, idx) => (
                      <tr key={fmea.id} className={`hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="border border-gray-300 px-3 py-2 font-semibold text-blue-600">{fmea.id?.toUpperCase()}</td>
                        <td className="border border-gray-300 px-3 py-2">{fmea.subject}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <button
                            onClick={() => handleFmeaSelect(fmea.id)}
                            className={`px-3 py-1 rounded text-white text-xs font-bold ${
                              fmeaSelectType === 'M' ? 'bg-purple-500 hover:bg-purple-600' :
                              fmeaSelectType === 'F' ? 'bg-blue-500 hover:bg-blue-600' : 
                              fmeaSelectType === 'P' ? 'bg-green-500 hover:bg-green-600' :
                              'bg-gray-500 hover:bg-gray-600'
                            }`}
                          >
                            선택
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setFmeaSelectModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI 기반 FMEA 예측 시스템 ===== */}
      <div className="mb-3">
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr className="h-8">
              <td className="w-[12%] bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-3 py-1.5 border border-gray-400 font-bold text-center whitespace-nowrap">
                🤖 AI 예측 FMEA
              </td>
              <td 
                onClick={() => window.location.href = `/pfmea/worksheet?id=${fmeaId}&mode=ai`}
                className={`w-[18%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer whitespace-nowrap font-semibold ${
                  aiStatus?.isReady 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={aiStatus?.isReady ? 'AI 기반으로 고장모드/원인/영향을 자동 추천받습니다' : '학습 데이터가 부족합니다 (최소 10건 필요)'}
              >
                {aiStatus?.isReady ? '✨ AI 추천 시작' : '⏳ 학습 중...'}
              </td>
              <td className="w-[25%] px-3 py-1.5 border border-gray-400 text-center whitespace-nowrap bg-indigo-50">
                <span className="text-indigo-700 font-semibold">
                  📊 학습 데이터: {aiStatus?.historyCount || 0}건
                </span>
              </td>
              <td className="w-[30%] px-3 py-1.5 border border-gray-400 text-center whitespace-nowrap bg-indigo-50">
                <span className="text-indigo-600 text-[10px]">
                  FM({aiStatus?.stats?.uniqueModes || 0}) | FC({aiStatus?.stats?.uniqueCauses || 0}) | FE({aiStatus?.stats?.uniqueEffects || 0})
                </span>
              </td>
              <td 
                onClick={() => {
                  if (confirm('AI 학습 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
                    localStorage.removeItem('fmea-ai-history');
                    localStorage.removeItem('fmea-ai-rules');
                    setAiStatus({ historyCount: 0, isReady: false, stats: { uniqueModes: 0, uniqueCauses: 0, uniqueEffects: 0 } });
                    alert('AI 학습 데이터가 초기화되었습니다.');
                  }
                }}
                className="w-[15%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-red-100 whitespace-nowrap font-semibold text-red-500 bg-red-50"
              >
                🗑️ 초기화
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-gray-500 mt-1 ml-1">
          💡 AI 예측 시스템은 기존에 작성된 FMEA 데이터를 학습하여 새로운 FMEA 작성 시 고장모드, 원인, 영향을 자동으로 추천합니다.
        </p>
      </div>

      {/* ===== CFT 리스트 (표준 컴포넌트) ===== */}
      <div id="cft-section" className="mt-6 scroll-mt-20">
        <CFTRegistrationTable
          title="CFT 리스트"
          members={cftMembers}
          onMembersChange={setCftMembers}
          onUserSearch={handleCftUserSearch}
          onSave={handleCftSave}
          onReset={handleCftReset}
          saveStatus={cftSaveStatus}
          minRows={10}
        />
      </div>

      {/* ===== CFT 접속 로그 섹션 ===== */}
      <div className="flex items-center gap-2 mt-6 mb-2">
        <span>📊</span>
        <h2 className="text-sm font-bold text-gray-700">CFT 접속 로그</h2>
      </div>
      <CFTAccessLogTable accessLogs={accessLogs} maxRows={5} />

      {/* 하단 상태바 */}
      <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
        <span>총 {cftMembers.filter(m => m.name).length}명의 CFT 멤버 | 접속 로그 {accessLogs.length}건</span>
        <span>버전: P-FMEA Suite v3.0 | 사용자: FMEA Lead</span>
      </div>

      {/* 모달 */}
      <BizInfoSelectModal
        isOpen={bizInfoModalOpen}
        onClose={() => setBizInfoModalOpen(false)}
        onSelect={handleBizInfoSelect}
      />

      <UserSelectModal
        isOpen={userModalOpen}
        onClose={() => { setUserModalOpen(false); setSelectedMemberIndex(null); }}
        onSelect={handleUserSelect}
      />
      </div>
    </>
  );
}

// Suspense boundary wrapper for useSearchParams
export default function PFMEARegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">로딩 중...</div>}>
      <PFMEARegisterPageContent />
    </Suspense>
  );
}
