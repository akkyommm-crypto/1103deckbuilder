/* S03-U352: フュージョニストキラー, マックス・ウォリアー, メンタルプロテクター, マジシャンズ・エイプ.
   Real DUEL paths (Damage Step stat hooks, a Standby upkeep, an attack lock, a control steal until the End Phase), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3520001;
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



const FKI='フュージョニストキラー',MAX='マックス・ウォリアー',MEN='メンタルプロテクター',APE='マジシャンズ・エイプ';
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== フュージョニストキラー ===== */
{ fresh();const k=mon(FKI,0),f=mon('E・HERO フレイム・ウィングマン',1);gameState.players[0].mz=[k];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);foeAttack(f,k);
  ok('フュージョニストキラー: a Fusion Monster (2100) attacks it -> ATK 0 in the Damage Step: the Fusion is destroyed, its controller takes 1400',z(f)==='grave'&&z(k)==='mz'&&lp(1)===l1-1400,JSON.stringify({f:z(f),k:z(k),loss:l1-lp(1)}));
  audit('キラー 1'); }
{ fresh();const k=mon(FKI,0),f=mon('E・HERO フレイム・ウィングマン',1);gameState.players[0].mz=[k];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,k,f);
  ok('フュージョニストキラー: it attacks the Fusion Monster in Attack Position -> its ATK 0: destroyed, 1400 damage',z(f)==='grave'&&lp(1)===l1-1400,JSON.stringify({f:z(f),loss:l1-lp(1)})); }
{ fresh();const k=mon(FKI,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[k];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,k);
  ok('フュージョニストキラー control: a non-Fusion monster attacks -> the killer is destroyed',z(k)==='grave'&&z(f)==='mz',JSON.stringify({k:z(k),f:z(f)})); }

/* ===== マックス・ウォリアー ===== */
{ fresh();const m=mon(MAX,0),w=mon('ワイト',1);gameState.players[0].mz=[m];gameState.players[1].mz=[w];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,m,w);
  ok('マックス・ウォリアー: attacks ワイト (300): ATK 1800+400 -> 1900 damage, destroyed',z(w)==='grave'&&lp(1)===l1-1900,JSON.stringify({w:z(w),loss:l1-lp(1)}));
  ok('マックス・ウォリアー: destroyed a monster -> Level 2, original ATK/DEF halved (900/400)',curLV(C(m))===2&&curATK(C(m))===900&&curDEF(C(m))===400,JSON.stringify({lv:curLV(C(m)),a:curATK(C(m)),d:curDEF(C(m))}));
  audit('マックス 1');
  endTurn();
  ok('マックス・ウォリアー: still halved during the opponent turn',curATK(C(m))===900&&curLV(C(m))===2,JSON.stringify({a:curATK(C(m)),lv:curLV(C(m))}));
  endTurn();
  ok('マックス・ウォリアー: back to Level 4, 1800/800 after my next Standby Phase',curATK(C(m))===1800&&curLV(C(m))===4&&curDEF(C(m))===800,JSON.stringify({a:curATK(C(m)),lv:curLV(C(m)),d:curDEF(C(m))})); }
{ fresh();const m=mon(MAX,0);gameState.players[0].mz=[m];gameState.players[1].mz=[];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,m,'direct');
  ok('マックス・ウォリアー control: a direct attack has no bonus (1800) and no shrink',lp(1)===l1-1800&&curATK(C(m))===1800,JSON.stringify({loss:l1-lp(1),a:curATK(C(m))})); }

/* ===== メンタルプロテクター ===== */
{ fresh();const p=mon(MEN,0);gameState.players[0].mz=[p];baselineA();
  endTurn();ok('メンタルプロテクター: the opponent Standby Phase costs nothing',lp(0)===8000,String(lp(0)));
  endTurn();ok('メンタルプロテクター: my Standby Phase -> 500 LP paid',lp(0)===7500&&z(p)==='mz',JSON.stringify({lp:lp(0),z:z(p)}));
  audit('プロテクター 1'); }
{ fresh();const p=mon(MEN,0);gameState.players[0].mz=[p];gameState.players[0].lp=300;baselineA();
  endTurn();endTurn();
  ok('メンタルプロテクター: cannot pay 500 -> destroyed',z(p)==='grave',z(p)); }
{ fresh();const p=mon(MEN,0),w=mon('ワイト',1),g=mon('青眼の白龍',1);gameState.players[0].mz=[p];gameState.players[1].mz=[w,g];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(w,p);
  ok('メンタルプロテクター: a non-Psychic with ATK 2000 or less (ワイト) cannot declare an attack',z(p)==='mz'&&lp(0)===l0&&!w.attackCount,JSON.stringify({p:z(p),loss:l0-lp(0)}));
  foeAttack(g,p);
  ok('メンタルプロテクター control: 青眼 (ATK 3000) can attack',lp(0)<l0||z(p)==='grave',JSON.stringify({p:z(p),loss:l0-lp(0)})); }
{ fresh();const p=mon(MEN,0),s=mon('サイコ・コマンダー',1);gameState.players[0].mz=[p];gameState.players[1].mz=[s];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(s,p);
  ok('メンタルプロテクター control: a Psychic monster (サイコ・コマンダー 1400) can attack',lp(0)<l0||z(p)==='grave'||z(s)==='grave',JSON.stringify({p:z(p),s:z(s),loss:l0-lp(0)})); }

/* ===== マジシャンズ・エイプ ===== */
{ fresh();const a=mon(APE,0),h=mk('ワイト',0),f=mon('ブラック・マジシャン',1);f.pos='def';gameState.players[0].mz=[a];gameState.players[0].hand=[h];gameState.players[1].mz=[f];baselineA();
  ok('エイプ: Attack Position, a monster in hand, a face-up Defense monster of the opponent -> can activate',canZ(a),'');
  actC(a,[h.uid,f.uid]);
  ok('エイプ: ワイト discarded, the opponent monster is mine',z(h)==='grave'&&pl(f)===0&&z(f)==='mz',JSON.stringify({h:z(h),f:pl(f)}));
  ok('エイプ: its position cannot be changed this turn',getLegalZoneActions(0,'mz',idx(f)).map(x=>x.id).indexOf('position')<0,JSON.stringify(getLegalZoneActions(0,'mz',idx(f)).map(x=>x.id)));
  ok('エイプ: once per turn',!canZ(a),'');
  audit('エイプ 1');
  phase('end');drive();
  ok('エイプ: back to the opponent at the End Phase',pl(f)===1,String(pl(f))); }
{ fresh();const a=mon(APE,0),h=mk('ワイト',0),f=mon('ブラック・マジシャン',1);gameState.players[0].mz=[a];gameState.players[0].hand=[h];gameState.players[1].mz=[f];baselineA();
  ok('エイプ negative: the opponent monster is in Attack Position -> cannot activate',!canZ(a),''); }
{ fresh();const a=mon(APE,0),f=mon('ブラック・マジシャン',1);f.pos='def';gameState.players[0].mz=[a];gameState.players[1].mz=[f];baselineA();
  ok('エイプ negative: no monster in hand -> cannot activate',!canZ(a),''); }
{ fresh();const a=mk(APE,0),rv=mk('死者蘇生',0);gameState.players[0].grave=[a];gameState.players[0].hand=[rv];baselineA();
  cast(0,'死者蘇生',[a.uid]);
  ok('エイプ: cannot be Special Summoned (死者蘇生 does not revive it)',z(a)==='grave',z(a)); }

console.log('U352 done');
`);
