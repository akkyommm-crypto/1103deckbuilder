/* S03-U196: 天空の使者 ゼラディアス (engine/1ZZF), 豊穣のアルテミス, 墓守の巫女, 墓守の暗殺者, ジェネクス・ウンディーネ, ゾンビ・マスター,
   魔轟神クルス / 魔轟神獣ケルベラル (onDiscardAnyS03), スクラップ・サーチャー. Real DUEL paths, Replay-audited.
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
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function hi(p,c){return gameState.players[p].hand.indexOf(C(c));}

/* ===== A: ゼラディアス — ① discard it: 天空の聖域 from the Deck; ② destroyed without a face-up 天空の聖域 ===== */
fresh();
let zr=mk('天空の使者 ゼラディアス',0),sa=mk('天空の聖域',0);gameState.players[0].hand=[zr];gameState.players[0].deck.push(sa);baselineA();
duelActivateFromHand(0);drive();
ok('A: ゼラディアス discarded; 天空の聖域 added',z(zr)==='grave'&&z(sa)==='hand');
audit('A');
fresh();
zr=mk('天空の使者 ゼラディアス',0);gameState.players[0].hand=[zr];gameState.players[0].deck.push(mk('天空の聖域',0));gameState.phase='battle';baselineA();
ok('A2: ① not in the Battle Phase',strictScriptLegalityV2('天空の使者 ゼラディアス',0,'hand',0,{}).ok===false);
fresh();
zr=mk('天空の使者 ゼラディアス',0);gameState.players[0].hand=[zr];baselineA();
doNormalSummon(0,'atk');drive();
ok('A3: Normal Summoned without 天空の聖域 — destroyed',z(zr)==='grave'&&C(zr).graveInfo&&C(zr).graveInfo.byDestroy===true);
audit('A3');
fresh();
zr=mk('天空の使者 ゼラディアス',0,'up');let fs=mk('天空の聖域',0,'up'),cy=mk('サイクロン',0);gameState.players[0].mz=[zr];gameState.players[0].field=fs;gameState.players[0].hand=[cy];baselineA();
PREFER=[fs.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A4: with 天空の聖域 it stayed; サイクロン destroyed the Field Spell → ゼラディアス destroyed',z(fs)==='grave'&&z(zr)==='grave');
audit('A4');

/* ===== B: 豊穣のアルテミス — a Counter Trap is activated: its controller draws 1 (forced) ===== */
fresh();
let ar=mk('豊穣のアルテミス',0,'up'),br=mk('魔宮の賄賂',0,'down');br.setTurn=4;let pot=mk('強欲な壺',1);
gameState.players[0].mz=[ar];gameState.players[0].sz=[br];gameState.players[1].hand=[pot];gameState.activePlayer=1;baselineA();TRIG.length=0;
const h0=gameState.players[0].hand.length;
duelActivateFromHand(0);const wB=toWindow();
if(wB&&(getChainResponsesV2(0)||[]).some(r=>r.card===C(br)))duelActivateResponseV2(0,'sz',0);
drive();
ok('B: 魔宮の賄賂 (Counter Trap) activated → アルテミス drew 1',z(pot)==='grave'&&gameState.players[0].hand.length===h0+1&&TRIG.some(t=>/アルテミス/.test(t)),JSON.stringify({h:gameState.players[0].hand.length,h0,TRIG}));
audit('B');

/* ===== C: 墓守の巫女 — 「墓守」 monsters +200 even with a face-up Field Spell ===== */
fresh();
let mk1=mk('墓守の巫女',0,'up'),sc=mk('墓守の偵察者',0,'up'),ot=mk('ワイト',0,'up');gameState.players[0].mz=[mk1,sc,ot];gameState.players[1].field=mk('ウォーターワールド',1,'up');baselineA();
const d0=dbOf(C(sc)).atk,m0=dbOf(C(mk1)).atk;
ok('C: 偵察者 and 巫女 +200 with a face-up Field Spell; ワイト unchanged',curATK(C(sc))===d0+200&&curATK(C(mk1))===m0+200&&curATK(C(ot))===300,JSON.stringify([curATK(C(sc)),d0,curATK(C(mk1)),m0]));

/* ===== D: 墓守の暗殺者 — with ネクロバレー, at its attack declaration: a face-up opponent monster (not only the target) changes position ===== */
fresh();
let as=mk('墓守の暗殺者',0,'up'),nv=mk('王家の眠る谷－ネクロバレー',0,'up'),t1=mk('ワイト',1,'up'),t2=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].mz=[as];gameState.players[0].field=nv;gameState.players[1].mz=[t1,t2];gameState.phase='battle';baselineA();
PREFER=[t2.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();PREFER=[];
ok('D: the attack on ワイト; ブラッド・ヴォルス (not the target) changed to Defense Position',C(t2).pos==='def');
audit('D');

/* ===== E: ジェネクス・ウンディーネ — Normal Summon: a WATER monster from the Deck (cost), ジェネクス・コントローラー to the hand ===== */
fresh();
let un=mk('ジェネクス・ウンディーネ',0),wm=mk('ジェネクス・ウンディーネ',0),gc=mk('ジェネクス・コントローラー',0);
gameState.players[0].hand=[un];gameState.players[0].deck.push(wm,gc);baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('E: the other ウンディーネ (WATER) sent from the Deck; ジェネクス・コントローラー added',z(wm)==='grave'&&z(gc)==='hand');
audit('E');

/* ===== F: ゾンビ・マスター — once per turn: a hand monster to the GY, a Level 4 or lower Zombie from either GY ===== */
fresh();
let zm=mk('ゾンビ・マスター',0,'up'),hm=mk('ブラッド・ヴォルス',0),hm2=mk('ワイト',0),oz=mk('ワイト',1);
gameState.players[0].mz=[zm];gameState.players[0].hand=[hm,hm2];gameState.players[1].grave=[oz];baselineA();
PREFER=[hm.uid,oz.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('F: ブラッド・ヴォルス sent; the opponent’s ワイト special summoned to the controller’s field',z(hm)==='grave'&&z(oz)==='mz'&&findCardByUid(oz.uid).p===0);
ok('F: once per turn',strictScriptLegalityV2('ゾンビ・マスター',0,'mz',0,{}).ok===false);
audit('F');

/* ===== G: 魔轟神 — discarded as a cost (鳳翼の爆風): ケルベラル special summons itself; クルス revives a 魔轟神 ===== */
fresh();
let hb=mk('鳳翼の爆風',0,'down');hb.setTurn=4;let kb=mk('魔轟神獣ケルベラル',0),tg=mk('ワイト',1,'up');
gameState.players[0].sz=[hb];gameState.players[0].hand=[kb];gameState.players[1].mz=[tg];baselineA();
PREFER=[kb.uid,tg.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('G: ケルベラル discarded as the cost → special summoned',z(kb)==='mz');
audit('G');
fresh();
hb=mk('鳳翼の爆風',0,'down');hb.setTurn=4;let kr=mk('魔轟神クルス',0),rv=mk('魔轟神レイヴン',0);tg=mk('ワイト',1,'up');
gameState.players[0].sz=[hb];gameState.players[0].hand=[kr];gameState.players[0].grave=[rv];gameState.players[1].mz=[tg];baselineA();
PREFER=[kr.uid,tg.uid,rv.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('G2: クルス discarded as the cost → 魔轟神レイヴン special summoned',z(kr)==='grave'&&z(rv)==='mz');
audit('G2');
fresh();
kb=mk('魔轟神獣ケルベラル',0);let other=mk('ワイト',0);gameState.players[0].grave=[kb];gameState.players[0].hand=[other];
let hb2=mk('鳳翼の爆風',0,'down');hb2.setTurn=4;tg=mk('ワイト',1,'up');gameState.players[0].sz=[hb2];gameState.players[1].mz=[tg];baselineA();TRIG.length=0;
PREFER=[other.uid,tg.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('G3: another card discarded — the ケルベラル already in the GY does not activate',z(kb)==='grave'&&!TRIG.some(t=>/ケルベラル/.test(t)),JSON.stringify(TRIG));
audit('G3');

/* ===== H: スクラップ・サーチャー — an own 「スクラップ」 destroyed: special summon (optional); then its forced destruction of the own non-「スクラップ」 ===== */
fresh();
let sr=mk('スクラップ・サーチャー',0),sg=mk('スクラップ・ゴブリン',0,'up'),wn=mk('ワイト',0,'up'),sq=mk('スクラップ・スコール',0),sb=mk('スクラップ・ビースト',0);
gameState.players[0].grave=[sr];gameState.players[0].mz=[sg,wn];gameState.players[0].hand=[sq];gameState.players[0].deck.unshift(sb);baselineA();TRIG.length=0;
duelActivateFromHand(0);drive();
ok('H: スクラップ・ゴブリン destroyed by スクラップ・スコール → サーチャー special summoned; ワイト (not 「スクラップ」) destroyed',z(sg)==='grave'&&z(sr)==='mz'&&z(wn)==='grave',JSON.stringify({sg:z(sg),sr:z(sr),wn:z(wn),TRIG}));
ok('H: ② was a forced trigger',triggerCandidateForcedS03({name:'スクラップ・サーチャー',eventName:'onSpecialSummon',ctx:{eventName:'onSpecialSummon'}})===true&&triggerCandidateForcedS03({name:'スクラップ・サーチャー',eventName:'onDestroy',ctx:{eventName:'onDestroy'}})===false);
audit('H');
`);
