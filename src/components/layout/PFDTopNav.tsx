'use client';

import { usePathname, useRouter } from 'next/navigation';

interface PFDTopNavProps {
  linkedFmeaId?: string | null;
  rowCount?: number;
  mainCount?: number;    // 주요공정 수
  inspectCount?: number; // 검사공정 수
}

/**
 * PFD 상단 바로가기 메뉴바
 * - PFMEA/CP TopNav와 동일한 구조
 * - 스크롤해도 항상 보이도록 고정
 */
export default function PFDTopNav({ linkedFmeaId, rowCount = 0, mainCount = 0, inspectCount = 0 }: PFDTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const menuItems = [
    { label: 'PFD 등록', path: '/pfd/register', icon: '📝' },
    { label: 'PFD 리스트', path: '/pfd/list', icon: '📋' },
    { label: 'PFD 작성화면', path: '/pfd/worksheet', icon: '✏️' },
    { label: 'PFD 개정관리', path: '/pfd/revision', icon: '📜' },
    { label: 'CFT 등록', path: '/pfd/cft', icon: '👥' },
    { label: '접속 로그', path: '/pfd/log', icon: '📊' },
  ];

  const isActive = (path: string) => {
    if (path === '/pfd/worksheet') {
      return pathname === '/pfd/worksheet';
    }
    return pathname?.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div 
      className="fixed top-0 left-[50px] right-0 z-[100] flex items-center h-8 pl-0 pr-0 ml-0 border-b border-white/20"
      style={{ background: 'linear-gradient(to right, #7c3aed, #8b5cf6, #7c3aed)' }}
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
      
      {/* 우측: PFD 현황 - 280px */}
      <div 
        className="absolute right-0 top-0 h-8 w-[280px] flex items-stretch border-l-[2px] border-white"
        style={{ background: 'linear-gradient(to right, #7c3aed, #8b5cf6)' }}
      >
        <div className="w-[80px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-yellow-400 text-xs font-bold whitespace-nowrap">PFD현황:</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-orange-300 text-xs font-semibold whitespace-nowrap">공정:{rowCount}</span>
        </div>
        <div className="w-[66px] h-8 flex items-center justify-center border-r border-white/30 shrink-0">
          <span className="text-blue-300 text-xs font-semibold whitespace-nowrap">주요:{mainCount}</span>
        </div>
        <div className="w-[68px] h-8 flex items-center justify-center shrink-0">
          <span className="text-green-300 text-xs font-semibold whitespace-nowrap">검사:{inspectCount}</span>
        </div>
      </div>
    </div>
  );
}

