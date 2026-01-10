/**
 * TDD 검증: 고장연결 탭 완전 검증
 * 
 * 검증 항목:
 * 1. 상태 관리 패턴 일관성
 * 2. 연결확정 로직
 * 3. 자동 FM 이동
 * 4. UI 버튼 상태
 * 5. savedLinks 동기화
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('========================================');
console.log('🧪 TDD 검증: 고장연결 탭 완전 검증');
console.log('========================================\n');

const filePath = path.join(__dirname, '../src/app/pfmea/worksheet/tabs/failure/FailureLinkTab.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

let passed = 0;
let failed = 0;
let warnings = 0;

function test(name: string, condition: boolean, failMsg?: string) {
  if (condition) {
    console.log(`   ✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`   ❌ FAIL: ${name}`);
    if (failMsg) console.log(`      → ${failMsg}`);
    failed++;
  }
}

function warn(name: string, condition: boolean, warnMsg?: string) {
  if (condition) {
    console.log(`   ✅ OK: ${name}`);
  } else {
    console.log(`   ⚠️ WARN: ${name}`);
    if (warnMsg) console.log(`      → ${warnMsg}`);
    warnings++;
  }
}

// ========== 1. 상태 관리 패턴 ==========
console.log('📋 1. 상태 관리 패턴');

test('justConfirmedRef 정의됨', 
  content.includes('justConfirmedRef = useRef'));

test('confirmLink에서 justConfirmedRef 설정', 
  content.includes('justConfirmedRef.current = true'));

test('useEffect에서 justConfirmedRef 체크', 
  content.includes('if (justConfirmedRef.current)'));

test('자동 이동에서 justConfirmedRef 리셋', 
  content.includes('justConfirmedRef.current = false; // ✅ 다음 FM 로딩을 위해 리셋'));

// ========== 2. setStateSynced 패턴 ==========
console.log('\n📋 2. setStateSynced 패턴 일관성');

test('confirmLink에서 setStateSynced 사용', 
  content.includes('if (setStateSynced)') && content.includes('setStateSynced(updateFn)'));

test('unlinkCurrentFM에서 setStateSynced 사용',
  /unlinkCurrentFM[\s\S]*?setStateSynced\(updateFn\)/.test(content));

test('handleConfirmAll에서 setStateSynced 사용',
  /handleConfirmAll[\s\S]*?setStateSynced\(updateFn\)/.test(content));

test('handleEditMode에서 setStateSynced 사용',
  /handleEditMode[\s\S]*?setStateSynced\(updateFn\)/.test(content));

test('handleClearAll에서 setStateSynced 사용',
  /handleClearAll[\s\S]*?setStateSynced\(updateFn\)/.test(content));

// ========== 3. 연결확정 로직 ==========
console.log('\n📋 3. 연결확정 로직');

test('이미 연결된 FM은 토글 방지',
  content.includes('isCurrentFMLinked') && 
  content.includes('이미 연결이 확정되었습니다'));

test('unlinkCurrentFM 함수 존재',
  content.includes('const unlinkCurrentFM = useCallback'));

test('연결해제 시 확인 팝업',
  /unlinkCurrentFM[\s\S]*?confirm\(/.test(content));

test('FE/FC 둘 다 필요 검증',
  content.includes('feArray.length === 0 || fcArray.length === 0'));

// ========== 4. 자동 FM 이동 ==========
console.log('\n📋 4. 자동 FM 이동');

test('같은 공정 내 다음 FM 이동',
  content.includes('nextFMInProc') && content.includes('setCurrentFMId(nextFMInProc.id)'));

test('다음 공정 이동',
  content.includes('nextProcess') && content.includes('setSelectedProcess(nextProcess)'));

test('모든 공정 완료 시 결과 화면',
  content.includes("setViewMode('result')") && content.includes('모든 공정의 고장연결이 완료'));

// 수동 초기화 없음 확인 (중요!)
const autoMoveSection = content.match(/자동 FM 이동[\s\S]*?현재 공정의 마지막 FM/);
if (autoMoveSection) {
  test('자동 이동에서 수동 Map 초기화 없음',
    !autoMoveSection[0].includes('setLinkedFEs(new Map())'),
    'setLinkedFEs(new Map())이 자동 이동 섹션에 있으면 안됨');
} else {
  console.log('   ⚠️ SKIP: 자동 이동 섹션을 찾을 수 없음');
}

// ========== 5. UI 버튼 상태 ==========
console.log('\n📋 5. UI 버튼 상태');

test('연결확정 버튼 존재',
  content.includes('🔗 연결확정'));

test('확정됨 상태 표시',
  content.includes('✅ 확정됨'));

test('연결해제 버튼 존재',
  content.includes('🔓 연결해제'));

test('고장연결 완료 상태',
  content.includes('🎉 고장연결 완료'));

test('전체확정 버튼',
  content.includes('🎉 전체확정') || content.includes('✅ 전체확정'));

// ========== 6. savedLinks 동기화 ==========
console.log('\n📋 6. savedLinks 동기화');

test('savedLinks 상태 정의',
  content.includes('const [savedLinks, setSavedLinks] = useState'));

test('state.failureLinks와 동기화',
  content.includes("failureLinks: newLinks") || content.includes("failureLinks: savedLinks"));

test('초기 로드 로직',
  content.includes('stateFailureLinksJson') && content.includes('setSavedLinks(stateLinks)'));

// ========== 7. drawLines 호출 ==========
console.log('\n📋 7. drawLines 호출');

test('confirmLink에서 drawLines 호출',
  content.includes('setTimeout(drawLines'));

test('selectFM에서 drawLines 호출',
  /selectFM[\s\S]*?drawLines/.test(content));

// ========== 8. 잠재적 문제 검사 ==========
console.log('\n📋 8. 잠재적 문제 검사');

// 직접 setState 사용 검사 (setStateSynced 대신)
const directSetStateCount = (content.match(/setState\(\(prev/g) || []).length;
const setStateSyncedCount = (content.match(/setStateSynced\(updateFn\)/g) || []).length;
warn('setStateSynced 사용 비율 적절',
  setStateSyncedCount >= directSetStateCount / 2,
  `setState 직접 사용: ${directSetStateCount}회, setStateSynced 사용: ${setStateSyncedCount}회`);

// 무한 루프 가능성 검사
const useEffectCount = (content.match(/useEffect\(/g) || []).length;
warn('useEffect 개수 적절',
  useEffectCount <= 15,
  `useEffect ${useEffectCount}개 발견 (너무 많으면 복잡도 증가)`);

// requestAnimationFrame 사용 검사
const rafCount = (content.match(/requestAnimationFrame/g) || []).length;
warn('requestAnimationFrame 사용 적절',
  rafCount <= 5,
  `requestAnimationFrame ${rafCount}회 사용`);

// ========== 결과 요약 ==========
console.log('\n========================================');
console.log('📊 TDD 검증 결과');
console.log('========================================');
console.log(`✅ 통과: ${passed}개`);
console.log(`❌ 실패: ${failed}개`);
console.log(`⚠️ 경고: ${warnings}개`);
console.log(`📈 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 모든 테스트 통과!');
  if (warnings > 0) {
    console.log(`⚠️ ${warnings}개 경고 사항 확인 권장`);
  }
} else {
  console.log('\n⚠️ 일부 테스트 실패. 위의 실패 항목을 확인하세요.');
  process.exit(1);
}

console.log('\n========================================');
console.log('📝 수동 테스트 체크리스트');
console.log('========================================');
console.log('1. [ ] M1 연결 (FE+FC 선택) → 연결확정');
console.log('2. [ ] 자동으로 M2로 이동 확인');
console.log('3. [ ] ▲이전 FM 클릭 → M1 연결 유지 확인 ⭐');
console.log('4. [ ] M2 연결 → 연결확정 → M3로 이동');
console.log('5. [ ] 모든 FM 연결 → 🎉 전체확정 버튼 강조');
console.log('6. [ ] 전체확정 → 🎉 고장연결 완료 버튼 표시');
console.log('7. [ ] 연결해제 버튼 → 확인 팝업 → 해제');
console.log('8. [ ] 새로고침 → 연결 상태 유지');

