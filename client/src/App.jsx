import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ProductDetailPage from './pages/marketplace/ProductDetailPage';
import MarketIntelligencePage from './pages/farmer/MarketIntelligencePage';
import WeatherIntelligencePage from './pages/farmer/WeatherIntelligencePage';
import KhetiAIPage from './pages/farmer/KhetiAIPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Farmer Pages
import FarmerDashboardPage from './pages/farmer/FarmerDashboardPage';
import BatchesPage from './pages/farmer/BatchesPage';
import ListingsPage from './pages/farmer/ListingsPage';
import FarmerOrdersPage from './pages/farmer/FarmerOrdersPage';

// Consumer Pages
import ConsumerDashboardPage from './pages/consumer/ConsumerDashboardPage';
import OrderTrackingPage from './pages/consumer/OrderTrackingPage';

// Business Pages
import BusinessDashboardPage from './pages/business/BusinessDashboardPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// Profile Dashboard
import ProfileDashboardPage from './pages/profile/ProfileDashboardPage';

// Smart redirect for /orders based on user role
import { useAuth } from './context/AuthContext';
const OrdersRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'BUSINESS') return <Navigate to="/business/orders" replace />;
  if (user?.role === 'FARMER') return <Navigate to="/farmer/orders" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/logistics" replace />;
  return <Navigate to="/consumer/orders" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
          {/* Public Views wrapped in PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<ProductDetailPage />} />
            <Route path="/market-prices" element={<MarketIntelligencePage />} />
            <Route path="/weather" element={<WeatherIntelligencePage />} />
            <Route path="/ai-assistant" element={<KhetiAIPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Farmer Portal wrapped in DashboardLayout */}
          <Route
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
            <Route path="/farmer/batches" element={<BatchesPage />} />
            <Route path="/farmer/listings" element={<ListingsPage />} />
            <Route path="/farmer/orders" element={<FarmerOrdersPage />} />
            <Route path="/farmer/orders/:id" element={<OrderTrackingPage />} />
            <Route path="/farmer/market" element={<MarketIntelligencePage />} />
            <Route path="/farmer/weather" element={<WeatherIntelligencePage />} />
            <Route path="/farmer/ai" element={<KhetiAIPage />} />
          </Route>

          {/* Protected Consumer Portal */}
          <Route
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['CONSUMER', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/consumer/dashboard" element={<ConsumerDashboardPage />} />
            <Route path="/consumer/orders" element={<ConsumerDashboardPage />} />
            <Route path="/consumer/orders/:id" element={<OrderTrackingPage />} />
          </Route>

          {/* Protected Business Portal */}
          <Route
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['BUSINESS', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
            <Route path="/business/orders" element={<BusinessDashboardPage />} />
            <Route path="/business/orders/:id" element={<OrderTrackingPage />} />
          </Route>

          {/* Protected Admin Console */}
          <Route
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminDashboardPage />} />
            <Route path="/admin/products" element={<AdminDashboardPage />} />
            <Route path="/admin/logistics" element={<AdminDashboardPage />} />
            <Route path="/admin/audit" element={<AdminDashboardPage />} />
          </Route>

          {/* Universal Orders Redirect */}
          <Route path="/orders" element={<ProtectedRoute><OrdersRedirect /></ProtectedRoute>} />

          {/* Protected Profile Dashboard for all authenticated roles */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/profile" element={<ProfileDashboardPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);
}

export default App;
