import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.CALLY_DB_AWS_HOST,
  port: 5432,
  user: 'postgres',
  password: process.env.CALLY_DB_AWS_PASSWORD,
  database: 'cally',
  ssl: {
    rejectUnauthorized: false 
  }
});

export type QueryFunction = (text: string, params?: any[]) => Promise<any>;

export const query: QueryFunction = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', { text, params, error });
    throw error;
  }
};