import React, { useState } from 'react';
import { Role } from '../types';
// Using Lucide icons as per your previous setup, which is highly compatible with Heroicons style
import { 
  LogIn, UserPlus, ShieldCheck, Mail, Lock, 
  User as UserIcon, ArrowRight, ArrowLeft, 
  Briefcase, ShieldAlert, Users, KeyRound
} from 'lucide-react';

interface AuthPagesProps {
  step: 'LOGIN' | 'SIGNUP' | 'OTP' | 'FORGOT' | 'RESET_PASSWORD';
  setStep: (step: 'LOGIN' | 'SIGNUP' | 'OTP' | 'FORGOT' | 'RESET_PASSWORD') => void;
  onLogin: (role: Role) => void;
}

const AuthPages: React.FC<AuthPagesProps> = ({ step, setStep, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('CUSTOMER');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      if (step === 'SIGNUP') {
        setStep('OTP');
      } else if (step === 'FORGOT') {
        setStep('OTP'); // Redirect to OTP after entering email for forgot password
      } else if (step === 'OTP') {
        // If coming from Signup, log in. If coming from Forgot Password, reset.
        // For prototype logic, let's assume if email is empty we were resetting
        setStep('RESET_PASSWORD'); 
      } else if (step === 'RESET_PASSWORD') {
        alert('Password reset successfully!');
        setStep('LOGIN');
      } else if (step === 'LOGIN') {
        onLogin(email.includes('admin') ? 'ADMIN' : email.includes('organiser') ? 'ORGANISER' : 'CUSTOMER');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100 p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
        <div className="p-8">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
              {step === 'LOGIN' && 'Welcome Back'}
              {step === 'SIGNUP' && 'Create Account'}
              {step === 'OTP' && 'Verify Identity'}
              {step === 'FORGOT' && 'Forgot Password'}
              {step === 'RESET_PASSWORD' && 'New Password'}
            </h1>
            <p className="text-slate-500 text-sm">
              {step === 'OTP' ? `Enter the 4-digit code sent to ${email || 'your email'}` : 'Secure access to your booking portal'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Signup: Role Selection */}
            {step === 'SIGNUP' && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'CUSTOMER', label: 'User', icon: Users },
                  { id: 'ORGANISER', label: 'Org', icon: Briefcase },
                  { id: 'ADMIN', label: 'Admin', icon: ShieldAlert },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id as Role)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      selectedRole === role.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' 
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <role.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">{role.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 'SIGNUP' && (
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Full Name" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" />
              </div>
            )}

            {(step === 'LOGIN' || step === 'SIGNUP' || step === 'FORGOT') && (
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            )}

            {(step === 'LOGIN' || step === 'SIGNUP') && (
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            )}

            {step === 'RESET_PASSWORD' && (
              <div className="space-y-4">
                <div className="relative group">
                  <KeyRound className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                  <input type="password" placeholder="Confirm New Password" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" />
                </div>
              </div>
            )}

            {step === 'OTP' && (
              <div className="flex gap-3 justify-center py-2">
                {[1, 2, 3, 4].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-14 h-16 text-center text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                  />
                ))}
              </div>
            )}

            {step === 'LOGIN' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setStep('FORGOT')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 tracking-wide"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {step === 'LOGIN' && 'SIGN IN'}
                  {step === 'SIGNUP' && 'CREATE ACCOUNT'}
                  {step === 'OTP' && 'VERIFY CODE'}
                  {step === 'FORGOT' && 'GENERATE OTP'}
                  {step === 'RESET_PASSWORD' && 'UPDATE PASSWORD'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {step === 'LOGIN' ? (
              <p className="text-slate-500 text-sm font-medium">
                Don't have an account?{' '}
                <button onClick={() => setStep('SIGNUP')} className="text-indigo-600 font-black hover:underline">
                  Sign Up
                </button>
              </p>
            ) : (
              <button 
                onClick={() => setStep('LOGIN')} 
                className="flex items-center gap-2 mx-auto text-slate-500 text-sm font-bold hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                BACK TO LOGIN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPages;