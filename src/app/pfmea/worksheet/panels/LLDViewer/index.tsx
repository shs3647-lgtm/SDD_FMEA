/**
 * LLDViewer - 문서화 패널
 * 
 * TODO: Phase 3에서 구현 예정
 * - 마크다운/HTML 문서 뷰어
 * - 예상 크기: ~15KB (레이지 로딩)
 */

'use client';

export default function LLDViewer({ state }: { state: any }) {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      color: '#999',
      fontSize: '12px' 
    }}>
      📚 LLD 문서 뷰어 구현 예정<br/>
      (Phase 3: 마크다운/HTML 지원)<br/>
      예상 번들 크기: ~15KB
    </div>
  );
}


