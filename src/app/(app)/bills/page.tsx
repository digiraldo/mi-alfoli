'use client';
import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, Stack, IconButton, Tooltip,
  Divider, alpha, Avatar, LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import SavingsIcon from '@mui/icons-material/Savings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useBillStore } from '@/store/useBillStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import { MonthlyBill } from '@/types';

const DEFAULT_COLORS = [
  '#006064', '#FFB300', '#BF360C', '#00838F', '#4DD0E1', '#E64A19', '#7CB342', 
  '#5E35B1', '#E91E63', '#1976D2', '#388E3C', '#FBC02D', '#8D6E63', '#607D8B'
];

const EMPTY_BILL = { name: '', provider: '', dueDay: 15, amount: 0, color: '#006064', isActive: true, isVariableAmount: false };

export default function BillsPage() {
  const theme = useTheme();
  const { bills, addBill, updateBill, deleteBill, markAsPaid, getBillStatus } = useBillStore();
  const { user } = useAuthStore();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MonthlyBill | null>(null);
  const [form, setForm] = useState({ ...EMPTY_BILL });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [payConfirm, setPayConfirm] = useState<MonthlyBill | null>(null);

  const activeBills = bills.filter((b) => b.isActive);
  const totalMonthly = activeBills.reduce((s, b) => s + b.amount, 0);
  const paidCount = activeBills.filter((b) => getBillStatus(b.id, currentYear, currentMonth) === 'paid').length;
  const overdueCount = activeBills.filter((b) => getBillStatus(b.id, currentYear, currentMonth) === 'overdue').length;

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_BILL });
    setDialogOpen(true);
  };

  const openEdit = (bill: MonthlyBill) => {
    setEditing(bill);
    setForm({ name: bill.name, provider: bill.provider ?? '', dueDay: bill.dueDay, amount: bill.amount, color: bill.color, isActive: bill.isActive, isVariableAmount: bill.isVariableAmount ?? false });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || form.amount <= 0) return;
    if (editing) {
      updateBill(editing.id, form);
    } else {
      addBill(form);
    }
    setDialogOpen(false);
  };

  const handleMarkPaid = (bill: MonthlyBill) => {
    markAsPaid(bill.id, currentYear, currentMonth, bill.amount);
    setPayConfirm(null);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid': return { label: 'Pagado', color: '#4CAF50', icon: <CheckCircleIcon fontSize="small" /> };
      case 'overdue': return { label: 'Vencida', color: '#BF360C', icon: <WarningIcon fontSize="small" /> };
      default: return { label: 'Pendiente', color: '#FF9800', icon: <AccessTimeIcon fontSize="small" /> };
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Cuentas Mensuales</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Administra tus obligaciones fijas del mes
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ fontWeight: 700 }}>
          Nueva cuenta
        </Button>
      </Box>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL MES ESTIMADO</Typography>
                <Typography variant="h5" fontWeight={800} color="primary">{formatCurrency(totalMonthly, user?.currencyCode)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Pagadas</Typography>
              <Typography variant="h5" fontWeight={800} color="#4CAF50">{paidCount}/{activeBills.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Vencidas</Typography>
              <Typography variant="h5" fontWeight={800} color={overdueCount > 0 ? '#BF360C' : 'text.secondary'}>{overdueCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress overall */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>Progreso del mes</Typography>
            <Typography variant="body2" fontWeight={700} color="primary">{Math.round((paidCount / activeBills.length) * 100) || 0}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={activeBills.length > 0 ? (paidCount / activeBills.length) * 100 : 0}
            sx={{ height: 10, borderRadius: 5, bgcolor: alpha('#006064', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#006064', borderRadius: 5 } }}
          />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {paidCount} de {activeBills.length} cuentas pagadas
          </Typography>
        </CardContent>
      </Card>

      {/* Bills list */}
      <Grid container spacing={2.5}>
        {activeBills
          .sort((a, b) => a.dueDay - b.dueDay)
          .map((bill) => {
            const status = getBillStatus(bill.id, currentYear, currentMonth);
            const statusConfig = getStatusConfig(status);
            const daysLeft = bill.dueDay - today.getDate();
            return (
              <Grid item xs={12} sm={6} md={4} key={bill.id}>
                <Card sx={{ border: `1px solid ${alpha(statusConfig.color, 0.3)}`, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                        <Avatar sx={{ bgcolor: alpha(bill.color, 0.15), width: 44, height: 44 }}>
                          <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: bill.color }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>{bill.name}</Typography>
                          {bill.provider && (
                            <Typography variant="caption" color="text.secondary">{bill.provider}</Typography>
                          )}
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={0.3}>
                        <IconButton size="small" onClick={() => openEdit(bill)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(bill.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={800}>{formatCurrency(bill.amount, user?.currencyCode)}</Typography>
                        {bill.isVariableAmount && (
                          <Tooltip title="El monto de esta cuenta puede variar cada mes.">
                            <Chip
                              icon={<HelpOutlineIcon />}
                              label="Monto variable"
                              size="small"
                              sx={{
                                mt: 0.5,
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Tooltip>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Vence día {bill.dueDay}
                          {status !== 'paid' && (daysLeft >= 0 ? ` · ${daysLeft}d restantes` : ' · VENCIDA')}
                        </Typography>
                      </Box>
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(statusConfig.color, 0.1),
                          color: statusConfig.color,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>

                    {status !== 'paid' && (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setPayConfirm(bill)}
                        sx={{ mt: 2, fontWeight: 600, borderColor: '#4CAF50', color: '#4CAF50', '&:hover': { borderColor: '#4CAF50', bgcolor: alpha('#4CAF50', 0.07) } }}
                      >
                        Marcar como pagada
                      </Button>
                    )}
                    {status === 'paid' && (
                      <Box sx={{ mt: 2, p: 1, borderRadius: 2, bgcolor: alpha('#4CAF50', 0.08), textAlign: 'center' }}>
                        <Typography variant="caption" fontWeight={700} color="#4CAF50">✓ Pagada este mes</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
      </Grid>

      {activeBills.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography fontSize="3rem">🧾</Typography>
          <Typography variant="h6" color="text.secondary" mt={1}>Sin cuentas registradas</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ mt: 2, fontWeight: 700 }}>
            Agregar primera cuenta
          </Button>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editing ? 'Editar cuenta' : 'Nueva cuenta mensual'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Nombre de la cuenta" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus placeholder="Ej: Arriendo, Netflix, Luz..." />
            <TextField label="Proveedor (opcional)" fullWidth value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Ej: EPM, Claro, Netflix..." />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label={`Monto (${user?.currencyCode || 'COP'})`} type="number" fullWidth value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Día de vencimiento" type="number" fullWidth value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: parseInt(e.target.value) || 1 })} inputProps={{ min: 1, max: 31 }} helperText="Día del mes (1-31)" />
              </Grid>
            </Grid>
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Color identificador</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {DEFAULT_COLORS.map((color) => (
                  <Box key={color} onClick={() => setForm({ ...form, color })} sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: color, cursor: 'pointer', border: `3px solid ${form.color === color ? 'white' : 'transparent'}`, outline: form.color === color ? `2px solid ${color}` : 'none', '&:hover': { transform: 'scale(1.1)' }, transition: 'transform 0.15s' }} />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || form.amount <= 0} sx={{ fontWeight: 700, px: 3 }}>
            {editing ? 'Guardar' : 'Agregar cuenta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Confirm */}
      <Dialog open={!!payConfirm} onClose={() => setPayConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Confirmar pago?</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Marcar <strong>{payConfirm?.name}</strong> como pagada por {payConfirm && formatCurrency(payConfirm.amount, user?.currencyCode)}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setPayConfirm(null)}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' }, fontWeight: 700 }} onClick={() => payConfirm && handleMarkPaid(payConfirm)}>
            ✓ Confirmar pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Eliminar cuenta?</DialogTitle>
        <DialogContent><Typography color="text.secondary">Esta acción no se puede deshacer.</Typography></DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => { if (deleteConfirm) { deleteBill(deleteConfirm); setDeleteConfirm(null); } }}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
