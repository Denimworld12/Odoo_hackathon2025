import React, { useState, FormEvent, ChangeEvent } from "react";
import { Role, User } from "../types";
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Loader2,
  Sparkles
} from "lucide-react";

interface AuthPagesProps {
  step: "LOGIN" | "SIGNUP" | "FORGOT" | "RESET";
  setStep: (step: "LOGIN" | "SIGNUP" | "FORGOT" | "RESET") => void;
  onLogin: (role: Role) => void;
}

const API_BASE = "http://localhost:5000/api";

const AuthPages: React.FC<AuthPagesProps> = ({ step, setStep, onLogin }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Define API response types
  interface ApiResponse {
    message?: string;
    token?: string;
    user?: User;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      /* ================= REGISTER ================= */
      if (step === "SIGNUP") {
        const res = await fetch(`${API_BASE}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            email,
            password
          })
        });

        const data: ApiResponse = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Signup failed");
        }

        alert("Account created. Please login.");
        setStep("LOGIN");
      }

      /* ================= LOGIN ================= */
      if (step === "LOGIN") {
        const res = await fetch(`${API_BASE}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data: ApiResponse = await res.json();
        if (!res.ok || !data.token || !data.user) {
          throw new Error(data.message || "Login failed");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user.role as Role);
      }

      /* ================= FORGOT PASSWORD ================= */
      if (step === "FORGOT") {
        const res = await fetch(`${API_BASE}/users/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data: ApiResponse = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to send OTP");
        }

        alert("OTP sent to your email");
        setStep("RESET");
      }

      /* ================= RESET PASSWORD ================= */
      if (step === "RESET") {
        if (!otp || !newPassword) {
          throw new Error("OTP and new password are required");
        }

        const res = await fetch(`${API_BASE}/users/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
            new_password: newPassword
          })
        });

        const data: ApiResponse = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Password reset failed");
        }

        alert("Password reset successful");
        setStep("LOGIN");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-4">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 sm:p-10">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 group transition-transform hover:scale-110">
              <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
              <Sparkles className="w-3 h-3" />
              Aarakshan Secure
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight text-center">
              {step === "LOGIN" && "Welcome Back"}
              {step === "SIGNUP" && "Join the Elite"}
              {step === "FORGOT" && "Recovery Mode"}
              {step === "RESET" && "New Identity"}
            </h1>
            <p className="text-slate-400 mt-2 text-sm text-center font-medium">
              {step === "LOGIN" && "Enter your credentials to access your portal"}
              {step === "SIGNUP" && "Create your professional scheduling account"}
              {step === "FORGOT" && "We'll send a secure code to your email"}
              {step === "RESET" && "Please enter your OTP and new password"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
              <p className="text-red-400 text-xs text-center font-bold">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "SIGNUP" && (
              <div className="group relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            )}

            {(step !== "RESET") && (
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            )}

            {(step === "LOGIN" || step === "SIGNUP") && (
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            )}

            {step === "RESET" && (
              <div className="space-y-4">
                <div className="group relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                    placeholder="Verification Code (OTP)"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-2xl font-black text-sm flex justify-center items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === "LOGIN" && "Sign In to Portal"}
                  {step === "SIGNUP" && "Create Account"}
                  {step === "FORGOT" && "Request OTP"}
                  {step === "RESET" && "Update Password"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            {step === "LOGIN" && (
              <div className="space-y-4">
                <button 
                  onClick={() => setStep("FORGOT")} 
                  className="text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors"
                >
                  Forgot your password?
                </button>
                <p className="text-slate-500 text-sm">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setStep("SIGNUP")} 
                    className="text-white font-black hover:text-indigo-400 transition-colors underline underline-offset-4"
                  >
                    Sign up now
                  </button>
                </p>
              </div>
            )}

            {(step === "SIGNUP" || step === "FORGOT" || step === "RESET") && (
              <button
                onClick={() => setStep("LOGIN")}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Return to Login
              </button>
            )}
          </div>
        </div>

        {/* Bottom Footer Branding */}
        <p className="text-center text-slate-600 text-[10px] mt-8 font-black uppercase tracking-[0.2em]">
          © 2025 Aarakshan Enterprise Security
        </p>
      </div>
    </div>
  );
};

export default AuthPages;