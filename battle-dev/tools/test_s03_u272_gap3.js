/* S03-U272: ENGINE_GAP re-check 3 — 防御輪, ダメージ・ワクチンΩMAX, 悪夢の拷問部屋, 同族感染ウィルス (2011 texts).
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
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];const TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
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
function zoneAct(p,zn,i,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(p,zn,i);drive();PREFER=[];}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
/* a chain window where the card is looked for but never used (negatives): true when it was offered at some point */
function watch(c){let o=false;for(let i=0;i<10;i++){if(!toWindow())break;o=o||offered(pl(c),c);chainPassV2();}drive();return o;}
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:findCardByUid(a.uid).index,target:target==='direct'?'direct':findCardByUid(target.uid).index});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
function names(p,zone){return gameState.players[p][zone].map(c=>cardName(c));}

/* ===== A: 防御輪 — the damage a Trap card's effect inflicts becomes 0 (that chain link only; either player) ===== */
/* A1: the opponent's チェーン・ブラスト at our attack declaration (500 to us) — 防御輪 from the hand */
fresh();
let ha=mk('防御輪',0),cb=setT('チェーン・ブラスト',1),a0=up('ベビードラゴン',0);
gameState.players[0].hand=[ha];gameState.players[0].mz=[a0];gameState.players[1].sz=[cb];gameState.phase='battle';baselineA();
const doneA1=attackRespond(0,a0,'direct',1,p=>p.kind==='attackDeclare','sz',0);
ok('A1: the opponent activated チェーン・ブラスト at the attack declaration',doneA1&&toWindow());
ok('A1: 防御輪 is offered from the hand against the damage Trap',offered(0,ha));
windows([ha]);
ok('A1: its 500 damage became 0 (チェーン・ブラスト resolved and went to the GY); the direct attack went through',lp(0)===8000&&lp(1)===8000-1200&&z(cb)==='grave'&&z(ha)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1),cb:z(cb),ha:z(ha)}));
API.damageLP(0,300);
ok('A1: only that link — a later effect damage is taken normally',lp(0)===7700,String(lp(0)));
audit('A1');
/* A2: our own damage Trap (500 to the opponent) with our own 防御輪 (Set) chained to it — "either player" */
fresh();
let gr=setT('防御輪',0),cb2=setT('チェーン・ブラスト',0);
gameState.players[0].sz=[gr,cb2];baselineA();
duelActivateFromZone(0,'sz',1);
ok('A2: after our チェーン・ブラスト is activated 防御輪 is offered to us too',toWindow()&&offered(0,gr));
windows([gr]);
ok('A2: the damage to the opponent became 0 as well',lp(1)===8000&&lp(0)===8000&&z(cb2)==='grave'&&z(gr)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1),cb2:z(cb2),gr:z(gr)}));
audit('A2');
/* A3: without 防御輪 the same Trap damages (control) */
fresh();
cb2=setT('チェーン・ブラスト',0);gameState.players[0].sz=[cb2];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A3: control — チェーン・ブラスト alone inflicts 500',lp(1)===7500);
/* A4: negatives — a damage Spell, a Trap that inflicts no damage */
fresh();
gameState.activePlayer=1;gameState.turn=6;
gr=setT('防御輪',0);let fb=mk('ファイヤー・ボール',1);gameState.players[0].sz=[gr];gameState.players[1].hand=[fb];baselineA();
castOpen(1,'ファイヤー・ボール');
const oA4=watch(gr);
ok('A4: a damage Spell (not a Trap card) — not offered; its 500 is taken',!oA4&&z(gr)==='sz'&&lp(0)===7500,JSON.stringify({oA4,lp0:lp(0)}));
fresh();
gr=setT('防御輪',0);let mf=setT('聖なるバリア －ミラーフォース－',1);a0=up('ベビードラゴン',0);gameState.players[0].sz=[gr];gameState.players[0].mz=[a0];gameState.players[1].sz=[mf];gameState.phase='battle';baselineA();
attackRespond(0,a0,'direct',1,p=>p.kind==='attackDeclare','sz',0);
const oA4b=watch(gr);
ok('A4: a Trap that inflicts no damage (ミラーフォース) — not offered',!oA4b&&z(gr)==='sz'&&z(mf)==='grave',JSON.stringify({oA4b,gr:z(gr)}));

/* ===== C: ダメージ・ワクチンΩMAX — battle or effect damage to us: recover that much ===== */
fresh();
gameState.activePlayer=1;gameState.turn=6;
let vx=setT('ダメージ・ワクチンΩMAX',0);fb=mk('ファイヤー・ボール',1);gameState.players[0].sz=[vx];gameState.players[1].hand=[fb];gameState.players[0].lp=6000;baselineA();
cast(1,'ファイヤー・ボール');
ok('C1: effect damage 500 — recovered exactly 500 (LP 6000 again)',lp(0)===6000&&z(vx)==='grave'&&lp(1)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1),vx:z(vx),TRIG}));
audit('C1');
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
vx=setT('ダメージ・ワクチンΩMAX',0);let bw=up('青眼の白龍',1);gameState.players[0].sz=[vx];gameState.players[1].mz=[bw];gameState.players[0].lp=6000;baselineA();
hitT(1,bw,'direct');
ok('C2: battle damage 3000 — recovered exactly 3000 (LP 6000 again)',lp(0)===6000&&z(vx)==='grave',JSON.stringify({lp0:lp(0),vx:z(vx),TRIG}));
audit('C2');
/* C3: negatives — damage to the opponent, a life cost, a recovery */
fresh();
vx=setT('ダメージ・ワクチンΩMAX',0);fb=mk('ファイヤー・ボール',0);gameState.players[0].sz=[vx];gameState.players[0].hand=[fb];gameState.players[0].lp=6000;baselineA();
cast(0,'ファイヤー・ボール');
ok('C3: damage inflicted on the opponent — not triggered',lp(1)===7500&&lp(0)===6000&&z(vx)==='sz',JSON.stringify({lp0:lp(0),lp1:lp(1),vx:z(vx)}));
API.payCost(0,500);API.recoverLP(0,200);
ok('C3: paying LP as a cost and recovering LP — not triggered',lp(0)===5700&&z(vx)==='sz',JSON.stringify({lp0:lp(0),vx:z(vx)}));

/* ===== D: 悪夢の拷問部屋 — each time its controller inflicts non-battle damage on the opponent: 300 more (not from itself) ===== */
/* D1: activated from the hand — it stays on the field and does nothing yet; then ファイヤー・ボール (500) → +300 */
fresh();
let nr=mk('悪夢の拷問部屋',0);fb=mk('ファイヤー・ボール',0);gameState.players[0].hand=[nr,fb];baselineA();
cast(0,'悪夢の拷問部屋');
ok('D1: activated from the hand — face-up on the field, no damage',z(nr)==='sz'&&C(nr).face==='up'&&lp(1)===8000&&lp(0)===8000,JSON.stringify({nr:z(nr),lp1:lp(1)}));
cast(0,'ファイヤー・ボール');
ok('D1: ファイヤー・ボール 500 → 悪夢の拷問部屋 inflicts 300 more (8000-500-300); not from itself again',lp(1)===7200&&lp(0)===8000&&z(nr)==='sz',JSON.stringify({lp1:lp(1),lp0:lp(0),TRIG}));
audit('D1');
/* D2: two copies — each triggers on the 500 but neither on the other's 300 */
fresh();
nr=up('悪夢の拷問部屋',0);let nr2=up('悪夢の拷問部屋',0);fb=mk('ファイヤー・ボール',0);gameState.players[0].sz=[nr,nr2];gameState.players[0].hand=[fb];baselineA();
cast(0,'ファイヤー・ボール');
ok('D2: two copies — 500 + 300 + 300 (neither applies to 「悪夢の拷問部屋」\'s own damage)',lp(1)===8000-500-600,JSON.stringify({lp1:lp(1),TRIG}));
audit('D2');
/* D3: battle damage — nothing; a monster whose battle damage counts as effect damage (墓守の従者) — 700 + 300 */
fresh();
gameState.phase='battle';
nr=up('悪夢の拷問部屋',0);wt=up('ワイト',0);gameState.players[0].sz=[nr];gameState.players[0].mz=[wt];baselineA();
hitT(0,wt,'direct');
ok('D3: battle damage 300 to the opponent — no extra damage',lp(1)===7700,String(lp(1)));
fresh();
gameState.phase='battle';
nr=up('悪夢の拷問部屋',0);let gk=up('墓守の従者',0);gameState.players[0].sz=[nr];gameState.players[0].mz=[gk];baselineA();
hitT(0,gk,'direct');
ok('D3: 墓守の従者\'s direct attack counts as effect damage (700) — 悪夢の拷問部屋 adds 300',lp(1)===8000-700-300,String(lp(1)));
audit('D3');
/* D4: negatives — the opponent's damage to us, a face-down copy, a life cost of the opponent */
fresh();
gameState.activePlayer=1;gameState.turn=6;
nr=up('悪夢の拷問部屋',0);fb=mk('ファイヤー・ボール',1);gameState.players[0].sz=[nr];gameState.players[1].hand=[fb];baselineA();
cast(1,'ファイヤー・ボール');
ok('D4: the opponent\'s damage to us — no extra damage to anyone',lp(0)===7500&&lp(1)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
fresh();
nr=setT('悪夢の拷問部屋',0);fb=mk('ファイヤー・ボール',0);gameState.players[0].sz=[nr];gameState.players[0].hand=[fb];baselineA();
cast(0,'ファイヤー・ボール');
ok('D4: a Set (face-down) 悪夢の拷問部屋 does nothing',lp(1)===7500,String(lp(1)));
fresh();
nr=up('悪夢の拷問部屋',0);gameState.players[0].sz=[nr];baselineA();
API.payCost(1,500);
ok('D4: the opponent paying LP as a cost is not damage inflicted by us',lp(1)===7500,String(lp(1)));

/* ===== F: 同族感染ウィルス — discard 1 and declare a Type: every face-up monster of that Type on the field is destroyed ===== */
function fieldF(o){
  o=o||{};fresh();
  if(o.ap!=null){gameState.activePlayer=o.ap;gameState.turn=o.ap===0?5:6;}
  if(o.phase)gameState.phase=o.phase;
  const v=mk('同族感染ウィルス',0,o.vdown?'down':'up',o.vdown?'def':'atk');if(o.vdown)v.setTurn=3;
  const d1=mk('ワイト',0),w0=up('ワイト',0),b0=up('青眼の白龍',0),w1=up('ワイト',1),v1=up('ジェネティック・ワーウルフ',1),fd=mk('ワイト',1,'down','def');fd.setTurn=3;
  const aq=up('アクア・スネーク',1);
  gameState.players[0].mz=[v,w0,b0];gameState.players[0].hand=o.nohand?[]:[d1];gameState.players[1].mz=[w1,v1,fd,aq];baselineA();
  return {v,d1,w0,b0,w1,v1,fd,aq};
}
let F=fieldF();
zoneAct(0,'mz',0,[F.d1.uid,'アンデット']);
ok('F1: the discard is the cost — the hand card went to the GY',z(F.d1)==='grave');
ok('F1: declaring アンデット destroys every face-up アンデット on both sides (ワイト ×2)',z(F.w0)==='grave'&&z(F.w1)==='grave',JSON.stringify({w0:z(F.w0),w1:z(F.w1)}));
ok('F1: other Types, the Virus itself and the face-down monster stay',z(F.b0)==='mz'&&z(F.v1)==='mz'&&z(F.v)==='mz'&&z(F.fd)==='mz'&&C(F.fd).face==='down',JSON.stringify({b0:z(F.b0),v1:z(F.v1),v:z(F.v),fd:z(F.fd)}));
audit('F1');
/* F2: declaring its own Type (水) destroys itself too */
F=fieldF();
zoneAct(0,'mz',0,[F.d1.uid,'水']);
ok('F2: declaring 水 destroys every face-up 水 monster including 同族感染ウィルス itself',z(F.v)==='grave'&&z(F.aq)==='grave'&&z(F.w0)==='mz'&&z(F.b0)==='mz',JSON.stringify({v:z(F.v),aq:z(F.aq),w0:z(F.w0)}));
audit('F2');
/* F3: a Type nobody has — the cost is paid, nothing is destroyed */
F=fieldF();
zoneAct(0,'mz',0,[F.d1.uid,'恐竜']);
ok('F3: declaring a Type no face-up monster has — the discard is paid, nothing destroyed',z(F.d1)==='grave'&&z(F.w0)==='mz'&&z(F.b0)==='mz'&&z(F.w1)==='mz'&&z(F.v)==='mz',JSON.stringify({d1:z(F.d1),w0:z(F.w0)}));
/* F4: negatives of the activation */
F=fieldF({nohand:true});
const legalEmpty=strictScriptLegalityV2('同族感染ウィルス',0,'mz',0,{});
zoneAct(0,'mz',0,[]);
ok('F4: no card in the hand — cannot be activated (nothing destroyed)',!legalEmpty.ok&&z(F.w0)==='mz'&&z(F.w1)==='mz',JSON.stringify(legalEmpty).slice(0,160));
F=fieldF({ap:1});
zoneAct(0,'mz',0,[F.d1.uid,'アンデット']);
ok('F4: not its controller\'s turn — cannot be activated (the card stays in the hand)',z(F.d1)==='hand'&&z(F.w1)==='mz',JSON.stringify({d1:z(F.d1)}));
F=fieldF({phase:'battle'});
zoneAct(0,'mz',0,[F.d1.uid,'アンデット']);
ok('F4: Battle Phase — cannot be activated',z(F.d1)==='hand'&&z(F.w1)==='mz',JSON.stringify({d1:z(F.d1)}));
F=fieldF({vdown:true});
zoneAct(0,'mz',0,[F.d1.uid,'アンデット']);
ok('F4: face-down 同族感染ウィルス — an ignition effect needs it face-up',z(F.d1)==='hand'&&z(F.w1)==='mz',JSON.stringify({d1:z(F.d1)}));
`);
