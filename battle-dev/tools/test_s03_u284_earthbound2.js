/* S03-U284: 「地縛神」 second batch (2011 texts) — 地縛神 Aslla piscu, Ccarayhua, Uru, Wiraqocha Rasca.
   Real DUEL paths (effect / battle destruction, chain responses, Main Phase ignition, Tribute Summon trigger), Replay-audited.
   Not covered here (parked, no script): 地縛神 Chacu Challhua, 地縛神 Cusillu. */
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
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;CH.length=0;WPICK=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],WPICK=[];const CH=[];
function step(){const q=pc();if(!q)return false;
  CH.push({title:q.title||'',min:q.min,max:q.max,n:(q.candidates||[]).length});
  const isW=(q.title||'').indexOf('Wiraqocha')>=0&&(q.title||'').indexOf('デッキに戻す')>=0, SRC=()=>isW?WPICK:PREFER;
  const find=u=>q.candidates.find(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of SRC()){const c=find(u);if(c&&ks.indexOf(c.key)<0)ks.push(c.key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    if(isW)WPICK=WPICK.filter(u=>!find(u));else PREFER=PREFER.filter(u=>!find(u));answerChoiceV49(ks);return true;}
  let j=-1,k=-1;const S=SRC();for(k=0;k<S.length;k++){const u=S[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)S.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
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
function down(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
const AS='地縛神 Aslla piscu',CC='地縛神 Ccarayhua',UR='地縛神 Uru',WR='地縛神 Wiraqocha Rasca';
const grave=cs=>cs.every(c=>z(c)==='grave');

/* ===== A: 地縛神 Aslla piscu — leaves the field face-up by any way but its own effect: destroy every face-up opponent monster, 800 each ===== */
/* A1: destroyed by the opponent's effect (地割れ) */
fresh();gameState.activePlayer=1;gameState.turn=6;
fieldSp(0);let as1=up(AS,0),w1=up('ワイト',1),w2=up('ジェネティック・ワーウルフ',1),w3=down('ワイト',1),fz=mk('地割れ',1);
gameState.players[0].mz=[as1];gameState.players[1].mz=[w1,w2,w3];gameState.players[1].hand=[fz];baselineA();
cast(1,'地割れ');
ok('A1: 地割れ destroys Aslla piscu',z(as1)==='grave'&&C(as1).graveInfo&&C(as1).graveInfo.byDestroy===true,z(as1));
ok('A1: its trigger destroys the two face-up opponent monsters, the face-down one stays',grave([w1,w2])&&z(w3)==='mz',JSON.stringify({w1:z(w1),w2:z(w2),w3:z(w3)}));
ok('A1: 2 destroyed x 800 = 1600 damage to the opponent of its controller',lp(1)===6400&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('A1');
/* A2: destroyed by battle */
fresh();gameState.phase='battle';
fieldSp(0);as1=up(AS,0);let bl=up('青眼の白龍',1);w1=up('ワイト',1);w3=down('ワイト',1);
gameState.players[0].mz=[as1];gameState.players[1].mz=[bl,w1,w3];baselineA();
hitT(0,as1,bl);
ok('A2: Aslla piscu (2500, +200 with 山 = 2700) loses the battle to 青眼の白龍 (3000 + 200 = 3200): 500 damage',z(as1)==='grave'&&lp(0)===7500,JSON.stringify({as:z(as1),lp0:lp(0)}));
ok('A2: leaving by battle triggers it — both face-up opponent monsters destroyed (the winner too), the face-down one stays',grave([bl,w1])&&z(w3)==='mz',JSON.stringify({bl:z(bl),w1:z(w1),w3:z(w3)}));
ok('A2: 1600 damage',lp(1)===6400,String(lp(1)));
audit('A2');
/* A3: returned to the hand by an opponent\'s Trap (it leaves the field face-up; the trigger works from the hand) */
fresh();gameState.phase='battle';
fieldSp(0);as1=up(AS,0);w1=up('ワイト',1);let tr=setT('強制脱出装置',1),w4=up('ジェネティック・ワーウルフ',1);
gameState.players[0].mz=[as1];gameState.players[1].mz=[w1,w4];gameState.players[1].sz=[tr];baselineA();
const usedA3=attackRespond(0,as1,'direct',1,pl2=>pl2.kind==='attackDeclare','sz',0);
PREFER=[as1.uid];drive();PREFER=[];
ok('A3: 強制脱出装置 returned it to the hand',usedA3&&z(as1)==='hand',JSON.stringify({used:usedA3,as:z(as1)}));
ok('A3: bounce counts (any way but its own effect) — the opponent monsters are destroyed, 1600 damage',grave([w1,w4])&&lp(1)===6400,JSON.stringify({w1:z(w1),w4:z(w4),lp1:lp(1)}));
audit('A3');
/* A4: negative — its own no-Field-Spell destruction */
fresh();
let fs4=fieldSp(0);as1=up(AS,0);w1=up('ワイト',1);let cy=mk('サイクロン',0);
gameState.players[0].mz=[as1];gameState.players[1].mz=[w1];gameState.players[0].hand=[cy];baselineA();
cast(0,'サイクロン',[fs4.uid]);
ok('A4: the Field Spell is destroyed and Aslla piscu destroys itself',z(fs4)==='grave'&&z(as1)==='grave',JSON.stringify({fs:z(fs4),as:z(as1)}));
ok('A4: negative — its own destruction does not trigger it (the opponent monster stays, no damage)',z(w1)==='mz'&&lp(1)===8000,JSON.stringify({w1:z(w1),lp1:lp(1)}));
audit('A4');
/* A5: negative — face-down when it is destroyed */
fresh();gameState.activePlayer=1;gameState.turn=6;
fieldSp(0);let as5=down(AS,0);w1=up('ワイト',1);let tb=mk('サンダー・ボルト',1);
gameState.players[0].mz=[as5];gameState.players[1].mz=[w1];gameState.players[1].hand=[tb];baselineA();
cast(1,'サンダー・ボルト');
ok('A5: negative — a face-down Aslla piscu destroyed by 1 effect does not trigger (opponent monster stays, no damage)',z(as5)==='grave'&&z(w1)==='mz'&&lp(1)===8000,JSON.stringify({as:z(as5),w1:z(w1),lp1:lp(1)}));
/* A6: no face-up opponent monster — nothing is destroyed, no damage */
fresh();gameState.activePlayer=1;gameState.turn=6;
fieldSp(0);as1=up(AS,0);w3=down('ワイト',1);fz=mk('地割れ',1);
gameState.players[0].mz=[as1];gameState.players[1].mz=[w3];gameState.players[1].hand=[fz];baselineA();
cast(1,'地割れ');
ok('A6: with only a face-down opponent monster the trigger destroys nothing and deals 0',z(as1)==='grave'&&z(w3)==='mz'&&lp(1)===8000,JSON.stringify({as:z(as1),w3:z(w3),lp1:lp(1)}));

/* ===== C: 地縛神 Ccarayhua — destroyed by an effect other than its own: destroy every card on the field ===== */
fresh();gameState.activePlayer=1;gameState.turn=6;
let fs6=fieldSp(0);let cc=up(CC,0),m0=up('ワイト',0),t0=setT('強制脱出装置',0),m1=up('ワイト',1),d1=down('ワイト',1),t1=setT('強制脱出装置',1);tb=mk('サンダー・ボルト',1);
gameState.players[0].mz=[cc,m0];gameState.players[0].sz=[t0];gameState.players[1].mz=[m1,d1];gameState.players[1].sz=[t1];gameState.players[1].hand=[tb];baselineA();
cast(1,'サンダー・ボルト');
ok('C1: サンダー・ボルト destroys Ccarayhua',z(cc)==='grave'&&C(cc).graveInfo&&C(cc).graveInfo.byDestroy===true,z(cc));
ok('C1: its trigger destroys every card on the field — both monster zones, both Spell & Trap zones, the Field Zone (face-down too)',grave([m0,t0,fs6,m1,d1,t1]),JSON.stringify([m0,t0,fs6,m1,d1,t1].map(z)));
audit('C1');
/* C2: negative — destroyed by battle */
fresh();gameState.phase='battle';
fs6=fieldSp(0);cc=up(CC,0);bl=up('青眼の白龍',1);t1=setT('強制脱出装置',1);
gameState.players[0].mz=[cc];gameState.players[1].mz=[bl];gameState.players[1].sz=[t1];baselineA();
hitT(0,cc,bl);
ok('C2: Ccarayhua (2800) loses the battle to 青眼の白龍 (3000 + 200 with 山): 400 damage',z(cc)==='grave'&&lp(0)===7600,JSON.stringify({cc:z(cc),lp0:lp(0)}));
ok('C2: negative — destroyed by battle does not trigger it (the other cards stay)',z(bl)==='mz'&&z(t1)==='sz'&&z(fs6)==='field',JSON.stringify({bl:z(bl),t1:z(t1),fs:z(fs6)}));
audit('C2');
/* C3: negative — its own no-Field-Spell destruction */
fresh();
fs6=fieldSp(0);cc=up(CC,0);m1=up('ワイト',1);t1=setT('強制脱出装置',1);cy=mk('サイクロン',0);
gameState.players[0].mz=[cc];gameState.players[1].mz=[m1];gameState.players[1].sz=[t1];gameState.players[0].hand=[cy];baselineA();
cast(0,'サイクロン',[fs6.uid]);
ok('C3: Cyclone destroys the Field Spell and Ccarayhua destroys itself',z(fs6)==='grave'&&z(cc)==='grave',JSON.stringify({fs:z(fs6),cc:z(cc)}));
ok('C3: negative — its own destruction does not trigger it (the opponent cards stay)',z(m1)==='mz'&&z(t1)==='sz',JSON.stringify({m1:z(m1),t1:z(t1)}));
audit('C3');

/* ===== U: 地縛神 Uru — once per turn, release another own monster: take control of 1 face-up opponent monster until the End Phase ===== */
fresh();
fieldSp(0);let ur=up(UR,0),r1=up('ワイト',0),r2=up('ワイト',0),f1=up('ジェネティック・ワーウルフ',1),f2=down('ワイト',1),f3=up('ワイト',1);
gameState.players[0].mz=[ur,r1,r2];gameState.players[1].mz=[f1,f2,f3];baselineA();
ign(ur,[r1.uid,f1.uid]);
ok('U1: the released monster is sent to the Graveyard (release, not destroyed)',z(r1)==='grave'&&C(r1).graveInfo&&C(r1).graveInfo.releasedS03===true&&z(r2)==='mz',JSON.stringify({r1:z(r1),r2:z(r2)}));
ok('U1: the chosen face-up opponent monster is now under the control of the player',z(f1)==='mz'&&pl(f1)===0&&pl(f3)===1&&pl(f2)===1,JSON.stringify({f1:pl(f1),f2:pl(f2),f3:pl(f3)}));
ign(ur,[r2.uid,f3.uid]);
ok('U1: once per turn — a second activation does nothing',z(r2)==='mz'&&pl(f3)===1&&!pc(),JSON.stringify({r2:z(r2),f3:pl(f3)}));
toPhase('end');
ok('U1: at the End Phase the control returns to the opponent',z(f1)==='mz'&&pl(f1)===1,JSON.stringify({f1:z(f1),p:pl(f1)}));
audit('U1');
/* U2: the cost needs another monster */
fresh();
fieldSp(0);ur=up(UR,0);f1=up('ジェネティック・ワーウルフ',1);
gameState.players[0].mz=[ur];gameState.players[1].mz=[f1];baselineA();
ign(ur,[f1.uid]);
ok('U2: negative — alone it cannot release anything: no activation, the opponent keeps the monster',pl(f1)===1&&z(ur)==='mz'&&!pc());
/* U3: needs a face-up opponent monster */
fresh();
fieldSp(0);ur=up(UR,0);r1=up('ワイト',0);f2=down('ワイト',1);
gameState.players[0].mz=[ur,r1];gameState.players[1].mz=[f2];baselineA();
ign(ur,[r1.uid,f2.uid]);
ok('U3: negative — only a face-down opponent monster: not activatable, nothing released',z(r1)==='mz'&&pl(f2)===1&&C(f2).face==='down',JSON.stringify({r1:z(r1),f2:pl(f2)}));
/* U4: own turn only (an ignition effect) */
fresh();
fieldSp(1);ur=up(UR,1);r1=up('ワイト',1);f1=up('ジェネティック・ワーウルフ',0);
gameState.players[1].mz=[ur,r1];gameState.players[0].mz=[f1];baselineA();
ign(ur,[r1.uid,f1.uid]);
ok('U4: negative — on the opponent turn it cannot be activated',z(r1)==='mz'&&pl(f1)===0&&!pc(),JSON.stringify({r1:z(r1),f1:pl(f1)}));
/* U5: not in the Battle Phase */
fresh();gameState.phase='battle';
fieldSp(0);ur=up(UR,0);r1=up('ワイト',0);f1=up('ジェネティック・ワーウルフ',1);
gameState.players[0].mz=[ur,r1];gameState.players[1].mz=[f1];baselineA();
ign(ur,[r1.uid,f1.uid]);
ok('U5: negative — not in the Battle Phase',z(r1)==='mz'&&pl(f1)===1&&!pc());

/* ===== W: 地縛神 Wiraqocha Rasca — Normal Summon: return up to min(3, opponent hand) other own cards to the Deck, the opponent discards that many at random, +1000 ATK each ===== */
function wiraSetup(handN,withField){
  fresh();
  const fsW=withField===false?fieldSp(1):fieldSp(0);
  const wi=mk(WR,0),t1=up('ワイト',0),t2=up('ワイト',0),wo=up('ジェネティック・ワーウルフ',0),st=setT('強制脱出装置',0),wo2=up('ワイト',0);
  gameState.players[0].hand=[wi];gameState.players[0].mz=withField===false?[t1,t2]:[t1,t2,wo,wo2];gameState.players[0].sz=withField===false?[]:[st];
  gameState.players[1].hand=Array.from({length:handN},()=>mk('ワイト',1));baselineA();
  return {wi,t1,t2,wo,wo2,st,fsW};}
function wiraSummon(S,pick){PREFER=['2体分リリースして召喚',S.t1.uid,S.t2.uid];WPICK=(pick||[]).slice();CH.length=0;doNormalSummon(0,'atk');drive();PREFER=[];WPICK=[];}
const wch=()=>CH.filter(x=>x.title.indexOf('Wiraqocha')>=0&&x.title.indexOf('デッキに戻す')>=0);
/* W1 */
let S=wiraSetup(4);const deck0=gameState.players[0].deck.length;
wiraSummon(S,[S.wo.uid,S.st.uid]);
ok('W1: Tribute Summoned with 2 Tributes',z(S.wi)==='mz'&&grave([S.t1,S.t2]),JSON.stringify({wi:z(S.wi)}));
ok('W1: the target choice is made at activation: 1 to 3 (opponent hand 4 -> max 3) of the other 3 cards on the field (not itself)',wch().length===1&&wch()[0].min===1&&wch()[0].max===3&&wch()[0].n===4,JSON.stringify(wch()));
ok('W1: the 2 chosen cards are returned to the Deck (Deck +2)',z(S.wo)==='deck'&&z(S.st)==='deck'&&gameState.players[0].deck.length===deck0+2,JSON.stringify({wo:z(S.wo),st:z(S.st),deck:gameState.players[0].deck.length}));
ok('W1: the unchosen cards stay (ワイト, the Field Spell)',z(S.wo2)==='mz'&&z(S.fsW)==='field');
ok('W1: the opponent discarded 2 cards at random (hand 4 -> 2), 2 more in the Graveyard',gameState.players[1].hand.length===2&&gameState.players[1].grave.length===2,JSON.stringify({hand:gameState.players[1].hand.length,gr:gameState.players[1].grave.length}));
ok('W1: ATK +1000 x 2 (printed 100, +200 from 山 = 300 before) = 2300 while face-up',curATK(C(S.wi))===2300,String(curATK(C(S.wi))));
audit('W1');
/* W2: opponent hand 1 -> at most 1 target */
S=wiraSetup(1);
wiraSummon(S,[S.wo.uid,S.st.uid,S.wo2.uid]);
ok('W2: with 1 card in the opponent hand the choice allows at most 1',wch().length===1&&wch()[0].max===1&&wch()[0].min===1,JSON.stringify(wch()));
ok('W2: 1 returned, 1 discarded (hand 0), ATK 1300',(z(S.wo)==='deck'?1:0)+(z(S.st)==='deck'?1:0)+(z(S.wo2)==='deck'?1:0)===1&&gameState.players[1].hand.length===0&&curATK(C(S.wi))===1300,JSON.stringify({wo:z(S.wo),st:z(S.st),wo2:z(S.wo2),hand:gameState.players[1].hand.length,atk:curATK(C(S.wi))}));
audit('W2');
/* W3: 3 targets */
S=wiraSetup(5);
wiraSummon(S,[S.wo.uid,S.st.uid,S.wo2.uid]);
ok('W3: 3 returned (opponent hand 5 -> 2), ATK 300 + 3000 = 3300',[S.wo,S.st,S.wo2].every(c=>z(c)==='deck')&&gameState.players[1].hand.length===2&&curATK(C(S.wi))===3300,JSON.stringify({hand:gameState.players[1].hand.length,atk:curATK(C(S.wi))}));
audit('W3');
/* W4: negative — the opponent has no hand: it does not activate */
S=wiraSetup(0);
wiraSummon(S,[S.wo.uid]);
ok('W4: negative — empty opponent hand: no trigger (nothing returned, ATK unchanged 300)',wch().length===0&&z(S.wo)==='mz'&&z(S.st)==='sz'&&curATK(C(S.wi))===300,JSON.stringify({ch:wch().length,wo:z(S.wo),atk:curATK(C(S.wi))}));
/* W5: negative — no other card of its own on the field */
S=wiraSetup(3,false);
wiraSummon(S,[]);
ok('W5: negative — no other card on its controller field (the Field Spell is the opponent\'s): no trigger, ATK unchanged 300, hand 3',wch().length===0&&z(S.wi)==='mz'&&curATK(C(S.wi))===300&&gameState.players[1].hand.length===3,JSON.stringify({ch:wch().length,atk:z(S.wi)==='mz'&&curATK(C(S.wi)),hand:gameState.players[1].hand.length}));
/* W6: negative — a Special Summon is not a (Normal) Summon success */
S=wiraSetup(3);
CH.length=0;
const spW=API.specialSummon(0,'hand',0,'atk','test');drive();
ok('W6: negative — Special Summoned: no trigger (nothing returned, opponent hand 3)',z(S.wi)==='mz'&&wch().length===0&&z(S.wo)==='mz'&&gameState.players[1].hand.length===3,JSON.stringify({sp:spW,wi:z(S.wi),ch:wch().length}));
`);
