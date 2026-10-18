/* S03-U448: サイコパス, リゾネーター・エンジン, レベルアップ!, 六武式三段衝, バブル・シャッフル (stale ENGINE_GAP Spells).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4300001;
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
const PSY='サイコパス',ENG='リゾネーター・エンジン',LVU='レベルアップ!',SIX='六武式三段衝',SHF='バブル・シャッフル';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
let ALL=false;const __p=pick;pick=function(){const q=pc();if(ALL&&q&&q.title.indexOf('サイコパス')>=0){answerChoiceV49(q.candidates.map(c=>c.key));return;}return __p();};

/* ===== サイコパス ===== */
{ fresh();const sp=mk(PSY,0),a=mk('ガスタの神官 ムスト',0),b=mk('カバリスト',0),x=mk('ワイト',0);gameState.players[0].hand=[sp];gameState.players[0].banish=[a,b,x];baselineA();
  const l0=lp(0);ALL=true;cast(0,PSY);ALL=false;
  ok('サイコパス: 800 LP paid and both banished Psychic monsters of mine were added to the hand (the non-Psychic stays banished)',lp(0)===l0-800&&z(a)==='hand'&&z(b)==='hand'&&z(x)==='banish',JSON.stringify([l0,lp(0),z(a),z(b),z(x)]));
  audit('サイコパス 1'); }
{ fresh();const sp=mk(PSY,0),x=mk('ワイト',0);gameState.players[0].hand=[sp];gameState.players[0].banish=[x];baselineA();
  ok('サイコパス negative: no banished Psychic monster → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== リゾネーター・エンジン ===== */
{ fresh();const sp=mk(ENG,0),r1=mk('クロック・リゾネーター',0),r2=mk('フレア・リゾネーター',0),w=mk('ウィルミー',0);gameState.players[0].hand=[sp];gameState.players[0].grave=[r1,r2];gameState.players[0].deck.push(w);baselineA();
  cast(0,ENG,[uid(r1),uid(r2),uid(w)]);
  ok('リゾネーター・エンジン: the Level 4 monster of the Deck was added to the hand and the two chosen 「リゾネーター」 went back to the Deck',z(w)==='hand'&&z(r1)==='deck'&&z(r2)==='deck',JSON.stringify([z(w),z(r1),z(r2)]));
  audit('エンジン 1'); }
{ fresh();const sp=mk(ENG,0),r1=mk('クロック・リゾネーター',0);gameState.players[0].hand=[sp];gameState.players[0].grave=[r1];baselineA();
  ok('リゾネーター・エンジン negative: only one 「リゾネーター」 in the Graveyard → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== レベルアップ! ===== */
{ fresh();const sp=mk(LVU,0),l3=mon('サイレント・ソードマン LV3',0),l5=mk('サイレント・ソードマン LV5',0);gameState.players[0].hand=[sp];gameState.players[0].mz=[l3];gameState.players[0].deck.push(l5);baselineA();
  cast(0,LVU,[uid(l3),uid(l5)]);
  ok('レベルアップ!: the face-up LV3 went to the Graveyard (cost) and 「サイレント・ソードマン LV5」 was Special Summoned from the Deck',z(l3)==='grave'&&z(l5)==='mz',JSON.stringify([z(l3),z(l5)]));
  audit('レベルアップ 1'); }
{ fresh();const sp=mk(LVU,0),l3=mon('サイレント・ソードマン LV3',0);gameState.players[0].hand=[sp];gameState.players[0].mz=[l3];baselineA();
  ok('レベルアップ! negative: 「LV5」 is not in the hand or Deck → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 六武式三段衝 ===== */
function sixField(){fresh();const sp=mk(SIX,0),s1=mon('六武衆－イロウ',0),s2=mon('六武衆－ヤイチ',0),s3=mon('六武衆－ザンジ',0),f1=mon('ワイト',1),f2=mon('ブラック・マジシャン',1),up=mk('リビングデッドの呼び声',1,'up'),st=mk('ブラック・ホール',1,'down');
  gameState.players[0].hand=[sp];gameState.players[0].mz=[s1,s2,s3];gameState.players[1].mz=[f1,f2];gameState.players[1].sz=[up,st];baselineA();return {sp,f1,f2,up,st};}
{ const x=sixField();
  cast(0,SIX,['mons']);
  ok('六武式三段衝: mode 1 — every face-up monster of the opponent destroyed, the Spell & Trap Cards stay',z(x.f1)==='grave'&&z(x.f2)==='grave'&&z(x.up)==='sz'&&z(x.st)==='sz',JSON.stringify([z(x.f1),z(x.f2),z(x.up),z(x.st)]));
  audit('三段衝 1'); }
{ const x=sixField();
  cast(0,SIX,['up']);
  ok('六武式三段衝: mode 2 — the face-up Spell / Trap of the opponent destroyed (the Set card and the monsters stay)',z(x.up)==='grave'&&z(x.st)==='sz'&&z(x.f1)==='mz',JSON.stringify([z(x.up),z(x.st),z(x.f1)])); }
{ const x=sixField();
  cast(0,SIX,['set']);
  ok('六武式三段衝: mode 3 — the Set Spell / Trap of the opponent destroyed (the face-up one stays)',z(x.st)==='grave'&&z(x.up)==='sz'&&z(x.f1)==='mz',JSON.stringify([z(x.st),z(x.up),z(x.f1)])); }
{ fresh();const sp=mk(SIX,0),s1=mon('六武衆－イロウ',0),s2=mon('六武衆－ヤイチ',0),f1=mon('ワイト',1);gameState.players[0].hand=[sp];gameState.players[0].mz=[s1,s2];gameState.players[1].mz=[f1];baselineA();
  ok('六武式三段衝 negative: only two 六武衆 → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== バブル・シャッフル ===== */
{ fresh();const sp=mk(SHF,0),b=mon('E・HERO バブルマン',0),f=mon('ブラック・マジシャン',1),h=mk('E・HERO クレイマン',0);gameState.players[0].hand=[sp,h];gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  cast(0,SHF,[uid(f),uid(h)]);
  ok('バブル・シャッフル: the opponent monster turned Defense Position, the Bubbleman was sent to the Graveyard and a 「E・HERO」 of the hand was Special Summoned',C(f).pos==='def'&&z(b)==='grave'&&z(h)==='mz',JSON.stringify([C(f)&&C(f).pos,z(b),z(h)]));
  audit('シャッフル 1'); }
{ fresh();const sp=mk(SHF,0),w=mon('ワイト',0),f=mon('ブラック・マジシャン',1),h=mk('E・HERO クレイマン',0);gameState.players[0].hand=[sp,h];gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  ok('バブル・シャッフル negative: no 「E・HERO バブルマン」 on my field → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
`);
