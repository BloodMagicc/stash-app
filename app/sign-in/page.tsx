"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ShieldCheck, Zap, Lock, Mail, Key } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0],
        });
        if (res.error) throw new Error(res.error.message || "Failed to sign up");
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        });
        if (res.error) throw new Error(res.error.message || "Invalid credentials");
      }
      
      // Store passphrase in session RAM for zero-knowledge decryption
      sessionStorage.setItem("stash_passphrase", password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center px-4 selection:bg-[#ccff00] selection:text-black">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ccff00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-[#ccff00] animate-pulse" />
            <span className="font-extrabold text-xl tracking-wider text-white">STASH.</span>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[#ccff00] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> ZERO-KNOWLEDGE
          </span>
        </div>

        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            {isSignUp ? "Create Vault" : "Welcome Back"}
          </h1>
          <p className="text-sm text-zinc-400">
            {isSignUp 
              ? "Initialize your E2EE net-worth and bill tracker." 
              : "Enter your master credentials to unlock client-side RAM keys."}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-800/50 text-red-400 text-xs font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Master Passphrase
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] transition-all"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
              <Lock className="w-3 h-3 text-[#ccff00]" /> Used for client-side AES-GCM-256 derivation.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#ccff00] hover:bg-[#b8e600] text-black font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <span className="font-mono text-xs">DERIVING KEYS...</span>
            ) : (
              <>
                <span>{isSignUp ? "Create Vault & Keys" : "Unlock Stash"}</span>
                <Zap className="w-4 h-4 fill-black" />
              </>
            )}
          </button>
        </form>

        {/* Form Toggle */}
        <div className="mt-6 text-center border-t border-zinc-900 pt-4">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {isSignUp ? (
              <>Already have a vault? <span className="text-[#ccff00] underline font-medium">Sign In</span></>
            ) : (
              <>Need an encrypted vault? <span className="text-[#ccff00] underline font-medium">Create Account</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
