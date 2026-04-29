"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 採点/評価画面コンポーネント。
 * テキストエリアに入力された内容をリアルタイムでMarkdownプレビューし、登録ボタンを提供する。
 */
export default function GradingPage() {
  const [markdownInput, setMarkdownInput] = useState<string>('');

  const handleRegister = () => {
    // 今は何も処理しないが、将来的に登録処理を実装する
    alert('登録ボタンが押されました！ (現在は処理なし)');
    console.log('登録内容:', markdownInput);
  };

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col overflow-y-auto">
      <header className="bg-green-800 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> もどる
          </Link>
          <h1 className="text-lg font-bold">採点・評価</h1>
        </div>
        <button
          onClick={handleRegister}
          className="bg-yellow-500 text-green-900 font-bold px-4 py-1 rounded text-sm shadow-sm hover:bg-yellow-400"
        >
          登録する
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-6 p-6 max-w-6xl mx-auto w-full flex-1">
        {/* 入力エリア */}
        <section className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <h2 className="text-lg font-bold text-green-800 mb-3">評価入力</h2>
          <textarea
            className="flex-1 w-full p-4 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-base font-mono leading-relaxed resize-none bg-stone-50/50"
            placeholder="ここに評価やフィードバックをMarkdown形式で入力してください..."
            value={markdownInput}
            onChange={(e) => setMarkdownInput(e.target.value)}
          />
        </section>

        {/* プレビューエリア */}
        <section className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <h2 className="text-lg font-bold text-green-800 mb-3">プレビュー</h2>
          <div className="flex-1 p-4 border border-stone-100 rounded-xl bg-white overflow-y-auto">
            {markdownInput ? (
              <div className="prose prose-stone prose-sm sm:prose-base max-w-none break-words">
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