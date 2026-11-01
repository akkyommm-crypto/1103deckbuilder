/* S03-U495: 当時裁定の引き方を直してからの再照合。召喚無効には広げない。
   設計は docs/S03_MISSED_TIMING_DESIGN.md（1 の R4 / R10、3(B-1) / 3(B-4)、5 / 5-a / 5-c、6）、
   当時裁定の本文は docs/S03_MISSED_TIMING_RULINGS.md（末尾の「S03-U495 で追加参照した当時裁定」）。

   S03-U494 はカード名を裁定 DB の `cards` 欄だけで突き合わせていた。`cards` は**裁定が載っている
   Wiki ページの名前**であって問われているカードとは限らないので、本文で名前が挙がるだけの裁定が
   見えていなかった。その結果、この機能の土台そのものの裁定を「裏付けなし」に数えていた:
     WIKI-9FC5B41EDCF4 / WIKI-0B439F71B94A … 《E・HERO エアーマン》の話だが cards=['ゴブリンドバーグ']
     WIKI-2B88D7C8D921                     … 《落とし穴》の話だが cards=['血の代償']

   引き方を直して見つかった当時裁定:
     WIKI-97F65A6DBC45  取得 2011-08-28  《命の綱》
       Q:「攻撃力を上昇させる効果は別個にチェーンブロックを作りますか？」
       A:「いいえ、別個にチェーンブロックを作りません。《Ｅ・ＨＥＲＯ エアーマン》等はタイミングを逃しません。」
       → R4 の追加の根拠。1 回の効果処理の中の特殊召喚＋攻撃力上昇では逃さない。
         S03-U493 で MOD_ADD を「処理」として数えたので、壊れていないか実経路で測る（B）。
     WIKI-FB3F368EA14D  回答日 2009-12-08  《運命のドラ》
       Q:「ダメージを与える効果はチェーンブロックを作りますか？」A:「いいえ、作りません。」
       → R10。発動ではないので逃すこともない（C）。
     WIKI-BF90C54E0677  回答日 2009-03-07  《剣闘獣ガイザレス》
       Q:「特殊召喚に成功した時に効果を発動しない事は可能ですか？」A:「はい、可能です。…」
       → 落としている側（任意誘発＋「時」）の裏付けが取れた 1 例（D）。 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S495 = pathA.resolve(__dirname, '..');
const rdS495 = p => fsA.readFileSync(pathA.join(ROOT_S495, p), 'utf8');
const DESIGN_S495 = rdS495('docs/S03_MISSED_TIMING_DESIGN.md');
const RULINGS_S495 = rdS495('docs/S03_MISSED_TIMING_RULINGS.md');
const ENGINE_S495 = rdS495('engine/1ZZX_missed_timing_s03.js');

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cu(uid){const h=findCardByUid(uid);return h?h.card:null;}
let COLLECT=[], PTS=[], STEPS=[];
const EVS_S495=['onNormalSummon','onSpecialSummon','onFlip'];
const COLLECT_ORIG_S495=collectHandlers;
const POINT_ORIG_S495=pointResponsesV27;
const CHAINRESP_ORIG_S495=getChainResponsesV2;
const NEGATORS_ORIG_S495=summonNegatorsV2;
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
function fresh(turnPlayer){resetA();resetVolatile();COLLECT=[];PTS=[];STEPS=[];resetMissedTimingDropsS03();
  gameState.activePlayer=(turnPlayer==null?0:turnPlayer);gameState.firstPlayer=0;
  gameState.turn=6;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4951011;
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
function moved(){return STEPS.filter(x=>x[1]!==x[2]);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}

/* --- 盤面 R4（WIKI-97F65A6DBC45）---
   p1 のターン。p1 の《青眼の白龍》が p0 の《E・HERO エアーマン》を攻撃して戦闘破壊する。
   p0 は《命の綱》を発動し、手札を全て捨てて、そのエアーマンを攻撃力 800 アップで特殊召喚する。
   特殊召喚と攻撃力の上昇は 1 回の効果処理の中なので、当時裁定ではエアーマンは**逃さない**。 */
function ropeBoard(){
  fresh(1);
  gameState.phase='battle';          /* doAttack は実戦と同じバトルフェイズから入る */
  const air=mk('E・HERO エアーマン',0,'up');
  const foe=mk('青眼の白龍',1,'up');
  const rope=mk('命の綱',0,'down');rope.setTurn=gameState.turn-1;
  gameState.players[0].mz=[air];
  gameState.players[1].mz=[foe];
  gameState.players[0].sz=[rope];
  gameState.players[0].hand=[mk('ワイト',0)];
  const ocean=mk('E・HERO オーシャン',0);gameState.players[0].deck.splice(1,0,ocean);
  baselineA();
  return {air:air.uid, ocean:ocean.uid, rope:rope.uid};
}
/* --- 盤面 比較（WIKI-9FC5B41EDCF4）---
   同じ《E・HERO エアーマン》が、特殊召喚の**後に別の処理**（守備表示になる）が入る経路では逃す。 */
function gobBoard(){
  fresh(0);
  const gob=mk('ゴブリンドバーグ',0), air=mk('E・HERO エアーマン',0);
  gameState.players[0].hand=[gob,air];
  const ocean=mk('E・HERO オーシャン',0);gameState.players[0].deck.splice(1,0,ocean);
  baselineA();
  return {gob:gob.uid, air:air.uid, ocean:ocean.uid};
}
/* --- 盤面 R10（《運命のドラ》）--- チェーン2で通常召喚し、チェーン1の処理が後に続く。 */
function doraBoard(){
  fresh(0);
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  const e=mk('成金ゴブリン',0,'down');e.setTurn=gameState.turn-1;gameState.players[0].sz.push(e);
  gameState.players[0].sz.push(mk('運命のドラ',0,'up'));
  gameState.players[0].effectFlags['v7DoraLevel']=2;
  const mon=mk('ワイト',0);gameState.players[0].hand=[mon];
  baselineA();
  return {mon:mon.uid};
}
function stackTwo(index){
  duelActivateFromZone(0,'sz',index);
  let g=0;while(pc()&&(gameState.chain||[]).length<1&&g++<8)__choicePickV49(0);
  const r=(getChainResponsesV2(0)||[]).find(x=>x.db.n==='血の代償');
  if(r) duelActivateResponseV2(0,r.zone,r.index);
  g=0;while(pc()&&(gameState.chain||[]).length<2&&g++<8)__choicePickV49(0);
  return (gameState.chain||[]).length;
}
const DECL_S495=['サイコ・エンペラー','スノーマンイーター','バーニング・スカルヘッド','リチュア・チェイン',
  '炎帝近衛兵','素早いビッグハムスター','運命のドラ'].sort();
`;

/* ===== A. 引き方の訂正と R10 の記録（条件1・条件4） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S495) + ';const ENG=' + JSON.stringify(ENGINE_S495) + ';'
      + 'const RUL=' + JSON.stringify(RULINGS_S495) + ';' + COMMON + String.raw`
ok('A1 ★ 設計書に、裁定 DB を cards 欄だけで引いていた誤りと、見落としていた 3 件が書かれている',
   DOC.indexOf('欄だけで突き合わせていた')>=0
   && DOC.indexOf('裁定が載っている Wiki ページの名前')>=0
   && DOC.indexOf('WIKI-9FC5B41EDCF4')>=0 && DOC.indexOf('WIKI-0B439F71B94A')>=0
   && DOC.indexOf('WIKI-2B88D7C8D921')>=0
   && DOC.indexOf('この機能の土台そのものの裁定を「裏付けなし」に数えていた')>=0,'');
ok('A2 ★ 部分一致を使わない理由（《奈落の落とし穴》の中の「落とし穴」）が書かれている',
   DOC.indexOf('部分一致は使わない')>=0 && DOC.indexOf('奈落の落とし穴》の中の')>=0
   && RUL.indexOf('部分一致は使わない')>=0,'');
ok('A3 ★ 共名を機械的に数えない理由（WIKI-5BD9F5131D7A）が、読んだ結果付きで書かれている',
   DOC.indexOf('WIKI-5BD9F5131D7A')>=0 && DOC.indexOf('共名だけ')>=0
   && DOC.indexOf('宝玉獣 ルビー・カーバンクル》の効果')>=0
   && RUL.indexOf('WIKI-5BD9F5131D7A')>=0,'');
ok('A4 ★ R10（チェーンブロックを作らない効果は発動ではない）が規則表と engine に根拠付きで入っている',
   DOC.indexOf('| R10 |')>=0 && DOC.indexOf('WIKI-FB3F368EA14D')>=0
   && DOC.indexOf('WIKI-6C6CE6145A4A')>=0 && DOC.indexOf('WIKI-5E8A1950B9D5')>=0
   && ENG.indexOf('R10')>=0 && ENG.indexOf('WIKI-FB3F368EA14D')>=0
   && RUL.indexOf('WIKI-FB3F368EA14D')>=0,'');
ok('A5 ★ R4 に WIKI-97F65A6DBC45 の根拠が足されている',
   DOC.indexOf('WIKI-97F65A6DBC45')>=0 && RUL.indexOf('WIKI-97F65A6DBC45')>=0
   && RUL.indexOf('《Ｅ・ＨＥＲＯ エアーマン》等はタイミングを逃しません')>=0,'');
ok('A6 ★ 宣言表は 7 件すべて never で、裁定 ID が engine・設計書・裁定の抽出に揃っている',
   JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03).sort())===JSON.stringify(DECL_S495)
   && DECL_S495.every(nm=>MISSED_TIMING_DECL_S03[nm].mode==='never')
   && DECL_S495.every(nm=>{const id=MISSED_TIMING_DECL_S03[nm].ruling;
        return /^(WIKI|R1103)-/.test(id) && RUL.indexOf(id)>=0 && DOC.indexOf(id)>=0;}),
   JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03)));
`, {expect:6});

/* ===== B. R4 の実測 ─ 1 解決の中の攻撃力上昇では逃さない（条件1・条件3） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S495) + ';' + COMMON + String.raw`
let U=ropeBoard();
doAttack(1,0,0);
drive();
ok('B1 前提: 《E・HERO エアーマン》が戦闘破壊されて墓地にあり、処理番号が進んでいる',
   zu(U.air)==='grave' && s()>0 && gameState.players[0].lp===6800,
   JSON.stringify({air:zu(U.air),step:s(),lp:gameState.players[0].lp}));
COLLECT=[];STEPS=[];resetMissedTimingDropsS03();
duelActivateFromZone(0,'sz',0);
let g=0;while(pc()&&g++<12)__choicePickV49(0);
drive();
const sc=summonCollect();
ok('B2 前提: 1 回の効果処理の中で、特殊召喚（FX_SPECIAL_SUMMON）の後に攻撃力の上昇（MOD_ADD）がある',
   moved().some(x=>x[0]==='FX_SPECIAL_SUMMON') && moved().some(x=>x[0]==='MOD_ADD')
   && moved().findIndex(x=>x[0]==='FX_SPECIAL_SUMMON')<moved().findIndex(x=>x[0]==='MOD_ADD'),
   JSON.stringify(moved()));
ok('B3 ★ 当時裁定どおり（WIKI-97F65A6DBC45）、特殊召喚されたエアーマンはタイミングを逃さずサーチできる',
   sc.length===1 && sc[0].stamp===sc[0].now && sc[0].names.indexOf('E・HERO エアーマン')>=0
   && dropNames().length===0 && zu(U.air)==='mz' && zu(U.ocean)==='hand',
   JSON.stringify({collect:sc.map(c=>[c.stamp,c.now,c.names]),drops:dropNames(),ocean:zu(U.ocean)}));
ok('B3 ★ 攻撃力は上がっている（攻撃力の変化そのものは S03-U493 どおり「処理」として数えている）',
   (cu(U.air).mods||[]).length===1 && moved().some(x=>x[0]==='MOD_ADD'&&x[1]!==x[2]),
   JSON.stringify({mods:(cu(U.air).mods||[]).length}));
audit('B3');
/* 同じカードでの対比。特殊召喚の後に別の処理が入る経路（WIKI-9FC5B41EDCF4）では逃す。 */
U=gobBoard();
doNormalSummon(0,'atk');
drive();
const sc2=summonCollect().filter(c=>c.ev==='onSpecialSummon');
ok('B4 ★ 対比: 同じエアーマンでも、特殊召喚の後に「守備表示になる」別の処理が入る経路では逃す（WIKI-9FC5B41EDCF4）',
   sc2.length===1 && sc2[0].stamp!==sc2[0].now
   && JSON.stringify(dropNames())===JSON.stringify(['E・HERO エアーマン'])
   && zu(U.ocean)==='deck' && zu(U.air)==='mz',
   JSON.stringify({collect:sc2.map(c=>[c.stamp,c.now]),drops:dropNames(),ocean:zu(U.ocean)}));
ok('B5 ★ 設計書に、この 2 経路が同じカードで対になることと、R4 の根拠が書かれている',
   DOC.indexOf('WIKI-97F65A6DBC45')>=0 && DOC.indexOf('flushResolutionSummonBatchV2')>=0
   && DOC.indexOf('壊れていない')>=0,'');
`, {expect:7});

/* ===== C. R10 ─ 《運命のドラ》（条件3） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S495) + ';' + COMMON + String.raw`
resetA();
gameState.procStepS03=9;
const cand={name:'運命のドラ',eventName:'onNormalSummon',ctx:null,event:{}};
ok('C1 ★ 《運命のドラ》は R10 の宣言で落とさない。文言と配線だけなら種別には当てはまる',
   missedTimingModeS03('運命のドラ')==='never'
   && MISSED_TIMING_DECL_S03['運命のドラ'].ruling==='WIKI-FB3F368EA14D'
   && missedTimingClassS03(cand,{})==='summonSuccess'
   && missedTimingTextKindS03('運命のドラ').n==='toki'
   && missedTimingDropS03(cand,{stepS03:3})===false,'');
const keep=MISSED_TIMING_DECL_S03['運命のドラ'];
delete MISSED_TIMING_DECL_S03['運命のドラ'];
const without=missedTimingDropS03(cand,{stepS03:3});
MISSED_TIMING_DECL_S03['運命のドラ']=keep;
ok('C2 ★ negative control: 宣言を外すと、刻みがずれた候補として落ちる（S03-U494 までの挙動）',
   without===true && missedTimingDropS03(cand,{stepS03:3})===false,
   JSON.stringify({without}));
/* 実経路。通常罠なので解決後は墓地へ行き、魔法・罠ゾーンからの誘発効果は発火しない。 */
const U=doraBoard();
const links=stackTwo(1);
drive();
const nc=COLLECT.filter(c=>c.ev==='onNormalSummon'&&c.stamp!=null);
ok('C3 ★ 実経路ではこの誘発は候補に出ない（通常罠なので魔法・罠ゾーンに残らない）— 分類だけを当時裁定に合わせた',
   links===2 && nc.length===1 && nc[0].stamp!==nc[0].now
   && nc[0].names.indexOf('運命のドラ')<0 && dropNames().length===0,
   JSON.stringify({links,collect:nc.map(c=>[c.stamp,c.now,c.names]),drops:dropNames()}));
ok('C4 ★ 設計書 5-c に「分類のみ・対局の挙動は変わらない」ことと、5-a #9 にモデル化の未対応が書かれている',
   DOC.indexOf('5-c. S03-U495 で変わった判定')>=0
   && DOC.indexOf('実経路では発火しない')>=0
   && DOC.indexOf('対局の挙動は変わらない')>=0
   && DOC.indexOf('カードのモデル化は直していない')>=0,'');
`, {expect:4});

/* ===== D. 落としている側の裏付け ─ 《剣闘獣ガイザレス》（条件1・条件4） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S495) + ';const RUL=' + JSON.stringify(RULINGS_S495) + ';'
      + COMMON + String.raw`
resetA();
gameState.procStepS03=9;
const cand={name:'剣闘獣ガイザレス',eventName:'onSpecialSummon',ctx:null,event:{}};
ok('D1 ★ 《剣闘獣ガイザレス》は「特殊召喚に成功した時」の任意誘発として落とす（当時裁定 WIKI-BF90C54E0677 と一致）',
   missedTimingTextKindS03('剣闘獣ガイザレス').s==='toki'
   && missedTimingClassS03(cand,{})==='summonSuccess'
   && missedTimingModeS03('剣闘獣ガイザレス')===null
   && missedTimingDropS03(cand,{stepS03:3})===true,'');
ok('D2 ★ その任意性が当時裁定で確認できることが、裁定の抽出と設計書に書かれている',
   RUL.indexOf('WIKI-BF90C54E0677')>=0
   && RUL.indexOf('特殊召喚に成功した時に効果を発動しない事は可能ですか')>=0
   && RUL.indexOf('WIKI-EEDA9657DB7D')>=0
   && DOC.indexOf('WIKI-BF90C54E0677')>=0
   && DOC.indexOf('任意誘発 ＋ 「時」＝逃す')>=0,'');
ok('D3 ★ 「場合」側でも当時の文言が確認できた 1 枚（《夜霧のスナイパー》）が記録されている',
   RUL.indexOf('WIKI-B895E2D9130F')>=0 && DOC.indexOf('夜霧のスナイパー')>=0
   && missedTimingTextKindS03('夜霧のスナイパー').r==='baai'
   && missedTimingDropS03({name:'夜霧のスナイパー',eventName:'onNormalSummon',ctx:null,event:{}},{stepS03:3})===false,'');
`, {expect:3});

/* ===== E. 区分と裏付けの数え直し（条件4） ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S495) + ';' + COMMON + String.raw`
resetA();
const B={forced:[],summonNegate:[],decl:[],drop:[],baai:[],none:[]};
const P={forced:0,negate:0,decl:0,drop:0,baai:0,none:0};
Object.keys(CARD_SCRIPTS).forEach(nm=>{
  const sc=CARD_SCRIPTS[nm]; if(!sc||!sc.passive) return;
  const evs=EVS_S495.filter(e=>typeof sc.passive[e]==='function');
  if(!evs.length) return;
  const effs=(sc.v4Unified&&typeof nativeEffectsV4==='function')?(nativeEffectsV4(nm)||[]):[];
  const statForced=!!sc.forced||typeof sc.forcedForEventS03==='function'||effs.some(e=>e&&e.forced===true);
  const perForced=ev=>{
    if(sc.forced) return true;
    const hit=effs.filter(e=>e&&Array.isArray(e.events)&&e.events.indexOf(ev)>=0);
    if(hit.length) return hit.some(e=>e.forced===true);
    if(typeof sc.forcedForEventS03==='function'){ try{ return !!sc.forcedForEventS03(ev,null); }catch(e){ return false; } }
    return false;
  };
  evs.forEach(ev=>{
    if(perForced(ev)){P.forced++;return;}
    if(sc.summonNegate){P.negate++;return;}
    if(missedTimingModeS03(nm)==='never'){P.decl++;return;}
    if(missedTimingClassS03({name:nm,eventName:ev},{flipSummon:true})){P.drop++;return;}
    const k=missedTimingTextKindS03(nm);
    const key=(ev==='onNormalSummon')?'n':(ev==='onSpecialSummon'?'s':'f');
    if(k[key]==='baai'||(ev==='onFlip'&&k.r==='baai')){P.baai++;return;}
    P.none++;
  });
  if(statForced){B.forced.push(nm);return;}
  if(sc.summonNegate){B.summonNegate.push(nm);return;}
  if(missedTimingModeS03(nm)==='never'){B.decl.push(nm);return;}
  const cls=evs.map(e=>missedTimingClassS03({name:nm,eventName:e},{flipSummon:true})).filter(Boolean);
  if(cls.length){B.drop.push(nm);return;}
  const k=missedTimingTextKindS03(nm);
  if(k.n==='baai'||k.s==='baai'||k.f==='baai'||k.r==='baai'){B.baai.push(nm);return;}
  B.none.push(nm);
});
const total=Object.keys(B).reduce((a,k)=>a+B[k].length,0);
const pt=Object.keys(P).reduce((a,k)=>a+P[k],0);
ok('E1 ★ カード単位 518 件 = 強制 255 / 宣言 7 / 逃す 207 / 場合 15 / 召喚無効 6 / 文言なし 28',
   total===518 && B.forced.length===255 && B.decl.length===7 && B.drop.length===207
   && B.baai.length===15 && B.summonNegate.length===6 && B.none.length===28,
   JSON.stringify(Object.keys(B).reduce((a,k)=>(a[k]=B[k].length,a),{})));
ok('E2 ★ イベントごとの組単位 675 組 = 強制 316 / 宣言 8 / 逃す 290 / 場合 18 / 召喚無効 12 / 文言なし 31',
   pt===675 && P.forced===316 && P.decl===8 && P.drop===290
   && P.baai===18 && P.negate===12 && P.none===31,
   JSON.stringify(P));
ok('E3 ★ (B-4) が A 軸 16 / B 軸 3 / A 文言 59 / B 文言 4 / 裏付けなし 125 に数え直され、60% と書かれている',
   DOC.indexOf('**16 枚**')>=0 && DOC.indexOf('**3 枚**')>=0 && DOC.indexOf('**59 枚**')>=0
   && DOC.indexOf('**4 枚**')>=0 && DOC.indexOf('**125 枚**')>=0
   && DOC.indexOf('207 枚のうち 125 枚（60%）は機械分類だけ')>=0
   && DOC.indexOf('156 枚・75% と書いていたが')>=0,'');
ok('E4 ★ 未確定が減ったこと（31 枚 → 30 枚）と、26 枚は当時裁定に何も無いことが書かれている',
   DOC.indexOf('強制と読めるのに落としているカード 30 枚（42 組）が未確定')>=0
   && DOC.indexOf('31 枚のうち 26 枚は当時裁定に強制／任意の記述が一切無く')>=0
   && DOC.indexOf('全体は完成していない')>=0,'');
`, {expect:4});

/* ===== F-1. 保存（R4 の経路を保存して次の harness ＝ 新しい VM に渡す） ===== */
const ctxF = harness(COMMON + String.raw`
const U=ropeBoard();
doAttack(1,0,0);
drive();
globalThis.__SAVED_S495=savedRaw();
globalThis.__AT_SAVE_S495=JSON.stringify({air:zu(U.air), step:s(), drops:dropNames()});
COLLECT=[];STEPS=[];resetMissedTimingDropsS03();
duelActivateFromZone(0,'sz',0);
let g=0;while(pc()&&g++<12)__choicePickV49(0);
drive();
globalThis.__WANT_S495=JSON.stringify({drops:dropNames(), air:zu(U.air), ocean:zu(U.ocean),
  step:s(), digest:v41StateDigest(gameState)});
ok('F1 前提: 戦闘破壊の時点で保存でき、保存なしの解決ではエアーマンが逃さずサーチする',
   (globalThis.__SAVED_S495||'').length>0 && dropNames().length===0 && zu(U.ocean)==='hand',
   globalThis.__WANT_S495);
ok('F1 ★ 署名と回数は差分だけを見るので保存データにも digest にも出ない',
   (globalThis.__SAVED_S495||'').indexOf('missedTiming')<0
   && (globalThis.__SAVED_S495||'').indexOf('procStepS03')>=0
   && v41StateDigest(gameState).indexOf('missedTiming')<0,'');
`, {expect:2});

/* ===== F-2. 新しい VM で再開 ===== */
harness('const SAVED=' + JSON.stringify(ctxF.__SAVED_S495 || '') + ';'
      + 'const WANT=' + (ctxF.__WANT_S495 || 'null') + ';'
      + 'const AT=' + (ctxF.__AT_SAVE_S495 || 'null') + ';' + COMMON + String.raw`
const okLoad=loadInto(SAVED);
const air=(gameState.players[0].grave||[]).find(c=>dbOf(c).n==='E・HERO エアーマン');
const ocean=(gameState.players[0].deck||[]).find(c=>dbOf(c).n==='E・HERO オーシャン');
ok('F2 前提: 別の VM で保存データから再開でき、墓地のエアーマンと刻みが保存時のまま戻っている',
   okLoad===true && !!air && !!ocean
   && JSON.stringify({air:'grave', step:s(), drops:dropNames()})===JSON.stringify(AT),
   JSON.stringify({okLoad, air:!!air, ocean:!!ocean, step:s(), AT}));
duelActivateFromZone(0,'sz',0);
let g=0;while(pc()&&g++<12)__choicePickV49(0);
drive();
const got={drops:dropNames(), air:zu(air.uid), ocean:zu(ocean.uid),
  step:s(), digest:v41StateDigest(gameState)};
ok('F2 ★ 新しい VM での再開後の解決が、保存なしの解決と同じ落とし方・同じ刻み・同じ最終 digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('F2');
`, {expect:3});

/* ===== G. 範囲 ─ 召喚無効と他の未対応機能には広げていない ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S495) + ';const ENG=' + JSON.stringify(ENGINE_S495) + ';'
      + COMMON + String.raw`
resetA();
ok('G1 ★ 召喚無効の 6 枚はこの単位でも落とさない（WIKI-2CF23AA42E79 は対象外のまま）',
   ['エレキャンセル','キックバック','ライト・バニッシュ','神の宣告','神の警告','重力崩壊'].every(nm=>
     missedTimingDropS03({name:nm,eventName:'onNormalSummon',ctx:null,event:{}},{stepS03:3})===false)
   && ENG.indexOf('WIKI-2CF23AA42E79')>=0 && DOC.indexOf('SUMMON_WINDOW')>=0,'');
ok('G2 ★ 判定は collectHandlers の 1 箇所のまま — 召喚無効の窓・優先権の窓には入っていない',
   /filterMissedTimingS03\(out, *evt\|\|\{\}\)/.test(String(COLLECT_ORIG_S495))
   && !/issedTiming/.test(String(NEGATORS_ORIG_S495))
   && !/issedTiming/.test(String(POINT_ORIG_S495))
   && !/issedTiming/.test(String(CHAINRESP_ORIG_S495)),'');
ok('G3 ★ 段階表に S03-U495 の完了分と、未対応が S03-U496 以降として分けて書かれている',
   DOC.indexOf('**S03-U495（完了）**')>=0 && DOC.indexOf('S03-U496 以降（**未対応**）')>=0
   && DOC.indexOf('5-a. 未対応（S03-U495 時点')>=0,'');
ok('G4 ★ §6 に S03-U495 で採らなかった案（部分一致・共名の機械算入・ドラのモデル化）が書かれている',
   DOC.indexOf('採らない案（S03-U495 で足した分）')>=0
   && DOC.indexOf('裁定 DB をカード名の部分一致で引く')>=0
   && DOC.indexOf('本文で名前が挙がる裁定を機械的に')>=0
   && DOC.indexOf('チェーンブロックのモデル化をこの単位で直す')>=0,'');
`, {expect:4});
