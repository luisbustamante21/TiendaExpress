import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateOrder = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        // Obtenemos los productos listos para vender
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products/');
                // Manejar estructura de paginación (response.data.results)
                setProducts(response.data.results || response.data);
            } catch (err) {
                console.error("Error obteniendo productos:", err);
            }
        };
        fetchProducts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!selectedProduct || quantity <= 0) {
            return setError("Selecciona un producto y una cantidad válida.");
        }

        // Validación extra en frontend antes de enviar
        const productData = products.find(p => p.id.toString() === selectedProduct);
        if (productData && quantity > productData.stock_quantity) {
            return setError(`No puedes pedir ${quantity}. El stock máximo es ${productData.stock_quantity}.`);
        }

        setLoading(true);
        try {
            await api.post('/orders/', {
                items: [
                    {
                        product_id: parseInt(selectedProduct),
                        quantity: parseInt(quantity)
                    }
                ]
            });
            // Si funciona, redirigimos a la tabla de pedidos
            navigate('/orders');
        } catch (err) {
            setError(err.response?.data?.detail || "Error al crear el pedido. Verifica el stock.");
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Crear Nuevo Pedido</h2>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Producto</label>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        required
                    >
                        <option value="">-- Selecciona un producto --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                                {p.name} - ${p.price} (Stock: {p.stock_quantity})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Cantidad</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Procesando...' : 'Realizar Compra'}
                </button>
            </form>
        </div>
    );
};

export default CreateOrder;