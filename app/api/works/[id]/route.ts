import { getWorkById, updateWork, updateEvaluation, deleteWork } from "@/lib/works";

type UpdateWorkRequestBody = {
  title?: string;
  pages?: string[];
  status?: "draft" | "registered";
  evaluation?: string;
};

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * 作品IDを指定して詳細を取得する。
 *
 * @function GET
 * @description
 *  - 作品IDを指定して詳細を取得する。
 *  - 指定されたIDに基づき、作品情報を取得します。
 *
 * @param _ - リクエストオブジェクト
 * @param context - ルートパラメータを含むコンテキスト
 * @throws {404} 作品が見つからない場合
 * @throws {500} サーバーエラー
 */
export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const work = await getWorkById(id);
    if (!work) {
      return Response.json({ ok: false, error: "作品が見つかりません" }, { status: 404 });
    }
    return Response.json({ ok: true, work });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * 作品の内容または評価を更新する。
 *
 * @function PUT
 * @description
 *  - 作品の内容または評価を更新する。
 *  - `evaluation` が含まれる場合は評価内容の更新を行います。
 *  - それ以外は作品のタイトル、ページ、ステータスを更新します。
 *
 * @param request - `title`, `pages`, `status`, `evaluation` を含む JSON を期待します。
 * @param context - ルートパラメータを含むコンテキスト
 * @throws {404} 作品が見つからない場合
 * @throws {500} サーバーエラー
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateWorkRequestBody;

    // 評価（evaluation）のみの更新リクエストの場合
    if (body.evaluation !== undefined) {
      const work = await updateEvaluation(id, body.evaluation);
      if (!work) {
        return Response.json({ ok: false, error: "作品が見つかりません" }, { status: 404 });
      }
      return Response.json({ ok: true, work });
    }

    // 通常の作文内容（タイトル、本文、ステータス）の更新
    const title = (body.title ?? "").trim() || "（タイトル未入力）";
    const pages = Array.isArray(body.pages) ? body.pages : [];
    const status = body.status === "registered" ? "registered" : "draft";

    const work = await updateWork({ id, title, pages, status });
    if (!work) {
      return Response.json({ ok: false, error: "作品が見つかりません" }, { status: 404 });
    }
    return Response.json({ ok: true, work });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * 作品を削除する。
 *
 * @function DELETE
 * @description
 *  - 作品を削除する。
 *  - 指定された作品をデータベースから削除します。
 *
 * @param _ - リクエストオブジェクト
 * @param context - ルートパラメータを含むコンテキスト
 * @throws {500} サーバーエラー
 */
export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteWork(id);
    return Response.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
