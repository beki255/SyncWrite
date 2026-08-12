import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentEditor from './pages/DocumentEditor';
import Profile from './pages/Profile';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return children;
};

const RootRoute = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="loading-screen">Loading...</div>;
  return user ? <Navigate to="/dashboard" /> : <Landing />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/document/:id" element={<ProtectedRoute><DocumentEditor /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container dark-mode">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
