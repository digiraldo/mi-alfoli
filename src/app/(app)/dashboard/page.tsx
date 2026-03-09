'use client';
import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip, List,
  ListItem, ListItemAvatar, ListItemText, alpha, useTheme, Divider, Stack,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import { useTransactionStore } from '@/store/useTransactionStore';
import { usePercentageStore } from '@/store/usePercentageStore';
import { useBillStore } from '@/store/useBillStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import VerseCard from '@/components/VerseCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function StatCard({
  title, value, sub, icon, color, trend,
}: {
  title: string; value: string; sub?: string; icon: React.ReactNode; color: string; trend?: 'up' | 'down' | 'neutral';
}) {
  const theme = useTheme();
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} mb={0.5} display="block" noWrap>{title}</Typography>
            <Typography
              fontWeight={800}
              color={color}
              mb={0.3}
              noWrap
              sx={{ fontSize: { xs: '1rem', sm: '1.4rem', md: '1.75rem' }, lineHeight: 1.1 }}
            >
              {value}
            </Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: alpha(color, 0.12), width: { xs: 36, sm: 52 }, height: { xs: 36, sm: 52 }, ml: 1, flexShrink: 0 }}>
            <Box sx={{ color, '& svg': { fontSize: { xs: '1.1rem', sm: '1.5rem' } } }}>{icon}</Box>
          </Avatar>
        </Box>
        {trend && (
          <Chip
            size="small"
            icon={trend === 'up' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
            label="Este mes"
            sx={{
              mt: 1,
              bgcolor: alpha(trend === 'up' ? '#4CAF50' : '#BF360C', 0.1),
              color: trend === 'up' ? '#2E7D32' : '#BF360C',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const { transactions, categories, fetchTransactions, fetchCategories } = useTransactionStore();
  const { rules, executions, fetchRules, fetchExecutions } = usePercentageStore();
  const { bills, fetchBills, getBillStatus } = useBillStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { user } = useAuthStore();
  const today = new Date();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchRules();
    fetchBills();
    fetchAccounts();
    fetchExecutions(today.getFullYear(), today.getMonth() + 1);
  }, []);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthlyTx = transactions.filter((tx) => {
    const date = new Date(tx.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = monthlyTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const pendingBills = bills.filter((b) => b.isActive && getBillStatus(b.id, currentYear, currentMonth + 1) !== 'paid');

  const getCat = (id: string) => categories.find((c) => c.id === id);

  const greetingHour = today.getHours();
  const greeting = greetingHour < 12 ? 'Buenos días' : greetingHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const monthName = format(today, 'MMMM yyyy', { locale: es });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography
          fontWeight={800}
          color="text.primary"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' } }}
        >
          {greeting}, {user?.fullName?.split(' ')[0] ?? 'amigo'} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {monthName} — Resumen financiero
        </Typography>
      </Box>



      {/* Stats cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Ingresos del mes"
            value={formatCurrency(totalIncome, user?.currencyCode)}
            icon={<TrendingUpIcon />}
            color="#4CAF50"
            trend="up"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Egresos del mes"
            value={formatCurrency(totalExpense, user?.currencyCode)}
            icon={<TrendingDownIcon />}
            color="#BF360C"
            trend="down"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Balance neto"
            value={formatCurrency(balance, user?.currencyCode)}
            sub={balance >= 0 ? '¡Positivo! 🎉' : 'Revisar gastos'}
            icon={<AccountBalanceIcon />}
            color={balance >= 0 ? '#006064' : '#BF360C'}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Tasa de ahorro"
            value={`${savingsRate}%`}
            sub="del ingreso"
            icon={<SavingsIcon />}
            color="#FFB300"
          />
        </Grid>
      </Grid>

      {/* Content grid */}
      <Grid container spacing={2.5}>
        {/* Recent transactions */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700}>Últimas transacciones</Typography>
                <Chip
                  label={`${transactions.length} total`}
                  size="small"
                  sx={{ bgcolor: alpha('#006064', 0.1), color: 'primary.main', fontWeight: 600 }}
                />
              </Box>
              <Divider />
              <List disablePadding>
                {recent.map((tx, idx) => {
                  const cat = getCat(tx.categoryId);
                  return (
                    <React.Fragment key={tx.id}>
                      <ListItem sx={{ px: { xs: 1.5, sm: 3 }, py: 1.2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha(cat?.color ?? '#006064', 0.15), fontSize: '1rem', width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 } }}>
                            {cat?.icon ?? '💳'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{tx.description}</Typography>}
                          secondaryTypographyProps={{ component: 'div' } as any}
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
                              <Chip label={cat?.name ?? 'Sin categoría'} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                              {tx.accountId && (
                                <Chip 
                                  label={accounts.find(a => a.id === tx.accountId)?.name ?? 'Cta'} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: '0.65rem', height: 18, 
                                    borderColor: accounts.find(a => a.id === tx.accountId)?.color 
                                  }} 
                                />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(tx.date), 'dd MMM', { locale: es })}
                              </Typography>
                            </Stack>
                          }
                        />
                        <Typography
                          fontWeight={800}
                          color={tx.type === 'income' ? 'success.main' : 'error.main'}
                          sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                        >
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currencyCode)}
                        </Typography>
                      </ListItem>
                      {idx < recent.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
                    </React.Fragment>
                  );
                })}
                {recent.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No hay transacciones aún</Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending bills */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={700}>Cuentas pendientes</Typography>
                <Chip
                  label={`${pendingBills.length} pendiente${pendingBills.length !== 1 ? 's' : ''}`}
                  size="small"
                  color={pendingBills.length > 0 ? 'error' : 'success'}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Divider />
              <List disablePadding>
                {pendingBills.slice(0, 5).map((bill, idx) => {
                  const status = getBillStatus(bill.id, currentYear, currentMonth + 1);
                  const daysLeft = bill.dueDay - today.getDate();
                  return (
                    <React.Fragment key={bill.id}>
                      <ListItem sx={{ px: 3, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha(bill.color, 0.15), width: 40, height: 40 }}>
                            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: bill.color }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{bill.name}</Typography>}
                          secondaryTypographyProps={{ component: 'div' } as any}
                          secondary={
                            <Typography component="div" variant="caption" color="text.secondary">
                              Vence día {bill.dueDay}
                              {daysLeft >= 0 ? ` · ${daysLeft}d restantes` : ' · VENCIDA'}
                            </Typography>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700}>{formatCurrency(bill.amount, user?.currencyCode)}</Typography>
                          <Chip
                            label={status === 'overdue' ? 'Vencida' : 'Pendiente'}
                            size="small"
                            sx={{
                              fontSize: '0.6rem',
                              height: 16,
                              bgcolor: alpha(status === 'overdue' ? '#BF360C' : '#FF9800', 0.1),
                              color: status === 'overdue' ? '#BF360C' : '#E65100',
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      </ListItem>
                      {idx < pendingBills.slice(0, 5).length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
                    </React.Fragment>
                  );
                })}
                {pendingBills.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="success.main" fontWeight={600}>✓ Todo al día 🎉</Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Percentage overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Estado de Porcentajes — {format(today, 'MMMM', { locale: es })}</Typography>
              <Grid container spacing={2}>
                {rules.filter((r) => r.isActive).map((rule) => {
                  const exec = executions.find(
                    (e) => e.percentageRuleId === rule.id && e.year === currentYear && e.month === currentMonth + 1
                  );
                  const allocated = exec?.allocatedAmount ?? totalIncome * (rule.percentage / 100);
                  const executed = exec?.executedAmount ?? 0;
                  const pct = allocated > 0 ? Math.min(Math.round((executed / allocated) * 100), 100) : 0;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={rule.id}>
                      <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(rule.color, 0.3)}`, bgcolor: alpha(rule.color, 0.04) }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {rule.icon} {rule.name} ({rule.percentage}%)
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color={pct >= 100 ? 'success.main' : 'text.secondary'}>
                            {pct}%
                          </Typography>
                        </Box>
                        <Box sx={{ height: 8, bgcolor: alpha(rule.color, 0.15), borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: rule.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(executed, user?.currencyCode)} ejecutado
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            de {formatCurrency(allocated, user?.currencyCode)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Verse Card */}
      <Box sx={{ mt: 3, mb: 1 }}>
        <VerseCard variant="short" />
      </Box>
    </Box>
  );
}
