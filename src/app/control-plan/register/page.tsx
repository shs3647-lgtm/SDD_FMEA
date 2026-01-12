/**
 * @file page.tsx
 * @description Control Plan 등록 페이지 - FMEA 등록과 완전히 동일한 양식
 * @version 3.1.0
 * 
 * FMEA 등록 양식을 그대로 적용:
 * - FMEA명 → CP명
 * - FMEA ID → CP ID
 * - FMEA 유형 → CP 유형 (M - Master CP, F - Family CP, P - Part CP)
 * - 상위 프로젝트 (APQP 연동)
 * - 상위 FMEA (FMEA 선택)
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BizInfoSelectModal } from '@/components/modals/BizInfoSelectModal';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { CFTAccessLogTable } from '@/components/tables/CFTAccessLogTable';
import { CFTRegistrationTable, CFTMember, createInitialCFTMembers } from '@/components/tables/CFTRegistrationTable';
import { BizInfoProject } from '@/types/bizinfo';
import { UserInfo } from '@/types/user';
import { CFTAccessLog } from '@/types/project-cft';
import CPTopNav from '@/components/layout/CPTopNav';

// =====================================================
// 타입 정의
// =====================================================
type CPType = 'M' | 'F' | 'P';

interface CPInfo {
  companyName: string;
  engineeringLocation: string;
  customerName: string;
  modelYear: string;
  subject: string;
  cpStartDate: string;
  cpRevisionDate: string;
  cpProjectName: string;
  cpId: string;
  processResponsibility: string;
  confidentialityLevel: string;
  cpResponsibleName: string;
  cpType: CPType;
}

// =====================================================
// 초기 데이터
// =====================================================
const INITIAL_CP: CPInfo = {
  companyName: '',
  engineeringLocation: '',
  customerName: '',
  modelYear: '',
  subject: '',
  cpStartDate: '',
  cpRevisionDate: '',
  cpProjectName: '',
  cpId: '',
  processResponsibility: '',
  confidentialityLevel: '',
  cpResponsibleName: '',
  cpType: 'P',
};

/**
 * CP ID 생성 규칙
 * 형식: CP{YY}-{TYPE}{NNN}
 * 예: CP26-M001, CP26-F001, CP26-P001
 */
function generateCPId(type: CPType = 'P'): string {
  const year = new Date().getFullYear().toString().slice(-2);
  try {
    const stored = localStorage.getItem('cp-projects');
    if (stored) {
      const projects = JSON.parse(stored);
      const prefix = `CP${year}-${type}`;
      const currentIds = projects
        .filter((p: { id: string }) => p.id?.toUpperCase().startsWith(prefix))
        .map((p: { id: string }) => {
          const match = p.id.match(/\d{3}$/);
          return match ? parseInt(match[0]) : 0;
        });
      if (currentIds.length > 0) {
        const maxSeq = Math.max(...currentIds);
        return `CP${year}-${type}${(maxSeq + 1).toString().padStart(3, '0')}`;
      }
    }
  } catch (e) {
    console.error('ID 생성 중 오류:', e);
  }
  return `CP${year}-${type}001`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
function CPRegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id')?.toUpperCase() || null;
  const isEditMode = !!editId;

  const [cpInfo, setCpInfo] = useState<CPInfo>(INITIAL_CP);
  const [cpId, setCpId] = useState('');
  const [cftMembers, setCftMembers] = useState<CFTMember[]>(createInitialCFTMembers());
  
  // 모달 상태
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [userModalTarget, setUserModalTarget] = useState<'responsible' | 'cft'>('cft');
  
  // FMEA 선택 모달 상태
  const [fmeaSelectModalOpen, setFmeaSelectModalOpen] = useState(false);
  const [fmeaSelectType, setFmeaSelectType] = useState<'M' | 'F' | 'P' | 'ALL'>('ALL');
  const [availableFmeas, setAvailableFmeas] = useState<Array<{id: string; subject: string; type: string}>>([]);
  const [selectedParentFmea, setSelectedParentFmea] = useState<string | null>(null);
  
  // CP 선택 모달 상태 (기초정보 등록용)
  const [cpSelectModalOpen, setCpSelectModalOpen] = useState(false);
  const [cpSelectType, setCpSelectType] = useState<'M' | 'F' | 'P'>('M');
  const [availableCps, setAvailableCps] = useState<Array<{id: string; subject: string; type: string}>>([]);
  const [selectedBaseCp, setSelectedBaseCp] = useState<string | null>(null);
  
  // 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [cftSaveStatus, setCftSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [showMissingFields, setShowMissingFields] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 초기화
  useEffect(() => {
    if (!isEditMode) {
      setCpId(generateCPId(cpInfo.cpType));
    }
    setLoading(false);
  }, [isEditMode]);
  
  // CP 유형 변경 시 ID 재생성
  const handleCpTypeChange = (newType: CPType) => {
    setCpInfo(prev => ({ ...prev, cpType: newType }));
    setCpId(generateCPId(newType));
  };
  
  // FMEA 선택 모달 열기
  const openFmeaSelectModal = async (type: 'M' | 'F' | 'P' | 'ALL' = 'ALL') => {
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
          return fmeaType.toUpperCase() === type && p.id !== cpId;
        })
        .map((p: any) => {
          let fmeaType = 'P';
          if (p.fmeaInfo?.fmeaType) {
            fmeaType = p.fmeaInfo.fmeaType.toUpperCase();
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
  };
  
  // CP 선택 모달 열기 (기초정보용)
  const openCpSelectModal = async (type: 'M' | 'F' | 'P') => {
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
          return cpType.toUpperCase() === type && p.id !== cpId;
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
  };
  
  // FMEA 선택 완료
  const handleFmeaSelect = (selectedId: string) => {
    setSelectedParentFmea(selectedId.toUpperCase());
    setFmeaSelectModalOpen(false);
  };
  
  // CP 선택 완료 (기초정보 복사)
  const handleCpSelect = (selectedId: string) => {
    setSelectedBaseCp(selectedId.toUpperCase());
    setCpSelectModalOpen(false);
    // TODO: 선택한 CP의 기초정보 복사
  };

  // 새로 등록
  const handleNewRegister = () => {
    if (confirm('새로운 CP를 등록하시겠습니까?\n현재 화면의 내용은 초기화됩니다.')) {
      setCpInfo(INITIAL_CP);
      setCftMembers(createInitialCFTMembers());
      setCpId(generateCPId('P'));
      setSelectedParentFmea(null);
      setSelectedBaseCp(null);
    }
  };

  // 필드 업데이트
  const updateField = (field: keyof CPInfo, value: string) => {
    setCpInfo(prev => ({ ...prev, [field]: value }));
  };

  // 기초정보 선택
  const handleBizInfoSelect = (info: BizInfoProject) => {
    setCpInfo(prev => ({
      ...prev,
      companyName: info.customerName || '',
      customerName: info.customerName || '',
      modelYear: info.modelYear || '',
      cpProjectName: info.program || '',
      subject: prev.subject?.trim() ? prev.subject : (info.productName || ''),
    }));
    setBizInfoModalOpen(false);
  };

  // 사용자 선택
  const handleUserSelect = (user: UserInfo) => {
    if (userModalTarget === 'responsible') {
      setCpInfo(prev => ({
        ...prev,
        cpResponsibleName: user.name || '',
        processResponsibility: user.department || '',
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
  const handleCftSave = async () => {
    await handleSave();
    setCftSaveStatus('saved');
    setTimeout(() => setCftSaveStatus('idle'), 3000);
  };

  // CFT 초기화
  const handleCftReset = () => {
    if (confirm('CFT 목록을 초기화하시겠습니까?')) {
      setCftMembers(createInitialCFTMembers());
    }
  };

  // 저장
  const handleSave = async () => {
    if (!cpInfo.subject.trim()) {
      alert('CP명을 입력해주세요.');
      return;
    }

    setSaveStatus('saving');
    
    try {
      // localStorage 저장
      const data = {
        id: cpId,
        cpInfo,
        cftMembers,
        parentFmeaId: selectedParentFmea,
        baseCpId: selectedBaseCp,
        createdAt: new Date().toISOString(),
      };
      
      let projects = [];
      const stored = localStorage.getItem('cp-projects');
      if (stored) projects = JSON.parse(stored);
      projects = projects.filter((p: any) => p.id !== cpId);
      projects.unshift(data);
      localStorage.setItem('cp-projects', JSON.stringify(projects));
      
      setSaveStatus('saved');
      setShowMissingFields(true);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
      setSaveStatus('idle');
    }
  };

  // CFT 접속 로그
  const accessLogs: CFTAccessLog[] = [
    { id: 1, projectId: cpId, userName: '김철수', loginTime: '2026-01-12 09:00', logoutTime: '2026-01-12 12:30', action: '수정', itemType: 'CP', cellAddress: 'A1:B5', description: 'CP 정보 수정' },
    { id: 2, projectId: cpId, userName: '이영희', loginTime: '2026-01-12 10:15', logoutTime: '2026-01-12 11:45', action: '추가', itemType: 'CFT', cellAddress: 'C3', description: 'CFT 팀원 추가' },
    { id: 3, projectId: cpId, userName: '박지민', loginTime: '2026-01-12 14:00', logoutTime: null, action: '수정', itemType: 'CP', cellAddress: 'D10:F15', description: '관리항목 업데이트' },
  ];

  // 테이블 셀 스타일 (FMEA와 동일 - Teal 색상)
  const headerCell = "bg-[#0d9488] text-white px-2 py-1.5 border border-white font-semibold text-xs text-center align-middle";
  const inputCell = "border border-gray-300 px-1 py-0.5";

  // CFT 멤버 이름 목록
  const cftNames = cftMembers.filter(m => m.name).map(m => m.name).join(', ');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <CPTopNav selectedCpId={cpId} />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isEditMode ? '✏️' : '📝'}</span>
            <h1 className="text-sm font-bold text-gray-800">Control Plan {isEditMode ? '수정' : '등록'}</h1>
            <span className="text-xs text-gray-500 ml-2">CP No: {cpId}</span>
            {isEditMode && <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded font-bold">수정모드</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleNewRegister} className="px-3 py-1.5 bg-white border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-100 font-semibold">
              🔄 새로고침
            </button>
            <button 
              onClick={handleSave}
              className={`px-4 py-1.5 text-xs font-bold rounded ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
              {saveStatus === 'saved' ? '✓ 저장됨' : '💾 저장'}
            </button>
          </div>
        </div>

        {/* ===== 기획 및 준비 (1단계) - FMEA와 동일 ===== */}
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white rounded border border-gray-300 mb-3">
          <div className="bg-teal-50 px-3 py-1.5 border-b border-gray-300">
            <h2 className="text-xs font-bold text-gray-700">Control Plan 기본정보</h2>
          </div>
          
          <table className="w-full border-collapse text-xs">
            <tbody>
              {/* 1행 - Teal */}
              <tr className="bg-teal-50 h-8">
                <td className={`${headerCell} w-[11%] whitespace-nowrap`}>회사 명</td>
                <td className={`${inputCell} w-[14%] relative`}>
                  {showMissingFields && !cpInfo.companyName && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">미입력</span>
                  )}
                  <input 
                    type="text" 
                    value={cpInfo.companyName} 
                    onChange={(e) => { updateField('companyName', e.target.value); setShowMissingFields(false); }}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
                    placeholder="회사 명" 
                  />
                </td>
                <td className={`${headerCell} w-[7%] whitespace-nowrap`}>CP명</td>
                <td className={`${inputCell} w-[23%] relative`}>
                  {showMissingFields && !cpInfo.subject && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none">미입력</span>
                  )}
                  <input 
                    type="text" 
                    value={cpInfo.subject} 
                    onChange={(e) => { updateField('subject', e.target.value); setShowMissingFields(false); }}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
                    placeholder="품명 또는 제품명" 
                  />
                </td>
                <td className={`${headerCell} w-[7%] whitespace-nowrap`}>CP No</td>
                <td className={`${inputCell} w-[10%]`}>
                  <span className="px-2 text-xs font-semibold text-teal-600">{cpId}</span>
                </td>
                <td className={`${headerCell} w-[8%] whitespace-nowrap`}>연결 FMEA</td>
                <td 
                  className={`${inputCell} w-[20%] cursor-pointer hover:bg-gray-100 relative`}
                  onClick={() => openFmeaSelectModal('ALL')}
                  title="연결 FMEA 선택 (클릭하여 FMEA 리스트 보기)"
                >
                  {selectedParentFmea ? (
                    <div className="flex items-center gap-1 px-2">
                      <span className="px-1 py-0 rounded text-[9px] font-bold text-white bg-purple-500">
                        {selectedParentFmea.match(/PFM\d{2}-([MFP])/i)?.[1] || 'P'}
                      </span>
                      <span className="text-xs font-semibold text-purple-600">{selectedParentFmea}</span>
                      <button onClick={(e) => { e.stopPropagation(); openFmeaSelectModal('ALL'); }} className="ml-1 text-blue-500 hover:text-blue-700 text-[10px]">🔍</button>
                    </div>
                  ) : (
                    <span className="px-2 text-xs text-cyan-500">미연결</span>
                  )}
                </td>
              </tr>
              
              {/* 2행 - 흰색 */}
              <tr className="bg-white h-8">
                <td className={`${headerCell} whitespace-nowrap`}>엔지니어링 위치</td>
                <td className={`${inputCell} relative`}>
                  <input 
                    type="text" 
                    value={cpInfo.engineeringLocation} 
                    onChange={(e) => updateField('engineeringLocation', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
                    placeholder="지리적 위치" 
                  />
                </td>
                <td className={`${headerCell} whitespace-nowrap`}>시작 일자</td>
                <td className={`${inputCell} relative`}>
                  <input 
                    type="date" 
                    value={cpInfo.cpStartDate} 
                    onChange={(e) => updateField('cpStartDate', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none"
                  />
                </td>
                <td className={`${headerCell} whitespace-nowrap`}>공정 책임</td>
                <td className={`${inputCell}`}>
                  <input 
                    type="text" 
                    value={cpInfo.processResponsibility} 
                    onChange={(e) => updateField('processResponsibility', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
                    placeholder="부서" 
                  />
                </td>
                <td className={`${headerCell} whitespace-nowrap`}>CP 책임자</td>
                <td className={`${inputCell} relative`}>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      value={cpInfo.cpResponsibleName} 
                      onChange={(e) => updateField('cpResponsibleName', e.target.value)}
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
                      placeholder="CP 책임자 성명" 
                    />
                    <button onClick={() => { setUserModalTarget('responsible'); setUserModalOpen(true); }} className="text-blue-500 hover:text-blue-700 px-1">🔍</button>
                  </div>
                </td>
              </tr>
              
              {/* 3행 - Teal */}
              <tr className="bg-teal-50 h-8">
                <td className={`${headerCell} whitespace-nowrap`}>고객 명</td>
                <td className={`${inputCell} relative`}>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      value={cpInfo.customerName} 
                      onChange={(e) => updateField('customerName', e.target.value)}
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
                      placeholder="고객 명" 
                    />
                    <button onClick={() => setBizInfoModalOpen(true)} className="text-blue-500 hover:text-blue-700" title="고객정보 검색">🔍</button>
                  </div>
                </td>
                <td className={`${headerCell} whitespace-nowrap`}>개정 일자</td>
                <td className={`${inputCell} relative`}>
                  <input 
                    type="date" 
                    value={cpInfo.cpRevisionDate} 
                    onChange={(e) => updateField('cpRevisionDate', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none"
                  />
                </td>
                <td className={`${headerCell} whitespace-nowrap`}>CP 종류</td>
                <td className={`${inputCell}`} colSpan={3}>
                  <select 
                    value={cpInfo.confidentialityLevel} 
                    onChange={(e) => updateField('confidentialityLevel', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-600"
                  >
                    <option value="">선택</option>
                    <option value="Prototype">Prototype</option>
                    <option value="Pre-Launch">Pre-Launch</option>
                    <option value="Production">Production</option>
                    <option value="Safe Launch">Safe Launch</option>
                  </select>
                </td>
              </tr>
              
              {/* 4행 - 흰색 (모델연식/플랫폼, CP유형, 상호기능팀) */}
              <tr className="bg-white h-8">
                <td className={`${headerCell} whitespace-nowrap`}>모델 연식 / 플랫폼</td>
                <td className={`${inputCell} relative`}>
                  <input 
                    type="text" 
                    value={cpInfo.modelYear} 
                    onChange={(e) => updateField('modelYear', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
                    placeholder="고객 어플리케이션 또는 회사" 
                  />
                </td>
                <td className={`${headerCell} whitespace-nowrap`}>CP 유형</td>
                <td className={`${inputCell}`}>
                  <select 
                    value={cpInfo.cpType} 
                    onChange={(e) => handleCpTypeChange(e.target.value as CPType)}
                    className="w-full h-7 px-2 text-xs border border-gray-300 bg-white text-gray-700 font-semibold rounded focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="M">M - Master CP</option>
                    <option value="F">F - Family CP</option>
                    <option value="P">P - Part CP</option>
                  </select>
                </td>
                <td className={`${headerCell} whitespace-nowrap`}>상호기능팀</td>
                <td className={`${inputCell}`} colSpan={3}>
                  {cftNames ? (
                    <span className="text-xs text-gray-700 px-2">{cftNames}</span>
                  ) : (
                    <span 
                      className="text-xs text-gray-400 px-2 cursor-pointer hover:bg-yellow-50 rounded"
                      onClick={() => document.getElementById('cft-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      - (CFT 리스트에서 입력)
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </form>

        {/* ===== CP 작성 옵션 (FMEA와 동일: Master/Family/Part/신규) ===== */}
        <div className="mb-3">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="h-8">
                <td className="w-[12%] bg-[#0d9488] text-white px-3 py-1.5 border border-gray-400 font-bold text-center whitespace-nowrap">
                  CP 작성 옵션
                </td>
                <td 
                  onClick={() => openCpSelectModal('M')}
                  className="w-[18%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-purple-200 whitespace-nowrap font-semibold text-purple-700 bg-purple-100"
                  title="Master CP를 선택하여 기초정보 사용"
                >
                  🟣 Master Data 사용
                </td>
                <td 
                  onClick={() => openCpSelectModal('F')}
                  className="w-[25%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-blue-200 whitespace-nowrap font-semibold text-blue-700 bg-[#e3f2fd]"
                  title="Family CP를 선택하여 기초정보 사용"
                >
                  🔵 Family Data 사용
                </td>
                <td 
                  onClick={() => openCpSelectModal('P')}
                  className="w-[30%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-green-200 whitespace-nowrap font-semibold text-green-700 bg-[#e8f5e9]"
                  title="기존 Part CP를 선택하여 기초정보 사용"
                >
                  🟢 Part CP 사용
                </td>
                <td 
                  onClick={() => router.push(`/control-plan/worksheet?cpNo=${cpId}`)}
                  className="w-[15%] px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-amber-200 whitespace-nowrap font-semibold text-amber-700 bg-amber-100"
                >
                  ✏️ 신규 입력
                </td>
              </tr>
            </tbody>
          </table>
          {selectedBaseCp && (
            <div className="mt-2 text-xs text-teal-600">
              📌 선택된 기반 CP: <span className="font-bold">{selectedBaseCp}</span>
            </div>
          )}
        </div>

        {/* ===== CFT 리스트 ===== */}
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

        {/* ===== CFT 접속 로그 ===== */}
        <div className="flex items-center gap-2 mt-6 mb-2">
          <span>📊</span>
          <h2 className="text-sm font-bold text-gray-700">CFT 접속 로그</h2>
        </div>
        <CFTAccessLogTable accessLogs={accessLogs} maxRows={5} />

        {/* 하단 상태바 */}
        <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
          <span>총 {cftMembers.filter(m => m.name).length}명의 CFT 멤버 | 접속 로그 {accessLogs.length}건</span>
          <span>버전: Control Plan Suite v3.0 | 사용자: CP Lead</span>
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
                  <div className="text-center py-8 text-gray-500">등록된 FMEA가 없습니다.</div>
                ) : (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left">FMEA ID</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">FMEA명</th>
                        <th className="border border-gray-300 px-3 py-2 text-center w-16">유형</th>
                        <th className="border border-gray-300 px-3 py-2 text-center w-20">선택</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableFmeas.map((fmea, idx) => (
                        <tr key={fmea.id} className={`hover:bg-purple-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="border border-gray-300 px-3 py-2 font-semibold text-purple-600">{fmea.id.toUpperCase()}</td>
                          <td className="border border-gray-300 px-3 py-2">{fmea.subject}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                              fmea.type === 'M' ? 'bg-purple-500' : fmea.type === 'F' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              {fmea.type}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <button
                              onClick={() => handleFmeaSelect(fmea.id)}
                              className="px-3 py-1 rounded bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold"
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
                <button onClick={() => setFmeaSelectModalOpen(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* CP 선택 모달 (기초정보용) */}
        {cpSelectModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[500px] overflow-hidden">
              <div className={`px-4 py-3 flex justify-between items-center ${
                cpSelectType === 'M' ? 'bg-purple-600' : 
                cpSelectType === 'F' ? 'bg-blue-600' : 
                'bg-green-600'
              } text-white`}>
                <h3 className="font-bold">
                  {cpSelectType === 'M' ? '🟣 Master CP 선택' : 
                   cpSelectType === 'F' ? '🔵 Family CP 선택' : 
                   '🟢 Part CP 선택'}
                </h3>
                <button onClick={() => setCpSelectModalOpen(false)} className="text-white hover:text-gray-200">✕</button>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {availableCps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">등록된 {cpSelectType} CP가 없습니다.</div>
                ) : (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left">CP ID</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">CP명</th>
                        <th className="border border-gray-300 px-3 py-2 text-center w-16">유형</th>
                        <th className="border border-gray-300 px-3 py-2 text-center w-20">선택</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableCps.map((cp, idx) => (
                        <tr key={cp.id} className={`hover:bg-teal-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="border border-gray-300 px-3 py-2 font-semibold text-teal-600">{cp.id.toUpperCase()}</td>
                          <td className="border border-gray-300 px-3 py-2">{cp.subject}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                              cp.type === 'M' ? 'bg-purple-500' : cp.type === 'F' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              {cp.type}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <button
                              onClick={() => handleCpSelect(cp.id)}
                              className="px-3 py-1 rounded bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold"
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
                <button onClick={() => setCpSelectModalOpen(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Suspense boundary wrapper
export default function CPRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">로딩 중...</div>}>
      <CPRegisterPageContent />
    </Suspense>
  );
}
