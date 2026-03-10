# Integración Financiera Integral — Mi Alfolí

## Fase 1: Ahorros (Envelope Budgeting)
- [x] Schema: Añadir bandera opcional a [Transaction](file:///c:/laragon/www/mi-alfoli/src/types/index.ts#39-55) para identificar si vino de [SavingsGoal](file:///c:/laragon/www/mi-alfoli/src/types/index.ts#122-139)
- [x] Schema: Actualizar con `prisma db push`
- [x] Backend: [deposit](file:///c:/laragon/www/mi-alfoli/src/store/useSavingsStore.ts#54-58) requerirá `accountId` para debitar el saldo de la Cuenta mediante `$transaction`
- [x] Backend: [withdraw](file:///c:/laragon/www/mi-alfoli/src/store/useSavingsStore.ts#59-67) generará un [Transaction](file:///c:/laragon/www/mi-alfoli/src/types/index.ts#39-55) tipo `expense` en la tabla maestra
- [x] Frontend: `useSavingsStore` exigirá y enviará un `accountId`
- [x] Frontend: Añadir `<Select>` en Dialog de "Depositar" para elegir Cuenta
- [x] Frontend: Restar saldo retentivo de ahorros del Saldo Real en UI de Cuentas

## Fase 2: Automatización de Pagos (Bills)
- [x] Backend: Función [markPaid](file:///c:/laragon/www/mi-alfoli/server/src/controllers/bills.controller.ts#71-122) en [bills.controller.ts](file:///c:/laragon/www/mi-alfoli/server/src/controllers/bills.controller.ts) dispara un [Transaction](file:///c:/laragon/www/mi-alfoli/src/types/index.ts#39-55) (Egreso) automático
- [x] Frontend: *Omitido intencionalmente (Deducción general al flujo de caja)*

## Phase 4: Conciliación y Liquidación Mensual de Porcentajes (Nuevo)
- [x] Add `billingCycleDay` to User model/settings (allow users to choose 1-31 or last day).
- [x] Implement backend cron job/logic to calculate unspent percentage balances at cycle end.
- [x] Create UI inside Percentages Dashboard to view 'Saldo A Favor Acumulado' across all previous months.

## Fase 3: Ejecución de Porcentajes en Transacciones
- [x] Frontend: Pantalla "Transacciones" muestra un `<Select>` con los `PercentageRules` 
- [x] Backend / UI: `useTransactionStore` ya puede leer/escribir `percentageRuleId`
- [x] UI: Las transacciones ahora pintan visualmente el Chip del porcentaje asignado.
