#!/usr/bin/env -S npx tsx
/**
 * s3-sync.ts — Two-phase S3 backup sync for ~/.openclaw/
 *
 * Phase 1: Upload changed files (best-effort, track failures)
 * Phase 2: Delete markers for orphaned S3 objects (only if Phase 1 had zero failures)
 * Phase 3: Local pruning (only if Phase 1 had zero failures)
 * Phase 4: Finalize (write state cache + run log)
 */

import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type S3Client as S3ClientType,
} from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const CONFIG = {
  bucket: process.env.OPENCLAW_S3_BUCKET || 'BUCKET_NAME',
  region: process.env.OPENCLAW_S3_REGION || 'AWS_REGION',
  profile: process.env.OPENCLAW_S3_PROFILE || 'AWS_PROFILE',
  localRoot: path.join(os.homedir(), '.openclaw'),
  s3Prefix: '.openclaw/',
  registryPath: path.join(os.homedir(), '.openclaw/backup-registry.json'),
  stateCachePath: path.join(os.homedir(), '.openclaw/backup-sync-state.json'),
  logDir: path.join(os.homedir(), '.openclaw/workspace/logs/backup'),
  escalationDir: path.join(os.homedir(), '.openclaw/workspace/logs/escalations'),
  largeFileThreshold: 100 * 1024 * 1024, // 100 MB
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegistryEntry {
  backup: 'github' | 's3' | 'ignored';
  pruneMaxDays: number | null;
}

interface Registry {
  $schema: string;
  version: number;
  updated: string;
  entries: Record<string, RegistryEntry>;
}

interface StateCacheEntry {
  mtime: number;
  size: number;
  sha256: string;
}

type StateCache = Record<string, StateCacheEntry>;

interface ErrorEntry {
  file: string;
  error: string;
  message: string;
  stack: string;
  retries: number;
  resolved: boolean;
}

interface RunLog {
  process: string;
  timestamp: string;
  duration_sec: number;
  status: 'success' | 'failure';
  metrics: {
    files_scanned: number;
    files_uploaded: number;
    files_skipped: number;
    files_skipped_cache: number;
    files_pruned: number;
    bytes_uploaded: number;
    large_files_flagged: number;
    read_errors: number;
    escalations_written: number;
    delete_markers_placed: number;
  };
  errors: ErrorEntry[];
  warnings: string[];
  large_files: string[];
  deletions_skipped_reason: string | null;
}

// ---------------------------------------------------------------------------
// Scan exclusions
// ---------------------------------------------------------------------------

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  '__pycache__',
  '.venv',
  'venv',
  '.cache',
]);

function isExcludedDir(name: string): boolean {
  return EXCLUDED_DIRS.has(name);
}

// ---------------------------------------------------------------------------
// Registry resolution
// ---------------------------------------------------------------------------

export function resolveBackupStrategy(
  relativePath: string,
  entries: Record<string, RegistryEntry>,
): { entry: RegistryEntry; inherited: boolean; parentPath: string | null } {
  // Exact match
  if (entries[relativePath]) {
    return { entry: entries[relativePath], inherited: false, parentPath: null };
  }

  // Parent walk
  let current = relativePath;
  while (current.includes('/')) {
    current = current.substring(0, current.lastIndexOf('/'));
    if (entries[current]) {
      return { entry: entries[current], inherited: true, parentPath: current };
    }
  }

  // Root default
  return {
    entry: { backup: 's3', pruneMaxDays: null },
    inherited: true,
    parentPath: null,
  };
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

export function computeSHA256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('base64')));
    stream.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

export async function scanLocalFiles(
  rootDir: string,
  entries: Record<string, RegistryEntry>,
): Promise<{
  files: Map<string, { isSymlink: boolean; symlinkTarget?: string }>;
  readErrors: string[];
}> {
  const files = new Map<string, { isSymlink: boolean; symlinkTarget?: string }>();
  const readErrors: string[] = [];

  async function walk(dir: string): Promise<void> {
    let dirEntries;
    try {
      dirEntries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      const rel = path.relative(rootDir, dir);
      readErrors.push(rel);
      return;
    }

    for (const entry of dirEntries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      // Excluded directories
      if (entry.isDirectory() && isExcludedDir(entry.name)) {
        continue;
      }

      // Check if parent is ignored — skip entire subtree
      const strategy = resolveBackupStrategy(relativePath, entries);
      if (strategy.entry.backup === 'ignored') {
        continue;
      }

      if (entry.isSymbolicLink()) {
        try {
          const target = await fs.readlink(fullPath);
          files.set(relativePath, { isSymlink: true, symlinkTarget: target });
        } catch {
          readErrors.push(relativePath);
        }
      } else if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        // Skip sockets, pipes, device files (isFile() already filters these)
        files.set(relativePath, { isSymlink: false });
      }
      // Skip sockets, pipes, device files (not isFile, not isDirectory, not isSymbolicLink)
    }
  }

  await walk(rootDir);
  return { files, readErrors };
}

// ---------------------------------------------------------------------------
// S3 operations (injectable for testing)
// ---------------------------------------------------------------------------

export interface S3Ops {
  headObject(key: string): Promise<{ checksumSHA256?: string; exists: boolean }>;
  putObject(key: string, body: Buffer | NodeJS.ReadableStream, metadata?: Record<string, string>): Promise<void>;
  deleteObject(key: string): Promise<void>;
  listObjects(prefix: string): Promise<string[]>;
}

export function createS3Ops(client: S3ClientType, bucket: string): S3Ops {
  return {
    async headObject(key: string) {
      try {
        const res = await client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
            ChecksumMode: 'ENABLED',
          }),
        );
        return { checksumSHA256: res.ChecksumSHA256 ?? undefined, exists: true };
      } catch (err: any) {
        if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
          return { exists: false };
        }
        throw err;
      }
    },

    async putObject(key: string, body: Buffer | NodeJS.ReadableStream, metadata?: Record<string, string>) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ChecksumAlgorithm: 'SHA256',
          ...(metadata ? { Metadata: metadata } : {}),
        }),
      );
    },

    async deleteObject(key: string) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    },

    async listObjects(prefix: string): Promise<string[]> {
      const keys: string[] = [];
      let continuationToken: string | undefined;

      do {
        const res = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );
        if (res.Contents) {
          for (const obj of res.Contents) {
            if (obj.Key) keys.push(obj.Key);
          }
        }
        continuationToken = res.NextContinuationToken;
      } while (continuationToken);

      return keys;
    },
  };
}

// ---------------------------------------------------------------------------
// Core sync logic
// ---------------------------------------------------------------------------

export async function runSync(s3Ops: S3Ops): Promise<RunLog> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  const runLog: RunLog = {
    process: 's3-sync',
    timestamp,
    duration_sec: 0,
    status: 'success',
    metrics: {
      files_scanned: 0,
      files_uploaded: 0,
      files_skipped: 0,
      files_skipped_cache: 0,
      files_pruned: 0,
      bytes_uploaded: 0,
      large_files_flagged: 0,
      read_errors: 0,
      escalations_written: 0,
      delete_markers_placed: 0,
    },
    errors: [],
    warnings: [],
    large_files: [],
    deletions_skipped_reason: null,
  };

  // Load registry
  let registry: Registry;
  try {
    const raw = await fs.readFile(CONFIG.registryPath, 'utf-8');
    registry = JSON.parse(raw);
  } catch (err: any) {
    runLog.status = 'failure';
    runLog.errors.push({
      file: 'backup-registry.json',
      error: 'RegistryLoadError',
      message: `Failed to load registry: ${err.message}`,
      stack: err.stack || '',
      retries: 0,
      resolved: false,
    });
    runLog.duration_sec = Math.round((Date.now() - startTime) / 1000);
    return runLog;
  }

  // Load state cache
  let stateCache: StateCache = {};
  try {
    const raw = await fs.readFile(CONFIG.stateCachePath, 'utf-8');
    stateCache = JSON.parse(raw);
  } catch {
    // Cache missing or corrupt — continue without it
  }

  // Phase 1: Scan + Upload
  const { files, readErrors } = await scanLocalFiles(CONFIG.localRoot, registry.entries);
  runLog.metrics.files_scanned = files.size;
  runLog.metrics.read_errors = readErrors.length;

  if (readErrors.length > 0) {
    for (const re of readErrors) {
      runLog.warnings.push(`Read error on: ${re}`);
    }
  }

  const unknownPaths: Array<{ path: string; parentPath: string | null; rule: string }> = [];
  const localS3Keys = new Set<string>(); // Track all S3 keys we expect to exist
  let phase1Failures = 0;

  for (const [relativePath, fileInfo] of files) {
    const { entry, inherited, parentPath } = resolveBackupStrategy(relativePath, registry.entries);

    if (entry.backup === 'github' || entry.backup === 'ignored') {
      runLog.metrics.files_skipped++;
      continue;
    }

    // This file should be in S3
    const s3Key = CONFIG.s3Prefix + relativePath;
    localS3Keys.add(s3Key);

    // Track unknown paths for escalation
    if (inherited && entry.backup !== 'ignored') {
      unknownPaths.push({ path: relativePath, parentPath, rule: entry.backup });
    }

    try {
      if (fileInfo.isSymlink) {
        // Upload symlink as empty object with metadata
        const head = await s3Ops.headObject(s3Key);
        // Always re-upload symlinks (they're tiny)
        await s3Ops.putObject(s3Key, Buffer.alloc(0), {
          'symlink-target': fileInfo.symlinkTarget || '',
        });
        runLog.metrics.files_uploaded++;

        // Check if symlink target is in backup set
        if (fileInfo.symlinkTarget) {
          const targetAbs = path.resolve(path.dirname(path.join(CONFIG.localRoot, relativePath)), fileInfo.symlinkTarget);
          const targetRel = path.relative(CONFIG.localRoot, targetAbs);
          if (!files.has(targetRel) && targetAbs.startsWith(CONFIG.localRoot)) {
            unknownPaths.push({
              path: `SYMLINK_DANGLING: ${relativePath} -> ${fileInfo.symlinkTarget}`,
              parentPath: null,
              rule: 'dangling_symlink',
            });
          }
        }
        continue;
      }

      const fullPath = path.join(CONFIG.localRoot, relativePath);
      const stat = await fs.stat(fullPath);

      // Check large file
      if (stat.size > CONFIG.largeFileThreshold) {
        runLog.large_files.push(relativePath);
        runLog.metrics.large_files_flagged++;
      }

      // State cache check
      const cached = stateCache[relativePath];
      if (
        cached &&
        cached.mtime === Math.floor(stat.mtimeMs) &&
        cached.size === stat.size
      ) {
        runLog.metrics.files_skipped++;
        runLog.metrics.files_skipped_cache++;
        continue;
      }

      // Compute local hash
      const localHash = await computeSHA256(fullPath);

      // HeadObject to compare
      const head = await s3Ops.headObject(s3Key);

      if (head.exists && head.checksumSHA256 === localHash) {
        // Hash matches, update cache and skip
        stateCache[relativePath] = {
          mtime: Math.floor(stat.mtimeMs),
          size: stat.size,
          sha256: localHash,
        };
        runLog.metrics.files_skipped++;
        continue;
      }

      // Upload needed: not in S3, no checksum, or hash differs
      const fileStream = createReadStream(fullPath);
      await s3Ops.putObject(s3Key, fileStream);
      runLog.metrics.files_uploaded++;
      runLog.metrics.bytes_uploaded += stat.size;

      // Update state cache
      stateCache[relativePath] = {
        mtime: Math.floor(stat.mtimeMs),
        size: stat.size,
        sha256: localHash,
      };
    } catch (err: any) {
      phase1Failures++;
      runLog.errors.push({
        file: relativePath,
        error: err.name || 'UnknownError',
        message: `Upload failed: ${err.message}`,
        stack: err.stack || '',
        retries: 0,
        resolved: false,
      });
    }
  }

  // Write batched escalation if unknown paths found
  if (unknownPaths.length > 0) {
    try {
      await fs.mkdir(CONFIG.escalationDir, { recursive: true });
      const now = new Date();
      const dateStr = now.toISOString().replace(/[-:]/g, '').substring(0, 13).replace('T', '-');
      const escalationFile = path.join(
        CONFIG.escalationDir,
        `${dateStr}-s3-sync-unknown-paths.json`,
      );
      await fs.writeFile(
        escalationFile,
        JSON.stringify(
          {
            process: 's3-sync',
            timestamp: now.toISOString(),
            severity: 'info',
            error: 'UnknownPaths',
            message: `${unknownPaths.length} path(s) discovered with no explicit registry entry`,
            context: { paths: unknownPaths },
          },
          null,
          2,
        ),
      );
      runLog.metrics.escalations_written++;
    } catch (err: any) {
      runLog.warnings.push(`Failed to write escalation file: ${err.message}`);
    }
  }

  // Phase 2: Delete markers (only if Phase 1 had zero failures and zero read errors)
  if (phase1Failures > 0 || readErrors.length > 0) {
    runLog.deletions_skipped_reason =
      phase1Failures > 0
        ? `Phase 1 had ${phase1Failures} failure(s)`
        : `Phase 1 had ${readErrors.length} read error(s)`;
  } else {
    try {
      const s3Keys = await s3Ops.listObjects(CONFIG.s3Prefix);
      const orphanedKeys = s3Keys.filter((k) => !localS3Keys.has(k));

      if (s3Keys.length < 100) {
        // Bootstrap detection: skip safety checks
        for (const key of orphanedKeys) {
          // Exclude read-error prefixes
          const rel = key.substring(CONFIG.s3Prefix.length);
          const hasReadError = readErrors.some((re) => rel.startsWith(re + '/') || rel === re);
          if (hasReadError) continue;

          await s3Ops.deleteObject(key);
          runLog.metrics.delete_markers_placed++;
        }
      } else {
        // Safety checks
        const localCount = localS3Keys.size;
        const s3Count = s3Keys.length;
        const deletionCount = orphanedKeys.length;

        if (localCount < s3Count * 0.9) {
          runLog.deletions_skipped_reason = `Safety: local scan found ${localCount} files vs ${s3Count} in S3 (<90%)`;
          // Write escalation
          try {
            await fs.mkdir(CONFIG.escalationDir, { recursive: true });
            const now = new Date();
            const dateStr = now.toISOString().replace(/[-:]/g, '').substring(0, 13).replace('T', '-');
            await fs.writeFile(
              path.join(CONFIG.escalationDir, `${dateStr}-s3-sync-safety.json`),
              JSON.stringify({
                process: 's3-sync',
                timestamp: now.toISOString(),
                severity: 'critical',
                error: 'SafetyCheckFailed',
                message: runLog.deletions_skipped_reason,
                context: { localCount, s3Count, deletionCount },
              }, null, 2),
            );
            runLog.metrics.escalations_written++;
          } catch { /* best effort */ }
        } else if (deletionCount > s3Count * 0.1) {
          runLog.deletions_skipped_reason = `Safety: ${deletionCount} deletions out of ${s3Count} objects (>10%)`;
          try {
            await fs.mkdir(CONFIG.escalationDir, { recursive: true });
            const now = new Date();
            const dateStr = now.toISOString().replace(/[-:]/g, '').substring(0, 13).replace('T', '-');
            await fs.writeFile(
              path.join(CONFIG.escalationDir, `${dateStr}-s3-sync-safety.json`),
              JSON.stringify({
                process: 's3-sync',
                timestamp: now.toISOString(),
                severity: 'critical',
                error: 'SafetyCheckFailed',
                message: runLog.deletions_skipped_reason,
                context: { localCount, s3Count, deletionCount },
              }, null, 2),
            );
            runLog.metrics.escalations_written++;
          } catch { /* best effort */ }
        } else {
          // All checks pass — place delete markers
          for (const key of orphanedKeys) {
            const rel = key.substring(CONFIG.s3Prefix.length);
            const hasReadError = readErrors.some((re) => rel.startsWith(re + '/') || rel === re);
            if (hasReadError) continue;

            try {
              await s3Ops.deleteObject(key);
              runLog.metrics.delete_markers_placed++;
            } catch (err: any) {
              runLog.warnings.push(`Failed to delete ${key}: ${err.message}`);
            }
          }
        }
      }
    } catch (err: any) {
      runLog.warnings.push(`Phase 2 list failed: ${err.message}`);
      runLog.deletions_skipped_reason = `ListObjects failed: ${err.message}`;
    }
  }

  // Phase 3: Local pruning (only if Phase 1 had zero failures)
  if (phase1Failures === 0 && readErrors.length === 0) {
    for (const [entryPath, entryConfig] of Object.entries(registry.entries)) {
      if (entryConfig.pruneMaxDays === null || entryConfig.pruneMaxDays <= 0) continue;
      if (entryConfig.backup !== 's3') continue;

      const fullDir = path.join(CONFIG.localRoot, entryPath);
      try {
        const stat = await fs.stat(fullDir);
        if (stat.isDirectory()) {
          await pruneDirectory(fullDir, entryPath, entryConfig.pruneMaxDays, s3Ops, stateCache, runLog);
        } else if (stat.isFile()) {
          await pruneFile(fullDir, entryPath, entryConfig.pruneMaxDays, s3Ops, stateCache, runLog);
        }
      } catch {
        // Path doesn't exist or inaccessible — skip
      }
    }
  }

  // Phase 4: Finalize
  // Write state cache
  try {
    await fs.writeFile(CONFIG.stateCachePath, JSON.stringify(stateCache, null, 2));
  } catch (err: any) {
    runLog.warnings.push(`Failed to write state cache: ${err.message}`);
  }

  // Write run log
  try {
    await fs.mkdir(CONFIG.logDir, { recursive: true });
    const now = new Date();
    const logFilename = `s3-sync-${now.toISOString().substring(0, 16).replace(/[-:T]/g, (m) => m === 'T' ? '-' : m === ':' ? '' : m)}.jsonl`;
    runLog.duration_sec = Math.round((Date.now() - startTime) / 1000);
    if (runLog.errors.length > 0) {
      runLog.status = 'failure';
    }
    await fs.appendFile(path.join(CONFIG.logDir, logFilename), JSON.stringify(runLog) + '\n');
  } catch (err: any) {
    // Last resort — print to stderr
    process.stderr.write(`Failed to write run log: ${err.message}\n`);
  }

  runLog.duration_sec = Math.round((Date.now() - startTime) / 1000);
  return runLog;
}

// ---------------------------------------------------------------------------
// Pruning helpers
// ---------------------------------------------------------------------------

async function pruneDirectory(
  dirPath: string,
  registryPath: string,
  maxDays: number,
  s3Ops: S3Ops,
  stateCache: StateCache,
  runLog: RunLog,
): Promise<void> {
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(registryPath, entry.name);
    await pruneFile(fullPath, relativePath, maxDays, s3Ops, stateCache, runLog, cutoff);
  }
}

async function pruneFile(
  fullPath: string,
  relativePath: string,
  maxDays: number,
  s3Ops: S3Ops,
  stateCache: StateCache,
  runLog: RunLog,
  cutoff?: number,
): Promise<void> {
  cutoff = cutoff ?? Date.now() - maxDays * 24 * 60 * 60 * 1000;
  try {
    const stat = await fs.stat(fullPath);
    if (stat.mtimeMs >= cutoff) return; // Not old enough

    // Verify file exists in S3 with matching checksum before pruning
    const s3Key = CONFIG.s3Prefix + relativePath;
    const localHash = await computeSHA256(fullPath);
    const head = await s3Ops.headObject(s3Key);

    if (head.exists && head.checksumSHA256 === localHash) {
      await fs.unlink(fullPath);
      delete stateCache[relativePath];
      runLog.metrics.files_pruned++;
    }
  } catch {
    // Skip files that can't be pruned
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const client = new S3Client({
    region: CONFIG.region,
    ...(CONFIG.profile !== 'AWS_PROFILE' ? { profile: CONFIG.profile } : {}),
  });

  const s3Ops = createS3Ops(client, CONFIG.bucket);
  const result = await runSync(s3Ops);

  // Print summary to stdout
  const summary = [
    `[s3-sync] ${result.timestamp} — ${result.status}`,
    `  scanned=${result.metrics.files_scanned}`,
    `  uploaded=${result.metrics.files_uploaded}`,
    `  skipped=${result.metrics.files_skipped} (cache=${result.metrics.files_skipped_cache})`,
    `  pruned=${result.metrics.files_pruned}`,
    `  deleted=${result.metrics.delete_markers_placed}`,
    `  errors=${result.errors.length}`,
    `  duration=${result.duration_sec}s`,
  ];
  if (result.deletions_skipped_reason) {
    summary.push(`  deletions_skipped: ${result.deletions_skipped_reason}`);
  }
  console.log(summary.join('\n'));

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

// Only run main when executed directly (not imported for testing)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('s3-sync.ts') ||
  process.argv[1].endsWith('s3-sync.js')
);
if (isDirectRun) {
  main().catch((err) => {
    console.error('[s3-sync] Fatal error:', err);
    process.exit(1);
  });
}
