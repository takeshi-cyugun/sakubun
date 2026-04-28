"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <section className="w-full max-w-sm bg-white rounded-xl shadow-md border border-stone-200 p-6">
        <h1 className="text-lg font-bold text-green-800 mb-5">あゆみノート ログイン</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm text-stone-700 mb-1">アカウント</span>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-700/30 focus:border-green-700"
              placeholder="account"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-stone-700 mb-1">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-700/30 focus:border-green-700"
              placeholder="password"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-green-700 text-white py-2 text-sm font-bold hover:bg-green-800 transition"
          >
            ログイン
          </button>
        </form>
      </section>
    </main>
  );
}
