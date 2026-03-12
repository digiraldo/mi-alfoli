'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActionArea,
  Avatar, AvatarGroup, IconButton, useTheme, Fab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, InputAdornment, alpha,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useSharedStore } from '@/store/useSharedStore';
import { useRouter } from 'next/navigation';

export default function SharedGroupsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { groups, isLoading, fetchGroups, createGroup, joinGroup } = useSharedStore();

  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);
  
  // Create state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  
  // Join state
  const [joinId, setJoinId] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createGroup({
      title,
      description,
      totalBudget: totalBudget ? Number(totalBudget) : undefined,
      icon: '🌴', // Default icon for now
      color: theme.palette.primary.main,
    });
    setOpenCreate(false);
    setTitle('');
    setDescription('');
    setTotalBudget('');
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    try {
      await joinGroup(joinId.trim());
      setOpenJoin(false);
      setJoinId('');
    } catch (err) {
      alert('No se pudo unir al grupo. Verifica el ID.');
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Gastos Compartidos 👥
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crea eventos grupales, invita amigos y liquiden las cuentas fácilmente.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<GroupAddIcon />}
            onClick={() => setOpenJoin(true)}
            sx={{ borderRadius: 3, px: 3 }}
          >
            Unirse
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{ borderRadius: 3, px: 3, boxShadow: theme.shadows[4] }}
          >
            Nuevo Evento
          </Button>
        </Box>
      </Box>

      {/* Grid of groups */}
      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 4, 
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              <CardActionArea onClick={() => router.push(`/shared/${group.id}`)} sx={{ p: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box 
                      sx={{ 
                        width: 50, height: 50, borderRadius: 3, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha(group.color || theme.palette.primary.main, 0.1),
                        fontSize: '1.5rem'
                      }}
                    >
                      {group.icon || '🌴'}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" display="block">Participantes</Typography>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.7rem' } }}>
                        <Avatar src={group.owner?.avatarUrl} title={group.owner?.fullName} />
                        {(group.members || []).map(m => (
                          <Avatar key={m.id} src={m.user?.avatarUrl} title={m.user?.fullName} />
                        ))}
                      </AvatarGroup>
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight={700} noWrap gutterBottom>
                    {group.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    mb: 2
                  }}>
                    {group.description || 'Sin descripción'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Gastos</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {group._count?.transactions || 0} movimientos
                      </Typography>
                    </Box>
                    <IconButton size="small" color="primary">
                      <ArrowForwardIosIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}

        {groups.length === 0 && !isLoading && (
          <Grid item xs={12}>
            <Box sx={{ 
              py: 10, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.03), 
              borderRadius: 8, border: `2px dashed ${theme.palette.divider}` 
            }}>
              <PeopleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tienes grupos de gastos compartidos todavía
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                Crea uno para tu próximo viaje o salida con amigos.
              </Typography>
              <Button variant="contained" onClick={() => setOpenCreate(true)} sx={{ borderRadius: 3 }}>
                Comenzar ahora
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Nuevo Evento Grupal</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Nombre del Evento"
              placeholder="Ej: Viaje a la Playa 🏖️"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
            />
            <TextField
              label="Descripción"
              placeholder="Opcional"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              label="Presupuesto Estimado (Opcional)"
              fullWidth
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCreate(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!title.trim()} sx={{ borderRadius: 2, px: 3 }}>
            Crear Grupo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={openJoin} onClose={() => setOpenJoin(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Unirse a un Grupo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Pide el ID del grupo a quien lo creó y pégalo aquí para empezar a compartir gastos.
            </Typography>
            <TextField
              label="ID del Grupo"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              fullWidth
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenJoin(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleJoin} variant="contained" disabled={!joinId.trim()} sx={{ borderRadius: 2, px: 3 }}>
            Unirme
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
