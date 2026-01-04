/**
 * @file page.tsx
 * @description APQP 등록 페이지 - FMEA 등록과 동일한 구조
 * @version 1.0.0
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

function generateAPQPId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PJ${year}-${seq}`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
function APQPRegisterPageContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;

  const [apqpInfo, setApqpInfo] = useState<APQPInfo>(INITIAL_APQP);
  const [cftMembers, setCftMembers] = useState<CFTMember[]>(createInitialCFTMembers());
  const [apqpId, setApqpId] = useState('');
  
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [userModalTarget, setUserModalTarget] = useState<'responsible' | 'cft'>('cft');
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [cftSaveStatus, setCftSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    if (isEditMode && editId) {
      const existingProject = APQPStorage.getProjectDetail(editId);
      if (existingProject) {
        setApqpId(existingProject.id);
        setApqpInfo({
          companyName: '',
          engineeringLocation: '',
          customerName: existingProject.customer || '',
          modelYear: '',
          subject: existingProject.projectName || '',
          apqpStartDate: existingProject.startDate || '',
          apqpRevisionDate: '',
          apqpProjectName: existingProject.projectName || '',
          apqpId: existingProject.id,
          processResponsibility: '',
          confidentialityLevel: '',
          apqpResponsibleName: existingProject.createdBy || '',
        });
      }
    } else {
      setApqpId(generateAPQPId());
    }
  }, [isEditMode, editId]);

  const updateField = (field: keyof APQPInfo, value: string) => {
    setApqpInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBizInfoSelect = (info: BizInfoProject) => {
    setApqpInfo(prev => ({
      ...prev,
      companyName: info.customerName || '',
      customerName: info.customerName || '',
      modelYear: info.modelYear || '',
      apqpProjectName: info.program || '',
      subject: info.productName || '',
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

  const handleCftSave = () => {
    localStorage.setItem('apqp-cft-data', JSON.stringify(cftMembers));
    setCftSaveStatus('saved');
    setTimeout(() => setCftSaveStatus('idle'), 3000);
  };

  const handleCftReset = () => {
    if (confirm('CFT 목록을 초기화하시겠습니까?')) {
      localStorage.removeItem('apqp-cft-data');
      setCftMembers(createInitialCFTMembers());
    }
  };

  const handleSave = () => {
    if (!apqpInfo.subject.trim()) {
      alert('APQP명을 입력해주세요.');
      return;
    }

    const now = new Date();
    const project: APQPProject = {
      id: apqpId,
      projectName: apqpInfo.subject,
      customer: apqpInfo.customerName,
      factory: apqpInfo.engineeringLocation,
      productName: apqpInfo.apqpProjectName,
      startDate: apqpInfo.apqpStartDate || now.toISOString().split('T')[0],
      endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      stages: [
        { id: 'stage-1', label: 'Stage 1: 계획 및 정의', expanded: true, activities: [] },
        { id: 'stage-2', label: 'Stage 2: 제품 설계 및 개발', expanded: true, activities: [] },
        { id: 'stage-3', label: 'Stage 3: 공정 설계 및 개발', expanded: true, activities: [] },
        { id: 'stage-4', label: 'Stage 4: 제품 및 공정 검증', expanded: true, activities: [] },
        { id: 'stage-5', label: 'Stage 5: 양산 준비', expanded: true, activities: [] },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: apqpInfo.apqpResponsibleName || 'System',
    };

    APQPStorage.saveProjectDetail(apqpId, project);
    
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
      window.location.href = '/apqp/list';
    }, 1500);
  };

  const handleRefresh = () => {
    if (confirm('입력한 내용을 초기화하시겠습니까?')) {
      setApqpInfo(INITIAL_APQP);
      setCftMembers(createInitialCFTMembers());
      setApqpId(generateAPQPId());
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
            <button onClick={handleRefresh} className="px-3 py-1.5 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200">
              🔄 새로고침
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
        <div className="bg-white rounded border border-gray-300 mb-3">
          <div className="bg-[#dbeafe] px-3 py-1.5 border-b border-gray-300">
            <h2 className="text-xs font-bold text-gray-700">기획 및 준비 (1단계)</h2>
          </div>
          
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="bg-[#dbeafe] h-8">
                <td className={`${headerCell} w-[10%]`}>회사 명</td>
                <td className={`${inputCell} w-[15%]`}>
                  <input type="text" value={apqpInfo.companyName} onChange={(e) => updateField('companyName', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="회사명" />
                </td>
                <td className={`${headerCell} w-[8%]`}>APQP명</td>
                <td className={`${inputCell} w-[17%]`}>
                  <input type="text" value={apqpInfo.subject} onChange={(e) => updateField('subject', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="APQP 프로젝트명" />
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
                  <input type="text" value={apqpInfo.engineeringLocation} onChange={(e) => updateField('engineeringLocation', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="지리적 위치" />
                </td>
                <td className={headerCell}>시작 일자</td>
                <td className={inputCell}>
                  <input type="date" value={apqpInfo.apqpStartDate} onChange={(e) => updateField('apqpStartDate', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                </td>
                <td className={headerCell}>공정 책임</td>
                <td className={inputCell}>
                  <input type="text" value={apqpInfo.processResponsibility} onChange={(e) => updateField('processResponsibility', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="부서" />
                </td>
                <td className={inputCell}>
                  <div className="flex items-center gap-1">
                    <input type="text" value={apqpInfo.apqpResponsibleName} onChange={(e) => updateField('apqpResponsibleName', e.target.value)} className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="APQP 책임자 성명" />
                    <button onClick={() => { setUserModalTarget('responsible'); setUserModalOpen(true); }} className="text-blue-500 hover:text-blue-700">🔍</button>
                  </div>
                </td>
              </tr>
              
              <tr className="bg-[#dbeafe] h-8">
                <td className={headerCell}>고객 명</td>
                <td className={inputCell}>
                  <div className="flex items-center gap-1">
                    <input type="text" value={apqpInfo.customerName} onChange={(e) => updateField('customerName', e.target.value)} className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="고객(들)" />
                    <button onClick={() => setBizInfoModalOpen(true)} className="text-blue-500 hover:text-blue-700">🔍</button>
                  </div>
                </td>
                <td className={headerCell}>개정 일자</td>
                <td className={inputCell}>
                  <input type="date" value={apqpInfo.apqpRevisionDate} onChange={(e) => updateField('apqpRevisionDate', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
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
                  <input type="text" value={apqpInfo.modelYear} onChange={(e) => updateField('modelYear', e.target.value)} className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" placeholder="모델/스타일" />
                </td>
                <td className={headerCell}>상호기능팀</td>
                <td className={inputCell} colSpan={4}>
                  <span className="text-xs text-gray-500 px-2">{cftNames || '팀 명단이 요구됨'}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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







