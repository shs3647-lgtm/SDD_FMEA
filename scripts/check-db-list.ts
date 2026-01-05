import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('\n=== FmeaLegacyData - All Projects ===');
    const legacyData = await prisma.fmeaLegacyData.findMany({
      select: {
        id: true,
        projectId: true,
        fmeaId: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    console.log('Total records:', legacyData.length);
    legacyData.forEach(item => {
      console.log(`- ${item.projectId} / ${item.fmeaId} (Updated: ${item.updatedAt})`);
    });

    console.log('\n=== FmeaConfirmedState - All Projects ===');
    const confirmedState = await prisma.fmeaConfirmedState.findMany({
      select: {
        id: true,
        projectId: true,
        fmeaId: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    console.log('Total records:', confirmedState.length);
    confirmedState.forEach(item => {
      console.log(`- ${item.projectId} / ${item.fmeaId} (Updated: ${item.updatedAt})`);
    });

    console.log('\n=== Process (Atomic DB) - All Projects ===');
    const processes = await prisma.process.findMany({
      select: {
        id: true,
        projectId: true,
        procNo: true,
        procName: true
      },
      distinct: ['projectId'],
      orderBy: { projectId: 'asc' }
    });
    console.log('Total unique projects:', processes.length);
    processes.forEach(proc => {
      console.log(`- ${proc.projectId}: ${proc.procNo} ${proc.procName}`);
    });

    console.log('\n=== Checking pfm26-001 specifically ===');
    const pfm26Legacy = await prisma.fmeaLegacyData.findMany({
      where: { projectId: 'pfm26-001' }
    });
    console.log('FmeaLegacyData for pfm26-001:', pfm26Legacy.length, 'records');

    const pfm26Confirmed = await prisma.fmeaConfirmedState.findMany({
      where: { projectId: 'pfm26-001' }
    });
    console.log('FmeaConfirmedState for pfm26-001:', pfm26Confirmed.length, 'records');

    const pfm26Processes = await prisma.process.findMany({
      where: { projectId: 'pfm26-001' }
    });
    console.log('Process (Atomic DB) for pfm26-001:', pfm26Processes.length, 'records');
    if (pfm26Processes.length > 0) {
      console.log('Sample processes:');
      pfm26Processes.slice(0, 3).forEach(p => {
        console.log(`  - ${p.procNo} ${p.procName}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

