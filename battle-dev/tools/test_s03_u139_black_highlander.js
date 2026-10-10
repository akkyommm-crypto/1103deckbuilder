/* S03-U139: 天刑王 ブラック・ハイランダー (NOT_STARTED; fixed Dark list x1) — the Synchro Summon lock (engine/1ZN) and the equip-breaking
   ignition. Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
function tryLibrarian(){const P=gameState.players[0];const lib=P.ex[0];const cb=exCombos(0,dbOf(lib)).combos;
  if(cb.length) beginExSummonV2(0,0,cb[0].materials,'synchro','atk');drive();return lib;}
`;

/* ===== A. Synchro Summon lock — for both players, only while face-up; other Special Summons of Synchro Monsters stay legal ===== */
harness(COMMON+String.raw`
fresh();
gameState.players[0].mz=[mk('ジャンク・シンクロン',0,'up'),mk('ドッペル・ウォリアー',0,'up')];
gameState.players[0].ex=[mk('TG ハイパー・ライブラリアン',0)];
const hl=mk('天刑王 ブラック・ハイランダー',1,'up');hl.properlySummonedS03=true;gameState.players[1].mz=[hl];
baselineA();
ok('A: precondition — the materials make a legal combination',exCombos(0,dbOf(gameState.players[0].ex[0])).combos.length>=1);
TOASTS.length=0;const lib=tryLibrarian();
ok('A: the opponent\'s face-up ブラック・ハイランダー → the Synchro Summon is refused',z(lib)==='ex'&&TOASTS.some(t=>/シンクロ召喚できません/.test(t)),JSON.stringify({lib:z(lib),TOASTS}));
ok('A: the effect-Synchro options are empty as well',typeof effectSynchroOptionsS03!=='function'||effectSynchroOptionsS03(0,gameState.players[0].mz[0].uid).length===0);
/* face-down → no lock */
fresh();
gameState.players[0].mz=[mk('ジャンク・シンクロン',0,'up'),mk('ドッペル・ウォリアー',0,'up')];
gameState.players[0].ex=[mk('TG ハイパー・ライブラリアン',0)];
const hd=mk('天刑王 ブラック・ハイランダー',1,'down');hd.pos='def';gameState.players[1].mz=[hd];
baselineA();
const lib2=tryLibrarian();
ok('A: face-down it does not lock — Synchro Summon succeeds',z(lib2)==='mz',JSON.stringify({lib:z(lib2)}));
audit('A2');
/* 死者蘇生 of a Synchro Monster is not a Synchro Summon */
fresh();
const hl3=mk('天刑王 ブラック・ハイランダー',0,'up');hl3.properlySummonedS03=true;gameState.players[0].mz=[hl3];
const st=mk('スターダスト・ドラゴン',0);st.properlySummonedS03=true;gameState.players[0].grave=[st];gameState.players[0].hand=[mk('死者蘇生',0)];
baselineA();
PREFER=[uid(st)];duelActivateFromHand(0);drive();PREFER=[];
ok('A: 死者蘇生 on スターダスト・ドラゴン is still legal under the lock',z(st)==='mz');
audit('A3');
`);

/* ===== B. once per turn: destroy every Equip Card on the target, 400 damage each ===== */
harness(COMMON+String.raw`
fresh();
const hl=mk('天刑王 ブラック・ハイランダー',0,'up');hl.properlySummonedS03=true;gameState.players[0].mz=[hl];
const foe=mk('ゴブリン突撃部隊',1,'up'),foe2=mk('ワイト',1,'up');gameState.players[1].mz=[foe,foe2];
const e1=mk('魔導師の力',1,'up'),e2=mk('団結の力',1,'up'),e3=mk('魔導師の力',1,'up');
gameState.players[1].sz=[e1,e2,e3];
baselineA();
[0,1].forEach(i=>act({type:'FX_EQUIP',player:1,szIndex:i,targetP:1,targetMz:0}));
act({type:'FX_EQUIP',player:1,szIndex:2,targetP:1,targetMz:1});   /* ワイト also equipped, so the second activation would have a target */
ok('B: setup — 2 Equip Cards equipped to ゴブリン突撃部隊',API.equipCount(findCardByUid(foe.uid))===2);
ok('B: legal — only ゴブリン突撃部隊 (equipped) can be chosen',strictScriptLegalityV2('天刑王 ブラック・ハイランダー',0,'mz',0,{}).ok===true);
PREFER=[uid(foe)];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('B: both Equip Cards destroyed and 800 damage to the opponent',z(e1)==='grave'&&z(e2)==='grave'&&gameState.players[1].lp===7200,JSON.stringify({e1:z(e1),e2:z(e2),lp:gameState.players[1].lp}));
ok('B: once per turn — illegal although ワイト is still equipped',z(e3)==='sz'&&strictScriptLegalityV2('天刑王 ブラック・ハイランダー',0,'mz',0,{}).ok===false,JSON.stringify(strictScriptLegalityV2('天刑王 ブラック・ハイランダー',0,'mz',0,{})));
audit('B');
fresh();
const hl2=mk('天刑王 ブラック・ハイランダー',0,'up');gameState.players[0].mz=[hl2];gameState.players[1].mz=[mk('ワイト',1,'up')];
ok('B: no equipped opponent monster → illegal',strictScriptLegalityV2('天刑王 ブラック・ハイランダー',0,'mz',0,{}).ok===false);
`);
