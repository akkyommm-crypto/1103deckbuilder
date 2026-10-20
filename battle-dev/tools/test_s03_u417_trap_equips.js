/* S03-U417: 植物連鎖, 燃える闘志, 身剣一体, イービル・ブラスト (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4110001;
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
const CHN='植物連鎖',FIR='燃える闘志',SWD='身剣一体',EVB='イービル・ブラスト';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function zoneAct(c){return getLegalZoneActions(0,'sz',idx(c)).some(x=>x.id==='activate'||x.id==='activateSet');}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function offered(p,c){return !!(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE&&EVT_V2_STATE.groups.some(g=>g.some(x=>x.card===C(c))));}
function eq(host,t){const h=C(host),e=C(t);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}

/* ===== 植物連鎖 ===== */
{ fresh();const t=setCard(CHN,0),pl=mon('きのこマン',0),gp=mk('きのこマン',0);gameState.players[0].sz=[t];gameState.players[0].mz=[pl];gameState.players[0].grave=[gp];baselineA();
  const a0=curATK(C(pl));
  ok('植物連鎖: activatable (a face-up Plant of mine)',zoneAct(t)===true,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id)));
  actSzC(t,[uid(pl)]);
  ok('植物連鎖: became an Equip Card on the Plant (ATK +500)',z(t)==='sz'&&eq(pl,t)&&curATK(C(pl))===a0+500,JSON.stringify([z(t),eq(pl,t),a0,curATK(C(pl))]));
  API.destroy(findCardByUid(t.uid),'test');flushDeferredEventsV2();PREFER=[uid(gp)];drive();PREFER=[];
  ok('植物連鎖: destroyed by a card effect → a Plant of my Graveyard was Special Summoned',z(t)==='grave'&&z(gp)==='mz',JSON.stringify([z(t),z(gp)]));
  audit('植物連鎖 1'); }
{ fresh();const t=setCard(CHN,0),pl=mon('きのこマン',0),gp=mk('きのこマン',0);gameState.players[0].sz=[t];gameState.players[0].mz=[pl];gameState.players[0].grave=[gp];baselineA();
  actSzC(t,[uid(pl)]);
  API.sendToGrave(findCardByUid(t.uid),'test');flushDeferredEventsV2();PREFER=[uid(gp)];drive();PREFER=[];
  ok('植物連鎖 negative: sent to the Graveyard without being destroyed by an effect → no revival',z(t)==='grave'&&z(gp)==='grave',JSON.stringify([z(t),z(gp)])); }
{ fresh();const t=setCard(CHN,0),w=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[w];baselineA();
  ok('植物連鎖 negative: no Plant on my field → not activatable',zoneAct(t)===false,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id))); }

/* ===== 燃える闘志 ===== */
{ fresh();const t=setCard(FIR,0),h=mon('ブラック・マジシャン',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[t];gameState.players[0].mz=[h];gameState.players[1].mz=[f];baselineA();
  actSzC(t,[uid(h)]);
  ok('燃える闘志: equipped to my monster; outside battle its ATK is unchanged',eq(h,t)&&curATK(C(h))===Number(dbOf(h).atk),JSON.stringify([eq(h,t),curATK(C(h))]));
  phase('battle');myAttack(h,f);
  ok('燃える闘志: attacking 青眼 (ATK 3000 > the printed 2500) the ATK doubled in the Damage Step → 青眼 destroyed, ブラック・マジシャン survives',z(f)==='grave'&&z(h)==='mz',JSON.stringify([z(f),z(h)]));
  audit('燃える闘志 1'); }
{ fresh();const t=setCard(FIR,0),h=mon('ブラック・マジシャン',0),f=mon('ワイト',1);gameState.players[0].sz=[t];gameState.players[0].mz=[h];gameState.players[1].mz=[f];baselineA();
  actSzC(t,[uid(h)]);const l0=lp(1);
  phase('battle');myAttack(h,f);
  ok('燃える闘志 negative: the opponent monster (ワイト 1200) is not above the printed ATK → no doubling (damage 2500-1200)',z(f)==='grave'&&l0-lp(1)===Number(dbOf(h).atk)-Number(dbOf(f).atk),JSON.stringify([z(f),l0,lp(1)])); }
{ fresh();const h=mon('ブラック・マジシャン',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[h];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(h,f);
  ok('燃える闘志 control: without the card ブラック・マジシャン loses to 青眼',z(h)==='grave'&&z(f)==='mz',JSON.stringify([z(h),z(f)])); }

/* ===== 身剣一体 ===== */
{ fresh();const t=setCard(SWD,0),h=mon('X－セイバー アナペレラ',0),f=mon('ワイト',1);gameState.players[0].sz=[t];gameState.players[0].mz=[h];gameState.players[1].mz=[f];baselineA();
  ok('身剣一体: activatable (「X－セイバー」 is the only monster of mine)',zoneAct(t)===true,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id)));
  const a0=curATK(C(h));actSzC(t);
  ok('身剣一体: became an Equip Card on it (ATK +800)',eq(h,t)&&curATK(C(h))===a0+800,JSON.stringify([eq(h,t),a0,curATK(C(h))]));
  const n0=gameState.players[0].hand.length;
  phase('battle');myAttack(h,f);
  ok('身剣一体: the equipped monster destroyed ワイト in battle → I drew a card',z(f)==='grave'&&gameState.players[0].hand.length===n0+1,JSON.stringify([z(f),n0,gameState.players[0].hand.length]));
  audit('身剣一体 1'); }
{ fresh();const t=setCard(SWD,0),h=mon('X－セイバー アナペレラ',0),o=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[h,o];baselineA();
  ok('身剣一体 negative: another monster of mine on the field → not activatable',zoneAct(t)===false,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id))); }
{ fresh();const t=setCard(SWD,0),o=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[o];baselineA();
  ok('身剣一体 negative: a lone monster that is not an 「X－セイバー」 → not activatable',zoneAct(t)===false,JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id))); }

/* ===== イービル・ブラスト ===== */
{ fresh();const t=setCard(EVB,0),rv=mk('死者蘇生',1),gy=mk('ブラック・マジシャン',1);gameState.players[0].sz=[t];gameState.players[1].hand=[rv];gameState.players[1].grave=[gy];baselineA();
  endTurn();
  foeCast('死者蘇生',[uid(gy)]);
  for(let i=0;i<12&&!offered(0,t)&&(gameState.chainWindow||gameState.chain.length);i++){chainPassV2();for(let k=0;k<6&&pc();k++)pick();}
  ok('イービル・ブラスト: the opponent Special Summoned a monster → the Set Trap is offered',z(gy)==='mz'&&offered(0,t)===true,JSON.stringify([z(gy),offered(0,t)]));
  drive();
  const a0=Number(dbOf(gy).atk)||0;
  ok('イービル・ブラスト: it became an Equip Card on that monster (ATK +500)',z(t)==='sz'&&eq(gy,t)&&curATK(C(gy))===a0+500,JSON.stringify([z(t),eq(gy,t),a0,curATK(C(gy))]));
  const l0=lp(1);endTurn();endTurn();
  ok('イービル・ブラスト: 500 damage to the opponent at their next Standby Phase',lp(1)===l0-500,JSON.stringify([l0,lp(1)]));
  audit('イービル・ブラスト 1'); }
{ fresh();const t=setCard(EVB,0),gy=mk('ブラック・マジシャン',0);gameState.players[0].sz=[t];gameState.players[0].grave=[gy];baselineA();
  API.specialSummon(0,'grave',0,'atk','test');flushDeferredEventsV2();drive();
  ok('イービル・ブラスト negative: my own Special Summon does not offer it',offered(0,t)===false&&z(t)==='sz'&&!C(t).equipTo,JSON.stringify([offered(0,t),z(t)])); }
`);
