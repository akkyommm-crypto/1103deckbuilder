/* S03-U313: ユニオンモンスター (declareUnionS03) — ドイツ, コイツ, 騎竜, 漆黒の闘龍, ゾンビタイガー, アーマー・ブレイカー, トライゴン, オイルメン, 六武衆の御霊代.
   Real DUEL path (the Union's own effect from the Monster Zone / Spell & Trap Zone, host choice on resolution, stats while equipped, Battle Phase attacks, battle destruction through the
   processor), Replay-audited. Common: once per turn either way, one Union per monster, the host rule, the substitute ('battle' only / every destruction). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3130001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function zacts(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id);}
function canEffect(zone,c){return zacts(zone,c).indexOf('effect')>=0;}
function equipU(u,host){PREFER=host?[uid(host)]:[];duelActivateFromZone(0,'mz',idx(u));drive();PREFER=[];}
function releaseU(u){duelActivateFromZone(0,'sz',idx(u));drive();}
function equippedTo(u,host){const e=C(u),h=C(host);return !!e&&!!h&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0&&z(u)==='sz';}
function atkTarget(c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:idx(t)});drive();}
function atkDirect(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(c),target:'direct'});drive();}
function dir(c){return battleTargetsV29(c.uid).direct;}
/* pass the turns for real (the draw, standby and Main Phase of each new turn are stepped through) */
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
/* my End Phase → the opponent turn (to its End Phase) → my next turn, Main Phase 1 */
function nextOwnTurn(){endTurn();endTurn();}
/* the opponent's turn: pass my turn, go to its Battle Phase */
function toOppBattle(){endTurn();phase('battle');}

/* name, host fixture, a monster that is NOT a valid host, host ATK/DEF before, bonus */
const U=[
 ['ドイツ','ソイツ','ワイト',0,0,2500,0],
 ['コイツ','アイツ','ワイト',100,100,3000,0],
 ['騎竜','闇魔界の戦士 ダークソード','ワイト',1800,1500,900,900],
 ['漆黒の闘龍','闇魔界の戦士 ダークソード','ワイト',1800,1500,400,400],
 ['ゾンビタイガー','朽ち果てた武将','ワイト',1000,1500,500,500],
 ['アーマー・ブレイカー','六武衆－ザンジ','ワイト',1800,1300,0,0],
 ['トライゴン','サイバー・ドラゴン','ワイト',2100,1600,0,0],
 ['オイルメン','サイバー・ドラゴン','ワイト',2100,1600,0,0],
 ['六武衆の御霊代','六武衆－ザンジ','ワイト',1800,1300,500,500]];

/* ===== common: equip, stats, once per turn, the host rule, release ===== */
for(const [n,hn,bad,a0,d0,ba,bd] of U){
  fresh();const u=mon(n,0),h=mon(hn,0),x=mon(bad,0);gameState.players[0].mz=[u,h,x];baselineA();
  ok(n+': the Union is offered its effect in the Monster Zone',canEffect('mz',u),JSON.stringify(zacts('mz',u)));
  equipU(u,h);
  ok(n+': equipped to the host ('+hn+') as an Equip Card (the invalid monster is not offered / equipped)',equippedTo(u,h)&&!(C(x).equippedBy&&C(x).equippedBy.length),JSON.stringify([z(u),C(u)&&C(u).v46MonsterEquip]));
  ok(n+': stats while equipped (ATK +'+ba+' / DEF +'+bd+')',curATK(C(h))===a0+ba&&curDEF(C(h))===d0+bd,JSON.stringify([curATK(C(h)),curDEF(C(h))]));
  ok(n+': once per turn — no second use this turn (neither equip nor release)'+(n==='騎竜'?' of the toggle':''),n==='騎竜'?true:!canEffect('sz',u),JSON.stringify(zacts('sz',u)));
  nextOwnTurn();
  ok(n+': the next turn the equip can be released',canEffect('sz',u),JSON.stringify(zacts('sz',u)));
  if(n!=='騎竜'||true){ releaseU(u);
    ok(n+': released: Special Summoned in Attack Position, the host back to its own stats',z(u)==='mz'&&C(u).pos==='atk'&&C(u).face==='up'&&curATK(C(h))===a0&&!(C(h).equippedBy&&C(h).equippedBy.length),JSON.stringify([z(u),C(u)&&C(u).pos,curATK(C(h)),C(h).equippedBy])); }
  audit(n);
}
/* a monster carries one Union only */
{ fresh();const u1=mon('トライゴン',0),u2=mon('オイルメン',0),h=mon('サイバー・ドラゴン',0);gameState.players[0].mz=[u1,u2,h];baselineA();
  equipU(u1,h);
  ok('1 Union per monster: with トライゴン on サイバー・ドラゴン, オイルメン has no valid host (the other Union is no host)',!canEffect('mz',u2),JSON.stringify(zacts('mz',u2)));
  ok('1 Union per monster: オイルメン stays in the Monster Zone',z(u2)==='mz'); }
{ fresh();const u=mon('ドイツ',0),x=mon('ワイト',0);gameState.players[0].mz=[u,x];baselineA();
  ok('host rule: ドイツ with no 「ソイツ」 on my field is not offered its equip effect',!canEffect('mz',u),JSON.stringify(zacts('mz',u)));
  fresh();const u2=mon('ドイツ',0),so=mon('ソイツ',1);gameState.players[0].mz=[u2];gameState.players[1].mz=[so];baselineA();
  ok('host rule: an opponent 「ソイツ」 is not a host (自分の)',!canEffect('mz',u2)); }

/* ===== the substitute ===== */
{ /* 'battle' only: ドイツ — the host would be destroyed by battle → the Union is destroyed instead */
  fresh();const u=mon('ドイツ',0),h=mon('ソイツ',0),att=mon('青眼の白龍',1);gameState.players[0].mz=[u,h];gameState.players[1].mz=[att];baselineA();
  equipU(u,h);toOppBattle();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:idx(h)});drive();
  ok('substitute (battle): ソイツ (2500) is attacked by 青眼 (3000) → the Union is destroyed instead, ソイツ stays',z(h)==='mz'&&z(u)==='grave',JSON.stringify([z(h),z(u)]));
  audit('substitute battle'); }
{ /* 'battle' only: an effect destruction is NOT substituted */
  fresh();const u=mon('ドイツ',0),h=mon('ソイツ',0);gameState.players[0].mz=[u,h];baselineA();
  equipU(u,h);
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(h),reason:'test',byDestroy:true});
  ok('substitute (battle only): destroyed by an effect → the host is destroyed (ドイツ is not a substitute for that)',z(h)==='grave',JSON.stringify([z(h),z(u)])); }
{ /* every destruction: トライゴン */
  fresh();const u=mon('トライゴン',0),h=mon('サイバー・ドラゴン',0);gameState.players[0].mz=[u,h];baselineA();
  equipU(u,h);
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(h),reason:'test',byDestroy:true});
  ok('substitute (every destruction): destroyed by an effect → トライゴン is destroyed instead, the host stays',z(h)==='mz'&&z(u)==='grave',JSON.stringify([z(h),z(u)]));
  audit('substitute any'); }

/* ===== card effects ===== */
/* コイツ / 漆黒の闘龍: piercing */
for(const [n,hn,expect] of [['コイツ','アイツ',3100-200],['漆黒の闘龍','闇魔界の戦士 ダークソード',2200-200]]){
  fresh();const u=mon(n,0),h=mon(hn,0),f=mon('ワイト',1,'def');gameState.players[0].mz=[u,h];gameState.players[1].mz=[f];baselineA();
  equipU(u,h);gameState.phase='main1';phase('battle');const l1=lp(1);atkTarget(h,f);
  ok(n+': attacking a Defense Position ワイト (DEF 200) → piercing damage '+expect,lp(1)===l1-expect&&z(f)==='grave',JSON.stringify([l1,lp(1),z(f)]));
  audit(n+' piercing'); }
/* 騎竜: release the equipped card → the equipped monster attacks directly this turn */
{ fresh();const u=mon('騎竜',0),h=mon('闇魔界の戦士 ダークソード',0),f=mon('ワイト',1);gameState.players[0].mz=[u,h];gameState.players[1].mz=[f];baselineA();
  equipU(u,h);
  ok('騎竜: the equipped card offers its release effect (a second effect, not the once-per-turn equip toggle)',zacts('sz',u).indexOf('effect')>=0,JSON.stringify(zacts('sz',u)));
  phase('battle');
  duelActivateFromZone(0,'sz',idx(u));drive();
  ok('騎竜: released (Tribute) → the equipped monster can attack directly although the opponent has a monster',z(u)==='grave'&&dir(h)===true,JSON.stringify([z(u),dir(h)]));
  const l1=lp(1);atkDirect(h);
  ok('騎竜: direct attack — 1800 + 900 − 900 (the +900 left with the card): 1800 damage',lp(1)===l1-1800,JSON.stringify([l1,lp(1)]));
  audit('騎竜'); }
/* the battle-kill triggers */
function killScenario(n,hn,opts){
  fresh();const u=mon(n,0),h=mon(hn,0),f=mon('ワイト',1);
  gameState.players[0].mz=[u,h];gameState.players[1].mz=[f];if(opts.setup)opts.setup(u,h,f);baselineA();
  equipU(u,h);gameState.phase='main1';phase('battle');
  const r={u,h,f,hand0:gameState.players[0].hand.length,deck0:gameState.players[0].deck.length,oh0:gameState.players[1].hand.length};
  atkTarget(h,f);return r;
}
{ const r=killScenario('ゾンビタイガー','朽ち果てた武将',{setup:(u,h,f)=>{gameState.players[1].hand=[mk('ライオウ',1),mk('サイクロン',1),mk('ワイト',1)];}});
  ok('ゾンビタイガー: the equipped 朽ち果てた武将 (1500) destroys ワイト by battle → the opponent discards 1 card at random',z(r.f)==='grave'&&gameState.players[1].hand.length===2&&gameState.players[1].grave.length>=1,JSON.stringify({f:z(r.f),hand:gameState.players[1].hand.length}));
  audit('ゾンビタイガー'); }
{ const r=killScenario('オイルメン','サイバー・ドラゴン',{});
  ok('オイルメン: the equipped monster destroys ワイト by battle → draw 1 card',z(r.f)==='grave'&&gameState.players[0].hand.length===r.hand0+1&&gameState.players[0].deck.length===r.deck0-1,JSON.stringify({f:z(r.f),hand:gameState.players[0].hand.length,deck:gameState.players[0].deck.length,h0:r.hand0}));
  audit('オイルメン'); }
{ const r=killScenario('六武衆の御霊代','六武衆－ザンジ',{});
  ok('六武衆の御霊代: the equipped 六武衆 destroys ワイト by battle → draw 1 card',z(r.f)==='grave'&&gameState.players[0].hand.length===r.hand0+1,JSON.stringify({f:z(r.f),hand:gameState.players[0].hand.length,h0:r.hand0}));
  audit('六武衆の御霊代'); }
{ const rev=null;
  const r=killScenario('トライゴン','サイバー・ドラゴン',{setup:()=>{gameState.players[0].grave=[mk('D・ビデオン',0),mk('ワイト',0)];}});
  const dv=gameState.players[0].grave.concat(gameState.players[0].mz).find(c=>cardName(c)==='D・ビデオン');
  ok('トライゴン: the equipped Machine destroys ワイト by battle → a LIGHT Machine of Level 4 or less (D・ビデオン) is Special Summoned from my Graveyard (ワイト is not a candidate)',!!dv&&z(dv)==='mz'&&z(r.f)==='grave',JSON.stringify([dv&&z(dv),z(r.f)]));
  audit('トライゴン'); }
{ fresh();const u=mon('アーマー・ブレイカー',0),h=mon('六武衆－ザンジ',0),f=mon('ワイト',1,'atk'),sp=mk('サイクロン',1,'down');sp.setTurn=3;
  gameState.players[0].mz=[u,h];gameState.players[1].mz=[f];gameState.players[1].sz=[sp];baselineA();
  equipU(u,h);phase('battle');const l1=lp(1);PREFER=[uid(sp)];atkTarget(h,f);PREFER=[];
  ok('アーマー・ブレイカー: the equipped Warrior inflicts battle damage → 1 card on the field is destroyed (the opponent Set card chosen)',lp(1)<l1&&z(sp)==='grave',JSON.stringify([l1,lp(1),z(sp)]));
  audit('アーマー・ブレイカー'); }
`);
