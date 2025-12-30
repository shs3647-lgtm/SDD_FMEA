/**
 * @file route.ts
 * @description PFMEA 기초정보 마스터 데이터 API
 * @author AI Assistant
 * @created 2025-12-26
 * 
 * 기능:
 * - GET: 전체 기초정보 조회
 * - POST: 기초정보 저장 (upsert)
 * - DELETE: 특정 항목 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: 전체 기초정보 조회
export async function GET() {
  try {
    const data = await prisma.pFMEAMasterData.findMany({
      orderBy: [{ itemCode: 'asc' }, { processNo: 'asc' }, { sortOrder: 'asc' }],
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PFMEA Master Data GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: 기초정보 저장 (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: { itemCode: string; processNo: string; value: string; sortOrder?: number }[] };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    // 트랜잭션으로 일괄 처리
    const results = await prisma.$transaction(
      items.map((item, index) =>
        prisma.pFMEAMasterData.upsert({
          where: {
            itemCode_processNo_value: {
              itemCode: item.itemCode,
              processNo: item.processNo,
              value: item.value,
            },
          },
          update: {
            sortOrder: item.sortOrder ?? index,
            updatedAt: new Date(),
          },
          create: {
            itemCode: item.itemCode,
            processNo: item.processNo,
            value: item.value,
            sortOrder: item.sortOrder ?? index,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('PFMEA Master Data POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}

// DELETE: 특정 항목 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemCode = searchParams.get('itemCode');

    if (itemCode) {
      // 특정 항목 코드의 모든 데이터 삭제
      await prisma.pFMEAMasterData.deleteMany({ where: { itemCode } });
    } else {
      // 전체 삭제
      await prisma.pFMEAMasterData.deleteMany();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PFMEA Master Data DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete data' }, { status: 500 });
  }
}








