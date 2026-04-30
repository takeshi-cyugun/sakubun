"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 採点/評価画面コンポーネント。
 * テキストエリアに入力された内容をリアルタイムでMarkdownプレビューし、登録ボタンを提供する。
 */
export default function GradingPage() {
  const [markdownInput, setMarkdownInput] = useState<string>('');
  const [workTitle, setWorkTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrader, setIsGrader] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const workId = searchParams.get('id');

  // 認証チェックと権限判定
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
      // papa または mama トークンを持っている場合のみ採点者（Grader）とする
      // ※ログイン処理で papa/papa なら "papa-token" を保存している想定
      setIsGrader(token === "papa-token" || token === "mama-token");
    }
  }, [router]);

  // 作品データの取得
  const fetchWork = useCallback(async () => {
    if (!workId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/works/${workId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.ok && data.work) {
        setWorkTitle(data.work.title);
        // 既存の評価があればセット
        setMarkdownInput(data.work.evaluation || '');
      }
    } catch (e) {
      console.error("作品の取得に失敗しました:", e);
    } finally {
      setIsLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    if (isAuthorized) void fetchWork();
  }, [fetchWork, isAuthorized]);

  // 登録・更新処理
  const handleRegister = async () => {
    if (!workId) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/works/${workId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluation: markdownInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || '保存に失敗しました');
      alert('評価を登録しました');
      router.push('/');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 削除（評価のクリア）処理
  const handleDelete = async () => {
    if (!confirm('評価内容を削除してもよろしいですか？')) return;
    setMarkdownInput('');
    // 削除は空文字で更新する処理として共通化
    setTimeout(() => { void handleRegister(); }, 0);
  };

  // 認証チェックが終わるまでは何も表示しない
  if (!isAuthorized) return null;

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col overflow-y-auto">
      <header className="bg-green-800 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> 一覧へ
          </Link>
          <h1 className="text-lg font-bold">
            {isGrader ? "採点・評価" : "先生からのアドバイス"} {workTitle && ` : ${workTitle}`}
          </h1>
        </div>
        {isGrader && (
          <button
            onClick={handleRegister}
            disabled={isSaving || !workId}
            className="bg-yellow-500 text-green-900 font-bold px-4 py-1 rounded text-sm shadow-sm hover:bg-yellow-400"
          >
            {isSaving ? '保存中...' : '登録する'}
          </button>
        )}
      </header>

      <div className={`flex flex-col ${isGrader ? 'md:flex-row' : 'items-center'} gap-6 p-6 max-w-6xl mx-auto w-full flex-1`}>
        {/* 入力エリア */}
        {isGrader && (
          <section className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col w-full">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-green-800">評価入力</h2>
            {markdownInput && (
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 hover:underline"
              >
                評価を削除する
              </button>
            )}
          </div>
          <textarea
            className="flex-1 w-full p-4 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-base font-mono leading-relaxed resize-none bg-stone-50/50"
            placeholder="ここに評価やフィードバックをMarkdown形式で入力してください..."
            value={markdownInput}
            onChange={(e) => setMarkdownInput(e.target.value)}
            disabled={isLoading}
          />
        </section>
        )}

        {/* プレビューエリア */}
        <section className={`${isGrader ? 'flex-1' : 'w-full max-w-2xl'} bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col min-h-[400px]`}>
          <h2 className="text-lg font-bold text-green-800 mb-3">{isGrader ? "プレビュー" : "評価シート"}</h2>
          <div className="flex-1 p-4 border border-stone-100 rounded-xl bg-white overflow-y-auto">
            {markdownInput ? (
              <div className="prose prose-stone prose-sm sm:prose-base max-w-none break-words prose-headings:text-green-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownInput}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-stone-500 italic">入力するとここにプレビューが表示されます。</p>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-12 mb-6 text-center">
        <p className="text-stone-400 text-[10px]">
          &copy; 2024 サクっと作文アプリ
        </p>
      </footer>
    </main>
  );
}