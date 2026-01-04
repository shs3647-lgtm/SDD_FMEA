import { execSync } from 'node:child_process';

export type Mode = 'staged' | 'branch';

export type ProtectedConfig = {
  /**
   * Glob-like patterns (very small subset) checked against file paths:
   * - `**` matches any subpath
   * - `*` matches any characters except path separator
   */
  protectedPaths: string[];
  /**
   * Optional explicit frozen files/globs (same mini-glob rules).
   * Useful for file-level codefreeze like FunctionL1Tab.tsx, etc.
   */
  frozenFiles?: string[];
  /**
   * Commit message must contain this token to allow protected changes.
   * Example: "APPROVED-BY-USER"
   */
  approvalToken?: string;
  /**
   * Optional allow override. If set, and env var equals this value, guard passes.
   * Example: FMEA_GUARD_OVERRIDE=APPROVED-BY-USER
   */
  overrideEnvVar?: string;
  overrideEnvValue?: string;
};

export function readJsonConfig(): ProtectedConfig {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cfg = require('./protected-paths.config.json') as ProtectedConfig;
  if (!cfg?.protectedPaths?.length) {
    throw new Error('protected-paths.config.json missing protectedPaths');
  }
  return cfg;
}

export function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

export function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

export function normalizePath(p: string): string {
  return p.replaceAll('\\', '/');
}

export function globToRegex(glob: string): RegExp {
  // Minimal glob: `**` and `*` only.
  // Strategy:
  // 1) replace glob tokens with placeholders
  // 2) escape the rest for RegExp
  // 3) replace placeholders with regex fragments
  const g = normalizePath(glob).trim();
  const tokenized = g
    .replaceAll('**', '___DOUBLE_STAR___')
    .replaceAll('*', '___SINGLE_STAR___');

  const escaped = tokenized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const finalRe = escaped
    .replaceAll('___DOUBLE_STAR___', '.*')
    .replaceAll('___SINGLE_STAR___', '[^/]*');

  return new RegExp(`^${finalRe}$`, 'i');
}

export function matchesAny(path: string, globs: string[]): boolean {
  const p = normalizePath(path);
  return globs.some((g) => globToRegex(g).test(p));
}

export function execLines(cmd: string): string[] {
  const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
  return out
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getChangedFiles(mode: Mode): string[] {
  if (mode === 'staged') return execLines('git diff --cached --name-only');
  try {
    return execLines('git diff --name-only origin/main...HEAD');
  } catch {
    return execLines('git diff --name-only HEAD~1..HEAD');
  }
}

export function getProtectedHits(mode: Mode, cfg: ProtectedConfig): string[] {
  const files = getChangedFiles(mode);
  const globs = [...cfg.protectedPaths, ...(cfg.frozenFiles ?? [])];
  return files.filter((f) => matchesAny(f, globs));
}


