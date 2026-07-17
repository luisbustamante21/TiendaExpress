import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import loginIllustration from '../assets/images/login.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Si ya está autenticado, lo sacamos del login inmediatamente
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/orders', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/orders', { replace: true });
        } else {
            setError(result.message);
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#FFFFFF' }}>

            {/* Columna Izquierda - Formulario */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                <div style={{ width: '100%', maxWidth: '380px' }}>

                    <div style={{ color: '#F27A59', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '3rem' }}>
                        TiendaExpress
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#A0AEC0', fontSize: '0.85rem' }}>
                            ¡Bienvenido de nuevo!
                        </p>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#000000', fontWeight: 'bold', letterSpacing: '-1px' }}>
                            Iniciar sesión
                        </h1>
                    </div>

                    {error && (
                        <div style={{ background: '#FFF0F0', color: '#D00000', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: '500' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000000', fontSize: '0.85rem' }}>
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Ej. administrador"
                                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: '#FCF3F1', color: '#000000', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                                required
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ color: '#000000', fontSize: '0.85rem' }}>
                                    Contraseña
                                </label>
                                <span style={{ color: '#A0AEC0', fontSize: '0.75rem', cursor: 'pointer' }}>
                                    ¿Olvidaste tu contraseña?
                                </span>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: '#FCF3F1', color: '#000000', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                                required
                            />
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{ padding: '0.7rem 2.5rem', backgroundColor: isLoading ? '#FFA8A8' : '#F27A59', color: 'white', border: 'none', borderRadius: '9999px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem', letterSpacing: '0.5px' }}
                            >
                                {isLoading ? 'CARGANDO...' : 'ENTRAR →'}
                            </button>
                        </div>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.85rem', color: '#A0AEC0' }}>
                        ¿No tienes una cuenta? <span style={{ color: '#F27A59', cursor: 'pointer' }}>Regístrate</span>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#FEF1E9', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <img
                    src={loginIllustration}
                    alt="Ilustración de carrito de compras"
                    style={{
                        maxWidth: '85%',
                        height: 'auto',
                        objectFit: 'contain'
                    }}
                />
            </div>

        </div>
    );
};

export default Login;