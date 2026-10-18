/* S03-U429: 氷の女王, D－HERO ディスクガイ, コアキメイル・ドラゴ, 暴君の自暴自棄, ワーム・ベイト, 迷える仔羊, スライム増殖炉 (stale ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x41D0001;
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
const QUE='氷の女王',DIS='D－HERO ディスクガイ',DRA='コアキメイル・ドラゴ',TYR='暴君の自暴自棄',WOR='ワーム・ベイト',LAM='迷える仔羊',SLI='スライム増殖炉';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function sr(p,name,kind){return v46FaceUpSummonRestrictionReason(p,dbOf({id:findCardIndex(name)}),kind);}
function H(c){return findCardByUid(c.uid);}
function toks(name,p){return (API.tokensOf(name,p)||[]).length;}

/* ===== 氷の女王 ===== */
{ fresh();const q=mon(QUE,0),c1=mk('ブラック・マジシャン',0),c2=mk('ブラック・マジシャン・ガール',0),sp=mk('死者蘇生',0);
  gameState.players[0].mz=[q];gameState.players[0].grave=[c1,c2,sp];baselineA();
  PREFER=[uid(sp)];API.destroy(H(q),'test');flushDeferredEventsV2();drive();PREFER=[];
  ok('氷の女王: destroyed on the field with 3+ Spellcasters in the Graveyard → a Spell of the Graveyard was added to the hand',z(q)==='grave'&&z(sp)==='hand',JSON.stringify([z(q),z(sp)]));
  ok('氷の女王: it cannot be Special Summoned from the Graveyard',API.specialSummon(0,'grave',gameState.players[0].grave.findIndex(c=>c.uid===q.uid),'atk','test')===false&&z(q)==='grave',z(q));
  audit('氷の女王 1'); }
{ fresh();const q=mon(QUE,0),c1=mk('ブラック・マジシャン',0),sp=mk('死者蘇生',0);
  gameState.players[0].mz=[q];gameState.players[0].grave=[c1,sp];baselineA();
  API.destroy(H(q),'test');flushDeferredEventsV2();drive();
  ok('氷の女王 negative: only 2 Spellcasters (herself and one) → nothing is added',z(q)==='grave'&&z(sp)==='grave',JSON.stringify([z(q),z(sp)])); }

/* ===== D－HERO ディスクガイ ===== */
{ fresh();const d=mk(DIS,0);gameState.players[0].grave=[d];baselineA();
  const n0=gameState.players[0].hand.length;
  API.specialSummon(0,'grave',0,'atk','test');flushDeferredEventsV2();drive();
  ok('ディスクガイ: Special Summoned from the Graveyard → drew 2 cards',z(d)==='mz'&&gameState.players[0].hand.length===n0+2,JSON.stringify([z(d),n0,gameState.players[0].hand.length]));
  API.sendToGrave(H(d),'test');
  ok('ディスクガイ: the turn it was sent to the Graveyard it cannot be Special Summoned from there',API.specialSummon(0,'grave',gameState.players[0].grave.findIndex(c=>c.uid===d.uid),'atk','test')===false&&z(d)==='grave',z(d));
  endTurn();endTurn();
  const n1=gameState.players[0].hand.length;API.specialSummon(0,'grave',gameState.players[0].grave.findIndex(c=>c.uid===d.uid),'atk','test');flushDeferredEventsV2();drive();
  ok('ディスクガイ: a later turn it can be Special Summoned again, but the draw works only once per duel',z(d)==='mz'&&gameState.players[0].hand.length===n1,JSON.stringify([z(d),n1,gameState.players[0].hand.length]));
  audit('ディスクガイ 1'); }

/* ===== コアキメイル・ドラゴ ===== */
{ fresh();const d=mon(DRA,0);gameState.players[0].mz=[d];baselineA();
  ok('ドラゴ: while face-up neither player can Special Summon a LIGHT / DARK monster',!!sr(0,'ブラック・マジシャン','special')&&!!sr(1,'青眼の白龍','special'),JSON.stringify([sr(0,'ブラック・マジシャン','special'),sr(1,'青眼の白龍','special')]));
  ok('ドラゴ: other Attributes are unaffected (WIND ガスタ・ガルド)',sr(0,'ガスタ・ガルド','special')==='',JSON.stringify([sr(0,'ガスタ・ガルド','special')]));
  phase('end');drive();
  ok('ドラゴ: End Phase upkeep not paid (no 鋼核, no Dragon in the hand) → destroyed',z(d)==='grave',z(d));
  audit('ドラゴ 1'); }
{ fresh();baselineA();
  ok('ドラゴ control: without it a DARK monster can be Special Summoned',sr(0,'ブラック・マジシャン','special')==='',sr(0,'ブラック・マジシャン','special')); }

/* ===== 暴君の自暴自棄 ===== */
{ fresh();const t=setCard(TYR,0),n1=mon('ブラック・マジシャン',0),n2=mon('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].mz=[n1,n2];baselineA();
  actSzC(t,[uid(n1),uid(n2)]);
  ok('暴君の自暴自棄: two Normal Monsters were released and the Trap is face-up',z(n1)==='grave'&&z(n2)==='grave'&&z(t)==='sz'&&C(t).face==='up',JSON.stringify([z(n1),z(n2),z(t)]));
  ok('暴君の自暴自棄: neither player can summon / Special Summon an Effect Monster',!!sr(0,'ライオウ','normal')&&!!sr(1,'ライオウ','special'),JSON.stringify([sr(0,'ライオウ','normal'),sr(1,'ライオウ','special')]));
  ok('暴君の自暴自棄: Normal Monsters are unaffected',sr(0,'ワイト','normal')==='',sr(0,'ワイト','normal'));
  audit('暴君 1'); }
{ fresh();const t=setCard(TYR,0),n1=mon('ブラック・マジシャン',0);gameState.players[0].sz=[t];gameState.players[0].mz=[n1];baselineA();
  ok('暴君の自暴自棄 negative: only one Normal Monster → not activatable',getLegalZoneActions(0,'sz',idx(t)).every(a=>a.id!=='activate'&&a.id!=='activateSet'),JSON.stringify(getLegalZoneActions(0,'sz',idx(t)).map(a=>a.id))); }

/* ===== ワーム・ベイト ===== */
{ fresh();const s=mk(WOR,0,'up'),ins=mon('C・ラーバ',0);gameState.players[0].hand=[s];gameState.players[0].mz=[ins];baselineA();
  cast(0,WOR);
  ok('ワーム・ベイト: two 「ワームトークン」 were Special Summoned; the Spell went to the Graveyard',toks('ワームトークン',0)===2&&z(s)==='grave',JSON.stringify([toks('ワームトークン',0),z(s)]));
  ok('ワーム・ベイト: this turn I cannot summon / Special Summon Level 3 or 4 monsters (Levels 3 and 4 refused, Levels 5 and 2 not)',!!sr(0,'ガスタ・ガルド','normal')&&!!sr(0,'エーリアン・スカル','special')&&sr(0,'アイアン・ハート','special')===''&&sr(0,'フォース・リゾネーター','normal')==='',JSON.stringify([sr(0,'ガスタ・ガルド','normal'),sr(0,'エーリアン・スカル','special'),sr(0,'アイアン・ハート','special'),sr(0,'フォース・リゾネーター','normal')]));
  audit('ワーム・ベイト 1'); }
{ fresh();const s=mk(WOR,0,'up'),w=mon('ワイト',0);gameState.players[0].hand=[s];gameState.players[0].mz=[w];baselineA();
  ok('ワーム・ベイト negative: no Insect → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 迷える仔羊 ===== */
{ fresh();const s=mk(LAM,0,'up');gameState.players[0].hand=[s];baselineA();
  cast(0,LAM);
  ok('迷える仔羊: two 「仔羊トークン」 in Defense Position; the Spell went to the Graveyard',toks('仔羊トークン',0)===2&&z(s)==='grave',JSON.stringify([toks('仔羊トークン',0),z(s)]));
  ok('迷える仔羊: this turn I cannot summon / flip summon / Special Summon any monster; the opponent can',!!sr(0,'ワイト','normal')&&!!sr(0,'ワイト','flip')&&!!sr(0,'ワイト','special')&&sr(1,'ワイト','normal')==='',JSON.stringify([sr(0,'ワイト','normal'),sr(0,'ワイト','flip'),sr(0,'ワイト','special'),sr(1,'ワイト','normal')]));
  audit('仔羊 1'); }
{ fresh();const s=mk(LAM,0,'up');gameState.players[0].hand=[s];gameState.players[0].mz=[mon('ワイト',0),mon('ワイト',0),mon('ワイト',0),mon('ワイト',0)];baselineA();
  ok('迷える仔羊 negative: only one free Monster Zone → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== スライム増殖炉 ===== */
{ fresh();const s=mk(SLI,0,'up');gameState.players[0].hand=[s];baselineA();
  cast(0,SLI);
  ok('スライム増殖炉: placed face-up on my Spell & Trap Zone',z(s)==='sz'&&C(s).face==='up',JSON.stringify([z(s),C(s)&&C(s).face]));
  ok('スライム増殖炉: I cannot summon / Special Summon a monster other than the token (the opponent can)',!!sr(0,'ワイト','normal')&&!!sr(0,'ワイト','special')&&sr(1,'ワイト','normal')==='',JSON.stringify([sr(0,'ワイト','normal'),sr(0,'ワイト','special'),sr(1,'ワイト','normal')]));
  endTurn();endTurn();
  ok('スライム増殖炉: at my Standby Phase a 「スライムモンスタートークン」 was Special Summoned',toks('スライムモンスタートークン',0)===1,String(toks('スライムモンスタートークン',0)));
  audit('スライム 1'); }
`);
