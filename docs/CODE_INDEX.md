# 코드 인덱스 (Code Index)

> **목적**: 500행 제한으로 분리된 파일들을 체계적으로 관리
> **업데이트**: 파일 추가/삭제 시 반드시 갱신

---

## 📁 전체 구조

```
src/
├── app/                    # 페이지 (Next.js App Router)
│   ├── dashboard/          # 대시보드 모듈
│   ├── pfmea/              # P-FMEA 모듈
│   ├── dfmea/              # D-FMEA 모듈
│   ├── control-plan/       # Control Plan 모듈
│   └── ...
├── components/             # 공통 컴포넌트
│   ├── layout/             # 레이아웃 컴포넌트
│   ├── ui/                 # UI 컴포넌트 (shadcn)
│   └── common/             # 공용 컴포넌트
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티
├── types/                  # 타입 정의
└── constants/              # 상수
```

---

## 🗂️ 모듈별 인덱스

### 1. Dashboard 모듈
| 파일 | 라인 | 역할 | 의존성 |
|------|------|------|--------|
| `app/dashboard/page.tsx` | 354 | 메인 페이지 | CompanyLogo, Link |
| `app/dashboard/layout.tsx` | 47 | 레이아웃 | Sidebar, StatusBar |

### 2. Layout 컴포넌트
| 파일 | 라인 | 역할 | 의존성 |
|------|------|------|--------|
| `components/layout/Sidebar.tsx` | 298 | 사이드바 | CompanyLogo, Link |
| `components/layout/Header.tsx` | 109 | 헤더 | - |
| `components/layout/StatusBar.tsx` | 101 | 상태바 | - |
| `components/layout/index.ts` | - | 내보내기 | 모든 layout |

### 3. 공통 컴포넌트
| 파일 | 라인 | 역할 | 의존성 |
|------|------|------|--------|
| `components/CompanyLogo.tsx` | 206 | 회사 로고 | Image |

---

## 🔗 의존성 그래프

```
Dashboard
    ├── Sidebar
    │   └── CompanyLogo
    ├── StatusBar
    └── CompanyLogo (직접)

PFMEA (예정)
    ├── Header
    ├── Sidebar
    ├── TopNav
    ├── ActionBar
    ├── InfoBar
    ├── StepBar
    ├── Worksheet (Handsontable)
    └── StatusBar
```

---

## 📊 파일 통계

| 카테고리 | 파일 수 | 총 라인 | 평균 라인 |
|----------|---------|---------|-----------|
| Pages | 3 | 415 | 138 |
| Components | 5 | 714 | 143 |
| Hooks | 0 | 0 | 0 |
| Utils | 1 | 6 | 6 |
| **합계** | **9** | **1,135** | **126** |

---

## 🏷️ 네이밍 규칙

### 파일명
| 유형 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `CompanyLogo.tsx` |
| 페이지 | 소문자 | `page.tsx`, `layout.tsx` |
| 훅 | use 접두사 | `useAuth.ts` |
| 유틸 | camelCase | `formatDate.ts` |
| 타입 | 도메인명 | `dashboard.types.ts` |
| 상수 | UPPER_SNAKE | `MENU_ITEMS.ts` |

### 폴더명
| 유형 | 규칙 | 예시 |
|------|------|------|
| 기능 모듈 | kebab-case | `control-plan/` |
| 컴포넌트 | 소문자 | `components/` |

---

## 🔍 빠른 검색 가이드

### 기능별 파일 찾기
| 기능 | 파일 |
|------|------|
| 로고 변경 | `components/CompanyLogo.tsx` |
| 사이드바 메뉴 | `components/layout/Sidebar.tsx` |
| 대시보드 카드 | `app/dashboard/page.tsx` |
| AP 테이블 | `app/dashboard/page.tsx` (향후 분리 예정) |
| 바로가기 버튼 | `app/dashboard/page.tsx` (향후 분리 예정) |

### 컴포넌트별 위치
| 컴포넌트 | 경로 |
|----------|------|
| `<Sidebar />` | `components/layout/Sidebar.tsx` |
| `<Header />` | `components/layout/Header.tsx` |
| `<StatusBar />` | `components/layout/StatusBar.tsx` |
| `<CompanyLogo />` | `components/CompanyLogo.tsx` |

---

## 📝 업데이트 로그

| 날짜 | 변경 | 담당 |
|------|------|------|
| 2025-12-26 | 초기 인덱스 생성 | AI |
| - | - | - |

---

## 🤖 자동화 스크립트

### 인덱스 자동 생성 (향후)
```bash
# 파일 목록 및 라인 수 자동 집계
npm run index:generate
```

### 의존성 그래프 생성 (향후)
```bash
# madge 또는 dependency-cruiser 사용
npm run deps:graph
```

---

© AMP SYSTEM - FMEA Smart System

