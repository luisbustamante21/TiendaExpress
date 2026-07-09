import { useState, useEffect } from 'react';
import api from '../services/api';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders/')
            .then(response => {
                setOrders(response.data);
            })
            .catch(error => {
                console.error("Error cargando pedidos:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders/');
            setOrders(response.data);
        } catch (error) {
            console.error("Error cargando pedidos:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 'bold'
        };
        if (status === 'PENDING') return <span style={{ ...styles, backgroundColor: '#fef08a', color: '#854d0e' }}>Pendiente</span>;
        if (status === 'CONFIRMED') return <span style={{ ...styles, backgroundColor: '#bbf7d0', color: '#166534' }}>Confirmado</span>;
        if (status === 'FAILED') return <span style={{ ...styles, backgroundColor: '#fecaca', color: '#991b1b' }}>Fallido</span>;
        return <span>{status}</span>;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Mis Pedidos</h2>
                <button
                    onClick={handleRefresh}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Refrescar Estado
                </button>
            </div>

            {loading ? <p>Cargando pedidos...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>ID Pedido</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Fecha</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Items</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Total</th>
                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 && (
                            <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No tienes pedidos creados.</td></tr>
                        )}
                        {orders.map(order => {
                            const total = order.items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unit_price)), 0);

                            return (
                                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>#{order.id}</td>
                                    <td style={{ padding: '1rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                            {order.items.map(item => (
                                                <li key={item.id}>Prod {item.product} (x{item.quantity})</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>${total.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {getStatusBadge(order.status)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default OrderList;