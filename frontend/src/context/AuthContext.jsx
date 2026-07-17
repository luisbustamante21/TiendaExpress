import { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('is_logged_in') === 'true');
    const loading = false;

    const login = async (username, password) => {
        try {
            await api.post('/auth/login/', {
                username,
                password,
            });

            localStorage.setItem('is_logged_in', 'true');
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

    const logout = async () => {
        try {
            // se le pide al backend que destruya las cookies
            await api.post('/auth/logout/');
        } catch (err) {
            console.error("Error al hacer logout en el backend", err);
        } finally {
            localStorage.removeItem('is_logged_in');
            setIsAuthenticated(false);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};