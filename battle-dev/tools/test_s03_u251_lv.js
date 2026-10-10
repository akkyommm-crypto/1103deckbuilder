/* S03-U251: LV monsters — サイレント・ソードマン LV3 / LV5 / LV7, ホルスの黒炎竜 LV4 / LV6 / LV8 (2011 texts).
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function ctl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function toStandby(turn){gameState.turn=turn;gameState.activePlayer=0;gameState.phase='draw';ensureAllCardUids(gameState);baselineA();phase('standby');}

/* ===== A: サイレント・ソードマン LV3 ① — the opponent's 月の書 targeting it is negated; its controller's own 月の書 is not ===== */
fresh();
let s3=up('サイレント・ソードマン LV3',0);gameState.players[0].mz=[s3];gameState.players[1].hand=[mk('月の書',1)];gameState.activePlayer=1;baselineA();
cast(1,'月の書',[s3.uid]);
ok('A: the opponent\'s 月の書 targeting LV3 — its effect is negated, LV3 stays face-up',z(s3)==='mz'&&C(s3).face==='up'&&gameState.players[1].grave.some(c=>cardName(c)==='月の書'),JSON.stringify({z:z(s3),face:C(s3).face}));
audit('A');
fresh();
s3=up('サイレント・ソードマン LV3',0);gameState.players[0].mz=[s3];gameState.players[0].hand=[mk('月の書',0)];baselineA();
cast(0,'月の書',[s3.uid]);
ok('A2: its controller\'s own 月の書 is not negated — LV3 face-down',z(s3)==='mz'&&C(s3).face==='down',JSON.stringify({face:C(s3).face}));
audit('A2');

/* ===== B: LV3 ② — own Standby Phase: send it to the GY → 「サイレント・ソードマン LV5」 from the Deck; not on the turn it was summoned ===== */
fresh();
s3=up('サイレント・ソードマン LV3',0);s3.summonedTurn=3;let s5=mk('サイレント・ソードマン LV5',0);
gameState.players[0].mz=[s3];gameState.players[0].deck.push(s5);
toStandby(5);
ok('B: Standby Phase — LV3 sent to the GY, LV5 Special Summoned from the Deck',z(s3)==='grave'&&z(s5)==='mz',JSON.stringify({s3:z(s3),s5:z(s5),trig:TRIG}));
audit('B');
fresh();
s3=up('サイレント・ソードマン LV3',0);s3.summonedTurn=5;s5=mk('サイレント・ソードマン LV5',0);
gameState.players[0].mz=[s3];gameState.players[0].deck.push(s5);
toStandby(5);
ok('B2: summoned this turn — the effect is not activated',z(s3)==='mz'&&z(s5)==='deck',JSON.stringify({s3:z(s3),s5:z(s5)}));

/* ===== C: LV5 ① — unaffected by the opponent's Spells (サンダー・ボルト); its controller's own ブラック・ホール still destroys it ===== */
fresh();
s5=up('サイレント・ソードマン LV5',0);let wt=up('ワイト',0);gameState.players[0].mz=[s5,wt];gameState.players[1].hand=[mk('サンダー・ボルト',1)];gameState.activePlayer=1;baselineA();
cast(1,'サンダー・ボルト');
ok('C: the opponent\'s サンダー・ボルト destroys ワイト, not LV5',z(wt)==='grave'&&z(s5)==='mz',JSON.stringify({wt:z(wt),s5:z(s5)}));
audit('C');
fresh();
s5=up('サイレント・ソードマン LV5',0);gameState.players[0].mz=[s5];gameState.players[0].hand=[mk('ブラック・ホール',0)];baselineA();
cast(0,'ブラック・ホール');
ok('C2: its controller\'s own ブラック・ホール destroys it',z(s5)==='grave');

/* ===== D: LV5 ② — a direct attack deals battle damage; the next own Standby Phase: LV5 → LV7 (Deck). LV7 is then properly summoned:
   after it is destroyed, 死者蘇生 can revive it ===== */
fresh();
s5=up('サイレント・ソードマン LV5',0);let s7=mk('サイレント・ソードマン LV7',0);
gameState.players[0].mz=[s5];gameState.players[0].deck.push(s7);gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('D: direct attack — 2300 damage, recorded on LV5',lp(1)===8000-2300&&C(s5).directBattleDamageTurnS03===5,JSON.stringify({lp1:lp(1),t:C(s5).directBattleDamageTurnS03}));
toStandby(7);
ok('D: the next own Standby Phase — LV5 to the GY, LV7 Special Summoned (properly)',z(s5)==='grave'&&z(s7)==='mz'&&C(s7).properlySummonedS03===true,JSON.stringify({s5:z(s5),s7:z(s7),trig:TRIG}));
let mf=mk('聖なるバリア －ミラーフォース－',1,'down');mf.setTurn=6;gameState.players[1].sz=[mf];gameState.phase='battle';ensureAllCardUids(gameState);baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:findCardByUid(s7.uid).index,target:'direct'});
for(let i=0;i<50;i++){ if(toWindow()){ if(offered(1,mf)) duelActivateResponseV2(1,'sz',0); else chainPassV2(); } else break; }
drive();
ok('D: ミラーフォース (a Trap) destroys LV7',z(s7)==='grave',JSON.stringify({s7:z(s7)}));
gameState.phase='main2';gameState.players[0].hand=[mk('死者蘇生',0)];ensureAllCardUids(gameState);baselineA();
cast(0,'死者蘇生',[s7.uid]);
ok('D: 死者蘇生 revives the properly summoned LV7',z(s7)==='mz',JSON.stringify({s7:z(s7),toasts:TOASTS.slice(-2)}));
audit('D');
fresh();
s5=up('サイレント・ソードマン LV5',0);s5.directBattleDamageTurnS03=3;s7=mk('サイレント・ソードマン LV7',0);
gameState.players[0].mz=[s5];gameState.players[0].deck.push(s7);
toStandby(7);
ok('D2: not the next own turn after the damage — not activated',z(s5)==='mz'&&z(s7)==='deck',JSON.stringify({s5:z(s5),s7:z(s7)}));

/* ===== E: LV7 summon condition — another effect cannot Special Summon it from the hand ===== */
fresh();
s7=mk('サイレント・ソードマン LV7',0);gameState.players[0].hand=[s7];baselineA();
const okOther=API.specialSummon(0,'hand',0,'atk','リミッター解除');
ok('E: Special Summon from the hand by another effect is refused',!okOther&&z(s7)==='hand'&&summonOnlyReasonS03(C(s7),null,'死者蘇生')!=='',JSON.stringify({okOther,z:z(s7)}));
ok('E: not Normal Summonable (no Normal Summon method)',normalSummonMethodsFor(dbOf(C(s7)),0,'summon').length===0);

/* ===== F: LV7 ① — the effects of Spells on the field are negated: 強欲な壺 (either player), 山 (a Field Spell's continuous effect) ===== */
fresh();
s7=up('サイレント・ソードマン LV7',0);let be=up('青眼の白龍',1);gameState.players[0].mz=[s7];gameState.players[1].mz=[be];
gameState.players[1].field=mk('山',1,'up');gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
ok('F: 山 does not raise 青眼の白龍 while LV7 is on the field (3000)',curATK(C(be))===3000,JSON.stringify({atk:curATK(C(be))}));
cast(1,'強欲な壺');
ok('F: the opponent\'s 強欲な壺 resolves without drawing',gameState.players[1].hand.length===0&&gameState.players[1].deck.length===6,JSON.stringify({h:gameState.players[1].hand.length,d:gameState.players[1].deck.length}));
gameState.players[0].hand=[mk('強欲な壺',0)];gameState.activePlayer=0;ensureAllCardUids(gameState);baselineA();
cast(0,'強欲な壺');
ok('F: its controller\'s own 強欲な壺 is negated too',gameState.players[0].hand.length===0&&gameState.players[0].deck.length===6,JSON.stringify({h:gameState.players[0].hand.length}));
audit('F');
fresh();
be=up('青眼の白龍',1);gameState.players[1].mz=[be];gameState.players[1].field=mk('山',1,'up');gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
ok('F2 control: without LV7, 山 gives 3200',curATK(C(be))===3200,JSON.stringify({atk:curATK(C(be))}));
cast(1,'強欲な壺');
ok('F2 control: without LV7, 強欲な壺 draws 2',gameState.players[1].hand.length===2&&gameState.players[1].deck.length===4);

/* ===== G: ホルスの黒炎竜 LV4 — control cannot change (心変わり); destroyed a monster by battle → End Phase: LV4 → LV6 ===== */
fresh();
let h4=up('ホルスの黒炎竜 LV4',0);wt=up('ワイト',0);gameState.players[0].mz=[h4,wt];gameState.players[1].hand=[mk('心変わり',1),mk('心変わり',1)];gameState.activePlayer=1;baselineA();
cast(1,'心変わり',[h4.uid]);
ok('G: 心変わり on LV4 — control does not change',ctl(h4)===0&&z(h4)==='mz',JSON.stringify({ctl:ctl(h4)}));
cast(1,'心変わり',[wt.uid]);
ok('G: 心変わり on ワイト still takes it',ctl(wt)===1,JSON.stringify({ctl:ctl(wt)}));
audit('G');
fresh();
h4=up('ホルスの黒炎竜 LV4',0);let h6=mk('ホルスの黒炎竜 LV6',0);wt=up('ワイト',1);
gameState.players[0].mz=[h4];gameState.players[0].deck.push(h6);gameState.players[1].mz=[wt];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('G2: LV4 destroys ワイト by battle — recorded',z(wt)==='grave'&&C(h4).battleKillTurnS03===5,JSON.stringify({wt:z(wt),t:C(h4).battleKillTurnS03}));
phase('main2');phase('end');
ok('G2: End Phase — LV4 to the GY, LV6 Special Summoned from the Deck',z(h4)==='grave'&&z(h6)==='mz',JSON.stringify({h4:z(h4),h6:z(h6),trig:TRIG,ph:gameState.phase}));
audit('G2');
fresh();
h4=up('ホルスの黒炎竜 LV4',0);h6=mk('ホルスの黒炎竜 LV6',0);gameState.players[0].mz=[h4];gameState.players[0].deck.push(h6);baselineA();
phase('end');
ok('G3: no monster destroyed by battle this turn — not activated',z(h4)==='mz'&&z(h6)==='deck',JSON.stringify({h4:z(h4),h6:z(h6)}));

/* ===== H: LV6 — unaffected by Spells (the opponent's ブラック・ホール); battle kill → End Phase: LV6 → LV8 ===== */
fresh();
h6=up('ホルスの黒炎竜 LV6',0);wt=up('ワイト',0);gameState.players[0].mz=[h6,wt];gameState.players[1].hand=[mk('ブラック・ホール',1)];gameState.activePlayer=1;baselineA();
cast(1,'ブラック・ホール');
ok('H: ブラック・ホール destroys ワイト, not LV6',z(wt)==='grave'&&z(h6)==='mz',JSON.stringify({wt:z(wt),h6:z(h6)}));
audit('H');
fresh();
h6=up('ホルスの黒炎竜 LV6',0);let h8=mk('ホルスの黒炎竜 LV8',0);wt=up('ワイト',1);
gameState.players[0].mz=[h6];gameState.players[0].deck.push(h8);gameState.players[1].mz=[wt];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();phase('main2');phase('end');
ok('H2: End Phase — LV6 to the GY, LV8 Special Summoned by LV6\'s effect',z(h6)==='grave'&&z(h8)==='mz',JSON.stringify({h6:z(h6),h8:z(h8),trig:TRIG}));
audit('H2');

/* ===== I: LV8 — negates a Spell activation and destroys it; another effect cannot Special Summon it ===== */
fresh();
h8=up('ホルスの黒炎竜 LV8',0);gameState.players[0].mz=[h8];gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
let offer8=false;
for(let i=0;i<50;i++){ if(toWindow()){ if(gameState.chain.length===1&&offered(0,h8)){ offer8=true; duelActivateResponseV2(0,'mz',0); } else chainPassV2(); } else break; }
drive();
ok('I: LV8 is offered against 強欲な壺 and negates it — destroyed, no draw',offer8&&gameState.players[1].grave.some(c=>cardName(c)==='強欲な壺')&&gameState.players[1].hand.length===0&&gameState.players[1].deck.length===6,JSON.stringify({offer8,h:gameState.players[1].hand.length,d:gameState.players[1].deck.length}));
audit('I');
fresh();
h8=mk('ホルスの黒炎竜 LV8',0);gameState.players[0].hand=[h8];baselineA();
ok('I2: another effect cannot Special Summon LV8 from the hand',!API.specialSummon(0,'hand',0,'atk','リミッター解除')&&z(h8)==='hand');
`);
