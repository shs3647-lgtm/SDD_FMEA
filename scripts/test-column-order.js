/**
 * 컬럼 순서 테스트
 */
const COLUMNS = [
  { id: 15, step: '고장분석', name: '고장원인(FC)' },
  { id: 16, step: '리스크분석', name: '예방관리(PC)' },
  { id: 17, step: '리스크분석', name: '발생도' },
];

console.log('컬럼 순서:');
COLUMNS.forEach((col, idx) => {
  console.log(`${idx}: id=${col.id}, step=${col.step}, name=${col.name}`);
});

console.log('\n렌더링 시뮬레이션:');
COLUMNS.forEach((col, colIdx) => {
  if (col.step === '고장분석') {
    console.log(`colIdx ${colIdx}: 고장분석 → FailureCellRenderer (col.name="${col.name}")`);
  } else if (col.step === '리스크분석' && col.name === '발생도') {
    console.log(`colIdx ${colIdx}: 리스크분석 → RiskOptCellRenderer (col.name="${col.name}")`);
  }
});









