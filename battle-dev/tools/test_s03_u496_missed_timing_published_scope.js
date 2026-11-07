/* S03-U496: 公開できる範囲の確定。網羅調査や召喚無効の開発には広げない。
   設計は docs/S03_MISSED_TIMING_DESIGN.md（3(B-5)、5 / 5-a #0 / 5-d、6）、
   当時裁定の本文は docs/S03_MISSED_TIMING_RULINGS.md。

   (B-2)(B-3) の「現行テキストの文言 ＋ 配線」で決まる候補は 290 組あったが、S03-U494 / U495 の照合で
   当時の根拠で裏付けられているのは一部だけだと分かった。本単位では、当時の根拠から
     ・任意性（当時裁定が「発動しない事は可能」と答えている、または当時テキストが「できる」）
     ・発動条件（「〜に成功した時」）
     ・例外が無いこと（強制でない／召喚無効でない／調整中でない／R5・R10 の宣言が無い／リバース効果でない）
   の 3 つを確認できた（カード, イベント, 効果）だけを落とす許可リスト
   `MISSED_TIMING_CONFIRMED_S03` を入れた。**許可リストに無いものは落とさない。**
   これは従来挙動（S03-U491 以前）の維持であって、「逃さないという裁定が確定した」のではない。

   本単位で固定すること（条件4）:
     B 確認済みの「逃す」      — 実経路で《E・HERO エアーマン》と《奈落の落とし穴》が逃す
     C 未確定には新制限を掛けない — 実経路で《電池メン－単四型》《魔導戦士 ブレイカー》は逃さない
     D negative control        — 許可リストから外すと落ちない／入れると落ちる
     E 強制誘発                — 許可リストより前に R1 で止まる
     F 効果単位                — 1 イベントに複数効果があるカードは、効果キーが一致しない限り落とさない
     G 保存・新しい VM での再開・Replay */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S496 = pathA.resolve(__dirname, '..');
const rdS496 = p => fsA.readFileSync(pathA.join(ROOT_S496, p), 'utf8');
const DESIGN_S496 = rdS496('docs/S03_MISSED_TIMING_DESIGN.md');
const RULINGS_S496 = rdS496('docs/S03_MISSED_TIMING_RULINGS.md');
const ENGINE_S496 = rdS496('engine/1ZZX_missed_timing_s03.js');

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cu(uid){const h=findCardByUid(uid);return h?h.card:null;}
let COLLECT=[], PTS=[], STEPS=[];
const EVS_S496=['onNormalSummon','onSpecialSummon','onFlip'];
const COLLECT_ORIG_S496=collectHandlers;
const POINT_ORIG_S496=pointResponsesV27;
const CHAINRESP_ORIG_S496=getChainResponsesV2;
const NEGATORS_ORIG_S496=summonNegatorsV2;
(function(){
  const f=collectHandlers;collectHandlers=function(n,e){const r=f.apply(this,arguments);
    COLLECT.push({ev:n,stamp:(e&&e.stepS03!=null)?e.stepS03:null,now:s(),names:r.map(x=>x.name)});return r;};
  const g=pointResponsesV27;pointResponsesV27=function(p,pl){const r=g.apply(this,arguments);
    PTS.push({kind:pl&&pl.kind,p:p,names:r.map(x=>x.db&&x.db.n)});return r;};
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{if(d===0)STEPS.push([(a&&a.type)||'?',b,s()]);}};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();COLLECT=[];PTS=[];STEPS=[];resetMissedTimingDropsS03();
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
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();COLLECT=[];PTS=[];STEPS=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function dropNames(){return MISSED_TIMING_DROPS_S03.map(d=>d.name).sort();}
function summonCollect(){return COLLECT.filter(c=>/^on(Normal|Special)Summon$/.test(c.ev)&&c.stamp!=null);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
/* p0 の sz[0]=《血の代償》（表側）、sz[1]=チェーン1で発動するカード。《血の代償》をチェーン2として積み、
   手札のモンスターを通常召喚する。召喚の後にチェーン1の処理が残るので刻みがずれる。
   p1 は前のターンに《奈落の落とし穴》を伏せている（attack 1500 以上の召喚に応答できる）。 */
function board(o){
  fresh();
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  const e=mk(o.chain1||'成金ゴブリン',0,'down');e.setTurn=gameState.turn-1;gameState.players[0].sz.push(e);
  const mon=mk(o.summon,0);
  gameState.players[0].hand=[mon];
  (o.hand||[]).forEach(n=>gameState.players[0].hand.push(mk(n,0)));
  const ocean=mk('E・HERO オーシャン',0);gameState.players[0].deck.splice(1,0,ocean);
  let abyss=null;
  if(o.abyss!==false){abyss=mk('奈落の落とし穴',1,'down');abyss.setTurn=gameState.turn-1;gameState.players[1].sz.push(abyss);}
  if(o.foeUp) gameState.players[1].mz=[mk(o.foeUp,1,'up')];
  baselineA();
  return {mon:mon.uid, ocean:ocean.uid, abyss:abyss?abyss.uid:null};
}
function stackTwo(){
  duelActivateFromZone(0,'sz',1);
  let g=0;while(pc()&&(gameState.chain||[]).length<1&&g++<8)__choicePickV49(0);
  const r=(getChainResponsesV2(0)||[]).find(x=>x.db.n==='血の代償');
  if(r) duelActivateResponseV2(0,r.zone,r.index);
  g=0;while(pc()&&(gameState.chain||[]).length<2&&g++<8)__choicePickV49(0);
  return (gameState.chain||[]).length;
}
/* 許可リストの中身を数える */
/* S03-U506: 許可リストは召喚成功の家族だけではなくなった（破壊が条件の誘発が 1 件入った）。
   この単位が公開した範囲は**召喚成功の家族**なので、そこを数える形に分けた。 */
function confirmedCountS496(only){
  const all=Object.keys(MISSED_TIMING_CONFIRMED_S03);
  const names=only ? all.filter(nm=>MISSED_TIMING_CONFIRMED_S03[nm].ev.some(e=>EVS_S496.indexOf(e)>=0)) : all;
  let pairs=0, a=0, b=0;
  names.forEach(nm=>{const d=MISSED_TIMING_CONFIRMED_S03[nm];
    pairs+=(only?d.ev.filter(e=>EVS_S496.indexOf(e)>=0).length:d.ev.length);
    if(d.basis==='A')a++;else if(d.basis==='B')b++;});
  return {cards:names.length, pairs, a, b, names:names.sort()};
}
/* 候補全件を、いまのエンジンの判定で数える */
function dropCensusS496(){
  const out={drop:0, keep:0, forced:0, negate:0, decl:0, dropPairs:[]};
  Object.keys(CARD_SCRIPTS).forEach(nm=>{
    const sc=CARD_SCRIPTS[nm]; if(!sc||!sc.passive) return;
    const evs=EVS_S496.filter(e=>typeof sc.passive[e]==='function');
    if(!evs.length) return;
    const effs=(sc.v4Unified&&typeof nativeEffectsV4==='function')?(nativeEffectsV4(nm)||[]):[];
    const perForced=ev=>{
      if(sc.forced) return true;
      const hit=effs.filter(e=>e&&Array.isArray(e.events)&&e.events.indexOf(ev)>=0);
      if(hit.length) return hit.some(e=>e.forced===true);
      if(typeof sc.forcedForEventS03==='function'){ try{ return !!sc.forcedForEventS03(ev,null); }catch(e){ return false; } }
      return false;
    };
    evs.forEach(ev=>{
      if(missedTimingDropS03({name:nm,eventName:ev,ctx:null,event:{flipSummon:true}},{stepS03:1,flipSummon:true})){
        out.drop++;out.dropPairs.push(nm+'@'+ev);return;}
      if(perForced(ev)){out.forced++;return;}
      if(sc.summonNegate){out.negate++;return;}
      if(missedTimingModeS03(nm)==='never'){out.decl++;return;}
      out.keep++;
    });
  });
  return out;
}
const BOTH_S496=['E・HERO エアーマン','奈落の落とし穴'].sort();
`;

/* ===== A. 許可リストの形と根拠（条件1・条件3） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S496) + ';const ENG=' + JSON.stringify(ENGINE_S496) + ';'
      + 'const RUL=' + JSON.stringify(RULINGS_S496) + ';' + COMMON + String.raw`
resetA();
const C=confirmedCountS496(true), CALL=confirmedCountS496(false);
/* A1 は S03-U506 で書き分けた。この単位が公開した**召喚成功の家族**は 44 枚 / 65 組のまま。
   表全体は S03-U506 が破壊の家族を 1 件足したので 45 枚 / 66 組になっている。 */
ok('A1 ★ 召喚成功の家族の許可リストは 44 枚 / 65 組のままで、根拠は A 10 枚 / B 34 枚。'
   +'表全体は S03-U506 の破壊の家族 1 件を含めて 45 枚 / 66 組',
   C.cards===44 && C.pairs===65 && C.a===10 && C.b===34
   && CALL.cards===45 && CALL.pairs===66 && CALL.a===11 && CALL.b===34,
   JSON.stringify({summon:{cards:C.cards,pairs:C.pairs,a:C.a,b:C.b},
     all:{cards:CALL.cards,pairs:CALL.pairs,a:CALL.a,b:CALL.b}}));
/* A2 は S03-U506 で ev の許す範囲を広げた（破壊の家族の onDestroy を足した）。
   裁定 ID が付いていること・抽出で引けることは変えていない。 */
ok('A2 ★ 各件に裁定 ID が付いていて、すべて裁定の抽出で引ける',
   CALL.names.every(nm=>{const d=MISSED_TIMING_CONFIRMED_S03[nm];
     return Array.isArray(d.ev) && d.ev.length>0
       && d.ev.every(e=>EVS_S496.concat(['onDestroy']).indexOf(e)>=0)
       && (d.basis==='A'||d.basis==='B')
       && Array.isArray(d.rulings) && d.rulings.length>0
       && d.rulings.every(r=>/^(WIKI|R1103)-/.test(r) && RUL.indexOf(r)>=0);}),
   JSON.stringify(CALL.names.filter(nm=>!MISSED_TIMING_CONFIRMED_S03[nm].rulings.every(r=>RUL.indexOf(r)>=0))));
ok('A3 ★ A の 10 枚は設計書の読解表に「採る」として、採らなかった 6 枚は理由付きで書かれている',
   ['E・HERO エアーマン','インフェルニティ・デーモン','奈落の落とし穴','激流葬','落とし穴',
    '真六武衆－カゲキ','宝玉獣 ルビー・カーバンクル','ブラック・ローズ・ドラゴン',
    '氷結界の龍 トリシューラ','神秘の代行者 アース']
     .every(nm=>MISSED_TIMING_CONFIRMED_S03[nm] && MISSED_TIMING_CONFIRMED_S03[nm].basis==='A')
   && ['ゴブリンドバーグ','ドラグニティ－ピルム','ドラグニティ－アキュリス','トライデント・ドラギオン',
       'フォーミュラ・シンクロン','昇華する魂'].every(nm=>!MISSED_TIMING_CONFIRMED_S03[nm])
   && DOC.indexOf('A の読解（採った／採らなかった）')>=0
   && DOC.indexOf('話は《歯車街》')>=0 && DOC.indexOf('自身の誘発について調整中')>=0,'');
ok('A4 ★ 許可リストに無いものは落とさない（従来挙動の維持であって裁定の確定ではない）ことが設計書に書かれている',
   DOC.indexOf('許可リストに無いものは落とさない')>=0
   && DOC.indexOf('「逃さないという裁定が確定した」のではない')>=0
   && DOC.indexOf('5-a. 未対応（S03-U496 時点')>=0
   && ENG.indexOf('S03-U491 以前の挙動を維持する')>=0,'');
const cen=dropCensusS496();
/* A5 は S03-U506 で比較の相手を「召喚成功の家族の許可リスト」に限った（census はこの 3 イベントしか見ない）。 */
ok('A5 ★ 候補 682 組のうち落とすのは 65 組だけで、召喚成功の家族の許可リストの組数と一致する（S03-U516/U520/U526/U530/U533/U536/U538 で各 1 組増）',
   cen.drop===65 && (cen.drop+cen.keep+cen.forced+cen.negate+cen.decl)===682
   && JSON.stringify(cen.dropPairs.map(x=>x.split('@')[0]).filter((v,i,a)=>a.indexOf(v)===i).sort())
      ===JSON.stringify(C.names),
   JSON.stringify({drop:cen.drop,keep:cen.keep,forced:cen.forced,negate:cen.negate,decl:cen.decl}));
ok('A6 ★ 設計書 5-d に、逃す組が 290 → 65 に減ったことと、戻していない確認済みの修正が書かれている',
   DOC.indexOf('5-d. S03-U496 で変わった判定')>=0
   && DOC.indexOf('**225 組**')>=0 && DOC.indexOf('290 → 65')>=0
   && DOC.indexOf('確認済みの修正は戻していない')>=0,'');
`, {expect:6});

/* ===== B. 確認済みの「逃す」 ─ 実経路（条件4） ===== */
harness(COMMON + String.raw`
const U=board({summon:'E・HERO エアーマン'});
const links=stackTwo();
drive();
ok('B1 前提: チェーン2の召喚の後にチェーン1の処理があり、刻みがずれている',
   links===2 && summonCollect().length===1 && summonCollect()[0].stamp<summonCollect()[0].now,
   JSON.stringify({links,collect:summonCollect().map(c=>[c.stamp,c.now])}));
ok('B2 ★ 許可リストにある《E・HERO エアーマン》と《奈落の落とし穴》は当時裁定どおり逃す',
   JSON.stringify(dropNames())===JSON.stringify(BOTH_S496)
   && zu(U.ocean)==='deck' && zu(U.mon)==='mz'
   && MISSED_TIMING_CONFIRMED_S03['E・HERO エアーマン'].basis==='A'
   && MISSED_TIMING_CONFIRMED_S03['奈落の落とし穴'].basis==='A',
   JSON.stringify({drops:dropNames(),ocean:zu(U.ocean),mon:zu(U.mon)}));
ok('B2 ★ 落としたのは召喚成功の応答だけ — 一般の応答機会（POINT 窓）は開いている',
   PTS.some(x=>x.p===0&&(x.names||[]).indexOf('血の代償')>=0),
   JSON.stringify(PTS.map(x=>[x.kind,x.p,x.names])).slice(0,200));
audit('B2');
`, {expect:4});

/* ===== C. 未確定には新しい制限を掛けない ─ 実経路（条件2） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S496) + ';' + COMMON + String.raw`
let U=board({summon:'電池メン－単四型', hand:['電池メン－単四型'], abyss:false});
let links=stackTwo();
drive();
ok('C1 ★ 機械分類だけの《電池メン－単四型》は、句は読めても落とさない（S03-U496 で公開範囲外）',
   links===2 && summonCollect()[0].stamp<summonCollect()[0].now
   && missedTimingClassS03({name:'電池メン－単四型',eventName:'onNormalSummon',ctx:null,event:{}},{})==='summonSuccess'
   && !MISSED_TIMING_CONFIRMED_S03['電池メン－単四型']
   && dropNames().length===0 && gameState.players[0].mz.length===2,
   JSON.stringify({drops:dropNames(),mz:gameState.players[0].mz.length}));
U=board({summon:'魔導戦士 ブレイカー'});
links=stackTwo();
drive();
ok('C2 ★ 「場合」の《魔導戦士 ブレイカー》も落とさず魔力カウンターを置く（R7。《奈落の落とし穴》だけが逃す）',
   JSON.stringify(dropNames())===JSON.stringify(['奈落の落とし穴'])
   && (cu(U.mon).counters||{})['魔力']===1,
   JSON.stringify({drops:dropNames(),counters:cu(U.mon).counters}));
resetA();
gameState.procStepS03=9;
ok('C3 ★ 強制と読めるのに落ちていた 30 枚も、R8 の 7 枚も、宣言の 7 枚も落とさない',
   ['カラクリ商人 壱七七','ものマネ幻想師','スカラベの大群','コアキメイル・ルークロード','赤鬼']
     .every(nm=>EVS_S496.every(ev=>{const sc=CARD_SCRIPTS[nm];
       return !sc.passive[ev] || missedTimingDropS03({name:nm,eventName:ev,ctx:null,event:{flipSummon:true}},{stepS03:3,flipSummon:true})===false;}))
   && ['スノーマンイーター','ペンギン・ナイトメア','不死王リッチー','渋い忍者','裏ガエル','魔轟神獣ペガラサス']
     .every(nm=>missedTimingDropS03({name:nm,eventName:'onFlip',ctx:null,event:{flipSummon:true}},{stepS03:3,flipSummon:true})===false)
   && ['サイコ・エンペラー','スノーマンイーター','バーニング・スカルヘッド','リチュア・チェイン','炎帝近衛兵',
       '素早いビッグハムスター','運命のドラ'].every(nm=>missedTimingModeS03(nm)==='never'),'');
ok('C4 ★ 設計書 5-a #0 に、許可リスト外の 225 組が未対応であり裁定の確定ではないと書かれている',
   DOC.indexOf('| **0** |')>=0
   && DOC.indexOf('これは「逃さない」という裁定が確定したという意味ではない')>=0
   && DOC.indexOf('従来挙動（S03-U491 以前）を維持しているだけ')>=0,'');
`, {expect:4});

/* ===== D. negative control（条件4） ===== */
harness(COMMON + String.raw`
const keepAir=MISSED_TIMING_CONFIRMED_S03['E・HERO エアーマン'];
delete MISSED_TIMING_CONFIRMED_S03['E・HERO エアーマン'];
let U=board({summon:'E・HERO エアーマン'});
stackTwo();
drive();
const d1={drops:dropNames(), ocean:zu(U.ocean)};
MISSED_TIMING_CONFIRMED_S03['E・HERO エアーマン']=keepAir;
ok('D1 ★ negative control: 許可リストから外すと、同じ盤面で逃さなくなりサーチが通る',
   JSON.stringify(d1.drops)===JSON.stringify(['奈落の落とし穴']) && d1.ocean==='hand',
   JSON.stringify(d1));
U=board({summon:'E・HERO エアーマン'});
stackTwo();
drive();
ok('D1 ★ 戻すと元どおり両方とも逃す',
   JSON.stringify(dropNames())===JSON.stringify(BOTH_S496) && zu(U.ocean)==='deck',
   JSON.stringify({drops:dropNames(),ocean:zu(U.ocean)}));
MISSED_TIMING_CONFIRMED_S03['魔導戦士 ブレイカー']={ev:['onNormalSummon'],basis:'TEST',rulings:[]};
U=board({summon:'魔導戦士 ブレイカー'});
stackTwo();
drive();
const d2={drops:dropNames(), counters:(cu(U.mon)||{}).counters};
delete MISSED_TIMING_CONFIRMED_S03['魔導戦士 ブレイカー'];
ok('D2 ★ negative control: 許可リストに入れても (B-2) の文言判定（「場合」）が止めるので落ちない',
   JSON.stringify(d2.drops)===JSON.stringify(['奈落の落とし穴']) && (d2.counters||{})['魔力']===1,
   JSON.stringify(d2));
MISSED_TIMING_CONFIRMED_S03['電池メン－単四型']={ev:['onNormalSummon'],basis:'TEST',rulings:[]};
U=board({summon:'電池メン－単四型', hand:['電池メン－単四型'], abyss:false});
stackTwo();
drive();
const d3={drops:dropNames(), mz:gameState.players[0].mz.length};
delete MISSED_TIMING_CONFIRMED_S03['電池メン－単四型'];
ok('D3 ★ negative control: 文言も配線も満たすカードを許可リストに入れると落ちる（止めているのは許可リストだと分かる）',
   JSON.stringify(d3.drops)===JSON.stringify(['電池メン－単四型']) && d3.mz===1,
   JSON.stringify(d3));
`, {expect:4});

/* ===== E. 強制誘発（条件4） ===== */
harness(COMMON + String.raw`
const U=board({summon:'ワイト', foeUp:'王虎ワンフー', abyss:false});
const links=stackTwo();
drive();
ok('E1 ★ 強制誘発の《王虎ワンフー》は許可リストに無くても逃さず、攻撃力 1000 以下の召喚を破壊する',
   links===2 && !MISSED_TIMING_CONFIRMED_S03['王虎ワンフー']
   && dropNames().length===0 && zu(U.mon)==='grave',
   JSON.stringify({drops:dropNames(),mon:zu(U.mon)}));
resetA();
gameState.procStepS03=9;
MISSED_TIMING_CONFIRMED_S03['王虎ワンフー']={ev:['onNormalSummon','onSpecialSummon'],basis:'TEST',rulings:[]};
const forcedStill=missedTimingDropS03({name:'王虎ワンフー',eventName:'onNormalSummon',ctx:null,event:{}},{stepS03:3});
delete MISSED_TIMING_CONFIRMED_S03['王虎ワンフー'];
ok('E1 ★ 許可リストに入れても R1（強制）が先に止める — 判定の順番が変わっていない',
   forcedStill===false
   && /triggerCandidateForcedS03\(cand\)\) return false/.test(String(missedTimingDropS03))
   && String(missedTimingDropS03).indexOf('triggerCandidateForcedS03')
      < String(missedTimingDropS03).indexOf('missedTimingConfirmedS03'),
   JSON.stringify({forcedStill}));
ok('E2 ★ 召喚無効の 6 枚は許可リストにも無く、落とさない（本機構の対象外のまま）',
   ['エレキャンセル','キックバック','ライト・バニッシュ','神の宣告','神の警告','重力崩壊'].every(nm=>
     !MISSED_TIMING_CONFIRMED_S03[nm]
     && missedTimingDropS03({name:nm,eventName:'onNormalSummon',ctx:null,event:{}},{stepS03:3})===false),'');
ok('E3 ★ 判定は collectHandlers の 1 箇所のまま — 召喚無効の窓・優先権の窓には入っていない',
   /filterMissedTimingS03\(out, *evt\|\|\{\}\)/.test(String(COLLECT_ORIG_S496))
   && !/issedTiming/.test(String(NEGATORS_ORIG_S496))
   && !/issedTiming/.test(String(POINT_ORIG_S496))
   && !/issedTiming/.test(String(CHAINRESP_ORIG_S496)),'');
`, {expect:4});

/* ===== F. 効果単位の管理（条件3） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S496) + ';' + COMMON + String.raw`
resetA();
gameState.procStepS03=9;
const NM='アルカナフォースIII－THE EMPRESS';
const keys=(nativeEffectsV4(NM)||[]).filter(e=>(e.events||[]).indexOf('onNormalSummon')>=0).map(e=>e.key);
ok('F1 ★ 1 つのイベントに複数の効果が配線されているカードが実測で 1 枚あり、許可リストに入れていない',
   JSON.stringify(keys)===JSON.stringify(['coin','heads-summon','tails-discard'])
   && missedTimingEffectCountS03(NM,'onNormalSummon')===3
   && !MISSED_TIMING_CONFIRMED_S03[NM]
   && DOC.indexOf('アルカナフォースIII－THE EMPRESS')>=0
   && DOC.indexOf('効果単位で管理する（条件3）')>=0,
   JSON.stringify(keys));
const cand=key=>({name:NM,eventName:'onNormalSummon',ctx:key?{v4EffectKey:key}:null,event:{}});
MISSED_TIMING_CONFIRMED_S03[NM]={ev:['onNormalSummon'],basis:'TEST',rulings:[]};
const noKeys=missedTimingConfirmedS03(cand('coin'),{});
MISSED_TIMING_CONFIRMED_S03[NM]={ev:['onNormalSummon'],basis:'TEST',rulings:[],keys:{onNormalSummon:['heads-summon']}};
const wrong=missedTimingConfirmedS03(cand('coin'),{});
const right=missedTimingConfirmedS03(cand('heads-summon'),{});
const unknown=missedTimingConfirmedS03(cand(null),{});
delete MISSED_TIMING_CONFIRMED_S03[NM];
ok('F2 ★ 複数効果のイベントでは、効果キーを名指ししていない許可は無効（落とさない）',
   noKeys===false, JSON.stringify({noKeys}));
ok('F3 ★ 効果キーが一致した候補だけが許可される（別の効果・不明な効果は落とさない）',
   right===true && wrong===false && unknown===false,
   JSON.stringify({right,wrong,unknown}));
ok('F4 ★ 1 効果だけのイベントは効果キーを要求しない（《E・HERO エアーマン》で確認）',
   missedTimingEffectCountS03('E・HERO エアーマン','onNormalSummon')<=1
   && missedTimingConfirmedS03({name:'E・HERO エアーマン',eventName:'onNormalSummon',ctx:null,event:{}},{})===true
   && missedTimingConfirmedS03({name:'E・HERO エアーマン',eventName:'onFlip',ctx:null,event:{}},{})===false,'');
`, {expect:4});

/* ===== G-1. 保存（新しい VM に渡す） ===== */
const ctxG = harness(COMMON + String.raw`
const U=board({summon:'E・HERO エアーマン'});
const links=stackTwo();
globalThis.__SAVED_S496=savedRaw();
globalThis.__AT_SAVE_S496=JSON.stringify({links, step:s(), drops:dropNames()});
drive();
globalThis.__WANT_S496=JSON.stringify({drops:dropNames(), step:s(), ocean:zu(U.ocean), mon:zu(U.mon),
  digest:v41StateDigest(gameState)});
ok('G1 前提: チェーン2本を積んだ窓で保存でき、保存なしの解決では公開範囲の 2 枚が逃す',
   links===2 && JSON.stringify(dropNames())===JSON.stringify(BOTH_S496)
   && (globalThis.__SAVED_S496||'').length>0,
   globalThis.__WANT_S496);
ok('G1 ★ 許可リストは状態ではないので、保存データにも digest にも出ない',
   (globalThis.__SAVED_S496||'').indexOf('CONFIRMED')<0
   && (globalThis.__SAVED_S496||'').indexOf('missedTiming')<0
   && (globalThis.__SAVED_S496||'').indexOf('procStepS03')>=0,'');
`, {expect:2});

/* ===== G-2. 新しい VM で再開 ===== */
harness('const SAVED=' + JSON.stringify(ctxG.__SAVED_S496 || '') + ';'
      + 'const WANT=' + (ctxG.__WANT_S496 || 'null') + ';'
      + 'const AT=' + (ctxG.__AT_SAVE_S496 || 'null') + ';' + COMMON + String.raw`
const okLoad=loadInto(SAVED);
const at={links:(gameState.chain||[]).length, step:s(), drops:dropNames()};
ok('G2 前提: 別の VM で保存データから再開でき、チェーン・刻み・落とし方が保存時のまま戻っている',
   okLoad===true && JSON.stringify(at)===JSON.stringify(AT),
   JSON.stringify({okLoad,at,AT}));
const air=(gameState.players[0].hand||[]).concat(gameState.players[0].mz||[])
  .find(c=>c&&dbOf(c).n==='E・HERO エアーマン');
const ocean=(gameState.players[0].deck||[]).find(c=>dbOf(c).n==='E・HERO オーシャン');
drive();
const got={drops:dropNames(), step:s(), ocean:zu(ocean.uid), mon:zu(air.uid),
  digest:v41StateDigest(gameState)};
ok('G2 ★ 新しい VM での再開後の解決が、保存なしの解決と同じ落とし方・同じ刻み・同じ最終 digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('G2');
`, {expect:3});

/* ===== H. 文書（条件1・条件2） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S496) + ';const ENG=' + JSON.stringify(ENGINE_S496) + ';'
      + COMMON + String.raw`
ok('H1 ★ 設計書 3(B-5) に、確認の 3 要件（任意性・発動条件・例外）と 2 つの根拠の取り方が書かれている',
   DOC.indexOf('(B-5) 公開範囲の許可リスト')>=0
   && DOC.indexOf('**任意性**')>=0 && DOC.indexOf('**発動条件**')>=0 && DOC.indexOf('**例外が無いこと**')>=0
   && DOC.indexOf('**10 枚**')>=0 && DOC.indexOf('**34 枚**')>=0
   && DOC.indexOf('44 枚 / 65 組')>=0,'');
ok('H2 ★ engine にも同じ 3 要件と「許可リストに無いものは落とさない」ことが書かれている',
   ENG.indexOf('MISSED_TIMING_CONFIRMED_S03')>=0
   && ENG.indexOf('任意性')>=0 && ENG.indexOf('発動条件')>=0 && ENG.indexOf('例外が無いこと')>=0
   && ENG.indexOf('ここに無いものは落とさない')>=0,'');
ok('H3 ★ §6 に S03-U496 で採らなかった案（文言だけで落とし続ける・未確定を宣言表に書く・カード名だけの許可リスト）が書かれている',
   DOC.indexOf('採らない案（S03-U496 で足した分）')>=0
   && DOC.indexOf('文言と配線だけで落とし続ける')>=0
   && DOC.indexOf('未確定のカードを「逃さない」と宣言表に書く')>=0
   && DOC.indexOf('許可リストをカード名だけで持つ')>=0,'');
ok('H4 ★ 段階表に S03-U496 の完了分と、未対応が S03-U497 以降として分けて書かれている',
   DOC.indexOf('**S03-U496（完了）**')>=0 && DOC.indexOf('S03-U497 以降（**未対応**）')>=0
   && DOC.indexOf('全体は完成していない')>=0,'');
`, {expect:4});
