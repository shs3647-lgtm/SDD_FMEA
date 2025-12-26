/**
 * @file page.tsx
 * @description PFMEA 등록 페이지 - 기초정보/사용자정보 연동
 * @version 6.0.0
 * @created 2025-12-26
 * @ref C:\01_Next_FMEA\app\fmea\components\forms\FMEARegisterForm.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { BizInfoSelectModal } from '@/components/modals/BizInfoSelectModal';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { BizInfoProject } from '@/types/bizinfo';
import { UserInfo } from '@/types/user';

// =====================================================
// 타입 정의
// =====================================================
interface ProjectInfo {
  projectName: string;
  customer: string;
  productName: string;
  partNo: string;
  modelYear: string;
  program: string;
  customerSite: string;
  department: string;
  customerManager: string;
  leader: string;
  customerEmail: string;
  startDate: string;
  protoDate: string;
  p1Date: string;
  p2Date: string;
  ppapDate: string;
  sopDate: string;
  endDate: string;
}

interface ApproverRow {
  id: string;
  role: string;
  department: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  remark: string;
}

// =====================================================
// 초기 데이터
// =====================================================
const INITIAL_PROJECT: ProjectInfo = {
  projectName: '',
  customer: '',
  productName: '',
  partNo: '',
  modelYear: new Date().getFullYear().toString(),
  program: '',
  customerSite: '',
  department: '',
  customerManager: '',
  leader: '',
  customerEmail: '',
  startDate: '',
  protoDate: '',
  p1Date: '',
  p2Date: '',
  ppapDate: '',
  sopDate: '',
  endDate: '',
};

const INITIAL_APPROVERS: ApproverRow[] = [
  { id: '1', role: 'PM', department: '', name: '', position: '', phone: '', email: '', remark: '' },
  { id: '2', role: 'CFT(담당자)', department: '', name: '', position: '', phone: '', email: '', remark: '' },
  { id: '3', role: 'Leader', department: '', name: '', position: '', phone: '', email: '', remark: '' },
];

function generateFMEAId(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FMEA-${year}-${seq}`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
export default function PFMEARegisterPage() {
  const [project, setProject] = useState<ProjectInfo>(INITIAL_PROJECT);
  const [approvers, setApprovers] = useState<ApproverRow[]>(INITIAL_APPROVERS);
  const [fmeaId, setFmeaId] = useState('');
  
  // 모달 상태
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedApproverIndex, setSelectedApproverIndex] = useState<number | null>(null);
  const [userModalTarget, setUserModalTarget] = useState<'approver' | 'department' | 'leader'>('approver');

  useEffect(() => {
    setFmeaId(generateFMEAId());
    
    // 저장된 CFT 데이터 불러오기
    const savedCft = localStorage.getItem('fmea-cft-data');
    if (savedCft) {
      try {
        setApprovers(JSON.parse(savedCft));
      } catch {
        // 파싱 오류 시 기본값 유지
      }
    }
  }, []);

  const handleProjectChange = (field: keyof ProjectInfo, value: string) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  const handleApproverChange = (index: number, field: keyof ApproverRow, value: string) => {
    const updated = [...approvers];
    updated[index] = { ...updated[index], [field]: value };
    setApprovers(updated);
  };

  const handleAddRow = () => {
    setApprovers([...approvers, {
      id: Date.now().toString(),
      role: '',
      department: '',
      name: '',
      position: '',
      phone: '',
      email: '',
      remark: '',
    }]);
  };

  const handleReset = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
      setProject(INITIAL_PROJECT);
      setApprovers([...INITIAL_APPROVERS]);
      setFmeaId(generateFMEAId());
    }
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  // CFT 관련 상태
  const [cftEditMode, setCftEditMode] = useState(false);
  const [cftSaveStatus, setCftSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [cftBackup, setCftBackup] = useState<ApproverRow[]>([]);

  // CFT 새로고침 - 저장된 데이터 불러오기
  const handleCftRefresh = () => {
    const savedCft = localStorage.getItem('fmea-cft-data');
    if (savedCft) {
      try {
        setApprovers(JSON.parse(savedCft));
      } catch {
        setApprovers([...INITIAL_APPROVERS]);
      }
    } else {
      setApprovers([...INITIAL_APPROVERS]);
    }
    setCftEditMode(false);
  };

  // CFT 수정 모드 토글
  const handleCftEdit = () => {
    if (!cftEditMode) {
      // 수정 시작: 현재 상태 백업
      setCftBackup([...approvers]);
    }
    setCftEditMode(!cftEditMode);
  };

  // CFT 저장
  const handleCftSave = () => {
    localStorage.setItem('fmea-cft-data', JSON.stringify(approvers));
    setCftSaveStatus('saved');
    setCftEditMode(false);
    setTimeout(() => setCftSaveStatus('idle'), 3000);
  };

  // CFT 취소 - 백업 데이터로 복원
  const handleCftCancel = () => {
    if (cftBackup.length > 0) {
      setApprovers([...cftBackup]);
    } else {
      setApprovers([...INITIAL_APPROVERS]);
    }
    setCftEditMode(false);
  };

  // CFT 행 삭제
  const handleDeleteRow = (index: number) => {
    if (approvers.length <= 1) {
      alert('최소 1개 행은 유지해야 합니다.');
      return;
    }
    const updated = approvers.filter((_, i) => i !== index);
    setApprovers(updated);
  };

  const handleSave = () => {
    if (!project.projectName) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    const data = { id: fmeaId, project, approvers, createdAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('fmea-projects') || '[]');
    existing.unshift(data);
    localStorage.setItem('fmea-projects', JSON.stringify(existing));
    
    // 저장 성공 상태 표시
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // 기초정보 모달 열기
  const openBizInfoModal = () => {
    setBizInfoModalOpen(true);
  };

  // 기초정보 선택 처리 (한번에 모든 필드 입력)
  const handleBizInfoSelect = (projectInfo: BizInfoProject) => {
    setProject(prev => ({
      ...prev,
      customer: projectInfo.customerName,
      customerSite: projectInfo.factory,
      modelYear: projectInfo.modelYear,
      program: projectInfo.program,
      productName: projectInfo.productName,
      partNo: projectInfo.partNo,
    }));
  };

  // 사용자 모달 열기 (승인권자용)
  const openUserModal = (index: number) => {
    setSelectedApproverIndex(index);
    setUserModalTarget('approver');
    setUserModalOpen(true);
  };

  // 사용자 모달 열기 (담당부서/Leader용)
  const openUserModalForProject = (target: 'department' | 'leader') => {
    setUserModalTarget(target);
    setUserModalOpen(true);
  };

  // 사용자 선택 처리
  const handleUserSelect = (user: UserInfo) => {
    if (userModalTarget === 'approver' && selectedApproverIndex !== null) {
      // CFT 테이블에 사용자 정보 입력
      const updated = [...approvers];
      updated[selectedApproverIndex] = {
        ...updated[selectedApproverIndex],
        department: user.department,
        name: user.name,
        position: user.position || '',
        phone: user.phone || '',
        email: user.email,
      };
      setApprovers(updated);
    } else if (userModalTarget === 'department' || userModalTarget === 'leader') {
      // 담당부서 또는 Leader 선택 시 → 둘 다 같이 입력 (관계형 데이터)
      setProject(prev => ({ 
        ...prev, 
        department: user.department,
        leader: user.name 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4 font-[Malgun_Gothic]">
      {/* ===== FMEA 등록 헤더 ===== */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📝</span>
        <h1 className="text-base font-bold text-gray-800">FMEA 등록</h1>
        <span className="text-xs text-gray-500 ml-2">ID: {fmeaId}</span>
      </div>

      {/* ===== 기초정보 불러오기 버튼 ===== */}
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={openBizInfoModal}
          className="px-4 py-2 bg-[#fff9c4] border-2 border-[#4caf50] text-[#2e7d32] text-xs font-bold rounded flex items-center gap-2 hover:bg-[#fff59d]"
        >
          📂 기초정보에서 불러오기
        </button>
        <p className="text-xs text-amber-600 flex items-center gap-1">
          💡 기초정보를 더블클릭하면 고객/공장/품명/품번이 자동으로 입력됩니다.
        </p>
        <div className="ml-auto flex gap-2">
          <button onClick={handleReset} className="px-4 py-2 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200 flex items-center gap-1">
            🔄 새로고침
          </button>
          <button 
            onClick={handleSave} 
            className={`px-4 py-2 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors ${
              saveStatus === 'saved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-[#1976d2] hover:bg-[#1565c0]'
            }`}
          >
            {saveStatus === 'saved' ? '✅ 저장됨' : '💾 저장'}
          </button>
        </div>
      </div>

      {/* ===== 프로젝트 정보 섹션 ===== */}
      <div className="flex items-center gap-2 mb-2">
        <span>📋</span>
        <h2 className="text-sm font-bold text-gray-700">프로젝트 정보</h2>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-400 mb-6 bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#00587a] text-white">
              <th className="border border-white px-3 py-2 text-center font-bold w-24">항목</th>
              <th className="border border-white px-3 py-2 text-center font-bold w-36">내용</th>
              <th className="border border-white px-3 py-2 text-center font-bold w-24">항목</th>
              <th className="border border-white px-3 py-2 text-center font-bold w-36">내용</th>
              <th className="border border-white px-3 py-2 text-center font-bold bg-[#00587a] text-white w-20">일정</th>
              <th className="border border-white px-3 py-2 text-center font-bold w-32">일자</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: 프로젝트명 / 고객사 / Proto */}
            <tr>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">프로젝트명</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="text" placeholder="프로젝트명" value={project.projectName} onChange={e => handleProjectChange('projectName', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none focus:bg-blue-50 rounded" />
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">고객사</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="선택" value={project.customer} onChange={e => handleProjectChange('customer', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={openBizInfoModal} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">Proto</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="date" value={project.protoDate} onChange={e => handleProjectChange('protoDate', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                </div>
              </td>
            </tr>
            {/* Row 2: 품명 / 품번 / P1 */}
            <tr>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">품명</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="품명" value={project.productName} onChange={e => handleProjectChange('productName', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={openBizInfoModal} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">품번</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="품번" value={project.partNo} onChange={e => handleProjectChange('partNo', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={openBizInfoModal} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">P1</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="date" value={project.p1Date} onChange={e => handleProjectChange('p1Date', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
            </tr>
            {/* Row 3: 모델년도 / 프로그램 / P2 */}
            <tr>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">모델년도</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="예: MY2025" value={project.modelYear} onChange={e => handleProjectChange('modelYear', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={openBizInfoModal} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">프로그램</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="프로그램명" value={project.program} onChange={e => handleProjectChange('program', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={openBizInfoModal} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">P2</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="date" value={project.p2Date} onChange={e => handleProjectChange('p2Date', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
            </tr>
            {/* Row 4: 고객Site / 담당부서 / PPAP */}
            <tr>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">고객 Site</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="고객 Site" value={project.customerSite} onChange={e => handleProjectChange('customerSite', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={openBizInfoModal} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">담당부서</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="직접입력 또는 선택" value={project.department} onChange={e => handleProjectChange('department', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={() => openUserModalForProject('department')} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">PPAP</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="date" value={project.ppapDate} onChange={e => handleProjectChange('ppapDate', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
            </tr>
            {/* Row 5: 고객담당자 / Leader / SOP */}
            <tr>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">고객담당자</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="text" placeholder="고객사 담당자명" value={project.customerManager} onChange={e => handleProjectChange('customerManager', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">Leader</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <div className="flex items-center">
                  <input type="text" placeholder="직접입력 또는 선택" value={project.leader} onChange={e => handleProjectChange('leader', e.target.value)} 
                    className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
                  <button onClick={() => openUserModalForProject('leader')} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                </div>
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">SOP</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="date" value={project.sopDate} onChange={e => handleProjectChange('sopDate', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
            </tr>
            {/* Row 6: 고객이메일 / 시작일자 / 종료일자 */}
            <tr>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">고객이메일</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="email" placeholder="customer@email.com" value={project.customerEmail} onChange={e => handleProjectChange('customerEmail', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">시작일자</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="date" value={project.startDate} onChange={e => handleProjectChange('startDate', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
              <td className="border border-white px-3 py-2 bg-[#00587a] text-white text-center font-semibold">종료일자</td>
              <td className="border border-gray-400 px-1 py-1 bg-white">
                <input type="date" value={project.endDate} onChange={e => handleProjectChange('endDate', e.target.value)} 
                  className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== CFT 등록 섹션 ===== */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>👥</span>
          <h2 className="text-sm font-bold text-gray-700">CFT 등록</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCftRefresh}
            className="px-3 py-1.5 bg-gray-100 border border-gray-400 text-gray-600 text-xs rounded hover:bg-gray-200 flex items-center gap-1"
          >
            🔄 새로고침
          </button>
          <button 
            onClick={handleCftEdit}
            className={`px-3 py-1.5 text-xs rounded flex items-center gap-1 ${
              cftEditMode 
                ? 'bg-amber-500 text-white border border-amber-600' 
                : 'bg-amber-100 border border-amber-400 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {cftEditMode ? '✏️ 수정중...' : '✏️ 수정'}
          </button>
          <button 
            onClick={handleAddRow}
            disabled={!cftEditMode}
            className="px-3 py-1.5 bg-green-100 border border-green-500 text-green-700 text-xs rounded hover:bg-green-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + 행추가
          </button>
          <button 
            onClick={handleCftSave}
            className={`px-3 py-1.5 text-white text-xs font-semibold rounded flex items-center gap-1 ${
              cftSaveStatus === 'saved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-[#1976d2] hover:bg-[#1565c0]'
            }`}
          >
            {cftSaveStatus === 'saved' ? '✅ 저장됨' : '💾 저장'}
          </button>
          <button 
            onClick={handleCftCancel}
            disabled={!cftEditMode}
            className="px-3 py-1.5 bg-red-100 border border-red-400 text-red-600 text-xs rounded hover:bg-red-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕ 취소
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-400 bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#00587a] text-white">
              {cftEditMode && (
                <th className="border border-white px-2 py-2 text-center align-middle font-semibold w-10">삭제</th>
              )}
              <th className="border border-white px-3 py-2 text-center align-middle font-semibold w-24">구분</th>
              <th className="border border-white px-3 py-2 text-center align-middle font-semibold w-24">성명</th>
              <th className="border border-white px-3 py-2 text-center align-middle font-semibold w-28">부서</th>
              <th className="border border-white px-3 py-2 text-center align-middle font-semibold w-20">직급</th>
              <th className="border border-white px-3 py-2 text-center align-middle font-semibold w-28">전화번호</th>
              <th className="border border-white px-3 py-2 text-center align-middle font-semibold">Email</th>
              <th className="border border-white px-3 py-2 text-center align-middle font-semibold w-24">비고</th>
            </tr>
          </thead>
          <tbody>
            {approvers.map((row, index) => (
              <tr 
                key={row.id} 
                className="hover:bg-blue-50 transition-colors"
              >
                {cftEditMode && (
                  <td className="border border-gray-400 px-1 py-1 bg-red-50 text-center">
                    <button 
                      onClick={() => handleDeleteRow(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="행 삭제"
                    >
                      🗑️
                    </button>
                  </td>
                )}
                <td className="border border-white px-1 py-1 bg-[#bbdefb]">
                  <input type="text" value={row.role} onChange={e => handleApproverChange(index, 'role', e.target.value)} 
                    className="w-full h-7 px-2 text-xs text-center font-semibold border-0 bg-transparent focus:outline-none" />
                </td>
                <td className="border border-gray-400 px-1 py-1 bg-white">
                  <div className="flex items-center">
                    <input type="text" placeholder="성명" value={row.name} onChange={e => handleApproverChange(index, 'name', e.target.value)} 
                      className="flex-1 h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-700 font-semibold" />
                    <button onClick={() => openUserModal(index)} className="p-1 text-blue-500 hover:text-blue-700">🔍</button>
                  </div>
                </td>
                <td className="border border-gray-400 px-1 py-1 bg-white">
                  <input type="text" placeholder="부서" value={row.department} readOnly
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-600" />
                </td>
                <td className="border border-gray-400 px-1 py-1 bg-white">
                  <input type="text" placeholder="직급" value={row.position} readOnly
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-500" />
                </td>
                <td className="border border-gray-400 px-1 py-1 bg-white">
                  <input type="text" placeholder="전화번호" value={row.phone} readOnly
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-500" />
                </td>
                <td className="border border-gray-400 px-1 py-1 bg-white">
                  <input type="text" placeholder="Email" value={row.email} readOnly
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-500" />
                </td>
                <td className="border border-gray-400 px-1 py-1 bg-[#fff9c4]">
                  <input type="text" placeholder="비고" value={row.remark} onChange={e => handleApproverChange(index, 'remark', e.target.value)} 
                    className="w-full h-7 px-2 text-xs border-0 bg-transparent focus:outline-none text-gray-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 상태바 */}
      <div className="mt-3 px-4 py-2 bg-white rounded border border-gray-300 flex justify-between text-xs text-gray-500">
        <span>총 {approvers.length}행</span>
        <span>버전: FMEA Suite v3.0 | 사용자: FMEA Lead</span>
      </div>

      {/* ===== 모달 ===== */}
      <BizInfoSelectModal
        isOpen={bizInfoModalOpen}
        onSelect={handleBizInfoSelect}
        onClose={() => setBizInfoModalOpen(false)}
      />

      <UserSelectModal
        isOpen={userModalOpen}
        onSelect={handleUserSelect}
        onClose={() => setUserModalOpen(false)}
      />
    </div>
  );
}
