/**
 * @file page.tsx
 * @description APQP 등록 페이지 - 기초정보/사용자정보 연동
 * @version 1.0.0
 * @created 2025-12-27
 */

'use client';

import { useState, useEffect } from 'react';
import APQPTopNav from '@/components/layout/APQPTopNav';
import { BizInfoSelectModal } from '@/components/modals/BizInfoSelectModal';
import { UserSelectModal } from '@/components/modals/UserSelectModal';
import { CFTAccessLogTable } from '@/components/tables/CFTAccessLogTable';
import { CFTRegistrationTable, CFTMember, createInitialCFTMembers } from '@/components/tables/CFTRegistrationTable';
import { BizInfoProject } from '@/types/bizinfo';
import { UserInfo } from '@/types/user';
import { CFTAccessLog } from '@/types/project-cft';

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


function generateAPQPId(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `APQP-${year}-${seq}`;
}

// =====================================================
// 메인 컴포넌트
// =====================================================
export default function APQPRegisterPage() {
  const [project, setProject] = useState<ProjectInfo>(INITIAL_PROJECT);
  const [cftMembers, setCftMembers] = useState<CFTMember[]>(createInitialCFTMembers());
  const [apqpId, setApqpId] = useState('');
  
  // 모달 상태
  const [bizInfoModalOpen, setBizInfoModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [userModalTarget, setUserModalTarget] = useState<'cft' | 'department' | 'leader'>('cft');

  useEffect(() => {
    setApqpId(generateAPQPId());
    
    // 저장된 CFT 데이터 불러오기 (삭제할 때까지 유지)
    const savedCft = localStorage.getItem('APQP-cft-data');
    if (savedCft) {
      try {
        const parsed = JSON.parse(savedCft);
        if (Array.isArray(parsed) && parsed.length > 0 && 'role' in parsed[0]) {
          setCftMembers(parsed);
        }
      } catch {
        // 파싱 오류 시 기본값 유지
      }
    }
  }, []);

  const handleProjectChange = (field: keyof ProjectInfo, value: string) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  // CFT 사용자 검색
  const handleCftUserSearch = (index: number) => {
    setSelectedMemberIndex(index);
    setUserModalTarget('cft');
    setUserModalOpen(true);
  };

  // CFT 저장
  const handleCftSave = () => {
    localStorage.setItem('APQP-cft-data', JSON.stringify(cftMembers));
    setCftSaveStatus('saved');
    setTimeout(() => setCftSaveStatus('idle'), 3000);
  };

  // CFT 초기화
  const handleCftReset = () => {
    if (confirm('CFT 목록을 초기화하시겠습니까?')) {
      localStorage.removeItem('APQP-cft-data');
      setCftMembers(createInitialCFTMembers());
    }
  };

  const handleReset = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
      setProject(INITIAL_PROJECT);
      setCftMembers(createInitialCFTMembers());
      setApqpId(generateAPQPId());
    }
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  // CFT 저장 상태
  const [cftSaveStatus, setCftSaveStatus] = useState<'idle' | 'saved'>('idle');

  // CFT 접속 로그 샘플 데이터
  const [accessLogs] = useState<CFTAccessLog[]>([
    { id: 1, projectId: apqpId, userName: '김철수', loginTime: '2025-12-26 09:00:00', logoutTime: '2025-12-26 12:30:00', action: '수정', itemType: 'APQP', cellAddress: 'A1:B5', description: 'PAPQP 프로젝트 정보 수정' },
    { id: 2, projectId: apqpId, userName: '이영희', loginTime: '2025-12-26 10:15:00', logoutTime: '2025-12-26 11:45:00', action: '추가', itemType: 'CFT', cellAddress: 'C3', description: 'CFT 팀원 추가' },
    { id: 3, projectId: apqpId, userName: '박지민', loginTime: '2025-12-26 14:00:00', logoutTime: null, action: '수정', itemType: 'APQP', cellAddress: 'D10:F15', description: '고장형태 분석 업데이트' },
  ]);

  const handleSave = () => {
    if (!project.projectName) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    const data = { id: apqpId, project, cftMembers, createdAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('APQP-projects') || '[]');
    existing.unshift(data);
    localStorage.setItem('APQP-projects', JSON.stringify(existing));
    
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

  // 사용자 모달 열기 (담당부서/Leader용)
  const openUserModalForProject = (target: 'department' | 'leader') => {
    setUserModalTarget(target);
    setUserModalOpen(true);
  };

  // 사용자 선택 처리
  const handleUserSelect = (user: UserInfo) => {
    if (userModalTarget === 'cft' && selectedMemberIndex !== null) {
      // CFT 테이블에 사용자 정보 입력
      const updated = [...cftMembers];
      updated[selectedMemberIndex] = {
        ...updated[selectedMemberIndex],
        department: user.department,
        name: user.name,
        position: user.position || '',
        phone: user.phone || '',
        email: user.email,
      };
      setCftMembers(updated);
      setSelectedMemberIndex(null);
    } else if (userModalTarget === 'department' || userModalTarget === 'leader') {
      // 담당부서 또는 Leader 선택 시 → 둘 다 같이 입력 (관계형 데이터)
      setProject(prev => ({ 
        ...prev, 
        department: user.department,
        leader: user.name 
      }));
    }
    setUserModalOpen(false);
  };

  return (
    <>
      {/* 상단 고정 바로가기 메뉴 */}
      <APQPTopNav selectedApqpId={apqpId} />
      
      <div className="min-h-screen bg-[#f0f0f0] p-4 pt-9 font-[Malgun_Gothic]">
      {/* ===== 프로젝트 정보 섹션 헤더 + 버튼 ===== */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <h1 className="text-base font-bold text-gray-800">APQP 등록</h1>
          <span className="text-xs text-gray-500 ml-2">ID: {apqpId}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 bg-gray-100 border border-gray-400 text-gray-700 text-xs rounded hover:bg-gray-200 flex items-center gap-1">
            🔄 새로고침
          </button>
          <button 
            onClick={handleSave} 
            className={`px-3 py-1.5 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors ${
              saveStatus === 'saved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-[#1976d2] hover:bg-[#1565c0]'
            }`}
          >
            {saveStatus === 'saved' ? '✅ 저장됨' : '💾 저장'}
          </button>
        </div>
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
        <span>버전: APQP Suite v3.0 | 사용자: APQP Lead</span>
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
    </>
  );
}
