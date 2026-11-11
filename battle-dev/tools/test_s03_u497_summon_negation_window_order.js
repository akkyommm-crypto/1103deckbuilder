/* S03-U497: 召喚そのものの無効の窓（SUMMON_WINDOW_* / summonNegatorsV2 / beginSummonWindowV2）の
   **処理順を実測して設計を確定する**単位。設計は docs/S03_MISSED_TIMING_DESIGN.md（1-c、(D)、5-e、
   5-a #1・#1-d・#1-e・#1-f）、当時裁定の本文は docs/S03_MISSED_TIMING_RULINGS.md。

   「SUMMON_WINDOW_* へ同じ番号判定を入れれば正しい」と先に決めず、窓がいまどこで開くかを数えた。

   本単位は**挙動を変えていない**。固定するのは実測した事実そのもので、次の単位が (D) の実装を入れるときに
   前提が黙って動かないようにするためのものである。

     A 候補と呼び出し元の全件（sc.summonNegate 14 枚 / beginSummonWindowV2 5 か所・4 種別）
     B 既存の窓は 4 種別すべて chain 0・procStepS03 0・解決中のリンク無しで開く
       → 既存の窓へ処理番号の比較を入れても一度も成立しない（**採らない案の negative control**）
     C/D 解決中の召喚には窓が開かない。チェーン1 とチェーン2 を分ける道具は処理番号だけで、
       gameState.chain.length では分けられない
     E 解決中の特殊召喚（《死者蘇生》）にも窓が開かない
     F 挙動を変えていないことを Save/Load・Replay で固定する
     G 設計書・裁定記録・engine のコメント */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S497 = pathA.resolve(__dirname, '..');
const rdS497 = p => fsA.readFileSync(pathA.join(ROOT_S497, p), 'utf8');
const DESIGN_S497 = rdS497('docs/S03_MISSED_TIMING_DESIGN.md');
const RULINGS_S497 = rdS497('docs/S03_MISSED_TIMING_RULINGS.md');
const ENGINE_S497 = rdS497('engine/1ZZX_missed_timing_s03.js');
const SRC_S497 = {
  'engine/70_summon_procedures.js': rdS497('engine/70_summon_procedures.js'),
  'engine/1ZI_gemini_s03.js': rdS497('engine/1ZI_gemini_s03.js'),
  'runtime/50_actions_save.js': rdS497('runtime/50_actions_save.js'),
  'engine/40_legal_script_engine.js': rdS497('engine/40_legal_script_engine.js'),
  'cards/40_auto_interpreter.js': rdS497('cards/40_auto_interpreter.js'),
  'engine/30_processor_chain_battle.js': rdS497('engine/30_processor_chain_battle.js')
};

/* 設計書 1-c に書いた候補の全件。ここを増減させるときは設計書も直す。 */
/* S03-U551: 数え方は維持し、新しい召喚無効4枚を期待集合へ追加。当時の14枚は設計書に保持。 */
const CANDIDATES_S497 = ['インヴェルズ・ローチ','エレキャンセル','エヴォルカイザー・ラギア','キックバック',
  'ライオウ','ライト・バニッシュ','方舟の選別','昇天の角笛','昇天の黒角笛','混沌の落とし穴',
  '王宮の弾圧','神の宣告','神の警告','重力崩壊','セイバー・ホール','ブローニング・パワー','ポリノシス','王者の看破'];
/* WIKI-2CF23AA42E79 が名前を挙げている 3 枚 */
const NAMED_S497 = ['神の宣告','キックバック','昇天の角笛'];

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let STEPS=[], WINS=[], CHAINEND=[];
(function(){
  const bw=beginSummonWindowV2;beginSummonWindowV2=function(pending){
    WINS.push({name:pending&&pending.name, kind:pending&&pending.kind,
      chain:(gameState.chain||[]).length,
      deferred:(gameState.deferredEvents||[]).length,
      resolving:(typeof RESOLVING_LINK_S03!=='undefined'&&!!RESOLVING_LINK_S03),
      step:s()});
    return bw.apply(this,arguments);};
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',before:b,after:s(),chain:(gameState.chain||[]).length});}};
  const pce=processChainEndV30;processChainEndV30=function(){
    CHAINEND.push({step:s(),deferred:(gameState.deferredEvents||[]).map(x=>x.eventName)});
    return pce.apply(this,arguments);};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];WINS=[];CHAINEND=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function openedWindow(){return STEPS.some(x=>x.t==='SUMMON_WINDOW_OPEN_V42');}
function summonAct(){return STEPS.find(x=>x.t==='NORMAL_SUMMON'||x.t==='FX_SPECIAL_SUMMON')||null;}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();STEPS=[];WINS=[];CHAINEND=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
/* 《血の代償》の盤面。chain2=true なら《成金ゴブリン》をチェーン1 として先に積む。 */
function bloodBoard(o){
  fresh();
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  if(o.chain2) gameState.players[0].sz.push(setTrap('成金ゴブリン',0));
  const dec=setTrap(o.negator||'神の宣告',1);gameState.players[1].sz=[dec];
  const mon=mk('ワイト',0);gameState.players[0].hand=[mon];
  baselineA();
  return {mon:mon.uid, negator:dec.uid};
}
function bloodRun(o){
  const ids=bloodBoard(o);
  if(o.chain2){
    duelActivateFromZone(0,'sz',1);
    let g=0;while(pc()&&(gameState.chain||[]).length<1&&g++<8)__choicePickV49(0);
    const r=(getChainResponsesV2(0)||[]).find(x=>x.db.n==='血の代償');
    if(r) duelActivateResponseV2(0,r.zone,r.index);
    g=0;while(pc()&&(gameState.chain||[]).length<2&&g++<8)__choicePickV49(0);
  }else{
    duelActivateFromZone(0,'sz',0);
  }
  return ids;
}
`;

/* ===== A. 候補と呼び出し元の全件 ===== */
harness('const WANT=' + JSON.stringify(CANDIDATES_S497) + ';'
      + 'const NAMED=' + JSON.stringify(NAMED_S497) + ';' + COMMON + String.raw`
const got=Object.keys(CARD_SCRIPTS).filter(n=>CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].summonNegate).sort();
ok('A1 ★ sc.summonNegate を持つカードは実測 18 枚（U497当時14＋U551追加4）で、設計書 1-c に書いた全件と一致する',
   got.length===18 && JSON.stringify(got)===JSON.stringify(WANT.slice().sort()),
   JSON.stringify(got));
function accepts(nm,kind){
  const sn=CARD_SCRIPTS[nm].summonNegate;
  if(sn.specialOnly&&kind==='normal') return false;
  if(sn.kinds&&sn.kinds.indexOf(kind)<0) return false;
  return true;
}
ok('A2 ★ WIKI-2CF23AA42E79 が名前を挙げている 3 枚はすべて実装されていて、通常召喚に応答できる種別である',
   NAMED.every(n=>got.indexOf(n)>=0 && accepts(n,'normal')),
   JSON.stringify(NAMED.map(n=>[n,got.indexOf(n)>=0,accepts(n,'normal')])));
const normals=got.filter(n=>accepts(n,'normal'));
ok('A3 通常召喚（kind normal）に応答できるのは 14 枚（U551で4枚追加）',
   normals.length===14, JSON.stringify(normals));
/* R6 と同じ扱い: 召喚無効のカードは (B-2) の種別には入らない（S03-U492 以降の約束） */
ok('A4 ★ 候補 18 枚はすべて missedTimingSummonNegatorS03 で真になり、召喚成功後の落とし方には入らない',
   got.every(n=>missedTimingSummonNegatorS03(n)===true),
   JSON.stringify(got.filter(n=>missedTimingSummonNegatorS03(n)!==true)));
`, {expect:4});

/* ===== B. 既存の窓が開く瞬間（4 種別） ===== */
harness(COMMON + String.raw`
/* B1 手札からの通常召喚 */
fresh();
gameState.players[1].sz=[setTrap('神の宣告',1)];
gameState.players[0].hand=[mk('ワイト',0)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const w1=WINS.slice();
ok('B1 手札からの通常召喚の窓は kind normal で chain 0・procStepS03 0・解決中のリンク無しで開く',
   w1.length===1 && w1[0].kind==='normal' && w1[0].chain===0 && w1[0].step===0 && w1[0].resolving===false,
   JSON.stringify(w1));

/* B2 反転召喚 */
fresh();
const f=mk('ワイト',0,'down','def');f.setTurn=gameState.turn-1;gameState.players[0].mz=[f];
gameState.players[1].sz=[setTrap('キックバック',1)];
baselineA();
doFlipUp(0,'mz',0,'atk');
const w2=WINS.slice();
ok('B2 反転召喚の窓は kind flip で chain 0・procStepS03 0・解決中のリンク無しで開く',
   w2.length===1 && w2[0].kind==='flip' && w2[0].chain===0 && w2[0].step===0 && w2[0].resolving===false,
   JSON.stringify(w2));

/* B3 特殊召喚手順 */
fresh();
gameState.players[0].hand=[mk('サイバー・ドラゴン',0)];
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
finishSummonProcedure('サイバー・ドラゴン',0,'hand',0,'atk');
const w3=WINS.slice();
ok('B3 特殊召喚手順の窓は kind procedure で chain 0・procStepS03 0・解決中のリンク無しで開く',
   w3.length===1 && w3[0].kind==='procedure' && w3[0].chain===0 && w3[0].step===0 && w3[0].resolving===false,
   JSON.stringify(w3)+' '+JSON.stringify(TOASTS.slice(-1)));

/* B4 シンクロ召喚。素材が場を離れた分の保留イベントを抱えて開く。 */
fresh();
gameState.players[0].mz=[mk('ジャンク・シンクロン',0,'up'),mk('ワイト',0,'up')];
gameState.players[0].ex=[mk('アームズ・エイド',0)];
baselineA();
doExSummon(0,0,[0,1],'synchro','atk');
const w4=WINS.slice();
ok('B4 ★ シンクロ召喚の窓も chain 0・procStepS03 0 で開くが、保留イベントは 0 件ではない（素材が場を離れた分）',
   w4.length===1 && w4[0].kind==='synchro' && w4[0].chain===0 && w4[0].step===0 && w4[0].deferred>0,
   JSON.stringify(w4)+' '+JSON.stringify(TOASTS.slice(-1)));

/* B5 採らない案の negative control */
const all=[w1[0],w2[0],w3[0],w4[0]].filter(Boolean);
ok('B5 ★ negative control: 実測した 4 種別はすべて procStepS03 0 で開くので、既存の SUMMON_WINDOW_* へ'
   +'処理番号の比較を入れても一度も成立しない（死んだコードになる）。'
   +'保留イベントの有無で判定する案も B4 で成立しない',
   all.length===4 && all.every(x=>x.step===0 && x.chain===0) && all.some(x=>x.deferred>0),
   JSON.stringify(all));
`, {expect:5});

/* ===== C/D. 解決中の召喚（チェーン1 とチェーン2） ===== */
harness(COMMON + String.raw`
/* --- C チェーン1 --- */
const id1=bloodRun({chain2:false});
drive();
const sum1=summonAct(), end1=CHAINEND[0]||null;
/* C1 は S03-U498 で書き替えた。S03-U497 の実測は「ここに窓が 1 つも開かない」で、
   それが当時裁定 WIKI-2CF23AA42E79（回答日 2011-08-25）との食い違いだった。S03-U498 がその窓を入れたので、
   いまは SUMMON_WINDOW_OPEN_V42 が出る。ただし通るのは既存の beginSummonWindowV2（5 か所・すべて UI 起点）
   ではなく、遅延イベントの排出側に足した経路（engine/1ZZY）なので WINS は 0 のままである。
   実測そのもの（C2・C3・D2・D3・D4 の処理番号、B5 の negative control）はそのまま残す。 */
ok('C1 ★ 《血の代償》チェーン1 の解決中の通常召喚は、既存の beginSummonWindowV2 を一度も通らない。'
   +'S03-U498 で排出側に窓を足したので SUMMON_WINDOW_OPEN_V42 は出る（WIKI-2CF23AA42E79、5-a #1）',
   WINS.length===0 && openedWindow()===true && !!sum1 && sum1.t==='NORMAL_SUMMON',
   JSON.stringify({wins:WINS,sum:sum1}));
ok('C2 ★ チェーン1 では召喚した瞬間の処理番号とチェーン終了時の処理番号が同じ（＝召喚の後に別の処理が無い）',
   !!sum1 && !!end1 && sum1.after===2 && end1.step===2 && end1.step-sum1.after===0,
   JSON.stringify({sum:sum1,end:end1}));
ok('C3 チェーン終了時点の保留列の最後が onNormalSummon で、召喚成功の誘発はまだ出ていない',
   !!end1 && end1.deferred.length>0 && end1.deferred[end1.deferred.length-1]==='onNormalSummon',
   JSON.stringify(end1));
ok('C4 窓で何も発動しなければ召喚は成立し、p1 の《神の宣告》は伏せたまま残る',
   zu(id1.mon)==='mz' && zu(id1.negator)==='sz',
   JSON.stringify({mon:zu(id1.mon),negator:zu(id1.negator)}));
const d1=end1.step-sum1.after, chainAtSummon1=sum1.chain;

/* --- D チェーン2 --- */
const id2=bloodRun({chain2:true});
drive();
const sum2=summonAct(), end2=CHAINEND[0]||null;
ok('D1 チェーン2 でも窓は開かない（結果としては当時裁定の「逃す」と一致するが、規則としてではなく窓が無いだけ）',
   WINS.length===0 && openedWindow()===false && !!sum2 && sum2.t==='NORMAL_SUMMON',
   JSON.stringify({wins:WINS,sum:sum2}));
/* S03-U506 で (A) の許可リストから FX_SELF_TO_GRAVE（発動した魔法・罠の後片付け）を外したので、
   この経路の刻みは 1 つ減って 2 → 4 になった。質的な事実（チェーン2 では召喚の後に番号が進む）は同じ。 */
ok('D2 ★ チェーン2 では召喚の後に処理番号が進む（2 → 4）＝ 当時裁定の「召喚の後に別の処理がある場合」',
   !!sum2 && !!end2 && sum2.after===2 && end2.step===4 && end2.step-sum2.after>0,
   JSON.stringify({sum:sum2,end:end2}));
const d2=end2.step-sum2.after;
ok('D3 ★ チェーン1 と チェーン2 を分ける道具は (A) の処理番号だけ（差 0 と 差 2。S03-U506 で 3 → 2）',
   d1===0 && d2===2, JSON.stringify({d1,d2}));
/* 残りのリンク数でもこの 2 例は分かれる（0 と 1）。ただし当時裁定の条件は「召喚の後に別の処理がある」で、
   同じ 1 回の解決の中で召喚の後にまだ処理が続く場合も含む。リンク数はそれを見られないので、
   判定に使う道具は処理番号の側にする。 */
ok('D4 ★ 召喚した瞬間の残りリンク数は 0 と 1 で、この 2 例はリンク数でも分かれる。'
   +'ただし「召喚の後に別の処理がある」は 1 回の解決の中の後続処理も含むので、判定には処理番号を使う',
   chainAtSummon1===0 && sum2.chain===1 && d1===0 && d2>0,
   JSON.stringify({chain1:chainAtSummon1,chain2:sum2.chain,d1,d2}));
`, {expect:8});

/* ===== E. 解決中の特殊召喚 ===== */
harness(COMMON + String.raw`
fresh();
gameState.players[0].hand=[mk('死者蘇生',0)];
gameState.players[0].grave=[mk('ワイト',0)];
gameState.players[1].mz=[mk('エヴォルカイザー・ラギア',1,'up')];
baselineA();
duelActivateFromZone(0,'hand',0);
drive();
const sum=summonAct();
ok('E1 ★ 《死者蘇生》の解決中の特殊召喚にも窓が開かない（CHAIN_RESOLVE_TOP の直後に FX_SPECIAL_SUMMON。5-a #1-d）',
   WINS.length===0 && openedWindow()===false && !!sum && sum.t==='FX_SPECIAL_SUMMON'
   && gameState.players[0].mz.length===1,
   JSON.stringify({wins:WINS,sum:sum,mz:gameState.players[0].mz.length}));
const sc=CARD_SCRIPTS['エヴォルカイザー・ラギア'];
ok('E2 《エヴォルカイザー・ラギア》は候補（sc.summonNegate、procedure を受ける）だが、この経路では一度も参照されない',
   !!(sc&&sc.summonNegate) && (sc.summonNegate.kinds||[]).indexOf('procedure')>=0 && WINS.length===0,
   JSON.stringify(sc&&sc.summonNegate&&sc.summonNegate.kinds));
`, {expect:2});

/* ===== F. 挙動を変えていないことを Save/Load・Replay で固定する ===== */
const ctxF = harness(COMMON + String.raw`
const ids=bloodBoard({chain2:false});
globalThis.__SAVED_S497=savedRaw();
globalThis.__AT_S497=JSON.stringify({chain:(gameState.chain||[]).length,step:s()});
ok('F1 保存した時点では処理番号 0・召喚無効の窓は開いていない（pendingSummon は null）で、盤面が保存に入っている',
   s()===0 && gameState.pendingSummon==null
   && (function(){const st=JSON.parse(globalThis.__SAVED_S497||'{}').state||{};
     const a=((st.players||[])[0]||{}).sz||[], b=((st.players||[])[1]||{}).sz||[];
     return a.length===1 && a[0].id===findCardIndex('血の代償')
         && b.length===1 && b[0].id===findCardIndex('神の宣告');})(),
   JSON.stringify({step:s(),len:(globalThis.__SAVED_S497||'').length}));
duelActivateFromZone(0,'sz',0);
drive();
globalThis.__WANT_S497=JSON.stringify({mon:zu(ids.mon),negator:zu(ids.negator),step:s(),
  wins:WINS.length,digest:v41StateDigest(gameState)});
ok('F1b 解決後の保存には進んだ処理番号が入り、窓は開いたままになっていない',
   s()===2 && savedRaw().indexOf('procStepS03')>=0 && gameState.pendingSummon==null,
   JSON.stringify({step:s()}));
audit('F1');
`, {expect:3});

harness('const SAVED=' + JSON.stringify(ctxF.__SAVED_S497 || '') + ';'
      + 'const AT=' + (ctxF.__AT_S497 || 'null') + ';'
      + 'const WANT=' + (ctxF.__WANT_S497 || 'null') + ';' + COMMON + String.raw`
const okLoad=loadInto(SAVED);
const at={chain:(gameState.chain||[]).length, step:s()};
ok('F2 前提: 別の VM で保存データから再開でき、チェーンと処理番号が保存時のまま戻っている',
   okLoad===true && JSON.stringify(at)===JSON.stringify(AT), JSON.stringify({okLoad,at,AT}));
const mon=(gameState.players[0].hand||[]).find(c=>c&&dbOf(c).n==='ワイト');
const neg=(gameState.players[1].sz||[]).find(c=>c&&dbOf(c).n==='神の宣告');
duelActivateFromZone(0,'sz',0);
drive();
const got={mon:zu(mon.uid),negator:zu(neg.uid),step:s(),wins:WINS.length,digest:v41StateDigest(gameState)};
ok('F3 ★ 新しい VM での再開後の解決が、保存なしの解決と同じ盤面・同じ処理番号・同じ最終 digest になり、'
   +'窓も同じく 1 つも開かない（本単位で挙動を変えていないことの固定）',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('F3');
`, {expect:3});

/* ===== G. 文書・呼び出し元 ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S497) + ';const RUL=' + JSON.stringify(RULINGS_S497) + ';'
      + 'const ENG=' + JSON.stringify(ENGINE_S497) + ';const SRC=' + JSON.stringify(SRC_S497) + ';'
      + COMMON + String.raw`
ok('G1 ★ 設計書 1-c に、候補の全件・呼び出し元 5 か所・実測した 4 種別の表がある',
   DOC.indexOf('1-c. 召喚そのものの無効の窓は、いまどこで開くか（S03-U497 で実測）')>=0
   && DOC.indexOf('実測 **14 枚**')>=0
   && DOC.indexOf('**窓を開く場所は 5 か所・4 種別だけ**')>=0
   && DOC.indexOf('死んだコードになる')>=0
   && DOC.indexOf('**本当の食い違いは逆向きだった。解決中に行われる召喚には窓が 1 つも開かない。**')>=0,'');
ok('G2 ★ 設計書 (D) に、刻む場所・開く場所と、実装しなかった 2 つの理由（召喚が適用済み・DRAIN_EVENTS）が書かれている',
   DOC.indexOf('### (D) 召喚無効の窓（S03-U497 で確定した設計')>=0
   && DOC.indexOf('processChainEndV30')>=0
   && DOC.indexOf('案 (a)')>=0 && DOC.indexOf('案 (b)')>=0
   && DOC.indexOf('processDrainEventsV27')>=0,'');
/* G3 は S03-U498 で書き替えた。S03-U497 は「未実装でチェーン1 の発動を潰している」を記録し、
   S03-U498 がその窓を入れた。潰していたという実測そのもの（名指しの 3 枚）は 5-a #1 に残っている。 */
ok('G3 ★ 5-a #1 が S03-U498 で入れた範囲と残った未対応に書き直され、#1-d・#1-e・#1-f がある',
   DOC.indexOf('**召喚そのものの無効は、S03-U498 で')>=0
   && DOC.indexOf('当時できる《神の宣告》《キックバック》《昇天の角笛》の発動を潰していた')>=0
   && DOC.indexOf('| 1-d |')>=0 && DOC.indexOf('| 1-e |')>=0 && DOC.indexOf('| 1-f |')>=0,'');
ok('G4 ★ 裁定記録に 4 件の本文と層（回答日あり / 回答日なし）の区別がある',
   RUL.indexOf('S03-U497 で参照した当時裁定（召喚そのものの無効の窓）')>=0
   && RUL.indexOf('WIKI-2CF23AA42E79')>=0 && RUL.indexOf('R1103-ROACH-003')>=0
   && RUL.indexOf('R1103-RAIOH-002')>=0 && RUL.indexOf('R1103-WARNING-006')>=0
   && RUL.indexOf('**回答日なし**')>=0 && RUL.indexOf('(11/08/25)')>=0,'');
ok('G5 ★ engine 1ZZX のコメントにも、実測と「死んだコードになる」ことが書かれている',
   ENG.indexOf('S03-U497 でその窓の処理順を実測した')>=0
   && ENG.indexOf('死んだコードになる')>=0
   && ENG.indexOf('gameState.chain.length では分けられない')>=0,'');
ok('G6 ★ 設計書 1-c に挙げた呼び出し元 5 か所が、実際にそのファイルで beginSummonWindowV2 を呼んでいる',
   Object.keys(SRC).filter(f=>f!=='engine/30_processor_chain_battle.js')
     .every(f=>/beginSummonWindowV2\(/.test(SRC[f]))
   && (SRC['engine/30_processor_chain_battle.js'].match(/function beginSummonWindowV2/g)||[]).length===1,
   Object.keys(SRC).map(f=>f+':'+((SRC[f].match(/beginSummonWindowV2\(/g)||[]).length)).join(' '));
ok('G7 ★ 5-e に、採らないと決まった案と、挙動を変えていないことが書かれている',
   DOC.indexOf('5-e. S03-U497 で確定したこと（**挙動の変更なし**）')>=0
   && DOC.indexOf('**採らない案（S03-U497 で足した分）**')>=0
   && DOC.indexOf('誤った記録だけが残る')>=0,'');
`, {expect:7});
