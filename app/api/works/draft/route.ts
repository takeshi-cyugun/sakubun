import { createWork } from "@/lib/works";

type DraftRequestBody = {
  title?: string;
  pages?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DraftRequestBody;
    const title = (body.title ?? "").trim() || "（タイトル未入力）";
    const pages = Array.isArray(body.pages) ? body.pages : [];

    const work = await createWork({ title, status: "draft", pages });
    return Response.json({ ok: true, work });
  } catch (err) {
    console.error("[POST /api/works/draft] error:", err);
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

