import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Barra de Navegación Superior */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Mi Tienda Express</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => navigate('/orders')} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', color: '#4f46e5', fontWeight: 'bold' }}>
                        Mis Pedidos
                    </button>
                    <button onClick={() => navigate('/orders/create')} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', color: '#4f46e5', fontWeight: 'bold' }}>
                        Crear Pedido
                    </button>
                    <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            {/* Contenedor dinámico de las páginas */}
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;