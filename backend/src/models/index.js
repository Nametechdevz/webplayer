'use strict';

const { getDatabaseClient } = require('../config/database');

/**
 * Convenience re-export.
 * Use: const { prisma } = require('../models');
 */
const prisma = getDatabaseClient();

module.exports = { prisma };
