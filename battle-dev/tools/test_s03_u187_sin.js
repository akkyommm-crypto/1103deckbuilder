/* S03-U187: 「Sin」 common mechanism (engine/1ZZD) — Sin 青眼の白龍 / 真紅眼の黒竜 / レインボー・ドラゴン / スターダスト・ドラゴン (and Sin サイバー・エンド
   moved onto it): summon by banishing the named card, one face-up 「Sin」, other own monsters cannot attack, destroyed without a Field Spell;
   スターダスト ②: face-up Field Zone cards are not destroyed by effects. Real DUEL paths; Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function sinSummon(name){const i=gameState.players[0].hand.findIndex(c=>cardName(c)===name);finishSummonProcedure(name,0,'hand',i,'atk');drive();}

/* ===== A: Sin 青眼の白龍 — banish 青眼の白龍 from the Deck; other own monsters cannot attack; a second 「Sin」 cannot be summoned ===== */
fresh();
let sb=mk('Sin 青眼の白龍',0),sr=mk('Sin 真紅眼の黒竜',0),be=mk('青眼の白龍',0),re=mk('真紅眼の黒竜',0);gameState.players[0].hand=[sb,sr];gameState.players[0].deck.push(be,re);
gameState.players[0].field=mk('ウォーターワールド',0,'up');let wt=mk('ワイト',0,'up');gameState.players[0].mz=[wt];baselineA();
ok('A: legal with 青眼の白龍 in the Deck',strictSummonProcedureLegality('Sin 青眼の白龍',0,'hand',0).ok===true);
sinSummon('Sin 青眼の白龍');
ok('A: Sin 青眼の白龍 summoned; 青眼の白龍 banished from the Deck; ワイト cannot attack',z(sb)==='mz'&&z(be)==='banish'&&cannotAttackNow(C(wt))===true&&!cannotAttackNow(C(sb)));
const L2=strictSummonProcedureLegality('Sin 真紅眼の黒竜',0,'hand',gameState.players[0].hand.findIndex(c=>cardName(c)==='Sin 真紅眼の黒竜'));
ok('A: while a face-up 「Sin」 exists, Sin 真紅眼の黒竜 cannot be summoned (「Sin」 uniqueness)',L2.ok===false&&/Sin/.test(L2.reason),JSON.stringify(L2));
audit('A');

/* ===== B: Sin レインボー・ドラゴン — from the hand or the Deck: the player picks the copy ===== */
fresh();
let rb=mk('Sin レインボー・ドラゴン',0),uh=mk('究極宝玉神 レインボー・ドラゴン',0),ud=mk('究極宝玉神 レインボー・ドラゴン',0);gameState.players[0].hand=[rb,uh];gameState.players[0].deck.push(ud);
gameState.players[0].field=mk('ウォーターワールド',0,'up');baselineA();
PREFER=[ud.uid];sinSummon('Sin レインボー・ドラゴン');PREFER=[];
ok('B: the chosen copy from the Deck banished; the one in the hand stays',z(rb)==='mz'&&z(ud)==='banish'&&z(uh)==='hand');
audit('B');

/* ===== C: Sin スターダスト・ドラゴン — from the EX Deck; the face-up Field Spell is not destroyed by the opponent's サイクロン ===== */
fresh();
let ss=mk('Sin スターダスト・ドラゴン',0),sd=mk('スターダスト・ドラゴン',0);gameState.players[0].hand=[ss];gameState.players[0].ex=[sd];
let fw=mk('ウォーターワールド',0,'up');gameState.players[0].field=fw;let cy=mk('サイクロン',1);gameState.players[1].hand=[cy];baselineA();
sinSummon('Sin スターダスト・ドラゴン');
ok('C: summoned; スターダスト・ドラゴン banished from the EX Deck',z(ss)==='mz'&&z(sd)==='banish');
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'standby'});drive();requestProcessorV27(PROCESSOR_V27.PHASE,{to:'main1'});drive();
PREFER=[fw.uid];duelActivateFromHand(gameState.players[1].hand.indexOf(C(cy)));drive();PREFER=[];
ok('C: the opponent’s サイクロン on ウォーターワールド — not destroyed (Sin スターダスト ②); Sin スターダスト stays',z(fw)==='field'&&z(cy)==='grave'&&z(ss)==='mz');
audit('C');

/* ===== D: an effect cannot Special Summon a second 「Sin」 while one is face-up ===== */
fresh();
let s1=mk('Sin サイバー・エンド・ドラゴン',0,'up');gameState.players[0].mz=[s1];gameState.players[0].field=mk('ウォーターワールド',0,'up');
let g2=mk('Sin 青眼の白龍',0);g2.properlySummonedS03=true;gameState.players[0].grave=[g2];baselineA();
ok('D: a properly summoned Sin 青眼の白龍 in the GY is not a candidate while a face-up 「Sin」 exists',canEffectSpecialSummonS03(g2,'grave','死者蘇生')===false);
ok('D: API.specialSummon refuses it',API.specialSummon(0,'grave',0,'atk','死者蘇生')===false&&z(g2)==='grave');

/* ===== E: no face-up Field Spell → the 「Sin」 monster is destroyed ===== */
fresh();
let sr2=mk('Sin 真紅眼の黒竜',0),re2=mk('真紅眼の黒竜',0);gameState.players[0].hand=[sr2];gameState.players[0].deck.push(re2);let f2=mk('ウォーターワールド',0,'up');gameState.players[0].field=f2;baselineA();
sinSummon('Sin 真紅眼の黒竜');
ok('E: Sin 真紅眼の黒竜 summoned (真紅眼の黒竜 banished from the Deck)',z(sr2)==='mz'&&z(re2)==='banish');
act({type:'FX_TO_GRAVE',player:0,zone:'field',index:0,reason:'test',byDestroy:true});drive();
ok('E: the Field Spell left → destroyed',z(sr2)==='grave');
`);
