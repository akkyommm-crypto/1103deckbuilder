/* S03-U390: 白竜の聖騎士, 魔法の歯車, 人海戦術, ボスラッシュ (PARTIAL auto-table entries replaced by exact scripts).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3900001;
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
















const KNI='白竜の聖騎士',GEA='魔法の歯車',SWM='人海戦術',BOS='ボスラッシュ';
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function nsReason(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

/* ===== 白竜の聖騎士 ===== */
{ fresh();const rit=mk('白竜降臨',0,'up'),k=mk(KNI,0),tr=mon('ライオウ',0);
  gameState.players[0].hand=[rit,k];gameState.players[0].mz=[tr];baselineA();
  PREFER=[uid(k),uid(tr)];duelActivateFromHand(0);drive();PREFER=[];
  ok('聖騎士: Ritual Summoned by 白竜降臨 (a Level 4 Tribute)',z(k)==='mz',JSON.stringify([z(k),z(tr)]));
  audit('聖騎士 0'); }
{ fresh();const k=mon(KNI,0),f=mk('ワイト',1,'down','def');f.setTurn=4;gameState.players[0].mz=[k];gameState.players[1].mz=[f];baselineA();
  phase('battle');const l0=lp(0);
  atkTarget(0,k,f);
  ok('聖騎士: attacking a face-down Defense monster destroys it without damage calculation (it stays face-down); no damage to me',z(f)==='grave'&&z(k)==='mz'&&lp(0)===l0,JSON.stringify([z(f),z(k),lp(0)]));
  audit('聖騎士 1'); }
{ fresh();const k=mon(KNI,0),f=mon('ライオウ',1,'def');gameState.players[0].mz=[k];gameState.players[1].mz=[f];baselineA();
  phase('battle');
  atkTarget(0,k,f);
  ok('聖騎士 negative: a face-up Defense monster is fought normally (ライオウ DEF 1500 < ATK 1900 -> destroyed by the normal calculation, with the Knight surviving)',z(f)==='grave'&&z(k)==='mz',JSON.stringify([z(f),z(k)])); }
{ fresh();const k=mon(KNI,0),b=mk('青眼の白龍',0),dk=mk('青眼の白龍',0);
  gameState.players[0].mz=[k];gameState.players[0].deck=[dk].concat(gameState.players[0].deck);gameState.players[0].hand=[b];baselineA();
  PREFER=[uid(dk)];actZ(k,[uid(dk)]);PREFER=[];
  ok('聖騎士: released (sent to the Graveyard); 青眼の白龍 Special Summoned from the Deck',z(k)==='grave'&&z(dk)==='mz',JSON.stringify([z(k),z(dk)]));
  ok('聖騎士: that 青眼の白龍 cannot attack this turn',cannotAttackNow(C(dk))===true,String(cannotAttackNow(C(dk))));
  audit('聖騎士 2'); }
{ fresh();const k=mon(KNI,0);gameState.players[0].mz=[k];baselineA();
  ok('聖騎士 negative: no 青眼の白龍 in the hand or Deck -> the release effect is not activatable',canZ(k)===false,''); }

/* ===== 魔法の歯車 ===== */
function gearField(){fresh();const sp=mk(GEA,0,'up'),a=mon('古代の機械兵士',0),b=mon('古代の機械獣',0),c=mon('古代の機械工兵',0),w=mon('ワイト',0),g1=mk('古代の機械巨人',0),g2=mk('古代の機械巨人',0);
  gameState.players[0].hand=[sp,g1];gameState.players[0].mz=[a,b,c,w];gameState.players[0].deck=[g2].concat(gameState.players[0].deck);baselineA();return {sp,a,b,c,w,g1,g2};}
{ const x=gearField();
  PREFER=[uid(x.a),'yes',uid(x.b),'yes',uid(x.c)];cast(0,GEA);
  ok('歯車: the three 「アンティーク・ギア」 cards were sent to the Graveyard (cost)',z(x.a)==='grave'&&z(x.b)==='grave'&&z(x.c)==='grave',JSON.stringify([z(x.a),z(x.b),z(x.c)]));
  ok('歯車: one 古代の機械巨人 from the hand and one from the Deck Special Summoned (ignoring the conditions); my other monster (ワイト) destroyed',z(x.g1)==='mz'&&z(x.g2)==='mz'&&z(x.w)==='grave',JSON.stringify([z(x.g1),z(x.g2),z(x.w)]));
  ok('歯車: I cannot Normal Summon this turn and in my next two turns',!!nsReason(0,'ワイト','normal'),nsReason(0,'ワイト','normal'));
  endTurn();endTurn();
  ok('歯車: still banned in my next turn (the 2nd of my turns counted from the activation)',!!nsReason(0,'ワイト','normal'),'');
  endTurn();endTurn();
  ok('歯車: over in the turn after that',nsReason(0,'ワイト','normal')==='','');
  audit('歯車 1'); }
{ fresh();const sp=mk(GEA,0,'up'),a=mon('古代の機械兵士',0),b=mon('古代の機械獣',0),g1=mk('古代の機械巨人',0);gameState.players[0].hand=[sp,g1];gameState.players[0].mz=[a,b];baselineA();
  ok('歯車 negative: only two 「アンティーク・ギア」 cards -> not activatable',getLegalHandActions(0,0).some(x=>x.id==='activate')===false,''); }

/* ===== 人海戦術 ===== */
{ fresh();const t=faceSet(SWM,0),n1=mon('きのこマン',0),n2=mk('D・ナポレオン',0),n3=mk('さまよえる亡者',0),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[n1];gameState.players[0].deck=[n2,n3].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  actSzC(t);
  toOppBattle();foeAttack(f,n1);
  ok('人海戦術: the Level 2 Normal Monster was destroyed by battle',z(n1)==='grave',z(n1));
  phase('end');
  const live=[n2,n3].filter(x=>z(x)==='mz').length;
  ok('人海戦術: at the End Phase one Level 2 or lower Normal Monster of the Deck was Special Summoned (one destroyed)',live===1&&gameState.players[0].mz.length===1,JSON.stringify([z(n2),z(n3),gameState.players[0].mz.length]));
  audit('人海戦術 1'); }
{ fresh();const t=faceSet(SWM,0),n1=mon('ブラック・マジシャン',0),n2=mk('D・ナポレオン',0),f=mon('青眼の白龍',1);
  gameState.players[0].sz=[t];gameState.players[0].mz=[n1];gameState.players[0].deck=[n2].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  actSzC(t);
  toOppBattle();foeAttack(f,n1);phase('end');
  ok('人海戦術 negative: a Level 7 Normal Monster destroyed -> nothing is summoned',z(n2)==='deck',z(n2)); }

/* ===== ボスラッシュ ===== */
{ fresh();const s=mk(BOS,0,'up'),w=mk('ワイト',0),sh=mon('巨大戦艦 テトラン',0),sh2=mk('巨大戦艦 ビッグ・コア',0),bh=mk('ブラック・ホール',0,'up');
  gameState.players[0].hand=[s,w,bh];gameState.players[0].mz=[sh];gameState.players[0].deck=[sh2].concat(gameState.players[0].deck);baselineA();
  cast(0,BOS);
  ok('ボスラッシュ: activated (no Normal Summon yet this turn)',z(s)==='sz'&&C(s).face==='up',JSON.stringify([z(s),C(s)&&C(s).face]));
  ok('ボスラッシュ: I cannot Normal Summon while it is face-up (the opponent can)',!!nsReason(0,'ワイト','normal')&&nsReason(1,'ワイト','normal')==='',JSON.stringify([nsReason(0,'ワイト','normal'),nsReason(1,'ワイト','normal')]));
  PREFER=['yes',uid(sh2)];cast(0,'ブラック・ホール');phase('end');PREFER=[];
  ok('ボスラッシュ: my 巨大戦艦 destroyed -> at the End Phase a 巨大戦艦 of the Deck Special Summoned',z(sh)==='grave'&&z(sh2)==='mz',JSON.stringify([z(sh),z(sh2)]));
  audit('ボスラッシュ 1'); }
{ fresh();const s=mk(BOS,0,'up'),w=mk('ワイト',0);gameState.players[0].hand=[s,w];baselineA();
  doNormalSummon(1,'atk');drive();
  ok('ボスラッシュ negative: after a Normal Summon this turn -> not activatable',getLegalHandActions(0,0).some(x=>x.id==='activate')===false,''); }
`);
