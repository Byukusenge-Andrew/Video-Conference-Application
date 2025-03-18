import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test the connection
prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch(e => console.error('Database connection error:', e));

export default prisma; 