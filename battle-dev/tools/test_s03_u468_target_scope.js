/* S03-U468: 「相手は…効果の対象にできない」の対象耐性 — ホルスのしもべ / メタルシルバー・アーマー。
   1) 判定は「対象を選ぶ効果のプレイヤー」で行う（相手の効果は拒否、コントローラー自身の効果は許可）。S03-U459 が直した向きを、
      発動準備中（beginActivationPrepS03）と解決時（p3BeginEffectContextV3）の両方の文脈で固定する。
   2) メタルシルバー・アーマーの原文（carddata ①）は「お互いのフィールド・墓地のモンスター及び除外されているモンスター」。
      1103の裁定（2009-06-18, WIKI-6B27D6D86996）: 相手は墓地のモンスター1体を対象にする効果を発動できない。
      以前の実装は場のモンスターだけを守っていた → continuous.immuneToTargetOffField（engine/1ZZR）で墓地・除外も守る。
      ホルスのしもべは墓地・除外のホルスの黒炎竜を対象にできる（2010-05-20, WIKI-55D203877F99）ので、場のカードだけを守る。 */
const harness=require('./astra_harness');
const first=harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4680002;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
/* 対象を選んでいる効果のソースの文脈を実エンジンと同じ関数で作る（S03-U457 と同じ道具） */
function clearCtx(){endActivationPrepS03();p3EndEffectContextV3();}
function atPrep(src,player){clearCtx();beginActivationPrepS03(player,src,cardName(src));}
function atResolution(src,player){clearCtx();p3BeginEffectContextV3(player,src,cardName(src));}
function hand(c){const h=findCardByUid(c.uid);return {p:h.p,zone:h.zone,index:h.index,card:h.card};}
function kept(c,byPlayer){return filterTargetable([hand(c)],byPlayer).length;}
function resolvedCtxPremise(){return typeof ACTIVATION_PREP_S03==='undefined'||ACTIVATION_PREP_S03===null;}

const SRV='ホルスのしもべ',H4='ホルスの黒炎竜 LV4',H6='ホルスの黒炎竜 LV6',H8='ホルスの黒炎竜 LV8',ARM='メタルシルバー・アーマー',BOOK='月の書',REV='死者蘇生';

/* ================= ホルスのしもべ ================= */
function horusField(){
  fresh();const sv=mon(SRV,0),a=mon(H4,0),b=mon(H6,0),c=mon(H8,0),plain=mon('ライオウ',0),foeSp=mk(BOOK,1,'up'),ownSp=mk(BOOK,0,'up');
  gameState.players[0].mz=[sv,a,b,c,plain];gameState.players[1].hand=[foeSp];gameState.players[0].hand=[ownSp];baselineA();
  return {sv,a,b,c,plain,foeSp,ownSp};}
{ const x=horusField();
  atPrep(C(x.foeSp),1);
  ok('ホルス 発動準備中: 相手の効果はホルスの黒炎竜 LV4 / LV6 / LV8 を対象に取れない',kept(x.a,1)===0&&kept(x.b,1)===0&&kept(x.c,1)===0,[kept(x.a,1),kept(x.b,1),kept(x.c,1)].join());
  atPrep(C(x.ownSp),0);
  ok('ホルス 発動準備中（バグ修正の対象）: コントローラー自身の効果はホルスの黒炎竜を対象に取れる',kept(x.a,0)===1&&kept(x.b,0)===1&&kept(x.c,0)===1,[kept(x.a,0),kept(x.b,0),kept(x.c,0)].join());
  atResolution(C(x.foeSp),1);
  ok('ホルス 前提: 解決時は ACTIVATION_PREP_S03 が空（prep だけを読む実装はここで免疫を失う）',resolvedCtxPremise(),'');
  ok('ホルス 解決時: 相手の効果はホルスの黒炎竜を対象に取れない',kept(x.a,1)===0&&kept(x.b,1)===0&&kept(x.c,1)===0,[kept(x.a,1),kept(x.b,1),kept(x.c,1)].join());
  atResolution(C(x.ownSp),0);
  ok('ホルス 解決時（バグ修正の対象）: コントローラー自身の効果はホルスの黒炎竜を対象に取れる',kept(x.a,0)===1&&kept(x.b,0)===1&&kept(x.c,0)===1,[kept(x.a,0),kept(x.b,0),kept(x.c,0)].join());
  atResolution(C(x.foeSp),1);
  ok('ホルス negative: 名前の異なるモンスターは相手の効果でも対象に取れる（解決時）',kept(x.plain,1)===1&&kept(x.sv,1)===1,'');
  clearCtx();
  ok('ホルス 文脈なし（直接 filterTargetable）: 対象を取るプレイヤーは byPlayer から決まる',kept(x.b,1)===0&&kept(x.b,0)===1,'');
  /* 実エンジンの月の書の経路とReplayは S03-U459（test_s03_u459_opponent_targeting.js）が固定している。ここは純粋な判定（Action無し）なので Replay は対象外。 */ }
{ fresh();const b=mon(H6,0),foeSp=mk(BOOK,1,'up');gameState.players[0].mz=[b];gameState.players[1].hand=[foeSp];baselineA();
  atResolution(C(foeSp),1);
  ok('ホルス control: しもべがいなければ相手の効果でも対象に取れる（解決時）',kept(b,1)===1,'');
  clearCtx(); }
{ fresh();const sv=mon(SRV,0),foeSp=mk(BOOK,1,'up'),gh=mk(H6,0),bn=mk(H8,0);gameState.players[0].mz=[sv];gameState.players[0].grave=[gh];gameState.players[0].banish=[bn];gameState.players[1].hand=[foeSp];baselineA();
  atResolution(C(foeSp),1);
  const g=API.pileCards(0,'grave')[0],b2=API.pileCards(0,'banish')[0];
  ok('ホルス ruling（2010-05-20, WIKI-55D203877F99）: 墓地・除外のホルスの黒炎竜は相手の効果で対象に取れる',filterTargetable([g],1).length===1&&filterTargetable([b2],1).length===1,'');
  clearCtx(); }

/* ================= メタルシルバー・アーマー ================= */
function armorField(equip){
  fresh();const host=mon('ワイト',0),own=mon('ライオウ',0),foe=mon('ジェネティック・ワーウルフ',1),armor=mk(ARM,0,'up'),
    gOwn=mk('ワイト',0),gFoe=mk('ジェネティック・ワーウルフ',1),gSp=mk('強欲な壺',1),bUp=mk('ライオウ',0,'up'),bDown=mk('ワイト',1,'down'),
    foeSp=mk(BOOK,1,'up'),ownSp=mk(BOOK,0,'up');
  gameState.players[0].mz=[host,own];gameState.players[0].sz=[armor];gameState.players[0].grave=[gOwn];gameState.players[0].banish=[bUp];
  gameState.players[1].mz=[foe];gameState.players[1].grave=[gFoe,gSp];gameState.players[1].banish=[bDown];
  gameState.players[1].hand=[foeSp];gameState.players[0].hand=[ownSp];baselineA();
  if(equip) API.equipSpell(locateCardAnyV4(armor),locateCardAnyV4(host),'S03-U468 fixture');
  return {host,own,foe,armor,gOwn,gFoe,gSp,bUp,bDown,foeSp,ownSp};}
function off(p,zone,i){return API.pileCards(p,zone)[i];}
{ const x=armorField(true);
  ok('アーマー fixture: journaled equip APIでワイトに装備された',z(x.armor)==='sz'&&C(x.armor).equipTo&&C(x.armor).equipTo.uid===x.host.uid,JSON.stringify(C(x.armor).equipTo));
  const gOwn=off(0,'grave',0),gFoe=off(1,'grave',0),gSp=off(1,'grave',1),bUp=off(0,'banish',0),bDown=off(1,'banish',0);
  for(const [label,begin] of [['発動準備中',(s,p)=>atPrep(s,p)],['解決時',(s,p)=>atResolution(s,p)]]){
    begin(C(x.foeSp),1);
    ok('アーマー '+label+': 相手の効果は装備モンスター以外の場のモンスター（自分側・相手側）を対象に取れない',kept(x.own,1)===0&&kept(x.foe,1)===0,[kept(x.own,1),kept(x.foe,1)].join());
    ok('アーマー '+label+': 相手の効果は装備モンスター自身を対象に取れる',kept(x.host,1)===1,'');
    ok('アーマー '+label+'（本単位で追加）: 相手の効果はお互いの墓地のモンスターを対象に取れない',filterTargetable([gOwn],1).length===0&&filterTargetable([gFoe],1).length===0,[filterTargetable([gOwn],1).length,filterTargetable([gFoe],1).length].join());
    ok('アーマー '+label+'（本単位で追加）: 相手の効果は除外されているモンスター（表・裏）を対象に取れない',filterTargetable([bUp],1).length===0&&filterTargetable([bDown],1).length===0,'');
    ok('アーマー '+label+' negative: 墓地の魔法カードは「モンスター」ではないので対象に取れる',filterTargetable([gSp],1).length===1,'');
    begin(C(x.ownSp),0);
    ok('アーマー '+label+'（バグ修正の対象）: コントローラー自身の効果は場のモンスターを対象に取れる',kept(x.own,0)===1&&kept(x.foe,0)===1&&kept(x.host,0)===1,[kept(x.own,0),kept(x.foe,0),kept(x.host,0)].join());
    ok('アーマー '+label+'（本単位で追加の negative）: コントローラー自身の効果は墓地・除外のモンスターを対象に取れる',filterTargetable([gOwn],0).length===1&&filterTargetable([gFoe],0).length===1&&filterTargetable([bUp],0).length===1&&filterTargetable([bDown],0).length===1,'');
  }
  clearCtx();
  ok('アーマー 文脈なし（直接 filterTargetable）: byPlayer で相手 / 自分を区別する（墓地）',filterTargetable([gFoe],1).length===0&&filterTargetable([gFoe],0).length===1,'');
  audit('メタルシルバー・アーマー'); }
{ const x=armorField(false);
  atResolution(C(x.foeSp),1);
  ok('アーマー control: 装備していなければ（装備モンスターがいなければ）墓地・除外・場のどれも守らない',kept(x.own,1)===1&&filterTargetable([off(1,'grave',0)],1).length===1&&filterTargetable([off(1,'banish',0)],1).length===1,'');
  clearCtx(); }
{ const x=armorField(true);
  atResolution(C(x.foeSp),1);
  API.destroy(locateCardAnyV4(x.host),'S03-U468 fixture');   /* 装備モンスターが居なくなる（アーマーも墓地へ） */
  const hostGone=z(x.host)!=='mz';
  ok('アーマー control: 装備モンスターがフィールドに居なくなれば墓地のモンスターも対象に取れる（アーマーは装備先を失って墓地へ）',hostGone&&filterTargetable([off(1,'grave',0)],1).length===1,JSON.stringify([z(x.host),z(x.armor)]));
  clearCtx(); }

/* ===== 実エンジン経路（死者蘇生）: 裁定「相手は墓地のモンスター1体を対象にする効果を発動できない」 ===== */
{ fresh();const host=mon('ワイト',0),armor=mk(ARM,0,'up'),gOwn=mk('ライオウ',0),rev=mk(REV,1),ownRev=mk(REV,0);
  gameState.players[0].mz=[host];gameState.players[0].sz=[armor];gameState.players[0].grave=[gOwn];gameState.players[1].hand=[rev];gameState.players[0].hand=[ownRev];baselineA();
  API.equipSpell(locateCardAnyV4(armor),locateCardAnyV4(host),'S03-U468 fixture');
  gameState.activePlayer=1;TOASTS.length=0;
  const acts=getLegalHandActions(1,0).map(a=>a.id);
  ok('アーマー real path（WIKI-6B27D6D86996）: 相手は保護された墓地のモンスターしかいない死者蘇生を発動できない',acts.indexOf('activate')<0,JSON.stringify(acts));
  duelActivateFromHand(0);
  ok('アーマー real path: 発動を試みても手札に残り、チェーンもセットも発生しない',gameState.players[1].hand.length===1&&gameState.players[1].sz.length===0&&gameState.chain.length===0,JSON.stringify({hand:gameState.players[1].hand.length,sz:gameState.players[1].sz.length,chain:gameState.chain.length}));
  gameState.activePlayer=0;
  const myActs=getLegalHandActions(0,0).map(a=>a.id);
  ok('アーマー real path negative: コントローラー自身は同じ墓地のモンスターを対象に死者蘇生を発動できる',myActs.indexOf('activate')>=0,JSON.stringify(myActs));
  duelActivateFromHand(0);
  for(let i=0;i<10&&pc();i++)__choicePickV49(0);
  for(let i=0;i<40;i++){ if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;} if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;} break; }
  ok('アーマー real path negative: 自分の死者蘇生は墓地のモンスターを特殊召喚する',z(gOwn)==='mz'&&gameState.players[0].mz.length===2,JSON.stringify({gOwn:z(gOwn),mz:gameState.players[0].mz.length}));
  audit('アーマー real path'); }
{ fresh();const host=mon('ワイト',0),armor=mk(ARM,0,'up'),gOwn=mk('ライオウ',0),gFoe=mk('ワイト',1),rev=mk(REV,1);
  gameState.players[0].mz=[host];gameState.players[0].sz=[armor];gameState.players[0].grave=[gOwn];gameState.players[1].grave=[gFoe];gameState.players[1].hand=[rev];baselineA();
  API.equipSpell(locateCardAnyV4(armor),locateCardAnyV4(host),'S03-U468 fixture');
  gameState.activePlayer=1;
  /* 候補の絞り込み: 条件は通らない（どちらの墓地のモンスターも保護される）。アーマーを外すと両方が候補に戻ることも確かめる */
  ok('アーマー real path: 相手は相手自身の墓地のモンスターも対象に取れない（お互いの墓地）',getLegalHandActions(1,0).map(a=>a.id).indexOf('activate')<0,'');
  API.sendToGrave(locateCardAnyV4(armor),'S03-U468 fixture');
  ok('アーマー real path control: アーマーが居なくなれば相手は死者蘇生を発動できる',getLegalHandActions(1,0).map(a=>a.id).indexOf('activate')>=0,''); }

/* ===== Save/Load: the saved state is taken with the target already chosen and the link on the chain (the legacy 月の書 target prompt is a closure and cannot be saved) ===== */
globalThis.__SAVES={};
let PREFER=[];
function pickU(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function driveU(){for(let i=0;i<800;i++){
  if(pc()){pickU();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phaseU(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});driveU();}
function endTurnU(){phaseU('end');requestProcessorV27(PROCESSOR_V27.TURN);driveU();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});driveU();phaseU('standby');phaseU('main1');}
/* cast a spell from the hand of the active player, answer the target prompt, stop with the link on the chain */
function castToChain(name,prefer){const p=gameState.activePlayer,i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);
  PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let n=0;n<20&&pc();n++)pickU();PREFER=[];}
function saveCase(key,extra){globalThis.__SAVES[key]=JSON.stringify(Object.assign({state:gameState,digest:v41StateDigest(gameState)},extra||{}));}
function addFinal(key){globalThis.__SAVES[key]=JSON.stringify(Object.assign(JSON.parse(globalThis.__SAVES[key]),{final:v41StateDigest(gameState)}));}

/* S1: ホルスのしもべ — the opponent 月の書 targets ホルスのしもべ; saved on the chain; the ホルスの黒炎竜 was not a candidate */
{ fresh();const sv=mon(SRV,0),hr=mon(H4,0),plain=mon('ライオウ',0),ownB=mk(BOOK,0),foeB=mk(BOOK,1);
  gameState.players[0].mz=[sv,hr,plain];gameState.players[0].hand=[ownB];gameState.players[1].hand=[foeB];baselineA();
  const ids=[uid(sv),uid(hr),uid(plain)];
  endTurnU();
  castToChain(BOOK,[ids[0]]);
  ok('Save/Load S1 setup: the opponent 月の書 is on the chain with the target chosen',gameState.chain.length===1&&!!gameState.chain[0].targets,JSON.stringify({chain:gameState.chain.length}));
  saveCase('S1',{ids});
  driveU();
  ok('Save/Load S1 VM1 reference: 月の書 flipped ホルスのしもべ face-down, the ホルスの黒炎竜 is untouched',C(sv).face==='down'&&C(hr).face==='up',JSON.stringify([C(sv).face,C(hr).face]));
  addFinal('S1'); }
/* S2: the controller own 月の書 targets ホルスの黒炎竜 (allowed); saved on the chain */
{ fresh();const sv=mon(SRV,0),hr=mon(H4,0),ownB=mk(BOOK,0);
  gameState.players[0].mz=[sv,hr];gameState.players[0].hand=[ownB];baselineA();
  const ids=[uid(sv),uid(hr)];
  castToChain(BOOK,[ids[1]]);
  ok('Save/Load S2 setup: the controller 月の書 chose ホルスの黒炎竜 (it was a candidate for its own controller)',gameState.chain.length===1&&!!gameState.chain[0].targets,JSON.stringify({chain:gameState.chain.length}));
  saveCase('S2',{ids});
  driveU();
  ok('Save/Load S2 VM1 reference: the own 月の書 flipped the ホルスの黒炎竜 face-down',C(hr).face==='down',C(hr).face);
  addFinal('S2'); }
/* S3: メタルシルバー・アーマー — the opponent 月の書 can only choose the equipped monster; saved on the chain with Graveyard / banished monsters on the board */
{ fresh();const host=mon('ワイト',0),other=mon('ライオウ',0),armor=mk(ARM,0,'up'),gOwn=mk('ワイト',0),gFoe=mk('ジェネティック・ワーウルフ',1),bn=mk('ライオウ',0,'up'),foeB=mk(BOOK,1);
  gameState.players[0].mz=[host,other];gameState.players[0].sz=[armor];gameState.players[0].grave=[gOwn];gameState.players[0].banish=[bn];gameState.players[1].grave=[gFoe];gameState.players[1].hand=[foeB];baselineA();
  API.equipSpell(locateCardAnyV4(armor),locateCardAnyV4(host),'S03-U468 fixture');
  const ids=[uid(host),uid(other),uid(gOwn),uid(gFoe),uid(bn)];
  endTurnU();
  castToChain(BOOK,[ids[0]]);
  ok('Save/Load S3 setup: the opponent 月の書 is on the chain targeting the equipped monster',gameState.chain.length===1&&!!gameState.chain[0].targets,JSON.stringify({chain:gameState.chain.length}));
  saveCase('S3',{ids});
  driveU();
  ok('Save/Load S3 VM1 reference: 月の書 flipped the equipped monster face-down, the other monster is untouched',C(host).face==='down'&&C(other).face==='up',JSON.stringify([C(host).face,C(other).face]));
  addFinal('S3'); }
/* S4: アーマー + the opponent holding a 死者蘇生 in its own turn, the controller holding one for the next turn */
{ fresh();const host=mon('ワイト',0),armor=mk(ARM,0,'up'),gOwn=mk('ライオウ',0),ownR=mk(REV,0),foeR=mk(REV,1);
  gameState.players[0].mz=[host];gameState.players[0].sz=[armor];gameState.players[0].grave=[gOwn];gameState.players[0].hand=[ownR];gameState.players[1].hand=[foeR];baselineA();
  API.equipSpell(locateCardAnyV4(armor),locateCardAnyV4(host),'S03-U468 fixture');
  const ids=[uid(host),uid(gOwn)];
  endTurnU();
  ok('Save/Load S4 setup: in the opponent turn 死者蘇生 is not offered (the only Graveyard monster is protected)',getLegalHandActions(1,0).map(a=>a.id).indexOf('activate')<0,'');
  saveCase('S4',{ids}); }
`);

/* ===== VM2: a fresh engine loads each saved state and carries on ===== */
const SAVES=first.__SAVES||{};
if(!SAVES.S1||!SAVES.S2||!SAVES.S3||!SAVES.S4){console.log('FAIL Save/Load VM1 saves missing');process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+String.raw`
const SRV='ホルスのしもべ',ARM='メタルシルバー・アーマー',BOOK='月の書',REV='死者蘇生';
function pc(){return pendingChoiceV49(gameState);}
function zoneOf(u){const x=findCardByUid(u);return x?x.zone:null;}
function faceOf(u){const x=findCardByUid(u);return x?x.card.face:null;}
function pickU(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}__choicePickV49(0);}
function driveU(){for(let i=0;i<800;i++){
  if(pc()){pickU();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function load(key){const o=JSON.parse(SAVES[key]);resetA();gameState=o.state;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
  reconcileChoiceAfterLoadV49(gameState);return o;}
function clearCtx(){endActivationPrepS03();p3EndEffectContextV3();}
function atPrep(src,player){clearCtx();beginActivationPrepS03(player,src,cardName(src));}
function atResolution(src,player){clearCtx();p3BeginEffectContextV3(player,src,cardName(src));}
function hnd(u){const h=findCardByUid(u);return {p:h.p,zone:h.zone,index:h.index,card:h.card};}
function kept(u,by){return filterTargetable([hnd(u)],by).length;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}

/* S1 */
{ const o=load('S1'),[sv,hr,plain]=o.ids;
  ok('Save/Load S1: the loaded state is the saved state (digest) with the 月の書 link still on the chain',v41StateDigest(gameState)===o.digest&&gameState.chain.length===1,'');
  const src=findCardByUid(gameState.chain[0].uid).card;
  atPrep(src,1);ok('Save/Load S1 loaded, activation prep: the opponent still cannot target ホルスの黒炎竜',kept(hr,1)===0&&kept(plain,1)===1,[kept(hr,1),kept(plain,1)].join());
  atPrep(src,0);ok('Save/Load S1 loaded, activation prep: the controller still can',kept(hr,0)===1,String(kept(hr,0)));
  atResolution(src,1);ok('Save/Load S1 loaded, resolution: the opponent still cannot',kept(hr,1)===0,String(kept(hr,1)));
  atResolution(src,0);ok('Save/Load S1 loaded, resolution: the controller still can',kept(hr,0)===1,String(kept(hr,0)));
  clearCtx();
  driveU();
  ok('Save/Load S1 resumed: the chain resolves — ホルスのしもべ face-down, ホルスの黒炎竜 untouched',faceOf(sv)==='down'&&faceOf(hr)==='up',JSON.stringify([faceOf(sv),faceOf(hr)]));
  ok('Save/Load S1 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load S1'); }
/* S2 */
{ const o=load('S2'),[sv,hr]=o.ids;
  ok('Save/Load S2: loaded with the controller 月の書 on the chain targeting the ホルスの黒炎竜',v41StateDigest(gameState)===o.digest&&gameState.chain.length===1,'');
  const src=findCardByUid(gameState.chain[0].uid).card;
  atResolution(src,0);ok('Save/Load S2 loaded, resolution: the controller own effect can still target the ホルスの黒炎竜',kept(hr,0)===1,String(kept(hr,0)));
  clearCtx();
  driveU();
  ok('Save/Load S2 resumed: the own 月の書 resolves on the ホルスの黒炎竜 (face-down) — the immunity does not block its own controller',faceOf(hr)==='down'&&faceOf(sv)==='up',JSON.stringify([faceOf(hr),faceOf(sv)]));
  ok('Save/Load S2 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,'');
  audit('Save/Load S2'); }
/* S3 */
{ const o=load('S3'),[host,other,gOwn,gFoe,bn]=o.ids;
  ok('Save/Load S3: loaded with the opponent 月の書 on the chain',v41StateDigest(gameState)===o.digest&&gameState.chain.length===1,'');
  const src=findCardByUid(gameState.chain[0].uid).card;
  for(const [label,begin] of [['prep',atPrep],['resolution',atResolution]]){
    begin(src,1);
    ok('Save/Load S3 loaded, '+label+': the opponent cannot target the other monster, the Graveyard monsters or the banished monster; the equipped monster is fine',kept(other,1)===0&&kept(gOwn,1)===0&&kept(gFoe,1)===0&&kept(bn,1)===0&&kept(host,1)===1,[kept(other,1),kept(gOwn,1),kept(gFoe,1),kept(bn,1),kept(host,1)].join());
    begin(src,0);
    ok('Save/Load S3 loaded, '+label+': the controller can target all of them',kept(other,0)===1&&kept(gOwn,0)===1&&kept(gFoe,0)===1&&kept(bn,0)===1,[kept(other,0),kept(gOwn,0),kept(gFoe,0),kept(bn,0)].join());
  }
  clearCtx();
  driveU();
  ok('Save/Load S3 resumed: the equipped monster is flipped face-down, the other monster untouched',faceOf(host)==='down'&&faceOf(other)==='up',JSON.stringify([faceOf(host),faceOf(other)]));
  ok('Save/Load S3 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,'');
  audit('Save/Load S3'); }
/* S4: loaded in the opponent turn; the opponent cannot Revive, then the turn passes and the controller can */
{ const o=load('S4'),[host,gOwn]=o.ids;
  ok('Save/Load S4: loaded in the opponent turn, 死者蘇生 still not offered to the opponent',v41StateDigest(gameState)===o.digest&&gameState.activePlayer===1&&getLegalHandActions(1,0).map(a=>a.id).indexOf('activate')<0,JSON.stringify(getLegalHandActions(1,0).map(a=>a.id)));
  for(const to of ['end']){requestProcessorV27(PROCESSOR_V27.PHASE,{to});driveU();}
  requestProcessorV27(PROCESSOR_V27.TURN);driveU();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});driveU();
  for(const to of ['standby','main1']){requestProcessorV27(PROCESSOR_V27.PHASE,{to});driveU();}
  const i=gameState.players[0].hand.findIndex(c=>cardName(c)===REV);
  ok('Save/Load S4 resumed: in the controller turn 死者蘇生 is offered (its own effect may target the protected Graveyard monster)',gameState.activePlayer===0&&i>=0&&getLegalHandActions(0,i).map(a=>a.id).indexOf('activate')>=0,JSON.stringify(getLegalHandActions(0,i).map(a=>a.id)));
  duelActivateFromHand(i);driveU();
  ok('Save/Load S4 resumed: the controller 死者蘇生 Special Summons its Graveyard monster',zoneOf(gOwn)==='mz',zoneOf(gOwn));
  audit('Save/Load S4'); }
`);
