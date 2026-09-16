import {neon} from '@neondatabase/serverless';
import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Stel DATABASE_URL in .env.local in.');
const sql=neon(process.env.DATABASE_URL);
const statements=(await readFile(new URL('../migrations/001_profiles.sql',import.meta.url),'utf8')).split(';').map(s=>s.trim()).filter(Boolean);
await sql.transaction(statements.map(s=>sql.query(s)));
console.log('Database is klaar.');
