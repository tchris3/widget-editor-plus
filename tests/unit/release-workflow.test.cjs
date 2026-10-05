const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const workflow = fs.readFileSync('.github/workflows/release.yaml', 'utf8');
const publishingStep = workflow.split('      - name: Create or Update Release\n')[1];
const script = publishingStep.split('        run: |\n')[1]
    .split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');
const notes = '## Widget Editor+\n- Improve formatting.\n\n## General\n- Update tooling.\n';

function runPublisher(t, platform, existing, options = {}) {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-release-test-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    const env = {
        ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
        GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid',
        TAG_NAME: 'v1.2.3', REPO: 'example/widget-editor-plus', TOKEN: 'test-token',
        GH_TOKEN: 'test-token', SERVER_URL: platform === 'github' ? 'https://github.com' : 'https://git.example.invalid',
        GITEA_SERVER_URL: '', GITHUB_API_URL: 'https://api.github.com',
        EXISTING: String(existing), LOOKUP_STATUS: String(options.lookupStatus || 404),
        LOG_FILE: path.join(cwd, 'requests.jsonl'),
        PATH: `${cwd}:${path.dirname(process.execPath)}:${process.env.PATH}`
    };
    const git = (...args) => execFileSync('git', args, { cwd, env, stdio: 'pipe' });
    git('init');
    git('commit', '--allow-empty', '-m', 'Fixture');
    if (options.lightweight) git('tag', env.TAG_NAME);
    else {
        fs.writeFileSync(path.join(cwd, 'notes'), notes);
        git('tag', '-a', '--cleanup=verbatim', '-F', 'notes', env.TAG_NAME);
    }
    fs.mkdirSync(path.join(cwd, 'target'));
    fs.writeFileSync(path.join(cwd, 'target', 'application.zip'), 'zip');
    fs.writeFileSync(path.join(cwd, 'target', 'update-set.xml'), 'xml');
    fs.writeFileSync(path.join(cwd, 'gh'), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const i = args.indexOf('--notes-file');
fs.appendFileSync(process.env.LOG_FILE, JSON.stringify({ args, notes: i < 0 ? null : fs.readFileSync(args[i + 1], 'utf8') }) + '\\n');
if (args.includes('--notes-from-tag')) process.exit(2);
if (args[1] === 'view' && process.env.EXISTING !== 'true') process.exit(1);
`, { mode: 0o755 });
    const preload = path.join(cwd, 'fetch.cjs');
    fs.writeFileSync(preload, `
const fs = require('node:fs');
global.fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    fs.appendFileSync(process.env.LOG_FILE, JSON.stringify({ url, method, body: typeof options.body === 'string' ? JSON.parse(options.body) : null }) + '\\n');
    if (url.includes('/releases/tags/')) return process.env.EXISTING === 'true'
        ? Response.json({ id: 7 }) : new Response('', { status: Number(process.env.LOOKUP_STATUS) });
    if (method === 'POST' && url.endsWith('/releases')) return Response.json({ id: 7 });
    if (method === 'GET' && url.endsWith('/assets')) return Response.json([]);
    return Response.json({});
};
`);
    env.NODE_OPTIONS = `--require=${preload}`;
    const result = spawnSync('sh', ['-c', script], { cwd, env, encoding: 'utf8' });
    const requests = fs.existsSync(env.LOG_FILE)
        ? fs.readFileSync(env.LOG_FILE, 'utf8').trim().split('\n').map(JSON.parse) : [];
    return { result, requests };
}

for (const existing of [false, true]) {
    test(`GitHub release ${existing ? 'update' : 'creation'} uses exact tag notes and explicit repository`, t => {
        const { result, requests } = runPublisher(t, 'github', existing);
        assert.equal(result.status, 0, result.stderr);
        for (const request of requests) {
            assert.ok(request.args.includes('--repo'));
            assert.ok(request.args.includes('example/widget-editor-plus'));
        }
        const publishing = requests.find(r => r.args[1] === (existing ? 'edit' : 'create'));
        assert.equal(publishing.notes, notes);
        if (existing) assert.ok(requests.some(r => r.args[1] === 'upload' && r.args.includes('--clobber')));
        else assert.ok(publishing.args.includes('--verify-tag'));
    });
    test(`Gitea release ${existing ? 'update' : 'creation'} uses exact tag notes and uploads both assets`, t => {
        const { result, requests } = runPublisher(t, 'gitea', existing);
        assert.equal(result.status, 0, result.stderr);
        const publishing = requests.find(r => r.method === (existing ? 'PATCH' : 'POST') && r.body);
        assert.equal(publishing.body.body, notes);
        assert.equal(requests.filter(r => r.method === 'POST' && r.url.includes('/assets?')).length, 2);
    });
}

test('Publishing rejects lightweight tags before contacting a release service', t => {
    const { result, requests } = runPublisher(t, 'github', false, { lightweight: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /annotated tag/);
    assert.deepEqual(requests, []);
});

test('Gitea lookup errors do not create a replacement release', t => {
    const { result, requests } = runPublisher(t, 'gitea', false, { lookupStatus: 403 });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Failed to find release: 403/);
    assert.equal(requests.length, 1);
});
