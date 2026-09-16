import { spawnSync } from 'node:child_process';
// Production applies additive migrations before serving the new authentication code.
// Preview builds must use a separate database and explicit db:migrate.
if (process.env.VERCEL_ENV === 'production') {
  const migration = spawnSync(process.execPath, ['scripts/migrate.mjs'], { stdio: 'inherit' });
  if (migration.status !== 0) process.exit(migration.status || 1);
}
const build = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build', '--webpack'], { stdio: 'inherit' });
process.exit(build.status ?? 1);
