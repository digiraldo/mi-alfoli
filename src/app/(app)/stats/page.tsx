'use client';
import React, { useEffect, useRef, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip, Stack, alpha, useTheme, Divider,
} from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Filler, Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useTransactionStore } from '@/store/useTransactionStore';
import { usePercentageStore } from '@/store/usePercentageStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/format';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Title);

export default function StatsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { transactions, categories } = useTransactionStore();
  const { rules } = usePercentageStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { user } = useAuthStore();

  const today = new Date();

  useEffect(() => {
    fetchAccounts();
  }, []);

  // ── Last 6 months labels & data ──
  const months = Array.from({ length: 6 }, (_, i) => subMonths(today, 5 - i));
  const monthLabels = months.map((d) => format(d, 'LLL', { locale: es }));

  const monthlyData = months.map((m) => {
    const start = startOfMonth(m);
    const end = endOfMonth(m);
    const txs = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d >= start && d <= end;
    });
    return {
      income: txs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
      expense: txs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
    };
  });

  // ── Current month expense by category ──
  const currentMonthTxs = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && tx.type === 'expense';
  });

  const catGroups: Record<string, number> = {};
  currentMonthTxs.forEach((tx) => {
    catGroups[tx.categoryId] = (catGroups[tx.categoryId] ?? 0) + tx.amount;
  });

  const catEntries = Object.entries(catGroups).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const catLabels = catEntries.map(([id]) => categories.find((c) => c.id === id)?.name ?? 'Otro');
  const catAmounts = catEntries.map(([, amt]) => amt);
  const catColors = catEntries.map(([id]) => categories.find((c) => c.id === id)?.color ?? '#9E9E9E');

  // ── Percentage donut ──
  const pctLabels = rules.filter((r) => r.isActive).map((r) => `${r.icon} ${r.name}`);
  const pctValues = rules.filter((r) => r.isActive).map((r) => r.percentage);
  const pctColors = rules.filter((r) => r.isActive).map((r) => r.color);

  // ── Summary metrics ──
  const totalIncome = transactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const topCategory = catLabels[0] ?? '—';
  const dailyAvg = currentMonthTxs.reduce((s, tx) => s + tx.amount, 0) / today.getDate();

  const textColor = isDark ? '#E0E0E0' : '#333';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const barChartData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyData.map((d) => d.income),
        backgroundColor: alpha('#4CAF50', 0.75),
        borderRadius: 8,
        borderSkipped: false as const,
      },
      {
        label: 'Egresos',
        data: monthlyData.map((d) => d.expense),
        backgroundColor: alpha('#BF360C', 0.75),
        borderRadius: 8,
        borderSkipped: false as const,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { family: 'Inter' } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `  ${ctx.dataset.label}: ${formatCurrency(ctx.raw, user?.currencyCode)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: {
        ticks: {
          color: textColor,
          callback: (v: any) => `$${(v / 1000000).toFixed(1)}M`,
        },
        grid: { color: gridColor },
      },
    },
  };

  const donutCatData = {
    labels: catLabels,
    datasets: [{ data: catAmounts, backgroundColor: catColors, borderWidth: 2, borderColor: isDark ? '#2C2C2A' : '#FFFFFF', hoverOffset: 8 }],
  };

  const donutPctData = {
    labels: pctLabels,
    datasets: [{ data: pctValues, backgroundColor: pctColors, borderWidth: 2, borderColor: isDark ? '#2C2C2A' : '#FFFFFF', hoverOffset: 8 }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: textColor, font: { family: 'Inter', size: 11 }, padding: 16, boxWidth: 12, usePointStyle: true } },
      tooltip: { callbacks: { label: (ctx: any) => `  ${ctx.label}: ${ctx.dataset.data === pctValues ? `${ctx.raw}%` : formatCurrency(ctx.raw, user?.currencyCode)}` } },
    },
    cutout: '65%',
  };

  // ── Account Stats ──
  const accGroups: Record<string, number> = {};
  currentMonthTxs.forEach((tx) => {
    if (tx.accountId) {
      accGroups[tx.accountId] = (accGroups[tx.accountId] ?? 0) + tx.amount;
    }
  });

  const accEntries = Object.entries(accGroups).sort((a, b) => b[1] - a[1]);
  const accLabels = accEntries.map(([id]) => accounts.find((a) => a.id === id)?.name ?? 'Desconocida');
  const accAmounts = accEntries.map(([, amt]) => amt);
  const accColors = accEntries.map(([id]) => accounts.find((a) => a.id === id)?.color ?? '#9E9E9E');

  const donutAccData = {
    labels: accLabels,
    datasets: [{ data: accAmounts, backgroundColor: accColors, borderWidth: 2, borderColor: isDark ? '#2C2C2A' : '#FFFFFF', hoverOffset: 8 }],
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} mb={0.5}>Estadísticas</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Análisis de {format(today, 'MMMM yyyy', { locale: es })} y últimos 6 meses
      </Typography>

      {/* Key metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Ingresos', value: formatCurrency(totalIncome, user?.currencyCode), color: '#4CAF50', icon: '💰' },
          { label: 'Total Egresos', value: formatCurrency(totalExpense, user?.currencyCode), color: '#BF360C', icon: '💸' },
          { label: 'Tasa de ahorro', value: `${savingsRate}%`, color: '#006064', icon: '🏦' },
          { label: 'Mayor gasto', value: topCategory, color: '#FFB300', icon: '🏷️' },
          { label: 'Promedio diario', value: formatCurrency(Math.round(dailyAvg), user?.currencyCode), color: '#9C27B0', icon: '📅' },
          { label: 'Balance neto', value: formatCurrency(totalIncome - totalExpense, user?.currencyCode), color: totalIncome - totalExpense >= 0 ? '#006064' : '#BF360C', icon: '⚖️' },
        ].map((m) => (
          <Grid item xs={6} sm={4} md={2} key={m.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                <Typography fontSize="1.8rem">{m.icon}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" fontWeight={500} mt={0.5}>{m.label}</Typography>
                <Typography variant="subtitle2" fontWeight={800} color={m.color} mt={0.3} fontSize="0.85rem">{m.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts row 1 */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* Bar chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Ingresos vs Egresos — Últimos 6 meses</Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Bar data={barChartData} options={barOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expense donut */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Gastos por categoría</Typography>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">Mes actual</Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {catAmounts.length > 0 ? (
                  <Doughnut data={donutCatData} options={donutOptions} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">Sin datos este mes</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Percentage donut */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Distribución de Porcentajes</Typography>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">Reglas activas configuradas</Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {pctValues.length > 0 ? (
                  <Doughnut data={donutPctData} options={{ ...donutOptions, plugins: { ...donutOptions.plugins, tooltip: { callbacks: { label: (ctx: any) => `  ${ctx.label}: ${ctx.raw}%` } } } }} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">Sin reglas configuradas</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction list for current month */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: 360, overflow: 'auto' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Top Categorías de Gasto</Typography>
              <Stack spacing={1.5}>
                {catEntries.map(([catId, amount], idx) => {
                  const cat = categories.find((c) => c.id === catId);
                  const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  return (
                    <Box key={catId}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{cat?.icon ?? '💳'}</Typography>
                          <Typography variant="body2" fontWeight={600}>{cat?.name ?? 'Otro'}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700}>{formatCurrency(amount, user?.currencyCode)}</Typography>
                          <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ height: 6, bgcolor: alpha(cat?.color ?? '#9E9E9E', 0.15), borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: cat?.color ?? '#9E9E9E', borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </Box>
                    </Box>
                  );
                })}
                {catEntries.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Sin gastos este mes</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Account stats row */}
      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Gastos por Cuenta Bancaria</Typography>
              <Typography variant="caption" color="text.secondary" mb={1} display="block" sx={{ textTransform: 'capitalize' }}>{format(today, 'MMMM yyyy', { locale: es })}</Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {accAmounts.length > 0 ? (
                  <Doughnut data={donutAccData} options={donutOptions} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">Sin datos de cuentas este mes</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 360, overflow: 'auto' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Saldos de Cuentas</Typography>
              <Stack spacing={2}>
                {accounts.map((acc, idx) => {
                  return (
                    <Box key={acc.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: acc.color }} />
                          <Typography variant="body2" fontWeight={600}>{acc.name}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700} color={acc.type === 'credit_card' ? 'error.main' : 'text.primary'}>
                          {formatCurrency(acc.currentBalance, user?.currencyCode)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {acc.type === 'credit_card' ? 'Deuda actual' : 'Saldo disponible'}
                      </Typography>
                      {idx < accounts.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                    </Box>
                  );
                })}
                {accounts.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No hay cuentas registradas</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
