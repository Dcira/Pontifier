import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const hash = await bcrypt.hash('Admin123!', 10);
await prisma.user.update({
  where: { email: 'admin@campaign.com' },
  data: { password: hash }
});
console.log('Password updated successfully!');
await prisma.$disconnect();