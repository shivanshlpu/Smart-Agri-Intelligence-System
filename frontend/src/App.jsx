import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar   from "./components/Navbar";
import Sidebar  from "./components/Sidebar";
import Home     from "./pages/Home";
import PredictLoss   from "./pages/PredictLoss";
import PredictPrice  from "./pages/PredictPrice";
import SupplyChain   from "./pages/SupplyChain";
import History  from "./pages/History";
import Profile  from "./pages/Profile";
import Login    from "./components/Auth/Login";
import Register from "./components/Auth/Register";

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><Home /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/loss" element={
        <ProtectedRoute>
          <AppLayout><PredictLoss /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/price" element={
        <ProtectedRoute>
          <AppLayout><PredictPrice /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/supply" element={
        <ProtectedRoute>
          <AppLayout><SupplyChain /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <AppLayout><History /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout><Profile /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
