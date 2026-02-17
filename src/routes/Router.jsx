import { Routes, Route, Navigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import App from '../App';
import HomePage from '../pages/HomePage';
import OrdersPage from '../pages/OrdersPage';
import ProductsPage from '../pages/ProductsPage';
import ProfilePage from '../pages/ProfilePage';
import UsersPage from '../pages/UsersPage';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import { getUserLocal } from '../utils/auth';
import ProtectedRoute from './ProtectedRoute';
import Unauthorized from '../pages/Unauthorized';

// RequireAuth wrapper
function RequireAuth({ children }) {
  const toast = useToast();
  const user = getUserLocal();

  if (!user) {
    toast({
      title: "Authentication error",
      description: "User not found, login first!",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function Router() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        {/* Protected Routes */}
        <Route
          path="orders"
          element={
            <ProtectedRoute permission="orders">
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute permission="products">
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute permission="users">
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={getUserLocal() ? '/' : '/login'} replace />}
      />

      <Route 
        path="/unauthorized" 
        element={<Unauthorized />} 
      />
    </Routes>
  );
}