/* S03-U261: NOT_STARTED → TESTED — 罰ゲーム!, 一族の掟, ヴェノム・スネーク, ヴェノム・ボア, 旋風剣, 古代の機械掌 (2011 texts).
   Real DUEL paths (Trap / Equip activation, option and declaration choices, ignition effects, attacks, Damage Step end triggers, Standby / Draw Phases),
   Replay-audited. Not covered (reported): ヒーロー・ヘイロー — engine/1ZU does not carry the attacker, so it stays NOT_STARTED. */
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
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;LAST=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
let PREFER=[],TRIG=[],LAST=[];
function step(){const q=pc();if(q){LAST=q.candidates.map(x=>x.uid!=null?x.uid:(x.key!=null?x.key:x.label));let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);drive();}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function atk(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});drive();}
function drawP(p){requestProcessorV27(PROCESSOR_V27.DRAW,{player:p});drive();}
function cycle(){phase('standby');phase('main1');phase('end');turn();}
function toOppBattle(){phase('end');turn();phase('standby');phase('main1');phase('battle');}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function zoneAct(p,zn,i,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(p,zn,i);drive();PREFER=[];}
function legal(name,p,zone,i){const P=gameState.players[p],c=zone==='hand'?P.hand[i]:null,d=c?dbOf(c):null;const o=(c&&(d.k==='s'||d.k==='t'))?{cardOverride:c,logicalZone:d.sub==='フィールド'?'field':'sz',prospectiveIndex:(P.sz||[]).length}:{};return strictScriptLegalityV2(name,p,zone,i,o);}
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function eff(p){return gameState.players[p].effectFlags||{};}
function tmp(p){return gameState.players[p].temporaryFlags||{};}
function scenario(label,fn){try{fn();}catch(e){ok(label+': scenario ran without an exception',false,String(e&&e.stack||e).slice(0,300));}}
const HAND4=p=>[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('強欲な壺',p)];

/* ===== A: 罰ゲーム! — only while the opponent has exactly 4 cards in hand; choose: no draw next Draw Phase / no Spell-Trap this turn ===== */
scenario('A1',()=>{
  fresh();
  let pg=setT('罰ゲーム!',0);gameState.players[0].sz=[pg];gameState.players[1].hand=HAND4(1);base();
  ok('A1: legal with 4 cards in the opponent\'s hand',legal('罰ゲーム!',0,'sz',0).ok,JSON.stringify(legal('罰ゲーム!',0,'sz',0)));
  zoneAct(0,'sz',0,['nodraw']);
  ok('A1: resolved — the Trap is in the GY and the opponent\'s next turn (6) is stamped with the draw skip',z(pg)==='grave'&&Number(eff(1).skipDrawTurnS03)===6&&Number(tmp(1).noSpellTrapActivationS03||0)!==5,JSON.stringify({z:z(pg),e:eff(1),t:tmp(1),LAST}));
  ok('A1: the option prompt offered both choices',LAST.indexOf('nodraw')>=0&&LAST.indexOf('nost')>=0,JSON.stringify(LAST));
  ok('A1: this turn the opponent may still activate Spells (the other option was not chosen)',legal('強欲な壺',1,'hand',3).ok||gameState.phase!=='main1',JSON.stringify(legal('強欲な壺',1,'hand',3)));
  const h1=gameState.players[1].hand.length,d1=gameState.players[1].deck.length;
  phase('end');turn();drawP(1);
  ok('A1: the opponent\'s Draw Phase — no card drawn (hand and deck unchanged)',gameState.turn===6&&gameState.drawnThisTurn===true&&gameState.players[1].hand.length===h1&&gameState.players[1].deck.length===d1,JSON.stringify({t:gameState.turn,h:gameState.players[1].hand.length,d:gameState.players[1].deck.length,ph:gameState.phase}));
  cycle();cycle();drawP(1);
  ok('A1: the following opponent turn draws normally',gameState.turn===8&&gameState.players[1].hand.length===h1+1&&gameState.players[1].deck.length===d1-1,JSON.stringify({t:gameState.turn,ph:gameState.phase,h:gameState.players[1].hand.length,d:gameState.players[1].deck.length,h0:gameState.players[0].hand.length,e:eff(1)}));
  audit('A1');
});
scenario('A2',()=>{
  fresh();
  let pg=setT('罰ゲーム!',0),mf=setT('聖なるバリア －ミラーフォース－',1),bt=up('青眼の白龍',0);
  gameState.players[0].sz=[pg];gameState.players[0].mz=[bt];gameState.players[1].sz=[mf];gameState.players[1].hand=HAND4(1);base();
  zoneAct(0,'sz',0,['nost']);
  ok('A2: resolved — the opponent is stamped with the Spell / Trap lock for this turn (5), no draw skip',z(pg)==='grave'&&Number(tmp(1).noSpellTrapActivationS03)===5&&eff(1).skipDrawTurnS03==null,JSON.stringify({z:z(pg),t:tmp(1),e:eff(1)}));
  const lg=legal('聖なるバリア －ミラーフォース－',1,'sz',0);
  ok('A2: the opponent\'s Set Trap is not legal; the controller\'s own are unaffected',!lg.ok&&/魔法・罠/.test(lg.reason||''),JSON.stringify(lg));
  phase('battle');const hpA=lp(1);
  attackRespond(0,bt,'direct',1,pl2=>pl2.kind==='attackDeclare','sz',0);
  ok('A2: against the attack the opponent\'s ミラーフォース cannot be activated — it stays Set, 3000 damage',z(mf)==='sz'&&z(bt)==='mz'&&lp(1)===hpA-3000,JSON.stringify({mf:z(mf),bt:z(bt),lp1:lp(1)}));
  audit('A2');
  phase('end');turn();phase('standby');phase('main1');
  ok('A2: next turn the lock is gone (the opponent\'s Spell is legal in its own Main Phase)',legal('強欲な壺',1,'hand',3).ok,JSON.stringify(legal('強欲な壺',1,'hand',3)));
});
scenario('A3',()=>{
  /* negatives: 3 and 5 cards in the opponent's hand */
  for(const n of [3,5]){
    fresh();
    let pg=setT('罰ゲーム!',0);gameState.players[0].sz=[pg];gameState.players[1].hand=Array.from({length:n},()=>mk('ワイト',1));base();
    const lg=legal('罰ゲーム!',0,'sz',0);
    zoneAct(0,'sz',0,[]);
    ok('A3: the opponent has '+n+' cards in hand — cannot be activated, stays Set',!lg.ok&&z(pg)==='sz'&&eff(1).skipDrawTurnS03==null&&tmp(1).noSpellTrapActivationS03==null,JSON.stringify({lg,z:z(pg)}));
  }
  /* it counts the OPPONENT's hand: 4 cards in its own controller's hand do not count */
  fresh();
  let pg2=setT('罰ゲーム!',0);gameState.players[0].sz=[pg2];gameState.players[0].hand=HAND4(0);gameState.players[1].hand=[mk('ワイト',1)];base();
  ok('A3: 4 cards in its own controller\'s hand do not enable it',!legal('罰ゲーム!',0,'sz',0).ok);
});
scenario('A4',()=>{
  /* activated in the opponent's own turn (it attacks): the opponent's NEXT Draw Phase is two turns on (turn 8) */
  fresh();
  let pg=setT('罰ゲーム!',0),ob=up('青眼の白龍',1),tg=up('ワイト',0);
  gameState.players[0].sz=[pg];gameState.players[0].mz=[tg];gameState.players[1].mz=[ob];gameState.players[1].hand=HAND4(1);base();
  toOppBattle();
  PREFER=['nodraw'];const done=attackRespond(1,ob,tg,0,pl2=>pl2.kind==='attackDeclare','sz',0);PREFER=[];
  ok('A4: activated during the opponent\'s attack — the draw skip is stamped on turn 8 (not 6)',done&&z(pg)==='grave'&&gameState.turn===6&&Number(eff(1).skipDrawTurnS03)===8,JSON.stringify({done,z:z(pg),t:gameState.turn,e:eff(1)}));
  phase('end');turn();cycle();drawP(1);
  ok('A4: turn 8 — the opponent does not draw',gameState.turn===8&&gameState.players[1].hand.length===4&&gameState.players[1].deck.length===6,JSON.stringify({t:gameState.turn,ph:gameState.phase,h:gameState.players[1].hand.length,d:gameState.players[1].deck.length,h0:gameState.players[0].hand.length,e:eff(1)}));
  audit('A4');
});

/* ===== B: 一族の掟 — declare a Type; monsters of that Type cannot declare an attack; the controller's Standby Phase: release a monster or destroy it ===== */
scenario('B1',()=>{
  fresh();
  let cl=setT('一族の掟',0),bw=up('青眼の白龍',0),wt=up('ワイト',0),ob=up('青眼の白龍',1),ow=up('ジェネティック・ワーウルフ',1);
  gameState.players[0].sz=[cl];gameState.players[0].mz=[bw,wt];gameState.players[1].mz=[ob,ow];base();
  ok('B1: before the declaration all four can attack',canDeclareAttackV48(C(bw))&&canDeclareAttackV48(C(wt)));
  zoneAct(0,'sz',0,['ドラゴン']);
  ok('B1: the Type is declared (journaled on the card) and the Trap stays on the field',z(cl)==='sz'&&C(cl).face==='up'&&API.persistentDeclaration(C(cl),'race')==='ドラゴン',JSON.stringify({z:z(cl),d:API.persistentDeclaration(C(cl),'race'),LAST:LAST.length}));
  ok('B1: Dragon monsters on both sides cannot attack; other Types can',!canDeclareAttackV48(C(bw))&&!canDeclareAttackV48(C(ob))&&canDeclareAttackV48(C(wt))&&canDeclareAttackV48(C(ow)));
  phase('battle');
  atk(0,bw,'direct');
  ok('B1: the Dragon\'s attack is refused (no damage)',lp(1)===8000,String(lp(1)));
  const hp=lp(1);
  atk(0,wt,ob);
  ok('B1: ワイト attacks 青眼 normally (and is destroyed)',z(wt)==='grave'||lp(0)<8000,JSON.stringify({wt:z(wt),lp0:lp(0)}));
  audit('B1');
  /* the opponent's turn: its Dragon cannot attack, its other monster can */
  phase('end');turn();phase('standby');phase('main1');phase('battle');
  ok('B1: on the opponent\'s turn 青眼 cannot attack, ワーウルフ can',!canDeclareAttackV48(C(ob))&&canDeclareAttackV48(C(ow)));
  /* its controller's Standby Phase: release a monster */
  phase('end');turn();
  PREFER=['rel'+bw.uid];phase('standby');PREFER=[];
  ok('B1: the controller\'s Standby Phase — a monster is released (青眼 in the GY), the Trap stays',gameState.activePlayer===0&&z(bw)==='grave'&&z(cl)==='sz',JSON.stringify({ap:gameState.activePlayer,bw:z(bw),cl:z(cl),LAST}));
  ok('B1: the option list had a release entry per monster and the destroy entry',LAST.indexOf('destroy')>=0&&LAST.some(k=>/^rel/.test(String(k))),JSON.stringify(LAST));
  audit('B1b');
});
scenario('B2',()=>{
  /* destroy instead of releasing; the lock ends */
  fresh();
  let cl=setT('一族の掟',0),bw=up('青眼の白龍',1),m0=up('ワイト',0);
  gameState.players[0].sz=[cl];gameState.players[0].mz=[m0];gameState.players[1].mz=[bw];base();
  zoneAct(0,'sz',0,['ドラゴン']);
  ok('B2: the opponent\'s Dragon is locked',!canDeclareAttackV48(C(bw)));
  phase('end');turn();phase('standby');
  ok('B2: the opponent\'s Standby Phase — no prompt, the Trap stays (own Standby Phase only)',!pc()&&z(cl)==='sz'&&z(m0)==='mz');
  phase('main1');phase('end');turn();
  PREFER=['destroy'];phase('standby');PREFER=[];
  ok('B2: own Standby Phase — destroyed without releasing: GY, ワイト kept, the Dragon can attack again',z(cl)==='grave'&&z(m0)==='mz'&&canDeclareAttackV48(C(bw)),JSON.stringify({cl:z(cl),m0:z(m0)}));
  audit('B2');
});
scenario('B3',()=>{
  /* no monster to release → destroyed at once */
  fresh();
  let cl=setT('一族の掟',0);gameState.players[0].sz=[cl];base();
  zoneAct(0,'sz',0,['機械']);
  ok('B3: declared 機械 with no monsters',z(cl)==='sz'&&API.persistentDeclaration(C(cl),'race')==='機械');
  phase('end');turn();phase('standby');phase('main1');phase('end');turn();phase('standby');
  ok('B3: own Standby Phase with no monster — destroyed, no prompt',gameState.activePlayer===0&&z(cl)==='grave'&&!pc(),JSON.stringify({cl:z(cl),pc:!!pc()}));
  audit('B3');
});
scenario('B4',()=>{
  /* a face-down monster has no Type; another declared Type leaves Dragons alone */
  fresh();
  let cl=setT('一族の掟',0),bw=up('青眼の白龍',0),wt=up('ワイト',0);
  gameState.players[0].sz=[cl];gameState.players[0].mz=[bw,wt];base();
  zoneAct(0,'sz',0,['アンデット']);
  ok('B4: declared アンデット — ワイト cannot attack, the Dragon can',!canDeclareAttackV48(C(wt))&&canDeclareAttackV48(C(bw)));
  const faceDown=mk('ワイト',1,'down','def');gameState.players[1].mz=[faceDown];
  ok('B4: a face-down monster (no Type) is not caught by the declaration',cannotAttackNow(C(faceDown))===false);
});

/* ===== C: ヴェノム・スネーク / ヴェノム・ボア — Venom Counters on an opponent's monster, once per turn; cannot attack the turn it is used ===== */
for(const [nm,n] of [['ヴェノム・スネーク',1],['ヴェノム・ボア',2]]) scenario('C-'+nm,()=>{
  fresh();
  let vs=up(nm,0),ow=up('ワイト',1),fd=mk('ブラック・マジシャン',1,'down','def');
  gameState.players[0].mz=[vs];gameState.players[1].mz=[ow,fd];base();
  ok(nm+': legal in the Main Phase',legal(nm,0,'mz',0).ok,JSON.stringify(legal(nm,0,'mz',0)));
  zoneAct(0,'mz',0,[ow.uid]);
  ok(nm+': '+n+' Venom Counter(s) on the chosen monster, none elsewhere',API.countCounter(findCardByUid(ow.uid),'ヴェノム')===n&&API.countCounter(findCardByUid(fd.uid),'ヴェノム')===0,JSON.stringify({ow:API.countCounter(findCardByUid(ow.uid),'ヴェノム'),fd:API.countCounter(findCardByUid(fd.uid),'ヴェノム'),LAST}));
  ok(nm+': it cannot attack this turn (zone-local cannotAttackTurn stamp)',C(vs).cannotAttackTurn===5&&!canDeclareAttackV48(C(vs)),JSON.stringify({t:C(vs).cannotAttackTurn}));
  ok(nm+': once per turn — not legal again',!legal(nm,0,'mz',0).ok,JSON.stringify(legal(nm,0,'mz',0)));
  audit(nm+' a');
  phase('end');turn();cycle();phase('standby');phase('main1');
  ok(nm+': two turns later it can attack again and use the effect (a face-down opponent monster may take the counters)',gameState.turn===7&&canDeclareAttackV48(C(vs))&&legal(nm,0,'mz',0).ok,JSON.stringify({t:gameState.turn,l:legal(nm,0,'mz',0)}));
  zoneAct(0,'mz',0,[fd.uid]);
  ok(nm+': second use — counters on the face-down monster, total on the field correct',API.countCounter(findCardByUid(fd.uid),'ヴェノム')===n&&API.countCounter(findCardByUid(ow.uid),'ヴェノム')===n,JSON.stringify({fd:API.countCounter(findCardByUid(fd.uid),'ヴェノム'),ow:API.countCounter(findCardByUid(ow.uid),'ヴェノム')}));
  audit(nm+' b');
});
scenario('C2',()=>{
  /* negatives: no opponent monster; it already attacked this turn */
  fresh();
  let vs=up('ヴェノム・スネーク',0);gameState.players[0].mz=[vs];base();
  ok('C2: no opponent monster — not legal',!legal('ヴェノム・スネーク',0,'mz',0).ok,JSON.stringify(legal('ヴェノム・スネーク',0,'mz',0)));
  fresh();
  vs=up('ヴェノム・ボア',0);let ow=up('ワイト',1,'def');gameState.players[0].mz=[vs];gameState.players[1].mz=[ow];base();
  phase('battle');atk(0,vs,ow);phase('main2');
  ok('C2: after attacking this turn the effect cannot be used',!legal('ヴェノム・ボア',0,'mz',0).ok&&API.countCounter(findCardByUid(ow.uid),'ヴェノム')===0,JSON.stringify(legal('ヴェノム・ボア',0,'mz',0)));
  fresh();
  vs=mk('ヴェノム・スネーク',0,'down','def');ow=up('ワイト',1);gameState.players[0].mz=[vs];gameState.players[1].mz=[ow];base();
  ok('C2: face-down — not legal',!legal('ヴェノム・スネーク',0,'mz',0).ok);
});

/* ===== D: 旋風剣 — 「D－HERO」 only; the Damage Step end after the equipped monster attacked: destroy 1 Spell / Trap card on the field ===== */
scenario('D1',()=>{
  fresh();
  let ws=mk('旋風剣',0),dg=up('D－HERO ダンクガイ',0),ow=up('ワイト',1,'def'),t1=setT('強欲な壺',1),t2=setT('死者蘇生',1);
  gameState.players[0].hand=[ws];gameState.players[0].mz=[dg];gameState.players[1].mz=[ow];gameState.players[1].sz=[t1,t2];base();
  cast(0,'旋風剣',[dg.uid]);
  ok('D1: equipped to D－HERO ダンクガイ',z(ws)==='sz'&&C(ws).equipTo&&C(ws).equipTo.uid===dg.uid,JSON.stringify({z:z(ws),eq:C(ws)&&C(ws).equipTo}));
  phase('battle');
  PREFER=[t2.uid];atk(0,dg,ow);PREFER=[];
  ok('D1: after the attack the chosen Set card (死者蘇生) is destroyed; the other and the Equip Spell stay',z(t2)==='grave'&&z(t1)==='sz'&&z(ws)==='sz'&&LAST.indexOf(ws.uid)>=0,JSON.stringify({t1:z(t1),t2:z(t2),ws:z(ws),LAST,TRIG}));
  ok('D1: ワイト (1200 vs 300 in Defense Position... DEF 200) was destroyed by the battle',z(ow)==='grave',JSON.stringify({ow:z(ow)}));
  audit('D1');
});
scenario('D2',()=>{
  /* a direct attack also counts; the Equip Spell itself is a legal choice; own and opponent's cards are both candidates */
  fresh();
  let ws=mk('旋風剣',0),dg=up('D－HERO ダンクガイ',0),t1=setT('強欲な壺',1),own=setT('死者蘇生',0);
  gameState.players[0].hand=[ws];gameState.players[0].mz=[dg];gameState.players[1].sz=[t1];base();
  cast(0,'旋風剣',[dg.uid]);
  gameState.players[0].sz.push(own);baselineA();
  phase('battle');
  PREFER=[ws.uid];atk(0,dg,'direct');PREFER=[];
  ok('D2: a direct attack (1200 damage) also triggers it; selecting the Equip Spell itself destroys it (the monster is no longer equipped)',lp(1)===8000-1200&&z(ws)==='grave'&&z(t1)==='sz'&&z(own)==='sz'&&LAST.indexOf(t1.uid)>=0&&LAST.indexOf(own.uid)>=0,JSON.stringify({lp1:lp(1),ws:z(ws),LAST}));
  audit('D2');
});
scenario('D3',()=>{
  /* negatives: attacked by the opponent (the equipped monster did not attack); a non-D-HERO host; the opponent's Spell/Trap untouched */
  fresh();
  let ws=mk('旋風剣',0),dg=up('D－HERO ダンクガイ',0),ob=up('ワイト',1),t1=setT('強欲な壺',1);
  gameState.players[0].hand=[ws];gameState.players[0].mz=[dg];gameState.players[1].mz=[ob];gameState.players[1].sz=[t1];base();
  cast(0,'旋風剣',[dg.uid]);
  toOppBattle();
  atk(1,ob,dg);
  ok('D3: the equipped monster was attacked, it did not attack — nothing is destroyed',z(t1)==='sz'&&z(ws)==='sz'&&!pc(),JSON.stringify({t1:z(t1),ws:z(ws)}));
  fresh();
  ws=mk('旋風剣',0);let hero=up('E・HERO スパークマン',0),wt=up('ワイト',0);gameState.players[0].hand=[ws];gameState.players[0].mz=[hero,wt];base();
  cast(0,'旋風剣',[hero.uid,wt.uid]);
  ok('D3: E・HERO スパークマン / ワイト are not 「D－HERO」 — it cannot be equipped, stays in the hand',z(ws)==='hand'&&C(ws).equipTo==null,JSON.stringify({z:z(ws)}));
});

/* ===== E: 古代の機械掌 — 「アンティーク・ギア」 only; destroys the monster that battled the equipped monster at the end of the Damage Step ===== */
scenario('E1',()=>{
  fresh();
  let hd=mk('古代の機械掌',0),ag=up('古代の機械兵士',0),ob=up('青眼の白龍',1,'def');
  gameState.players[0].hand=[hd];gameState.players[0].mz=[ag];gameState.players[1].mz=[ob];base();
  cast(0,'古代の機械掌',[ag.uid]);
  ok('E1: equipped to 古代の機械兵士',z(hd)==='sz'&&C(hd).equipTo&&C(hd).equipTo.uid===ag.uid,JSON.stringify({z:z(hd)}));
  phase('battle');atk(0,ag,ob);
  ok('E1: the equipped monster attacked 青眼 in Defense Position (DEF 2500 > ATK 1300): 青眼 is destroyed at the end of the Damage Step; 古代の機械兵士 survives',z(ob)==='grave'&&z(ag)==='mz'&&z(hd)==='sz'&&lp(0)===8000-1200,JSON.stringify({ob:z(ob),ag:z(ag),lp0:lp(0),TRIG}));
  audit('E1');
});
scenario('E2',()=>{
  /* the opponent attacks the equipped monster in Defense Position: the attacker is destroyed too */
  fresh();
  let hd=mk('古代の機械掌',0),ag=up('古代の機械究極巨人',0,'def'),ob=up('青眼の白龍',1);
  gameState.players[0].hand=[hd];gameState.players[0].mz=[ag];gameState.players[1].mz=[ob];base();
  cast(0,'古代の機械掌',[ag.uid]);
  toOppBattle();atk(1,ob,ag);
  ok('E2: 青眼 (3000) attacks the equipped 古代の機械究極巨人 (DEF 3400): 青眼 is destroyed at the end of the Damage Step, 究極巨人 stays',z(ob)==='grave'&&z(ag)==='mz'&&lp(1)===8000-400,JSON.stringify({ob:z(ob),ag:z(ag),lp1:lp(1),TRIG}));
  audit('E2');
});
scenario('E3',()=>{
  /* negatives: a non-アンティーク・ギア host; no battle; a D－HERO */
  fresh();
  let hd=mk('古代の機械掌',0),wt=up('ワイト',0),dg=up('D－HERO ダンクガイ',0);
  gameState.players[0].hand=[hd];gameState.players[0].mz=[wt,dg];base();
  cast(0,'古代の機械掌',[wt.uid,dg.uid]);
  ok('E3: ワイト / D－HERO are not 「アンティーク・ギア」 — it cannot be equipped, stays in the hand',z(hd)==='hand',JSON.stringify({z:z(hd)}));
  fresh();
  hd=mk('古代の機械掌',0);let ag=up('古代の機械兵士',0),ob=up('青眼の白龍',1);gameState.players[0].hand=[hd];gameState.players[0].mz=[ag];gameState.players[1].mz=[ob];base();
  cast(0,'古代の機械掌',[ag.uid]);phase('battle');phase('end');
  ok('E3: no battle — nothing is destroyed',z(ob)==='mz'&&z(hd)==='sz',JSON.stringify({ob:z(ob)}));
  /* a direct attack: no monster battled */
  fresh();
  hd=mk('古代の機械掌',0);ag=up('古代の機械兵士',0);gameState.players[0].hand=[hd];gameState.players[0].mz=[ag];base();
  cast(0,'古代の機械掌',[ag.uid]);phase('battle');atk(0,ag,'direct');
  ok('E3: a direct attack — no monster battled, nothing to destroy, 1300 damage',lp(1)===8000-1300&&z(hd)==='sz'&&!pc());
  audit('E3');
});
`);
