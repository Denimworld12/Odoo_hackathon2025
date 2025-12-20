
import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { MOCK_USER, MOCK_ADMIN } from './constants';
import AuthPages from './pages/AuthPages';
import UserPortal from './pages/UserPortal';
import AdminPortal from './pages/AdminPortal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authStep, setAuthStep] = useState<'LOGIN' | 'SIGNUP' | 'OTP' | 'FORGOT'>('LOGIN');
  
  // For prototype ease, we'll allow switching roles at the top
  const [viewRole, setViewRole] = useState<Role>('USER');

  useEffect(() => {
    // Sync user role with the view role for the simulation
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, role: viewRole } : null);
    }
  }, [viewRole]);

  const handleLogin = (role: Role) => {
    setCurrentUser(role === 'ADMIN' ? MOCK_ADMIN : MOCK_USER);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthStep('LOGIN');
  };

  if (!currentUser) {
    return (
      <AuthPages 
        step={authStep} 
        setStep={setAuthStep} 
        onLogin={handleLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simulation Role Switcher */}
      <div className="bg-indigo-900 text-white text-xs py-1 px-4 flex justify-between items-center shrink-0">
        <span>PROTOTYPE MODE: Switch View To</span>
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
