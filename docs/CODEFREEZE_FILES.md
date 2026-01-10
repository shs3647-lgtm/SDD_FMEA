# 🔒 코드프리즈 파일 목록

> ⚠️ **이 목록의 파일들은 절대 수정 금지입니다.**
> 사용자의 명시적 승인 없이 수정 시 즉시 작업 중단합니다.

## 📌 핵심 원칙

1. **코드프리즈 파일 수정 전 반드시 사용자 승인 요청**
2. **파일 수정 전 이 문서 확인 필수**
3. **기존 UI/디자인 변경 절대 금지**

---

## 🚫 절대 수정 금지 파일

### 1. 등록화면 (codefreeze-20260110-register-final)
- `src/app/pfmea/register/page.tsx`
- 디자인, 레이아웃, 컬럼 비율 모두 고정

### 2. 사이드바 (codefreeze-20260110-sidebar)
- `src/components/layout/Sidebar.tsx`
- 메뉴 구조, 링크 경로 모두 고정

### 3. PFMEA Import (codefreeze-20260110-pfmea-import)
- `src/app/pfmea/import/page.tsx`
- `src/app/pfmea/import/excel-parser.ts`
- `src/app/pfmea/import/excel-template.ts`
- `src/app/pfmea/import/constants.ts`

### 4. 기초정보 (codefreeze-20260110-master-info)
- `src/app/master/user/page.tsx`
- `src/app/master/customer/page.tsx`

### 5. 워크시트 탭 (codefreeze-20260104-worksheet-complete)
- `src/app/pfmea/worksheet/tabs/StructureTab.tsx`
- `src/app/pfmea/worksheet/tabs/function/FunctionL1Tab.tsx`
- `src/app/pfmea/worksheet/tabs/function/FunctionL2Tab.tsx`
- `src/app/pfmea/worksheet/tabs/function/FunctionL3Tab.tsx`
- `src/app/pfmea/worksheet/tabs/failure/FailureL1Tab.tsx`
- `src/app/pfmea/worksheet/tabs/failure/FailureL2Tab.tsx`
- `src/app/pfmea/worksheet/tabs/failure/FailureL3Tab.tsx`

### 6. 모달 컴포넌트
- `src/app/pfmea/worksheet/ProcessSelectModal.tsx` ⚠️ 350px 고정
- `src/app/pfmea/worksheet/WorkElementModal.tsx`
- `src/components/modals/*.tsx`

### 7. FMEA 리스트 (codefreeze-20260110-full-system)
- `src/app/pfmea/list/page.tsx`

### 8. 개정관리 (codefreeze-20260110-revision-approval)
- `src/app/pfmea/revision/page.tsx`

---

## ✅ 수정 허용 조건

1. 사용자가 **명시적으로** "이 파일 수정해"라고 요청
2. **버그 수정**이 필요한 경우 (사용자 승인 후)
3. **새로운 기능 추가** 요청 시 (기존 UI 변경 없이)

---

## 🔄 수정 전 체크리스트

파일 수정 전 반드시 확인:

- [ ] 이 문서에서 해당 파일이 코드프리즈인지 확인
- [ ] 코드프리즈 파일이면 → **사용자 승인 요청**
- [ ] 승인 없으면 → **수정 금지**
- [ ] 승인 있으면 → 최소한의 변경만 수행

---

## 📅 마지막 업데이트: 2026-01-10

