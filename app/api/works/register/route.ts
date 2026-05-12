import { createWork } from "@/lib/works";

type RegisterRequestBody = {
  title?: string;
  pages?: string[];
};

/**
 * 作文を正式に登録する。
 *
 * @function POST
 * @description
 *  - 作文を正式に登録する。
 *  - リクエストボディからタイトルとページ内容を取得し、正式な作品として登録します。
 *  - データベースにステータス `registered` で新しいレコードを挿入します。
 *
 * @param request - `title` と `pages` を含む JSON を期待します。
 * @returns 登録された作品情報を含むレスポンス
 * @throws {500} サーバーエラー（DB未設定や保存失敗など）
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequestBody;
    const title = (body.title ?? "").trim() || "（タイトル未入力）";
    const pages = Array.isArray(body.pages) ? body.pages : [];

    const work = await createWork({ title, status: "registered", pages });
    return Response.json({ ok: true, work });
  } catch (err) {
    console.error("[POST /api/works/register] error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);
    return Response.json(
      {
        ok: false,
        error: message,
        hint:
          "DB未設定の場合は環境変数(POSTGRES_URL等)を設定してください。@vercel/postgres を使用しています。",
      },
      { status: 500 }
    );
  }
}
