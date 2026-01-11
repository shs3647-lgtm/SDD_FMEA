/**
 * 마스터 데이터 확인
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/fmea_db'
});

async function check() {
  try {
    // 모든 테이블 확인
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('=== 모든 테이블 ===');
    tables.rows.forEach(r => console.log('-', r.table_name));
    
    // 기초정보 관련 테이블 데이터 확인
    const masterInfo = await pool.query('SELECT COUNT(*) as cnt FROM public.master_info');
    console.log('\nmaster_info:', masterInfo.rows[0].cnt, '건');
    
    if (parseInt(masterInfo.rows[0].cnt) > 0) {
      const sample = await pool.query('SELECT * FROM public.master_info LIMIT 1');
      console.log('Sample:', JSON.stringify(sample.rows[0]).slice(0, 200));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
