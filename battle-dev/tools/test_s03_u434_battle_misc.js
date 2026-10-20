/* S03-U434: インセクト・プリンセス, ツインヘッド・ケルベロス, 代打バッター, 穿孔虫, 白兵戦型お手伝いロボ (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4220001;
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
const PRI='インセクト・プリンセス',CER='ツインヘッド・ケルベロス',PIN='代打バッター',BOR='穿孔虫',ROB='白兵戦型お手伝いロボ';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function H(c){return findCardByUid(c.uid);}
function tk(name){return (API.tokensOf(name)||[]).length;}

/* ===== インセクト・プリンセス ===== */
{ fresh();const p=mon(PRI,0),l=mon('C・ラーバ',1,'def'),w=mon('ワイト',1,'def');gameState.players[0].mz=[p];gameState.players[1].mz=[l,w];baselineA();
  ok('プリンセス: a face-up Insect of the opponent is forced to Attack Position, another race is not',forcedPositionForV10(C(l))==='atk'&&forcedPositionForV10(C(w))==null,JSON.stringify([forcedPositionForV10(C(l)),forcedPositionForV10(C(w))])); }
{ fresh();const l=mon('C・ラーバ',1,'def');gameState.players[1].mz=[l];baselineA();
  ok('プリンセス control: without it the Insect is not forced',forcedPositionForV10(C(l))==null,''); }
{ fresh();const p=mon(PRI,0),l=mon('C・ラーバ',1);gameState.players[0].mz=[p];gameState.players[1].mz=[l];baselineA();
  phase('battle');myAttack(p,l);
  ok('プリンセス: it destroyed an Insect in battle → ATK +500 (1900 → 2400)',z(l)==='grave'&&curATK(C(p))===2400,JSON.stringify([z(l),curATK(C(p))]));
  audit('プリンセス 1'); }
{ fresh();const p=mon(PRI,0),w=mon('ワイト',1);gameState.players[0].mz=[p];gameState.players[1].mz=[w];baselineA();
  phase('battle');myAttack(p,w);
  ok('プリンセス negative: it destroyed a non-Insect → ATK unchanged',z(w)==='grave'&&curATK(C(p))===1900,JSON.stringify([z(w),curATK(C(p))])); }

/* ===== ツインヘッド・ケルベロス ===== */
{ fresh();const c=mon(CER,0),fi=mon('E－HERO ヘル・ブラット',0),iv=mk('アイヴィ・ウォール',1,'down','def');iv.setTurn=3;gameState.players[0].mz=[c,fi];gameState.players[1].mz=[iv];baselineA();
  phase('battle');myAttack(c,iv);
  ok('ケルベロス: with another Fiend face-up it destroyed the Flip monster → its Flip effect was negated (no トークン)',z(iv)==='grave'&&tk('アイヴィトークン')===0,JSON.stringify([z(iv),tk('アイヴィトークン')]));
  audit('ケルベロス 1'); }
{ fresh();const c=mon(CER,0),iv=mk('アイヴィ・ウォール',1,'down','def');iv.setTurn=3;gameState.players[0].mz=[c];gameState.players[1].mz=[iv];baselineA();
  phase('battle');myAttack(c,iv);
  ok('ケルベロス control: no other Fiend → the Flip effect is not negated (トークン appear)',z(iv)==='grave'&&tk('アイヴィトークン')>0,JSON.stringify([z(iv),tk('アイヴィトークン')])); }
{ fresh();const c=mon(CER,0),fi=mon('E－HERO ヘル・ブラット',0),kt=mon('キラー・トマト',1);gameState.players[0].mz=[c,fi];gameState.players[1].mz=[kt];baselineA();
  phase('battle');myAttack(c,kt);
  ok('ケルベロス: a non-Flip effect monster (キラー・トマト) is not negated (it summons ワイト)',z(kt)==='grave'&&gameState.players[1].mz.some(x=>cardName(x)==='ワイト'),JSON.stringify(gameState.players[1].mz.map(cardName))); }

/* ===== 代打バッター ===== */
{ fresh();const b=mon(PIN,0),ins=mk('C・ラーバ',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[0].hand=[ins];gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[uid(ins)];foeAttack(f,b);PREFER=[];
  ok('代打バッター: sent from my field to the Graveyard → an Insect of my hand was Special Summoned',z(b)==='grave'&&z(ins)==='mz',JSON.stringify([z(b),z(ins)]));
  audit('代打バッター 1'); }
{ fresh();const b=mk(PIN,0),ins=mk('C・ラーバ',0);gameState.players[0].hand=[b,ins];baselineA();
  API.sendHandToGrave(0,0,'test');flushDeferredEventsV2();drive();
  ok('代打バッター negative: discarded from the hand → nothing is summoned',z(b)==='grave'&&z(ins)==='hand',JSON.stringify([z(b),z(ins)])); }

/* ===== 穿孔虫 ===== */
{ fresh();const b=mon(BOR,0),par=mk('寄生虫パラサイド',0);gameState.players[0].mz=[b];gameState.players[0].deck.push(par);baselineA();
  phase('battle');PREFER=[uid(par)];myAttack(b,'direct');PREFER=[];
  ok('穿孔虫: it dealt battle damage to the opponent → 寄生虫パラサイド was put on top of the Deck',lp(1)===8000-1100&&gameState.players[0].deck[0].uid===par.uid,JSON.stringify([lp(1),gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid,par.uid]));
  audit('穿孔虫 1'); }
{ fresh();const b=mon(BOR,0),par=mk('寄生虫パラサイド',0),d=mon('ワイト',1,'def');gameState.players[0].mz=[b];gameState.players[0].deck.push(par);gameState.players[1].mz=[d];baselineA();
  phase('battle');myAttack(b,d);
  ok('穿孔虫 negative: no battle damage to the opponent (it destroyed a Defense Position monster) → the Deck is unchanged',gameState.players[0].deck[0].uid!==par.uid,''); }

/* ===== 白兵戦型お手伝いロボ ===== */
{ fresh();const r=mon(ROB,0),h1=mk('C・ラーバ',0),w=mon('ワイト',1);gameState.players[0].mz=[r];gameState.players[0].hand=[h1];gameState.players[1].mz=[w];baselineA();
  const dk0=gameState.players[0].deck.length;
  phase('battle');PREFER=[uid(h1)];myAttack(r,w);PREFER=[];
  const dk=gameState.players[0].deck;
  ok('お手伝いロボ: it destroyed a monster → I drew 1 and returned the chosen hand card to the bottom of the Deck',z(w)==='grave'&&gameState.players[0].hand.length===1&&dk.length===dk0&&dk[dk.length-1].uid===h1.uid&&z(h1)==='deck',JSON.stringify([z(w),gameState.players[0].hand.length,dk.length,dk0,z(h1)]));
  audit('お手伝いロボ 1'); }
{ fresh();const r=mon(ROB,0),h1=mk('C・ラーバ',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[r];gameState.players[0].hand=[h1];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(r,f);
  ok('お手伝いロボ negative: it was destroyed (no monster destroyed by it) → no draw',z(r)==='grave'&&gameState.players[0].hand.length===1,JSON.stringify([z(r),gameState.players[0].hand.length])); }
`);
