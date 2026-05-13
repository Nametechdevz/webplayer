'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// ─── Validation Schemas ────────────────────────────────────────────────────

const updateSelfSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'RESELLER', 'USER', 'GUEST']).default('USER'),
  displayName: z.string().max(100).optional(),
  maxConnections: z.number().int().min(1).max(100).default(1),
  expiresAt: z.string().datetime().optional(),
  isTrial: z.boolean().default(false),
  notes: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  displayName: z.string().max(100).optional(),
  role: z.enum(['ADMIN', 'RESELLER', 'USER', 'GUEST']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'PENDING', 'BANNED']).optional(),
  maxConnections: z.number().int().min(1).max(100).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isTrial: z.boolean().optional(),
  notes: z.string().optional(),
  password: z.string().min(6).optional(),
});

// ─── Self Routes ───────────────────────────────────────────────────────────

/**
 * GET /api/users/me
 * Get own profile
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        role: true,
        status: true,
        max_connections: true,
        is_trial: true,
        trial_expires_at: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/me
 * Update own profile
 */
router.patch('/me', async (req, res, next) => {
  try {
    const body = updateSelfSchema.parse(req.body);

    const updateData = {};

    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.displayName !== undefined) updateData.display_name = body.displayName;
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl || null;

    // Password change
    if (body.newPassword) {
      if (!body.currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password required to change password',
          code: 'CURRENT_PASSWORD_REQUIRED',
        });
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const valid = await bcrypt.compare(body.currentPassword, user.password_hash);
      if (!valid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_PASSWORD',
        });
      }

      updateData.password_hash = await bcrypt.hash(body.newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update', code: 'NO_CHANGES' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        role: true,
        status: true,
        updated_at: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ─── Admin User Management ─────────────────────────────────────────────────

/**
 * GET /api/users
 * List users (Admin/Reseller only)
 */
router.get('/', requireRole('SUPER_ADMIN', 'ADMIN', 'RESELLER'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {};

    // Resellers can only see their own created users
    if (req.user.role === 'RESELLER') {
      where.created_by = req.user.id;
    }

    if (req.query.status) where.status = req.query.status;
    if (req.query.role) where.role = req.query.role;
    if (req.query.search) {
      where.OR = [
        { username: { contains: req.query.search, mode: 'insensitive' } },
        { email: { contains: req.query.search, mode: 'insensitive' } },
        { display_name: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          display_name: true,
          role: true,
          status: true,
          max_connections: true,
          is_trial: true,
          expires_at: true,
          created_at: true,
          updated_at: true,
          _count: { select: { sessions: true, profiles: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'RESELLER'), async (req, res, next) => {
  try {
    const body = createUserSchema.parse(req.body);

    // Resellers can only create USER/GUEST roles
    if (req.user.role === 'RESELLER' && !['USER', 'GUEST'].includes(body.role)) {
      return res.status(403).json({
        success: false,
        error: 'Resellers can only create USER or GUEST accounts',
        code: 'FORBIDDEN',
      });
    }

    // Only SUPER_ADMIN can create ADMIN accounts
    if (body.role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can create admin accounts',
        code: 'FORBIDDEN',
      });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email || null,
        password_hash: passwordHash,
        display_name: body.displayName || body.username,
        role: body.role,
        status: 'ACTIVE',
        max_connections: body.maxConnections,
        is_trial: body.isTrial,
        expires_at: body.expiresAt ? new Date(body.expiresAt) : null,
        notes: body.notes || null,
        created_by: req.user.id,
        profiles: {
          create: {
            name: body.displayName || body.username,
            is_default: true,
          },
        },
        subscription: {
          create: {
            plan: 'BASIC',
            status: 'ACTIVE',
            max_streams: body.maxConnections,
            expires_at: body.expiresAt ? new Date(body.expiresAt) : null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        role: true,
        status: true,
        max_connections: true,
        is_trial: true,
        expires_at: true,
        created_at: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:id
 * Get a specific user
 */
router.get('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'RESELLER'), async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role === 'RESELLER') where.created_by = req.user.id;

    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        role: true,
        status: true,
        max_connections: true,
        is_trial: true,
        trial_expires_at: true,
        expires_at: true,
        notes: true,
        created_at: true,
        updated_at: true,
        subscription: true,
        profiles: {
          select: { id: true, name: true, avatar: true, is_default: true },
        },
        _count: { select: { sessions: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'RESELLER'), async (req, res, next) => {
  try {
    const body = updateUserSchema.parse(req.body);

    const where = { id: req.params.id };
    if (req.user.role === 'RESELLER') where.created_by = req.user.id;

    const existing = await prisma.user.findFirst({ where });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found', code: 'NOT_FOUND' });
    }

    const updateData = {};
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.displayName !== undefined) updateData.display_name = body.displayName;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.maxConnections !== undefined) updateData.max_connections = body.maxConnections;
    if (body.expiresAt !== undefined) updateData.expires_at = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.isTrial !== undefined) updateData.is_trial = body.isTrial;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.password) updateData.password_hash = await bcrypt.hash(body.password, 12);

    // Only admins+ can change roles
    if (body.role && req.user.role !== 'RESELLER') {
      updateData.role = body.role;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        role: true,
        status: true,
        max_connections: true,
        is_trial: true,
        expires_at: true,
        updated_at: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (Admin only)
 */
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
        code: 'SELF_DELETE',
      });
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
