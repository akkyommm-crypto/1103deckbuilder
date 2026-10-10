/* S03-U188: staple cards that had scripts but no dedicated test — 大嵐, D.D.クロウ, 魔法の筒, 炸裂装甲, 洗脳－ブレインコントロール, 成金ゴブリン, 突進,
   終焉の焔, ライトニング・ボルテックス, デモンズ・チェーン. Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function hand(p,c){return gameState.players[p].hand.indexOf(C(c));}

/* ===== A: 大嵐 — every Spell / Trap on the field destroyed (both sides, field zone too) ===== */
fresh();
let st=mk('大嵐',0),a1=mk('サイクロン',0,'down'),b1=mk('聖なるバリア －ミラーフォース－',1,'down'),f1=mk('ウォーターワールド',1,'up');
gameState.players[0].hand=[st];gameState.players[0].sz=[a1];gameState.players[1].sz=[b1];gameState.players[1].field=f1;baselineA();
duelActivateFromHand(0);drive();
ok('A: 大嵐 destroyed both sides’ Spell / Trap cards and the Field Spell',z(a1)==='grave'&&z(b1)==='grave'&&z(f1)==='grave'&&z(st)==='grave');
audit('A');

/* ===== B: D.D.クロウ — discard it from the hand, target a card in the opponent's GY: banish it ===== */
fresh();
let dd=mk('D.D.クロウ',0),og=mk('死者蘇生',1),og2=mk('ワイト',1);gameState.players[0].hand=[dd];gameState.players[1].grave=[og,og2];baselineA();
PREFER=[og.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: D.D.クロウ discarded; the chosen 死者蘇生 banished from the opponent’s GY',z(dd)==='grave'&&z(og)==='banish'&&z(og2)==='grave');
audit('B');

/* ===== C: 魔法の筒 / 炸裂装甲 at the opponent's attack declaration ===== */
fresh();
let cyl=mk('魔法の筒',0,'down');cyl.setTurn=4;gameState.players[0].sz=[cyl];gameState.players[0].mz=[mk('ワイト',0,'up')];
let gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];gameState.activePlayer=1;gameState.phase='battle';baselineA();
const lp1=gameState.players[1].lp,lp0=gameState.players[0].lp;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
const atP=toPoint('attackDeclare');const offC=atP&&(getChainResponsesV2(0)||[]).some(r=>r.card===cyl);
if(offC){PREFER=[gi.uid];pointActivateV27(0,'sz',0);}
drive();PREFER=[];
ok('C: 魔法の筒 — the attack negated and its controller takes 1900; Player1 takes no damage',offC&&gameState.players[1].lp===lp1-1900&&gameState.players[0].lp===lp0&&z(gi)==='mz',JSON.stringify({offC,lp1:gameState.players[1].lp,lp0:gameState.players[0].lp}));
audit('C');
fresh();
let sa=mk('炸裂装甲',0,'down');sa.setTurn=4;gameState.players[0].sz=[sa];gameState.players[0].mz=[mk('ワイト',0,'up')];
gi=mk('ギガンテス',1,'up');gameState.players[1].mz=[gi];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
const atS=toPoint('attackDeclare');const offS=atS&&(getChainResponsesV2(0)||[]).some(r=>r.card===sa);
if(offS){PREFER=[gi.uid];pointActivateV27(0,'sz',0);}
drive();PREFER=[];
ok('C: 炸裂装甲 — the attacking ギガンテス destroyed',offS&&z(gi)==='grave');
audit('C2');

/* ===== D: 洗脳－ブレインコントロール — pay 800, take control of a face-up opponent monster until the End Phase ===== */
fresh();
let bc=mk('洗脳－ブレインコントロール',0);gi=mk('ギガンテス',1,'up');gameState.players[0].hand=[bc];gameState.players[1].mz=[gi];baselineA();
const lpD=gameState.players[0].lp;
PREFER=[gi.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: 800 paid; ギガンテス controlled by Player1',gameState.players[0].lp===lpD-800&&findCardByUid(gi.uid).p===0);
phase('battle');phase('main2');phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('D: control returned at the End Phase',findCardByUid(gi.uid).p===1);
audit('D');

/* ===== E: 成金ゴブリン — draw 1, the opponent gains 1000 ===== */
fresh();
let ng=mk('成金ゴブリン',0);gameState.players[0].hand=[ng];baselineA();
const h0=gameState.players[0].hand.length,lpE=gameState.players[1].lp;
duelActivateFromHand(0);drive();
ok('E: drew 1 (the spell left the hand), the opponent gained 1000',gameState.players[0].hand.length===h0&&gameState.players[1].lp===lpE+1000);
audit('E');

/* ===== F: 突進 — a face-up monster gains 700 until the end of the turn ===== */
fresh();
let ts=mk('突進',0),w1=mk('ワイト',0,'up');gameState.players[0].hand=[ts];gameState.players[0].mz=[w1];baselineA();
PREFER=[w1.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F: ワイト 300 + 700 = 1000',curATK(C(w1))===1000);
phase('battle');phase('main2');phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('F: back to 300 next turn',curATK(C(w1))===300);
audit('F');

/* ===== G: 終焉の焔 — 2 黒焔トークン in Defense Position; no other summon this turn ===== */
fresh();
let sh=mk('終焉の焔',0),n1=mk('ワイト',0);gameState.players[0].hand=[sh,n1];baselineA();
duelActivateFromHand(0);drive();
const toks=gameState.players[0].mz.filter(c=>c.token);
ok('G: 2 黒焔トークン special summoned in Defense Position',toks.length===2&&toks.every(c=>c.pos==='def'&&cardName(c)==='黒焔トークン'));
const L=getLegalHandActions(0,gameState.players[0].hand.indexOf(C(n1)));
ok('G: no other Normal Summon this turn',!L.some(a=>a.id==='normalSummon'),JSON.stringify(L.map(a=>a.id)));
audit('G');

/* ===== H: ライトニング・ボルテックス — discard 1: every face-up monster the opponent controls destroyed (not the face-down one) ===== */
fresh();
let lv=mk('ライトニング・ボルテックス',0),dh=mk('ワイト',0);gameState.players[0].hand=[lv,dh];
let u1=mk('ギガンテス',1,'up'),u2=mk('ワイト',1,'up'),dn=mk('ワイト',1,'down','def');gameState.players[1].mz=[u1,u2,dn];baselineA();
PREFER=[dh.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('H: the discarded card in the GY; both face-up opponent monsters destroyed; the face-down one stays',z(dh)==='grave'&&z(u1)==='grave'&&z(u2)==='grave'&&z(dn)==='mz');
audit('H');

/* ===== I: デモンズ・チェーン — the targeted effect monster cannot attack and is negated; when it is destroyed, the chain is destroyed ===== */
fresh();
let dc=mk('デモンズ・チェーン',0,'down');dc.setTurn=4;gameState.players[0].sz=[dc];
let sc=mk('N・フレア・スカラベ',1,'up');gameState.players[1].mz=[sc];gameState.players[1].hand=[mk('地割れ',1)];let myw=mk('ワイト',0,'up');gameState.players[0].mz=[myw];baselineA();
PREFER=[sc.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('I: スカラベ negated and cannot attack',effectNegated(C(sc))&&cannotAttackNow(C(sc)));
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'test',byDestroy:true});drive();
ok('I: スカラベ destroyed → デモンズ・チェーン destroyed',z(sc)==='grave'&&z(dc)==='grave');
audit('I');

/* ===== I2: the chain on the controller's own effect monster; the monster returned to the hand → the chain stays, the link ends ===== */
fresh();
dc=mk('デモンズ・チェーン',0,'down');dc.setTurn=4;gameState.players[0].sz=[dc];
let own=mk('N・フレア・スカラベ',0,'up');gameState.players[0].mz=[own];baselineA();
ok('I2: activatable with only an own face-up effect monster (the text: フィールド上の効果モンスター)',
  strictScriptLegalityV2('デモンズ・チェーン',0,'sz',0,{}).ok===true);
PREFER=[own.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('I2: the own スカラベ cannot attack and is negated',effectNegated(C(own))&&cannotAttackNow(C(own)));
act({type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'test'});drive();
ok('I2: returned to the hand (not destroyed) → デモンズ・チェーン stays; its link has ended',z(own)==='hand'&&z(dc)==='sz'&&!C(dc).linkV9);
audit('I2');

/* ===== I3: デモンズ・チェーン leaves the field → the monster is no longer negated (no permanent negation) ===== */
fresh();
dc=mk('デモンズ・チェーン',0,'down');dc.setTurn=4;gameState.players[0].sz=[dc];
sc=mk('N・フレア・スカラベ',1,'up');gameState.players[1].mz=[sc];baselineA();
PREFER=[sc.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('I3: negated while the chain is face-up',effectNegated(C(sc))===true);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'test',byDestroy:true});drive();
ok('I3: the chain destroyed → スカラベ not negated, may attack; スカラベ stays',z(dc)==='grave'&&z(sc)==='mz'&&!effectNegated(C(sc))&&!cannotAttackNow(C(sc)));
audit('I3');

/* ===== G2: 終焉の焔 cannot be activated after a summon this turn ===== */
fresh();
sh=mk('終焉の焔',0);let ns=mk('ワイト',0);gameState.players[0].hand=[ns,sh];baselineA();
const LG=getLegalHandActions(0,0);const nsAct=LG.find(a=>a.id==='normalSummon');
if(nsAct){doNormalSummon(0,'atk');drive();}
const why=strictScriptLegalityV2('終焉の焔',0,'hand',gameState.players[0].hand.indexOf(C(sh)),{});
ok('G2: after the Normal Summon of ワイト, 終焉の焔 is not activatable',z(ns)==='mz'&&why.ok===false,JSON.stringify(why));

/* ===== G3: 黒焔トークン — not a tribute for a non-DARK Tribute Summon (サイバー・ドラゴン), a tribute for a DARK one (デーモンの召喚) ===== */
fresh();
sh=mk('終焉の焔',0);gameState.players[0].hand=[sh];baselineA();
duelActivateFromHand(0);drive();
ok('G3: the tokens are on the field',gameState.players[0].mz.filter(c=>c.token).length===2);
const cyb=dbOf(mk('サイバー・ドラゴン',0)),dem=dbOf(mk('デーモンの召喚',0));
ok('G3: tribute candidates — サイバー・ドラゴン (LIGHT) 0, デーモンの召喚 (DARK) 2',tributeCandidatesForV23(0,cyb,null,'summon').length===0&&tributeCandidatesForV23(0,dem,null,'summon').length===2);
ok('G3: a Tribute Summon of サイバー・ドラゴン has no method; デーモンの召喚 has one',normalSummonMethodsFor(cyb,0,'summon').every(m=>!m.tributes)&&normalSummonMethodsFor(dem,0,'summon').some(m=>m.tributes===1));
audit('G3');
`);
