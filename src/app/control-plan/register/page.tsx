/**
 * @file page.tsx
 * @description Control Plan 등록 페이지 - PFMEA register와 동일한 구조
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BizInfoSelectModal } from '@/components/modals/BizInfoSelectModal';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { BizInfoProject } from '@/types/bizinfo';
import { UserInfo } from '@/types/user';
import CPTopNav from '@/components/layout/CPTopNav';

// =====================================================
// 타입 정의
// =====================================================
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
};

function generateCPId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CP${year}-${seq}`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
function CPRegisterPageContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;

  const [cpInfo, setCpInfo] = useState<CPInfo>(INITIAL_CP);
  const [cpId, setCpId] = useState('');
  
  // 모달 상태
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalTarget, setUserModalTarget] = useState<'responsible' | 'other'>('responsible');
  
  // 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // FMEA 연동
  const [fmeaList, setFmeaList] = useState<any[]>([]);
  const [linkedFmeaId, setLinkedFmeaId] = useState<string>('');

  // 초기화 및 수정 모드 데이터 로드
  useEffect(() => {
    // FMEA 목록 로드
    const storedFmea = localStorage.getItem('pfmea-projects');
    if (storedFmea) {
      try {
        setFmeaList(JSON.parse(storedFmea));
      } catch (e) {
        console.error('FMEA 목록 로드 실패:', e);
      }
    }

    if (isEditMode && editId) {
      // 수정 모드: 기존 데이터 로드
      const storedProjects = localStorage.getItem('cp-projects');
      if (storedProjects) {
        try {
          const projects = JSON.parse(storedProjects);
          const existingProject = projects.find((p: { id: string }) => p.id === editId);
          if (existingProject) {
            setCpId(existingProject.id);
            if (existingProject.cpInfo) {
              setCpInfo(existingProject.cpInfo);
            }
            if (existingProject.linkedFmeaId) {
              setLinkedFmeaId(existingProject.linkedFmeaId);
            }
          }
        } catch (e) {
          console.error('프로젝트 데이터 로드 실패:', e);
        }
      }
    } else {
      // 신규 등록 모드
      setCpId(generateCPId());
    }
  }, [isEditMode, editId]);

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
      subject: info.productName || '',
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
    }
    setUserModalOpen(false);
  };

  // FMEA 연동
  const handleFmeaLink = (fmeaId: string) => {
    setLinkedFmeaId(fmeaId);
    if (fmeaId) {
      const fmea = fmeaList.find(f => f.id === fmeaId);
      if (fmea) {
        setCpInfo(prev => ({
          ...prev,
          customerName: fmea.fmeaInfo?.customerName || fmea.project?.customer || '',
          subject: fmea.fmeaInfo?.subject || fmea.project?.productName || '',
          modelYear: fmea.fmeaInfo?.modelYear || '',
          cpProjectName: fmea.project?.projectName || '',
        }));
      }
    }
  };

  // 저장
  const handleSave = () => {
    if (!cpInfo.subject.trim()) {
      alert('CP명을 입력해주세요.');
      return;
    }

    const existing = JSON.parse(localStorage.getItem('cp-projects') || '[]');

    if (isEditMode) {
      const updatedProjects = existing.map((p: { id: string }) => {
        if (p.id === cpId) {
          return {
            ...p,
            cpInfo,
            linkedFmeaId,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      localStorage.setItem('cp-projects', JSON.stringify(updatedProjects));
    } else {
      const data = { 
        id: cpId, 
        cpInfo,
        linkedFmeaId, 
        createdAt: new Date().toISOString(),
        status: 'draft',
        revisionNo: 'Rev.00',
      };
      existing.unshift(data);
      localStorage.setItem('cp-projects', JSON.stringify(existing));
    }
    
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
      window.location.href = '/control-plan/list';
    }, 1500);
  };

  // 새로고침
  const handleRefresh = () => {
    if (confirm('입력한 내용을 초기화하시겠습니까?')) {
      setCpInfo(INITIAL_CP);
      setCpId(generateCPId());
      setLinkedFmeaId('');
    }
  };

  // 테이블 셀 스타일
  const headerCell = "bg-[#0d9488] text-white px-2 py-1.5 border border-white font-semibold text-xs text-center align-middle";
  const inputCell = "border border-gray-300 px-1 py-0.5";

  return (
    <>
      {/* 상단 고정 바로가기 메뉴 */}
      <CPTopNav selectedCpId={cpId} />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isEditMode ? '✏️' : '📝'}</span>
            <h1 className="text-sm font-bold text-gray-800">Control Plan {isEditMode ? '수정' : '등록'}</h1>
            <span className="text-xs text-gray-500 ml-2">ID: {cpId}</span>
            {isEditMode && <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded font-bold">수정모드</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleRefresh} className="px-3 py-1.5 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200">
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

        {/* ===== CP 기본정보 ===== */}
        <div className="bg-white rounded border border-gray-300 mb-3">
          <div className="bg-teal-50 px-3 py-1.5 border-b border-gray-300">
            <h2 className="text-xs font-bold text-gray-700">Control Plan 기본정보</h2>
          </div>
          
          <table className="w-full border-collapse text-xs">
            <tbody>
              {/* 1행 */}
              <tr className="bg-teal-50 h-8">
                <td className={`${headerCell} w-[10%]`}>회사 명</td>
                <td className={`${inputCell} w-[15%]`}>
                  <input type="text" value={cpInfo.companyName} onChange={(e) => updateField('companyName', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="회사 명" />
                </td>
                <td className={`${headerCell} w-[8%]`}>CP명</td>
                <td className={`${inputCell} w-[17%]`}>
                  <input type="text" value={cpInfo.subject} onChange={(e) => updateField('subject', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="품명 또는 제품명" />
                </td>
                <td className={`${headerCell} w-[10%]`}>CP ID 번호</td>
                <td className={`${inputCell} w-[10%]`}>
                  <span className="px-2 text-xs text-gray-600">{cpId}</span>
                </td>
                <td className={`${headerCell} w-[10%]`}>FMEA 연동</td>
                <td className={`${inputCell} w-[20%]`}>
                  <select
                    value={linkedFmeaId}
                    onChange={(e) => handleFmeaLink(e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none"
                  >
                    <option value="">-- FMEA 선택 --</option>
                    {fmeaList.map(fmea => (
                      <option key={fmea.id} value={fmea.id}>
                        {fmea.fmeaInfo?.subject || fmea.project?.productName || fmea.id}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              
              {/* 2행 */}
              <tr className="bg-white h-8">
                <td className={headerCell}>엔지니어링 위치</td>
                <td className={`${inputCell}`}>
                  <input type="text" value={cpInfo.engineeringLocation} onChange={(e) => updateField('engineeringLocation', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="지리적 위치" />
                </td>
                <td className={headerCell}>시작 일자</td>
                <td className={`${inputCell}`}>
                  <input type="date" value={cpInfo.cpStartDate} onChange={(e) => updateField('cpStartDate', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                </td>
                <td className={headerCell}>공정 책임</td>
                <td className={`${inputCell}`}>
                  <input type="text" value={cpInfo.processResponsibility} onChange={(e) => updateField('processResponsibility', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="부서" />
                </td>
                <td className={headerCell}>CP 책임자</td>
                <td className={`${inputCell}`}>
                  <div className="flex items-center gap-1">
                    <input type="text" value={cpInfo.cpResponsibleName} onChange={(e) => updateField('cpResponsibleName', e.target.value)}
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="CP 책임자 성명" />
                    <button onClick={() => { setUserModalTarget('responsible'); setUserModalOpen(true); }} className="text-blue-500 hover:text-blue-700">🔍</button>
                  </div>
                </td>
              </tr>
              
              {/* 3행 */}
              <tr className="bg-teal-50 h-8">
                <td className={headerCell}>고객 명</td>
                <td className={`${inputCell}`}>
                  <div className="flex items-center gap-1">
                    <input type="text" value={cpInfo.customerName} onChange={(e) => updateField('customerName', e.target.value)}
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="고객 명" />
                    <button onClick={() => setBizInfoModalOpen(true)} className="text-blue-500 hover:text-blue-700" title="고객정보 검색">🔍</button>
                  </div>
                </td>
                <td className={headerCell}>개정 일자</td>
                <td className={`${inputCell}`}>
                  <input type="date" value={cpInfo.cpRevisionDate} onChange={(e) => updateField('cpRevisionDate', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                </td>
                <td className={headerCell}>기밀유지 수준</td>
                <td className={`${inputCell}`} colSpan={3}>
                  <select value={cpInfo.confidentialityLevel} onChange={(e) => updateField('confidentialityLevel', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-600">
                    <option value="">선택</option>
                    <option value="사업용도">사업용도</option>
                    <option value="독점">독점</option>
                    <option value="기밀">기밀</option>
                  </select>
                </td>
              </tr>
              
              {/* 4행 */}
              <tr className="bg-white h-8">
                <td className={headerCell}>모델 연식 / 플랫폼</td>
                <td className={`${inputCell}`}>
                  <input type="text" value={cpInfo.modelYear} onChange={(e) => updateField('modelYear', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="모델/플랫폼" />
                </td>
                <td className={headerCell}>프로젝트명</td>
                <td className={`${inputCell}`} colSpan={5}>
                  <input type="text" value={cpInfo.cpProjectName} onChange={(e) => updateField('cpProjectName', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none placeholder:text-gray-400" placeholder="프로젝트명" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== CP 작성 옵션 (테이블) ===== */}
        <div className="mb-3 mt-4">
          <table className="border-collapse text-xs table-auto">
            <tbody>
              <tr className="h-8">
                <td className="bg-[#0d9488] text-white px-3 py-1.5 border border-gray-400 font-bold text-center whitespace-nowrap">
                  CP 작성 옵션
                </td>
                <td 
                  onClick={() => window.location.href = `/control-plan?linkedFmeaId=${linkedFmeaId}`}
                  className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-teal-200 whitespace-nowrap font-semibold text-teal-700 bg-teal-50"
                >
                  FMEA 데이터에서 가져오기
                </td>
                <td 
                  onClick={() => window.location.href = `/control-plan`}
                  className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-green-200 whitespace-nowrap font-semibold text-green-700 bg-green-50"
                >
                  신규 CP 작성
                </td>
                <td 
                  onClick={() => window.location.href = `/control-plan`}
                  className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-yellow-300 whitespace-nowrap font-semibold bg-yellow-100 text-teal-600"
                >
                  ➡️ CP 작성화면으로 이동
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== 연동된 FMEA 정보 ===== */}
        {linkedFmeaId && (
          <div className="bg-yellow-50 rounded border border-yellow-300 p-3 mb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-yellow-600 font-bold">🔗 연동된 FMEA:</span>
              <span className="text-gray-700">
                {fmeaList.find(f => f.id === linkedFmeaId)?.fmeaInfo?.subject || linkedFmeaId}
              </span>
              <a 
                href={`/pfmea/worksheet?id=${linkedFmeaId}`}
                className="ml-auto px-2 py-1 bg-yellow-500 text-white rounded text-[10px] hover:bg-yellow-600"
              >
                FMEA 열기
              </a>
            </div>
          </div>
        )}

        {/* 하단 상태바 */}
        <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
          <span>CP ID: {cpId}</span>
          <span>버전: CP Suite v1.0 | 사용자: CP Lead</span>
        </div>

        {/* 모달 */}
        <BizInfoSelectModal
          isOpen={bizInfoModalOpen}
          onClose={() => setBizInfoModalOpen(false)}
          onSelect={handleBizInfoSelect}
        />

        <UserSelectModal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          onSelect={handleUserSelect}
        />
      </div>
    </>
  );
}

// Suspense boundary wrapper for useSearchParams
export default function CPRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">로딩 중...</div>}>
      <CPRegisterPageContent />
    </Suspense>
  );
}

