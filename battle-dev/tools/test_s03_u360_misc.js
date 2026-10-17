/* S03-U360: サイバー・オーガ・2, E・HERO ブルーメ, E・HERO フラッシュ, サイバー・ヴァリー.
   Real DUEL paths (battle-time ATK, a forced attack target with growth, a banish-for-search trigger, a three-mode banisher), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3600001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}



const OG2='サイバー・オーガ・2',BLU='E・HERO ブルーメ',FLA='E・HERO フラッシュ',VAL='サイバー・ヴァリー';
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== サイバー・オーガ・2 ===== */
{ fresh();const o=mon(OG2,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[o];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,o,f);
  ok('オーガ・2: attacking 青眼 (3000): ATK 2600 + 1500 = 4100 -> 青眼 destroyed, 1100 battle damage',z(f)==='grave'&&z(o)==='mz'&&lp(1)===l1-1100,JSON.stringify({f:z(f),o:z(o),loss:l1-lp(1)}));
  ok('オーガ・2: the bonus is only for the attack (2600 afterwards)',curATK(C(o))===2600,String(curATK(C(o))));
  audit('オーガ2 1'); }
{ fresh();const o=mon(OG2,1),f=mon('ワイト',0);gameState.players[0].mz=[f];gameState.players[1].mz=[o];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(o,f);
  ok('オーガ・2 (opponent side attacker): ATK 2600 + 150 = 2750 vs ワイト (300): 2450 battle damage to me',z(f)==='grave'&&lp(0)===l0-2450,JSON.stringify({f:z(f),loss:l0-lp(0)})); }

/* ===== E・HERO ブルーメ ===== */
{ fresh();const b=mon(BLU,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,w);
  ok('ブルーメ: the opponent can attack only ブルーメ (ワイト untouched)',z(w)==='mz'&&lp(0)===l0,JSON.stringify({w:z(w),loss:l0-lp(0)}));
  audit('ブルーメ 1'); }
{ fresh();const b=mon(BLU,0),w=mon('ワイト',1);gameState.players[0].mz=[b];gameState.players[1].mz=[w];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,b,w);
  ok('ブルーメ: battle damage to the opponent (1900 - 200 DEF? ワイト ATK 300 -> 1600) -> ATK +200 and DEF -200',lp(1)===l1-1600&&curATK(C(b))===2100&&curDEF(C(b))===1800,JSON.stringify({loss:l1-lp(1),a:curATK(C(b)),d:curDEF(C(b))})); }
{ fresh();const g=mk(BLU,0),rv=mk('死者蘇生',0);gameState.players[0].grave=[g];gameState.players[0].hand=[rv];baselineA();
  cast(0,'死者蘇生',[g.uid]);
  ok('ブルーメ: only 「ブルーメンブラット」 can Special Summon it (死者蘇生 does not)',pz(g)==='grave',pz(g)); }

/* ===== E・HERO フラッシュ ===== */
{ fresh();const fl=mon(FLA,0),h1=mk('E・HERO クレイマン',0),h2=mk('E・HERO バーストレディ',0),h3=mk('E・HERO フェザーマン',0),sp=mk('ブラック・ホール',0),qk=mk('サイクロン',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[fl];gameState.players[0].grave=[h1,h2,h3,sp,qk];gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[h1.uid,h2.uid,h3.uid,sp.uid];foeAttack(f,fl);PREFER=[];
  ok('フラッシュ: destroyed by battle -> banished with 3 differently named E・HERO; the Normal Spell (ブラック・ホール) is in the hand',pz(sp)==='hand'&&pz(fl)==='banish'&&[h1,h2,h3].every(c=>pz(c)==='banish'),JSON.stringify({sp:pz(sp),fl:pz(fl),h:[h1,h2,h3].map(pz)}));
  ok('フラッシュ: the Quick-Play Spell (サイクロン) is not a Normal Spell - stays',pz(qk)==='grave',pz(qk));
  audit('フラッシュ 1'); }
{ fresh();const fl=mon(FLA,0),h1=mk('E・HERO クレイマン',0),h2=mk('E・HERO クレイマン',0),h3=mk('E・HERO バーストレディ',0),sp=mk('ブラック・ホール',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[fl];gameState.players[0].grave=[h1,h2,h3,sp];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,fl);
  ok('フラッシュ negative: only 2 different names in the Graveyard -> no search',pz(sp)==='grave'&&pz(fl)==='grave',JSON.stringify({sp:pz(sp),fl:pz(fl)})); }

/* ===== サイバー・ヴァリー ===== */
{ fresh();const v=mon(VAL,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[v];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const h0=gameState.players[0].hand.length,l0=lp(0);foeAttack(f,v);
  ok('ヴァリー: attacked -> banished itself, drew 1, the Battle Phase ended (no damage)',pz(v)==='banish'&&gameState.players[0].hand.length===h0+1&&lp(0)===l0&&gameState.phase!=='battle',JSON.stringify({v:pz(v),hand:gameState.players[0].hand.length-h0,phase:gameState.phase}));
  audit('ヴァリー 1'); }
{ fresh();const v=mon(VAL,0),w=mon('ワイト',0);gameState.players[0].mz=[v,w];baselineA();
  const d0=gameState.players[0].deck.length;
  actC(v,['swap',w.uid]);
  ok('ヴァリー: main phase -> banished with ワイト, drew 2',pz(v)==='banish'&&pz(w)==='banish'&&gameState.players[0].deck.length===d0-2,JSON.stringify({v:pz(v),w:pz(w),d:d0-gameState.players[0].deck.length})); }
{ fresh();const v=mon(VAL,0),h=mk('サイクロン',0),g=mk('ブラック・ホール',0);gameState.players[0].mz=[v];gameState.players[0].hand=[h];gameState.players[0].grave=[g];baselineA();
  actC(v,['recycle',h.uid,g.uid]);
  ok('ヴァリー: main phase -> banished with a hand card, the Graveyard card is back on top of the Deck',pz(v)==='banish'&&pz(h)==='banish'&&pz(g)==='deck'&&API.deckTop(0,1)[0].card.uid===g.uid,JSON.stringify({v:pz(v),h:pz(h),g:pz(g)}));
  audit('ヴァリー 2'); }

console.log('U360 done');
`);
