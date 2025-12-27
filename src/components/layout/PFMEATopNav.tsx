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
        left: '53px',  // 사이드바(48px) + 구분선(5px) = 53px
        right: 0,
        zIndex: 999,  // 사이드바보다 낮게
        display: 'flex', 
        alignItems: 'center',
        background: 'linear-gradient(to right, #1a237e, #283593, #1a237e)',  // 사이드바 색상과 동일
        height: '28px',  // 더 컴팩트하게
        fontFamily: '"Malgun Gothic", sans-serif',
        paddingLeft: '0',  // 좌측 정렬
        marginLeft: '0',   // 사이드바와 간격 제거
      }}
    >
      {/* 바로가기 레이블 */}
      <div 
        style={{ 
          padding: '0 8px 0 4px',  /* 좌측 4px 패딩 추가 */
          color: 'rgba(255,255,255,0.7)', 
          fontSize: '10px', 
          fontWeight: 'bold',
          borderRight: '1px solid rgba(255,255,255,0.2)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          minWidth: '50px',
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
            padding: '0 12px',
            height: '100%',
            background: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: 'white',
            border: 'none',
            borderRight: index < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: isActive(item.path) ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
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

