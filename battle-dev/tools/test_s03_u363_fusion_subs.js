/* S03-U363: イリュージョン・シープ, 心眼の女神, 沼地の魔獣王, 破壊神 ヴァサーゴ (Fusion Material substitutes, the text rule of S03-U134).
   Real DUEL path: 融合 offers the Fusion Monsters that need a substitute, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3630001;
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



const SUBS=['イリュージョン・シープ','心眼の女神','沼地の魔獣王','破壊神 ヴァサーゴ'];
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function offered(spell){return fusionSpellOptionsS03(0,spell).map(o=>o.ex.db.n);}

SUBS.forEach(sb=>{
  /* A: the substitute stands in for one named material of the Fusion Monster */
  { fresh();const s=mk(sb,0),bl=mk('E・HERO バーストレディ',0),poly=mk('融合',0);
    gameState.players[0].hand=[poly,s,bl];
    const fw=mk('E・HERO フレイム・ウィングマン',0),rg=mk('E・HERO ランパートガンナー',0);gameState.players[0].ex=[fw,rg];baselineA();
    ok(sb+': with バーストレディ, フレイム・ウィングマン (for フェザーマン) and ランパートガンナー (for クレイマン) are offered',JSON.stringify(offered('融合'))==='["E・HERO フレイム・ウィングマン","E・HERO ランパートガンナー"]',JSON.stringify(offered('融合')));
    PREFER=[uid(fw),'atk'];duelActivateFromHand(0);drive();PREFER=[];
    ok(sb+': フレイム・ウィングマン Fusion Summoned; the substitute and バーストレディ are Fusion Materials in the Graveyard',pz(fw)==='mz'&&fw.specialSummonKind==='fusion'&&pz(s)==='grave'&&pz(bl)==='grave'&&s.fusionMaterialS03==='融合',JSON.stringify({fw:pz(fw),s:pz(s),bl:pz(bl)}));
    audit(sb+' A'); }
  /* B: the other material must be a regular one */
  { fresh();const s=mk(sb,0),ea=mk('E・HERO エアーマン',0),poly=mk('融合',0);
    gameState.players[0].hand=[poly,s,ea];gameState.players[0].ex=[mk('E・HERO フレイム・ウィングマン',0),mk('E・HERO ランパートガンナー',0)];baselineA();
    ok(sb+' negative: with a non-material (エアーマン) nothing is offered',offered('融合').length===0,JSON.stringify(offered('融合'))); }
  /* C: only one substitute per Fusion Summon */
  { fresh();const s=mk(sb,0),s2=mk('沼地の魔神王',0),poly=mk('融合',0);
    gameState.players[0].hand=[poly,s,s2];gameState.players[0].ex=[mk('E・HERO フレイム・ウィングマン',0),mk('E・HERO ランパートガンナー',0)];baselineA();
    ok(sb+' negative: two substitutes together are not enough',offered('融合').length===0,JSON.stringify(offered('融合'))); }
});

console.log('U363 done');
`);
