/* S03-U383: the dice 「デーモン」 monsters (engine/1ZZR): スカル・デーモン, シャドウナイトデーモン, ダークビショップデーモン, デスルークデーモン, インフェルノクインデーモン, ヘルポーンデーモン (NOT_STARTED cards).
   Real DUEL paths, Replay-audited. */
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
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3830001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}









const SKU='迅雷の魔王－スカル・デーモン',SHD='シャドウナイトデーモン',BIS='ダークビショップデーモン',DRK='デスルークデーモン',QUE='インフェルノクインデーモン',PWN='ヘルポーンデーモン',GEN='ジェノサイドキングデーモン';
function foeTurn(){gameState.activePlayer=1;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function toOppBattle(){endTurn();phase('battle');}
/* find a seed whose FIRST die roll (duelRandomInt(6)+1) is the wanted face; afterwards put the seed in as the duel seed */
function seedFor(face){for(let s=1;s<20000;s++){gameState.rngState=s;if(duelRandomInt(6)+1===face)return s;}return 1;}
function withSeed(face){const s=seedFor(face);gameState.rngInitialSeed=gameState.rngState=s;}
function moon(p,target){const i=gameState.players[p].hand.findIndex(c=>cardName(c)==='月の書');PREFER=[uid(target)];duelActivateFromHand(i);for(let k=0;k<10&&pc();k++)pick();PREFER=[];drive();}

/* ===== the dice: スカル・デーモン (1 / 3 / 6) ===== */
function skullField(face){fresh();foeTurn();const s=mon(SKU,0),mn=mk('月の書',1,'up');gameState.players[0].mz=[s];gameState.players[1].hand=[mn];withSeed(face);baselineA();return {s,mn};}
{ const x=skullField(3);moon(1,x.s);
  ok('スカル・デーモン: 3 rolled -> the effect of 月の書 is negated and destroyed; the demon stays face-up',z(x.mn)==='grave'&&C(x.s).face==='up',JSON.stringify([z(x.mn),C(x.s).face]));
  audit('スカル 1'); }
{ const x=skullField(2);moon(1,x.s);
  ok('スカル・デーモン: 2 rolled (not 1 / 3 / 6) -> 月の書 resolves, the demon is turned face-down',C(x.s).face==='down',C(x.s).face);
  audit('スカル 2'); }

/* ===== ダークビショップデーモン: protects my other 「デーモン」 ===== */
{ fresh();foeTurn();const b=mon(BIS,0),d=mon(PWN,0),w=mon('ワイト',0),mn=mk('月の書',1,'up');gameState.players[0].mz=[b,d,w];gameState.players[1].hand=[mn];withSeed(1);baselineA();
  moon(1,d);
  ok('ビショップ: 1 rolled for a targeted other 「デーモン」 -> the effect is negated; the targeted demon stays face-up',C(d).face==='up'&&z(mn)==='grave',JSON.stringify([C(d).face,z(mn)])); }
{ fresh();foeTurn();const b=mon(BIS,0),w=mon('ワイト',0),mn=mk('月の書',1,'up');gameState.players[0].mz=[b,w];gameState.players[1].hand=[mn];withSeed(1);baselineA();
  moon(1,w);
  ok('ビショップ negative: a non-「デーモン」 target is not protected (月の書 turns ワイト face-down)',C(w).face==='down',C(w).face); }
{ fresh();foeTurn();const b=mon(BIS,0),mn=mk('月の書',0,'up');gameState.players[0].mz=[b];gameState.players[0].hand=[mn];gameState.players[1].mz=[];withSeed(1);baselineA();
  gameState.activePlayer=0;
  moon(0,b);
  ok('ビショップ negative: my own effect is not an 「相手のコントロールするカードの効果」 -> no negation',C(b).face==='down',C(b).face); }

/* ===== シャドウナイトデーモン: battle damage halved ===== */
{ fresh();const s=mon(SHD,0),f=mon('ワイト',1);gameState.players[0].mz=[s];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);
  atkTarget(0,s,f);
  ok('シャドウナイト: attacking ワイト (300): 1700 battle damage halved to 850',lp(1)===l1-850,JSON.stringify([l1,lp(1)]));
  audit('シャドウナイト 1'); }
{ fresh();const s=mon(SHD,0),f=mon('ワイト',1);gameState.players[0].mz=[s];gameState.players[1].mz=[f];gameState.players[1].mz[0].pos='atk';baselineA();
  ok('シャドウナイト: dice face 3 only (declared)',DICE_DEMON_S03[SHD].faces.join()==='3',JSON.stringify(DICE_DEMON_S03[SHD])); }

/* ===== upkeep ===== */
{ fresh();const s=mon(SKU,0),sd=mon(SHD,0);gameState.players[0].mz=[s,sd];baselineA();
  const l0=lp(0);
  endTurn();endTurn();
  ok('upkeep: 500 + 900 LP paid at my Standby Phase',lp(0)===l0-1400,JSON.stringify([l0,lp(0)]));
  audit('upkeep 1'); }

/* ===== インフェルノクインデーモン: +1000 to a 「デーモン」 every Standby Phase ===== */
{ fresh();const q=mon(QUE,0),pw=mon(PWN,0);gameState.players[0].mz=[q,pw];baselineA();
  const a0=curATK(C(pw)),q0=curATK(C(q)),l0=lp(0);
  PREFER=[uid(pw)];endTurn();PREFER=[];
  ok('インフェルノクイン: at the opposing Standby Phase the chosen 「デーモン」 (ヘルポーン) gets +1000 ATK, the other does not',curATK(C(pw))===a0+1000&&curATK(C(q))===q0,JSON.stringify([a0,curATK(C(pw)),q0,curATK(C(q))]));
  PREFER=[uid(q)];endTurn();PREFER=[];
  ok('インフェルノクイン: at my next Standby Phase (the bonus of the earlier turn is gone) the chosen one is boosted again',curATK(C(q))===q0+1000&&curATK(C(pw))===a0,JSON.stringify([a0,curATK(C(pw)),q0,curATK(C(q))]));
  ok('インフェルノクイン: the upkeeps (クイン 500 + ヘルポーン 500) were paid once each, at my Standby Phase only',lp(0)===l0-1000,JSON.stringify([l0,lp(0)]));
  audit('クイン 1'); }

/* ===== ヘルポーンデーモン: the other 「デーモン」 cannot be attacked ===== */
{ fresh();const p=mon(PWN,0),b=mon(BIS,0),w=mon('ワイト',0),f=mon('ライオウ',1);gameState.players[0].mz=[p,b,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  const t=battleTargetsV29(f.uid).targets.map(x=>x.card.uid);
  ok('ヘルポーン: the opponent can attack ヘルポーン and ワイト but not the other 「デーモン」 (ダークビショップ)',t.indexOf(p.uid)>=0&&t.indexOf(w.uid)>=0&&t.indexOf(b.uid)<0,JSON.stringify(t)+' b='+b.uid); }

/* ===== デスルークデーモン: rescues ジェノサイドキングデーモン ===== */
{ fresh();const d=mk(DRK,0),g=mon(GEN,0),bh=mk('ブラック・ホール',0,'up');gameState.players[0].hand=[d,bh];gameState.players[0].mz=[g];baselineA();
  cast(0,'ブラック・ホール');
  ok('デスルーク: ジェノサイドキングデーモン destroyed -> デスルークデーモン is sent from the hand to the Graveyard and it is Special Summoned',z(d)==='grave'&&z(g)==='mz',JSON.stringify([z(d),z(g)]));
  audit('デスルーク 1'); }
{ fresh();const d=mk(DRK,0),w=mon('ワイト',0),bh=mk('ブラック・ホール',0,'up');gameState.players[0].hand=[d,bh];gameState.players[0].mz=[w];baselineA();
  cast(0,'ブラック・ホール');
  ok('デスルーク negative: another monster destroyed -> stays in the hand',z(d)==='hand',z(d)); }
`);
