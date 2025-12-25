# FMEA Smart System - 디자인 가이드

## 1. 레이아웃 원칙

### 1.1 양쪽맞춤 균등배분 (필수)
**하나의 영역에 여러 항목을 배치할 때는 항상 양쪽맞춤으로 균등배분한다.**

```css
/* 필수 적용 */
.container {
  display: flex;
  justify-content: space-between; /* 양쪽맞춤 */
}

.item {
  flex: 1; /* 균등배분 */
}
```

**적용 예시:**
- 바로가기 버튼들
- 상태 카드들
- 탭 메뉴들
- 액션 버튼 그룹

### 1.2 화면 비율
- Chrome 기준 100% 고정
- `zoom: 100% !important`
- `initialScale: 1.0`, `userScalable: false`

---

## 2. 색상 팔레트

### 2.1 다크 테마 (대시보드)

| 용도 | 색상 | Hex |
|------|------|-----|
| 배경 1 | 진한 네이비 | `#0d1830` |
| 배경 2 | 더 진한 네이비 | `#0b1426` |
| 패널 | 패널 배경 | `#0e1a33` |
| 테두리 | 패널 테두리 | `#1d2a48` |
| 텍스트 | 주 텍스트 | `#eaf0ff` |
| 보조 텍스트 | 서브 텍스트 | `#a7b6d3` |
| 브랜드 | 브랜드 파랑 | `#5ba9ff` |
| 성공 (OK) | 초록 | `#22c55e` |
| 경고 (DONE) | 주황 | `#f59e0b` |
| 위험 (DELAY) | 빨강 | `#ef4444` |

### 2.2 표준 테이블 색상 (table-design-reference.html 기준)

| 영역 | 색상 | Hex | 용도 |
|------|------|-----|------|
| 헤더 | 진한 남청색 | `#00587a` | 헤더 행 전체 |
| 좌측 열 | 진한 남청색 | `#00587a` | 첫 번째 열 (row-header) |
| 홀수 행 | 흰색 | `#ffffff` | 바디 영역 홀수 행 |
| 짝수 행 | 연한 하늘색 | `#e0f2fb` | 바디 영역 짝수 행 |
| 테두리 | 회색 | `#999999` | 모든 셀 테두리 |
| 페이지 배경 | 연한 회색 | `#f5f5f5` | 페이지 전체 배경 |

### 2.3 라이트 테마 (폼/테이블 페이지)

| 용도 | 색상 | Hex |
|------|------|-----|
| 배경 | 연한 회색 | `#f5f5f5` |
| 컨테이너 | 흰색 | `#ffffff` |
| 그림자 | 박스 그림자 | `rgba(0,0,0,0.1)` |
| 안내 박스 | 연한 하늘색 | `#e0f2fb` |
| 성공 메시지 | 연한 초록 | `#d1fae5` |

---

## 2-1. 표준 테이블 디자인 (필수)

### 적용 범위
모든 데이터 테이블에 표준 디자인 적용

### CSS 스타일

```css
/* 테이블 기본 스타일 */
.standard-table {
  width: 100%;
  border-collapse: collapse;
  font-family: "Malgun Gothic", sans-serif;
}

/* 모든 셀 공통 테두리 */
.standard-table th,
.standard-table td {
  border: 1px solid #999;
  padding: 8px;
  text-align: center;
}

/* 헤더 행 스타일 (1행 전체) */
.standard-table thead th {
  background-color: #00587a;
  color: #ffffff;
  font-weight: bold;
}

/* 좌측 첫 번째 열 스타일 (전체 행) */
.standard-table .row-header {
  background-color: #00587a;
  color: #ffffff;
  font-weight: bold;
}

/* 바디 영역 - 짝수 행 (연한 하늘색) */
.standard-table tbody tr:nth-child(even) td:not(.row-header) {
  background-color: #e0f2fb;
}

/* 바디 영역 - 홀수 행 (흰색) */
.standard-table tbody tr:nth-child(odd) td:not(.row-header) {
  background-color: #ffffff;
}
```

### Tailwind 클래스 조합

```html
<!-- 헤더 -->
<th class="bg-[#00587a] text-white font-bold px-3 py-2 text-center" style="border: 1px solid #999">

<!-- 좌측 열 (row-header) -->
<td class="bg-[#00587a] text-white font-bold px-3 py-2" style="border: 1px solid #999">

<!-- 홀수 행 셀 -->
<td class="bg-white px-3 py-2 text-black" style="border: 1px solid #999">

<!-- 짝수 행 셀 -->
<td class="bg-[#e0f2fb] px-3 py-2 text-black" style="border: 1px solid #999">
```

### 색상 범례 컴포넌트

```html
<div class="flex items-center gap-6 text-xs text-gray-600">
  <div class="flex items-center gap-2">
    <div class="w-4 h-4 bg-[#00587a]" style="border: 1px solid #999"></div>
    <span>헤더/좌측열: #00587a</span>
  </div>
  <div class="flex items-center gap-2">
    <div class="w-4 h-4 bg-[#e0f2fb]" style="border: 1px solid #999"></div>
    <span>짝수 행: #e0f2fb</span>
  </div>
  <div class="flex items-center gap-2">
    <div class="w-4 h-4 bg-white" style="border: 1px solid #999"></div>
    <span>홀수 행: #ffffff</span>
  </div>
</div>
```

---

## 3. 컴포넌트 스타일

### 3.1 카드
```css
.card {
  background: #0e1a33;
  border: 1px solid #1d2a48;
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0,0,0,.35);
}
```

### 3.2 버튼
```css
/* 기본 버튼 */
.btn-primary {
  background: linear-gradient(to right, #5ba9ff, #88c0ff);
  color: white;
  border-radius: 8px;
  padding: 8px 16px;
}

/* 호버 효과 */
.btn:hover {
  transform: translateY(-2px);
}
```

### 3.3 배지 (Badge)
```css
/* AP 레벨 */
.badge-high { background: #ef4444; } /* H */
.badge-medium { background: #f59e0b; } /* M */
.badge-low { background: #22c55e; } /* L */

/* 상태 */
.badge-ok { background: #22c55e; }
.badge-done { background: #f59e0b; }
.badge-delay { background: #ef4444; }
```

---

## 4. 사이드바

### 4.1 구조
- 기본 너비: 48px (아이콘만)
- 호버 시 너비: 200px (아이콘 + 텍스트)
- 상단: 회사 로고 (클릭하여 변경 가능)
- 중앙: 메인 메뉴
- 하단: 설정/사용자 메뉴

### 4.2 로고 영역
- 위치: 사이드바 최상단
- 클릭: 파일 선택으로 로고 변경
- 저장: LocalStorage에 Base64 저장
- 배경: 연한 파란색 (`#e0f2fb`)

---

## 5. 헤더

### 5.1 대시보드 헤더
```
┌─────────────────────────────────────────────────────┐
│              Smart System              [접속자 ID]  │
└─────────────────────────────────────────────────────┘
```

- 중앙: "Smart System" 타이틀
- 우측: 접속자 ID 버튼

---

## 6. 바로가기 메뉴

### 6.1 구성
| 순서 | 메뉴 | 배지 | 설명 |
|------|------|------|------|
| 1 | Project | GO | 프로젝트 목록 |
| 2 | DFMEA | 설계 | 설계FMEA |
| 3 | PFMA | 공정 | 공정FMEA |
| 4 | Control Plan | - | 관리계획서 |
| 5 | PFD | - | 공정 흐름도 |
| 6 | WS | - | 작업표준 |
| 7 | PM | - | 설비/예방보전 |

### 6.2 레이아웃
- **양쪽맞춤 균등배분** (필수)
- `display: flex; justify-content: space-between;`
- 각 항목: `flex: 1;`

---

## 7. 반응형 규칙

### 7.1 브레이크포인트
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### 7.2 사이드바
- Desktop: 호버 확장 (48px → 200px)
- Mobile: 숨김 또는 햄버거 메뉴

---

## 8. 접근성

- 충분한 색상 대비 (4.5:1 이상)
- 클릭 가능 영역 최소 44x44px
- 키보드 네비게이션 지원
- 스크린 리더 호환

---

## 9. 코드 인덱싱 관리 시스템 (필수)

### 9.1 라인 수 기준 (500행 ±200행, 유연하게)

| 범위 | 상태 | 조치 |
|------|------|------|
| **0-50행** | 📦 너무 작음 | 반드시 다른 파일과 통합 |
| **50-150행** | ⚡ 소형 | 통합 검토 |
| **150-500행** | ✅ 최적 | 이상적인 크기 |
| **500-700행** | ✅ 허용 | 응집력 있으면 유지 OK |
| **700-900행** | ⚠️ 분리검토 | 분리 계획 수립 |
| **900행+** | ❌ 분리필수 | 반드시 분리 실행 |

> **핵심 원칙**: 응집력 우선! 너무 작게 나누면 미로가 됨. 700행도 논리적 그룹이면 OK

### 9.2 인덱싱 관리 도구

```powershell
# 분석만
.\scripts\code-index-manager.ps1 -Analyze

# 최적화 제안
.\scripts\code-index-manager.ps1 -Optimize

# 인덱스 문서 생성
.\scripts\code-index-manager.ps1 -Generate
```

### 9.3 통합 vs 분리 기준

**통합 (50행 이하 파일)**
- 같은 폴더 내 관련 파일
- 단일 기능의 파편화된 코드
- 유틸리티 함수 모음

**분리 (900행 초과 파일)**
- 독립적인 기능 단위로 분리
- 컴포넌트 → 서브 컴포넌트
- 상수/타입 → 별도 파일

**유지 (500-700행 파일)**
- 응집력 있는 코드는 한 파일에 유지
- 관련 함수/컴포넌트가 밀접하게 연결된 경우
- 분리 시 오히려 복잡해지는 경우

### 9.4 인덱스 문서 관리

| 문서 | 용도 | 업데이트 시점 |
|------|------|---------------|
| `CODE_INDEX.md` | 수동 인덱스 | 파일 추가/삭제 시 |
| `CODE_INDEX_AUTO.md` | 자동 생성 | 스크립트 실행 시 |

### 9.5 미로 방지 원칙

1. **폴더 깊이 최대 4단계** (`src/app/dashboard/components/`)
2. **관련 파일은 같은 폴더에** (분산 금지)
3. **명확한 네이밍** (기능 + 타입)
4. **인덱스 문서 주기적 갱신** (주 1회)
5. **의존성 그래프 시각화** (분기 1회)

---

## 버전 정보

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2025-12-26 | 초기 디자인 가이드 작성 |
| 1.1.0 | 2025-12-26 | 표준 테이블 디자인 상세 규격 추가 (table-design-reference.html 기준) |

---

© AMP SYSTEM - FMEA Smart System

