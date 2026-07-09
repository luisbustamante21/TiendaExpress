import axios from 'axios';

// Instancia principal de Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor de Peticiones (Requests)
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // IMPRIMIR REQUEST: Muestra el método, la URL final y los datos enviados
        console.log(`[API Request] ${config.method.toUpperCase()} -> ${config.baseURL}${config.url}`, config.data || '');

        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Interceptor de Respuestas (Responses)
api.interceptors.response.use(
    (response) => {
        // IMPRIMIR RESPONSE EXITOSO: Muestra el estado HTTP y la data que devuelve el backend
        console.log(`[API Response] ${response.status} <- ${response.config.url}`, response.data);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // IMPRIMIR RESPONSE CON ERROR: Muestra el código de error y la respuesta del servidor
        console.error(`[API Response Error] ${error.response?.status || 'Network Error'} <- ${originalRequest?.url}`, error.response?.data || error.message);

        // Si el error es 401 y la petición original no ha sido reintentada aún
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                console.log('[API Auth] Intentando refrescar access_token...');

                const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh/`, {
                    refresh: refreshToken
                });

                const newAccessToken = response.data.access;
                localStorage.setItem('access_token', newAccessToken);

                console.log('[API Auth] Token refrescado correctamente. Reintentando petición original.');

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                console.error('[API Auth Critical] Error al refrescar token. Redirigiendo a Login.', refreshError);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;