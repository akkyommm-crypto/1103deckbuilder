/* S03-U380: 創世神, 魂を喰らう者 バズー, マシン・デベロッパー, 世界樹 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3800001;
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






const GEN='創世神',BAZ='魂を喰らう者 バズー',DEV='マシン・デベロッパー',TREE='世界樹';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function cnt(c,k){const x=C(c);return x&&x.counters?(Number(x.counters[k])||0):0;}
function canSz(c){return getLegalZoneActions(0,'sz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

/* ===== 創世神 ===== */
{ fresh();const g=mon(GEN,0),h1=mk('ワイト',0),b=mk('青眼の白龍',0);
  gameState.players[0].mz=[g];gameState.players[0].hand=[h1];gameState.players[0].grave=[b];baselineA();
  ok('創世神: activatable (hand card + Graveyard monster)',canZ(g)===true,'');
  actZ(g,[uid(h1),uid(b)]);
  ok('創世神: the hand card discarded; the chosen Graveyard monster Special Summoned',z(h1)==='grave'&&z(b)==='mz',JSON.stringify([z(h1),z(b)]));
  ok('創世神: once per turn',canZ(g)===false,'');
  audit('創世神 1'); }
{ fresh();const g=mon(GEN,0),b=mk('青眼の白龍',0);gameState.players[0].mz=[g];gameState.players[0].grave=[b];baselineA();
  ok('創世神 negative: no card to discard -> not activatable',canZ(g)===false,''); }
{ fresh();const g1=mk(GEN,0),g2=mon(GEN,0),h1=mk('ワイト',0);gameState.players[0].mz=[g2];gameState.players[0].hand=[h1];gameState.players[0].grave=[g1];baselineA();
  ok('創世神 negative: another 創世神 in the Graveyard cannot be Special Summoned from there -> not activatable',canZ(g2)===false,''); }

/* ===== 魂を喰らう者 バズー ===== */
{ fresh();const z1=mon(BAZ,0),a=mk('ワイト',0),b=mk('ライオウ',0),c=mk('青眼の白龍',0),d=mk('ワイト',0);
  gameState.players[0].mz=[z1];gameState.players[0].grave=[a,b,c,d];baselineA();
  const a0=curATK(C(z1));
  actZ(z1,[uid(a),'yes',uid(b),'yes',uid(c)]);
  ok('バズー: three Graveyard monsters banished (cost); the fourth stays',z(a)==='banish'&&z(b)==='banish'&&z(c)==='banish'&&z(d)==='grave',JSON.stringify([z(a),z(b),z(c),z(d)]));
  ok('バズー: ATK +900 (300 per banished monster)',curATK(C(z1))===a0+900,JSON.stringify([a0,curATK(C(z1))]));
  endTurn();
  ok('バズー: still +900 during the opponent turn',curATK(C(z1))===a0+900,String(curATK(C(z1))));
  endTurn();
  ok('バズー: back to normal after the opponent\'s End Phase',curATK(C(z1))===a0,String(curATK(C(z1))));
  audit('バズー 1'); }
{ fresh();const z1=mon(BAZ,0);gameState.players[0].mz=[z1];baselineA();
  ok('バズー negative: no monster in the Graveyard -> not activatable',canZ(z1)===false,''); }

/* ===== マシン・デベロッパー ===== */
function devField(){fresh();const dv=faceSet(DEV,0),m=mon('サイバー・ドラゴン',0),f=mon('ギガテック・ウルフ',1),w=mon('ワイト',1),bh=mk('ブラック・ホール',0,'up'),rv=mk('ガトリングバギー',0),big=mk('サイバー・ドラゴン',0);
  gameState.players[0].sz=[dv];gameState.players[0].mz=[m];gameState.players[0].hand=[bh];gameState.players[0].grave=[rv,big];gameState.players[1].mz=[f,w];baselineA();return {dv,m,f,w,bh,rv,big};}
{ const x=devField();
  const a0=curATK(C(x.m)),f0=curATK(C(x.f)),w0=curATK(C(x.w));
  actSzC(x.dv);
  ok('デベロッパー: activated, face-up',C(x.dv).face==='up',C(x.dv).face);
  ok('デベロッパー: every Machine monster gets +200 ATK (both fields), ワイト does not',curATK(C(x.m))===a0+200&&curATK(C(x.f))===f0+200&&curATK(C(x.w))===w0,JSON.stringify([curATK(C(x.m))-a0,curATK(C(x.f))-f0,curATK(C(x.w))-w0]));
  cast(0,'ブラック・ホール');
  ok('デベロッパー: two Machine monsters destroyed -> 4 ジャンクカウンター (ワイト adds none)',cnt(x.dv,'ジャンク')===4,String(cnt(x.dv,'ジャンク')));
  ok('デベロッパー: the effect is activatable',canSz(x.dv)===true,'');
  actSzC(x.dv,[uid(x.rv)]);
  ok('デベロッパー: sent to the Graveyard as the cost; a Machine of Level <= 4 (ガトリングバギー) revived (サイバー・ドラゴン Lv5 not)',z(x.dv)==='grave'&&z(x.rv)==='mz'&&z(x.big)==='grave',JSON.stringify([z(x.dv),z(x.rv),z(x.big)]));
  audit('デベロッパー 1'); }
{ fresh();const dv=faceSet(DEV,0);gameState.players[0].sz=[dv];baselineA();actSzC(dv);
  ok('デベロッパー negative: no counters -> the effect is not activatable',canSz(dv)===false,''); }

/* ===== 世界樹 ===== */
function treeField(n,hasGrave){fresh();const t=faceSet(TREE,0),p1=mon('アルラウネ',0),p2=mon('ジェリービーンズマン',1),pg=mk('きのこマン',0),bh=mk('ブラック・ホール',0,'up'),fo=mon('ワイト',1);
  if(n) t.counters={'フラワー':n};
  gameState.players[0].sz=[t];gameState.players[0].mz=[p1];gameState.players[0].hand=[bh];gameState.players[0].grave=hasGrave?[pg]:[];gameState.players[1].mz=[p2,fo];baselineA();return {t,p1,p2,pg,bh,fo};}
{ const x=treeField(0,true);
  actSzC(x.t);
  cast(0,'ブラック・ホール');
  ok('世界樹: two Plant monsters destroyed together (both fields) -> 2 フラワーカウンター (ワイト adds none)',cnt(x.t,'フラワー')===2,String(cnt(x.t,'フラワー')));
  ok('世界樹: with 2 counters the effect is activatable (option 2: destroy a field card)',canSz(x.t)===true,'');
  audit('世界樹 1'); }
{ const x=treeField(3,true);
  actSzC(x.t);
  ok('世界樹: 3 counters on the activated card',cnt(x.t,'フラワー')===3,String(cnt(x.t,'フラワー')));
  actSzC(x.t,['yes',uid(x.pg)]);
  ok('世界樹: option 3 (3 counters removed): the Graveyard Plant (きのこマン) Special Summoned',cnt(x.t,'フラワー')===0&&z(x.pg)==='mz',JSON.stringify([cnt(x.t,'フラワー'),z(x.pg)]));
  audit('世界樹 2'); }
{ const x=treeField(2,true);
  actSzC(x.t);
  actSzC(x.t,['yes',uid(x.fo)]);
  ok('世界樹: option 2 (2 counters removed): the chosen field card (ワイト) destroyed',cnt(x.t,'フラワー')===0&&z(x.fo)==='grave',JSON.stringify([cnt(x.t,'フラワー'),z(x.fo)])); }
{ const x=treeField(1,false);
  actSzC(x.t);
  const a0=curATK(C(x.p1)),d0=curDEF(C(x.p1));
  actSzC(x.t,['yes',uid(x.p1)]);
  ok('世界樹: option 1 (1 counter removed): the chosen Plant gets +400 ATK / DEF until the End Phase',cnt(x.t,'フラワー')===0&&curATK(C(x.p1))===a0+400&&curDEF(C(x.p1))===d0+400,JSON.stringify([cnt(x.t,'フラワー'),curATK(C(x.p1))-a0,curDEF(C(x.p1))-d0]));
  endTurn();endTurn();
  ok('世界樹: the bonus is gone at the end of the turn',curATK(C(x.p1))===a0,String(curATK(C(x.p1)))); }
{ const x=treeField(0,true);actSzC(x.t);
  ok('世界樹 negative: no counters -> the effect is not activatable',canSz(x.t)===false,''); }
`);
