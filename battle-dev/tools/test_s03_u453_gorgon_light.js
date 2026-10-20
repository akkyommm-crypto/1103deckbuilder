/* S03-U453: ゴーゴンの眼, 裁きの光, 連鎖除外 (stale ENGINE_GAP Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4340001;
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
const GOR='ゴーゴンの眼',LGT='裁きの光',CHN='連鎖除外';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}
function actSz(i,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',i);drive();PREFER=[];}

/* ===== ゴーゴンの眼 ===== */
{ fresh();const tr=setTrap(GOR,0),gd=mon('ガガガマジシャン',0,'def'),foe=mon('ワイト',1,'def');gameState.players[0].sz=[tr];gameState.players[0].mz=[gd];gameState.players[1].mz=[foe];baselineA();
  const before=canZ(gd),nb=effectNegated(C(gd));
  actSz(0);
  ok('ゴーゴンの眼: before it my Defense Position ガガガマジシャン could use its effect and was not negated',before===true&&nb===false,JSON.stringify([before,nb]));
  ok('ゴーゴンの眼: the Defense Position monsters of both fields are negated this turn (the engine still offers the activation, the effect is not applied)',effectNegated(C(gd))===true&&effectNegated(C(foe))===true,JSON.stringify([effectNegated(C(gd)),effectNegated(C(foe))]));
  { const lv0=curLV(C(gd));PREFER=['L6'];duelActivateFromZone(0,'mz',idx(gd));drive();PREFER=[];
    ok('ゴーゴンの眼: the negated ignition effect of the Defense Position ガガガマジシャン changed nothing (Level stays '+lv0+')',curLV(C(gd))===lv0,JSON.stringify([lv0,curLV(C(gd))])); }
  audit('ゴーゴンの眼 1');
  C(gd).pos='atk';
  ok('ゴーゴンの眼: turned to Attack Position, the monster is no longer negated',effectNegated(C(gd))===false,JSON.stringify([effectNegated(C(gd))]));
  C(gd).pos='def';gameState.turn=7;gameState.activePlayer=0;
  ok('ゴーゴンの眼: the next turn nothing is negated any more',effectNegated(C(gd))===false&&effectNegated(C(foe))===false,JSON.stringify([effectNegated(C(gd)),effectNegated(C(foe))]));
  gameState.turn=5; }
{ fresh();const gd=mon('ガガガマジシャン',0,'def');gameState.players[0].mz=[gd];baselineA();
  ok('ゴーゴンの眼 negative: without the Trap nothing is negated',effectNegated(C(gd))===false&&canZ(gd)===true,JSON.stringify([effectNegated(C(gd)),canZ(gd)])); }

/* ===== 裁きの光 ===== */
function lightBoard(){fresh();const tr=setTrap(LGT,0),sa=mk('天空の聖域',1,'up'),lm=mk('ライトロード・ハンター ライコウ',0),dm=mk('ワイト',0),fh1=mk('ブラック・マジシャン',1),fh2=mk('アイヴィ・ウォール',1),fm=mon('青眼の白龍',1);
  gameState.players[0].sz=[tr];gameState.players[0].hand=[lm,dm];gameState.players[1].hand=[fh1,fh2];gameState.players[1].mz=[fm];gameState.players[1].field=sa;baselineA();return {tr,sa,lm,dm,fh1,fh2,fm};}
{ const B=lightBoard();actSz(0,[uid(B.lm),'hand',uid(B.fh2)]);
  ok('裁きの光: the LIGHT monster was discarded as the cost and I chose the opponent\'s hand card to send to the Graveyard',z(B.lm)==='grave'&&z(B.fh2)==='grave'&&z(B.fh1)==='hand'&&z(B.dm)==='hand',JSON.stringify([z(B.lm),z(B.fh2),z(B.fh1),z(B.dm)]));
  audit('裁きの光 1'); }
{ const B=lightBoard();actSz(0,[uid(B.lm),'field',uid(B.fm)]);
  ok('裁きの光: the field mode sent the chosen opponent card to the Graveyard (not destroyed)',z(B.lm)==='grave'&&z(B.fm)==='grave'&&z(B.fh1)==='hand'&&z(B.fh2)==='hand',JSON.stringify([z(B.lm),z(B.fm),z(B.fh1),z(B.fh2)]));
  audit('裁きの光 2'); }
{ const B=lightBoard();gameState.players[1].field=null;
  ok('裁きの光 negative: no 天空の聖域 on the field → not activatable',legalT(0)===false,''); }
{ const B=lightBoard();gameState.players[0].hand=[B.dm];
  ok('裁きの光 negative: no LIGHT monster in my hand → not activatable',legalT(0)===false,''); }

/* ===== 連鎖除外 ===== */
function chainBoard(){fresh();const tr=setTrap(CHN,0),w=mk('ワイト',1),w2=mk('ワイト',1),w3=mk('ワイト',1),bm=mk('ガガガマジシャン',1);
  gameState.players[0].sz=[tr];gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';gameState.players[1].hand=[w,w2,bm];gameState.players[1].deck=[w3].concat(gameState.players[1].deck);baselineA();return {tr,w,w2,w3,bm};}
{ const B=chainBoard();const i=gameState.players[1].hand.indexOf(B.w);doNormalSummon(i,'atk');drive();
  ok('連鎖除外: the summoned ATK 300 ワイト was banished together with the other ワイト of the opponent\'s hand and Deck (the other card stays)',z(B.w)==='banish'&&z(B.w2)==='banish'&&z(B.w3)==='banish'&&z(B.bm)==='hand'&&z(B.tr)==='grave',JSON.stringify([z(B.w),z(B.w2),z(B.w3),z(B.bm),z(B.tr)]));
  audit('連鎖除外 1'); }
{ const B=chainBoard();const i=gameState.players[1].hand.indexOf(B.bm);doNormalSummon(i,'atk');drive();
  ok('連鎖除外 negative: an ATK 1500 monster summoned → the Trap is not used',z(B.bm)==='mz'&&z(B.tr)==='sz'&&z(B.w)==='hand',JSON.stringify([z(B.bm),z(B.tr),z(B.w)]));
  audit('連鎖除外 2'); }
`);
