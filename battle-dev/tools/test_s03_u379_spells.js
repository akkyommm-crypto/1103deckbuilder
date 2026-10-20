/* S03-U379: 増殖, 百機夜工, スターライト・ロード, マジシャンズ・クロス (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3790001;
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





const PRO='増殖',HND='百機夜工',STL='スターライト・ロード',CRS='マジシャンズ・クロス';
function foeTurn(){gameState.activePlayer=1;}

/* ===== 増殖 ===== */
{ fresh();const f=mk(PRO,0,'up'),k=mon('クリボー',0),w1=mon('ワイト',0),w2=mon('ワイト',0);
  gameState.players[0].hand=[f];gameState.players[0].mz=[k,w1,w2];baselineA();
  cast(0,PRO,[uid(k)]);
  const toks=gameState.players[0].mz.filter(c=>cardName(c)==='クリボートークン');
  ok('増殖: the クリボー was released (cost)',z(k)==='grave',z(k));
  ok('増殖: クリボートークン fill the free zones in Defense Position (3), ATK 300 / DEF 200',toks.length===3&&gameState.players[0].mz.length===5&&toks.every(c=>c.pos==='def'&&curATK(c)===300&&curDEF(c)===200),JSON.stringify([toks.length,gameState.players[0].mz.length]));
  audit('増殖 1'); }
{ fresh();const f=mk(PRO,0,'up'),w=mon('ワイト',0);gameState.players[0].hand=[f];gameState.players[0].mz=[w];baselineA();
  ok('増殖 negative: no 「クリボー」 on my field -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }

/* ===== 百機夜工 ===== */
{ fresh();const f=mk(HND,0,'up'),m=mon('サイバー・ドラゴン',0),d1=mk('D・ボードン',0),d2=mk('D・チャッカン',0),o=mk('ワイト',0);
  gameState.players[0].hand=[f];gameState.players[0].mz=[m];gameState.players[0].grave=[d1,d2,o];baselineA();
  const a0=curATK(C(m));
  cast(0,HND,[uid(m)]);
  ok('百機夜工: every 「D」 monster of the Graveyard banished; the other monster stays',z(d1)==='banish'&&z(d2)==='banish'&&z(o)==='grave',JSON.stringify([z(d1),z(d2),z(o)]));
  ok('百機夜工: the Machine monster gains 200 per banished monster (+400) until the End Phase',curATK(C(m))===a0+400,JSON.stringify([a0,curATK(C(m))]));
  endTurn();endTurn();
  ok('百機夜工: the bonus is gone after the turn',curATK(C(m))===a0,String(curATK(C(m))));
  audit('百機夜工 1'); }
{ fresh();const f=mk(HND,0,'up'),m=mon('サイバー・ドラゴン',0);gameState.players[0].hand=[f];gameState.players[0].mz=[m];gameState.players[0].grave=[mk('ワイト',0)];baselineA();
  ok('百機夜工 negative: no 「D」 in the Graveyard -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }

/* ===== スターライト・ロード ===== */
{ fresh();foeTurn();const t=setCard(STL,0),a=mon('ワイト',0),b=mon('ライオウ',0),sd=mk('スターダスト・ドラゴン',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[a,b];gameState.players[0].ex=[sd];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('スターライト・ロード: ブラック・ホール would destroy my 2 monsters -> offered',offeredTo(0,t),JSON.stringify({len:gameState.chain.length}));
  respond(0,t,['yes']);drive();
  ok('スターライト・ロード: negated and destroyed; my monsters survive; スターダスト・ドラゴン Special Summoned from the Extra Deck',z(bh)==='grave'&&z(a)==='mz'&&z(b)==='mz'&&z(sd)==='mz',JSON.stringify([z(bh),z(a),z(b),z(sd)]));
  audit('スターライト・ロード 1'); }
{ fresh();foeTurn();const t=setCard(STL,0),a=mon('ワイト',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[a];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('スターライト・ロード negative: only one of my cards would be destroyed -> not offered',offeredTo(0,t)===false,'');drive(); }
{ fresh();foeTurn();const t=setCard(STL,0),a=mon('ワイト',0),b=mon('ライオウ',0),cy=mk('サイクロン',1),t2=setCard('強制脱出装置',0);
  gameState.players[0].sz=[t,t2];gameState.players[0].mz=[a,b];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[uid(t2)]);
  ok('スターライト・ロード negative: a single target (サイクロン) -> not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== マジシャンズ・クロス ===== */
{ fresh();const f=mk(CRS,0,'up'),bm=mon('ブラック・マジシャン',0),bg=mon('ブラック・マジシャン・ガール',0),fo=mon('ライオウ',1);
  gameState.players[0].hand=[f];gameState.players[0].mz=[bm,bg];gameState.players[1].mz=[fo];baselineA();
  cast(0,CRS,[uid(bg)]);
  ok('クロス: the target gets ATK 3000',curATK(C(bg))===3000,String(curATK(C(bg))));
  ok('クロス: the other Spellcaster cannot attack this turn, the target can',cannotAttackNow(C(bm))===true&&cannotAttackNow(C(bg))===false,JSON.stringify([cannotAttackNow(C(bm)),cannotAttackNow(C(bg))]));
  endTurn();endTurn();
  ok('クロス: next turn both can attack and the ATK is normal again',cannotAttackNow(C(bm))===false&&curATK(C(bg))===2000,JSON.stringify([cannotAttackNow(C(bm)),curATK(C(bg))]));
  audit('クロス 1'); }
{ fresh();const f=mk(CRS,0,'up'),bm=mon('ブラック・マジシャン',0);gameState.players[0].hand=[f];gameState.players[0].mz=[bm];baselineA();
  ok('クロス negative: only one Spellcaster -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }
`);
