/* S03-U426: フレア・リゾネーター, ニードル・ガンナー, トラスト・ガーディアン, チェーンドッグ (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x41A0001;
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
const FLA='フレア・リゾネーター',NEE='ニードル・ガンナー',TRU='トラスト・ガーディアン',CHA='チェーンドッグ';
function doSynchro(mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function combos(exName){return exCombos(0,dbOf({id:findCardIndex(exName)})).combos.map(c=>c.materials.slice().sort((a,b)=>a-b).join());}
function procRunG(name,i){runSummonProcedure(name,0,'grave',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'grave',i,'atk');drive();}
function procOkG(name,i){return strictSummonProcedureLegality(name,0,'grave',i).ok;}
function syn(c){return C(c)&&C(c).specialSummonKind==='synchro';}

/* ===== フレア・リゾネーター ===== */
{ fresh();const fl=mon(FLA,0),w=mon('13人目の埋葬者',0),ga=mk('大地の騎士ガイアナイト',0);gameState.players[0].mz=[fl,w];gameState.players[0].ex=[ga];baselineA();
  doSynchro([fl,w]);
  ok('フレア・リゾネーター: the Synchro Monster that used it has +300 ATK (2600 → 2900)',syn(ga)&&curATK(C(ga))===2900,JSON.stringify([syn(ga),curATK(C(ga))]));
  audit('フレア 1'); }
{ fresh();const tu=mon('ジェネクス・コントローラー',0),w=mon('13人目の埋葬者',0),ga=mk('大地の騎士ガイアナイト',0);gameState.players[0].mz=[tu,w];gameState.players[0].ex=[ga];baselineA();
  doSynchro([tu,w]);
  ok('フレア・リゾネーター control: with another Tuner the ATK stays 2600',syn(ga)&&curATK(C(ga))===2600,JSON.stringify([syn(ga),curATK(C(ga))])); }

/* ===== ニードル・ガンナー ===== */
{ fresh();const tu=mon('フォース・リゾネーター',0),ng=mon(NEE,0),w=mon('13人目の埋葬者',0),ga=mk('大地の騎士ガイアナイト',0),f=mon('ワイト',1,'def');
  gameState.players[0].mz=[tu,ng,w];gameState.players[0].ex=[ga];gameState.players[1].mz=[f];baselineA();
  doSynchro([tu,ng,w]);const l1=lp(1);
  phase('battle');myAttack(ga,f);
  ok('ニードル・ガンナー: the Synchro Monster that used it pierces a Defense Position monster (2600 − DEF 200 = 2400 damage)',z(f)==='grave'&&l1-lp(1)===2400,JSON.stringify([z(f),l1,lp(1)]));
  audit('ニードル 1'); }
{ fresh();const tu=mon('フォース・リゾネーター',0),w2=mon('ワイト',0),w=mon('13人目の埋葬者',0),ga=mk('大地の騎士ガイアナイト',0),f=mon('ワイト',1,'def');
  gameState.players[0].mz=[tu,w2,w];gameState.players[0].ex=[ga];gameState.players[1].mz=[f];baselineA();
  doSynchro([tu,w2,w]);const l1=lp(1);
  phase('battle');myAttack(ga,f);
  ok('ニードル・ガンナー control: without it no piercing damage',syn(ga)&&z(f)==='grave'&&l1-lp(1)===0,JSON.stringify([syn(ga),z(f),l1,lp(1)])); }

/* ===== トラスト・ガーディアン ===== */
{ fresh();const tr=mon(TRU,0),zm=mon('ゾンビ・マスター',0),fd=mk('エンシェント・フェアリー・ドラゴン',0),b1=mon('青眼の白龍',1),b2=mon('青眼の白龍',1);
  gameState.players[0].mz=[tr,zm];gameState.players[0].ex=[fd];gameState.players[1].mz=[b1,b2];baselineA();
  doSynchro([tr,zm]);const a0=curATK(C(fd)),d0=curDEF(C(fd));
  toOppBattle();foeAttack(b1,fd);
  ok('トラスト・ガーディアン: the first battle destruction of the turn is prevented; its ATK / DEF dropped by 400',z(fd)==='mz'&&curATK(C(fd))===a0-400&&curDEF(C(fd))===d0-400,JSON.stringify([z(fd),a0,curATK(C(fd)),d0,curDEF(C(fd))]));
  foeAttack(b2,fd);
  ok('トラスト・ガーディアン: only once per turn → destroyed by the second attack',z(fd)==='grave',z(fd));
  audit('トラスト 1'); }
{ fresh();const tr=mon(TRU,0),w=mon('13人目の埋葬者',0),ga=mk('大地の騎士ガイアナイト',0),fd=mk('エンシェント・フェアリー・ドラゴン',0);
  gameState.players[0].mz=[tr,w];gameState.players[0].ex=[ga,fd];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x),kg=combos('大地の騎士ガイアナイト');
  ok('トラスト・ガーディアン: not usable for a Level 6 Synchro Monster (ガイアナイト)',kg.every(c=>c.split(',').map(Number).indexOf(i(tr))<0),JSON.stringify(kg)); }

/* ===== チェーンドッグ ===== */
{ fresh();const c=mk(CHA,0),b1=mon('X－セイバー エアベルン',0),b2=mon('エレファン',0);gameState.players[0].grave=[c];gameState.players[0].mz=[b1,b2];baselineA();
  ok('チェーンドッグ: Special Summonable from the Graveyard (exactly two face-up Beast monsters)',procOkG(CHA,0)===true,'');
  procRunG(CHA,0);
  ok('チェーンドッグ: it stands on the field',z(c)==='mz',z(c));
  API.sendToGrave(findCardByUid(c.uid),'test');
  ok('チェーンドッグ: leaving the field it is banished',z(c)==='banish',z(c));
  audit('チェーンドッグ 1'); }
{ fresh();const c=mk(CHA,0),b1=mon('X－セイバー エアベルン',0);gameState.players[0].grave=[c];gameState.players[0].mz=[b1];baselineA();
  ok('チェーンドッグ negative: only one Beast → not Special Summonable',procOkG(CHA,0)===false,''); }
{ fresh();const c=mk(CHA,0),b1=mon('X－セイバー エアベルン',0),b2=mon('エレファン',0),b3=mon('キーマウス',0);gameState.players[0].grave=[c];gameState.players[0].mz=[b1,b2,b3];baselineA();
  ok('チェーンドッグ negative: three Beasts → not Special Summonable (「2体存在する場合」 is exactly two)',procOkG(CHA,0)===false,''); }
{ fresh();const c=mon(CHA,0),tu=mon('フォース・リゾネーター',0),ga=mk('大地の騎士ガイアナイト',0);gameState.players[0].mz=[c,tu];gameState.players[0].ex=[ga];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x),kg=combos('大地の騎士ガイアナイト');
  ok('チェーンドッグ: not usable for a non-Beast Synchro Monster (ガイアナイト)',kg.every(k=>k.split(',').map(Number).indexOf(i(c))<0),JSON.stringify(kg)); }
`);
