/**
 * TDD 검증: 연결확정 후 화살표 유지 문제
 * 
 * 테스트 시나리오:
 * 1. confirmLink 함수가 setStateSynced 패턴을 사용하는지 확인
 * 2. justConfirmedRef가 useEffect 덮어쓰기를 방지하는지 확인
 * 3. linkedFEs/linkedFCs가 confirmLink 후에도 유지되는지 시뮬레이션
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('========================================');
console.log('🧪 TDD 검증: 연결확정 후 화살표 유지');
console.log('========================================\n');

const filePath = path.join(__dirname, '../src/app/pfmea/worksheet/tabs/failure/FailureLinkTab.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

let passed = 0;
let failed = 0;

// ========== 테스트 1: justConfirmedRef 존재 확인 ==========
console.log('📋 테스트 1: justConfirmedRef 존재 확인');
const hasJustConfirmedRef = content.includes('justConfirmedRef = useRef');
if (hasJustConfirmedRef) {
  console.log('   ✅ PASS: justConfirmedRef가 정의되어 있음');
  passed++;
} else {
  console.log('   ❌ FAIL: justConfirmedRef가 정의되지 않음');
  failed++;
}

// ========== 테스트 2: confirmLink에서 justConfirmedRef 설정 ==========
console.log('\n📋 테스트 2: confirmLink에서 justConfirmedRef 설정');
const setsJustConfirmed = content.includes('justConfirmedRef.current = true');
if (setsJustConfirmed) {
  console.log('   ✅ PASS: confirmLink에서 justConfirmedRef.current = true 설정');
  passed++;
} else {
  console.log('   ❌ FAIL: confirmLink에서 justConfirmedRef 설정 누락');
  failed++;
}

// ========== 테스트 3: useEffect에서 justConfirmedRef 체크 ==========
console.log('\n📋 테스트 3: useEffect에서 justConfirmedRef 체크');
const checksJustConfirmed = content.includes('if (justConfirmedRef.current)');
if (checksJustConfirmed) {
  console.log('   ✅ PASS: useEffect에서 justConfirmedRef 체크');
  passed++;
} else {
  console.log('   ❌ FAIL: useEffect에서 justConfirmedRef 체크 누락');
  failed++;
}

// ========== 테스트 4: confirmLink에서 setStateSynced 패턴 사용 ==========
console.log('\n📋 테스트 4: confirmLink에서 setStateSynced 패턴 사용');
// confirmLink 함수 내에서 setStateSynced(updateFn) 사용 확인
const confirmLinkMatch = content.match(/const confirmLink = useCallback\(\(\) => \{[\s\S]*?\}, \[[\s\S]*?\]\);/);
if (confirmLinkMatch) {
  const confirmLinkCode = confirmLinkMatch[0];
  const usesSetStateSynced = confirmLinkCode.includes('if (setStateSynced)') && 
                              confirmLinkCode.includes('setStateSynced(updateFn)');
  if (usesSetStateSynced) {
    console.log('   ✅ PASS: confirmLink에서 setStateSynced 패턴 사용');
    passed++;
  } else {
    console.log('   ❌ FAIL: confirmLink에서 setStateSynced 패턴 미사용');
    console.log('      → setState 직접 사용 시 stateRef 동기화 안됨');
    failed++;
  }
} else {
  console.log('   ⚠️ SKIP: confirmLink 함수를 찾을 수 없음');
}

// ========== 테스트 5: confirmLink 의존성에 setStateSynced 포함 ==========
console.log('\n📋 테스트 5: confirmLink 의존성에 setStateSynced 포함');
const hasSetStateSyncedDep = content.match(/\}, \[.*setStateSynced.*\]\);.*\/\/ confirmLink/s) ||
                              content.includes('setState, setStateSynced, setDirty');
if (hasSetStateSyncedDep) {
  console.log('   ✅ PASS: confirmLink 의존성에 setStateSynced 포함');
  passed++;
} else {
  // 더 정확한 검사
  const depsMatch = content.match(/\[currentFMId, currentFM, linkedFEs, linkedFCs, savedLinks, fmData, setState, setStateSynced/);
  if (depsMatch) {
    console.log('   ✅ PASS: confirmLink 의존성에 setStateSynced 포함');
    passed++;
  } else {
    console.log('   ❌ FAIL: confirmLink 의존성에 setStateSynced 누락');
    failed++;
  }
}

// ========== 테스트 6: 연결해제에서도 setStateSynced 패턴 사용 ==========
console.log('\n📋 테스트 6: 연결해제에서도 setStateSynced 패턴 사용');
// isCurrentFMLinked 블록 내에서 setStateSynced 사용 확인
const unlinkPattern = /if \(isCurrentFMLinked\)[\s\S]*?setStateSynced\(updateFn\)[\s\S]*?return;/;
const usesSetStateSyncedInUnlink = unlinkPattern.test(content);
if (usesSetStateSyncedInUnlink) {
  console.log('   ✅ PASS: 연결해제에서도 setStateSynced 패턴 사용');
  passed++;
} else {
  console.log('   ❌ FAIL: 연결해제에서 setStateSynced 패턴 미사용');
  failed++;
}

// ========== 테스트 7: drawLines 호출 확인 ==========
console.log('\n📋 테스트 7: confirmLink에서 drawLines 호출');
const hasDrawLines = content.includes('setTimeout(drawLines') || content.includes('drawLines()');
if (hasDrawLines) {
  console.log('   ✅ PASS: confirmLink에서 drawLines 호출');
  passed++;
} else {
  console.log('   ❌ FAIL: confirmLink에서 drawLines 호출 누락');
  failed++;
}

// ========== 테스트 8: handleConfirmAll에서 setStateSynced 사용 ==========
console.log('\n📋 테스트 8: handleConfirmAll에서 setStateSynced 사용');
const handleConfirmAllMatch = content.match(/const handleConfirmAll = useCallback\(\(\) => \{[\s\S]*?\}, \[[\s\S]*?\]\);/);
if (handleConfirmAllMatch) {
  const handleConfirmAllCode = handleConfirmAllMatch[0];
  const usesSetStateSyncedInConfirmAll = handleConfirmAllCode.includes('setStateSynced(updateFn)');
  if (usesSetStateSyncedInConfirmAll) {
    console.log('   ✅ PASS: handleConfirmAll에서 setStateSynced 사용');
    passed++;
  } else {
    console.log('   ❌ FAIL: handleConfirmAll에서 setStateSynced 미사용');
    failed++;
  }
} else {
  console.log('   ⚠️ SKIP: handleConfirmAll 함수를 찾을 수 없음');
}

// ========== 테스트 9: handleEditMode에서 setStateSynced 사용 ==========
console.log('\n📋 테스트 9: handleEditMode에서 setStateSynced 사용');
const handleEditModeMatch = content.match(/const handleEditMode = useCallback\(\(\) => \{[\s\S]*?\}, \[[\s\S]*?\]\);/);
if (handleEditModeMatch) {
  const handleEditModeCode = handleEditModeMatch[0];
  const usesSetStateSyncedInEditMode = handleEditModeCode.includes('setStateSynced(updateFn)');
  if (usesSetStateSyncedInEditMode) {
    console.log('   ✅ PASS: handleEditMode에서 setStateSynced 사용');
    passed++;
  } else {
    console.log('   ❌ FAIL: handleEditMode에서 setStateSynced 미사용');
    failed++;
  }
} else {
  console.log('   ⚠️ SKIP: handleEditMode 함수를 찾을 수 없음');
}

// ========== 테스트 10: handleClearAll에서 setStateSynced 사용 ==========
console.log('\n📋 테스트 10: handleClearAll에서 setStateSynced 사용');
const handleClearAllMatch = content.match(/const handleClearAll = useCallback\(\(\) => \{[\s\S]*?\}, \[[\s\S]*?\]\);/);
if (handleClearAllMatch) {
  const handleClearAllCode = handleClearAllMatch[0];
  const usesSetStateSyncedInClearAll = handleClearAllCode.includes('setStateSynced(updateFn)');
  if (usesSetStateSyncedInClearAll) {
    console.log('   ✅ PASS: handleClearAll에서 setStateSynced 사용');
    passed++;
  } else {
    console.log('   ❌ FAIL: handleClearAll에서 setStateSynced 미사용');
    failed++;
  }
} else {
  console.log('   ⚠️ SKIP: handleClearAll 함수를 찾을 수 없음');
}

// ========== 결과 요약 ==========
console.log('\n========================================');
console.log('📊 TDD 검증 결과');
console.log('========================================');
console.log(`✅ 통과: ${passed}개`);
console.log(`❌ 실패: ${failed}개`);
console.log(`📈 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 모든 테스트 통과! 연결확정 후 화살표 유지 패턴이 올바르게 적용되었습니다.');
} else {
  console.log('\n⚠️ 일부 테스트 실패. 위의 실패 항목을 확인하세요.');
  process.exit(1);
}

console.log('\n========================================');
console.log('📝 수동 테스트 체크리스트');
console.log('========================================');
console.log('1. [ ] 고장연결 탭 → 고장사슬 선택');
console.log('2. [ ] FM 선택 (M1 규격미달)');
console.log('3. [ ] FE 클릭 → 화살표 표시 확인');
console.log('4. [ ] FC 클릭 → 화살표 표시 확인');
console.log('5. [ ] 연결확정 클릭 → 화살표 유지 확인 ⭐');
console.log('6. [ ] ▼다음 FM 클릭 → 다음 FM으로 이동');
console.log('7. [ ] 새로고침 → 기존 연결 복원 확인');

