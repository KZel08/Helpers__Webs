import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;

if (typeof email !== 'string' || typeof password !== 'string') {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured.');
}
if (typeof databaseUrl !== 'string') {
  throw new Error('DATABASE_URL must be configured.');
}

const adminEmail = email;
const adminPassword = password;

if (adminPassword.length < 8 || adminPassword.length > 128) {
  throw new Error('Password must be between 8 and 128 characters.');
}

if (
  [...adminPassword].some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127;
  })
) {
  throw new Error('Password contains control characters.');
}

if (/(.)\1{31,}/.test(adminPassword)) {
  throw new Error('Password contains an excessively long repeated sequence.');
}

if (
  /[;:,'"`]/.test(adminPassword) ||
  /--/.test(adminPassword) ||
  /\/\*/.test(adminPassword) ||
  /\*\//.test(adminPassword)
) {
  throw new Error('Password contains forbidden characters.');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    if (existing.role === Role.ADMIN) {
      console.log(`Admin already exists: ${adminEmail}`);
      return;
    }

    throw new Error(`A non-admin account already uses ${adminEmail}.`);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  });

  console.log('Admin created successfully:');
  console.log(admin);
}

main()
  .catch((error) => {
    console.error('Failed to create admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
