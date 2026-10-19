/* S03-U451: 浅すぎた墓穴, 赤鬼, エア・サーキュレーター, ダーク・リペアラー, 暗黒界の魔神 レイン (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4320001;
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
const PIT='浅すぎた墓穴',AKA='赤鬼',AIR='エア・サーキュレーター',REP='ダーク・リペアラー',RAIN='暗黒界の魔神 レイン';
function H(c){return findCardByUid(c.uid);}
function G(p){return gameState.players[p].grave.map(c=>c.uid);}
let HANDPICK=null;const __p2=pick;pick=function(){const q=pc();if(HANDPICK&&q&&q.title.indexOf('赤鬼：墓地に送る手札')>=0){const keys=[];HANDPICK.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||(x.card&&x.card.uid===u));if(x)keys.push(x.key);});answerChoiceV49(keys);return;}return __p2();};
function fc(name,prefer){foeCast(name,prefer);PREFER=(prefer||[]).slice();drive();PREFER=[];}
function summon(c,pre){const i=gameState.players[0].hand.indexOf(c);PREFER=(pre||[]).slice();doNormalSummon(i,'atk');drive();PREFER=[];}

/* ===== 浅すぎた墓穴 ===== */
{ fresh();const sp=mk(PIT,0),a=mk('ブラック・マジシャン',0),b=mk('ワイト',0),c=mk('アイヴィ・ウォール',1),d=mk('ブラック・マジシャン',1);gameState.players[0].hand=[sp];gameState.players[0].grave=[a,b];gameState.players[1].grave=[c,d];baselineA();
  const ua=uid(a),ud=uid(d);cast(0,PIT,[ua,ud]);
  ok('浅すぎた墓穴: I chose the Black Magician of my Graveyard, the opponent chose theirs; both were Set face-down Defense on their own fields',z(a)==='mz'&&C(a).face==='down'&&C(a).pos==='def'&&H(a).p===0&&z(d)==='mz'&&C(d).face==='down'&&C(d).pos==='def'&&H(d).p===1&&z(b)==='grave'&&z(c)==='grave',JSON.stringify([z(a),z(b),z(c),z(d),C(a)&&C(a).face,C(d)&&C(d).face]));
  audit('浅すぎた墓穴 1'); }
{ fresh();const sp=mk(PIT,0),a=mk('ブラック・マジシャン',0);gameState.players[0].hand=[sp];gameState.players[0].grave=[a];baselineA();
  cast(0,PIT,[uid(a)]);
  ok('浅すぎた墓穴: the opponent without a monster in the Graveyard sets nothing, only mine was Set',z(a)==='mz'&&C(a).face==='down'&&gameState.players[1].mz.length===0,JSON.stringify([z(a),gameState.players[1].mz.length]));
  audit('浅すぎた墓穴 2'); }
{ fresh();const sp=mk(PIT,0),s=mk('サンダー・ボルト',0);gameState.players[0].hand=[sp];gameState.players[0].grave=[s];baselineA();
  ok('浅すぎた墓穴 negative: no monster in either Graveyard → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 赤鬼 ===== */
function akaBoard(){fresh();const ak=mk(AKA,0),h1=mk('ワイト',0),h2=mk('ブラック・マジシャン',0),h3=mk('アイヴィ・ウォール',0),f1=mon('ワイト',1),f2=mon('ブラック・マジシャン',1),f3=mon('アイヴィ・ウォール',1),t1=mon('ワイト',0),t2=mon('ワイト',0);
  gameState.players[0].hand=[ak,h1,h2,h3];gameState.players[0].mz=[t1,t2];gameState.players[1].mz=[f1,f2,f3];baselineA();return {ak,h1,h2,h3,f1,f2,f3,t1,t2};}
{ const B=akaBoard();HANDPICK=[uid(B.h1),uid(B.h2)];summon(B.ak,[uid(B.t1),uid(B.t2),uid(B.f1),uid(B.f2)]);HANDPICK=null;
  ok('赤鬼: two hand cards sent to the Graveyard, two field cards returned to their owner\'s hand (the third stays)',z(B.h1)==='grave'&&z(B.h2)==='grave'&&z(B.h3)==='hand'&&z(B.f1)==='hand'&&z(B.f2)==='hand'&&z(B.f3)==='mz'&&H(B.f1).p===1,JSON.stringify([z(B.h1),z(B.h2),z(B.h3),z(B.f1),z(B.f2),z(B.f3)]));
  audit('赤鬼 1'); }
{ const B=akaBoard();HANDPICK=[];summon(B.ak,[uid(B.t1),uid(B.t2)]);HANDPICK=null;
  ok('赤鬼: sending no hand card returns nothing',z(B.h1)==='hand'&&z(B.f1)==='mz'&&z(B.f2)==='mz'&&z(B.f3)==='mz',JSON.stringify([z(B.h1),z(B.f1),z(B.f2),z(B.f3)]));
  audit('赤鬼 2'); }
{ const B=akaBoard();HANDPICK=[uid(B.h1)];summon(B.ak,[uid(B.t1),uid(B.t2),uid(B.ak)]);HANDPICK=null;
  ok('赤鬼: one card sent, 赤鬼 itself was returned to the hand (the field card of the count may be this card)',z(B.h1)==='grave'&&z(B.ak)==='hand'&&z(B.f1)==='mz',JSON.stringify([z(B.h1),z(B.ak),z(B.f1)]));
  audit('赤鬼 3'); }

/* ===== エア・サーキュレーター ===== */
function airBoard(){fresh();const ai=mk(AIR,0),a=mk('ワイト',0),b=mk('ブラック・マジシャン',0),c=mk('アイヴィ・ウォール',0);
  gameState.players[0].hand=[ai,a,b,c];baselineA();return {ai,a,b,c};}
{ const B=airBoard();const dn=gameState.players[0].deck.length;summon(B.ai,[uid(B.a),uid(B.b)]);
  ok('エア・サーキュレーター ①: hand size 3 and Deck size back to its original after +2 -2',gameState.players[0].hand.length===3&&gameState.players[0].deck.length===dn,JSON.stringify([gameState.players[0].hand.length,gameState.players[0].deck.length,dn,z(B.a),z(B.b),z(B.c)]));
  audit('エア・サーキュレーター 1'); }
{ fresh();const ai=mk(AIR,0),a=mk('ワイト',0);gameState.players[0].hand=[ai,a];baselineA();summon(ai,[]);
  ok('エア・サーキュレーター ① negative: only one other hand card → the effect is not used (hand stays 1)',gameState.players[0].hand.length===1&&z(a)==='hand',JSON.stringify([gameState.players[0].hand.length,z(a)]));
  audit('エア・サーキュレーター 2'); }
{ fresh();const ai=mon(AIR,0),bh=mk('ブラック・ホール',1);gameState.players[1].hand=[bh];gameState.players[0].mz=[ai];gameState.activePlayer=1;gameState.turn=6;baselineA();
  const h0=gameState.players[0].hand.length;fc('ブラック・ホール');
  ok('エア・サーキュレーター ②: destroyed by 激流葬-like destruction effect → I drew 1',z(ai)==='grave'&&gameState.players[0].hand.length===h0+1,JSON.stringify([z(ai),h0,gameState.players[0].hand.length]));
  audit('エア・サーキュレーター 3'); }
{ fresh();const ai=mon(AIR,0),att=mon('ブラック・マジシャン',1);att.summonedTurn=3;gameState.players[0].mz=[ai];gameState.players[1].mz=[att];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
  const h0=gameState.players[0].hand.length;
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:idx(ai)});drive();
  ok('エア・サーキュレーター ② (battle): destroyed by battle → I drew 1',z(ai)==='grave'&&gameState.players[0].hand.length===h0+1,JSON.stringify([z(ai),h0,gameState.players[0].hand.length]));
  audit('エア・サーキュレーター 4'); }

/* ===== ダーク・リペアラー ===== */
function repBoard(){fresh();const r=mon(REP,0),bh=mk('ブラック・ホール',0);gameState.players[0].hand=[bh];gameState.players[0].mz=[r];baselineA();return {r,bh};}
{ const B=repBoard();const top=gameState.players[0].deck[0].uid;SEEN.length=0;cast(0,'ブラック・ホール',['bottom']);
  const d=gameState.players[0].deck;
  ok('ダーク・リペアラー: sent to the Graveyard by destruction → the top card was sent to the bottom',z(B.r)==='grave'&&d[d.length-1].uid===top&&d[0].uid!==top&&SEEN.filter(s=>s.title.indexOf('ダーク・リペアラー')>=0).length===1,JSON.stringify([z(B.r),d[0].uid,d[d.length-1].uid,top,SEEN.length]));
  audit('ダーク・リペアラー 1'); }
{ const B=repBoard();const top=gameState.players[0].deck[0].uid;cast(0,'ブラック・ホール',['top']);
  const d=gameState.players[0].deck;
  ok('ダーク・リペアラー: chosen to stay on top → the top card is unchanged',z(B.r)==='grave'&&d[0].uid===top,JSON.stringify([z(B.r),d[0].uid,top]));
  audit('ダーク・リペアラー 2'); }
{ fresh();const r=mk(REP,0);gameState.players[0].hand=[r];gameState.players[0].deck=[mk('ワイト',0)];baselineA();
  const top=gameState.players[0].deck[0].uid;act({type:'FX_DISCARD',player:0,handIndex:0,reason:'fixture'});drive();
  ok('ダーク・リペアラー negative: discarded from the hand (not from the field) → no look at the Deck',z(r)==='grave'&&gameState.players[0].deck[0].uid===top&&!pc(),JSON.stringify([z(r),!!pc()])); }

/* ===== 暗黒界の魔神 レイン ===== */
function rainBoard(){fresh();const rn=mk(RAIN,0),hh=mk('手札抹殺',1),f1=mon('ワイト',1),f2=mon('ブラック・マジシャン',1),s1=mk('サイクロン',1,'down'),m1=mon('ワイト',0);
  gameState.players[0].hand=[rn];gameState.players[1].hand=[hh];gameState.players[1].mz=[f1,f2];gameState.players[1].sz=[s1];gameState.players[0].mz=[m1];
  gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';baselineA();return {rn,hh,f1,f2,s1,m1};}
{ const B=rainBoard();fc('手札抹殺',['mons']);
  ok('暗黒界の魔神 レイン: discarded by the OPPONENT\'s 手札抹殺 → Special Summoned from the Graveyard, then all opponent monsters were destroyed (Spell/Trap stays)',z(B.rn)==='mz'&&z(B.f1)==='grave'&&z(B.f2)==='grave'&&z(B.s1)==='sz'&&z(B.m1)==='mz',JSON.stringify([z(B.rn),z(B.f1),z(B.f2),z(B.s1),z(B.m1)]));
  audit('レイン 1'); }
{ const B=rainBoard();fc('手札抹殺',['st']);
  ok('暗黒界の魔神 レイン: second effect chosen as Spell & Trap Cards → the Set Spell/Trap is destroyed, the monsters stay',z(B.rn)==='mz'&&z(B.s1)==='grave'&&z(B.f1)==='mz'&&z(B.f2)==='mz',JSON.stringify([z(B.rn),z(B.s1),z(B.f1),z(B.f2)]));
  audit('レイン 2'); }
{ fresh();const rn=mk(RAIN,0),ds=mk('手札抹殺',0),f1=mon('ワイト',1);gameState.players[0].hand=[ds,rn];gameState.players[1].mz=[f1];gameState.players[1].hand=[mk('ワイト',1)];baselineA();
  cast(0,'手札抹殺');
  ok('暗黒界の魔神 レイン negative: discarded by MY OWN effect → stays in the Graveyard, nothing destroyed',z(rn)==='grave'&&z(f1)==='mz',JSON.stringify([z(rn),z(f1)]));
  audit('レイン 3'); }
`);
