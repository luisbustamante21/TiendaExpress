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
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Barra de Navegación Superior */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 3rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#2B2D42', fontWeight: '800', letterSpacing: '-0.5px' }}>
                    Tienda<span style={{ color: '#F76C6C' }}>Express</span>
                </h1>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <button onClick={() => navigate('/orders')} style={{ padding: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#4A4E69', fontWeight: '600', fontSize: '0.95rem' }}>
                        Mis Pedidos
                    </button>
                    <button onClick={() => navigate('/orders/create')} style={{ padding: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#4A4E69', fontWeight: '600', fontSize: '0.95rem' }}>
                        Crear Pedido
                    </button>
                    <button onClick={handleLogout} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#F76C6C', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', boxShadow: '0 4px 10px rgba(247, 108, 108, 0.25)' }}>
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            {/* Contenedor dinámico de las páginas */}
            <main style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;