'use client';

import { usePathname } from 'next/navigation';

interface CPTopNavProps {
  selectedCpId?: string;
  rightContent?: React.ReactNode;
  rowCount?: number;
  epCount?: number;
  autoCount?: number;
}

/**
 * Control Plan 상단 바로가기 메뉴바
 * - PFMEA TopNav와 완전히 동일한 구조
 * - 스크롤해도 항상 보이도록 고정
 * - 모든 CP 화면에서 사용
 * 
 * @version 2.0.0 - PFMEA와 동일한 메뉴 구조 (등록, 리스트, 작성화면, 개정관리, CFT등록, 접속로그)
 */
export default function CPTopNav({ selectedCpId, rowCount = 0, epCount = 0, autoCount = 0 }: CPTopNavProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { label: 'CP 등록', path: '/control-plan/register', icon: '📝' },
    { label: 'CP 리스트', path: '/control-plan/list', icon: '📋' },
    { label: 'CP 작성화면', path: '/control-plan/worksheet', icon: '✏️' },
    { label: 'CP 개정관리', path: '/control-plan/revision', icon: '📜' },
    { label: 'CFT 등록', path: '/control-plan/cft', icon: '👥' },
    { label: '접속 로그', path: '/control-plan/log', icon: '📊' },
  ];

  const isActive = (path: string) => {
    if (path === '/control-plan/worksheet') {
      return pathname === '/control-plan/worksheet' || pathname === '/control-plan';
    }
    return pathname?.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    if (path === '/control-plan/worksheet' && selectedCpId) {
      window.location.href = `${path}?id=${selectedCpId}`;
    } else {
      window.location.href = path;
    }
  };

  return (
    <div 
      className="fixed top-0 left-[50px] right-0 z-[100] flex items-center h-8 pl-0 pr-0 ml-0 border-b border-white/20"
      style={{ background: 'linear-gradient(to right, #0f766e, #0d9488, #0f766e)' }}
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
      
      {/* 우측: CP 현황 - 280px (표준화: 80px 레이블 + 200px 값) */}
      <div 
        className="absolute right-0 top-0 h-8 w-[280px] flex items-stretch border-l-[2px] border-white"
        style={{ background: 'linear-gradient(to right, #0f766e, #0d9488)' }}
      >
        <div className="w-[80px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-yellow-400 text-xs font-bold whitespace-nowrap">CP현황:</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-white text-xs font-semibold whitespace-nowrap">항목:{rowCount}</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-green-300 text-xs font-semibold whitespace-nowrap">EP:{epCount}</span>
        </div>
        <div className="w-[68px] h-8 flex items-center justify-center shrink-0">
          <span className="text-cyan-300 text-xs font-semibold whitespace-nowrap">자동:{autoCount}</span>
        </div>
      </div>
    </div>
  );
}
