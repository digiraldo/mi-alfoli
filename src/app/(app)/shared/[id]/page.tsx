'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Divider,
  Avatar, List, ListItem, ListItemAvatar, ListItemText,
  IconButton, useTheme, alpha, Chip, Stack, Tab, Tabs,
  Paper, Tooltip, CircularProgress,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import BalanceIcon from '@mui/icons-material/Balance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { useSharedStore } from '@/store/useSharedStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SharedGroupDetailPage() {
  const { id } = useParams() as { id: string };
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentGroup, currentBalances, isLoading, fetchGroupById, fetchBalances } = useSharedStore();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchGroupById(id);
      fetchBalances(id);
    }
  }, [id]);

  const copyId = () => {
    navigator.clipboard.writeText(id);
    alert('ID del grupo copiado al portapapeles');
  };

  if (isLoading && !currentGroup) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentGroup) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6">Grupo no encontrado</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/shared')} sx={{ mt: 2 }}>
          Volver a Grupos
        </Button>
      </Box>
    );
  }

  const allParticipants = [
    { ...currentGroup.owner, isOwner: true },
    ...(currentGroup.members || []).map(m => ({ ...m.user, isOwner: false }))
  ];

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/shared')}
          sx={{ mb: 2, color: 'text.secondary', textTransform: 'none' }}
        >
          Volver a Mis Eventos
        </Button>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, borderRadius: 4, bgcolor: alpha(currentGroup.color || theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(currentGroup.color || theme.palette.primary.main, 0.1)}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box 
              sx={{ 
                width: 64, height: 64, borderRadius: 3, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: currentGroup.color || theme.palette.primary.main,
                color: '#fff', fontSize: '2rem', boxShadow: 3
              }}
            >
              {currentGroup.icon || '🌴'}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{currentGroup.title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'background.paper', px: 1, py: 0.2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                  ID: {id.split('-')[0]}...
                </Typography>
                <IconButton size="small" onClick={copyId}><ContentCopyIcon sx={{ fontSize: '1rem' }} /></IconButton>
              </Stack>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Presupuesto</Typography>
              <Typography variant="h6" fontWeight={700}>
                {currentGroup.totalBudget ? formatCurrency(currentGroup.totalBudget, user?.currencyCode) : '---'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Gasto Total</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">
                {formatCurrency(currentBalances?.totalSpent || 0, user?.currencyCode)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={(_, v) => setTabValue(v)} 
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Gastos" />
        <Tab icon={<BalanceIcon />} iconPosition="start" label="Balances y Liquidación" />
        <Tab icon={<PeopleIcon />} iconPosition="start" label="Participantes" />
      </Tabs>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ fontSize: '1rem' }} /> Solo los egresos registrados por los participantes aparecen aquí.
          </Typography>
          <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
            <List disablePadding>
              {(currentGroup.transactions || []).map((tx, idx) => (
                <React.Fragment key={tx.id}>
                  <ListItem sx={{ py: 2, px: 3 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                        {tx.type === 'expense' ? '💸' : '💰'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography variant="body1" fontWeight={600}>{tx.description}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Pagado por <b>{tx.user?.fullName || 'Usuario'}</b> • {format(parseISO(tx.date), "PPP", { locale: es })}
                        </Typography>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight={800} color="error.main">
                        -{formatCurrency(tx.amount, user?.currencyCode)}
                      </Typography>
                      <Chip label={tx.category?.name || 'Gasto'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    </Box>
                  </ListItem>
                  {idx < (currentGroup.transactions?.length || 0) - 1 && <Divider />}
                </React.Fragment>
              ))}
              {(!currentGroup.transactions || currentGroup.transactions.length === 0) && (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Typography color="text.secondary">No hay gastos registrados en este grupo aún.</Typography>
                  <Typography variant="caption">Ve a la sección de Transacciones y vincula un gasto a este grupo.</Typography>
                </Box>
              )}
            </List>
          </Card>
        </Box>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Balances list */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>¿Quién ha pagado?</Typography>
            <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
              <List disablePadding>
                {(currentBalances?.balances || []).map((b, idx) => (
                  <React.Fragment key={b.userId}>
                    <ListItem sx={{ py: 2, px: 3 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: b.balance >= 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1) }}>
                          {b.balance >= 0 ? <CheckCircleIcon color="success" /> : '🤔'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="body2" fontWeight={700}>{b.name} {b.userId === user?.id && '(Tú)'}</Typography>}
                        secondary={`Aportó: ${formatCurrency(b.paid, user?.currencyCode)}`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={800} color={b.balance >= 0 ? 'success.main' : 'error.main'}>
                          {b.balance >= 0 
                            ? `Le deben ${formatCurrency(b.balance, user?.currencyCode)}` 
                            : `Debe ${formatCurrency(Math.abs(b.balance), user?.currencyCode)}`
                          }
                        </Typography>
                      </Box>
                    </ListItem>
                    {idx < (currentBalances?.balances.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>

          {/* Settlements logic */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Sugerencia para Saldar ⚖️</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(currentBalances?.settlements || []).map((s, idx) => (
                <Card key={idx} elevation={0} sx={{ 
                  borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.03), 
                  border: `1px solid ${theme.palette.primary.light}`, position: 'relative', overflow: 'hidden'
                }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: 'primary.main' }} />
                  <CardContent sx={{ p: '16px !important' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block">Deudor</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{s.fromName}</Typography>
                      </Box>
                      <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={800} color="primary">Paga</Typography>
                        <Typography variant="h6" fontWeight={900}>{formatCurrency(s.amount, user?.currencyCode)}</Typography>
                        <ArrowBackIcon sx={{ transform: 'rotate(180deg)', mt: 0.5, color: 'primary.main' }} />
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block">Acreedor</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{s.toName}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              {(!currentBalances?.settlements || currentBalances.settlements.length === 0) && (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 4, border: `1px dashed ${theme.palette.success.main}` }}>
                  <Typography fontWeight={700} color="success.main">¡Cuentas Saldadas!</Typography>
                  <Typography variant="caption" color="success.main">No hay deudas pendientes en este grupo.</Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {allParticipants.map((p: any) => (
            <Grid item xs={12} sm={6} md={3} key={p.id}>
              <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, textAlign: 'center', p: 3 }}>
                <Avatar 
                  src={p.avatarUrl} 
                  sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: theme.palette.primary.main }}
                >
                  {p.fullName?.charAt(0)}
                </Avatar>
                <Typography variant="body1" fontWeight={700}>{p.fullName}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{p.email}</Typography>
                {p.isOwner && <Chip label="Administrador" size="small" color="primary" sx={{ mt: 1.5, height: 20, fontSize: '0.65rem' }} />}
              </Card>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip title="Comparte el ID del grupo para que otros se unan">
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<GroupAddIcon />}
                onClick={copyId}
                sx={{ height: '100%', minHeight: 140, borderRadius: 4, borderStyle: 'dashed', flexDirection: 'column' }}
              >
                Invitar Amigo
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
