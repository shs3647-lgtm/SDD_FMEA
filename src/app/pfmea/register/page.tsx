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

// =====================================================
// 타입 정의
// =====================================================
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
  designResponsibility: '',
  confidentialityLevel: '',
  fmeaResponsibleName: '',
};

function generateFMEAId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PFM${year}-${seq}`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
function PFMEARegisterPageContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id'); // 수정 모드일 때 ID
  const isEditMode = !!editId;

  const [fmeaInfo, setFmeaInfo] = useState<FMEAInfo>(INITIAL_FMEA);
  const [cftMembers, setCftMembers] = useState<CFTMember[]>(createInitialCFTMembers());
  const [fmeaId, setFmeaId] = useState('');
  
  // 모달 상태
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [userModalTarget, setUserModalTarget] = useState<'responsible' | 'cft'>('cft');
  
  // 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [cftSaveStatus, setCftSaveStatus] = useState<'idle' | 'saved'>('idle');

  // 초기화 및 수정 모드 데이터 로드
  useEffect(() => {
    if (isEditMode && editId) {
      // 수정 모드: 기존 데이터 로드
      const storedProjects = localStorage.getItem('pfmea-projects');
      if (storedProjects) {
        try {
          const projects = JSON.parse(storedProjects);
          const existingProject = projects.find((p: { id: string }) => p.id === editId);
          if (existingProject) {
            setFmeaId(existingProject.id);
            if (existingProject.fmeaInfo) {
              setFmeaInfo(existingProject.fmeaInfo);
            }
            if (existingProject.cftMembers && existingProject.cftMembers.length > 0) {
              setCftMembers(existingProject.cftMembers);
            }
          }
        } catch (e) {
          console.error('프로젝트 데이터 로드 실패:', e);
        }
      }
    } else {
      // 신규 등록 모드
      setFmeaId(generateFMEAId());
    }
    
    // 저장된 CFT 데이터 불러오기 (신규 등록 시에만)
    if (!isEditMode) {
      const savedCft = localStorage.getItem('pfmea-cft-data');
      if (savedCft) {
        try {
          const parsed = JSON.parse(savedCft);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCftMembers(parsed);
          }
        } catch (e) {
          console.error('CFT 데이터 로드 실패:', e);
        }
      }
    }
  }, [isEditMode, editId]);

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
    setTimeout(() => setCftSaveStatus('idle'), 3000);
  };

  // CFT 초기화
  const handleCftReset = () => {
    if (confirm('CFT 목록을 초기화하시겠습니까?')) {
      localStorage.removeItem('pfmea-cft-data');
      setCftMembers(createInitialCFTMembers());
    }
  };

  // 저장 (신규 등록 또는 수정)
  const handleSave = () => {
    if (!fmeaInfo.subject.trim()) {
      alert('FMEA명을 입력해주세요.');
      return;
    }

    const existing = JSON.parse(localStorage.getItem('pfmea-projects') || '[]');

    if (isEditMode) {
      // 수정 모드: 기존 데이터 업데이트
      const updatedProjects = existing.map((p: { id: string; createdAt?: string; step?: number; revisionNo?: string }) => {
        if (p.id === fmeaId) {
          return {
            ...p,
            project: {
              projectName: fmeaInfo.fmeaProjectName || '',
              customer: fmeaInfo.customerName,
              productName: fmeaInfo.subject,
              partNo: '',
              department: fmeaInfo.designResponsibility,
              leader: fmeaInfo.fmeaResponsibleName,
              startDate: fmeaInfo.fmeaStartDate,
              endDate: '',
            },
            fmeaInfo,
            cftMembers,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      localStorage.setItem('pfmea-projects', JSON.stringify(updatedProjects));
    } else {
      // 신규 등록 모드
      const data = { 
        id: fmeaId, 
        project: {
          projectName: fmeaInfo.fmeaProjectName || '',
          customer: fmeaInfo.customerName,
          productName: fmeaInfo.subject,
          partNo: '',
          department: fmeaInfo.designResponsibility,
          leader: fmeaInfo.fmeaResponsibleName,
          startDate: fmeaInfo.fmeaStartDate,
          endDate: '',
        },
        fmeaInfo,
        cftMembers, 
        createdAt: new Date().toISOString(),
        status: 'draft',
        step: 1,
        revisionNo: 'Rev.00',
      };
      existing.unshift(data);
      localStorage.setItem('pfmea-projects', JSON.stringify(existing));
    }
    
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
      window.location.href = '/pfmea/list';
    }, 1500);
  };

  // 새로고침
  const handleRefresh = () => {
    if (confirm('입력한 내용을 초기화하시겠습니까?')) {
      setFmeaInfo(INITIAL_FMEA);
      setCftMembers(createInitialCFTMembers());
      setFmeaId(generateFMEAId());
    }
  };

  // CFT 접속 로그
  const [accessLogs] = useState<CFTAccessLog[]>([
    { id: 1, projectId: fmeaId, userName: '김철수', loginTime: '2025-12-26 09:00', logoutTime: '2025-12-26 12:30', action: '수정', itemType: 'PFMEA', cellAddress: 'A1:B5', description: 'PFMEA 프로젝트 정보 수정' },
    { id: 2, projectId: fmeaId, userName: '이영희', loginTime: '2025-12-26 10:15', logoutTime: '2025-12-26 11:45', action: '추가', itemType: 'CFT', cellAddress: 'C3', description: 'CFT 팀원 추가' },
    { id: 3, projectId: fmeaId, userName: '박지민', loginTime: '2025-12-26 14:00', logoutTime: null, action: '수정', itemType: 'PFMEA', cellAddress: 'D10:F15', description: '고장형태 분석 업데이트' },
  ]);

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
            <span className="text-xs text-gray-500 ml-2">ID: {fmeaId}</span>
            {isEditMode && <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded font-bold">수정모드</span>}
          </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="px-3 py-1.5 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200">
            🔄 새로고침
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
      <div className="bg-white rounded border border-gray-300 mb-3">
        <div className="bg-[#e3f2fd] px-3 py-1.5 border-b border-gray-300">
          <h2 className="text-xs font-bold text-gray-700">기획 및 준비 (1단계)</h2>
        </div>
        
        <table className="w-full border-collapse text-xs">
          <tbody>
            {/* 1행 - 파란색 */}
            <tr className="bg-[#e3f2fd] h-8">
              <td className={`${headerCell} w-[10%]`}>회사 명</td>
              <td className={`${inputCell} w-[15%]`}>
                <input type="text" value={fmeaInfo.companyName} onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="공정 FMEA에 책임이 있는 회사 명" />
              </td>
              <td className={`${headerCell} w-[8%]`}>FMEA명</td>
              <td className={`${inputCell} w-[17%]`}>
                <input type="text" value={fmeaInfo.subject} onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="시스템, 서브시스템 및/또는 구성품" />
              </td>
              <td className={`${headerCell} w-[10%]`}>FMEA ID 번호</td>
              <td className={`${inputCell} w-[10%]`}>
                <span className="px-2 text-xs text-gray-600">{fmeaId}</span>
              </td>
              <td className={`${headerCell} w-[10%]`}>회사에 의해 결정됨</td>
            </tr>
            
            {/* 2행 - 흰색 */}
            <tr className="bg-white h-8">
              <td className={headerCell}>엔지니어링 위치</td>
              <td className={`${inputCell}`}>
                <input type="text" value={fmeaInfo.engineeringLocation} onChange={(e) => updateField('engineeringLocation', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="지리적 위치" />
              </td>
              <td className={headerCell}>시작 일자</td>
              <td className={`${inputCell}`}>
                <input type="date" value={fmeaInfo.fmeaStartDate} onChange={(e) => updateField('fmeaStartDate', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
              <td className={headerCell}>공정 책임</td>
              <td className={`${inputCell}`}>
                <input type="text" value={fmeaInfo.designResponsibility} onChange={(e) => updateField('designResponsibility', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="부서" />
              </td>
              <td className={`${inputCell}`}>
                <div className="flex items-center gap-1">
                  <input type="text" value={fmeaInfo.fmeaResponsibleName} onChange={(e) => updateField('fmeaResponsibleName', e.target.value)}
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="FMEA 책임자 성명" />
                  <button onClick={() => { setUserModalTarget('responsible'); setUserModalOpen(true); }} className="text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
            </tr>
            
            {/* 3행 - 파란색 */}
            <tr className="bg-[#e3f2fd] h-8">
              <td className={headerCell}>고객 명</td>
              <td className={`${inputCell}`}>
                <div className="flex items-center gap-1">
                  <input type="text" value={fmeaInfo.customerName} onChange={(e) => updateField('customerName', e.target.value)}
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="고객(들) 또는 제품 패밀리 명" />
                  <button onClick={() => setBizInfoModalOpen(true)} className="text-blue-500 hover:text-blue-700" title="고객정보 검색">🔍</button>
                </div>
              </td>
              <td className={headerCell}>개정 일자</td>
              <td className={`${inputCell}`}>
                <input type="date" value={fmeaInfo.fmeaRevisionDate} onChange={(e) => updateField('fmeaRevisionDate', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
              <td className={headerCell}>기밀유지 수준</td>
              <td className={`${inputCell}`} colSpan={2}>
                <select value={fmeaInfo.confidentialityLevel} onChange={(e) => updateField('confidentialityLevel', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-600">
                  <option value="">선택</option>
                  <option value="사업용도">사업용도</option>
                  <option value="독점">독점</option>
                  <option value="기밀">기밀</option>
                </select>
              </td>
            </tr>
            
            {/* 4행 - 흰색 */}
            <tr className="bg-white h-8">
              <td className={headerCell}>모델 연식 / 플랫폼</td>
              <td className={`${inputCell}`}>
                <input type="text" value={fmeaInfo.modelYear} onChange={(e) => updateField('modelYear', e.target.value)}
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="고객 어플리케이션 또는 회사 모델/스타일" />
              </td>
              <td className={headerCell}>상호기능팀</td>
              <td className={`${inputCell}`} colSpan={4}>
                <span className="text-xs text-gray-500 px-2">
                  {cftNames || '팀 명단이 요구됨'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== FMEA 기초정보 등록 옵션 (테이블) ===== */}
      <div className="mb-3 mt-4">
        <table className="border-collapse text-xs table-auto">
          <tbody>
            <tr className="h-8">
              <td className="bg-[#00587a] text-white px-3 py-1.5 border border-gray-400 font-bold text-center whitespace-nowrap">
                FMEA 기초 정보등록
              </td>
              <td 
                onClick={() => window.location.href = `/pfmea/import?id=${fmeaId}&mode=master`}
                className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-blue-200 whitespace-nowrap font-semibold text-blue-700 bg-[#e3f2fd]"
              >
                Master Data 사용
              </td>
              <td 
                onClick={() => window.location.href = `/pfmea/import?id=${fmeaId}&mode=new`}
                className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-green-200 whitespace-nowrap font-semibold text-green-700 bg-[#e8f5e9]"
              >
                신규 기초정보 Data 입력
              </td>
              <td 
                onClick={() => window.location.href = `/pfmea/worksheet?id=${fmeaId}`}
                className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-gray-200 whitespace-nowrap font-semibold text-gray-700 bg-gray-100"
              >
                기초 정보 없이 사용
              </td>
              <td 
                onClick={() => window.location.href = `/pfmea/import?id=${fmeaId}`}
                className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-yellow-300 whitespace-nowrap font-semibold bg-yellow-100 text-red-600"
              >
                ➡️ 기초정보 입력창으로 이동
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== CFT 등록 (표준 컴포넌트) ===== */}
      <div className="mt-6">
        <CFTRegistrationTable
          title="CFT 등록"
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
