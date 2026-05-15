import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as readline from 'readline';
import { config } from 'dotenv';

config(); // Load .env variables

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the email address of the user to promote to admin: ', async (email) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'admin' }
    });

    console.log(`\nSuccessfully promoted ${email} to admin!`);
    console.log(`They can now access the Admin Panel at /admin.`);
  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
});
