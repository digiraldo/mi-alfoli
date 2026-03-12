'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, InputAdornment, IconButton,
  Alert, CircularProgress, Divider, Paper, alpha, useTheme, Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useThemeMode } from '@/components/ThemeRegistry';

export default function LoginPage() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('demo@mialfoli.app');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) router.replace('/dashboard');
    return () => clearError();
  }, [isAuthenticated, isAuthenticated, router, clearError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  if (!mounted) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        position: 'relative',
      }}
    >
      {/* Toggle de tema — esquina superior derecha */}
      <Tooltip title={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
          }}
        >
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Tooltip>

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: `1px solid ${alpha('#006064', 0.15)}`,
        }}
      >
        {/* Logo + branding — más grande */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Logo size={150} />
          <Typography variant="h4" fontWeight={800} mt={2} color="primary">
            Mi Alfolí
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            "Traed todos los diezmos al alfolí..." — Mal. 3:10
          </Typography>
        </Box>

        <Typography variant="h6" fontWeight={700} mb={2.5}>
          Iniciar sesión
        </Typography>

        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin}>
          <TextField
            id="login-email"
            label="Correo electrónico"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            required
            disabled={isLoading}
            autoComplete="email"
          />
          <TextField
            id="login-password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
            disabled={isLoading}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading || !email || !password}
            sx={{ fontWeight: 700, py: 1.5, borderRadius: 2, mb: 2 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">O CONTINUAR CON</Typography>
        </Divider>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                loginWithGoogle(credentialResponse.credential);
              }
            }}
            onError={() => { console.error('Login Failed'); }}
            theme={mode === 'dark' ? 'filled_black' : 'filled_blue'}
            shape="rectangular"
            text="signin_with"
            size="large"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: theme.palette.primary.main, fontWeight: 700, textDecoration: 'none' }}>
            Regístrate
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
