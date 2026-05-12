import { Pool, type PoolClient } from "pg";

export type WorkStatus = "draft" | "registered" | "demo";

export type WorkRow = {
  id: string;
  title: string;
  status: WorkStatus;
  pages: string[];
  evaluation: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * PostgreSQL の接続文字列を環境変数から取得する。
 *
 * @function getConnectionString
 * @description
 *  - PostgreSQL の接続文字列を環境変数から取得する。
 *  - `POSTGRES_URL_NON_POOLING` を優先し、未設定なら `POSTGRES_URL`、
 *  - それも未設定なら `DATABASE_URL` を参照する。
 */
const getConnectionString = () =>
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: { rejectUnauthorized: false },
});

/**
 * PostgreSQL クライアントの接続・切断を管理して処理を実行する。
 *
 * @function withClient
 * @template T
 * @description
 *  - PostgreSQL クライアントの接続・切断を管理して処理を実行する。
 *  - 接続文字列を取得してクライアントを生成し、処理完了後は成功・失敗に関わらず必ず切断する。
 * @param runner - DB クライアントを受け取り処理を実行する非同期関数
 * @returns `runner` が返す処理結果
 * @throws {Error} 接続文字列が未設定の場合
 */
async function withClient<T>(runner: (client: PoolClient) => Promise<T>) {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("Postgres接続文字列が未設定です。POSTGRES_URL_NON_POOLING か POSTGRES_URL を設定してください。");
  }

  const client = await pool.connect();
  try {
    return await runner(client);
  } finally {
    client.release();
  }
}

/**
 * 作品テーブルが存在しない場合に作成する。
 *
 * @function ensureWorksTable
 * @description
 *  - 作品テーブルが存在しない場合に作成する。
 *  - `works` テーブルと必要なカラム・制約を初期化する。
 * @param client - 実行中の PostgreSQL クライアント
 * @returns テーブル作成処理の完了
 */
async function ensureWorksTable(client: PoolClient) {
  await client.query(`
    create table if not exists works (
      id text primary key,
      title text not null,
      status text not null check (status in ('draft', 'registered', 'demo')),
      pages jsonb not null default '[]'::jsonb,
      evaluation text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

/**
 * 新しい作品を作成して保存する。
 *
 * @function createWork
 * @description
 *  - 新しい作品を作成して保存する。
 *  - 作品テーブルを確認後、UUID を採番して作品データを保存し、保存結果を返す。
 * @param input - 作成する作品情報
 * @param input.title - 作品タイトル
 * @param input.status - 作品ステータス（`draft` または `registered`）
 * @param input.pages - 作品のページデータ一覧
 * @returns 作成された作品レコード
 */
export async function createWork(input: { title: string; status: WorkStatus; pages: string[] }) {
  return withClient(async (client) => {
    await ensureWorksTable(client);
    const id = crypto.randomUUID();
    const result = await client.query<WorkRow>(
      `
      insert into works (id, title, status, pages)
      values ($1, $2, $3, $4::jsonb)
      returning id, title, status, pages, evaluation, created_at::text, updated_at::text;
      `,
      [id, input.title, input.status, JSON.stringify(input.pages)]
    );
    return result.rows[0];
  });
}

/**
 * 作品IDを指定して詳細を取得する。
 *
 * @function getWorkById
 * @description
 *  - 作品IDを指定して詳細を取得する。
 * @param id - 作品ID
 * @returns 対象作品。存在しない場合は `null`
 */
export async function getWorkById(id: string) {
  return withClient(async (client) => {
    await ensureWorksTable(client);
    const result = await client.query<WorkRow>(
      `
      select id, title, status, pages, evaluation, created_at::text, updated_at::text
      from works
      where id = $1
      limit 1;
      `,
      [id]
    );
    return result.rows[0] ?? null;
  });
}

/**
 * 既存作品を更新する。
 *
 * @function updateWork
 * @description
 *  - 既存作品を更新する。
 * @param input - 更新対象と作品の基本内容
 * @returns 更新後の作品。存在しない場合は `null`
 */
export async function updateWork(input: {
  id: string;
  title: string;
  status: WorkStatus;
  pages: string[];
}) {
  return withClient(async (client) => {
    await ensureWorksTable(client);
    const result = await client.query<WorkRow>(
      `
      update works
      set title = $2,
          status = $3,
          pages = $4::jsonb,
          updated_at = now()
      where id = $1
      returning id, title, status, pages, evaluation, created_at::text, updated_at::text;
      `,
      [input.id, input.title, input.status, JSON.stringify(input.pages)]
    );
    return result.rows[0] ?? null;
  });
}

/**
 * 作品の評価（採点）のみを更新する。
 *
 * @function updateEvaluation
 * @description
 *  - 作品の評価（採点）のみを更新する。
 * @param id - 作品ID
 * @param evaluation - 評価内容（Markdownなど）
 * @returns 更新後の作品レコード
 */
export async function updateEvaluation(id: string, evaluation: string | null) {
  return withClient(async (client) => {
    await ensureWorksTable(client);
    const result = await client.query<WorkRow>(
      `
      update works
      set evaluation = $2,
          updated_at = now()
      where id = $1
      returning id, title, status, pages, evaluation, created_at::text, updated_at::text;
      `,
      [id, evaluation]
    );
    return result.rows[0] ?? null;
  });
}


/**
 * 作品一覧を取得する。
 *
 * @function listWorks
 * @description
 *  - 作品一覧を取得する。
 *  - 作品テーブルを確認後、最新の作品データを取得して返す。
 */
export async function listWorks() {
  return withClient(async (client) => {
    await ensureWorksTable(client);
    const result = await client.query<WorkRow>(`
      select id, title, status, pages, evaluation, created_at::text, updated_at::text
      from works
      order by created_at desc
      limit 50;
    `);
    return result.rows;
  });
}

/**
 * 作品を削除する。
 *
 * @function deleteWork
 * @description
 *  - 作品を削除する。
 * @param id - 削除対象の作品ID
 * @returns 削除処理の完了
 */
export async function deleteWork(id: string) {
  return withClient(async (client) => {
    await ensureWorksTable(client);
    await client.query("delete from works where id = $1", [id]);
  });

}
