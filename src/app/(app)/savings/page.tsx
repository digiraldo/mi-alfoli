'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, LinearProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, Stack, Chip,
  Avatar, Tooltip, Divider, List, ListItem, ListItemText, ListItemAvatar,
  alpha, useTheme, Fab, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SavingsIcon from '@mui/icons-material/Savings';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { useSavingsStore } from '@/store/useSavingsStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import { SavingsGoal, GoalWithdrawal } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GOAL_ICONS = ['🎯', '🌴', '🏠', '🚗', '✈️', '📚', '💻', '💍', '🏥', '🎓', '💰', '🐷'];
const GOAL_COLORS = [
  '#006064', '#00838F', '#4CAF50', '#8BC34A', '#FFB300', '#FF9800',
  '#BF360C', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#607D8B',
];
const EMERGENCY_CATEGORIES = [
  { value: 'health', label: '🏥 Salud / Médico' },
  { value: 'repair', label: '🔧 Reparación' },
  { value: 'job_loss', label: '💼 Desempleo' },
  { value: 'accident', label: '🚨 Accidente' },
  { value: 'travel', label: '✈️ Viaje urgente' },
  { value: 'food', label: '🍽️ Alimentación' },
  { value: 'other', label: '📋 Otro' },
];

export default function SavingsPage() {
  const theme = useTheme();
  const { goals, fetchGoals, createGoal, updateGoal, deleteGoal, deposit, withdraw, getWithdrawals } = useSavingsStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { user } = useAuthStore();

  // Estados de modales
  const [goalDialog, setGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [depositDialog, setDepositDialog] = useState<SavingsGoal | null>(null);
  const [withdrawDialog, setWithdrawDialog] = useState<SavingsGoal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<SavingsGoal | null>(null);
  const [withdrawals, setWithdrawals] = useState<GoalWithdrawal[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<SavingsGoal | null>(null);

  // Formulario nueva/editar meta
  const [form, setForm] = useState({
    name: '', type: 'goal' as 'emergency' | 'goal',
    icon: '🎯', color: '#006064',
    targetAmount: '', currentAmount: '0',
    accountId: '', deadline: '', notes: '',
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', reason: '', category: 'other' });

  useEffect(() => { fetchGoals(); fetchAccounts(); }, []);

  const emergencyFund = goals.find((g) => g.type === 'emergency');
  const regularGoals = goals.filter((g) => g.type === 'goal');

  const openCreateDialog = (type: 'emergency' | 'goal') => {
    setEditingGoal(null);
    setForm({
      name: type === 'emergency' ? 'Fondo de Emergencias' : '',
      type, icon: type === 'emergency' ? '🛡️' : '🎯',
      color: type === 'emergency' ? '#BF360C' : '#006064',
      targetAmount: '', currentAmount: '0',
      accountId: '', deadline: '', notes: '',
    });
    setGoalDialog(true);
  };

  const openEditDialog = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name, type: goal.type,
      icon: goal.icon, color: goal.color,
      targetAmount: goal.targetAmount?.toString() || '',
      currentAmount: goal.currentAmount.toString(),
      accountId: goal.accountId || '',
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      notes: goal.notes || '',
    });
    setGoalDialog(true);
  };

  const handleSaveGoal = async () => {
    try {
      const data = {
        name: form.name,
        type: form.type,
        icon: form.icon,
        color: form.color,
        targetAmount: form.targetAmount ? parseFloat(form.targetAmount) : null,
        currentAmount: parseFloat(form.currentAmount) || 0,
        accountId: form.accountId || null,
        deadline: form.deadline || null,
        notes: form.notes || null,
      };
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
      } else {
        await createGoal(data);
      }
      setGoalDialog(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeposit = async () => {
    if (!depositDialog || !depositAmount) return;
    await deposit(depositDialog.id, parseFloat(depositAmount));
    setDepositDialog(null);
    setDepositAmount('');
  };

  const handleWithdraw = async () => {
    if (!withdrawDialog) return;
    await withdraw(withdrawDialog.id, parseFloat(withdrawForm.amount), withdrawForm.reason, withdrawForm.category);
    setWithdrawDialog(null);
    setWithdrawForm({ amount: '', reason: '', category: 'other' });
  };

  const openHistory = async (goal: SavingsGoal) => {
    setHistoryGoal(goal);
    const w = await getWithdrawals(goal.id);
    setWithdrawals(w);
  };

  const getProgress = (goal: SavingsGoal) => {
    if (!goal.targetAmount || goal.targetAmount <= 0) return null;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const GoalCard = ({ goal }: { goal: SavingsGoal }) => {
    const progress = getProgress(goal);
    const isEmergency = goal.type === 'emergency';
    return (
      <Card sx={{
        border: isEmergency ? `2px solid ${alpha('#BF360C', 0.5)}` : 'none',
        background: isEmergency ? alpha('#BF360C', 0.03) : undefined,
        height: '100%',
      }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: alpha(goal.color, 0.15), width: { xs: 38, sm: 48 }, height: { xs: 38, sm: 48 }, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                {goal.icon}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{goal.name}</Typography>
                {isEmergency && (
                  <Chip icon={<ShieldIcon />} label="Emergencia" size="small"
                    sx={{ bgcolor: alpha('#BF360C', 0.1), color: '#BF360C', fontSize: '0.65rem', height: 18 }} />
                )}
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Historial de retiros"><IconButton size="small" onClick={() => openHistory(goal)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Editar"><IconButton size="small" onClick={() => openEditDialog(goal)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(goal)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {/* Montos */}
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Acumulado</Typography>
              <Typography
                fontWeight={800}
                sx={{ color: goal.color, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                {formatCurrency(goal.currentAmount, user?.currencyCode)}
              </Typography>
            </Box>
            {goal.targetAmount && (
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Meta</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(goal.targetAmount, user?.currencyCode)}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Barra de progreso */}
          {progress !== null && (
            <Box sx={{ mb: 1.5 }}>
              <LinearProgress
                variant="determinate" value={progress}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: alpha(goal.color, 0.15),
                  '& .MuiLinearProgress-bar': { bgcolor: goal.color, borderRadius: 4 },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ float: 'right', mt: 0.3 }}>
                {progress.toFixed(1)}%
              </Typography>
            </Box>
          )}

          {goal.isCompleted && (
            <Chip label="✅ Meta alcanzada" color="success" size="small" sx={{ mb: 1 }} />
          )}

          {goal.deadline && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              📅 Fecha límite: {format(new Date(goal.deadline), "d 'de' MMMM, yyyy", { locale: es })}
            </Typography>
          )}

          {goal.accountId && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              🏦 {accounts.find((a) => a.id === goal.accountId)?.name ?? 'Cuenta vinculada'}
            </Typography>
          )}
          {!goal.accountId && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              💵 Efectivo / Sin cuenta
            </Typography>
          )}

          {/* Botones de acción */}
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button
              variant="contained" size="small" fullWidth
              startIcon={<NorthIcon />}
              sx={{ bgcolor: goal.color, '&:hover': { bgcolor: alpha(goal.color, 0.85) }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              onClick={() => setDepositDialog(goal)}
            >
              Depositar
            </Button>
            <Button
              variant="outlined" size="small" fullWidth
              startIcon={<SouthIcon />}
              color="error"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              onClick={() => setWithdrawDialog(goal)}
              disabled={goal.currentAmount <= 0}
            >
              Retirar
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>🎯 Fondos y Metas de Ahorro</Typography>
          <Typography variant="body2" color="text.secondary">
            Construye tu seguridad financiera, paso a paso.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: { xs: 1, sm: 0 } }}>
          {!emergencyFund && (
            <Button variant="outlined" color="error" startIcon={<ShieldIcon />} onClick={() => openCreateDialog('emergency')}>
              Fondo Emergencias
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreateDialog('goal')}>
            Nueva Meta
          </Button>
        </Stack>
      </Stack>

      {/* Fondo de Emergencias destacado */}
      {emergencyFund && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>🛡️ Fondo de Emergencias</Typography>
          <GoalCard goal={emergencyFund} />
        </Box>
      )}

      {!emergencyFund && (
        <Card sx={{ mb: 3, border: `2px dashed ${alpha('#BF360C', 0.4)}`, bgcolor: alpha('#BF360C', 0.02) }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <ShieldIcon sx={{ fontSize: 48, color: alpha('#BF360C', 0.5), mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">Sin fondo de emergencias</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Se recomienda tener entre 3-6 meses de gastos ahorrados para emergencias.
            </Typography>
            <Button variant="contained" color="error" startIcon={<ShieldIcon />} onClick={() => openCreateDialog('emergency')}>
              Crear Fondo de Emergencias
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metas de ahorro */}
      {regularGoals.length > 0 && (
        <>
          <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
            🎯 Mis Metas de Ahorro
          </Typography>
          <Grid container spacing={2}>
            {regularGoals.map((goal) => (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <GoalCard goal={goal} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {goals.length === 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <SavingsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Aún no tienes metas de ahorro</Typography>
            <Typography variant="body2" color="text.secondary">Crea tu primera meta para empezar a construir tu futuro.</Typography>
          </CardContent>
        </Card>
      )}

      {/* FAB — sobre el bottom nav en móvil */}
      <Fab color="primary" sx={{ position: 'fixed', bottom: { xs: 70, md: 32 }, right: 20 }} onClick={() => openCreateDialog('goal')}>
        <AddIcon />
      </Fab>

      {/* ── MODAL: Nueva / Editar Meta ─────────────────────── */}
      <Dialog open={goalDialog} onClose={() => setGoalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editingGoal ? 'Editar fondo / meta' : form.type === 'emergency' ? '🛡️ Fondo de Emergencias' : '🎯 Nueva Meta de Ahorro'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {/* Nombre */}
            <TextField label="Nombre" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            {/* Ícono y color en fila */}
            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Ícono</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {GOAL_ICONS.map((ic) => (
                    <Box key={ic} onClick={() => setForm({ ...form, icon: ic })}
                      sx={{ cursor: 'pointer', p: 0.5, borderRadius: 1, border: form.icon === ic ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent', fontSize: '1.4rem' }}>
                      {ic}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>

            {/* Colores */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Color</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.8}>
                {GOAL_COLORS.map((col) => (
                  <Box key={col} onClick={() => setForm({ ...form, color: col })}
                    sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: col, cursor: 'pointer', border: form.color === col ? `3px solid ${theme.palette.text.primary}` : '3px solid transparent' }} />
                ))}
              </Stack>
            </Box>

            {/* Monto objetivo */}
            <TextField
              label="Monto objetivo (opcional)"
              type="number"
              fullWidth
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              helperText="Deja vacío si es un fondo sin límite"
            />

            {/* Monto inicial */}
            <TextField
              label="Monto inicial ahorrado"
              type="number"
              fullWidth
              value={form.currentAmount}
              onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />

            {/* Cuenta vinculada */}
            <FormControl fullWidth>
              <InputLabel>Cuenta vinculada (opcional)</InputLabel>
              <Select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} label="Cuenta vinculada (opcional)">
                <MenuItem value=""><em>💵 Efectivo / Sin cuenta</em></MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>{acc.icon} {acc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Fecha límite */}
            <TextField label="Fecha límite (opcional)" type="date" fullWidth value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            {/* Notas */}
            <TextField label="Notas (opcional)" fullWidth multiline rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setGoalDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveGoal} disabled={!form.name}>
            {editingGoal ? 'Guardar cambios' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: Depositar ────────────────────────────────── */}
      <Dialog open={!!depositDialog} onClose={() => setDepositDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>💰 Depositar en {depositDialog?.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="Monto a depositar"
            type="number"
            fullWidth
            autoFocus
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDepositDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleDeposit} disabled={!depositAmount || parseFloat(depositAmount) <= 0}>
            Depositar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: Retirar ──────────────────────────────────── */}
      <Dialog open={!!withdrawDialog} onClose={() => setWithdrawDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>📤 Retirar de {withdrawDialog?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Monto a retirar"
              type="number"
              fullWidth
              value={withdrawForm.amount}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              helperText={`Disponible: ${formatCurrency(withdrawDialog?.currentAmount ?? 0, user?.currencyCode)}`}
            />
            <FormControl fullWidth>
              <InputLabel>Categoría del gasto</InputLabel>
              <Select value={withdrawForm.category}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, category: e.target.value })}
                label="Categoría del gasto">
                {EMERGENCY_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="¿En qué se usó? (descripción)"
              fullWidth
              multiline
              rows={2}
              value={withdrawForm.reason}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, reason: e.target.value })}
              placeholder="Ej: Consulta médica por dolor de muelas"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setWithdrawDialog(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleWithdraw}
            disabled={!withdrawForm.amount || !withdrawForm.reason || parseFloat(withdrawForm.amount) <= 0}>
            Retirar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: Historial de Retiros ─────────────────────── */}
      <Dialog open={!!historyGoal} onClose={() => setHistoryGoal(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>📋 Historial de Retiros — {historyGoal?.name}</DialogTitle>
        <DialogContent dividers>
          {withdrawals.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No hay retiros registrados aún.
            </Typography>
          ) : (
            <List disablePadding>
              {withdrawals.map((w) => {
                const cat = EMERGENCY_CATEGORIES.find((c) => c.value === w.category);
                return (
                  <ListItem key={w.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha('#BF360C', 0.1), fontSize: '1.2rem' }}>
                        {cat?.label.split(' ')[0] ?? '📋'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{w.reason}</Typography>}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
                          <Chip label={cat?.label ?? w.category} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(w.date), "d MMM, yyyy", { locale: es })}
                          </Typography>
                        </Stack>
                      }
                    />
                    <Typography fontWeight={800} color="error.main">
                      -{formatCurrency(w.amount, user?.currencyCode)}
                    </Typography>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3 }}><Button onClick={() => setHistoryGoal(null)}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* ── MODAL: Confirmar Eliminar ───────────────────────── */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Eliminar {deleteConfirm?.name}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">Esta acción no se puede deshacer. El historial de retiros también se perderá.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={async () => { if (deleteConfirm) { await deleteGoal(deleteConfirm.id); setDeleteConfirm(null); } }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
