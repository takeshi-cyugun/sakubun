"use client";
import React from 'react';
import Link from 'next/link';

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
    },
    {
      title: "作文の構成を考える",
      icon: "📝",
      description: "いきなり書き始めるのではなく、「はじめ・中・おわり」の３つのパーツに分けて考えてみましょう。何を一番伝えたいか決めておくと、スッキリした文章になります。"
    },
    {
      title: "書き終えたら読み返そう",
      icon: "👀",
      description: "最後まで書けたら、一度声に出して読み返してみましょう。抜けている文字がないか、自分の言いたいことが伝わるようになっているか確認することで、もっと素晴らしい作文になります。"
    },
    {
      title: "音声入力を活用しよう",
      icon: "🎤",
      description: "キーボードやフリック入力が苦手なときは、音声入力を使うのがおすすめです。話した言葉がそのまま文字になるので、アイデアを効率よく形にできます。"
    }
  ];

  return (
    <main className="min-h-screen bg-stone-100 flex flex-col p-6 overflow-y-auto">
      <header className="mb-8 text-center relative">
        <Link 
          href="/" 
          className="absolute left-0 top-1 text-sm text-green-800 font-bold flex items-center gap-1 hover:underline active:scale-95 transition-transform"
        >
          ◀ 戻る
        </Link>
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