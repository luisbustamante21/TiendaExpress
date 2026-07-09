import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import OrderList from './pages/OrderList';
import CreateOrder from './pages/CreateOrder';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Vistas conectadas a los componentes reales */}
              <Route path="/orders" element={<OrderList />} />
              <Route path="/orders/create" element={<CreateOrder />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;