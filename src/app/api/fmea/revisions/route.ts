/**
 * @file route.ts
 * @description FMEA 개정관리 API
 * - GET: 프로젝트별 개정 이력 조회
 * - POST: 개정 이력 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

// DB 연결
function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

// RevisionRecord 타입
interface RevisionRecord {
  id: string;
  projectId: string;
  revisionNumber: string;
  revisionHistory: string;
  createPosition: string;
  createName: string;
  createDate: string;
  createStatus: string;
  reviewPosition: string;
  reviewName: string;
  reviewDate: string;
  reviewStatus: string;
  approvePosition: string;
  approveName: string;
  approveDate: string;
  approveStatus: string;
}

// GET: 개정 이력 조회
export async function GET(request: NextRequest) {
  const pool = getPool();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 });
    }
    
    // 스키마 이름 생성
    const schemaName = `pfmea_${projectId.replace(/-/g, '_').toLowerCase()}`;
    
    // 테이블 존재 확인 및 생성
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."RevisionHistory" (
        id TEXT PRIMARY KEY,
        "projectId" TEXT NOT NULL,
        "revisionNumber" TEXT NOT NULL,
        "revisionHistory" TEXT,
        "createPosition" TEXT,
        "createName" TEXT,
        "createDate" TEXT,
        "createStatus" TEXT,
        "reviewPosition" TEXT,
        "reviewName" TEXT,
        "reviewDate" TEXT,
        "reviewStatus" TEXT,
        "approvePosition" TEXT,
        "approveName" TEXT,
        "approveDate" TEXT,
        "approveStatus" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 개정 이력 조회
    const result = await pool.query(`
      SELECT * FROM "${schemaName}"."RevisionHistory"
      WHERE "projectId" = $1
      ORDER BY "revisionNumber" ASC
    `, [projectId]);
    
    // 데이터가 없으면 기본 10개 생성
    if (result.rows.length === 0) {
      const defaultRevisions: RevisionRecord[] = Array.from({ length: 10 }, (_, index) => ({
        id: `REV-${projectId}-${index}`,
        projectId: projectId,
        revisionNumber: `Rev.${index.toString().padStart(2, '0')}`,
        revisionHistory: index === 0 ? '신규 프로젝트 등록' : '',
        createPosition: '',
        createName: '',
        createDate: index === 0 ? new Date().toISOString().split('T')[0] : '',
        createStatus: index === 0 ? '진행' : '',
        reviewPosition: '',
        reviewName: '',
        reviewDate: '',
        reviewStatus: '',
        approvePosition: '',
        approveName: '',
        approveDate: '',
        approveStatus: '',
      }));
      
      // 기본 데이터 저장
      for (const rev of defaultRevisions) {
        await pool.query(`
          INSERT INTO "${schemaName}"."RevisionHistory" 
          (id, "projectId", "revisionNumber", "revisionHistory", 
           "createPosition", "createName", "createDate", "createStatus",
           "reviewPosition", "reviewName", "reviewDate", "reviewStatus",
           "approvePosition", "approveName", "approveDate", "approveStatus")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO NOTHING
        `, [
          rev.id, rev.projectId, rev.revisionNumber, rev.revisionHistory,
          rev.createPosition, rev.createName, rev.createDate, rev.createStatus,
          rev.reviewPosition, rev.reviewName, rev.reviewDate, rev.reviewStatus,
          rev.approvePosition, rev.approveName, rev.approveDate, rev.approveStatus
        ]);
      }
      
      return NextResponse.json({ success: true, revisions: defaultRevisions });
    }
    
    return NextResponse.json({ success: true, revisions: result.rows });
    
  } catch (error: any) {
    console.error('❌ 개정 이력 조회 실패:', error.message);
    return NextResponse.json({ success: false, error: error.message, revisions: [] }, { status: 500 });
  } finally {
    await pool.end();
  }
}

// POST: 개정 이력 저장
export async function POST(request: NextRequest) {
  const pool = getPool();
  
  try {
    const body = await request.json();
    const { projectId, revisions } = body;
    
    if (!projectId || !revisions) {
      return NextResponse.json({ success: false, error: 'projectId and revisions are required' }, { status: 400 });
    }
    
    // 스키마 이름 생성
    const schemaName = `pfmea_${projectId.replace(/-/g, '_').toLowerCase()}`;
    
    // 테이블 존재 확인 및 생성
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."RevisionHistory" (
        id TEXT PRIMARY KEY,
        "projectId" TEXT NOT NULL,
        "revisionNumber" TEXT NOT NULL,
        "revisionHistory" TEXT,
        "createPosition" TEXT,
        "createName" TEXT,
        "createDate" TEXT,
        "createStatus" TEXT,
        "reviewPosition" TEXT,
        "reviewName" TEXT,
        "reviewDate" TEXT,
        "reviewStatus" TEXT,
        "approvePosition" TEXT,
        "approveName" TEXT,
        "approveDate" TEXT,
        "approveStatus" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 기존 데이터 삭제 후 새 데이터 저장 (원자성)
    await pool.query('BEGIN');
    
    try {
      // 기존 데이터 삭제
      await pool.query(`DELETE FROM "${schemaName}"."RevisionHistory" WHERE "projectId" = $1`, [projectId]);
      
      // 새 데이터 저장
      for (const rev of revisions as RevisionRecord[]) {
        await pool.query(`
          INSERT INTO "${schemaName}"."RevisionHistory" 
          (id, "projectId", "revisionNumber", "revisionHistory", 
           "createPosition", "createName", "createDate", "createStatus",
           "reviewPosition", "reviewName", "reviewDate", "reviewStatus",
           "approvePosition", "approveName", "approveDate", "approveStatus")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          rev.id, rev.projectId, rev.revisionNumber, rev.revisionHistory,
          rev.createPosition, rev.createName, rev.createDate, rev.createStatus,
          rev.reviewPosition, rev.reviewName, rev.reviewDate, rev.reviewStatus,
          rev.approvePosition, rev.approveName, rev.approveDate, rev.approveStatus
        ]);
      }
      
      await pool.query('COMMIT');
      
      console.log(`✅ 개정 이력 저장 완료: ${projectId} (${revisions.length}건)`);
      
      return NextResponse.json({ 
        success: true, 
        message: '개정 이력이 저장되었습니다.',
        savedCount: revisions.length
      });
      
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
    
  } catch (error: any) {
    console.error('❌ 개정 이력 저장 실패:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}

