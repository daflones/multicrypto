import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';
import './i18n'; // Initialize i18n

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Invest from './pages/Invest';
import MyInvestments from './pages/MyInvestments';
import Team from './pages/Team';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Profile from './pages/Profile';
import About from './pages/About';
import AdminLogin from './pages/AdminLogin';
// Admin pages
import AdminDashboard from './pages/Admin/Dashboard';
import ResetPassword from './pages/ResetPassword';

// Componente wrapper para rotas protegidas
function ProtectedRoutes() {
  const { isLoading, checkUser } = useAuthStore();
  
  // Verifica autenticação apenas uma vez ao montar o componente
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function App() {
  // Não faz verificação de autenticação global aqui
  // A verificação é feita apenas dentro do componente ProtectedRoutes

  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route path="/admin/6785/login" element={<AdminLogin />} />
          <Route 
            path="/admin/6785/admin" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/invest" element={<Invest />} />
            <Route path="/my-investments" element={<MyInvestments />} />
            <Route path="/team" element={<Team />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
