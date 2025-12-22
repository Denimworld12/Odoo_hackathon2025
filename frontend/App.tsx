import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { MOCK_USER, MOCK_ADMIN } from './constants';
import AuthPages from './pages/AuthPages';
import UserPortal from './pages/UserPortal';
import AdminPortal from './pages/AdminPortal';
import LandingPage from './pages/LandingPage'; // Import the new page

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return null;
  });

  // New state to manage the landing page visibility
  const [showAuth, setShowAuth] = useState(false);
  const [authStep, setAuthStep] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RESET'>('LOGIN');
  const [viewRole, setViewRole] = useState<Role>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.role || 'USER';
      } catch (e) {
        return 'USER';
      }
    }
    return 'USER';
  });

  useEffect(() => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, role: viewRole } : null);
    }
  }, [viewRole]);

  const handleLogin = (role: Role) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setViewRole(user.role || role);
        return;
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setCurrentUser(role === 'ADMIN' ? MOCK_ADMIN : MOCK_USER);
    setViewRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setShowAuth(false); // Go back to landing page on logout
    setAuthStep('LOGIN');
  };

  // 1. If not logged in and haven't clicked "Get Started/Sign In", show landing
  if (!currentUser && !showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  // 2. If clicked "Sign In" but not authenticated yet, show AuthPages
  if (!currentUser && showAuth) {
    return (
      <AuthPages 
        step={authStep} 
        setStep={setAuthStep} 
        onLogin={handleLogin} 
      />
    );
  }

  // 3. Authenticated View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-indigo-900 text-white text-xs py-1 px-4 flex justify-between items-center shrink-0">
        <span> View Mode Simulator </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewRole('USER')}
            className={`px-2 py-0.5 rounded ${viewRole === 'USER' ? 'bg-white text-indigo-900' : 'hover:bg-indigo-800'}`}
          >
            User
          </button>
          <button 
            onClick={() => setViewRole('ADMIN')}
            className={`px-2 py-0.5 rounded ${viewRole === 'ADMIN' ? 'bg-white text-indigo-900' : 'hover:bg-indigo-800'}`}
          >
            Admin
          </button>
        </div>
      </div>

      {currentUser.role === 'ADMIN' ? (
        <AdminPortal user={currentUser} onLogout={handleLogout} />
      ) : (
        <UserPortal user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;