/* S03-U320: 「ナチュル」 — モスキート, ローズウィップ, レディバグ, フライトフライ, スタッグ, ホワイトオーク. Real DUEL paths (attack targets, battle damage, Synchro Summon, activation windows), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3200001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function doSynchro(syn,mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function doAct(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function canEffect(p,c){return getLegalZoneActions(p,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function oppTargets(att){return battleTargetsV29(att.uid).targets.map(x=>x.card.uid);}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length}).ok;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function toWindow(){for(let i=0;i<200;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
/* the cards in use respond in the chain windows (each at most once); the others pass */
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}

/* ===== モスキート: not attackable while another face-up 「ナチュル」 of mine exists; the other 「ナチュル」' battle damage to me is dealt to the opponent ===== */
{ fresh();const mq=mon('ナチュル・モスキート',0),ot=mon('ナチュル・ガーディアン',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[mq,ot];gameState.players[1].mz=[f];baselineA();
  endTurn();
  ok('モスキート: with ガーディアン (another ナチュル) the opponent can attack only ガーディアン',JSON.stringify(oppTargets(f))===JSON.stringify([ot.uid]),JSON.stringify(oppTargets(f)));
  phase('battle');const l0=lp(0),l1=lp(1);atkTarget(1,f,ot);
  ok('モスキート: ガーディアン destroyed by 青眼 (3000-1600 = 1400): the damage hits the opponent instead',z(ot)==='grave'&&lp(0)===l0&&lp(1)===l1-1400,JSON.stringify({ot:z(ot),l0:lp(0),l1:lp(1),was:[l0,l1]}));
  audit('モスキート ①'); }
{ fresh();const mq=mon('ナチュル・モスキート',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[mq];gameState.players[1].mz=[f];baselineA();
  endTurn();
  ok('モスキート negative: alone it can be attacked',JSON.stringify(oppTargets(f))===JSON.stringify([mq.uid]),JSON.stringify(oppTargets(f)));
  phase('battle');const l0=lp(0);atkTarget(1,f,mq);
  ok('モスキート negative: its own battle damage is not redirected (3000-200 = 2800 to me)',l0-lp(0)===2800,JSON.stringify({loss:l0-lp(0)})); }
{ fresh();const mq=mon('ナチュル・モスキート',0),ot=mon('ナチュル・ビーンズ',0),w=mon('ワイト',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[mq,ot,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);atkTarget(1,f,w);
  ok('モスキート negative: a battle that involves a non-ナチュル is not redirected',l0-lp(0)===2700,JSON.stringify({loss:l0-lp(0)})); }

/* ===== ローズウィップ: the opponent can activate only one Spell / Trap card per turn ===== */
{ fresh();const rw=mon('ナチュル・ローズウィップ',0),e1=mk('おろかな埋葬',1),e2=mk('おろかな埋葬',1);
  gameState.players[0].mz=[rw];gameState.players[1].hand=[e1,e2];baselineA();
  endTurn();
  ok('ローズウィップ: the first Spell is legal for the opponent',legalHand('おろかな埋葬',1,0)===true,'');
  duelActivateFromHand(0);drive();
  ok('ローズウィップ: after one Spell card the second is not legal',legalHand('おろかな埋葬',1,0)===false,JSON.stringify(TOASTS.slice(-2)));
  audit('ローズウィップ'); }
{ fresh();const e1=mk('おろかな埋葬',1),e2=mk('おろかな埋葬',1);
  gameState.players[1].hand=[e1,e2];baselineA();endTurn();duelActivateFromHand(0);drive();
  ok('ローズウィップ control: without it the second Spell is legal',legalHand('おろかな埋葬',1,0)===true,''); }

/* ===== レディバグ: Graveyard → Special Summon on my 「ナチュル」 Synchro Summon; main phase: release for +1000 ATK ===== */
{ fresh();const t=mon('ナチュル・ローズウィップ',0),m=mon('ナチュル・ビーンズ',0),lb=mk('ナチュル・レディバグ',0),be=mk('ナチュル・ビースト',0);
  gameState.players[0].ex=[be];gameState.players[0].mz=[t,m];gameState.players[0].grave=[lb];baselineA();
  ok('レディバグ: precondition — ローズウィップ + ビーンズ make ビースト',exCombos(0,dbOf(be)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(be)).combos));
  doSynchro(be,[t,m]);
  ok('レディバグ: after the 「ナチュル」 Synchro Summon it is Special Summoned from the Graveyard',z(be)==='mz'&&z(lb)==='mz'&&C(lb).face==='up',JSON.stringify({be:z(be),lb:z(lb)}));
  audit('レディバグ ①'); }
{ fresh();const t=mon('ガスタ・ファルコ',0),m=mon('ガスタの巫女 ウィンダ',0),lb=mk('ナチュル・レディバグ',0),fa=mk('ダイガスタ・ファルコス',0);
  gameState.players[0].ex=[fa];gameState.players[0].mz=[t,m];gameState.players[0].grave=[lb];baselineA();
  doSynchro(fa,[t,m]);
  ok('レディバグ negative: a Synchro Summon of a non-「ナチュル」 does not trigger it',z(fa)==='mz'&&z(lb)==='grave',JSON.stringify({fa:z(fa),lb:z(lb)})); }
{ fresh();const lb=mon('ナチュル・レディバグ',0),ot=mon('ナチュル・ビーンズ',0);gameState.players[0].mz=[lb,ot];baselineA();
  const a0=curATK(C(ot));PREFER=[uid(ot)];doAct(lb);PREFER=[];
  ok('レディバグ: released itself; ビーンズ +1000 ATK this turn',z(lb)==='grave'&&curATK(C(ot))===a0+1000,JSON.stringify({lb:z(lb),a:curATK(C(ot)),a0}));
  audit('レディバグ ②');
  endTurn();
  ok('レディバグ: the gain ends with the turn',curATK(C(ot))===a0,String(curATK(C(ot)))); }
{ fresh();const lb=mon('ナチュル・レディバグ',0);gameState.players[0].mz=[lb];baselineA();
  ok('レディバグ negative: alone (no other 「ナチュル」) the effect is not available',canEffect(0,lb)===false,''); }

/* ===== フライトフライ: opponent monsters lose 300 ATK/DEF per 「ナチュル」 of mine; take control of a DEF 0 monster until the End Phase ===== */
{ fresh();const ff=mon('ナチュル・フライトフライ',0),ot=mon('ナチュル・ビーンズ',0),f=mon('青眼の白龍',1),wy=mon('ワイト',1);
  gameState.players[0].mz=[ff,ot];gameState.players[1].mz=[f,wy];baselineA();
  ok('フライトフライ: two 「ナチュル」 → the opponent\'s 青眼 is 3000/2500 − 600 = 2400/1900',curATK(C(f))===2400&&curDEF(C(f))===1900,JSON.stringify([curATK(C(f)),curDEF(C(f))]));
  ok('フライトフライ: ワイト (300/200) has DEF 0 now',curDEF(C(wy))<=0,String(curDEF(C(wy))));
  ok('フライトフライ: my own monsters are not reduced',curATK(C(ot))===dbOf(ot).atk,String(curATK(C(ot))));
  PREFER=[uid(wy)];doAct(ff);PREFER=[];
  ok('フライトフライ: the DEF 0 ワイト is now under my control (青眼 is not)',pl(wy)===0&&pl(f)===1,JSON.stringify({wy:pl(wy),f:pl(f)}));
  ok('フライトフライ: once per turn',canEffect(0,ff)===false,'');
  audit('フライトフライ');
  phase('end');
  ok('フライトフライ: back to the opponent at the End Phase',pl(wy)===1,String(pl(wy))); }
{ fresh();const ff=mon('ナチュル・フライトフライ',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[ff];gameState.players[1].mz=[f];baselineA();
  ok('フライトフライ negative: no DEF 0 monster (青眼 2500−300) → not available',canEffect(0,ff)===false,''); }

/* ===== スタッグ: while it attacks, an opponent card activation lets it Special Summon a 「ナチュル」 from my Graveyard (once per turn) ===== */
{ fresh();const st=mon('ナチュル・スタッグ',0),gv=mk('ナチュル・ガーディアン',0),f=mon('ワイト',1),sc=mk('くず鉄のかかし',1,'down');sc.setTurn=3;
  gameState.players[0].mz=[st];gameState.players[0].grave=[gv];gameState.players[1].mz=[f];gameState.players[1].sz=[sc];baselineA();phase('battle');
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(st),target:idx(f)});
  let trapUsed=false,seen=[];
  for(let k=0;k<400;k++){const w=gameState.processorWaiting;
    if(!trapUsed&&w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind==='attackDeclare'){pointActivateV27(1,'sz',0,1);trapUsed=true;continue;}
    if(pc()){pick();continue;}
    if(gameState.chainWindow&&gameState.chain.length){
      if(offered(0,st)&&seen.indexOf(st.uid)<0){seen.push(st.uid);PREFER=[uid(gv)];duelActivateResponseV2(0,'mz',idx(st));continue;}
      chainPassV2();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    break;}
  PREFER=[];
  ok('スタッグ: the opponent\'s trap activation during my attack → スタッグ offered and used: ガーディアン back from the Graveyard',trapUsed&&seen.length===1&&z(gv)==='mz'&&pl(gv)===0,JSON.stringify({trapUsed,seen,gv:z(gv)}));
  audit('スタッグ'); }
{ fresh();const st=mon('ナチュル・スタッグ',0),gv=mk('ナチュル・ガーディアン',0),e1=mk('おろかな埋葬',1);
  gameState.players[0].mz=[st];gameState.players[0].grave=[gv];gameState.players[1].hand=[e1];baselineA();endTurn();
  duelActivateFromHand(0);toWindow();
  ok('スタッグ negative: the opponent\'s card activation outside of its attack → not offered',offered(0,st)===false,'');
  drive(); }

/* ===== ホワイトオーク: targeted by the opponent's card effect → itself to the Graveyard, Special Summon two Lv4- 「ナチュル」 from the Deck (no attacks, destroyed at my End Phase) ===== */
{ fresh();const wo=mon('ナチュル・ホワイトオーク',0),d1=mk('ナチュル・ガーディアン',0),d2=mk('ナチュル・クリフ',0),d3=mk('ナチュル・ビースト',0),ec=mk('エネミーコントローラー',1);
  gameState.players[0].mz=[wo];gameState.players[0].deck=[d1,d2,mk('ワイト',0),d3];gameState.players[1].hand=[ec];baselineA();
  endTurn();
  PREFER=['yes',uid(wo)];duelActivateFromHand(0);
  const seen=windows([wo]);PREFER=[];
  ok('ホワイトオーク: offered when エネミーコントローラー targeted it',seen.indexOf(wo.uid)>=0,JSON.stringify({seen,z:z(wo)}));
  ok('ホワイトオーク: itself in the Graveyard, ガーディアン and クリフ (Lv4) Special Summoned from the Deck',z(wo)==='grave'&&z(d1)==='mz'&&z(d2)==='mz'&&pl(d1)===0&&pl(d2)===0,JSON.stringify({wo:z(wo),d1:z(d1),d2:z(d2),d3:z(d3)}));
  ok('ホワイトオーク: they cannot attack',cannotAttackNow(C(d1))===true&&cannotAttackNow(C(d2))===true,'');
  audit('ホワイトオーク ①');
  endTurn();
  ok('ホワイトオーク: destroyed at the End Phase of my turn — not before',z(d1)==='mz'&&z(d2)==='mz','');
  phase('end');
  ok('ホワイトオーク: my own End Phase destroyed both',z(d1)==='grave'&&z(d2)==='grave',JSON.stringify({d1:z(d1),d2:z(d2)})); }
{ fresh();const wo=mon('ナチュル・ホワイトオーク',0),d1=mk('ナチュル・ガーディアン',0),d2=mk('ナチュル・クリフ',0),ec=mk('エネミーコントローラー',1);
  gameState.players[0].mz=[wo,mon('ワイト',0)];gameState.players[0].deck=[d1,d2];gameState.players[1].mz=[mon('青眼の白龍',1)];gameState.players[1].hand=[ec];baselineA();
  endTurn();
  PREFER=['yes',uid(gameState.players[0].mz[1])];duelActivateFromHand(0);
  const seen=windows([wo]);PREFER=[];
  ok('ホワイトオーク negative: another monster was the target → not offered',seen.indexOf(wo.uid)<0&&z(wo)==='mz',JSON.stringify({seen,z:z(wo)})); }

console.log('U320 done');
`);
