import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '../lib/constants';

// ── Schemas de validación ─────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  fullName: z.string().min(2, 'Nombre requerido'),
  timezone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  timezone: z.string().optional(),
});

const googleLoginSchema = z.object({
  token: z.string().min(1),
  timezone: z.string().optional(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Nombre requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  avatarUrl: z.string().optional(),
  currencyCode: z.string().length(3).optional(),
  appWebUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  timezone: z.string().optional(),
  billingCycleDay: z.number().int().min(1).max(31).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
});

// ── Helpers de tokens ─────────────────────────────────────
function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}

// Categorías por defecto eliminadas (movidas a lib/constants.ts)

// ── POST /api/auth/register ───────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password, fullName, timezone } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ message: 'Este email ya está registrado' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      timezone: timezone || 'America/Bogota',
      categories: {
        create: DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true })),
      },
    },
    select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, billingCycleDay: true, createdAt: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({ user, accessToken, refreshToken });
}

// ── POST /api/auth/login ──────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Email y contraseña requeridos' });
    return;
  }

  const { email, password, timezone } = parsed.data;

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ message: 'Credenciales incorrectas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Credenciales incorrectas' });
      return;
    }

    // Update timezone if provided and different
    if (timezone && timezone !== user.timezone) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { timezone },
      });
    }

    const { accessToken, refreshToken } = generateTokens(user!.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user!.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: { id: user!.id, email: user!.email, fullName: user!.fullName, currencyCode: user!.currencyCode, timezone: user!.timezone, avatarUrl: user!.avatarUrl, appWebUrl: user!.appWebUrl, billingCycleDay: user!.billingCycleDay, createdAt: user!.createdAt },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('🔥 Error crítico en Login:', error);
    res.status(500).json({ message: 'Error interno del servidor', detail: error.message, stack: error.stack });
  }
}

// ── POST /api/auth/google ──────────────────────────────────
export async function googleLogin(req: Request, res: Response): Promise<void> {
  const parsed = googleLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Error de validación del token de Google', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { token, timezone } = parsed.data;
  const userTimezone = timezone || 'America/Bogota';
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

  if (!CLIENT_ID) {
    res.status(500).json({ message: 'Falta configurar el Google Client ID en el servidor' });
    return;
  }

  try {
    const client = new OAuth2Client(CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ message: 'Token de Google inválido o sin email' });
      return;
    }

    const { email, name, picture } = payload;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Registrar nuevo usuario
      user = await prisma.user.create({
        data: {
          email,
          fullName: name || 'Usuario Google',
          passwordHash: '', // Usuarios de Google no tienen contraseña estricta
          currencyCode: 'COP',
          timezone: userTimezone,
          avatarUrl: picture || null,
        },
      });

      // Insertar Categorías Preestablecidas
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map(c => ({
          ...c,
          userId: user!.id,
          isDefault: true
        })),
      });
    } else {
      // Opcional: actualizar foto o nombre si es que el usuario inició previamente con manual
      const shouldUpdateAvatar = picture && !user.avatarUrl;
      const shouldUpdateTimezone = timezone && timezone !== user.timezone;

      if (shouldUpdateAvatar || shouldUpdateTimezone) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(shouldUpdateTimezone && { timezone: userTimezone }),
            ...(shouldUpdateAvatar && { avatarUrl: picture }),
          },
        });
      }
    }

    const tokens = generateTokens(user!.id);

    res.json({
      user: { id: user!.id, email: user!.email, fullName: user!.fullName, currencyCode: user!.currencyCode, timezone: user!.timezone, avatarUrl: user!.avatarUrl, appWebUrl: user!.appWebUrl, billingCycleDay: user!.billingCycleDay, createdAt: user!.createdAt },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('Error Google Auth:', error);
    res.status(401).json({ message: 'Token de Google rechazado o expirado' });
  }
}

// ── POST /api/auth/refresh-token ──────────────────────────
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  if (!token) {
    res.status(400).json({ message: 'Refresh token requerido' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const stored = await prisma.refreshToken.findUnique({ where: { token } });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ message: 'Refresh token inválido o expirado' });
      return;
    }

    await prisma.refreshToken.delete({ where: { token } });
    const tokens = generateTokens(payload.userId);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Refresh token inválido' });
  }
}

// ── POST /api/auth/logout ─────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
  }
  res.json({ message: 'Sesión cerrada correctamente' });
}

// ── GET /api/auth/me ──────────────────────────────────────
export async function me(req: Request & { userId?: string }, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, billingCycleDay: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }
  res.json({ user });
}

// ── PUT /api/auth/profile ─────────────────────────────────
export async function updateProfile(req: Request & { userId?: string }, res: Response): Promise<void> {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  // Prevenir empty string in url
  const dataToUpdate: any = { ...parsed.data };
  if (dataToUpdate.appWebUrl === '') dataToUpdate.appWebUrl = null;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: dataToUpdate,
      select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, billingCycleDay: true, createdAt: true },
    });
    res.json({ user: updatedUser, message: 'Perfil actualizado' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: 'El correo electrónico ya está en uso' });
    } else {
      res.status(500).json({ message: 'Error interno o ruta de base de datos incorrecta' });
    }
  }
}

// ── PUT /api/auth/profile/password ────────────────────────
export async function changePassword(req: Request & { userId?: string }, res: Response): Promise<void> {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !user.passwordHash) {
    res.status(404).json({ message: 'Usuario no encontrado o no tiene contraseña configurada' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.userId },
    data: { passwordHash: newHash },
  });

  res.json({ message: 'Contraseña actualizada correctamente' });
}
