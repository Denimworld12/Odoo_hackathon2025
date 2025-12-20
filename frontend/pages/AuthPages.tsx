
import React, { useState } from 'react';
import { Role } from '../types';
import { LogIn, UserPlus, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';

interface AuthPagesProps {
  step: 'LOGIN' | 'SIGNUP' | 'OTP' | 'FORGOT';
  setStep: (step: 'LOGIN' | 'SIGNUP' | 'OTP' | 'FORGOT') => void;
  onLogin: (role: Role) => void;
}

const AuthPages: React.FC<AuthPagesProps> = ({ step, setStep, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (step === 'SIGNUP') {
        setStep('OTP');
      } else if (step === 'OTP' || step === 'LOGIN') {
        // Quick trick: if email contains 'admin', log in as admin
        onLogin(email.includes('admin') ? 'ADMIN' : 'USER');
      } else if (step === 'FORGOT') {
        alert('Password reset link sent to your email!');
        setStep('LOGIN');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-all duration-300">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <ShieldCheck className="text-white w-10 h-10" />
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {step === 'LOGIN' && 'Welcome Back'}
              {step === 'SIGNUP' && 'Create Account'}
              {step === 'OTP' && 'Verify Identity'}
              {step === 'FORGOT' && 'Forgot Password'}
            </h1>
            <p className="text-slate-500">
              {step === 'LOGIN' && 'Enter your details to access your portal'}
              {step === 'SIGNUP' && 'Join us today to book your next session'}
              {step === 'OTP' && 'We sent a code to your email'}
              {step === 'FORGOT' && 'Enter your email to reset your password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'SIGNUP' && (
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
            )}

            {(step === 'LOGIN' || step === 'SIGNUP' || step === 'FORGOT') && (
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
            )}

            {(step === 'LOGIN' || step === 'SIGNUP') && (
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
            )}

            {step === 'OTP' && (
              <div className="flex gap-4 justify-center">
                {[1, 2, 3, 4].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-14 h-16 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                ))}
              </div>
            )}

            {step === 'LOGIN' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setStep('FORGOT')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {step === 'LOGIN' && 'Sign In'}
                  {step === 'SIGNUP' && 'Sign Up'}
                  {step === 'OTP' && 'Verify'}
                  {step === 'FORGOT' && 'Send Reset Link'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            {step === 'LOGIN' && (
              <p className="text-slate-500">
                Don't have an account?{' '}
                <button onClick={() => setStep('SIGNUP')} className="text-indigo-600 font-bold hover:underline">
                  Create Account
                </button>
              </p>
            )}
            {(step === 'SIGNUP' || step === 'FORGOT' || step === 'OTP') && (
              <button 
                onClick={() => setStep('LOGIN')} 
                className="flex items-center gap-2 mx-auto text-slate-500 font-medium hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-2">
            <p className="text-xs text-center text-slate-400">Prototype Demo Credentials:</p>
            <p className="text-xs text-center text-slate-500">User: user@test.com / Admin: admin@test.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPages;
