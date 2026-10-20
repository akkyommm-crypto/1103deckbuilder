/* S03-U393: 封魔の呪印, 暴君の暴言, 暗黒界の書物 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3930001;
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



















const SEA='封魔の呪印',TYR='暴君の暴言',BOK='暗黒界の書物';
function szActs(p,c){return getLegalZoneActions(p,'sz',idx(c)).map(a=>a.id);}
function mzActs(p,c){return getLegalZoneActions(p,'mz',idx(c)).map(a=>a.id);}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function endTurnOpen(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});for(let i=0;i<50;i++){const q=pc();if(q)return q;if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}return pc();}
function answerUids(uids){const q=pc();if(!q)return false;const keys=uids.map(u=>{const c=q.candidates.find(x=>x.uid===u||(x.card&&x.card.uid===u));return c&&c.key;});answerChoiceV49(keys);return true;}
function legalHp(p,i){return getLegalHandActions(p,i).some(x=>x.id==='activate');}

/* ===== 封魔の呪印 ===== */
function sealField(){fresh();const sl=faceSet(SEA,0),fod=mk('ブラック・ホール',0),bh=mk('ブラック・ホール',1),bh2=mk('ブラック・ホール',1);gameState.activePlayer=1;
  gameState.players[0].sz=[sl];gameState.players[0].hand=[fod];gameState.players[1].hand=[bh,bh2];gameState.players[0].mz=[mon('ワイト',0)];baselineA();return {sl,fod,bh,bh2};}
{ const x=sealField();
  duelActivateFromHand(0);for(let i=0;i<4&&pc();i++)pick();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('封魔: offered against the opponent Spell Card activation',resp.some(r=>r.card===x.sl),JSON.stringify(resp.map(r=>r.db.n)));
  PREFER=[uid(x.fod)];duelActivateResponseV2(0,'sz',0);drive();PREFER=[];
  ok('封魔: the Spell of my hand was discarded (cost); ブラック・ホール negated and destroyed; my ワイト survived',z(x.fod)==='grave'&&z(x.bh)==='grave'&&z(x.sl)==='grave'&&gameState.players[0].mz.length===1,JSON.stringify({fod:z(x.fod),bh:z(x.bh),sl:z(x.sl)}));
  const ban=(gameState.players[1].effectFlags||{}).activationBanNamesS03;
  ok('封魔: 「ブラック・ホール」 is banned for the opponent for the rest of the duel',Array.isArray(ban)&&ban.indexOf('ブラック・ホール')>=0,JSON.stringify(ban));
  ok('封魔: the opponent cannot activate the second ブラック・ホール',legalHp(1,gameState.players[1].hand.findIndex(c=>c===x.bh2))===false,'');
  endTurn();endTurn();endTurn();
  ok('封魔: the ban lasts across turns',(gameState.players[1].effectFlags.activationBanNamesS03||[]).indexOf('ブラック・ホール')>=0&&legalHp(1,gameState.players[1].hand.findIndex(c=>c===x.bh2))===false,'');
  audit('封魔 1'); }
{ fresh();const sl=faceSet(SEA,0),bh=mk('ブラック・ホール',1);gameState.activePlayer=1;gameState.players[0].sz=[sl];gameState.players[1].hand=[bh];gameState.players[0].mz=[mon('ワイト',0)];baselineA();
  duelActivateFromHand(0);for(let i=0;i<4&&pc();i++)pick();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('封魔 negative: no Spell Card in my hand → not offered',!resp.some(r=>r.card===sl),JSON.stringify(resp.map(r=>r.db.n))); drive(); }

/* ===== 暴君の暴言 ===== */
{ fresh();const t=faceSet(TYR,0),m1=mon('ワイト',0),m2=mon('ゴブリン突撃部隊',0),k=mon('白竜の聖騎士',0),bw=mk('青眼の白龍',0),fk=mon('白竜の聖騎士',1),bw1=mk('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[m1,m2,k];gameState.players[0].hand=[bw];gameState.players[1].mz=[fk];gameState.players[1].hand=[bw1];baselineA();
  ok('暴言 control: my 白竜の聖騎士 effect is available before the trap',canZ(k)===true,JSON.stringify(mzActs(0,k)));
  actSzC(t,[uid(m1),uid(m2)]);
  ok('暴言: two monsters released (cost); the trap is face-up',z(m1)==='grave'&&z(m2)==='grave'&&z(k)==='mz'&&z(t)==='sz'&&C(t).face==='up',JSON.stringify({m1:z(m1),m2:z(m2),k:z(k),t:z(t),face:C(t)&&C(t).face}));
  ok('暴言: my monster effect on the field can no longer be activated',canZ(k)===false,JSON.stringify(mzActs(0,k)));
  endTurn();
  ok('暴言: nor the opponent monster effect on the field',mzActs(1,fk).indexOf('effect')<0,JSON.stringify(mzActs(1,fk)));
  audit('暴言 1'); }
{ fresh();const fk=mon('白竜の聖騎士',1),bw1=mk('青眼の白龍',1);gameState.players[1].mz=[fk];gameState.players[1].hand=[bw1];baselineA();
  endTurn();
  ok('暴言 control: without the trap the opponent monster effect is available in their turn',mzActs(1,fk).indexOf('effect')>=0,JSON.stringify(mzActs(1,fk))); }
{ fresh();const t=faceSet(TYR,0),m1=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[m1];baselineA();
  actSzC(t,[uid(m1)]);
  ok('暴言 negative: only one monster → the trap is not activated (stays Set)',z(t)==='sz'&&C(t).face==='down'&&z(m1)==='mz',JSON.stringify({t:z(t),face:C(t)&&C(t).face,m1:z(m1)})); }

/* ===== 暗黒界の書物 ===== */
function bookField(){fresh();const bk=mk(BOK,0,'up'),w=mk('ワイト',0);gameState.players[0].sz=[];gameState.players[0].hand=[w].concat(Array.from({length:7},()=>mk('ブラック・ホール',0)));return {bk,w};}
{ const {bk,w}=bookField();gameState.players[0].hand.push(bk);baselineA();
  ok('書物: the Continuous Spell can be activated from the hand',legalHp(0,gameState.players[0].hand.length-1),'');
  PREFER=[];duelActivateFromHand(gameState.players[0].hand.length-1);drive();
  ok('書物: it stands face-up in the Spell & Trap Zone',z(bk)==='sz'&&C(bk).face==='up',JSON.stringify([z(bk),C(bk)&&C(bk).face]));
  const hs=gameState.players[0].hand.length;
  const ex=hs-6;
  const disc=[uid(w)].concat(gameState.players[0].hand.filter(c=>c!==w).slice(0,ex-1).map(c=>uid(c)));
  const q0=endTurnOpen();
  ok('書物: the hand-limit discard choice opens',!!q0&&q0.min===ex,JSON.stringify(q0&&q0.min));
  answerUids(disc);PREFER=['yes',uid(w)];drive();PREFER=[];
  ok('書物: the monster discarded by the hand limit was Special Summoned (one only)',z(w)==='mz'&&gameState.players[0].hand.length<=6,JSON.stringify([z(w),gameState.players[0].hand.length,hs]));
  audit('書物 1'); }
{ fresh();const bk=mk(BOK,0,'up'),w=mk('ワイト',0);gameState.players[0].sz=[bk];gameState.players[0].hand=Array.from({length:8},()=>mk('ブラック・ホール',0));baselineA();
  const q1=endTurnOpen();answerUids(gameState.players[0].hand.slice(0,2).map(c=>uid(c)));PREFER=['yes'];drive();PREFER=[];
  ok('書物 negative: only Spell Cards discarded → nothing is summoned',gameState.players[0].mz.length===0,String(gameState.players[0].mz.length)); }
`);
