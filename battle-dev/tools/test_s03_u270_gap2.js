/* S03-U270: ENGINE_GAP re-check 2 (2011 texts) — ショット・ガン・シャッフル, デス・ウォンバット, ホーリーライフバリアー, 雷電娘々, 氷結界の武士.
   Real DUEL paths (hand / Set card / field ignition, chain windows, POINT responses, battle, summons, position changes, phase steps); costs chosen at activation,
   resolution choices answered; Replay-audited. (ワタポン stays ENGINE_GAP: API.searchDeck emits no onAddToHand.) */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function lp(p){return gameState.players[p].lp;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(!q)return false;
  SEEN.push({title:q.title,kind:q.kind,min:q.min,max:q.max,keys:q.candidates.map(x=>x.uid!=null?x.uid:x.key)});
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){j=q.candidates.findIndex(x=>x.uid===PREFER[k]||x.key===PREFER[k]||x.value===PREFER[k]||(x.card&&x.card.uid===PREFER[k]));if(j>=0)break;}
  if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
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
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function idle(){return !pc()&&gameState.chain.length===0;}
function shuffles(p){return V41_ACTION_JOURNAL.filter(x=>x.action.type==='SHUFFLE'&&x.action.player===p).length;}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:t==='direct'?'direct':idx(t)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function castOpen(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);PREFER=[];}
/* the cards in use respond in the chain windows (each at most once); the others pass */
const USED=new Set();
function windows(use){USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return USED.size;}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  drive();return done;}

/* ===== A: ショット・ガン・シャッフル — 300 LP (cost); shuffle your Deck or the opponent's (chosen on resolution); once per turn ===== */
fresh();
let sg=mk('ショット・ガン・シャッフル',0);gameState.players[0].hand=[sg];baselineA();
duelActivateFromHand(0);drive();
ok('A: activated from the hand as a Continuous Spell — it stays face-up on the field; no LP paid, no shuffle, no choice',z(sg)==='sz'&&C(sg).face==='up'&&lp(0)===8000&&shuffles(0)===0&&shuffles(1)===0&&!SEEN.length,JSON.stringify({z:z(sg),lp:lp(0),SEEN}));
PREFER=['self'];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('A: the field effect — 300 LP paid as the cost',lp(0)===7700,String(lp(0)));
ok('A: the Deck to shuffle was chosen (own / opponent) at resolution, a non-targeting option choice',SEEN.length===1&&SEEN[0].kind==='option'&&SEEN[0].keys.indexOf('self')>=0&&SEEN[0].keys.indexOf('foe')>=0,JSON.stringify(SEEN));
ok('A: own Deck shuffled, the opponent\'s Deck not',shuffles(0)===1&&shuffles(1)===0,JSON.stringify({a:shuffles(0),b:shuffles(1)}));
ok('A: the Spell stays on the field',z(sg)==='sz'&&C(sg).face==='up');
audit('A');
duelActivateFromZone(0,'sz',0);drive();
ok('A2: once per turn — a second use is not offered (no LP paid)',lp(0)===7700&&shuffles(0)===1&&idle()&&strictScriptLegalityV2('ショット・ガン・シャッフル',0,'sz',0,{}).ok===false,JSON.stringify({lp:lp(0)}));
nextTurn();nextTurn();toPhase('main1');
ok('A3: reached my next Main Phase 1 (turn '+gameState.turn+')',gameState.phase==='main1'&&gameState.activePlayer===0);
PREFER=['foe'];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('A3: next turn usable again; the opponent\'s Deck was chosen and shuffled (own Deck not shuffled again)',lp(0)===7400&&shuffles(1)===1&&shuffles(0)===1,JSON.stringify({lp:lp(0),a:shuffles(0),b:shuffles(1)}));
audit('A3');
/* A4: not enough LP */
fresh();
sg=mk('ショット・ガン・シャッフル',0,'up');gameState.players[0].sz=[sg];gameState.players[0].lp=200;baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A4: LP 200 — the 300 LP cost cannot be paid; not activated',lp(0)===200&&shuffles(0)===0&&idle());
/* A5: the opponent's turn */
fresh();
gameState.activePlayer=1;gameState.turn=6;
sg=mk('ショット・ガン・シャッフル',0,'up');gameState.players[0].sz=[sg];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A5: in the opponent\'s turn the ignition effect cannot be used',lp(0)===8000&&shuffles(0)===0&&shuffles(1)===0&&idle());
/* A6: exact LP 300 — payable */
fresh();
sg=mk('ショット・ガン・シャッフル',0,'up');gameState.players[0].sz=[sg];gameState.players[0].lp=1000;baselineA();
PREFER=['foe'];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('A6: LP 1000 — paid 300 (700 left); the opponent\'s Deck shuffled',lp(0)===700&&shuffles(1)===1&&shuffles(0)===0,JSON.stringify({lp:lp(0)}));
audit('A6');

/* ===== B: デス・ウォンバット — effect damage to its controller is 0 while it is face-up; battle damage still applies ===== */
fresh();
gameState.activePlayer=1;gameState.turn=6;
let dw=up('デス・ウォンバット',0),fb=mk('ファイヤー・ボール',1);
gameState.players[0].mz=[dw];gameState.players[1].hand=[fb];baselineA();
cast(1,'ファイヤー・ボール');
ok('B: the opponent\'s ファイヤー・ボール (500 effect damage) does 0 to the Wombat\'s controller',lp(0)===8000&&z(fb)==='grave',JSON.stringify({lp:lp(0),fb:z(fb)}));
audit('B');
/* B2: it protects only its controller */
fresh();
dw=up('デス・ウォンバット',0);fb=mk('ファイヤー・ボール',0);
gameState.players[0].mz=[dw];gameState.players[0].hand=[fb];baselineA();
cast(0,'ファイヤー・ボール');
ok('B2: the controller\'s own burn on the opponent still deals 500 (the opponent is not protected)',lp(1)===7500&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('B2');
/* B3: battle damage still applies */
fresh('battle');
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
dw=up('デス・ウォンバット',0);let wt=up('ワイト',0),bw=up('青眼の白龍',1);
gameState.players[0].mz=[dw,wt];gameState.players[1].mz=[bw];baselineA();
hitT(1,bw,wt);
ok('B3: battle damage is not prevented — ワイト destroyed, 3000 minus its ATK to its controller',z(wt)==='grave'&&lp(0)===8000-(3000-dbOf(wt).atk),JSON.stringify({wt:z(wt),lp:lp(0)}));
audit('B3');
/* B4: face-down — no effect */
fresh();
gameState.activePlayer=1;gameState.turn=6;
dw=setT('デス・ウォンバット',0);dw.pos='def';fb=mk('ファイヤー・ボール',1);
gameState.players[0].mz=[dw];gameState.players[1].hand=[fb];baselineA();
cast(1,'ファイヤー・ボール');
ok('B4: face-down — the effect damage applies (500)',lp(0)===7500,String(lp(0)));
audit('B4');
/* B5: it protects the CURRENT controller (owned by the opponent, controlled by player 0) */
fresh();
gameState.activePlayer=1;gameState.turn=6;
dw=mk('デス・ウォンバット',1,'up','atk');dw.controller=0;fb=mk('ファイヤー・ボール',1);
gameState.players[0].mz=[dw];gameState.players[1].hand=[fb];baselineA();
cast(1,'ファイヤー・ボール');
ok('B5: controlled by player 0 — player 0 takes 0 from the opponent\'s burn',lp(0)===8000,String(lp(0)));
/* B6: the Wombat on the opponent's side does not protect the burner's victim */
fresh();
gameState.activePlayer=1;gameState.turn=6;
dw=up('デス・ウォンバット',1);fb=mk('ファイヤー・ボール',1);
gameState.players[1].mz=[dw];gameState.players[1].hand=[fb];baselineA();
cast(1,'ファイヤー・ボール');
ok('B6: the Wombat belongs to the burner — its target (player 0) still takes 500',lp(0)===7500&&lp(1)===8000,JSON.stringify({a:lp(0),b:lp(1)}));
audit('B6');

/* ===== C: ホーリーライフバリアー — discard 1 (cost); this turn all damage from the opponent is 0 ===== */
fresh('battle');
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
let hb=setT('ホーリーライフバリアー',0),h1=mk('ワイト',0),h2=mk('ハーピィ・レディ',0),b1=up('青眼の白龍',1),fb1=mk('ファイヤー・ボール',1);
gameState.players[0].sz=[hb];gameState.players[0].hand=[h1,h2];gameState.players[1].mz=[b1];gameState.players[1].hand=[fb1];baselineA();
PREFER=[h2.uid];
const did=attackRespond(1,b1,'direct',0,w=>w.kind==='attackDeclare','sz',0);PREFER=[];
ok('C: activated at the attack declaration; the chosen hand card (ハーピィ・レディ) was discarded as the cost',did&&z(hb)==='grave'&&z(h2)==='grave'&&z(h1)==='hand',JSON.stringify({did,hb:z(hb),h2:z(h2),h1:z(h1)}));
ok('C: the discard was a choice of the hand cards made at activation',SEEN.some(s=>/ホーリーライフバリアー/.test(s.title)&&s.keys.indexOf(h1.uid)>=0&&s.keys.indexOf(h2.uid)>=0),JSON.stringify(SEEN));
ok('C: the 3000 direct battle damage is 0',lp(0)===8000,String(lp(0)));
toPhase('main2');cast(1,'ファイヤー・ボール');
ok('C: the same turn, effect damage from the opponent (ファイヤー・ボール 500) is also 0',z(fb1)==='grave'&&lp(0)===8000,JSON.stringify({fb:z(fb1),lp:lp(0)}));
audit('C');
/* it ends with the turn */
nextTurn();nextTurn();
const fb2=mk('ファイヤー・ボール',1);gameState.players[1].hand.push(fb2);toPhase('main1');
cast(1,'ファイヤー・ボール');
ok('C2: two turns later (turn '+gameState.turn+') the effect no longer applies — 500 damage',z(fb2)==='grave'&&lp(0)===7500,JSON.stringify({lp:lp(0),turn:gameState.turn}));
/* C3: in response to an effect damage in a chain */
fresh();
gameState.activePlayer=1;gameState.turn=6;
hb=setT('ホーリーライフバリアー',0);h1=mk('ワイト',0);fb1=mk('ファイヤー・ボール',1);
gameState.players[0].sz=[hb];gameState.players[0].hand=[h1];gameState.players[1].hand=[fb1];baselineA();
castOpen(1,'ファイヤー・ボール');PREFER=[h1.uid];
const used=windows([hb]);PREFER=[];
ok('C3: activated in response to the burn in the chain: the burn resolves for 0; the ワイト is discarded',used===1&&z(hb)==='grave'&&z(h1)==='grave'&&z(fb1)==='grave'&&lp(0)===8000,JSON.stringify({used,hb:z(hb),h1:z(h1),lp:lp(0)}));
audit('C3');
/* C4: nothing in the hand — cannot be activated (negative) */
fresh();
gameState.activePlayer=1;gameState.turn=6;
hb=setT('ホーリーライフバリアー',0);fb1=mk('ファイヤー・ボール',1);
gameState.players[0].sz=[hb];gameState.players[1].hand=[fb1];baselineA();
castOpen(1,'ファイヤー・ボール');
const off=toWindow()&&offered(0,hb);
drive();
ok('C4: no card in the hand to discard — not offered; the burn deals 500',off===false&&z(hb)==='sz'&&C(hb).face==='down'&&lp(0)===7500,JSON.stringify({off,hb:z(hb),lp:lp(0)}));
/* C5: the damage it takes from the opponent only — the opponent's own LP is not affected; its controller's attack on the opponent still damages */
fresh('battle');
gameState.phase='battle';
hb=setT('ホーリーライフバリアー',0);h1=mk('ワイト',0);let my=up('青眼の白龍',0);
gameState.players[0].sz=[hb];gameState.players[0].hand=[h1];gameState.players[0].mz=[my];baselineA();
PREFER=[h1.uid];toPhase('battle');
duelActivateFromZone(0,'sz',0);drive();PREFER=[];
hitT(0,my,'direct');
ok('C5: activated in my own turn; the opponent still takes my 3000 damage (only damage to the activator is 0)',z(hb)==='grave'&&lp(1)===5000&&lp(0)===8000,JSON.stringify({hb:z(hb),a:lp(0),b:lp(1)}));
audit('C5');

/* ===== D: 雷電娘々 — destroyed while its controller controls a face-up monster that is not LIGHT ===== */
ok('D: premise — 雷電娘々 is LIGHT; ワイト is DARK; ウィング・エッグ・エルフ is LIGHT',dbOf(mk('雷電娘々',0)).at==='光'&&dbOf(mk('ワイト',0)).at==='闇'&&dbOf(mk('ウィング・エッグ・エルフ',0)).at==='光');
fresh();
let rd=up('雷電娘々',0),hw=mk('ワイト',0);
gameState.players[0].mz=[rd];gameState.players[0].hand=[hw];baselineA();
ok('D: alone (LIGHT) it stays',z(rd)==='mz');
doNormalSummon(0,'atk');drive();
ok('D: ワイト (DARK) Normal Summoned face-up on its controller\'s field — 雷電娘々 destroyed',z(hw)==='mz'&&z(rd)==='grave'&&C(rd).graveInfo&&C(rd).graveInfo.byDestroy===true,JSON.stringify({hw:z(hw),rd:z(rd)}));
audit('D');
/* D2: LIGHT monsters do not count */
fresh();
rd=up('雷電娘々',0);let lw=mk('ウィング・エッグ・エルフ',0);
gameState.players[0].mz=[rd];gameState.players[0].hand=[lw];baselineA();
doNormalSummon(0,'atk');drive();
ok('D2: a LIGHT monster joins — 雷電娘々 stays',z(lw)==='mz'&&z(rd)==='mz');
/* D3: the opponent's non-LIGHT monster does not count */
fresh();
rd=up('雷電娘々',0);gameState.players[0].mz=[rd];gameState.players[1].mz=[up('ワイト',1)];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('D3: only the opponent controls a non-LIGHT monster — 雷電娘々 stays',z(rd)==='mz');
/* D4: a face-down non-LIGHT monster does not count; when flipped it does */
fresh();
rd=up('雷電娘々',0);let sw=setT('ワイト',0);sw.pos='def';
gameState.players[0].mz=[rd,sw];baselineA();
ok('D4: a face-down ワイト does not count — 雷電娘々 stays',z(rd)==='mz'&&z(sw)==='mz');
doFlipUp(0,'mz',idx(sw),'atk');drive();
ok('D4: the ワイト is flip summoned face-up — 雷電娘々 destroyed',z(sw)==='mz'&&C(sw).face==='up'&&z(rd)==='grave',JSON.stringify({sw:z(sw),rd:z(rd)}));
audit('D4');
/* D5: it is only destroyed while face-up; Set, it survives until flipped */
fresh();
rd=setT('雷電娘々',0);rd.pos='def';let uw=up('ワイト',0);
gameState.players[0].mz=[rd,uw];baselineA();
ok('D5: a face-down 雷電娘々 is not destroyed by its own text while ワイト is face-up',z(rd)==='mz'&&C(rd).face==='down');
doFlipUp(0,'mz',idx(rd),'atk');drive();
ok('D5: flip summoned face-up — destroyed',z(rd)==='grave',JSON.stringify({rd:z(rd)}));
audit('D5');
/* D6: Normal Summoning 雷電娘々 itself next to a face-up non-LIGHT monster */
fresh();
rd=mk('雷電娘々',0);uw=up('ワイト',0);gameState.players[0].mz=[uw];gameState.players[0].hand=[rd];baselineA();
doNormalSummon(0,'atk');drive();
ok('D6: 雷電娘々 Normal Summoned next to a face-up ワイト — destroyed',z(rd)==='grave',JSON.stringify({rd:z(rd)}));
audit('D6');

/* ===== E: 氷結界の武士 — face-up Attack → face-up Defense: destroy it, then draw 1 (forced) ===== */
fresh();
let ib=up('氷結界の武士',0);gameState.players[0].mz=[ib];gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
const hand0=gameState.players[0].hand.length,deck0=gameState.players[0].deck.length;
zAct('TOGGLE_POS',0,'mz',0);drive();
ok('E: changed to face-up Defense by its controller — destroyed',z(ib)==='grave'&&C(ib).graveInfo&&C(ib).graveInfo.byDestroy===true,JSON.stringify({ib:z(ib),TRIG}));
ok('E: and 1 card was drawn from the Deck',gameState.players[0].hand.length===hand0+1&&gameState.players[0].deck.length===deck0-1,JSON.stringify({h:gameState.players[0].hand.length,d:gameState.players[0].deck.length}));
ok('E: the trigger was a forced one (offered without an option to decline)',TRIG.some(t=>t.names.indexOf('氷結界の武士')>=0&&t.forced===true),JSON.stringify(TRIG));
audit('E');
/* E2: Defense → Attack: nothing */
fresh();
ib=up('氷結界の武士',0,'def');gameState.players[0].mz=[ib];gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
const h2b=gameState.players[0].hand.length;
zAct('TOGGLE_POS',0,'mz',0);drive();
ok('E2: Defense → Attack — nothing happens (no destruction, no draw)',z(ib)==='mz'&&C(ib).pos==='atk'&&gameState.players[0].hand.length===h2b,JSON.stringify({ib:z(ib),pos:C(ib).pos}));
audit('E2');
/* E3: flip summon of a face-down card does not trigger */
fresh();
ib=setT('氷結界の武士',0);ib.pos='def';gameState.players[0].mz=[ib];baselineA();
const h3=gameState.players[0].hand.length;
doFlipUp(0,'mz',0,'atk');drive();
ok('E3: flip summoned in Attack Position — nothing happens',z(ib)==='mz'&&C(ib).face==='up'&&C(ib).pos==='atk'&&gameState.players[0].hand.length===h3,JSON.stringify({ib:z(ib)}));
/* E4: turned face-down by 月の書 — not a face-up Defense Position */
fresh();
ib=up('氷結界の武士',0);let mb=mk('月の書',0);gameState.players[0].mz=[ib];gameState.players[0].hand=[mb];baselineA();
const h4=gameState.players[0].hand.length;
PREFER=[ib.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E4: 月の書 turned it face-down Defense — not destroyed, no draw',z(ib)==='mz'&&C(ib).face==='down'&&C(ib).pos==='def'&&gameState.players[0].hand.length===h4-1,JSON.stringify({ib:z(ib),f:C(ib).face,h:gameState.players[0].hand.length}));
audit('E4');
/* E5: a card effect changes it to face-up Defense (砂漠の光: own monsters to face-up Defense) */
fresh();
ib=up('氷結界の武士',0);const ow=up('ワイト',0);let dl=mk('砂漠の光',0);
gameState.players[0].mz=[ib,ow];gameState.players[0].hand=[dl];gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();
const h5=gameState.players[0].hand.length,d5=gameState.players[0].deck.length;
duelActivateFromHand(0);drive();
ok('E5: a card effect turned it to face-up Defense — destroyed, 1 card drawn; the ワイト is in Defense',z(ib)==='grave'&&C(ow).pos==='def'&&gameState.players[0].hand.length===h5-1+1&&gameState.players[0].deck.length===d5-1,JSON.stringify({ib:z(ib),pos:C(ow).pos,h:gameState.players[0].hand.length,d:gameState.players[0].deck.length}));
audit('E5');
`);
