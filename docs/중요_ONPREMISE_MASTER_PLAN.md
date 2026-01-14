# 🚀 FMEA On-Premise 출시 마스터 플랜

> **문서 버전**: 1.0.0  
> **작성일**: 2026-01-10  
> **상태**: 종합 진단 완료

다른 주요 URL
화면	URL
루트 (Welcome Board)	http://localhost:3000
FMEA 등록 (시작점)	http://localhost:3000/pfmea/register
FMEA 리스트	http://localhost:3000/pfmea/list
FMEA 작성화면	http://localhost:3000/pfmea/worksheet?id={fmeaId}<br/>예: http://localhost:3000/pfmea/worksheet?id=pfm26-P001
FMEA 기초정보 등록	http://localhost:3000/pfmea/import
DB 뷰어	http://localhost:3000/admin/db-viewer
3. 빠른 접속 방법
브라우저 주소창 열기
URL 복사/붙여넣기:
   http://localhost:3000/pfmea/register
Enter 키 누르기
---

## 📋 FMEA 작성 순서 (표준 워크플로우)

```
1. FMEA 등록 → 2. FMEA 기초정보 등록 → 3. CFT 리스트 등록 → 4. 저장
   ↓
5. FMEA 리스트 생성 → 6. FMEA 작성화면 이동
   ↓
7. 구조분석 → 8. 1L기능 → 9. 2L기능 → 10. 3L기능
   ↓
11. 1L영향(FE) → 12. 2L형태(FM) → 13. 3L원인(FC)
   ↓
14. 고장연결 → 15. 5ST작성(리스크분석) 확정 → 16. 6ST작성(최적화) 확정
   ↓
✅ FMEA 완성
```

---

## 📊 단계별 진단 결과

### 🔴 **DB 구축 상태 (최우선)**

#### ✅ DB 구축 완료된 화면

| 화면 | DB 테이블 | API | 상태 |
|------|----------|-----|------|
| **FMEA 등록** | `fmea_projects`, `fmea_registrations`, `fmea_cft_members` | `/api/fmea/projects` | ✅ 완료 |
| **FMEA 워크시트** | `l1_structures`, `l2_structures`, `l3_structures`<br/>`l1_functions`, `l2_functions`, `l3_functions`<br/>`failure_effects`, `failure_modes`, `failure_causes`<br/>`failure_links`, `risk_analyses`, `optimizations`<br/>`fmea_worksheet_data`, `fmea_confirmed_states` | `/api/fmea/save-legacy`<br/>원자성 DB 저장 | ✅ 완료 |
| **FMEA 리스트** | `fmea_projects` | `/api/fmea/projects` | ✅ 완료 |
| **FMEA 기초정보** | `pfmea_master_datasets`, `pfmea_master_flat_items` | `/api/pfmea/master` | ✅ 완료 |
| **사용자 정보** | `users` | `/api/users` | ✅ 완료 (2026-01-11) |

#### ❌ DB 구축 미완료된 화면 (localStorage만 사용)

| 화면 | 현재 저장 방식 | 필요한 DB 테이블 | 우선순위 |
|------|---------------|-----------------|---------|
| **고객사 정보** (`/master/customer`) | ❌ localStorage만 | `customers` 테이블 필요 | 🔴 **높음** |
| **프로젝트 기초정보** (`/master/customer` 모달) | ❌ localStorage만 | `bizinfo_projects` 테이블 필요 | 🔴 **높음** |
| **APQP 프로젝트** | ⚠️ `apqp_projects` 테이블 있음<br/>❌ localStorage도 사용 | DB API 미완성 | 🟡 **중간** |
| **Control Plan** | ❌ localStorage만 | `control_plan_projects`, `control_plan_items` 필요 | 🟡 **중간** |
| **PFD (공정흐름도)** | ❌ localStorage만 | `pfd_projects`, `pfd_processes` 필요 | 🟡 **중간** |
| **DFMEA** | ⚠️ 일부 DB 있음<br/>❌ localStorage 혼용 | DB 완전 전환 필요 | 🟡 **중간** |

#### ⚠️ DB + localStorage 혼용 화면

| 화면 | DB 저장 | localStorage 사용 | 문제점 |
|------|---------|------------------|--------|
| **FMEA 워크시트** | ✅ 원자성 DB 저장 | ⚠️ tab, riskData 캐시용 | 데이터 불일치 가능 |
| **FMEA Import** | ✅ 마스터 데이터 DB | ⚠️ 임시 데이터 localStorage | 일관성 필요 |

---

### 1️⃣ FMEA 등록 (`/pfmea/register`)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | `codefreeze-20260110-register-final` |
| DB 저장 | ✅ 완료 | `POST /api/fmea/projects` |
| 원자성 | ✅ 확보 | 트랜잭션 처리 완료 |
| 코드프리즈 | ✅ 완료 | 디자인 확정 |

**기능**:
- FMEA 기초정보 테이블 (4행 8컬럼)
- FMEA 등록 옵션 (Master/Family/Part/신규입력)
- AI 예측 FMEA 테이블
- FMEA ID 자동 생성 (pfm26-M001, pfm26-F001, pfm26-P001)

---

### 2️⃣ FMEA 기초정보 등록 (`/pfmea/import`)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | `codefreeze-20260110-pfmea-import` |
| Excel Import | ✅ 완료 | 다중 시트 파싱 |
| Master 저장 | ✅ 완료 | localStorage + DB 동시 저장 |
| 시트명 변경 | ✅ 완료 | A1~C4 → L2-1~L1-4 형식 |
| 코드프리즈 | ✅ 완료 | `codefreeze-20260110-excel-sheet` |

**기능**:
- 전체/개별 Import
- 빈 템플릿/샘플 다운로드
- 관계형 데이터 Preview
- FMEA 목록 DB API 연동

---

### 3️⃣ CFT 리스트 등록 (등록화면 내장)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | `CFTRegistrationTable` 컴포넌트 |
| CFT 저장 | ✅ 완료 | PostgreSQL DB 연동 및 지속성 확보 |
| 지속성 검증 | ✅ 완료 | `codefreeze-20260111-cft-persistence-fixed` |
| 접속 로그 | ✅ 완료 | `CFTAccessLogTable` 컴포넌트 |
| 사이드바 메뉴 | ✅ 제거됨 | 등록화면에 통합 |

---

### 4️⃣ FMEA 리스트 (`/pfmea/list`)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | 14컬럼 테이블 |
| DB 조회 | ✅ 완료 | `GET /api/fmea/projects` |
| 미입력 표시 | ✅ 완료 | 주황색 "미입력" 배지 |
| 상위 FMEA | ✅ 완료 | 상속 관계 표시 |
| TYPE 배지 | ✅ 완료 | M/F/P 구분 |

---

### 5️⃣ 구조분석 (`StructureTab.tsx`)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | 725줄 |
| 코드프리즈 | ✅ 완료 | 2026-01-05 |
| DB 저장 | ✅ 완료 | L1Structure, L2Structure 테이블 |
| 확정 기능 | ✅ 완료 | 확정 버튼 + 배지 |

---

### 6️⃣ 기능분석 - 1L/2L/3L (`FunctionL1Tab`, `FunctionL2Tab`, `FunctionL3Tab`)

| 항목 | 상태 | 비고 |
|------|------|------|
| 1L 기능 | ✅ 완료 | 767줄, 코드프리즈 |
| 2L 기능 | ✅ 완료 | 코드프리즈 |
| 3L 기능 | ✅ 완료 | 코드프리즈 |
| 다중선택 | ✅ 완료 | `codefreeze-20260103-multiselect` |
| DB 저장 | ✅ 완료 | L1Function, L2Function, L3Function 테이블 |

---

### 7️⃣ 고장분석 - 1L영향/2L형태/3L원인 (`FailureL1Tab`, `FailureL2Tab`, `FailureL3Tab`)

| 항목 | 상태 | 비고 |
|------|------|------|
| 1L 영향(FE) | ✅ 완료 | 845줄, 코드프리즈 |
| 2L 형태(FM) | ✅ 완료 | 코드프리즈 |
| 3L 원인(FC) | ✅ 완료 | 코드프리즈 |
| 심각도 선택 | ✅ 완료 | SODSelectModal |
| DB 저장 | ✅ 완료 | FailureEffect, FailureMode, FailureCause 테이블 |

---

### 8️⃣ 고장연결 (`FailureLinkTab.tsx`)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | 1344줄 |
| FE-FM-FC 연결 | ✅ 완료 | 드래그&드롭, 클릭 연결 |
| 다이어그램 | ✅ 완료 | SVG 라인 표시 |
| DB 저장 | ✅ 완료 | FailureLink 테이블 |
| 코드프리즈 | ✅ 완료 | `codefreeze-20260105-failure-link-ui` |

---

### 9️⃣ 리스크분석 5ST (`RiskTabConfirmable.tsx`)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | 332줄 |
| SOD 입력 | ✅ 완료 | 심각도/발생도/검출도 |
| AP/RPN 계산 | ✅ 완료 | 자동 계산 |
| 확정 기능 | ✅ 완료 | 확정 시 DB 저장 |
| DB 저장 | ✅ 완료 | RiskAnalysis 테이블 |
| 코드프리즈 | ✅ 완료 | `codefreeze-20260106-risk-opt-confirm` |

---

### 🔟 최적화 6ST (`OptTabConfirmable.tsx`)

| 항목 | 상태 | 비고 |
|------|------|------|
| UI 개발 | ✅ 완료 | 406줄 |
| 개선 계획 | ✅ 완료 | 조치/책임자/목표일 |
| 결과 모니터링 | ✅ 완료 | 새 SOD 값 |
| 효과 평가 | ✅ 완료 | 새 AP/RPN |
| 확정 기능 | ✅ 완료 | 확정 시 DB 저장 |
| DB 저장 | ✅ 완료 | Optimization 테이블 |
| 코드프리즈 | ✅ 완료 | `codefreeze-20260106-risk-opt-confirm` |

---

## 🗄️ DB 구축 현황 및 진단

### ✅ 완료된 DB 테이블 (22개)

#### 1. FMEA 프로젝트 관리 (5개)
- `fmea_projects` - 프로젝트 기본 정보
- `fmea_registrations` - 등록 정보 (기획 및 준비 1단계)
- `fmea_cft_members` - CFT 멤버 정보
- `fmea_worksheet_data` - 워크시트 데이터 (JSON)
- `fmea_confirmed_states` - 확정 상태

#### 2. FMEA 워크시트 원자성 테이블 (13개)
- `l1_structures` - 완제품 구조
- `l2_structures` - 메인공정 구조
- `l3_structures` - 작업요소 구조
- `l1_functions` - 완제품 기능
- `l2_functions` - 메인공정 기능
- `l3_functions` - 작업요소 기능
- `failure_effects` - 고장영향 (FE)
- `failure_modes` - 고장형태 (FM)
- `failure_causes` - 고장원인 (FC)
- `failure_links` - 고장연결 (FE-FM-FC)
- `risk_analyses` - 리스크분석
- `optimizations` - 최적화
- `fmea_legacy_data` - 레거시 데이터 (하위호환)

#### 3. 마스터 데이터 (3개)
- `pfmea_master_datasets` - PFMEA 기초정보 마스터
- `pfmea_master_flat_items` - PFMEA 기초정보 플랫 아이템
- `users` - 사용자 정보 (전체 프로젝트 공유)

#### 4. 기타 (1개)
- `apqp_projects` - APQP 프로젝트 (테이블만 있고 API 미완성)

---

### ❌ 미구축 DB 테이블 (필수)

#### 1. 기초정보 마스터 데이터 (높음 우선순위)

| 테이블명 | 용도 | 현재 상태 | 필요 작업 |
|---------|------|----------|----------|
| `customers` | 고객사 정보 | ❌ localStorage만 | DB 테이블 생성 + API + 마이그레이션 |
| `bizinfo_projects` | 프로젝트 기초정보 | ❌ localStorage만 | DB 테이블 생성 + API + 마이그레이션 |
| `factories` | 공장 정보 | ❌ localStorage만 | DB 테이블 생성 + API (선택사항) |
| `products` | 품명 정보 | ❌ localStorage만 | DB 테이블 생성 + API (선택사항) |

#### 2. 다른 모듈 DB (중간 우선순위)

| 테이블명 | 용도 | 현재 상태 | 필요 작업 |
|---------|------|----------|----------|
| `control_plan_projects` | Control Plan 프로젝트 | ❌ localStorage만 | DB 테이블 생성 + API |
| `control_plan_items` | Control Plan 항목 | ❌ localStorage만 | DB 테이블 생성 + API |
| `pfd_projects` | PFD 프로젝트 | ❌ localStorage만 | DB 테이블 생성 + API |
| `pfd_processes` | PFD 공정 | ❌ localStorage만 | DB 테이블 생성 + API |
| `dfmea_projects` | DFMEA 프로젝트 | ⚠️ 일부 DB | 완전 전환 필요 |
| `apqp_projects` | APQP 프로젝트 | ⚠️ 테이블만 있음 | API 완성 필요 |

---

### 테이블 구조 (프로젝트별 스키마)

```
fmea_projects (프로젝트 기본 정보)
├── fmea_registrations (등록 정보)
├── fmea_cft_members (CFT 멤버)
├── fmea_worksheet_data (워크시트 JSON)
├── fmea_confirmed_states (확정 상태)
└── fmea_legacy_data (레거시 데이터)

워크시트 원자성 테이블 (fmeaId 기준):
├── l1_structures (완제품 구조)
│   ├── l2_structures (메인공정 구조)
│   │   └── l3_structures (작업요소 구조)
│   └── l1_functions (완제품 기능)
├── l2_functions (메인공정 기능)
├── l3_functions (작업요소 기능)
├── failure_effects (고장영향)
├── failure_modes (고장형태)
├── failure_causes (고장원인)
├── failure_links (고장연결)
├── risk_analyses (리스크분석)
└── optimizations (최적화)
```

### 트랜잭션 처리

| API | 트랜잭션 | 타임아웃 | 롤백 |
|-----|---------|---------|------|
| POST /api/fmea | ✅ $transaction | 30초 | ✅ 자동 |
| POST /api/fmea/projects | ✅ 순차 실행 | - | ✅ 수동 |

### 데이터 무결성 가드

- ✅ **덮어쓰기 방지**: 빈 데이터로 기존 데이터 덮어쓰기 차단
- ✅ **FK 검증**: FailureLink 저장 시 유효한 FK만 저장
- ✅ **레거시 데이터 우선**: Single Source of Truth 패턴

---

## 📋 핵심 규칙 (Rules)

### 룰 1번: UI 코드프리즈 (2026-01-10)
**원칙**: 모든 UI는 코드프리즈됨. **절대 수정 금지 목록**: 등록화면, 리스트, 워크시트, Import, 개정관리, 기초정보, 웰컴보드, 사이드바, 모든 모달, 레이아웃.  
**UI 수정 시 필수 프로세스**: 1) "이 파일은 코드프리즈입니다. 수정하시겠습니까?" 질문 2) 사용자 승인 후 → "어디까지 수정할까요?" 범위 확인 3) 범위 승인 후에만 수정 시작.  
**위반 시**: 즉시 `git checkout`으로 복원.  
**태그**: `codefreeze-20260110-all-ui-freeze`

### 룰 2번: FMEA 리스트와 DB는 1:1 관계 (2026-01-10)
**원칙**: 각 FMEA ID당 DB에는 **최신본 하나만** 유지되어야 함. FMEA 리스트와 DB는 **1:1 매핑** 관계.

**필수 사항**:
1. **저장 시 중복 방지**: 동일 `fmeaId`의 모든 기존 행을 삭제 후 최신본만 INSERT
2. **ID 형식 통일**: `info-${fmeaId}` 형식으로 Primary Key 생성 (예: `info-pfm26-M001`)
3. **완전한 데이터 저장**: 모든 필드(`engineeringLocation`, `designResponsibility`, `fmeaRevisionDate`, `confidentialityLevel`, `fmeaResponsibleName`, `companyName`, `customerName`, `cftMembers` 등) 필수 포함
4. **저장 검증**: 저장 후 반드시 DB에 완전한 데이터가 저장되었는지 확인

**구현 위치**:
- API: `src/app/api/fmea/projects/route.ts` (POST 메서드)
- 저장 로직: 동일 `fmeaId`의 모든 기존 행 삭제 → 최신본 INSERT

**검증 방법**:
- DB 뷰어: `http://localhost:3000/admin/db-viewer`에서 확인
- 스크립트: `node scripts/check-duplicate-ids.js ${fmeaId}`
- 테스트 URL 제공 시 반드시 DB 스키마 URL도 함께 제공

**테스트 URL 제공 형식**:
```
테스트 URL: http://localhost:3000/pfmea/register?id=pfm26-M001
DB 확인 URL: http://localhost:3000/admin/db-viewer
```

---

## 🏷️ 코드프리즈 현황

### 최신 코드프리즈 태그 (2026-01-10)

| 태그 | 범위 |
|------|------|
| `codefreeze-20260110-full-system` | 전체 시스템 |
| `codefreeze-20260110-register-final` | 등록화면 디자인 |
| `codefreeze-20260110-sidebar` | 사이드바 메뉴 |
| `codefreeze-20260110-pfmea-import` | Import 화면 |
| `codefreeze-20260110-excel-sheet` | Excel 시트명 |
| `codefreeze-20260110-master-info` | 기초정보 화면 |

### 워크시트 탭 코드프리즈 (2026-01-05~06)

| 탭 | 프리즈 일자 | 상태 |
|-----|-----------|------|
| StructureTab | 2026-01-05 | ✅ |
| FunctionL1Tab | 2026-01-05 | ✅ |
| FunctionL2Tab | 2026-01-05 | ✅ |
| FunctionL3Tab | 2026-01-05 | ✅ |
| FailureL1Tab | 2026-01-05 | ✅ |
| FailureL2Tab | 2026-01-05 | ✅ |
| FailureL3Tab | 2026-01-05 | ✅ |
| FailureLinkTab | 2026-01-05 | ✅ |
| RiskTabConfirmable | 2026-01-06 | ✅ |
| OptTabConfirmable | 2026-01-06 | ✅ |

---

## ⚠️ 보완 필요 사항

### 🔴 높음 (출시 전 필수) - **DB 우선**

| No | 항목 | 현황 | 조치 필요 |
|----|------|------|----------|
| **0** | **🔥 고객사 정보 DB 구축** | ❌ **localStorage만** | `customers` 테이블 생성 + API + 마이그레이션 |
| **0** | **🔥 프로젝트 기초정보 DB 구축** | ❌ **localStorage만** | `bizinfo_projects` 테이블 생성 + API + 마이그레이션 |
| 1 | ~~FMEA 개정관리 화면~~ | ✅ **완료** | DB API + 등록정보 자동연동 + 6ST 승인버튼 (codefreeze-20260110-revision-approval) |
| 2 | AllViewTab 데이터 표시 | ⚠️ 부분 완료 | 전체 뷰 정합성 검증 필요 |
| 3 | **온프레미스 DB 구축 가이드** | ⚠️ **누락** | PostgreSQL 설치, 스키마 생성, 초기 데이터 설정 가이드 |
| 4 | **프로젝트별 백업 시스템** | ⚠️ **부분 완료** | FMEA 작성 시 자동 백업 (엑셀/JSON/화면 스냅샷) |
| 5 | **사용자 인증 관리** | ❌ **미개발** | 로그인/로그아웃, 세션 관리, 인증 토큰 |
| 6 | **사용자별 권한 설정** | ❌ **미개발** | 역할 기반 권한 (Admin/Editor/Viewer), 프로젝트별 접근 제어 |

### 🟡 중간 (출시 후 개선)

| No | 항목 | 현황 | 조치 필요 |
|----|------|------|----------|
| 1 | Excel Export | ⚠️ 부분 완료 | 전체 FMEA 양식 Export |
| 2 | PDF Export | ⚠️ 미개발 | 출력용 PDF 생성 |
| 3 | **프로젝트별 복구/복사/이동** | ⚠️ **부분 완료** | export-package API 있으나 UI 화면 필요 |
| 4 | **서버 이전 가이드** | ⚠️ **누락** | 프로젝트별 파일 이동, DB 마이그레이션 가이드 |
| 5 | **화면 결과 백업** | ⚠️ **누락** | 스냅샷/스크린샷 자동 저장 |

### 🟢 낮음 (향후 개선)

| No | 항목 | 현황 | 조치 필요 |
|----|------|------|----------|
| 1 | FMEA 4판 변환 | ✅ 기본 완료 | 정밀 검증 필요 |
| 2 | CP 연동 | ✅ 기본 완료 | 양방향 동기화 |
| 3 | PFD 연동 | ⚠️ 미개발 | 공정흐름도 연결 |

---

---

## 🏗️ 온프레미스 출시 필수 구축 사항

### 1️⃣ DB 구축 (PostgreSQL)

#### 필수 작업
- [ ] PostgreSQL 설치 및 설정
- [ ] 데이터베이스 생성 (`fmea_db`)
- [ ] Prisma 마이그레이션 실행 (`npx prisma migrate deploy`)
- [ ] 초기 데이터 설정 (마스터 데이터)
- [ ] DB 백업 스케줄 설정 (일일 자동 백업)

#### 참고 문서
- `docs/DB_BACKUP_GUIDE.md` - 백업/복원 가이드
- `docs/USER_MASTER_DB_MIGRATION.md` - 사용자 정보 DB 마이그레이션

---

### 2️⃣ 백업 시스템

#### 프로젝트별 백업 요구사항

**FMEA 작성 완료 시 자동 백업:**
- [ ] **엑셀 파일** - 전체 FMEA 데이터 (Excel Export)
- [ ] **JSON 파일** - 원본 데이터 (export-package API)
- [ ] **화면 스냅샷** - 최종 화면 상태 (스크린샷)

**백업 저장 위치:**
```
backups/
├── projects/
│   ├── {fmeaId}/
│   │   ├── {fmeaId}_{YYYYMMDD_HHMMSS}.xlsx  # 엑셀 파일
│   │   ├── {fmeaId}_{YYYYMMDD_HHMMSS}.json  # JSON 파일
│   │   ├── {fmeaId}_{YYYYMMDD_HHMMSS}.png   # 화면 스냅샷
│   │   └── metadata.json                     # 메타데이터
```

#### 구현 필요 항목
- [ ] FMEA 확정 시 자동 백업 트리거
- [ ] 백업 파일 자동 정리 (30일 이상 된 파일 삭제)
- [ ] 백업 목록 조회 API
- [ ] 백업 복원 UI 화면

#### 현재 상태
- ✅ export-package API 존재 (`/api/fmea/export-package`)
- ✅ import-package API 존재 (`/api/fmea/import-package`)
- ⚠️ 자동 백업 스케줄러 미구현
- ⚠️ 화면 스냅샷 기능 미구현
- ⚠️ 백업 관리 UI 미구현

---

### 3️⃣ 사용자 정보 및 기초정보 DB 구축

#### ✅ 완료된 항목
- ✅ **사용자 정보 DB** (`users` 테이블) - **완료 (2026-01-11)**
  - 위치: PostgreSQL DB
  - API: `/api/users`
  - 전체 프로젝트 공유
  - 파일: `prisma/schema.prisma` (User 모델)
- ✅ **PFMEA 기초정보 DB** (`pfmea_master_datasets`, `pfmea_master_flat_items`)
  - 위치: PostgreSQL DB
  - API: `/api/pfmea/master`
  - Excel Import 시 DB 저장

#### ❌ 미완료 항목 (🔥 최우선)

##### 1. 고객사 정보 DB (`customers` 테이블)
- **현재 상태**: ❌ localStorage만 사용 (`bizinfo-db.ts`)
- **저장 위치**: `localStorage['ss-bizinfo-customers']`
- **필요 작업**:
  - [ ] Prisma 스키마: `Customer` 모델 추가
  - [ ] API 생성: `/api/customers` (GET, POST, PUT, DELETE)
  - [ ] `bizinfo-db.ts` DB 연동 (localStorage 폴백)
  - [ ] 기존 localStorage 데이터 마이그레이션
  - [ ] 마이그레이션 실행 (`npx prisma migrate dev`)

##### 2. 프로젝트 기초정보 DB (`bizinfo_projects` 테이블)
- **현재 상태**: ❌ localStorage만 사용 (`bizinfo-db.ts`)
- **저장 위치**: `localStorage['ss-bizinfo-projects']`
- **필요 작업**:
  - [ ] Prisma 스키마: `BizInfoProject` 모델 추가
  - [ ] API 생성: `/api/bizinfo/projects` (GET, POST, PUT, DELETE)
  - [ ] `bizinfo-db.ts` DB 연동 (localStorage 폴백)
  - [ ] 기존 localStorage 데이터 마이그레이션
  - [ ] 마이그레이션 실행

##### 3. 기타 기초정보 (선택사항)
- **공장 정보** (`factories` 테이블) - 현재 localStorage
- **품명 정보** (`products` 테이블) - 현재 localStorage
- 우선순위: 낮음 (고객사 정보와 프로젝트 기초정보 완료 후)

---

### 4️⃣ 사용자 인증 관리

#### 필수 기능
- [ ] **로그인/로그아웃**
  - 아이디/비밀번호 인증
  - 세션 관리 (JWT 또는 세션 쿠키)
  - 자동 로그아웃 (세션 만료)
- [ ] **사용자 등록**
  - 관리자만 사용자 등록 가능
  - 초기 비밀번호 설정
  - 비밀번호 변경 기능
- [ ] **인증 미들웨어**
  - 모든 API 엔드포인트 인증 체크
  - 권한 없는 접근 차단

#### 구현 필요 항목
- [ ] Prisma 스키마: `User` 모델에 `password`, `isActive` 필드 추가
- [ ] 인증 API: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- [ ] 로그인 페이지: `/login`
- [ ] 세션 관리: NextAuth.js 또는 JWT
- [ ] API 미들웨어: 인증 체크 로직

#### 현재 상태
- ✅ 사용자 정보 DB 구축 완료
- ❌ 비밀번호 필드 없음
- ❌ 로그인/로그아웃 기능 없음
- ❌ 인증 미들웨어 없음

---

### 5️⃣ 사용자별 권한 설정

#### 필수 기능
- [ ] **역할 기반 권한 (RBAC)**
  - **Admin**: 모든 권한 (사용자 관리, 프로젝트 삭제, 설정 변경)
  - **Editor**: FMEA 작성/수정 권한
  - **Viewer**: 읽기 전용 권한
- [ ] **프로젝트별 접근 제어**
  - 프로젝트 소유자 설정
  - 프로젝트별 편집자/뷰어 지정
  - 공개/비공개 프로젝트 설정

#### 구현 필요 항목
- [ ] Prisma 스키마: `User` 모델에 `role` 필드 추가
- [ ] Prisma 스키마: `FmeaProject` 모델에 `ownerId`, `accessControl` 필드 추가
- [ ] 권한 체크 API: `/api/auth/check-permission`
- [ ] 권한 관리 UI: 사용자별 권한 설정 화면
- [ ] API 미들웨어: 권한 체크 로직

#### 현재 상태
- ❌ 권한 시스템 없음
- ❌ 모든 사용자가 모든 프로젝트 접근 가능
- ❌ 프로젝트 소유자 개념 없음

---

### 6️⃣ 프로젝트별 복구/복사/이동

#### 필수 기능
- [ ] **프로젝트 복사**
  - 동일 DB 내에서 프로젝트 복사 (새 FMEA ID 생성)
  - 다른 서버로 프로젝트 복사 (export → import)
- [ ] **프로젝트 이동**
  - 서버 간 프로젝트 이동
  - DB 통째로 옮기지 않고 개별 프로젝트만 이동
- [ ] **프로젝트 복구**
  - 백업 파일에서 프로젝트 복구
  - 특정 시점으로 롤백
- [ ] **프로젝트 관리 UI**
  - 프로젝트 목록에서 복사/이동/복구 버튼
  - 백업 목록 조회 및 복구

#### 구현 필요 항목
- [ ] 프로젝트 복사 API: `/api/fmea/projects/copy`
- [ ] 프로젝트 이동 UI: 서버 선택, 프로젝트 선택, 이동 실행
- [ ] 프로젝트 복구 UI: 백업 목록, 복구 실행
- [ ] 프로젝트 관리 페이지: `/admin/projects`

#### 현재 상태
- ✅ export-package API 존재 (JSON 내보내기)
- ✅ import-package API 존재 (JSON 가져오기)
- ⚠️ 복사 기능 없음 (새 ID 생성하여 복사)
- ⚠️ 이동 UI 없음
- ⚠️ 복구 UI 없음

#### 서버 이전 시 프로세스
```
서버 A → 서버 B 이전:
1. 서버 A: 프로젝트별 export-package 실행
2. 백업 파일 (JSON) 다운로드
3. 서버 B: import-package로 가져오기
4. 서버 B: 프로젝트 검증 및 테스트
5. 서버 A: 프로젝트 삭제 (선택사항)
```

**⚠️ 주의사항:**
- DB 통째로 옮기지 말고 프로젝트별로 개별 이동
- 각 프로젝트는 독립적으로 백업/복구 가능
- 마스터 데이터 (사용자 정보, 기초정보)는 별도 마이그레이션 필요

---

## 📅 출시 체크리스트

### Phase 0: 인프라 구축 (5-7일) - **DB 우선**

- [ ] **🔥 DB 구축 (최우선)**
  - [ ] PostgreSQL 설치
  - [ ] 데이터베이스 생성 (`fmea_db`)
  - [ ] 기존 Prisma 마이그레이션 실행 (`npx prisma migrate deploy`)
  - [ ] **고객사 정보 DB 구축** (`customers` 테이블)
    - [ ] Prisma 스키마 추가
    - [ ] API 생성 (`/api/customers`)
    - [ ] `bizinfo-db.ts` DB 연동
    - [ ] localStorage 데이터 마이그레이션
  - [ ] **프로젝트 기초정보 DB 구축** (`bizinfo_projects` 테이블)
    - [ ] Prisma 스키마 추가
    - [ ] API 생성 (`/api/bizinfo/projects`)
    - [ ] `bizinfo-db.ts` DB 연동
    - [ ] localStorage 데이터 마이그레이션
  - [ ] 초기 데이터 설정 (마스터 데이터)
- [ ] **백업 시스템**
  - [ ] 프로젝트별 자동 백업 구현
  - [ ] 엑셀/JSON/스냅샷 백업 구현
  - [ ] 백업 스케줄 설정
  - [ ] 백업 관리 UI 구현
- [ ] **사용자 인증**
  - [ ] 로그인/로그아웃 구현
  - [ ] 세션 관리 구현
  - [ ] 인증 미들웨어 구현
- [ ] **권한 관리**
  - [ ] 역할 기반 권한 시스템 구현
  - [ ] 프로젝트별 접근 제어 구현
  - [ ] 권한 관리 UI 구현

### Phase 1: 기능 검증 (1-2일)

- [ ] FMEA 등록 → 리스트 → 작성화면 이동 테스트
- [ ] 구조분석 → 기능분석 → 고장분석 순차 테스트
- [ ] 고장연결 → 리스크분석 → 최적화 순차 테스트
- [ ] 확정 → DB 저장 → 재로드 데이터 정합성 검증
- [ ] Master/Family/Part FMEA 상속 테스트

### Phase 2: 데이터 무결성 (1일)

- [ ] 트랜잭션 롤백 테스트
- [ ] 동시 저장 충돌 테스트
- [ ] 대용량 데이터 (100공정 이상) 성능 테스트

### Phase 3: UX 검증 (1일)

- [ ] 모든 화면 사이드바 연동 확인
- [ ] 미입력 필드 표시 확인
- [ ] 에러 메시지 사용자 친화적 확인
- [ ] 로딩 상태 표시 확인

### Phase 4: 배포 (1일)

- [ ] 최종 코드프리즈 태그 생성
- [ ] 백업 완료
- [ ] 운영 서버 배포
- [ ] 사용자 매뉴얼 제공

---

## 🎯 결론

### 현재 완성도: **70%** (기능) / **35%** (온프레미스 구축) / **60%** (DB 구축)

| 구분 | 완료 | 미완료 | 비율 |
|------|------|--------|------|
| 핵심 기능 | 16개 | 0개 | 100% |
| **DB 구축** | **23개 테이블** | **5개 테이블** | **82%** |
| - FMEA 관련 (✅ FailureAnalyses 추가 2026-01-11) | 19개 | 0개 | 100% |
| - 마스터 데이터 | 3개 | 2개 | 60% |
| - 기타 모듈 | 1개 | 3개 | 25% |
| 코드프리즈 | 10개 탭 | 0개 | 100% |
| **온프레미스 구축** | **2개** | **6개** | **25%** |
| - DB 구축 가이드 | 1개 | - | - |
| - 백업 시스템 | 1개 | 3개 | 25% |
| - 사용자 인증 | 0개 | 1개 | 0% |
| - 권한 관리 | 0개 | 1개 | 0% |
| - 프로젝트 복구/이동 | 1개 | 2개 | 33% |
| - 화면 결과 백업 | 0개 | 1개 | 0% |

#### 🔥 DB 구축 우선순위

1. **최우선 (출시 전 필수)**
   - ❌ 고객사 정보 DB (`customers` 테이블)
   - ❌ 프로젝트 기초정보 DB (`bizinfo_projects` 테이블)

2. **중간 우선순위 (출시 후)**
   - ⚠️ Control Plan DB
   - ⚠️ PFD DB
   - ⚠️ DFMEA DB 완전 전환
   - ⚠️ APQP API 완성

3. **낮은 우선순위**
   - 공장 정보 DB
   - 품명 정보 DB

### 출시 가능 상태: ⚠️ **조건부 YES** (기능 완성) / ❌ **NO** (온프레미스 구축)

**기능 측면:**
- ✅ 핵심 FMEA 작성 워크플로우가 모두 구현되어 있으며, 각 단계별 DB 원자성이 확보되어 있습니다.

**온프레미스 구축 측면:**
- ❌ **DB 구축 (최우선)**: 고객사 정보, 프로젝트 기초정보 DB 필수
- ❌ 사용자 인증/권한 관리 필수
- ❌ 프로젝트별 백업 시스템 필수
- ❌ DB 구축 가이드 필요
- ⚠️ 프로젝트 복구/이동 기능 부분 완료

**추가 작업 필요 (우선순위 순):**

1. **🔥 DB 구축 (최우선, 3-4일)**
   - 고객사 정보 DB 구축 (`customers` 테이블) - 1-2일
   - 프로젝트 기초정보 DB 구축 (`bizinfo_projects` 테이블) - 1-2일
   - localStorage 데이터 마이그레이션 - 0.5일

2. **사용자 인증 시스템 구현 (3-5일)**
3. **권한 관리 시스템 구현 (2-3일)**
4. **프로젝트별 자동 백업 시스템 구현 (2-3일)**
5. **DB 구축 가이드 문서 작성 (1일)**
6. **프로젝트 관리 UI 구현 (2-3일)**

**예상 추가 작업 기간: 13-19일** (DB 구축 포함)

---

## 📋 개발 계획 (2026-01-14 추가)

### CP 공정흐름도 입력 모달 개발

**목적**: CP 워크시트 자동 입력 모드에서 공정명을 선택할 수 있는 입력 모달 개발

**요구사항**:
- PFMEA의 `ProcessSelectModal`과 동일한 형태 및 기능
- 우측 350px 고정 위치
- 트리뷰 형태의 공정 선택 인터페이스
- 연속 입력 모드 지원

**개발 단계**:
1. **Phase 1: 기본 모달 구조** (1일)
   - 모달 컴포넌트 생성 (`ProcessFlowInputModal.tsx`)
   - 우측 350px 위치 설정
   - 기본 레이아웃 (헤더, 검색, 트리뷰, 버튼)

2. **Phase 2: 데이터 로드** (1일)
   - 마스터 FMEA 공정 데이터 로드 (`/api/fmea/master-processes`)
   - 기초정보 공정 데이터 로드 (localStorage 폴백)
   - 현재 워크시트 공정 데이터 표시

3. **Phase 3: 트리뷰 구현** (1일)
   - 공정/작업요소 트리 구조 렌더링
   - 확장/축소 기능
   - 체크박스 선택 기능

4. **Phase 4: 검색 기능** (0.5일)
   - 실시간 검색 구현
   - 필터링 로직

5. **Phase 5: 입력 모드** (1일)
   - 일반 입력 모드
   - 연속 입력 모드 (선택사항)

6. **Phase 6: 통합 및 테스트** (0.5일)
   - CP 워크시트와 연동
   - 자동 입력 모드와 연동
   - 테스트 및 버그 수정

**예상 기간**: 5일

**관련 문서**:
- `docs/CP_공정흐름도_입력모달_PRD.md` - 상세 PRD
- 벤치마킹: `src/app/pfmea/worksheet/ProcessSelectModal.tsx`

**파일 위치**:
- `src/app/control-plan/worksheet/components/ProcessFlowInputModal.tsx`

**코드프리즈 태그**: `codefreeze-20260114-cp-process-flow-modal` (예정)

---

## 📝 변경 이력

| 버전 | 일자 | 변경 내용 |
|------|------|---------|
| 2.3.0 | 2026-01-14 | ✅ **CP 공정흐름도 입력 모달 개발 계획 추가**: PFMEA 모달 벤치마킹, 우측 350px 고정 위치, 트리뷰 형태 |
| 2.2.0 | 2026-01-11 | ✅ **고장분석 통합 DB 구축 완료** (`failure_analyses` 테이블): 고장연결+역전개 기능분석+역전개 구조분석 통합 저장, All 화면 DB 기반 렌더링 구현 |
| 2.1.0 | 2026-01-11 | DB 구축 현황 상세 추가: 화면별 DB 저장 상태 진단, 미구축 DB 테이블 명시, DB 구축 우선순위 강조 |
| 2.0.0 | 2026-01-11 | 온프레미스 출시 필수 구축 사항 추가: DB 구축, 백업 시스템, 사용자 인증, 권한 관리, 프로젝트 복구/이동 |
| 1.1.0 | 2026-01-10 | 룰 2번 추가: FMEA 리스트와 DB 1:1 관계 보장, 중복 ID 정리, 완전한 데이터 저장 필수 |
| 1.0.0 | 2026-01-10 | 최초 작성 - 전체 진단 완료 |

---

**작성자**: AI Assistant  
**승인자**: _________________  
**승인일**: _________________

