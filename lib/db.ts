import { Pool, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';

const certPath = path.join(process.cwd(), 'global-bundle.pem');
let sslConfig: any = { rejectUnauthorized: false };

if (fs.existsSync(certPath)) {
  sslConfig.ca = fs.readFileSync(certPath).toString();
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: sslConfig,
});

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]) {
  if (process.env.DB_MOCK_MODE === 'true') {
    return { rows: [] } as any; 
  }
  const res = await pool.query<T>(text, params);
  return res;
}