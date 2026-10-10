/* S03-U184: 剣闘獣 stage 3 — ダリウス (revive with negated effects; the revived monster returns to the Deck when ダリウス leaves: v9 link
   'toDeck'), ラニスタ (banish a GY 「剣闘獣」, same name until the End Phase), 剣闘訓練所, ハンディキャップマッチ!, スレイブタイガー.
   Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(ph){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase=ph||'battle';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:4},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
/* PREFER is a queue: an entry is consumed when it is picked */
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(p,a,t){const ai=gameState.players[p].mz.indexOf(C(a)),ti=gameState.players[p===0?1:0].mz.indexOf(C(t));requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
function trig(name){return TRIG.some(g=>g.indexOf(name)>=0);}

/* ===== A: ダリウス (brought by ホプロムス) revives ラクエル with its effects negated (no 「剣闘獣」-summon ATK 2100: 1800); when ダリウス leaves,
   ラクエル returns to the Deck ===== */
fresh();
let hp=mk('剣闘獣ホプロムス',0,'up'),da=mk('剣闘獣ダリウス',0),mu=mk('剣闘獣ラクエル',0);gameState.players[0].mz=[hp];gameState.players[0].deck.push(da);gameState.players[0].grave=[mu];
let w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];gameState.players[1].hand=[mk('地割れ',1)];baselineA();
attack(0,hp,w1);TRIG=[];PREFER=[da.uid,'atk',mu.uid,'atk'];phase('main2');PREFER=[];
ok('A: ダリウス summoned by the tag-out revives ラクエル — its effects are negated (ATK 1800, not 2100)',
  z(da)==='mz'&&z(mu)==='mz'&&effectNegated(C(mu))&&curATK(C(mu))===1800&&C(mu).gladiatorSummonedS03===true,JSON.stringify({da:z(da),mu:z(mu),atk:z(mu)==='mz'&&curATK(C(mu))}));
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');
duelActivateFromHand(0);drive();
ok('A: the opponent’s 地割れ destroys ダリウス (lowest ATK) → ラクエル returns to its owner’s Deck',z(da)==='grave'&&z(mu)==='deck',JSON.stringify({da:z(da),mu:z(mu)}));
audit('A');

/* ===== B: ラニスタ banishes 剣闘獣ラクエル from its GY and is treated as 「剣闘獣ラクエル」 until the End Phase ===== */
fresh();
hp=mk('剣闘獣ホプロムス',0,'up');let la=mk('剣闘獣ラニスタ',0),rq=mk('剣闘獣ラクエル',0);gameState.players[0].mz=[hp];gameState.players[0].deck.push(la);gameState.players[0].grave=[rq];
w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
attack(0,hp,w1);PREFER=[la.uid,'atk',rq.uid];phase('main2');PREFER=[];
ok('B: ラクエル banished; ラニスタ’s name is 「剣闘獣ラクエル」',z(la)==='mz'&&z(rq)==='banish'&&currentNameV17(C(la))==='剣闘獣ラクエル');
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('B: after the End Phase its name is ラニスタ again',currentNameV17(C(la))==='剣闘獣ラニスタ');
audit('B');

/* ===== C: 剣闘訓練所 adds a Level 4 or lower 「剣闘獣」 (スパルティクス, Lv5, is not offered) ===== */
fresh('main1');
let tr=mk('剣闘訓練所',0),a1=mk('剣闘獣アンダル',0),sp=mk('剣闘獣スパルティクス',0);gameState.players[0].hand=[tr];gameState.players[0].deck.push(sp,a1);baselineA();
PREFER=[sp.uid,a1.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('C: アンダル added (Level 5 スパルティクス not a candidate)',z(a1)==='hand'&&z(sp)==='deck');
audit('C');

/* ===== D: ハンディキャップマッチ! — after the tag-out special summons a 「剣闘獣」, the set trap summons a Level 4 or lower one from the Deck ===== */
fresh();
hp=mk('剣闘獣ホプロムス',0,'up');let an=mk('剣闘獣アンダル',0),rq2=mk('剣闘獣ラクエル',0);gameState.players[0].mz=[hp];gameState.players[0].deck.push(an,rq2);
let hm=mk('ハンディキャップマッチ!',0,'down');hm.setTurn=4;gameState.players[0].sz=[hm];w1=mk('ワイト',1,'up');gameState.players[1].mz=[w1];baselineA();
attack(0,hp,w1);TRIG=[];PREFER=[an.uid,'atk',rq2.uid];phase('main2');PREFER=[];
ok('D: ハンディキャップマッチ! was offered after アンダル’s summon and summoned ラクエル (not gladiator-summoned: base ATK 1800)',
  trig('ハンディキャップマッチ!')&&z(an)==='mz'&&z(rq2)==='mz'&&curATK(C(rq2))===1800&&z(hm)==='grave',JSON.stringify({TRIG,an:z(an),rq2:z(rq2)}));
audit('D');

/* ===== E: スレイブタイガー — ① from the hand with a 「剣闘獣」 on the field; ② release it: ホプロムス back to the Deck, ラクエル summoned as
   「剣闘獣」-summoned (base ATK 2100) ===== */
fresh('main1');
hp=mk('剣闘獣ホプロムス',0,'up');let st=mk('スレイブタイガー',0);gameState.players[0].mz=[hp];gameState.players[0].hand=[st];let rq3=mk('剣闘獣ラクエル',0);gameState.players[0].deck.push(rq3);baselineA();
finishSummonProcedure('スレイブタイガー',0,'hand',0,'atk');drive();
ok('E: ① スレイブタイガー special summoned from the hand',z(st)==='mz');
PREFER=[hp.uid,rq3.uid,'atk'];duelActivateFromZone(0,'mz',findCardByUid(st.uid).index);drive();PREFER=[]
ok('E: ② released; ホプロムス to the Deck; ラクエル summoned and treated as 「剣闘獣」-summoned (ATK 2100)',z(st)==='grave'&&z(hp)==='deck'&&z(rq3)==='mz'&&curATK(C(rq3))===2100,JSON.stringify({st:z(st),hp:z(hp),rq3:z(rq3),atk:z(rq3)==='mz'&&curATK(C(rq3))}));
audit('E');
`);
