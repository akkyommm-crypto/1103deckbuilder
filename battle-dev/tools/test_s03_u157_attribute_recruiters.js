/* S03-U157: the six attribute recruiters on the shared deck-trigger engine (engine/1ZT).
   2011 text: 「このカードが戦闘によって破壊され墓地へ送られた時、デッキから攻撃力1500以下の○属性モンスター1体を表側攻撃表示で
   特殊召喚する事ができる。」 Real DUEL path: destroyed by an attack → optional trigger → chain → the Deck is examined at RESOLUTION
   (the choice opens after the chain link, not at activation) → face-up Attack Position → the battle goes on. With no candidate the
   trigger is still activatable and resolves doing nothing (Deck shuffled). Replay-audited, fixed seed. */
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

/* ===== A. each recruiter: exactly the ATK ≤ 1500 monster of its Attribute (not the same Attribute at 1600+, not another Attribute) ===== */
harness(COMMON+String.raw`
const CASES=[['キラー・トマト','闇'],['シャインエンジェル','光'],['巨大ネズミ','地'],['グリズリーマザー','水'],['ドラゴンフライ','風'],['UFOタートル','炎']];
const MAIN=CARD_DB.filter(d=>d&&d.k==='m'&&!d.ex&&d.n&&(d.st||[]).indexOf('通常')>=0);
for(const [name,at] of CASES){
  fresh();SEEN=[];TRIG=[];
  const match=MAIN.find(d=>d.at===at&&Number(d.atk)===1500)||MAIN.find(d=>d.at===at&&Number(d.atk)<=1500);
  const high=MAIN.find(d=>d.at===at&&Number(d.atk)>1500&&Number(d.atk)<=1700);
  const other=MAIN.find(d=>d.at!==at&&Number(d.atk)===1500);
  const me=mk(name,0,'up');gameState.players[0].mz=[me];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
  const m=mk(match.n,0);gameState.players[0].deck=[mk(high.n,0),m,mk(other.n,0)];
  gameState.activePlayer=1;gameState.phase='battle';
  baselineA();
  PREFER=[uid(m)];atk(1,0);drive();PREFER=[];
  const s=seenFor(name)[0],h=findCardByUid(m.uid);
  const J=V41_ACTION_JOURNAL.map(x=>x.action.type);
  const iChain=J.indexOf('CHAIN_ADD'),iChoice=J.indexOf('CHOICE_OPEN_V49');
  ok('A '+name+': optional trigger; at resolution offers only '+match.n+' (not '+high.n+' / '+other.n+') → face-up Attack Position',
    z(me)==='grave'&&evOffered(name)&&!evForced(name)&&!!s&&JSON.stringify(s.names)===JSON.stringify([match.n])&&!!h&&h.zone==='mz'&&h.card.face==='up'&&h.card.pos==='atk'&&seenFor(name).length===1,
    JSON.stringify({seen:SEEN,trig:TRIG,zone:h&&h.zone,pos:h&&h.card.pos}));
  ok('A '+name+': the Deck is examined at resolution (the choice opens after the chain link), the battle goes on',iChain>=0&&iChoice>iChain&&gameState.phase==='battle'&&!gameState.processorPaused&&!pc(),JSON.stringify({iChain,iChoice}));
  audit('A '+name);
}
`);

/* ===== B. no candidate, declining, Special Summon lock ===== */
harness(COMMON+String.raw`
fresh();
const kt=mk('キラー・トマト',0,'up');gameState.players[0].mz=[kt];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const bew=mk('青眼の白龍',0);gameState.players[0].deck=[bew,mk('クィーンズ・ナイト',0)];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0);drive();
ok('B: no ATK ≤ 1500 DARK monster in the Deck — the trigger is still activated and resolves doing nothing, the Deck is shuffled',chains('キラー・トマト').length===1&&!seenFor('キラー・トマト').length&&z(bew)==='deck'&&journal('SHUFFLE').length===1&&!journal('FX_SPECIAL_SUMMON').length&&gameState.phase==='battle'&&!gameState.processorPaused,JSON.stringify({trig:TRIG,seen:SEEN}));
audit('B no candidate');

fresh();SEEN=[];TRIG=[];SKIP_OPTIONAL=true;
const se=mk('シャインエンジェル',0,'up');gameState.players[0].mz=[se];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
const se2=mk('シャインエンジェル',0);gameState.players[0].deck=[se2];gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0);drive();SKIP_OPTIONAL=false;
ok('B: the optional trigger can be declined — nothing is summoned',evOffered('シャインエンジェル')&&!chains('シャインエンジェル').length&&z(se2)==='deck');
audit('B declined');

fresh();SEEN=[];TRIG=[];
const gn=mk('巨大ネズミ',0,'up');gameState.players[0].mz=[gn];gameState.players[1].mz=[mk('大天使クリスティア',1,'up')];
const gn2=mk('巨大ネズミ',0);gameState.players[0].deck=[gn2];gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0);drive();
ok('B: under 大天使クリスティア 巨大ネズミ is not offered and nothing is summoned',z(gn)==='grave'&&!evOffered('巨大ネズミ')&&z(gn2)==='deck',JSON.stringify(TRIG));
audit('B lock');

/* two in a row: the summoned copy is destroyed by the next attack and recruits again (a chain of recruiters) */
fresh();SEEN=[];TRIG=[];
const d1=mk('ドラゴンフライ',0,'up');gameState.players[0].mz=[d1];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up'),mk('ギガンテス',1,'up')];
const d2=mk('ドラゴンフライ',0),d3=mk('ドラゴンフライ',0);gameState.players[0].deck=[d2,d3];gameState.activePlayer=1;gameState.phase='battle';baselineA();
atk(1,0);drive();
const firstOk=z(d1)==='grave'&&[d2,d3].filter(c=>z(c)==='mz').length===1;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:1,target:0});drive();
ok('B: ドラゴンフライ recruits ドラゴンフライ, which is destroyed by the next attack and recruits the last one',firstOk&&chains('ドラゴンフライ').length===2&&[d1,d2,d3].filter(c=>z(c)==='grave').length===2&&[d2,d3].filter(c=>z(c)==='mz').length===1,JSON.stringify({z:[d1,d2,d3].map(z),trig:TRIG}));
audit('B chain of recruiters');
`);
