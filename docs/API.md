# API REST — App Reparto

**Base URL:** `http://localhost:8080/api`  
**Autenticación:** `Authorization: Bearer <token>` en todos los endpoints excepto `/auth/**`  
**Formato respuesta:** `{ "success": true, "message": "...", "data": {...} }`

---

## Auth

### POST /auth/login
Inicia sesión y obtiene token JWT.

**Body:**
```json
{ "email": "admin@appreparto.cl", "password": "Admin123!" }
```
**Response:**
```json
{
  "success": true,
  "data": { "token": "eyJ...", "rol": "ADMIN", "nombre": "Administrador" }
}
```

### POST /auth/register
Crea un nuevo usuario. Solo `ADMIN`.

**Body:**
```json
{ "nombre": "Juan Pérez", "email": "juan@empresa.cl", "password": "Pass123!", "rol": "OPERARIO" }
```

---

## Usuarios

| Método | Endpoint                  | Roles  | Descripción                  |
|--------|---------------------------|--------|------------------------------|
| GET    | `/usuarios`               | ADMIN  | Listar todos los usuarios    |
| GET    | `/usuarios/{id}`          | ADMIN  | Obtener usuario por ID       |
| PATCH  | `/usuarios/{id}/activo`   | ADMIN  | Activar/desactivar usuario   |

**PATCH /usuarios/{id}/activo?activo=false**

---

## Clientes

| Método | Endpoint          | Roles              | Descripción           |
|--------|-------------------|--------------------|-----------------------|
| GET    | `/clientes`       | EJECUTIVO, ADMIN   | Listar clientes       |
| GET    | `/clientes/{id}`  | EJECUTIVO, ADMIN   | Obtener cliente       |
| POST   | `/clientes`       | EJECUTIVO, ADMIN   | Crear cliente         |
| PUT    | `/clientes/{id}`  | EJECUTIVO, ADMIN   | Actualizar cliente    |
| DELETE | `/clientes/{id}`  | ADMIN              | Eliminar cliente      |

**POST/PUT /clientes body:**
```json
{
  "rut": "12345678-9",
  "nombre": "Supermercado El Norte",
  "direccion": "Av. Providencia 1234, Santiago",
  "telefono": "+56912345678",
  "email": "contacto@elnorte.cl",
  "latitud": -33.4311,
  "longitud": -70.6121
}
```

---

## Pedidos

| Método | Endpoint                     | Roles                      | Descripción                  |
|--------|------------------------------|----------------------------|------------------------------|
| GET    | `/pedidos`                   | EJECUTIVO, ADMIN           | Listar pedidos               |
| GET    | `/pedidos?estado=PENDIENTE`  | EJECUTIVO, ADMIN           | Filtrar por estado           |
| GET    | `/pedidos/{id}`              | TODOS                      | Obtener pedido               |
| POST   | `/pedidos`                   | EJECUTIVO, ADMIN           | Crear pedido                 |
| PUT    | `/pedidos/{id}/estado`       | EJECUTIVO, ADMIN, OPERARIO | Cambiar estado               |

**POST /pedidos body:**
```json
{
  "cliente": { "id": 1 },
  "direccionEntrega": "Av. Providencia 1234, Santiago",
  "fechaEntrega": "2026-06-20",
  "prioridad": "ALTA",
  "observaciones": "Entregar en bodega trasera"
}
```

**PUT /pedidos/{id}/estado?estado=EN_RUTA**

Estados válidos: `PENDIENTE`, `ASIGNADO`, `EN_RUTA`, `ENTREGADO`, `RECHAZADO`, `REAGENDADO`

---

## Rutas

| Método | Endpoint                           | Roles            | Descripción                       |
|--------|------------------------------------|------------------|-----------------------------------|
| GET    | `/rutas`                           | EJECUTIVO, ADMIN | Listar rutas                      |
| GET    | `/rutas/{id}`                      | TODOS            | Obtener ruta                      |
| GET    | `/rutas/mi-ruta`                   | OPERARIO         | Ruta activa del operario          |
| POST   | `/rutas`                           | EJECUTIVO, ADMIN | Crear ruta                        |
| PUT    | `/rutas/{id}/reordenar`            | EJECUTIVO, ADMIN | Reordenar pedidos                 |
| POST   | `/rutas/{rutaId}/pedidos/{pedidoId}` | EJECUTIVO, ADMIN | Agregar pedido a ruta           |

**POST /rutas body:**
```json
{
  "vehiculo": { "id": 1 },
  "usuario": { "id": 3 },
  "nombre": "Ruta Norte - 18 Jun",
  "fecha": "2026-06-18"
}
```

**PUT /rutas/{id}/reordenar body:** `[3, 1, 5, 2, 4]` (lista de pedidoIds en orden deseado)

---

## Documentos

| Método | Endpoint                        | Roles  | Descripción               |
|--------|---------------------------------|--------|---------------------------|
| POST   | `/documentos/subir`             | TODOS  | Subir foto/documento a S3 |
| GET    | `/documentos/pedido/{pedidoId}` | TODOS  | Documentos de un pedido   |

**POST /documentos/subir** (multipart/form-data):
- `archivo`: file (imagen o PDF)
- `pedidoId`: Long
- `tipo`: `FOTO_FACTURA` | `FOTO_EVIDENCIA` | `DOCUMENTO_ADJUNTO`

---

## Tracking GPS

| Método | Endpoint                           | Roles            | Descripción                     |
|--------|------------------------------------|------------------|---------------------------------|
| GET    | `/tracking/vehiculo/{vehiculoId}`  | EJECUTIVO, ADMIN | Historial GPS del vehículo      |
| WS     | `ws://host/ws` (STOMP)             | OPERARIO         | Enviar posición en tiempo real  |

**WebSocket STOMP:**
- Endpoint: `/ws` (con SockJS fallback)
- Enviar a: `/app/tracking`
- Suscribir en: `/topic/tracking/{vehiculoId}`

**Mensaje de tracking:**
```json
{ "vehiculoId": 1, "latitud": -33.45, "longitud": -70.67, "velocidadKmh": 45.2 }
```

---

## Notificaciones

| Método | Endpoint                      | Roles | Descripción                  |
|--------|-------------------------------|-------|------------------------------|
| GET    | `/notificaciones`             | TODOS | Notificaciones del usuario   |
| PATCH  | `/notificaciones/{id}/leida`  | TODOS | Marcar como leída            |

---

## Códigos de error estándar

| HTTP | Significado                              |
|------|------------------------------------------|
| 200  | OK                                       |
| 201  | Creado                                   |
| 400  | Error de validación (ver campo `data`)   |
| 401  | No autenticado / token inválido          |
| 403  | Sin permisos para esta acción            |
| 404  | Recurso no encontrado                    |
| 500  | Error interno del servidor               |
