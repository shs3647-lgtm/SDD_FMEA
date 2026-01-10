# 🔒 코드프리즈 파일 목록 (룰 1번)

> ⚠️ **2026-01-10 기준 전체 UI 코드프리즈**
> 
> 이 목록의 파일들은 **절대 수정 금지**입니다.
> 사용자의 명시적 승인 없이 수정 시 즉시 작업 중단합니다.

---

## 📌 룰 1번 핵심 원칙

### ⚠️ UI 수정 시 필수 프로세스 (2단계 승인)

**1단계: 수정 여부 확인**
> "이 파일은 코드프리즈입니다. 수정하시겠습니까?"

**2단계: 수정 범위 확인** (1단계 승인 후)
> "어디까지 수정할까요?"
> - 이 함수만
> - 이 컴포넌트만
> - 전체 파일
> - 기타 (구체적으로 지정)

**3단계: 범위 내에서만 수정**
> 승인된 범위 외 수정 절대 금지

### 핵심 규칙
1. **UI는 반드시 사용자 허락 후에만 변경**
2. **수정 전 반드시 범위 확인**
3. **승인된 범위만 수정**
4. **위반 시 즉시 `git checkout`으로 복원**
5. **인라인 스타일(style={{}}) 사용 금지** - Tailwind 클래스만 사용
   - ❌ `style={{ width: '500px' }}`
   - ✅ `className="w-[500px]"`
   - 예외: 동적 계산값(줄무늬 색상 등)만 허용

---

## 🚫 절대 수정 금지 파일 (전체 목록)

### 1. PFMEA 화면
| 파일 | 코드프리즈 태그 |
|------|----------------|
| `src/app/pfmea/register/page.tsx` | codefreeze-20260110-register-final |
| `src/app/pfmea/list/page.tsx` | codefreeze-20260110-full-system |
| `src/app/pfmea/worksheet/page.tsx` | codefreeze-20260110-all-ui-freeze<br/>codefreeze-20260111-worksheet-110percent (110% 배율) |
| `src/app/pfmea/import/page.tsx` | codefreeze-20260110-pfmea-import |
| `src/app/pfmea/revision/page.tsx` | codefreeze-20260110-revision-approval |

### 2. 워크시트 탭 (2ST~6ST 전체)
| 파일 | 코드프리즈 태그 |
|------|----------------|
| `src/app/pfmea/worksheet/tabs/StructureTab.tsx` | codefreeze-20260110-structure-final ⚠️ **UI 절대 변경 금지** |
| `src/app/pfmea/worksheet/tabs/function/FunctionL1Tab.tsx` | codefreeze-20260104-worksheet-complete |
| `src/app/pfmea/worksheet/tabs/function/FunctionL2Tab.tsx` | codefreeze-20260104-worksheet-complete |
| `src/app/pfmea/worksheet/tabs/function/FunctionL3Tab.tsx` | codefreeze-20260104-worksheet-complete |
| `src/app/pfmea/worksheet/tabs/failure/FailureL1Tab.tsx` | codefreeze-20260104-worksheet-complete |
| `src/app/pfmea/worksheet/tabs/failure/FailureL2Tab.tsx` | codefreeze-20260104-worksheet-complete |
| `src/app/pfmea/worksheet/tabs/failure/FailureL3Tab.tsx` | codefreeze-20260104-worksheet-complete |
| `src/app/pfmea/worksheet/tabs/failure/FailureLinkTab.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/failure/FailureLinkTables.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/failure/FailureLinkDiagram.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/RiskTab.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/RiskTabConfirmable.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/OptTab.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/OptTabConfirmable.tsx` | codefreeze-20260110-failure-link-all |

### 2-1. ALL 화면 (전체보기)
| 파일 | 코드프리즈 태그 |
|------|----------------|
| `src/app/pfmea/worksheet/tabs/all/AllTabAtomic.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/all/AllTabWithLinks.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/all/AllTabRenderer.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/all/AllTabBasic.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/tabs/AllViewTab.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/components/AllViewRightPanel.tsx` | codefreeze-20260110-failure-link-all |
| `src/app/pfmea/worksheet/components/AllTabRightPanel.tsx` | codefreeze-20260110-failure-link-all |

### 3. 모달 (350px 고정, pt-200px 위치)
| 파일 | 크기/위치 | 코드프리즈 태그 |
|------|----------|----------------|
| `src/app/pfmea/worksheet/ProcessSelectModal.tsx` | **350px, pt-[200px]** | codefreeze-20260110-modal-treeview-350px |
| `src/app/pfmea/worksheet/WorkElementSelectModal.tsx` | **350px, pt-[200px]** | codefreeze-20260110-modal-treeview-350px |
| `src/components/modals/BaseSelectModal.tsx` | **350px** | codefreeze-20260110-modal-treeview-350px |
| `src/components/modals/StandardSelectModal.tsx` | **350px** | codefreeze-20260110-modal-treeview-350px |

### 4. 사이드바 & 레이아웃
| 파일 | 코드프리즈 태그 |
|------|----------------|
| `src/components/layout/Sidebar.tsx` | codefreeze-20260110-sidebar |
| `src/styles/layout.ts` | codefreeze-20260110-350px-unified |

### 4-1. 트리뷰 & 우측 패널 (350px 고정)
| 파일 | 크기 | 코드프리즈 태그 |
|------|------|----------------|
| `src/app/pfmea/worksheet/page.tsx` (트리뷰 영역) | **350px** | codefreeze-20260110-modal-treeview-350px |
| `src/app/pfmea/worksheet/panels/APTable/APTable5.tsx` | **350px** (RIGHT_PANEL_WIDTH) | codefreeze-20260110-modal-treeview-350px |
| `src/app/pfmea/worksheet/panels/APTable/APTable6.tsx` | **350px** (RIGHT_PANEL_WIDTH) | codefreeze-20260110-modal-treeview-350px |

### 5. 기초정보
| 파일 | 코드프리즈 태그 |
|------|----------------|
| `src/app/master/user/page.tsx` | codefreeze-20260110-master-info |
| `src/app/master/customer/page.tsx` | codefreeze-20260110-master-info |

### 6. 웰컴보드
| 파일 | 코드프리즈 태그 |
|------|----------------|
| `src/app/welcomeboard/page.tsx` | codefreeze-20260110-all-ui-freeze |

### 7. Import 관련
| 파일 | 코드프리즈 태그 |
|------|----------------|
| `src/app/pfmea/import/excel-parser.ts` | codefreeze-20260110-excel-sheet |
| `src/app/pfmea/import/excel-template.ts` | codefreeze-20260110-excel-sheet |
| `src/app/pfmea/import/constants.ts` | codefreeze-20260110-excel-sheet |

---

## ✅ 수정 허용 조건

1. 사용자가 **명시적으로** "이 파일 수정해"라고 요청
2. **버그 수정**이 필요한 경우 (사용자 승인 후)
3. **API 파일**은 기능 개선 가능 (UI 변경 없이)

---

## 🔄 수정 전 체크리스트 (필수 - 2단계 승인)

파일 수정 전 반드시 확인:

- [ ] 이 문서에서 해당 파일이 코드프리즈인지 확인
- [ ] **1단계**: "이 파일은 코드프리즈입니다. 수정하시겠습니까?" 질문
- [ ] 승인 없으면 → **수정 금지**
- [ ] **2단계**: "어디까지 수정할까요? (함수/컴포넌트/파일)" 범위 질문
- [ ] 범위 승인 후 → **승인된 범위만 수정**
- [ ] 범위 외 수정 → **절대 금지**

---

## 🏷️ 마스터 코드프리즈 태그

```
codefreeze-20260110-all-ui-freeze  (전체 UI 코드프리즈)
codefreeze-20260111-worksheet-110percent  (워크시트 110% 배율 확정)
```

---

## ✅ 최근 코드프리즈 내역 (2026-01-11)

### 1. 워크시트 기본 배율 110% 확정
- `src/app/pfmea/worksheet/page.tsx` - 워크시트 영역 zoom: 1.1 고정
- 구조분석 화면과 동일한 배율 유지

### 2. 작업요소 돋보기 표시 로직 표준화
- `src/app/pfmea/worksheet/tabs/StructureTab.tsx` - SelectableCell과 동일하게 value 있을 때 돋보기 숨김
- 메인공정기능과 일관성 유지

---

## 📅 마지막 업데이트: 2026-01-11
