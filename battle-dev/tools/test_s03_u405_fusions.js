/* S03-U405: カタパルト・ウォリアー, ジャンク・バーサーカー, 重爆撃禽 ボム・フェネクス, 異星の最終戦士, スーパービークロイド－ジャンボドリル (NOT_STARTED cards).
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
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4050001;
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
































const CAT='カタパルト・ウォリアー',BER='ジャンク・バーサーカー',PHX='重爆撃禽 ボム・フェネクス',ALN='異星の最終戦士',DRL='スーパービークロイド－ジャンボドリル';
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== カタパルト・ウォリアー ===== */
{ fresh();const c=mon(CAT,0),j=mon('ジャンク・サーバント',0);gameState.players[0].mz=[c,j];baselineA();
  ok('カタパルト: the effect is available (a Junk monster on my field)',canZ(c)===true,'');
  actC(c,[uid(j)]);
  ok('カタパルト: ジャンク・サーバント released; the opponent took its original ATK 1500',z(j)==='grave'&&lp(1)===6500,JSON.stringify([z(j),lp(1)]));
  ok('カタパルト: once per turn',canZ(c)===false,'');
  audit('カタパルト 1'); }
{ fresh();const c=mon(CAT,0),w=mon('ワイト',0);gameState.players[0].mz=[c,w];baselineA();
  ok('カタパルト negative: no 「ジャンク」 monster → not offered',canZ(c)===false,''); }

/* ===== ジャンク・バーサーカー ===== */
{ fresh();const b=mon(BER,0),jb=mk('ジャンク・ブレーダー',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[b];gameState.players[0].grave=[jb];gameState.players[1].mz=[f];baselineA();
  actC(b,[uid(jb),uid(f)]);
  ok('バーサーカー: ジャンク・ブレーダー banished (cost); 青眼 ATK 3000 - 1800 = 1200',z(jb)==='banish'&&curATK(C(f))===1200,JSON.stringify([z(jb),curATK(C(f))]));
  audit('バーサーカー 1'); }
{ fresh();const b=mon(BER,0),f=mk('千年の盾',1,'up','def');f.summonedTurn=3;gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l0=lp(0);atkTarget(0,b,f);
  ok('バーサーカー: attacking a Defense Position monster (DEF 3000 > ATK 2700) destroys it without damage calculation (no damage to me)',z(f)==='grave'&&lp(0)===l0&&z(b)==='mz',JSON.stringify([z(f),lp(0),z(b)]));
  audit('バーサーカー 2'); }
{ fresh();const b=mon(BER,0),f=mon('千年の盾',1,'atk');gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,b,f);
  ok('バーサーカー negative: an Attack Position target is fought normally (千年の盾 ATK 0 destroyed by calculation, I take 0)',z(f)==='grave'&&z(b)==='mz',JSON.stringify([z(f),z(b)])); }

/* ===== 重爆撃禽 ボム・フェネクス ===== */
{ fresh();const p=mon(PHX,0),f=mon('ワイト',1),st=mk('ブラック・ホール',0,'down');st.setTurn=4;gameState.players[0].mz=[p];gameState.players[1].mz=[f];gameState.players[0].sz=[st];baselineA();
  ok('フェネクス: the effect is available in my Main Phase',canZ(p)===true,'');
  actC(p);
  ok('フェネクス: 3 cards on the field (2 monsters + 1 Set card) x 300 = 900 damage',lp(1)===7100,String(lp(1)));
  ok('フェネクス: it cannot attack this turn, and the effect is once per turn',cannotAttackNow(C(p))===true&&canZ(p)===false,JSON.stringify([cannotAttackNow(C(p)),canZ(p)]));
  audit('フェネクス 1'); }

/* ===== 異星の最終戦士 ===== */
{ fresh();const a=mk(ALN,0),w=mon('ワイト',0),rev=mk('死者蘇生',0);a.properlySummonedS03=true;gameState.players[0].hand=[rev];gameState.players[0].grave=[a];gameState.players[0].mz=[w];baselineA();
  cast(0,'死者蘇生',[uid(a)]);
  ok('異星: Special Summoned → my other monster (ワイト) was destroyed; it stays',z(a)==='mz'&&z(w)==='grave',JSON.stringify([z(a),z(w)]));
  ok('異星: neither player can Normal / Flip / Special Summon while it is face-up',!!nsReason(0,'ワイト','normal')&&!!nsReason(1,'ワイト','normal')&&!!nsReason(0,'ワイト','flip')&&!!nsReason(1,'ワイト','special'),JSON.stringify([nsReason(0,'ワイト','normal'),nsReason(1,'ワイト','special')]));
  audit('異星 1'); }
{ fresh();const w=mon('ワイト',0);gameState.players[0].mz=[w];baselineA();
  ok('異星 control: without it summons are allowed',nsReason(0,'ワイト','normal')===''&&nsReason(1,'ワイト','special')==='',''); }

/* ===== スーパービークロイド－ジャンボドリル ===== */
{ fresh();const d=mon(DRL,0),f=mon('ブラック・マジシャン',1,'def');gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,d,f);
  ok('ジャンボドリル: ATK 3000 vs a Defense Position ブラック・マジシャン (DEF 2100) → destroyed and 900 piercing damage',z(f)==='grave'&&l1-lp(1)===900,JSON.stringify([z(f),l1-lp(1)]));
  audit('ジャンボドリル 1'); }
{ fresh();const d=mon(DRL,0),f=mon('ワイト',1,'atk');gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l1=lp(1);atkTarget(0,d,f);
  ok('ジャンボドリル negative: an Attack Position target → only the normal battle damage (3000 - 300)',z(f)==='grave'&&l1-lp(1)===2700,JSON.stringify([z(f),l1-lp(1)])); }
`);
