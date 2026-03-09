export function formatCurrency(amount: number, currencyCode: string = 'COP'): string {
  // Configuración especial para algunas monedas sin decimales y con su formato local
  const noDecimals = ['COP', 'JPY', 'KRW', 'CLP', 'PYG'];
  const maxDecimals = noDecimals.includes(currencyCode) ? 0 : 2;

  // Intentamos obtener el locale apropiado para la moneda, por defecto es-CO para COP, en-US para USD, etc.
  const localeMap: Record<string, string> = {
    'COP': 'es-CO',
    'USD': 'en-US',
    'EUR': 'es-ES',
    'MXN': 'es-MX',
    'ARS': 'es-AR',
    'BRL': 'pt-BR',
    'CLP': 'es-CL',
    'PEN': 'es-PE',
    'VEF': 'es-VE',
    'GTQ': 'es-GT',
    'BOB': 'es-BO',
    'CRC': 'es-CR',
  };

  const locale = localeMap[currencyCode] || 'es-CO'; // Default to something

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: maxDecimals,
  }).format(amount);
}
