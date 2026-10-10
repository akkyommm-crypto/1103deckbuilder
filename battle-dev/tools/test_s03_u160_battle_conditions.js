/* S03-U160: conditional battle protections with their full texts — 薄幸の乙女, スカー・ウォリアー.
   Engine: the battle record 「このカードと戦闘を行ったモンスター」 (ATTACK action, zone-local battledWithS03) and the continuous
   「相手は…を攻撃対象に選択できない」 (engine/1ZU, checked at the target list / the attack request / the replay pick).
   Real DUEL path: attacks, turns and phases advanced by the processor; Replay-audited, fixed seed. */
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

/* ===== A. 薄幸の乙女 ===== */
harness(COMMON+HELP+String.raw`
fresh();
const maiden=mk('薄幸の乙女',0,'up','atk');gameState.players[0].mz=[maiden];
const giga=mk('ギガンテス',1,'up'),gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[giga,gob];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
const lp0=gameState.players[0].lp;
hitAt(1,giga,maiden);
ok('A: face-up Attack Position 薄幸の乙女 is not destroyed by battle (battle damage still applies)',z(maiden)==='mz'&&gameState.players[0].lp===lp0-1500,JSON.stringify({z:z(maiden),lp:gameState.players[0].lp}));
ok('A: the battle is recorded on both monsters (zone-local)',battledTogetherS03(findCardByUid(giga.uid).card,findCardByUid(maiden.uid).card));
nextTurn();nextTurn();
const g=findCardByUid(giga.uid).card,gb=findCardByUid(gob.uid).card;
ok('A: in its controller\'s next turn, ギガンテス (battled 乙女) cannot change its battle position; ゴブリン突撃部隊 (did not) can',gameState.activePlayer===1&&gameState.phase==='main1'&&!canManualPositionChange(g)&&canManualPositionChange(gb),JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase}));
phase('battle');
ok('A: … and ギガンテス cannot attack; ゴブリン突撃部隊 can',!canDeclareAttackV48(g)&&canDeclareAttackV48(gb));
audit('A');

/* A2. the protection is only in face-up Attack Position */
fresh();
const m2=mk('薄幸の乙女',0,'up','def');gameState.players[0].mz=[m2];
const g2=mk('ギガンテス',1,'up');gameState.players[1].mz=[g2];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
hitAt(1,g2,m2);
ok('A2: in Defense Position 薄幸の乙女 is destroyed by battle',z(m2)==='grave');
audit('A2');
`);

/* ===== B. スカー・ウォリアー ===== */
harness(COMMON+HELP+String.raw`
fresh();
const scar=mk('スカー・ウォリアー',0,'up','atk'),war=mk('ゴブリン突撃部隊',0,'up','atk'),wight=mk('ワイト',0,'up','atk'),fdw=mk('E・HERO クレイマン',0,'down','def');
gameState.players[0].mz=[scar,war,wight,fdw];
const b1=mk('青眼の白龍',1,'up'),b2=mk('青眼の白龍',1,'up');gameState.players[1].mz=[b1,b2];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
const T=battleTargetsV29(b1.uid).targets.map(x=>x.card.uid);
ok('B: the other face-up Warrior (ゴブリン突撃部隊) is not an attack target; スカー・ウォリアー, the Zombie ワイト and the face-down Warrior are',T.indexOf(war.uid)<0&&T.indexOf(scar.uid)>=0&&T.indexOf(wight.uid)>=0&&T.indexOf(fdw.uid)>=0,JSON.stringify(T));
const jl=V41_ACTION_JOURNAL.length;
hitAt(1,b1,war);
ok('B: an attack request at ゴブリン突撃部隊 is refused (no attack declared)',z(war)==='mz'&&!V41_ACTION_JOURNAL.slice(jl).some(x=>x.action.type==='ATTACK_DECLARE_V48'));
hitAt(1,b1,scar);const once=z(scar);
hitAt(1,b2,scar);
ok('B: 「1ターンに1度だけ、戦闘では破壊されない」 — survives the 1st 青眼の白龍, destroyed by the 2nd',once==='mz'&&z(scar)==='grave',JSON.stringify({once,now:z(scar)}));
ok('B: with スカー・ウォリアー gone, ゴブリン突撃部隊 is an attack target again',battleTargetsV29(b1.uid).targets.some(x=>x.card.uid===war.uid),JSON.stringify(battleTargetsV29(b1.uid).targets.map(x=>cardName(x.card))));
audit('B');
`);
