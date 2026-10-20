/* S03-U416: 救世竜 セイヴァー・ドラゴン, レアル・ジェネクス・オラクル, ミンゲイドラゴン, 不死武士 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4100001;
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
openPick=(title,note,items)=>{const it=items.find(x=>/2体分/.test(x.label))||items[0];it.onPick();};   /* the 1 / 2 Tribute choice: always the double one */
const SAV='救世竜 セイヴァー・ドラゴン',ORA='レアル・ジェネクス・オラクル',MIN='ミンゲイドラゴン',UND='不死武士';
function combos(p,exName){return exCombos(p,dbOf({id:findCardIndex(exName)})).combos.map(c=>c.materials.slice().sort((a,b)=>a-b).join());}
function withCard(cs,i){return cs.some(c=>c.split(',').map(Number).indexOf(i)>=0);}
function legalHandIds(i){return getLegalHandActions(0,i).map(a=>a.id);}
function tribCands(p,name){return tributeCandidates(p,dbOf({id:findCardIndex(name)}));}

/* ===== 救世竜 セイヴァー・ドラゴン ===== */
{ fresh();const sv=mon(SAV,0),st=mon('スターダスト・ドラゴン',0),kr=mon('クリボー',0),ex=mk('セイヴァー・スター・ドラゴン',0);
  gameState.players[0].mz=[sv,st,kr];gameState.players[0].ex=[ex];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x),k=combos(0,'セイヴァー・スター・ドラゴン');
  ok('セイヴァー・ドラゴン: usable as a Synchro Material of a 「セイヴァー」 Synchro Monster (セイヴァー・スター・ドラゴン)',k.indexOf([i(sv),i(st),i(kr)].sort((a,b)=>a-b).join())>=0,JSON.stringify(k));
  }
{ fresh();const sv=mon(SAV,0),ih=mon('アイアン・ハート',0),gn=mk('大地の騎士ガイアナイト',0);
  gameState.players[0].mz=[sv,ih];gameState.players[0].ex=[gn];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x),k=combos(0,'大地の騎士ガイアナイト');
  ok('セイヴァー・ドラゴン negative: Lv1 + Lv5 would make the Lv6 ガイアナイト, but the Tuner is only for 「セイヴァー」 monsters → no combination',k.length===0,JSON.stringify(k)); }
{ fresh();const kr=mon('クリボー',0),ih=mon('アイアン・ハート',0),gn=mk('大地の騎士ガイアナイト',0),tn=mon('ジェネクス・コントローラー',0),ud=mon('ジェネクス・ウンディーネ',0);
  gameState.players[0].mz=[tn,ud,kr,ih];gameState.players[0].ex=[gn];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x),k=combos(0,'大地の騎士ガイアナイト');
  ok('セイヴァー・ドラゴン control: without the Savior Tuner the Lv3 Tuner + Lv3 non-Tuner still make the Lv6 ガイアナイト',k.indexOf([i(tn),i(ud)].sort((a,b)=>a-b).join())>=0,JSON.stringify(k)); }

/* ===== レアル・ジェネクス・オラクル ===== */
{ fresh();const o=mk(ORA,0);gameState.players[0].deck.push(o);baselineA();
  const di=gameState.players[0].deck.indexOf(o);
  API.searchDeck(0,di,'ジェネクス・ウンディーネ');flushDeferredEventsV2();drive();
  ok('オラクル: added to the hand by a 「ジェネクス」 monster → Special Summoned from the hand',z(o)==='mz',z(o));
  audit('オラクル 1'); }
{ fresh();const o=mk(ORA,0);gameState.players[0].deck.push(o);baselineA();
  const di=gameState.players[0].deck.indexOf(o);
  API.searchDeck(0,di,'ワイト');flushDeferredEventsV2();drive();
  ok('オラクル negative: added by a card that is not a 「ジェネクス」 monster → stays in the hand',z(o)==='hand',z(o)); }
{ fresh();const o=mon(ORA,0),ev=mon('エビルナイト・ドラゴン',0),ac=mk('A・ジェネクス・アクセル',0),gn=mk('大地の騎士ガイアナイト',0);
  gameState.players[0].mz=[o,ev];gameState.players[0].ex=[ac,gn];baselineA();
  const i=x=>gameState.players[0].mz.indexOf(x),ka=combos(0,'A・ジェネクス・アクセル'),kg=combos(0,'大地の騎士ガイアナイト');
  ok('オラクル: usable as the Tuner of a 「ジェネクス」 Synchro Monster (A・ジェネクス・アクセル, Lv1 + Lv7)',ka.indexOf([i(o),i(ev)].sort((a,b)=>a-b).join())>=0,JSON.stringify(ka));
  ok('オラクル negative: not for a non-「ジェネクス」 Synchro Monster',!withCard(kg,i(o)),JSON.stringify(kg)); }

/* ===== ミンゲイドラゴン ===== */
{ fresh();const m=mon(MIN,0),d7=mk('エビルナイト・ドラゴン',0),b7=mk('ブラック・マジシャン',0);gameState.players[0].mz=[m];gameState.players[0].hand=[d7];baselineA();
  ok('ミンゲイ: counts as 2 Tributes for a Dragon (Lv7 エビルナイト・ドラゴン needs 2: the single ミンゲイドラゴン is enough)',legalHandIds(0).indexOf('normalSummon')>=0,JSON.stringify(legalHandIds(0)));
  doNormalSummon(0,'atk');drive();
  ok('ミンゲイ: the Advance Summon with it as the only Tribute succeeded',z(d7)==='mz'&&z(m)==='grave',JSON.stringify([z(d7),z(m)]));
  audit('ミンゲイ 1'); }
{ fresh();const m=mon(MIN,0),b7=mk('ブラック・マジシャン',0);gameState.players[0].mz=[m];gameState.players[0].hand=[b7];baselineA();
  ok('ミンゲイ negative: for a non-Dragon (Lv7 ブラック・マジシャン) it is only 1 Tribute → no Advance Summon',legalHandIds(0).indexOf('normalSummon')<0,JSON.stringify(legalHandIds(0))); }
{ fresh();const m=mk(MIN,0);gameState.players[0].grave=[m];baselineA();
  endTurn();endTurn();
  ok('ミンゲイ: at my Standby Phase with an empty field and only Dragons in the Graveyard it was Special Summoned in Attack Position',z(m)==='mz'&&C(m).pos==='atk',JSON.stringify([z(m),C(m)&&C(m).pos]));
  API.sendToGrave(findCardByUid(m.uid),'test');
  ok('ミンゲイ: leaving the field it is banished',z(m)==='banish',z(m));
  audit('ミンゲイ 2'); }
{ fresh();const m=mk(MIN,0),w=mk('ワイト',0);gameState.players[0].grave=[m,w];baselineA();
  endTurn();endTurn();
  ok('ミンゲイ negative: a non-Dragon monster in my Graveyard → not Special Summoned',z(m)==='grave',z(m)); }
{ fresh();const m=mk(MIN,0),f=mon('ワイト',0);gameState.players[0].grave=[m];gameState.players[0].mz=[f];baselineA();
  endTurn();endTurn();
  ok('ミンゲイ negative: a monster on my field → not Special Summoned',z(m)==='grave',z(m)); }

/* ===== 不死武士 ===== */
{ fresh();const u=mk(UND,0);gameState.players[0].grave=[u];baselineA();
  endTurn();endTurn();
  ok('不死武士: at my Standby Phase with an empty field and only Warriors in the Graveyard it was Special Summoned',z(u)==='mz'&&C(u).pos==='atk',JSON.stringify([z(u),C(u)&&C(u).pos]));
  audit('不死武士 1'); }
{ fresh();const u=mk(UND,0),w=mk('ワイト',0);gameState.players[0].grave=[u,w];baselineA();
  endTurn();endTurn();
  ok('不死武士 negative: a non-Warrior monster in my Graveyard → stays',z(u)==='grave',z(u)); }
{ fresh();const u=mk(UND,0),f=mon('ワイト',0);gameState.players[0].grave=[u];gameState.players[0].mz=[f];baselineA();
  endTurn();endTurn();
  ok('不死武士 negative: a monster on my field → stays',z(u)==='grave',z(u)); }
{ fresh();const u=mon(UND,0);gameState.players[0].mz=[u];baselineA();
  ok('不死武士: Tributable for a Warrior Advance Summon (暗黒騎士ガイア)',tribCands(0,'暗黒騎士ガイア').some(x=>x.card===C(u)),'');
  ok('不死武士: not Tributable for a non-Warrior (ブラック・マジシャン)',!tribCands(0,'ブラック・マジシャン').some(x=>x.card===C(u)),''); }
`);
