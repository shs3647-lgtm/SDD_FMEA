/**
 * @file Sidebar.tsx
 * @description 컬러 아이콘 사이드바 컴포넌트 (호버 시 확장)
 * @author AI Assistant
 * @created 2025-12-25
 * @version 2.0.0
 * 
 * 디자인 참고: 화면디자인.PNG
 * - 네이비 배경 + 컬러 아이콘
 * - 호버 시 200px 확장
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import CompanyLogo from '@/components/CompanyLogo';

// 컬러 아이콘 SVG 컴포넌트들
const ColorIcons = {
  // AMP 로고 스타일 (주황/빨강 원형)
  Dashboard: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="6" fill="#FF6B35" />
      <circle cx="16" cy="16" r="6" fill="#FF4444" />
    </svg>
  ),
  // 분홍색 차트
  Worksheet: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="12" width="4" height="10" rx="1" fill="#E91E8C" />
      <rect x="8" y="8" width="4" height="14" rx="1" fill="#E91E8C" opacity="0.7" />
      <rect x="14" y="4" width="4" height="18" rx="1" fill="#E91E8C" opacity="0.5" />
      <rect x="20" y="10" width="4" height="12" rx="1" fill="#E91E8C" opacity="0.3" />
    </svg>
  ),
  // 민트색 연결 아이콘
  Register: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h10" stroke="#4DD0E1" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="18" r="3" fill="#4DD0E1" />
    </svg>
  ),
  // 청록색 폴더
  List: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M3 6C3 4.89543 3.89543 4 5 4H9L11 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" fill="#26C6DA" />
    </svg>
  ),
  // 분홍 체크
  CFT: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F48FB1" opacity="0.3" />
      <path d="M8 12L11 15L17 9" stroke="#E91E8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // 큐브 아이콘 (보라색)
  Revision: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="#9575CD" opacity="0.3" />
      <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="#7E57C2" strokeWidth="1.5" />
      <path d="M12 22V12M12 12L4 7M12 12L20 7" stroke="#7E57C2" strokeWidth="1.5" />
    </svg>
  ),
  // 설정 기어 (청록색)
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="#4DD0E1" />
      <path d="M12 1V3M12 21V23M23 12H21M3 12H1M20.5 3.5L19 5M5 19L3.5 20.5M20.5 20.5L19 19M5 5L3.5 3.5" 
        stroke="#4DD0E1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  // 사용자 (주황색)
  User: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="#FF8A65" />
      <path d="M4 20C4 16.6863 7.13401 14 12 14C16.866 14 20 16.6863 20 20" 
        stroke="#FF8A65" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};

// 공통 하위 메뉴 생성 함수 (CFT는 등록 화면에 통합)
const createSubItems = (basePath: string) => [
  { label: '등록', href: `${basePath}/register` },
  { label: '리스트', href: `${basePath}/list` },
  { label: '개정관리', href: `${basePath}/revision` },
];

// 메뉴 아이템 정의
const menuItems = [
  {
    id: 'dashboard',
    label: '대시보드',
    Icon: ColorIcons.Dashboard,
    href: '/dashboard',
  },
  {
    id: 'apqp',
    label: 'APQP',
    Icon: ColorIcons.Worksheet,
    href: '/apqp',
    subItems: createSubItems('/apqp'),
  },
  {
    id: 'dfmea',
    label: 'DFMEA',
    Icon: ColorIcons.Register,
    href: '/dfmea',
    subItems: createSubItems('/dfmea'),
  },
  {
    id: 'pfmea',
    label: 'PFMEA',
    Icon: ColorIcons.List,
    href: '/pfmea',
    subItems: createSubItems('/pfmea'),
  },
  {
    id: 'cp',
    label: 'Control Plan',
    Icon: ColorIcons.CFT,
    href: '/control-plan',
    subItems: createSubItems('/control-plan'),
  },
  {
    id: 'pfd',
    label: 'PFD',
    Icon: ColorIcons.Revision,
    href: '/pfd',
    subItems: createSubItems('/pfd'),
  },
  {
    id: 'ws',
    label: 'WS',
    Icon: ColorIcons.Settings,
    href: '/ws',
    subItems: createSubItems('/ws'),
  },
  {
    id: 'pm',
    label: 'PM',
    Icon: ColorIcons.User,
    href: '/pm',
    subItems: createSubItems('/pm'),
  },
  {
    id: 'spc',
    label: 'SPC',
    Icon: ColorIcons.Dashboard,
    href: '/spc',
    subItems: createSubItems('/spc'),
  },
  {
    id: 'msa',
    label: 'MSA',
    Icon: ColorIcons.Worksheet,
    href: '/msa',
    subItems: createSubItems('/msa'),
  },
];

// 하단 메뉴
const bottomMenuItems = [
  {
    id: 'master',
    label: '기초정보',
    Icon: ColorIcons.Settings,
    href: '/master',
    subItems: [
      { label: '고객사정보', href: '/master/customer' },
      { label: '사용자정보', href: '/master/user' },
      { label: 'PFMEA 임포트', href: '/master/pfmea-import' },
      { label: 'DFMEA 임포트', href: '/master/dfmea-import' },
      { label: 'CP 임포트', href: '/master/cp-import' },
    ],
  },
];

/**
 * 사이드바 컴포넌트
 */
export function Sidebar() {
  const pathname = usePathname();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const handleItemClick = (itemId: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      setExpandedItem(expandedItem === itemId ? null : itemId);
    }
  };

  const renderMenuItems = (items: typeof menuItems) => {
    return items.map((item) => {
      const Icon = item.Icon;
      const active = isActive(item.href);
      const hasSubItems = item.subItems && item.subItems.length > 0;
      const isExpanded = expandedItem === item.id && isHovered;

      return (
        <div key={item.id} className="mb-1">
          <Link
            href={hasSubItems && isHovered ? '#' : item.href}
            onClick={(e) => {
              if (hasSubItems && isHovered) {
                e.preventDefault();
                handleItemClick(item.id, true);
              }
            }}
            className={cn(
              'flex items-center gap-3 px-2.5 py-2.5 mx-1 rounded-lg',
              'transition-all duration-200',
              active && 'bg-white/10 shadow-lg',
              !active && 'hover:bg-white/5'
            )}
          >
            {/* 컬러 아이콘 */}
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            
            {/* 레이블 */}
            <span
              className={cn(
                'whitespace-nowrap text-sm font-medium text-white/90',
                'transition-all duration-200',
                isHovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              )}
            >
              {item.label}
            </span>

            {/* 서브메뉴 화살표 */}
            {hasSubItems && isHovered && (
              <svg 
                className={cn(
                  'ml-auto w-4 h-4 text-white/60 transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Link>

          {/* 서브메뉴 */}
          {hasSubItems && isExpanded && (
            <div className="ml-10 mt-1 space-y-0.5">
              {item.subItems?.map((subItem) => (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={cn(
                    'block px-3 py-1.5 text-xs rounded-md',
                    'transition-colors duration-200',
                    isActive(subItem.href) 
                      ? 'text-cyan-300 bg-cyan-500/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen',
        // 네이비 그라데이션 배경
        'bg-gradient-to-b from-[#1a237e] via-[#283593] to-[#1a237e]',
        'flex flex-col',
        'transition-all duration-300 ease-in-out',
        'shadow-xl',
        isHovered ? 'w-[200px]' : 'w-14'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setExpandedItem(null);
      }}
    >
      {/* ======== 회사 로고 영역 (클릭하여 변경 가능) ======== */}
      <div className="flex items-center justify-center border-b border-white/10 py-3">
        <CompanyLogo 
          width={isHovered ? 160 : 40} 
          height={isHovered ? 50 : 40} 
        />
      </div>

      {/* ======== 메인 메뉴 ======== */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {renderMenuItems(menuItems)}
      </nav>

      {/* ======== 구분선 ======== */}
      <div className="mx-3 border-t border-white/10" />

      {/* ======== 하단 메뉴 ======== */}
      <nav className="py-3">
        {renderMenuItems(bottomMenuItems)}
      </nav>
    </aside>
  );
}

export default Sidebar;
