/* S03-U490: 「ハーネスのブロックが落ちても PASS 総数でしか気づけない」という S03-U489 報告の説明を切り分ける。
   実測した結論（本テストが固定する根拠）:
     - ブロックが例外で落ちた場合、astra_harness は catch で process.exitCode=2 を立て、
       空の R でもう一度 2 を立てる。check.py は全テストを check=True で起動するので、
       これは CalledProcessError になりゲートが落ちる。**終了コードで検知できる**＝ハーネスの欠陥ではない。
       S03-U489 で取りこぼしたのは、開発中にテストを直接起動して PASS / FAIL 行だけを読み、
       終了コード（パイプに通すと grep 側の値になる）を見なかったという**実行・集計方法の問題**だった。
     - 終了コードに出ないのは「例外を出さずに ok() の呼び出し数だけ減る」場合（条件分岐で素通りする等）で、
       PASS が減るだけで終了コードは 0、FAIL も出ない。この class だけは PASS ラベルの消失でしか分からない。
   そこで入れた実装:
     - astra_harness の opt-in な判定数宣言 harness(body,{expect:N})（成功時は PASS 行を増やさない）
     - tools/gate_verify.py — ゲートログの GATE_EXIT・FAIL・Traceback・最終行・PASS 総数と、
       前回ログに対する PASS ラベルの増減を機械的に検査する（消失は明示の許可が必要）
   このテストはカードを触らないので tools/script_coverage.py の NON_CARD_TEST_FILES に入れている。 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const R = [];
/* detail は gate_verify.py の出力や node の stack をそのまま載せることがある。
   (1) 改行をそのまま出すと、ゲートログに「FAIL lines  0」「PASS total  3」のような行が現れて集計を壊す
   (2) ゲートの検査語（Traceback / ReferenceError / SyntaxError / TypeError）がそのまま載ると、
       この試験の PASS 行のせいでゲートログの検査語が 0 件にならなくなる（実際に 1 度そうなった）
   どちらも 1 行化と日本語への置換で避ける。判定文の側にも検査語は書かない。 */
const GATE_WORDS = [[/Traceback/g, 'トレースバック'], [/ReferenceError/g, '参照エラー'],
  [/SyntaxError/g, '構文エラー'], [/TypeError/g, '型エラー']];
const flat = d => GATE_WORDS.reduce((s, [re, jp]) => s.replace(re, jp),
  String(d == null ? '' : d).replace(/\s+/g, ' ').trim()).slice(0, 200);
const ok = (n, v, d = '') => R.push({ name: n, ok: !!v, detail: flat(d) });

const ROOT = path.resolve(__dirname, '..');
const HARNESS = path.join(__dirname, 'astra_harness.js');
const GATE_VERIFY = path.join(__dirname, 'gate_verify.py');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's03u490-'));

function fixture(name, src, enc) {
  const p = path.join(TMP, name);
  if (enc) fs.writeFileSync(p, Buffer.from(src, enc));
  else fs.writeFileSync(p, src, 'utf8');
  return p;
}
function runNode(file) {
  return spawnSync(process.execPath, [file], { encoding: 'utf8' });
}
function countLines(out, prefix) {
  return String(out || '').split(/\r?\n/).filter(l => l.startsWith(prefix)).length;
}
function pythonCmd() {
  for (const c of ['python', 'python3', 'py']) {
    const r = spawnSync(c, ['-c', 'print(1)'], { encoding: 'utf8' });
    if (r.status === 0) return c;
  }
  return null;
}
const PY = pythonCmd();
const REQ = 'const harness=require(' + JSON.stringify(HARNESS) + ');\n';

/* ===== A. 例外で落ちたブロックは終了コードで検知できる（ハーネス自体の欠陥ではない） ===== */

/* S03-U489 のテストが落ちたのと同じ形: ブロック内の const が runtime のグローバル undo と衝突し、
   そのブロックだけがコンパイル時の SyntaxError で丸ごと落ちる。 */
const CRASH = fixture('crash.js', REQ +
  "harness(\"ok('A1 ok',true); ok('A2 ok',true);\");\n" +
  "harness(\"const undo = 1; ok('B1 never runs',true);\");\n" +
  "harness(\"ok('C1 ok',true);\");\n");
const crash = runNode(CRASH);

ok('A 前提: 落ちたブロックは標準出力では見分けがつかない（PASS が 3 件に減り、FAIL は 1 件も出ない）',
  countLines(crash.stdout, 'PASS ') === 3 && countLines(crash.stdout, 'FAIL') === 0,
  JSON.stringify({ pass: countLines(crash.stdout, 'PASS '), fail: countLines(crash.stdout, 'FAIL') }));
ok('A: 落ちた理由は標準エラーに出る（構文エラーと衝突した識別子）',
  /SyntaxError/.test(crash.stderr || '') && /undo/.test(crash.stderr || ''),
  String(crash.stderr || '').split(/\r?\n/).slice(0, 4).join(' | ').slice(0, 200));
ok('A ★ それでも終了コードは 2 になる（astra_harness は例外を終了コードに変換している）',
  crash.status === 2, String(crash.status));

if (PY) {
  /* check.py と同じ起動のしかた（subprocess.run(..., check=True)）を再現する */
  const RUNNER = fixture('runner.py',
    'import subprocess, sys\n'
    + 'try:\n'
    + '    subprocess.run([sys.argv[1], sys.argv[2]], check=True,\n'
    + '                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)\n'
    + '    print("NO_EXCEPTION")\n'
    + 'except subprocess.CalledProcessError as e:\n'
    + '    print("CalledProcessError %d" % e.returncode)\n');
  const viaPy = spawnSync(PY, [RUNNER, process.execPath, CRASH], { encoding: 'utf8' });
  ok('A ★ check.py と同じ check=True の起動では CalledProcessError 2 になる（＝ゲートが落ちる）',
    /CalledProcessError 2/.test(viaPy.stdout || ''), String(viaPy.stdout || viaPy.stderr || '').trim().slice(0, 160));
} else {
  ok('A: python が見つからないので check=True の再現は省略（他の判定で代替）', false, 'python not found');
}

const harnessSrc = fs.readFileSync(HARNESS, 'utf8');
ok('A: astra_harness は VM の例外を catch して process.exitCode=2 を立て、空の R でも 2 を立てる',
  /catch\(e\)\{console\.error\(e\.stack\|\|e\);process\.exitCode=2;\}/.test(harnessSrc)
  && /if\(!R\.length\|\|R\.some\(r=>!r\.ok\)\)process\.exitCode=2;/.test(harnessSrc), '');

const checkSrc = fs.readFileSync(path.join(__dirname, 'check.py'), 'utf8');
const runLines = checkSrc.split(/\r?\n/).filter(l => l.includes('subprocess.run('));
const lax = runLines.filter(l => !l.includes('check=True'));
ok('A: check.py の subprocess.run は全件 check=True で起動している（' + runLines.length + ' 件）',
  runLines.length > 500 && lax.length === 0, JSON.stringify(lax.slice(0, 3)));

/* ===== B. 終了コードに出ないのは「例外を出さずに判定数だけ減る」class ===== */

const SKIP_BODY = "ok('A1 ok',true); const cond=false; if(cond){ ok('A2 skipped',true); } ok('A3 ok',true);";
const SKIP = fixture('skip.js', REQ + 'harness(' + JSON.stringify(SKIP_BODY) + ');\n');
const skip = runNode(SKIP);
ok('B ★ 例外を出さずに ok() が減る場合は、終了コード 0・FAIL 0・PASS が減るだけになる（これが本当の盲点）',
  skip.status === 0 && countLines(skip.stdout, 'PASS ') === 2 && countLines(skip.stdout, 'FAIL') === 0,
  JSON.stringify({ status: skip.status, pass: countLines(skip.stdout, 'PASS '), fail: countLines(skip.stdout, 'FAIL') }));

const SKIP_EXPECT = fixture('skip_expect.js', REQ + 'harness(' + JSON.stringify(SKIP_BODY) + ',{expect:3});\n');
const skipExpect = runNode(SKIP_EXPECT);
ok('B ★ 判定数を宣言すると（{expect:3}）同じ素通りが終了コード 2 になる',
  skipExpect.status === 2, String(skipExpect.status));
ok('B ★ そのとき FAIL 行も出るのでゲートログからも読める',
  /^FAIL astra_harness expected assertions/m.test(skipExpect.stdout || ''),
  String(skipExpect.stdout || '').split(/\r?\n/).filter(l => l.startsWith('FAIL')).join(' | ').slice(0, 160));

const SKIP_HONEST = fixture('skip_honest.js', REQ + 'harness(' + JSON.stringify(SKIP_BODY) + ',{expect:2});\n');
const skipHonest = runNode(SKIP_HONEST);
ok('B negative control: 宣言した数と一致していれば何も起きない（誤検知しない）',
  skipHonest.status === 0 && countLines(skipHonest.stdout, 'FAIL') === 0,
  JSON.stringify({ status: skipHonest.status, fail: countLines(skipHonest.stdout, 'FAIL') }));
ok('B: 宣言が一致した場合に PASS 行は増えない（既存の PASS 総数の基準を動かさない）',
  countLines(skipHonest.stdout, 'PASS ') === countLines(skip.stdout, 'PASS '),
  JSON.stringify({ withExpect: countLines(skipHonest.stdout, 'PASS '), without: countLines(skip.stdout, 'PASS ') }));

/* ===== C. tools/gate_verify.py — 集計を機械的にする ===== */

const LAST = 'PASS no duplicate top-level function declarations';
function gateLog(name, body, enc) {
  return fixture(name, body.join('\n') + '\n', enc);
}
function gv(args) {
  return spawnSync(PY, [GATE_VERIFY].concat(args), { encoding: 'utf8' });
}

if (PY) {
  const GOOD = gateLog('gate_good.log', ['PASS alpha', 'PASS beta :: detail 12', LAST, 'GATE_EXIT=0']);
  ok('C: 正常なゲートログは通る', gv([GOOD]).status === 0, String(gv([GOOD]).stdout || '').slice(-160));

  const BAD_EXIT = gateLog('gate_exit1.log', ['PASS alpha', LAST, 'GATE_EXIT=1']);
  ok('C: GATE_EXIT が 0 でなければ落ちる', gv([BAD_EXIT]).status === 1, '');

  const WITH_FAIL = gateLog('gate_fail.log', ['PASS alpha', 'FAIL something broke', LAST, 'GATE_EXIT=0']);
  ok('C: FAIL 行があれば落ちる', gv([WITH_FAIL]).status === 1, '');

  const WITH_TB = gateLog('gate_tb.log', ['PASS alpha', 'Traceback (most recent call last)', LAST, 'GATE_EXIT=0']);
  ok('C: Python のトレースバックがあれば落ちる', gv([WITH_TB]).status === 1, '');

  const NO_LAST = gateLog('gate_nolast.log', ['PASS alpha', 'PASS something else', 'GATE_EXIT=0']);
  ok('C: 最終行が所定の PASS 行でなければ落ちる（途中で止まったログを通さない）',
    gv([NO_LAST]).status === 1, '');

  const NO_EXIT = gateLog('gate_noexit.log', ['PASS alpha', LAST]);
  ok('C: GATE_EXIT 行が無ければ落ちる（末尾 echo を忘れたログを通さない）',
    gv([NO_EXIT]).status === 1, '');

  /* 「ブロックが素通りして PASS が消える」を、前回ログとの比較で捕まえる */
  const PREV = gateLog('gate_prev.log', ['PASS alpha', 'PASS gone-label', 'PASS beta :: detail 1', LAST, 'GATE_EXIT=0']);
  const CUR = gateLog('gate_cur.log', ['PASS alpha', 'PASS beta :: detail 9', 'PASS added-label', LAST, 'GATE_EXIT=0']);
  const removed = gv([CUR, '--prev', PREV]);
  ok('C ★ 前回あった PASS ラベルが消えていれば落ち、消えたラベルを名指しする',
    removed.status === 1 && /gone-label/.test(removed.stdout || '')
    && /disappeared/.test(removed.stdout || ''),
    String(removed.stdout || '').split(/\r?\n/).filter(l => l.indexOf('NG') >= 0).join(' | ').slice(0, 200));
  ok('C: 明示的に許可した消失（--allow-removed 1）は通る',
    gv([CUR, '--prev', PREV, '--allow-removed', '1']).status === 0, '');
  ok('C: 詳細（:: 以降）と数字の違いだけでは別ラベルと見なさない（beta は増減に出ない）',
    !/beta/.test(removed.stdout || ''), '');
  const wrongNew = gv([CUR, '--prev', PREV, '--allow-removed', '1', '--expect-new', '3']);
  ok('C: 宣言した純増と合わなければ落ちる', wrongNew.status === 1 && /net new PASS/.test(wrongNew.stdout || ''), '');
  ok('C: 宣言した純増（+1 - 1 = 0）と合えば通る',
    gv([CUR, '--prev', PREV, '--allow-removed', '1', '--expect-new', '0']).status === 0, '');

  /* Windows のリダイレクトで作られたゲートログは cp932 になる */
  const cp = fixture('gate_cp932_real.log', '', null);
  fs.writeFileSync(cp, Buffer.concat([
    require('buffer').Buffer.from([0x50, 0x41, 0x53, 0x53, 0x20]),
    Buffer.from([0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea]),  /* 「日本語」cp932 */
    Buffer.from('\n' + LAST + '\nGATE_EXIT=0\n', 'utf8'),
  ]));
  const cpRun = gv([cp]);
  ok('C: cp932 で書かれたゲートログも読める（UTF-8 として壊れていても落ちない）',
    cpRun.status === 0 && /PASS total           2/.test(cpRun.stdout || ''),
    String(cpRun.stdout || cpRun.stderr || '').slice(0, 160));
  ok('C 前提: 上の cp932 ログは実際に UTF-8 として不正である',
    (() => { try { new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(cp)); return false; } catch (e) { return true; } })(),
    '');
} else {
  ok('C: python が見つからないので gate_verify.py の検証は省略', false, 'python not found');
}

/* ===== D. astra_harness を使わず自前で VM を回すテストファイルの監査 =====
   tools/test*.js のうち 179 本は astra_harness ではなく自前の vm.runInNewContext を持つ。
   そのうち 27 本（test_auto_cycle13〜40）は catch が例外を握りつぶしており、
   **判定を何件か記録したあとで落ちると終了コード 0 のまま**になっていた。
   これは実行方法ではなくランナー自体の欠陥なので、本単位で 27 本すべてに process.exitCode=2 を入れた。 */

function balancedBody(s, open) {
  let d = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') d++;
    else if (s[i] === '}') { d--; if (d === 0) return { body: s.slice(open + 1, i), after: i + 1 }; }
  }
  return { body: '', after: s.length };
}
/* 「途中で落ちても非 0 で終わるか」を静的に判定する（classify: A=try で囲まない / B=非 0 を立てる / C=握りつぶす） */
function classifyRunner(src) {
  const i = src.indexOf('vm.runInNewContext');
  if (i < 0) return null;
  if (!/try\s*\{\s*$/.test(src.slice(Math.max(0, i - 60), i))) return 'A';
  const m = /\}\s*catch\s*\(\s*\w+\s*\)\s*/g;
  m.lastIndex = i;
  const mm = m.exec(src);
  if (!mm) return 'C';
  const open = src.indexOf('{', mm.index + mm[0].length);
  if (open < 0) return 'C';
  const { body, after } = balancedBody(src, open);
  const rest = src.slice(after);
  if (/process\.exit/.test(body)) return 'B';
  const flags = (body.match(/(\w+)\s*=\s*true/g) || []).concat(body.match(/(\w+)\+\+/g) || [])
    .map(x => x.replace(/\s*(=\s*true|\+\+)$/, ''));
  for (const fl of flags) {
    if (new RegExp(fl + '[^;]{0,80}process\\.exit').test(rest)) return 'B';
  }
  return 'C';
}

const SELF = path.basename(__filename);   /* 自分自身も文字列として vm.runInNewContext を含むので外す */
const ownRunners = fs.readdirSync(__dirname).filter(f => /^test.*\.js$/.test(f) && f !== SELF)
  .map(f => ({ f, src: fs.readFileSync(path.join(__dirname, f), 'utf8') }))
  .filter(x => x.src.includes('vm.runInNewContext'));
const swallowers = ownRunners.filter(x => classifyRunner(x.src) === 'C').map(x => x.f);
ok('D ★ 自前で VM を回す ' + ownRunners.length + ' 本すべてが、判定を記録したあとの例外でも非 0 で終わる',
  ownRunners.length > 150 && swallowers.length === 0, JSON.stringify(swallowers.slice(0, 8)));
ok('D: その内訳（A=try で囲まない / B=catch が非 0 を立てる）',
  ownRunners.filter(x => classifyRunner(x.src) === 'A').length
  + ownRunners.filter(x => classifyRunner(x.src) === 'B').length === ownRunners.length,
  JSON.stringify({
    A: ownRunners.filter(x => classifyRunner(x.src) === 'A').length,
    B: ownRunners.filter(x => classifyRunner(x.src) === 'B').length,
  }));

/* 実測でも確かめる: VM の実行直後に例外を注入して、終了コードが非 0 になること */
const CRASHER = fixture('crasher.js',
  "const vm=require('vm');const real=vm.runInNewContext;\n"
  + "vm.runInNewContext=function(){ real.apply(vm,arguments); throw new Error('S03-U490 injected'); };\n");
const injected = spawnSync(process.execPath, ['-r', CRASHER, path.join(__dirname, 'test_auto_cycle32.js')],
  { encoding: 'utf8' });
ok('D ★ 実測: 判定を記録したあとに例外を注入しても test_auto_cycle32 は非 0 で終わる（修正前は 0 だった）',
  injected.status !== 0 && countLines(injected.stdout, 'PASS ') > 40,
  JSON.stringify({ status: injected.status, pass: countLines(injected.stdout, 'PASS ') }));

/* test_auto_cycle32 は実際に落ちていた。黒蠍－逃げ足のチックの節が S03-U62 の
   requestChoice 移行前のまま yesno の候補を resolveTarget に渡していた。 */
const c32 = fs.readFileSync(path.join(__dirname, 'test_auto_cycle32.js'), 'utf8');
ok('D: test_auto_cycle32 は選択候補を resolveTarget に渡していない（これが落ちていた原因）',
  !/resolveTarget\s*\(\s*c\s*\)/.test(c32), '');
const c32run = spawnSync(process.execPath, [path.join(__dirname, 'test_auto_cycle32.js')], { encoding: 'utf8' });
ok('D ★ test_auto_cycle32 は例外を出さず完走する（45 件で止まっていたのが 59 件になった）',
  c32run.status === 0 && countLines(c32run.stdout, 'PASS ') >= 59
  && !/TypeError/.test(c32run.stderr || ''),
  JSON.stringify({ status: c32run.status, pass: countLines(c32run.stdout, 'PASS '), err: flat(c32run.stderr).slice(0, 80) }));

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* 一時ディレクトリの掃除は失敗しても判定に影響しない */ }

/* この試験自身がゲートの検査語をログに出さないこと。出すとゲートログの Traceback /
   ReferenceError / 構文エラー / 型エラーの件数が 0 にならず、検査が使えなくなる。 */
const ownOut = R.map(r => r.name + ' ' + r.detail).join(' ');
ok('この試験の出力はゲートの検査語を含まない（検査そのものを壊さない）',
  !/Traceback|ReferenceError|SyntaxError|TypeError/.test(ownOut),
  flat((ownOut.match(/Traceback|ReferenceError|SyntaxError|TypeError/g) || []).join(',')));

for (const r of R) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' :: ' + r.detail : ''));
if (!R.length || R.some(r => !r.ok)) process.exitCode = 2;
