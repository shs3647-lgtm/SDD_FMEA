/**
 * @file route.ts
 * @description PFMEA 관계형 데이터 API (A, B, C)
 * @author AI Assistant
 * @created 2025-12-26
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: 관계형 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'A';

    let data;
    if (type === 'A') {
      data = await prisma.pFMEARelationA.findMany({ orderBy: [{ processNo: 'asc' }, { sortOrder: 'asc' }] });
    } else if (type === 'B') {
      data = await prisma.pFMEARelationB.findMany({ orderBy: [{ processNo: 'asc' }, { sortOrder: 'asc' }] });
    } else if (type === 'C') {
      data = await prisma.pFMEARelationC.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PFMEA Relation GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: 관계형 데이터 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, items } = body;

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    // 기존 데이터 삭제 후 새로 저장
    if (type === 'A') {
      await prisma.pFMEARelationA.deleteMany();
      await prisma.pFMEARelationA.createMany({
        data: items.map((item: { processNo: string; processName: string; processFunc?: string; productChar?: string; failureMode?: string; detection?: string }, idx: number) => ({
          processNo: item.processNo || '',
          processName: item.processName || '',
          processFunc: item.processFunc || '',
          productChar: item.productChar || '',
          failureMode: item.failureMode || '',
          detection: item.detection || '',
          sortOrder: idx,
        })),
      });
    } else if (type === 'B') {
      await prisma.pFMEARelationB.deleteMany();
      await prisma.pFMEARelationB.createMany({
        data: items.map((item: { processNo: string; workElement: string; elementFunc?: string; processChar?: string; failureCause?: string; prevention?: string }, idx: number) => ({
          processNo: item.processNo || '',
          workElement: item.workElement || '',
          elementFunc: item.elementFunc || '',
          processChar: item.processChar || '',
          failureCause: item.failureCause || '',
          prevention: item.prevention || '',
          sortOrder: idx,
        })),
      });
    } else if (type === 'C') {
      await prisma.pFMEARelationC.deleteMany();
      await prisma.pFMEARelationC.createMany({
        data: items.map((item: { category: string; productFunc?: string; requirement?: string; failureEffect?: string }, idx: number) => ({
          category: item.category || '',
          productFunc: item.productFunc || '',
          requirement: item.requirement || '',
          failureEffect: item.failureEffect || '',
          sortOrder: idx,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PFMEA Relation POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}







