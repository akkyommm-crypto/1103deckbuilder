/* S03-U271: damage origin — リフレクト・ネイチャー (LP rule with an origin player), 墓守の従者 (battle damage treated as effect damage) (2011 texts).
   Real DUEL paths (activation / chain windows / attacks through the processor), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(!q)return false;
  const find=u=>q.candidates.find(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const c=find(u);if(c&&ks.indexOf(c.key)<0)ks.push(c.key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>!find(u));answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function castOpen(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);PREFER=[];}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
/* the cards in use respond in the chain windows (each at most once); the others pass */
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
/* deferred-event spy (test instrumentation only): names of the events queued since the last reset */
let EVQ=[];const __qd=queueDeferredEventV2;queueDeferredEventV2=function(n,e){EVQ.push({n,e});return __qd.apply(this,arguments);};
function evq271(n){return EVQ.filter(x=>x.n===n).map(x=>x.e);}

/* ===== A: リフレクト・ネイチャー — this turn, damage from effects the opponent activated is taken by the opponent ===== */
/* A1: in the opponent's turn, chained to ファイヤー・ボール (500) */
fresh();
gameState.activePlayer=1;gameState.turn=6;
let rn=setT('リフレクト・ネイチャー',0),fb=mk('ファイヤー・ボール',1),cs=up('キャノン・ソルジャー',1),sac=up('ワイト',1);
gameState.players[0].sz=[rn];gameState.players[1].hand=[fb];gameState.players[1].mz=[cs,sac];baselineA();
castOpen(1,'ファイヤー・ボール');
ok('A1: the opponent activates ファイヤー・ボール — リフレクト・ネイチャー is offered in the chain window',toWindow()&&offered(0,rn));
windows([rn]);
ok('A1: the 500 damage is taken by its activator — own LP unchanged',lp(0)===8000&&lp(1)===7500&&z(rn)==='grave'&&z(fb)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1),rn:z(rn)}));
/* A2: the same turn, a monster effect the opponent activates (キャノン・ソルジャー, Tribute ワイト) is also reflected */
PREFER=[sac.uid];duelActivateFromZone(1,'mz',idx(cs));drive();PREFER=[];
ok('A2: later this turn, キャノン・ソルジャー\'s 500 is reflected too',lp(0)===8000&&lp(1)===7000&&z(sac)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1)}));
/* A3: damage that is not from an effect the opponent activated is not reflected */
API.damageLP(0,300);
ok('A3: effect damage with no activating opponent (no chain link) is taken normally',lp(0)===7700&&lp(1)===7000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('A1-A3');
/* A4 / A5: activated in its controller's own turn — its own damage effects are not affected, and the next turn the rule is gone */
fresh();
gameState.activePlayer=0;
rn=setT('リフレクト・ネイチャー',0);fb=mk('ファイヤー・ボール',0);const fb2=mk('ファイヤー・ボール',1);
gameState.players[0].sz=[rn];gameState.players[0].hand=[fb];gameState.players[1].hand=[fb2];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A5: activated in the own turn of its controller (no chain) — resolves to the GY',z(rn)==='grave');
cast(0,'ファイヤー・ボール');
ok('A5: the own ファイヤー・ボール of its controller still damages the opponent',lp(1)===7500&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
nextTurn();
cast(1,'ファイヤー・ボール');
ok('A4: in the next turn the ファイヤー・ボール of the opponent hits normally',gameState.activePlayer===1&&lp(0)===7500&&lp(1)===7500,JSON.stringify({lp0:lp(0),lp1:lp(1),turn:gameState.turn,ap:gameState.activePlayer}));
audit('A4-A5');

/* ===== B: 墓守の従者 — the battle damage it inflicts on the opponent is treated as effect damage ===== */
/* B1: direct attack — effect damage (onLPChange cause 'effect'), no battle-damage event */
fresh();
gameState.phase='battle';
let gk=up('墓守の従者',0);gameState.players[0].mz=[gk];baselineA();
EVQ=[];hitT(0,gk,'direct');
const b1=evq271('onLPChange').filter(e=>e.player===1);
ok('B1: the direct attack inflicts 700',lp(1)===7300,String(lp(1)));
ok('B1: the LP change is effect damage (onLPChange cause effect)',b1.length===1&&b1[0].cause==='effect'&&b1[0].delta===-700,JSON.stringify(b1));
ok('B1: no battle-damage event (onBattleDamage / onDirectBattleDamage) is raised',evq271('onBattleDamage').length===0&&evq271('onDirectBattleDamage').length===0,JSON.stringify(EVQ.map(x=>x.n)));
audit('B1');
/* B2: an effect-damage prevention rule of the opponent stops it; an ordinary monster's battle damage still lands */
fresh();
gameState.phase='battle';
gk=up('墓守の従者',0);let wt=up('ワイト',0);gameState.players[0].mz=[gk,wt];baselineA();
API.addLpRule({player:1,cause:'effect',mode:'prevent',turns:0,label:'test-effect-0'});
hitT(0,gk,'direct');
ok('B2: under "effect damage to the opponent is 0", 墓守の従者\'s direct attack inflicts 0',lp(1)===8000,String(lp(1)));
EVQ=[];hitT(0,wt,'direct');
ok('B2: ワイト\'s direct attack (battle damage) still inflicts 300, as battle damage',lp(1)===7700&&evq271('onBattleDamage').length===1,JSON.stringify({lp1:lp(1),n:evq271('onBattleDamage').length}));
audit('B2');
/* B3: monster battle — damage 墓守の従者 inflicts on the opponent is effect damage; damage its controller takes is battle damage */
fresh();
gameState.phase='battle';
gk=up('墓守の従者',0);let foe=up('ワイト',1);gameState.players[0].mz=[gk];gameState.players[1].mz=[foe];baselineA();
EVQ=[];hitT(0,gk,foe);
const b3=evq271('onLPChange').filter(e=>e.player===1);
ok('B3: attacking ワイト (ATK 300) — the opponent takes 400 as effect damage, ワイト destroyed',lp(1)===7600&&b3.length===1&&b3[0].cause==='effect'&&z(foe)==='grave'&&evq271('onBattleDamage').length===0,JSON.stringify({lp1:lp(1),b3,foe:z(foe)}));
audit('B3');
fresh();
gameState.phase='battle';
gk=up('墓守の従者',0);foe=up('ジェネティック・ワーウルフ',1);gameState.players[0].mz=[gk];gameState.players[1].mz=[foe];baselineA();
EVQ=[];hitT(0,gk,foe);
const b4=evq271('onLPChange').filter(e=>e.player===0);
ok('B4: attacking a stronger monster — its own controller takes 1300 as ordinary battle damage',lp(0)===6700&&b4.length===1&&b4[0].cause==='battle'&&evq271('onBattleDamage').length===1&&z(gk)==='grave',JSON.stringify({lp0:lp(0),b4,gk:z(gk)}));
audit('B4');
/* B5: when the opponent attacks it, the battle damage the opponent takes is effect damage too (it inflicts it) */
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
gk=up('墓守の従者',0);foe=up('ワイト',1);gameState.players[0].mz=[gk];gameState.players[1].mz=[foe];baselineA();
EVQ=[];hitT(1,foe,gk);
const b5=evq271('onLPChange').filter(e=>e.player===1);
ok('B5: ワイト attacks it — the 400 the attacker\'s controller takes is effect damage',lp(1)===7600&&b5.length===1&&b5[0].cause==='effect'&&z(foe)==='grave',JSON.stringify({lp1:lp(1),b5}));
audit('B5');

/* ===== R: corrections of S03-U270 cards (Opus review) ===== */
/* R1: ホーリーライフバリアー — 「相手から受ける」: damage with no opponent origin is not prevented; the opponent's burn is */
fresh();
gameState.activePlayer=1;gameState.turn=6;
let hlb=setT('ホーリーライフバリアー',0),hd=mk('ワイト',0),fbR=mk('ファイヤー・ボール',1);
gameState.players[0].sz=[hlb];gameState.players[0].hand=[hd];gameState.players[1].hand=[fbR];baselineA();
castOpen(1,'ファイヤー・ボール');PREFER=[hd.uid];windows([hlb]);PREFER=[];
ok('R1: chained to the opponent’s ファイヤー・ボール — no damage (discard paid)',lp(0)===8000&&z(hlb)==='grave'&&z(hd)==='grave',JSON.stringify({lp0:lp(0),hlb:z(hlb),hd:z(hd)}));
API.damageLP(0,300);
ok('R1: damage with no opponent origin is not prevented by it',lp(0)===7700,String(lp(0)));
audit('R1');
/* R2: 氷結界の武士 — 「破壊し、…ドローする」: when it is no longer on the field at resolution it is not destroyed, so no draw */
fresh();
let ibR=up('氷結界の武士',0),dc=setT('強制脱出装置',1);gameState.players[0].mz=[ibR];gameState.players[1].sz=[dc];gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
const hR=gameState.players[0].hand.length,dR=gameState.players[0].deck.length;
zAct('TOGGLE_POS',0,'mz',0);windows([dc]);
ok('R2: the opponent returned it to the hand in response — it was not destroyed and its controller did not draw',z(ibR)==='hand'&&z(dc)==='grave'&&gameState.players[0].deck.length===dR&&gameState.players[0].hand.length===hR+1,JSON.stringify({ib:z(ibR),dc:z(dc),deck:gameState.players[0].deck.length,dR,hand:gameState.players[0].hand.length,hR}));
audit('R2');
/* B6: the battle-damage layer does not touch it — under the opponent's スピリットバリア (battle damage to them is 0) its damage still lands; an ordinary attacker's does not */
fresh();
gameState.phase='battle';
gk=up('墓守の従者',0);let gw=up('ジェネティック・ワーウルフ',0),sbar=up('スピリットバリア',1),w6=up('ワイト',1),w7=up('ワイト',1);
gameState.players[0].mz=[gk,gw];gameState.players[1].sz=[sbar];gameState.players[1].mz=[w6,w7];baselineA();
hitT(0,gw,w6);
ok('B6: ジェネティック・ワーウルフ destroys ワイト — under スピリットバリア the opponent takes no battle damage',z(w6)==='grave'&&lp(1)===8000,JSON.stringify({w6:z(w6),lp1:lp(1)}));
hitT(0,gk,w7);
ok('B6: 墓守の従者 destroys the other ワイト — its 400 is effect damage, not stopped by スピリットバリア',z(w7)==='grave'&&lp(1)===7600,JSON.stringify({w7:z(w7),lp1:lp(1)}));
audit('B6');

/* ===== P: 「特殊召喚する」 — the summoning player chooses face-up Attack or Defense (engine/1ZZK; S03-U269 cards) ===== */
function hix(p,c){return gameState.players[p].hand.findIndex(x=>x.uid===c.uid);}
/* P1: 救急救命 — Defense chosen */
fresh();
let pbh=mk('ブラック・ホール',0),prs=mk('救急救命',0),pw4=up('ジェネティック・ワーウルフ',0);
gameState.players[0].hand=[pbh,prs];gameState.players[0].mz=[pw4];baselineA();
duelActivateFromHand(hix(0,pbh));drive();toPhase('main2');
PREFER=['def'];duelActivateFromHand(hix(0,prs));drive();PREFER=[];
ok('P1: 救急救命 — ジェネティック・ワーウルフ special summoned in face-up Defense Position (chosen)',z(pw4)==='mz'&&C(pw4).face==='up'&&C(pw4).pos==='def',JSON.stringify({z:z(pw4),pos:C(pw4)&&C(pw4).pos}));
audit('P1');
/* P2: トライワイトゾーン — a position per monster, then the three together */
fresh();
let ptz=mk('トライワイトゾーン',0),pt1=mk('ワイト',0),pt2=mk('もけもけ',0),pt3=mk('はにわ',0);
gameState.players[0].hand=[ptz];gameState.players[0].grave=[pt1,pt2,pt3];baselineA();
PREFER=[pt1.uid,pt2.uid,pt3.uid,'atk','def','def'];duelActivateFromHand(0);drive();PREFER=[];
ok('P2: トライワイトゾーン — the three summoned face-up; positions as chosen (one Attack, two Defense)',[pt1,pt2,pt3].every(c=>z(c)==='mz'&&C(c).face==='up')&&[pt1,pt2,pt3].map(c=>C(c).pos).sort().join()==='atk,def,def',JSON.stringify([pt1,pt2,pt3].map(c=>[z(c),C(c)&&C(c).pos])));
audit('P2');
/* P3: 光神化 — Defense chosen; the ATK is still halved and it is destroyed in the End Phase */
fresh();
let plg=mk('光神化',0),pee=mk('ウィング・エッグ・エルフ',0);
gameState.players[0].hand=[plg,pee];baselineA();
PREFER=[pee.uid,'def'];duelActivateFromHand(0);drive();PREFER=[];
ok('P3: 光神化 — ウィング・エッグ・エルフ in face-up Defense Position, ATK halved (500 → 250)',z(pee)==='mz'&&C(pee).pos==='def'&&curATK(C(pee))===250,JSON.stringify({z:z(pee),pos:C(pee)&&C(pee).pos,atk:C(pee)&&curATK(C(pee))}));
toPhase('end');
ok('P3: destroyed in the End Phase',z(pee)==='grave',String(z(pee)));
audit('P3');
`);
