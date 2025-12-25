/**
 * @file page.tsx
 * @description 메인 대시보드 페이지 - 다크 테마 + 표준 테이블 디자인
 * @author AI Assistant
 * @created 2025-12-25
 * @version 5.0.0
 * @benchmark 
 *   - welcome-v0.76.1.html (다크 테마)
 *   - table-design-reference.html (표준 테이블)
 * 
 * 테이블 디자인 원칙:
 * - 헤더: #00587a (진한 남청색) + 흰색 글자
 * - 첫 번째 열: #00587a + 흰색 글자
 * - 짝수 행: #e0f2fb (연한 하늘색)
 * - 홀수 행: #ffffff (흰색)
 * - 테두리: 1px solid #999
 */

'use client';

import Link from 'next/link';

// 샘플 데이터: 프로젝트 상태
const projectStats = {
  inProgress: 8,
  completed: 14,
  delayed: 3,
};

// 샘플 데이터: AP Improvement 테이블
const apImprovementData = [
  { 
    id: 'AP-001', ap5: 'M', ap6: 'M', severity: 7, occurrence: 4, detection: 6, prn5: 168, prn6: null,
    specialChar: 'SC', preventiveControl: '이물질표 표시작업시 주의',
    failureMode: '10이물질 혼입', failureCause: '작업자 이물질 유입 실수',
    detectionControl: '육안 검사', preventionAction: '', detectionAction: '',
    responsible: '김철수', status: '진행중', dueDate: '2025/01/05'
  },
  { 
    id: 'AP-002', ap5: 'M', ap6: 'M', severity: 7, occurrence: 3, detection: 6, prn5: 126, prn6: null,
    specialChar: 'SC', preventiveControl: '접합시 온도 및 속도조건 장치 설치',
    failureMode: '10연결부 제품 손상', failureCause: '온도 설정 오류로 연결부 손상',
    detectionControl: '외관검사', preventionAction: '', detectionAction: '',
    responsible: '이영희', status: '완료', dueDate: '2024/12/28'
  },
  { 
    id: 'AP-003', ap5: 'L', ap6: 'L', severity: 2, occurrence: 5, detection: 6, prn5: 60, prn6: null,
    specialChar: 'SC', preventiveControl: '',
    failureMode: '11상태온도 손상', failureCause: '파라미터 입력 실수',
    detectionControl: '', preventionAction: '', detectionAction: '',
    responsible: '박민수', status: '대기', dueDate: '2025/01/10'
  },
  { 
    id: 'AP-004', ap5: 'L', ap6: 'L', severity: 2, occurrence: 3, detection: 6, prn5: 36, prn6: null,
    specialChar: 'SC', preventiveControl: '',
    failureMode: '11상태온도 손상', failureCause: '온도 센서 접속 불량',
    detectionControl: '', preventionAction: '', detectionAction: '',
    responsible: '', status: '대기', dueDate: ''
  },
  { 
    id: 'AP-005', ap5: 'L', ap6: 'L', severity: 6, occurrence: 5, detection: 6, prn5: 180, prn6: null,
    specialChar: '', preventiveControl: '',
    failureMode: '20 외관 불량 미검사', failureCause: '검사 기준 누락',
    detectionControl: '', preventionAction: '', detectionAction: '',
    responsible: '', status: '대기', dueDate: ''
  },
];

// 바로가기 메뉴 (이미지 기준 수정)
const quickLinks = [
  { id: 'project', title: 'Project', badge: 'GO', desc: '프로젝트 목록', href: '/project/list' },
  { id: 'dfmea', title: 'DFMEA', badge: '설계', desc: '설계FMEA', href: '/dfmea' },
  { id: 'pfmea', title: 'PFMA', badge: '공정', desc: '공정FMEA', href: '/pfmea' },
  { id: 'cp', title: 'Control Plan', badge: null, desc: '관리계획서', href: '/control-plan' },
  { id: 'pfd', title: 'PFD', badge: null, desc: '공정 흐름도', href: '/pfd' },
  { id: 'ws', title: 'WS', badge: null, desc: '작업표준', href: '/ws' },
  { id: 'pm', title: 'PM', badge: null, desc: '설비/예방보전', href: '/pm' },
];

// AP 레벨 색상 (첫 번째 열용)
const getAPBadge = (level: string) => {
  switch (level) {
    case 'H': return 'bg-red-500 text-white';
    case 'M': return 'bg-yellow-500 text-white';
    case 'L': return 'bg-green-500 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

// 상태 배지 색상 및 텍스트 변환
const getStatusInfo = (status: string) => {
  switch (status) {
    case '완료': return { text: '완료', style: 'bg-green-500 text-white' };
    case '진행중': return { text: '진행', style: 'bg-blue-500 text-white' };
    case '대기': return { text: '지연', style: 'bg-gray-400 text-white' };
    default: return { text: '지연', style: 'bg-gray-400 text-white' };
  }
};

export default function DashboardPage() {
  // AP 통계
  const apStats = {
    high: apImprovementData.filter(a => a.ap5 === 'H').length,
    medium: apImprovementData.filter(a => a.ap5 === 'M').length,
    low: apImprovementData.filter(a => a.ap5 === 'L').length,
    total: apImprovementData.length,
    completed: apImprovementData.filter(a => a.status === '완료').length,
  };

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        background: 'radial-gradient(1200px 700px at 70% -10%, #162a56 0%, #0d1830 45%, #0b1426 100%)',
      }}
    >
      {/* 상단 헤더: 중앙 Smart System | 우측 접속자 ID */}
      <header className="mb-6 bg-[#0e1a33] border border-[#1d2a48] rounded-[14px] shadow-lg">
        <div className="flex items-center justify-between h-14 px-6">
          {/* 중앙: Smart System */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black text-white tracking-wide">
              Smart System
            </h1>
          </div>
          
          {/* 우측: 접속자 ID 버튼 */}
          <div className="flex-shrink-0">
            <button className="px-4 py-2 bg-[#5ba9ff] hover:bg-[#4a9aee] text-white text-sm font-bold rounded-lg transition-colors">
              접속자 ID
            </button>
          </div>
        </div>
      </header>

      {/* Hero 배너 */}
      <section className="mb-6">
        <div className="bg-[#0e1a33] border border-[#1d2a48] rounded-[14px] shadow-lg overflow-hidden">
          {/* 배너 */}
          <div className="mx-5 my-4 bg-[#1b5e7a] rounded-lg text-white py-5 text-center font-black text-xl tracking-wide">
            Smart System으로<br/>프리미엄 자동차 시장에 진출하세요 !
          </div>
          
          {/* 설명 */}
          <div className="text-[#a7b6d3] text-sm px-5 pb-4">
            FMEA · Control Plan · PFD · Work Standard · SPC · MSA — 모듈식 품질 플랫폼
          </div>
        </div>
      </section>

      {/* 프로젝트 프리뷰 — My Projects Status */}
      <section className="mb-6">
        <h2 className="text-white font-black text-base mb-3">
          프로젝트 프리뷰 — My Projects Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 진행중 */}
          <div className="bg-[#0e1a33] border border-[#1d2a48] rounded-[14px] p-4 flex items-center justify-between shadow-lg">
            <div>
              <div className="text-[#a7b6d3] text-sm mb-1">진행중</div>
              <p className="text-3xl font-black text-white">{projectStats.inProgress}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white bg-[#22c55e]">
              OK
            </span>
          </div>
          
          {/* 완료 */}
          <div className="bg-[#0e1a33] border border-[#1d2a48] rounded-[14px] p-4 flex items-center justify-between shadow-lg">
            <div>
              <div className="text-[#a7b6d3] text-sm mb-1">완료</div>
              <p className="text-3xl font-black text-white">{projectStats.completed}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white bg-[#f59e0b]">
              DONE
            </span>
          </div>

          {/* 지연 */}
          <div className="bg-[#0e1a33] border border-[#1d2a48] rounded-[14px] p-4 flex items-center justify-between shadow-lg">
            <div>
              <div className="text-[#a7b6d3] text-sm mb-1">지연</div>
              <p className="text-3xl font-black text-white">{projectStats.delayed}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white bg-[#ef4444]">
              DELAY
            </span>
          </div>
        </div>
      </section>

      {/* 바로가기 - 양쪽맞춤 균등배분 (디자인 가이드: 한 영역 내 항목은 항상 justify-between) */}
      <section className="mb-6">
        <h2 className="text-white font-black text-base mb-3">바로가기</h2>
        <div className="flex justify-between gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="flex-1 bg-[#0e1a33] border border-[#1d2a48] rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#162a56] shadow-md text-center"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-white font-bold text-sm">{link.title}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] text-white bg-gradient-to-r from-[#5ba9ff] to-[#88c0ff]">
                    {link.badge}
                  </span>
                )}
              </div>
              <p className="text-[#a7b6d3] text-[10px] mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AP Improvement 진행상태 - 표준 테이블 디자인 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-black text-base flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            AP Improvement 진행상태
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-bold">H: {apStats.high}</span>
            <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 font-bold">M: {apStats.medium}</span>
            <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 font-bold">L: {apStats.low}</span>
            <span className="px-2 py-1 rounded bg-white/10 text-white/70">
              완료: {apStats.completed}/{apStats.total}
            </span>
            <button className="ml-2 px-3 py-1 rounded bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
              전체보기 →
            </button>
          </div>
        </div>
        
        {/* 표준 테이블 디자인 - 컴팩트 (한 줄 표시, whitespace-nowrap) */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              {/* 헤더 - #00587a 진한 남청색, 컴팩트 패딩 */}
              <thead>
                <tr>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap">AP5</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap">AP6</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap">RPN5</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap">RPN6</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap">특성</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-left border border-[#999] whitespace-nowrap">예방관리</th>
                  <th className="bg-[#00587a] text-white font-bold px-1 py-2 text-center border border-[#999] whitespace-nowrap">S</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-left border border-[#999] whitespace-nowrap">고장형태</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-left border border-[#999] whitespace-nowrap">고장원인</th>
                  <th className="bg-[#00587a] text-white font-bold px-1 py-2 text-center border border-[#999] whitespace-nowrap">O</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-left border border-[#999] whitespace-nowrap">검출관리</th>
                  <th className="bg-[#00587a] text-white font-bold px-1 py-2 text-center border border-[#999] whitespace-nowrap">D</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap">담당자</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap w-16">상태</th>
                  <th className="bg-[#00587a] text-white font-bold px-2 py-2 text-center border border-[#999] whitespace-nowrap">완료일</th>
                </tr>
              </thead>
              <tbody>
                {apImprovementData.map((ap, index) => {
                  const statusInfo = getStatusInfo(ap.status);
                  return (
                  <tr 
                    key={ap.id} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}
                  >
                    {/* AP5 */}
                    <td className="bg-[#00587a] text-white font-bold px-2 py-1.5 text-center border border-[#999]">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${getAPBadge(ap.ap5)}`}>
                        {ap.ap5}
                      </span>
                    </td>
                    {/* AP6 */}
                    <td className="px-2 py-1.5 text-center border border-[#999] text-black">
                      {ap.ap6 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${getAPBadge(ap.ap6)}`}>
                          {ap.ap6}
                        </span>
                      ) : '-'}
                    </td>
                    {/* RPN5 */}
                    <td className="px-2 py-1.5 text-center border border-[#999] text-black font-bold whitespace-nowrap">{ap.prn5}</td>
                    {/* RPN6 */}
                    <td className="px-2 py-1.5 text-center border border-[#999] text-black whitespace-nowrap">{ap.prn6 || '-'}</td>
                    {/* 특별특성 */}
                    <td className="px-2 py-1.5 text-center border border-[#999] text-black whitespace-nowrap">{ap.specialChar || '-'}</td>
                    {/* 예방관리 - 긴 텍스트는 truncate */}
                    <td className="px-2 py-1.5 text-left border border-[#999] text-black max-w-[120px] truncate" title={ap.preventiveControl}>
                      {ap.preventiveControl || '-'}
                    </td>
                    {/* S */}
                    <td className="px-1 py-1.5 text-center border border-[#999] text-black font-medium whitespace-nowrap">{ap.severity}</td>
                    {/* 고장형태 - 긴 텍스트는 truncate */}
                    <td className="px-2 py-1.5 text-left border border-[#999] text-black max-w-[120px] truncate" title={ap.failureMode}>
                      {ap.failureMode}
                    </td>
                    {/* 고장원인 - 긴 텍스트는 truncate */}
                    <td className="px-2 py-1.5 text-left border border-[#999] text-black max-w-[120px] truncate" title={ap.failureCause}>
                      {ap.failureCause}
                    </td>
                    {/* O */}
                    <td className="px-1 py-1.5 text-center border border-[#999] text-black font-medium whitespace-nowrap">{ap.occurrence}</td>
                    {/* 검출관리 - 긴 텍스트는 truncate */}
                    <td className="px-2 py-1.5 text-left border border-[#999] text-black max-w-[80px] truncate" title={ap.detectionControl}>
                      {ap.detectionControl || '-'}
                    </td>
                    {/* D */}
                    <td className="px-1 py-1.5 text-center border border-[#999] text-black font-medium whitespace-nowrap">{ap.detection}</td>
                    {/* 담당자 */}
                    <td className="px-2 py-1.5 text-center border border-[#999] text-black whitespace-nowrap">
                      {ap.responsible || '-'}
                    </td>
                    {/* 상태 - 넓게, 진행/완료/지연 */}
                    <td className="px-2 py-1.5 text-center border border-[#999]">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${statusInfo.style}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    {/* 완료일자 */}
                    <td className="px-2 py-1.5 text-center border border-[#999] text-black whitespace-nowrap">
                      {ap.dueDate || '-'}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {/* 색상 범례 */}
        <div className="mt-4 flex items-center gap-6 text-xs text-[#a7b6d3]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#00587a] border border-[#999]"></div>
            <span>헤더/좌측열: #00587a</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#e0f2fb] border border-[#999]"></div>
            <span>짝수 행: #e0f2fb</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-[#999]"></div>
            <span>홀수 행: #ffffff</span>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="mt-6 text-center text-[#a7b6d3] text-xs">
        v1.0.0 · FMEA Smart System · © AMP SYSTEM
      </footer>
    </div>
  );
}
