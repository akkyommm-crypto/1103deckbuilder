/* S03-U174: contact fusion (engine/1ZW) — 「上記のカードを(デッキに戻した｜除外した｜墓地へ送った)場合のみ、EXデッキから特殊召喚できる」
   as the card's own summon procedure from the EX Deck (no chain block, summon negation window, properly summoned, not a Fusion Summon;
   face-down materials allowed and revealed). Cards: E・HERO グラン・ネオス (procedure + End Phase return added; it was TESTED without
   them), E・HERO エアー・ネオス, E・HERO フレア・ネオス, キメラテック・フォートレス・ドラゴン. Real DUEL paths; Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));}
let PREFER=[],SEEN=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc();
  if(q){SEEN.push(q.candidates.map(x=>x.label));let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>typeof u==='function'?u(x):(x.key===u||x.value===u||x.label===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function contact(name,p,pos){const i=gameState.players[p].ex.findIndex(c=>cardName(c)===name);finishSummonProcedure(name,p,'ex',i,pos||'atk');}
function row(name,p){const i=gameState.players[p].ex.findIndex(c=>cardName(c)===name);return contactProcRowS03(p,i,dbOf(gameState.players[p].ex[i]));}

/* ===== A: グラン・ネオス — ネオス + face-down グラン・モール go back to the Deck; summon window; not a Fusion Summon ===== */
fresh();
let neos=mk('E・HERO ネオス',0,'up'),mole=mk('N・グラン・モール',0,'down','def');gameState.players[0].mz=[neos,mole];
let gran=mk('E・HERO グラン・ネオス',0,'up');gameState.players[0].ex=[gran];
let foe=mk('ギガンテス',1,'up');gameState.players[1].mz=[foe];baselineA();
const rA=row('E・HERO グラン・ネオス',0);
ok('A: the EX Deck sheet offers the contact procedure (legal)',rA&&rA.ok===true,JSON.stringify(rA));
contact('E・HERO グラン・ネオス',0);
const winA=V41_ACTION_JOURNAL.filter(x=>x.action.type==='SUMMON_WINDOW_OPEN_V42').map(x=>x.action.pending);
ok('A: the summon negation window was opened for the procedure (no chain block)',winA.length===1&&winA[0].kind==='procedure'&&winA[0].name==='E・HERO グラン・ネオス'&&!V41_ACTION_JOURNAL.some(x=>x.action.type==='CHAIN_ADD'),JSON.stringify(winA));
ok('A: the materials were returned to the Deck before the summon (the face-down グラン・モール was revealed)',z(neos)==='deck'&&z(mole)==='deck'&&gameState.log.some(l=>String(l.msg||'').indexOf('裏側表示の N・グラン・モール を公開')>=0));
drive();
let g=findCardByUid(gran.uid);
ok('A: グラン・ネオス is on the field — properly summoned, special summoned by its procedure (not a Fusion Summon)',g&&g.zone==='mz'&&g.card.properlySummonedS03===true&&g.card.specialSummonKind!=='fusion'&&!g.card.fusionSummonedS03,JSON.stringify(g&&{k:g.card.specialSummonKind,p:g.card.properlySummonedS03}));
duelActivateFromZone(0,'mz',findCardByUid(gran.uid).index);drive();
ok('A: its 1-per-turn bounce still works (the opponent\'s ギガンテス returns to the hand)',z(foe)==='hand');
phase('battle');phase('main2');phase('end');
ok('A: in the End Phase it returns to the EX Deck (forced)',z(gran)==='ex',z(gran));
audit('A');

/* ===== A2: without the Neo-Spacian the procedure is refused ===== */
fresh();
gameState.players[0].mz=[mk('E・HERO ネオス',0,'up')];gameState.players[0].ex=[mk('E・HERO グラン・ネオス',0,'up')];baselineA();
const rA2=row('E・HERO グラン・ネオス',0);
ok('A2: without N・グラン・モール the row is not legal and names the materials',rA2&&rA2.ok===false&&/N・グラン・モール/.test(rA2.reason),JSON.stringify(rA2));

/* ===== B: エアー・ネオス — ATK up by the LP difference; End Phase return ===== */
fresh();
gameState.players[0].mz=[mk('E・HERO ネオス',0,'up'),mk('N・エア・ハミングバード',0,'up')];
let air=mk('E・HERO エアー・ネオス',0,'up');gameState.players[0].ex=[air];gameState.players[0].lp=3000;gameState.players[1].lp=8000;baselineA();
contact('E・HERO エアー・ネオス',0);drive();
ok('B: エアー・ネオス summoned; ATK 2500 + (8000−3000) = 7500',z(air)==='mz'&&curATK(findCardByUid(air.uid).card)===7500,String(z(air)==='mz'&&curATK(findCardByUid(air.uid).card)));
phase('battle');phase('main2');phase('end');
ok('B: returns to the EX Deck in the End Phase',z(air)==='ex');
audit('B');

/* ===== C: フレア・ネオス — ATK +400 per Spell / Trap card on the field (set ones too) ===== */
fresh();
gameState.players[0].mz=[mk('E・HERO ネオス',0,'up'),mk('N・フレア・スカラベ',0,'up')];
let flare=mk('E・HERO フレア・ネオス',0,'up');gameState.players[0].ex=[flare];
gameState.players[0].sz=[mk('サイクロン',0,'down'),mk('聖なるバリア －ミラーフォース－',0,'down')];gameState.players[1].sz=[mk('強欲な壺',1,'up')];baselineA();
contact('E・HERO フレア・ネオス',0,'def');drive();
const fl=findCardByUid(flare.uid);
ok('C: フレア・ネオス summoned in Defense Position (chosen); ATK 2500 + 3×400 = 3700',fl&&fl.zone==='mz'&&fl.card.pos==='def'&&curATK(fl.card)===3700,String(fl&&curATK(fl.card)));
audit('C');

/* ===== D: キメラテック — the opponent's サイバー・ドラゴン + own Machines go to the GY; the materials are chosen; ATK = 1000 × materials ===== */
fresh();
let cd=mk('サイバー・ドラゴン',1,'up');gameState.players[1].mz=[cd];
let m1=mk('サイバー・ドラゴン',0,'up'),m2=mk('メカ・ハンター',0,'down','def');gameState.players[0].mz=[m1,m2];
let ct=mk('キメラテック・フォートレス・ドラゴン',0,'up');gameState.players[0].ex=[ct];baselineA();
const rD=row('キメラテック・フォートレス・ドラゴン',0);
ok('D: legal with a サイバー・ドラゴン and Machines on either field',rD&&rD.ok===true,JSON.stringify(rD));
PREFER=[x=>x.label.split(' ＋ ').length===3];SEEN.length=0;
contact('キメラテック・フォートレス・ドラゴン',0);
drive();PREFER=[];
ok('D: every legal material set is offered (the opponent-side サイバー・ドラゴン marked, the face-down one marked)',SEEN.length===1&&SEEN[0].length>=3&&SEEN[0].some(l=>/（相手）/.test(l))&&SEEN[0].some(l=>/（裏側）/.test(l)),JSON.stringify(SEEN));
const ctH=findCardByUid(ct.uid);
ok('D: the material sets were offered and the 3-monster set was used — all three in their owners\' GYs',z(cd)==='grave'&&findCardByUid(cd.uid).p===1&&z(m1)==='grave'&&z(m2)==='grave',JSON.stringify({cd:z(cd),m1:z(m1),m2:z(m2)}));
ok('D: キメラテック on the field with ATK 3000 (3 materials)',ctH&&ctH.zone==='mz'&&curATK(ctH.card)===3000,String(ctH&&curATK(ctH.card)));
audit('D');

/* ===== F: 「このカードは融合素材にできない」 — a キメラテック on the field is not a Machine material for another one ===== */
fresh();
gameState.players[0].mz=[mk('キメラテック・フォートレス・ドラゴン',0,'up'),mk('サイバー・ドラゴン',0,'up')];gameState.players[0].ex=[mk('キメラテック・フォートレス・ドラゴン',0,'up')];baselineA();
const rF=row('キメラテック・フォートレス・ドラゴン',0);
ok('F: the only other Machine is a キメラテック, which cannot be a fusion material — the procedure is not legal',rF&&rF.ok===false,JSON.stringify(rF));
gameState.players[0].mz.push(mk('メカ・ハンター',0,'up'));
const rF2=row('キメラテック・フォートレス・ドラゴン',0);
ok('F: with another Machine it is legal again',rF2&&rF2.ok===true);

/* ===== E: material text 「…×2」 inside an 「A＋B×2」 line ===== */
const hs=parseMaterialSpec(CARD_DB[findCardIndex('剣闘獣ヘラクレイノス')]);
ok('E: 剣闘獣ヘラクレイノス = 剣闘獣ラクエル + two 「剣闘獣」 monsters',hs&&hs.slots.length===2&&hs.slots[0].nameExact==='剣闘獣ラクエル'&&hs.slots[1].nameIncludes==='剣闘獣'&&hs.slots[1].count.min===2&&hs.slots[1].count.max===2,JSON.stringify(hs&&hs.slots));
`);
