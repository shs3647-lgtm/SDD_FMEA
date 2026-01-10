/**
 * FMEA 프로젝트 목록 API
 * - GET: DB에서 FMEA 프로젝트 목록 조회
 * - POST: 새 FMEA 프로젝트 생성
 */
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

// DB 연결
function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

// GET: FMEA 프로젝트 목록 조회 (id 파라미터로 특정 프로젝트 조회 가능)
export async function GET(request: NextRequest) {
  const pool = getPool();
  const searchParams = request.nextUrl.searchParams;
  const targetId = searchParams.get('id'); // 특정 ID로 조회
  
  try {
    // 1. 모든 FMEA 스키마 조회 (또는 특정 ID의 스키마만)
    let schemasQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'pfmea_pfm%' 
      ORDER BY schema_name
    `;
    
    if (targetId) {
      const targetSchema = `pfmea_${targetId.replace(/-/g, '_').toLowerCase()}`;
      schemasQuery = `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = '${targetSchema}'
      `;
    }
    
    const schemasResult = await pool.query(schemasQuery);
    
    const projects: any[] = [];
    
    for (const row of schemasResult.rows) {
      const schemaName = row.schema_name;
      // pfmea_pfm26_m001 → pfm26-M001
      const fmeaId = schemaName
        .replace('pfmea_', '')
        .replace(/_/g, '-')
        .replace(/pfm(\d+)-([mfp])(\d+)/i, (_match: string, year: string, type: string, num: string) => 
          `pfm${year}-${type.toUpperCase()}${num}`
        );
      
      try {
        // FmeaInfo 테이블에서 정보 조회
        const infoResult = await pool.query(`
          SELECT * FROM "${schemaName}"."FmeaInfo" LIMIT 1
        `);
        
        if (infoResult.rows.length > 0) {
          const info = infoResult.rows[0];
          projects.push({
            id: fmeaId,
            project: info.project || {},
            fmeaInfo: info.fmeaInfo || {},
            fmeaType: info.fmeaType || 'P',
            parentFmeaId: info.parentFmeaId || null,  // ✅ 상위 FMEA ID
            parentFmeaType: info.parentFmeaType || null,  // ✅ 상위 FMEA 유형
            cftMembers: info.cftMembers || [],  // ✅ CFT 멤버
            structureConfirmed: info.structureConfirmed || false,
            createdAt: info.createdAt,
            updatedAt: info.updatedAt,
            status: 'active',
            step: calculateStep(info),
            revisionNo: 'Rev.01'
          });
        } else {
          // FmeaInfo 없으면 스키마만으로 기본 정보 생성
          const type = extractType(fmeaId);
          projects.push({
            id: fmeaId,
            project: { projectName: fmeaId },
            fmeaInfo: { subject: fmeaId },
            fmeaType: type,
            parentFmeaId: type === 'M' ? fmeaId : null,  // ✅ Master는 본인 ID
            parentFmeaType: type === 'M' ? 'M' : null,
            createdAt: new Date().toISOString(),
            status: 'active',
            step: 1,
            revisionNo: 'Rev.01'
          });
        }
      } catch (e) {
        // 테이블이 없으면 스키마만으로 기본 정보 생성
        const type = extractType(fmeaId);
        projects.push({
          id: fmeaId,
          project: { projectName: fmeaId },
          fmeaInfo: { subject: fmeaId },
          fmeaType: type,
          parentFmeaId: type === 'M' ? fmeaId : null,  // ✅ Master는 본인 ID
          parentFmeaType: type === 'M' ? 'M' : null,
          createdAt: new Date().toISOString(),
          status: 'active',
          step: 1,
          revisionNo: 'Rev.01'
        });
      }
    }
    
    // 유형별 정렬 (M → F → P)
    const typeOrder: Record<string, number> = { 'M': 1, 'F': 2, 'P': 3 };
    projects.sort((a, b) => {
      const orderA = typeOrder[a.fmeaType] || 3;
      const orderB = typeOrder[b.fmeaType] || 3;
      if (orderA !== orderB) return orderA - orderB;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    
    return NextResponse.json({ success: true, projects });
    
  } catch (error: any) {
    console.error('❌ FMEA 목록 조회 실패:', error.message);
    return NextResponse.json({ success: false, error: error.message, projects: [] }, { status: 500 });
  } finally {
    await pool.end();
  }
}

// POST: 새 FMEA 프로젝트 생성
export async function POST(req: NextRequest) {
  const pool = getPool();
  
  try {
    const body = await req.json();
    const { fmeaId, fmeaType, project, fmeaInfo, cftMembers } = body;
    
    if (!fmeaId) {
      return NextResponse.json({ success: false, error: 'fmeaId is required' }, { status: 400 });
    }
    
    // 스키마 이름 생성: pfm26-M001 → pfmea_pfm26_m001
    const schemaName = `pfmea_${fmeaId.replace(/-/g, '_').toLowerCase()}`;
    
    // 1. 스키마 생성
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // 2. FmeaInfo 테이블 생성 (cftMembers, parentFmeaId 필드 포함)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."FmeaInfo" (
        id TEXT PRIMARY KEY,
        "fmeaId" TEXT NOT NULL,
        "fmeaType" TEXT,
        "parentFmeaId" TEXT,
        "parentFmeaType" TEXT,
        "inheritedAt" TIMESTAMP,
        project JSONB,
        "fmeaInfo" JSONB,
        "cftMembers" JSONB,
        "structureConfirmed" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 2-1. 기존 테이블에 컬럼 추가 (호환성)
    await pool.query(`
      ALTER TABLE "${schemaName}"."FmeaInfo" 
      ADD COLUMN IF NOT EXISTS "cftMembers" JSONB,
      ADD COLUMN IF NOT EXISTS "parentFmeaId" TEXT,
      ADD COLUMN IF NOT EXISTS "parentFmeaType" TEXT,
      ADD COLUMN IF NOT EXISTS "inheritedAt" TIMESTAMP
    `);
    
    // 3. 기본 테이블들 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."L1Structure" (
        id TEXT PRIMARY KEY,
        "fmeaId" TEXT NOT NULL,
        "processNo" TEXT,
        "processName" TEXT,
        "fourM" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."L2Structure" (
        id TEXT PRIMARY KEY,
        "fmeaId" TEXT NOT NULL,
        "l1Id" TEXT,
        "processNo" TEXT,
        "processName" TEXT,
        "processFunction" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 4. FmeaInfo 저장 (cftMembers 포함) - 모든 필드 명시적으로 포함
    const fmeaInfoToSave = {
      companyName: fmeaInfo?.companyName || '',
      engineeringLocation: fmeaInfo?.engineeringLocation || '',
      customerName: fmeaInfo?.customerName || '',
      modelYear: fmeaInfo?.modelYear || '',
      subject: fmeaInfo?.subject || '',
      fmeaStartDate: fmeaInfo?.fmeaStartDate || '',
      fmeaRevisionDate: fmeaInfo?.fmeaRevisionDate || '',
      fmeaProjectName: fmeaInfo?.fmeaProjectName || '',
      fmeaId: fmeaId,
      fmeaType: fmeaType || 'P',
      designResponsibility: fmeaInfo?.designResponsibility || '',
      confidentialityLevel: fmeaInfo?.confidentialityLevel || '',
      fmeaResponsibleName: fmeaInfo?.fmeaResponsibleName || '',
    };
    
    console.log(`[API] 저장할 fmeaInfo (${fmeaId}):`, JSON.stringify(fmeaInfoToSave, null, 2));
    console.log(`[API] 저장할 project:`, JSON.stringify(project || {}, null, 2));
    console.log(`[API] 저장할 cftMembers:`, JSON.stringify(cftMembers || [], null, 2));
    
    // ✅ FMEA 리스트와 DB는 1:1 관계 - 동일 fmeaId의 모든 기존 행 삭제 후 최신본만 저장
    const infoId = `info-${fmeaId}`;
    
    // ✅ parentFmeaId 결정: 클라이언트에서 전달받거나, Master FMEA는 본인 ID
    // Master(M): parentFmeaId = 본인 ID (자기 자신이 Parent)
    // Family(F), Part(P): parentFmeaId = 클라이언트에서 전달받은 상위 FMEA ID
    const actualFmeaType = fmeaType || extractType(fmeaId) || 'P';
    const parentId = body.parentFmeaId || (actualFmeaType === 'M' ? fmeaId : null);
    const parentType = body.parentFmeaType || (actualFmeaType === 'M' ? 'M' : null);
    
    // 1. 동일 fmeaId의 모든 기존 행 삭제 (중복 방지)
    await pool.query(`
      DELETE FROM "${schemaName}"."FmeaInfo"
      WHERE "fmeaId" = $1
    `, [fmeaId]);
    
    // 2. 최신본만 INSERT (1:1 관계 보장, parentFmeaId 포함)
    await pool.query(`
      INSERT INTO "${schemaName}"."FmeaInfo" 
      (id, "fmeaId", "fmeaType", "parentFmeaId", "parentFmeaType", project, "fmeaInfo", "cftMembers")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      infoId,
      fmeaId,
      actualFmeaType,
      parentId,  // ✅ Master는 본인 ID, Family/Part는 상위 FMEA ID
      parentType,
      JSON.stringify(project || {}),
      JSON.stringify(fmeaInfoToSave),  // ✅ 모든 필드 포함
      JSON.stringify(cftMembers || [])
    ]);
    
    console.log(`✅ [API] parentFmeaId 설정: ${fmeaId} → parent: ${parentId} (type: ${parentType})`);
    
    console.log(`✅ [API] FMEA 저장 완료 (1:1 관계 보장): ${fmeaId} → ${infoId}`);
    
    console.log(`✅ FMEA 프로젝트 생성: ${fmeaId} (스키마: ${schemaName})`);
    
    return NextResponse.json({ 
      success: true, 
      fmeaId, 
      schemaName,
      parentFmeaId: parentId,  // ✅ 저장된 상위 FMEA ID 반환
      parentFmeaType: parentType,
      message: 'FMEA 프로젝트가 생성되었습니다.' 
    });
    
  } catch (error: any) {
    console.error('❌ FMEA 프로젝트 생성 실패:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}

// 유틸: ID에서 유형 추출
function extractType(id: string): string {
  const match = id.match(/pfm\d{2}-([MFP])/i);
  return match ? match[1].toUpperCase() : 'P';
}

// 유틸: 단계 계산
function calculateStep(info: any): number {
  if (info.optConfirmed) return 7;
  if (info.riskConfirmed) return 6;
  if (info.failureLinkConfirmed) return 5;
  if (info.l3Confirmed) return 4;
  if (info.l2Confirmed) return 3;
  if (info.l1Confirmed || info.structureConfirmed) return 2;
  return 1;
}

