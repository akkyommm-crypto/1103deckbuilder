/* S03-U508: 《歯車街》②を「破壊され墓地へ送られた時」の**誘発効果**に直した単位。
   あわせて、墓地送り（G）の種別を (B-3) に入れて (B-5) に《歯車街》を足す案を実測し、
   **入れないと決めた**（下の D）。

   カード側（挙動の変更あり）
     テキストは「②:このカードが破壊され墓地へ送られた**時**に発動できる。自分の手札・デッキ・墓地から
     「アンティーク・ギア」モンスター1体を選んで特殊召喚する。」
     この単位の前は `activateFrom:["grave"]` と「墓地にあること」だけが条件で、**破壊と無関係に
     いつでも墓地から発動できた**（実測: strictScriptLegalityV2('歯車街',0,'grave',0,{}) が ok:true）。
     ほかの墓地誘発（《ダンディライオン》《TG ジェット・ファルコン》）と同じ作法で
     `passive.onSendToGrave` ＋ condition のイベント判定にした。

   当時裁定（**回答日つき**）
     逃す側:
       `WIKI-1B4D52FCA757`（**2010-08-11**、《グリフォンの羽根帚》）
         Q「このカードの効果で《歯車街》を破壊した場合、《歯車街》のタイミングを逃しますか？」
         A「破壊後に回復の処理が挟まるので、タイミングを逃します。(10/08/11)」
       `WIKI-378544C74049`（**2008-05-30**、《砂塵の大竜巻》）
         A「はい、そうです。つまり、破壊が条件の任意効果はタイミングを逃すことになります。(08/05/30)」
     逃さない側:
       `WIKI-25B0FF09EA0C`（**2009-02-22**、《トライデント・ドラギオン》）
         A「…効果はカードが破壊されたというタイミングで終了するため、破壊された《歯車街》の効果を
            発動する事ができます。(09/02/22)」
       `WIKI-6045932924C7`（**2009-03-02**、《燃えさかる大地》）A「発動する事ができます。(09/03/02)」
       `WIKI-D9392162D28D`（**2009-01-28** の行、《光帝クライス》）
         A「効果処理の終了したタイミングでは破壊とドローを同じタイミングとして扱います。(09/01/29)
            …破壊された《歯車街》の効果はタイミングを逃さずに発動可能です。(09/01/28)」
       `WIKI-590A1789DD22`（**2009-09-12**、《デュアルスパーク》）Q「破壊とドローは同時ですか？」A「はい、同時です。」
       `WIKI-CA554A0F5EEB`（**2008-04-21**、掲載ページ《歯車街》）A「手札やデッキからの破壊でも発動可能です。(08/04/21)」
         → 破壊された場所は見ない（`gearTownDestroyedS03` は `graveInfo.byDestroy` だけを見る）。

   固定するもの:
     A カードの形（誘発になったこと・破壊以外では発動しないこと）
     B 当時裁定の「逃さない」側 4 件を実経路で再現
     C 当時裁定の「逃す」側（《グリフォンの羽根帚》）は**まだ再現できていない**（未対応として固定）
     D (B-5) に《歯車街》を入れなかった理由（刻みの差の実測）
     E negative control（S03-U506 の破壊側は不変・この単位で落ちる組は 0）
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S508 = pathA.resolve(__dirname, '..');
const rdS508 = p => fsA.readFileSync(pathA.join(ROOT_S508, p), 'utf8');
const SRC_S508 = {
  'cards/10_themes_a.js': rdS508('cards/10_themes_a.js'),
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS508('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS508('docs/S03_MISSED_TIMING_RULINGS.md'),
  'docs/S03_U508_REPORT.md': rdS508('docs/S03_U508_REPORT.md'),
  'engine/1ZZX_missed_timing_s03.js': rdS508('engine/1ZZX_missed_timing_s03.js'),
  'tools/check.py': rdS508('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let STEPS=[], COLLECT=[];
(function(){
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',before:b,after:s()});}};
  const ch=collectHandlers;collectHandlers=function(ev,evt){
    const r=ch.apply(this,arguments);
    COLLECT.push({ev,names:(r||[]).map(x=>x.name),
      stamp:(evt&&evt.stepS03)!=null?evt.stepS03:null,now:s()});
    return r;};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];COLLECT=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function stepDeltas(){return STEPS.filter(x=>x.before!==x.after).map(x=>x.t+':'+x.before+'->'+x.after);}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
/* 《歯車街》が自分の墓地送りのイベントで候補に挙がったか、その刻みと現在値 */
function gtEvents(){return COLLECT.filter(c=>c.names.indexOf('歯車街')>=0)
  .map(c=>({ev:c.ev,stamp:c.stamp,now:c.now}));}
function gtDrops(){return MISSED_TIMING_DROPS_S03.map(d=>d.name);}
`;

/* ===== A. カードの形 ===== */
harness('const SRC=' + JSON.stringify(SRC_S508['cards/10_themes_a.js']) + ';' + COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['歯車街']||{};
ok('A1 ★ ②が誘発効果になっている（passive.onSendToGrave と、イベントを見る condition、裁定 ID）',
   typeof (sc.passive||{}).onSendToGrave === 'function'
   && SRC.indexOf('function gearTownDestroyedS03(ctx){')>=0
   && SRC.indexOf("if(ctx.eventName !== 'onSendToGrave' || !eventIsSelfS03(ctx) || !gearTownDestroyedS03(ctx)){")>=0
   && SRC.indexOf('WIKI-1B4D52FCA757')>=0 && SRC.indexOf('WIKI-CA554A0F5EEB')>=0,
   JSON.stringify({passive:Object.keys(sc.passive||{}),activateFrom:sc.activateFrom}));

/* 破壊されていない墓地の《歯車街》。この単位の前は ok:true で、いつでも発動できた。 */
fresh();
const gtIdle=mk('歯車街',0);
gameState.players[0].grave=[gtIdle];
gameState.players[0].deck.splice(1,0,mk('古代の機械兵士',0));
baselineA();
const Lidle=strictScriptLegalityV2('歯車街',0,'grave',0,{});
ok('A2 ★ 破壊されていない墓地の《歯車街》は発動できない（この単位の前は発動できた）',
   Lidle.ok===false && String(Lidle.reason||'').indexOf('破壊され墓地へ送られた時')>=0,
   JSON.stringify({ok:Lidle.ok,reason:Lidle.reason}));

/* negative control: 破壊ではない墓地送り（《ライトニング・ボルテックス》のコストで手札から捨てる）。
   当時裁定 WIKI-CA554A0F5EEB は「手札やデッキからの**破壊**でも発動可能」と言っているだけで、
   破壊でない墓地送りは誘発ではない。 */
fresh();
const gtDisc=mk('歯車街',0);
gameState.players[0].hand=[mk('ライトニング・ボルテックス',0),gtDisc];
gameState.players[0].deck.splice(1,0,mk('古代の機械兵士',0));
gameState.players[1].mz[0]=mk('ワイト',1,'up');
gameState.activePlayer=0; baselineA();
duelActivateFromHand(0);
const trDisc=drive();
const hDisc=findCardByUid(gtDisc.uid);
ok('A3 ★ negative control: 破壊ではない墓地送り（コストで捨てた）では誘発しない',
   !!hDisc && hDisc.zone==='grave'
   && !(hDisc.card.graveInfo && hDisc.card.graveInfo.byDestroy)
   && gtEvents().length===0,
   JSON.stringify({tr:trDisc,zone:hDisc&&hDisc.zone,
     gi:hDisc&&hDisc.card.graveInfo?{byDestroy:!!hDisc.card.graveInfo.byDestroy,from:hDisc.card.graveInfo.from}:null,
     gtEv:gtEvents()}));
`, {expect:3});

/* ===== B. 当時裁定の「逃さない」側（実経路） ===== */
harness(COMMON + String.raw`
/* 破壊だけで処理が終わる効果。《トライデント・ドラギオン》WIKI-25B0FF09EA0C（09/02/22）と同じ形。 */
fresh();
const gt=mk('歯車街',0,'up'); gameState.players[0].field=gt;
const ag=mk('古代の機械兵士',0); gameState.players[0].deck.splice(1,0,ag);
gameState.players[1].hand=[mk('サイクロン',1)];
gameState.activePlayer=1; baselineA();
duelActivateFromHand(0);
const tr=drive();
const ev=gtEvents();
ok('B1 ★ 《サイクロン》で破壊 → 誘発して「アンティーク・ギア」を特殊召喚できる（刻みと現在値が同じ）',
   tr==='idle' && zu(gt.uid)==='grave' && zu(ag.uid)==='mz'
   && ev.length===1 && ev[0].ev==='onSendToGrave' && ev[0].stamp===ev[0].now
   && gtDrops().length===0,
   JSON.stringify({tr,gt:zu(gt.uid),ag:zu(ag.uid),deltas:stepDeltas(),ev,drops:gtDrops()}));
`, {expect:1});

harness(COMMON + String.raw`
/* WIKI-6045932924C7（**2009-03-02**、《燃えさかる大地》）:「発動する事ができます。(09/03/02)」
   このカードは発動時にフィールド魔法を全部破壊する。破壊で処理が終わる。 */
fresh();
const gt=mk('歯車街',0,'up'); gameState.players[0].field=gt;
const ag=mk('古代の機械兵士',0); gameState.players[0].deck.splice(1,0,ag);
gameState.players[1].hand=[mk('燃えさかる大地',1)];
gameState.activePlayer=1; baselineA();
duelActivateFromHand(0);
const tr=drive();
const ev=gtEvents();
ok('B2 ★ 当時裁定 WIKI-6045932924C7（09/03/02）: 《燃えさかる大地》で破壊 → 発動できる',
   tr==='idle' && zu(gt.uid)==='grave' && zu(ag.uid)==='mz'
   && ev.length===1 && ev[0].stamp===ev[0].now && gtDrops().length===0,
   JSON.stringify({tr,gt:zu(gt.uid),ag:zu(ag.uid),deltas:stepDeltas(),ev}));
`, {expect:1});

harness(COMMON + String.raw`
/* WIKI-D9392162D28D（**2009-01-28** の行、《光帝クライス》）: 破壊とドローは効果処理の終わりでは
   同じタイミングとして扱われるので、破壊された《歯車街》は逃さない。
   実経路では破壊の後にドローの Action が入るので、**刻みと現在値は一致しない**（下の D3）。 */
fresh();
const gt=mk('歯車街',0,'up'); gameState.players[0].field=gt;
const ag=mk('古代の機械兵士',0); gameState.players[0].deck.splice(1,0,ag);
gameState.players[1].mz[0]=mk('ワイト',1,'up');
gameState.players[1].hand=[mk('光帝クライス',1)];
gameState.activePlayer=1; baselineA();
doNormalSummon(0);
const tr=drive();
const ev=gtEvents();
const dr=stepDeltas().filter(x=>x.indexOf('DRAW')===0);
ok('B3 ★ 当時裁定 WIKI-D9392162D28D（09/01/28）: 《光帝クライス》で破壊 → ドローが入っても発動できる',
   tr==='idle' && zu(gt.uid)==='grave' && zu(ag.uid)==='mz'
   && ev.length===1 && ev[0].stamp < ev[0].now && dr.length>0
   && gtDrops().length===0,
   JSON.stringify({tr,gt:zu(gt.uid),ag:zu(ag.uid),deltas:stepDeltas(),ev}));
`, {expect:1});

harness(COMMON + String.raw`
/* WIKI-590A1789DD22（**2009-09-12**、《デュアルスパーク》）:「破壊とドローは同時ですか？」→「はい、同時です。」 */
fresh();
const gt=mk('歯車街',0,'up'); gameState.players[0].field=gt;
const ag=mk('古代の機械兵士',0); gameState.players[0].deck.splice(1,0,ag);
gameState.players[1].mz[0]=mk('E・HERO アナザー・ネオス',1,'up');
gameState.players[1].hand=[mk('デュアルスパーク',1)];
gameState.activePlayer=1; baselineA();
duelActivateFromHand(0);
const tr=drive();
const ev=gtEvents();
ok('B4 ★ 当時裁定 WIKI-590A1789DD22（09/09/12）: 《デュアルスパーク》で破壊 → ドローは同時なので発動できる',
   tr==='idle' && zu(gt.uid)==='grave' && zu(ag.uid)==='mz'
   && ev.length===1 && ev[0].stamp < ev[0].now && gtDrops().length===0,
   JSON.stringify({tr,gt:zu(gt.uid),ag:zu(ag.uid),deltas:stepDeltas(),ev}));
`, {expect:1});

harness(COMMON + String.raw`
/* 《大嵐》は魔法・罠を同時に破壊する。この組み合わせの当時裁定は**見つけていない**ので、
   ここでは「同時の破壊でも Action は 1 枚ずつで、刻みが最後の番号と一致しない」ことだけを記録する。 */
fresh();
const gt=mk('歯車街',0,'up'); gameState.players[0].field=gt;
gameState.players[0].sz[0]=mk('聖なるバリア －ミラーフォース－',0,'down');
const ag=mk('古代の機械兵士',0); gameState.players[0].deck.splice(1,0,ag);
gameState.players[1].hand=[mk('大嵐',1)];
gameState.activePlayer=1; baselineA();
duelActivateFromHand(0);
const tr=drive();
const ev=gtEvents();
const toGrave=stepDeltas().filter(x=>x.indexOf('FX_TO_GRAVE')===0);
ok('B5 ★ 《大嵐》の同時破壊でも墓地送りの Action は 1 枚ずつ進む（裁定は未確認。発動はできる）',
   tr==='idle' && zu(gt.uid)==='grave' && zu(ag.uid)==='mz'
   && toGrave.length===2 && ev.length===1 && ev[0].stamp < ev[0].now
   && gtDrops().length===0,
   JSON.stringify({tr,ag:zu(ag.uid),deltas:stepDeltas(),ev}));
`, {expect:1});

/* ===== C. 当時裁定の「逃す」側（まだ再現できていない＝未対応） ===== */
harness(COMMON + String.raw`
/* WIKI-1B4D52FCA757（**2010-08-11**、《グリフォンの羽根帚》）:
     「破壊後に回復の処理が挟まるので、タイミングを逃します。(10/08/11)」
   いまは (B-3) に墓地送りの種別が無く、(B-5) にも《歯車街》が無いので落ちない。
   **これは「逃さないという裁定が確定した」のではなく、未対応である。** 理由は D。 */
fresh();
const gt=mk('歯車街',0,'up'); gameState.players[0].field=gt;
const ag=mk('古代の機械兵士',0); gameState.players[0].deck.splice(1,0,ag);
gameState.players[0].hand=[mk('グリフォンの羽根帚',0)];
gameState.activePlayer=0; baselineA();
duelActivateFromHand(0);
const tr=drive();
const ev=gtEvents();
const lp=stepDeltas().filter(x=>x.indexOf('LP')===0);
ok('C1 ★ 未対応: WIKI-1B4D52FCA757（10/08/11）では逃すが、いまは発動できてしまう（回復の処理は実測で入っている）',
   tr==='idle' && zu(gt.uid)==='grave' && zu(ag.uid)==='mz'
   && lp.length===1 && ev.length===1 && ev[0].stamp < ev[0].now
   && gtDrops().length===0,
   JSON.stringify({tr,gt:zu(gt.uid),ag:zu(ag.uid),deltas:stepDeltas(),ev}));
`, {expect:1});

/* ===== D. (B-5) に《歯車街》を入れなかった理由 ===== */
harness('const ENG=' + JSON.stringify(SRC_S508['engine/1ZZX_missed_timing_s03.js']) + ';' + COMMON + String.raw`
fresh();
ok('D1 ★ (B-3) の種別表は S03-U506 のまま（onDestroy→D だけ。墓地送りを見るイベントは無い）',
   JSON.stringify(MISSED_TIMING_DESTROY_CLASS_S03)===JSON.stringify({onDestroy:'D'})
   && MISSED_TIMING_CLASSES_S03.destroyed===true
   && MISSED_TIMING_CLASSES_S03.summonSuccess===true
   && MISSED_TIMING_CLASSES_S03.flipSummonReverse===false,
   JSON.stringify({cls:MISSED_TIMING_DESTROY_CLASS_S03,flags:MISSED_TIMING_CLASSES_S03}));

ok('D2 ★ (B-5) の許可リストに《歯車街》は入れていない（S03-U506 の 45 枚 / 66 組のまま）',
   !MISSED_TIMING_CONFIRMED_S03['歯車街']
   && !!MISSED_TIMING_CONFIRMED_S03['スネーク・ホイッスル']
   && Object.keys(MISSED_TIMING_CONFIRMED_S03).length===45
   && Object.keys(MISSED_TIMING_CONFIRMED_S03)
        .reduce((n,k)=>n+MISSED_TIMING_CONFIRMED_S03[k].ev.length,0)===66,
   JSON.stringify({cards:Object.keys(MISSED_TIMING_CONFIRMED_S03).length,
     gear:!!MISSED_TIMING_CONFIRMED_S03['歯車街']}));

/* 入れたらどう壊れるか。エンジンのソースにも理由を残してある。 */
ok('D3 ★ 理由がエンジンと設計書に書いてある（R4 を墓地送りに当てると回答日つきの裁定 2 件が壊れる）',
   ENG.indexOf('S03-U508')>=0
   && ENG.indexOf('WIKI-D9392162D28D')>=0 && ENG.indexOf('WIKI-590A1789DD22')>=0,
   JSON.stringify({engHasU508:ENG.indexOf('S03-U508')>=0}));
`, {expect:3});

/* ===== E. negative control ===== */
harness(COMMON + String.raw`
/* S03-U506 で入れた破壊側は変えていない。《地砕き》で破壊された《スネーク・ホイッスル》は
   破壊だけで処理が終わるので落ちない — という U506 の形がそのままであることを確認する。 */
fresh();
const sw=mk('スネーク・ホイッスル',0,'up');
gameState.players[0].mz[0]=sw;
gameState.players[1].hand=[mk('地砕き',1)];
gameState.activePlayer=1; baselineA();
duelActivateFromHand(0);
const tr=drive();
ok('E1 ★ negative control: S03-U506 の破壊側（《スネーク・ホイッスル》）の挙動は変わっていない',
   tr==='idle' && zu(sw.uid)==='grave' && gtDrops().length===0,
   JSON.stringify({tr,sw:zu(sw.uid),drops:gtDrops(),deltas:stepDeltas()}));

/* 《歯車街》の①（リリース軽減）は触っていない。 */
fresh();
const gt=mk('歯車街',0,'up'); gameState.players[0].field=gt;
const giant=mk('古代の機械巨人',0);
gameState.players[0].hand=[giant];
gameState.players[0].mz[0]=mk('ワイト',0,'up');
gameState.players[0].mz[1]=mk('ワイト',0,'up');
baselineA();
const need=tributesNeeded(dbOf(giant),0);
ok('E2 ★ ①のリリース軽減は触っていない（レベル8 が 1 体のリリースで済む）',
   need===1, JSON.stringify({need}));
`, {expect:2});

/* ===== F. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S508) + ';' + String.raw`
const DES=S['docs/S03_MISSED_TIMING_DESIGN.md'], RUL=S['docs/S03_MISSED_TIMING_RULINGS.md'];
const REP=S['docs/S03_U508_REPORT.md'], CHK=S['tools/check.py'];
ok('F1 ★ 設計書に S03-U508 の段と、墓地送りを入れなかった理由が書かれている',
   DES.indexOf('S03-U508')>=0
   && DES.indexOf('同時として扱う処理が刻みを進める')>=0
   && DES.indexOf('5-a. 未対応')>=0, '');
ok('F2 ★ 裁定記録に S03-U508 節と裁定 ID が揃っている',
   RUL.indexOf('S03-U508')>=0
   && ['WIKI-1B4D52FCA757','WIKI-25B0FF09EA0C','WIKI-6045932924C7','WIKI-D9392162D28D',
       'WIKI-590A1789DD22','WIKI-CA554A0F5EEB','WIKI-3E0FB7F73F1E','WIKI-378544C74049',
       'WIKI-5818C64C44A1'].every(id=>RUL.indexOf(id)>=0), '');
ok('F3 ★ 報告書に、公開できる範囲と未対応の範囲が分けて書かれている',
   REP.indexOf('対応した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('WIKI-1B4D52FCA757')>=0, '');
ok('F4 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u508_geartown_destroyed_trigger.js')>=0, '');
`, {expect:4});
