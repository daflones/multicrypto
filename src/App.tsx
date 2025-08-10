import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

// Pages
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
import AdminUsers from './pages/Admin/Users';
import AdminProducts from './pages/Admin/Products';
import AdminDeposits from './pages/Admin/Deposits';
import AdminWithdrawals from './pages/Admin/Withdrawals';
import AdminInvestments from './pages/Admin/Investments';
import AdminSettings from './pages/Admin/Settings';

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

function App() {
  // Não faz verificação de autenticação global aqui
  // A verificação é feita apenas dentro do componente ProtectedRoutes

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="recargas" element={<AdminDeposits />} />
            <Route path="saques" element={<AdminWithdrawals />} />
            <Route path="investimentos" element={<AdminInvestments />} />
            <Route path="config" element={<AdminSettings />} />
          </Route>
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoutes />}>
            <Route index element={<Home />} />
            <Route path="invest" element={<Invest />} />
            <Route path="my-investments" element={<MyInvestments />} />
            <Route path="team" element={<Team />} />
            <Route path="deposit" element={<Deposit />} />
            <Route path="withdraw" element={<Withdraw />} />
            <Route path="profile" element={<Profile />} />
            {/* About moved to public route */}
          </Route>
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
