/* S03-U254: NOT_STARTED → TESTED — 棘の妖精, D・バインド, 絶対服従魔人, ワーム・イーロキン, ニトロ・シンクロン.
   Real DUEL paths (attacks, POINT responses, activations and choices through the processor, Synchro Summon), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function atk(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});drive();}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,0);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function turnOf(p){gameState.activePlayer=p;gameState.turn=p===0?5:6;gameState.phase='battle';}

/* ===== A: 棘の妖精 — the opponent cannot attack Insect monsters; its battle partner becomes Defense at the end of the Damage Step ===== */
fresh();
let th=up('棘の妖精',0),ins=up('アシッドクロウラー',0),g1=up('ゴブリン突撃部隊',1);
gameState.players[0].mz=[th,ins];gameState.players[1].mz=[g1];turnOf(1);baselineA();
atk(1,g1,ins);
ok('A: the opponent cannot attack the Insect monster (アシッドクロウラー) while 棘の妖精 is on the field',z(ins)==='mz'&&lp(0)===8000&&!C(g1).attacked,JSON.stringify({ins:z(ins),lp0:lp(0),att:C(g1).attacked}));
const whyA=attackTargetForbiddenReasonS03(1,C(ins)),whyA2=attackTargetForbiddenReasonS03(1,C(th));
ok('A: the engine names 棘の妖精 as the reason for the Insect, and has none for 棘の妖精 itself',String(whyA).indexOf('棘の妖精')>=0&&!whyA2,JSON.stringify({whyA,whyA2}));
fresh();
let lc=up('墓守の長槍兵',1);th=up('棘の妖精',0,'def');gameState.players[0].mz=[th];gameState.players[1].mz=[lc];turnOf(1);baselineA();
atk(1,lc,th);
ok('A2: 棘の妖精 (DEF 2000) survives 墓守の長槍兵 (ATK 1500); the attacker is changed to Defense at the end of the Damage Step',z(th)==='mz'&&C(lc).pos==='def'&&C(lc).face==='up'&&lp(1)===7500,JSON.stringify({th:z(th),pos:C(lc).pos,face:C(lc).face,lp1:lp(1)}));
audit('A2');
fresh();
g1=up('ゴブリン突撃部隊',1);th=up('棘の妖精',0,'def');gameState.players[0].mz=[th];gameState.players[1].mz=[g1];turnOf(1);baselineA();
atk(1,g1,th);
ok('A3: even when 棘の妖精 is destroyed, the monster that battled it becomes Defense',z(th)==='grave'&&C(g1).pos==='def',JSON.stringify({th:z(th),pos:C(g1)&&C(g1).pos}));
audit('A3');
fresh();
ins=up('アシッドクロウラー',0);g1=up('ゴブリン突撃部隊',1);gameState.players[0].mz=[ins];gameState.players[1].mz=[g1];turnOf(1);baselineA();
atk(1,g1,ins);
ok('A4 control: without 棘の妖精 the Insect can be attacked and destroyed',z(ins)==='grave');
fresh();
th=up('棘の妖精',0);let insD=mk('アシッドクロウラー',0,'down','def');g1=up('ゴブリン突撃部隊',1);gameState.players[0].mz=[th,insD];gameState.players[1].mz=[g1];turnOf(1);baselineA();
atk(1,g1,insD);
ok('A5: a face-down monster is not known to be an Insect — it can be attacked',!!C(g1).attacked,JSON.stringify({att:C(g1).attacked,ins:z(insD)}));
fresh();
th=up('棘の妖精',0);ins=up('アシッドクロウラー',1);g1=up('ゴブリン突撃部隊',0);gameState.players[0].mz=[th,g1];gameState.players[1].mz=[ins];turnOf(0);baselineA();
atk(0,g1,ins);
ok('A6: the controller may attack the opponent\'s Insect (only the opponent is restricted)',z(ins)==='grave');
audit('A6');

/* ===== B: D・バインド — while its controller controls a 「D」 monster, the opponent's Level 4+ monsters cannot attack or change position ===== */
function bSetup(dName,dFace){
  fresh();
  const tr=mk('D・バインド',0,'down');tr.setTurn=3;const d=mk(dName,0,dFace||'up','def');
  const lv4=up('ゴブリン突撃部隊',1),lv1=up('ワイト',1);
  gameState.players[0].mz=[d];gameState.players[0].sz=[tr];gameState.players[1].mz=[lv4,lv1];baselineA();
  duelActivateFromZone(0,'sz',0);drive();
  return {tr,d,lv4,lv1};
}
function toOppMain(){gameState.phase='end';requestProcessorV27(PROCESSOR_V27.TURN,{});drive();for(const to of ['standby','main1']){if(gameState.phase!=='main1'){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}}}
function toOppBattle(){toOppMain();requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();}
let B=bSetup('D・リモコン');
ok('B: D・バインド is activated and stays face-up',z(B.tr)==='sz'&&C(B.tr).face==='up',JSON.stringify({tr:z(B.tr),face:C(B.tr)&&C(B.tr).face}));
toOppBattle();
ok('B: the opponent\'s turn, battle phase',gameState.activePlayer===1&&gameState.phase==='battle',JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase}));
ok('B: the Level 4 monster cannot declare an attack; the Level 1 monster can',!canDeclareAttackV48(C(B.lv4))&&canDeclareAttackV48(C(B.lv1)),JSON.stringify({l4:canDeclareAttackV48(C(B.lv4)),l1:canDeclareAttackV48(C(B.lv1))}));
atk(1,B.lv4,B.d);
ok('B: the attack of the Level 4 monster is not made',!C(B.lv4).attacked&&z(B.d)==='mz',JSON.stringify({att:C(B.lv4).attacked}));
atk(1,B.lv1,B.d);
ok('B: the Level 1 monster attacks the 「D」 monster',!!C(B.lv1).attacked,JSON.stringify({att:C(B.lv1).attacked}));
ok('B: the Level 4 monster cannot change its battle position (cannotChangePosition)',API.cannotChangePosition(findCardByUid(B.lv4.uid))===true&&API.cannotChangePosition(findCardByUid(B.lv1.uid))===false);
audit('B');
/* position: main phase of the opponent */
B=bSetup('D・リモコン');toOppMain();
ok('B2: in the opponent\'s Main Phase the Level 4 monster cannot be switched manually; the Level 1 monster can',gameState.activePlayer===1&&!canManualPositionChange(C(B.lv4))&&canManualPositionChange(C(B.lv1)),JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase,l4:canManualPositionChange(C(B.lv4)),l1:canManualPositionChange(C(B.lv1))}));
audit('B2');
/* controls */
B=bSetup('ワイト');toOppBattle();
ok('B3 control: no 「D」 monster — the Level 4 monster can declare an attack',canDeclareAttackV48(C(B.lv4)));
B=bSetup('D・リモコン','down');toOppBattle();
ok('B4: a face-down monster is not a 「D」 monster — no lock',canDeclareAttackV48(C(B.lv4)));
B=bSetup('D－HERO ダイハードガイ');toOppBattle();
ok('B5: 「D－HERO」 is not 「D」 — no lock',canDeclareAttackV48(C(B.lv4)));
B=bSetup('D・リモコン');
gameState.players[0].mz=[];gameState.players[0].grave.push(B.d);ensureAllCardUids(gameState);toOppBattle();
ok('B6: the 「D」 monster has left the field — the lock ends',canDeclareAttackV48(C(B.lv4)));

/* ===== C: 絶対服従魔人 — cannot attack unless it is the only card on its field and its controller has no hand; negates the effect of an effect monster it destroys ===== */
function cSetup(extraMz,extraSz,hand,foe){
  fresh();
  const ab=up('絶対服従魔人',0);gameState.players[0].mz=[ab].concat(extraMz||[]);gameState.players[0].sz=extraSz||[];gameState.players[0].hand=hand||[];
  gameState.players[1].mz=foe||[];turnOf(0);baselineA();return ab;
}
let ab=cSetup();
atk(0,ab,'direct');
ok('C: the only card on the field and no hand — it attacks directly (3500)',lp(1)===4500,JSON.stringify({lp1:lp(1)}));
audit('C');
ab=cSetup([],[],[mk('ワイト',0)]);
atk(0,ab,'direct');
ok('C2: one card in hand — it cannot attack',lp(1)===8000&&!C(ab).attacked&&!canDeclareAttackV48(C(ab)),JSON.stringify({lp1:lp(1)}));
ab=cSetup([up('ワイト',0)]);
atk(0,ab,'direct');
ok('C3: another monster on the field — it cannot attack',lp(1)===8000&&!canDeclareAttackV48(C(ab)),JSON.stringify({lp1:lp(1)}));
{const tr=mk('強欲な瓶',0,'down');ab=cSetup([],[tr]);
atk(0,ab,'direct');
ok('C4: a Set Trap makes another card on the field — it cannot attack',lp(1)===8000&&!canDeclareAttackV48(C(ab)),JSON.stringify({lp1:lp(1)}));}
{const tm=up('キラー・トマト',1);ab=cSetup([],[],[],[tm]);
atk(0,ab,tm);
ok('C5: it destroys キラー・トマト by battle; the effect of the destroyed effect monster is negated (nothing is Special Summoned)',z(tm)==='grave'&&gameState.players[1].mz.length===0,JSON.stringify({tm:z(tm),mz1:gameState.players[1].mz.map(c=>cardName(c))}));
audit('C5');}
{fresh();const tm=up('キラー・トマト',1),bw=up('青眼の白龍',0);gameState.players[0].mz=[bw];gameState.players[1].mz=[tm];turnOf(0);baselineA();
atk(0,bw,tm);
ok('C6 control: another attacker destroys キラー・トマト and its effect is not negated (a monster is Special Summoned)',z(tm)==='grave'&&gameState.players[1].mz.length===1,JSON.stringify({tm:z(tm),mz1:gameState.players[1].mz.map(c=>cardName(c))}));}

/* ===== F: ワーム・イーロキン — cannot be Special Summoned; once per turn, flip-down a face-up 「ワーム」 Reptile monster on the field ===== */
fresh();
let el=mk('ワーム・イーロキン',0);gameState.players[0].hand=[el];baselineA();
const spF=API.specialSummon(0,'hand',0,'atk','リミッター解除');
ok('F: it cannot be Special Summoned',!spF&&z(el)==='hand',JSON.stringify({spF,z:z(el)}));
fresh();
el=up('ワーム・イーロキン',0);let wo=up('ワーム・オペラ',0),wt=up('ワイト',0),wh=up('ワーム・ホープ',1,'atk'),wd=up('ワームドレイク',1);
gameState.players[0].mz=[el,wo,wt];gameState.players[1].mz=[wh,wd];baselineA();
duelActivateFromZone(0,'mz',idx(el));
const qF=pc();const cF=(qF&&qF.candidates)||[];const uidsF=cF.map(x=>x.uid!=null?x.uid:(x.card&&x.card.uid));
ok('F: the choice lists the face-up 「ワーム」 Reptiles on both sides (incl. itself), not ワイト or ワームドレイク',cF.length>0&&[wo,wh,el].every(c=>uidsF.includes(c.uid))&&![wt,wd].some(c=>uidsF.includes(c.uid)),JSON.stringify({n:cF.length,uids:uidsF}));
PREFER=[wo.uid];drive();
ok('F: ワーム・オペラ is changed to face-down Defense Position',z(wo)==='mz'&&C(wo).face==='down'&&C(wo).pos==='def',JSON.stringify({z:z(wo),face:C(wo)&&C(wo).face,pos:C(wo)&&C(wo).pos}));
ok('F: the others are unchanged',C(wh).face==='up'&&C(wt).face==='up'&&C(el).face==='up');
duelActivateFromZone(0,'mz',idx(el));
ok('F: once per turn — a second activation opens no choice',!pc()&&C(wh).face==='up',JSON.stringify({pc:!!pc()}));
drive();
audit('F');
fresh();
el=up('ワーム・イーロキン',0);wh=mk('ワーム・ホープ',1,'up','atk');gameState.players[0].mz=[el];gameState.players[1].mz=[wh];baselineA();
duelActivateFromZone(0,'mz',idx(el));PREFER=[wh.uid];drive();
ok('F2: it can target the opponent\'s 「ワーム」 (face-up Attack Position → face-down Defense)',C(wh).face==='down'&&C(wh).pos==='def',JSON.stringify({face:C(wh)&&C(wh).face,pos:C(wh)&&C(wh).pos}));
audit('F2');
fresh();
el=up('ワーム・イーロキン',0);wt=up('ワイト',0);gameState.players[0].mz=[el,wt];gameState.phase='battle';baselineA();
const offF=(()=>{try{duelActivateFromZone(0,'mz',idx(el));}catch(e){}return !!pc();})();
ok('F3: outside the Main Phase it cannot be activated',!offF);

/* ===== G: ニトロ・シンクロン — sent to the GY as the material of a 「ニトロ」 Synchro Monster: draw 1 ===== */
fresh();
let nt=up('ニトロ・シンクロン',0),m5=up('3万年の白亀',0),nw=mk('ニトロ・ウォリアー',0);
gameState.players[0].mz=[nt,m5];gameState.players[0].ex=[nw];baselineA();
const cbG=exCombos(0,dbOf(nw)).combos.find(c=>c.materials.length===2);
if(cbG)beginExSummonV2(0,0,cbG.materials,'synchro','atk');drive();
ok('G: ニトロ・ウォリアー is Synchro Summoned with ニトロ・シンクロン; it draws 1 card',!!cbG&&z(nw)==='mz'&&z(nt)==='grave'&&gameState.players[0].hand.length===1&&gameState.players[0].deck.length===5,JSON.stringify({cb:!!cbG,nw:z(nw),nt:z(nt),hand:gameState.players[0].hand.length,deck:gameState.players[0].deck.length}));
audit('G');
fresh();
nt=up('ニトロ・シンクロン',0);m5=up('ゴブリン突撃部隊',0);let gg=mk('大地の騎士ガイアナイト',0);
gameState.players[0].mz=[nt,m5];gameState.players[0].ex=[gg];baselineA();
const cbG2=exCombos(0,dbOf(gg)).combos.find(c=>c.materials.length===2);
if(cbG2)beginExSummonV2(0,0,cbG2.materials,'synchro','atk');drive();
ok('G2: a Synchro Monster that is not 「ニトロ」 — no draw',!!cbG2&&z(gg)==='mz'&&z(nt)==='grave'&&gameState.players[0].hand.length===0,JSON.stringify({cb:!!cbG2,gg:z(gg),nt:z(nt),hand:gameState.players[0].hand.length}));
fresh();
nt=up('ニトロ・シンクロン',0);gameState.players[0].mz=[nt];gameState.players[0].hand=[mk('ブラック・ホール',0)];baselineA();
duelActivateFromHand(0);drive();
ok('G3: destroyed by an effect (not a Synchro Material) — no draw',z(nt)==='grave'&&gameState.players[0].hand.length===0,JSON.stringify({nt:z(nt),hand:gameState.players[0].hand.length}));
`);
