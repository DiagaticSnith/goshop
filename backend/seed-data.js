const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, '..', 'data.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('data.sql not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Disable FK checks during import to avoid ordering issues
  console.log('Disabling foreign key checks');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');

  // Split statements on semicolon followed by newline(s). Keep statements small.
  const statements = sql
    .split(/;\s*(?:\r?\n)/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      console.log('Executing statement:', stmt.slice(0, 120).replace(/\n/g, ' '), '...');
      // Ensure statement ends with semicolon for safety
      const toExec = stmt.trim().endsWith(';') ? stmt : stmt + ';';
      await prisma.$executeRawUnsafe(toExec);
    } catch (err) {
      console.error('Failed executing statement (continuing):', err.message || err);
    }
  }

  console.log('Re-enabling foreign key checks');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');

  console.log('Seeding complete');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
