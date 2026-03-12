'use client';
import React, { useState } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, BottomNavigation, BottomNavigationAction, Tooltip, Avatar,
  useMediaQuery, useTheme, alpha, Divider, Paper,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PieChartIcon from '@mui/icons-material/PieChart';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PeopleIcon from '@mui/icons-material/People';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeMode } from '@/components/ThemeRegistry';
import { MiAlfoliLogo } from '@/components/Logo';

// Todos los items de navegación
const allNavItems = [
  { label: 'Inicio', shortLabel: 'Inicio', icon: <HomeIcon />, path: '/dashboard' },
  { label: 'Transacciones', shortLabel: 'Gastos', icon: <AddCircleIcon />, path: '/transactions' },
  { label: 'Gastos Fijos', shortLabel: 'Fijos', icon: <ReceiptIcon />, path: '/bills' },
  { label: 'Porcentajes', shortLabel: '%', icon: <PieChartIcon />, path: '/percentages' },
  { label: 'Fondos y Metas', shortLabel: 'Fondos', icon: <SavingsIcon />, path: '/savings' },
  { label: 'Compartidos', shortLabel: 'Grupos', icon: <PeopleIcon />, path: '/shared' },
  { label: 'Cuentas', shortLabel: 'Cuentas', icon: <AccountBalanceWalletIcon />, path: '/accounts' },
  { label: 'Estadísticas', shortLabel: 'Stats', icon: <BarChartIcon />, path: '/stats' },
];

// En móvil solo mostramos los 5 primeros en el bottom nav; el resto se acceden por menú hamburguesa
const BOTTOM_NAV_ITEMS = allNavItems.slice(0, 5);

const DRAWER_WIDTH = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { mode, toggleTheme } = useThemeMode();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeAllIdx = allNavItems.findIndex((item) => pathname.startsWith(item.path));
  const activeBottomIdx = BOTTOM_NAV_ITEMS.findIndex((item) => pathname.startsWith(item.path));

  const handleNav = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: 2 }}>
      {/* Brand */}
      <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <MiAlfoliLogo size={40} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="primary" lineHeight={1.1}>
            Mi Alfolí
          </Typography>
          <Typography variant="caption" color="text.secondary">Finanzas con Propósito</Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 1 }} />

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1.5 }}>
        {allNavItems.map((item, idx) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNav(item.path)}
              selected={activeAllIdx === idx}
              sx={{
                borderRadius: 3,
                '&.Mui-selected': {
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.12),
                  '&:hover': { bgcolor: alpha(muiTheme.palette.primary.main, 0.18) },
                },
              }}
            >
              <ListItemIcon sx={{ color: activeAllIdx === idx ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: activeAllIdx === idx ? 700 : 400, fontSize: '0.9rem' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      {/* Bottom actions */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 1, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
          onClick={() => handleNav('/profile')}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }} src={user?.avatarUrl || undefined}>
            {user?.fullName?.charAt(0) ?? 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{user?.fullName ?? 'Usuario'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>Ver mi perfil</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={toggleTheme} sx={{ borderRadius: 2 }}>
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={handleLogout} color="error" sx={{ borderRadius: 2 }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  // Título del AppBar: nombre de la sección actual
  const currentPageLabel = allNavItems[activeAllIdx]?.label ?? 'Mi Alfolí';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}
        >
          <Drawer variant="permanent" sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
            {drawerContent}
          </Drawer>
        </Box>
      )}

      {/* Mobile drawer (al abrir el menú hamburguesa) */}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${alpha(muiTheme.palette.divider, 0.6)}`,
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 52, sm: 64 } }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }} size="small">
                <MenuIcon />
              </IconButton>
            )}
            {isMobile && <MiAlfoliLogo size={28} sx={{ mr: 1 }} />}
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ flex: 1, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}
              noWrap
            >
              {currentPageLabel}
            </Typography>
            <Tooltip title="Cambiar tema">
              <IconButton onClick={toggleTheme} size="small" sx={{ mr: 0.5 }}>
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Mi Perfil">
              <IconButton size="small" onClick={() => handleNav('/profile')}>
                <Avatar
                  sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}
                  src={user?.avatarUrl || undefined}
                >
                  {user?.fullName?.charAt(0) ?? 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            pb: { xs: 9, md: 3 },   // espacio para el bottom nav en móvil
            bgcolor: 'background.default',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>

        {/* Mobile Bottom Navigation — 5 items + hamburguesa ya cubre el resto */}
        {isMobile && (
          <Paper
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1100,
              borderTop: `1px solid ${alpha(muiTheme.palette.divider, 0.6)}`,
            }}
            elevation={4}
          >
            <BottomNavigation
              value={activeBottomIdx >= 0 ? activeBottomIdx : false}
              onChange={(_, val) => {
                if (val === 'more') {
                  setMobileOpen(true);
                } else {
                  handleNav(BOTTOM_NAV_ITEMS[val as number].path);
                }
              }}
              sx={{ height: 58 }}
            >
              {BOTTOM_NAV_ITEMS.map((item, i) => (
                <BottomNavigationAction
                  key={item.path}
                  value={i}
                  label={item.shortLabel}
                  icon={item.icon}
                  sx={{
                    minWidth: 0,
                    px: 0.5,
                    '& .MuiBottomNavigationAction-label': {
                      fontSize: '0.6rem',
                      mt: 0.2,
                    },
                  }}
                />
              ))}
              {/* Botón "Más" para acceder a items extra */}
              <BottomNavigationAction
                value="more"
                label="Más"
                icon={<MoreHorizIcon />}
                sx={{
                  minWidth: 0,
                  px: 0.5,
                  '& .MuiBottomNavigationAction-label': { fontSize: '0.6rem', mt: 0.2 },
                }}
              />
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
