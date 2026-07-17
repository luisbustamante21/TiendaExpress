import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateOrder = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estados para manejar el carrito y el modal
    const [cart, setCart] = useState({}); // Guarda { productId: quantity }
    const [activeModalProduct, setActiveModalProduct] = useState(null);
    const [tempQuantity, setTempQuantity] = useState(1);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products/');
                setProducts(response.data.results || response.data);
            } catch (err) {
                console.error("Error obteniendo productos:", err);
            }
        };
        fetchProducts();
    }, []);

    // --- Lógica del Modal ---
    const openModal = (product) => {
        if (product.stock_quantity === 0) return;
        setActiveModalProduct(product);
        setTempQuantity(cart[product.id] || 1);
    };

    const closeModal = () => {
        setActiveModalProduct(null);
    };

    const confirmSelection = () => {
        setCart(prev => {
            const newCart = { ...prev };
            if (tempQuantity === 0) {
                delete newCart[activeModalProduct.id];
            } else {
                newCart[activeModalProduct.id] = tempQuantity;
            }
            return newCart;
        });
        closeModal();
    };

    // --- Cálculos del Carrito ---
    const totalAmount = products.reduce((sum, p) => sum + (cart[p.id] || 0) * parseFloat(p.price), 0);
    const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    // --- Lógica de Envío ---
    const handleSubmit = async () => {
        setError(null);

        const itemsToOrder = Object.entries(cart).map(([productId, qty]) => ({
            product_id: parseInt(productId),
            quantity: qty
        }));

        if (itemsToOrder.length === 0) {
            return setError("Tu carrito está vacío. Selecciona al menos un producto.");
        }

        setLoading(true);
        try {
            // Generador seguro de UUID con fallback
            const idempotencyKey = (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : 'idk-' + Date.now().toString(36) + Math.random().toString(36).substring(2);

            await api.post('/orders/', {
                items: itemsToOrder,
                idempotency_key: idempotencyKey
            });

            navigate('/orders');
        } catch (err) {
            console.error("Error completo:", err);
            setError(
                err.response?.data?.detail ||
                err.message ||
                "Error al crear el pedido. Verifica tu conexión o el stock."
            );
            setLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '2rem', paddingBottom: '8rem' }}>

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', margin: '0 0 0.5rem 0' }}>
                        Nuevo Pedido
                    </h2>
                    <p style={{ color: '#6B7280', margin: 0 }}>Selecciona los productos para añadirlos a tu carrito.</p>
                </header>

                {error && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontWeight: '500' }}>
                        {error}
                    </div>
                )}

                {/* Cuadrícula del Catálogo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {products.map(product => {
                        const qtyInCart = cart[product.id] || 0;
                        const isOutOfStock = product.stock_quantity === 0;

                        return (
                            <div
                                key={product.id}
                                onClick={() => openModal(product)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '20px',
                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    opacity: isOutOfStock ? 0.6 : 1,
                                    border: qtyInCart > 0 ? '2px solid #111827' : '2px solid transparent',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                    position: 'relative',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                {qtyInCart > 0 && (
                                    <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#111827', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {qtyInCart}
                                    </span>
                                )}

                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#111827' }}>{product.name}</h3>
                                <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: isOutOfStock ? '#FEE2E2' : '#F3F4F6', color: isOutOfStock ? '#991B1B' : '#4B5563', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                                    {isOutOfStock ? 'Agotado' : `Stock: ${product.stock_quantity}`}
                                </span>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>
                                    ${parseFloat(product.price).toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Selección de Cantidad */}
            {activeModalProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#111827' }}>{activeModalProduct.name}</h3>
                                <div style={{ fontSize: '1.25rem', color: '#6B7280' }}>${parseFloat(activeModalProduct.price).toFixed(2)} c/u</div>
                            </div>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' }}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '16px', marginBottom: '2rem' }}>
                            <button
                                onClick={() => setTempQuantity(Math.max(0, tempQuantity - 1))}
                                style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            >-</button>

                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{tempQuantity}</span>

                            <button
                                onClick={() => setTempQuantity(Math.min(activeModalProduct.stock_quantity, tempQuantity + 1))}
                                style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            >+</button>
                        </div>

                        <button
                            onClick={confirmSelection}
                            style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: 'none', backgroundColor: '#111827', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            {tempQuantity > 0 ? 'Confirmar Cantidad' : 'Quitar del Carrito'}
                        </button>
                    </div>
                </div>
            )}

            {/* Barra Flotante Inferior (Isla Dinámica) */}
            <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 2rem)', maxWidth: '600px', backgroundColor: '#111827', color: 'white', borderRadius: '100px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 40 }}>
                <div>
                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>{totalItems} artículos</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalAmount.toFixed(2)}</div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || totalItems === 0}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '100px', border: 'none', backgroundColor: 'white', color: '#111827', fontSize: '1rem', fontWeight: 'bold', cursor: (loading || totalItems === 0) ? 'not-allowed' : 'pointer', opacity: (loading || totalItems === 0) ? 0.5 : 1 }}
                >
                    {loading ? 'Procesando...' : 'Completar Pedido'}
                </button>
            </div>
        </div>
    );
};

export default CreateOrder;