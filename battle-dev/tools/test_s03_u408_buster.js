/* S03-U408: バスター・モード and six 「/バスター」 monsters (NOT_STARTED / ENGINE_GAP cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4080001;
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
const BM='バスター・モード',RDB='レッド・デーモンズ・ドラゴン／バスター',HPB='ハイパーサイコガンナー／バスター',ARB='アーカナイト・マジシャン／バスター',GFB='ギガンテック・ファイター／バスター',SDB='スターダスト・ドラゴン／バスター',DKB='デスカイザー・ドラゴン／バスター';
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function modeField(base,buster,extra){fresh();const bm=mk(BM,0,'up'),syn=mon(base,0),bu=mk(buster,0);syn.properlySummonedS03=true;
  gameState.players[0].hand=[bm];gameState.players[0].mz=[syn];gameState.players[0].deck=gameState.players[0].deck.concat([bu]);
  const o=extra?extra({bm,syn,bu}):{};baselineA();cast(0,BM,[uid(syn),uid(bu)]);return Object.assign({bm,syn,bu},o||{});}

/* ===== バスター・モード ===== */
{ const x=modeField('レッド・デーモンズ・ドラゴン',RDB);
  ok('モード: the Synchro was released (cost) and the 「/バスター」 monster of the Deck Special Summoned in Attack Position',z(x.syn)==='grave'&&z(x.bu)==='mz'&&C(x.bu).pos==='atk',JSON.stringify([z(x.syn),z(x.bu),C(x.bu)&&C(x.bu).pos]));
  audit('モード 1'); }
{ fresh();const bm=mk(BM,0,'up'),syn=mon('レッド・デーモンズ・ドラゴン',0);gameState.players[0].hand=[bm];gameState.players[0].mz=[syn];baselineA();
  ok('モード negative: no 「/バスター」 monster in the Deck → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }
{ fresh();const bm=mk(BM,0,'up'),w=mon('ワイト',0),bu=mk(RDB,0);gameState.players[0].hand=[bm];gameState.players[0].mz=[w];gameState.players[0].deck=gameState.players[0].deck.concat([bu]);baselineA();
  ok('モード negative: no Synchro Monster on my field → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0)));
  ok('バスター: cannot be Special Summoned by another effect (reason 死者蘇生)',canEffectSpecialSummonS03(C(bu),'deck','死者蘇生')===false,''); }

/* ===== レッド・デーモンズ・ドラゴン／バスター ===== */
{ const x=modeField('レッド・デーモンズ・ドラゴン',RDB,()=>{const f1=mon('ワイト',1),f2=mon('ライオウ',1);gameState.players[1].mz=[f1,f2];return {f1,f2};});
  const f1=x.f1,f2=x.f2;
  phase('battle');atkTarget(0,x.bu,f1);
  ok('RDD/バスター: after the damage calculation all other monsters of the field were destroyed (also the other ライオウ)',z(f1)==='grave'&&z(f2)==='grave'&&z(x.bu)==='mz',JSON.stringify([z(f1),z(f2),z(x.bu)]));
  audit('RDD/バスター 1'); }
{ const x=modeField('レッド・デーモンズ・ドラゴン',RDB,()=>{const bh=mk('ブラック・ホール',0);gameState.players[0].hand.push(bh);return {bh};});
  cast(0,'ブラック・ホール',['yes',uid(x.syn)]);
  ok('RDD/バスター: destroyed on the field (by ブラック・ホール) → レッド・デーモンズ・ドラゴン of the Graveyard Special Summoned',z(x.bu)==='grave'&&z(x.syn)==='mz',JSON.stringify([z(x.bu),z(x.syn)]));
  audit('RDD/バスター 2'); }

/* ===== ハイパーサイコガンナー／バスター ===== */
{ const x=modeField('ハイパーサイコガンナー',HPB,()=>{const f=mon('ワイト',1);gameState.players[1].mz=[f];return {f};});
  const f=x.f;const l0=lp(0),l1=lp(1);
  phase('battle');atkTarget(0,x.bu,f);
  ok('HPG/バスター: battle with ワイト (ATK 300 / DEF 200): the opponent takes 3200 battle damage + its DEF 200; I recover its ATK 300',lp(1)===l1-3200-200&&lp(0)===l0+300,JSON.stringify([lp(0),lp(1),l0,l1]));
  audit('HPG/バスター 1'); }

/* ===== アーカナイト・マジシャン／バスター ===== */
{ const x=modeField('アーカナイト・マジシャン',ARB,()=>({}));
  ok('アーカナイト/バスター: two Spell Counters were placed on its Special Summon; ATK 900 + 2000 = 2900',API.countCounter(findCardByUid(x.bu.uid),'魔力')===2&&curATK(C(x.bu))===2900,JSON.stringify([API.countCounter(findCardByUid(x.bu.uid),'魔力'),curATK(C(x.bu))]));
  ok('アーカナイト/バスター: the destroy effect is not offered without an opposing card',canZ(x.bu)===false,'');
  audit('アーカナイト/バスター 1'); }
{ fresh();const bm=mk(BM,0,'up'),syn=mon('アーカナイト・マジシャン',0),bu=mk(ARB,0),f=mon('青眼の白龍',1),st=mk('ブラック・ホール',1);
  st.face='down';st.setTurn=4;
  gameState.players[0].hand=[bm];gameState.players[0].mz=[syn];gameState.players[0].deck=gameState.players[0].deck.concat([bu]);gameState.players[1].mz=[f];gameState.players[1].sz=[st];baselineA();
  cast(0,BM,[uid(syn),uid(bu)]);
  ok('アーカナイト/バスター: with opposing cards the effect is offered',canZ(bu)===true,'');
  actC(bu);
  ok('アーカナイト/バスター: 2 counters removed; all cards of the opponent destroyed (青眼 and the Set trap); ATK back to 900',z(f)==='grave'&&z(st)==='grave'&&API.countCounter(findCardByUid(bu.uid),'魔力')===0&&curATK(C(bu))===900,JSON.stringify([z(f),z(st),API.countCounter(findCardByUid(bu.uid),'魔力'),curATK(C(bu))]));
  audit('アーカナイト/バスター 2'); }

/* ===== ギガンテック・ファイター／バスター ===== */
{ fresh();const bm=mk(BM,0,'up'),syn=mon('ギガンテック・ファイター',0),bu=mk(GFB,0),w1=mk('ゴブリン突撃部隊',0),w2=mk('ジャンク・フォアード',0),f=mon('青眼の白龍',1);
  gameState.players[0].hand=[bm];gameState.players[0].mz=[syn];gameState.players[0].deck=gameState.players[0].deck.concat([bu,w1,w2]);gameState.players[1].mz=[f];baselineA();
  PREFER=[uid(syn),uid(bu),uid(w1),uid(w2)];duelActivateFromHand(0);drive();PREFER=[];
  ok('ギガンテック/バスター: on its Special Summon two Warriors of the Deck were sent to the Graveyard',z(bu)==='mz'&&z(w1)==='grave'&&z(w2)==='grave',JSON.stringify([z(bu),z(w1),z(w2)]));
  ok('ギガンテック/バスター: opposing ATK -100 x 3 Warriors in my Graveyard (ギガンテック・ファイター, 2 sent) → 青眼 2700',curATK(C(f))===2700,String(curATK(C(f))));
  audit('ギガンテック/バスター 1'); }

/* ===== スターダスト・ドラゴン／バスター ===== */
{ fresh();gameState.activePlayer=1;const sd=mon(SDB,0),bh=mk('ブラック・ホール',1),f=mon('ワイト',1);
  gameState.players[0].mz=[sd];gameState.players[1].hand=[bh];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('スターダスト/バスター: offered against the activation of ブラック・ホール',resp.some(r=>r.card===sd),JSON.stringify(resp.map(r=>r.db.n)));
  duelActivateResponseV2(0,'mz',idx(sd));drive();
  ok('スターダスト/バスター: released; ブラック・ホール negated and destroyed (ワイト survives)',z(sd)==='grave'&&z(bh)==='grave'&&z(f)==='mz',JSON.stringify([z(sd),z(bh),z(f)]));
  phase('end');
  ok('スターダスト/バスター: at the End Phase it is Special Summoned back',z(sd)==='mz',z(sd));
  audit('スターダスト/バスター 1'); }

/* ===== デスカイザー・ドラゴン／バスター ===== */
{ fresh();const bm=mk(BM,0,'up'),syn=mon('デスカイザー・ドラゴン',0),bu=mk(DKB,0),u1=mk('ゴースト',0),u2=mk('ワイト',1);
  gameState.players[0].hand=[bm];gameState.players[0].mz=[syn];gameState.players[0].deck=gameState.players[0].deck.concat([bu]);gameState.players[0].grave=[u1];gameState.players[1].grave=[u2];baselineA();
  PREFER=[uid(syn),uid(bu),uid(u1),uid(u2)];duelActivateFromHand(0);drive();PREFER=[];
  ok('デスカイザー/バスター: Undead monsters of both Graveyards were Special Summoned to my field (ゴースト, ワイト)',z(bu)==='mz'&&z(u1)==='mz'&&pl(u1)===0&&z(u2)==='mz'&&pl(u2)===0,JSON.stringify([z(bu),z(u1),pl(u1),z(u2),pl(u2)]));
  ok('デスカイザー/バスター: their effects are negated',effectNegated(C(u1))===true&&effectNegated(C(u2))===true,JSON.stringify([effectNegated(C(u1)),effectNegated(C(u2))]));
  phase('end');
  ok('デスカイザー/バスター: they are destroyed at the End Phase, the Buster stays',z(u1)==='grave'&&z(u2)==='grave'&&z(bu)==='mz',JSON.stringify([z(u1),z(u2),z(bu)]));
  audit('デスカイザー/バスター 1'); }
`);
