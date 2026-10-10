/* S03-U162: マイン・モール — once-per-turn battle protection, draw when used for a Beast Synchro Summon, banished when it leaves the
   field by the opponent's card effect (engine: banishWhenLeavesByOpponentEffectS03 from the move action's P3 stamp; FX_BOUNCE /
   FX_RETURN_DECK are now stamped too). Synchro Summons use legal materials (exCombos). Real DUEL path; Replay-audited, fixed seed. */
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

const HELP=String.raw`
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function decks(){for(let p=0;p<2;p++) gameState.players[p].deck=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];}
function hitAt(p,atkCard,target){const ai=gameState.players[p].mz.indexOf(atkCard),ti=gameState.players[p===0?1:0].mz.indexOf(target);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
`;


harness(COMMON+HELP+String.raw`
function synchroWith(tuner,exName){
  fresh();SEEN=[];TRIG=[];
  const mole=mk('マイン・モール',0,'up','atk'),tu=mk(tuner,0,'up','atk');gameState.players[0].mz=[tu,mole];
  const ex=mk(exName,0);gameState.players[0].ex=[ex];
  decks();baselineA();
  const hand0=gameState.players[0].hand.length;
  const cb=exCombos(0,dbOf(ex)).combos;
  if(cb.length) beginExSummonV2(0,0,cb[0].materials,'synchro','atk');
  drive();
  return {mole,ex,hand0,legal:cb.length>0};
}
/* A. Beast Synchro (ナチュル・ビースト: EARTH Tuner TG ストライカー + EARTH non-Tuner マイン・モール) → draw 1 */
let r=synchroWith('TG ストライカー','ナチュル・ビースト');
ok('A: used as material for the Beast Synchro ナチュル・ビースト (legal materials) — forced trigger, its controller draws 1',r.legal&&z(r.ex)==='mz'&&z(r.mole)==='grave'&&chains('マイン・モール').length===1&&gameState.players[0].hand.length===r.hand0+1,JSON.stringify({legal:r.legal,ex:z(r.ex),trig:TRIG,hand:gameState.players[0].hand.length}));
audit('A');
/* B. non-Beast Synchro (ゴヨウ・ガーディアン, Warrior) → no trigger */
r=synchroWith('カラクリ参謀 弐四八','ゴヨウ・ガーディアン');
ok('B: used for the Warrior Synchro ゴヨウ・ガーディアN — no trigger, no draw'.replace('N','ン'),r.legal&&z(r.ex)==='mz'&&!chains('マイン・モール').length&&gameState.players[0].hand.length===r.hand0);
audit('B');
`);

harness(COMMON+HELP+String.raw`
/* C. once per turn not destroyed by battle; a battle destruction is not 「効果によって」 → GY */
fresh();
const m1=mk('マイン・モール',0,'up','atk');gameState.players[0].mz=[m1];
const g1=mk('ゴブリン突撃部隊',1,'up'),g2=mk('ギガンテス',1,'up');gameState.players[1].mz=[g1,g2];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
hitAt(1,g1,m1);const once=z(m1);hitAt(1,g2,m1);
ok('C: survives the 1st battle of the turn, destroyed by the 2nd and sent to the GY (battle is not an effect)',once==='mz'&&z(m1)==='grave',JSON.stringify({once,now:z(m1)}));
audit('C');

/* D. destroyed by the opponent's サンダー・ボルト → banished */
fresh();
const m2=mk('マイン・モール',0,'up','atk');gameState.players[0].mz=[m2];gameState.players[1].hand=[mk('サンダー・ボルト',1)];
decks();gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('D: destroyed by the opponent\'s card effect (サンダー・ボルト) — banished instead of going to the GY',z(m2)==='banish',JSON.stringify(z(m2)));
audit('D');

/* E. returned to the hand by the opponent's 強制脱出装置 → banished */
fresh();
const m3=mk('マイン・モール',0,'up','atk');gameState.players[0].mz=[m3];
const ej=mk('強制脱出装置',1,'down');ej.setTurn=4;gameState.players[1].sz=[ej];
decks();gameState.activePlayer=1;baselineA();
PREFER=[uid(m3)];duelActivateFromZone(1,'sz',0);drive();PREFER=[];
ok('E: returned to the hand by the opponent\'s card effect (強制脱出装置) — banished instead',z(m3)==='banish',JSON.stringify(z(m3)));
audit('E');

/* F. destroyed by its controller's own ブラック・ホール → GY (not the opponent's effect) */
fresh();
const m4=mk('マイン・モール',0,'up','atk');gameState.players[0].mz=[m4];gameState.players[0].hand=[mk('ブラック・ホール',0)];gameState.players[1].mz=[mk('ワイト',1,'up')];
decks();baselineA();
duelActivateFromHand(0);drive();
ok('F: destroyed by its controller\'s own card effect (ブラック・ホール) — sent to the GY',z(m4)==='grave');
audit('F');

/* G. both players' monsters destroyed by the opponent's ブラック・ホール: マイン・モール banished, the other monsters to the GY */
fresh();
const m5=mk('マイン・モール',0,'up','atk'),w5=mk('ワイト',0,'up','atk');gameState.players[0].mz=[m5,w5];gameState.players[1].hand=[mk('ブラック・ホール',1)];gameState.players[1].mz=[mk('ワイト',1,'up')];
decks();gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('G: the opponent\'s ブラック・ホール (mass destruction) — マイン・モール banished, ワイト to the GY',z(m5)==='banish'&&z(w5)==='grave');
audit('G');
`);
