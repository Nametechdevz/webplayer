#!/usr/bin/env node
// =============================================================================
// backend/prisma/seed.js — Database seed for IPTV Streaming Platform
// Creates: super-admin user, default profiles, example DNS provider
//
// Usage (from backend/ directory):
//   npm run db:seed
//   node prisma/seed.js
//
// Usage via docker compose (from project root):
//   docker compose run --rm backend node prisma/seed.js
// =============================================================================

'use strict';

const path = require('path');

// Load .env — try backend/.env first, then project root .env
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];
for (const p of envPaths) {
  require('dotenv').config({ path: p });
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function required(name) {
  const val = process.env[name];
  if (!val || val.trim() === '') {
    console.error(`[seed] ERROR: environment variable "${name}" is not set.`);
    process.exit(1);
  }
  return val.trim();
}

const log = (msg) => console.log(`[seed] ${msg}`);

// ─── Seed: Super-admin user ───────────────────────────────────────────────────

async function seedAdminUser() {
  const email    = required('ADMIN_EMAIL');
  const password = required('ADMIN_PASSWORD');

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username: 'superadmin' },
      ],
    },
  });

  if (existing) {
    log(`Super-admin already exists (id=${existing.id}). Skipping.`);
    return existing;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      username:        'superadmin',
      password_hash,
      role:            'SUPER_ADMIN',
      status:          'ACTIVE',
      display_name:    'Super Admin',
      max_connections: 10,
      is_trial:        false,
    },
  });

  log(`Super-admin created  → id=${admin.id}  email=${admin.email}`);
  return admin;
}

// ─── Seed: Default profile ────────────────────────────────────────────────────

async function seedDefaultProfiles(adminUser) {
  const existing = await prisma.profile.findFirst({
    where: { user_id: adminUser.id },
  });

  if (existing) {
    log(`Default profile already exists for admin (id=${existing.id}). Skipping.`);
    return;
  }

  const profile = await prisma.profile.create({
    data: {
      user_id:    adminUser.id,
      name:       'Main',
      is_default: true,
      language:   'en',
    },
  });

  log(`Default profile created → id=${profile.id}  name="${profile.name}"`);
}

// ─── Seed: Example DNS / Xtream provider ──────────────────────────────────────

async function seedDnsProvider() {
  const existing = await prisma.dnsProvider.findFirst({
    where: { name: 'Example IPTV Provider' },
  });

  if (existing) {
    log(`Example DNS provider already exists (id=${existing.id}). Skipping.`);
    return;
  }

  const provider = await prisma.dnsProvider.create({
    data: {
      name:      'Example IPTV Provider',
      url:       'http://your-xtream-provider.com:8080',
      username:  'demo_user',
      password:  'demo_password',
      nickname:  'Demo Provider',
      status:    'UNKNOWN',
      priority:  1,
      is_active: false, // disabled until real credentials are supplied
    },
  });

  log(`Example DNS provider created (id=${provider.id}) — update credentials before activating.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const maskedUrl = (process.env.DATABASE_URL || '(not set)').replace(/:([^@]+)@/, ':****@');
  log('Starting database seed...');
  log(`  DATABASE_URL → ${maskedUrl}`);
  log('');

  try {
    const admin = await seedAdminUser();
    await seedDefaultProfiles(admin);
    await seedDnsProvider();

    log('');
    log('Seed completed successfully.');
    log('');
    log('  Admin login:');
    log(`    Email    : ${process.env.ADMIN_EMAIL}`);
    log(`    Password : ${process.env.ADMIN_PASSWORD}`);
    log('');
    log('  IMPORTANT: Change the admin password after your first login!');
  } catch (err) {
    console.error('[seed] Fatal error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
