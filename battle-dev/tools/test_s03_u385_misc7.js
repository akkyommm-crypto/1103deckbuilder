/* S03-U385: 紅蓮魔竜の壺, 究極・背水の陣, ゼンマイマニュファクチャ, 邪狂神の使い, 不吉な占い (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3850001;
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











const POT='紅蓮魔竜の壺',LAST='究極・背水の陣',MFG='ゼンマイマニュファクチャ',ENV='邪狂神の使い',OMEN='不吉な占い';
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function ssReason(p,name){return v46SpecialSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}));}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}

/* ===== 紅蓮魔竜の壺 ===== */
{ fresh();const f=mk(POT,0,'up'),r=mon('レッド・デーモンズ・ドラゴン',0);gameState.players[0].hand=[f];gameState.players[0].mz=[r];baselineA();
  const h0=gameState.players[0].hand.length;
  cast(0,POT);
  ok('壺: 2 cards drawn',gameState.players[0].hand.length===h0-1+2,String(gameState.players[0].hand.length));
  ok('壺: I cannot Normal / Special Summon this turn; Flip Summon stays legal',!!nsReason(0,'ワイト','normal')&&!!ssReason(0,'ワイト')&&nsReason(0,'ワイト','flip')==='',JSON.stringify([nsReason(0,'ワイト','normal'),ssReason(0,'ワイト')]));
  ok('壺: the opponent is not affected',nsReason(1,'ワイト','normal')===''&&ssReason(1,'ワイト')==='','');
  endTurn();
  ok('壺: still in force through the opponent turn (for me)',!!nsReason(0,'ワイト','normal'),'');
  endTurn();
  ok('壺: over afterwards',nsReason(0,'ワイト','normal')==='','');
  audit('壺 1'); }
{ fresh();const f=mk(POT,0,'up');gameState.players[0].hand=[f];gameState.players[0].mz=[mon('ワイト',0)];baselineA();
  ok('壺 negative: without レッド・デーモンズ・ドラゴン -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }

/* ===== 究極・背水の陣 ===== */
{ fresh();const t=setCard(LAST,0),a=mk('六武衆－ザンジ',0),a2=mk('六武衆－ザンジ',0),b=mk('六武衆－イロウ',0),c=mk('六武衆－カモン',0),on=mon('六武衆－カモン',1),o=mk('ワイト',0);
  gameState.players[0].sz=[t];gameState.players[0].grave=[a,a2,b,c,o];gameState.players[1].mz=[on];baselineA();
  actSzC(t);
  ok('背水: LP paid down to 100',lp(0)===100,String(lp(0)));
  const live=[a,a2,b].filter(x=>z(x)==='mz').length;
  ok('背水: one 六武衆 per name (ザンジ ×1, イロウ) Special Summoned; カモン (same name on the field) and ワイト stay',live===2&&z(c)==='grave'&&z(o)==='grave'&&((z(a)==='mz')!==(z(a2)==='mz')),JSON.stringify([z(a),z(a2),z(b),z(c),z(o)]));
  audit('背水 1'); }
{ fresh();const t=setCard(LAST,0);gameState.players[0].sz=[t];gameState.players[0].grave=[mk('ワイト',0)];baselineA();
  ok('背水 negative: no 六武衆 in the Graveyard -> not activatable',strictScriptLegalityV2(LAST,0,'sz',idx(t)).ok===false,''); }

/* ===== ゼンマイマニュファクチャ ===== */
{ fresh();const s=setCard(MFG,0),zb=mon('ゼンマイバット',0),zg=mk('ゼンマイウォリアー',0),zh=mk('ゼンマイソルジャー',0),gr=mk('ゼンマイバット',0),o=mk('ワイト',0);
  gameState.players[0].sz=[s];gameState.players[0].mz=[zb];gameState.players[0].grave=[gr];gameState.players[0].deck=[o,zg,zh].concat(gameState.players[0].deck);baselineA();
  actSzC(s);
  ok('マニュファクチャ: activated, face-up',C(s).face==='up',C(s).face);
  PREFER=[uid(zg)];actZ(zb,[uid(gr)]);PREFER=[];
  ok('マニュファクチャ: a ゼンマイ monster effect was activated -> a Level 4 or lower ゼンマイ added from the Deck',z(zg)==='hand'||z(zh)==='hand',JSON.stringify([z(zg),z(zh)]));
  audit('マニュファクチャ 1'); }

{ fresh();const m=mk(MFG,0,'up');gameState.players[0].hand=[m];baselineA();
  ok('マニュファクチャ: the Continuous Spell can be activated from the hand',getLegalHandActions(0,0).some(a=>a.id==='activate'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  cast(0,MFG);
  ok('マニュファクチャ: it is face-up in the Spell & Trap Zone afterwards',z(m)==='sz'&&C(m).face==='up',JSON.stringify([z(m),C(m)&&C(m).face])); }

/* ===== 邪狂神の使い ===== */
{ fresh();const e=mon(ENV,0),a=mk('ワイト',0),b=mk('ブラック・マジシャン',0),c=mk('青眼の白龍',0);
  gameState.players[0].mz=[e];gameState.players[0].grave=[a,b,c];baselineA();
  const d0=curDEF(C(e));
  PREFER=[uid(a),'yes',uid(b),'no'];endTurn();PREFER=[];
  ok('邪狂神の使い: at the opponent Standby Phase the two chosen DARK monsters are banished; the LIGHT monster stays (not offered)',z(a)==='banish'&&z(b)==='banish'&&z(c)==='grave',JSON.stringify([z(a),z(b),z(c)]));
  ok('邪狂神の使い: DEF +1000 (500 per banished monster) until the End Phase',curDEF(C(e))===d0+1000,JSON.stringify([d0,curDEF(C(e))]));
  endTurn();
  ok('邪狂神の使い: the bonus is gone afterwards',curDEF(C(e))===d0,String(curDEF(C(e))));
  audit('使い 1'); }

/* ===== 不吉な占い ===== */
function omenField(){fresh();const t=setCard(OMEN,0),h1=mk('ワイト',1);gameState.players[0].sz=[t];gameState.players[1].hand=[h1];baselineA();return {t,h1};}
{ const x=omenField();
  actSzC(x.t);
  const l1=lp(1);
  PREFER=['m'];endTurn();endTurn();PREFER=[];
  ok('占い: the random card (ワイト, a monster) guessed right with モンスター -> 700 damage',lp(1)===l1-700,JSON.stringify([l1,lp(1)]));
  audit('占い 1'); }
{ const x=omenField();
  actSzC(x.t);
  const l1=lp(1);
  PREFER=['t'];endTurn();endTurn();PREFER=[];
  ok('占い: a wrong guess (罠) -> no damage',lp(1)===l1,JSON.stringify([l1,lp(1)])); }
`);
