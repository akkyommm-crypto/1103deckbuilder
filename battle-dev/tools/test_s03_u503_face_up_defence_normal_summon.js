/* S03-U503: 表側守備表示での通常召喚（《聖なる輝き》がある状態の「セット」）。
   設計書 5-a の項目 3 に「未実装」として残っていた分で、**回答日のある裁定が根拠**である。

   当時裁定 `WIKI-0B439F71B94A`（**回答日 2011-04-18**、掲載ページ《ゴブリンドバーグ》）:
     Q「《聖なる輝き》が存在するときに**表側守備表示で通常召喚**し、効果を発動しました。このとき、
        このカードが守備表示になる処理は発生しますか？ また、この時に特殊召喚したモンスターが
        《E・HERO エアーマン》の場合効果はタイミングを逃さず発動できますか？」
     A「《聖なる輝き》が存在するときに表側守備表示で通常召喚して効果を使用した場合、守備表示になる処理は
        行われません。また、この場合《E・HERO エアーマン》の効果を発動することができます。(11/04/18)」

   これは S03-U493 が使った `WIKI-9FC5B41EDCF4`（**回答日 2011-04-17**）の**裏返し**である。
   あちらは表側攻撃表示で通常召喚した《ゴブリンドバーグ》が守備表示になる処理が「召喚の後の別の処理」に
   なるので《E・HERO エアーマン》が**逃す**。《聖なる輝き》があるときは最初から守備表示なので
   その処理が行われず、**逃さない**。

   S03-U194 以前の実装では、《聖なる輝き》のある「セット」は `SET_MONSTER`（表側守備表示に置くだけ）で、
   召喚成功のイベントも召喚無効の窓も無かったため、この裁定を実経路で再現できなかった。

   固定するもの:
     A 振り替え（セットの操作が表側守備表示の通常召喚になる）
     B 当時裁定の場面（守備表示にする処理が行われず、エアーマンが逃さない）と、その裏返し（S03-U493 の場面）
     C 通常召喚なので召喚無効の窓で無効にできる
     D **negative control**: 《聖なる輝き》が無ければセットは今までどおり裏側守備表示
     E リリースを伴う「セット」も振り替わる
     F Save/Load・Replay
     G R9（「召喚」は表側攻撃表示または表側守備表示での通常召喚）と文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S503 = pathA.resolve(__dirname, '..');
const rdS503 = p => fsA.readFileSync(pathA.join(ROOT_S503, p), 'utf8');
const SRC_S503 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS503('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS503('docs/S03_MISSED_TIMING_RULINGS.md'),
  'engine/00_state_actions.js': rdS503('engine/00_state_actions.js'),
  'engine/40_legal_script_engine.js': rdS503('engine/40_legal_script_engine.js'),
  'engine/70_summon_procedures.js': rdS503('engine/70_summon_procedures.js'),
  'tools/check.py': rdS503('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cardOf(uid){const h=findCardByUid(uid);return h?h.card:null;}
let STEPS=[], QLOG=[], WINS=[];
(function(){
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',before:b,after:s(),pos:(a&&a.pos)||null,
        faceUpSet:!!(a&&a.faceUpSetS03)});}};
  const qd=queueDeferredEventV2;queueDeferredEventV2=function(name,evt){
    QLOG.push({name,uid:(evt&&evt.uid)!=null?evt.uid:((evt&&evt.card&&evt.card.uid)!=null?evt.card.uid:null)});
    return qd.apply(this,arguments);};
  const bw=beginSummonWindowV2;beginSummonWindowV2=function(p){
    WINS.push({kind:p&&p.kind,label:p&&p.label,pos:p&&p.resumeS03&&p.resumeS03.pos});
    return bw.apply(this,arguments);};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];QLOG=[];WINS=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function actTypes(){return STEPS.map(x=>x.t);}
function stepDeltas(){return STEPS.filter(x=>x.before!==x.after).map(x=>x.t+':'+x.before+'->'+x.after);}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();STEPS=[];QLOG=[];WINS=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function negateInWindow(name){const ps=gameState.pendingSummon;if(!ps)return 'no-window';
  const list=summonNegatorsV2(ps),hit=list.find(x=>x.db.n===name);
  if(!hit)return 'not-offered:'+JSON.stringify(list.map(x=>x.db.n));
  activateSummonNegatorV2(hit.p,hit.zone,hit.index);drive();return 'done';}
/* 《聖なる輝き》がある盤面 */
function shineBoard(o){
  fresh();
  const opt=o||{};
  gameState.players[0].sz=[mk('聖なる輝き',0,'up')];
  const mon=mk(opt.mon||'ワイト',0);
  gameState.players[0].hand=[mon];
  const ids={mon:mon.uid};
  gameState.players[1].sz=(opt.negators||[]).map(nm=>{const c=setTrap(nm,1);ids[nm]=c.uid;return c;});
  baselineA();
  return ids;}
`;

/* ===== A. 振り替え ===== */
harness(COMMON + String.raw`
const ids=shineBoard({});
ok('A0 前提: mustSetFaceUp が真', mustSetFaceUp()===true, String(mustSetFaceUp()));
doSetMonster(0);
drive();
const c=cardOf(ids.mon);
ok('A1 ★ セットの操作が NORMAL_SUMMON（pos def）になり、SET_MONSTER は出ない',
   actTypes().includes('NORMAL_SUMMON') && !actTypes().includes('SET_MONSTER')
   && STEPS.some(x=>x.t==='NORMAL_SUMMON' && x.pos==='def'),
   JSON.stringify({types:actTypes()}));
ok('A2 ★ 盤面は表側守備表示で、召喚した記録（summonedTurn）が付く',
   zu(ids.mon)==='mz' && c.face==='up' && c.pos==='def' && c.summonedTurn===gameState.turn,
   JSON.stringify(c));
ok('A3 ★ 召喚成功のイベントが積まれ、召喚無効の窓も開く（通常召喚だから）',
   QLOG.some(x=>x.name==='onNormalSummon'&&x.uid===ids.mon)
   && WINS.length===1 && WINS[0].kind==='normal' && WINS[0].pos==='def',
   JSON.stringify({q:QLOG,wins:WINS}));
ok('A4 通常召喚の権利を使う', gameState.players[0].normalSummonUsed===true,
   String(gameState.players[0].normalSummonUsed));
ok('A5 《聖なる輝き》で振り替わったことがプレイヤーに伝わる',
   TOASTS.some(t=>/聖なる輝き/.test(t)), JSON.stringify(TOASTS));
audit('A');
`, {expect:7});

/* ===== B. 当時裁定の場面と、その裏返し ===== */
harness(COMMON + String.raw`
/* B1 《聖なる輝き》あり: 守備表示にする処理が行われず、エアーマンは逃さない（WIKI-0B439F71B94A 11/04/18） */
fresh();
gameState.players[0].sz=[mk('聖なる輝き',0,'up')];
const gob=mk('ゴブリンドバーグ',0), air=mk('E・HERO エアーマン',0);
gameState.players[0].hand=[gob,air];
const ocean=mk('E・HERO オーシャン',0);
gameState.players[0].deck.splice(1,0,ocean);
baselineA();
doSetMonster(0);
drive();
ok('B1 ★ 当時裁定どおり: 守備表示にする処理（FX_SET_STATE）が行われない',
   !actTypes().includes('FX_SET_STATE'),
   JSON.stringify({deltas:stepDeltas()}));
ok('B2 ★ 当時裁定どおり: 《E・HERO エアーマン》の効果が発動でき、デッキの《オーシャン》が手札へ'
   +'（何も落としていない）',
   zu(ocean.uid)==='hand' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({ocean:zu(ocean.uid),drops:MISSED_TIMING_DROPS_S03.map(d=>d.name)}));
ok('B3 《ゴブリンドバーグ》は最初から表側守備表示のまま残る',
   (cardOf(gob.uid)||{}).pos==='def' && (cardOf(gob.uid)||{}).face==='up',
   JSON.stringify(cardOf(gob.uid)));
ok('B4 ★ 刻みは 3 つ（召喚・特殊召喚・エアーマンのサーチ）で、守備表示にする処理は入っていない',
   stepDeltas().join('/')==='NORMAL_SUMMON:0->1/FX_SPECIAL_SUMMON:1->2/FX_SEARCH:2->3',
   JSON.stringify(stepDeltas()));
audit('B1');
`, {expect:5});

harness(COMMON + String.raw`
/* B5 裏返し（S03-U493 の場面、WIKI-9FC5B41EDCF4 11/04/17）: 表側攻撃表示なら守備表示にする処理が入り、逃す */
fresh();
const gob=mk('ゴブリンドバーグ',0), air=mk('E・HERO エアーマン',0);
gameState.players[0].hand=[gob,air];
const ocean=mk('E・HERO オーシャン',0);
gameState.players[0].deck.splice(1,0,ocean);
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
drive();
ok('B5 ★ 裏返しの対照: 表側攻撃表示で通常召喚した場合は FX_SET_STATE が入り、'
   +'《E・HERO エアーマン》はタイミングを逃す（S03-U493 のまま変わっていない）',
   actTypes().includes('FX_SET_STATE')
   && zu(ocean.uid)==='deck'
   && MISSED_TIMING_DROPS_S03.map(d=>d.name).indexOf('E・HERO エアーマン')>=0,
   JSON.stringify({deltas:stepDeltas(),ocean:zu(ocean.uid),
     drops:MISSED_TIMING_DROPS_S03.map(d=>d.name)}));
audit('B5');
`, {expect:2});

/* ===== C. 通常召喚なので無効にできる ===== */
harness(COMMON + String.raw`
const ids=shineBoard({negators:['神の宣告']});
doSetMonster(0);
ok('C1 ★ 窓が開き、p1 の《神の宣告》が候補に出る（セットなら発動できなかった）',
   !!gameState.pendingSummon
   && summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='神の宣告',
   JSON.stringify({ps:gameState.pendingSummon}));
const r=negateInWindow('神の宣告');
ok('C2 ★ 表側守備表示の通常召喚を無効にできる（モンスターは墓地へ）',
   r==='done' && zu(ids.mon)==='grave',
   JSON.stringify({r,mon:zu(ids.mon)}));
ok('C3 無効にされても通常召喚の権利は戻らない（WIKI-2C8BE04F46E9 07/03/26）',
   gameState.players[0].normalSummonUsed===true,
   String(gameState.players[0].normalSummonUsed));
audit('C');
`, {expect:4});

/* ===== D. negative control ===== */
harness(COMMON + String.raw`
fresh();
const mon=mk('ワイト',0);
gameState.players[0].hand=[mon];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
ok('D0 前提: 《聖なる輝き》が無いので mustSetFaceUp は偽', mustSetFaceUp()===false, 'x');
doSetMonster(0);
drive();
const c=cardOf(mon.uid);
ok('D1 ★ negative control: 《聖なる輝き》が無ければセットは今までどおり SET_MONSTER・裏側守備表示で、'
   +'召喚成功のイベントも窓も無い',
   actTypes().includes('SET_MONSTER') && !actTypes().includes('NORMAL_SUMMON')
   && c.face==='down' && c.pos==='def'
   && QLOG.length===0 && WINS.length===0,
   JSON.stringify({types:actTypes(),card:{face:c.face,pos:c.pos},q:QLOG,wins:WINS}));
ok('D2 ★ negative control: 表示形式の申告が無い NORMAL_SUMMON は今までどおり攻撃表示',
   (function(){ fresh(); const m=mk('ワイト',0); gameState.players[0].hand=[m]; baselineA();
     act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk'});
     const cc=cardOf(m.uid); return cc.face==='up'&&cc.pos==='atk'; })(),
   'x');
`, {expect:3});

/* ===== E. リリースを伴う「セット」 ===== */
harness(COMMON + String.raw`
fresh();
gameState.players[0].sz=[mk('聖なる輝き',0,'up')];
const mon=mk('デーモンの召喚',0);
gameState.players[0].hand=[mon];
gameState.players[0].mz=[mk('クリボー',0,'up')];
baselineA();
/* リリースの支払いは呼び出し側（pickTributes）が済ませる前提の経路。ここでは支払い済みとして渡す。 */
finishSetMonster(0,{bodies:1,value:1},null,null);
drive();
const c=cardOf(mon.uid);
ok('E1 ★ リリースを伴う「セット」も表側守備表示の通常召喚に振り替わり、リリース数が記録される',
   actTypes().includes('NORMAL_SUMMON') && !actTypes().includes('SET_MONSTER')
   && c.face==='up' && c.pos==='def' && c.tributeCount===1,
   JSON.stringify({types:actTypes(),card:{face:c.face,pos:c.pos,tc:c.tributeCount}}));
audit('E');
`, {expect:2});

/* ===== F. Save/Load ===== */
const ctxF = harness(COMMON + String.raw`
const ids=shineBoard({negators:['神の宣告']});
doSetMonster(0);
ok('F1 前提: 窓が開いたところで保存する', !!gameState.pendingSummon, 'x');
globalThis.__SAVED_S503=savedRaw();
globalThis.__AT_S503=JSON.stringify({uid:gameState.pendingSummon.uid,
  pos:gameState.pendingSummon.resumeS03.pos});
commitPendingSummonV2(); drive();
globalThis.__WANT_S503=JSON.stringify({mon:zu(ids.mon),pos:(cardOf(ids.mon)||{}).pos,
  step:s(),digest:v41StateDigest(gameState)});
audit('F1');
`, {expect:2});

harness('const AT=' + (ctxF.__AT_S503 || 'null') + ';'
      + 'const WANT=' + (ctxF.__WANT_S503 || 'null') + ';'
      + 'const SAVED=' + JSON.stringify(ctxF.__SAVED_S503 || '') + ';' + COMMON + String.raw`
ok('F2 ★ 別の VM で再開すると、表示形式の申告（resumeS03.pos）ごと窓が戻る',
   loadInto(SAVED)===true && !!gameState.pendingSummon
   && gameState.pendingSummon.uid===AT.uid
   && gameState.pendingSummon.resumeS03.pos===AT.pos,
   JSON.stringify(gameState.pendingSummon));
const mon=gameState.pendingSummon.uid;
commitPendingSummonV2(); drive();
const got={mon:zu(mon),pos:(cardOf(mon)||{}).pos,step:s(),digest:v41StateDigest(gameState)};
ok('F3 ★ 再開して通した結果が、保存しなかった場合と同じ盤面・同じ digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('F3');
`, {expect:3});

/* ===== G. R9 と文書・登録 ===== */
harness('const SRC=' + JSON.stringify(SRC_S503) + ';' + COMMON + String.raw`
const DOC=SRC['docs/S03_MISSED_TIMING_DESIGN.md'], RUL=SRC['docs/S03_MISSED_TIMING_RULINGS.md'];
/* G1 R9: 「召喚」は表側攻撃表示または表側守備表示での通常召喚（設計書の規則一覧） */
ok('G1 ★ R9 の文言（表側攻撃表示または表側守備表示での通常召喚）が設計書にある',
   DOC.indexOf('表側攻撃表示または表側守備表示')>=0, 'x');
ok('G2 ★ engine の NORMAL_SUMMON が申告つきで表側守備表示にする（当時裁定の ID と回答日つき）',
   /card\.pos=\(a\.pos==='def'\)\?'def':'atk'/.test(SRC['engine/00_state_actions.js'])
   && /WIKI-0B439F71B94A/.test(SRC['engine/00_state_actions.js'])
   && /2011-04-18/.test(SRC['engine/00_state_actions.js']),
   'x');
ok('G3 ★ 窓からの再開も表示形式を渡す（engine/40）',
   /\(r\.pos==='def'\)\?'def':'atk'/.test(SRC['engine/40_legal_script_engine.js']), 'x');
ok('G4 ★ 振り替えは engine/70 の 2 つの入口だけで、pos 引数ではなく専用のオプションで渡している'
   +'（FREE モードの「通常召喚（守備）」ボタンの挙動を変えないため）',
   (SRC['engine/70_summon_procedures.js'].match(/faceUpDefS503:true/g)||[]).length===2
   && /posS503=\(optsS503 && optsS503\.faceUpDefS503===true\)/.test(SRC['engine/70_summon_procedures.js']),
   JSON.stringify((SRC['engine/70_summon_procedures.js'].match(/faceUpDefS503:true/g)||[]).length));
ok('G5 ★ 設計書の項目 3 が「直した（S03-U503）」に書き直され、段階表にも完了として入っている',
   DOC.indexOf('| 3 | **直した（S03-U503）。**')>=0
   && DOC.indexOf('**S03-U503（完了）**')>=0, 'x');
ok('G6 ★ 裁定記録に WIKI-0B439F71B94A の本文と回答日がある',
   RUL.indexOf('WIKI-0B439F71B94A')>=0 && RUL.indexOf('2011-04-18')>=0, 'x');
ok('G7 専用テストが tools/check.py に登録されている',
   /test_s03_u503_face_up_defence_normal_summon\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:7});
