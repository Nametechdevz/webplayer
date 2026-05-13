'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ─── Validation ────────────────────────────────────────────────────────────

const createProfileSchema = z.object({
  name: z.string().min(1).max(50),
  avatar: z.string().optional(),
  pin: z.string().length(4).regex(/^\d{4}$/).optional(),
  isAdultLocked: z.boolean().default(false),
  language: z.string().default('en'),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().optional().nullable(),
  pin: z.string().length(4).regex(/^\d{4}$/).optional().nullable(),
  isAdultLocked: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  language: z.string().optional(),
});

const verifyPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/),
});

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * GET /api/profiles
 * List all profiles for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { user_id: req.user.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        is_default: true,
        is_adult_locked: true,
        language: true,
        created_at: true,
        // Never expose PIN hash
      },
      orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
    });

    res.json({ success: true, data: profiles });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/profiles
 * Create a new profile
 */
router.post('/', async (req, res, next) => {
  try {
    const body = createProfileSchema.parse(req.body);

    // Max 5 profiles per user
    const count = await prisma.profile.count({ where: { user_id: req.user.id } });
    if (count >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 profiles allowed per account',
        code: 'PROFILE_LIMIT',
      });
    }

    const isFirst = count === 0;
    const pinHash = body.pin ? await bcrypt.hash(body.pin, 10) : null;

    const profile = await prisma.profile.create({
      data: {
        user_id: req.user.id,
        name: body.name,
        avatar: body.avatar || null,
        pin: pinHash,
        is_adult_locked: body.isAdultLocked,
        is_default: isFirst, // first profile is default
        language: body.language,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        is_default: true,
        is_adult_locked: true,
        language: true,
        created_at: true,
      },
    });

    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profiles/:id
 * Get a specific profile
 */
router.get('/:id', async (req, res, next) => {
  try {
    const profile = await prisma.profile.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        is_default: true,
        is_adult_locked: true,
        language: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/profiles/:id
 * Update a profile
 */
router.put('/:id', async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);

    const existing = await prisma.profile.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.isAdultLocked !== undefined) updateData.is_adult_locked = body.isAdultLocked;
    if (body.language !== undefined) updateData.language = body.language;

    // Handle PIN update
    if (body.pin !== undefined) {
      updateData.pin = body.pin ? await bcrypt.hash(body.pin, 10) : null;
    }

    // Handle setting as default
    if (body.isDefault === true) {
      // Unset all other defaults for this user
      await prisma.profile.updateMany({
        where: { user_id: req.user.id, id: { not: req.params.id } },
        data: { is_default: false },
      });
      updateData.is_default = true;
    }

    const profile = await prisma.profile.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        avatar: true,
        is_default: true,
        is_adult_locked: true,
        language: true,
        updated_at: true,
      },
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/profiles/:id
 * Delete a profile
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const profile = await prisma.profile.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    if (profile.is_default) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the default profile. Set another profile as default first.',
        code: 'DELETE_DEFAULT_PROFILE',
      });
    }

    await prisma.profile.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Profile deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/profiles/:id/verify-pin
 * Verify a profile's PIN
 */
router.post('/:id/verify-pin', async (req, res, next) => {
  try {
    const body = verifyPinSchema.parse(req.body);

    const profile = await prisma.profile.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    if (!profile.pin) {
      return res.json({ success: true, verified: true, message: 'No PIN set' });
    }

    const valid = await bcrypt.compare(body.pin, profile.pin);

    if (!valid) {
      return res.status(401).json({
        success: false,
        verified: false,
        error: 'Incorrect PIN',
        code: 'INVALID_PIN',
      });
    }

    res.json({ success: true, verified: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
