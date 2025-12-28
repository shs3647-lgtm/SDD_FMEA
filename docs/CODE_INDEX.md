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
| `app/dashboard/page.tsx` | 358 | 메인 페이지 | Link |
| `app/dashboard/layout.tsx` | 47 | 레이아웃 | Sidebar, StatusBar |

### 2. AP 개선관리 모듈 (분리 완료 2025-12-26)
| 파일 | 라인 | 역할 | 의존성 |
|------|------|------|--------|
| `app/dashboard/ap-improvement/page.tsx` | 208 | 메인 페이지 | types, mock-data, utils, APModal |
| `app/dashboard/ap-improvement/types.ts` | 39 | 타입 정의 | - |
| `app/dashboard/ap-improvement/mock-data.ts` | 100 | 목업 데이터 | types |
| `app/dashboard/ap-improvement/utils.ts` | 67 | 유틸 함수 | types |
| `app/dashboard/ap-improvement/APModal.tsx` | 182 | 모달 컴포넌트 | types, shadcn/ui |

### 2.5 PFMEA Import 모듈 (신규 2025-12-26, PRD-026)
| 파일 | 라인 | 역할 | 의존성 |
|------|------|------|--------|
| `app/pfmea/layout.tsx` | 28 | PFMEA 레이아웃 | Sidebar, StatusBar |
| `app/pfmea/import/page.tsx` | 265 | Excel Import 페이지 | types, mock-data, shadcn/ui |
| `app/pfmea/import/types.ts` | 118 | 타입 정의 (15개 테이블) | - |
| `app/pfmea/import/mock-data.ts` | 96 | 목업 데이터 | types |

### 3. PFMEA Worksheet 모듈 (업데이트 2025-12-28)
| 파일 | 라인 | 역할 | 의존성 |
|------|------|------|--------|
| `app/pfmea/worksheet/page.tsx` | ~1400 | 워크시트 메인 | 모든 탭, 모달, 상태관리 |
| `app/pfmea/worksheet/columns.ts` | 150 | 컬럼 정의 | types |
| `app/pfmea/worksheet/excel-export.ts` | 450 | Excel 내보내기 | ExcelJS |
| `tabs/function/FunctionL1Tab.tsx` | 330 | 1L 기능분석 | SelectableCell, Modal |
| `tabs/function/FunctionL2Tab.tsx` | 420 | 2L 기능분석 | SelectableCell, Modal |
| `tabs/function/FunctionL3Tab.tsx` | 520 | 3L 기능분석 (특별특성 연동) | SelectableCell, SpecialCharSelectModal |
| `tabs/function/constants.ts` | 30 | 기능분석 색상 상수 | - |
| `tabs/failure/FailureL1Tab.tsx` | 400 | 1L 고장분석 | SelectableCell |
| `tabs/failure/FailureL2Tab.tsx` | 180 | 2L 고장분석 | SelectableCell |
| `tabs/failure/FailureL3Tab.tsx` | 250 | 3L 고장분석 | SelectableCell |

#### 색상 표준 (2025-12-28)
| 단계 | 색상 | HEX |
|------|------|-----|
| 구조분석 | 파란색 | #1976d2 |
| 기능분석 | 진한녹색 | #1b5e20 |
| 고장분석 | 붉은색 | #c62828 |

### 4. Layout 컴포넌트
| 파일 | 라인 | 역할 | 의존성 |
|------|------|------|--------|
| `components/layout/Sidebar.tsx` | 298 | 사이드바 | CompanyLogo, Link |
| `components/layout/Header.tsx` | 109 | 헤더 | - |
| `components/layout/StatusBar.tsx` | 101 | 상태바 | - |
| `components/layout/StepBar.tsx` | 130 | 단계바 (색상 표준화) | - |
| `components/layout/index.ts` | - | 내보내기 | 모든 layout |

### 5. 공통 컴포넌트
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
| Pages | 4 | 613 | 153 |
| Components | 6 | 896 | 149 |
| Hooks | 0 | 0 | 0 |
| Utils | 2 | 73 | 37 |
| Types | 1 | 39 | 39 |
| Data | 1 | 100 | 100 |
| **합계** | **14** | **1,721** | **123** |

> **최종 업데이트**: 2025-12-26 17:00

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
| AP 요약 테이블 | `app/dashboard/page.tsx` |
| AP 전체 관리 | `app/dashboard/ap-improvement/page.tsx` |
| AP 모달 | `app/dashboard/ap-improvement/APModal.tsx` |
| 바로가기 버튼 | `app/dashboard/page.tsx` |

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
| 2025-12-26 | AP 개선관리 모듈 분리 (607→596행, 5파일) | AI |
| 2025-12-26 | PFMEA Import 모듈 추가 (PRD-026, 507행, 4파일) | AI |
| 2025-12-28 | 트리뷰 색상 표준화 (구조:파랑, 기능:진한녹색, 고장:빨강) | AI |
| 2025-12-28 | FunctionL3Tab 특별특성 모달 연동 완료 | AI |

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


