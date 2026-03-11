'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, IconButton, useTheme, Fab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, InputAdornment, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import SavingsIcon from '@mui/icons-material/Savings';
import { useAccountStore } from '@/store/useAccountStore';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import { Account } from '@/types';

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Cuenta Bancaria', icon: AccountBalanceIcon },
  { value: 'cash', label: 'Efectivo', icon: PaymentsIcon },
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: CreditCardIcon },
  { value: 'digital_wallet', label: 'Billetera Digital', icon: AccountBalanceWalletIcon },
  { value: 'investment', label: 'Inversión / Ahorro', icon: SavingsIcon },
];

const PRESET_COLORS = [
  '#006064', '#FFB300', '#BF360C', '#00838F', '#4DD0E1', '#E64A19', '#7CB342',
  '#5E35B1', '#E91E63', '#1976D2', '#388E3C', '#FBC02D', '#8D6E63', '#607D8B',
];

export default function AccountsPage() {
  const theme = useTheme();
  const { accounts, fetchAccounts, addAccount, updateAccount, deleteAccount, setDefaultAccount } = useAccountStore();
  const { goals, fetchGoals } = useSavingsStore();
  const { user } = useAuthStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'credit_card' | 'cash' | 'digital_wallet' | 'investment'>('bank');
  const [color, setColor] = useState('#006064');
  const [balance, setBalance] = useState('');
  const [lastFour, setLastFour] = useState('');

  useEffect(() => { fetchAccounts(); fetchGoals(); }, []);

  const handleOpenEdit = (acc?: Account) => {
    if (acc) {
      setEditingId(acc.id);
      setName(acc.name);
      setType(acc.type as any);
      setColor(acc.color);
      setBalance(acc.currentBalance.toString());
      setLastFour(acc.lastFour || '');
    } else {
      setEditingId(null);
      setName('');
      setType('bank');
      setColor('#006064');
      setBalance('0');
      setLastFour('');
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const lf = lastFour.trim().substring(0, 4);
    const data = { 
      name: name.trim(), 
      type, 
      color, 
      icon: '🏦', 
      currentBalance: Number(balance) || 0, 
      isActive: true,
      lastFour: lf || null,
    };
    if (editingId) await updateAccount(editingId, data);
    else await addAccount(data);
    setOpenDialog(false);
  };

  const handleDelete = async (id: string, accName: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar la cuenta "${accName}"? No se borrarán las transacciones asociadas.`)) {
      await deleteAccount(id);
    }
  };

  const totalBalance = accounts.reduce((s, a) => a.type !== 'credit_card' ? s + a.currentBalance : s, 0);
  const totalDebt = accounts.reduce((s, a) => a.type === 'credit_card' ? s + a.currentBalance : s, 0);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header Summary */}
      <Box sx={{
        mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        gap: 1.5,
      }}>
        <Box>
          <Typography fontWeight={800} color="primary" gutterBottom
            sx={{ fontSize: { xs: '1.3rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            Mis Cuentas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra tus cuentas bancarias, tarjetas y efectivo.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>SALDO TOTAL</Typography>
            <Typography fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              {formatCurrency(totalBalance, user?.currencyCode)}
            </Typography>
          </Box>
          {totalDebt > 0 && (
            <Box>
              <Typography variant="caption" color="error.main" fontWeight={700}>DEUDA TC</Typography>
              <Typography fontWeight={800} color="error.main" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                {formatCurrency(totalDebt, user?.currencyCode)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Grid de tarjetas con diseño bancario ── */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {accounts.map((acc) => {
          const accTypeLabel = ACCOUNT_TYPES.find(t => t.value === acc.type)?.label ?? acc.type;
          const isCredit = acc.type === 'credit_card';
          // Si el usuario ingresó un lastFour, se usa ese. Si no, se genera uno visual derivado del ID
          const displayLastFour = acc.lastFour || acc.id.replace(/\D/g, '').slice(-4).padStart(4, '0');

          // Cálculos de Envelope Budgeting (Retención)
          const retainedBalance = goals
            .filter((g) => g.accountId === acc.id && g.isActive)
            .reduce((sum, g) => sum + g.currentAmount, 0);

          const availableBalance = acc.type === 'credit_card' 
            ? acc.currentBalance // No retenemos en deudas de TDC
            : Math.max(0, acc.currentBalance - retainedBalance);

          return (
            <Grid item xs={12} sm={6} md={4} key={acc.id}>
              {/*
                Proporción ISO 7810 ID-1: 85.6 × 53.98 mm → ratio ~1.586
                Usamos aspect-ratio para mantener la forma de tarjeta real.
                borderRadius: 12px = menos redondo, más parecido a una tarjeta física.
              */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1.586 / 1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: `0 6px 24px ${acc.color}55, 0 2px 8px rgba(0,0,0,0.22)`,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 14px 36px ${acc.color}66, 0 4px 14px rgba(0,0,0,0.28)`,
                  },
                  background: `linear-gradient(135deg, ${acc.color} 0%, ${acc.color}cc 55%, ${acc.color}88 100%)`,
                }}
              >
                {/* Círculos decorativos de fondo (no bloquean eventos) */}
                <Box sx={{
                  position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
                  '&::before': {
                    content: '""', position: 'absolute',
                    width: '70%', aspectRatio: '1',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    top: '-25%', right: '-20%',
                  },
                  '&::after': {
                    content: '""', position: 'absolute',
                    width: '50%', aspectRatio: '1',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.1)',
                    bottom: '-20%', left: '-10%',
                  },
                }} />

                {/* Contenido de la tarjeta */}
                <Box sx={{
                  position: 'absolute', inset: 0,
                  p: '5%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  {/* ── FILA SUPERIOR: tipo + nombre + botones ── */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        color: 'rgba(255,255,255,0.72)',
                        fontSize: 'clamp(0.68rem, 1.6vw, 0.82rem)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        lineHeight: 1,
                        mb: '2px',
                      }}>
                        {accTypeLabel}
                      </Typography>
                      <Typography sx={{
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 'clamp(1rem, 2.8vw, 1.2rem)',
                        lineHeight: 1.2,
                        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {acc.name}
                      </Typography>
                    </Box>
                    {/* Botones favorito / editar / eliminar */}
                    <Box sx={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => setDefaultAccount(acc.id)}
                        sx={{
                          color: acc.isDefault ? '#FFD700' : '#fff',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          p: '5px',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                        }}
                        title={acc.isDefault ? "Cuenta Principal" : "Marcar como Principal"}
                      >
                        {acc.isDefault ? <StarIcon sx={{ fontSize: '1.15rem', filter: 'drop-shadow(0px 0px 4px rgba(255, 215, 0, 0.8))' }} /> : <StarBorderIcon sx={{ fontSize: '1.15rem' }} />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(acc)}
                        sx={{
                          color: '#fff',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          p: '5px',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                        }}
                      >
                        <EditIcon sx={{ fontSize: '1.05rem' }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(acc.id, acc.name)}
                        sx={{
                          color: '#ffb3b3',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          p: '5px',
                          '&:hover': { bgcolor: 'rgba(255,80,80,0.35)' },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '1.05rem' }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* ── CHIP EMV + NFC ── */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 'auto' }}>
                    {/* Chip dorado con cuadrícula 3×3 */}
                    <Box sx={{
                      width: 'clamp(38px, 8%, 48px)',
                      aspectRatio: '1.35',
                      background: 'linear-gradient(135deg, #FFD54F 0%, #F57F17 40%, #FFB300 70%, #F9A825 100%)',
                      borderRadius: '5px',
                      border: '1px solid rgba(255,193,7,0.8)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.6)',
                      display: 'grid',
                      gridTemplateRows: '1fr 1fr 1fr',
                      gridTemplateColumns: '1fr 1.2fr 1fr', /* Centro más ancho */
                      gap: '1.5px',
                      p: '3px',
                      alignItems: 'center',
                      justifyItems: 'center'
                    }}>
                      {[...Array(9)].map((_, i) => (
                        <Box key={i} sx={{
                          width: '100%',
                          height: '100%',
                          bgcolor: i === 4 ? 'rgba(230,81,0,0.6)' : 'rgba(230,81,0,0.2)',
                          borderRadius: '1.5px',
                        }} />
                      ))}
                    </Box>
                    {/* NFC / Contactless */}
                    <Typography sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                      transform: 'rotate(90deg)',
                      lineHeight: 1,
                      userSelect: 'none',
                      letterSpacing: '-0.1em',
                    }}>
                      )))
                    </Typography>
                  </Box>

                  {/* ── FILA INTERMEDIA: Retenciones Envelope Budgeting ── */}
                  {!isCredit && retainedBalance > 0 && (
                     <Box sx={{ mt: 'auto', mb: '8px' }}>
                       <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>
                         Retenido en Metas 🔒
                       </Typography>
                       <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>
                         {formatCurrency(retainedBalance, user?.currencyCode)}
                       </Typography>
                     </Box>
                  )}

                  {/* ── FILA INFERIOR: saldo libre + logo de red ── */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '4%', mt: retainedBalance > 0 ? 0 : 'auto' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        color: 'rgba(255,255,255,0.65)',
                        fontSize: 'clamp(0.62rem, 1.3vw, 0.72rem)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                      }}>
                        {isCredit ? 'Saldo deuda' : 'Saldo Disponible Libre'}
                      </Typography>
                      <Typography sx={{
                        color: isCredit && acc.currentBalance > 0 ? '#ffcdd2' : '#fff',
                        fontWeight: 800,
                        fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                        textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                        lineHeight: 1.1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatCurrency(availableBalance, user?.currencyCode)}
                      </Typography>
                    </Box>

                    {/* Logo de red de pago */}
                    <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      {isCredit ? (
                        // Mastercard style
                        <Box sx={{ position: 'relative', width: 44, height: 28 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#EB001B', opacity: 0.9, position: 'absolute', left: 0 }} />
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#F79E1B', opacity: 0.9, position: 'absolute', right: 0 }} />
                        </Box>
                      ) : (
                        <Typography sx={{
                          color: 'rgba(255,255,255,0.88)',
                          fontStyle: 'italic',
                          fontWeight: 900,
                          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          fontFamily: 'Georgia, serif',
                          lineHeight: 1,
                        }}>
                          {acc.type === 'cash' ? '💵' : acc.type === 'investment' ? '📈' : acc.type === 'digital_wallet' ? '📱' : 'BANK'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {accounts.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 4 }}>
          <AccountBalanceIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No tienes cuentas registradas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea tu primera cuenta para empezar a organizar tus finanzas por origen y destino.
          </Typography>
          <Button variant="contained" onClick={() => handleOpenEdit()} startIcon={<AddIcon />}>
            Agregar cuenta
          </Button>
        </Box>
      )}

      {/* FAB */}
      {accounts.length > 0 && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenEdit()}
          sx={{ position: 'fixed', bottom: { xs: 70, md: 32 }, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Formulario Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>{editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Nombre de la cuenta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            placeholder="Ej: Bancolombia, Nequi, Billetera..."
            autoFocus
          />
          <TextField
            select
            fullWidth
            label="Tipo de Cuenta"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            margin="normal"
          >
            {ACCOUNT_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <option.icon fontSize="small" />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Saldo Inicial / Actual"
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            margin="normal"
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            helperText={type === 'credit_card' ? 'Ingresa lo que debes actualmente' : 'Saldo disponible'}
          />
          {['bank', 'credit_card', 'digital_wallet'].includes(type) && (
            <TextField
              fullWidth
              label="Últimos 4 dígitos (Opcional)"
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              margin="normal"
              placeholder="Ej: 4509"
              helperText="Para identificar fácilmente la tarjeta o cuenta en el diseño"
              inputProps={{ maxLength: 4 }}
            />
          )}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
            Color de identificación
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => setColor(c)}
                sx={{
                  width: 36, height: 36, borderRadius: '50%', bgcolor: c,
                  cursor: 'pointer',
                  border: color === c ? '3px solid' : '3px solid transparent',
                  borderColor: color === c ? 'text.primary' : 'transparent',
                  boxShadow: color === c ? theme.shadows[4] : 'none',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
