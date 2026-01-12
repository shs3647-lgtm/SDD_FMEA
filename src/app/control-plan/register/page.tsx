/**
 * @file page.tsx
 * @description Control Plan 등록 페이지 - DB 연동 + 상위 FMEA 선택
 * @version 2.0.0
 * 
 * 핵심 기능:
 * - 상위 FMEA 선택 (1:N 관계 - 하나의 FMEA에 여러 CP 가능)
 * - DB 저장 (control_plans 테이블)
 * - FMEA 기초정보 공유
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BizInfoSelectModal } from '@/components/modals/BizInfoSelectModal';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { BizInfoProject } from '@/types/bizinfo';
import { UserInfo } from '@/types/user';
import CPTopNav from '@/components/layout/CPTopNav';

// =====================================================
// 타입 정의
// =====================================================
interface FmeaProject {
  id: string;
  fmeaId: string;
  fmeaNo: string;
  projectName: string;
  productName: string;
  partNo: string;
  customerName: string;
  status: string;
}

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

// =====================================================
// 메인 컴포넌트
// =====================================================
function CPRegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id');
  const preselectedFmeaId = searchParams.get('fmeaId');
  const isEditMode = !!editId;

  const [cpInfo, setCpInfo] = useState<CPInfo>(INITIAL_CP);
  const [cpNo, setCpNo] = useState('');
  
  // 모달 상태
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalTarget, setUserModalTarget] = useState<'responsible' | 'other'>('responsible');
  
  // 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // FMEA 연동
  const [fmeaList, setFmeaList] = useState<FmeaProject[]>([]);
  const [linkedFmeaId, setLinkedFmeaId] = useState<string>(preselectedFmeaId || '');
  const [loading, setLoading] = useState(true);

  // 초기화: FMEA 목록 로드 (DB에서)
  useEffect(() => {
    const loadFmeaList = async () => {
      try {
        const response = await fetch('/api/pfmea');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setFmeaList(result.data);
          }
        }
      } catch (error) {
        console.error('FMEA 목록 로드 실패:', error);
        // fallback to localStorage
        const storedFmea = localStorage.getItem('pfmea-projects');
        if (storedFmea) {
          try {
            const parsed = JSON.parse(storedFmea);
            setFmeaList(parsed.map((f: any) => ({
              id: f.id,
              fmeaId: f.fmeaId || f.id,
              fmeaNo: f.fmeaNo || f.id,
              projectName: f.project?.projectName || f.fmeaInfo?.cpProjectName || '',
              productName: f.project?.productName || f.fmeaInfo?.subject || '',
              partNo: f.project?.partNo || '',
              customerName: f.project?.customer || f.fmeaInfo?.customerName || '',
              status: f.status || 'draft',
            })));
          } catch (e) {
            console.error('localStorage 파싱 실패:', e);
          }
        }
      }
      setLoading(false);
    };

    loadFmeaList();
  }, []);

  // 수정 모드: 기존 CP 데이터 로드
  useEffect(() => {
    if (isEditMode && editId) {
      const loadCP = async () => {
        try {
          const response = await fetch(`/api/control-plan/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const cp = result.data;
              setCpNo(cp.cpNo);
              setLinkedFmeaId(cp.fmeaId || '');
              setCpInfo({
                companyName: cp.customer || '',
                engineeringLocation: '',
                customerName: cp.customer || '',
                modelYear: '',
                subject: cp.partName || '',
                cpStartDate: '',
                cpRevisionDate: cp.revDate || '',
                cpProjectName: cp.projectName || '',
                cpId: cp.cpNo,
                processResponsibility: '',
                confidentialityLevel: '',
                cpResponsibleName: cp.preparedBy || '',
              });
            }
          }
        } catch (error) {
          console.error('CP 로드 실패:', error);
        }
      };
      loadCP();
    }
  }, [isEditMode, editId]);

  // 새 CP 번호 생성
  useEffect(() => {
    if (!isEditMode && !cpNo) {
      const year = new Date().getFullYear().toString().slice(-2);
      const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setCpNo(`cp${year}-M${seq}`);
    }
  }, [isEditMode, cpNo]);

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

  // FMEA 연동 - FMEA 선택 시 기초정보 자동 채우기
  const handleFmeaLink = (fmeaId: string) => {
    setLinkedFmeaId(fmeaId);
    if (fmeaId) {
      const fmea = fmeaList.find(f => f.id === fmeaId || f.fmeaId === fmeaId);
      if (fmea) {
        // FMEA No 기반으로 CP No 생성 (pfm26-M001 → cp26-M001)
        const newCpNo = fmea.fmeaNo?.replace('pfm', 'cp') || cpNo;
        setCpNo(newCpNo);
        
        setCpInfo(prev => ({
          ...prev,
          customerName: fmea.customerName || '',
          subject: fmea.productName || '',
          cpProjectName: fmea.projectName || '',
        }));
      }
    }
  };

  // 저장 (DB)
  const handleSave = async () => {
    if (!linkedFmeaId) {
      alert('⚠️ 상위 FMEA를 선택해주세요.\n\nControl Plan은 반드시 FMEA와 연결되어야 합니다.');
      return;
    }

    if (!cpInfo.subject.trim()) {
      alert('CP명을 입력해주세요.');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const payload = {
        cpNo,
        fmeaId: linkedFmeaId,
        fmeaNo: fmeaList.find(f => f.id === linkedFmeaId)?.fmeaNo || linkedFmeaId,
        projectName: cpInfo.cpProjectName,
        partName: cpInfo.subject,
        customer: cpInfo.customerName,
        preparedBy: cpInfo.cpResponsibleName,
        cpInfo,
      };

      const url = isEditMode ? `/api/control-plan/${editId}` : '/api/control-plan';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => {
          router.push('/control-plan/list');
        }, 1500);
      } else {
        setSaveStatus('error');
        setErrorMessage(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setSaveStatus('error');
      setErrorMessage('네트워크 오류');
    }
  };

  // 새로고침
  const handleRefresh = () => {
    if (confirm('입력한 내용을 초기화하시겠습니까?')) {
      setCpInfo(INITIAL_CP);
      setLinkedFmeaId('');
      const year = new Date().getFullYear().toString().slice(-2);
      const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setCpNo(`cp${year}-M${seq}`);
    }
  };

  // 테이블 셀 스타일
  const headerCell = "bg-[#0d9488] text-white px-2 py-1.5 border border-white font-semibold text-xs text-center align-middle whitespace-nowrap";
  const inputCell = "border border-gray-300 px-1 py-0.5";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      {/* 상단 고정 바로가기 메뉴 */}
      <CPTopNav selectedCpId={cpNo} />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isEditMode ? '✏️' : '📝'}</span>
            <h1 className="text-sm font-bold text-gray-800">Control Plan {isEditMode ? '수정' : '등록'}</h1>
            <span className="text-xs text-gray-500 ml-2">CP No: {cpNo}</span>
            {isEditMode && <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded font-bold">수정모드</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleRefresh} className="px-3 py-1.5 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200">
              🔄 새로고침
            </button>
            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-1.5 text-xs font-bold rounded ${
                saveStatus === 'saved' ? 'bg-green-500 text-white' : 
                saveStatus === 'saving' ? 'bg-gray-400 text-white' :
                saveStatus === 'error' ? 'bg-red-500 text-white' :
                'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {saveStatus === 'saved' ? '✓ 저장됨' : 
               saveStatus === 'saving' ? '저장 중...' :
               saveStatus === 'error' ? '⚠️ 오류' :
               '💾 저장'}
            </button>
          </div>
        </div>

        {/* 오류 메시지 */}
        {errorMessage && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ===== 상위 FMEA 선택 (필수) ===== */}
        <div className="bg-yellow-50 rounded border-2 border-yellow-400 mb-3 p-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-yellow-800">🔗 상위 FMEA 선택 (필수)</span>
            <select
              value={linkedFmeaId}
              onChange={(e) => handleFmeaLink(e.target.value)}
              className={`flex-1 h-8 px-3 text-xs border rounded focus:outline-none ${
                linkedFmeaId ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-white'
              }`}
            >
              <option value="">-- FMEA를 선택하세요 --</option>
              {fmeaList.map(fmea => (
                <option key={fmea.id} value={fmea.id}>
                  [{fmea.fmeaNo || fmea.id}] {fmea.productName || fmea.projectName}
                </option>
              ))}
            </select>
            {linkedFmeaId && (
              <a 
                href={`/pfmea/worksheet?id=${linkedFmeaId}`}
                target="_blank"
                className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
              >
                FMEA 열기 ↗
              </a>
            )}
          </div>
          {!linkedFmeaId && (
            <p className="mt-2 text-xs text-yellow-700">
              ⚠️ 하나의 FMEA에 여러 개의 Control Plan을 등록할 수 있습니다.
            </p>
          )}
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
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="회사 명" />
                </td>
                <td className={`${headerCell} w-[8%]`}>CP명</td>
                <td className={`${inputCell} w-[17%]`}>
                  <input type="text" value={cpInfo.subject} onChange={(e) => updateField('subject', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="품명 또는 제품명" />
                </td>
                <td className={`${headerCell} w-[10%]`}>CP No</td>
                <td className={`${inputCell} w-[10%]`}>
                  <span className="px-2 text-xs text-teal-600 font-bold">{cpNo}</span>
                </td>
                <td className={`${headerCell} w-[10%]`}>연결 FMEA</td>
                <td className={`${inputCell} w-[20%]`}>
                  <span className="px-2 text-xs text-blue-600">
                    {linkedFmeaId ? fmeaList.find(f => f.id === linkedFmeaId)?.fmeaNo || linkedFmeaId : '미연결'}
                  </span>
                </td>
              </tr>
              
              {/* 2행 */}
              <tr className="bg-white h-8">
                <td className={headerCell}>엔지니어링 위치</td>
                <td className={`${inputCell}`}>
                  <input type="text" value={cpInfo.engineeringLocation} onChange={(e) => updateField('engineeringLocation', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="지리적 위치" />
                </td>
                <td className={headerCell}>시작 일자</td>
                <td className={`${inputCell}`}>
                  <input type="date" value={cpInfo.cpStartDate} onChange={(e) => updateField('cpStartDate', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                </td>
                <td className={headerCell}>공정 책임</td>
                <td className={`${inputCell}`}>
                  <input type="text" value={cpInfo.processResponsibility} onChange={(e) => updateField('processResponsibility', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="부서" />
                </td>
                <td className={headerCell}>CP 책임자</td>
                <td className={`${inputCell}`}>
                  <div className="flex items-center gap-1">
                    <input type="text" value={cpInfo.cpResponsibleName} onChange={(e) => updateField('cpResponsibleName', e.target.value)}
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="CP 책임자 성명" />
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
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="고객 명" />
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
                <td className={headerCell}>모델 연식</td>
                <td className={`${inputCell}`}>
                  <input type="text" value={cpInfo.modelYear} onChange={(e) => updateField('modelYear', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="모델/플랫폼" />
                </td>
                <td className={headerCell}>프로젝트명</td>
                <td className={`${inputCell}`} colSpan={5}>
                  <input type="text" value={cpInfo.cpProjectName} onChange={(e) => updateField('cpProjectName', e.target.value)}
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="프로젝트명" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== CP 작성 옵션 ===== */}
        <div className="mb-3">
          <table className="border-collapse text-xs table-auto">
            <tbody>
              <tr className="h-8">
                <td className="bg-[#0d9488] text-white px-3 py-1.5 border border-gray-400 font-bold text-center whitespace-nowrap">
                  CP 작성 옵션
                </td>
                <td 
                  onClick={() => linkedFmeaId && router.push(`/control-plan/worksheet?cpNo=${cpNo}&fmeaId=${linkedFmeaId}&sync=true`)}
                  className={`px-3 py-1.5 border border-gray-400 text-center whitespace-nowrap font-semibold ${
                    linkedFmeaId 
                      ? 'cursor-pointer hover:bg-teal-200 text-teal-700 bg-teal-50' 
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  FMEA 데이터에서 가져오기
                </td>
                <td 
                  onClick={() => router.push(`/control-plan/worksheet?cpNo=${cpNo}`)}
                  className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-green-200 whitespace-nowrap font-semibold text-green-700 bg-green-50"
                >
                  신규 CP 작성
                </td>
                <td 
                  onClick={() => router.push(`/control-plan/worksheet?cpNo=${cpNo}&fmeaId=${linkedFmeaId}`)}
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
          <div className="bg-blue-50 rounded border border-blue-300 p-3 mb-3">
            <div className="text-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 font-bold">📋 연동된 FMEA 정보</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-gray-700">
                <div><span className="text-gray-500">FMEA No:</span> {fmeaList.find(f => f.id === linkedFmeaId)?.fmeaNo}</div>
                <div><span className="text-gray-500">제품명:</span> {fmeaList.find(f => f.id === linkedFmeaId)?.productName}</div>
                <div><span className="text-gray-500">고객:</span> {fmeaList.find(f => f.id === linkedFmeaId)?.customerName}</div>
                <div><span className="text-gray-500">상태:</span> {fmeaList.find(f => f.id === linkedFmeaId)?.status}</div>
              </div>
            </div>
          </div>
        )}

        {/* 하단 상태바 */}
        <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
          <span>CP No: {cpNo} | 연결 FMEA: {linkedFmeaId || '없음'}</span>
          <span>Control Plan Suite v2.0 | DB 연동</span>
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
