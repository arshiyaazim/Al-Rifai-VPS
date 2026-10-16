import pg from 'pg';
export function createDatabase(url=process.env.DATABASE_URL){if(!url)throw new Error('DATABASE_URL is required');return new pg.Pool({connectionString:url,max:10,options:'-c search_path=alrifai,public',connectionTimeoutMillis:8000,statement_timeout:15000});}
export async function transaction(db,fn){const c=await db.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
