"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp.email({ email, password, name });
      } else {
        await signIn.email({ email, password });
      }
      router.push("/dashboard");
    } catch (err) {
      alert("Authentication failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090B] p-4 text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <span className="text-4xl font-black text-[#D4FF00] tracking-tight">STASH.</span>
          <h2 className="text-xl font-bold text-white">{isSignUp ? "Create Your Vault" : "Welcome Back"}</h2>
          <p className="text-xs text-zinc-400">Zero-Knowledge Net Worth & Bill Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm outline-none focus:border-[#D4FF00]"
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm outline-none focus:border-[#D4FF00]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm outline-none focus:border-[#D4FF00]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4FF00] text-black font-bold py-3 rounded-xl text-sm hover:opacity-90"
          >
            {loading ? "Processing..." : isSignUp ? "Sign Up ⚡" : "Sign In ⚡"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-zinc-400 hover:text-[#D4FF00]"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
