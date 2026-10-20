/* S03-U373: ヴァイロン・マテリアル, 極星宝ドラウプニル, スクラップ・シャーク, 見習い魔術師, 機皇城 (PARTIAL auto-table entries replaced by exact scripts).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3730001;
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

const MAT='ヴァイロン・マテリアル',DRA='極星宝ドラウプニル',SHK='スクラップ・シャーク',APP='見習い魔術師',CAS='機皇城';

/* ===== ヴァイロン・マテリアル ===== */
{ fresh();const v=mon('ヴァイロン・ソルジャー',0),o=mon('ワイト',0),eq=mk(MAT,0),sp=mk('ヴァイロン・エレメント',0),vm=mk('ヴァイロン・ステラ',0),cy=mk('サイクロン',0,'up');
  gameState.players[0].hand=[eq,cy];gameState.players[0].mz=[v,o];gameState.players[0].deck=[vm,sp].concat(gameState.players[0].deck);gameState.players[1].sz=[setCard('強制脱出装置',1)];baselineA();
  ok('マテリアル: activatable with a 「ヴァイロン」 host',legalH(0).ok===true,JSON.stringify(legalH(0)));
  const a0=curATK(C(v));cast(0,MAT,[uid(o),uid(v)]);
  ok('マテリアル: equipped to the 「ヴァイロン」 only (ライオウ offered no)',equipped(v,eq)&&!(C(o).equippedBy&&C(o).equippedBy.length),JSON.stringify([z(eq),equipped(v,eq)]));
  ok('マテリアル: ATK +600',curATK(C(v))===a0+600,JSON.stringify([a0,curATK(C(v))]));
  SEEN.length=0;cast(0,'サイクロン',[uid(eq),sp&&uid(sp)]);
  ok('マテリアル: destroyed from the field face-up -> 「ヴァイロン」 Spell added from the Deck (not the monster)',z(eq)==='grave'&&z(sp)==='hand'&&z(vm)==='deck',JSON.stringify([z(eq),z(sp),z(vm)]));
  audit('マテリアル'); }
{ fresh();const o=mon('ワイト',0),eq=mk(MAT,0);gameState.players[0].hand=[eq];gameState.players[0].mz=[o];baselineA();
  ok('マテリアル: refused — no 「ヴァイロン」 monster',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 極星宝ドラウプニル ===== */
{ fresh();const t=mon('極星獣ガルム',0),o=mon('ワイト',0),eq=mk(DRA,0),gu=mk('極星宝グングニル',0),mi=mk('極星天ミーミル',0),oth=mk('ワイト',0),cy=mk('サイクロン',0,'up');
  gameState.players[0].hand=[eq,cy];gameState.players[0].mz=[t,o];gameState.players[0].deck=[mi,oth,gu].concat(gameState.players[0].deck);gameState.players[1].sz=[setCard('強制脱出装置',1)];baselineA();
  const a0=curATK(C(t));cast(0,DRA,[uid(o),uid(t)]);
  ok('ドラウプニル: equipped to the 「極星」 monster only',equipped(t,eq)&&!(C(o).equippedBy&&C(o).equippedBy.length),JSON.stringify([z(eq),equipped(t,eq)]));
  ok('ドラウプニル: ATK +800',curATK(C(t))===a0+800,JSON.stringify([a0,curATK(C(t))]));
  SEEN.length=0;cast(0,'サイクロン',[uid(eq),uid(gu)]);
  ok('ドラウプニル: destroyed by a card effect -> 「極星宝」 card added from the Deck (グングニル)',z(eq)==='grave'&&z(gu)==='hand',JSON.stringify([z(eq),z(gu)]));
  ok('ドラウプニル: the choice listed the 「極星宝」 card only (not the 極星 monster, not another card)',SEEN.every(s=>s.cands.indexOf(mi.uid)<0&&s.cands.indexOf(oth.uid)<0),JSON.stringify(SEEN));
  audit('ドラウプニル'); }
{ fresh();const t=mon('極星獣ガルム',0),eq=mk(DRA,0),gu=mk('極星宝グングニル',0);
  gameState.players[0].hand=[eq];gameState.players[0].mz=[t];gameState.players[0].deck=[gu].concat(gameState.players[0].deck);baselineA();
  cast(0,DRA,[uid(t)]);act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(t),reason:'test',byDestroy:true});drive();
  ok('ドラウプニル negative: the host destroyed (Equip Spell goes with it, not destroyed by a card effect) -> no search',z(t)==='grave'&&z(eq)==='grave'&&z(gu)==='deck',JSON.stringify([z(t),z(eq),z(gu)])); }
{ fresh();const o=mon('ワイト',0),eq=mk(DRA,0);gameState.players[0].hand=[eq];gameState.players[0].mz=[o];baselineA();
  ok('ドラウプニル: refused — no 「極神」/「極星」 monster',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== スクラップ・シャーク ===== */
{ fresh();const s=mon(SHK,0),cy=mk('サイクロン',0,'up'),g=mk('スクラップ・ゴブリン',0),w=mk('ライオウ',0,'up');
  gameState.players[0].hand=[cy];gameState.players[0].mz=[s];gameState.players[0].deck=[w,g].concat(gameState.players[0].deck);gameState.players[1].sz=[setCard('強制脱出装置',1)];baselineA();
  cast(0,'サイクロン');
  ok('シャーク: a Spell was activated -> the Shark is destroyed',z(s)==='grave',z(s));
  ok('シャーク: destroyed by its own Scrap effect -> a 「スクラップ」 monster is sent from the Deck (ライオウ not)',z(g)==='grave'&&z(w)==='deck',JSON.stringify([z(g),z(w)]));
  audit('シャーク 1'); }
{ fresh();const s=mon(SHK,0),bh=mk('ブラック・ホール',0,'up'),g=mk('スクラップ・ゴブリン',0);
  gameState.players[0].hand=[bh];gameState.players[0].mz=[s];gameState.players[0].deck=[g].concat(gameState.players[0].deck);baselineA();
  cast(0,'ブラック・ホール');
  ok('シャーク negative: destroyed by ブラック・ホール (not a Scrap card) -> nothing is sent from the Deck',z(s)==='grave'&&z(g)==='deck',JSON.stringify([z(s),z(g)])); }
{ fresh();const s=mon(SHK,1),gn=mon('氷結界の龍 グングニール',0),h1=mk('ワイト',0),g=mk('スクラップ・ゴブリン',1);
  gameState.players[0].hand=[h1];gameState.players[0].mz=[gn];gameState.players[1].mz=[s];gameState.players[1].deck=[g].concat(gameState.players[1].deck);baselineA();
  PREFER=[uid(s)];duelActivateFromZone(0,'mz',idx(gn));drive();PREFER=[];
  ok('シャーク: a monster effect was activated -> the Shark is destroyed (by the effect or by itself) and leaves the field',z(s)==='grave',z(s));
  audit('シャーク 2'); }

/* ===== 見習い魔術師 ===== */
{ fresh();const br=mon('魔導戦士 ブレイカー',0),a=mk(APP,0);gameState.players[0].mz=[br];gameState.players[0].hand=[a];baselineA();
  PREFER=[uid(br)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('見習い魔術師: Normal Summoned -> a Spell Counter is placed on the capable card (魔導戦士 ブレイカー)',z(a)==='mz'&&cc(br)>=1,JSON.stringify([z(a),cc(br)]));
  audit('見習い 1'); }
{ fresh();const a=mk(APP,0);gameState.players[0].hand=[a];gameState.players[0].mz=[mon('ライオウ',0)];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('見習い魔術師 negative: no card able to hold a Spell Counter -> summoned, no counter, no stuck choice',z(a)==='mz'&&!pc(),JSON.stringify([z(a),!!pc()])); }
{ fresh();const a=mon(APP,0),k=mk('アーケイン・ファイロ',0),dec=mk('ライオウ',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[a];gameState.players[0].deck=[dec,k].concat(gameState.players[0].deck);gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,a);
  ok('見習い魔術師: destroyed by battle -> a Level 2 or lower Spellcaster is Special Summoned face-down in Defense',z(a)==='grave'&&z(k)==='mz'&&C(k).face==='down'&&C(k).pos==='def'&&z(dec)==='deck',JSON.stringify([z(a),z(k),C(k)&&C(k).face,C(k)&&C(k).pos]));
  audit('見習い 2'); }

/* ===== 機皇城 ===== */
{ fresh();const w=mon('機皇帝ワイゼル∞',1),o=mon('ライオウ',1),o2=mon('ワイト',1),gn=mon('氷結界の龍 グングニール',0),h1=mk('ワイト',0),cas=mk(CAS,1);
  gameState.players[1].hand=[cas];gameState.players[0].hand=[h1];gameState.players[0].mz=[gn];gameState.players[1].mz=[w,o,o2];baselineA();
  /* control: without 機皇城 the Synchro lists both opposing monsters */
  SEEN.length=0;PREFER=[uid(o)];duelActivateFromZone(0,'mz',idx(gn));drive();PREFER=[];
  const ctl=SEEN.map(s=>s.cands);
  ok('機皇城 control: without the Field Spell the Synchro may choose 機皇帝ワイゼル∞ too',ctl.some(c=>c.indexOf(w.uid)>=0),JSON.stringify(ctl)+' w='+w.uid); }
{ fresh();const w=mon('機皇帝ワイゼル∞',1),o=mon('ライオウ',1),o2=mon('ワイト',1),gn=mon('氷結界の龍 グングニール',0),h1=mk('ワイト',0),cas=mk(CAS,1);
  gameState.players[1].hand=[cas];gameState.players[0].hand=[h1];gameState.players[0].mz=[gn];gameState.players[1].mz=[w,o,o2];baselineA();
  endTurn();cast(1,CAS);endTurn();
  ok('機皇城: activated from the hand onto the Field Zone',z(cas)==='field'&&pl(cas)===1,JSON.stringify([z(cas),pl(cas)]));
  SEEN.length=0;PREFER=[uid(o)];duelActivateFromZone(0,'mz',idx(gn));drive();PREFER=[];
  const lists=SEEN.map(s=>s.cands);
  ok('機皇城: a Synchro Monster effect cannot target 機皇帝ワイゼル∞ (ライオウ is offered, ワイゼル is not)',lists.length>0&&lists.every(c=>c.indexOf(w.uid)<0)&&lists.some(c=>c.indexOf(o.uid)>=0),JSON.stringify(lists)+' w='+w.uid+' o='+o.uid);
  ok('機皇城: ワイゼル∞ survives, ライオウ destroyed',z(w)==='mz'&&z(o)==='grave',JSON.stringify([z(w),z(o)]));
  audit('機皇城 1'); }
{ fresh();const w=mon('機皇帝ワイゼル∞',1),mt=mk('月の書',0),cas=mk(CAS,1);
  gameState.players[1].hand=[cas];gameState.players[0].hand=[mt];gameState.players[1].mz=[w];baselineA();
  endTurn();cast(1,CAS);endTurn();
  SEEN.length=0;PREFER=[uid(w)];cast(0,'月の書',[uid(w)]);
  ok('機皇城: a Spell (not a Synchro Monster effect) can still target 機皇帝ワイゼル∞ — 月の書 turned it face-down',z(w)==='mz'&&C(w).face==='down',JSON.stringify([z(w),C(w)&&C(w).face])); }
{ fresh();const cas=mk(CAS,1),k=mk('機皇帝グランエル∞',1),k2=mk('機皇兵スキエル・アイン',1),cy=mk('サイクロン',0,'up');
  gameState.players[1].hand=[cas];gameState.players[0].hand=[cy];gameState.players[1].deck=gameState.players[1].deck.slice(0,1).concat([k2,k],gameState.players[1].deck.slice(1));baselineA();
  endTurn();cast(1,CAS);endTurn();
  cast(0,'サイクロン',[uid(cas),uid(k)]);
  ok('機皇城: destroyed -> a 「機皇帝」 monster is added from the Deck (グランエル∞; 機皇兵 is not a 機皇帝)',z(cas)==='grave'&&z(k)==='hand'&&z(k2)==='deck',JSON.stringify([z(cas),z(k),z(k2)]));
  audit('機皇城 2'); }
`);
