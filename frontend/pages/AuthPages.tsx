import React, { useState } from "react";
import { Role } from "../types";
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface AuthPagesProps {
  step: "LOGIN" | "SIGNUP" | "OTP" | "FORGOT";
  setStep: (step: "LOGIN" | "SIGNUP" | "OTP" | "FORGOT") => void;
  onLogin: (role: Role) => void;
}

const API_BASE = "http://localhost:5000/api";

const AuthPages: React.FC<AuthPagesProps> = ({
  step,
  setStep,
  onLogin
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // REGISTER
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

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Signup failed");

        setStep("LOGIN");
        return;
      }

      // LOGIN
      if (step === "LOGIN") {
        const res = await fetch(`${API_BASE}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        localStorage.setItem("token", data.token);
        onLogin(data.user.role);
        return;
      }

      // FORGOT PASSWORD
      if (step === "FORGOT") {
        const res = await fetch(`${API_BASE}/users/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to send OTP");

        alert("OTP sent to your email");
        setStep("LOGIN");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-white w-10 h-10" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {step === "LOGIN" && "Welcome Back"}
              {step === "SIGNUP" && "Create Account"}
              {step === "FORGOT" && "Forgot Password"}
            </h1>
            <p className="text-slate-500">
              {step === "LOGIN" && "Sign in to continue"}
              {step === "SIGNUP" && "Create a new account"}
              {step === "FORGOT" && "We’ll send you a reset OTP"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === "SIGNUP" && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl"
                />
              </div>
            )}

            {(step === "LOGIN" || step === "SIGNUP" || step === "FORGOT") && (
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl"
                />
              </div>
            )}

            {(step === "LOGIN" || step === "SIGNUP") && (
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl"
                />
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm text-center font-medium">
                {error}
              </p>
            )}

            {step === "LOGIN" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep("FORGOT")}
                  className="text-sm text-indigo-600 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl flex justify-center items-center gap-2"
            >
              {isLoading ? "Please wait..." : (
                <>
                  {step === "LOGIN" && "Sign In"}
                  {step === "SIGNUP" && "Sign Up"}
                  {step === "FORGOT" && "Send OTP"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            {step === "LOGIN" && (
              <p className="text-slate-500">
                No account?{" "}
                <button
                  onClick={() => setStep("SIGNUP")}
                  className="text-indigo-600 font-bold"
                >
                  Sign up
                </button>
              </p>
            )}

            {(step === "SIGNUP" || step === "FORGOT") && (
              <button
                onClick={() => setStep("LOGIN")}
                className="flex items-center gap-2 mx-auto text-slate-500"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPages;
