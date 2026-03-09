"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.googleLogin = googleLogin;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.me = me;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const google_auth_library_1 = require("google-auth-library");
const zod_1 = require("zod");
// ── Schemas de validación ─────────────────────────────────
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'Mínimo 6 caracteres'),
    fullName: zod_1.z.string().min(2, 'Nombre requerido'),
    timezone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    timezone: zod_1.z.string().optional(),
});
const googleLoginSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    timezone: zod_1.z.string().optional(),
});
const updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Nombre requerido').optional(),
    email: zod_1.z.string().email('Email inválido').optional(),
    avatarUrl: zod_1.z.string().optional(),
    currencyCode: zod_1.z.string().length(3).optional(),
    appWebUrl: zod_1.z.string().url('URL inválida').or(zod_1.z.literal('')).optional(),
    timezone: zod_1.z.string().optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Contraseña actual requerida'),
    newPassword: zod_1.z.string().min(6, 'Mínimo 6 caracteres'),
});
// ── Helpers de tokens ─────────────────────────────────────
function generateTokens(userId) {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
    return { accessToken, refreshToken };
}
// Categorías por defecto creadas al registrar usuario
const DEFAULT_CATEGORIES = [
    { name: 'Sueldo', type: 'income', icon: '💼', color: '#4CAF50' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#8BC34A' },
    { name: 'Inversiones', type: 'income', icon: '📈', color: '#00BCD4' },
    { name: 'Regalos', type: 'income', icon: '🎁', color: '#E91E63' },
    { name: 'Reembolsos', type: 'income', icon: '🔄', color: '#FF9800' },
    { name: 'Otros ingresos', type: 'income', icon: '📋', color: '#9E9E9E' },
    { name: 'Servicios', type: 'expense', icon: '💡', color: '#FF5722' },
    { name: 'Transporte', type: 'expense', icon: '🚗', color: '#2196F3' },
    { name: 'Alimentación', type: 'expense', icon: '🍔', color: '#4CAF50' },
    { name: 'Mercado', type: 'expense', icon: '🛒', color: '#8BC34A' },
    { name: 'Restaurantes', type: 'expense', icon: '🍽️', color: '#FF9800' },
    { name: 'Entretenimiento', type: 'expense', icon: '🎬', color: '#9C27B0' },
    { name: 'Suscripciones', type: 'expense', icon: '📱', color: '#3F51B5' },
    { name: 'Salud', type: 'expense', icon: '🏥', color: '#F44336' },
    { name: 'Educación', type: 'expense', icon: '📚', color: '#00BCD4' },
    { name: 'Ropa', type: 'expense', icon: '👕', color: '#E91E63' },
    { name: 'Hogar', type: 'expense', icon: '🏠', color: '#795548' },
    { name: 'Donación', type: 'expense', icon: '❤️', color: '#E91E63' },
    { name: 'Diezmo', type: 'expense', icon: '🙏', color: '#006064' },
    { name: 'Otros gastos', type: 'expense', icon: '📋', color: '#9E9E9E' },
];
// ── POST /api/auth/register ───────────────────────────────
async function register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { email, password, fullName, timezone } = parsed.data;
    const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exists) {
        res.status(409).json({ message: 'Este email ya está registrado' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await prisma_1.prisma.user.create({
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
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    res.status(201).json({ user, accessToken, refreshToken });
}
// ── POST /api/auth/login ──────────────────────────────────
async function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Email y contraseña requeridos' });
        return;
    }
    const { email, password, timezone } = parsed.data;
    try {
        let user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            res.status(401).json({ message: 'Credenciales incorrectas' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Credenciales incorrectas' });
            return;
        }
        // Update timezone if provided and different
        if (timezone && timezone !== user.timezone) {
            user = await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { timezone },
            });
        }
        const { accessToken, refreshToken } = generateTokens(user.id);
        await prisma_1.prisma.refreshToken.create({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// ── POST /api/auth/google ──────────────────────────────────
async function googleLogin(req, res) {
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
        const client = new google_auth_library_1.OAuth2Client(CLIENT_ID);
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
        let user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Registrar nuevo usuario
            user = await prisma_1.prisma.user.create({
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
            await prisma_1.prisma.category.createMany({
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
        }
        else {
            // Opcional: actualizar foto o nombre si es que el usuario inició previamente con manual
            const shouldUpdateAvatar = picture && !user.avatarUrl;
            const shouldUpdateTimezone = timezone && timezone !== user.timezone;
            if (shouldUpdateAvatar || shouldUpdateTimezone) {
                user = await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        ...(shouldUpdateTimezone && { timezone: userTimezone }),
                        ...(shouldUpdateAvatar && { avatarUrl: picture }),
                    },
                });
            }
        }
        const tokens = generateTokens(user.id);
        res.json({
            user: { id: user.id, email: user.email, fullName: user.fullName, currencyCode: user.currencyCode, timezone: user.timezone, avatarUrl: user.avatarUrl, appWebUrl: user.appWebUrl, createdAt: user.createdAt },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }
    catch (error) {
        console.error('Error Google Auth:', error);
        res.status(401).json({ message: 'Token de Google rechazado o expirado' });
    }
}
// ── POST /api/auth/refresh-token ──────────────────────────
async function refreshToken(req, res) {
    const { refreshToken: token } = req.body;
    if (!token) {
        res.status(400).json({ message: 'Refresh token requerido' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { token } });
        if (!stored || stored.expiresAt < new Date()) {
            res.status(401).json({ message: 'Refresh token inválido o expirado' });
            return;
        }
        await prisma_1.prisma.refreshToken.delete({ where: { token } });
        const tokens = generateTokens(payload.userId);
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: payload.userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        res.json(tokens);
    }
    catch {
        res.status(401).json({ message: 'Refresh token inválido' });
    }
}
// ── POST /api/auth/logout ─────────────────────────────────
async function logout(req, res) {
    const { refreshToken: token } = req.body;
    if (token) {
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token } }).catch(() => { });
    }
    res.json({ message: 'Sesión cerrada correctamente' });
}
// ── GET /api/auth/me ──────────────────────────────────────
async function me(req, res) {
    const user = await prisma_1.prisma.user.findUnique({
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
async function updateProfile(req, res) {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    // Prevenir empty string in url
    const dataToUpdate = { ...parsed.data };
    if (dataToUpdate.appWebUrl === '')
        dataToUpdate.appWebUrl = null;
    try {
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: dataToUpdate,
            select: { id: true, email: true, fullName: true, currencyCode: true, timezone: true, avatarUrl: true, appWebUrl: true, createdAt: true },
        });
        res.json({ user: updatedUser, message: 'Perfil actualizado' });
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'El correo electrónico ya está en uso' });
        }
        else {
            res.status(500).json({ message: 'Error interno o ruta de base de datos incorrecta' });
        }
    }
}
// ── PUT /api/auth/profile/password ────────────────────────
async function changePassword(req, res) {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const { currentPassword, newPassword } = parsed.data;
    const user = await prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.passwordHash) {
        res.status(404).json({ message: 'Usuario no encontrado o no tiene contraseña configurada' });
        return;
    }
    const valid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!valid) {
        res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        return;
    }
    const newHash = await bcryptjs_1.default.hash(newPassword, 12);
    await prisma_1.prisma.user.update({
        where: { id: req.userId },
        data: { passwordHash: newHash },
    });
    res.json({ message: 'Contraseña actualizada correctamente' });
}
