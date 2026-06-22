-- =========================================================
-- App Reparto — Schema PostgreSQL
-- Sprint 0 — Versión inicial
-- =========================================================

-- ENUMs
CREATE TYPE rol_usuario   AS ENUM ('OPERARIO', 'EJECUTIVO', 'ADMIN');
CREATE TYPE estado_pedido AS ENUM ('PENDIENTE', 'ASIGNADO', 'EN_RUTA', 'ENTREGADO', 'RECHAZADO', 'REAGENDADO');
CREATE TYPE estado_ruta   AS ENUM ('PLANEADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');
CREATE TYPE estado_factura AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA');
CREATE TYPE tipo_documento AS ENUM ('FOTO_FACTURA', 'FOTO_EVIDENCIA', 'DOCUMENTO_ADJUNTO');
CREATE TYPE tipo_notificacion AS ENUM ('SMS', 'EMAIL', 'PUSH');

-- =========================================================
-- USUARIOS
-- =========================================================
CREATE TABLE usuarios (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(100)   NOT NULL,
    email         VARCHAR(150)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)   NOT NULL,
    rol           rol_usuario    NOT NULL,
    activo        BOOLEAN        NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- =========================================================
-- CLIENTES
-- =========================================================
CREATE TABLE clientes (
    id        BIGSERIAL PRIMARY KEY,
    rut       VARCHAR(20)  NOT NULL UNIQUE,
    nombre    VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono  VARCHAR(20),
    email     VARCHAR(150),
    latitud   DOUBLE PRECISION,
    longitud  DOUBLE PRECISION
);

-- =========================================================
-- VEHÍCULOS
-- =========================================================
CREATE TABLE vehiculos (
    id           BIGSERIAL PRIMARY KEY,
    codigo       VARCHAR(20)  NOT NULL UNIQUE,
    patente      VARCHAR(10)  NOT NULL UNIQUE,
    capacidad_kg DOUBLE PRECISION,
    tipo         VARCHAR(50),
    activo       BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================================
-- PEDIDOS
-- =========================================================
CREATE TABLE pedidos (
    id                BIGSERIAL PRIMARY KEY,
    cliente_id        BIGINT          NOT NULL REFERENCES clientes(id),
    usuario_id        BIGINT          REFERENCES usuarios(id),
    vehiculo_id       BIGINT          REFERENCES vehiculos(id),
    fecha_creacion    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    fecha_entrega     DATE,
    estado            estado_pedido   NOT NULL DEFAULT 'PENDIENTE',
    direccion_entrega VARCHAR(255)    NOT NULL,
    prioridad         VARCHAR(10)     NOT NULL DEFAULT 'NORMAL',
    observaciones     VARCHAR(500),
    motivo_rechazo    VARCHAR(255),
    reagendar         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_pedidos_estado    ON pedidos(estado);
CREATE INDEX idx_pedidos_cliente   ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_vehiculo  ON pedidos(vehiculo_id);

-- =========================================================
-- RUTAS
-- =========================================================
CREATE TABLE rutas (
    id          BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT       NOT NULL REFERENCES vehiculos(id),
    usuario_id  BIGINT       NOT NULL REFERENCES usuarios(id),
    nombre      VARCHAR(100) NOT NULL,
    fecha       DATE         NOT NULL,
    estado      estado_ruta  NOT NULL DEFAULT 'PLANEADA'
);

-- Tabla puente: ruta ↔ pedidos con orden de entrega
CREATE TABLE ruta_pedidos (
    ruta_id        BIGINT NOT NULL REFERENCES rutas(id) ON DELETE CASCADE,
    pedido_id      BIGINT NOT NULL REFERENCES pedidos(id),
    orden_entrega  INTEGER NOT NULL,
    PRIMARY KEY (ruta_id, pedido_id)
);

-- =========================================================
-- TRACKING GPS
-- =========================================================
CREATE TABLE tracking_gps (
    id            BIGSERIAL PRIMARY KEY,
    vehiculo_id   BIGINT           NOT NULL REFERENCES vehiculos(id),
    latitud       DOUBLE PRECISION NOT NULL,
    longitud      DOUBLE PRECISION NOT NULL,
    timestamp     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    velocidad_kmh DOUBLE PRECISION
);

CREATE INDEX idx_tracking_vehiculo_ts ON tracking_gps(vehiculo_id, timestamp DESC);

-- =========================================================
-- FACTURAS
-- =========================================================
CREATE TABLE facturas (
    id              BIGSERIAL PRIMARY KEY,
    pedido_id       BIGINT          NOT NULL UNIQUE REFERENCES pedidos(id),
    numero_factura  VARCHAR(30)     NOT NULL UNIQUE,
    monto_total     NUMERIC(12, 2)  NOT NULL,
    fecha_emision   DATE            NOT NULL DEFAULT CURRENT_DATE,
    estado          estado_factura  NOT NULL DEFAULT 'PENDIENTE',
    url_pdf_s3      VARCHAR(500)
);

-- =========================================================
-- DOCUMENTOS (fotos de facturas y evidencias)
-- =========================================================
CREATE TABLE documentos (
    id           BIGSERIAL PRIMARY KEY,
    pedido_id    BIGINT          NOT NULL REFERENCES pedidos(id),
    tipo         tipo_documento  NOT NULL,
    url_s3       VARCHAR(500)    NOT NULL,
    fecha_subida TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    usuario_id   BIGINT          NOT NULL REFERENCES usuarios(id)
);

-- =========================================================
-- NOTIFICACIONES
-- =========================================================
CREATE TABLE notificaciones (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      BIGINT              NOT NULL REFERENCES usuarios(id),
    tipo            tipo_notificacion   NOT NULL,
    titulo          VARCHAR(150)        NOT NULL,
    mensaje         VARCHAR(500)        NOT NULL,
    leida           BOOLEAN             NOT NULL DEFAULT FALSE,
    fecha_creacion  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    fecha_envio     TIMESTAMPTZ
);

CREATE INDEX idx_notif_usuario_leida ON notificaciones(usuario_id, leida);

-- =========================================================
-- DISPOSITIVOS MÓVILES (HU3)
-- =========================================================
CREATE TABLE dispositivos (
    id          BIGSERIAL PRIMARY KEY,
    device_id   VARCHAR(255) NOT NULL,
    usuario_id  BIGINT       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    autorizado  BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, usuario_id)
);

CREATE INDEX idx_dispositivos_usuario ON dispositivos(usuario_id);
CREATE INDEX idx_dispositivos_pendientes ON dispositivos(autorizado) WHERE autorizado = FALSE;
