import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  resolveBackupStrategy,
  computeSHA256,
  scanLocalFiles,
  runSync,
  CONFIG,
  type S3Ops,
} from '../s3-sync.js';

// ---------------------------------------------------------------------------
// resolveBackupStrategy tests
// ---------------------------------------------------------------------------

describe('resolveBackupStrategy', () => {
  const entries = {
    'credentials': { backup: 's3' as const, pruneMaxDays: null },
    'workspace': { backup: 'github' as const, pruneMaxDays: null },
    'workspace/MEMORY.md': { backup: 's3' as const, pruneMaxDays: null },
    'workspace/repos': { backup: 'ignored' as const, pruneMaxDays: null },
    'browser': { backup: 'ignored' as const, pruneMaxDays: null },
    'cron/runs': { backup: 's3' as const, pruneMaxDays: 7 },
  };

  it('exact match returns non-inherited', () => {
    const result = resolveBackupStrategy('credentials', entries);
    assert.equal(result.entry.backup, 's3');
    assert.equal(result.inherited, false);
    assert.equal(result.parentPath, null);
  });

  it('child inherits from parent directory', () => {
    const result = resolveBackupStrategy('credentials/aws.json', entries);
    assert.equal(result.entry.backup, 's3');
    assert.equal(result.inherited, true);
    assert.equal(result.parentPath, 'credentials');
  });

  it('deeply nested path inherits from ancestor', () => {
    const result = resolveBackupStrategy('credentials/nested/deep/file.json', entries);
    assert.equal(result.entry.backup, 's3');
    assert.equal(result.inherited, true);
    assert.equal(result.parentPath, 'credentials');
  });

  it('workspace files inherit github from workspace', () => {
    const result = resolveBackupStrategy('workspace/AGENTS.md', entries);
    assert.equal(result.entry.backup, 'github');
    assert.equal(result.inherited, true);
    assert.equal(result.parentPath, 'workspace');
  });

  it('workspace/MEMORY.md has exact match overriding parent', () => {
    const result = resolveBackupStrategy('workspace/MEMORY.md', entries);
    assert.equal(result.entry.backup, 's3');
    assert.equal(result.inherited, false);
  });

  it('ignored parent makes children ignored', () => {
    const result = resolveBackupStrategy('workspace/repos/openclaw/README.md', entries);
    assert.equal(result.entry.backup, 'ignored');
    assert.equal(result.inherited, true);
    assert.equal(result.parentPath, 'workspace/repos');
  });

  it('browser subtree inherits ignored', () => {
    const result = resolveBackupStrategy('browser/openclaw/user-data/Default/cookies', entries);
    assert.equal(result.entry.backup, 'ignored');
    assert.equal(result.inherited, true);
  });

  it('unknown root-level path defaults to s3', () => {
    const result = resolveBackupStrategy('unknown-file.json', entries);
    assert.equal(result.entry.backup, 's3');
    assert.equal(result.inherited, true);
    assert.equal(result.parentPath, null);
  });

  it('root default has no pruning', () => {
    const result = resolveBackupStrategy('totally-new-dir/file.txt', entries);
    assert.equal(result.entry.pruneMaxDays, null);
  });

  it('exact match on nested entry', () => {
    const result = resolveBackupStrategy('cron/runs', entries);
    assert.equal(result.entry.backup, 's3');
    assert.equal(result.entry.pruneMaxDays, 7);
    assert.equal(result.inherited, false);
  });

  it('file inside cron/runs inherits from cron/runs', () => {
    const result = resolveBackupStrategy('cron/runs/abc.jsonl', entries);
    assert.equal(result.entry.backup, 's3');
    assert.equal(result.entry.pruneMaxDays, 7);
    assert.equal(result.inherited, true);
    assert.equal(result.parentPath, 'cron/runs');
  });
});

// ---------------------------------------------------------------------------
// computeSHA256 tests
// ---------------------------------------------------------------------------

describe('computeSHA256', () => {
  let tmpFile: string;

  beforeEach(async () => {
    tmpFile = path.join(os.tmpdir(), `test-sha256-${Date.now()}.txt`);
    await fs.writeFile(tmpFile, 'hello world\n');
  });

  afterEach(async () => {
    try { await fs.unlink(tmpFile); } catch {}
  });

  it('returns base64-encoded SHA-256', async () => {
    const hash = await computeSHA256(tmpFile);
    // SHA-256 of "hello world\n" in base64
    assert.equal(hash, "qUiQTy8PR5uPgZdpSzAYSw0u0cHNKh7A+4XSmaGSpEc=");
    assert.match(hash, /^[A-Za-z0-9+/]+=*$/);
  });

  it('produces consistent hashes', async () => {
    const hash1 = await computeSHA256(tmpFile);
    const hash2 = await computeSHA256(tmpFile);
    assert.equal(hash1, hash2);
  });

  it('different content produces different hash', async () => {
    const tmpFile2 = path.join(os.tmpdir(), `test-sha256-2-${Date.now()}.txt`);
    await fs.writeFile(tmpFile2, 'different content\n');
    const hash1 = await computeSHA256(tmpFile);
    const hash2 = await computeSHA256(tmpFile2);
    assert.notEqual(hash1, hash2);
    await fs.unlink(tmpFile2);
  });
});

// ---------------------------------------------------------------------------
// scanLocalFiles tests
// ---------------------------------------------------------------------------

describe('scanLocalFiles', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scan-test-'));
    // Create test structure
    await fs.mkdir(path.join(tmpDir, 'credentials'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'credentials', 'aws.json'), '{}');
    await fs.mkdir(path.join(tmpDir, 'workspace', 'scripts'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'workspace', 'scripts', 'test.sh'), '#!/bin/bash');
    await fs.writeFile(path.join(tmpDir, 'openclaw.json'), '{}');
    // Create excluded dirs
    await fs.mkdir(path.join(tmpDir, '.git'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, '.git', 'HEAD'), 'ref: refs/heads/main');
    await fs.mkdir(path.join(tmpDir, 'workspace', 'node_modules', 'pkg'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'workspace', 'node_modules', 'pkg', 'index.js'), '');
    // Symlink
    await fs.symlink('/tmp/target', path.join(tmpDir, 'mylink'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('discovers regular files', async () => {
    const entries = {
      'credentials': { backup: 's3' as const, pruneMaxDays: null },
      'workspace': { backup: 'github' as const, pruneMaxDays: null },
    };
    const { files, readErrors } = await scanLocalFiles(tmpDir, entries);
    assert.ok(files.has('credentials/aws.json'));
    assert.ok(files.has('openclaw.json'));
    assert.equal(readErrors.length, 0);
  });

  it('excludes .git directories', async () => {
    const { files } = await scanLocalFiles(tmpDir, {});
    const gitFiles = Array.from(files.keys()).filter(k => k.startsWith('.git/'));
    assert.equal(gitFiles.length, 0);
  });

  it('excludes node_modules', async () => {
    const { files } = await scanLocalFiles(tmpDir, {});
    const nmFiles = Array.from(files.keys()).filter(k => k.includes('node_modules'));
    assert.equal(nmFiles.length, 0);
  });

  it('skips ignored subtrees', async () => {
    const entries = {
      'workspace': { backup: 'ignored' as const, pruneMaxDays: null },
    };
    const { files } = await scanLocalFiles(tmpDir, entries);
    const wsFiles = Array.from(files.keys()).filter(k => k.startsWith('workspace/'));
    assert.equal(wsFiles.length, 0);
  });

  it('detects symlinks', async () => {
    const { files } = await scanLocalFiles(tmpDir, {});
    assert.ok(files.has('mylink'));
    const entry = files.get('mylink');
    assert.ok(entry?.isSymlink);
    assert.equal(entry?.symlinkTarget, '/tmp/target');
  });
});

// ---------------------------------------------------------------------------
// Mock S3Ops
// ---------------------------------------------------------------------------

function createMockS3Ops(): S3Ops & {
  uploads: Map<string, { body: any; metadata?: Record<string, string> }>;
  deletions: string[];
  objects: Map<string, { checksumSHA256?: string; metadata?: Record<string, string> }>;
} {
  const uploads = new Map<string, { body: any; metadata?: Record<string, string> }>();
  const deletions: string[] = [];
  const objects = new Map<string, { checksumSHA256?: string; metadata?: Record<string, string> }>();

  return {
    uploads,
    deletions,
    objects,

    async headObject(key: string) {
      const obj = objects.get(key);
      if (!obj) return { exists: false };
      return { checksumSHA256: obj.checksumSHA256, exists: true };
    },

    async putObject(key: string, body: any, metadata?: Record<string, string>) {
      uploads.set(key, { body, metadata });
      // Also add to objects so subsequent heads see it
      objects.set(key, { checksumSHA256: undefined, metadata });
    },

    async deleteObject(key: string) {
      deletions.push(key);
      objects.delete(key);
    },

    async listObjects(prefix: string): Promise<string[]> {
      return Array.from(objects.keys()).filter(k => k.startsWith(prefix));
    },
  };
}

// ---------------------------------------------------------------------------
// runSync integration tests (with mock S3)
// ---------------------------------------------------------------------------

describe('runSync', () => {
  let tmpDir: string;
  let origConfig: typeof CONFIG;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-test-'));

    // Save and override config
    origConfig = { ...CONFIG };
    Object.assign(CONFIG, {
      localRoot: tmpDir,
      registryPath: path.join(tmpDir, 'backup-registry.json'),
      stateCachePath: path.join(tmpDir, 'backup-sync-state.json'),
      logDir: path.join(tmpDir, '_logs', 'backup'),
      escalationDir: path.join(tmpDir, '_logs', 'escalations'),
    });

    // Create a minimal registry
    const registry = {
      $schema: 'backup-registry',
      version: 1,
      updated: new Date().toISOString(),
      entries: {
        'backup-registry.json': { backup: 's3', pruneMaxDays: null },
        'credentials': { backup: 's3', pruneMaxDays: null },
        'workspace': { backup: 'github', pruneMaxDays: null },
        'ignored-dir': { backup: 'ignored', pruneMaxDays: null },
      },
    };
    await fs.writeFile(path.join(tmpDir, 'backup-registry.json'), JSON.stringify(registry));

    // Create test files
    await fs.mkdir(path.join(tmpDir, 'credentials'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'credentials', 'aws.json'), '{"key":"secret"}');
    await fs.mkdir(path.join(tmpDir, 'workspace'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'workspace', 'README.md'), '# Hello');
    await fs.mkdir(path.join(tmpDir, 'ignored-dir'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'ignored-dir', 'temp.txt'), 'ephemeral');
  });

  afterEach(async () => {
    Object.assign(CONFIG, origConfig);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('uploads s3 files and skips github/ignored files', async () => {
    const mockS3 = createMockS3Ops();
    const result = await runSync(mockS3);

    assert.equal(result.status, 'success');
    assert.ok(result.metrics.files_uploaded > 0);

    // credentials/aws.json should be uploaded
    assert.ok(mockS3.uploads.has('.openclaw/credentials/aws.json'));
    // backup-registry.json should be uploaded
    assert.ok(mockS3.uploads.has('.openclaw/backup-registry.json'));
    // workspace/README.md should NOT be uploaded (github)
    assert.ok(!mockS3.uploads.has('.openclaw/workspace/README.md'));
    // ignored-dir/temp.txt should NOT be uploaded
    assert.ok(!mockS3.uploads.has('.openclaw/ignored-dir/temp.txt'));
  });

  it('skips files matching state cache', async () => {
    // First run: upload everything
    const mockS3 = createMockS3Ops();
    const result1 = await runSync(mockS3);
    assert.ok(result1.metrics.files_uploaded > 0);

    // Second run: state cache should cause skips
    const mockS3_2 = createMockS3Ops();
    const result2 = await runSync(mockS3_2);
    assert.ok(result2.metrics.files_skipped_cache > 0);
  });

  it('skips upload when S3 hash matches', async () => {
    const mockS3 = createMockS3Ops();

    // Pre-populate S3 with correct hash for credentials/aws.json
    const localHash = await computeSHA256(path.join(tmpDir, 'credentials', 'aws.json'));
    mockS3.objects.set('.openclaw/credentials/aws.json', { checksumSHA256: localHash });

    const result = await runSync(mockS3);

    // Should not re-upload credentials/aws.json
    assert.ok(!mockS3.uploads.has('.openclaw/credentials/aws.json'));
  });

  it('re-uploads when S3 has no checksum', async () => {
    const mockS3 = createMockS3Ops();
    // Object exists but without checksum
    mockS3.objects.set('.openclaw/credentials/aws.json', { checksumSHA256: undefined });

    const result = await runSync(mockS3);
    assert.ok(mockS3.uploads.has('.openclaw/credentials/aws.json'));
  });

  it('generates escalation for unknown paths', async () => {
    // Add a file with no registry entry
    await fs.writeFile(path.join(tmpDir, 'mystery-file.json'), '{}');

    const mockS3 = createMockS3Ops();
    const result = await runSync(mockS3);

    assert.ok(result.metrics.escalations_written > 0);
    // The unknown file should still be uploaded (root default = s3)
    assert.ok(mockS3.uploads.has('.openclaw/mystery-file.json'));
  });

  it('skips Phase 2 deletions when Phase 1 has failures', async () => {
    const mockS3 = createMockS3Ops();
    // Add orphaned object to S3
    mockS3.objects.set('.openclaw/old-deleted-file.json', { checksumSHA256: 'abc' });

    // Make one upload fail
    const origPut = mockS3.putObject.bind(mockS3);
    let callCount = 0;
    mockS3.putObject = async (key, body, meta) => {
      callCount++;
      if (callCount === 1) throw new Error('Simulated S3 failure');
      return origPut(key, body, meta);
    };

    const result = await runSync(mockS3);

    assert.ok(result.errors.length > 0);
    assert.ok(result.deletions_skipped_reason?.includes('failure'));
    assert.equal(result.metrics.delete_markers_placed, 0);
  });

  it('places delete markers for orphaned S3 objects (bootstrap <100)', async () => {
    const mockS3 = createMockS3Ops();
    // Add orphaned object
    mockS3.objects.set('.openclaw/gone-file.txt', { checksumSHA256: 'xyz' });

    const result = await runSync(mockS3);

    assert.equal(result.status, 'success');
    assert.ok(mockS3.deletions.includes('.openclaw/gone-file.txt'));
    assert.ok(result.metrics.delete_markers_placed > 0);
  });

  it('writes run log file', async () => {
    const mockS3 = createMockS3Ops();
    await runSync(mockS3);

    const logFiles = await fs.readdir(path.join(tmpDir, '_logs', 'backup'));
    assert.ok(logFiles.length > 0);
    assert.ok(logFiles[0].startsWith('s3-sync-'));
    assert.ok(logFiles[0].endsWith('.jsonl'));
  });

  it('writes state cache after run', async () => {
    const mockS3 = createMockS3Ops();
    await runSync(mockS3);

    const cacheRaw = await fs.readFile(path.join(tmpDir, 'backup-sync-state.json'), 'utf-8');
    const cache = JSON.parse(cacheRaw);
    assert.ok(Object.keys(cache).length > 0);
  });

  it('handles missing registry gracefully', async () => {
    await fs.unlink(path.join(tmpDir, 'backup-registry.json'));
    const mockS3 = createMockS3Ops();
    const result = await runSync(mockS3);

    assert.equal(result.status, 'failure');
    assert.ok(result.errors.some(e => e.error === 'RegistryLoadError'));
  });
});

// ---------------------------------------------------------------------------
// Safety gate tests
// ---------------------------------------------------------------------------

describe('Phase 2 safety gates', () => {
  let tmpDir: string;
  let origConfig: typeof CONFIG;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'safety-test-'));
    origConfig = { ...CONFIG };
    Object.assign(CONFIG, {
      localRoot: tmpDir,
      registryPath: path.join(tmpDir, 'backup-registry.json'),
      stateCachePath: path.join(tmpDir, 'backup-sync-state.json'),
      logDir: path.join(tmpDir, '_logs', 'backup'),
      escalationDir: path.join(tmpDir, '_logs', 'escalations'),
    });

    const registry = {
      $schema: 'backup-registry',
      version: 1,
      updated: new Date().toISOString(),
      entries: {
        'backup-registry.json': { backup: 's3', pruneMaxDays: null },
        'data': { backup: 's3', pruneMaxDays: null },
      },
    };
    await fs.writeFile(path.join(tmpDir, 'backup-registry.json'), JSON.stringify(registry));
    await fs.mkdir(path.join(tmpDir, 'data'), { recursive: true });

    // Create enough local files
    for (let i = 0; i < 95; i++) {
      await fs.writeFile(path.join(tmpDir, 'data', `file-${i}.txt`), `content-${i}`);
    }
  });

  afterEach(async () => {
    Object.assign(CONFIG, origConfig);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('blocks deletions when >10% would be deleted (>=100 objects)', async () => {
    const mockS3 = createMockS3Ops();

    // Pre-populate S3 with 100+ objects, many orphaned
    for (let i = 0; i < 95; i++) {
      mockS3.objects.set(`.openclaw/data/file-${i}.txt`, { checksumSHA256: undefined });
    }
    // Add 20 orphaned objects (>10% of ~115 total)
    for (let i = 0; i < 20; i++) {
      mockS3.objects.set(`.openclaw/orphaned/file-${i}.txt`, { checksumSHA256: 'abc' });
    }

    const result = await runSync(mockS3);

    assert.ok(result.deletions_skipped_reason?.includes('Safety'));
    assert.equal(result.metrics.delete_markers_placed, 0);
  });

  it('blocks deletions when local count <90% of S3 count', async () => {
    const mockS3 = createMockS3Ops();

    // S3 has way more objects than local
    for (let i = 0; i < 200; i++) {
      mockS3.objects.set(`.openclaw/lots/file-${i}.txt`, { checksumSHA256: 'abc' });
    }

    const result = await runSync(mockS3);

    assert.ok(result.deletions_skipped_reason?.includes('Safety') ||
              result.deletions_skipped_reason?.includes('<90%'));
  });
});
