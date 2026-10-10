/* S03-U179: E・HERO ストーム・ネオス / E・HERO マグマ・ネオス — contact fusion, ① / ATK, End Phase return and the separate forced trigger
   「この効果によってこのカードがエクストラデッキに戻った時」 (the card in the EX Deck; only its own End Phase return). Real DUEL paths;
   Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],TRIG=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc();
  if(q){let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function contact(name,p){const i=gameState.players[p].ex.findIndex(c=>cardName(c)===name);finishSummonProcedure(name,p,'ex',i,'atk');drive();}
function fire(c){const hh=findCardByUid(c.uid);const L=strictScriptLegalityV2(cardName(c),hh.p,'mz',hh.index,{});if(!L.ok)return L.reason;duelActivateFromZone(hh.p,'mz',hh.index);drive();return true;}
function fieldCount(){let n=0;gameState.players.forEach(P=>{n+=P.mz.length+P.sz.length+(P.field?1:0);});return n;}

/* ===== A: ストーム・ネオス — ① destroys every Spell / Trap (both sides, field zone too); End Phase return → every field card to the Deck ===== */
fresh();
gameState.players[0].mz=[mk('E・HERO ネオス',0,'up'),mk('N・エア・ハミングバード',0,'up'),mk('N・アクア・ドルフィン',0,'up')];
let storm=mk('E・HERO ストーム・ネオス',0,'up');gameState.players[0].ex=[storm];
let s0=mk('聖なるバリア －ミラーフォース－',0,'down'),s1=mk('サイクロン',1,'down'),f1=mk('ウォーターワールド',1,'up');gameState.players[0].sz=[s0];gameState.players[1].sz=[s1];gameState.players[1].field=f1;
let foe=mk('ギガンテス',1,'up');gameState.players[1].mz=[foe];baselineA();
contact('E・HERO ストーム・ネオス',0);
const r1=fire(storm);
ok('A: ① destroys every Spell / Trap on the field (own set card, the opponent’s set card and field spell)',r1===true&&z(s0)==='grave'&&z(s1)==='grave'&&z(f1)==='grave'&&z(foe)==='mz');
ok('A: ① once per turn',fire(storm)!==true);
TRIG=[];phase('battle');phase('main2');phase('end');
ok('A: End Phase — ストーム・ネオス back to the EX Deck, then its forced trigger returns every field card to its owner’s Deck (shuffled)',
  z(storm)==='ex'&&z(foe)==='deck'&&fieldCount()===0&&TRIG.some(g=>g.indexOf('E・HERO ストーム・ネオス')>=0)
  &&V41_ACTION_JOURNAL.some(x=>x.action.type==='SHUFFLE'&&x.action.player===1),JSON.stringify({s:z(storm),foe:z(foe),n:fieldCount(),TRIG}));
audit('A');

/* ===== B: マグマ・ネオス — ATK +400 per card on the field; End Phase return → every field card to its owner's hand ===== */
fresh();
gameState.players[0].mz=[mk('E・HERO ネオス',0,'up'),mk('N・フレア・スカラベ',0,'up'),mk('N・グラン・モール',0,'up')];
let magma=mk('E・HERO マグマ・ネオス',0,'up');gameState.players[0].ex=[magma];
let m0=mk('聖なるバリア －ミラーフォース－',0,'down'),m1=mk('サイクロン',0,'down');gameState.players[0].sz=[m0,m1];
foe=mk('ギガンテス',1,'up');gameState.players[1].mz=[foe];baselineA();
contact('E・HERO マグマ・ネオス',0);
ok('B: ATK 3000 + 4 cards (itself, 2 set cards, ギガンテス) × 400 = 4600',curATK(findCardByUid(magma.uid).card)===4600,String(curATK(findCardByUid(magma.uid).card)));
TRIG=[];phase('battle');phase('main2');phase('end');
ok('B: End Phase — back to the EX Deck, then every field card returns to its owner’s hand',z(magma)==='ex'&&z(m0)==='hand'&&z(m1)==='hand'&&z(foe)==='hand'&&findCardByUid(foe.uid).p===1&&fieldCount()===0,JSON.stringify({m:z(magma),m0:z(m0),foe:z(foe),n:fieldCount()}));
audit('B');

/* ===== C: returned to the EX Deck by another effect (the opponent's グラン・ネオス) — the follow-up does not activate ===== */
fresh();
magma=mk('E・HERO マグマ・ネオス',0,'up');magma.properlySummonedS03=true;gameState.players[0].mz=[magma];gameState.players[0].sz=[mk('聖なるバリア －ミラーフォース－',0,'down')];
let gran=mk('E・HERO グラン・ネオス',1,'up');gameState.players[1].mz=[gran];gameState.activePlayer=1;baselineA();
TRIG=[];PREFER=[magma.uid];fire(gran);PREFER=[];
ok('C: bounced to the EX Deck by グラン・ネオス — マグマ・ネオス’s trigger is not offered and the field stays',z(magma)==='ex'&&!TRIG.some(g=>g.indexOf('E・HERO マグマ・ネオス')>=0)&&z(gran)==='mz'&&gameState.players[0].sz.length===1,JSON.stringify({m:z(magma),TRIG}));
audit('C');
`);
