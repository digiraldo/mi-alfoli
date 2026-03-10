'use client';
import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Select, InputLabel, FormControl, Chip, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, IconButton, Stack, Divider, alpha, useTheme,
  ToggleButton, ToggleButtonGroup, InputAdornment, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAccountStore } from '@/store/useAccountStore';
import { usePercentageStore } from '@/store/usePercentageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import { Transaction } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const EMPTY_TX: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  type: 'expense',
  amount: 0,
  description: '',
  categoryId: '', // Empezará vacío, lo llenaremos dinámicamente al abrir el modal
  accountId: '', // Por defecto no hay cuenta seleccionada
  percentageRuleId: '', 
  date: new Date().toISOString().split('T')[0],
};

export default function TransactionsPage() {
  const theme = useTheme();
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { rules, fetchRules } = usePercentageStore();
  const { user } = useAuthStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({ ...EMPTY_TX });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getCat = (id: string) => categories.find((c) => c.id === id);
  const getAcc = (id?: string) => accounts.find((a) => a.id === id);
  const getRule = (id?: string) => rules.find((r) => r.id === id);

  React.useEffect(() => {
    fetchAccounts();
    fetchRules();
  }, []);

  const filtered = useMemo(() => {
    let txs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterType !== 'all') txs = txs.filter((tx) => tx.type === filterType);
    if (search) txs = txs.filter((tx) => tx.description.toLowerCase().includes(search.toLowerCase()));
    return txs;
  }, [transactions, filterType, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      const key = tx.date.slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [filtered]);

  const openAdd = (type: 'income' | 'expense') => {
    setEditing(null);
    const defaultCat = categories.find((c) => c.type === type)?.id || '';
    setForm({ ...EMPTY_TX, type, categoryId: defaultCat });
    setDialogOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setForm({ type: tx.type, amount: tx.amount, description: tx.description, categoryId: tx.categoryId, accountId: tx.accountId || '', percentageRuleId: tx.percentageRuleId || '', date: tx.date });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.description || form.amount <= 0) return;
    if (editing) {
      updateTransaction(editing.id, form);
    } else {
      addTransaction(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeleteConfirm(null);
  };

  const availableCategories = categories.filter((c) => c.type === form.type);
  const totalIncome = transactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  return (
    <Box>
      {/* Header stats */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, px: { xs: 1, sm: 2 }, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" display="block">Ingresos</Typography>
            <Typography fontWeight={800} color="#4CAF50" noWrap sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>{formatCurrency(totalIncome, user?.currencyCode)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, px: { xs: 1, sm: 2 }, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" display="block">Egresos</Typography>
            <Typography fontWeight={800} color="#BF360C" noWrap sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>{formatCurrency(totalExpense, user?.currencyCode)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, px: { xs: 1, sm: 2 }, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" display="block">Balance</Typography>
            <Typography fontWeight={800} color={totalIncome - totalExpense >= 0 ? '#006064' : '#BF360C'} noWrap sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
              {formatCurrency(totalIncome - totalExpense, user?.currencyCode)}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
              }}
            />
            <ToggleButtonGroup
              value={filterType}
              exclusive
              onChange={(_, val) => val && setFilterType(val)}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              <ToggleButton value="all" sx={{ px: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>Todos</ToggleButton>
              <ToggleButton value="income" sx={{ px: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#4CAF50' }}>Ingresos</ToggleButton>
              <ToggleButton value="expense" sx={{ px: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#BF360C' }}>Egresos</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {/* Transactions grouped by date */}
      {Object.entries(grouped).map(([dateKey, txs]) => (
        <Box key={dateKey} sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'capitalize', pl: 1, display: 'block', mb: 0.5 }}>
            {format(parseISO(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
          </Typography>
          <Card>
            <List disablePadding>
              {txs.map((tx, idx) => {
                const cat = getCat(tx.categoryId);
                return (
                  <React.Fragment key={tx.id}>
                    <ListItem
                      sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.2 }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.3} alignItems="center">
                          <Typography
                            fontWeight={800}
                            sx={{ color: tx.type === 'income' ? '#4CAF50' : '#BF360C', fontSize: { xs: '0.85rem', sm: '0.95rem' }, whiteSpace: 'nowrap' }}
                          >
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currencyCode)}
                          </Typography>
                          <IconButton size="small" onClick={() => openEdit(tx)} sx={{ p: 0.5 }}>
                            <EditIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirm(tx.id)} sx={{ p: 0.5 }}>
                            <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemAvatar sx={{ minWidth: { xs: 40, sm: 56 } }}>
                        <Avatar sx={{ bgcolor: alpha(cat?.color ?? '#006064', 0.15), width: { xs: 34, sm: 44 }, height: { xs: 34, sm: 44 }, fontSize: { xs: '0.9rem', sm: '1.2rem' } }}>
                          {cat?.icon ?? '💳'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600} noWrap>{tx.description}</Typography>}
                        secondaryTypographyProps={{ component: 'div' } as any}
                        secondary={
                          <Stack direction="row" spacing={0.5} alignItems="center" mt={0.2} flexWrap="wrap">
                            <Chip label={cat?.name ?? 'Sin categoría'} size="small" sx={{ fontSize: '0.6rem', height: 16 }} />
                            {tx.accountId && (
                              <Chip
                                label={getAcc(tx.accountId)?.name ?? 'Cta'}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.6rem', height: 16, borderColor: getAcc(tx.accountId)?.color }}
                              />
                            )}
                            {tx.percentageRuleId && (
                              <Chip
                                label={getRule(tx.percentageRuleId)?.name ?? 'Regla'}
                                size="small"
                                sx={{ fontSize: '0.6rem', height: 16, bgcolor: alpha(getRule(tx.percentageRuleId)?.color || '#006064', 0.15), color: getRule(tx.percentageRuleId)?.color }}
                              />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                    {idx < txs.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
                  </React.Fragment>
                );
              })}
            </List>
          </Card>
        </Box>
      ))}

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography fontSize="3rem">💸</Typography>
          <Typography variant="h6" color="text.secondary" mt={1}>No hay transacciones</Typography>
          <Typography variant="body2" color="text.secondary">Comienza registrando un ingreso o egreso</Typography>
        </Box>
      )}

      {/* FAB */}
      <Box sx={{ position: 'fixed', bottom: { xs: 80, md: 32 }, right: 24, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Fab
          size="medium"
          sx={{ bgcolor: '#BF360C', color: '#fff', '&:hover': { bgcolor: '#E64A19' }, boxShadow: 4 }}
          onClick={() => openAdd('expense')}
        >
          <TrendingDownIcon />
        </Fab>
        <Fab color="primary" onClick={() => openAdd('income')} sx={{ boxShadow: 4 }}>
          <TrendingUpIcon />
        </Fab>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Editar transacción' : form.type === 'income' ? '➕ Nuevo Ingreso' : '➖ Nuevo Egreso'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={form.type}
              exclusive
              onChange={(_, val) => val && setForm({ ...form, type: val, categoryId: val === 'income' ? 'cat-001' : 'cat-020' })}
              fullWidth
            >
              <ToggleButton value="income" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                <TrendingUpIcon sx={{ mr: 1 }} /> Ingreso
              </ToggleButton>
              <ToggleButton value="expense" sx={{ fontWeight: 700, color: '#BF360C' }}>
                <TrendingDownIcon sx={{ mr: 1 }} /> Egreso
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Descripción"
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              autoFocus
            />
            <TextField
              label={`Monto (${user?.currencyCode || 'COP'})`}
              type="number"
              fullWidth
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              required
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              inputProps={{ min: 0, step: 1 }}
            />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                label="Categoría"
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Cuenta (opcional)</InputLabel>
              <Select
                value={form.accountId || ''}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                label="Cuenta (opcional)"
              >
                <MenuItem value=""><em>Ninguna</em></MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: acc.color }} />
                      {acc.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {form.type === 'expense' && (
              <FormControl fullWidth>
                <InputLabel>Regla de Porcentaje (Opcional)</InputLabel>
                <Select
                  value={form.percentageRuleId || ''}
                  onChange={(e) => setForm({ ...form, percentageRuleId: e.target.value })}
                  label="Regla de Porcentaje (Opcional)"
                >
                  <MenuItem value=""><em>Ninguna (Gasto Libre)</em></MenuItem>
                  {rules.filter((r) => r.isActive).map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.icon} {r.name} ({r.percentage}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Fecha"
              type="date"
              fullWidth
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.description || form.amount <= 0}
            sx={{ fontWeight: 700, px: 3 }}
          >
            {editing ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Eliminar transacción?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
