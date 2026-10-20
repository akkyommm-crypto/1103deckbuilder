/* S03-U444: スパイダー・エッグ, スリップ・サモン, パイナップル爆弾, ヘル・ブラスト, ブロークン・ブロッカー (stale ENGINE_GAP Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x42C0001;
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
const EGG='スパイダー・エッグ',SLP='スリップ・サモン',PIN='パイナップル爆弾',HBL='ヘル・ブラスト',BRK='ブロークン・ブロッカー';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':target});}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(c){return (getChainResponsesV2(0)||[]).some(r=>r.card===c);}
function toks(n,p){return gameState.players[p].mz.filter(c=>cardName(c)===n).length;}
function toOppBattle(){endTurn();phase('battle');}

/* ===== スパイダー・エッグ ===== */
{ fresh();const tr=setTrap(EGG,0),i1=mk('C・ラーバ',0),i2=mk('C・ラーバ',0),i3=mk('C・ラーバ',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].grave=[i1,i2,i3];gameState.players[1].mz=[f];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();const l0=lp(0);
  foeAttack(f,'direct');const ok1=toPoint('attackDeclare');const off=ok1&&offered(tr);if(off){pointActivateV27(0,'sz',0);}drive();
  ok('スパイダー・エッグ: at the opponent direct attack with 3 Insects in my Graveyard — the attack was negated and 3 トークン (ATK 100) stand in Attack Position',off&&lp(0)===l0&&toks('スパイダー・トークン',0)===3&&gameState.players[0].mz.every(c=>c.pos==='atk'),JSON.stringify([off,l0,lp(0),toks('スパイダー・トークン',0)]));
  audit('エッグ 1'); }
{ fresh();const tr=setTrap(EGG,0),i1=mk('C・ラーバ',0),i2=mk('C・ラーバ',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].grave=[i1,i2];gameState.players[1].mz=[f];
  gameState.activePlayer=1;gameState.phase='battle';baselineA();foeAttack(f,'direct');const ok1=toPoint('attackDeclare');
  ok('スパイダー・エッグ negative: only 2 Insects in my Graveyard → not offered',!(ok1&&offered(tr)),String(ok1&&offered(tr))); }

/* ===== スリップ・サモン ===== */
{ fresh();const tr=setTrap(SLP,0),h4=mk('キラー・トマト',0),fo=mk('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].hand=[h4];gameState.players[1].hand=[fo];baselineA();
  PREFER=[uid(h4)];API.specialSummon(1,'hand',0,'atk','test');flushDeferredEventsV2();drive();PREFER=[];
  ok('スリップ・サモン: the opponent monster was Special Summoned → a Level 4 or lower monster of my hand stands face-up in Defense Position',z(fo)==='mz'&&z(h4)==='mz'&&C(h4).pos==='def'&&C(h4).face==='up',JSON.stringify([z(fo),z(h4),C(h4)&&C(h4).pos]));
  phase('end');
  ok('スリップ・サモン: it returned to my hand at the End Phase',z(h4)==='hand',z(h4));
  audit('スリップ 1'); }
{ fresh();const tr=setTrap(SLP,0),h4=mk('キラー・トマト',0),mine=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].hand=[h4,mine];baselineA();
  API.specialSummon(0,'hand',1,'atk','test');flushDeferredEventsV2();drive();
  ok('スリップ・サモン negative: my own summon does not trigger it',z(tr)==='sz'&&z(h4)==='hand',JSON.stringify([z(tr),z(h4)])); }

/* ===== パイナップル爆弾 ===== */
{ fresh();const tr=setTrap(PIN,0),m=mk('ワイト',0),f1=mon('ワイト',1),f2=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].hand=[m];gameState.players[1].mz=[f1,f2];baselineA();
  PREFER=[uid(f1)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('パイナップル爆弾: they have 2 monsters against my 1 → the opponent chose 1 of their own cards (ワイト) and it was destroyed',z(m)==='mz'&&z(f1)==='grave'&&z(f2)==='mz',JSON.stringify([z(m),z(f1),z(f2)]));
  audit('パイナップル 1'); }
{ fresh();const tr=setTrap(PIN,0),m=mk('ワイト',0),f1=mon('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].hand=[m];gameState.players[1].mz=[f1];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('パイナップル爆弾 negative: equal monster counts after my summon → nothing destroyed',z(f1)==='mz'&&z(tr)==='sz',JSON.stringify([z(f1),z(tr)])); }

/* ===== ヘル・ブラスト ===== */
{ fresh();const tr=setTrap(HBL,0),a=mon('ワイト',0),b=mon('青眼の白龍',0),f=mon('ブラック・マジシャン',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[a,b];gameState.players[1].mz=[f];baselineA();
  const l0=lp(0),l1=lp(1);API.destroy(H(a),'test');flushDeferredEventsV2();drive();
  ok('ヘル・ブラスト: my monster was destroyed → the lowest-ATK face-up monster (ブラック・マジシャン 2500) was destroyed and both took 1250',z(a)==='grave'&&z(f)==='grave'&&z(b)==='mz'&&l0-lp(0)===1250&&l1-lp(1)===1250,JSON.stringify([z(a),z(f),z(b),l0-lp(0),l1-lp(1)]));
  audit('ヘル・ブラスト 1'); }
{ fresh();const tr=setTrap(HBL,0),a=mon('ワイト',0),f=mon('ブラック・マジシャン',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[f];gameState.players[0].mz=[a];baselineA();
  API.destroy(H(f),'test');flushDeferredEventsV2();drive();
  ok('ヘル・ブラスト negative: the opponent monster destroyed → not triggered',z(tr)==='sz'&&z(a)==='mz',JSON.stringify([z(tr),z(a)])); }

/* ===== ブロークン・ブロッカー ===== */
{ fresh();const tr=setTrap(BRK,0),iv=mon('アイヴィ・ウォール',0,'def'),d1=mk('アイヴィ・ウォール',0),d2=mk('アイヴィ・ウォール',0),d3=mk('アイヴィ・ウォール',0),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[tr];gameState.players[0].mz=[iv];gameState.players[0].deck.push(d1,d2,d3);gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,0);drive();
  ok('ブロークン・ブロッカー: my DEF 1200 > ATK 300 Defense Position monster was destroyed by battle → 2 same-name copies from the Deck stand face-up in Defense Position',z(iv)==='grave'&&[d1,d2,d3].filter(c=>z(c)==='mz').length===2&&[d1,d2,d3].every(c=>z(c)!=='mz'||(C(c).pos==='def'&&C(c).face==='up')),JSON.stringify([z(iv),z(d1),z(d2),z(d3)]));
  audit('ブロッカー 1'); }
{ fresh();const tr=setTrap(BRK,0),w=mon('ワイト',0,'def'),d1=mk('ワイト',0),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[0].deck.push(d1);gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,0);drive();
  ok('ブロークン・ブロッカー negative: DEF 200 is not higher than ATK 300 (ワイト) → not triggered',z(tr)==='sz'&&z(d1)==='deck',JSON.stringify([z(tr),z(d1)])); }
`);
