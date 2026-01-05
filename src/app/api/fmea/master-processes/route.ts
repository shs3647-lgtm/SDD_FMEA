/**
 * 마스터 FMEA 공정 목록 API
 * - GET: pfm26-M001의 L2 공정 목록 반환
 */
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export async function GET() {
  const pool = getPool();
  
  try {
    // 마스터 FMEA 스키마에서 L2 공정 조회
    const schemaName = 'pfmea_pfm26_m001';
    
    const result = await pool.query(`
      SELECT id, no, name 
      FROM "${schemaName}".l2_structures 
      ORDER BY "order", no
    `);
    
    const processes = result.rows.map(row => ({
      id: row.id,
      no: row.no || '',
      name: row.name || ''
    }));
    
    console.log(`✅ 마스터 공정 ${processes.length}개 반환`);
    
    return NextResponse.json({ 
      success: true, 
      processes,
      source: 'master-fmea',
      fmeaId: 'pfm26-M001'
    });
    
  } catch (error: any) {
    console.error('마스터 공정 조회 오류:', error.message);
    return NextResponse.json({ 
      success: false, 
      processes: [],
      error: error.message 
    });
  } finally {
    await pool.end();
  }
}

