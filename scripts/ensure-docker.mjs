import { spawnSync } from 'node:child_process';

const run = (command, args) =>
  spawnSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8',
  });

const dockerVersion = run('docker', ['version', '--format', '{{.Server.Version}}']);

if (dockerVersion.error) {
  console.error(
    'Docker is required for `npm run infra:up`, but the `docker` command is not available.',
  );
  console.error('Install Docker Desktop and make sure it is on your PATH.');
  process.exit(1);
}

if (dockerVersion.status !== 0) {
  console.error(
    'Docker Desktop does not appear to be running, so Compose cannot start Postgres and Redis.',
  );
  console.error('Start Docker Desktop, wait for it to finish booting, then rerun `npm run infra:up`.');

  const stderr = dockerVersion.stderr?.trim();

  if (stderr) {
    console.error('');
    console.error(stderr);
  }

  process.exit(1);
}
