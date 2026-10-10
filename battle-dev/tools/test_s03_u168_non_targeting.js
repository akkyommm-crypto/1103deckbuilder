/* S03-U168: 「対象を取らない（対象を指定しない）効果では破壊されない」 in the real chain path. The v21 effect-destruction context now
   knows whether the destroying effect targeted THIS card from the action's source stamp (a.srcS03.tg = the resolving targeting
   link's targeted uids; engine/1R + 1ZG). Before, it read the top of gs.chain — empty while a link resolves — so every effect counted
   as non-targeting. Also 異次元竜 トワイライトゾーンドラゴン is limited to Spell / Trap sources as its text says. Real DUEL path. */
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
function oppCasts(defNames,handNames){
  fresh();SEEN=[];TRIG=[];
  const D=defNames.map(n=>mk(n,0,'up','atk'));gameState.players[0].mz=D.slice();
  gameState.players[1].hand=handNames.map(n=>mk(n,1));
  decks();gameState.activePlayer=1;baselineA();
  return D;
}
function cast(i,prefer){PREFER=prefer||[];duelActivateFromHand(i);drive();PREFER=[];}
/* A. 深海王デビルシャーク: once per turn, non-targeting effects */
let D=oppCasts(['深海王デビルシャーク','ワイト'],['サンダー・ボルト','サンダー・ボルト']);
cast(0);const once=z(D[0]),w1=z(D[1]);
cast(0);
ok('A: 1st サンダー・ボルト (non-targeting) — 深海王デビルシャーク is not destroyed, ワイト is; the 2nd one that turn destroys it (once per turn)',once==='mz'&&w1==='grave'&&z(D[0])==='grave',JSON.stringify({once,w1,now:z(D[0])}));
audit('A');
/* B. a targeting effect destroys it even though the once-per-turn protection is unused */
D=oppCasts(['深海王デビルシャーク'],['死者への手向け','ワイト']);
cast(0,[uid(gameState.players[1].hand[1]),uid(D[0])]);
ok('B: 死者への手向け targeting 深海王デビルシャーク destroys it',z(D[0])==='grave',JSON.stringify({z:z(D[0]),seen:SEEN.map(s=>s.title)}));
audit('B');
/* C. 異次元竜 トワイライトゾーンドラゴン: non-targeting Spell / Trap effects, no count */
D=oppCasts(['異次元竜 トワイライトゾーンドラゴン'],['サンダー・ボルト','サンダー・ボルト']);
cast(0);cast(0);
ok('C: two サンダー・ボルト (non-targeting Spells) — 異次元竜 トワイライトゾーンドラゴン is not destroyed',z(D[0])==='mz');
audit('C');
D=oppCasts(['異次元竜 トワイライトゾーンドラゴン'],['死者への手向け','ワイト']);
cast(0,[uid(gameState.players[1].hand[1]),uid(D[0])]);
ok('C: 死者への手向け targeting it destroys it',z(D[0])==='grave');
audit('C target');
/* D. the Spell / Trap limit concerns effect destruction only: the battle protection (「攻撃力1900以下のモンスターとの戦闘では破壊されない」)
   in the same record still applies */
fresh();
const tz=mk('異次元竜 トワイライトゾーンドラゴン',0,'up','def');gameState.players[0].mz=[tz];
const gi=mk('ギガンテス',1,'up'),bew=mk('青眼の白龍',1,'up');gameState.players[1].mz=[gi,bew];
decks();gameState.activePlayer=1;gameState.phase='battle';baselineA();
hitAt(1,gi,tz);const vsGiga=z(tz);hitAt(1,bew,tz);
ok('D: not destroyed by ギガンテス (ATK 1900); destroyed by 青眼の白龍 (3000)',vsGiga==='mz'&&z(tz)==='grave',JSON.stringify({vsGiga,now:z(tz)}));
audit('D');
`);
