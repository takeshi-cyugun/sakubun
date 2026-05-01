"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type WorkSummary = {
  id: string;
  title: string;
  status: "draft" | "registered" | "demo";
  created_at: string;
};

type WorkDetail = WorkSummary & {
  pages: string[];
};

/**
 * 原稿用紙UIと作品一覧UIを切り替えて表示するメイン画面コンポーネント。
 *
 * @function GenkoApp
 * @returns {JSX.Element} 作文作成画面または作品一覧画面
 * @description
 * 入力中テキストの描画、カーソル位置制御、作品の保存・登録・一覧取得を管理する。
 */
export default function GenkoApp() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [currentPage, setCurrentPage] = useState(1);

  const cellSize = 30;    // 1マスのサイズ(px)
  const rows = 20;        // 縦 20マス
  const colsHalf = 10;    // 片側 10列
  const middleWidth = 28; // 真ん中のスペース
  
  const [pages, setPages] = useState<string[]>([""]);
  const [caretIndex, setCaretIndex] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState<"draft" | "registered" | null>(null);
  const [works, setWorks] = useState<WorkSummary[]>([]);
  const [isLoadingWorks, setIsLoadingWorks] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const maxCells = rows * colsHalf * 2;
  const text = pages[currentPage - 1] ?? "";
  const totalChars = pages.reduce((sum, page) => sum + page.replace(/\s/g, "").length, 0);

  /**
   * テキスト位置を原稿用紙のマス目インデックスへ変換する。
   *
   * @function getCellIndexFromTextPosition
   * @param {string} value - 変換対象の文字列
   * @param {number} pos - 文字列内カーソル位置
   * @returns {number} マス目インデックス（0以上 `maxCells` 以下）
   * @description
   * 改行時は次の列先頭へ進める縦書きルールで位置を計算する。
   */
  const getCellIndexFromTextPosition = (value: string, pos: number) => {
    let cellIndex = 0;
    const safePos = Math.max(0, Math.min(pos, value.length));
    for (let i = 0; i < safePos && cellIndex < maxCells; i++) {
      const char = value[i];
      if (char === '\r') continue;
      if (char === '\n') {
        cellIndex = (Math.floor(cellIndex / rows) + 1) * rows;
        continue;
      }
      cellIndex++;
    }
    return Math.min(cellIndex, maxCells);
  };

  /**
   * 原稿用紙の右端1列目からタイトル文字列を抽出する。
   *
   * @function getTitleFromFirstColumn
   * @param {string} value - 1ページ目の全文テキスト
   * @returns {string} 1列目から組み立てたタイトル文字列
   * @description
   * 最大行数までを対象に、縦書きの1列目に配置される文字のみを連結して返す。
   */
  const getTitleFromFirstColumn = (value: string) => {
    const firstColumnChars: string[] = [];
    let cellIndex = 0;
    for (const char of value) {
      if (cellIndex >= maxCells || firstColumnChars.length >= rows) break;
      if (char === '\r') continue;
      if (char === '\n') {
        cellIndex = (Math.floor(cellIndex / rows) + 1) * rows;
        continue;
      }
      const colFromRight = Math.floor(cellIndex / rows);
      if (colFromRight === 0) firstColumnChars.push(char);
      cellIndex++;
    }
    return firstColumnChars.join("").trim();
  };
  const compositionTitle = getTitleFromFirstColumn(pages[0] ?? "") || "（タイトル未入力）";

  /**
   * 作品一覧をサーバーから取得して状態へ反映する。
   *
   * @function fetchWorks
   * @returns {Promise<void>} 取得処理の完了
   * @description
   * `/api/works` を呼び出し、成功時は一覧を更新し、失敗時はアラートを表示する。
   */
  const fetchWorks = useCallback(async () => {
    try {
      setIsLoadingWorks(true);
      const res = await fetch("/api/works", { cache: "no-store" });
      const data = (await res.json()) as {
        ok: boolean;
        works?: WorkSummary[];
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "一覧取得に失敗しました");
      let fetchedWorks = data.works ?? [];
      if (isDemo) fetchedWorks = fetchedWorks.filter(w => w.status === "demo");
      setWorks(fetchedWorks);
    } catch (e) {
      const message = e instanceof Error ? e.message : "一覧取得に失敗しました";
      alert(message);
    } finally {
      setIsLoadingWorks(false);
    }
  }, [isDemo]);

  /**
   * 認証チェック：トークンがなければログイン画面へ。
   */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
      setIsDemo(token === "demo-token");
      // トークンからアカウント名を判定
      if (token === "papa-token") setAccountName("papa");
      else if (token === "mama-token") setAccountName("mama");
      else if (token === "mai-token") setAccountName("mai");
      else if (token === "demo-token") setAccountName("demo");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
    queueMicrotask(() => {
      void fetchWorks();
    });
  }, [isAuthorized, fetchWorks]);

  /**
   * 編集画面表示時に、原稿用紙の右端（書き出し位置）へスクロールする。
   */
  useEffect(() => {
    if (view === 'create') {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
      }, 50); // レンダリング完了を待つための微小な待機
      return () => clearTimeout(timer);
    }
  }, [view]);

  /**
   * ログアウト処理：トークンを削除してログイン画面へ。
   */
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/login");
  };

  /**
   * 作文を一時保存する。
   *
   * @function saveDraft
   * @returns {Promise<void>} 保存処理の完了
   * @description
   * 現在のタイトルとページ内容を `/api/works/draft` へ送信し、成功後に一覧を再取得する。
   */
  const saveDraft = async () => {
    try {
      setIsSaving("draft");
      const endpoint = editingWorkId ? `/api/works/${editingWorkId}` : "/api/works/draft";
      const method = editingWorkId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: compositionTitle, pages, status: "draft" }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "保存に失敗しました");
      alert("一時保存しました");
      await fetchWorks();
    } catch (e) {
      const message = e instanceof Error ? e.message : "保存に失敗しました";
      alert(message);
    } finally {
      setIsSaving(null);
    }
  };

  /**
   * 作文を正式登録する。
   *
   * @function registerWork
   * @returns {Promise<void>} 登録処理の完了
   * @description
   * 現在のタイトルとページ内容を `/api/works/register` へ送信し、成功後に一覧画面へ戻る。
   */
  const registerWork = async () => {
    try {
      setIsSaving("registered");
      const endpoint = editingWorkId ? `/api/works/${editingWorkId}` : "/api/works/register";
      const method = editingWorkId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: compositionTitle, pages, status: "registered" }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "登録に失敗しました");
      alert("登録しました！");
      await fetchWorks();
      setEditingWorkId(null);
      setView("list");
    } catch (e) {
      const message = e instanceof Error ? e.message : "登録に失敗しました";
      alert(message);
    } finally {
      setIsSaving(null);
    }
  };

  /**
   * 一覧から作品を選択して編集画面へ遷移する。
   *
   * @function startEditWork
   * @param {string} workId - 編集対象の作品ID
   * @returns {Promise<void>} 読み込み完了までのPromise
   */
  const startEditWork = async (workId: string) => {
    try {
      const res = await fetch(`/api/works/${workId}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; work?: WorkDetail; error?: string };
      if (!res.ok || !data.ok || !data.work) {
        throw new Error(data.error ?? "作品取得に失敗しました");
      }
      setPages(data.work.pages.length > 0 ? data.work.pages : [""]);
      setCurrentPage(1);
      setCaretIndex(0);
      setEditingWorkId(data.work.id);
      setView("create");
      queueMicrotask(() => textareaRef.current?.focus());
    } catch (e) {
      const message = e instanceof Error ? e.message : "作品取得に失敗しました";
      alert(message);
    }
  };

  /**
   * 作品を削除する。
   *
   * @function trashWork
   * @param {string} workId - 削除対象の作品ID
   */
  const trashWork = async (workId: string) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      const res = await fetch(`/api/works/${workId}`, { method: "DELETE" });

      // レスポンスが空の場合に備えてテキストとして取得し、中身がある時だけJSONパースする
      const responseText = await res.text();
      const data = responseText.trim() ? (JSON.parse(responseText) as { ok: boolean; error?: string }) : { ok: res.ok };

      if (!res.ok || !data.ok) throw new Error(data.error ?? "削除に失敗しました");
      await fetchWorks();
    } catch (e) {
      const message = e instanceof Error ? e.message : "削除に失敗しました";
      alert(message);
    }
  };

  // コンテナ：全体のサイズを計算
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: `${(cellSize * colsHalf * 2) + middleWidth + 4}px`, // 左右の枠線分(2px * 2)を追加
    height: `${cellSize * rows + 4}px`,                        // 上下の枠線分(2px * 2)を追加
    border: '2px solid green',
    backgroundColor: 'white',
    margin: '20px auto',
    overflow: 'hidden',
  };

  // 背景のグリッド（左右に配置）
  const backgroundGridStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    pointerEvents: 'none', // 背景なのでクリックを無効化
  };

  const sideGridStyle: React.CSSProperties = {
    flex: `0 0 ${cellSize * colsHalf}px`,
    backgroundImage: `
      linear-gradient(to bottom, green 1px, transparent 1px),
      linear-gradient(to right, green 1px, transparent 1px)
    `,
    backgroundSize: `${cellSize}px ${cellSize}px`,
  };

  const middleSpaceStyle: React.CSSProperties = {
    flex: `0 0 ${middleWidth}px`,
    borderLeft: '1px solid green',  // 11列目の右側の線
    borderRight: '1px solid green', // 10列目（200文字目）の左側の線
    backgroundColor: 'white',
    boxSizing: 'border-box',
  };

  /**
   * テキストを原稿用紙表示用の2次元グリッドに変換する。
   *
   * @function getCenteredTextGrid
   * @returns {string[][]} 行・列ごとに文字を格納した配列
   * @description
   * 右上から縦方向へ配置する規則で、描画用の文字マップを生成する。
   */
  const getCenteredTextGrid = () => {
    // 文字列を右上から縦書き順で各マスに配置する
    const grid = Array.from({ length: rows }, () => Array(colsHalf * 2).fill(""));
    let cellIndex = 0;
    for (const char of text) {
      if (cellIndex >= maxCells) break;
      if (char === '\r') continue;
      if (char === '\n') {
        cellIndex = (Math.floor(cellIndex / rows) + 1) * rows;
        continue;
      }
      const colFromRight = Math.floor(cellIndex / rows);
      const row = cellIndex % rows;
      const col = colsHalf * 2 - 1 - colFromRight;
      if (col < 0) break;
      grid[row][col] = char;
      cellIndex++;
    }
    return grid;
  };
  const centeredTextGrid = getCenteredTextGrid();

  /**
   * 次のページへ移動し、必要なら新規ページを追加する。
   *
   * @function goNextPage
   * @returns {void} 戻り値なし
   * @description
   * 末尾ページにいる場合は空ページを追加してからページ番号を進める。
   */
  const goNextPage = () => {
    setPages((prev) => {
      if (currentPage < prev.length) return prev;
      return [...prev, ""];
    });
    setCurrentPage((p) => p + 1);
    setCaretIndex(0);
  };

  /**
   * 前のページへ移動する。
   *
   * @function goPrevPage
   * @returns {void} 戻り値なし
   * @description
   * 1ページ未満には移動せず、カーソル位置を先頭へ戻す。
   */
  const goPrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
    setCaretIndex(0);
  };

  const cellStyle: React.CSSProperties = {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${cellSize * 0.78}px`,
    fontFamily: 'serif',
    writingMode: 'vertical-rl',
    textOrientation: 'upright',
    lineHeight: 1,
    position: 'absolute',
  };

  /**
   * マス目インデックスから画面上の座標を計算する。
   *
   * @function getCellPosition
   * @param {number} index - マス目インデックス
   * @returns {{ left: number; top: number }} 描画用の left / top 座標
   * @description
   * 中央余白を考慮して、左右20列分の縦書きグリッド座標へ変換する。
   */
  const getCellPosition = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, maxCells));
    const colFromRight = Math.floor(safeIndex / rows);
    const row = safeIndex % rows;
    const col = colsHalf * 2 - 1 - colFromRight;
    const left = col < colsHalf ? col * cellSize : col * cellSize + middleWidth;
    const top = row * cellSize;
    return { left, top };
  };
  const caretPos = getCellPosition(caretIndex);

  // 認証チェックが終わるまでは何も表示しない（またはローディング表示）
  if (!isAuthorized) return null;

  // 入力エリア（textarea）
  const textareaStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    padding: 0,
    margin: 0,
    overflow: 'hidden', // textarea自身のスクロールを無効化
    touchAction: 'auto', // スマホの標準的な挙動に任せる
    // --- ここが重要：升目に合わせる設定 ---
    fontSize: `${cellSize * 0.78}px`, // 文字サイズをマスより少し小さく（例: 24px）
    lineHeight: `${cellSize * 0.98}px`,    // 行の高さをマスに合わせる
    letterSpacing: '6px',           // 基本は0
    fontFamily: 'serif',            // 原稿用紙らしく明朝体
    writingMode: 'vertical-rl',     // 縦書き
    paddingTop: `${cellSize * 0.1}px`, // 文字を中央に寄せる微調整
    paddingLeft: `${cellSize * 0.1}px`,
    color: 'transparent',
    caretColor: 'transparent',
  };

  return (
    <main className="h-screen bg-stone-100 flex flex-col overflow-hidden">
      {/* ヘッダー：すべての操作ボタンをここに集約 */}
      <header className="bg-green-800 text-white p-3 shadow-md flex-none flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-sm">
            {view === "create" ? compositionTitle : "サクっと作文アプリ"}
          </h1>
          {view === "list" && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-full hover:bg-green-700 transition-colors focus:outline-none flex items-center justify-center border border-white/20"
                aria-label="ユーザーメニュー"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
              
              {isMenuOpen && (
                <>
                  {/* メニューの外側をクリックして閉じるための透明レイヤー */}
                  <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-xl py-1 z-40 border border-stone-200 animate-in fade-in zoom-in duration-100">
                    <div className="px-4 py-2 text-[10px] text-stone-400 border-b border-stone-100 uppercase tracking-wider">
                      User: <span className="font-bold text-green-800">{accountName}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <span>🚪</span> ログアウト
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {view === "create" && (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditingWorkId(null);
                  setView('list');
                }} 
                className="text-xs bg-transparent border border-white/40 px-3 py-1 rounded"
              >
                やめる
              </button>
              <button 
                onClick={saveDraft} 
                disabled={isSaving !== null}
                className="text-xs bg-white/20 px-3 py-1 rounded disabled:opacity-60"
              >
                {isSaving === "draft" ? "保存中..." : "一時保存"}
              </button>
              <button 
                onClick={registerWork} 
                disabled={isSaving !== null}
                className="text-xs bg-yellow-500 text-green-900 font-bold px-4 py-1 rounded shadow-sm disabled:opacity-60"
              >
                {isSaving === "registered" ? "登録中..." : "登録"}
              </button>
            </div>
          )}
        </div>
        
        {view === 'create' && (
          <div className="flex justify-between items-center bg-black/10 px-2 py-1 rounded text-xs">
            <div className="flex gap-4">
              <button onClick={goNextPage}>◀ 次</button>
              <span>{currentPage} ページ</span>
              <button
                disabled={currentPage === 1}
                onClick={goPrevPage}
                className={currentPage === 1 ? "text-gray-400" : "text-white"}
              >
                前 ▶
              </button>
            </div>
            <span>{totalChars} 文字</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'create' ? (
          <div className="flex-1 flex flex-col p-4">
            {/* 原稿用紙部分のみの横スライドバー（スクロールエリア） */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-auto border-2 border-stone-300 shadow-inner bg-white rounded-sm custom-scrollbar px-4 py-4"
            >
              

            <div style={containerStyle}>
              {/* 背景レイヤー */}
              <div style={backgroundGridStyle}>
                <div style={sideGridStyle} />
                <div style={middleSpaceStyle} />
                <div style={sideGridStyle} />
              </div>

              {/* 入力レイヤー */}
              <textarea
                ref={textareaRef}
                style={textareaStyle}
                value={text}
                onChange={(e) => {
                  const nextText = e.target.value;
                  setPages((prev) => {
                    const next = [...prev];
                    next[currentPage - 1] = nextText;
                    return next;
                  });
                  setCaretIndex(getCellIndexFromTextPosition(nextText, e.target.selectionStart ?? nextText.length));
                }}
                onSelect={(e) => setCaretIndex(getCellIndexFromTextPosition(e.currentTarget.value, e.currentTarget.selectionStart ?? 0))}
                onKeyUp={(e) => setCaretIndex(getCellIndexFromTextPosition(e.currentTarget.value, e.currentTarget.selectionStart ?? 0))}
                onClick={(e) => setCaretIndex(getCellIndexFromTextPosition(e.currentTarget.value, e.currentTarget.selectionStart ?? 0))}
                onFocus={() => {
                  setIsFocused(true);
                  const el = textareaRef.current;
                  setCaretIndex(getCellIndexFromTextPosition(el?.value ?? text, el?.selectionStart ?? text.length));
                }}
                onBlur={() => setIsFocused(false)}
                spellCheck={false}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                {centeredTextGrid.map((rowChars, row) =>
                  rowChars.map((char, col) => {
                    if (!char) return null;
                    const x = col < colsHalf
                      ? col * cellSize
                      : col * cellSize + middleWidth;
                    return (
                      <span
                        key={`${row}-${col}`}
                        style={{
                          ...cellStyle,
                          top: `${row * cellSize}px`,
                          left: `${x}px`,
                        }}
                      >
                        {char}
                      </span>
                    );
                  })
                )}
                {isFocused && (
                  <span
                    style={{
                      position: 'absolute',
                      top: `${caretPos.top + (cellSize - 10) / 2}px`,
                      left: `${caretPos.left + (cellSize - 12) / 2}px`,
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '10px solid #dc2626',
                      animation: 'caret-blink 1s steps(1, end) infinite',
                    }}
                  />
                )}
              </div>
            </div>
              
            </div>



            {/* 下部のスクロールガイド（スマホ用） */}
            <div className="text-[10px] text-stone-400 text-center mt-2">
              ← よこにスライドして かきすすめる →
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col p-6 md:p-8 relative">
            {/* フローティング「アドバイス」ボタン (左側) */}
            <div className="fixed bottom-10 left-10 z-20 flex flex-col items-center pointer-events-none">
              <Link
                href="/advice"
                className="w-16 h-16 bg-amber-500 text-white rounded-full text-3xl shadow-2xl active:scale-95 transition pointer-events-auto border-4 border-white flex items-center justify-center hover:bg-amber-600"
              >
                💡
              </Link>
              <p className="text-stone-600 font-bold text-[10px] mt-2 bg-white/90 px-3 py-1 rounded-full shadow-md border border-stone-200">
                アドバイスをみる
              </p>
            </div>

            {/* フローティング「＋」ボタンと文言 */}
            <div className="fixed bottom-10 right-10 z-20 flex flex-col items-center pointer-events-none">
              <button
                onClick={() => {
                  setPages([""]);
                  setCurrentPage(1);
                  setCaretIndex(0);
                  setEditingWorkId(null);
                  setView("create");
                }}
                className="w-16 h-16 bg-green-700 text-white rounded-full text-4xl shadow-2xl active:scale-95 transition pointer-events-auto border-4 border-white flex items-center justify-center hover:bg-green-800"
              >
                ＋
              </button>
              <p className="text-stone-600 font-bold text-xs mt-2 bg-white/90 px-3 py-1 rounded-full shadow-md border border-stone-200">
                新しい作文を書こう
              </p>
            </div>

            <div className="flex-1 bg-white border border-stone-200 rounded-lg shadow-sm overflow-y-auto">
              <ul className="divide-y divide-stone-200">
                {works.map((work) => (
                  <li
                    key={work.id}
                    className="flex flex-col gap-2 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-600">
                          {new Date(work.created_at).toLocaleDateString("ja-JP")}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            work.status === "registered"
                              ? "bg-emerald-100 text-emerald-800"
                              : work.status === "demo"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {work.status === "registered" ? "登録" : work.status === "demo" ? "デモ" : "一時保存"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void startEditWork(work.id)}
                          aria-label="編集"
                          className="h-8 w-8 flex-none rounded border border-stone-300 bg-white text-base leading-none text-stone-600 hover:bg-stone-50"
                        >
                          ✏️
                        </button>
                        <Link
                          href={`/grading?id=${work.id}`}
                          className="h-8 w-8 flex items-center justify-center rounded border border-stone-300 bg-white text-base leading-none text-stone-600 hover:bg-stone-50"
                          aria-label="アドバイス"
                        >
                          💡
                        </Link>
                        <button
                          type="button"
                          onClick={() => void trashWork(work.id)}
                          aria-label="削除"
                          className="h-8 w-8 flex-none rounded border border-stone-300 bg-white text-base leading-none text-red-600 hover:bg-red-50"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-stone-800 whitespace-nowrap overflow-hidden text-ellipsis">
                      {work.title}
                    </div>
                  </li>
                ))}
                {!isLoadingWorks && works.length === 0 && (
                  <li className="px-4 py-6 text-sm text-stone-500 text-center">
                    まだ作品がありません
                  </li>
                )}
                {isLoadingWorks && (
                  <li className="px-4 py-12 flex flex-col items-center justify-center gap-3">
                    <div className="spinner" />
                    <span className="text-sm text-stone-500">作品を読み込んでいます...</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e7e5e4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #166534;
          border-radius: 10px;
        }
        @keyframes caret-blink {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 4px solid rgba(0,0,0,0.1);
          border-top-color: #166534;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}