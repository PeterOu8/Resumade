import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const env = { ...process.env };
const localApiCertificate = join(tmpdir(), 'resumade-localhost.pem');

// Node loads extra CA certificates at startup, before Next.js reads .env.local.
if (!env.NODE_EXTRA_CA_CERTS && existsSync(localApiCertificate)) {
  env.NODE_EXTRA_CA_CERTS = localApiCertificate;
}

const next = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)],
  { env, stdio: 'inherit' },
);

next.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

next.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
