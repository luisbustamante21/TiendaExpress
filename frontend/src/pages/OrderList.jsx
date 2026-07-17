import { useState, useEffect } from 'react';
import api from '../services/api';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        const baseStyles = {
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            display: 'inline-block'
        };

        if (status === 'PENDING') return <span style={{ ...baseStyles, backgroundColor: '#FEF3C7', color: '#92400E' }}>Pendiente</span>;
        if (status === 'CONFIRMED') return <span style={{ ...baseStyles, backgroundColor: '#D1FAE5', color: '#065F46' }}>Confirmado</span>;
        if (status === 'FAILED') return <span style={{ ...baseStyles, backgroundColor: '#FEE2E2', color: '#991B1B' }}>Fallido</span>;
        return <span style={{ ...baseStyles, backgroundColor: '#F1F5F9', color: '#475569' }}>{status}</span>;
    };

    return (
        <div style={{ position: 'relative', fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Cabecera de la sección */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#2B2D42', fontWeight: '800', letterSpacing: '-0.5px' }}>Mis Pedidos</h2>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#8D99AE', fontSize: '0.95rem' }}>Gestiona y visualiza el estado de tus compras</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#2B2D42', outline: 'none', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="CONFIRMED">Confirmados</option>
                        <option value="FAILED">Fallidos</option>
                    </select>

                    <button
                        onClick={handleRefresh}
                        style={{ padding: '0.6rem 1.25rem', backgroundColor: '#2B2D42', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(43, 45, 66, 0.15)', transition: 'background-color 0.2s' }}
                    >
                        Refrescar
                    </button>
                </div>
            </div>

            {/* Contenedor de la Tabla */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8D99AE', fontWeight: '500' }}>
                    Cargando pedidos...
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #F1F5F9' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Pedido</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#8D99AE', fontSize: '0.95rem' }}>
                                        No se encontraron pedidos con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                            {orders.map((order, index) => {
                                const isLast = index === orders.length - 1;

                                return (
                                    <tr key={order.id} style={{ borderBottom: isLast ? 'none' : '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#2B2D42', fontWeight: '600', fontSize: '0.95rem' }}>
                                            #{order.id}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#4A4E69', fontSize: '0.95rem' }}>
                                            {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#2B2D42', fontWeight: '700', fontSize: '0.95rem' }}>
                                            ${parseFloat(order.total_amount).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleViewDetail(order.id)}
                                                disabled={loadingDetail}
                                                style={{ padding: '0.5rem 1rem', backgroundColor: '#F8FAFC', color: '#2B2D42', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: loadingDetail ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s' }}
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL DE DETALLE DEL PEDIDO (Renderizado condicional) */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(43, 45, 66, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>

                    <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', maxHeight: '90vh', overflowY: 'auto' }}>

                        {/* Cabecera del Modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2B2D42', fontSize: '1.4rem', fontWeight: '800' }}>
                                    Pedido #{selectedOrder.id}
                                </h3>
                                <p style={{ margin: 0, color: '#8D99AE', fontSize: '0.85rem' }}>
                                    {new Date(selectedOrder.created_at).toLocaleString()}
                                </p>
                            </div>
                            {getStatusBadge(selectedOrder.status)}
                        </div>

                        {/* Lista de Ítems */}
                        <h4 style={{ margin: '0 0 1rem 0', color: '#2B2D42', fontSize: '1rem' }}>Artículos comprados</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                            {selectedOrder.items?.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <div>
                                        <p style={{ margin: 0, color: '#2B2D42', fontWeight: '600', fontSize: '0.9rem' }}>Producto ID: {item.product}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', color: '#8D99AE', fontSize: '0.8rem' }}>Cantidad: {item.quantity}</p>
                                    </div>
                                    <div style={{ fontWeight: '700', color: '#2B2D42' }}>
                                        ${parseFloat(item.unit_price).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pie del Modal (Total y Botón) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.85rem', color: '#8D99AE', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Total a pagar</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#F76C6C' }}>
                                    ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{ padding: '0.75rem 2rem', backgroundColor: '#F8FAFC', color: '#2B2D42', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}
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