import { useState, useEffect } from 'react';
import api from '../services/api';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    // Estados para el detalle del pedido individual (GET /api/orders/{id}/)
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Estado técnico para forzar el refresco del listado
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Carga de la lista general (Manejado de forma segura para ESLint)
    useEffect(() => {
        const fetchOrdersData = async () => {
            setLoading(true);
            try {
                const url = statusFilter ? `/orders/?status=${statusFilter}` : '/orders/';
                const response = await api.get(url);
                setOrders(response.data.results || response.data);
            } catch (error) {
                console.error("Error cargando pedidos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrdersData();
    }, [statusFilter, refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Función que consume el endpoint de detalle al hacer clic
    const handleViewDetail = async (id) => {
        setLoadingDetail(true);
        try {
            const response = await api.get(`/orders/${id}/`);
            setSelectedOrder(response.data); // Guardamos la info detallada del pedido
        } catch (error) {
            console.error("Error cargando el detalle del pedido:", error);
            alert("No se pudo obtener el detalle actualizado de este pedido.");
        } finally {
            setLoadingDetail(false);
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
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Mis Pedidos</h2>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="CONFIRMED">Confirmados</option>
                        <option value="FAILED">Fallidos</option>
                    </select>

                    <button
                        onClick={handleRefresh}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Refrescar Estado
                    </button>
                </div>
            </div>

            {loading ? <p>Cargando pedidos...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>ID Pedido</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Fecha</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Total</th>
                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 && (
                            <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No se encontraron pedidos.</td></tr>
                        )}
                        {orders.map(order => {
                            const total = order.items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unit_price)), 0);

                            return (
                                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>#{order.id}</td>
                                    <td style={{ padding: '1rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>${total.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleViewDetail(order.id)}
                                            disabled={loadingDetail}
                                            style={{ padding: '0.35rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* MODAL DE DETALLE DEL PEDIDO (Renderizado condicional) */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>Detalle del Pedido #{selectedOrder.id}</h3>
                            {getStatusBadge(selectedOrder.status)}
                        </div>

                        <p><strong>Fecha de Creación:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>

                        <h4 style={{ marginBottom: '0.5rem' }}>Ítems Comprados:</h4>
                        <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                            {selectedOrder.items?.map(item => (
                                <li key={item.id} style={{ marginBottom: '0.25rem' }}>
                                    Producto ID: {item.product} — <strong>{item.quantity} x ${parseFloat(item.unit_price).toFixed(2)}</strong>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Total: </span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                                    ${selectedOrder.items?.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unit_price)), 0).toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderList;