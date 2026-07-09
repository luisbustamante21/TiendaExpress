import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Cargando sesión...</div>;
    }

    // Si no está autenticado, lo mandamos al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, renderiza la ruta hija
    return <Outlet />;
};

export default ProtectedRoute;