/* S03-U159: a Tribute Summon's leave-field events and its summon success are one simultaneous event (one SEGOC chain):
   the Tributed クリッター / 黒き森のウィッチ trigger in the same group as the summoned monarch's 「アドバンス召喚に成功した場合」 trigger.
   Before, the Tributes' triggers formed a chain of their own and resolved before the summon trigger was even collected.
   The summon-success trap window (奈落の落とし穴) still follows. Real DUEL path, Replay-audited, fixed seed. */
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

harness(COMMON+String.raw`
function tributeFor(monarch,fodder,oppSet){
  fresh();SEEN=[];TRIG=[];
  const f=mk(fodder,0,'up');gameState.players[0].mz=[f];
  const m=mk(monarch,0);gameState.players[0].hand=[m];
  const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
  if(oppSet){const t=mk(oppSet,1,'down');t.setTurn=4;gameState.players[1].sz=[t];}
  const q=mk('クィーンズ・ナイト',0),x=mk('X－ヘッド・キャノン',0);gameState.players[0].deck=[q,x];
  baselineA();
  PREFER=[uid(f),uid(foe)];doNormalSummon(0,'atk');drive();PREFER=[];
  return {f,m,foe,q,x};
}
for(const [monarch,fodder,label] of [['風帝ライザー','クリッター','A'],['邪帝ガイウス','黒き森のウィッチ','B']]){
  const r=tributeFor(monarch,fodder);
  const g=TRIG.find(e=>e.names.indexOf(monarch)>=0);
  ok(label+': '+fodder+' (Tributed) and '+monarch+' (Tribute Summon success) are offered in the same forced group',!!g&&g.forced&&g.names.indexOf(fodder)>=0,JSON.stringify(TRIG));
  const links=journal('CHAIN_ADD').map(x=>x.action.name||(x.action.link&&x.action.link.name));
  ok(label+': one chain with both links, both resolve ('+fodder+' searches, '+monarch+' removes ワイト)',links.indexOf(monarch)>=0&&links.indexOf(fodder)>=0&&journal('FX_SEARCH').length===1&&z(r.foe)!=='mz'&&z(r.m)==='mz',JSON.stringify({links,foe:z(r.foe),m:z(r.m)}));
  ok(label+': the summon-success window closes after the batch chain (no stuck 「召喚成功直後」 timing, the Main Phase goes on)',!gameState.timingWindow&&!gameState.processorPaused&&!pc()&&!EVT_V2_STATE,JSON.stringify(gameState.timingWindow));
  audit(label);
}
/* C. the summon-success response window stays: 奈落の落とし穴 destroys and banishes the summoned monarch */
{
  const r=tributeFor('風帝ライザー','クリッター','奈落の落とし穴');
  ok('C: after the Tribute batch, 奈落の落とし穴 still answers the summon success (風帝ライザー banished) and クリッター still searched',z(r.m)==='banish'&&journal('FX_SEARCH').length===1,JSON.stringify({m:z(r.m),trig:TRIG,seen:SEEN.map(s=>s.title)}));
  audit('C');
}
`);
