/**
 * @file Sidebar.tsx
 * @description 아이콘 중심 사이드바 컴포넌트 (호버 시 확장)
 * @author AI Assistant
 * @created 2025-12-25
 * @version 1.0.0
 * 
 * @usage
 * <Sidebar />
 * 
 * 기능:
 * - 기본 48px 너비의 아이콘 사이드바
 * - 호버 시 200px로 확장되어 메뉴 레이블 표시
 * - 현재 활성 메뉴 하이라이트
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FilePlus,
  FolderOpen,
  Users,
  History,
  Settings,
  User,
  ChevronRight,
} from 'lucide-react';

// 메뉴 아이템 정의
const menuItems = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    href: '/dashboard',
    subItems: [
      { label: 'Welcome', href: '/dashboard' },
      { label: 'Top RPN', href: '/dashboard/top-rpn' },
    ],
  },
  {
    id: 'worksheet',
    label: '워크시트',
    icon: FileSpreadsheet,
    href: '/pfmea',
    subItems: [
      { label: 'P-FMEA', href: '/pfmea' },
      { label: 'D-FMEA', href: '/dfmea' },
      { label: 'PFD', href: '/pfd' },
      { label: 'Control Plan', href: '/control-plan' },
    ],
  },
  {
    id: 'register',
    label: '등록',
    icon: FilePlus,
    href: '/project/register',
  },
  {
    id: 'list',
    label: '리스트',
    icon: FolderOpen,
    href: '/project/list',
  },
  {
    id: 'cft',
    label: 'CFT',
    icon: Users,
    href: '/project/cft',
  },
  {
    id: 'revision',
    label: '개정',
    icon: History,
    href: '/project/revision',
  },
];

// 하단 메뉴 (설정, 사용자)
const bottomMenuItems = [
  {
    id: 'master',
    label: '기초정보',
    icon: Settings,
    href: '/master',
    subItems: [
      { label: 'PFMEA 임포트', href: '/master/pfmea-import' },
      { label: 'DFMEA 임포트', href: '/master/dfmea-import' },
      { label: 'CP 임포트', href: '/master/cp-import' },
      { label: 'BOM 임포트', href: '/master/bom-import' },
    ],
  },
  {
    id: 'user',
    label: '사용자정보',
    icon: User,
    href: '/settings/user',
  },
];

/**
 * 사이드바 컴포넌트
 * 
 * @description
 * 좌측 고정 사이드바로, 기본 상태에서는 아이콘만 표시되고
 * 호버 시 확장되어 메뉴 레이블과 서브메뉴가 표시됩니다.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  /**
   * 현재 경로가 메뉴 아이템의 경로와 일치하는지 확인
   */
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  /**
   * 메뉴 아이템 클릭 핸들러
   */
  const handleItemClick = (itemId: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      setExpandedItem(expandedItem === itemId ? null : itemId);
    }
  };

  return (
    <aside
      className={cn(
        // 기본 스타일
        'fixed left-0 top-0 z-50 h-screen',
        'bg-gradient-to-b from-slate-800 to-slate-900',
        'flex flex-col',
        'transition-all duration-300 ease-in-out',
        // 너비: 기본 48px, 호버 시 200px
        isHovered ? 'w-[200px]' : 'w-12'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setExpandedItem(null);
      }}
    >
      {/* ======== 로고 영역 ======== */}
      <div className="flex h-12 items-center justify-center border-b border-slate-700 bg-slate-900">
        <span className="text-lg font-bold text-blue-400">
          {isHovered ? 'FMEA Smart' : 'F'}
        </span>
      </div>

      {/* ======== 메인 메뉴 ======== */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItem === item.id && isHovered;

          return (
            <div key={item.id}>
              {/* 메인 메뉴 아이템 */}
              <Link
                href={hasSubItems && isHovered ? '#' : item.href}
                onClick={(e) => {
                  if (hasSubItems && isHovered) {
                    e.preventDefault();
                    handleItemClick(item.id, true);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md',
                  'text-slate-300 hover:text-white',
                  'transition-colors duration-200',
                  active && 'bg-blue-600/30 text-white border-l-2 border-blue-500',
                  !active && 'hover:bg-slate-700/50'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                
                {/* 레이블 (호버 시에만 표시) */}
                <span
                  className={cn(
                    'whitespace-nowrap transition-opacity duration-200',
                    isHovered ? 'opacity-100' : 'opacity-0 w-0'
                  )}
                >
                  {item.label}
                </span>

                {/* 서브메뉴 화살표 */}
                {hasSubItems && isHovered && (
                  <ChevronRight
                    className={cn(
                      'ml-auto h-4 w-4 transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}
                  />
                )}
              </Link>

              {/* 서브메뉴 */}
              {hasSubItems && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'block px-3 py-1.5 text-sm rounded-md',
                        'text-slate-400 hover:text-white',
                        'transition-colors duration-200',
                        isActive(subItem.href) && 'text-blue-400 bg-blue-600/20',
                        !isActive(subItem.href) && 'hover:bg-slate-700/30'
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ======== 구분선 ======== */}
      <div className="mx-2 border-t border-slate-700" />

      {/* ======== 하단 메뉴 ======== */}
      <nav className="py-2">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItem === item.id && isHovered;

          return (
            <div key={item.id}>
              <Link
                href={hasSubItems && isHovered ? '#' : item.href}
                onClick={(e) => {
                  if (hasSubItems && isHovered) {
                    e.preventDefault();
                    handleItemClick(item.id, true);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md',
                  'text-slate-300 hover:text-white',
                  'transition-colors duration-200',
                  active && 'bg-blue-600/30 text-white',
                  !active && 'hover:bg-slate-700/50'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    'whitespace-nowrap transition-opacity duration-200',
                    isHovered ? 'opacity-100' : 'opacity-0 w-0'
                  )}
                >
                  {item.label}
                </span>
                {hasSubItems && isHovered && (
                  <ChevronRight
                    className={cn(
                      'ml-auto h-4 w-4 transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}
                  />
                )}
              </Link>

              {hasSubItems && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'block px-3 py-1.5 text-sm rounded-md',
                        'text-slate-400 hover:text-white',
                        'transition-colors duration-200',
                        isActive(subItem.href) && 'text-blue-400 bg-blue-600/20',
                        !isActive(subItem.href) && 'hover:bg-slate-700/30'
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;

