import React, { useState } from "react";
import { Role } from "../types";
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  KeyRound
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
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Signup failed");

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

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user.role);
      }

      /* ================= FORGOT PASSWORD ================= */
      if (step === "FORGOT") {
        const res = await fetch(`${API_BASE}/users/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to send OTP");

        alert("OTP sent to your email");
        setStep("RESET");
      }

      /* ================= RESET PASSWORD ================= */
      if (step === "RESET") {
        const res = await fetch(`${API_BASE}/users/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
            new_password: newPassword
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Reset failed");

        alert("Password reset successful");
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2">
          {step === "LOGIN" && "Welcome Back"}
          {step === "SIGNUP" && "Create Account"}
          {step === "FORGOT" && "Forgot Password"}
          {step === "RESET" && "Reset Password"}
        </h1>

        <p className="text-center text-slate-500 mb-6 text-sm">
          Secure access to your account
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "SIGNUP" && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
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

          {(step !== "RESET") && (
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
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
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
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

          {step === "RESET" && (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-red-600 text-sm text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex justify-center gap-2"
          >
            {isLoading ? "Please wait..." : (
              <>
                {step === "LOGIN" && "Sign In"}
                {step === "SIGNUP" && "Sign Up"}
                {step === "FORGOT" && "Send OTP"}
                {step === "RESET" && "Reset Password"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          {step === "LOGIN" && (
            <>
              <button onClick={() => setStep("FORGOT")} className="text-indigo-600 text-sm font-medium">
                Forgot password?
              </button>
              <p className="mt-2 text-sm">
                No account?{" "}
                <button onClick={() => setStep("SIGNUP")} className="text-indigo-600 font-bold">
                  Sign up
                </button>
              </p>
            </>
          )}

          {(step === "SIGNUP" || step === "FORGOT" || step === "RESET") && (
            <button
              onClick={() => setStep("LOGIN")}
              className="flex items-center gap-2 mx-auto text-slate-500 text-sm mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPages;
