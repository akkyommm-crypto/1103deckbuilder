/* S03-U435: ニュート, 創世竜, 同族感電ウィルス, ゼロ・ガードナー, レッサー・デーモン (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4230001;
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
const NEW='ニュート',GEN='創世竜',VIR='同族感電ウィルス',ZER='ゼロ・ガードナー',LES='レッサー・デーモン';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function H(c){return findCardByUid(c.uid);}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}

/* ===== ニュート ===== */
{ fresh();const n=mk(NEW,0,'down','def');n.setTurn=3;const f=mon('ワイト',1);gameState.players[0].mz=[n];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,n);
  ok('ニュート: flipped by an attack → ATK / DEF +500 permanently (1900 / 400 → 2400 / 900)',z(n)==='mz'&&curATK(C(n))===2400&&curDEF(C(n))===900,JSON.stringify([z(n),curATK(C(n)),curDEF(C(n))]));
  audit('ニュート flip'); }
{ fresh();const n=mk(NEW,0,'down','def');n.setTurn=3;const f=mon('青眼の白龍',1);gameState.players[0].mz=[n];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,n);
  ok('ニュート: destroyed in battle by a monster → that monster lost 500 ATK / DEF (3000 / 2500 → 2500 / 2000)',z(n)==='grave'&&curATK(C(f))===2500&&curDEF(C(f))===2000,JSON.stringify([z(n),curATK(C(f)),curDEF(C(f))]));
  audit('ニュート slayer'); }
{ fresh();const n=mon(NEW,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[n];gameState.players[1].mz=[f];baselineA();
  API.destroy(H(n),'test');flushDeferredEventsV2();drive();
  ok('ニュート negative: destroyed by an effect → nothing happens to the opponent monster',z(n)==='grave'&&curATK(C(f))===3000,JSON.stringify([z(n),curATK(C(f))])); }

/* ===== 創世竜 ===== */
{ fresh();const g=mon(GEN,0),a=mk('青眼の白龍',0),w=mk('ワイト',0),r=mk('真紅眼の黒竜',0);gameState.players[0].mz=[g];gameState.players[0].hand=[a,w];gameState.players[0].grave=[r];baselineA();
  ok('創世竜: available with a Dragon in my hand',canZ(g)===true,'');
  actC(g,[uid(a),uid(r)]);
  ok('創世竜: the hand Dragon went to the Graveyard and the chosen Graveyard Dragon was added to the hand',z(a)==='grave'&&z(r)==='hand'&&z(w)==='hand',JSON.stringify([z(a),z(r),z(w)]));
  ok('創世竜: once per turn',canZ(g)===false,'');
  audit('創世竜 1'); }
{ fresh();const g=mon(GEN,0),w=mk('ワイト',0);gameState.players[0].mz=[g];gameState.players[0].hand=[w];baselineA();
  ok('創世竜 negative: no Dragon in my hand → not available',canZ(g)===false,''); }
{ fresh();const g=mon(GEN,0),d1=mk('真紅眼の黒竜',0),d2=mk('青眼の白龍',0),wi=mk('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[g];gameState.players[0].grave=[d1,d2,wi];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,g);
  ok('創世竜: sent from the field to the Graveyard → every Dragon of my Graveyard (itself included) returned to the Deck, the non-Dragon stays',z(g)==='deck'&&z(d1)==='deck'&&z(d2)==='deck'&&z(wi)==='grave',JSON.stringify([z(g),z(d1),z(d2),z(wi)]));
  audit('創世竜 2'); }

/* ===== 同族感電ウィルス ===== */
{ fresh();const v=mon(VIR,0),u1=mon('ワイト',0),u2=mon('ワイト',1),dr=mon('青眼の白龍',1),h=mk('ワイト',0);gameState.players[0].mz=[v,u1];gameState.players[1].mz=[u2,dr];gameState.players[0].hand=[h];baselineA();
  ok('ウィルス: available with a monster in my hand',canZ(v)===true,'');
  actC(v,[uid(h)]);
  ok('ウィルス: the banished monster\'s race (Undead) — every face-up Undead of both fields was destroyed; the Dragon and the Thunder virus stay',z(u1)==='grave'&&z(u2)==='grave'&&z(dr)==='mz'&&z(v)==='mz'&&z(h)==='banish',JSON.stringify([z(u1),z(u2),z(dr),z(v),z(h)]));
  audit('ウィルス 1'); }
{ fresh();const v=mon(VIR,0);gameState.players[0].mz=[v];baselineA();
  ok('ウィルス negative: no monster in my hand → not available',canZ(v)===false,''); }

/* ===== ゼロ・ガードナー ===== */
{ fresh();const z0=mon(ZER,0),b=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[z0,b];gameState.players[1].mz=[f];baselineA();
  ok('ゼロ・ガードナー: available (Quick Effect from the Monster Zone)',canZ(z0)===true,'');
  actC(z0,[]);
  ok('ゼロ・ガードナー: it was Released (sent to the Graveyard)',z(z0)==='grave',z(z0));
  const l0=lp(0);phase('battle');myAttack(b,f);
  ok('ゼロ・ガードナー: my weak attacker (ATK 300 vs 3000) was not destroyed and I took no battle damage',z(b)==='mz'&&lp(0)===l0,JSON.stringify([z(b),l0,lp(0)]));
  audit('ゼロ・ガードナー 1'); }
{ fresh();const b=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  const l0=lp(0);phase('battle');myAttack(b,f);
  ok('ゼロ・ガードナー control: without it the attacker is destroyed and the damage is taken',z(b)==='grave'&&lp(0)<l0,JSON.stringify([z(b),l0,lp(0)])); }

/* ===== レッサー・デーモン ===== */
{ fresh();const d=mon(LES,0),f=mon('ワイト',1);gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(d,f);
  ok('レッサー・デーモン: the monster it destroyed in battle was banished instead of going to the Graveyard',z(f)==='banish',z(f));
  audit('レッサー・デーモン 1'); }
{ fresh();const d=mon('ブラック・マジシャン',0),f=mon('ワイト',1);gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(d,f);
  ok('レッサー・デーモン control: another attacker sends it to the Graveyard',z(f)==='grave',z(f)); }
`);
