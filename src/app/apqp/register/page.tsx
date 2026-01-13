/**
 * @file page.tsx
 * @description APQP 등록 페이지 - FMEA 등록과 동일한 구조
 * @version 1.0.0
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
import APQPTopNav from '@/components/layout/APQPTopNav';
import { APQPProject } from '@/types/apqp-project';
import { APQPStorage } from '@/utils/apqp-storage';


// =====================================================
// 타입 정의
// =====================================================
interface APQPInfo {
  companyName: string;
  engineeringLocation: string;
  customerName: string;
  modelYear: string;
  subject: string;
  apqpStartDate: string;
  apqpRevisionDate: string;
  apqpProjectName: string;
  apqpId: string;
  processResponsibility: string;
  confidentialityLevel: string;
  apqpResponsibleName: string;
}

const INITIAL_APQP: APQPInfo = {
  companyName: '',
  engineeringLocation: '',
  customerName: '',
  modelYear: '',
  subject: '',
  apqpStartDate: '',
  apqpRevisionDate: '',
  apqpProjectName: '',
  apqpId: '',
  processResponsibility: '',
  confidentialityLevel: '',
  apqpResponsibleName: '',
};

/**
 * APQP ID 생성 규칙
 * 형식: pj{YY}-{NNN}
 * 예: pj26-001, pj26-002
 * ★ 2026-01-13: 소문자로 통일 (DB 일관성, PostgreSQL 호환성)
 */
function generateAPQPId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  try {
    const stored = localStorage.getItem('apqp-projects');
    if (stored) {
      const projects = JSON.parse(stored);
      const prefix = `pj${year}-`;
      const currentIds = projects
        .filter((p: { id: string }) => p.id?.toLowerCase().startsWith(prefix))
        .map((p: { id: string }) => {
          const match = p.id.match(/\d{3}$/);
          return match ? parseInt(match[0]) : 0;
        });
      if (currentIds.length > 0) {
        const maxSeq = Math.max(...currentIds);
        return `pj${year}-${(maxSeq + 1).toString().padStart(3, '0')}`;
      }
    }
  } catch (e) {
    console.error('ID 생성 중 오류:', e);
  }
  return `pj${year}-001`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
function APQPRegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id')?.toLowerCase() || null; // ★ 소문자 정규화
  const isEditMode = !!editId;

  const [apqpInfo, setApqpInfo] = useState<APQPInfo>(INITIAL_APQP);
  const [cftMembers, setCftMembers] = useState<CFTMember[]>(createInitialCFTMembers());
  const [apqpId, setApqpId] = useState('');
  
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  
  const [userModalTarget, setUserModalTarget] = useState<'responsible' | 'cft'>('cft');
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [cftSaveStatus, setCftSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [loading, setLoading] = useState(false);


  // ★ DB API에서 APQP 데이터 로드 (CP와 동일한 구조)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let targetId = editId;

      // 마지막 작업 APQP 자동 로드
      if (!isEditMode) {
        const lastEditedId = localStorage.getItem('apqp-last-edited');
        if (lastEditedId) {
          targetId = lastEditedId;
        }
      }

      if (targetId) {
        try {
          // DB API에서 APQP 데이터 로드
          const response = await fetch(`/api/apqp?apqpNo=${targetId}`);
          const result = await response.json();

          if (result.success && result.apqp) {
            const apqp = result.apqp;
            setApqpId(apqp.apqpNo);
            setApqpInfo({
              companyName: apqp.companyName || '',
              engineeringLocation: apqp.engineeringLocation || '',
              customerName: apqp.customerName || '',
              modelYear: apqp.modelYear || '',
              subject: apqp.subject || '',
              apqpStartDate: apqp.apqpStartDate || '',
              apqpRevisionDate: apqp.apqpRevisionDate || '',
              apqpProjectName: apqp.productName || apqp.subject || '',
              apqpId: apqp.apqpNo,
              processResponsibility: apqp.processResponsibility || '',
              confidentialityLevel: apqp.confidentialityLevel || '',
              apqpResponsibleName: apqp.apqpResponsibleName || '',
            });

            // CFT 멤버 로드
            if (apqp.cftMembers && apqp.cftMembers.length > 0) {
              const loadedMembers = apqp.cftMembers.map((m: any) => ({
                role: m.role || '',
                factory: m.factory || '',
                department: m.department || '',
                name: m.name || '',
                position: m.position || '',
                phone: m.phone || '',
                email: m.email || '',
                remark: m.remark || '',
              }));
              // 10행까지 채우기
              while (loadedMembers.length < 10) {
                loadedMembers.push({ role: '', factory: '', department: '', name: '', position: '', phone: '', email: '', remark: '' });
              }
              setCftMembers(loadedMembers);
            }

            // URL 업데이트
            if (!isEditMode) {
              router.replace(`/apqp/register?id=${apqp.apqpNo}`);
            }
            console.log('[APQP 등록] ✅ DB에서 APQP 로드 완료:', apqp.apqpNo);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn('[APQP 등록] DB 로드 실패, 신규 ID 생성:', error);
        }
      }

      // DB에 없으면 신규 ID 생성
      setApqpId(generateAPQPId());
      setLoading(false);
    };

    loadData();
  }, [isEditMode, editId, router]);

  const updateField = (field: keyof APQPInfo, value: string) => {
    setApqpInfo(prev => ({ ...prev, [field]: value }));
  };

  // 기초정보 선택 (고객 정보만 설정, 회사명/APQP명은 수동 입력) - FMEA와 동일
  const handleBizInfoSelect = (info: BizInfoProject) => {
    setApqpInfo(prev => ({
      ...prev,
      // ★ companyName(회사명)은 작성 회사이므로 고객명과 분리 - 수동 입력
      // ★ apqpProjectName(APQP명)도 수동 입력
      // ★ subject도 수동 입력
      customerName: info.customerName || '',  // 고객명만 설정
      modelYear: info.modelYear || '',        // 모델년도
    }));
    setBizInfoModalOpen(false);
  };

  const handleUserSelect = (user: UserInfo) => {
    if (userModalTarget === 'responsible') {
      setApqpInfo(prev => ({
        ...prev,
        apqpResponsibleName: user.name || '',
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

  const handleCftUserSearch = (index: number) => {
    setSelectedMemberIndex(index);
    setUserModalTarget('cft');
    setUserModalOpen(true);
  };

  // ★ CFT 저장도 메인 저장에 포함 (DB 저장)
  const handleCftSave = async () => {
    setCftSaveStatus('saved');
    // 메인 저장과 함께 DB에 저장됨 (별도 저장 불필요하지만 UI 피드백 제공)
    await handleSave();
    setTimeout(() => setCftSaveStatus('idle'), 3000);
  };

  const handleCftReset = () => {
    if (confirm('CFT 목록을 초기화하시겠습니까?')) {
      setCftMembers(createInitialCFTMembers());
    }
  };

  // ★ DB API로 저장 (신규/수정 자동 판단)
  const handleSave = async () => {
    if (!apqpInfo.subject.trim()) {
      alert('APQP명을 입력해주세요.');
      return;
    }

    setSaveStatus('saving');

    try {
      // ★ 1단계: 기존 데이터 존재 여부 확인
      const checkResponse = await fetch(`/api/apqp?apqpNo=${apqpId}`);
      const checkResult = await checkResponse.json();
      const exists = checkResult.success && checkResult.apqp;

      // ★ 2단계: 존재하면 PUT, 없으면 POST (자동 판단)
      const method = exists ? 'PUT' : 'POST';
      console.log(`[APQP 저장] ${method} 요청 - ID: ${apqpId}, 기존데이터: ${exists ? '있음' : '없음'}`);

      const response = await fetch('/api/apqp', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apqpNo: apqpId,
          apqpInfo: {
            companyName: apqpInfo.companyName,
            engineeringLocation: apqpInfo.engineeringLocation,
            customerName: apqpInfo.customerName,
            modelYear: apqpInfo.modelYear,
            subject: apqpInfo.subject,
            apqpStartDate: apqpInfo.apqpStartDate,
            apqpRevisionDate: apqpInfo.apqpRevisionDate,
            processResponsibility: apqpInfo.processResponsibility,
            confidentialityLevel: apqpInfo.confidentialityLevel,
            apqpResponsibleName: apqpInfo.apqpResponsibleName,
            productName: apqpInfo.apqpProjectName,
          },
          cftMembers: cftMembers.filter(m => m.name && m.name.trim()),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'DB 저장 실패');
      }

      console.log('✅ APQP DB 저장 완료:', result.apqpNo);

      // ★ 마지막 작업 APQP ID 저장 (다음 방문 시 자동 로드용)
      localStorage.setItem('apqp-last-edited', apqpId);

      setSaveStatus('saved');

      // ★ 저장 후 URL을 수정 모드로 업데이트
      router.replace(`/apqp/register?id=${apqpId}`);

      // ★ 리얼타임 업데이트: 저장 성공 이벤트 발생 (리스트 새로고침용)
      window.dispatchEvent(new CustomEvent('apqp-saved', { detail: { apqpNo: apqpId } }));

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);

    } catch (error: any) {
      console.error('❌ APQP 저장 실패:', error);
      alert(`저장에 실패했습니다: ${error.message}`);
      setSaveStatus('idle');
    }
  };

  // ★ 새로 등록 - 초기화 후 새 ID 생성
  const handleNewRegister = () => {
    if (confirm('새로운 APQP를 등록하시겠습니까?\n현재 화면의 내용은 초기화됩니다.')) {
      setApqpInfo(INITIAL_APQP);
      setCftMembers(createInitialCFTMembers());
      setApqpId(generateAPQPId());
      
      // ★ 마지막 작업 APQP 기록 삭제 (새 APQP 등록 시작)
      localStorage.removeItem('apqp-last-edited');
      
      // ★ URL 초기화 (수정 모드 해제)
      router.replace('/apqp/register');
    }
  };

  const [accessLogs] = useState<CFTAccessLog[]>([
    { id: 1, projectId: apqpId, userName: '김철수', loginTime: '2025-12-26 09:00', logoutTime: '2025-12-26 12:30', action: '수정', itemType: 'APQP', cellAddress: 'A1:B5', description: 'APQP 프로젝트 정보 수정' },
  ]);

  const headerCell = "bg-[#2563eb] text-white px-2 py-1.5 border border-white font-semibold text-xs text-center align-middle";
  const inputCell = "border border-gray-300 px-1 py-0.5";
  const cftNames = cftMembers.filter(m => m.name).map(m => m.name).join(', ');

  return (
    <>
      <APQPTopNav />
      
      <div className="min-h-screen bg-[#f0f0f0] px-3 py-3 pt-9 font-[Malgun_Gothic]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isEditMode ? '✏️' : '📝'}</span>
            <h1 className="text-sm font-bold text-gray-800">APQP {isEditMode ? '수정' : '등록'}</h1>
            <span className="text-xs text-gray-500 ml-2">ID: {apqpId}</span>
            {isEditMode && <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded font-bold">수정모드</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleNewRegister} className="px-3 py-1.5 bg-green-100 border border-green-400 text-green-700 text-xs rounded hover:bg-green-200 font-semibold">
              ➕ 새로 등록
            </button>
            <button 
              onClick={handleSave}
              className={`px-4 py-1.5 text-xs font-bold rounded ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'}`}
            >
              {saveStatus === 'saved' ? '✓ 저장됨' : '💾 저장'}
            </button>
          </div>
        </div>

        {/* 기획 및 준비 (1단계) */}
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white rounded border border-gray-300 mb-3">
          <div className="bg-[#dbeafe] px-3 py-1.5 border-b border-gray-300">
            <h2 className="text-xs font-bold text-gray-700">기획 및 준비 (1단계)</h2>
          </div>
          
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="bg-[#dbeafe] h-8">
                <td className={`${headerCell} w-[10%]`}>회사 명</td>
                <td className={`${inputCell} w-[15%]`}>
                  <input 
                    type="text" 
                    name="apqp-company-name-x1" 
                    autoComplete="new-password" 
                    data-lpignore="true" 
                    data-form-type="other" 
                    value={apqpInfo.companyName} 
                    onChange={(e) => updateField('companyName', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                    placeholder="회사명" 
                  />
                </td>
                <td className={`${headerCell} w-[8%]`}>APQP명</td>
                <td className={`${inputCell} w-[17%]`}>
                  <input 
                    type="text" 
                    name="apqp-subject-x1" 
                    autoComplete="new-password" 
                    data-lpignore="true" 
                    data-form-type="other" 
                    value={apqpInfo.subject} 
                    onChange={(e) => updateField('subject', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                    placeholder="APQP 프로젝트명" 
                  />
                </td>
                <td className={`${headerCell} w-[10%]`}>APQP ID 번호</td>
                <td className={`${inputCell} w-[10%]`}>
                  <span className="px-2 text-xs text-gray-600">{apqpId}</span>
                </td>
                <td className={`${headerCell} w-[10%]`}>회사에 의해 결정됨</td>
              </tr>
              
              <tr className="bg-white h-8">
                <td className={headerCell}>엔지니어링 위치</td>
                <td className={inputCell}>
                  <input 
                    type="text" 
                    name="apqp-location-x1" 
                    autoComplete="new-password" 
                    data-lpignore="true" 
                    data-form-type="other" 
                    value={apqpInfo.engineeringLocation} 
                    onChange={(e) => updateField('engineeringLocation', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                    placeholder="지리적 위치" 
                  />
                </td>
                <td className={headerCell}>시작 일자</td>
                <td className={inputCell}>
                  <input 
                    type="date" 
                    name="apqp-start-date-x1" 
                    autoComplete="new-password" 
                    value={apqpInfo.apqpStartDate} 
                    onChange={(e) => updateField('apqpStartDate', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                  />
                </td>
                <td className={headerCell}>공정 책임</td>
                <td className={inputCell}>
                  <input 
                    type="text" 
                    name="apqp-dept-x1" 
                    autoComplete="new-password" 
                    data-lpignore="true" 
                    data-form-type="other" 
                    value={apqpInfo.processResponsibility} 
                    onChange={(e) => updateField('processResponsibility', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                    placeholder="부서" 
                  />
                </td>
                <td className={inputCell}>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      name="apqp-responsible-x1" 
                      autoComplete="new-password" 
                      data-lpignore="true" 
                      data-form-type="other" 
                      value={apqpInfo.apqpResponsibleName} 
                      onChange={(e) => updateField('apqpResponsibleName', e.target.value)} 
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                      placeholder="APQP 책임자 성명" 
                    />
                    <button onClick={() => { setUserModalTarget('responsible'); setUserModalOpen(true); }} className="text-blue-500 hover:text-blue-700">🔍</button>
                  </div>
                </td>
              </tr>
              
              <tr className="bg-[#dbeafe] h-8">
                <td className={headerCell}>고객 명</td>
                <td className={inputCell}>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      name="apqp-customer-x1" 
                      autoComplete="new-password" 
                      data-lpignore="true" 
                      data-form-type="other" 
                      value={apqpInfo.customerName} 
                      onChange={(e) => updateField('customerName', e.target.value)} 
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                      placeholder="고객(들)" 
                    />
                    <button onClick={() => setBizInfoModalOpen(true)} className="text-blue-500 hover:text-blue-700">🔍</button>
                  </div>
                </td>
                <td className={headerCell}>개정 일자</td>
                <td className={inputCell}>
                  <input 
                    type="date" 
                    name="apqp-revision-date-x1" 
                    autoComplete="new-password" 
                    value={apqpInfo.apqpRevisionDate} 
                    onChange={(e) => updateField('apqpRevisionDate', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                  />
                </td>
                <td className={headerCell}>기밀유지 수준</td>
                <td className={inputCell} colSpan={2}>
                  <select value={apqpInfo.confidentialityLevel} onChange={(e) => updateField('confidentialityLevel', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none">
                    <option value="">선택</option>
                    <option value="사업용도">사업용도</option>
                    <option value="독점">독점</option>
                    <option value="기밀">기밀</option>
                  </select>
                </td>
              </tr>
              
              <tr className="bg-white h-8">
                <td className={headerCell}>모델 연식 / 플랫폼</td>
                <td className={inputCell}>
                  <input 
                    type="text" 
                    name="apqp-model-year-x1" 
                    autoComplete="new-password" 
                    data-lpignore="true" 
                    data-form-type="other" 
                    value={apqpInfo.modelYear} 
                    onChange={(e) => updateField('modelYear', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" 
                    placeholder="모델/스타일" 
                  />
                </td>
                <td className={headerCell}>상호기능팀</td>
                <td className={inputCell} colSpan={4}>
                  <span className="text-xs text-gray-500 px-2">{cftNames || '팀 명단이 요구됨'}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </form>

        {/* APQP 기초정보 등록 옵션 */}
        <div className="mb-3 mt-4">
          <table className="border-collapse text-xs table-auto">
            <tbody>
              <tr className="h-8">
                <td className="bg-[#2563eb] text-white px-3 py-1.5 border border-gray-400 font-bold text-center whitespace-nowrap">APQP 기초 정보등록</td>
                <td onClick={() => window.location.href = `/apqp/worksheet?id=${apqpId}`} className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-blue-200 whitespace-nowrap font-semibold text-blue-700 bg-[#dbeafe]">APQP 작성화면으로 이동</td>
                <td onClick={() => window.location.href = `/apqp/list`} className="px-3 py-1.5 border border-gray-400 text-center cursor-pointer hover:bg-gray-200 whitespace-nowrap font-semibold text-gray-700 bg-gray-100">APQP 리스트 보기</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CFT 등록 */}
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

        {/* CFT 접속 로그 */}
        <div className="flex items-center gap-2 mt-6 mb-2">
          <span>📊</span>
          <h2 className="text-sm font-bold text-gray-700">CFT 접속 로그</h2>
        </div>
        <CFTAccessLogTable accessLogs={accessLogs} maxRows={5} />

        {/* 하단 상태바 */}
        <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
          <span>총 {cftMembers.filter(m => m.name).length}명의 CFT 멤버 | 접속 로그 {accessLogs.length}건</span>
          <span>버전: APQP Suite v3.0 | 사용자: APQP Lead</span>
        </div>

        {/* 모달 */}
        <BizInfoSelectModal isOpen={bizInfoModalOpen} onClose={() => setBizInfoModalOpen(false)} onSelect={handleBizInfoSelect} />
        <UserSelectModal isOpen={userModalOpen} onClose={() => { setUserModalOpen(false); setSelectedMemberIndex(null); }} onSelect={handleUserSelect} />
      </div>
    </>
  );
}

export default function APQPRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">로딩 중...</div>}>
      <APQPRegisterPageContent />
    </Suspense>
  );
}


















