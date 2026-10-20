/* S03-U452: 墓掘りグール, システム・ダウン, 奇跡の発掘, トロイボム (stale ENGINE_GAP Spells / Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4330001;
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
const GHL='墓掘りグール',SYS='システム・ダウン',MIR='奇跡の発掘',TRO='トロイボム';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}
function fc(name,prefer){foeCast(name,prefer);PREFER=(prefer||[]).slice();drive();PREFER=[];}
let ALL452=false;const __p452=pick;pick=function(){const q=pc();if(q&&q.title.indexOf('墓掘りグール')>=0){const ks=ALL452?q.candidates.map(c=>c.key):q.candidates.filter(c=>PREFER.indexOf(c.uid)>=0||(c.card&&PREFER.indexOf(c.card.uid)>=0)).map(c=>c.key);answerChoiceV49(ks);return;}return __p452();};

/* ===== 墓掘りグール ===== */
{ fresh();const sp=mk(GHL,0),a=mk('ワイト',1),b=mk('ブラック・マジシャン',1),s=mk('サンダー・ボルト',1);gameState.players[0].hand=[sp];gameState.players[1].grave=[a,b,s];baselineA();
  ALL452=true;cast(0,GHL);ALL452=false;
  ok('墓掘りグール: the two monsters of the opponent Graveyard were banished (the Spell stays)',z(a)==='banish'&&z(b)==='banish'&&z(s)==='grave',JSON.stringify([z(a),z(b),z(s)]));
  audit('墓掘りグール 1'); }
{ fresh();const sp=mk(GHL,0),a=mk('ワイト',1),b=mk('ブラック・マジシャン',1);gameState.players[0].hand=[sp];gameState.players[1].grave=[a,b];baselineA();
  cast(0,GHL,[uid(b)]);
  ok('墓掘りグール: choosing one monster banishes only that one',z(b)==='banish'&&z(a)==='grave',JSON.stringify([z(a),z(b)]));
  audit('墓掘りグール 2'); }
{ fresh();const sp=mk(GHL,0),s=mk('サンダー・ボルト',1);gameState.players[0].hand=[sp];gameState.players[1].grave=[s];baselineA();
  ok('墓掘りグール negative: no monster in the opponent Graveyard → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== システム・ダウン ===== */
{ fresh();const sp=mk(SYS,0),m1=mon('サイバー・ドラゴン',1),m2=mk('サイバー・ドラゴン',1,'down','def'),m3=mon('ワイト',1),g1=mk('サイバー・ドラゴン',1),g2=mk('ワイト',1),own=mon('サイバー・ドラゴン',0),og=mk('サイバー・ドラゴン',0);
  gameState.players[0].hand=[sp];gameState.players[0].mz=[own];gameState.players[0].grave=[og];gameState.players[1].mz=[m1,m2,m3];gameState.players[1].grave=[g1,g2];baselineA();
  const l0=lp(0);cast(0,SYS);
  ok('システム・ダウン: 1000 LP paid; the face-up Machine and the Machine of the opponent Graveyard were banished (face-down monster, other races and my own cards stay)',lp(0)===l0-1000&&z(m1)==='banish'&&z(g1)==='banish'&&z(m2)==='mz'&&z(m3)==='mz'&&z(g2)==='grave'&&z(own)==='mz'&&z(og)==='grave',JSON.stringify([l0,lp(0),z(m1),z(m2),z(m3),z(g1),z(g2),z(own),z(og)]));
  audit('システム・ダウン 1'); }
{ fresh();const sp=mk(SYS,0);gameState.players[0].hand=[sp];gameState.players[0].lp=1000;baselineA();
  ok('システム・ダウン negative: LP 1000 or less → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 奇跡の発掘 ===== */
{ fresh();const sp=mk(MIR,0),B=[1,2,3,4,5].map((i)=>mk(i%2?'ワイト':'ブラック・マジシャン',0)),x=mk('サンダー・ボルト',0);gameState.players[0].hand=[sp];gameState.players[0].banish=B.concat([x]);baselineA();
  const us=B.map(c=>uid(c));cast(0,MIR,[us[1],us[3],us[4]]);
  ok('奇跡の発掘: the three chosen banished monsters returned to the Graveyard (the other two and the Spell stay banished)',z(B[1])==='grave'&&z(B[3])==='grave'&&z(B[4])==='grave'&&z(B[0])==='banish'&&z(B[2])==='banish'&&z(x)==='banish',JSON.stringify(B.map(z).concat([z(x)])));
  audit('奇跡の発掘 1'); }
{ fresh();const sp=mk(MIR,0),B=[1,2,3,4].map(()=>mk('ワイト',0)),x=mk('サンダー・ボルト',0);gameState.players[0].hand=[sp];gameState.players[0].banish=B.concat([x]);baselineA();
  ok('奇跡の発掘 negative: only 4 banished monsters (the Spell does not count) → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== トロイボム ===== */
{ fresh();const tr=setTrap(TRO,0),bm=mon('ブラック・マジシャン',0),mc=mk('心変わり',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[bm];gameState.players[1].hand=[mc];gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';baselineA();
  const l1=lp(1);fc('心変わり',[uid(bm)]);
  ok('トロイボム: my monster taken by 心変わり was destroyed and the opponent took its ATK (2500) as damage',z(bm)==='grave'&&H(bm).p===0&&lp(1)===l1-2500&&z(tr)==='grave',JSON.stringify([z(bm),lp(1),l1,z(tr),SEEN.length]));
  audit('トロイボム 1'); }
{ fresh();const tr=setTrap(TRO,0),bm=mon('ブラック・マジシャン',0);gameState.players[0].sz=[tr];gameState.players[0].mz=[bm];baselineA();
  ok('トロイボム negative: no control change → not activatable',legalT(0)===false,''); }
`);
