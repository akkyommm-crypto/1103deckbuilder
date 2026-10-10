/* S03-U186: sample-deck cards that had scripts but no dedicated test (IMPLEMENTED) — 強制転移, 禁じられた聖杯, 馬頭鬼, 裁きの龍, ダブルコストン /
   カイザー・シーホース / トロイホース (2 Tributes for an attribute), 可変機獣 ガンナードラゴン, Sin サイバー・エンド・ドラゴン, No.11 ビッグ・アイ.
   Real DUEL paths; Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
/* the harness stubs openPick (DOM-only legacy pick): capture its items so the test can answer it like the UI */
openPick=function(t,n,items,oc){PICK_ITEMS=items;PICK_CANCEL=oc||null;};
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.label===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function domPick(){if(typeof PICK_ITEMS==='undefined'||!PICK_ITEMS||!PICK_ITEMS.length)return false;let k=-1,j=-1;for(k=0;k<PREFER.length;k++){j=PICK_ITEMS.findIndex(it=>it.label===PREFER[k]);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__pick(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(domPick())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function handIdx(c){return gameState.players[gameState.activePlayer].hand.indexOf(C(c));}

/* ===== A: 強制転移 — each player picks one own monster and the controls swap; they cannot change position this turn ===== */
fresh();
let a0=mk('ワイト',0,'up'),b1=mk('ギガンテス',1,'up'),fx=mk('強制転移',0);gameState.players[0].mz=[a0];gameState.players[1].mz=[b1];gameState.players[0].hand=[fx];baselineA();
duelActivateFromHand(0);drive();
ok('A: 強制転移 — ワイト now controlled by Player2, ギガンテス by Player1',findCardByUid(a0.uid).p===1&&findCardByUid(b1.uid).p===0);
ok('A: the swapped monsters cannot change their position this turn',API.cannotChangePosition(findCardByUid(b1.uid))===true);
audit('A');

/* ===== B: 禁じられた聖杯 — the target gains 400 and its effects are negated until the end of the turn ===== */
fresh();
let sc=mk('N・フレア・スカラベ',1,'up');gameState.players[1].mz=[sc];gameState.players[0].sz=[mk('サイクロン',0,'down'),mk('聖なるバリア －ミラーフォース－',0,'down')];let gr=mk('禁じられた聖杯',0);gameState.players[0].hand=[gr];baselineA();
const scAtk0=curATK(C(sc));
PREFER=[sc.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: スカラベ 1300 (500 + 2 opponent Spell / Trap cards × 400) → negated and +400: 900',scAtk0===1300&&effectNegated(C(sc))&&curATK(C(sc))===900,JSON.stringify({scAtk0,now:curATK(C(sc))}));
nextTurn();
ok('B: next turn — the negation and the +400 are gone (1300 again)',!effectNegated(C(sc))&&curATK(C(sc))===1300);
audit('B');

/* ===== C: 馬頭鬼 — banish it from the GY in the Main Phase, revive a Zombie from the GY ===== */
fresh();
let mz=mk('馬頭鬼',0),zb=mk('さまよえる亡者',0);gameState.players[0].grave=[mz,zb];baselineA();
PREFER=[zb.uid];duelActivateFromZone(0,'grave',0);drive();PREFER=[];
ok('C: 馬頭鬼 banished, さまよえる亡者 special summoned',z(mz)==='banish'&&z(zb)==='mz');
audit('C');

/* ===== D: 裁きの龍 — Special Summon with 4 different ライトロード in the GY; ① pay 1000: destroy every other card; ② own End Phase mill 4 ===== */
fresh();
let jd=mk('裁きの龍',0);gameState.players[0].hand=[jd];
gameState.players[0].grave=['ライトロード・エンジェル ケルビム','ライトロード・スピリット シャイア','ライトロード・ハンター ライコウ','ライトロード・パラディン ジェイン'].map(n=>mk(n,0));
let o1=mk('ギガンテス',1,'up'),o2=mk('サイクロン',1,'down'),me2=mk('ワイト',0,'up');gameState.players[1].mz=[o1];gameState.players[1].sz=[o2];gameState.players[0].mz=[me2];baselineA();
finishSummonProcedure('裁きの龍',0,'hand',0,'atk');drive();
ok('D: special summoned with 4 different ライトロード in the GY',z(jd)==='mz');
const lp0=gameState.players[0].lp;duelActivateFromZone(0,'mz',findCardByUid(jd.uid).index);drive();
ok('D: ① 1000 LP paid; every other card on the field destroyed',gameState.players[0].lp===lp0-1000&&z(o1)==='grave'&&z(o2)==='grave'&&z(me2)==='grave'&&z(jd)==='mz');
const deck0=gameState.players[0].deck.length;TRIG=[];phase('battle');phase('main2');phase('end');
/* ② is processed by the shared automatic End Phase mill of the ライトロード cards (resolveEndPhaseMills — not a chain link; recorded in the report) */
ok('D: ② in its controller’s End Phase, the top 4 cards of the Deck go to the GY',gameState.players[0].deck.length===deck0-4);
audit('D');
fresh();
jd=mk('裁きの龍',0);gameState.players[0].hand=[jd];gameState.players[0].grave=['ライトロード・エンジェル ケルビム','ライトロード・スピリット シャイア','ライトロード・ハンター ライコウ'].map(n=>mk(n,0));baselineA();
ok('D: with only 3 different ライトロード the Special Summon is not legal',strictSummonProcedureLegality('裁きの龍',0,'hand',0).ok===false);

/* ===== E: ダブルコストン / カイザー・シーホース / トロイホース — one of them is 2 Tributes for a monster of its attribute ===== */
function twoFor(tributer,boss){
  fresh();const t=mk(tributer,0,'up'),b=mk(boss,0);gameState.players[0].mz=[t];gameState.players[0].hand=[b];baselineA();
  PREFER=[t.uid,'2体分としてリリース'];doNormalSummon(0,'atk');drive();PREFER=[];
  return {t,b};
}
let e1=twoFor('ダブルコストン','エビルナイト・ドラゴン');
ok('E: ダブルコストン alone tributes for the Level 7 DARK エビルナイト・ドラゴン',z(e1.b)==='mz'&&z(e1.t)==='grave');
audit('E1');
let e2=twoFor('カイザー・シーホース','ダイヤモンド・ドラゴン');
ok('E: カイザー・シーホース alone tributes for the Level 7 LIGHT ダイヤモンド・ドラゴン',z(e2.b)==='mz'&&z(e2.t)==='grave');
let e3=twoFor('トロイホース','ストーン・ドラゴン');
ok('E: トロイホース alone tributes for the Level 7 EARTH ストーン・ドラゴン',z(e3.b)==='mz'&&z(e3.t)==='grave');
let e4=twoFor('ダブルコストン','ダイヤモンド・ドラゴン');
ok('E: ダブルコストン is only 1 Tribute for a LIGHT monster — the Level 7 LIGHT monster is not summoned with it alone',z(e4.b)==='hand'&&z(e4.t)==='mz');

/* ===== F: 可変機獣 ガンナードラゴン — Normal Summon without Tributes: original ATK / DEF halved (1400 / 1000) ===== */
fresh();
let gd=mk('可変機獣 ガンナードラゴン',0);gameState.players[0].hand=[gd];baselineA();
PREFER=['リリースなしで召喚（攻守半分）'];doNormalSummon(0,'atk');drive();PREFER=[];
ok('F: summoned without Tributes — ATK 1400 / DEF 1000',z(gd)==='mz'&&curATK(C(gd))===1400&&curDEF(C(gd))===1000,JSON.stringify({z:z(gd),atk:z(gd)==='mz'&&curATK(C(gd))}));
audit('F');

/* ===== G: Sin サイバー・エンド・ドラゴン — Special Summon by banishing サイバー・エンド・ドラゴン from the EX Deck; other own monsters cannot attack;
   destroyed when no face-up Field Spell ===== */
fresh();
let sin=mk('Sin サイバー・エンド・ドラゴン',0),ce=mk('サイバー・エンド・ドラゴン',0);gameState.players[0].hand=[sin];gameState.players[0].ex=[ce];
let fw=mk('ウォーターワールド',0,'up');gameState.players[0].field=fw;let other=mk('ワイト',0,'up');gameState.players[0].mz=[other];baselineA();
finishSummonProcedure('Sin サイバー・エンド・ドラゴン',0,'hand',0,'atk');drive();
ok('G: special summoned; サイバー・エンド・ドラゴン banished from the EX Deck',z(sin)==='mz'&&z(ce)==='banish');
ok('G: the other own monster cannot declare an attack',cannotAttackNow(C(other))===true);
act({type:'FX_TO_GRAVE',player:0,zone:'field',index:0,reason:'test',byDestroy:true});drive();
ok('G: the Field Spell left → Sin サイバー・エンド・ドラゴン destroyed',z(sin)==='grave');

/* ===== H: No.11 ビッグ・アイ — detach 1 material, take control of an opponent monster; it cannot attack this turn ===== */
fresh();
let be=mk('No.11 ビッグ・アイ',0,'up');be.xyz=[mk('ワイト',0),mk('ワイト',0)];gameState.players[0].mz=[be];let tg=mk('ギガンテス',1,'up');gameState.players[1].mz=[tg];baselineA();
PREFER=[tg.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('H: 1 material detached; ギガンテス now controlled by Player1; ビッグ・アイ cannot attack this turn',C(be).xyz.length===1&&findCardByUid(tg.uid).p===0&&cannotAttackNow(C(be))===true);
ok('H: once per turn',strictScriptLegalityV2('No.11 ビッグ・アイ',0,'mz',findCardByUid(be.uid).index,{}).ok===false);
audit('H');
`);
