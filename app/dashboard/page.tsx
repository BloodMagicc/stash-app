"use client";

import React, { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { deriveMasterKey, encryptData, decryptData } from "@/lib/crypto";
import { saveEncryptedRecord, fetchEncryptedRecords, deleteEncryptedRecord } from "@/app/actions/vault";
import { extractTextFromPdf, parseStatementWithAI } from "@/lib/ai";
import { ShieldCheck, Plus, FileText, Trash2, Zap, TrendingUp, LogOut } from "lucide-react";

interface AccountItem {
  id: string;
  name: string;
  type: "Asset" | "Liability";
  amount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [passphrase, setPassphrase] = useState("");
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<"Asset" | "Liability">("Asset");
  const [amount, setAmount] = useState("");

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || !session?.user) return;
    setLoading(true);

    try {
      const key = await deriveMasterKey(passphrase, session.user.id);
      setMasterKey(key);

      const records = await fetchEncryptedRecords("ACCOUNT");
      const decrypted: AccountItem[] = [];

      for (const rec of records) {
        const payload = await decryptData(rec.ciphertext, rec.iv, key);
        decrypted.push({ id: rec.id, ...payload });
      }

      setAccounts(decrypted);
    } catch (err) {
      alert("Invalid passphrase or decryption failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey || !name || !amount) return;

    const payload = { name, type, amount: parseFloat(amount) };
    const { ciphertext, iv } = await encryptData(payload, masterKey);

    const res = await saveEncryptedRecord("ACCOUNT", ciphertext, iv);
    setAccounts([...accounts, { id: res.id, ...payload }]);
    setName("");
    setAmount("");
  };

  const handleDelete = async (id: string) => {
    await deleteEncryptedRecord(id);
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !masterKey) return;

    setLoading(true);
    try {
      const text = await extractTextFromPdf(file);
      const parsed = await parseStatementWithAI(text);

      const payload = {
        name: `${parsed.cardIssuer || "Credit Card"} (${parsed.statementDate || "Bill"})`,
        type: "Liability" as const,
        amount: parsed.totalAmountDueINR,
      };

      const { ciphertext, iv } = await encryptData(payload, masterKey);
      const res = await saveEncryptedRecord("ACCOUNT", ciphertext, iv);

      setAccounts((prev) => [...prev, { id: res.id, ...payload }]);
      alert(`Parsed via ${parsed.engineUsed}! Added liability of ₹${parsed.totalAmountDueINR.toLocaleString("en-IN")}`);
    } catch (err) {
      alert("Error parsing PDF file.");
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = accounts.filter((a) => a.type === "Asset").reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = accounts.filter((a) => a.type === "Liability").reduce((sum, a) => sum + a.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  if (!masterKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090B] p-4 text-zinc-100">
        <form onSubmit={handleUnlock} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <span className="text-3xl font-black text-[#D4FF00] tracking-tight">STASH.</span>
            <h2 className="text-xl font-bold text-white">Unlock Vault</h2>
            <p className="text-xs text-zinc-400">Enter your master passphrase to generate your local key in RAM.</p>
          </div>
          <input
            type="password"
            placeholder="Master Passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
            className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm focus:border-[#D4FF00] outline-none"
          />
          <button type="submit" disabled={loading} className="w-full bg-[#D4FF00] text-black font-bold py-3 rounded-xl text-sm hover:opacity-90">
            {loading ? "Decrypting..." : "Unlock Vault 🔓"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 text-zinc-100">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#D4FF00] tracking-tight">STASH.</span>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full border border-zinc-700">Better Auth + Turso</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> E2EE Active
          </span>
          <button onClick={() => signOut()} className="text-zinc-400 hover:text-white text-xs flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Total Stash (Net Worth)</span>
            <h1 className="text-5xl font-black tracking-tight text-white mt-1">₹{netWorth.toLocaleString("en-IN")}</h1>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-[#D4FF00] bg-[#D4FF00]/10 border border-[#D4FF00]/30 px-3 py-1.5 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" /> Updated Live
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/60">
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Green Flags (Assets)</span>
            <span className="text-xl font-bold text-emerald-400">₹{totalAssets.toLocaleString("en-IN")}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Red Flags (Debts)</span>
            <span className="text-xl font-bold text-rose-500">₹{totalLiabilities.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-200">Add Account Manually</h3>
          <form onSubmit={handleAddAccount} className="space-y-3">
            <input
              type="text"
              placeholder="Account Name (e.g. Zerodha, HDFC)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-sm outline-none focus:border-[#D4FF00]"
            />
            <div className="flex gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-1/2 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-sm outline-none"
              >
                <option value="Asset">Asset (Green Flag)</option>
                <option value="Liability">Liability (Red Flag)</option>
              </select>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-1/2 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-sm outline-none focus:border-[#D4FF00]"
              />
            </div>
            <button type="submit" className="w-full bg-[#D4FF00] text-black font-bold py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </form>
        </div>

        <div className="bg-zinc-900/60 border border-dashed border-zinc-700 hover:border-[#D4FF00] transition-colors p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 relative group">
          <div className="p-3 bg-zinc-800 rounded-full group-hover:bg-[#D4FF00] group-hover:text-black transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-200">Drop Your Card Statement (PDF)</h3>
            <p className="text-xs text-zinc-500 mt-1">Parsed locally via Groq/Gemini. Liability encrypted before storage.</p>
          </div>
          <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-950/40 to-zinc-900 border border-purple-800/30 p-5 rounded-2xl space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-sm text-purple-300">Vibe Check</h3>
        </div>
        <p className="text-xs text-zinc-300">
          {totalLiabilities > totalAssets * 0.3
            ? "🚨 High liability ratio! Prioritize clearing credit card debt to safeguard long-term growth."
            : "✅ Portfolio looking solid! Allocate remaining cash reserves toward index funds."}
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-3">
        <h3 className="font-bold text-sm text-zinc-200">Tracked Accounts</h3>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex justify-between items-center border-b border-zinc-800/60 pb-2 text-sm">
              <span>
                {acc.name} <span className="text-xs text-zinc-500">({acc.type})</span>
              </span>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${acc.type === "Asset" ? "text-emerald-400" : "text-rose-500"}`}>
                  {acc.type === "Asset" ? "+" : "-"}₹{acc.amount.toLocaleString("en-IN")}
                </span>
                <button onClick={() => handleDelete(acc.id)} className="text-zinc-500 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && <p className="text-xs text-zinc-500 italic">No accounts tracked yet. Add one above or drop a bill!</p>}
        </div>
      </div>
    </div>
  );
}
