'use client';

import { usePathname } from 'next/navigation';

interface PFMEATopNavProps {
  selectedFmeaId?: string;
  rightContent?: React.ReactNode;
  fmCount?: number;
  feCount?: number;
  fcCount?: number;
}

/**
 * PFMEA 상단 바로가기 메뉴바
 * - 사이드바 색상과 동일 (#00587a)
 * - 스크롤해도 항상 보이도록 고정
 * - 모든 PFMEA 화면에서 사용
 * 
 * @version 2.0.0 - 인라인 스타일 제거, Tailwind CSS 적용
 */
export default function PFMEATopNav({ selectedFmeaId, fmCount = 0, feCount = 0, fcCount = 0 }: PFMEATopNavProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { label: 'FMEA등록', path: '/pfmea/register', icon: '📝' },
    { label: 'FMEA 리스트', path: '/pfmea/list', icon: '📋' },
    { label: 'FMEA 작성화면', path: '/pfmea/worksheet', icon: '✏️' },
    { label: 'FMEA 개정관리', path: '/pfmea/revision', icon: '📜' },
  ];

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleNavigation = (path: string) => {
    if (path === '/pfmea/worksheet' && selectedFmeaId) {
      window.location.href = `${path}?id=${selectedFmeaId}`;
    } else {
      window.location.href = path;
    }
  };

  return (
    <div 
      className="fixed top-0 left-[50px] right-0 z-[100] flex items-center h-8 pl-0 pr-0 ml-0 border-b border-white/20"
      style={{ background: 'linear-gradient(to right, #1a237e, #283593, #1a237e)' }}
    >
      {/* 바로가기 레이블 */}
      <div className="px-3 pl-2 text-white/80 text-[11px] font-semibold border-r border-white/20 h-full flex items-center min-w-[60px]">
        바로가기
      </div>
      
      {/* 메뉴 항목들 */}
      {menuItems.map((item, index) => (
        <button
          key={item.path}
          onClick={() => handleNavigation(item.path)}
          className={`px-4 h-full text-white border-none cursor-pointer text-xs flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap
            ${isActive(item.path) ? 'bg-white/15 font-semibold' : 'bg-transparent font-normal hover:bg-white/10 hover:-translate-y-px'}
            ${index < menuItems.length - 1 ? 'border-r border-white/15' : ''}
          `}
        >
          {item.icon} {item.label}
        </button>
      ))}
      
      {/* 우측 영역 */}
      <div className="flex-1 h-full" />
      
      {/* 우측: 4단계 결과 - 280px (표준화: 80px 레이블 + 200px 값) */}
      <div 
        className="absolute right-0 top-0 h-8 w-[280px] flex items-stretch border-l-[2px] border-white"
        style={{ background: 'linear-gradient(to right, #0d47a1, #1565c0)' }}
      >
        <div className="w-[80px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-yellow-400 text-xs font-bold whitespace-nowrap">4단계:</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-orange-300 text-xs font-semibold whitespace-nowrap">FM:{fmCount}</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-blue-300 text-xs font-semibold whitespace-nowrap">FE:{feCount}</span>
        </div>
        <div className="w-[68px] h-8 flex items-center justify-center shrink-0">
          <span className="text-green-300 text-xs font-semibold whitespace-nowrap">FC:{fcCount}</span>
        </div>
      </div>
    </div>
  );
}
