// db.ts
import pkg from 'pg';
const { Pool } = pkg;

let pool: any;

if (!globalThis.pgPool) {
  globalThis.pgPool = new Pool({
    host: process.env.CALLY_DB_AWS_HOST,
    port: 5432,
    user: 'postgres',
    password: process.env.CALLY_DB_AWS_PASSWORD,
    database: 'cally',
    ssl: {
      rejectUnauthorized: false
    }
  });
}

pool = globalThis.pgPool;

export type QueryFunction = (text: string, params?: any[]) => Promise<any>;

export const query: QueryFunction = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', { text, params, error });
    throw error;
  }
};
