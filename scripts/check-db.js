const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/fmea_db'
});

async function checkDB() {
  try {
    // 1. public 스키마 테이블 확인
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('=== PUBLIC 스키마 테이블 ===');
    tables.rows.forEach(r => console.log(' -', r.table_name));
    
    // 2. fmea_legacy_data 데이터 확인
    console.log('\n=== fmea_legacy_data 데이터 ===');
    try {
      const legacy = await pool.query(`SELECT * FROM public.fmea_legacy_data`);
      console.log('총 레코드:', legacy.rows.length);
      legacy.rows.forEach(r => {
        console.log('FMEA ID:', r.fmeaId);
        console.log('Data keys:', r.data ? Object.keys(r.data) : 'null');
        if (r.data?.fmeaInfo) {
          console.log('fmeaInfo:', JSON.stringify(r.data.fmeaInfo, null, 2));
        }
      });
    } catch (e) {
      console.log('테이블 없음:', e.message);
    }
    
    // 3. FMEA 스키마들의 FmeaInfo 확인
    console.log('\n=== FMEA 스키마 FmeaInfo ===');
    const schemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'pfmea_pfm%'
    `);
    
    for (const s of schemas.rows) {
      const schemaName = s.schema_name;
      try {
        const info = await pool.query(`SELECT * FROM "${schemaName}"."FmeaInfo" LIMIT 1`);
        console.log(`\n[${schemaName}]`);
        if (info.rows.length > 0) {
          const row = info.rows[0];
          console.log('  fmeaId:', row.fmeaId);
          console.log('  fmeaType:', row.fmeaType);
          console.log('  project:', JSON.stringify(row.project, null, 2));
          console.log('  fmeaInfo:', JSON.stringify(row.fmeaInfo, null, 2));
          console.log('  cftMembers:', row.cftMembers?.length || 0, '명');
        } else {
          console.log('  데이터 없음');
        }
      } catch (e) {
        console.log(`[${schemaName}] 오류:`, e.message);
      }
    }
    
  } catch (e) {
    console.error('DB 오류:', e.message);
  } finally {
    await pool.end();
  }
}

checkDB();








