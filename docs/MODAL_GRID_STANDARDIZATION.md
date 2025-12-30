# 🎨 P-FMEA 모달 "바둑판" 레이아웃 표준화 가이드

> **작성일**: 2025-12-30  
> **버전**: v1.0  
> **목적**: 모든 모달을 바둑판처럼 정돈되고 체계적으로 표준화

---

## 📐 바둑판 레이아웃 원칙

### 핵심 개념: 격자(Grid) 시스템

```
┌─────────────────────────────────────────────────────────┐
│ [타이틀]                     [💾 저장] [취소]         │ ← 상단 헤더 (고정)
├─────────────────────────────────────────────────────────┤
│ ★ 상위: [고정 배지]                                    │ ← 상위 항목 (고정)
├─────────────────────────────────────────────────────────┤
│ [필터] [검색...]                                        │ ← 검색/필터 (선택)
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────┬──────────────┐        │
│ │ 항목 1       │ 항목 2       │ 항목 3       │        │ ← 그리드 (2~3열)
│ │ ☑            │ ☐            │ ☑            │        │
│ ├──────────────┼──────────────┼──────────────┤        │
│ │ 항목 4       │ 항목 5       │ 항목 6       │        │
│ │ ☐            │ ☑            │ ☐            │        │
│ └──────────────┴──────────────┴──────────────┘        │
├─────────────────────────────────────────────────────────┤
│                     ✓ N개 선택                          │ ← 하단 상태 (선택)
└─────────────────────────────────────────────────────────┘
```

---

## 1. 모달 레이아웃 구조

### 1.1 필수 영역 (4단 구조)

```typescript
// ✅ 표준 구조
<div className="modal-container">
  {/* 1단: 헤더 - 타이틀 + 버튼 */}
  <div className="modal-header">
    <h2>{title}</h2>
    <div className="button-group-right">
      <button onClick={handleSave}>💾 저장</button>
      <button onClick={onClose}>취소</button>
    </div>
  </div>

  {/* 2단: 상위 항목 (고정 배지) */}
  <div className="parent-info">
    <span>★ 상위:</span>
    <span className="badge">{parentName}</span>
  </div>

  {/* 3단: 검색/필터 (선택사항) */}
  <div className="search-filter">
    <input type="text" placeholder="검색..." />
  </div>

  {/* 4단: 그리드 콘텐츠 */}
  <div className="grid-content">
    {/* 2-3열 그리드 */}
  </div>

  {/* 5단: 하단 상태 (선택사항) */}
  <div className="footer-status">
    <span>✓ {count}개 선택</span>
  </div>
</div>
```

---

## 2. 버튼 배치 규칙

### 2.1 상단 우측 버튼 (필수)

**위치**: 모달 헤더 우측  
**순서**: `[💾 저장] [취소]` (좌→우)

```typescript
// ✅ 좋은 예: 상단 우측
<div className="modal-header">
  <h2>타이틀</h2>
  <div style={{ 
    position: 'absolute',
    right: '12px',
    top: '12px',
    display: 'flex',
    gap: '8px'
  }}>
    <button onClick={handleSave}>💾 저장</button>
    <button onClick={onClose}>취소</button>
  </div>
</div>

// ❌ 나쁜 예: 하단 우측 (사용자가 보지 않음)
<div className="modal-footer">
  <button>저장</button>
  <button>취소</button>
</div>
```

### 2.2 기능 버튼 (선택사항)

**위치**: 검색 영역 우측  
**예시**: `[전체] [해제] [적용] [삭제]`

```typescript
<div className="search-row">
  <input placeholder="검색..." />
  <div className="action-buttons">
    <button>전체</button>
    <button>해제</button>
    <button>적용</button>
    <button>삭제</button>
  </div>
</div>
```

---

## 3. 그리드 시스템

### 3.1 그리드 레이아웃 (2-3열)

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2열 */
  gap: 8px;
  padding: 12px;
}

/* 3열 (작은 항목용) */
.grid-container-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
```

### 3.2 그리드 아이템 표준

```typescript
// ✅ 표준 그리드 아이템
<div className="grid-item" style={{
  padding: '8px 12px',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  background: selected ? '#e3f2fd' : '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '40px'  // 일정한 높이 유지
}}>
  <input type="checkbox" checked={selected} />
  <span style={{ flex: 1 }}>{itemName}</span>
  {badge && <span className="badge">{badge}</span>}
</div>
```

---

## 4. 색상 표준화

### 4.1 단계별 색상 (분석 화면과 통일)

```typescript
const STEP_COLORS = {
  structure: {
    main: '#1976d2',      // 파란색 (구조분석)
    light: '#e3f2fd',
    dark: '#0d47a1'
  },
  function: {
    main: '#1b5e20',      // 초록색 (기능분석)
    light: '#e8f5e9',
    dark: '#1b5e20'
  },
  failure: {
    main: '#c62828',      // 빨간색 (고장분석)
    light: '#ffebee',
    dark: '#b71c1c'
  },
  risk: {
    main: '#6a1b9a',      // 보라색 (리스크)
    light: '#f3e5f5',
    dark: '#4a148c'
  },
  opt: {
    main: '#e65100',      // 주황색 (최적화)
    light: '#fff3e0',
    dark: '#bf360c'
  }
};
```

### 4.2 상태별 색상

```typescript
const STATUS_COLORS = {
  selected: '#e3f2fd',   // 선택됨
  hover: '#f5f5f5',      // 호버
  disabled: '#fafafa',   // 비활성
  error: '#ffebee'       // 에러
};
```

### 4.3 배지 색상

```typescript
const BADGE_COLORS = {
  blue: '#1976d2',       // 기본
  green: '#2e7d32',      // 성공
  red: '#c62828',        // 중요
  orange: '#f57c00',     // 경고
  purple: '#7b1fa2',     // 특수
  gray: '#757575'        // 비활성
};
```

---

## 5. 폰트 표준화

### 5.1 폰트 크기

```typescript
const FONT_SIZES = {
  modalTitle: '14px',    // 모달 타이틀
  sectionTitle: '12px',  // 섹션 제목
  itemLabel: '11px',     // 항목 레이블
  badge: '10px',         // 배지
  button: '11px',        // 버튼
  status: '10px'         // 하단 상태
};
```

### 5.2 폰트 굵기

```typescript
const FONT_WEIGHTS = {
  bold: 700,             // 제목, 강조
  semibold: 600,         // 버튼
  medium: 500,           // 레이블
  normal: 400            // 일반 텍스트
};
```

---

## 6. 간격 표준화

### 6.1 여백

```typescript
const SPACING = {
  modal: {
    padding: '16px',     // 모달 내부
    gap: '12px'          // 섹션 간격
  },
  grid: {
    gap: '8px',          // 그리드 아이템 간격
    itemPadding: '8px 12px'  // 아이템 내부 여백
  },
  button: {
    padding: '6px 12px', // 버튼 내부
    gap: '8px'           // 버튼 사이 간격
  }
};
```

---

## 7. 현재 모달 감사 결과

### 7.1 표준 준수 현황

| 모달 이름 | 버튼 위치 | 그리드 | 색상 | 폰트 | 상태 |
|-----------|----------|--------|------|------|------|
| **DataSelectModal** | ⚠️ 분산 | ✅ 2열 | ⚠️ 불일치 | ✅ | ⚠️ 개선 필요 |
| **SODSelectModal** | ⚠️ 확인필요 | ⚠️ | ⚠️ | ⚠️ | ⚠️ 개선 필요 |
| **SpecialCharSelectModal** | ⚠️ 확인필요 | ⚠️ | ⚠️ | ⚠️ | ⚠️ 개선 필요 |
| **FailureEffectSelectModal** | ⚠️ 확인필요 | ⚠️ | ⚠️ | ⚠️ | ⚠️ 개선 필요 |

### 7.2 주요 개선 사항

#### DataSelectModal
```
현재 문제:
❌ 저장/취소 버튼 없음 (적용/삭제만 있음)
❌ 버튼이 검색 영역에 분산
⚠️ 색상이 표준과 불일치

개선 방안:
✅ 상단 우측에 [💾 저장] [취소] 추가
✅ 검색 영역 버튼 정리
✅ 색상 표준으로 변경
```

---

## 8. 고장연결 탭 색상 표준화

### 8.1 현재 문제

```typescript
// ❌ 현재: 독자적인 색상
const COLORS = {
  blue: '#2b78c5',       // 표준 #1976d2와 다름
  fe: { text: '#1565c0' },   // 표준 #c62828과 다름
  fm: { text: '#f57c00' },   // 일관성 없음
  fc: { text: '#2e7d32' },   // 표준과 다름
};
```

### 8.2 표준화 방안

```typescript
// ✅ 표준: 분석 화면과 통일
const COLORS = {
  structure: '#1976d2',  // 구조분석
  function: '#1b5e20',   // 기능분석
  failure: '#c62828',    // 고장분석
  fe: '#c62828',         // FE (고장분석 색상)
  fm: '#c62828',         // FM (고장분석 색상)
  fc: '#c62828',         // FC (고장분석 색상)
  link: '#6a1b9a'        // 연결선 (구분용)
};
```

---

## 9. 체크리스트

### 9.1 모달 개발 시

- [ ] 저장/취소 버튼을 **상단 우측**에 배치
- [ ] 상위 항목을 **고정 배지**로 표시
- [ ] 그리드 레이아웃 사용 (2-3열)
- [ ] 표준 색상 적용
- [ ] 표준 폰트 크기 적용
- [ ] 일정한 아이템 높이 유지 (minHeight)
- [ ] ESC 키로 닫기 가능
- [ ] 배경 클릭 시 닫기 확인

### 9.2 코드 리뷰 시

- [ ] 하단 우측에 버튼 없음
- [ ] 그리드 간격 일관성
- [ ] 색상 표준 준수
- [ ] 폰트 크기 표준 준수
- [ ] 모달 높이 제한 (maxHeight)

---

## 10. 참고 예시

### 10.1 완벽한 그리드 모달 예시

```typescript
<div className="modal-container" style={{ width: '600px' }}>
  {/* 1단: 헤더 */}
  <div className="header">
    <h2>항목 선택</h2>
    <div className="buttons-right">
      <button onClick={handleSave}>💾 저장</button>
      <button onClick={onClose}>취소</button>
    </div>
  </div>

  {/* 2단: 상위 */}
  <div className="parent-info">
    <span>★ 상위: 공정기능</span>
    <span className="badge">{parentName}</span>
  </div>

  {/* 3단: 검색 */}
  <div className="search">
    <input placeholder="검색..." />
  </div>

  {/* 4단: 그리드 */}
  <div style={{ 
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    padding: '12px',
    maxHeight: '400px',
    overflowY: 'auto'
  }}>
    {items.map(item => (
      <div key={item.id} className="grid-item">
        <input type="checkbox" checked={selected} />
        <span>{item.name}</span>
      </div>
    ))}
  </div>

  {/* 5단: 하단 상태 */}
  <div className="footer">
    <span>✓ {count}개 선택</span>
  </div>
</div>
```

---

## 11. 다음 단계

1. ✅ 표준화 가이드 작성
2. ⏳ DataSelectModal 표준화 적용
3. ⏳ 고장연결 탭 색상 표준화
4. ⏳ 기타 모달 표준화 적용
5. ⏳ 전체 테스트

---

**✨ 바둑판처럼 정돈된 모달로 사용자 경험을 향상시킵니다!**


