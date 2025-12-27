'use client';

import { usePathname } from 'next/navigation';

interface PFMEATopNavProps {
  selectedFmeaId?: string;
}

/**
 * PFMEA 상단 바로가기 메뉴바
 * - 사이드바 색상과 동일 (#00587a)
 * - 스크롤해도 항상 보이도록 고정
 * - 모든 PFMEA 화면에서 사용
 */
export default function PFMEATopNav({ selectedFmeaId }: PFMEATopNavProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { label: 'FMEA등록', path: '/pfmea/register', icon: '📝' },
    { label: 'FMEA 리스트', path: '/pfmea/list', icon: '📋' },
    { label: 'FMEA 작성화면', path: '/pfmea/worksheet', icon: '✏️' },
    { label: 'FMEA 개정관리', path: '/pfmea/revision', icon: '📜' },
  ];

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleNavigation = (path: string) => {
    // 작성화면은 선택된 FMEA ID 포함
    if (path === '/pfmea/worksheet' && selectedFmeaId) {
      window.location.href = `${path}?id=${selectedFmeaId}`;
    } else {
      window.location.href = path;
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: '56px',  // 사이드바 너비 (w-14 = 56px) 만큼 오른쪽으로
        right: 0,
        zIndex: 999,  // 사이드바보다 낮게
        display: 'flex', 
        alignItems: 'center',
        background: 'linear-gradient(to right, #1a237e, #283593, #1a237e)',  // 사이드바 색상과 동일
        height: '36px',
        fontFamily: '"Malgun Gothic", sans-serif',
      }}
    >
      {/* 바로가기 레이블 */}
      <div 
        style={{ 
          padding: '0 16px', 
          color: 'white', 
          fontSize: '12px', 
          fontWeight: 'bold',
          borderRight: '1px solid rgba(255,255,255,0.3)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        바로가기
      </div>
      
      {/* 메뉴 항목들 */}
      {menuItems.map((item, index) => (
        <button
          key={item.path}
          onClick={() => handleNavigation(item.path)}
          style={{
            padding: '0 20px',
            height: '100%',
            background: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: 'white',
            border: 'none',
            borderRight: index < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: isActive(item.path) ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }
          }}
          onMouseOut={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {item.icon} {item.label}
        </button>
      ))}
      
      {/* 우측 영역 (나머지 공간 채우기) */}
      <div style={{ flex: 1, height: '100%' }} />
    </div>
  );
}

