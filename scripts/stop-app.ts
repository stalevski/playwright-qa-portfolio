import { execSync } from 'node:child_process';

/**
 * Stops the locally running PetHub Local app by freeing its port (default 3000).
 * Cross-platform: uses netstat/taskkill on Windows and lsof/kill elsewhere, so
 * `npm run stop` works the same on every machine without extra dependencies.
 */
const port = Number(process.env.APP_PORT ?? 3000);
const isWindows = process.platform === 'win32';

const run = (command: string): string => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return '';
  }
};

const findWindowsPids = (): string[] => {
  const pids = new Set<string>();
  for (const line of run('netstat -ano -p tcp').split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/);
    // Columns: Proto | Local Address | Foreign Address | State | PID
    if (columns.length >= 5 && columns[1].endsWith(`:${port}`) && columns[4] !== '0') {
      pids.add(columns[4]);
    }
  }
  return [...pids];
};

const findUnixPids = (): string[] =>
  run(`lsof -ti tcp:${port}`)
    .split(/\r?\n/)
    .map((pid) => pid.trim())
    .filter(Boolean);

const pids = isWindows ? findWindowsPids() : findUnixPids();

if (pids.length === 0) {
  console.info(`No process is listening on port ${port}; nothing to stop.`);
  process.exit(0);
}

for (const pid of pids) {
  run(isWindows ? `taskkill /PID ${pid} /F /T` : `kill -9 ${pid}`);
  console.info(`Stopped PetHub Local (PID ${pid}) on port ${port}.`);
}
