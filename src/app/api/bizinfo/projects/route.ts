/**
 * 프로젝트 기초정보 API - 전체 프로젝트 공유 마스터 데이터
 * 
 * GET /api/bizinfo/projects - 전체 프로젝트 기초정보 목록 조회
 * GET /api/bizinfo/projects?id=xxx - 특정 프로젝트 기초정보 조회
 * POST /api/bizinfo/projects - 프로젝트 기초정보 생성
 * PUT /api/bizinfo/projects - 프로젝트 기초정보 수정
 * DELETE /api/bizinfo/projects?id=xxx - 프로젝트 기초정보 삭제
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// ============ GET: 프로젝트 기초정보 목록 조회 ============
export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database not configured', projects: [] },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('id');

  try {
    if (projectId) {
      // 특정 프로젝트 기초정보 조회
      const project = await prisma.bizInfoProject.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found', project: null },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        project: {
          id: project.id,
          customerName: project.customerName,
          customerCode: project.customerCode || '',
          factory: project.factory || '',
          modelYear: project.modelYear || '',
          program: project.program || '',
          productName: project.productName || '',
          partNo: project.partNo || '',
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        }
      });
    } else {
      // 전체 프로젝트 기초정보 목록 조회
      let projects;
      try {
        projects = await prisma.bizInfoProject.findMany({
          orderBy: [
            { customerName: 'asc' },
            { modelYear: 'desc' },
            { program: 'asc' }
          ]
        });
      } catch (dbError: any) {
        // 테이블이 없거나 스키마 문제인 경우
        if (dbError.code === 'P2021' || dbError.message?.includes('does not exist') || dbError.message?.includes('table')) {
          console.warn('[BizInfoProjects API] bizinfo_projects 테이블이 없습니다. 빈 배열 반환:', dbError.message);
          return NextResponse.json({
            success: true,
            projects: []
          });
        }
        throw dbError;
      }

      return NextResponse.json({
        success: true,
        projects: projects.map(project => ({
          id: project.id,
          customerName: project.customerName,
          customerCode: project.customerCode || '',
          factory: project.factory || '',
          modelYear: project.modelYear || '',
          program: project.program || '',
          productName: project.productName || '',
          partNo: project.partNo || '',
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        }))
      });
    }
  } catch (error: any) {
    console.error('[BizInfoProjects API] GET 오류:', error);
    const errorMessage = error.message || 'Failed to fetch projects';
    const errorCode = error.code || 'UNKNOWN';
    
    // 테이블이 없는 경우 빈 배열 반환
    if (errorCode === 'P2021' || errorMessage.includes('does not exist') || errorMessage.includes('table')) {
      console.warn('[BizInfoProjects API] bizinfo_projects 테이블이 없습니다. 빈 배열 반환');
      return NextResponse.json({
        success: true,
        projects: []
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: errorCode,
        projects: [] 
      },
      { status: 500 }
    );
  }
}

// ============ POST: 프로젝트 기초정보 생성 ============
export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { customerName, customerCode, factory, modelYear, program, productName, partNo } = body;

    if (!customerName) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다 (고객명)' },
        { status: 400 }
      );
    }

    const project = await prisma.bizInfoProject.create({
      data: {
        customerName,
        customerCode: customerCode || null,
        factory: factory || null,
        modelYear: modelYear || null,
        program: program || null,
        productName: productName || null,
        partNo: partNo || null,
      }
    });

    console.log(`✅ 프로젝트 기초정보 생성 완료: ${project.customerName} - ${project.productName || 'N/A'} (${project.id})`);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        customerName: project.customerName,
        customerCode: project.customerCode || '',
        factory: project.factory || '',
        modelYear: project.modelYear || '',
        program: project.program || '',
        productName: project.productName || '',
        partNo: project.partNo || '',
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }
    });
  } catch (error: any) {
    console.error('[BizInfoProjects API] POST 오류:', error);
    
    const errorMessage = error.message || 'Failed to create project';
    const errorCode = error.code || 'UNKNOWN';
    
    // Prisma 테이블 없음 오류
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'bizinfo_projects 테이블이 없습니다. Prisma 마이그레이션을 실행해주세요.',
          code: 'P2021'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
}

// ============ PUT: 프로젝트 기초정보 수정 ============
export async function PUT(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { id, customerName, customerCode, factory, modelYear, program, productName, partNo } = body;

    if (!id || !customerName) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다 (ID, 고객명)' },
        { status: 400 }
      );
    }

    // 프로젝트 기초정보 존재 확인
    const existing = await prisma.bizInfoProject.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '프로젝트 기초정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const project = await prisma.bizInfoProject.update({
      where: { id },
      data: {
        customerName,
        customerCode: customerCode || null,
        factory: factory || null,
        modelYear: modelYear || null,
        program: program || null,
        productName: productName || null,
        partNo: partNo || null,
      }
    });

    console.log(`✅ 프로젝트 기초정보 수정 완료: ${project.customerName} - ${project.productName || 'N/A'} (${project.id})`);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        customerName: project.customerName,
        customerCode: project.customerCode || '',
        factory: project.factory || '',
        modelYear: project.modelYear || '',
        program: project.program || '',
        productName: project.productName || '',
        partNo: project.partNo || '',
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }
    });
  } catch (error: any) {
    console.error('[BizInfoProjects API] PUT 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

// ============ DELETE: 프로젝트 기초정보 삭제 ============
export async function DELETE(request: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('id');

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: '프로젝트 기초정보 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    // 프로젝트 기초정보 존재 확인
    const existing = await prisma.bizInfoProject.findUnique({
      where: { id: projectId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '프로젝트 기초정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await prisma.bizInfoProject.delete({
      where: { id: projectId }
    });

    console.log(`✅ 프로젝트 기초정보 삭제 완료: ${existing.customerName} - ${existing.productName || 'N/A'} (${projectId})`);

    return NextResponse.json({
      success: true,
      message: '프로젝트 기초정보가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('[BizInfoProjects API] DELETE 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}



