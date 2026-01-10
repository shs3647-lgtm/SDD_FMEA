/**
 * Master FMEA 기초정보 DB 확인 스크립트
 */
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fmea_db' 
});

async function checkMasterData() {
  try {
    console.log('🔍 FMEA Master 기초정보 DB 확인...\n');

    // 1. Master 데이터셋 확인
    const datasets = await pool.query(`
      SELECT id, name, "isActive", "createdAt"
      FROM public.pfmea_master_datasets 
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);
    
    console.log('=== PFMEA Master 데이터셋 ===');
    if (datasets.rows.length === 0) {
      console.log('❌ 등록된 Master 데이터셋 없음');
    } else {
      datasets.rows.forEach((d, i) => {
        console.log(`${i+1}. ID: ${d.id}`);
        console.log(`   이름: ${d.name}`);
        console.log(`   활성: ${d.isActive ? '예' : '아니오'}`);
        console.log(`   등록일: ${d.createdAt}`);
        console.log('');
      });
    }

    // 2. Master Flat 아이템 통계
    const items = await pool.query(`
      SELECT "datasetId", "itemCode", COUNT(*) as cnt
      FROM public.pfmea_master_flat_items
      GROUP BY "datasetId", "itemCode"
      ORDER BY "datasetId", "itemCode"
    `);
    
    console.log('=== Master Flat 아이템 통계 ===');
    if (items.rows.length === 0) {
      console.log('❌ 등록된 아이템 없음');
    } else {
      let currentDataset = '';
      let totalCount = 0;
      items.rows.forEach(row => {
        if (row.datasetId !== currentDataset) {
          if (currentDataset) console.log(`   📊 총계: ${totalCount}건\n`);
          currentDataset = row.datasetId;
          totalCount = 0;
          console.log(`📁 데이터셋: ${row.datasetId}`);
        }
        console.log(`   ${row.itemCode}: ${row.cnt}건`);
        totalCount += parseInt(row.cnt);
      });
      if (totalCount > 0) console.log(`   📊 총계: ${totalCount}건`);
    }

    // 3. 전체 아이템 수
    const totalItems = await pool.query(`
      SELECT COUNT(*) as total FROM public.pfmea_master_flat_items
    `);
    console.log(`\n✅ 전체 Master 아이템: ${totalItems.rows[0].total}건`);

    // 4. 최근 저장된 아이템 샘플
    const samples = await pool.query(`
      SELECT "datasetId", "processNo", "itemCode", value, "createdAt"
      FROM public.pfmea_master_flat_items
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    console.log('\n=== 최근 저장된 아이템 (샘플 10건) ===');
    samples.rows.forEach((s, i) => {
      const val = s.value ? s.value.substring(0, 40) : '';
      console.log(`${i+1}. [${s.itemCode}] 공정${s.processNo}: ${val}`);
    });

    // 5. itemCode별 상세
    console.log('\n=== itemCode별 상세 ===');
    const itemDetails = await pool.query(`
      SELECT "itemCode", COUNT(*) as cnt, 
             MIN(value) as sample_min, MAX(value) as sample_max
      FROM public.pfmea_master_flat_items
      GROUP BY "itemCode"
      ORDER BY "itemCode"
    `);
    
    itemDetails.rows.forEach(row => {
      console.log(`${row.itemCode}: ${row.cnt}건`);
      console.log(`   예시: "${row.sample_min?.substring(0, 30) || ''}"`);
    });

  } catch (err) {
    console.error('❌ 오류:', err.message);
    
    // 테이블이 없는 경우 생성 시도
    if (err.message.includes('does not exist')) {
      console.log('\n⚠️ Master 테이블이 존재하지 않습니다.');
      console.log('   Import 기능에서 "Master로 저장" 옵션을 활성화하고 다시 Import해주세요.');
    }
  } finally {
    await pool.end();
  }
}

checkMasterData();

