/* S03-U240: 「宝玉獣」 — placement as a Continuous Spell (engine/1ZZH via the S03-U173 decision flow; FX_PLACE_SPELL_S03) and the family's effects.
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function sz(p){return gameState.players[p].sz;}
function placed(c){const h=findCardByUid(c.uid);return !!h&&h.zone==='sz'&&!!h.card.asSpellS03&&h.card.face==='up';}

/* ===== A: effect destruction (ブラック・ホール) — the 宝玉獣's controller chooses to place it: Spell & Trap Zone, not the GY ===== */
fresh();
let am=mk('宝玉獣 アメジスト・キャット',0,'up'),wa=mk('ワイト',1,'up'),bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[am];gameState.players[1].mz=[wa];gameState.players[0].hand=[bh];baselineA();
PREFER=['place:'+am.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: アメジスト・キャット placed as a Continuous Spell (face-up, Spell & Trap Zone); ワイト to the GY',placed(am)&&z(wa)==='grave'&&z(bh)==='grave',JSON.stringify({am:z(am),wa:z(wa),as:C(am).asSpellS03}));
ok('A: it was destroyed (the destruction is recorded) but never in the GY',gameState.players[0].grave.indexOf(C(am))<0);
audit('A');
fresh();
am=mk('宝玉獣 アメジスト・キャット',0,'up');bh=mk('ブラック・ホール',0);gameState.players[0].mz=[am];gameState.players[0].hand=[bh];baselineA();
PREFER=['decline'];duelActivateFromHand(0);drive();PREFER=[];
ok('A2: declined — to the GY',z(am)==='grave'&&!C(am).asSpellS03,JSON.stringify({am:z(am)}));
audit('A2');
fresh();
am=mk('宝玉獣 アメジスト・キャット',0,'up');bh=mk('ブラック・ホール',0);gameState.players[0].mz=[am];gameState.players[0].hand=[bh];
gameState.players[0].sz=[0,1,2,3].map(()=>{const c=mk('サイクロン',0,'down');c.setTurn=4;return c;});baselineA();
duelActivateFromHand(0);drive();
ok('A3: 4 Set cards + the resolving ブラック・ホール fill the zone — no choice, to the GY',z(am)==='grave'&&z(bh)==='grave',JSON.stringify({am:z(am),n:sz(0).length,pc:!!pc()}));
audit('A3');

/* ===== B: battle destruction → placed; トパーズ・タイガー +400 during the damage step when it attacks a monster ===== */
fresh();
let tp=mk('宝玉獣 トパーズ・タイガー',0,'up'),es=mk('エーリアン・ソルジャー',1,'up');
gameState.players[0].mz=[tp];gameState.players[1].mz=[es];gameState.phase='battle';baselineA();
ok('B: ATK 1600 outside the damage step',curATK(C(tp))===1600);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('B: attacking エーリアン・ソルジャー (1900) with 1600+400 — destroys it, 100 damage; back to 1600 after the battle',z(es)==='grave'&&z(tp)==='mz'&&lp(1)===7900&&curATK(C(tp))===1600,JSON.stringify({es:z(es),tp:z(tp),lp1:lp(1)}));
audit('B');
fresh();
tp=mk('宝玉獣 トパーズ・タイガー',0,'up');let be=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[tp];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=['place:'+tp.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();PREFER=[];
ok('B2: destroyed by battle (attacked by 青眼) → placed in the Spell & Trap Zone',placed(tp)&&lp(0)===8000-(3000-1600),JSON.stringify({tp:z(tp),lp0:lp(0)}));
audit('B2');

/* ===== C: アメジスト・キャット — direct attack while the opponent has a monster; the damage is halved ===== */
fresh();
am=mk('宝玉獣 アメジスト・キャット',0,'up');be=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[am];gameState.players[1].mz=[be];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('C: direct attack past 青眼 — 1200 halved to 600',lp(1)===7400,JSON.stringify({lp1:lp(1)}));
audit('C');

/* ===== D: アンバー・マンモス — the opponent targets another own 宝玉獣 → the attack is moved to アンバー ===== */
fresh();
let ab=mk('宝玉獣 アンバー・マンモス',0,'up'),em=mk('宝玉獣 エメラルド・タートル',0,'up');be=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[ab,em];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=['decline'];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();PREFER=[];
ok('D: attack on エメラルド・タートル moved to アンバー・マンモス (destroyed, 1300 damage); エメラルド stays',z(em)==='mz'&&z(ab)==='grave'&&lp(0)===8000-1300,JSON.stringify({em:z(em),ab:z(ab),lp0:lp(0),TRIG}));
audit('D');

/* ===== E: エメラルド・タートル — a monster that attacked this turn → Defense Position ===== */
fresh();
em=mk('宝玉獣 エメラルド・タートル',0,'up');let gg=mk('ギル・ガース',0,'up');
gameState.players[0].mz=[em,gg];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:1,target:'direct'});drive();
phase('main2');
PREFER=[gg.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('E: ギル・ガース (attacked) → Defense Position',C(gg).pos==='def'&&lp(1)===6200,JSON.stringify({pos:C(gg).pos,lp1:lp(1)}));
audit('E');

/* ===== F: コバルト・イーグル — a placed 宝玉獣 in the Spell & Trap Zone back to the top of its owner's Deck ===== */
fresh();
let co=mk('宝玉獣 コバルト・イーグル',0,'up'),pl=mk('宝玉獣 トパーズ・タイガー',0,'up');pl.asSpellS03={turn:4};
gameState.players[0].mz=[co];gameState.players[0].sz=[pl];baselineA();
PREFER=[pl.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
const dk=gameState.players[0].deck;
ok('F: the placed トパーズ・タイガー to the top of the Deck',z(pl)==='deck'&&dk[0]===C(pl)&&!C(pl).asSpellS03,JSON.stringify({pl:z(pl),top:cardName(dk[0])}));
audit('F');

/* ===== G: サファイア・ペガサス — Normal Summon → a 宝玉獣 from the Deck placed as a Continuous Spell ===== */
fresh();
let sp=mk('宝玉獣 サファイア・ペガサス',0),dt=mk('宝玉獣 トパーズ・タイガー',0);
gameState.players[0].hand=[sp];gameState.players[0].deck.push(dt);baselineA();
PREFER=[dt.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('G: トパーズ・タイガー from the Deck placed face-up in the Spell & Trap Zone',z(sp)==='mz'&&placed(dt),JSON.stringify({dt:z(dt),TRIG}));
audit('G');

/* ===== H: ルビー・カーバンクル — special summoned (死者蘇生) → every 宝玉獣 in its Spell & Trap Zone special summoned ===== */
fresh();
let rb=mk('宝玉獣 ルビー・カーバンクル',0),p1=mk('宝玉獣 トパーズ・タイガー',0,'up'),p2=mk('宝玉獣 コバルト・イーグル',0,'up'),rv=mk('死者蘇生',0);
p1.asSpellS03={turn:4};p2.asSpellS03={turn:4};
gameState.players[0].grave=[rb];gameState.players[0].sz=[p1,p2];gameState.players[0].hand=[rv];baselineA();
PREFER=[rb.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('H: ルビー revived → both placed 宝玉獣 special summoned from the Spell & Trap Zone',z(rb)==='mz'&&z(p1)==='mz'&&z(p2)==='mz'&&!C(p1).asSpellS03,JSON.stringify({p1:z(p1),p2:z(p2),TRIG}));
audit('H');

/* ===== I: 宝玉の恵み — 1 宝玉獣 in the GY placed as a Continuous Spell ===== */
fresh();
let bl=mk('宝玉の恵み',0),gc=mk('宝玉獣 コバルト・イーグル',0);gameState.players[0].hand=[bl];gameState.players[0].grave=[gc];baselineA();
PREFER=[gc.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('I: コバルト・イーグル from the GY placed; 宝玉の恵み to the GY',placed(gc)&&z(bl)==='grave',JSON.stringify({gc:z(gc),bl:z(bl)}));
audit('I');

/* ===== J: 宝玉の解放 — +800 to a 宝玉獣; sent from the field to the GY → a 宝玉獣 from the Deck placed ===== */
fresh();
let lb=mk('宝玉の解放',0),ho=mk('宝玉獣 トパーズ・タイガー',0,'up'),dc=mk('宝玉獣 コバルト・イーグル',0),cy=mk('サイクロン',1);
gameState.players[0].hand=[lb];gameState.players[0].mz=[ho];gameState.players[0].deck.push(dc);baselineA();
PREFER=[ho.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('J: equipped — 1600 + 800',z(lb)==='sz'&&curATK(C(ho))===2400,JSON.stringify({atk:curATK(C(ho))}));
gameState.players[1].hand=[cy];gameState.activePlayer=1;ensureAllCardUids(gameState);baselineA();
PREFER=[lb.uid,dc.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('J: destroyed by サイクロン → コバルト・イーグル from the Deck placed',z(lb)==='grave'&&placed(dc),JSON.stringify({lb:z(lb),dc:z(dc),TRIG}));
audit('J');

/* ===== K: 宝玉の契約 (existing) special summons a card placed by this unit ===== */
fresh();
let ct=mk('宝玉の契約',0);am=mk('宝玉獣 アメジスト・キャット',0,'up');am.asSpellS03={turn:4};gameState.players[0].sz=[am];gameState.players[0].hand=[ct];baselineA();
PREFER=[am.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('K: 宝玉の契約 special summons the placed アメジスト・キャット',z(am)==='mz'&&!C(am).asSpellS03,JSON.stringify({am:z(am)}));
audit('K');
`);
