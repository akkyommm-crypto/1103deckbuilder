/* S03-U409: エクスプロード・ウィング・ドラゴン, カオス・ゴッデス, 黒炎の騎士, 幻影の騎士 (NOT_STARTED cards).
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
let PREFER=[];function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4090001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}








































const SEEN=[];
const EWD='エクスプロード・ウィング・ドラゴン',CHG='カオス・ゴッデス－混沌の女神－',BFN='黒炎の騎士－ブラック・フレア・ナイト－',MIR='幻影の騎士－ミラージュ・ナイト－';
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== エクスプロード・ウィング・ドラゴン ===== */
{ fresh();const e=mon(EWD,0),f=mon('ライオウ',1);gameState.players[0].mz=[e];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l0=lp(0),l1=lp(1);
  PREFER=['yes'];atkTarget(0,e,f);PREFER=[];
  ok('エクスプロード: battling ライオウ (ATK 1900 <= 2400) → destroyed without damage calculation, 1900 damage to the opponent, none to me',z(f)==='grave'&&z(e)==='mz'&&l1-lp(1)===1900&&lp(0)===l0,JSON.stringify([z(f),z(e),l1-lp(1),lp(0)]));
  audit('エクスプロード 1'); }
{ fresh();const e=mon(EWD,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[e];gameState.players[1].mz=[f];baselineA();
  phase('battle');PREFER=['yes'];atkTarget(0,e,f);PREFER=[];
  ok('エクスプロード negative: the opponent monster has a higher ATK (3000 > 2400) → normal battle (it is destroyed)',z(e)==='grave'&&z(f)==='mz',JSON.stringify([z(e),z(f)])); }
{ fresh();const e=mon(EWD,0),f=mon('ライオウ',1);gameState.players[0].mz=[e];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l1=lp(1);PREFER=['yes'];foeAttack(f,e);PREFER=[];
  ok('エクスプロード: also when it is attacked (the attacker ライオウ is destroyed, 1900 damage to the opponent)',z(f)==='grave'&&z(e)==='mz'&&l1-lp(1)===1900,JSON.stringify([z(f),z(e),l1-lp(1)])); }

/* ===== カオス・ゴッデス ===== */
{ fresh();const g=mon(CHG,0),lh=mk('青眼の白龍',0),bm=mk('ブラック・マジシャン',0);bm.properlySummonedS03=true;
  gameState.players[0].mz=[g];gameState.players[0].hand=[lh];gameState.players[0].grave=[bm];baselineA();
  ok('ゴッデス: the effect is available',canZ(g)===true,'');
  actC(g,[uid(lh),uid(bm)]);
  ok('ゴッデス: a LIGHT monster of the hand discarded (cost); ブラック・マジシャン (Level 7 DARK) Special Summoned',z(lh)==='grave'&&z(bm)==='mz',JSON.stringify([z(lh),z(bm)]));
  ok('ゴッデス: that monster cannot be Synchro material; once per turn',C(bm).noSynchroMaterialS03===true&&materialCandidates(0,'synchro').every(x=>x.card!==C(bm))&&canZ(g)===false,JSON.stringify([C(bm).noSynchroMaterialS03,canZ(g)]));
  audit('ゴッデス 1'); }
{ fresh();const g=mon(CHG,0),bm=mk('ブラック・マジシャン',0);gameState.players[0].mz=[g];gameState.players[0].grave=[bm];baselineA();
  ok('ゴッデス negative: no LIGHT monster in the hand → not offered',canZ(g)===false,''); }

/* ===== 黒炎の騎士 / 幻影の騎士 ===== */
{ fresh();const b=mon(BFN,0),f=mon('青眼の白龍',1),m=mk(MIR,0);gameState.players[0].mz=[b];gameState.players[0].deck=[m].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,b);
  ok('黒炎: destroyed by 青眼 (ATK 3000 > 2200) but the battle damage to me is 0',z(b)==='grave'&&lp(0)===l0,JSON.stringify([z(b),lp(0),l0]));
  ok('黒炎: and 幻影の騎士－ミラージュ・ナイト－ was Special Summoned from the Deck',z(m)==='mz',z(m));
  audit('黒炎 1'); }
{ fresh();const m=mk(MIR,0);gameState.players[0].deck=[m].concat(gameState.players[0].deck);baselineA();
  ok('ミラージュ: Special Summonable only by the effect of 黒炎の騎士 (not by 死者蘇生)',canEffectSpecialSummonS03(C(m),'deck','黒炎の騎士－ブラック・フレア・ナイト－')===true&&canEffectSpecialSummonS03(C(m),'deck','死者蘇生')===false,JSON.stringify([canEffectSpecialSummonS03(C(m),'deck','黒炎の騎士－ブラック・フレア・ナイト－'),canEffectSpecialSummonS03(C(m),'deck','死者蘇生')])); }
{ fresh();const m=mon(MIR,0),f=mon('ライオウ',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,m,f);
  ok('ミラージュ: ATK 2800 + the partner printed ATK 1900 = 4700 in the damage calculation → 2800 battle damage',z(f)==='grave'&&l1-lp(1)===2800,JSON.stringify([z(f),l1-lp(1)]));
  ok('ミラージュ: ATK back to 2800 outside the damage step',curATK(C(m))===2800,String(curATK(C(m))));
  phase('end');
  ok('ミラージュ: it battled this turn → banished at the End Phase',z(m)==='banish',z(m));
  audit('ミラージュ 1'); }
{ fresh();const m=mon(MIR,0);gameState.players[0].mz=[m];baselineA();
  phase('end');
  ok('ミラージュ negative: no battle this turn → stays on the field',z(m)==='mz',z(m)); }
`);
