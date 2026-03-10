# Integración Financiera Integral (Envelope Budgeting + Bills + Porcentajes)

El objetivo de esta integración es profesionalizar todo el ecosistema contable de "Mi Alfolí". Cada módulo no operará como una isla independiente, sino que tributará hacia una Contabilidad Central (Transacciones) garantizando que el "Saldo Disponible" refleje tu capacidad de gasto real.

## User Review Required

> [!WARNING]
> Esta refactorización tocará 3 módulos críticos simultáneamente: **Ahorros**, **Cuentas Mensuales (Gastos Fijos)** y **Porcentajes**. 
> - Todos los pagos generarán una única fuente de verdad localizable en "Transacciones".

## Proposed Changes

---

### Fase 1: Envolver Ahorros (Fondos) y Cuentas Bancarias
- **Backend ([savings.controller.ts](file:///c:/laragon/www/mi-alfoli/server/src/controllers/savings.controller.ts))**: Los depósitos deducirán el Saldo Base de una Cuenta vinculada. Los retiros crearán y guardarán automáticamente un **Egreso (Expense)** en la tabla `transactions`.
- **Frontend ([page.tsx](file:///c:/laragon/www/mi-alfoli/src/app/page.tsx) de Cuentas)**: El Saldo se desglosará visualmente en "Saldo Contable", "Dinero Retenido en Fondos", y "Saldo Disponible".

---

### Fase 2: Automatización de Pagos de Cuentas Mensuales (Bills)
- **Backend ([bills.controller.ts](file:///c:/laragon/www/mi-alfoli/server/src/controllers/bills.controller.ts))**: Al presionar *"Marcar como Pagado"* ([markPaid](file:///c:/laragon/www/mi-alfoli/server/src/controllers/bills.controller.ts#71-122)), el sistema no solo actualizará el recibo, sino que internamente generará una Transacción de Egreso (Expense) apuntando a la categoría de dicho gasto.
- **Frontend ([page.tsx](file:///c:/laragon/www/mi-alfoli/src/app/page.tsx) de Bills)**: Al crear una nueva **Cuenta/Gasto Fijo**, consultaremos si deseas "reservar" ese dinero de otra cuenta bancaria y, opcionalmente, deducir la expectativa del saldo disponible.

---

### Fase 3: Ejecución de Porcentajes en los Egresos (Transacciones)
- **Frontend ([page.tsx](file:///c:/laragon/www/mi-alfoli/src/app/page.tsx) de Transacciones)**: En el formulario "Nuevo Egreso", añadiremos un menú desplegable interactivo (**Select**) listando todas tus "Reglas de Porcentaje" (Ej: *10% Diezmo, 50% Gastos Fijos*). 
- **Backend ([transactions.controller.ts](file:///c:/laragon/www/mi-alfoli/server/src/controllers/transactions.controller.ts))**: Si la transacción seleccionó un `percentageRuleId`, al guardarse el Egreso en la base de datos se ligará a esta regla. Automáticamente, el Módulo de Estadísticas rebajará esa cuota de la bolsa disponible mensual de tu presupuesto de porcentaje.

### 4. Lógica de Conciliación y Liquidación Mensual de Porcentajes (Nuevo Requerimiento)
**Objetivo:** Permitir periodos de corte para las Reglas de Porcentaje, acumulando saldos no ejecutados y definiendo el comportamiento de los egresos sin regla.

- [ ] **Configuración de Corte Mensual:** Agregar a las preferencias del usuario (`users` table o `settings`) un campo `billingCycleDay` (Día de corte del mes, ej: 1, 15, 30).
- [ ] **Acumulación de Saldos a Favor (Rollover):** 
  - A la fecha de corte, si una regla (ej. Diezmo Sagrado 10%) no agotó todo su "Monto Asignado" vs "Monto Ejecutado", el remanente se guarda como un "Saldo Acumulado a Favor" global para esa regla.
  - Esto requiere una nueva visualización/tabla en el Dashboard de Porcentajes mostrando el "A favor histórico" separado de la barra del mes actual.
- [ ] **Condición de Egreso Libre:** 
  - Si el total de las Reglas de Porcentaje activas del usuario **NO suma el 100%** (ej. solo tiene Diezmo 10%), entonces cuando se hace un Egreso en "Transacciones" y *NO* se selecciona ninguna regla en el [Select](file:///c:/laragon/www/mi-alfoli/src/app/%28app%29/profile/page.tsx#64-101), el gasto pasa "limpio" y **no afecta** el monto de ninguna regla de porcentaje existente.
  - Si suman el 100%, el UI o el backend deberían prevenir Egresos no categorizados o alertar de desfalcos.

## Verification Plan

### Automated
- Compilación de TypeScript y validaciones Prisma (`npx prisma db push`).

### Manual Verification
1. **Ahorros**: Deposita en un Fondo y comprueba cómo cae el "Saldo Libre" en tus cuentas. Retira dinero y confirma que aparece un gasto con rojo en `/transactions`.
2. **Cuentas Fijas**: Dale "Marcar Pagado" a tu recibo de Luz. Verifica en `/transactions` que el gasto se facturó automáticamente restando liquidez.
3. **Porcentajes**: Crea una transacción manual de -50.000 COP y vincúlala a "Diezmo". Entra al módulo Porcentajes y confirma que el termómetro bajó apropiadamente.
