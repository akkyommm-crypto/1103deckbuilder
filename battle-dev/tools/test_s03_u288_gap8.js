/* S03-U288: ENGINE_GAP re-check 8 (2011 texts) — 森のざわめき, 機械複製術, 大波小波, ドラゴンを呼ぶ笛, バグ・ロード, 錬金生物 ホムンクルス.
   Real DUEL paths (hand / field activation, chain windows, POINT responses, turn changes), targets and declarations chosen at activation, resolution choices answered;
   Replay-audited. The harness answers the Special Summon position question with Attack; one scenario answers it itself. */
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
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];CH.length=0;EVQ.length=0;
  globalThis.__MANUAL_SS_POSITION_S03=false;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];const CH=[],EVQ=[];
const __rq=requestChoiceV49;requestChoiceV49=function(spec){CH.push({title:spec&&spec.title||'',player:spec&&spec.player,min:spec&&spec.min,max:spec&&spec.max,n:((spec&&spec.candidates)||[]).length});return __rq.apply(this,arguments);};
const __qd=queueDeferredEventV2;queueDeferredEventV2=function(n,e){EVQ.push(n);return __qd.apply(this,arguments);};
function step(){const q=pc();if(!q)return false;
  SEEN.push({title:q.title||'',kind:q.kind,player:q.player,min:q.min,max:q.max,n:(q.candidates||[]).length,keys:(q.candidates||[]).map(x=>x.uid!=null?x.uid:x.key)});
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
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function down(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legal(p,name){const P=gameState.players[p],i=P.hand.findIndex(c=>cardName(c)===name),c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
/* the activator casts from the hand; the other player answers in the chain window with a Set card at (rzone,ri); then everything resolves */
function castRespond(p,name,prefer,rp,rzone,ri,rprefer){
  const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);
  const w=toWindow();PREFER=(rprefer||[]).slice();
  if(w) duelActivateResponseV2(rp,rzone,ri);
  drive();PREFER=[];return w;}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  drive();return done;}
const ptitle=s=>SEEN.filter(x=>x.title.indexOf(s)>=0);
const allIn=(cs,zn)=>cs.every(c=>z(c)===zn);
const RU='森のざわめき',RP='機械複製術',TW='大波小波',WH='ドラゴンを呼ぶ笛',BL='バグ・ロード',HO='錬金生物 ホムンクルス',LORD='ロード・オブ・ドラゴン－ドラゴンの支配者－';

/* ===== R: 森のざわめき — set 1 face-up opponent monster face-down Defense; then, optionally, return a Field Spell on the field to its owner's hand ===== */
/* R1: the target is chosen at activation among the face-up opponent monsters; the opponent Field Spell is returned to its owner's hand */
fresh();
let ru=mk(RU,0),ft=up('ワイト',1),fd=down('ジェネティック・ワーウルフ',1),fm=up('ネオアクア・マドール',0),f0=fieldSp(0),f1=fieldSp(1);
gameState.players[0].hand=[ru];gameState.players[0].mz=[fm];gameState.players[1].mz=[ft,fd];base();
ok('R1: legal to activate with a face-up opponent monster',legal(0,RU).ok===true,JSON.stringify(legal(0,RU)));
cast(0,RU,[ft.uid,f1.uid]);
let tq=ptitle('森のざわめき：裏側守備表示');
ok('R1: the target is chosen at activation among the face-up opponent monsters only (1 of 2; own monster and face-down one not offered)',tq.length===1&&tq[0].min===1&&tq[0].max===1&&tq[0].n===1,JSON.stringify(tq));
ok('R1: the target is now face-down Defense Position',z(ft)==='mz'&&C(ft).face==='down'&&C(ft).pos==='def',JSON.stringify({z:z(ft),face:C(ft)&&C(ft).face,pos:C(ft)&&C(ft).pos}));
ok('R1: the optional return was asked of the activator (either side Field Spells: 2 candidates, 0 to 1)',CH.filter(c=>/手札に戻すフィールド魔法/.test(c.title)&&c.player===0&&c.min===0&&c.max===1&&c.n===2).length===1,JSON.stringify(CH));
ok('R1: the opponent Field Spell is returned to its owner (the opponent) hand; mine stays',z(f1)==='hand'&&pl(f1)===1&&z(f0)==='field',JSON.stringify({f1:z(f1),p1:pl(f1),f0:z(f0)}));
ok('R1: the Spell went to the Graveyard',z(ru)==='grave',z(ru));
ok('R1: a face-down change is not a Flip (no onFlip event)',EVQ.indexOf('onFlip')<0,JSON.stringify(EVQ));
audit('R1');
/* R2: declining the optional return; own Field Spell option works too */
fresh();
ru=mk(RU,0);ft=up('ワイト',1);f0=fieldSp(0);f1=fieldSp(1);
gameState.players[0].hand=[ru];gameState.players[1].mz=[ft];base();
cast(0,RU,[ft.uid]);
ok('R2: declining (choose none): the monster is face-down Defense and both Field Spells stay',C(ft).face==='down'&&C(ft).pos==='def'&&z(f0)==='field'&&z(f1)==='field',JSON.stringify({face:C(ft).face,f0:z(f0),f1:z(f1)}));
ok('R2: the choice was offered (the return is optional)',CH.filter(c=>/手札に戻すフィールド魔法/.test(c.title)).length===1,JSON.stringify(CH));
audit('R2');
fresh();
ru=mk(RU,0);ft=up('ワイト',1);f0=fieldSp(0);f1=fieldSp(1);
gameState.players[0].hand=[ru];gameState.players[1].mz=[ft];base();
cast(0,RU,[ft.uid,f0.uid]);
ok('R2b: my own Field Spell returned to my hand; the opponent one stays',z(f0)==='hand'&&pl(f0)===0&&z(f1)==='field',JSON.stringify({f0:z(f0),f1:z(f1)}));
audit('R2b');
/* R3: no Field Spell on the field: no second choice */
fresh();
ru=mk(RU,0);ft=up('ワイト',1);gameState.players[0].hand=[ru];gameState.players[1].mz=[ft];base();
cast(0,RU,[ft.uid]);
ok('R3: no Field Spell: the monster is set face-down and no return choice is opened',C(ft).face==='down'&&C(ft).pos==='def'&&CH.filter(c=>/手札に戻す/.test(c.title)).length===0&&!pc(),JSON.stringify({face:C(ft).face,CH}));
audit('R3');
/* R4: a face-up Defense Position target is also set face-down */
fresh();
ru=mk(RU,0);ft=up('ワイト',1,'def');gameState.players[0].hand=[ru];gameState.players[1].mz=[ft];base();
cast(0,RU,[ft.uid]);
ok('R4: a face-up Defense Position monster becomes face-down Defense',C(ft).face==='down'&&C(ft).pos==='def',JSON.stringify({face:C(ft).face,pos:C(ft).pos}));
/* R4b: a Set (face-down) Field Spell in the Field Zone is also a Field Spell card on the field */
fresh();
ru=mk(RU,0);ft=up('ワイト',1);f1=mk('山',1,'down');gameState.players[1].field=f1;
gameState.players[0].hand=[ru];gameState.players[1].mz=[ft];base();
cast(0,RU,[ft.uid,f1.uid]);
ok('R4b: a face-down Field Spell is offered and returned to its owner hand',CH.filter(c=>/手札に戻すフィールド魔法/.test(c.title)&&c.n===1).length===1&&z(f1)==='hand'&&pl(f1)===1,JSON.stringify({f1:z(f1),CH}));
/* R5: negative — no face-up monster on the opponent field (only a face-down one and my own) */
fresh();
ru=mk(RU,0);fd=down('ジェネティック・ワーウルフ',1);fm=up('ワイト',0);f1=fieldSp(1);gameState.players[0].hand=[ru];gameState.players[0].mz=[fm];gameState.players[1].mz=[fd];base();
ok('R5: negative — not legal without a face-up opponent monster',legal(0,RU).ok===false,JSON.stringify(legal(0,RU)));
cast(0,RU,[]);
ok('R5: negative — the card stays in the hand and nothing changes',z(ru)==='hand'&&z(f1)==='field'&&C(fd).face==='down',JSON.stringify({ru:z(ru),f1:z(f1)}));
/* R6: negative — the target is turned face-down in response (月の書): nothing happens, and no Field Spell is returned (「その後」) */
fresh();
ru=mk(RU,0);ft=up('ワイト',1);f1=fieldSp(1);const mb6=setT('月の書',1);
gameState.players[0].hand=[ru];gameState.players[1].mz=[ft];gameState.players[1].sz=[mb6];base();
let w6=castRespond(0,RU,[ft.uid],1,'sz',0,[ft.uid]);
ok('R6: negative — 月の書 turned the target face-down in response: a chain was built',w6===true&&z(mb6)==='grave'&&C(ft).face==='down',JSON.stringify({w6,mb:z(mb6),face:C(ft)&&C(ft).face}));
ok('R6: negative — the first part did not happen: the Field Spell stays and no return choice was opened',z(f1)==='field'&&CH.filter(c=>/手札に戻す/.test(c.title)).length===0,JSON.stringify({f1:z(f1),CH}));
audit('R6');

/* ===== M: 機械複製術 — target an own face-up Machine with ATK 500 or less; Special Summon up to 2 monsters with the same name from the Deck ===== */
const MG='マイティガード',RM='レアメタル・レディ',GS='ガジェット・ソルジャー';
function mField(deck){
  fresh();
  const rp=mk(RP,0),mg=up(MG,0),rm=up(RM,0),gs=up(GS,0),wt=up('ワイト',0),om=up(MG,1);
  gameState.players[0].hand=[rp];gameState.players[0].mz=[mg,rm,gs,wt];gameState.players[1].mz=[om];
  gameState.players[0].deck=deck(mk);base();
  return {rp,mg,rm,gs,wt,om};}
/* M1: 3 copies in the Deck: 2 summoned (chosen); the target is chosen at activation among the eligible monsters only */
let Q=mField(m=>[m(MG,0),m(MG,0),m(MG,0),m('ワイト',0),m('ワイト',0)]);
let dk=gameState.players[0].deck.slice(0,3);
ok('M1: legal with an own face-up Machine of ATK 500 or less',legal(0,RP).ok===true,JSON.stringify(legal(0,RP)));
cast(0,RP,[Q.mg.uid,dk[0].uid,dk[1].uid]);
tq=ptitle('機械複製術：対象');
ok('M1: the target is chosen at activation among my face-up Machines with ATK <= 500 (2 of 5 monsters: マイティガード, レアメタル・レディ)',tq.length===1&&tq[0].min===1&&tq[0].max===1&&tq[0].n===2,JSON.stringify(tq));
let cq=ptitle('機械複製術：デッキから');
ok('M1: resolution choice: 1 to 2 monsters with the same name among the 3 in the Deck (1 free zone... 5 zones - 4 = 1)',cq.length===1&&cq[0].min===1&&cq[0].max===1&&cq[0].n===3,JSON.stringify(cq));
ok('M1: only the free Monster Zone is used: 1 summoned (the field had 4 monsters)',gameState.players[0].mz.length===5&&dk.filter(c=>z(c)==='mz').length===1,JSON.stringify({mz:gameState.players[0].mz.length,dk:dk.map(z)}));
audit('M1');
/* M2: 2 free zones -> 2 summoned; the third copy stays in the Deck; the opponent マイティガード is not touched */
fresh();
{const rp=mk(RP,0),mg=up(MG,0),wt=up('ワイト',0);gameState.players[0].hand=[rp];gameState.players[0].mz=[mg,wt];gameState.players[0].deck=[mk(MG,0),mk(MG,0),mk(MG,0),mk('ワイト',0)];dk=gameState.players[0].deck.slice(0,3);base();
cast(0,RP,[mg.uid,dk[0].uid,dk[2].uid]);
cq=ptitle('機械複製術：デッキから');
ok('M2: up to 2 may be chosen (min 1, max 2) among 3 identical monsters in the Deck',cq.length===1&&cq[0].min===1&&cq[0].max===2&&cq[0].n===3,JSON.stringify(cq));
ok('M2: the 2 chosen are Special Summoned face-up; the third copy stays in the Deck',z(dk[0])==='mz'&&z(dk[2])==='mz'&&C(dk[0]).face==='up'&&z(dk[1])==='deck',JSON.stringify(dk.map(z)));
ok('M2: it was an effect Special Summon (specialSummoned from the deck)',C(dk[0]).specialSummoned===true,JSON.stringify({ss:C(dk[0]).specialSummoned,from:C(dk[0]).specialSummonedFrom}));
audit('M2');}
/* M3: only 1 same-name monster in the Deck: it is summoned (no more) */
fresh();
{const rp=mk(RP,0),mg=up(MG,0);gameState.players[0].hand=[rp];gameState.players[0].mz=[mg];gameState.players[0].deck=[mk(MG,0),mk('ワイト',0),mk(RM,0)];dk=gameState.players[0].deck.slice();base();
cast(0,RP,[mg.uid,dk[0].uid]);
ok('M3: one copy in the Deck: it is summoned; the other monsters of the Deck (other names) stay',z(dk[0])==='mz'&&z(dk[1])==='deck'&&z(dk[2])==='deck'&&gameState.players[0].mz.length===2,JSON.stringify(dk.map(z)));
audit('M3');}
/* M4: no same-name monster in the Deck: nothing is summoned; no choice is opened */
fresh();
{const rp=mk(RP,0),mg=up(MG,0);gameState.players[0].hand=[rp];gameState.players[0].mz=[mg];base();
cast(0,RP,[mg.uid]);
ok('M4: no same-name monster in the Deck: nothing summoned, no choice opened',gameState.players[0].mz.length===1&&cq&&ptitle('機械複製術：デッキから').length===0&&!pc()&&z(rp)==='grave',JSON.stringify({mz:gameState.players[0].mz.length}));
audit('M4');}
/* M5: negative — current ATK: マイティガード raised above 500 is not eligible; ガジェット・ソルジャー lowered to 400 is */
fresh();
{const rp=mk(RP,0),mg=up(MG,0),gs=up(GS,0);gameState.players[0].hand=[rp];gameState.players[0].mz=[mg,gs];gameState.players[0].deck=[mk(GS,0),mk(MG,0)];base();
API.setAtk(findCardByUid(mg.uid),900,'endPhase','test');API.setAtk(findCardByUid(gs.uid),400,'endPhase','test');
PREFER=[gs.uid];duelActivateFromHand(0);drive();PREFER=[];
tq=ptitle('機械複製術：対象');
ok('M5: the current ATK counts: only ガジェット・ソルジャー (ATK 400 now) is eligible, not マイティガード (900 now)',tq.length===1&&tq[0].n===1&&tq[0].keys.indexOf(gs.uid)>=0&&tq[0].keys.indexOf(mg.uid)<0,JSON.stringify(tq));
ok('M5: the same-name monster of the target (ガジェット・ソルジャー) is the one summoned from the Deck',gameState.players[0].mz.filter(c=>cardName(c)===GS).length===2&&gameState.players[0].deck.some(c=>cardName(c)===MG),JSON.stringify(gameState.players[0].mz.map(cardName)));
audit('M5');}
/* M6: negative — no eligible Machine (face-down, the opponent's, ATK over 500, not a Machine) */
fresh();
{const rp=mk(RP,0),gs=up(GS,0),dm=down(MG,0),wt=up('ワイト',0),om=up(MG,1);gameState.players[0].hand=[rp];gameState.players[0].mz=[gs,dm,wt];gameState.players[1].mz=[om];gameState.players[0].deck=[mk(MG,0)];base();
ok('M6: negative — not legal without an eligible target',legal(0,RP).ok===false,JSON.stringify(legal(0,RP)));
cast(0,RP,[]);
ok('M6: negative — the card stays in the hand; nothing summoned',z(rp)==='hand'&&gameState.players[0].mz.length===3,JSON.stringify({rp:z(rp)}));}
/* M7: negative — the target is turned face-down in response (月の書): nothing is summoned */
fresh();
{const rp=mk(RP,0),mg=up(MG,0),mb=setT('月の書',1);gameState.players[0].hand=[rp];gameState.players[0].mz=[mg];gameState.players[1].sz=[mb];gameState.players[0].deck=[mk(MG,0),mk(MG,0)];base();
const w=castRespond(0,RP,[mg.uid],1,'sz',0,[mg.uid]);
ok('M7: negative — the target was turned face-down in response: it is no longer a face-up monster, nothing is summoned',w===true&&C(mg).face==='down'&&gameState.players[0].mz.length===1&&gameState.players[0].deck.length===2,JSON.stringify({w,face:C(mg)&&C(mg).face,mz:gameState.players[0].mz.length}));
audit('M7');}
/* M7b (Opus review): negative — the target's ATK is raised above 500 in response (突進, +700): it no longer meets the targeting condition, nothing is summoned */
fresh();
{const rp=mk(RP,0),mg=up(MG,0),tk=setT('突進',1);gameState.players[0].hand=[rp];gameState.players[0].mz=[mg];gameState.players[1].sz=[tk];gameState.players[0].deck=[mk(MG,0),mk(MG,0)];base();
const w=castRespond(0,RP,[mg.uid],1,'sz',0,[mg.uid]);
ok('M7b: negative — the target became ATK '+curATK(C(mg))+' in response: nothing is summoned, both copies stay in the Deck',w===true&&curATK(C(mg))>500&&gameState.players[0].mz.length===1&&gameState.players[0].deck.filter(c=>cardName(c)===MG).length===2&&!ptitle('機械複製術：デッキから').length,JSON.stringify({w,atk:curATK(C(mg)),mz:gameState.players[0].mz.length}));
audit('M7b');}
/* M8: the position question is asked of the summoning player for each monster (manual answer: Defense) */
fresh();
{globalThis.__MANUAL_SS_POSITION_S03=true;
const rp=mk(RP,0),mg=up(MG,0);gameState.players[0].hand=[rp];gameState.players[0].mz=[mg];gameState.players[0].deck=[mk(MG,0),mk(MG,0)];dk=gameState.players[0].deck.slice();base();
cast(0,RP,[mg.uid,dk[0].uid,dk[1].uid,'def','atk']);
const pq=SEEN.filter(x=>/表示形式/.test(x.title));
ok('M8: no position in the text: the summoning player is asked for each monster; Defense and Attack answered',pq.length===2&&dk.every(c=>z(c)==='mz')&&C(dk[0]).pos==='def'&&C(dk[1]).pos==='atk',JSON.stringify({pq:pq.length,pos:dk.map(c=>C(c)&&C(c).pos)}));
globalThis.__MANUAL_SS_POSITION_S03=false;
audit('M8');}

/* ===== T: 大波小波 — destroy all own face-up WATER monsters; then Special Summon up to that many WATER monsters from the hand ===== */
const AM='アクア・マドール',UN='ウンディーネ',WG='ウォーター・ガール',NAM='ネオアクア・マドール';
function tField(handNames){
  fresh();
  const tw=mk(TW,0),a1=up(AM,0),a2=up(UN,0),ad=down(NAM,0),nw=up('ワイト',0),ow=up(AM,1);
  const hs=handNames.map(n=>mk(n,0));
  gameState.players[0].hand=[tw,...hs];gameState.players[0].mz=[a1,a2,ad,nw];gameState.players[1].mz=[ow];base();
  return {tw,a1,a2,ad,nw,ow,hs};}
/* T1: 2 face-up WATER monsters destroyed -> up to 2 from the hand */
Q=tField(['ウォーター・ガール','クロコダイラス','ガガギゴ','ワイト']);
ok('T1: legal with a face-up WATER monster',legal(0,TW).ok===true,JSON.stringify(legal(0,TW)));
cast(0,TW,[Q.hs[0].uid,Q.hs[1].uid,Q.hs[2].uid]);
ok('T1: both own face-up WATER monsters are destroyed (by an effect); the face-down WATER, the non-WATER and the opponent WATER stay',allIn([Q.a1,Q.a2],'grave')&&z(Q.ad)==='mz'&&z(Q.nw)==='mz'&&z(Q.ow)==='mz',JSON.stringify([Q.a1,Q.a2,Q.ad,Q.nw,Q.ow].map(z)));
cq=ptitle('大波小波：手札から');
ok('T1: optional choice 0..2 (the number destroyed) among the 3 WATER monsters of the hand (the non-WATER one is not offered)',cq.length===1&&cq[0].min===0&&cq[0].max===2&&cq[0].n===3,JSON.stringify(cq));
ok('T1: exactly 2 WATER monsters are Special Summoned (the third pick is over the limit)',z(Q.hs[0])==='mz'&&z(Q.hs[1])==='mz'&&z(Q.hs[2])==='hand',JSON.stringify(Q.hs.map(z)));
audit('T1');
/* T2: decline */
Q=tField(['ウォーター・ガール','ガガギゴ']);
cast(0,TW,[]);
ok('T2: the WATER monsters are destroyed; declining the summon keeps the hand',allIn([Q.a1,Q.a2],'grave')&&allIn(Q.hs,'hand'),JSON.stringify({d:[Q.a1,Q.a2].map(z),h:Q.hs.map(z)}));
audit('T2');
/* T3: only 1 destroyed -> at most 1 */
fresh();
{const tw=mk(TW,0),a1=up(AM,0),h1=mk('ウォーター・ガール',0),h2=mk('ガガギゴ',0);gameState.players[0].hand=[tw,h1,h2];gameState.players[0].mz=[a1];base();
cast(0,TW,[h1.uid,h2.uid]);
cq=ptitle('大波小波：手札から');
ok('T3: one destroyed -> the limit is 1',cq.length===1&&cq[0].max===1&&z(h1)==='mz'&&z(h2)==='hand',JSON.stringify({cq,h:[h1,h2].map(z)}));
audit('T3');}
/* T4: the number actually destroyed: a WATER monster that cannot be destroyed by card effects is not counted */
fresh();
{const tw=mk(TW,0),a1=up(AM,0),va=up('M・HERO ヴェイパー',0),h1=mk('ウォーター・ガール',0),h2=mk('ガガギゴ',0);gameState.players[0].hand=[tw,h1,h2];gameState.players[0].mz=[a1,va];base();
cast(0,TW,[h1.uid,h2.uid]);
cq=ptitle('大波小波：手札から');
ok('T4: M・HERO ヴェイパー (not destroyed by card effects) stays; only アクア・マドール was destroyed',z(a1)==='grave'&&z(va)==='mz',JSON.stringify({a1:z(a1),va:z(va)}));
ok('T4: the limit is the number actually destroyed (1), not the number of WATER monsters (2)',cq.length===1&&cq[0].max===1&&z(h1)==='mz'&&z(h2)==='hand',JSON.stringify({cq,h:[h1,h2].map(z)}));
audit('T4');}
/* T5: negative — nothing destroyed (all protected): no summon choice */
fresh();
{const tw=mk(TW,0),va=up('M・HERO ヴェイパー',0),h1=mk('ウォーター・ガール',0);gameState.players[0].hand=[tw,h1];gameState.players[0].mz=[va];base();
cast(0,TW,[h1.uid]);
ok('T5: negative — nothing was destroyed: no Special Summon from the hand and no choice',z(va)==='mz'&&z(h1)==='hand'&&ptitle('大波小波：手札から').length===0,JSON.stringify({va:z(va),h1:z(h1)}));}
/* T6: negative — no face-up WATER monster of my own */
fresh();
{const tw=mk(TW,0),ad=down(NAM,0),ow=up(AM,1),nw=up('ワイト',0),h1=mk('ウォーター・ガール',0);gameState.players[0].hand=[tw,h1];gameState.players[0].mz=[ad,nw];gameState.players[1].mz=[ow];base();
ok('T6: negative — not legal without my own face-up WATER monster (face-down and the opponent\'s do not count)',legal(0,TW).ok===false,JSON.stringify(legal(0,TW)));
cast(0,TW,[]);
ok('T6: negative — nothing is destroyed; the card stays in the hand',z(tw)==='hand'&&z(ad)==='mz'&&z(ow)==='mz');}
/* T7: a monster whose Attribute was changed to WATER (錬金生物 ホムンクルス) is destroyed; the Attribute is the current one */
fresh();
{const tw=mk(TW,0),ho=up(HO,0);gameState.players[0].hand=[tw];gameState.players[0].mz=[ho];base();
ign(ho,['水']);
ok('T7: ホムンクルス (LIGHT) becomes WATER by its own effect',currentAttributeV17(C(ho))==='水',currentAttributeV17(C(ho)));
cast(0,TW,[]);
ok('T7: with its Attribute changed to WATER, 大波小波 destroys it',z(ho)==='grave',z(ho));
audit('T7');}

/* ===== W: ドラゴンを呼ぶ笛 — Special Summon up to 2 Dragons from the hand; activation and resolution need 「ロード・オブ・ドラゴン－ドラゴンの支配者－」 on the field ===== */
const PU='プチリュウ',BD='ベビードラゴン',LD='レッサー・ドラゴン';
function wField(lordSide,lordFace){
  fresh();
  const wh=mk(WH,0),lord=lordFace==='down'?down(LORD,lordSide):up(LORD,lordSide),hs=[mk(PU,0),mk(BD,0),mk(LD,0),mk('ワイト',0)];
  gameState.players[0].hand=[wh,...hs];gameState.players[lordSide].mz=[lord];base();
  return {wh,lord,hs};}
/* W1: Lord on my field: 2 chosen among 3 Dragons */
Q=wField(0,'up');
ok('W1: legal with the Lord on the field',legal(0,WH).ok===true,JSON.stringify(legal(0,WH)));
cast(0,WH,[Q.hs[0].uid,Q.hs[1].uid,Q.hs[2].uid]);
cq=ptitle('ドラゴンを呼ぶ笛：手札から');
ok('W1: choice 1..2 among the 3 Dragons of the hand (the non-Dragon is not offered)',cq.length===1&&cq[0].min===1&&cq[0].max===2&&cq[0].n===3,JSON.stringify(cq));
ok('W1: exactly 2 Dragons Special Summoned face-up; the third stays in the hand; the Spell is in the Graveyard',z(Q.hs[0])==='mz'&&z(Q.hs[1])==='mz'&&z(Q.hs[2])==='hand'&&z(Q.wh)==='grave'&&C(Q.hs[0]).face==='up',JSON.stringify(Q.hs.map(z)));
audit('W1');
/* W2: the Lord on the opponent field also counts */
Q=wField(1,'up');
cast(0,WH,[Q.hs[0].uid]);
ok('W2: the Lord on the opponent field enables it too: 1 Dragon summoned (the choice was min 1)',z(Q.hs[0])==='mz'&&z(Q.hs[1])==='hand'&&z(Q.hs[2])==='hand',JSON.stringify(Q.hs.map(z)));
audit('W2');
/* W3: negative — no Lord */
fresh();
{const wh=mk(WH,0),h1=mk(PU,0);gameState.players[0].hand=[wh,h1];base();
ok('W3: negative — not legal without the Lord on the field',legal(0,WH).ok===false,JSON.stringify(legal(0,WH)));
cast(0,WH,[]);
ok('W3: negative — the card stays in the hand',z(wh)==='hand'&&z(h1)==='hand');}
/* W4: negative — a face-down Lord does not count */
Q=wField(0,'down');
ok('W4: negative — not legal with a face-down Lord',legal(0,WH).ok===false,JSON.stringify(legal(0,WH)));
/* W5: negative — the Lord is turned face-down in response (月の書): it cannot be processed */
fresh();
{const wh=mk(WH,0),lord=up(LORD,0),h1=mk(PU,0),mb=setT('月の書',1);gameState.players[0].hand=[wh,h1];gameState.players[0].mz=[lord];gameState.players[1].sz=[mb];base();
const w=castRespond(0,WH,[],1,'sz',0,[lord.uid]);
ok('W5: negative — the Lord was turned face-down in response: the effect is not processed, no Dragon is summoned',w===true&&C(lord).face==='down'&&z(h1)==='hand'&&ptitle('ドラゴンを呼ぶ笛：手札から').length===0,JSON.stringify({w,face:C(lord)&&C(lord).face,h1:z(h1)}));
audit('W5');}
/* W6: no Dragon in the hand: nothing; one Dragon: 1 */
fresh();
{const wh=mk(WH,0),lord=up(LORD,0),h1=mk('ワイト',0);gameState.players[0].hand=[wh,h1];gameState.players[0].mz=[lord];base();
cast(0,WH,[]);
ok('W6: no Dragon in the hand: nothing summoned, no choice',z(wh)==='grave'&&z(h1)==='hand'&&ptitle('ドラゴンを呼ぶ笛：手札から').length===0);}

/* ===== B: バグ・ロード — each player may Special Summon from their own hand a monster with the Level of a face-up Level 4 or lower monster they control ===== */
const L4A='ガガギゴ',L3A='ウンディーネ',L6A='ネオアクア・マドール';
function bField(){
  fresh();
  const bl=mk(BL,0),m0=up(AM,0),m1=up(L3A,1);
  const h4=mk('サファイアドラゴン',0),h3=mk('ベビードラゴン',0),h6=mk('ガジェット・ソルジャー',0);
  const o3=mk('一眼の盾竜',1),o4=mk('デビル・ドラゴン',1),o6=mk('フロストザウルス',1);
  gameState.players[0].hand=[bl,h4,h3,h6];gameState.players[1].hand=[o3,o4,o6];gameState.players[0].mz=[m0];gameState.players[1].mz=[m1];base();
  return {bl,m0,m1,h4,h3,h6,o3,o4,o6};}
/* B1: both choose a monster of the right Level; the activator is asked first */
Q=bField();
ok('B1: always legal (a Quick-Play Spell with no target)',legal(0,BL).ok===true,JSON.stringify(legal(0,BL)));
cast(0,BL,[Q.h4.uid,Q.o3.uid]);
let bq=CH.filter(c=>/バグ・ロード：手札/.test(c.title));
ok('B1: the activator is asked first, then the opponent; each may choose 0 to 1',bq.length===2&&bq[0].player===0&&bq[1].player===1&&bq[0].min===0&&bq[0].max===1&&bq[1].min===0&&bq[1].max===1,JSON.stringify(bq));
ok('B1: only a monster of the Level of my own face-up Level 4 or lower monster is offered (Level 4 only: 1 of 3; the opponent Level 3: 1 of 3)',bq.length===2&&bq[0].n===1&&bq[1].n===1,JSON.stringify(bq));
ok('B1: my Level 4 monster and the opponent Level 3 monster are Special Summoned from their own hands',z(Q.h4)==='mz'&&pl(Q.h4)===0&&z(Q.o3)==='mz'&&pl(Q.o3)===1&&z(Q.h3)==='hand'&&z(Q.o4)==='hand',JSON.stringify([Q.h4,Q.h3,Q.o3,Q.o4].map(z)));
ok('B1: the Spell went to the Graveyard',z(Q.bl)==='grave',z(Q.bl));
audit('B1');
/* B2: the opponent declines */
Q=bField();
cast(0,BL,[Q.h4.uid]);
ok('B2: the opponent declines: only the activator summons',z(Q.h4)==='mz'&&z(Q.o3)==='hand',JSON.stringify([Q.h4,Q.o3].map(z)));
/* B3: the activator declines, the opponent summons */
Q=bField();
cast(0,BL,[Q.o3.uid]);
ok('B3: the activator declines: only the opponent summons',z(Q.h4)==='hand'&&z(Q.o3)==='mz'&&pl(Q.o3)===1,JSON.stringify([Q.h4,Q.o3].map(z)));
audit('B3');
/* B4: Level 5 or higher monsters do not count; face-down monsters do not count */
fresh();
{const bl=mk(BL,0),m0=up(L6A,0),m1=down('ガガギゴ',1),h6=mk('ガジェット・ソルジャー',0),h4=mk('サファイアドラゴン',0),o4=mk('デビル・ドラゴン',1);
gameState.players[0].hand=[bl,h6,h4];gameState.players[1].hand=[o4];gameState.players[0].mz=[m0];gameState.players[1].mz=[m1];base();
cast(0,BL,[h6.uid,h4.uid,o4.uid]);
ok('B4: a face-up Level 6 monster and a face-down Level 4 monster do not count: nobody is asked and nothing is summoned',CH.filter(c=>/バグ・ロード：手札/.test(c.title)).length===0&&allIn([h6,h4,o4],'hand')&&z(bl)==='grave',JSON.stringify({CH,h:[h6,h4,o4].map(z)}));
audit('B4');}
/* B5: the Level is that of the monster the player himself controls: the opponent has no monster -> not asked */
fresh();
{const bl=mk(BL,0),m0=up(AM,0),h4=mk('サファイアドラゴン',0),o4=mk('デビル・ドラゴン',1);
gameState.players[0].hand=[bl,h4];gameState.players[1].hand=[o4];gameState.players[0].mz=[m0];base();
cast(0,BL,[h4.uid,o4.uid]);
bq=CH.filter(c=>/バグ・ロード：手札/.test(c.title));
ok('B5: the opponent controls no monster: only the activator is asked; the opponent hand Level 4 monster is not summoned',bq.length===1&&bq[0].player===0&&z(h4)==='mz'&&z(o4)==='hand',JSON.stringify({bq,h4:z(h4),o4:z(o4)}));
audit('B5');}
/* B6: Level of the monster's current value (a Level 4 monster lowered... a Level 5 monster by Level change is not tested); Level 4 and Level 3 monsters: both Levels are offered */
fresh();
{const bl=mk(BL,0),m0=up(AM,0),m1=up(L3A,0),h4=mk('サファイアドラゴン',0),h3=mk('ベビードラゴン',0),h6=mk('ガジェット・ソルジャー',0);
gameState.players[0].hand=[bl,h4,h3,h6];gameState.players[0].mz=[m0,m1];base();
cast(0,BL,[h3.uid]);
bq=CH.filter(c=>/バグ・ロード：手札/.test(c.title));
ok('B6: two face-up monsters of Level 4 and 3: both Levels are matched (2 of 3 hand monsters offered); only 1 monster is summoned',bq.length===1&&bq[0].n===2&&z(h3)==='mz'&&z(h4)==='hand'&&z(h6)==='hand',JSON.stringify({bq,h:[h4,h3,h6].map(z)}));
audit('B6');}
/* B7: Quick-Play Spell: Set, then activated on the opponent turn (at an attack declaration); the activator (player 0) is asked first */
fresh();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
{const bl=setT(BL,0),m0=up(AM,0),m1=up(L3A,1),h4=mk('サファイアドラゴン',0),o3=mk('一眼の盾竜',1),atk=up('ガガギゴ',1);
gameState.players[0].sz=[bl];gameState.players[0].hand=[h4];gameState.players[0].mz=[m0];gameState.players[1].hand=[o3];gameState.players[1].mz=[m1,atk];base();
PREFER=[h4.uid,o3.uid];const used=attackRespond(1,atk,m0,0,pl2=>pl2.kind==='attackDeclare','sz',0);PREFER=[];
bq=CH.filter(c=>/バグ・ロード：手札/.test(c.title));
ok('B7: a Set Quick-Play Spell is activated on the opponent turn; the activator (player 0) is asked first, then player 1',used&&bq.length===2&&bq[0].player===0&&bq[1].player===1,JSON.stringify({used,bq}));
ok('B7: both monsters were Special Summoned',z(h4)==='mz'&&pl(h4)===0&&z(o3)==='mz'&&pl(o3)===1,JSON.stringify([h4,o3].map(z)));
audit('B7');}
/* B8: the position question is asked of each summoning player (manual answers: Defense for me, Attack for the opponent) */
Q=bField();
{globalThis.__MANUAL_SS_POSITION_S03=true;
cast(0,BL,[Q.h4.uid,Q.o3.uid,'def','atk']);
const pq=SEEN.filter(x=>/表示形式/.test(x.title));
ok('B8: no position in the text: each summoning player is asked (player 0 Defense, player 1 Attack)',pq.length===2&&C(Q.h4).pos==='def'&&C(Q.o3).pos==='atk'&&pq.map(x=>x.player).sort().join()==='0,1',JSON.stringify({pq:pq.map(x=>x.player),p4:C(Q.h4)&&C(Q.h4).pos,p3:C(Q.o3)&&C(Q.o3).pos}));
globalThis.__MANUAL_SS_POSITION_S03=false;
audit('B8');}

/* ===== H: 錬金生物 ホムンクルス — once per turn change its Attribute (declared at activation) while it stays face-up on the field ===== */
fresh();
let ho=up(HO,0);gameState.players[0].mz=[ho];base();
ok('H1: legal in my Main Phase, face-up',(()=>{const l=strictScriptLegalityV2(HO,0,'mz',0,{});return l.ok===true;})(),'');
ign(ho,['水']);
let dq=SEEN.filter(x=>x.kind==='declare');
ok('H1: the Attribute is declared at activation (6 choices: every Attribute but its current LIGHT)',dq.length===1&&dq[0].n===6&&dq[0].keys.length===6,JSON.stringify(dq));
ok('H1: it becomes WATER (current Attribute); the printed Attribute (原本) is unchanged',currentAttributeV17(C(ho))==='水'&&API.originalAttrOf(findCardByUid(ho.uid))==='光'&&API.attrOf(findCardByUid(ho.uid))==='水',JSON.stringify({cur:currentAttributeV17(C(ho)),orig:API.originalAttrOf(findCardByUid(ho.uid))}));
ok('H1: the field handle reports the new Attribute',API.fieldCards({player:0,zone:'mz'}).some(x=>x.card===C(ho)&&x.attr==='水'),'');
audit('H1');
/* H2: once per turn */
ign(ho,['闇']);
ok('H2: negative — a second use in the same turn is impossible (still WATER, no declaration opened)',currentAttributeV17(C(ho))==='水'&&!pc()&&SEEN.filter(x=>x.kind==='declare').length===1,JSON.stringify({cur:currentAttributeV17(C(ho))}));
/* H3: my next turn: a new use replaces the earlier Attribute */
nextTurn();nextTurn();toPhase('main1');
ok('H3: it is my turn again (turn '+gameState.turn+') in the Main Phase',gameState.activePlayer===0&&(gameState.phase==='main1'),JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase,t:gameState.turn}));
ok('H3: the Attribute stays WATER across turns (not an end-of-turn effect)',currentAttributeV17(C(ho))==='水',currentAttributeV17(C(ho)));
ign(ho,['闇']);
dq=SEEN.filter(x=>x.kind==='declare');
ok('H3: the second declaration excludes the current WATER (6 choices) and replaces it: DARK',dq.length===2&&dq[1].n===6&&currentAttributeV17(C(ho))==='闇'&&(C(ho).charV17||[]).filter(m=>m.kind==='attr').length===1,JSON.stringify({dq:dq.map(x=>x.n),cur:currentAttributeV17(C(ho)),mods:C(ho).charV17}));
audit('H3');
/* H4: leaves the field: back to the printed Attribute */
fresh();
{const h=up(HO,0);gameState.players[0].mz=[h];base();
ign(h,['炎']);
ok('H4: FIRE declared',currentAttributeV17(C(h))==='炎',currentAttributeV17(C(h)));
const hh=findCardByUid(h.uid);API.returnToHand(hh,'test');
ok('H4: returned to the hand: the override is gone (LIGHT)',z(h)==='hand'&&currentAttributeV17(C(h))==='光'&&!C(h).charV17,JSON.stringify({z:z(h),cur:currentAttributeV17(C(h)),mods:C(h).charV17}));
audit('H4');}
/* H5: turned face-down (月の書) and face-up again: the override ended */
fresh();
{const h=up(HO,0),mb=mk('月の書',0);gameState.players[0].mz=[h];gameState.players[0].hand=[mb];base();
ign(h,['地']);
cast(0,'月の書',[h.uid]);
ok('H5: turned face-down: the Attribute override ended',C(h).face==='down'&&!C(h).charV17,JSON.stringify({face:C(h).face,mods:C(h).charV17}));
const hh=findCardByUid(h.uid);act({type:'FX_SET_STATE',player:0,zone:'mz',index:hh.index,face:'up',pos:'atk',reason:'test'});
ok('H5: face-up again: LIGHT (the printed Attribute)',currentAttributeV17(C(h))==='光',currentAttributeV17(C(h)));
audit('H5');}
/* H6: negative — opponent turn / Battle Phase / face-down */
fresh();gameState.activePlayer=1;gameState.turn=6;
{const h=up(HO,0);gameState.players[0].mz=[h];base();
ign(h,['水']);
ok('H6: negative — an ignition effect cannot be activated on the opponent turn',currentAttributeV17(C(h))==='光'&&!pc());}
fresh();gameState.phase='battle';
{const h=up(HO,0);gameState.players[0].mz=[h];base();
ign(h,['水']);
ok('H6: negative — not in the Battle Phase',currentAttributeV17(C(h))==='光'&&!pc());}
fresh();
{const h=down(HO,0);gameState.players[0].mz=[h];base();
ign(h,['水']);
ok('H6: negative — face-down: cannot be activated',currentAttributeV17(C(h))==='光'&&!pc());}
/* H7: the effect is activated in the hand? negative — not from the hand or the Graveyard */
fresh();
{const h=mk(HO,0);gameState.players[0].hand=[h];base();
const l=strictScriptLegalityV2(HO,0,'hand',0,{cardOverride:h});
ok('H7: negative — a monster in the hand cannot use it',l.ok!==true,JSON.stringify(l));}
`);
