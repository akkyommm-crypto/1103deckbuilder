/* S03-U156: the shared deck-trigger engine (engine/1ZT declareDeckTriggerS03) — recruiters, battle-destroyed searchers and
   「フィールド上から墓地へ送られた時」 searchers (クリッター・黒き森のウィッチ, 2011 texts: forced, no 1ターンに1度, no activation ban).
   Real DUEL paths: attack → Damage Step → battle cleanup batch (onBattleDestroy + onLeaveField) → trigger → chain → resolution →
   resolution-time Deck choice (existing choice UI) → FX_SEARCH / FX_SPECIAL_SUMMON (Deck shuffled) → the battle goes on.
   Routes to the GY: battle, effect destruction (ブラック・ホール), Tribute, Synchro material. Non-routes: hand → GY (手札抹殺),
   Deck → GY (おろかな埋葬), banished (次元幽閉), returned to the hand (強制脱出装置). Replay-audited. Fixed RNG seed.
   Helper cards are TESTED or GENERIC_OK; the Deck contents are plain monsters. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;}
/* SEEN: every choice shown {title, names, min, max, cancelable}; TRIG: every trigger group offered {names, forced}.
   PREFER: uids / keys to pick first; SKIP_OPTIONAL: decline optional trigger groups. */
let PREFER=[],SEEN=[],TRIG=[],SKIP_OPTIONAL=false;
function pick(){const q=pc();SEEN.push({title:q.title,names:q.candidates.map(x=>x.name||x.label||(x.uid!=null?nm(findCardByUid(x.uid)&&findCardByUid(x.uid).card):x.value)),min:q.min,max:q.max,cancelable:!!q.cancelable,kind:q.kind});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});}
    if(g.length&&!(SKIP_OPTIONAL&&st.rank>=2))eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function journal(t){return V41_ACTION_JOURNAL.filter(x=>x.action.type===t);}
function chains(name){return journal('CHAIN_ADD').filter(x=>x.action&&(x.action.name===name||(x.action.link&&x.action.link.name===name)));}
function evOffered(name){return TRIG.some(e=>e.names.indexOf(name)>=0);}
function evForced(name){const e=TRIG.find(e=>e.names.indexOf(name)>=0);return !!(e&&e.forced);}
function seenFor(name){return SEEN.filter(s=>s.title.indexOf(name)===0);}
function atk(p,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:0,target:t==null?0:t});}
`;

/* ===== A. クリッター destroyed by battle: forced trigger, ATK ≤ 1500 only, resolution-time choice, the battle goes on ===== */
harness(COMMON+String.raw`
fresh();
const crit=mk('クリッター',0,'up');gameState.players[0].mz=[crit];
const gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[gob,mk('ワイト',1,'up')];
const q1500=mk('クィーンズ・ナイト',0),s1600=mk('E・HERO スパークマン',0),cyc=mk('サイクロン',0),gy=mk('ブラック・マジシャン',0);
gameState.players[0].deck=[q1500,s1600,cyc,gy];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
PREFER=[uid(q1500)];atk(1,0);drive();PREFER=[];
ok('A: クリッター destroyed by battle is offered as a FORCED trigger',z(crit)==='grave'&&evOffered('クリッター')&&evForced('クリッター'),JSON.stringify(TRIG));
const sa=seenFor('クリッター')[0];
ok('A: the resolution-time choice offers ATK ≤ 1500 monsters only (1500 yes, 1600 / Spell / 2500 no)',!!sa&&JSON.stringify(sa.names)==='["クィーンズ・ナイト"]',JSON.stringify(SEEN));
ok('A: the choice is forced (not cancelable, exactly 1)',!!sa&&sa.cancelable===false&&sa.min===1&&sa.max===1,JSON.stringify(sa));
ok('A: クィーンズ・ナイト is added to the hand through FX_SEARCH (the Deck is shuffled)',z(q1500)==='hand'&&journal('FX_SEARCH').length===1&&gameState.log.some(l=>/クィーンズ・ナイト を手札に加えた（デッキシャッフル）/.test(l.msg||l)));
ok('A: the battle goes on (Battle Phase, no stuck window, the attack was recorded)',gameState.phase==='battle'&&!gameState.processorPaused&&!pc()&&!EVT_V2_STATE&&gameState.players[1].mz.length===2,JSON.stringify({ph:gameState.phase,paused:gameState.processorPaused}));
ok('A: 1103 text — no 1ターンに1度 and no 「発動できない」 restriction (later errata)',CARD_SCRIPTS['クリッター'].countLimit==null&&!gameState.log.some(l=>/発動できない/.test(l.msg||l)));
audit('A');
/* the filter edges without a real card at those values */
const fA=deckTriggerFilterS03({filter:{atkmax:1500}}),fD=deckTriggerFilterS03({filter:{defmax:1500}});
ok('A: ATK 1500 passes, ATK 1501 does not; DEF 1500 passes, DEF 1501 does not',fA({k:'m',atk:1500,def:0})&&!fA({k:'m',atk:1501,def:0})&&fD({k:'m',atk:0,def:1500})&&!fD({k:'m',atk:0,def:1501}));
ok('A: Extra Deck monsters and non-monsters are never in the pool',!fA({k:'m',ex:true,atk:0})&&!fA({k:'s'})&&!fA({k:'t'}));
`);

/* ===== B. effect destruction (ブラック・ホール): two クリッター and 黒き森のウィッチ all trigger — no 1ターンに1度 ===== */
harness(COMMON+String.raw`
fresh();
const c1=mk('クリッター',0,'up'),w=mk('黒き森のウィッチ',0,'up'),c2=mk('クリッター',0,'up');gameState.players[0].mz=[c1,w,c2];
gameState.players[0].hand=[mk('ブラック・ホール',0)];
const d1500=mk('X－ヘッド・キャノン',0),d1600=mk('ウィップテイル・ガーゴイル',0),a1=mk('クィーンズ・ナイト',0),a2=mk('ひょうすべ',0);
gameState.players[0].deck=[d1500,d1600,a1,a2];
baselineA();
duelActivateFromHand(0);drive();
ok('B: all three are destroyed by the effect and all three trigger (forced)',z(c1)==='grave'&&z(w)==='grave'&&z(c2)==='grave'&&chains('クリッター').length===2&&chains('黒き森のウィッチ').length===1,JSON.stringify({ev:TRIG,ch:journal('CHAIN_ADD').map(x=>x.action.name||(x.action.link&&x.action.link.name))}));
const sw=seenFor('黒き森のウィッチ')[0];
ok('B: 黒き森のウィッチ offers DEF ≤ 1500 only (DEF 1500 yes, DEF 1600 no)',!!sw&&sw.names.indexOf('X－ヘッド・キャノン')>=0&&sw.names.indexOf('ウィップテイル・ガーゴイル')<0,JSON.stringify(SEEN));
const sc=seenFor('クリッター');
ok('B: both クリッター searches resolve (the second one is not stopped by a once-per-turn limit)',sc.length===2&&journal('FX_SEARCH').length===3&&gameState.players[0].hand.length===3,JSON.stringify({seen:SEEN,hand:gameState.players[0].hand.map(nm)}));
ok('B: every クリッター candidate had ATK ≤ 1500',sc.every(s=>s.names.every(n=>{const d=CARD_DB[findCardIndex(n)];return d&&d.k==='m'&&Number(d.atk)<=1500;})));
audit('B');
`);

/* ===== C. Tribute (Tribute Summon) and D. Synchro material: both are 「フィールド上から墓地へ送られた」 ===== */
harness(COMMON+String.raw`
fresh();
const crit=mk('クリッター',0,'up');gameState.players[0].mz=[crit];
const cy=mk('サイバー・ドラゴン',0);gameState.players[0].hand=[cy];
const q=mk('クィーンズ・ナイト',0);gameState.players[0].deck=[q,mk('E・HERO スパークマン',0)];
baselineA();
doNormalSummon(0,'atk');drive();
ok('C: クリッター Tributed for サイバー・ドラゴン triggers and searches',z(cy)==='mz'&&z(crit)==='grave'&&chains('クリッター').length===1&&z(q)==='hand',JSON.stringify({cy:z(cy),crit:z(crit),q:z(q),seen:SEEN,ev:TRIG}));
audit('C');

fresh();SEEN=[];TRIG=[];
/* S03-U162: legal materials — ゴヨウ・ガーディアン needs an EARTH Tuner (ジャンク・シンクロン is DARK; the Synchro used to be summoned
   with doExSummon directly, which does not check the materials). カラクリ参謀 弐四八 (EARTH Lv3 Tuner) + クリッター (Lv3). */
const tu=mk('カラクリ参謀 弐四八',0,'up'),cr=mk('クリッター',0,'up');gameState.players[0].mz=[tu,cr];
const goyo=mk('ゴヨウ・ガーディアン',0);gameState.players[0].ex=[goyo];
const q2=mk('クィーンズ・ナイト',0);gameState.players[0].deck=[q2];
baselineA();
const cbD=exCombos(0,dbOf(goyo)).combos;ok('D: the materials are legal for ゴヨウ・ガーディアン (exCombos)',cbD.length>0);if(cbD.length)beginExSummonV2(0,0,cbD[0].materials,'synchro','atk');drive();
ok('D: クリッター used as Synchro material triggers and searches',z(goyo)==='mz'&&z(cr)==='grave'&&chains('クリッター').length===1&&z(q2)==='hand',JSON.stringify({goyo:z(goyo),cr:z(cr),q2:z(q2),seen:SEEN,ev:TRIG}));
audit('D');
`);

/* ===== E. not 「フィールド上から墓地へ」: hand → GY, Deck → GY, banished, returned to the hand; and the old any-card trigger ===== */
harness(COMMON+String.raw`
fresh();
const ch=mk('クリッター',0),wh=mk('黒き森のウィッチ',0);gameState.players[0].hand=[mk('手札抹殺',0),ch,wh];
gameState.players[0].deck=[mk('クィーンズ・ナイト',0),mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
gameState.players[1].deck=[mk('ワイト',1)];
baselineA();
duelActivateFromHand(0);drive();
ok('E1: クリッター / 黒き森のウィッチ discarded from the hand do not trigger',z(ch)==='grave'&&z(wh)==='grave'&&!chains('クリッター').length&&!chains('黒き森のウィッチ').length&&!journal('FX_SEARCH').length,JSON.stringify({ev:TRIG,seen:SEEN}));
audit('E1');

fresh();SEEN=[];TRIG=[];
const cd=mk('クリッター',0);gameState.players[0].hand=[mk('おろかな埋葬',0)];gameState.players[0].deck=[cd,mk('クィーンズ・ナイト',0)];
baselineA();
PREFER=[uid(cd)];duelActivateFromHand(0);drive();PREFER=[];
ok('E2: クリッター sent from the Deck to the GY does not trigger',z(cd)==='grave'&&!chains('クリッター').length&&!journal('FX_SEARCH').length,JSON.stringify({ev:TRIG,seen:SEEN}));
audit('E2');

for(const [label,trap,where] of [['E3','次元幽閉','banish'],['E4','強制脱出装置','hand']]){
  fresh();SEEN=[];TRIG=[];
  const cb=mk('クリッター',0,'up');gameState.players[0].mz=[cb];gameState.players[1].mz=[mk('ワイト',1,'up')];
  const t=mk(trap,1,'down');t.setTurn=4;gameState.players[1].sz=[t];
  gameState.players[0].deck=[mk('クィーンズ・ナイト',0)];gameState.phase='battle';
  baselineA();
  atk(0,0);const at=toPoint('attackDeclare');
  if(at)pointActivateV27(1,'sz',0);
  drive();
  ok(label+': クリッター removed by '+trap+' ('+where+', not the GY) does not trigger',at&&z(cb)===where&&!chains('クリッター').length&&!journal('FX_SEARCH').length,JSON.stringify({at,zone:z(cb),ev:TRIG}));
  audit(label);
}

/* ゴブリンゾンビ ② used to trigger on ANY card sent to the GY from anywhere (it sat in the GY and reacted to others) */
fresh();SEEN=[];TRIG=[];
const gz=mk('ゴブリンゾンビ',0);gameState.players[0].grave=[gz];
const cl=mk('E・HERO クレイマン',0,'up');gameState.players[0].mz=[cl];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
gameState.players[0].deck=[mk('ヴァンパイア・ベビー',0)];gameState.activePlayer=1;gameState.phase='battle';
baselineA();
atk(1,0);drive();
ok('E5: ゴブリンゾンビ in the GY does not trigger when another monster is destroyed and sent to the GY',z(cl)==='grave'&&!chains('ゴブリンゾンビ').length&&!journal('FX_SEARCH').length,JSON.stringify({ev:TRIG}));
ok('E5: ゴブリンゾンビ cannot be activated from the GY at will',gameState.phase='main1',!strictScriptLegalityV2('ゴブリンゾンビ',0,'grave',0,{}).ok);
gameState.phase='battle';
audit('E5');

/* the coarse AUTO table made these ignition effects activatable from the GY at will */
fresh();
gameState.players[0].grave=[mk('ゴキポン',0),mk('仮面竜',0),mk('クリッター',0)];gameState.players[0].deck=[mk('ドル・ドラ',0),mk('クィーンズ・ナイト',0)];
baselineA();
ok('E6: ゴキポン / 仮面竜 / クリッター in the GY are not ignition effects (illegal in the Main Phase)',[0,1,2].every(i=>!strictScriptLegalityV2(nm(gameState.players[0].grave[i]),0,'grave',i,{}).ok));
`);

/* ===== F. recruiter 仮面竜: optional trigger, ATK ≤ 1500 ドラゴン, face-up position chosen, the battle goes on ===== */
harness(COMMON+String.raw`
fresh();
const mask=mk('仮面竜',0,'up');gameState.players[0].mz=[mask];
gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up'),mk('ワイト',1,'up')];
const rag=mk('神竜 ラグナロク',0),yama=mk('ヤマドラン',0),qk=mk('クィーンズ・ナイト',0);gameState.players[0].deck=[rag,yama,qk];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
PREFER=[uid(rag),'def'];atk(1,0);drive();PREFER=[];
ok('F: 仮面竜 destroyed by battle is offered as an OPTIONAL trigger',z(mask)==='grave'&&evOffered('仮面竜')&&!evForced('仮面竜'),JSON.stringify(TRIG));
const sf=seenFor('仮面竜');
ok('F: the Deck choice offers ATK ≤ 1500 Dragons only (ラグナロク 1500 yes; ヤマドラン 1600 / クィーンズ・ナイト Warrior no)',sf.length>=1&&JSON.stringify(sf[0].names)==='["神竜 ラグナロク"]',JSON.stringify(SEEN));
ok('F: 「特殊召喚する」 without a position — the player chooses face-up Attack or Defense',sf.length===2&&sf[1].kind==='declare',JSON.stringify(SEEN));
const rh=findCardByUid(rag.uid);
ok('F: 神竜 ラグナロク is Special Summoned from the Deck in face-up Defense Position',!!rh&&rh.zone==='mz'&&rh.card.face==='up'&&rh.card.pos==='def'&&journal('FX_SPECIAL_SUMMON').length===1,JSON.stringify(rh&&{z:rh.zone,f:rh.card.face,p:rh.card.pos}));
ok('F: the battle goes on (Battle Phase, no stuck window)',gameState.phase==='battle'&&!gameState.processorPaused&&!pc()&&!EVT_V2_STATE);
audit('F');

/* F2 declined */
fresh();SEEN=[];TRIG=[];SKIP_OPTIONAL=true;
const m2=mk('仮面竜',0,'up');gameState.players[0].mz=[m2];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const r2=mk('神竜 ラグナロク',0);gameState.players[0].deck=[r2];gameState.activePlayer=1;gameState.phase='battle';
baselineA();
atk(1,0);drive();SKIP_OPTIONAL=false;
ok('F2: the optional trigger can be declined — nothing is summoned',evOffered('仮面竜')&&!chains('仮面竜').length&&z(r2)==='deck'&&!journal('FX_SPECIAL_SUMMON').length);
audit('F2');

/* F3 no candidate: the optional trigger can still be activated; it resolves normally, the Deck is shuffled */
fresh();SEEN=[];TRIG=[];
const m3=mk('仮面竜',0,'up');gameState.players[0].mz=[m3];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const y3=mk('ヤマドラン',0);gameState.players[0].deck=[y3];gameState.activePlayer=1;gameState.phase='battle';
baselineA();
atk(1,0);drive();
ok('F3: no ATK ≤ 1500 Dragon in the Deck — activated, resolves doing nothing (no choice), Deck shuffled, battle goes on',chains('仮面竜').length===1&&!seenFor('仮面竜').length&&z(y3)==='deck'&&journal('SHUFFLE').length===1&&gameState.phase==='battle'&&!gameState.processorPaused,JSON.stringify({ch:chains('仮面竜').length,seen:SEEN,sh:journal('SHUFFLE').length}));
audit('F3');

/* F4 Special Summon lock (大天使クリスティア: お互いに特殊召喚できない) — the summoning trigger cannot be activated */
fresh();SEEN=[];TRIG=[];
const m4=mk('仮面竜',0,'up');gameState.players[0].mz=[m4];gameState.players[1].mz=[mk('大天使クリスティア',1,'up')];
const r4=mk('神竜 ラグナロク',0);gameState.players[0].deck=[r4];gameState.activePlayer=1;gameState.phase='battle';
baselineA();
atk(1,0);drive();
ok('F4: under 大天使クリスティア 仮面竜 is not offered and nothing is summoned',z(m4)==='grave'&&!evOffered('仮面竜')&&!chains('仮面竜').length&&z(r4)==='deck',JSON.stringify(TRIG));
audit('F4');
`);

/* ===== G. 荒野の女戦士 (Attack Position, 地・戦士 ≤ 1500), 素早いモモンガ (forced LP + any number face-down), 暗黒界の斥候 スカー ===== */
harness(COMMON+String.raw`
fresh();
const ama=mk('荒野の女戦士',0,'up');gameState.players[0].mz=[ama];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const zan=mk('鎧武者斬鬼',0),zera=mk('ゼラの戦士',0),qn=mk('クィーンズ・ナイト',0);gameState.players[0].deck=[zan,zera,qn];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
atk(1,0);drive();
const sg=seenFor('荒野の女戦士')[0];
ok('G: 荒野の女戦士 offers EARTH Warriors with ATK ≤ 1500 only (鎧武者斬鬼 yes; ゼラの戦士 1600 / LIGHT クィーンズ・ナイト no)',!!sg&&JSON.stringify(sg.names)==='["鎧武者斬鬼"]',JSON.stringify(SEEN));
const zh=findCardByUid(zan.uid);
ok('G: … Special Summoned in face-up Attack Position (no position choice)',!!zh&&zh.zone==='mz'&&zh.card.face==='up'&&zh.card.pos==='atk'&&seenFor('荒野の女戦士').length===1);
audit('G');

fresh();SEEN=[];TRIG=[];
const mo=mk('素早いモモンガ',0,'up');gameState.players[0].mz=[mo];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const mA=mk('素早いモモンガ',0),mB=mk('素早いモモンガ',0);gameState.players[0].deck=[mA,mB,mk('ワイト',0)];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
const lp0=gameState.players[0].lp;
atk(1,0);
/* answer the Deck choice with both copies */
for(let i=0;i<200;i++){const q=pc();if(q&&q.title.indexOf('素早いモモンガ')===0){SEEN.push({title:q.title,min:q.min,max:q.max});answerChoiceV49(q.candidates.map(x=>x.key));continue;}
  if(q){pick();continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:EVT_V2_STATE.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
const sm=SEEN.find(s=>s.title.indexOf('素早いモモンガ')===0);
ok('G2: 素早いモモンガ is a forced trigger: +1000 LP (battle damage 2300−1000 first)',evForced('素早いモモンガ')&&gameState.players[0].lp===lp0-1300+1000,JSON.stringify({lp:gameState.players[0].lp,lp0,ev:TRIG}));
ok('G2: 「任意の数だけ」 — the choice allows 0 to 2 (min 0)',!!sm&&sm.min===0&&sm.max===2,JSON.stringify(sm));
ok('G2: both copies are Special Summoned in face-down Defense Position',[mA,mB].every(c=>{const h=findCardByUid(c.uid);return h&&h.zone==='mz'&&h.card.face==='down'&&h.card.pos==='def';}));
audit('G2');

fresh();SEEN=[];TRIG=[];
const scar=mk('暗黒界の斥候 スカー',0,'up');gameState.players[0].mz=[scar];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
gameState.players[0].deck=[mk('ワイト',0)];gameState.activePlayer=1;gameState.phase='battle';
baselineA();
atk(1,0);drive();
ok('G3: 暗黒界の斥候 スカー with no 暗黒界 Lv4 or lower in the Deck — the forced trigger still activates and resolves (it could not before)',chains('暗黒界の斥候 スカー').length===1&&!seenFor('暗黒界の斥候 スカー').length&&!journal('FX_SEARCH').length&&gameState.phase==='battle'&&!gameState.processorPaused,JSON.stringify({ev:TRIG}));
audit('G3');
`);

/* ===== H. zone full at resolution: ガスタ・ガルド and ナチュル・クリフ Tributed together, one free zone for two summons ===== */
harness(COMMON+String.raw`
fresh();
const gar=mk('ガスタ・ガルド',0,'up'),cli=mk('ナチュル・クリフ',0,'up');
gameState.players[0].mz=[gar,cli,mk('ワイト',0,'up'),mk('ワイト',0,'up'),mk('ワイト',0,'up')];
const bm=mk('ブラック・マジシャン',0);gameState.players[0].hand=[bm];
const wind=mk('ガスタの巫女 ウィンダ',0),ant=mk('ナチュル・アントジョー',0);gameState.players[0].deck=[wind,ant];
baselineA();
PREFER=[uid(gar),uid(cli)];doNormalSummon(0,'atk');drive();PREFER=[];
const summoned=[wind,ant].filter(c=>z(c)==='mz');
ok('H: both are Tributed and both triggers are activated (one free zone at activation)',z(bm)==='mz'&&chains('ガスタ・ガルド').length===1&&chains('ナチュル・クリフ').length===1,JSON.stringify({bm:z(bm),ev:TRIG,ch:journal('CHAIN_ADD').map(x=>x.action.name||(x.action.link&&x.action.link.name))}));
ok('H: the later link fills the zone; the earlier one finds the Monster Zones full and summons nothing',summoned.length===1&&gameState.players[0].mz.length===5&&gameState.log.some(l=>/モンスターゾーンが空いていない/.test(l.msg||l)),JSON.stringify({summoned:summoned.map(nm),mz:gameState.players[0].mz.length}));
audit('H');
`);

/* ===== I. every other declared battle-destroyed recruiter / searcher, table-driven through the same real path:
   destroyed by ゴブリン突撃部隊's attack → trigger → resolution-time choice offers exactly the one matching Deck card (not ワイト, not a
   near miss of the same Type that fails the filter) → hand / field in the declared position; LP costs paid. ===== */
harness(COMMON+String.raw`
const CASES=[
  ['ユーフォロイド','atk'],['ジェネクス・サーチャー','atk'],['軍隊竜','faceUp'],['ヘル・セキュリティ','faceUp'],['スレイブ・エイプ','faceUp'],
  ['トライクラー','faceUp'],['ヴィークラー','faceUp'],['幻影の魔術士','def'],['ガスタ・イグル','faceUp'],['パンダボーグ','faceUp'],
  ['RAI－MEI','hand'],['カバリスト','hand'],['キーマウス','hand'],['ゴキポン','hand'],['ダニポン','hand'],['ドレッド・ドラゴン','hand'],
  ['バイオレット・ウィッチ','hand'],['悪魂邪苦止','hand'],['暗黒界の斥候 スカー','hand']];
const MAIN=CARD_DB.filter(d=>d&&d.k==='m'&&!d.ex&&d.n);
for(const [name,where] of CASES){
  const S=DECK_TRIGGER_S03[name];
  if(!S){ok('I '+name+': declared',false);continue;}
  fresh();
  const f=deckTriggerFilterS03(S), ff=S.filter||{};
  const summonable=d=>{const c=mk(d.n,0);return S.action!=='summon'||canEffectSpecialSummonS03(c,'deck',name);};
  const match=MAIN.find(d=>f(d,null)&&d.n!==name&&summonable(d))||MAIN.find(d=>f(d,null)&&summonable(d));
  const near=MAIN.find(d=>!f(d,null)&&(ff.ra?d.ra===ff.ra:true)&&(ff.at?d.at===ff.at:true)&&(ff.set!=null?isSetCardV4(d,ff.set):true)&&(ff.group!=null?isCardInGroupV4(d,ff.group):true)&&d.n!==name);
  fresh();SEEN=[];TRIG=[];
  const me=mk(name,0,'up');gameState.players[0].mz=[me];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
  const m=mk(match.n,0),w=mk('ワイト',0);gameState.players[0].deck=[w,m].concat(near?[mk(near.n,0)]:[]);
  gameState.activePlayer=1;gameState.phase='battle';
  baselineA();
  const lp0=gameState.players[0].lp,myAtk=Number(dbOf(me).atk)||0;
  PREFER=[uid(m),'atk'];atk(1,0);drive();PREFER=[];
  const s=seenFor(name)[0];
  const offered=!!s&&JSON.stringify(s.names)===JSON.stringify([match.n]);
  const h=findCardByUid(m.uid);
  const placed=where==='hand'?(h&&h.zone==='hand'):(h&&h.zone==='mz'&&h.card.face==='up'&&h.card.pos===(where==='def'?'def':'atk'));
  const posChoice=seenFor(name).length===(where==='faceUp'?2:1);
  const lpOk=gameState.players[0].lp===lp0-Math.max(0,2300-myAtk)-(S.lpCost||0);
  ok('I '+name+': '+(S.optional?'optional':'forced')+' trigger → offers only '+match.n+(near?' (not '+near.n+' / ワイト)':' (not ワイト)')+' → '+where+(S.lpCost?' (paid '+S.lpCost+' LP)':''),
    z(me)==='grave'&&evOffered(name)&&evForced(name)===!S.optional&&offered&&placed&&posChoice&&lpOk&&gameState.phase==='battle'&&!gameState.processorPaused,
    JSON.stringify({seen:SEEN,trig:TRIG,zone:h&&h.zone,pos:h&&h.card.pos,lp:gameState.players[0].lp,lp0}));
  const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);if(!(pkg.actions.length>0&&a.ok))ok('I '+name+': Replay audit',false,JSON.stringify(a).slice(0,200));
}
/* トライクラー 「自分の手札またはデッキから」: the hand copy is offered too */
fresh();SEEN=[];TRIG=[];
const tri=mk('トライクラー',0,'up');gameState.players[0].mz=[tri];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const vh=mk('ヴィークラー',0);gameState.players[0].hand=[vh];gameState.players[0].deck=[mk('ワイト',0)];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=[uid(vh),'def'];atk(1,0);drive();PREFER=[];
ok('I トライクラー: 「手札またはデッキから」 — ヴィークラー in the hand is offered and Special Summoned',z(vh)==='mz'&&JSON.stringify((seenFor('トライクラー')[0]||{}).names)==='["ヴィークラー"]',JSON.stringify(SEEN));
audit('I トライクラー hand');
/* 悪魂邪苦止 「自分フィールド上に存在するこのカードが」: the opponent's copy under the player's control does not search for its owner */
fresh();SEEN=[];TRIG=[];
const ak=mk('悪魂邪苦止',1,'up');ak.controller=0;gameState.players[0].mz=[ak];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
gameState.players[1].deck=[mk('悪魂邪苦止',1)];gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0);drive();
ok('I 悪魂邪苦止: destroyed while its owner did not control it — no search',z(ak)==='grave'&&!chains('悪魂邪苦止').length&&!journal('FX_SEARCH').length,JSON.stringify({trig:TRIG,zone:z(ak)}));
audit('I 悪魂邪苦止 control');
`);

/* ===== J. field → GY recruiters / searchers by effect destruction: ガスタ・ガルド, ナチュル・クリフ, ボタニティ・ガール ===== */
harness(COMMON+String.raw`
for(const [name,matchName,nearName,where] of [['ガスタ・ガルド','ガスタの巫女 ウィンダ','ガスタの神官 ムスト','faceUp'],['ナチュル・クリフ','ナチュル・アントジョー','ナチュル・スタッグ','atk'],['ボタニティ・ガール','ナチュル・コスモスビート','ナチュル・ストロベリー','hand']]){
  fresh();SEEN=[];TRIG=[];
  const me=mk(name,0,'up');gameState.players[0].mz=[me,mk('ワイト',0,'up')];gameState.players[0].hand=[mk('ブラック・ホール',0)];
  const m=mk(matchName,0),n=mk(nearName,0);gameState.players[0].deck=[n,m];
  baselineA();
  PREFER=[uid(m),'atk'];duelActivateFromHand(0);drive();PREFER=[];
  const s=seenFor(name)[0],h=findCardByUid(m.uid);
  ok('J '+name+': destroyed by ブラック・ホール → offers only '+matchName+' (not '+nearName+') → '+where,
    z(me)==='grave'&&!!s&&JSON.stringify(s.names)===JSON.stringify([matchName])&&(where==='hand'?h.zone==='hand':(h.zone==='mz'&&h.card.pos==='atk'&&h.card.face==='up')),JSON.stringify({seen:SEEN,trig:TRIG,zone:h&&h.zone}));
  audit('J '+name);
}
`);
