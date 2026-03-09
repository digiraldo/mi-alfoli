import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

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

// Categorías por defecto creadas al registrar usuario
const DEFAULT_CATEGORIES = [
  { name: 'Sueldo', type: 'income' as const, icon: '💼', color: '#4CAF50' },
  { name: 'Freelance', type: 'income' as const, icon: '💻', color: '#8BC34A' },
  { name: 'Inversiones', type: 'income' as const, icon: '📈', color: '#00BCD4' },
  { name: 'Regalos', type: 'income' as const, icon: '🎁', color: '#E91E63' },
  { name: 'Reembolsos', type: 'income' as const, icon: '🔄', color: '#FF9800' },
  { name: 'Otros ingresos', type: 'income' as const, icon: '📋', color: '#9E9E9E' },
  { name: 'Servicios', type: 'expense' as const, icon: '💡', color: '#FF5722' },
  { name: 'Transporte', type: 'expense' as const, icon: '🚗', color: '#2196F3' },
  { name: 'Alimentación', type: 'expense' as const, icon: '🍔', color: '#4CAF50' },
  { name: 'Mercado', type: 'expense' as const, icon: '🛒', color: '#8BC34A' },
  { name: 'Restaurantes', type: 'expense' as const, icon: '🍽️', color: '#FF9800' },
  { name: 'Entretenimiento', type: 'expense' as const, icon: '🎬', color: '#9C27B0' },
  { name: 'Suscripciones', type: 'expense' as const, icon: '📱', color: '#3F51B5' },
  { name: 'Salud', type: 'expense' as const, icon: '🏥', color: '#F44336' },
  { name: 'Educación', type: 'expense' as const, icon: '📚', color: '#00BCD4' },
  { name: 'Ropa', type: 'expense' as const, icon: '👕', color: '#E91E63' },
  { name: 'Hogar', type: 'expense' as const, icon: '🏠', color: '#795548' },
  { name: 'Donación', type: 'expense' as const, icon: '❤️', color: '#E91E63' },
  { name: 'Diezmo', type: 'expense' as const, icon: '🙏', color: '#006064' },
  { name: 'Otros gastos', type: 'expense' as const, icon: '📋', color: '#9E9E9E' },
];

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
    select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, createdAt: true },
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
        select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, createdAt: true },
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, currencyCode: user.currencyCode, timezone: user.timezone, avatarUrl: user.avatarUrl, appWebUrl: user.appWebUrl, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
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
        data: [
          { name: 'Diezmo', type: 'expense', icon: '🙏', color: '#006064', userId: user.id, isDefault: true },
          { name: 'Ofrenda', type: 'expense', icon: '🤲', color: '#00838F', userId: user.id, isDefault: true },
          { name: 'Ahorro / Inversión', type: 'expense', icon: '📈', color: '#4DD0E1', userId: user.id, isDefault: true },
          { name: 'Alimentación', type: 'expense', icon: '🛒', color: '#7CB342', userId: user.id, isDefault: true },
          { name: 'Vivienda', type: 'expense', icon: '🏠', color: '#8D6E63', userId: user.id, isDefault: true },
          { name: 'Transporte', type: 'expense', icon: '🚗', color: '#5E35B1', userId: user.id, isDefault: true },
          { name: 'Salud', type: 'expense', icon: '💊', color: '#E91E63', userId: user.id, isDefault: true },
          { name: 'Educación', type: 'expense', icon: '📚', color: '#1976D2', userId: user.id, isDefault: true },
          { name: 'Entretenimiento', type: 'expense', icon: '🎬', color: '#FFB300', userId: user.id, isDefault: true },
          { name: 'Ropa / Cuidado', type: 'expense', icon: '👕', color: '#E64A19', userId: user.id, isDefault: true },
          { name: 'Salario', type: 'income', icon: '💰', color: '#388E3C', userId: user.id, isDefault: true },
          { name: 'Regalo', type: 'income', icon: '🎁', color: '#FBC02D', userId: user.id, isDefault: true },
          { name: 'Ventas', type: 'income', icon: '🏷️', color: '#BF360C', userId: user.id, isDefault: true },
          { name: 'Otros', type: 'expense', icon: '📋', color: '#607D8B', userId: user.id, isDefault: true },
        ],
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
          select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, createdAt: true },
        });
      }
    }

    const tokens = generateTokens(user.id);

    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, currencyCode: user.currencyCode, timezone: user.timezone, avatarUrl: user.avatarUrl, appWebUrl: user.appWebUrl, createdAt: user.createdAt },
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
    select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, createdAt: true },
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
      select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, createdAt: true },
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
