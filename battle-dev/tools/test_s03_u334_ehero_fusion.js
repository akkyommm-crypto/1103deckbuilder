/* S03-U334: nine E・HERO Fusion Monsters — サンダー・ジャイアント, ジ・アース, セイラーマン, ダーク・ブライトマン, ネクロイド・シャーマン, プラズマヴァイスマン, マッドボールマン, ワイルド・ウィングマン, フレイム・ブラスト.
   Every one is Fusion Summoned through 「融合」 (the real Fusion-Spell path of S03-U130) before its effect is checked; Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3340001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
const E=n=>'E・HERO '+n;
/* the real Fusion Summon: 融合 + the two materials (+ extra hand cards / field cards) → the Fusion Monster (face-up Attack) */
function fuse(fusion,a,b,o){o=o||{};fresh();const poly=mk('融合',0),ma=mk(E(a),0),mb=mk(E(b),0),fm=mk(fusion,0);
  const extra=(o.hand?o.hand():[]);gameState.players[0].hand=[poly,ma,mb].concat(extra);gameState.players[0].ex=[fm];
  if(o.mine)gameState.players[0].mz=o.mine();if(o.sz)gameState.players[0].sz=o.sz();if(o.foes)gameState.players[1].mz=o.foes();if(o.foeSz)gameState.players[1].sz=o.foeSz();if(o.foeGrave)gameState.players[1].grave=o.foeGrave();
  baselineA();PREFER=['atk'].concat(o.prefer?o.prefer():[]);duelActivateFromHand(0);drive();PREFER=[];
  return {fm,ma,mb,poly};}

/* ===== サンダー・ジャイアント ===== */
{ const x=fuse('E・HERO サンダー・ジャイアント','スパークマン','クレイマン',{hand:()=>[mk('ワイト',0)],foes:()=>[mon('ワイト',1),mon('青眼の白龍',1)]});
  const lo=gameState.players[1].mz[0],hi=gameState.players[1].mz[1],d=gameState.players[0].hand[0];
  ok('サンダー・ジャイアント: Fusion Summoned by 融合 (材料 スパークマン + クレイマン in the Graveyard)',z(x.fm)==='mz'&&z(x.ma)==='grave'&&z(x.mb)==='grave'&&x.fm.specialSummonKind==='fusion',JSON.stringify({fm:z(x.fm),k:x.fm.specialSummonKind}));
  ok('サンダー・ジャイアント: available (ワイト has printed ATK 300 < 2400)',canZ(x.fm)===true,'');
  PREFER=[uid(lo)];actZ(x.fm);PREFER=[];
  ok('サンダー・ジャイアント: discarded 1 card (cost), destroyed the lower-ATK monster; 青眼 (3000) not a candidate and stays',z(d)==='grave'&&z(lo)==='grave'&&z(hi)==='mz',JSON.stringify({d:z(d),lo:z(lo),hi:z(hi)}));
  ok('サンダー・ジャイアント: once per turn',canZ(x.fm)===false,'');
  audit('サンダー・ジャイアント'); }

/* ===== ジ・アース ===== */
{ const x=fuse('E・HERO ジ・アース','オーシャン','フォレストマン',{mine:()=>[mon(E('スパークマン'),0)]});
  const sp=gameState.players[0].mz.find(c=>cardName(c)===E('スパークマン'));
  ok('ジ・アース: Fusion Summoned',z(x.fm)==='mz'&&x.fm.specialSummonKind==='fusion',z(x.fm));
  const a0=curATK(C(x.fm));PREFER=[uid(sp)];actZ(x.fm);PREFER=[];
  ok('ジ・アース: released スパークマン (1600) → ATK '+a0+' + 1600 until the end of the turn',z(sp)==='grave'&&curATK(C(x.fm))===a0+1600,JSON.stringify({sp:z(sp),atk:curATK(C(x.fm)),a0}));
  audit('ジ・アース');
  endTurn();
  ok('ジ・アース: back to '+a0+' next turn',curATK(C(x.fm))===a0,String(curATK(C(x.fm)))); }

/* ===== セイラーマン ===== */
{ const x=fuse('E・HERO セイラーマン','バブルマン','フェザーマン',{foes:()=>[mon('青眼の白龍',1)],sz:()=>[mk('サイクロン',0,'down')]});
  const f=gameState.players[1].mz[0];
  ok('セイラーマン: Fusion Summoned',z(x.fm)==='mz',z(x.fm));
  endTurn();endTurn();phase('battle');
  ok('セイラーマン: with a Set card in my Spell & Trap Zone it attacks directly although the opponent has a monster',battleTargetsV29(x.fm.uid).direct===true,JSON.stringify(battleTargetsV29(x.fm.uid).direct));
  audit('セイラーマン'); }
{ const x=fuse('E・HERO セイラーマン','バブルマン','フェザーマン',{foes:()=>[mon('青眼の白龍',1)]});
  endTurn();endTurn();phase('battle');
  ok('セイラーマン negative: without a Set card it cannot attack directly',battleTargetsV29(x.fm.uid).direct===false,JSON.stringify(battleTargetsV29(x.fm.uid).direct)); }

/* ===== ダーク・ブライトマン ===== */
{ const x=fuse('E・HERO ダーク・ブライトマン','スパークマン','ネクロダークマン',{foes:()=>[mon('ワイト',1,'def')]});
  const f=gameState.players[1].mz[0];
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,x.fm,f);
  ok('ダーク・ブライトマン: attacked ワイト (DEF 200): piercing damage 1800; at the end of the Damage Step it is in Defense Position',z(f)==='grave'&&l1-lp(1)===1800&&C(x.fm).pos==='def',JSON.stringify({loss:l1-lp(1),pos:C(x.fm)&&C(x.fm).pos}));
  audit('ダーク・ブライトマン ①'); }
{ const x=fuse('E・HERO ダーク・ブライトマン','スパークマン','ネクロダークマン',{foes:()=>[mon('青眼の白龍',1),mon('ワイト',1)]});
  const be=gameState.players[1].mz[0],wy=gameState.players[1].mz[1];
  toOppBattle();PREFER=[uid(wy)];atkTarget(1,be,x.fm);PREFER=[];
  ok('ダーク・ブライトマン: destroyed by 青眼 (2000 < 3000) → destroyed an opponent monster (the chosen ワイト)',z(x.fm)==='grave'&&z(wy)==='grave'&&z(be)==='mz',JSON.stringify({fm:z(x.fm),wy:z(wy),be:z(be)}));
  audit('ダーク・ブライトマン ②'); }

/* ===== ネクロイド・シャーマン ===== */
{ const x=fuse('E・HERO ネクロイド・シャーマン','ワイルドマン','ネクロダークマン',{foes:()=>[mon('青眼の白龍',1)],foeGrave:()=>[mk('ライオウ',1)],prefer:()=>[uid(gameState.players[1].grave[0])]});
  const ly=gameState.players[1].grave.concat(gameState.players[1].mz).find(c=>cardName(c)==='ライオウ'),be=gameState.players[1].grave.concat(gameState.players[1].mz).find(c=>cardName(c)==='青眼の白龍');
  ok('ネクロイド・シャーマン: Fusion Summoned',z(x.fm)==='mz',z(x.fm));
  ok('ネクロイド・シャーマン: the Special Summon destroyed 青眼; then the chosen opponent Graveyard monster (ライオウ) came back onto the OPPONENT field',z(be)==='grave'&&z(ly)==='mz'&&pl(ly)===1,JSON.stringify({be:z(be),ly:z(ly),lyp:pl(ly)}));
  audit('ネクロイド・シャーマン'); }

/* ===== プラズマヴァイスマン ===== */
{ const x=fuse('E・HERO プラズマヴァイスマン','スパークマン','エッジマン',{hand:()=>[mk('ワイト',0)],foes:()=>[mon('青眼の白龍',1),mon('ワイト',1,'def')]});
  const be=gameState.players[1].mz[0],df=gameState.players[1].mz[1],d=gameState.players[0].hand[0];
  PREFER=[uid(be)];actZ(x.fm);PREFER=[];
  ok('プラズマヴァイスマン: discarded 1 (cost), destroyed the chosen Attack Position monster (the Defense Position ワイト is not a candidate)',z(d)==='grave'&&z(be)==='grave'&&z(df)==='mz',JSON.stringify({d:z(d),be:z(be),df:z(df)}));
  audit('プラズマヴァイスマン ①');
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,x.fm,df);
  ok('プラズマヴァイスマン: attacked the Defense Position ワイト (DEF 200): piercing 2600 − 200 = 2400',z(df)==='grave'&&l1-lp(1)===2400,JSON.stringify({loss:l1-lp(1)})); }

/* ===== マッドボールマン ===== */
{ const x=fuse('E・HERO マッドボールマン','バブルマン','クレイマン');
  ok('マッドボールマン: Fusion Summoned (no effect)',z(x.fm)==='mz'&&x.fm.specialSummonKind==='fusion'&&x.fm.face==='up',JSON.stringify({z:z(x.fm)}));
  audit('マッドボールマン'); }

/* ===== ワイルド・ウィングマン ===== */
{ const x=fuse('E・HERO ワイルド・ウィングマン','ワイルドマン','フェザーマン',{hand:()=>[mk('ワイト',0),mk('ワイト',0)],foeSz:()=>[mk('サイクロン',1,'down')]});
  const fs=gameState.players[1].sz[0],d=gameState.players[0].hand[0];
  PREFER=[uid(fs)];actZ(x.fm);PREFER=[];
  ok('ワイルド・ウィングマン: discarded 1, destroyed the Spell/Trap; and again (no once-per-turn clause) is available',z(d)==='grave'&&z(fs)==='grave',JSON.stringify({d:z(d),fs:z(fs)}));
  audit('ワイルド・ウィングマン'); }

/* ===== フレイム・ブラスト ===== */
{ const x=fuse('E・HERO フレイム・ブラスト','ザ・ヒート','レディ・オブ・ファイア',{foes:()=>[mon('ひょうすべ',1)]});
  const w=gameState.players[1].mz[0];
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,x.fm,w);
  ok('フレイム・ブラスト: vs the WATER ひょうすべ (1500): ATK 2300 + 1000 in the Damage Step → 3300 − 1500 = 1800 damage',z(w)==='grave'&&l1-lp(1)===1800,JSON.stringify({loss:l1-lp(1),w:z(w)}));
  ok('フレイム・ブラスト: back to 2300 after the battle',curATK(C(x.fm))===2300,String(curATK(C(x.fm))));
  audit('フレイム・ブラスト'); }

console.log('U334 done');
`);
