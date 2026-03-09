'use client';
import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface VerseCardProps {
  variant?: 'short' | 'full';
}

export default function VerseCard({ variant = 'short' }: VerseCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#006064', 0.4)} 0%, ${alpha('#00363A', 0.6)} 100%)`
          : `linear-gradient(135deg, ${alpha('#006064', 0.08)} 0%, ${alpha('#FFB300', 0.12)} 100%)`,
        border: `1px solid ${alpha('#FFB300', isDark ? 0.3 : 0.4)}`,
        borderRadius: 3,
        p: { xs: 2.5, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: alpha('#FFB300', 0.08),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <AutoAwesomeIcon sx={{ color: '#FFB300', fontSize: 24, mt: 0.3, flexShrink: 0 }} />
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontStyle: 'italic',
              color: isDark ? alpha('#FFD54F', 0.95) : alpha('#004D40', 0.9),
              lineHeight: 1.7,
              fontWeight: 400,
              fontSize: { xs: '0.82rem', md: '0.9rem' },
            }}
          >
            {variant === 'full'
              ? '"Traed todos los diezmos al alfolí y haya alimento en mi casa; y probadme ahora en esto, dice Jehová de los ejércitos, si no os abriré las ventanas de los cielos, y derramaré sobre vosotros bendición hasta que sobreabunde."'
              : '"Traed todos los diezmos al alfolí y haya alimento en mi casa; y probadme ahora en esto..." y derramaré sobre vosotros bendición hasta que sobreabunde.'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              fontWeight: 700,
              color: '#FFB300',
              letterSpacing: '0.05em',
              fontSize: '0.75rem',
            }}
          >
            — Malaquías 3:10 (RVR1960)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
