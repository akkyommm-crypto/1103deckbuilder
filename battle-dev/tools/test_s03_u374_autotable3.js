/* S03-U374: D・バリア, D・リモコン, 超古深海王シーラカンス (PARTIAL auto-table entries replaced by exact scripts).
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
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3740001;
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

const BAR='D・バリア',REM='D・リモコン',COE='超古深海王シーラカンス';

/* ===== D・バリア ===== */
{ fresh();gameState.activePlayer=1;const t=setCard(BAR,0),d=mon('D・ステープラン',0),bh=mk('ブラック・ホール',1),dd=mk('D・ボードン',0);
  gameState.players[0].sz=[t];gameState.players[0].mz=[d];gameState.players[1].hand=[bh];gameState.players[0].deck=[dd].concat(gameState.players[0].deck);baselineA();
  foeCast('ブラック・ホール');
  ok('D・バリア: ブラック・ホール (destroys monsters) with a face-up 「D」 of mine -> offered',offeredTo(0,t),JSON.stringify({len:gameState.chain.length}));
  respond(0,t,[uid(dd)]);drive();
  ok('D・バリア: the activation is negated and ブラック・ホール destroyed; my 「D」 survives; a 「D」 card was added from the Deck',z(bh)==='grave'&&z(d)==='mz'&&z(dd)==='hand',JSON.stringify([z(bh),z(d),z(dd)]));
  audit('D・バリア 1'); }
{ fresh();gameState.activePlayer=1;const t=setCard(BAR,0),w=mon('ワイト',0),bh=mk('ブラック・ホール',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[w];gameState.players[1].hand=[bh];baselineA();
  foeCast('ブラック・ホール');
  ok('D・バリア negative: no 「D」 monster on my field -> not offered',offeredTo(0,t)===false,'');drive(); }
{ fresh();gameState.activePlayer=1;const t=setCard(BAR,0),d=mon('D・ステープラン',0),cy=mk('サイクロン',1),tg=setCard('強制脱出装置',0);
  gameState.players[0].sz=[t,tg];gameState.players[0].mz=[d];gameState.players[1].hand=[cy];baselineA();
  foeCast('サイクロン',[tg.uid]);
  ok('D・バリア negative: サイクロン destroys only a Spell / Trap -> not offered',offeredTo(0,t)===false,'');drive(); }
{ fresh();gameState.activePlayer=1;const t=setCard(BAR,0),d=mon('D・ステープラン',0),w=mon('ワイト',0),bk=mk('大嵐',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[d,w];gameState.players[1].hand=[bk];baselineA();
  foeCast('大嵐');
  ok('D・バリア negative: 大嵐 (Spells / Traps only) -> not offered',offeredTo(0,t)===false,'');drive(); }

/* ===== D・リモコン ===== */
{ fresh();const r=mon(REM,0),g=mk('D・ボードン',0),dk=mk('D・チャッカン',0),dk2=mk('D・スコープン',0),oth=mk('ワイト',0);
  gameState.players[0].mz=[r];gameState.players[0].grave=[g];gameState.players[0].deck=[oth,dk,dk2].concat(gameState.players[0].deck);baselineA();
  ok('D・リモコン (ATK): activatable with a 「D」 in the GY and a same-Level 「D」 in the Deck',canZ(r)===true,'');
  actZ(r,[uid(g),uid(dk)]);
  ok('D・リモコン (ATK): the GY 「D」 banished; a same-Level 「D」 added from the Deck',z(g)==='banish'&&(z(dk)==='hand'||z(dk2)==='hand'),JSON.stringify([z(g),z(dk),z(dk2)]));
  ok('D・リモコン (ATK): once per turn',canZ(r)===false,'');
  audit('D・リモコン 1'); }
{ fresh();const r=mon(REM,0,'def'),h1=mk('D・チャッカン',0),g1=mk('D・ボードン',0),g2=mk('D・スコープン',0);
  gameState.players[0].mz=[r];gameState.players[0].hand=[h1];gameState.players[0].grave=[g1,g2];baselineA();
  ok('D・リモコン (DEF): activatable',canZ(r)===true,'');
  actZ(r,[uid(h1),uid(g1)]);
  ok('D・リモコン (DEF): the hand 「D」 sent to the GY; a same-Level other 「D」 returned from the GY',z(h1)==='grave'&&(z(g1)==='hand'||z(g2)==='hand'),JSON.stringify([z(h1),z(g1),z(g2)]));
  ok('D・リモコン (DEF): once per turn',canZ(r)===false,'');
  audit('D・リモコン 2'); }
{ fresh();const r=mon(REM,0),g=mk('D・ボードン',0);gameState.players[0].mz=[r];gameState.players[0].grave=[g];baselineA();
  ok('D・リモコン negative: no same-Level 「D」 in the Deck -> not activatable (ATK mode)',canZ(r)===false,''); }
{ fresh();const r=mon(REM,0,'def'),h1=mk('D・チャッカン',0);gameState.players[0].mz=[r];gameState.players[0].hand=[h1];baselineA();
  ok('D・リモコン negative: no other same-Level 「D」 in the GY -> not activatable (DEF mode)',canZ(r)===false,''); }

/* ===== 超古深海王シーラカンス ===== */
{ fresh();const c=mon(COE,0),f1=mk('クレイジー・フィッシュ',0),f2=mk('グレート・ホワイト',0),big=mk('ヒゲアンコウ',0),h1=mk('ワイト',0);
  gameState.players[0].mz=[c];gameState.players[0].hand=[h1];baselineA();
  ok('シーラカンス ①: not activatable without a Level 4 or lower Fish in the Deck',canZ(c)===false,'');}
{ fresh();const c=mon(COE,0),f1=mk('クレイジー・フィッシュ',0),f2=mk('グレート・ホワイト',0),dc=mk('ワイト',0),h1=mk('ワイト',0);
  gameState.players[0].mz=[c];gameState.players[0].hand=[h1];gameState.players[0].deck=[f1,f2,dc].concat(gameState.players[0].deck);baselineA();
  ok('シーラカンス ①: activatable (hand card + Level 4 or lower Fish in the Deck)',canZ(c)===true,'');
  actZ(c,[uid(h1)]);
  ok('シーラカンス ①: the discard paid; every Level 4 or lower Fish in the Deck was Special Summoned',z(h1)==='grave'&&z(f1)==='mz'&&z(f2)==='mz'&&z(dc)==='deck',JSON.stringify([z(h1),z(f1),z(f2),z(dc)]));
  ok('シーラカンス ①: the summoned Fish cannot attack and are negated',C(f1).cannotAttack===true&&C(f2).cannotAttack===true&&effectNegated(C(f1))&&effectNegated(C(f2)),JSON.stringify([C(f1).cannotAttack,effectNegated(C(f1))]));
  ok('シーラカンス ①: once per turn',canZ(c)===false,'');
  audit('シーラカンス 1'); }
{ fresh();const c=mon(COE,0),f1=mk('クレイジー・フィッシュ',0),f2=mk('グレート・ホワイト',0),h1=mk('ワイト',0),fl=[mon('ワイト',0),mon('ワイト',0),mon('ワイト',0)];
  gameState.players[0].mz=[c].concat(fl);gameState.players[0].hand=[h1];gameState.players[0].deck=[f1,f2].concat(gameState.players[0].deck);baselineA();
  actZ(c,[uid(h1)]);
  ok('シーラカンス ①: only as many as fit the free Monster Zones (one) are Special Summoned',gameState.players[0].mz.length===5&&((z(f1)==='mz')!==(z(f2)==='mz')),JSON.stringify([z(f1),z(f2),gameState.players[0].mz.length])); }
{ fresh();gameState.activePlayer=1;const c=mon(COE,0),fs=mon('クレイジー・フィッシュ',0),ec=mk('エネミーコントローラー',1);
  gameState.players[0].mz=[c,fs];gameState.players[1].hand=[ec];baselineA();
  foeCast('エネミーコントローラー',[uid(c)]);
  ok('シーラカンス ②: the opponent targeted it -> offered',offeredTo(0,c),JSON.stringify({len:gameState.chain.length}));
  respond(0,c,[uid(fs)]);drive();
  ok('シーラカンス ②: the other Fish was released as cost; the activation negated and エネミーコントローラー destroyed; シーラカンス unchanged',z(fs)==='grave'&&z(ec)==='grave'&&z(c)==='mz'&&C(c).pos==='atk',JSON.stringify([z(fs),z(ec),z(c),C(c)&&C(c).pos]));
  audit('シーラカンス 2'); }
{ fresh();gameState.activePlayer=1;const c=mon(COE,0),fs=mon('クレイジー・フィッシュ',0),ec=mk('エネミーコントローラー',1);
  gameState.players[0].mz=[c,fs];gameState.players[1].hand=[ec];baselineA();
  foeCast('エネミーコントローラー',[uid(fs)]);
  ok('シーラカンス ② negative: another monster was targeted -> not offered',offeredTo(0,c)===false,'');drive(); }
{ fresh();gameState.activePlayer=1;const c=mon(COE,0),ec=mk('エネミーコントローラー',1);
  gameState.players[0].mz=[c];gameState.players[1].hand=[ec];baselineA();
  foeCast('エネミーコントローラー',[uid(c)]);
  ok('シーラカンス ② negative: no other Fish to release -> not offered',offeredTo(0,c)===false,'');drive(); }
`);
