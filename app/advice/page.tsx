"use client";
import React from 'react';

/**
 * アドバイス画面コンポーネント。
 * 作文の書き方や原稿用紙の使い方のヒントを表示する。
 */
export default function AdvicePage() {
  const adviceList = [
    {
      title: "書き始めるコツ",
      icon: "💡",
      description: "まずは、今日あったことを一つだけ思い出してみましょう。「おいしかった」「びっくりした」など、心が動いた瞬間をテーマにすると書きやすくなります。"
    },
    {
      title: "原稿用紙のルール",
      icon: "📏",
      description: "タイトルは一番右の列に書きます。本文の書き出しや、段落を変えるときは、一マス空けるのが基本のルールです。"
    },
    {
      title: "表現を豊かにする",
      icon: "✨",
      description: "「うれしい」だけでなく、どんな風にうれしかったか（飛び跳ねたいくらい、胸が熱くなった、など）を言葉にしてみると、より素敵な文章になります。"
    }
  ];

  return (
    <main className="min-h-screen bg-stone-100 flex flex-col p-6 overflow-y-auto">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-green-900 mb-2">アドバイス</h1>
        <div className="w-16 h-1 bg-green-700 mx-auto rounded-full" />
        <p className="mt-4 text-sm text-stone-600">もっと楽しく作文を書くためのヒント</p>
      </header>

      <div className="space-y-6 max-w-2xl mx-auto w-full">
        {adviceList.map((item, index) => (
          <section 
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl" role="img" aria-label="icon">
                {item.icon}
              </span>
              <h2 className="text-lg font-bold text-green-800">
                {item.title}
              </h2>
            </div>
            <p className="text-stone-700 text-sm leading-relaxed">
              {item.description}
            </p>
          </section>
        ))}

        <div className="mt-8 bg-green-50 border border-green-100 p-6 rounded-2xl text-center">
          <p className="text-green-900 font-bold text-sm mb-2">
            「書けた！」という気持ちを大切に
          </p>
          <p className="text-green-800 text-xs">
            完璧を目指さなくても大丈夫。あなたの言葉で書かれた文章は、それだけで世界に一つだけの宝物です。
          </p>
        </div>
      </div>

      <footer className="mt-12 mb-6 text-center">
        <p className="text-stone-400 text-[10px]">
          &copy; 2024 サクっと作文アプリ
        </p>
      </footer>
    </main>
  );
}