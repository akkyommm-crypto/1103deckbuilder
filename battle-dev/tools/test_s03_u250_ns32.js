/* S03-U250: NOT_STARTED → TESTED — 凶暴化の仮面, マシュマロンのメガネ, ライトロード・レイピア, ジュラック・デイノ.
   Real DUEL paths (Equip activation, Standby / End Phase triggers, attacks, the End Phase Lightsworn mill, discard), Replay-audited.
   Not covered (reported): ナチュル・スパイダーファング (no per-turn activation record), ハーピィ・レディ三姉妹 (2011 text lacks 「のみ」 for engine/1ZK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;LAST=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
let PREFER=[],TRIG=[],LAST=[];
function step(){const q=pc();if(q){LAST=q.candidates.map(x=>x.uid!=null?x.uid:x.key);if(q.max>1){answerChoiceV49(q.candidates.slice(0,Math.min(q.max,q.candidates.length)).map(x=>x.key));return true;}let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
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
function idx(c){return findCardByUid(c.uid).index;}
function legal(name,p,zone,i){return strictScriptLegalityV2(name,p,zone,i,{}).ok;}
function atk(p,i,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:i,target:t});drive();}
function def(c){return curStat(C(c),'def');}
function toOppBattle(){phase('end');turn();phase('standby');phase('main1');phase('battle');}

/* ===== A: 凶暴化の仮面 — ATK +1000 / DEF -1000; at its controller's Standby Phase: pay 1000 LP or destroy it ===== */
fresh();
let mk1=mk('凶暴化の仮面',0),bw=mk('青眼の白龍',0,'up');gameState.players[0].hand=[mk1];gameState.players[0].mz=[bw];base();
PREFER=[bw.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: equipped to 青眼の白龍 — ATK 3000 + 1000, DEF 2500 - 1000',z(mk1)==='sz'&&curATK(C(bw))===4000&&def(bw)===1500,JSON.stringify({z:z(mk1),atk:curATK(C(bw)),def:z(bw)==='mz'?def(bw):null,TRIG}));
phase('end');turn();phase('standby');
ok('A: the opponent\'s Standby Phase — no prompt, nothing paid',!pc()&&lp(0)===8000&&lp(1)===8000&&z(mk1)==='sz',JSON.stringify({pc:!!pc(),lp0:lp(0),lp1:lp(1)}));
phase('main1');phase('end');turn();
PREFER=['pay'];phase('standby');PREFER=[];
ok('A: its controller\'s Standby Phase — pay 1000 LP, the card stays',gameState.activePlayer===0&&lp(0)===7000&&z(mk1)==='sz'&&curATK(C(bw))===4000,JSON.stringify({ap:gameState.activePlayer,lp0:lp(0),z:z(mk1),TRIG}));
phase('main1');phase('end');turn();phase('standby');phase('main1');phase('end');turn();
PREFER=['destroy'];phase('standby');PREFER=[];
ok('A: the next own Standby Phase — destroy without paying: card in the GY, ATK back to 3000, LP unchanged',z(mk1)==='grave'&&lp(0)===7000&&curATK(C(bw))===3000,JSON.stringify({z:z(mk1),lp0:lp(0),atk:curATK(C(bw))}));
audit('A');
/* A2: equipped to the opponent's monster; with 1000 LP there is nothing to choose — destroyed at once, no payment */
fresh();
mk1=mk('凶暴化の仮面',0);let ob=mk('青眼の白龍',1,'up');gameState.players[0].hand=[mk1];gameState.players[1].mz=[ob];gameState.players[0].lp=1000;base();
PREFER=[ob.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A2: equipped to the opponent\'s monster — its ATK 4000',z(mk1)==='sz'&&curATK(C(ob))===4000,JSON.stringify({z:z(mk1),atk:curATK(C(ob))}));
phase('end');turn();phase('standby');phase('main1');phase('end');turn();phase('standby');
ok('A2: the Spell controller\'s Standby Phase with 1000 LP — destroyed, no prompt, LP stays 1000',gameState.activePlayer===0&&z(mk1)==='grave'&&lp(0)===1000&&!pc(),JSON.stringify({ap:gameState.activePlayer,z:z(mk1),lp0:lp(0),pc:!!pc()}));
audit('A2');

/* ===== B: マシュマロンのメガネ — while a face-up マシュマロン is in its controller's Monster Zone, only マシュマロン can be chosen as an attack target ===== */
fresh();
let gl=mk('マシュマロンのメガネ',0),ms=mk('マシュマロン',0,'up'),wt=mk('ワイト',0,'up'),ab=mk('青眼の白龍',1,'up');
gameState.players[0].hand=[gl];gameState.players[0].mz=[ms,wt];gameState.players[1].mz=[ab];base();
duelActivateFromHand(0);drive();
ok('B: the Continuous Spell is on the field',z(gl)==='sz',JSON.stringify({z:z(gl),TRIG}));
toOppBattle();
ok('B: ワイト cannot be chosen as an attack target, マシュマロン can',attackTargetForbiddenReasonS03(1,C(wt))!==''&&attackTargetForbiddenReasonS03(1,C(ms))==='',attackTargetForbiddenReasonS03(1,C(wt))+'|'+attackTargetForbiddenReasonS03(1,C(ms)));
atk(1,idx(ab),idx(wt));
ok('B: the attack on ワイト is refused — it stays, no damage',z(wt)==='mz'&&lp(0)===8000,JSON.stringify({wt:z(wt),lp0:lp(0)}));
atk(1,idx(ab),idx(ms));
ok('B: the attack on マシュマロン goes through — 3000 vs 300, not destroyed (battle-proof), 2700 damage',z(ms)==='mz'&&lp(0)===8000-2700,JSON.stringify({ms:z(ms),lp0:lp(0)}));
audit('B');
/* B2 negatives: no マシュマロン on the field; a face-down マシュマロン (no name) */
fresh();
gl=mk('マシュマロンのメガネ',0);wt=mk('ワイト',0,'up');ab=mk('青眼の白龍',1,'up');
gameState.players[0].hand=[gl];gameState.players[0].mz=[wt];gameState.players[1].mz=[ab];base();
duelActivateFromHand(0);drive();toOppBattle();
atk(1,idx(ab),idx(wt));
ok('B2: no マシュマロン on the field — ワイト can be attacked and is destroyed',z(gl)==='sz'&&z(wt)==='grave',JSON.stringify({gl:z(gl),wt:z(wt)}));
fresh();
gl=mk('マシュマロンのメガネ',0);ms=mk('マシュマロン',0,'down','def');ms.setTurn=4;wt=mk('ワイト',0,'up');ab=mk('青眼の白龍',1,'up');
gameState.players[0].hand=[gl];gameState.players[0].mz=[ms,wt];gameState.players[1].mz=[ab];base();
duelActivateFromHand(0);drive();toOppBattle();
atk(1,idx(ab),idx(wt));
ok('B2: only a face-down マシュマロン — the Spell does not apply, ワイト is destroyed',z(wt)==='grave',JSON.stringify({wt:z(wt)}));
audit('B2');

/* ===== C: ライトロード・レイピア — only for 「ライトロード」; ATK +700; sent from the Deck to the GY → may equip to an own 「ライトロード」 ===== */
fresh();
let rp=mk('ライトロード・レイピア',0),jn=mk('ライトロード・パラディン ジェイン',0,'up'),w0=mk('ワイト',0,'up');
gameState.players[0].hand=[rp];gameState.players[0].mz=[w0];base();
ok('C: only a non-「ライトロード」 monster on the field → the Equip Spell cannot be activated',!legal('ライトロード・レイピア',0,'hand',0));
fresh();
rp=mk('ライトロード・レイピア',0);jn=mk('ライトロード・パラディン ジェイン',0,'up');w0=mk('ワイト',0,'up');
gameState.players[0].hand=[rp];gameState.players[0].mz=[w0,jn];base();
duelActivateFromHand(0);drive();
ok('C: only the 「ライトロード」 monster is offered; equipped — ATK 1800 + 700',z(rp)==='sz'&&LAST.length===1&&LAST[0]===jn.uid&&curATK(C(jn))===2500,JSON.stringify({z:z(rp),last:LAST,atk:curATK(C(jn)),TRIG}));
audit('C');
/* C2: the End Phase mill (ライトロード・パラディン ジェイン) sends the Rapier from the Deck → optional equip to a 「ライトロード」 */
fresh();
rp=mk('ライトロード・レイピア',0);jn=mk('ライトロード・パラディン ジェイン',0,'up');
gameState.players[0].deck=[rp,mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];gameState.players[0].mz=[jn];base();
phase('end');
ok('C2: milled from the Deck → equipped to ライトロード・パラディン ジェイン from the GY — ATK 1800 + 700',z(rp)==='sz'&&!!C(rp).equipTo&&C(rp).equipTo.uid===jn.uid&&curATK(C(jn))===2500,JSON.stringify({z:z(rp),eq:z(rp)==='sz'?C(rp).equipTo:null,atk:curATK(C(jn)),TRIG}));
audit('C2');
/* C3 negatives: Magic & Trap Zone full; discarded from the hand instead of the Deck */
fresh();
rp=mk('ライトロード・レイピア',0);jn=mk('ライトロード・パラディン ジェイン',0,'up');
gameState.players[0].deck=[rp,mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];gameState.players[0].mz=[jn];
gameState.players[0].sz=Array.from({length:5},()=>mk('ブラック・ホール',0,'down'));base();
phase('end');
ok('C3: Magic & Trap Zone full — the milled Rapier stays in the GY',z(rp)==='grave'&&curATK(C(jn))===1800,JSON.stringify({z:z(rp),atk:curATK(C(jn)),TRIG}));
fresh();
rp=mk('ライトロード・レイピア',0);jn=mk('ライトロード・パラディン ジェイン',0,'up');let lv=mk('ライトニング・ボルテックス',0),dx=mk('ワイト',0),ow=mk('ワイト',1,'up');
gameState.players[0].hand=[lv,rp,dx];gameState.players[0].mz=[jn];gameState.players[1].mz=[ow];base();
PREFER=[rp.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C3: discarded from the hand to the GY (not from the Deck) — no equip, no prompt',z(rp)==='grave'&&z(ow)==='grave'&&!pc(),JSON.stringify({z:z(rp),ow:z(ow),TRIG}));
audit('C3');

/* ===== D: ジュラック・デイノ — the End Phase of a turn in which it destroyed an opponent monster by battle: release a 「ジュラック」, draw 2 ===== */
fresh();
let dn=mk('ジュラック・デイノ',0,'up'),wx=mk('ワイト',1,'up');
gameState.players[0].mz=[dn];gameState.players[1].mz=[wx];base();
phase('battle');atk(0,0,0);
ok('D: ワイト destroyed by battle',z(wx)==='grave',JSON.stringify({wx:z(wx),TRIG}));
phase('main2');phase('end');
ok('D: End Phase — released itself (the only 「ジュラック」) and drew 2',z(dn)==='grave'&&gameState.players[0].hand.length===2&&gameState.players[0].deck.length===4,JSON.stringify({dn:z(dn),hand:gameState.players[0].hand.length,TRIG}));
audit('D');
/* D2: killed on the opponent's turn (it defends); another 「ジュラック」 is released */
fresh();
dn=mk('ジュラック・デイノ',0,'up');let st=mk('ジュラック・スタウリコ',0,'up'),at=mk('ワイト',1,'up');
gameState.players[0].mz=[dn,st];gameState.players[1].mz=[at];base();
toOppBattle();atk(1,0,0);
ok('D2: the attacking ワイト destroyed by 〜デイノ in defence of the opponent\'s attack',z(at)==='grave'&&z(dn)==='mz',JSON.stringify({at:z(at),dn:z(dn)}));
phase('main2');PREFER=[st.uid];phase('end');PREFER=[];
ok('D2: the opponent\'s End Phase — released ジュラック・スタウリコ, Deino stays, drew 2',z(st)==='grave'&&z(dn)==='mz'&&gameState.players[0].hand.length===2,JSON.stringify({st:z(st),dn:z(dn),hand:gameState.players[0].hand.length,TRIG}));
audit('D2');
/* D3 negatives: a direct attack destroys nothing; a mutual destruction removes the card from the field */
fresh();
dn=mk('ジュラック・デイノ',0,'up');
gameState.players[0].mz=[dn];base();
phase('battle');atk(0,0,'direct');
phase('main2');phase('end');
ok('D3: it destroyed no monster (direct attack) — the End Phase effect is not offered',z(dn)==='mz'&&gameState.players[0].hand.length===0&&lp(1)===8000-1700,JSON.stringify({dn:z(dn),hand:gameState.players[0].hand.length,lp1:lp(1),TRIG}));
fresh();
dn=mk('ジュラック・デイノ',0,'up');let dn2=mk('ジュラック・デイノ',1,'up');
gameState.players[0].mz=[dn];gameState.players[1].mz=[dn2];base();
phase('battle');atk(0,0,0);phase('main2');phase('end');
ok('D3: both destroyed (1700 vs 1700) — the destroyed Deino has no End Phase effect',z(dn)==='grave'&&z(dn2)==='grave'&&gameState.players[0].hand.length===0&&gameState.players[1].hand.length===0,JSON.stringify({dn:z(dn),dn2:z(dn2),TRIG}));
audit('D3');
`);
