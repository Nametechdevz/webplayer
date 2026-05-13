'use strict';

const { PrismaClient } = require('@prisma/client');

let prisma;

function getDatabaseClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      errorFormat: 'minimal',
    });

    // Graceful shutdown hooks
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }
  return prisma;
}

async function connectDatabase() {
  const client = getDatabaseClient();
  try {
    await client.$connect();
    console.log('[DB] PostgreSQL connected successfully');
    return client;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    throw err;
  }
}

async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('[DB] PostgreSQL disconnected');
  }
}

module.exports = { getDatabaseClient, connectDatabase, disconnectDatabase };
