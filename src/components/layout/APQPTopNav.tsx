'use client';

import { usePathname } from 'next/navigation';

interface APQPTopNavProps {
  selectedApqpId?: string;
}

// 스타일 함수
const containerStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: '53px', right: 0, zIndex: 999,
  display: 'flex', alignItems: 'center', height: '28px',
  background: 'linear-gradient(to right, #1b5e20, #2e7d32, #1b5e20)',
  fontFamily: '"Malgun Gothic", sans-serif', paddingLeft: 0, marginLeft: 0
};
const labelStyle: React.CSSProperties = {
  padding: '0 8px 0 4px', color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 'bold',
  borderRight: '1px solid rgba(255,255,255,0.2)', height: '100%', display: 'flex', alignItems: 'center', minWidth: '50px'
};
const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: '0 12px', height: '100%', border: 'none', cursor: 'pointer', fontSize: '11px',
  display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s', whiteSpace: 'nowrap',
  background: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white', fontWeight: active ? 'bold' : 'normal'
});

/**
 * APQP 상단 바로가기 메뉴바
 * - 사이드바 색상과 동일 (#00587a)
 * - 스크롤해도 항상 보이도록 고정
 * - 모든 APQP 화면에서 사용
 */
export default function APQPTopNav({ selectedApqpId }: APQPTopNavProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { label: 'APQP등록', path: '/apqp/register', icon: '📝' },
    { label: 'APQP 리스트', path: '/apqp/list', icon: '📋' },
    { label: 'APQP 작성화면', path: '/apqp/worksheet', icon: '✏️' },
    { label: 'APQP 개정관리', path: '/apqp/revision', icon: '📜' },
  ];

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleNavigation = (path: string) => {
    // 작성화면은 선택된 APQP ID 포함
    if (path === '/apqp/worksheet' && selectedApqpId) {
      window.location.href = `${path}?id=${selectedApqpId}`;
    } else {
      window.location.href = path;
    }
  };

  return (
    <div style={containerStyle}>
      {/* 바로가기 레이블 */}
      <div style={labelStyle}>바로가기</div>
      
      {/* 메뉴 항목들 */}
      {menuItems.map((item, index) => (
        <button
          key={item.path}
          onClick={() => handleNavigation(item.path)}
          style={{ ...btnStyle(isActive(item.path)), borderRight: index < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}
          onMouseOver={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseOut={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}
        >
          {item.icon} {item.label}
        </button>
      ))}
      
      {/* 우측 영역 */}
      <div className="flex-1 h-full" />
    </div>
  );
}





