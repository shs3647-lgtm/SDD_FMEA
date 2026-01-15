const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function checkData() {
  const cpNo = 'cp26-m001';
  console.log(`🔍 [Check DB] cpNo: ${cpNo}`);
  
  const tables = [
    'cpRegistration',
    'cpProcess',
    'cpDetector',
    'cpControlItem',
    'cpControlMethod',
    'cpReactionPlan'
  ];
  
  for (const table of tables) {
    try {
      const count = await prisma[table].count({
        where: { cpNo: { equals: cpNo, mode: 'insensitive' } }
      });
      console.log(`- ${table}: ${count} rows`);
      
      if (count > 0 && table === 'cpProcess') {
        const samples = await prisma[table].findMany({
          where: { cpNo: { equals: cpNo, mode: 'insensitive' } },
          take: 3
        });
        console.log(`  Sample data:`, JSON.stringify(samples, null, 2));
      }
    } catch (err) {
      console.error(`- ${table}: Error - ${err.message}`);
    }
  }
  
  await prisma.$disconnect();
}

checkData();
