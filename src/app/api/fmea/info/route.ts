/**
 * @file route.ts
 * @description FMEA 등록정보 조회 API
 * - GET: FMEA ID로 등록정보 조회 (작성자, 검토자, 승인자 정보 포함)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

// DB 연결
function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

// GET: FMEA 등록정보 조회
export async function GET(request: NextRequest) {
  const pool = getPool();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const fmeaId = searchParams.get('fmeaId');
    
    if (!fmeaId) {
      return NextResponse.json({ success: false, error: 'fmeaId is required' }, { status: 400 });
    }
    
    // 스키마 이름 생성
    const schemaName = `pfmea_${fmeaId.replace(/-/g, '_').toLowerCase()}`;
    
    // FmeaInfo 테이블 조회
    const result = await pool.query(`
      SELECT 
        "fmeaId",
        "subject",
        "customer",
        "modelYear",
        "designResponsibility",
        "confidentialLevel",
        "crossFunctionalTeam",
        "fmeaStartDate",
        "fmeaRevisionDate",
        "fmeaResponsibleName",
        "fmeaResponsiblePosition",
        "reviewResponsibleName",
        "reviewResponsiblePosition",
        "approvalResponsibleName",
        "approvalResponsiblePosition",
        "revisionNo"
      FROM "${schemaName}"."FmeaInfo"
      WHERE "fmeaId" = $1
      LIMIT 1
    `, [fmeaId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'FMEA info not found',
        fmeaInfo: null 
      });
    }
    
    console.log(`✅ [FMEA Info] ${fmeaId} 등록정보 조회 성공`);
    
    return NextResponse.json({ 
      success: true, 
      fmeaInfo: result.rows[0] 
    });
    
  } catch (error: any) {
    console.error('❌ FMEA 등록정보 조회 실패:', error.message);
    
    // 테이블이 없으면 빈 결과 반환
    if (error.message.includes('does not exist')) {
      return NextResponse.json({ 
        success: false, 
        error: 'FMEA schema not found',
        fmeaInfo: null 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      fmeaInfo: null 
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}


