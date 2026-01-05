import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const fmeaId = 'PFM26-001';
  console.log(`\n🔍 FMEA ID: ${fmeaId} 진단 시작...`);

  try {
    // 1. 레거시 데이터 조회
    const legacy = await prisma.fmeaLegacyData.findUnique({
      where: { fmeaId }
    });

    if (!legacy) {
      console.log('❌ DB: FmeaLegacyData 레코드가 없습니다.');
    } else {
      const data = legacy.data as any;
      console.log('✅ DB: FmeaLegacyData 발견');
      console.log(`   - failureLinks: ${data.failureLinks?.length || 0} 개`);
      console.log(`   - failureLinkConfirmed: ${data.failureLinkConfirmed}`);
      
      if (data.failureLinks && data.failureLinks.length > 0) {
        console.log('   - 샘플 데이터 (첫 번째):', {
          fm: data.failureLinks[0].fmText,
          fe: data.failureLinks[0].feText,
          fc: data.failureLinks[0].fcText
        });
      }
    }

    // 2. 원자성 고장연결 조회
    const atomicLinks = await prisma.failureLink.count({
      where: { fmeaId }
    });
    console.log(`✅ DB: Atomic failureLink 테이블 개수: ${atomicLinks} 개`);

  } catch (error) {
    console.error('❌ 진단 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

