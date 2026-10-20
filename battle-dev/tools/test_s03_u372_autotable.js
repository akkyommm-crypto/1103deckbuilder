/* S03-U372: ハイエナ, スーパイ, クロス・ポーター, メンタルマスター, リバース・オブ・ネオス, トライアングル・エリア (PARTIAL auto-table entries replaced by exact scripts).
   Real DUEL paths, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3720001;
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



const HYE='ハイエナ',SUP='スーパイ',POR='クロス・ポーター',MEN='メンタルマスター',REV='リバース・オブ・ネオス',TRI='トライアングル・エリア';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pp(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== ハイエナ ===== */
{ fresh();const h=mon(HYE,0),h2=mk(HYE,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[h];gameState.players[0].deck=[h2].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,h);
  ok('ハイエナ: destroyed by battle -> another ハイエナ Special Summoned from the Deck',pz(h)==='grave'&&pz(h2)==='mz'&&pp(h2)===0,JSON.stringify({h:pz(h),h2:pz(h2)}));
  audit('ハイエナ 1'); }
{ fresh();const h=mon(HYE,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[h];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,h);
  ok('ハイエナ negative: none left in the Deck -> only destroyed',pz(h)==='grave'&&gameState.players[0].mz.length===0,pz(h)); }

/* ===== スーパイ ===== */
{ fresh();const s=mon(SUP,0),pr=mk('太陽の神官',0),bh=mk('ブラック・ホール',0);gameState.players[0].mz=[s];gameState.players[0].hand=[bh];gameState.players[0].deck=[pr].concat(gameState.players[0].deck);baselineA();
  cast(0,'ブラック・ホール');
  ok('スーパイ: destroyed by an effect -> 太陽の神官 Special Summoned from the Deck with ATK doubled (2000)',pz(s)==='grave'&&pz(pr)==='mz'&&curATK(C(pr))===2000,JSON.stringify({s:pz(s),pr:pz(pr),a:pr&&C(pr)&&curATK(C(pr))}));
  phase('end');drive();
  ok('スーパイ: the priest returns to the hand at the End Phase',pz(pr)==='hand',pz(pr));
  audit('スーパイ 1'); }
{ fresh();const s=mon(SUP,0),pr=mk('太陽の神官',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[s];gameState.players[0].deck=[pr].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,s);
  ok('スーパイ negative: destroyed by BATTLE -> nothing',pz(s)==='grave'&&pz(pr)==='deck',JSON.stringify({s:pz(s),pr:pz(pr)})); }

/* ===== クロス・ポーター ===== */
{ fresh();const p=mon(POR,0),w=mon('ワイト',0),n=mk('N・グロー・モス',0);gameState.players[0].mz=[p,w];gameState.players[0].hand=[n];baselineA();
  ok('クロス・ポーター: a monster of mine and an 「N」 monster in hand -> can activate',canZ(p),'');
  actC(p,[w.uid,n.uid]);
  ok('クロス・ポーター: ワイト sent to the Graveyard; N・グロー・モス Special Summoned from the hand',pz(w)==='grave'&&pz(n)==='mz',JSON.stringify({w:pz(w),n:pz(n)}));
  audit('ポーター 1'); }
{ fresh();const p=mon(POR,0),n=mk('N・グロー・モス',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[p];gameState.players[0].deck=[n].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,p);
  ok('クロス・ポーター: sent to the Graveyard -> an 「N」 monster added from the Deck to the hand',pz(p)==='grave'&&pz(n)==='hand',JSON.stringify({p:pz(p),n:pz(n)})); }

/* ===== メンタルマスター ===== */
{ fresh();const m=mon(MEN,0),ps=mon('ウォールクリエイター',0),pk=mk('サイコ・コマンダー',0);gameState.players[0].mz=[m,ps];gameState.players[0].deck=[pk].concat(gameState.players[0].deck);baselineA();
  ok('メンタルマスター: can activate',canZ(m),'');
  actC(m,[ps.uid,pk.uid]);
  ok('メンタルマスター: 800 LP paid, ウォールクリエイター released, サイコ・コマンダー Special Summoned in Attack Position',lp(0)===7200&&pz(ps)==='grave'&&pz(pk)==='mz'&&C(pk).pos==='atk',JSON.stringify({lp:lp(0),ps:pz(ps),pk:pz(pk)}));
  ok('メンタルマスター: once per turn',!canZ(m),'');
  audit('メンタルマスター 1'); }
{ fresh();const m=mon(MEN,0);m.u=0;gameState.players[0].mz=[m];gameState.players[0].lp=700;baselineA();
  ok('メンタルマスター negative: less than 800 LP -> cannot activate',!canZ(m),''); }

/* ===== リバース・オブ・ネオス ===== */
{ fresh();const q=setCard(REV,0),fz=mon('E・HERO アクア・ネオス',0),ne=mk('E・HERO ネオス',0),bh=mk('ブラック・ホール',0);
  gameState.players[0].sz=[q];gameState.players[0].mz=[fz];gameState.players[0].hand=[bh];gameState.players[0].deck=[ne].concat(gameState.players[0].deck);baselineA();
  cast(0,'ブラック・ホール');
  ok('リバース・オブ・ネオス: my Neos Fusion Monster destroyed -> E・HERO ネオス Special Summoned from the Deck, ATK 2500 + 1000 = 3500',pz(fz)==='grave'&&pz(ne)==='mz'&&curATK(C(ne))===3500,JSON.stringify({fz:pz(fz),ne:pz(ne),a:ne&&C(ne)&&curATK(C(ne))}));
  phase('end');drive();
  ok('リバース・オブ・ネオス: destroyed at the End Phase',pz(ne)==='grave',pz(ne));
  audit('リバース・オブ・ネオス 1'); }
{ fresh();const q=setCard(REV,0),w=mon('ワイト',0),ne=mk('E・HERO ネオス',0),bh=mk('ブラック・ホール',0);
  gameState.players[0].sz=[q];gameState.players[0].mz=[w];gameState.players[0].hand=[bh];gameState.players[0].deck=[ne].concat(gameState.players[0].deck);baselineA();
  cast(0,'ブラック・ホール');
  ok('リバース・オブ・ネオス negative: a non-Neos monster destroyed -> not triggered',pz(ne)==='deck'&&pz(q)==='sz',JSON.stringify({ne:pz(ne),q:pz(q)})); }

/* ===== トライアングル・エリア ===== */
{ fresh();const sp=mk(TRI,0),f=mon('ワイト',1),al=mk('エーリアン・ソルジャー',0);f.counters={'A':1};gameState.players[0].hand=[sp];gameState.players[0].deck=[al].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  cast(0,TRI,[f.uid,al.uid]);
  ok('トライアングル・エリア: the A Counter monster destroyed; エーリアン・ソルジャー (Level 4) Special Summoned from the Deck',pz(f)==='grave'&&pz(al)==='mz',JSON.stringify({f:pz(f),al:pz(al)}));
  phase('end');drive();
  ok('トライアングル・エリア: the summoned Alien is destroyed at the End Phase',pz(al)==='grave',pz(al));
  audit('トライアングル 1'); }
{ fresh();const sp=mk(TRI,0),f=mon('ワイト',1);gameState.players[0].hand=[sp];gameState.players[1].mz=[f];baselineA();
  const r=strictScriptLegalityV2(TRI,0,'hand',0,{});
  ok('トライアングル・エリア negative: no A Counter monster -> not activatable',!(r&&r.ok),JSON.stringify(r)); }

console.log('U372 done');
`);
