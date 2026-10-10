/* S03-U161: conditional battle protections with their full texts — イレカエル, エレキーウィ, 万力魔神バイサー・デス.
   Also: the P4 group GAERU (「ガエル」と名のついた, 10 cards; not イレカエル / サシカエル / 粋カエル), and battleRole in the v21 battle
   protection context. Real DUEL path: activation with Tribute cost, resolution-time Deck choice, attacks, processor turns and
   Standby Phases; Replay-audited, fixed seed. */
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


/* ===== A. イレカエル ===== */
harness(COMMON+HELP+String.raw`
fresh();
const ire=mk('イレカエル',0,'up','atk'),w=mk('ワイト',0,'up','atk');gameState.players[0].mz=[ire,w];
const dg=mk('デスガエル',0),ik=mk('粋カエル',0),sk=mk('サシカエル',0);gameState.players[0].deck=[ik,dg,sk];
baselineA();
PREFER=[uid(w),uid(dg),'atk'];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
const s=seenFor('イレカエル');
ok('A: ignition — ワイト Tributed as the cost; the Deck choice at resolution offers only the 「ガエル」 (デスガエル; not 粋カエル / サシカエル)',z(w)==='grave'&&s.length>=1&&JSON.stringify(s.find(x=>/特殊召喚/.test(x.title)).names)==='["デスガエル"]',JSON.stringify(SEEN));
ok('A: デスガエル is Special Summoned from the Deck',z(dg)==='mz'&&journal('FX_SPECIAL_SUMMON').length===1);
audit('A summon');

fresh();SEEN=[];
const i2=mk('イレカエル',0,'up','atk'),og=mk('鬼ガエル',0,'up','atk');gameState.players[0].mz=[i2,og];
const og1=mk('鬼ガエル',1,'up','atk');gameState.players[1].mz=[mk('青眼の白龍',1,'up'),mk('青眼の白龍',1,'up'),mk('青眼の白龍',1,'up'),og1];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
const A=gameState.players[1].mz.slice(0,3);
hitAt(1,A[0],og);const first=z(og);
hitAt(1,A[1],i2);const ireGone=z(i2);
hitAt(1,A[2],og);
ok('A: while イレカエル is face-up, 鬼ガエル is not destroyed by battle; イレカエル itself (not a 「ガエル」) is; then 鬼ガエル is',first==='mz'&&ireGone==='grave'&&z(og)==='grave',JSON.stringify({first,ireGone,now:z(og)}));
audit('A protection');

fresh();
const i3=mk('イレカエル',0,'up','atk'),o3=mk('鬼ガエル',1,'up','atk');gameState.players[0].mz=[i3,mk('青眼の白龍',0,'up')];gameState.players[1].mz=[o3];
decks();gameState.phase='battle';baselineA();
hitAt(0,gameState.players[0].mz[1],o3);
ok('A: the opponent\'s 「ガエル」 monster is protected too (「「ガエル」と名のついたモンスターは」)',z(o3)==='mz');
audit('A opponent');

fresh();
const i4=mk('イレカエル',0,'down','def'),o4=mk('鬼ガエル',0,'up','atk');gameState.players[0].mz=[i4,o4];gameState.players[1].mz=[mk('青眼の白龍',1,'up')];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
hitAt(1,gameState.players[1].mz[0],o4);
ok('A: a face-down イレカエル applies no protection',z(o4)==='grave');
audit('A face-down');
ok('A: GROUP.GAERU is exactly the 10 「ガエル」 names (イレカエル / サシカエル / 粋カエル are not members)',
  ['デスガエル','鬼ガエル','黄泉ガエル','ガエル・サンデス'].every(n=>isCardInGroupV4(CARD_DB[findCardIndex(n)],GROUP.GAERU))&&!['イレカエル','サシカエル','粋カエル'].some(n=>isCardInGroupV4(CARD_DB[findCardIndex(n)],GROUP.GAERU))&&CARD_DB.filter(d=>d&&d.n&&isCardInGroupV4(d,GROUP.GAERU)).length===10);
`);

/* ===== B. エレキーウィ ===== */
harness(COMMON+HELP+String.raw`
fresh();
const kiwi=mk('エレキーウィ',0,'up','atk'),tsu=mk('エレキツツキ',0,'up','atk');gameState.players[0].mz=[kiwi,tsu];
const bew=mk('青眼の白龍',1,'up');gameState.players[1].mz=[bew];
decks();gameState.phase='battle';baselineA();
hitAt(0,tsu,bew);const t1=z(tsu);
hitAt(0,kiwi,bew);
ok('B: 「エレキ」 monsters that attack are not destroyed by battle (エレキツツキ, and エレキーウィ itself)',t1==='mz'&&z(kiwi)==='mz'&&z(bew)==='mz',JSON.stringify({t1,kiwi:z(kiwi)}));
audit('B attack');

fresh();
const k2=mk('エレキーウィ',0,'up','atk'),t2=mk('エレキツツキ',0,'up','atk');gameState.players[0].mz=[k2,t2];gameState.players[1].mz=[mk('青眼の白龍',1,'up')];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
hitAt(1,gameState.players[1].mz[0],t2);
ok('B: an attacked 「エレキ」 monster (not attacking) is destroyed by battle',z(t2)==='grave');
audit('B attacked');
`);

/* ===== C. 万力魔神バイサー・デス ===== */
harness(COMMON+HELP+String.raw`
fresh();
for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));
const vice=mk('万力魔神バイサー・デス',0);gameState.players[0].hand=[vice];
const gob=mk('ゴブリン突撃部隊',1,'up'),giga=mk('ギガンテス',1,'up');gameState.players[1].mz=[gob,giga];
baselineA();
PREFER=[uid(gob)];doNormalSummon(0,'atk');drive();PREFER=[];
ok('C: summoned — the forced trigger targets ゴブリン突撃部隊 (on the chain, resolved, a schedule registered)',z(vice)==='mz'&&chains('万力魔神バイサー・デス').length===1&&findCardByUid(gob.uid).card.u161ViceMarkedBy===vice.uid,JSON.stringify({trig:TRIG,seen:SEEN.map(s=>s.title)}));
nextTurn();phase('battle');
hitAt(1,giga,vice);
ok('C: in the opponent\'s turn, while the target is on the field, バイサー・デス is not destroyed by battle',z(vice)==='mz'&&gameState.turn===6);
nextTurn();const t7=z(gob);nextTurn();nextTurn();const t9=z(gob);nextTurn();nextTurn();
ok('C: the target is destroyed at the 3rd own Standby Phase after activation (turn 11), not at the 1st / 2nd (turns 7 / 9)',t7==='mz'&&t9==='mz'&&z(gob)==='grave'&&gameState.turn===11,JSON.stringify({t7,t9,now:z(gob),turn:gameState.turn}));
nextTurn();phase('battle');
hitAt(1,findCardByUid(giga.uid).card,findCardByUid(vice.uid).card);
ok('C: with the target gone, バイサー・デス is destroyed by battle',z(vice)==='grave'&&gameState.turn===12);
audit('C');
`);
