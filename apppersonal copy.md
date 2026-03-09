# PROYECTO: Mi Alfolí - Gestor de Finanzas Personales con Propósito

> *"Traed todos los diezmos al alfolí y haya alimento en mi casa; y probadme ahora en esto, dice Jehová de los ejércitos, si no os abriré las ventanas de los cielos, y derramaré sobre vosotros bendición hasta que sobreabunde."*
> — **Malaquías 3:10 (RVR1960)**

---

## 🎨 IDENTIDAD VISUAL

### Logo Oficial

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="250" height="250">
  <defs>
    <style>
      .cls-base { fill: #006064; }
      .cls-domo { fill: #797979; opacity: 0.1; }
      .cls-linea { stroke: #006064; stroke-width: 2.5; stroke-linecap: round; }
      .cls-oro  { fill: #FFB300; }
    </style>
  </defs>

  <!-- 1. El Alfolí: bóveda protectora + base sólida + línea de tierra -->
  <path d="M 15 65 A 35 35 0 0 1 85 65 Z" class="cls-domo"/>
  <path d="M 15 65 A 35 35 0 0 0 85 65 Z" class="cls-base"/>
  <line x1="8" y1="65" x2="92" y2="65" class="cls-linea"/>

  <!-- 2. Finanzas: gráfico de barras ascendente -->
  <rect x="29" y="50" width="10" height="15" rx="4" class="cls-base"/>
  <rect x="45" y="38" width="10" height="27" rx="4" class="cls-base"/>
  <rect x="61" y="26" width="10" height="39" rx="4" class="cls-base"/>

  <!-- 3. Cosecha bíblica: grano de trigo dorado en la cima de cada barra -->
  <path d="M 34 38 Q 39 43 34 48 Q 29 43 34 38 Z" class="cls-oro"/>
  <path d="M 50 26 Q 55 31 50 36 Q 45 31 50 26 Z" class="cls-oro"/>
  <path d="M 66 14 Q 71 19 66 24 Q 61 19 66 14 Z" class="cls-oro"/>

  <!-- 4. La Bendición de Mal. 3:10: moneda/sol cayendo del cielo -->
  <circle cx="28" cy="28" r="4" class="cls-oro"/>
  <path d="M 28 20 L 28 22 M 28 34 L 28 36 M 20 28 L 22 28 M 34 28 L 36 28"
        stroke="#FFB300" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

### Simbolismo del Diseño

| Elemento | Símbolo | Significado |
|----------|---------|-------------|
| 🛡️ **Círculo + Base** | El Alfolí | Bóveda protectora arriba (seguridad) y granero sólido abajo (fundamento) |
| 📈 **Barras ascendentes** | Finanzas | Crecimiento progresivo del ahorro e inversión inteligente |
| 🌾 **Granos dorados** | Cosecha bíblica | Cada barra financiera florece en fruto — el dinero como semilla |
| ✨ **Moneda/Sol** | Malaquías 3:10 | La bendición que cae del cielo al traer los diezmos al alfolí |

### Paleta de Colores: *"Cosecha y Providencia"*

| Rol | Nombre | HEX | Uso |
|-----|--------|-----|-----|
| **Primario** | Azul Petróleo Profundo | `#006064` | AppBar, FAB, barras del alfolí, elementos de navegación |
| **Secundario** | Oro Ámbar | `#FFB300` | Ingresos, granos, moneda de bendición, gráficos positivos |
| **Terciario** | Terracota Mate | `#BF360C` | Alertas, donaciones, misiones, gastos urgentes |
| **Superficie Light** | Gris Hueso | `#F5F5F0` | Fondo modo claro (efecto pergamino) |
| **Superficie Dark** | Gris Ceniza | `#21211F` | Fondo modo oscuro (hace resaltar el Oro Ámbar) |

---

## CONTEXTO DEL PROYECTO
Desarrollar una aplicación multiplataforma (Android APK + Web App) de gestión de finanzas personales con propósito espiritual, sincronización en tiempo real, estadísticas avanzadas y sistema de porcentajes dinámicos para distribución de ingresos. La app muestra el versículo de Malaquías 3:10 como ancla motivacional.

---

## STACK TECNOLÓGICO REQUERIDO

### Frontend Móvil (Android)
- **Framework:** Flutter o React Native
- **UI/UX:** Google Material Design 3 (Material You)
- **Componentes:** Material Design Components (MDC)
- **Gráficos:** FL Chart / Charts_flutter o Victory Native
- **OCR para facturas:** Google ML Kit / Tesseract

### Frontend Web
- **Framework:** React.js / Next.js o Vue.js / Nuxt.js
- **UI Library:** Material UI (MUI) v5+ / Vuetify 3
- **Gráficos:** Chart.js / Recharts / ApexCharts
- **State Management:** Redux Toolkit / Zustand / Pinia

### Backend
- **Runtime:** Node.js con Express/Fastify o NestJS
- **Base de datos:** PostgreSQL (principal) + Redis (caché/sesiones)
- **ORM:** Prisma o TypeORM
- **Autenticación:** Firebase Auth / Auth0 / JWT + OAuth 2.0
- **API:** REST API con documentación OpenAPI/Swagger
- **Tiempo real:** Socket.io o Firebase Realtime Database

### Infraestructura
- **Cloud:** Firebase / Supabase / AWS
- **CDN:** Cloudflare
- **CI/CD:** GitHub Actions
- **Monitoreo:** Sentry para errores

---

## ARQUITECTURA DE BASE DE DATOS

### Entidades Principales

```sql
-- USUARIOS
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    avatar_url TEXT,
    google_id VARCHAR(255),
    phone VARCHAR(20),
    currency_code VARCHAR(3) DEFAULT 'COP',
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    notification_preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CATEGORÍAS (Ingresos y Egresos)
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7) NOT NULL, -- HEX color
    parent_id UUID REFERENCES categories(id), -- Subcategorías
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CUENTAS BANCARIAS / MÉTODOS DE PAGO
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- "Bancolombia", "Nequi", "Efectivo"
    type ENUM('bank', 'credit_card', 'cash', 'digital_wallet', 'investment') NOT NULL,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50),
    current_balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2), -- Solo para tarjetas de crédito
    account_number VARCHAR(50), -- Encriptado
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TRANSACCIONES (Ingresos y Egresos)
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    percentage_rule_id UUID REFERENCES percentage_rules(id), -- A qué porcentaje pertenece
    type ENUM('income', 'expense', 'transfer') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    notes TEXT,
    date DATE NOT NULL,
    time TIME,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_config JSONB, -- {frequency: 'monthly', day: 15, end_date: null}
    attachment_url TEXT, -- Foto de factura
    location JSONB, -- {lat, lng, address}
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PORCENTAJES DE DISTRIBUCIÓN
CREATE TABLE percentage_rules (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- "Ahorro", "Gastos Fijos", "Inversión"
    percentage DECIMAL(5,2) NOT NULL, -- 10.00 = 10%
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Orden de prioridad
    created_at TIMESTAMP DEFAULT NOW()
);

-- AJUSTES MENSUALES DE PORCENTAJES
CREATE TABLE percentage_monthly_adjustments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    percentage_rule_id UUID REFERENCES percentage_rules(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    adjusted_percentage DECIMAL(5,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(percentage_rule_id, year, month)
);

-- EJECUCIÓN DE PORCENTAJES POR MES
CREATE TABLE percentage_executions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    percentage_rule_id UUID REFERENCES percentage_rules(id),
    transaction_id UUID REFERENCES transactions(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL, -- Monto asignado según %
    executed_amount DECIMAL(15,2) DEFAULT 0, -- Monto realmente gastado/usado
    created_at TIMESTAMP DEFAULT NOW()
);

-- CUENTAS MENSUALES (Obligaciones)
CREATE TABLE monthly_bills (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name VARCHAR(100) NOT NULL, -- "Servicio de Luz", "Arriendo"
    payment_reference VARCHAR(100), -- Número de referencia de pago
    provider VARCHAR(100), -- "EPM", "Claro"
    due_day INTEGER NOT NULL, -- Día del mes (1-31)
    amount DECIMAL(15,2) NOT NULL,
    is_variable_amount BOOLEAN DEFAULT FALSE,
    color VARCHAR(7),
    reminder_days INTEGER[] DEFAULT '{3, 1}', -- Recordar 3 y 1 día antes
    is_auto_detected BOOLEAN DEFAULT FALSE, -- Si fue detectado por IA
    attachment_url TEXT, -- Foto de la factura
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- HISTORIAL DE PAGOS DE CUENTAS MENSUALES
CREATE TABLE bill_payments (
    id UUID PRIMARY KEY,
    monthly_bill_id UUID REFERENCES monthly_bills(id),
    transaction_id UUID REFERENCES transactions(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount_paid DECIMAL(15,2) NOT NULL,
    paid_date DATE NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'partial') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- GRUPOS DE VIAJES / GASTOS COMPARTIDOS
CREATE TABLE shared_groups (
    id UUID PRIMARY KEY,
    created_by UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL, -- "Paseo a la Finca"
    description TEXT,
    type ENUM('trip', 'event', 'shared_living', 'other') DEFAULT 'trip',
    cover_image_url TEXT,
    start_date DATE,
    end_date DATE,
    currency_code VARCHAR(3) DEFAULT 'COP',
    is_settled BOOLEAN DEFAULT FALSE, -- Si ya se saldaron cuentas
    created_at TIMESTAMP DEFAULT NOW()
);

-- MIEMBROS DEL GRUPO
CREATE TABLE group_members (
    id UUID PRIMARY KEY,
    group_id UUID REFERENCES shared_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- NULL si no tiene cuenta
    name VARCHAR(100) NOT NULL, -- Nombre visible
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT NOW()
);

-- GASTOS DEL GRUPO
CREATE TABLE group_expenses (
    id UUID PRIMARY KEY,
    group_id UUID REFERENCES shared_groups(id) ON DELETE CASCADE,
    paid_by UUID REFERENCES group_members(id), -- Quién pagó
    category_id UUID REFERENCES categories(id),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL,
    split_type ENUM('equal', 'exact', 'percentage', 'shares') DEFAULT 'equal',
    attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- DIVISIÓN DEL GASTO
CREATE TABLE expense_splits (
    id UUID PRIMARY KEY,
    expense_id UUID REFERENCES group_expenses(id) ON DELETE CASCADE,
    member_id UUID REFERENCES group_members(id),
    amount DECIMAL(15,2) NOT NULL, -- Lo que debe
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP
);

-- PRESUPUESTOS POR CATEGORÍA
CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    amount DECIMAL(15,2) NOT NULL,
    period ENUM('weekly', 'monthly', 'yearly') DEFAULT 'monthly',
    alert_threshold INTEGER DEFAULT 80, -- Alertar al 80%
    year INTEGER,
    month INTEGER, -- NULL si es presupuesto general
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICACIONES Y RECORDATORIOS
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type ENUM('bill_reminder', 'budget_alert', 'percentage_status', 'group_update', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB, -- Datos adicionales para deep linking
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## MÓDULOS Y FUNCIONALIDADES DETALLADAS

### 1. 🔐 MÓDULO DE AUTENTICACIÓN

**Funcionalidades:**
- Registro con email/contraseña
- Login con email/contraseña
- Login con Google OAuth 2.0 (Google Sign-In)
- Recuperación de contraseña por email
- Verificación de email
- Sesiones persistentes con refresh tokens
- Logout en todos los dispositivos
- Autenticación biométrica (huella/face) en móvil

**Endpoints API:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
POST   /api/auth/refresh-token
POST   /api/auth/logout
DELETE /api/auth/sessions (cerrar todas las sesiones)
```

**Validaciones:**
- Email válido y único
- Contraseña mínimo 8 caracteres, 1 mayúscula, 1 número, 1 especial
- Rate limiting: máximo 5 intentos de login por minuto
- Tokens JWT con expiración de 15 minutos (access) y 7 días (refresh)

---

### 2. 💰 MÓDULO DE TRANSACCIONES (Ingresos/Egresos)

**Funcionalidades:**
- CRUD completo de transacciones
- Filtros avanzados: por fecha, categoría, cuenta, monto, tipo
- Búsqueda por descripción/notas
- Transacciones recurrentes (programadas)
- Adjuntar foto de recibo/factura
- Geolocalización opcional
- Tags personalizados
- Asignar a porcentaje de distribución

**Endpoints API:**
```
GET    /api/transactions?page=1&limit=20&type=expense&category_id=xxx&from=2024-01-01&to=2024-01-31
POST   /api/transactions
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id
POST   /api/transactions/:id/duplicate
GET    /api/transactions/recurring
POST   /api/transactions/bulk (importación masiva)
```

**UI/UX Móvil (Material Design 3):**
- FAB (Floating Action Button) con opción rápida de + Ingreso / + Egreso
- Bottom Sheet para formulario de nueva transacción
- Chips para selección rápida de categoría
- Date Picker con calendario visual
- Slider o input numérico para monto
- Swipe actions: editar (derecha), eliminar (izquierda)
- Pull to refresh
- Lista con agrupación por fecha

---

### 3. 📊 MÓDULO DE PORCENTAJES

**Funcionalidades:**
- CRUD de reglas de porcentaje
- Validación: suma total no puede exceder 100%
- Ajustes mensuales temporales con impacto visual
- Dashboard de ejecución por porcentaje
- Historial anual de acumulados
- Alertas de sub-ejecución

**Lógica de Negocio:**
```javascript
// Al registrar un ingreso:
async function distributeIncome(userId, incomeAmount, date) {
    const rules = await getActivePercentageRules(userId);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    for (const rule of rules) {
        // Verificar si hay ajuste para este mes
        const adjustment = await getMonthlyAdjustment(rule.id, year, month);
        const effectivePercentage = adjustment?.adjusted_percentage || rule.percentage;
        
        const allocatedAmount = incomeAmount * (effectivePercentage / 100);
        
        await createPercentageExecution({
            user_id: userId,
            percentage_rule_id: rule.id,
            year,
            month,
            allocated_amount: allocatedAmount,
            executed_amount: 0
        });
    }
}

// Al registrar un egreso vinculado a porcentaje:
async function executeFromPercentage(userId, percentageRuleId, expenseAmount, date) {
    const execution = await getOrCreateExecution(userId, percentageRuleId, date);
    execution.executed_amount += expenseAmount;
    await saveExecution(execution);
    
    // Verificar si excede lo asignado
    if (execution.executed_amount > execution.allocated_amount) {
        await sendOverExecutionAlert(userId, percentageRuleId);
    }
}
```

**Endpoints API:**
```
GET    /api/percentages
POST   /api/percentages
PUT    /api/percentages/:id
DELETE /api/percentages/:id
POST   /api/percentages/:id/adjust-monthly
GET    /api/percentages/execution?year=2024&month=3
GET    /api/percentages/annual-summary?year=2024
GET    /api/percentages/impact-simulation (simular cambio de %)
```

**Vista de Estadísticas de Porcentajes:**
```
+------------------------------------------+
|  PORCENTAJES - Marzo 2024                |
+------------------------------------------+
|                                          |
|  [====75%====    ] Ahorro (20%)          |
|  Asignado: $400,000 | Ejecutado: $300,000|
|  Pendiente: $100,000                     |
|                                          |
|  [=======100%=======] Gastos Fijos (50%) |
|  Asignado: $1,000,000 | Ejecutado: $1M   |
|  ✓ Completado                            |
|                                          |
|  [==45%===         ] Inversión (15%)     |
|  Asignado: $300,000 | Ejecutado: $135,000|
|  Pendiente: $165,000                     |
|                                          |
|  [==30%==          ] Donaciones (5%)     |
|  Asignado: $100,000 | Ejecutado: $30,000 |
|  Pendiente: $70,000                      |
|                                          |
+------------------------------------------+
|  📊 Ver Resumen Anual                    |
+------------------------------------------+
```

---

### 4. 🏠 MÓDULO MIS CUENTAS MENSUALES

**Funcionalidades:**
- CRUD de obligaciones mensuales
- Dos modos de registro:
  1. **Manual:** Ingresar datos manualmente
  2. **Con IA (OCR):** Tomar foto de factura → extraer nombre, referencia, monto
- Recordatorios configurables (push notifications)
- Calendario de vencimientos
- Historial de pagos
- Estado: Pendiente, Pagado, Vencido, Parcial
- Marcado automático como pagado al registrar transacción

**Integración OCR:**
```javascript
// Usando Google ML Kit o Tesseract
async function extractBillDataFromImage(imageBase64) {
    const ocrResult = await performOCR(imageBase64);
    
    // Usar regex o NLP para extraer:
    const extractedData = {
        provider: extractProvider(ocrResult), // "EPM", "Claro"
        reference: extractReference(ocrResult), // Número de referencia
        amount: extractAmount(ocrResult), // $150,000
        dueDate: extractDueDate(ocrResult), // 15/03/2024
        confidence: calculateConfidence(ocrResult)
    };
    
    return extractedData;
}
```

**Endpoints API:**
```
GET    /api/bills
POST   /api/bills
PUT    /api/bills/:id
DELETE /api/bills/:id
POST   /api/bills/scan (OCR de factura)
GET    /api/bills/calendar?month=3&year=2024
POST   /api/bills/:id/mark-paid
GET    /api/bills/:id/payment-history
```

**UI/UX:**
- Lista de cuentas con indicador visual de estado (colores)
- Badge con días restantes o "Vencida"
- Opción de cámara integrada para escaneo
- Vista de calendario con marcas en días de vencimiento
- Bottom sheet de confirmación de pago

---

### 5. 🏝️ MÓDULO VIAJES / GASTOS COMPARTIDOS

**Funcionalidades:**
- CRUD de grupos
- Agregar integrantes (usuarios registrados o invitados)
- Registrar gastos indicando quién pagó
- División automática: igual, exacta, porcentaje, participaciones
- Cálculo de balances (quién debe a quién)
- Historial de gastos del evento
- Liquidación final con resumen de deudas
- Invitar por link o código

**Lógica de Balance:**
```javascript
function calculateGroupBalances(groupId) {
    const expenses = await getGroupExpenses(groupId);
    const members = await getGroupMembers(groupId);
    
    // Calcular cuánto pagó cada uno y cuánto debía
    const balances = {};
    members.forEach(m => balances[m.id] = { paid: 0, owes: 0 });
    
    for (const expense of expenses) {
        balances[expense.paid_by].paid += expense.amount;
        
        const splits = await getExpenseSplits(expense.id);
        splits.forEach(split => {
            balances[split.member_id].owes += split.amount;
        });
    }
    
    // Calcular balance neto
    const netBalances = members.map(m => ({
        member: m,
        balance: balances[m.id].paid - balances[m.id].owes
        // Positivo = le deben, Negativo = debe
    }));
    
    // Simplificar deudas
    return simplifyDebts(netBalances);
}
```

**Endpoints API:**
```
GET    /api/groups
POST   /api/groups
GET    /api/groups/:id
PUT    /api/groups/:id
DELETE /api/groups/:id
POST   /api/groups/:id/members
DELETE /api/groups/:id/members/:memberId
POST   /api/groups/:id/expenses
GET    /api/groups/:id/expenses
GET    /api/groups/:id/balances
POST   /api/groups/:id/settle (liquidar grupo)
POST   /api/groups/:id/invite-link
```

---

### 6. 📈 MÓDULO DE ESTADÍSTICAS

**Tipos de Visualizaciones:**

1. **Gráfico Circular (Pie/Donut):**
   - Distribución de gastos por categoría
   - Distribución de ingresos por fuente
   - Estado de porcentajes (ejecutado vs pendiente)

2. **Gráfico de Barras:**
   - Comparativo mensual de ingresos vs egresos
   - Gastos por categoría mes a mes
   - Top 5 categorías de gasto

3. **Gráfico de Línea:**
   - Evolución del balance a lo largo del tiempo
   - Tendencia de gastos por categoría
   - Progreso de ahorro acumulado

4. **Tablas Dinámicas:**
   - Desglose detallado con filtros
   - Exportable a CSV/Excel

**Endpoints API:**
```
GET /api/stats/summary?period=month&date=2024-03
GET /api/stats/income-vs-expense?from=2024-01-01&to=2024-12-31
GET /api/stats/by-category?type=expense&period=month
GET /api/stats/trends?category_id=xxx&months=6
GET /api/stats/percentages-status?year=2024&month=3
GET /api/stats/percentages-annual?year=2024
GET /api/stats/saving-progress
GET /api/stats/spending-habits
GET /api/stats/budget-vs-actual
GET /api/stats/export?format=csv&from=2024-01-01&to=2024-03-31
```

**Métricas Clave:**
- Total ingresos del período
- Total egresos del período
- Balance (ingresos - egresos)
- Tasa de ahorro (% de ingresos ahorrados)
- Categoría con mayor gasto
- Promedio diario de gasto
- Comparativa con período anterior
- Proyección de fin de mes

---

### 7. 🏦 MÓDULO DE CUENTAS/MÉTODOS DE PAGO

**Funcionalidades:**
- CRUD de cuentas bancarias y métodos de pago (Tarjetas de crédito, Efectivo, Nequi, etc.)
- Asignar nombre, tipo, icono y color distintivo a cada cuenta
- Selección de cuenta de origen al crear o editar una transacción (obligatorio/opcional según configuración)
- Mostrar el saldo actual de cada cuenta (se calcula en base a transacciones o se ingresa manual)
- Secciones analíticas exclusivas:
  - Gráfico circular de distribución de gastos por cuenta
  - Gráfico de barras apiladas: ingresos vs egresos por cuenta en los últimos 6 meses

---

### 8. 🔔 MÓDULO DE NOTIFICACIONES

**Tipos de Notificaciones:**
- Recordatorio de vencimiento de cuenta (configurable: 3, 1, 0 días antes)
- Alerta de presupuesto (al 80%, 100%, excedido)
- Resumen semanal/mensual
- Porcentaje sub-ejecutado (fin de mes)
  - Dashboard que muestra ingresos, porcentaje ahorrado/invertido y estado del presupuesto
- **Módulo de Perfil y Preferencias**
  - Personalización de nombre y datos personales.
  - Selección dinámica de la Moneda Principal (reemplazo automático de la moneda visualizada en el sistema).
  - Almacenamiento en DB (`appWebUrl`) para que el usuario documente dónde ha publicado y accede a la versión web de la plataforma, netamente informativo y copiable.
- **Push Notifications** (Fase 2)
  - Firebase Cloud Messaging para recordatorios.l (opcional, configurable)
- In-app notifications

---

### 9. 🎨 SISTEMA DE COLORES Y PERSONALIZACIÓN

**Funcionalidades:**
- Paleta de colores predefinida
- Color picker para personalización
- Colores por defecto según tipo de categoría
- Tema claro/oscuro
- Accent color configurable

**Paleta de Mi Alfolí:**
```javascript
// Tema principal "Cosecha y Providencia"
const miAlfoliTheme = {
    // Marca
    brand: {
        primary:   '#006064',  // Azul Petróleo — estabilidad y confianza
        secondary: '#FFB300',  // Oro Ámbar — cosecha y bendición
        tertiary:  '#BF360C',  // Terracota — acción con propósito
    },
    surface: {
        light: '#F5F5F0',      // Gris Hueso (pergamino)
        dark:  '#21211F',      // Gris Ceniza profundo
    },
    // Categorías financieras
    income:     ['#FFB300', '#FFC107', '#FFD54F'],  // Tonos dorados (cosecha)
    expense:    ['#BF360C', '#E64A19', '#FF8A65'],  // Tonos terracota (gasto)
    savings:    ['#006064', '#00838F', '#4DD0E1'],  // Tonos petróleo (alfolí)
    tithes:     ['#006064'],                        // Diezmos (primario sagrado)
    missions:   ['#BF360C'],                        // Misiones/Donaciones
    investment: ['#00838F', '#00ACC1'],
    accounts: {
        bank:    '#006064',
        credit:  '#BF360C',
        cash:    '#FFB300',
        digital: '#00838F',
    },
};

// Versículo mostrado en la app (Malaquías 3:10)
const versiculoAlfoli = {
    corto:    '"Traed todos los diezmos al alfolí..." — Mal. 3:10',
    completo: 'Traed todos los diezmos al alfolí y haya alimento en mi casa; '
             + 'y probadme ahora en esto, dice Jehová de los ejércitos, '
             + 'si no os abriré las ventanas de los cielos, '
             + 'y derramaré sobre vosotros bendición hasta que sobreabunde.',
};
```

---

## SEGURIDAD Y PROTECCIÓN DE DATOS

### Medidas Implementadas:
1. **Encriptación en tránsito:** HTTPS/TLS 1.3
2. **Encriptación en reposo:** AES-256 para datos sensibles
3. **Hashing de contraseñas:** bcrypt con salt rounds = 12
4. **Tokens seguros:** JWT con RS256, refresh token rotation
5. **Validación de entrada:** Sanitización y validación en todos los endpoints
6. **Rate Limiting:** Por IP y por usuario
7. **CORS configurado:** Solo orígenes permitidos
8. **Headers de seguridad:** Helmet.js (XSS, CSRF, etc.)
9. **Auditoría:** Log de acciones sensibles
10. **Backup automático:** Diario con retención de 30 días

### Datos Sensibles Encriptados:
- Números de cuenta bancaria
- Referencias de pago
- Tokens de integración

---

## SINCRONIZACIÓN EN TIEMPO REAL

**Implementación con Socket.io:**
```javascript
// Servidor
io.on('connection', (socket) => {
    socket.on('join-user-room', (userId) => {
        socket.join(`user:${userId}`);
    });
    
    // Emitir cuando hay cambios
    socket.on('transaction-created', (data) => {
        io.to(`user:${data.userId}`).emit('sync-transactions', data);
    });
});

// Cliente
socket.on('sync-transactions', (data) => {
    // Actualizar estado local
    store.dispatch(updateTransactions(data));
});
```

**Estrategia Offline-First:**
- SQLite local en móvil
- IndexedDB en web
- Sincronización al reconectar
- Resolución de conflictos por timestamp

---

## DISEÑO UI/UX - MATERIAL DESIGN 3

### Principios:
1. **Color System:** Dynamic color basado en wallpaper (Android 12+)
2. **Typography:** Roboto / Inter
3. **Elevation:** Sombras sutiles según Material You
4. **Motion:** Transiciones fluidas con shared element transitions
5. **Components:** 
   - Navigation Bar (bottom)
   - Top App Bar con search
   - Cards con rounded corners (16dp)
   - FAB expandido
   - Bottom Sheets modales
   - Chips para filtros
   - Snackbars para feedback

### Navegación Principal:
```
[🏠 Inicio] [📊 Stats] [➕] [🗂️ Cuentas] [👤 Perfil]
```

### Pantallas:
1. **Splash / Onboarding:** Logo Mi Alfolí + versículo Malaquías 3:10 animado
2. **Dashboard/Home:** Resumen del mes, últimas transacciones, alertas, versículo de inspiración
3. **Transacciones:** Lista con filtros, búsqueda
4. **Nueva Transacción:** Bottom sheet o pantalla completa
5. **Estadísticas:** Tabs con diferentes vistas
6. **Cuentas Mensuales:** Lista con calendario
7. **Grupos:** Lista de grupos activos
8. **Porcentajes:** Configuración y estado
9. **Perfil/Configuración:** Cuenta, preferencias, seguridad

---

## CATEGORÍAS POR DEFECTO

### Ingresos:
| Categoría | Icono | Color |
|-----------|-------|-------|
| Sueldo | 💼 | #4CAF50 |
| Freelance | 💻 | #8BC34A |
| Inversiones | 📈 | #00BCD4 |
| Regalos | 🎁 | #E91E63 |
| Reembolsos | 🔄 | #FF9800 |
| Otros | 📋 | #9E9E9E |

### Egresos:
| Categoría | Icono | Color |
|-----------|-------|-------|
| Servicios | 💡 | #FF5722 |
| Transporte | 🚗 | #2196F3 |
| Alimentación | 🍔 | #4CAF50 |
| Mercado | 🛒 | #8BC34A |
| Restaurantes | 🍽️ | #FF9800 |
| Entretenimiento | 🎬 | #9C27B0 |
| Suscripciones | 📱 | #3F51B5 |
| Salud | 🏥 | #F44336 |
| Educación | 📚 | #00BCD4 |
| Ropa | 👕 | #E91E63 |
| Hogar | 🏠 | #795548 |
| Donación | ❤️ | #E91E63 |
| Transferencias | 💸 | #607D8B |
| Otros | 📋 | #9E9E9E |

---

## IMPLEMENTACIÓN POR FASES

### Fase 1 - MVP (4-6 semanas):
- [ ] Autenticación (email + Google)
- [ ] CRUD Transacciones básico
- [ ] CRUD Categorías
- [ ] Dashboard simple
- [ ] Sincronización básica

### Fase 2 - Core Features (4-6 semanas):
- [ ] Sistema de Porcentajes
- [ ] Cuentas Mensuales con recordatorios
- [ ] Estadísticas básicas (gráficos)
- [ ] Push Notifications
- [ ] Tema oscuro

### Fase 3 - Advanced (4-6 semanas):
- [ ] Grupos compartidos
- [ ] OCR para facturas
- [ ] Presupuestos con alertas
- [ ] Estadísticas avanzadas
- [ ] Exportación de datos

### Fase 4 - Polish (2-4 semanas):
- [ ] Offline mode
- [ ] Widgets (Android)
- [ ] Shortcuts
- [ ] Optimización de rendimiento
- [ ] Testing y QA

---

## CONSIDERACIONES FINALES

1. **Escalabilidad:** Arquitectura preparada para crecimiento
2. **Mantenibilidad:** Código limpio, documentado, con tests
3. **Accesibilidad:** WCAG 2.1 AA compliance
4. **Internacionalización:** Preparado para múltiples idiomas
5. **Analytics:** Integrar Firebase Analytics o similar
6. **Feedback:** Sistema de reportes de bugs in-app

---

## PROMPT DE DESARROLLO

Desarrolla **Mi Alfolí**, una aplicación completa de gestión de finanzas personales multiplataforma (Android + Web) siguiendo las especificaciones anteriores. La identidad visual se basa en Malaquías 3:10 con paleta "Cosecha y Providencia" (Azul Petróleo `#006064`, Oro Ámbar `#FFB300`, Terracota `#BF360C`).

El logo oficial SVG debe integrarse en Splash Screen, AppBar y pantalla "Acerca de".

Prioriza:

1. Identidad visual **Mi Alfolí** consistente en todas las pantallas
2. Versículo Malaquías 3:10 visible en Dashboard como tarjeta inspiracional
3. Seguridad de datos financieros
4. UX intuitiva con Material Design 3 usando la paleta de la app
5. Sincronización confiable en tiempo real
6. Sistema de porcentajes único y flexible
7. Estadísticas visuales y accionables

La aplicación debe permitir al usuario tener control total sobre sus finanzas con una experiencia moderna, rápida, segura y con propósito espiritual.
