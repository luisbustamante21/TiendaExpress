import { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// 1. Añadimos este comentario de ESLint para que ignore la advertencia de exportación múltiple
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('access_token'));
    const loading = false;

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login/', {
                username,
                password,
            });

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            console.error("Error en login:", error);
            return {
                success: false,
                message: error.response?.data?.detail || "Error al iniciar sesión. Verifica tus credenciales."
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};