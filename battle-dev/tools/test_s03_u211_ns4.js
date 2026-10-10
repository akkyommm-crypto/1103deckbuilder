/* S03-U211: NOT_STARTED → TESTED — A・O・J D.D.チェッカー, 魔轟神ミーズトージ, ドラゴンに乗るワイバーン, マジカルフィシアリスト, E・HERO クノスペ, 超古代恐獣
   (engine: specialSummonLockS03; face-up-only characteristic mods end when turned face-down). Real DUEL paths, Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}

/* ===== A: A・O・J D.D.チェッカー — neither player can special summon a LIGHT monster ===== */
fresh();
let dd=mk('A・O・J D.D.チェッカー',1,'up'),sp=mk('E・HERO スパークマン',0),wt=mk('ワイト',0),mr=mk('死者蘇生',0);
gameState.players[1].mz=[dd];gameState.players[0].grave=[sp,wt];gameState.players[0].hand=[mr];baselineA();
ok('A: the LIGHT lock applies to both players; a DARK monster is not locked',
  /D\.D\.チェッカー/.test(v46SpecialSummonRestrictionReason(0,dbOf(sp)))&&/D\.D\.チェッカー/.test(v46SpecialSummonRestrictionReason(1,dbOf(sp)))&&v46SpecialSummonRestrictionReason(0,dbOf(wt))==='');
PREFER=[sp.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: 死者蘇生 cannot bring back スパークマン (LIGHT); ワイト (DARK) is summoned',z(sp)==='grave'&&z(wt)==='mz',JSON.stringify({sp:z(sp),wt:z(wt),T:TOASTS.slice(-2)}));
audit('A');
fresh();
dd=mk('A・O・J D.D.チェッカー',1,'down','def');sp=mk('E・HERO スパークマン',0);gameState.players[1].mz=[dd];gameState.players[0].grave=[sp];baselineA();
ok('A2: a face-down D.D.チェッカー locks nothing',v46SpecialSummonRestrictionReason(0,dbOf(sp))==='');

/* ===== B: 魔轟神ミーズトージ — sent from the hand (cost): a non-Tuner 「魔轟神」 becomes a Tuner while face-up ===== */
fresh();
let mz=mk('魔轟神ミーズトージ',0),av=mk('魔轟神アシェンヴェイル',0,'up'),sb=mk('セイバーザウルス',0,'up'),sd=mk('スクラップ・ドラゴン',0);
gameState.players[0].hand=[mz];gameState.players[0].mz=[av,sb];gameState.players[0].ex=[sd];baselineA();
ok('B: before — アシェンヴェイル is not a Tuner; no Synchro combination',!isTunerNowV17(C(av))&&!exCombos(0,dbOf(sd)).combos.length);
PREFER=[av.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: ミーズトージ sent to the GY; アシェンヴェイル treated as a Tuner',z(mz)==='grave'&&isTunerNowV17(C(av)));
const cbB=exCombos(0,dbOf(sd)).combos.find(c=>c.materials.length===2);
if(cbB)beginExSummonV2(0,0,cbB.materials,'synchro','atk');drive();
ok('B: スクラップ・ドラゴン Synchro Summoned with アシェンヴェイル as the Tuner',!!cbB&&z(sd)==='mz'&&z(av)==='grave'&&z(sb)==='grave');
audit('B');
fresh();
mz=mk('魔轟神ミーズトージ',0);av=mk('魔轟神アシェンヴェイル',0,'up');gameState.players[0].hand=[mz];gameState.players[0].mz=[av];baselineA();
PREFER=[av.uid];duelActivateFromHand(0);drive();PREFER=[];
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down',pos:'def',reason:'test'});
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'up',pos:'atk',reason:'test'});
ok('B2: turned face-down and back — no longer a Tuner',z(mz)==='grave'&&!isTunerNowV17(C(av)));
fresh();
mz=mk('魔轟神ミーズトージ',0);gameState.players[0].hand=[mz];gameState.players[0].mz=[mk('ワイト',0,'up')];baselineA();
ok('B3: no non-Tuner 「魔轟神」 — not activatable',strictScriptLegalityV2('魔轟神ミーズトージ',0,'hand',0,{}).ok===false);

/* ===== C: ドラゴンに乗るワイバーン — direct attack when the opponent's face-up monsters are all EARTH / WATER / FIRE ===== */
fresh();
let wy=mk('ドラゴンに乗るワイバーン',0,'up'),om=mk('セイバーザウルス',1,'up');gameState.players[0].mz=[wy];gameState.players[1].mz=[om];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('C: direct attack past セイバーザウルス (EARTH)',lp(1)===8000-dbOf(wy).atk&&z(om)==='mz',JSON.stringify({lp:lp(1),T:TOASTS.slice(-2)}));
audit('C');
fresh();
wy=mk('ドラゴンに乗るワイバーン',0,'up');gameState.players[0].mz=[wy];gameState.players[1].mz=[mk('セイバーザウルス',1,'up'),mk('E・HERO スパークマン',1,'up')];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('C2: a LIGHT monster among them — no direct attack',lp(1)===8000);
fresh();
wy=mk('ドラゴンに乗るワイバーン',0,'up');gameState.players[0].mz=[wy];gameState.players[1].mz=[mk('セイバーザウルス',1,'down','def')];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('C3: only a face-down monster — no direct attack',lp(1)===8000);

/* ===== D: マジカルフィシアリスト — Normal Summon: 1 Spell Counter (max 1); remove it (cost): a monster +500 ATK until the End Phase ===== */
fresh();
let ph=mk('マジカルフィシアリスト',0),w2=mk('ワイト',0,'up');gameState.players[0].hand=[ph];gameState.players[0].mz=[w2];baselineA();
doNormalSummon(0,'atk');drive();
ok('D: summoned — 1 Spell Counter',((C(ph).counters||{})['魔力']||0)===1);
const aw=curATK(C(w2));
PREFER=[w2.uid];duelActivateFromZone(0,'mz',1);drive();PREFER=[];
ok('D: counter removed; ワイト +500',((C(ph).counters||{})['魔力']||0)===0&&curATK(C(w2))===aw+500,JSON.stringify({c:C(ph).counters,a:curATK(C(w2)),aw}));
ok('D: no counter — the ignition is not activatable',strictScriptLegalityV2('マジカルフィシアリスト',0,'mz',1,{}).ok===false);
phase('battle');phase('main2');phase('end');
const atEnd=curATK(C(w2));requestProcessorV27(PROCESSOR_V27.TURN);drive();
ok('D: the boost lasts until the End Phase, then ends',atEnd===aw+500&&curATK(C(w2))===aw,JSON.stringify({atEnd,now:curATK(C(w2)),ph:gameState.phase,t:gameState.turn}));
audit('D');

/* ===== E: E・HERO クノスペ — +100 ATK / -100 DEF per battle damage; with another E・HERO: direct attack, not an attack target ===== */
fresh();
let kn=mk('E・HERO クノスペ',0,'up'),cl=mk('E・HERO クレイマン',0,'up');om=mk('ワイト',1,'up');
gameState.players[0].mz=[kn,cl];gameState.players[1].mz=[om];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('E: direct attack (600); then ATK 700 / DEF 900',lp(1)===7400&&curATK(C(kn))===700&&curDEF(C(kn))===900,JSON.stringify({lp:lp(1),a:curATK(C(kn)),d:curDEF(C(kn))}));
ok('E: the opponent cannot choose クノスペ as an attack target',!!attackTargetForbiddenReasonS03(1,C(kn))&&!attackTargetForbiddenReasonS03(1,C(cl)));
audit('E');
fresh();
kn=mk('E・HERO クノスペ',0,'up');om=mk('ワイト',1,'up');gameState.players[0].mz=[kn];gameState.players[1].mz=[om];gameState.phase='battle';baselineA();
ok('E2: alone — an attack target again',!attackTargetForbiddenReasonS03(1,C(kn)));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('E2: alone — no direct attack past ワイト',lp(1)===8000&&curATK(C(kn))===600);

/* ===== F: 超古代恐獣 — Tribute Summon with 1 Dinosaur; a Dinosaur special summoned from its controller's GY: draw 1 ===== */
fresh();
let ud=mk('超古代恐獣',0);sb=mk('セイバーザウルス',0,'up');gameState.players[0].hand=[ud];gameState.players[0].mz=[sb];baselineA();
PREFER=[sb.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('F: Tribute Summoned with 1 Dinosaur (セイバーザウルス)',z(ud)==='mz'&&z(sb)==='grave'&&C(ud).pos==='atk');
audit('F');
fresh();
ud=mk('超古代恐獣',0);gameState.players[0].hand=[ud];gameState.players[0].mz=[mk('ワイト',0,'up')];baselineA();
doNormalSummon(0,'atk');drive();
ok('F2: 1 non-Dinosaur — no Tribute Summon',z(ud)==='hand');
fresh();
ud=mk('超古代恐獣',0,'up');sb=mk('セイバーザウルス',0);mr=mk('死者蘇生',0);gameState.players[0].mz=[ud];gameState.players[0].grave=[sb];gameState.players[0].hand=[mr];baselineA();
PREFER=[sb.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F3: セイバーザウルス revived from the GY → draw 1',z(sb)==='mz'&&gameState.players[0].hand.length===1&&TRIG.some(t=>/超古代恐獣/.test(t)),JSON.stringify({h:gameState.players[0].hand.length,TRIG}));
audit('F3');
fresh();
ud=mk('超古代恐獣',0,'up');wt=mk('ワイト',0);mr=mk('死者蘇生',0);gameState.players[0].mz=[ud];gameState.players[0].grave=[wt];gameState.players[0].hand=[mr];baselineA();TRIG.length=0;
duelActivateFromHand(0);drive();
ok('F4: a non-Dinosaur revived — no draw',z(wt)==='mz'&&gameState.players[0].hand.length===0&&!TRIG.some(t=>/超古代恐獣/.test(t)));
`);
