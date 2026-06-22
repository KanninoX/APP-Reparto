-- =========================================================
-- Datos de prueba — App Reparto
-- =========================================================

-- Admin inicial (password: Admin123!)
-- Hash BCrypt generado para 'Admin123!'
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador',  'admin@appreparto.cl',    '$2a$10$2YrODNg3ZFtGrh2I2OdW8.gZd2lz0ssS1822cHcmA9FsnJAblHRJC', 'ADMIN'),
('María González', 'ejecutivo@appreparto.cl','$2a$10$2YrODNg3ZFtGrh2I2OdW8.gZd2lz0ssS1822cHcmA9FsnJAblHRJC', 'EJECUTIVO'),
('Carlos Rojas',   'operario@appreparto.cl', '$2a$10$2YrODNg3ZFtGrh2I2OdW8.gZd2lz0ssS1822cHcmA9FsnJAblHRJC', 'OPERARIO');

-- Vehículos de prueba
INSERT INTO vehiculos (codigo, patente, capacidad_kg, tipo) VALUES
('VEH-001', 'AB-CD-12', 1500.0, 'Furgón'),
('VEH-002', 'EF-GH-34', 2000.0, 'Camión pequeño'),
('VEH-003', 'IJ-KL-56',  800.0, 'Van');

-- Clientes de prueba
INSERT INTO clientes (rut, nombre, direccion, telefono, email, latitud, longitud) VALUES
('12345678-9', 'Supermercado El Norte',   'Av. Providencia 1234, Santiago', '+56912345678', 'contacto@elnorte.cl',   -33.4311, -70.6121),
('98765432-1', 'Ferretería Los Andes',    'Calle Serrano 456, Santiago',    '+56987654321', 'compras@losandes.cl',  -33.4489, -70.6553),
('55544433-2', 'Distribuidora Central',   'Gran Avenida 789, San Miguel',   '+56955544433', 'pedidos@central.cl',   -33.4952, -70.6673),
('11122233-4', 'Minimarket La Esquina',   'Calle Tocornal 321, Santiago',   '+56911122233', 'info@laesquina.cl',    -33.4580, -70.6490),
('77788899-0', 'Panadería San Francisco', 'Av. Matta 654, Santiago',        '+56977788899', 'pedidos@sanfran.cl',   -33.4652, -70.6411);

-- Pedidos de prueba
INSERT INTO pedidos (cliente_id, usuario_id, vehiculo_id, fecha_entrega, estado, direccion_entrega, prioridad) VALUES
(1, 2, 1, CURRENT_DATE + 1, 'PENDIENTE', 'Av. Providencia 1234, Santiago',  'ALTA'),
(2, 2, 1, CURRENT_DATE + 1, 'PENDIENTE', 'Calle Serrano 456, Santiago',      'NORMAL'),
(3, 2, 2, CURRENT_DATE + 1, 'PENDIENTE', 'Gran Avenida 789, San Miguel',     'ALTA'),
(4, 2, 2, CURRENT_DATE + 2, 'PENDIENTE', 'Calle Tocornal 321, Santiago',     'BAJA'),
(5, 2, 3, CURRENT_DATE + 2, 'PENDIENTE', 'Av. Matta 654, Santiago',          'NORMAL');
