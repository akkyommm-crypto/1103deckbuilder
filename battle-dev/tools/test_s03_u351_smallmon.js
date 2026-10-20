/* S03-U351: X－セイバー ガラハド, オアシスの使者, イービル・ソーン, C・リペアラー, C・コイル.
   Real DUEL paths (attacks in the Damage Step, attack negation by release, an unattackable monster, ignition effects), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3510001;
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



const GAL='X－セイバー ガラハド',OAS='オアシスの使者',THO='イービル・ソーン',REP='C・リペアラー',COI='C・コイル';
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}

/* ===== X－セイバー ガラハド ===== */
{ fresh();const g=mon(GAL,0),w=mon('ワイト',1);gameState.players[0].mz=[g];gameState.players[1].mz=[w];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,g,w);
  ok('ガラハド: attacks ワイト (ATK 300) -> ATK 1800+300 = 2100 in the Damage Step: 1800 battle damage',z(w)==='grave'&&lp(1)===l1-1800,JSON.stringify({w:z(w),loss:l1-lp(1)}));
  ok('ガラハド: the bonus is only for the Damage Step (back to 1800 afterwards)',curATK(C(g))===1800,String(curATK(C(g))));
  audit('ガラハド 1'); }
{ fresh();const g=mon(GAL,0),f=mon('ブラック・マジシャン',1);gameState.players[0].mz=[g];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,g);
  ok('ガラハド: attacked by ブラック・マジシャン (2500) -> ATK 1800-500 = 1300: destroyed, I take 1200 (no セイバー to release)',z(g)==='grave'&&lp(0)===l0-1200,JSON.stringify({g:z(g),loss:l0-lp(0)})); }
{ fresh();const g=mon(GAL,0),s=mon('X－セイバー エアベルン',0),f=mon('ブラック・マジシャン',1);gameState.players[0].mz=[g,s];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);PREFER=[s.uid];foeAttack(f,g);PREFER=[];
  ok('ガラハド: attacked -> released エアベルン: the attack was negated (ガラハド stays, no damage)',z(g)==='mz'&&z(s)==='grave'&&lp(0)===l0,JSON.stringify({g:z(g),s:z(s),loss:l0-lp(0)}));
  audit('ガラハド 2'); }

/* ===== オアシスの使者 ===== */
{ fresh();const o=mon(OAS,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[o,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,o);
  ok('オアシスの使者: a Level 3 or lower Normal monster (ワイト) on my field -> it cannot be attacked (stays, no damage)',z(o)==='mz'&&lp(0)===l0,JSON.stringify({o:z(o),loss:l0-lp(0)})); }
{ fresh();const o=mon(OAS,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[o,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,w);
  ok('オアシスの使者: ワイト attacked by 青眼 (battle damage 2700) -> 0 damage to me, ワイト destroyed',z(w)==='grave'&&lp(0)===l0,JSON.stringify({w:z(w),loss:l0-lp(0)}));
  audit('オアシス 1'); }
{ fresh();const o=mon(OAS,0),b=mon('ブラック・マジシャン',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[o,b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,b);
  ok('オアシスの使者 control: ブラック・マジシャン (Level 7) battle -> 500 damage still applies',z(b)==='grave'&&lp(0)===l0-500,JSON.stringify({b:z(b),loss:l0-lp(0)})); }
{ fresh();const o=mon(OAS,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[o];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,o);
  ok('オアシスの使者 negative: no Level 3 or lower Normal monster -> it can be attacked and is destroyed',z(o)==='grave',z(o)); }

/* ===== イービル・ソーン ===== */
{ fresh();const t=mon(THO,0),d1=mk(THO,0),d2=mk(THO,0),d3=mk(THO,0);gameState.players[0].mz=[t];gameState.players[0].deck=[d1,d2,d3].concat(gameState.players[0].deck);baselineA();
  const l1=lp(1);actC(t);
  const out=[d1,d2,d3].filter(c=>z(c)==='mz');
  ok('イービル・ソーン: released -> 300 damage and 2 copies Special Summoned from the Deck',z(t)==='grave'&&lp(1)===l1-300&&out.length===2,JSON.stringify({t:z(t),loss:l1-lp(1),out:out.length}));
  ok('イービル・ソーン: the summoned copies are in Attack Position with their effects negated',out.every(c=>C(c).pos==='atk'&&effectNegated(C(c))),JSON.stringify(out.map(c=>[C(c).pos,effectNegated(C(c))])));
  audit('ソーン 1'); }
{ fresh();const t=mon(THO,0),d1=mk(THO,0);gameState.players[0].mz=[t];gameState.players[0].deck=[d1].concat(gameState.players[0].deck);baselineA();
  actC(t);
  ok('イービル・ソーン: only one copy in the Deck -> 1 summoned',z(d1)==='mz',z(d1)); }

/* ===== C・リペアラー ===== */
{ fresh();const r=mon(REP,0),w=mon('ワイト',1);gameState.players[0].mz=[r];gameState.players[1].mz=[w];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,r,w);
  ok('C・リペアラー: destroyed ワイト by battle -> 1300 battle damage + 300 effect damage',z(w)==='grave'&&lp(1)===l1-1600,JSON.stringify({w:z(w),loss:l1-lp(1)}));
  audit('リペアラー 1'); }
{ fresh();const r=mon(REP,0),sn=mk('C・スネーク',0),w=mon('ワイト',1);gameState.players[0].mz=[r];gameState.players[0].grave=[sn];gameState.players[1].mz=[w];baselineA();
  ok('C・リペアラー: a Level 3 C monster in the Graveyard -> can activate',canZ(r),'');
  actC(r,[sn.uid]);
  ok('C・リペアラー: C・スネーク Special Summoned in Attack Position',z(sn)==='mz'&&C(sn).pos==='atk',JSON.stringify({sn:z(sn)}));
  phase('battle');const l1=lp(1);atkTarget(0,r,w);
  ok('C・リペアラー: activated this turn -> it cannot attack (ワイト untouched)',z(w)==='mz'&&lp(1)===l1,JSON.stringify({w:z(w),loss:l1-lp(1)}));
  ok('C・リペアラー: once per turn',!canZ(r),'');
  audit('リペアラー 2'); }
{ fresh();const r=mon(REP,0);gameState.players[0].mz=[r];baselineA();
  ok('C・リペアラー negative: no C monster in the Graveyard -> cannot activate',!canZ(r),''); }

/* ===== C・コイル ===== */
{ fresh();const c=mon(COI,0),sn=mon('C・スネーク',0);gameState.players[0].mz=[c,sn];baselineA();
  actC(c,[sn.uid]);
  ok('C・コイル: C・スネーク ATK 800 -> 1100, DEF 1200 -> 1500',curATK(C(sn))===1100&&curDEF(C(sn))===1500,JSON.stringify({a:curATK(C(sn)),d:curDEF(C(sn))}));
  ok('C・コイル: once per turn',!canZ(c),'');
  endTurn();
  ok('C・コイル: the boost ends at the End Phase',curATK(C(sn))===800&&curDEF(C(sn))===1200,JSON.stringify({a:curATK(C(sn)),d:curDEF(C(sn))}));
  audit('コイル 1'); }
{ fresh();const c=mon(COI,0),w=mon('ワイト',0);gameState.players[0].mz=[c,w];baselineA();
  ok('C・コイル negative: only a non-C monster besides itself... itself counts as C: activation allowed on itself',canZ(c),'');
  actC(c,[c.uid]);
  ok('C・コイル: it can raise itself (1100/1600 -> 1400/1900)',curATK(C(c))===1400&&curDEF(C(c))===1900,JSON.stringify({a:curATK(C(c)),d:curDEF(C(c))})); }

console.log('U351 done');
`);
