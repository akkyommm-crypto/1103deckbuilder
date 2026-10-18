/* S03-U424: D・ライトン, エクストラ・ヴェーラー, ライフ・ストリーム・ドラゴン, ブラックフェザー・ドラゴン (NOT_STARTED cards).
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
let PREFER=[];function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4180001;
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


























































const SEEN=[];
const LIT='D・ライトン',VEI='エクストラ・ヴェーラー',LSD='ライフ・ストリーム・ドラゴン',BFD='ブラックフェザー・ドラゴン',QUE='ヴォルカニック・クイーン';
function actP(p,c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(p,'mz',idx(c));drive();PREFER=[];}
function actC(c,prefer){actP(0,c,prefer);}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function H(c){return findCardByUid(c.uid);}
function fk(c){const x=C(c);return x&&x.counters?Number(x.counters['黒羽'])||0:0;}
/* the opponent's Volcanic Queen burns me for 1000 in their Main Phase (an effect of the OPPONENT: the byPlayer of the link is 1) */
function foeBurn(q,w){endTurn();actP(1,q,[uid(w)]);}

/* ===== D・ライトン ===== */
{ fresh();const l=mon(LIT,0,'atk'),q=mon(QUE,1),w=mon('ワイト',1);gameState.players[0].mz=[l];gameState.players[1].mz=[q,w];baselineA();
  const a0=lp(0),b0=lp(1);foeBurn(q,w);
  ok('ライトン (Attack Position): the effect damage of the opponent\'s card was dealt to the opponent instead',lp(0)===a0&&lp(1)===b0-1000,JSON.stringify([a0,lp(0),b0,lp(1)]));
  audit('ライトン 1'); }
{ fresh();const l=mon(LIT,0,'def'),q=mon(QUE,1),w=mon('ワイト',1);gameState.players[0].mz=[l];gameState.players[1].mz=[q,w];baselineA();
  const a0=lp(0);foeBurn(q,w);
  ok('ライトン (Defense Position) negative: the effect damage is taken normally',lp(0)===a0-1000,JSON.stringify([a0,lp(0)])); }
{ fresh();const q=mon(QUE,1),w=mon('ワイト',1);gameState.players[1].mz=[q,w];baselineA();
  const a0=lp(0);foeBurn(q,w);
  ok('ライトン control: without it the effect damage is taken',lp(0)===a0-1000,JSON.stringify([a0,lp(0)])); }
{ fresh();const l=mon(LIT,0,'def'),f1=mon('青眼の白龍',1),f2=mon('青眼の白龍',1);gameState.players[0].mz=[l];gameState.players[1].mz=[f1,f2];baselineA();
  const a0=lp(0);toOppBattle();foeAttack(f1,l);foeAttack(f2,'direct');
  ok('ライトン (Defense Position): destroyed by battle → the battle damage to me is 0 for the rest of the turn (second attack direct)',z(l)==='grave'&&lp(0)===a0,JSON.stringify([z(l),a0,lp(0)]));
  audit('ライトン 2'); }

/* ===== エクストラ・ヴェーラー ===== */
{ fresh();const v=mk(VEI,0),q=mon(QUE,1),w=mon('ワイト',1),sm=mk('ワイト',1);gameState.players[0].hand=[v];gameState.players[1].mz=[q,w];gameState.players[1].hand=[sm];baselineA();
  endTurn();API.specialSummon(1,'hand',0,'atk','test');flushDeferredEventsV2();drive();
  ok('ヴェーラー: the opponent Special Summoned → it Special Summoned itself from the hand',z(v)==='mz'&&pl(v)===0,JSON.stringify([z(v),pl(v)]));
  const a0=lp(0),b0=lp(1);actP(1,q,[uid(w)]);
  ok('ヴェーラー: this turn the effect damage of the opponent\'s card was dealt to the opponent',lp(0)===a0&&lp(1)===b0-1000,JSON.stringify([a0,lp(0),b0,lp(1)]));
  audit('ヴェーラー 1'); }
{ fresh();const v=mk(VEI,0),sm=mk('ワイト',0);gameState.players[0].hand=[v];gameState.players[0].grave=[sm];baselineA();
  API.specialSummon(0,'grave',0,'atk','test');flushDeferredEventsV2();drive();
  ok('ヴェーラー negative: my own Special Summon does not trigger it',z(v)==='hand',z(v)); }

/* ===== ライフ・ストリーム・ドラゴン ===== */
{ fresh();const l=mon(LSD,0),q=mon(QUE,1),w=mon('ワイト',1);gameState.players[0].mz=[l];gameState.players[1].mz=[q,w];baselineA();
  const a0=lp(0);foeBurn(q,w);
  ok('ライフ・ストリーム: the effect damage to me is 0',lp(0)===a0,JSON.stringify([a0,lp(0)]));
  audit('ライフストリーム 1'); }
{ fresh();const l=mk(LSD,0);gameState.players[0].ex=[l];gameState.players[0].lp=6000;baselineA();
  API.specialSummon(0,'ex',0,'atk','test',null,{summonKind:'synchro'});flushDeferredEventsV2();drive();
  ok('ライフ・ストリーム: its Synchro Summon set my Life Points to 4000',z(l)==='mz'&&lp(0)===4000,JSON.stringify([z(l),lp(0)])); }
{ fresh();const l=mk(LSD,0);gameState.players[0].ex=[l];gameState.players[0].lp=6000;baselineA();
  API.specialSummon(0,'ex',0,'atk','test');flushDeferredEventsV2();drive();
  ok('ライフ・ストリーム negative: not a Synchro Summon → the Life Points are unchanged',z(l)==='mz'&&lp(0)===6000,JSON.stringify([z(l),lp(0)])); }
{ fresh();const l=mon(LSD,0),eq=mk('団結の力',0),bh=mk('ブラック・ホール',1);gameState.players[0].mz=[l];gameState.players[0].grave=[eq];gameState.players[1].hand=[bh];baselineA();
  endTurn();cast(1,'ブラック・ホール',[uid(eq)]);
  ok('ライフ・ストリーム: destroyed by ブラック・ホール → an Equip Spell of my Graveyard was banished instead; it stays',z(l)==='mz'&&z(eq)==='banish'&&z(bh)==='grave',JSON.stringify([z(l),z(eq),z(bh)]));
  audit('ライフストリーム 2'); }
{ fresh();const l=mon(LSD,0),bh=mk('ブラック・ホール',1);gameState.players[0].mz=[l];gameState.players[1].hand=[bh];baselineA();
  endTurn();cast(1,'ブラック・ホール');
  ok('ライフ・ストリーム negative: no Equip Spell in the Graveyard → destroyed',z(l)==='grave',z(l)); }

/* ===== ブラックフェザー・ドラゴン ===== */
{ fresh();const b=mon(BFD,0),q=mon(QUE,1),w=mon('ワイト',1);gameState.players[0].mz=[b];gameState.players[1].mz=[q,w];baselineA();
  const a0=lp(0),atk0=curATK(C(b));foeBurn(q,w);
  ok('ブラックフェザー: the effect damage was replaced by 1 黒羽 counter on it; its ATK dropped by 700',lp(0)===a0&&fk(b)===1&&curATK(C(b))===atk0-700,JSON.stringify([a0,lp(0),fk(b),atk0,curATK(C(b))]));
  audit('ブラックフェザー 1'); }
{ fresh();const b=mon(BFD,0),f=mon('ブラック・マジシャン',1);b.counters={'黒羽':2};gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  ok('ブラックフェザー: the effect is available (counters on it)',canZ(b)===true,'');
  const l1=lp(1),fa=curATK(C(f));actC(b,[uid(f)]);
  ok('ブラックフェザー: all counters removed; the target lost 700 x 2 ATK and the opponent took that damage; once per turn',fk(b)===0&&curATK(C(f))===fa-1400&&lp(1)===l1-1400&&canZ(b)===false,JSON.stringify([fk(b),fa,curATK(C(f)),l1,lp(1),canZ(b)]));
  audit('ブラックフェザー 2'); }
{ fresh();const b=mon(BFD,0),f=mon('ブラック・マジシャン',1);gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  ok('ブラックフェザー negative: no counter → the effect is not offered',canZ(b)===false,''); }
`);
