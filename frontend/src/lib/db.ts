import { neon } from "@neondatabase/serverless";

type DbRow = Record<string, unknown>;
type RunResult = { lastInsertRowid?: number };

type PreparedStatement = {
  all: (...params: unknown[]) => Promise<DbRow[]>;
  get: (...params: unknown[]) => Promise<DbRow | undefined>;
  run: (...params: unknown[]) => Promise<RunResult>;
};

export type DbClient = {
  prepare: (statement: string) => PreparedStatement;
  exec: (statement: string) => Promise<void>;
};

let db: DbClient | null = null;

function replacePlaceholders(statement: string) {
  let index = 0;
  return statement.replace(/\?/g, () => `$${++index}`);
}

function normalizeStatement(statement: string) {
  return replacePlaceholders(statement).trim().replace(/;$/, "");
}

export function getDb(): DbClient {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }

    const sql = neon(databaseUrl);

    db = {
      prepare: (statement: string) => {
        const text = normalizeStatement(statement);
        return {
          all: async (...params: unknown[]) => {
            const rows = await sql.query(text, params);
            return rows as DbRow[];
          },
          get: async (...params: unknown[]) => {
            const rows = await sql.query(text, params);
            return (rows as DbRow[])[0];
          },
          run: async (...params: unknown[]) => {
            const rows = await sql.query(text, params);
            const first = (rows as DbRow[])[0];
            return {
              lastInsertRowid: typeof first?.id === "number" ? first.id : undefined,
            };
          },
        };
      },
      exec: async (statement: string) => {
        const chunks = statement
          .split(/;\s*\n/)
          .map((chunk) => chunk.trim())
          .filter(Boolean);
        for (const chunk of chunks) {
          await sql.query(chunk);
        }
      },
    };
  }

  return db;
}
