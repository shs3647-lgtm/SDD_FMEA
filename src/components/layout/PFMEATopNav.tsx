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
        background: 'linear-gradient(to right, #1a237e, #283593, #1a237e)',  // 1단계 - 가장 어두움
        height: '32px',
        fontFamily: '"Segoe UI", "Malgun Gothic", Arial, sans-serif',
        paddingLeft: '0',
        marginLeft: '0',
        borderBottom: '1px solid rgba(255,255,255,0.2)',  // 하단 구분선
      }}
    >
      {/* 바로가기 레이블 */}
      <div 
        style={{ 
          padding: '0 12px 0 8px',
          color: 'rgba(255,255,255,0.8)',  // 가독성 향상
          fontSize: '11px',  // 10px → 11px
          fontWeight: 600,  // 표준화
          borderRight: '1px solid rgba(255,255,255,0.2)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          minWidth: '60px',
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
            padding: '0 16px',  // 12px → 16px (여유 공간)
            height: '100%',
            background: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: 'white',
            border: 'none',
            borderRight: index < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
            cursor: 'pointer',
            fontSize: '12px',  // 11px → 12px (사이드바와 통일)
            fontWeight: isActive(item.path) ? 600 : 400,  // 표준화 (bold/normal → 600/400)
            display: 'flex',
            alignItems: 'center',
            gap: '6px',  // 4px → 6px
            transition: 'all 0.2s ease',  // 부드러운 전환
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(-1px)';  // 살짝 위로
            }
          }}
          onMouseOut={(e) => {
            if (!isActive(item.path)) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
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

