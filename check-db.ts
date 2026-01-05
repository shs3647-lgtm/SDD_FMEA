import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check FmeaLegacyData
    const legacyData = await prisma.fmeaLegacyData.findMany({
      where: { projectId: 'pfm-001' }
    });
    console.log('\n=== FmeaLegacyData (pfm-001) ===');
    console.log('Found', legacyData.length, 'records');
    if (legacyData.length > 0) {
      console.log('Latest record:', JSON.stringify(legacyData[0], null, 2));
    }

    // Check FmeaConfirmedState
    const confirmedState = await prisma.fmeaConfirmedState.findMany({
      where: { projectId: 'pfm-001' }
    });
    console.log('\n=== FmeaConfirmedState (pfm-001) ===');
    console.log('Found', confirmedState.length, 'records');
    if (confirmedState.length > 0) {
      console.log('Latest record:', JSON.stringify(confirmedState[0], null, 2));
    }

    // Check Atomic DB tables
    const processes = await prisma.process.findMany({
      where: { projectId: 'pfm-001' },
      take: 5
    });
    console.log('\n=== Process (Atomic DB - pfm-001) ===');
    console.log('Found', processes.length, 'records');
    if (processes.length > 0) {
      console.log('Sample:', JSON.stringify(processes[0], null, 2));
    }

    const functions = await prisma.processFunction.findMany({
      where: { process: { projectId: 'pfm-001' } },
      take: 5
    });
    console.log('\n=== ProcessFunction (Atomic DB - pfm-001) ===');
    console.log('Found', functions.length, 'records');

    const chars = await prisma.processCharacteristic.findMany({
      where: { processFunction: { process: { projectId: 'pfm-001' } } },
      take: 5
    });
    console.log('\n=== ProcessCharacteristic (Atomic DB - pfm-001) ===');
    console.log('Found', chars.length, 'records');

    const failureCauses = await prisma.failureCause.findMany({
      where: { process: { projectId: 'pfm-001' } },
      take: 5
    });
    console.log('\n=== FailureCause (Atomic DB - pfm-001) ===');
    console.log('Found', failureCauses.length, 'records');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

