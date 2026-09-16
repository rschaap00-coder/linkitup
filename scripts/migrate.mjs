import {neon} from '@neondatabase/serverless';
import {readFile, readdir} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Stel DATABASE_URL in voor de PostgreSQL-database.');
const sql=neon(process.env.DATABASE_URL);
const directory=new URL('../migrations/',import.meta.url);
// All supplied migrations are additive and idempotent, safe to run again.
for(const file of (await readdir(directory)).filter(f=>/^\d+.*\.sql$/.test(f)).sort()) {
  const statements=(await readFile(new URL(file,directory),'utf8')).split(';').map(s=>s.trim()).filter(Boolean);
  await sql.transaction(statements.map(s=>sql.query(s)));
  console.log(`Migratie uitgevoerd: ${file}`);
}
await sql`DELETE FROM auth_limits WHERE expires_at < NOW()`;
console.log('Database is klaar.');
