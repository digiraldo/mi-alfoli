'use client';
import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Slider, Stack, Grid, alpha, useTheme, Avatar, Chip,
  IconButton, Tooltip, Alert, Divider, LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { usePercentageStore } from '@/store/usePercentageStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import { PercentageRule } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PRESET_COLORS = [
  '#006064', '#FFB300', '#BF360C', '#00838F', '#4DD0E1', '#E64A19', '#7CB342', 
  '#5E35B1', '#E91E63', '#1976D2', '#388E3C', '#FBC02D', '#8D6E63', '#607D8B'
];
const ICONS = ['🙏', '🏦', '🏠', '📈', '❤️', '🎯', '📚', '🌱', '🎬', '💊', '🚗', '✈️', '🛒', '🍽️', '🎮', '📱', '👕', '💡', '🎵', '🏥'];

const EMPTY_RULE = { name: '', percentage: 10, color: '#006064', icon: '🎯', description: '', isActive: true, priority: 0 };

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function PercentagesPage() {
  const theme = useTheme();
  const { rules, executions, fetchRules, fetchExecutions, addRule, updateRule, deleteRule, getTotalPercentage } = usePercentageStore();
  const { transactions } = useTransactionStore();
  const { user } = useAuthStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PercentageRule | null>(null);
  const [form, setForm] = useState({ ...EMPTY_RULE });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const totalPct = getTotalPercentage();
  const totalIncome = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return tx.type === 'income' && d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  }).reduce((s, tx) => s + tx.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_RULE });
    setDialogOpen(true);
  };

  const openEdit = (rule: PercentageRule) => {
    setEditing(rule);
    setForm({ name: rule.name, percentage: rule.percentage, color: rule.color, icon: rule.icon, description: rule.description ?? '', isActive: rule.isActive, priority: rule.priority });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) {
      updateRule(editing.id, form);
    } else {
      addRule(form);
    }
    setDialogOpen(false);
  };

  const getExecution = (ruleId: string) =>
    executions.find((e) => e.percentageRuleId === ruleId && e.year === currentYear && e.month === currentMonth);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Sistema de Porcentajes</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Distribuye tus ingresos con propósito — {format(today, 'MMMM yyyy', { locale: es })}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ fontWeight: 700 }}>
          Nueva regla
        </Button>
      </Box>

      {/* Total indicator */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>Distribución total</Typography>
            <Chip
              icon={totalPct === 100 ? <CheckCircleIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
              label={`${totalPct}% asignado`}
              color={totalPct === 100 ? 'success' : totalPct > 100 ? 'error' : 'warning'}
              sx={{ fontWeight: 700 }}
            />
          </Box>
          {totalPct !== 100 && (
            <Alert severity={totalPct > 100 ? 'error' : 'warning'} sx={{ mb: 2, borderRadius: 2 }}>
              {totalPct > 100
                ? `Excedes el 100% por ${totalPct - 100}%. Ajusta los porcentajes.`
                : `Tienes ${100 - totalPct}% sin asignar. Considera agregarlo a ahorro o inversión.`}
            </Alert>
          )}
          {/* Visual stacked bar */}
          <Box sx={{ display: 'flex', height: 32, borderRadius: 2, overflow: 'hidden', gap: 0.3 }}>
            {rules.filter(r => r.isActive).map((rule) => (
              <Tooltip key={rule.id} title={`${rule.name}: ${rule.percentage}%`}>
                <Box
                  sx={{
                    flex: rule.percentage,
                    bgcolor: rule.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'flex 0.4s ease',
                    cursor: 'default',
                    '&:hover': { opacity: 0.85 },
                  }}
                >
                  {rule.percentage >= 8 && (
                    <Typography variant="caption" fontWeight={700} color="white" fontSize="0.65rem">
                      {rule.percentage}%
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            ))}
            {totalPct < 100 && (
              <Box sx={{ flex: 100 - totalPct, bgcolor: alpha('#9E9E9E', 0.2), borderRadius: 1 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {rules.filter(r => r.isActive).map((rule) => (
              <Box key={rule.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: rule.color }} />
                <Typography variant="caption" color="text.secondary">{rule.name}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Rules */}
      <Grid container spacing={2.5}>
        {rules.map((rule) => {
          const exec = getExecution(rule.id);
          const allocated = exec?.allocatedAmount ?? (totalIncome * rule.percentage / 100);
          const executed = exec?.executedAmount ?? 0;
          const pct = allocated > 0 ? Math.min(Math.round((executed / allocated) * 100), 100) : 0;
          const surplus = allocated - executed;

          return (
            <Grid item xs={12} sm={6} md={4} key={rule.id}>
              <Card sx={{ height: '100%', border: `1px solid ${alpha(rule.color, 0.3)}` }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Rule header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: alpha(rule.color, 0.15), width: 48, height: 48, fontSize: '1.4rem' }}>
                        {rule.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{rule.name}</Typography>
                        <Chip label={`${rule.percentage}%`} size="small" sx={{ bgcolor: alpha(rule.color, 0.12), color: rule.color, fontWeight: 700, fontSize: '0.7rem' }} />
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => openEdit(rule)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(rule.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>

                  {rule.description && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>{rule.description}</Typography>
                  )}

                  {/* Progress */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Ejecución del mes</Typography>
                      <Typography variant="caption" fontWeight={700} color={pct >= 100 ? 'success.main' : 'text.primary'}>{pct}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: alpha(rule.color, 0.12),
                        '& .MuiLinearProgress-bar': { bgcolor: rule.color, borderRadius: 5 },
                      }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">Ejecutado: {formatCurrency(executed, user?.currencyCode)}</Typography>
                      <Typography variant="caption" color="text.secondary">Asignado: {formatCurrency(allocated, user?.currencyCode)}</Typography>
                    </Box>

                    {surplus > 0 && (
                      <Typography variant="caption" color="success.main" fontWeight={700} display="block" mt={0.5} textAlign="right">
                        Pendiente: {formatCurrency(surplus, user?.currencyCode)}
                      </Typography>
                    )}
                    {pct >= 100 && (
                      <Chip size="small" icon={<CheckCircleIcon fontSize="small" />} label="¡Completado!" color="success" sx={{ mt: 1, fontSize: '0.7rem' }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {rules.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography fontSize="3rem">📊</Typography>
          <Typography variant="h6" color="text.secondary" mt={1}>Sin reglas configuradas</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ mt: 2, fontWeight: 700 }}>
            Crear primera regla
          </Button>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editing ? 'Editar regla' : 'Nueva regla de porcentaje'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de la regla"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
              placeholder="Ej: Ahorro, Inversión, Diezmo..."
            />
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Porcentaje</Typography>
                <Typography variant="body2" fontWeight={800} color="primary">{form.percentage}%</Typography>
              </Box>
              <Slider
                value={form.percentage}
                onChange={(_, val) => setForm({ ...form, percentage: val as number })}
                min={1}
                max={100}
                step={1}
                marks={[{ value: 10 }, { value: 20 }, { value: 30 }, { value: 50 }]}
                sx={{ color: form.color }}
              />
              <Typography variant="caption" color="text.secondary">
                Actual total: {totalPct}% | Con esta regla: {editing ? totalPct - editing.percentage + form.percentage : totalPct + form.percentage}%
              </Typography>
            </Box>
            <TextField
              label="Descripción (opcional)"
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
            />
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Ícono</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {ICONS.map((icon) => (
                  <Box
                    key={icon}
                    onClick={() => setForm({ ...form, icon })}
                    sx={{
                      width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem', cursor: 'pointer', border: `2px solid ${form.icon === icon ? form.color : 'transparent'}`,
                      bgcolor: alpha(form.color, form.icon === icon ? 0.15 : 0.05),
                      '&:hover': { bgcolor: alpha(form.color, 0.1) },
                    }}
                  >
                    {icon}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Color</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {PRESET_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    sx={{
                      width: 32, height: 32, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                      border: `3px solid ${form.color === color ? 'white' : 'transparent'}`,
                      outline: form.color === color ? `2px solid ${color}` : 'none',
                      '&:hover': { transform: 'scale(1.1)' },
                      transition: 'transform 0.15s',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name} sx={{ fontWeight: 700, px: 3 }}>
            {editing ? 'Guardar' : 'Crear regla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Eliminar regla?</DialogTitle>
        <DialogContent><Typography color="text.secondary">Esta acción no se puede deshacer.</Typography></DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => { if (deleteConfirm) { deleteRule(deleteConfirm); setDeleteConfirm(null); } }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
