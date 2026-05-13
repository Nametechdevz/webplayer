#!/usr/bin/env node
// =============================================================================
// scripts/seed.js — Thin wrapper for running the database seed from the
//                   project root (e.g. called by scripts/setup.sh).
//
// The canonical seed lives at backend/prisma/seed.js so it can also be
// invoked via `npm run db:seed` from the backend/ directory.
// =============================================================================

'use strict';

const path = require('path');
require(path.resolve(__dirname, '../backend/prisma/seed.js'));
