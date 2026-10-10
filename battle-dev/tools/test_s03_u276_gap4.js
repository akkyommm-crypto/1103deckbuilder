/* S03-U276: ENGINE_GAP re-check 4 — ドッペル・ゲイナー, クリボーを呼ぶ笛, ダーク・アイズ・イリュージョニスト, エレキトンボ, マジック・キャンセラー, デルタ・アタッカー (2011 texts).
   Real DUEL paths (activation / chain windows / attacks / Flip Summon through the processor), Replay-audited; each card has negatives. */
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

/* ===== A: ドッペル・ゲイナー — Continuous Trap; each time its controller takes effect damage from a monster on the opponent's field, the opponent takes the same damage ===== */
/* A1: activated as a normal Continuous Trap (nothing happens), then the opponent's キャノン・ソルジャー damages its controller */
fresh();
let dg=setT('ドッペル・ゲイナー',0),cs=up('キャノン・ソルジャー',1),s1=up('ワイト',1),s2=up('ワイト',1);
gameState.players[0].sz=[dg];gameState.players[1].mz=[cs,s1,s2];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A1: activating it does nothing by itself — face-up on the field, no LP change',z(dg)==='sz'&&C(dg).face==='up'&&lp(0)===8000&&lp(1)===8000,JSON.stringify({z:z(dg),face:C(dg)&&C(dg).face,lp0:lp(0),lp1:lp(1)}));
nextTurn();toPhase('main1');
PREFER=[s1.uid];duelActivateFromZone(1,'mz',idx(cs));drive();PREFER=[];
ok('A1: the opponent\'s monster effect (キャノン・ソルジャー, 500) — its controller takes 500, the opponent takes the same 500',gameState.activePlayer===1&&lp(0)===7500&&lp(1)===7500&&z(s1)==='grave'&&z(dg)==='sz',JSON.stringify({ap:gameState.activePlayer,lp0:lp(0),lp1:lp(1),s1:z(s1)}));
/* A2: it is a forced effect applied EACH time */
PREFER=[s2.uid];duelActivateFromZone(1,'mz',idx(cs));drive();PREFER=[];
ok('A2: the second monster effect damage is mirrored again (each time) — 7000 / 7000',lp(0)===7000&&lp(1)===7000&&z(dg)==='sz'&&C(dg).face==='up',JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('A1-A2');

/* A3: a Spell card's damage (the opponent's ファイヤー・ボール) is not mirrored */
fresh();
gameState.activePlayer=1;gameState.turn=6;
dg=up('ドッペル・ゲイナー',0);let fb=mk('ファイヤー・ボール',1),s3=up('ワイト',1),s4=up('ワイト',1);
gameState.players[0].sz=[dg];gameState.players[1].hand=[fb];gameState.players[1].mz=[s3,s4];baselineA();
cast(1,'ファイヤー・ボール',[s3.uid]);
ok('A3: ファイヤー・ボール (a Spell) deals 500 — not a monster effect, no mirror',lp(0)===7500&&lp(1)===8000&&z(fb)==='grave',JSON.stringify({lp0:lp(0),lp1:lp(1),fb:z(fb)}));
/* A4: damage with no source card, and battle damage, are not mirrored */
API.damageLP(0,300);
ok('A4: effect damage with no source card is not mirrored',lp(0)===7200&&lp(1)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('A3-A4');
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
dg=up('ドッペル・ゲイナー',0);let wm=up('ワイト',0),bew=up('青眼の白龍',1);
gameState.players[0].sz=[dg];gameState.players[0].mz=[wm];gameState.players[1].mz=[bew];baselineA();
hitT(1,bew,wm);
ok('A4: battle damage (2700) to its controller is not mirrored',z(wm)==='grave'&&lp(0)===5300&&lp(1)===8000,JSON.stringify({wm:z(wm),lp0:lp(0),lp1:lp(1)}));
audit('A4');

/* A5: the source monster must be on the opponent's field when the damage happens — 古代の機械砲台 releases itself as the cost, so it is in the GY at resolution */
fresh();
gameState.activePlayer=1;gameState.turn=6;
dg=up('ドッペル・ゲイナー',0);let cm=up('古代の機械砲台',1);
gameState.players[0].sz=[dg];gameState.players[1].mz=[cm];baselineA();
duelActivateFromZone(1,'mz',idx(cm));drive();
ok('A5: 古代の機械砲台 (released as the cost, in the GY when the 500 is dealt) — not a monster on the opponent\'s field, no mirror',z(cm)==='grave'&&lp(0)===7500&&lp(1)===8000,JSON.stringify({cm:z(cm),lp0:lp(0),lp1:lp(1)}));
audit('A5');

/* A6: not activated (still Set) — no effect; and the damage its controller inflicts itself (own キャノン・ソルジャー) is not "taken" by it */
fresh();
gameState.activePlayer=1;gameState.turn=6;
dg=setT('ドッペル・ゲイナー',0);cs=up('キャノン・ソルジャー',1);s1=up('ワイト',1);
gameState.players[0].sz=[dg];gameState.players[1].mz=[cs,s1];baselineA();
PREFER=[s1.uid];duelActivateFromZone(1,'mz',idx(cs));drive();PREFER=[];
ok('A6: still Set (never activated) — it does not apply: 500 only to its controller, and it stays Set',lp(0)===7500&&lp(1)===8000&&z(dg)==='sz'&&C(dg).face==='down',JSON.stringify({lp0:lp(0),lp1:lp(1),face:C(dg)&&C(dg).face}));
fresh();
dg=up('ドッペル・ゲイナー',0);cs=up('キャノン・ソルジャー',0);s1=up('ワイト',0);
gameState.players[0].sz=[dg];gameState.players[0].mz=[cs,s1];baselineA();
PREFER=[s1.uid];duelActivateFromZone(0,'mz',idx(cs));drive();PREFER=[];
ok('A6: its controller\'s own monster damages the opponent — the opponent takes 500; its controller takes nothing',lp(1)===7500&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('A6');

/* ===== B: クリボーを呼ぶ笛 — choose 1 クリボー / ハネクリボー in the Deck (no target), then add it to the hand or Special Summon it ===== */
function whistleDeck(){const k=mk('クリボー',0),h=mk('ハネクリボー',0),l9=mk('ハネクリボー LV9',0),w=mk('ワイト',0);gameState.players[0].deck=[w,l9,k,h,mk('ワイト',0)];return {k,h,l9,w};}
function untilQ(){for(let i=0;i<200;i++){if(pc())return pc();
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return null;}return null;}
function candUid(x){return x.uid!=null?x.uid:(x.card&&x.card.uid);}
/* B1: add to the hand; the pool is exactly the two named monsters (not ハネクリボー LV9, not other cards) */
fresh();
let wd=whistleDeck(),fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];baselineA();
ok('B1: activatable with クリボー in the Deck',legalHand('クリボーを呼ぶ笛',0,0).ok===true,JSON.stringify(legalHand('クリボーを呼ぶ笛',0,0)));
castOpen(0,'クリボーを呼ぶ笛');
let q=untilQ(),cu=q?q.candidates.map(candUid).sort():[];
ok('B1: the Deck pool is クリボー and ハネクリボー only (not LV9, not ワイト)',!!q&&cu.length===2&&cu.indexOf(wd.k.uid)>=0&&cu.indexOf(wd.h.uid)>=0,JSON.stringify(cu));
PREFER=[wd.k.uid,'add'];drive();PREFER=[];
ok('B1: クリボー added to the hand; the card went to the GY; nothing summoned',z(wd.k)==='hand'&&z(fl)==='grave'&&gameState.players[0].mz.length===0,JSON.stringify({k:z(wd.k),fl:z(fl),mz:gameState.players[0].mz.length}));
audit('B1');
/* B2: Special Summon — the position is chosen (face-up Defense) */
fresh();
wd=whistleDeck();fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];baselineA();
cast(0,'クリボーを呼ぶ笛',[wd.h.uid,'summon','def']);
ok('B2: ハネクリボー Special Summoned to the own field, face-up Defense Position (chosen)',z(wd.h)==='mz'&&pl(wd.h)===0&&C(wd.h).face==='up'&&C(wd.h).pos==='def'&&z(fl)==='grave',JSON.stringify({h:z(wd.h),pos:C(wd.h)&&C(wd.h).pos,fl:z(fl)}));
audit('B2');
fresh();
wd=whistleDeck();fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];baselineA();
cast(0,'クリボーを呼ぶ笛',[wd.k.uid,'summon','atk']);
ok('B2: クリボー Special Summoned in face-up Attack Position (chosen)',z(wd.k)==='mz'&&C(wd.k).face==='up'&&C(wd.k).pos==='atk'&&!!C(wd.k).specialSummoned,JSON.stringify({k:z(wd.k),pos:C(wd.k)&&C(wd.k).pos}));
audit('B2b');
/* B3 (negative): neither named monster in the Deck — not activatable; a Set copy is not activatable either */
fresh();
gameState.players[0].deck=[mk('ハネクリボー LV9',0),mk('ワイト',0),mk('ワイト',0)];fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];baselineA();
ok('B3: no クリボー / ハネクリボー in the Deck (only LV9 and ワイト) — not activatable',legalHand('クリボーを呼ぶ笛',0,0).ok===false,JSON.stringify(legalHand('クリボーを呼ぶ笛',0,0)));
/* B4 (negative): no free Monster Zone — only "add to the hand" (no mode question) */
fresh();
wd=whistleDeck();fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];
gameState.players[0].mz=[0,1,2,3,4].map(()=>up('ワイト',0));baselineA();
castOpen(0,'クリボーを呼ぶ笛');
q=untilQ();let jk=q?q.candidates.findIndex(x=>candUid(x)===wd.k.uid):-1;
if(jk>=0)__choicePickV49(jk);
ok('B4: Monster Zones full — the monster goes to the hand and no add / summon question is asked',jk>=0&&!pc()&&z(wd.k)==='hand'&&gameState.players[0].mz.length===5,JSON.stringify({jk,pc:!!pc(),k:z(wd.k)}));
audit('B4');
/* B5 (negative): Special Summons are not allowed this turn — add only; still activatable */
fresh();
wd=whistleDeck();fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];
gameState.players[0].temporaryFlags=gameState.players[0].temporaryFlags||{};gameState.players[0].temporaryFlags.noSpecialSummon=true;baselineA();
ok('B5: Special Summons banned — still activatable (add to the hand)',legalHand('クリボーを呼ぶ笛',0,0).ok===true,JSON.stringify(legalHand('クリボーを呼ぶ笛',0,0)));
castOpen(0,'クリボーを呼ぶ笛');
q=untilQ();jk=q?q.candidates.findIndex(x=>candUid(x)===wd.h.uid):-1;
if(jk>=0)__choicePickV49(jk);
ok('B5: no mode question — ハネクリボー added to the hand',jk>=0&&!pc()&&z(wd.h)==='hand',JSON.stringify({jk,pc:!!pc(),h:z(wd.h)}));
audit('B5');
/* B6 (negative): ライオウ on the opponent's field (no adding from the Deck) — Special Summon only */
fresh();
wd=whistleDeck();fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];gameState.players[1].mz=[up('ライオウ',1)];baselineA();
castOpen(0,'クリボーを呼ぶ笛');
q=untilQ();jk=q?q.candidates.findIndex(x=>candUid(x)===wd.k.uid):-1;
if(jk>=0)__choicePickV49(jk);
q=pc();
ok('B6: ライオウ forbids adding from the Deck — the next question is the summon position, not add / summon',jk>=0&&!!q&&q.candidates.some(x=>x.key==='atk')&&!q.candidates.some(x=>x.key==='add'),JSON.stringify(q&&q.candidates.map(x=>x.key)));
PREFER=['atk'];drive();PREFER=[];
ok('B6: クリボー Special Summoned',z(wd.k)==='mz'&&C(wd.k).pos==='atk',JSON.stringify({k:z(wd.k)}));
audit('B6');
/* B7 (negative): both impossible (ライオウ + full Monster Zones) — not activatable */
fresh();
wd=whistleDeck();fl=mk('クリボーを呼ぶ笛',0);gameState.players[0].hand=[fl];gameState.players[0].mz=[0,1,2,3,4].map(()=>up('ワイト',0));gameState.players[1].mz=[up('ライオウ',1)];baselineA();
ok('B7: neither adding nor summoning is possible — not activatable',legalHand('クリボーを呼ぶ笛',0,0).ok===false,JSON.stringify(legalHand('クリボーを呼ぶ笛',0,0)));
/* B8: a Quick-Play Spell Set the turn before can be activated from the field (and at the opponent's turn) */
fresh();
gameState.activePlayer=1;gameState.turn=6;
wd=whistleDeck();fl=setT('クリボーを呼ぶ笛',0);gameState.players[0].sz=[fl];baselineA();
ok('B8: a Set copy is legal to activate in the opponent\'s turn (Quick-Play)',strictScriptLegalityV2('クリボーを呼ぶ笛',0,'sz',0,{}).ok===true,JSON.stringify(strictScriptLegalityV2('クリボーを呼ぶ笛',0,'sz',0,{})));

/* ===== C: ダーク・アイズ・イリュージョニスト — Flip: while this card stays on the field, the chosen monster cannot attack ===== */
function setDown(n,p){const c=mk(n,p,'down','def');c.setTurn=3;return c;}
/* C1: flipped by the opponent's attack (its controller chooses the target at the Flip) — the chosen monster cannot attack; the others can */
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
let di=setDown('ダーク・アイズ・イリュージョニスト',0),ca=up('ワイト',1),cb=up('青眼の白龍',1),cc=up('ワイト',1),cd=mk('ワイト',1,'down','def');cd.setTurn=3;
gameState.players[0].mz=[di];gameState.players[1].mz=[ca,cb,cc,cd];baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(ca),target:idx(di)});
let qc=null;for(let k=0;k<80&&!qc;k++){qc=pc();if(qc)break;if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
const cu1=qc?qc.candidates.map(x=>x.uid!=null?x.uid:(x.card&&x.card.uid)):[];
ok('C1: attacked while face-down — flipped; the Flip effect offers every monster on the field (both sides, including a face-down one and itself)',C(di).face==='up'&&[ca,cb,cc,cd,di].every(c=>cu1.indexOf(c.uid)>=0)&&cu1.length===5,JSON.stringify(cu1));
PREFER=[cb.uid];drive();PREFER=[];
ok('C1: the chosen 青眼 cannot attack now',cannotAttackNow(C(cb))&&!canDeclareAttackV48(C(cb)),JSON.stringify({cant:cannotAttackNow(C(cb))}));
ok('C1: the other monsters are not locked',canDeclareAttackV48(C(cc))&&!cannotAttackNow(C(cc))&&!cannotAttackNow(C(ca))&&!cannotAttackNow(C(di)),JSON.stringify({cc:cannotAttackNow(C(cc)),di:cannotAttackNow(C(di))}));
hitT(1,cb,di);
ok('C1: a real attack declaration by 青眼 is refused — no battle, no attack counted',attackCountV48(C(cb))===0&&lp(0)===8000&&z(di)==='mz',JSON.stringify({n:attackCountV48(C(cb)),lp0:lp(0),di:z(di)}));
audit('C1');

/* C2: Flip Summoned in the own Main Phase, choosing an own monster; the lock is applied in the Battle Phase; it ends when the Illusionist leaves the field */
fresh();
di=setDown('ダーク・アイズ・イリュージョニスト',0);let wa=up('ジェネティック・ワーウルフ',0),wb=up('ジェネティック・ワーウルフ',0);
gameState.players[0].mz=[di,wa,wb];baselineA();
PREFER=[wa.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
ok('C2: Flip Summoned — face-up; the chosen own ジェネティック・ワーウルフ is locked, the other is not',C(di).face==='up'&&cannotAttackNow(C(wa))&&!cannotAttackNow(C(wb)),JSON.stringify({face:C(di).face,a:cannotAttackNow(C(wa)),b:cannotAttackNow(C(wb))}));
toPhase('battle');
hitT(0,wa,'direct');
ok('C2: the locked monster\'s direct attack is refused (no damage)',lp(1)===8000&&attackCountV48(C(wa))===0,JSON.stringify({lp1:lp(1)}));
hitT(0,wb,'direct');
ok('C2: the other monster attacks directly — 2000 damage',lp(1)===6000,String(lp(1)));
let dih=locateCardAnyV4(C(di));API.destroy(dih,'test',1);drive();
ok('C2: the Illusionist left the field — the lock ends, the monster attacks directly (4000)',z(di)==='grave'&&!cannotAttackNow(C(wa)),JSON.stringify({di:z(di)}));
hitT(0,wa,'direct');
ok('C2: the freed monster\'s direct attack is 2000 damage',lp(1)===4000,String(lp(1)));
audit('C2');

/* C3: the target leaves the field and returns — it is free (zone-local marks) */
fresh();
di=setDown('ダーク・アイズ・イリュージョニスト',0);wa=up('ジェネティック・ワーウルフ',0);
gameState.players[0].mz=[di,wa];baselineA();
PREFER=[wa.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
ok('C3: the chosen monster is locked',cannotAttackNow(C(wa)));
API.returnToHand(locateCardAnyV4(C(wa)),'test');drive();
ok('C3: the target was returned to the hand',z(wa)==='hand');
doNormalSummon(gameState.players[0].hand.findIndex(c=>c.uid===wa.uid),'atk');drive();
ok('C3: Normal Summoned again — it is a new stay on the field, no longer locked',z(wa)==='mz'&&!cannotAttackNow(C(wa)),JSON.stringify({z:z(wa),cant:cannotAttackNow(C(wa))}));
toPhase('battle');hitT(0,wa,'direct');
ok('C3: it attacks directly — 2000',lp(1)===6000,String(lp(1)));
audit('C3');

/* C4: turned face-down ends the lock */
fresh();
di=setDown('ダーク・アイズ・イリュージョニスト',0);wa=up('ジェネティック・ワーウルフ',0);
gameState.players[0].mz=[di,wa];baselineA();
PREFER=[wa.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
ok('C4: locked while the Illusionist is face-up',cannotAttackNow(C(wa)));
API.flip(locateCardAnyV4(C(di)),'down','test');drive();
ok('C4: the Illusionist is face-down — the lock does not apply',C(di).face==='down'&&!cannotAttackNow(C(wa)),JSON.stringify({face:C(di).face,cant:cannotAttackNow(C(wa))}));
audit('C4');

/* C5 (negative): Normal Summoned face-up — no Flip effect, no target is asked, nothing locked */
fresh();
di=mk('ダーク・アイズ・イリュージョニスト',0);wa=up('ジェネティック・ワーウルフ',0);
gameState.players[0].hand=[di];gameState.players[0].mz=[wa];baselineA();
doNormalSummon(0,'atk');drive();
ok('C5: Normal Summoned — no target question, nothing locked',z(di)==='mz'&&!pc()&&!cannotAttackNow(C(wa))&&!cannotAttackNow(C(di)),JSON.stringify({pc:!!pc(),a:cannotAttackNow(C(wa))}));
audit('C5');

/* ===== D: エレキトンボ — destroyed by the opponent: may Special Summon 1 「エレキ」 monster from the Deck ===== */
function eleDeck(){const a=mk('エレキッズ',0),b=mk('エレキリン',0),w=mk('ワイト',0),g=mk('エレキャノン',0);gameState.players[0].deck=[w,a,g,b,mk('ワイト',0)];return {a,b,w,g};}
/* D1: destroyed in battle by the opponent's 青眼 — optional trigger from the GY; the Deck pool is 「エレキ」 monsters only; position chosen */
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
let ton=up('エレキトンボ',0,'def'),bew2=up('青眼の白龍',1),ed=eleDeck();
gameState.players[0].mz=[ton];gameState.players[1].mz=[bew2];baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(bew2),target:idx(ton)});
let qd=null;for(let k=0;k<120&&!qd;k++){qd=pc();if(qd)break;if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
const cd1=qd?qd.candidates.map(x=>x.uid!=null?x.uid:(x.card&&x.card.uid)).sort():[];
ok('D1: destroyed by the opponent\'s battle — the Deck pool is the 「エレキ」 monsters (エレキッズ, エレキリン); not ワイト, not the Trap エレキャノン',z(ton)==='grave'&&cd1.length===2&&cd1.indexOf(ed.a.uid)>=0&&cd1.indexOf(ed.b.uid)>=0,JSON.stringify({ton:z(ton),cd1}));
PREFER=[ed.b.uid,'def'];drive();PREFER=[];
ok('D1: エレキリン Special Summoned from the Deck in face-up Defense Position (chosen)',z(ed.b)==='mz'&&pl(ed.b)===0&&C(ed.b).face==='up'&&C(ed.b).pos==='def'&&!!C(ed.b).specialSummoned,JSON.stringify({b:z(ed.b),pos:C(ed.b)&&C(ed.b).pos}));
audit('D1');
/* D2: destroyed by the opponent's card effect (ブラック・ホール) — the same */
fresh();
gameState.activePlayer=1;gameState.turn=6;
ton=up('エレキトンボ',0);let bh=mk('ブラック・ホール',1);ed=eleDeck();
gameState.players[0].mz=[ton];gameState.players[1].hand=[bh];baselineA();
cast(1,'ブラック・ホール',[ed.a.uid,'atk']);
ok('D2: destroyed by the opponent\'s ブラック・ホール — エレキッズ Special Summoned in Attack Position',z(ton)==='grave'&&z(ed.a)==='mz'&&C(ed.a).pos==='atk',JSON.stringify({ton:z(ton),a:z(ed.a)}));
audit('D2');
/* D3: it destroys a monster and is destroyed itself in the own Battle Phase (it attacks 青眼) */
fresh();
gameState.phase='battle';
ton=up('エレキトンボ',0);bew2=up('青眼の白龍',1);ed=eleDeck();
gameState.players[0].mz=[ton];gameState.players[1].mz=[bew2];baselineA();
PREFER=[ed.a.uid,'atk'];hitT(0,ton,bew2);PREFER=[];
ok('D3: its own attack into 青眼 — destroyed by the opponent\'s monster in battle; エレキッズ Special Summoned',z(ton)==='grave'&&z(ed.a)==='mz'&&lp(0)===5900,JSON.stringify({ton:z(ton),a:z(ed.a),lp0:lp(0)}));
audit('D3');
/* D4 (negative): destroyed by its own controller's card (own ブラック・ホール) — no trigger */
fresh();
ton=up('エレキトンボ',0);bh=mk('ブラック・ホール',0);ed=eleDeck();
gameState.players[0].mz=[ton];gameState.players[0].hand=[bh];baselineA();
cast(0,'ブラック・ホール',[ed.a.uid,'atk']);
ok('D4: destroyed by the own ブラック・ホール — not by the opponent: nothing is summoned',z(ton)==='grave'&&z(ed.a)==='deck'&&z(ed.b)==='deck'&&gameState.players[0].mz.length===0&&!pc(),JSON.stringify({ton:z(ton),a:z(ed.a),mz:gameState.players[0].mz.length}));
audit('D4');
/* D5 (negative): sent to the GY without being destroyed (an effect sends it) — no trigger */
fresh();
gameState.activePlayer=1;gameState.turn=6;
ton=up('エレキトンボ',0);ed=eleDeck();
gameState.players[0].mz=[ton];baselineA();
API.sendToGrave(locateCardAnyV4(C(ton)),'test');drive();
ok('D5: sent to the GY (not destroyed) — nothing is summoned',z(ton)==='grave'&&z(ed.a)==='deck'&&!pc()&&gameState.players[0].mz.length===0,JSON.stringify({ton:z(ton),a:z(ed.a)}));
/* D6: optional — the player may decline */
fresh();
gameState.activePlayer=1;gameState.turn=6;
ton=up('エレキトンボ',0);bh=mk('ブラック・ホール',1);ed=eleDeck();
gameState.players[0].mz=[ton];gameState.players[1].hand=[bh];baselineA();
let offered6=false;const iBh=0;duelActivateFromHand(iBh);
for(let k=0;k<120;k++){if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)offered6=true;eventSkipGroupV2();continue;}if(pc())break;if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
ok('D6: the trigger is optional — it was offered and declined: エレキトンボ stays in the GY and nothing is summoned',offered6&&z(ton)==='grave'&&z(ed.a)==='deck'&&z(ed.b)==='deck'&&!pc(),JSON.stringify({offered6,ton:z(ton),a:z(ed.a),pc:!!pc()}));
/* D7 (negative): no 「エレキ」 monster in the Deck — nothing happens (no error) */
fresh();
gameState.activePlayer=1;gameState.turn=6;
ton=up('エレキトンボ',0);bh=mk('ブラック・ホール',1);gameState.players[0].deck=[mk('ワイト',0),mk('エレキャノン',0),mk('ワイト',0)];
gameState.players[0].mz=[ton];gameState.players[1].hand=[bh];baselineA();
cast(1,'ブラック・ホール');
ok('D7: no 「エレキ」 monster in the Deck — nothing is summoned',z(ton)==='grave'&&gameState.players[0].mz.length===0&&!pc(),JSON.stringify({ton:z(ton),mz:gameState.players[0].mz.length}));

/* ===== E: マジック・キャンセラー — while face-up, no Spell card can be activated (either player) and the effects of all Spells on the field are negated ===== */
/* E1: neither player can activate a Spell card; control: without it the same card is legal */
fresh();
let mc=up('マジック・キャンセラー',0),pot=mk('強欲な壺',0),pot1=mk('強欲な壺',1),potSet=setT('強欲な壺',0);
gameState.players[0].mz=[mc];gameState.players[0].hand=[pot];gameState.players[1].hand=[pot1];gameState.players[0].sz=[potSet];baselineA();
let lgE1=legalHand('強欲な壺',0,0);
ok('E1: its controller cannot activate a Spell card from the hand',lgE1.ok===false&&/マジック・キャンセラー/.test(lgE1.reason),JSON.stringify(lgE1));
duelActivateFromHand(0);drive();
ok('E1: a real activation attempt does nothing — the Spell stays in the hand, no draw',z(pot)==='hand'&&gameState.players[0].deck.length===6,JSON.stringify({pot:z(pot),deck:gameState.players[0].deck.length}));
ok('E1: a Set Spell cannot be activated either',strictScriptLegalityV2('強欲な壺',0,'sz',0,{}).ok===false,JSON.stringify(strictScriptLegalityV2('強欲な壺',0,'sz',0,{})));
gameState.activePlayer=1;gameState.turn=6;
let lgE1b=legalHand('強欲な壺',1,0);
ok('E1: the opponent cannot activate a Spell card either (both players)',lgE1b.ok===false&&/マジック・キャンセラー/.test(lgE1b.reason),JSON.stringify(lgE1b));
/* E1 controls: Set (face-down) it does not lock; face-up it is lifted when it leaves */
fresh();
mc=mk('マジック・キャンセラー',0,'down','def');pot=mk('強欲な壺',0);gameState.players[0].mz=[mc];gameState.players[0].hand=[pot];baselineA();
ok('E1 control: face-down マジック・キャンセラー does not stop Spell activation',legalHand('強欲な壺',0,0).ok===true);
fresh();
mc=up('マジック・キャンセラー',0);pot=mk('強欲な壺',0);gameState.players[0].mz=[mc];gameState.players[0].hand=[pot];baselineA();
API.destroy(locateCardAnyV4(C(mc)),'test',1);drive();
ok('E1 control: after it leaves the field the Spell can be activated again',z(mc)==='grave'&&legalHand('強欲な壺',0,0).ok===true,JSON.stringify(legalHand('強欲な壺',0,0)));
cast(0,'強欲な壺');
ok('E1 control: 強欲な壺 draws 2 once it is gone',gameState.players[0].hand.length===2&&gameState.players[0].deck.length===4,JSON.stringify({h:gameState.players[0].hand.length,d:gameState.players[0].deck.length}));
audit('E1c');

/* E2: the continuous effect of a Spell already on the field is negated (a Field Spell, 山) */
fresh();
mc=up('マジック・キャンセラー',0);let bew3=up('青眼の白龍',1);gameState.players[0].mz=[mc];gameState.players[1].mz=[bew3];gameState.players[1].field=mk('山',1,'up');baselineA();
ok('E2: 山 does not raise 青眼の白龍 while マジック・キャンセラー is face-up (3000)',curATK(C(bew3))===3000,JSON.stringify({atk:curATK(C(bew3))}));
fresh();
bew3=up('青眼の白龍',1);gameState.players[1].mz=[bew3];gameState.players[1].field=mk('山',1,'up');baselineA();
ok('E2 control: without it 山 gives 3200',curATK(C(bew3))===3200,JSON.stringify({atk:curATK(C(bew3))}));

/* E3: a Spell activated BEFORE it arrives — in response, リビングデッドの呼び声 Special Summons it from the GY — has its effect negated at resolution */
fresh();
gameState.activePlayer=1;gameState.turn=6;
mc=mk('マジック・キャンセラー',0);let call=setT('リビングデッドの呼び声',0);pot1=mk('強欲な壺',1);
gameState.players[0].grave=[mc];gameState.players[0].sz=[call];gameState.players[1].hand=[pot1];baselineA();
castOpen(1,'強欲な壺');
ok('E3: the opponent\'s 強欲な壺 is activated (no MC on the field yet) — リビングデッドの呼び声 is offered in response',toWindow()&&offered(0,call));
PREFER=[mc.uid];windows([call]);PREFER=[];
ok('E3: マジック・キャンセラー was revived; 強欲な壺 resolved with its effect negated — no card drawn',z(mc)==='mz'&&gameState.players[1].hand.length===0&&gameState.players[1].deck.length===6&&z(pot1)==='grave',JSON.stringify({mc:z(mc),h:gameState.players[1].hand.length,d:gameState.players[1].deck.length,pot:z(pot1)}));
audit('E3');

/* E4 (negative): monster effects are not affected — the opponent's キャノン・ソルジャー effect works */
fresh();
gameState.activePlayer=1;gameState.turn=6;
mc=up('マジック・キャンセラー',0);let cs4=up('キャノン・ソルジャー',1),s14=up('ワイト',1);gameState.players[0].mz=[mc];gameState.players[1].mz=[cs4,s14];baselineA();
PREFER=[s14.uid];duelActivateFromZone(1,'mz',idx(cs4));drive();PREFER=[];
ok('E4: a monster effect is still activatable — キャノン・ソルジャー deals 500',lp(0)===7500&&z(s14)==='grave',JSON.stringify({lp0:lp(0),s1:z(s14)}));
audit('E4');

/* ===== F: デルタ・アタッカー — with 3 face-up same-name Normal Monsters (no Tokens): this turn those 3 can attack directly ===== */
function kids(n,p){return Array.from({length:n},()=>up('エレキッズ',p));}
/* F1: three エレキッズ attack directly past the opponent's monsters; a different Normal Monster (青眼) cannot */
fresh();
let ks=kids(3,0),mine=up('青眼の白龍',0),dl=mk('デルタ・アタッカー',0),f1=up('青眼の白龍',1),f2=up('ワイト',1);
gameState.players[0].mz=ks.concat([mine]);gameState.players[0].hand=[dl];gameState.players[1].mz=[f1,f2];baselineA();
ok('F1 control: before the Spell, エレキッズ cannot attack directly while the opponent has monsters',!canDirectAttackThroughMonstersV51(C(ks[0])),JSON.stringify({d:canDirectAttackThroughMonstersV51(C(ks[0]))}));
ok('F1: activatable with 3 same-name Normal Monsters',legalHand('デルタ・アタッカー',0,0).ok===true,JSON.stringify(legalHand('デルタ・アタッカー',0,0)));
cast(0,'デルタ・アタッカー');
ok('F1: the Spell resolved',z(dl)==='grave');
toPhase('battle');
ok('F1: the three エレキッズ may attack directly now; the other Normal Monster (青眼) may not',ks.every(k=>canDirectAttackThroughMonstersV51(C(k)))&&!canDirectAttackThroughMonstersV51(C(mine)),JSON.stringify({k:ks.map(k=>canDirectAttackThroughMonstersV51(C(k))),m:canDirectAttackThroughMonstersV51(C(mine))}));
ks.forEach(k=>hitT(0,k,'direct'));
ok('F1: three direct attacks past the opponent\'s monsters — 3 x 1000 = 3000 damage',lp(1)===5000&&z(f1)==='mz'&&z(f2)==='mz',JSON.stringify({lp1:lp(1)}));
hitT(0,mine,'direct');
ok('F1: the fourth monster (a different Normal Monster) cannot attack directly — no damage',lp(1)===5000,String(lp(1)));
audit('F1');

/* F2: only in the activation turn */
fresh();
ks=kids(3,0);dl=mk('デルタ・アタッカー',0);f1=up('青眼の白龍',1);
gameState.players[0].mz=ks.slice();gameState.players[0].hand=[dl];gameState.players[1].mz=[f1];baselineA();
cast(0,'デルタ・アタッカー');
nextTurn();toPhase('main1');nextTurn();toPhase('battle');
ok('F2: in the next own turn the grant is gone — no direct attack past 青眼',gameState.activePlayer===0&&ks.every(k=>!canDirectAttackThroughMonstersV51(C(k))),JSON.stringify({ap:gameState.activePlayer,k:ks.map(k=>canDirectAttackThroughMonstersV51(C(k)))}));
hitT(0,ks[0],'direct');
ok('F2: a real direct attack is refused (no damage)',lp(1)===8000,String(lp(1)));
audit('F2');

/* F3: a monster that left the field and returned during the turn is not one of the 3 any more (zone-local) */
fresh();
ks=kids(3,0);dl=mk('デルタ・アタッカー',0);f1=up('青眼の白龍',1);
gameState.players[0].mz=ks.slice();gameState.players[0].hand=[dl];gameState.players[1].mz=[f1];baselineA();
cast(0,'デルタ・アタッカー');
API.returnToHand(locateCardAnyV4(C(ks[2])),'test');drive();
doNormalSummon(gameState.players[0].hand.findIndex(c=>c.uid===ks[2].uid),'atk');drive();
toPhase('battle');
ok('F3: the two that stayed may attack directly; the one that left and returned may not',canDirectAttackThroughMonstersV51(C(ks[0]))&&canDirectAttackThroughMonstersV51(C(ks[1]))&&!canDirectAttackThroughMonstersV51(C(ks[2])),JSON.stringify({a:canDirectAttackThroughMonstersV51(C(ks[0])),c:canDirectAttackThroughMonstersV51(C(ks[2]))}));
audit('F3');

/* F4 (negatives): the condition — exactly 3 face-up non-Token Normal Monsters with the same name */
function dLegal(setup){fresh();const d=mk('デルタ・アタッカー',0);gameState.players[0].hand=[d];gameState.players[0].mz=setup();baselineA();return legalHand('デルタ・アタッカー',0,0);}
ok('F4: only 2 same-name Normal Monsters — not activatable',dLegal(()=>kids(2,0)).ok===false);
ok('F4: 3 エレキッズ but one is face-down — not activatable',dLegal(()=>{const a=kids(2,0);a.push(mk('エレキッズ',0,'down','def'));return a;}).ok===false);
ok('F4: 2 エレキッズ + a different Normal Monster — not activatable',dLegal(()=>kids(2,0).concat([up('青眼の白龍',0)])).ok===false);
ok('F4: 3 same-name monsters that are not Normal Monsters (キャノン・ソルジャー, effect) — not activatable',dLegal(()=>[up('キャノン・ソルジャー',0),up('キャノン・ソルジャー',0),up('キャノン・ソルジャー',0)]).ok===false);
ok('F4: 3 エレキッズ but one is a Token — not activatable',dLegal(()=>{const a=kids(3,0);a[2].token=true;return a;}).ok===false);
ok('F4: 3 same-name Normal Monsters only on the OPPONENT field — not activatable',(()=>{fresh();const d=mk('デルタ・アタッカー',0);gameState.players[0].hand=[d];gameState.players[1].mz=kids(3,1);baselineA();return legalHand('デルタ・アタッカー',0,0).ok===false;})());
ok('F4: 4 エレキッズ (the text says 3) — not activatable',dLegal(()=>kids(4,0)).ok===false);
ok('F4 control: exactly 3 — activatable',dLegal(()=>kids(3,0)).ok===true);
`);
