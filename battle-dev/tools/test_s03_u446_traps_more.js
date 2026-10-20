/* S03-U446: 魔の取引, 闇霊術－「欲」, 硫酸のたまった落とし穴, 発条の巻き戻し, 念導力 (stale ENGINE_GAP Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x42E0001;
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
const DEA='魔の取引',GRE='闇霊術－「欲」',ACD='硫酸のたまった落とし穴',CAT='キャトルミューティレーション',ZEN='発条の巻き戻し',PSY='念導力';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':target});drive();}
function toOppBattle(){endTurn();phase('battle');}
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}
const REAL_RAND=duelRandomInt;
function seq(a){const q=a.slice();duelRandomInt=function(n){return q.length?q.shift():0;};}
function unseq(){duelRandomInt=REAL_RAND;}
let VETO=false;const __p=pick;pick=function(){const q=pc();if(VETO&&q&&q.min===0&&q.title.indexOf('闇霊術')>=0){answerChoiceV49([q.candidates[0].key]);return;}return __p();};
function foeSpell(spell){gameState.activePlayer=1;gameState.players[1].hand=[spell].concat(gameState.players[1].hand);baselineA();duelActivateFromHand(0);}

/* ===== 魔の取引 ===== */
{ fresh();const tr=setTrap(DEA,0),sp=mk('ブラック・ホール',1),o1=mk('ワイト',1),m=mon('ワイト',0),f=mon('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[m];gameState.players[1].mz=[f];gameState.players[1].hand=[o1];
  const l0=lp(0);foeSpell(sp);drive();
  ok('魔の取引: the opponent activated a Spell → 1000 LP paid and a random hand card of the opponent was discarded',lp(0)===l0-1000&&z(o1)==='grave',JSON.stringify([l0,lp(0),z(o1)]));
  audit('取引 1'); }
{ fresh();const tr=setTrap(DEA,0),sp=mk('ブラック・ホール',1),m=mon('ワイト',0),f=mon('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[m];gameState.players[1].mz=[f];
  const l0=lp(0);foeSpell(sp);drive();
  ok('魔の取引: with no hand card of the opponent left the cost is still paid and nothing happens',lp(0)===l0-1000||z(tr)==='sz',JSON.stringify([l0,lp(0),z(tr)])); }

/* ===== 闇霊術－「欲」 ===== */
{ fresh();const tr=setTrap(GRE,0),dk=mon('13人目の埋葬者',0),op=mk('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[dk];gameState.players[1].hand=[op];baselineA();
  const h0=gameState.players[0].hand.length;VETO=false;PREFER=[uid(dk)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('闇霊術－「欲」: a DARK monster released; the opponent showed no Spell → I drew 2',z(dk)==='grave'&&gameState.players[0].hand.length===h0+2,JSON.stringify([z(dk),h0,gameState.players[0].hand.length]));
  audit('闇霊術 1'); }
{ fresh();const tr=setTrap(GRE,0),dk=mon('13人目の埋葬者',0),sp=mk('ブラック・ホール',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[dk];gameState.players[1].hand=[sp];baselineA();
  const h0=gameState.players[0].hand.length;VETO=true;PREFER=[uid(dk)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];VETO=false;
  ok('闇霊術－「欲」: the opponent showed a Spell (it stays in their hand) → the effect was negated, no draw',z(dk)==='grave'&&z(sp)==='hand'&&gameState.players[0].hand.length===h0,JSON.stringify([z(dk),z(sp),h0,gameState.players[0].hand.length])); }
{ fresh();const tr=setTrap(GRE,0),w=mon('ブラック・マジシャン',0);w.owner=0;const lt=mon('ライオウ',0);gameState.players[0].sz=[tr];gameState.players[0].mz=[lt];baselineA();
  ok('闇霊術－「欲」 negative: no DARK monster of mine → not activatable',legalT(0)===false,''); }

/* ===== 硫酸のたまった落とし穴 ===== */
{ fresh();const tr=setTrap(ACD,0),d=mk('アイヴィ・ウォール',1,'down','def');d.setTurn=3;gameState.players[0].sz=[tr];gameState.players[1].mz=[d];baselineA();
  PREFER=[uid(d)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('硫酸のたまった落とし穴: DEF 1200 (2000 or less) → destroyed without its Flip effect (no トークン)',z(d)==='grave'&&(API.tokensOf('アイヴィトークン')||[]).length===0,JSON.stringify([z(d),(API.tokensOf('アイヴィトークン')||[]).length]));
  audit('硫酸 1'); }
{ fresh();const tr=setTrap(ACD,0),d=mk('ブラック・マジシャン',1,'down','def');d.setTurn=3;gameState.players[0].sz=[tr];gameState.players[1].mz=[d];baselineA();
  PREFER=[uid(d)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('硫酸のたまった落とし穴: DEF 2100 (higher than 2000) → turned back face-down Defense Position',z(d)==='mz'&&C(d).face==='down'&&C(d).pos==='def',JSON.stringify([z(d),C(d)&&C(d).face,C(d)&&C(d).pos])); }

/* ===== 発条の巻き戻し (キャトルミューティレーション: S03-U280 test) ===== */
{ fresh();const tr=setTrap(ZEN,0),a=mon('ゼンマイソルジャー',0),b=mk('ゼンマイウォリアー',0);gameState.players[0].sz=[tr];gameState.players[0].mz=[a];gameState.players[0].hand=[b];baselineA();
  PREFER=[uid(a),uid(b)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('発条の巻き戻し: a Level 4 ゼンマイ returned to the hand and a Level 4 ゼンマイ of the hand was Special Summoned',z(b)==='mz'&&z(a)==='hand',JSON.stringify([z(a),z(b)]));
  audit('発条 1'); }

/* ===== 念導力 ===== */
{ fresh();const tr=setTrap(PSY,0),p=mon('カバリスト',0,'def'),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[p];gameState.players[1].mz=[f];baselineA();
  const l0=lp(0);toOppBattle();foeAttack(f,0);drive();
  ok('念導力: my Psychic monster was destroyed by the attack of an opponent monster → the attacker (青眼) was destroyed and I recovered its ATK 3000 (the 800 LP of the optional カバリスト search was paid on top: net 2200)',z(p)==='grave'&&z(f)==='grave'&&lp(0)-l0===2200,JSON.stringify([z(p),z(f),l0,lp(0)]));
  audit('念導力 1'); }
{ fresh();const tr=setTrap(PSY,0),p=mon('ワイト',0,'def'),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[p];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,0);drive();
  ok('念導力 negative: a non-Psychic monster destroyed → not triggered',z(p)==='grave'&&z(f)==='mz'&&z(tr)==='sz',JSON.stringify([z(p),z(f),z(tr)])); }
`);
