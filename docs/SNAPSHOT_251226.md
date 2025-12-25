# 스냅샷 메타정보 - 2025-12-26 19:00

## 커밋 정보

| 항목 | 내용 |
|------|------|
| **커밋 해시** | `8151793` |
| **태그** | `dashboard-ui-v1.1.0-251226` |
| **날짜** | 2025-12-26 19:00 |
| **상태** | 코드프리즈 ✅ |

## 변경사항

### 1. 제목영역 수정
- 레이아웃 Header 삭제
- 대시보드 자체 헤더: Smart System 중앙 + 접속자 ID 우측

### 2. 사이드바 로고
- 회사 로고를 사이드바 최상단으로 이동
- 클릭하여 변경 가능 (LocalStorage 저장)
- 연한 파란색 배경 (`#e0f2fb`)

### 3. 바로가기 양쪽맞춤
- `display: flex; justify-content: space-between;`
- 각 항목 `flex: 1` 균등배분
- 메뉴: Project GO, DFMEA 설계, PFMA 공정, Control Plan, PFD, WS, PM

### 4. AP Improvement 테이블
- 상태 텍스트: 진행중→진행, 대기→지연
- 컴팩트 디자인: text-xs, py-1.5
- 한 줄 표시: whitespace-nowrap
- 상태 폭 넓게: px-3

## 화면 스냅샷

| 화면 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/dashboard` | 메인 대시보드 |
| 사이드바 | 좌측 48px | 컬러 아이콘, 호버 시 200px 확장 |

## 파일 목록

```
fmea-smart-system/
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       ├── layout.tsx    # 레이아웃 (Header 제거)
│   │       └── page.tsx      # 대시보드 페이지
│   └── components/
│       ├── CompanyLogo.tsx   # 회사 로고 컴포넌트
│       └── layout/
│           └── Sidebar.tsx   # 사이드바 (로고 추가)
├── public/
│   └── logo.png              # 기본 로고
└── docs/
    ├── DESIGN_GUIDE.md       # 디자인 가이드
    └── SNAPSHOT_251226.md    # 이 파일
```

## 백업 위치

| 구분 | 위치 |
|------|------|
| **GitHub** | https://github.com/shs3647-lgtm/SDD_FMEA |
| **로컬 백업** | `C:\05_SDD_FMEA_BACKUP\20251226-0702` |
| **태그** | `dashboard-ui-v1.1.0-251226` |

## 테스트 URL

```
http://localhost:3000
```

---

© AMP SYSTEM - FMEA Smart System

