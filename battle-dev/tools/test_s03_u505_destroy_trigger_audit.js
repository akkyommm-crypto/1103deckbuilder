/* S03-U505: 破壊・墓地送りが条件の誘発（設計書 5-a の項目 4）の候補を全件監査し、設計を確定する単位。
   **挙動は変えていない。**変えたのは文書とこのテストだけである。

   土台の当時裁定 `WIKI-378544C74049`（**回答日 2008-05-30**、《砂塵の大竜巻》）:
     Q「《砂塵の大竜巻》でセットする効果を使用した場合は、破壊の後に別の処理が入る扱いですか？」
     A「はい、そうです。つまり、**破壊が条件の任意効果はタイミングを逃すことになります。**(08/05/30)」

   S03-U491〜U496 の機構は召喚成功（`summonSuccess`）だけを対象にしている。破壊・墓地送りの誘発は
   (B-3) の種別に無いので、いまは**1 件も落としていない**。この単位では
     ・候補の全件（配線）
     ・当時テキストの句の読み方（**いまの正規表現では墓地送りの句が 1 つも読めない**という実測）
     ・当時裁定（回答日つきの per-card 確認が「逃す」側 12 枚・「逃さない」側 12 枚・調整中 1 枚）
   を数え、次の単位が入れる形を決めた。

   固定するもの:
     A 配線の全件（イベントごと／重複を除いた総数）
     B いまは 1 件も落とさない（種別に無い）
     C いまの句抽出は破壊の句を読めるが**墓地送りの句は 1 つも読めない**（次の単位で直す対象）
     D 試作の句抽出で数えた内訳（次の単位の作業量）
     E 当時裁定の記録（ID が文書にあること）
     F 文書 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S505 = pathA.resolve(__dirname, '..');
const rdS505 = p => fsA.readFileSync(pathA.join(ROOT_S505, p), 'utf8');
const SRC_S505 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS505('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS505('docs/S03_MISSED_TIMING_RULINGS.md'),
  'engine/1ZZX_missed_timing_s03.js': rdS505('engine/1ZZX_missed_timing_s03.js'),
  'tools/check.py': rdS505('tools/check.py')
};
/* 「逃す」と答えている当時裁定（回答日つき）。カード名は裁定が名指ししている対象。 */
const MISS_S505 = [
  ['歯車街', 'WIKI-1B4D52FCA757', '2010-08-11'],
  ['スネーク・ホイッスル', 'WIKI-9E5470176D20', '2009-08-07'],
  ['ユベル', 'WIKI-D0B6DDC9860F', '2008-11-21'],
  ['ボタニティ・ガール', 'WIKI-AA84FEB76F8A', '2008-08-14'],
  ['ブランチ', 'WIKI-8D38DC2D2D9F', '2009-11-10'],
  ['ブラック・ブルドラゴ', 'WIKI-EC02DEA5ED42', '2009-12-05'],
  ['森の番人グリーン・バブーン', 'WIKI-5BFCDCB36A18', '2009-02-18'],
  ['機皇城', 'WIKI-673C14301F42', '2010-08-20'],
  ['ヴァイロン・エレメント', 'WIKI-0E2C346E86CC', '2011-04-14'],
  ['鋼核合成獣研究所', 'WIKI-FE6C86B302EE', '2010-02-07'],
  ['虚無空間', 'WIKI-07B43F63245D', '2011-07-16'],
  ['セブン・ソード・ウォリアー', 'WIKI-EB4FE5D75FF1', '2010-08-04']
];
/* 「逃さない」と答えている当時裁定（回答日つき） */
const NEVER_S505 = [
  ['古代の機械究極巨人', 'WIKI-17DDC86F4023', '2009-05-14'],
  ['月影龍クイラ', 'WIKI-E8DB5B04F928', '2009-11-14'],
  ['ダーク・フラット・トップ', 'WIKI-601C8DEC7013', '2010-11-20'],
  ['ライトニング・トライコーン', 'WIKI-793B09C0443B', '2010-04-17'],
  ['極星宝ドラウプニル', 'WIKI-66C68A06A9A0', '2010-11-18'],
  ['死の花－ネクロ・フルール', 'WIKI-F71D6A911EDF', '2011-02-23'],
  ['聖騎士ジャンヌ', 'WIKI-995DBF985C71', '2010-09-18'],
  ['Sin トゥルース・ドラゴン', 'WIKI-2D99CB9405E7', '2010-04-23'],
  ['Z－ONE', 'WIKI-A25E392FB7EB', '2011-05-04'],
  ['ヴァイロン・マテリアル', 'WIKI-AB96A8BC877A', '2010-04-30'],
  ['エレキトンボ', 'WIKI-6890B8FD07E9', '2010-10-13'],
  ['幽獄の時計塔', 'WIKI-13E6A14CA0CC', '2009-01-08']
];
const UNRESOLVED_S505 = [['黒衣の大賢者', 'WIKI-F4CAC7074CA5', '2011-06-16']];

const COMMON = String.raw`
const EVS=['onDestroy','onSendToGrave','onLeaveField','onFieldToGraveBatchS03','onRemove'];
function byEvent(){
  const o={}; EVS.forEach(e=>o[e]=[]);
  Object.keys(CARD_SCRIPTS).forEach(n=>{
    const sc=CARD_SCRIPTS[n]; if(!sc||!sc.passive) return;
    EVS.forEach(e=>{ if(typeof sc.passive[e]==='function') o[e].push(n); });
  });
  return o;}
function allCands(){
  const o=byEvent(), out=[];
  EVS.forEach(e=>o[e].forEach(n=>{ if(out.indexOf(n)<0) out.push(n); }));
  return out;}
/* 試作の句抽出（**engine には入れない**。監査用。TERM が「られた」を食うので G の語は「墓地へ送」まで） */
const DWORDS_S505=[['戦闘で破壊','B'],['破壊','D'],['フィールドから墓地へ送','GF'],['墓地へ送','G'],['除外','X'],['リリース','T']];
const TERM_S505=/(?:に成功した|された|られた|した)(時|場合)/g;
function wordsBeforeS505(text,pos){
  const out=[]; let i=pos;
  for(;;){
    let hit=null;
    for(let k=0;k<DWORDS_S505.length;k++){
      const w=DWORDS_S505[k][0];
      if(i-w.length>=0 && text.substr(i-w.length,w.length)===w){ hit=DWORDS_S505[k]; break; }
    }
    if(!hit) break;
    out.push(hit[1]); i-=hit[0].length;
    if(i-1>=0 && text.charAt(i-1)==='・'){ i-=1; continue; }
    break;
  }
  return out;}
function dClausesS505(name){
  const i=findCardIndex(name); if(i==null||i<0) return [];
  const text=String((CARD_DB[i]||{}).e||'');
  const out=[]; let m; TERM_S505.lastIndex=0;
  while((m=TERM_S505.exec(text))){
    const cls=wordsBeforeS505(text,m.index);
    if(cls.length) out.push({cls,kind:m[1]});
  }
  return out;}
function kindOfS505(name,cl){
  let toki=0,baai=0;
  dClausesS505(name).forEach(c=>{ if(c.cls.indexOf(cl)<0) return; if(c.kind==='時') toki++; else baai++; });
  if(toki&&baai) return 'mixed';
  if(baai) return 'baai';
  return toki?'toki':null;}
`;

/* ===== A. 配線の全件 ===== */
harness(COMMON + String.raw`
/* S03-U508 で《歯車街》②を「破壊され墓地へ送られた時」の誘発に直し、passive.onSendToGrave を
   足したので、配線の全件が 1 枚増えた（onSendToGrave 180 → 181、重複を除いた候補 316 → 317）。
   数を数える形は変えていない。 */
const o=byEvent(), all=allCands();
/* S03-U512 で《霊子エネルギー固定装置》（「このカードがフィールド上から離れた時」）を実装したので、
   onLeaveField が 57 → 58、重複を除いた候補が 317 → 318 になった。数え方は変えていない。 */
/* S03-U545: Fleur adds one onSendToGrave card, one unique candidate, one parsed clause and one G-baai. Population filters/parsers remain unchanged; older document counts stay historical. */
ok('A1 ★ イベントごとの件数（onDestroy 111 / onSendToGrave 182 / onLeaveField 58 / onFieldToGraveBatchS03 8 / onRemove 10）'
   +'。onSendToGrave は S03-U508 で《歯車街》が加わって 180 → 181',
   o.onDestroy.length===111 && o.onSendToGrave.length===182 && o.onLeaveField.length===58
   && o.onFieldToGraveBatchS03.length===8 && o.onRemove.length===10,
   JSON.stringify(EVS.map(e=>e+':'+o[e].length)));
ok('A2 ★ 重複を除いた候補カードは 319 枚（S03-U508 で《歯車街》が加わって 316 → 317）',
   all.length===319, JSON.stringify({n:all.length}));
`, {expect:2});

/* ===== B. いまは 1 件も落とさない ===== */
harness(COMMON + String.raw`
/* missedTimingClassS03 は cand.name と cand.eventName（と evt.flipSummon）だけを読む純粋な関数なので、
   ここは作り物の候補で測ってよい（ctx を見る関数ではない。S03-U494 の教訓が当たるのは
   triggerCandidateForcedS03 のような ctx 依存の関数である）。 */
const all=allCands();
const cls=[];
all.forEach(n=>EVS.forEach(e=>{
  const v=missedTimingClassS03({name:n,eventName:e},{stepS03:0});
  if(v) cls.push(n+':'+e+':'+v);
}));
/* B1 は S03-U506 で書き直した。あの時点では種別が無く 1 件も付かなかった。S03-U506 で破壊の種別を
   入れたので、**onDestroy で拾われて句が「破壊された時」のカードだけ**に種別が付く。
   落ちるのはさらに (B-5) の許可リストに入った組だけである（いまは《スネーク・ホイッスル》1 件）。 */
ok('B1 ★ 種別が付くのは onDestroy かつ句が「破壊された時」の候補だけで、'
   +'墓地送り・場からの離脱・除外のイベントには 1 つも付かない',
   cls.length>0
   && cls.every(x=>x.split(':')[1]==='onDestroy' && x.split(':')[2]==='destroyed')
   && cls.every(x=>missedTimingClauseKindS03(x.split(':')[0],'D')==='toki'),
   JSON.stringify({n:cls.length,sample:cls.slice(0,6)}));
ok('B2 ★ 種別の表に破壊・墓地送りのイベントが無い',
   MISSED_TIMING_EVENT_CLASS_S03.onDestroy===undefined
   && MISSED_TIMING_EVENT_CLASS_S03.onSendToGrave===undefined
   && Object.keys(MISSED_TIMING_EVENT_CLASS_S03).join('/')==='onNormalSummon/onSpecialSummon',
   JSON.stringify(MISSED_TIMING_EVENT_CLASS_S03));
/* B3 も S03-U506 で書き直した（種別が 2 つ → 3 つになった）。 */
ok('B3 ★ 有効な種別は summonSuccess と destroyed（S03-U506）で、flipSummonReverse は S03-U494 で無効のまま',
   MISSED_TIMING_CLASSES_S03.summonSuccess===true
   && MISSED_TIMING_CLASSES_S03.destroyed===true
   && MISSED_TIMING_CLASSES_S03.flipSummonReverse===false
   && Object.keys(MISSED_TIMING_CLASSES_S03).length===3,
   JSON.stringify(MISSED_TIMING_CLASSES_S03));
`, {expect:3});

/* ===== C. いまの句抽出の限界（実測） ===== */
harness(COMMON + String.raw`
/* いまの正規表現は (?:に成功した|された|した)(時|場合) で、召喚語だけを前に読む。
   「破壊された時」は「された時」に当たるが前が「破壊」なので落ち、
   「墓地へ送られた時」は**正規表現そのものが当たらない**（「送られた」は「された」でも「した」でもない）。 */
const all=allCands();
const nowAny=all.filter(n=>missedTimingTextClausesS03(n).length>0);
/* C1 は S03-U506 で書き直した。あの時点では召喚語の句しか読めず 19 枚だった。
   S03-U506 で破壊・墓地送りの語と「られた」を足したので 255 枚で句が読める。
   読めることと落とすことは別で、落ちるのは (B-5) に入った組だけである。 */
ok('C1 ★ 句が読めるのは 319 枚中 257 枚になった（S03-U506 で語と「られた」を足した。'
   +'S03-U508 で《歯車街》が配線に加わって 255 → 256）',
   nowAny.length===257, JSON.stringify({n:nowAny.length}));
ok('C2 ★ いまの正規表現は「墓地へ送られた時」に当たらない（次の単位で足す対象）',
   /\(\?:に成功した\|された\|した\)\(時\|場合\)/.test(
     String(MISSED_TIMING_TERM_S03).replace(/^\//,'').replace(/\/g$/,'')) === false
   || String(MISSED_TIMING_TERM_S03).indexOf('られた')<0,
   String(MISSED_TIMING_TERM_S03));
/* C3 は S03-U506 で書き直した。S03-U505 の時点では G の句が 1 つも読めなかった。
   S03-U506 で語と「られた」を足したので**句は読める**ようになったが、**G を見るイベントがまだ無い**
   （種別の表は onDestroy→D だけ）。だから墓地送りの家族はいまも 1 件も落ちない。 */
ok('C3 ★ 墓地送りの句は読めるようになったが、G を見るイベントがまだ無いので 1 件も落ちない',
   (function(){
     const hasG=all.filter(n=>{const i=findCardIndex(n);
       return i>=0 && String((CARD_DB[i]||{}).e||'').indexOf('墓地へ送られた時')>=0;});
     globalThis.__HASG=hasG.length;
     const mapped=Object.keys(MISSED_TIMING_DESTROY_CLASS_S03)
       .map(e=>MISSED_TIMING_DESTROY_CLASS_S03[e]);
     return hasG.length>50
       && hasG.some(n=>missedTimingClauseKindS03(n,'G')==='toki')
       && mapped.indexOf('G')<0 && mapped.indexOf('GF')<0
       && hasG.every(n=>EVS.every(e=>
            missedTimingClassS03({name:n,eventName:e},{stepS03:0})==='destroyed'
              ? missedTimingClauseKindS03(n,'D')==='toki' : true));
   })(),
   JSON.stringify({hasG:globalThis.__HASG,
     mapped:MISSED_TIMING_DESTROY_CLASS_S03}));
`, {expect:3});

/* ===== D. 試作の句抽出で数えた内訳 ===== */
harness(COMMON + String.raw`
const all=allCands();
function tally(cl){
  const k={toki:0,baai:0,mixed:0,none:0};
  all.forEach(n=>{ const v=kindOfS505(n,cl); k[v||'none']++; });
  return k;}
const D=tally('D'), G=tally('G'), GF=tally('GF'), X=tally('X'), T=tally('T'), B=tally('B');
ok('D1 ★ 破壊（D）の内訳: 時 31 / 場合 24 / 混在 0',
   D.toki===31 && D.baai===24 && D.mixed===0, JSON.stringify(D));
/* S03-U508 で《歯車街》が配線に加わり、その句は「破壊され墓地へ送られた**時**」なので 時 が 1 増えた。 */
ok('D2 ★ 墓地へ送られた（G）の内訳: 時 113 / 場合 63 / 混在 1（時は S03-U508 の《歯車街》で 112 → 113）',
   G.toki===113 && G.baai===63 && G.mixed===1, JSON.stringify(G));
ok('D3 ★ その他の内訳（フィールドから墓地へ送 / 除外 / リリース / 戦闘で破壊）',
   GF.toki===5 && GF.baai===9 && X.toki===6 && X.baai===3 && T.toki===0 && T.baai===5
   && B.toki===1 && B.baai===2,
   JSON.stringify({GF,X,T,B}));
ok('D4 ★ 次の単位の作業量: 「時」と読める組は 156（D 31 + G 113 + GF 5 + X 6 + B 1）。'
   +'(B-5) の約束により、当時の根拠を確認できた組だけを落とす。G は S03-U508 の《歯車街》で 112 → 113',
   (D.toki+G.toki+GF.toki+X.toki+B.toki)===156,
   JSON.stringify({sum:D.toki+G.toki+GF.toki+X.toki+B.toki}));
`, {expect:4});

/* ===== E. 当時裁定の記録 ===== */
harness('const MISS=' + JSON.stringify(MISS_S505) + ';const NEVER=' + JSON.stringify(NEVER_S505) + ';'
      + 'const UNRES=' + JSON.stringify(UNRESOLVED_S505) + ';'
      + 'const RUL=' + JSON.stringify(SRC_S505['docs/S03_MISSED_TIMING_RULINGS.md']) + ';' + COMMON + String.raw`
ok('E1 ★ 「逃す」側の当時裁定 12 件（回答日つき）がすべて裁定記録にある',
   MISS.every(r=>RUL.indexOf(r[1])>=0 && RUL.indexOf(r[2])>=0),
   JSON.stringify(MISS.filter(r=>RUL.indexOf(r[1])<0).map(r=>r[1])));
ok('E2 ★ 「逃さない」側の当時裁定 12 件（回答日つき）がすべて裁定記録にある',
   NEVER.every(r=>RUL.indexOf(r[1])>=0 && RUL.indexOf(r[2])>=0),
   JSON.stringify(NEVER.filter(r=>RUL.indexOf(r[1])<0).map(r=>r[1])));
ok('E3 ★ 調整中（R6）の 1 件も記録されている',
   UNRES.every(r=>RUL.indexOf(r[1])>=0) && RUL.indexOf('調整中')>=0,
   JSON.stringify(UNRES));
ok('E4 ★ 土台の裁定（WIKI-378544C74049、回答日 2008-05-30）が記録されている',
   RUL.indexOf('WIKI-378544C74049')>=0 && RUL.indexOf('2008-05-30')>=0, 'x');
ok('E5 ★ 「逃す」側に挙げたカードのうち実装されているものを数える（未実装は次の単位の対象外）',
   true, JSON.stringify(MISS.map(r=>r[0]+':'+!!CARD_SCRIPTS[r[0]])));
ok('E6 ★ 「逃さない」側に挙げたカードの実装状況',
   true, JSON.stringify(NEVER.map(r=>r[0]+':'+!!CARD_SCRIPTS[r[0]])));
`, {expect:6});

/* ===== F. 文書 ===== */
harness('const SRC=' + JSON.stringify(SRC_S505) + ';' + COMMON + String.raw`
const DOC=SRC['docs/S03_MISSED_TIMING_DESIGN.md'];
ok('F1 ★ 設計書に (F) 節があり、候補の数と句の内訳が書かれている',
   DOC.indexOf('### (F) 破壊・墓地送りが条件の誘発')>=0
   && DOC.indexOf('316')>=0 && DOC.indexOf('155')>=0, 'x');
ok('F2 ★ 設計書に、いまの正規表現が「墓地へ送られた時」に当たらないことが書かれている',
   DOC.indexOf('「墓地へ送られた時」に当たらない')>=0, 'x');
/* F3 は S03-U506 で書き直した。項目 4 は「S03-U505 で監査 → S03-U506 で破壊の側だけ実装」になった。
   本単位（S03-U505）の成果は監査と設計で、行が S03-U505 の監査に触れていることを見る。 */
/* F3 は S03-U508 で書き直した。項目 4 の見出しが「墓地送りはまだ入れていない」から
   「S03-U508 で測って『いまの刻み方では入れられない』と確定した」に変わった。
   S03-U505 の成果（候補 316 枚の監査）に触れている行であることは引き続き見る。 */
ok('F3 ★ 設計書の項目 4 に、S03-U505 の監査・S03-U506 の実装（破壊の側だけ）・S03-U508 の実測が書かれている',
   DOC.indexOf('| 4 | **破壊の側は S03-U506 で入れた（1 件）。墓地送りは S03-U508 で測って')>=0
   && DOC.indexOf('S03-U505 で候補 316 枚を')>=0
   && DOC.indexOf('同時として扱う処理が刻みを進める')>=0, 'x');
ok('F4 ★ 段階表に S03-U505 が完了として入っている',
   DOC.indexOf('**S03-U505（完了）**')>=0, 'x');
/* F5 は S03-U506 で書き直した。S03-U505 自身は挙動を変えておらず、engine に入ったのは S03-U506 である。
   いまは engine が S03-U505 の実測を引用しているので「S03-U505 の文字が無い」では測れない。
   代わりに、種別の実装が S03-U506 のものであることを見る。 */
ok('F5 ★ 破壊の種別は S03-U506 で入った（S03-U505 は監査と設計だけだった）',
   SRC['engine/1ZZX_missed_timing_s03.js'].indexOf('S03-U506')>=0
   && /const MISSED_TIMING_DESTROY_CLASS_S03 = \{onDestroy:'D'\};/
        .test(SRC['engine/1ZZX_missed_timing_s03.js']), 'x');
ok('F6 専用テストが tools/check.py に登録されている',
   /test_s03_u505_destroy_trigger_audit\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:6});
