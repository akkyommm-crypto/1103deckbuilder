/* S03-U285: ENGINE_GAP re-check 7 (2011 texts) — イビー, A・O・J サイクロン・クリエイター, 絶対魔法禁止区域, マーダーサーカス.
   (魔轟神ルリー and 魔轟神獣キャシー are parked: the hand-size rule discard never drains its onDiscardAnyS03 trigger.)
   Real DUEL paths (hand / field ignition, chain windows, POINT responses, the hand-size rule, position changes, Flip Summon, battle), costs and targets chosen at activation,
   resolution choices answered; Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function lp(p){return gameState.players[p].lp;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(!q)return false;
  SEEN.push({title:q.title||'',kind:q.kind,min:q.min,max:q.max,n:(q.candidates||[]).length,keys:(q.candidates||[]).map(x=>x.uid!=null?x.uid:x.key)});
  const find=u=>q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const j=find(u);if(j>=0&&ks.indexOf(q.candidates[j].key)<0)ks.push(q.candidates[j].key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>find(u)<0);answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){j=find(PREFER[k]);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<800;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function up(n,p,pos){return mk(n,p,'up',pos);}
function down(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
const trigNamed=n=>TRIG.filter(t=>t.names.indexOf(n)>=0);
const ptitle=s=>SEEN.filter(x=>x.title.indexOf(s)>=0);
const IB='イビー',CY='A・O・J サイクロン・クリエイター',ZZ='絶対魔法禁止区域',MC='マーダーサーカス';
const nGrave=cs=>cs.every(c=>z(c)==='grave');

/* a field with the Creator (itself a Tuner), a set Trap of its own, and a face-up opponent monster */
function cyField(hand){
  fresh();
  const cy=up(CY,0),t0=setT('強制脱出装置',0),m1=up('ジェネティック・ワーウルフ',1);
  gameState.players[0].mz=[cy];gameState.players[0].sz=[t0];gameState.players[1].mz=[m1];gameState.players[0].hand=hand;base();
  return {cy,t0,m1};}

/* ===== I: イビー — discarded from the hand by an effect of an opponent card: 1000 damage to the opponent ===== */
/* I1: the opponent's 手札抹殺 */
fresh();gameState.activePlayer=1;gameState.turn=6;
let ib=mk(IB,0),w0=mk('ワイト',0),ha=mk('手札抹殺',1);
gameState.players[0].hand=[ib,w0];gameState.players[1].hand=[ha];base();
cast(1,'手札抹殺');
ok('I1: the opponent 手札抹殺 discards イビー from the hand',z(ib)==='grave'&&C(ib).graveInfo&&C(ib).graveInfo.from==='hand',z(ib));
ok('I1: 1000 damage to the opponent of イビー (the player of 手札抹殺), none to its owner',lp(1)===7000&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
ok('I1: forced trigger (offered without an option to decline)',trigNamed(IB).length===1&&trigNamed(IB)[0].forced===true,JSON.stringify(TRIG));
audit('I1');
/* I2: negative — its own controller's 手札抹殺 */
fresh();
ib=mk(IB,0);w0=mk('ワイト',0);ha=mk('手札抹殺',0);
gameState.players[0].hand=[ha,ib,w0];base();
cast(0,'手札抹殺');
ok('I2: negative — discarded by an effect of its own controller: no damage to anyone',z(ib)==='grave'&&lp(0)===8000&&lp(1)===8000&&trigNamed(IB).length===0,JSON.stringify({lp0:lp(0),lp1:lp(1),TRIG}));
audit('I2');
/* I3: negative — discarded as a cost (the Creator) */
let S=cyField([mk(IB,0)]);ib=gameState.players[0].hand[0];
ign(S.cy,[ib.uid]);
ok('I3: negative — discarded as a cost: no damage',z(ib)==='grave'&&lp(1)===8000&&lp(0)===8000&&trigNamed(IB).length===0,JSON.stringify({ib:z(ib),lp1:lp(1),TRIG}));
audit('I3');
/* I4: negative — the hand-size rule */
fresh();
ib=mk(IB,0);gameState.players[0].hand=[ib,...Array.from({length:6},()=>mk('ワイト',0))];base();
toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});PREFER=[ib.uid];drive();PREFER=[];
ok('I4: negative — discarded by the hand-size rule at the end of the turn: no damage',z(ib)==='grave'&&lp(1)===8000&&lp(0)===8000&&trigNamed(IB).length===0,JSON.stringify({ib:z(ib),lp0:lp(0),lp1:lp(1),TRIG}));
/* I5: negative — destroyed on the field (not a discard from the hand) */
fresh();gameState.activePlayer=1;gameState.turn=6;
ib=up(IB,0);let tb=mk('サンダー・ボルト',1);gameState.players[0].mz=[ib];gameState.players[1].hand=[tb];base();
cast(1,'サンダー・ボルト');
ok('I5: negative — destroyed on the field: no damage',z(ib)==='grave'&&lp(1)===8000&&trigNamed(IB).length===0,JSON.stringify({ib:z(ib),lp1:lp(1)}));

/* ===== C: A・O・J サイクロン・クリエイター — discard 1; return as many Spell / Trap cards as there are Tuners on the field to their owners' hands ===== */
/* C1: 2 Tuners (itself + a face-up opponent Tuner), 4 Spell / Trap cards: 2 chosen */
S=cyField([mk('ワイト',0)]);let jt=up('ジャンク・シンクロン',1),s0=setT('サイクロン',0),t1=setT('強制脱出装置',1),f1=fieldSp(1);
gameState.players[1].mz=[S.m1,jt];gameState.players[0].sz=[S.t0,s0];gameState.players[1].sz=[t1];base();
let hd=gameState.players[0].hand[0];
ign(S.cy,[S.t0.uid,f1.uid]);
let cq=ptitle('サイクロン・クリエイター：持ち主');
ok('C1: the cost is 1 discarded card',z(hd)==='grave'&&C(hd).discardInfo==null,JSON.stringify({hd:z(hd)}));
ok('C1: 2 Tuners on the field -> choose exactly 2 among the 4 Spell / Trap cards (the monsters are not offered)',cq.length===1&&cq[0].min===2&&cq[0].max===2&&cq[0].n===4,JSON.stringify(cq));
ok('C1: the chosen Trap returns to its owner (player 1 hand index) and the chosen Field Spell to its owner',z(S.t0)==='hand'&&pl(S.t0)===0&&z(f1)==='hand'&&pl(f1)===1,JSON.stringify({t0:z(S.t0),p0:pl(S.t0),f1:z(f1),p1:pl(f1)}));
ok('C1: the unchosen Spell / Trap cards stay',z(s0)==='sz'&&z(t1)==='sz',JSON.stringify({s0:z(s0),t1:z(t1)}));
audit('C1');
/* C2: only 1 Tuner counts (the opponent Tuner is face-down) -> 1 card */
S=cyField([mk('ワイト',0)]);const jd=down('ジャンク・シンクロン',1);s0=setT('サイクロン',0);t1=setT('強制脱出装置',1);
gameState.players[1].mz=[S.m1,jd];gameState.players[0].sz=[S.t0,s0];gameState.players[1].sz=[t1];base();
ign(S.cy,[t1.uid]);
cq=ptitle('サイクロン・クリエイター：持ち主');
ok('C2: a face-down Tuner is not counted: the Creator alone -> choose exactly 1 among 3',cq.length===1&&cq[0].min===1&&cq[0].max===1&&cq[0].n===3,JSON.stringify(cq));
ok('C2: exactly the chosen card returned to its owner hand',z(t1)==='hand'&&pl(t1)===1&&z(S.t0)==='sz'&&z(s0)==='sz',JSON.stringify({t1:z(t1),t0:z(S.t0),s0:z(s0)}));
audit('C2');
/* C3: more Tuners than Spell / Trap cards: all of them return, no choice */
S=cyField([mk('ワイト',0)]);jt=up('ジャンク・シンクロン',1);gameState.players[1].mz=[S.m1,jt];base();
ign(S.cy,[]);
ok('C3: 2 Tuners, 1 Spell / Trap card: it returns to the hand; no choice was needed',z(S.t0)==='hand'&&ptitle('サイクロン・クリエイター：持ち主').length===0,JSON.stringify({t0:z(S.t0)}));
audit('C3');
/* C4: once per turn */
const t2=setT('強制脱出装置',0);gameState.players[0].sz=[t2];gameState.players[0].hand.push(mk('ワイト',0));
const hn=gameState.players[0].hand.length;
ign(S.cy,[]);
ok('C4: negative — a second activation in the same turn is impossible (nothing discarded, nothing returned)',z(t2)==='sz'&&gameState.players[0].hand.length===hn&&!pc(),JSON.stringify({t2:z(t2),hand:gameState.players[0].hand.length,hn}));
/* C5: negative — no Spell / Trap card on the field */
S=cyField([mk('ワイト',0)]);gameState.players[0].sz=[];base();hd=gameState.players[0].hand[0];
ign(S.cy,[]);
ok('C5: negative — no Spell / Trap card on the field: not activatable (the hand card stays)',z(hd)==='hand'&&!pc(),JSON.stringify({hd:z(hd)}));
/* C6: negative — no card in the hand to discard */
S=cyField([]);
ign(S.cy,[]);
ok('C6: negative — no hand card: not activatable (the Trap stays)',z(S.t0)==='sz'&&!pc());
/* C7: negative — the opponent turn */
S=cyField([mk('ワイト',0)]);gameState.activePlayer=1;gameState.turn=6;hd=gameState.players[0].hand[0];
ign(S.cy,[]);
ok('C7: negative — an ignition effect cannot be activated on the opponent turn',z(hd)==='hand'&&z(S.t0)==='sz'&&!pc(),JSON.stringify({hd:z(hd),t0:z(S.t0)}));
/* C8: negative — Battle Phase */
S=cyField([mk('ワイト',0)]);gameState.phase='battle';hd=gameState.players[0].hand[0];
ign(S.cy,[]);
ok('C8: negative — not in the Battle Phase',z(hd)==='hand'&&z(S.t0)==='sz'&&!pc());
/* C9: negative — face-down Creator */
fresh();
const cyd=down(CY,0);let t0=setT('強制脱出装置',0);hd=mk('ワイト',0);gameState.players[0].mz=[cyd];gameState.players[0].sz=[t0];gameState.players[0].hand=[hd];base();
ign(cyd,[]);
ok('C9: negative — face-down: cannot be activated',z(hd)==='hand'&&z(t0)==='sz'&&!pc());

/* ===== Z: 絶対魔法禁止区域 — face-up non-Effect Monsters are unaffected by Spell card effects ===== */
function zField(zFace){
  fresh();
  const bw=up('青眼の白龍',0),ef=up('キラー・トマト',0),nb=up('アックス・レイダー',1),nd=down('ジェネティック・ワーウルフ',1),ef2=up('ならず者傭兵部隊',1);
  gameState.players[0].mz=[bw,ef];gameState.players[1].mz=[nb,nd,ef2];
  return {bw,ef,nb,nd,ef2};}
/* Z1: activated from the hand; then ブラック・ホール (destroys every monster) */
let Q=zField();let zz=mk(ZZ,0),bh=mk('ブラック・ホール',0);gameState.players[0].hand=[zz,bh];base();
cast(0,ZZ);
ok('Z1: activated from the hand — face-up in the Spell & Trap Zone',z(zz)==='sz'&&C(zz).face==='up',JSON.stringify({zz:z(zz),face:C(zz)&&C(zz).face}));
cast(0,'ブラック・ホール');
ok('Z1: ブラック・ホール — the face-up non-Effect Monsters of both players are unaffected and stay',z(Q.bw)==='mz'&&z(Q.nb)==='mz',JSON.stringify({bw:z(Q.bw),nb:z(Q.nb)}));
ok('Z1: the face-up Effect Monsters of both players are destroyed',nGrave([Q.ef,Q.ef2]),JSON.stringify({ef:z(Q.ef),ef2:z(Q.ef2)}));
ok('Z1: the face-down non-Effect Monster is not "face-up" and is destroyed',z(Q.nd)==='grave',z(Q.nd));
audit('Z1');
/* Z2: a Trap effect still applies to a non-Effect Monster */
Q=zField();gameState.phase='battle';zz=up(ZZ,0);const tr=setT('強制脱出装置',1);gameState.players[0].sz=[zz];gameState.players[1].sz=[tr];base();
const usedZ2=attackRespond(0,Q.bw,Q.nb,1,pl2=>pl2.kind==='attackDeclare','sz',0);
PREFER=[Q.bw.uid];drive();PREFER=[];
ok('Z2: a Trap effect (強制脱出装置) still returns the non-Effect Monster to the hand',usedZ2&&z(Q.bw)==='hand',JSON.stringify({used:usedZ2,bw:z(Q.bw)}));
audit('Z2');
/* Z3: once it leaves the field the monsters are affected again */
Q=zField();zz=up(ZZ,0);let cy3=mk('サイクロン',0);bh=mk('ブラック・ホール',0);gameState.players[0].sz=[zz];gameState.players[0].hand=[cy3,bh];base();
cast(0,'サイクロン',[zz.uid]);
ok('Z3: the Spell is destroyed by サイクロン',z(zz)==='grave',z(zz));
cast(0,'ブラック・ホール');
ok('Z3: without it ブラック・ホール destroys the non-Effect Monsters too',nGrave([Q.bw,Q.nb,Q.ef,Q.ef2,Q.nd]),JSON.stringify([Q.bw,Q.nb,Q.ef,Q.ef2,Q.nd].map(z)));
audit('Z3');
/* Z4: an Equip Spell has no effect on a non-Effect Monster; it does on an Effect Monster */
Q=zField();zz=up(ZZ,0);let eq=mk('団結の力',0);gameState.players[0].sz=[zz];gameState.players[0].hand=[eq];base();
const atkBw=curATK(C(Q.bw));
cast(0,'団結の力',[Q.bw.uid]);
ok('Z4: 団結の力 equipped to a non-Effect Monster gives no ATK (unaffected by a Spell effect)',curATK(C(Q.bw))===atkBw,JSON.stringify({before:atkBw,after:curATK(C(Q.bw))}));
Q=zField();zz=up(ZZ,0);eq=mk('団結の力',0);gameState.players[0].sz=[zz];gameState.players[0].hand=[eq];base();
const atkEf=curATK(C(Q.ef));
cast(0,'団結の力',[Q.ef.uid]);
ok('Z4: the same Spell on an Effect Monster works (ATK +800 per face-up monster)',curATK(C(Q.ef))>atkEf,JSON.stringify({before:atkEf,after:curATK(C(Q.ef))}));
audit('Z4');
/* Z5: negative — Set (face-down) it does not apply */
Q=zField();zz=setT(ZZ,0);bh=mk('ブラック・ホール',0);gameState.players[0].sz=[zz];gameState.players[0].hand=[bh];base();
cast(0,'ブラック・ホール');
ok('Z5: negative — face-down the Spell gives no protection: every monster is destroyed',nGrave([Q.bw,Q.nb,Q.ef,Q.ef2,Q.nd]),JSON.stringify([Q.bw,Q.nb,Q.ef,Q.ef2,Q.nd].map(z)));
audit('Z5');

/* Z6: a Token is not an Effect Monster (literal reading of the text): unaffected as well */
Q=zField();zz=up(ZZ,0);bh=mk('ブラック・ホール',0);gameState.players[0].sz=[zz];gameState.players[0].hand=[bh];
act({type:'TOKEN_CREATE',player:0,name:'テスト・トークン',atk:0,def:0,lv:1,ra:'機械',at:'地',pos:'def',n:1});
const tk=gameState.players[0].mz[gameState.players[0].mz.length-1];base();
cast(0,'ブラック・ホール');
ok('Z6: a Token (no monster Effect) on the field is unaffected by ブラック・ホール while the Effect Monsters are destroyed',z(tk)==='mz'&&C(tk).token&&nGrave([Q.ef,Q.ef2]),JSON.stringify({tk:z(tk),ef:z(Q.ef)}));
audit('Z6');

/* ===== M: マーダーサーカス — Defense -> face-up Attack: return 1 opponent monster to its owner's hand (target chosen at activation) ===== */
/* M1: manual change of a face-up Defense Position monster */
fresh();
let mc=up(MC,0,'def');let t=up('ワイト',1);let d1=down('ジェネティック・ワーウルフ',1);
gameState.players[0].mz=[mc];gameState.players[1].mz=[t,d1];base();
PREFER=[t.uid];zAct('TOGGLE_POS',0,'mz',0);drive();PREFER=[];
let mq=ptitle('マーダーサーカス');
ok('M1: changed to Attack Position by its controller: the target is chosen at activation among the 2 opponent monsters (the face-down one too)',C(mc).pos==='atk'&&mq.length===1&&mq[0].min===1&&mq[0].max===1&&mq[0].n===2,JSON.stringify({pos:C(mc).pos,mq}));
ok('M1: the chosen opponent monster is returned to its owner hand',z(t)==='hand'&&pl(t)===1&&z(d1)==='mz',JSON.stringify({t:z(t),d1:z(d1)}));
ok('M1: forced trigger',trigNamed(MC).length===1&&trigNamed(MC)[0].forced===true,JSON.stringify(TRIG));
audit('M1');
/* M2: Flip Summon from face-down Defense */
fresh();
mc=setT(MC,0);mc.pos='def';t=up('ワイト',1);d1=down('ジェネティック・ワーウルフ',1);
gameState.players[0].mz=[mc];gameState.players[1].mz=[t,d1];base();
PREFER=[d1.uid];doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
ok('M2: Flip Summoned (face-down Defense -> face-up Attack): it triggers; a face-down opponent monster may be the target',C(mc).face==='up'&&C(mc).pos==='atk'&&z(d1)==='hand'&&pl(d1)===1&&z(t)==='mz',JSON.stringify({face:C(mc).face,pos:C(mc).pos,d1:z(d1),t:z(t)}));
audit('M2');
/* M3: by an effect of the opponent (エネミーコントローラー changes its position) */
fresh();gameState.activePlayer=1;gameState.turn=6;
mc=up(MC,0,'def');t=up('ワイト',1);const ec=mk('エネミーコントローラー',1);
gameState.players[0].mz=[mc];gameState.players[1].mz=[t];gameState.players[1].hand=[ec];base();
cast(1,'エネミーコントローラー',['yes',mc.uid,t.uid]);
ok('M3: its position was changed to Attack by an effect: it triggers and returns the opponent monster',C(mc).pos==='atk'&&z(mc)==='mz'&&z(t)==='hand'&&pl(t)===1,JSON.stringify({pos:C(mc).pos,t:z(t),TRIG}));
audit('M3');
/* M4: negative — Attack -> Defense */
fresh();
mc=up(MC,0);t=up('ワイト',1);gameState.players[0].mz=[mc];gameState.players[1].mz=[t];base();
zAct('TOGGLE_POS',0,'mz',0);drive();
ok('M4: negative — Attack -> Defense does not trigger',C(mc).pos==='def'&&z(t)==='mz'&&trigNamed(MC).length===0,JSON.stringify({pos:C(mc).pos,t:z(t),TRIG}));
/* M5: negative — no monster on the opponent field */
fresh();
mc=up(MC,0,'def');gameState.players[0].mz=[mc];base();
zAct('TOGGLE_POS',0,'mz',0);drive();
ok('M5: negative — the opponent controls no monster: it does not activate',C(mc).pos==='atk'&&trigNamed(MC).length===0&&ptitle('マーダーサーカス').length===0,JSON.stringify({pos:C(mc).pos,TRIG}));
/* M6: negative — turned face-down by 月の書 */
fresh();
mc=up(MC,0,'def');t=up('ワイト',1);const mb=mk('月の書',0);gameState.players[0].mz=[mc];gameState.players[0].hand=[mb];gameState.players[1].mz=[t];base();
cast(0,'月の書',[mc.uid]);
ok('M6: negative — turned face-down by 月の書 (not face-up Attack): no trigger',C(mc).face==='down'&&z(t)==='mz'&&trigNamed(MC).length===0,JSON.stringify({face:C(mc).face,t:z(t)}));
`);
