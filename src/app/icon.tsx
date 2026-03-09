import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32">
          <path d="M 15 65 A 35 35 0 0 1 85 65 Z" fill="#006064" opacity="0.15" />
          <path d="M 15 65 A 35 35 0 0 0 85 65 Z" fill="#006064" />
          <line x1="8" y1="65" x2="92" y2="65" stroke="#006064" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="29" y="50" width="10" height="15" rx="4" fill="#006064" />
          <rect x="45" y="38" width="10" height="27" rx="4" fill="#006064" />
          <rect x="61" y="26" width="10" height="39" rx="4" fill="#006064" />
          <path d="M 34 38 Q 39 43 34 48 Q 29 43 34 38 Z" fill="#FFB300" />
          <path d="M 50 26 Q 55 31 50 36 Q 45 31 50 26 Z" fill="#FFB300" />
          <path d="M 66 14 Q 71 19 66 24 Q 61 19 66 14 Z" fill="#FFB300" />
          <circle cx="28" cy="28" r="4" fill="#FFB300" />
          <line x1="28" y1="20" x2="28" y2="22" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="28" y1="34" x2="28" y2="36" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="28" x2="22" y2="28" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="28" x2="36" y2="28" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}