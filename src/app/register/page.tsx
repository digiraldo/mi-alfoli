'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, InputAdornment, IconButton,
  Alert, CircularProgress, Paper, alpha, useTheme, Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const theme = useTheme();
  const router = useRouter();
  const { register, loginWithGoogle, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) router.replace('/dashboard');
    return () => clearError();
  }, [isAuthenticated, router, clearError]);

  if (!mounted) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (fullName.trim().length < 2) {
      setLocalError('Ingresa tu nombre completo');
      return;
    }

    await register(email, password, fullName.trim());
  };

  const displayError = localError || error;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
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
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Logo size={56} />
          <Typography variant="h5" fontWeight={800} mt={1.5} color="primary">
            Mi Alfolí
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Crea tu cuenta y comienza a administrar tus finanzas
          </Typography>
        </Box>

        <Typography variant="h6" fontWeight={700} mb={2.5}>
          Crear cuenta
        </Typography>

        {displayError && (
          <Alert severity="error" onClose={() => { clearError(); setLocalError(''); }} sx={{ mb: 2, borderRadius: 2 }}>
            {displayError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleRegister}>
          <TextField
            id="reg-name"
            label="Nombre completo"
            fullWidth
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            sx={{ mb: 2 }}
            required
            disabled={isLoading}
            autoComplete="name"
            autoFocus
          />
          <TextField
            id="reg-email"
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
            id="reg-password"
            label="Contraseña (mín. 6 caracteres)"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
            disabled={isLoading}
            autoComplete="new-password"
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
            disabled={isLoading || !email || !password || !fullName}
            sx={{ fontWeight: 700, py: 1.5, borderRadius: 2, mb: 2 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
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
            onError={() => {
              console.error('Registration/Login with Google Failed');
            }}
            theme="filled_blue"
            shape="rectangular"
            text="signup_with"
            size="large"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: theme.palette.primary.main, fontWeight: 700, textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
