# 📝 P-FMEA 폰트 표준 (최종 확정)

> **확정일**: 2025-12-30  
> **적용 범위**: 전체 워크시트 탭  
> **원칙**: 단순, 통일, 가독성

---

## ✅ 최종 표준

### 1. 페이지 헤더
```typescript
fontSize: 13px
fontWeight: 400  // 볼드 없음
height: auto
background: 단계별 색상
color: white
```

### 2. 1단 헤더 (메인 타이틀)
```typescript
// "1. 완제품 공정명", "2. 메인 공정명", "3. 작업 요소명"
fontSize: 12px
fontWeight: 600
height: 24px
background: 단계별 색상
color: white
```

### 3. 2단 헤더 (컬럼명)
```typescript
// "완제품명+라인", "공정NO+공정명", "작업요소"
fontSize: 12px
fontWeight: 600
height: 24px
background: 연한 색상
color: black
```

### 4. 데이터 셀 ⭐ (사용자 피드백 반영)
```typescript
fontSize: 12px  // 11px → 12px 증가 (가독성 향상)
fontWeight: 400  // 일반
height: 26px
```

### 5. 특수 항목
```typescript
// 플레이스홀더
fontSize: 11px
fontWeight: 600  // 강조

// 4M 열
fontSize: 11px
fontWeight: 600
width: 20px
```

---

## 📊 적용 전/후 비교

| 항목 | 현재 | 최종 표준 | 변경 |
|------|------|----------|------|
| 페이지 헤더 | 13px/900 | **13px/400** | 볼드 제거 ✅ |
| 1단 헤더 | 11px/900, 25px | **12px/600, 24px** | +1px, 볼드 감소 ✅ |
| 2단 헤더 | 10px/700, 22px | **12px/600, 24px** | +2px, 높이 통일 ✅ |
| 데이터 셀 | 10px/400 | **11px/400** | +1px ✅ |
| 4M 열 | 8px/700 | **11px/600** | +3px ✅ |

---

## 🎯 적용 대상 파일

### 구조분석
- ✅ `src/app/pfmea/worksheet/tabs/StructureTab.tsx`

### 기능분석
- ✅ `src/app/pfmea/worksheet/tabs/function/FunctionL1Tab.tsx`
- ✅ `src/app/pfmea/worksheet/tabs/function/FunctionL2Tab.tsx`
- ✅ `src/app/pfmea/worksheet/tabs/function/FunctionL3Tab.tsx`

### 고장분석
- ✅ `src/app/pfmea/worksheet/tabs/failure/FailureL1Tab.tsx`
- ✅ `src/app/pfmea/worksheet/tabs/failure/FailureL2Tab.tsx`
- ✅ `src/app/pfmea/worksheet/tabs/failure/FailureL3Tab.tsx`
- ✅ `src/app/pfmea/worksheet/tabs/failure/FailureLinkTab.tsx`

### 전체보기
- ✅ `src/app/pfmea/worksheet/tabs/all/AllTabRenderer.tsx`

---

## 🔧 변경 예시

### Before
```typescript
// 페이지 헤더
fontSize: '13px', fontWeight: 900

// 1단 헤더
fontSize: '11px', fontWeight: 900, height: '25px'

// 2단 헤더
fontSize: '10px', fontWeight: 700, height: '22px'

// 데이터
fontSize: '10px', fontWeight: 400

// 4M
fontSize: '8px', fontWeight: 700
```

### After
```typescript
// 페이지 헤더
fontSize: '13px', fontWeight: 400  // 볼드 제거

// 1단 헤더
fontSize: '12px', fontWeight: 600, height: '24px'

// 2단 헤더
fontSize: '12px', fontWeight: 600, height: '24px'

// 데이터
fontSize: '11px', fontWeight: 400

// 4M
fontSize: '11px', fontWeight: 600
```

---

## 📋 작업 순서

1. ✅ constants.ts에 폰트 표준 추가
2. ✅ StructureTab.tsx 적용
3. ✅ 기능분석 3개 탭 적용 (L1, L2, L3)
4. ✅ 고장분석 4개 탭 적용 (FE, FM, FC, Link)
5. ✅ 전체보기 탭 적용
6. ✅ 빌드 테스트 - 성공! ✨
7. ⏳ 색상 미세 조정 (다음 단계)

## ✅ 완료 일시

**2025-12-30** - 전체 폰트 표준화 완료  
**빌드 결과**: 성공 (0 errors)  
**적용 파일**: 10개  
**변경 라인**: 약 300+ 라인

---

**✨ 통일된 폰트로 깔끔한 화면을 만듭니다!**

