-- ==========================================
-- 1. CREACIÓN DE TABLAS (Usando auth_user de Django)
-- ==========================================

-- Tabla PRODUCT
CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL
);

-- Tabla ORDER (Sincronizada con el modelo Django)
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL, 
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    idempotency_key VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
    CONSTRAINT orders_idempotency_key_unique UNIQUE (idempotency_key)
);

-- Tabla ORDER_ITEM
CREATE TABLE order_item (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE RESTRICT
);

-- ==========================================
-- 2. CREACIÓN DE ÍNDICES PARA OPTIMIZACIÓN
-- ==========================================

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
-- Índice explícito para búsquedas rápidas por llave de idempotencia
CREATE INDEX idx_orders_idempotency_key ON orders(idempotency_key);

CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_order_item_product_id ON order_item(product_id);

-- ==========================================
-- 3. INSERCIÓN DE DATOS INICIALES (Productos)
-- ==========================================

INSERT INTO product (sku, name, price, stock_quantity) VALUES
('TEC-001', 'Laptop Gamer Pro', 1200.00, 15),
('TEC-002', 'Mouse Inalámbrico RGB', 25.50, 50),
('TEC-003', 'Teclado Mecánico', 85.00, 30),
('TEC-004', 'Monitor 27 Pulgadas 4K', 350.00, 10),
('TEC-005', 'Audífonos Bluetooth Noise Cancelling', 120.00, 25),
('OFF-001', 'Silla Ergonómica de Oficina', 199.99, 12),
('OFF-002', 'Escritorio Ajustable', 299.00, 8),
('ACC-001', 'Cargador USB-C Rápido', 19.99, 100),
('ACC-002', 'Adaptador HDMI a VGA', 12.50, 45),
('ACC-003', 'Soporte para Laptop', 35.00, 40);