# 🎨 P-FMEA 워크시트 화면 표준화 가이드

> **작성일**: 2025-12-30  
> **버전**: v1.0  
> **목적**: 전체 워크시트 탭의 일관된 UI/UX 제공

---

## 📋 목차

1. [화면 구조 표준](#1-화면-구조-표준)
2. [색상 체계](#2-색상-체계)
3. [버튼 배치 규칙](#3-버튼-배치-규칙)
4. [모달 표준](#4-모달-표준)
5. [메시지 표준](#5-메시지-표준)
6. [폰트 및 간격](#6-폰트-및-간격)
7. [체크리스트](#7-체크리스트)

---

## 1. 화면 구조 표준

### 1.1 기본 레이아웃 구조

```
┌─────────────────────────────────────────────────────────┐
│ [헤더 영역]                         [확정] [누락 N건] [수정] │ ← 항상 상단 우측
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [메인 테이블 영역]                      │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 탭별 적용 현황

| 탭 이름 | 확정 버튼 | 누락 표시 | 수정 버튼 | 비고 |
|---------|----------|----------|----------|------|
| **구조분석** (structure) | ✅ | ✅ | ✅ | page.tsx에서 직접 구현 |
| **기능분석 L1** (function-l1) | ✅ | ✅ | ✅ | FunctionL1Tab.tsx |
| **기능분석 L2** (function-l2) | ⚠️ 확인필요 | ⚠️ 확인필요 | ⚠️ 확인필요 | FunctionL2Tab.tsx |
| **기능분석 L3** (function-l3) | ⚠️ 확인필요 | ⚠️ 확인필요 | ⚠️ 확인필요 | FunctionL3Tab.tsx |
| **고장분석 L1** (failure-l1) | ✅ | ✅ | ✅ | FailureL1Tab.tsx |
| **고장분석 L2** (failure-l2) | ⚠️ 확인필요 | ⚠️ 확인필요 | ⚠️ 확인필요 | FailureL2Tab.tsx |
| **고장분석 L3** (failure-l3) | ⚠️ 확인필요 | ⚠️ 확인필요 | ⚠️ 확인필요 | FailureL3Tab.tsx |
| **고장연결** (failure-link) | ⚠️ 확인필요 | ⚠️ 확인필요 | ⚠️ 확인필요 | FailureLinkTab.tsx |
| **전체보기** (all) | ❌ 없음 | ❌ 없음 | ❌ 없음 | 읽기 전용 |

---

## 2. 색상 체계

### 2.1 단계별 메인 색상

```typescript
const STEP_COLORS = {
  structure: {
    main: '#1976d2',      // 파란색 (구조분석)
    header: '#bbdefb',
    cell: '#e3f2fd'
  },
  function: {
    main: '#1b5e20',      // 초록색 (기능분석)
    header: '#c8e6c9',
    cell: '#e8f5e9'
  },
  failure: {
    main: '#c62828',      // 빨간색 (고장분석)
    header: '#ffcdd2',
    cell: '#ffebee'
  },
  risk: {
    main: '#6a1b9a',      // 보라색 (리스크분석)
    header: '#e1bee7',
    cell: '#fce4ec'
  },
  opt: {
    main: '#e65100',      // 주황색 (최적화)
    header: '#ffe0b2',
    cell: '#fff3e0'
  }
};
```

### 2.2 상태별 색상

```typescript
const STATUS_COLORS = {
  success: '#4caf50',    // 녹색 (확정됨, 저장 성공)
  warning: '#ff9800',    // 주황색 (수정, 경고)
  error: '#f44336',      // 빨간색 (누락, 에러)
  info: '#2196f3',       // 파란색 (정보)
  disabled: '#9e9e9e'    // 회색 (비활성화)
};
```

### 2.3 구분(Type)별 색상

```typescript
const TYPE_COLORS = {
  'Your Plant': {
    bg: '#1976d2',        // 파란색
    light: '#bbdefb',
    text: '#0d47a1'
  },
  'Ship to Plant': {
    bg: '#f57c00',        // 주황색
    light: '#ffe0b2',
    text: '#e65100'
  },
  'User': {
    bg: '#7b1fa2',        // 보라색
    light: '#e1bee7',
    text: '#4a148c'
  }
};
```

---

## 3. 버튼 배치 규칙

### 3.1 상단 우측 버튼 (필수)

**위치**: 테이블 헤더 우측  
**순서**: `[확정] [누락 N건] [수정]` (좌→우)

#### 확정 버튼
```typescript
// 확정 전
<button
  type="button"
  onClick={handleConfirm}
  disabled={isConfirmed}
  style={{
    padding: '3px 10px',
    background: isConfirmed ? '#9e9e9e' : '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: isConfirmed ? 'not-allowed' : 'pointer'
  }}
>
  확정
</button>

// 확정 후
<span style={{
  padding: '3px 10px',
  background: '#4caf50',
  color: 'white',
  borderRadius: '3px',
  fontSize: '11px',
  fontWeight: 700
}}>
  ✓ 확정됨
</span>
```

#### 누락 표시
```typescript
<span style={{
  padding: '3px 10px',
  background: missingCount > 0 ? '#f44336' : '#4caf50',
  color: 'white',
  borderRadius: '3px',
  fontSize: '11px',
  fontWeight: 700
}}>
  누락 {missingCount}건
</span>
```

#### 수정 버튼
```typescript
<button
  type="button"
  onClick={handleEdit}
  disabled={!isConfirmed}
  style={{
    padding: '3px 10px',
    background: isConfirmed ? '#ff9800' : '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: isConfirmed ? 'pointer' : 'not-allowed'
  }}
>
  수정
</button>
```

### 3.2 버튼 간격

```css
gap: 6px;  /* 버튼 사이 간격 */
```

### 3.3 하단 우측 버튼 (금지 ❌)

**규칙**: 사용자가 하단 우측은 보지 않으므로 **절대 배치 금지**

---

## 4. 모달 표준

### 4.1 모달 구조

```
┌────────────────────────────────────────┐
│ [제목]          [💾 저장] [취소]       │ ← 상단 우측
├────────────────────────────────────────┤
│                                        │
│  [상위 항목 고정 배지 표시]              │
│                                        │
│  [입력 영역]                            │
│                                        │
└────────────────────────────────────────┘
```

### 4.2 상위 항목 표시 (고정 배지)

**규칙**: 드롭다운 ❌, 고정 배지 ✅

```typescript
// ✅ 좋은 예: 고정 배지
<div style={{ 
  marginBottom: '12px',
  padding: '8px',
  background: '#e3f2fd',
  borderRadius: '4px'
}}>
  <span style={{ fontSize: '11px', color: '#666' }}>상위:</span>
  <span style={{ 
    fontSize: '12px',
    fontWeight: 700,
    color: '#1976d2',
    marginLeft: '8px'
  }}>
    {parentItemName}
  </span>
</div>

// ❌ 나쁜 예: 드롭다운 (금지)
<select>
  <option>{parentItemName}</option>
</select>
```

### 4.3 모달 버튼 위치

**위치**: 항상 **상단 우측**  
**순서**: `[💾 저장] [취소]` (좌→우)

```typescript
<div style={{
  position: 'absolute',
  top: '12px',
  right: '12px',
  display: 'flex',
  gap: '8px'
}}>
  <button onClick={handleSave}>💾 저장</button>
  <button onClick={onClose}>취소</button>
</div>
```

---

## 5. 메시지 표준

### 5.1 확정 메시지

```typescript
// 성공
alert('✅ [탭명] 분석이 확정되었습니다.');

// 누락 있음
alert(`누락된 항목이 ${count}건 있습니다.\n모든 항목을 입력 후 확정해 주세요.`);
```

### 5.2 수정 메시지

```typescript
alert('🔓 수정 모드로 전환되었습니다.');
```

### 5.3 저장 메시지

```typescript
// 성공
alert('✅ 저장되었습니다.');

// 실패
alert('❌ 저장 실패: [상세 메시지]');
```

---

## 6. 폰트 및 간격

### 6.1 폰트 크기

```typescript
const FONT_SIZES = {
  header: '12px',         // 테이블 헤더
  button: '11px',         // 버튼 텍스트
  cell: '10px',           // 테이블 셀
  label: '9px',           // 레이블
  badge: '8px'            // 배지
};
```

### 6.2 여백

```typescript
const SPACING = {
  button: {
    padding: '3px 10px',  // 작은 버튼
    gap: '6px'            // 버튼 사이 간격
  },
  cell: {
    padding: '2px 4px'    // 테이블 셀
  },
  modal: {
    padding: '16px'       // 모달 내부
  }
};
```

---

## 7. 체크리스트

### 7.1 신규 탭 개발 시

- [ ] 확정/누락/수정 버튼을 **상단 우측**에 배치
- [ ] 단계별 색상 체계 적용
- [ ] 누락 건수 계산 로직 구현
- [ ] 확정 상태 localStorage 저장
- [ ] 플레이스홀더 패턴 체크 함수 적용

### 7.2 모달 개발 시

- [ ] 저장/취소 버튼을 **상단 우측**에 배치
- [ ] 상위 항목을 **고정 배지**로 표시 (드롭다운 금지)
- [ ] 모달 닫기 시 상태 초기화
- [ ] ESC 키로 닫기 가능

### 7.3 코드 리뷰 시

- [ ] 하단 우측에 버튼 없음
- [ ] 색상 체계 일관성
- [ ] 메시지 형식 일관성
- [ ] 폰트 크기 표준 준수

---

## 8. 참고 파일

### 8.1 표준 구현 예시

- ✅ `FunctionL1Tab.tsx` - 완벽한 표준 구현
- ✅ `FailureL1Tab.tsx` - 완벽한 표준 구현
- ✅ `page.tsx` (구조분석 부분) - 확정/누락/수정 버튼 구현

### 8.2 검토 필요

- ⚠️ `FunctionL2Tab.tsx`
- ⚠️ `FunctionL3Tab.tsx`
- ⚠️ `FailureL2Tab.tsx`
- ⚠️ `FailureL3Tab.tsx`
- ⚠️ `FailureLinkTab.tsx`

---

## 9. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2025-12-30 | v1.0 | 초안 작성 |

---

## 10. 문의

화면 표준화 관련 문의는 개발팀에 문의하세요.

---

**✨ 일관된 UI/UX로 사용자 경험을 향상시킵니다!**


