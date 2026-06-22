# App de Gestión de Reparto — DUOC UC 2026

Sistema de gestión de distribución y reparto para retail. Monorepo con backend Spring Boot, frontend React y app móvil React Native.

## Estructura

```
app-reparto/
├── backend/          # Spring Boot (Java 17) — API REST + WebSockets
├── web/              # React + Vite + MUI — Panel Ejecutivo / Admin
├── mobile/           # React Native — App Operario
├── database/         # schema.sql + seed.sql
├── docs/             # API.md, PLAN_CONSTRUCCION.md
└── docker-compose.yml
```

## Inicio rápido (desarrollo local)

### 1. Levantar PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Iniciar backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend disponible en `http://localhost:8080`

### 3. Iniciar frontend web

```bash
cd web
npm install
npm run dev
```

Web disponible en `http://localhost:3000`

### 4. Iniciar app móvil (Android)

```bash
cd mobile
npm install
npx react-native run-android
```

## Usuarios de prueba

| Email                      | Password   | Rol       |
|----------------------------|------------|-----------|
| admin@appreparto.cl        | Admin123!  | ADMIN     |
| ejecutivo@appreparto.cl    | Admin123!  | EJECUTIVO |
| operario@appreparto.cl     | Admin123!  | OPERARIO  |

## Tecnologías

| Capa        | Tecnología                    |
|-------------|-------------------------------|
| Backend     | Java 17, Spring Boot 3.2      |
| Frontend    | React 18, Vite, MUI v5        |
| Mobile      | React Native 0.73             |
| Base datos  | PostgreSQL 15 (Docker / RDS)  |
| Auth        | JWT (jjwt 0.12)               |
| Tiempo real | WebSocket STOMP               |
| Storage     | AWS S3                        |
| Email/SMS   | AWS SES / SNS                 |

## Plan de Sprints

Ver [PLAN_CONSTRUCCION.md](docs/PLAN_CONSTRUCCION.md) para el detalle completo de los 8 sprints.

| Sprint | Objetivo                  | Semanas |
|--------|---------------------------|---------|
| 0      | Setup                     | 1       |
| 1      | Auth + Usuarios           | 2–3     |
| 2      | Clientes + Pedidos        | 4–5     |
| 3      | Rutas + Asignación        | 6–7     |
| 4      | Tracking GPS              | 8–9     |
| 5      | Facturas + S3             | 10–11   |
| 6      | Notificaciones + Dashboard| 12–13   |
| 7      | Despliegue AWS + QA       | 14–15   |
