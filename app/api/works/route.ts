import { listWorks } from "@/lib/works";

export async function GET() {
  console.log("[GET /api/works] start");
  try {
    const works = await listWorks();
    console.log("[GET /api/works] works:", works);
    return Response.json({ ok: true, works });
  } catch (err) {
    console.error("[GET /api/works] error:", err);
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

