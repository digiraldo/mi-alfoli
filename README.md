<div align="center">
  <img src="alfoli.svg" alt="Mi Alfolí Logo" width="150" height="150">
  
  # Mi Alfolí
  **Gestor de Finanzas Personales con Propósito**

  > *"Traed todos los diezmos al alfolí y haya alimento en mi casa; y probadme ahora en esto, dice Jehová de los ejércitos, si no os abriré las ventanas de los cielos, y derramaré sobre vosotros bendición hasta que sobreabunde."*<br> — **Malaquías 3:10 (RVR1960)**
</div>

---

## 📖 Acerca del Proyecto

**Mi Alfolí** es una aplicación multiplataforma de gestión de finanzas personales diseñada para brindar control total sobre ingresos, gastos, ahorros y donaciones, todo bajo un enfoque de propósito espiritual y organización inteligente.

La aplicación permite la sincronización en tiempo real, estadísticas avanzadas y un sistema de porcentajes dinámicos para distribuir los ingresos automáticamente conforme a metas predefinidas.

## ✨ Características Principales

- 📊 **Dashboard General:** Resumen visual rápido del estado financiero (Ingresos vs. Gastos).
- 💰 **Cuentas Bancarias:** Gestión de múltiples cuentas, tarjetas de crédito, billeteras digitales y efectivo.
- 📉 **Gastos Fijos y Recordatorios:** Seguimiento de suscripciones y facturas recurrentes con alertas.
- 🔣 **Distribución por Porcentajes:** Sistema inteligente para dividir ingresos automáticamente (Ej: 10% Diezmo, 50% Gastos, 20% Ahorro).
- 💳 **Tarjetas UI Visuales:** Interfaz realista para clasificar tarjetas y visualizar los saldos de cada una.
- 🎨 **Temas Personalizados:** Soporte completo para Modo Claro y Modo Oscuro.
- 🌍 **Soporte Multimoneda:** Posibilidad de trabajar con la moneda local de preferencia.
- 📱 **Diseño Responsive:** Accesible desde celular (Android iOS) como Progressive Web App y navegadores de escritorio.

## 🚀 Stack Tecnológico

El proyecto está construido bajo una arquitectura moderna dividida en Frontend y Backend:

### **Frontend (Cliente)**
- **Framework:** Next.js (React.js)
- **Lenguaje:** TypeScript
- **UI & Estilos:** Material UI (MUI) v5
- **Gestión de Estado:** Zustand
- **Validaciones:** Zod & React Hook Form
- **Iconos:** MUI Icons & SVG personalizados

### **Backend (Servidor - API REST)**
- **Entorno:** Node.js con Express
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL alojada en Supabase
- **ORM:** Prisma
- **Autenticación:** Google OAuth & JWT
- **Seguridad:** CORS, Helmet, Rate Limiting
- **Tareas Programadas (Cron):** Node-cron para recordatorios de gastos fijos.

## ⚙️ Configuración y Despliegue Local

Para correr el proyecto localmente, necesitas tener instalado [Node.js](https://nodejs.org/) (v18 o superior) y una base de datos PostgreSQL.

### 1. Clonar el repositorio
```bash
git clone https://github.com/digiraldo/mi-alfoli.git
cd mi-alfoli
```

### 2. Configurar el Servidor y Base de Datos (Backend)
```bash
cd server
npm install
```
Añade un archivo `.env` en la carpeta `server/` con tus credenciales:
```env
DATABASE_URL="postgresql://usuario:password@host:puerto/bd"
JWT_SECRET="tu-secreto-super-seguro"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```
Migra la base de datos y arranca el servidor:
```bash
npx prisma migrate dev
npm run dev
```

### 3. Configurar la Interfaz Visual (Frontend)
Abre otra terminal en la raíz del proyecto (`/mi-alfoli`):
```bash
npm install
```
Añade un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="tu-client-id-de-google.apps.googleusercontent.com"
```
Arranca la aplicación cliente:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## 🤝 Contribución
¡Las contribuciones son bienvenidas! Si tienes ideas para nuevas características, encuentras un bug o deseas mejorar el código, por favor abre un Pull Request o crea un Issue detallado en el repositorio.

---
Hecho con propósito y dedicación. 🌾
