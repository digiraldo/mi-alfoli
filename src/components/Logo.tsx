'use client';
import React, { useState, useEffect } from 'react';
import { SvgIcon, SvgIconProps, useTheme } from '@mui/material';

export function MiAlfoliLogo({ size = 48, ...props }: { size?: number } & SvgIconProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Usar colores light como base para SSR (evita Hydration mismatch)
  const isDark = mounted ? theme.palette.mode === 'dark' : false;

  const domeOpacityColor = isDark ? '#e5e4e4ff' : '#404040ff';
  const domeColor = isDark ? '#008388' : '#006064';
  const grainColor = isDark ? '#fdcf43' : '#FFB300';

  return (
    <SvgIcon viewBox="0 0 100 100" sx={{ width: size, height: size }} {...props}>
      {/* Domo protector — El Alfolí */}
      <path d="M 15 65 A 35 35 0 0 1 85 65 Z" fill={domeOpacityColor} opacity={0.25} />
      <path d="M 15 65 A 35 35 0 0 0 85 65 Z" fill={domeColor} />
      {/* Línea de tierra */}
      <line x1="8" y1="65" x2="92" y2="65" stroke={domeColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Barras ascendentes — Finanzas */}
      <rect x="29" y="50" width="10" height="15" rx="4" fill={domeColor} />
      <rect x="45" y="38" width="10" height="27" rx="4" fill={domeColor} />
      <rect x="61" y="26" width="10" height="39" rx="4" fill={domeColor} />
      {/* Granos dorados — Cosecha bíblica */}
      <path d="M 34 38 Q 39 43 34 48 Q 29 43 34 38 Z" fill={grainColor} />
      <path d="M 50 26 Q 55 31 50 36 Q 45 31 50 26 Z" fill={grainColor} />
      <path d="M 66 14 Q 71 19 66 24 Q 61 19 66 14 Z" fill={grainColor} />
      {/* Moneda/Sol — Bendición de Mal. 3:10 */}
      <circle cx="28" cy="28" r="4" fill={grainColor} />
      <line x1="28" y1="20" x2="28" y2="22" stroke={grainColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="34" x2="28" y2="36" stroke={grainColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="28" x2="22" y2="28" stroke={grainColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="28" x2="36" y2="28" stroke={grainColor} strokeWidth="1.5" strokeLinecap="round" />
    </SvgIcon>
  );
}

export default MiAlfoliLogo;
