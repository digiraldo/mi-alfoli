'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Avatar, Divider,
  Stack, Alert, Select, MenuItem, InputLabel, FormControl, InputAdornment, IconButton, Chip,
  Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LanguageIcon from '@mui/icons-material/Language';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotifications } from '@/hooks/useNotifications';

// Monedas soportadas
const CURRENCIES = [
  { code: 'COP', label: 'Peso Colombiano (COP)' },
  { code: 'USD', label: 'Dólar Estadounidense (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'MXN', label: 'Peso Mexicano (MXN)' },
  { code: 'ARS', label: 'Peso Argentino (ARS)' },
  { code: 'CLP', label: 'Peso Chileno (CLP)' },
  { code: 'PEN', label: 'Sol Peruano (PEN)' },
];

export default function ProfilePage() {
  const { user, updateProfile, changePassword, isLoading } = useAuthStore();
  const { isSupported, isEnabled, isLoading: nLoading, toggle, sendTest } = useNotifications();
  
  // Perfil State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '', // Read-only mostly
    currencyCode: user?.currencyCode || 'COP',
    appWebUrl: user?.appWebUrl || '',
    avatarUrl: user?.avatarUrl || '',
    billingCycleDay: user?.billingCycleDay || 1,
  });

  // Password State
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName,
        email: user.email,
        currencyCode: user.currencyCode,
        appWebUrl: user.appWebUrl || '',
        avatarUrl: user.avatarUrl || '',
        billingCycleDay: user.billingCycleDay || 1,
      });
    }
  }, [user]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    setMessage(null);
    try {
      await updateProfile({
        fullName: profileForm.fullName,
        currencyCode: profileForm.currencyCode,
        appWebUrl: profileForm.appWebUrl,
        avatarUrl: profileForm.avatarUrl,
        billingCycleDay: profileForm.billingCycleDay,
      });
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al actualizar el perfil.' });
    }
  };

  const handlePasswordSave = async () => {
    setMessage(null);
    if (!pwdForm.currentPassword) {
      return setMessage({ type: 'error', text: 'Ingresa tu contraseña actual.' });
    }
    if (pwdForm.newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return setMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
    }
    try {
      await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña.' });
    }
  };

  const copyUrl = () => {
    if (profileForm.appWebUrl) {
      navigator.clipboard.writeText(profileForm.appWebUrl);
      setMessage({ type: 'success', text: 'URL copiada al portapapeles.' });
    }
  };

  return (
    <Box sx={{ pb: 10, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
        Mi Perfil
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Configura tu cuenta, seguridad y preferencias de la aplicación.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── DATOS PERSONALES Y PREFERENCIAS ── */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}
                src={profileForm.avatarUrl || undefined}
              >
                {profileForm.fullName?.charAt(0) ?? 'U'}
              </Avatar>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="icon-button-file"
                type="file"
                onChange={handleAvatarSelect}
              />
              <label htmlFor="icon-button-file">
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.default' }
                  }}
                  size="small"
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </label>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{user?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Chip size="small" label="Cuenta Activa" color="success" sx={{ mt: 1, fontWeight: 700 }} />
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" /> Datos y Preferencias
          </Typography>

          <Stack spacing={3}>
            <TextField
              label="Nombre Completo"
              fullWidth
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
            />

            <TextField
              label="Correo Electrónico"
              fullWidth
              value={profileForm.email}
              disabled
              helperText="El correo no se puede cambiar por el momento."
            />

            <FormControl fullWidth>
              <InputLabel>Moneda Principal</InputLabel>
              <Select
                value={profileForm.currencyCode}
                label="Moneda Principal"
                onChange={(e) => setProfileForm({ ...profileForm, currencyCode: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Día de Corte Mensual (Porcentajes)</InputLabel>
              <Select
                value={profileForm.billingCycleDay}
                label="Día de Corte Mensual (Porcentajes)"
                onChange={(e) => setProfileForm({ ...profileForm, billingCycleDay: Number(e.target.value) })}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <MenuItem key={day} value={day}>
                    {day === 31 ? '31 (Fin de mes)' : `Día ${day}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom display="flex" alignItems="center" gap={1}>
                <LanguageIcon fontSize="small" color="primary" /> Acceso Web de la Aplicación
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Esta URL es informativa para ayudarte a recordar dónde está alojada tu plataforma web.
              </Typography>
              <TextField
                label="URL Web App"
                fullWidth
                placeholder="Ej: https://miapp.com"
                value={profileForm.appWebUrl}
                onChange={(e) => setProfileForm({ ...profileForm, appWebUrl: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {profileForm.appWebUrl && (
                        <>
                          <IconButton onClick={copyUrl} edge="end" title="Copiar URL">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                          <IconButton onClick={() => window.open(profileForm.appWebUrl, '_blank')} edge="end" title="Abrir enlace">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ textAlign: 'right', pt: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleProfileSave}
                disabled={isLoading}
              >
                Guardar Cambios
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ── SEGURIDAD E INGRESO ── */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
            <VpnKeyIcon color="primary" /> Seguridad
          </Typography>

          <Stack spacing={3}>
            <TextField
              label="Contraseña Actual"
              type="password"
              fullWidth
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            />
            <TextField
              label="Nueva Contraseña"
              type="password"
              fullWidth
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              helperText="Mínimo 6 caracteres"
            />
            <TextField
              label="Confirmar Nueva Contraseña"
              type="password"
              fullWidth
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
            />
            <Box sx={{ textAlign: 'right', pt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handlePasswordSave}
                disabled={isLoading || !pwdForm.currentPassword || !pwdForm.newPassword}
              >
                Actualizar Contraseña
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Notificaciones Push ─────────────────────────── */}
      {isSupported && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <NotificationsActiveIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>🔔 Notificaciones Push</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Recibe recordatorios automáticos cuando tus gastos fijos estén próximos a vencer.
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={toggle}
                    disabled={nLoading}
                    color="primary"
                  />
                }
                label={isEnabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
              />
              {nLoading && <CircularProgress size={20} />}
              {isEnabled && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={sendTest}
                  startIcon={<NotificationsActiveIcon />}
                >
                  Enviar prueba
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
