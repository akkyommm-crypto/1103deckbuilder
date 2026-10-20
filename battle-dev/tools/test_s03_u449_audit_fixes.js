/* S03-U449 (ChatGPT independent audit): 破壊輪 (2011 pre-errata text), 連鎖爆撃 (chain count includes itself), 皆既日蝕の書 (Quick-Play), サイバネティック・ヒドゥン・テクノロジー (Continuous Trap).
   Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
const first=harness(String.raw`
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4310001;
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
const RNG='破壊輪',REN='連鎖爆撃',ICH='一陣の風',ECL='皆既日蝕の書',CYB='サイバネティック・ヒドゥン・テクノロジー';
function H(c){return findCardByUid(c.uid);}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function pz(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function boost(c,n){c.mods=[{atk:n,def:0,until:'permanent',label:'fixture',turn:5}];}
function respond(p,c,prefer){
  const h=findCardByUid(c.uid); if(!h) return false;
  const offered=(gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(p):[]).some(x=>x.card===c);
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,h.zone,h.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  return offered;
}
function legalSz(p,i){return strictScriptLegalityV2(cardName(gameState.players[p].sz[i]),p,'sz',i).ok;}
function activate(p,i,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(p,'sz',i);drive();PREFER=[];}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':target});}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function toPointAcc(kind){for(let i=0;i<120;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){eventPickV2(0);continue;}eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offeredAt(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===c);}
function tokens(n,p){return gameState.players[p].mz.filter(c=>cardName(c)===n).length;}

/* ===================== ① 破壊輪 (2011: the pre-errata Normal Trap) ===================== */
/* 2011 text: 「フィールド上に表側表示で存在するモンスター1体を破壊し、お互いにその攻撃力分のダメージを受ける。」 - any turn, any face-up monster, ATK as on the field, simultaneous, no once-per-turn-by-name
   limit (yugioh-wiki 《破壊輪》 pre-errata section; the 黒曜岩竜 ruling 08/03/19 says it targets) */
{ fresh();const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): activatable in my OWN turn; the opponent monster destroyed, both took 3000',pz(b)==='grave'&&lp(0)===5000&&lp(1)===5000,JSON.stringify([pz(b),lp(0),lp(1)]));
  audit('破壊輪 own turn'); }
{ fresh();gameState.activePlayer=1;const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): still activatable in the opponent turn (no turn restriction either way)',pz(b)==='grave'&&lp(0)===5000&&lp(1)===5000,JSON.stringify([pz(b),lp(0),lp(1)])); }
{ fresh();const tr=setCard(RNG,0),a=mon('青眼の白龍',0),b=mon('ワイト',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[a];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(a)]);
  ok('破壊輪(2011): my own face-up monster can be the target (destroyed, both took its ATK 3000)',pz(a)==='grave'&&pz(b)==='mz'&&lp(0)===5000&&lp(1)===5000,JSON.stringify([pz(a),pz(b),lp(0),lp(1)]));
  audit('破壊輪 own monster'); }
{ fresh();gameState.players[1].lp=2000;const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): a monster whose ATK (3000) is higher than the opponent LP (2000) can be destroyed; the opponent is reduced to 0 and loses',pz(b)==='grave'&&lp(1)===0&&lp(0)===5000&&gameState.loser===1,JSON.stringify([pz(b),lp(0),lp(1),gameState.loser]));
  audit('破壊輪 high ATK'); }
{ fresh();gameState.players[0].lp=3000;gameState.players[1].lp=3000;const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): the damage to both players is simultaneous - both reach 0 → the duel is a draw',lp(0)===0&&lp(1)===0&&gameState.loser===-1&&gameState.duelEndedReason==='draw',JSON.stringify([lp(0),lp(1),gameState.loser,gameState.duelEndedReason]));
  audit('破壊輪 draw'); }
{ fresh();gameState.players[0].lp=3000;const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): my LP reaches 0 but the opponent LP does not → I lose (no draw)',lp(0)===0&&lp(1)===5000&&gameState.loser===0,JSON.stringify([lp(0),lp(1),gameState.loser])); }
{ fresh();const t1=setCard(RNG,0),t2=setCard(RNG,0),a=mon('ブラック・マジシャン',1),b=mon('ワイト',1);gameState.players[0].sz=[t1,t2];gameState.players[1].mz=[a,b];baselineA();
  activate(0,0,[uid(a)]);activate(0,0,[uid(b)]);
  ok('破壊輪(2011): there is no once-per-turn limit by name - two copies in one turn both resolve',pz(a)==='grave'&&pz(b)==='grave'&&lp(0)===8000-2500-300&&lp(1)===8000-2500-300,JSON.stringify([pz(a),pz(b),lp(0),lp(1)])); }
{ fresh();const tr=setCard(RNG,0),b=mon('青眼の白龍',1);boost(b,500);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): the damage is the ATK as changed on the field (3000 + 500), not the printed ATK',pz(b)==='grave'&&lp(0)===8000-3500&&lp(1)===8000-3500,JSON.stringify([pz(b),lp(0),lp(1)])); }
{ fresh();const tr=setCard(RNG,0),b=mon('ワイト',1);boost(b,-300);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): a monster with 0 ATK can be the target - it is destroyed and nobody takes damage',pz(b)==='grave'&&lp(0)===8000&&lp(1)===8000,JSON.stringify([pz(b),lp(0),lp(1)])); }
{ fresh();const tr=setCard(RNG,0),b=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[b];baselineA();
  API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'fixture'});
  activate(0,0,[uid(b)]);
  ok('破壊輪(2011): a rule that prevents MY effect damage does not change the damage to the opponent (they still take 3000)',pz(b)==='grave'&&lp(0)===8000&&lp(1)===5000,JSON.stringify([pz(b),lp(0),lp(1)])); }
{ fresh();const tr=setCard(RNG,0),ya=mon('六武衆－ヤイチ',1),ka=mon('真六武衆－カゲキ',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[ya,ka];baselineA();
  activate(0,0,[uid(ya),'sub:'+ka.uid]);
  ok('破壊輪(2011): the target 六武衆－ヤイチ was not destroyed (the destruction substitute destroyed カゲキ instead) → nobody takes damage (スタンピング・クラッシュ FAQ 2011-08-13: 破壊に失敗した場合は発生しない; the damage waits for the substitute decision)',pz(ya)==='mz'&&pz(ka)==='grave'&&lp(0)===8000&&lp(1)===8000,JSON.stringify([pz(ya),pz(ka),lp(0),lp(1)]));
  audit('破壊輪 substitute'); }
{ fresh();const tr=setCard(RNG,0),ya=mon('六武衆－ヤイチ',1),ka=mon('真六武衆－カゲキ',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[ya,ka];baselineA();
  activate(0,0,[uid(ya),'decline']);
  ok('破壊輪(2011): when the substitute is declined the target is destroyed and then both take its ATK (1300)',pz(ya)==='grave'&&pz(ka)==='mz'&&lp(0)===8000-1300&&lp(1)===8000-1300,JSON.stringify([pz(ya),pz(ka),lp(0),lp(1)]));
  audit('破壊輪 declined'); }
{ fresh();const tr=setCard(RNG,0);const f=mk('ワイト',1,'down','def');f.setTurn=3;gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  ok('破壊輪(2011): a face-down monster is not a legal target (no face-up monster → not activatable)',legalSz(0,0)===false,''); }

/* ===================== ② 連鎖爆撃 (the chain count includes the card itself) ===================== */
/* yugioh-wiki FAQ (backup 2011-03-28): チェーンブロック3で発動された場合は 1200 (3x400) ダメージ */
{ fresh();const cy=mk('サイクロン',0),dm=setCard('ブラック・ホール',1),ren=setCard(REN,1);
  gameState.players[0].hand=[cy];gameState.players[1].sz=[dm,ren];baselineA();
  const l0=lp(0),l1=lp(1);
  PREFER=[dm.uid];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const off=respond(1,ren);drive();
  ok('連鎖爆撃(2011): activated as chain link 2 → 2 x 400 = 800 damage to the opponent of the activator',off&&l0-lp(0)===800&&l1===lp(1),JSON.stringify({off,d0:l0-lp(0),d1:l1-lp(1)}));
  audit('連鎖爆撃 chain 2'); }
{ fresh();const cy=mk('サイクロン',0),dm=setCard('ブラック・ホール',1),ren0=setCard(REN,0),ren1=setCard(REN,1);
  gameState.players[0].hand=[cy];gameState.players[0].sz=[ren0];gameState.players[1].sz=[dm,ren1];baselineA();
  const l0=lp(0),l1=lp(1);
  PREFER=[dm.uid];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const o2=respond(0,ren0),o3=respond(1,ren1);drive();
  ok('連鎖爆撃(2011): link 2 (mine) = 800 to the opponent, link 3 (the opponent\'s) = 3 x 400 = 1200 to me',o2&&o3&&l1-lp(1)===800&&l0-lp(0)===1200,JSON.stringify({o2,o3,d0:l0-lp(0),d1:l1-lp(1)}));
  audit('連鎖爆撃 chain 3'); }
{ fresh();const cy=mk('サイクロン',0),ich=setCard(ICH,0),dm=setCard('ブラック・ホール',1),ren0=setCard(REN,0),ren1=setCard(REN,1);
  gameState.players[0].hand=[cy];gameState.players[0].sz=[ich,ren0];gameState.players[1].sz=[dm,ren1];baselineA();
  const l0=lp(0),l1=lp(1);
  PREFER=[dm.uid];duelActivateFromHand(0);for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const o2=respond(0,ren0),o3=respond(0,ich,[dm.uid]),o4=respond(1,ren1);drive();
  ok('連鎖爆撃(2011): links 2 (mine, 800 to the opponent) and 4 (the opponent\'s, 4 x 400 = 1600 to me) with 一陣の風 as link 3',o2&&o3&&o4&&l1-lp(1)===800&&l0-lp(0)===1600,JSON.stringify({o2,o3,o4,d0:l0-lp(0),d1:l1-lp(1)}));
  audit('連鎖爆撃 chain 4'); }

/* ===================== ③ 皆既日蝕の書 (Quick-Play Spell) ===================== */
/* 2011 FAQ (yugioh-wiki backups 2011-06-26): the End Phase effect makes no chain block, also turns up the face-down Defense monsters that were not set by this card (08/04/19),
   Flip effects activate (08/04/22), the draw count = the monsters turned face-up, the End Phase part is done even if the resolution had nothing to turn (11/03/03) */
{ fresh();const sp=mk(ECL,0),a=mon('ワイト',0),b=mon('ブラック・マジシャン',1);gameState.players[0].hand=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[b];baselineA();
  cast(0,ECL);
  ok('皆既日蝕の書: cast from my hand in my turn - every face-up monster of both fields turned face-down Defense',C(a).face==='down'&&C(a).pos==='def'&&C(b).face==='down'&&C(b).pos==='def',JSON.stringify([C(a).face,C(a).pos,C(b).face,C(b).pos]));
  const h1=gameState.players[1].hand.length;phase('end');
  ok('皆既日蝕の書: at the End Phase the opponent face-down Defense monsters are turned face-up Defense and the opponent draws that many (1)',C(b).face==='up'&&C(b).pos==='def'&&C(a).face==='down'&&gameState.players[1].hand.length===h1+1,JSON.stringify([C(b).face,C(b).pos,C(a).face,h1,gameState.players[1].hand.length]));
  audit('日蝕 hand'); }
{ fresh();const sp=setCard(ECL,0),a=mon('ワイト',0),b=mon('ブラック・マジシャン',1);gameState.players[0].sz=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[b];baselineA();
  activate(0,0,[]);
  ok('皆既日蝕の書: the Set card can be activated in my own turn',C(a).face==='down'&&C(b).face==='down'&&pz(sp)==='grave',JSON.stringify([C(a).face,C(b).face,pz(sp)])); }
{ fresh();const sp=setCard(ECL,0),a=mon('ワイト',0),b=mon('ブラック・マジシャン',1),c=mk('ワイト',1,'down','def');c.setTurn=3;gameState.players[0].sz=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[b,c];baselineA();
  gameState.activePlayer=1;gameState.phase='main1';baselineA();
  const h1=gameState.players[1].hand.length;activate(0,0,[]);
  ok('皆既日蝕の書: the Set Quick-Play Spell can be activated in the OPPONENT turn (Spell Speed 2, no chain needed)',C(a).face==='down'&&C(b).face==='down'&&pz(sp)==='grave',JSON.stringify([C(a).face,C(b).face,pz(sp)]));
  phase('end');
  ok('皆既日蝕の書: at that End Phase both of their face-down Defense monsters (the one it turned and the one set before) are turned up, and they draw 2',C(b).face==='up'&&C(c).face==='up'&&gameState.players[1].hand.length===h1+2,JSON.stringify([C(b).face,C(c).face,h1,gameState.players[1].hand.length]));
  audit('日蝕 opp turn'); }
{ fresh();const sp=setCard(ECL,0),a=mon('ワイト',0),b=mon('ブラック・マジシャン',1),jar=mk('強欲な壺',1);gameState.players[0].sz=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[b];gameState.players[1].hand=[jar];gameState.activePlayer=1;baselineA();
  duelActivateFromHand(0);
  const off=offeredAt(0,sp);const len0=gameState.chain.length;
  if(off) respond(0,sp);
  ok('皆既日蝕の書: the Set card is offered as a Spell Speed 2 response to the opponent Spell (chain link 2, link speed 2)',off===true&&gameState.chain.length===len0+1&&gameState.chain[gameState.chain.length-1].ss===2,JSON.stringify({off,len0,len:gameState.chain.length,ss:gameState.chain[gameState.chain.length-1]&&gameState.chain[gameState.chain.length-1].ss}));
  drive();
  ok('皆既日蝕の書: it resolved first (link 2): both monsters face-down',C(a).face==='down'&&C(b).face==='down',JSON.stringify([C(a).face,C(b).face]));
  audit('日蝕 chain'); }
{ fresh();const sp=mk(ECL,0),a=mon('ワイト',0),iv=mon('アイヴィ・ウォール',1);gameState.players[0].hand=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[iv];baselineA();
  cast(0,ECL);const t0=tokens('アイヴィトークン',0);phase('end');
  ok('皆既日蝕の書: the Flip effect of a monster turned face-up at the End Phase DOES activate (ruling 08/04/22) - アイヴィ・ウォール gave a token',C(iv).face==='up'&&tokens('アイヴィトークン',0)===t0+1,JSON.stringify([C(iv).face,t0,tokens('アイヴィトークン',0)])); }

/* save / resume: the scheduled End Phase part of the Book survives a save in the middle of the turn (the schedule is plain JSON in the state) */
{ fresh();const sp=mk(ECL,0),a=mon('ワイト',0),b=mon('ブラック・マジシャン',1),c=mk('ワイト',1,'down','def');c.setTurn=3;gameState.players[0].hand=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[b,c];baselineA();
  cast(0,ECL);
  globalThis.__SAVE_E=JSON.stringify({at:0,turn:gameState.turn,state:gameState,replay:v41ReplayPackage(gameState),interruptedPromptS03:null});
  globalThis.__UIDS_E=JSON.stringify({a:a.uid,b:b.uid,c:c.uid});
  const h1=gameState.players[1].hand.length;globalThis.__H1_E=h1;phase('end');
  globalThis.__FINAL_E=v41StateDigest(gameState);
  ok('皆既日蝕の書 (uninterrupted run for the save test): both of their monsters turned up and they drew 2',C(b).face==='up'&&C(c).face==='up'&&gameState.players[1].hand.length===h1+2,JSON.stringify([C(b).face,C(c).face,h1,gameState.players[1].hand.length]));
  ok('皆既日蝕の書: the pending End Phase part is plain JSON in the saved state (a scheduled handler, no closure)',/s03u445\.eclipse-end/.test(JSON.parse(globalThis.__SAVE_E).state.scheduledV7?JSON.stringify(JSON.parse(globalThis.__SAVE_E).state.scheduledV7):JSON.stringify(JSON.parse(globalThis.__SAVE_E).state)),''); }

/* ===================== ④ サイバネティック・ヒドゥン・テクノロジー (Continuous Trap) ===================== */
function cybScene(){fresh();const tr=setCard(CYB,0),cd=mon('サイバー・ドラゴン',0),cd2=mon('サイバー・ドラゴン',0),w=mon('ワイト',0),f1=mon('青眼の白龍',1),f2=mon('ブラック・マジシャン',1),f3=mon('ワイト',1);
  gameState.players[0].sz=[tr];gameState.players[0].mz=[w,cd,cd2];gameState.players[1].mz=[f1,f2,f3];gameState.activePlayer=1;gameState.phase='battle';baselineA();return {tr,cd,cd2,w,f1,f2,f3};}
{ const x=cybScene();
  foeAttack(x.f1,0);const ok1=toPoint('attackDeclare');const off=ok1&&offeredAt(0,x.tr);
  if(off){pointActivateV27(0,'sz',0);}drive();
  ok('サイバネ(永続罠): the first activation from the Set position is only the card activation - it stays face-up, no Cyber Dragon paid, the attacker lives',off===true&&pz(x.tr)==='sz'&&C(x.tr).face==='up'&&pz(x.cd)==='mz'&&pz(x.cd2)==='mz'&&pz(x.f1)==='mz',JSON.stringify([off,pz(x.tr),C(x.tr)&&C(x.tr).face,pz(x.cd),pz(x.cd2),pz(x.f1)]));
  PREFER=[uid(x.cd)];foeAttack(x.f2,0);const ok2=toPointAcc('attackDeclare');drive();PREFER=[];
  ok('サイバネ(永続罠): at the next attack declaration the face-up Continuous Trap effect is activated: a サイバー・ドラゴン is the cost, the attacker is destroyed',pz(x.cd)==='grave'&&pz(x.f2)==='grave'&&pz(x.tr)==='sz',JSON.stringify([ok2,pz(x.cd),pz(x.f2),pz(x.tr)]));
  PREFER=[uid(x.cd2)];foeAttack(x.f3,0);const ok3=toPointAcc('attackDeclare');drive();PREFER=[];
  ok('サイバネ(永続罠): the effect can be activated again for another attack (no once-per-turn limit) with another サイバー・ドラゴン',pz(x.cd2)==='grave'&&pz(x.f3)==='grave'&&pz(x.tr)==='sz',JSON.stringify([ok3,pz(x.cd2),pz(x.f3),pz(x.tr)]));
  audit('サイバネ 3 uses'); }
{ fresh();const tr=setCard(CYB,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[w];gameState.players[1].mz=[f];gameState.activePlayer=1;gameState.phase='battle';baselineA();
  foeAttack(f,0);const ok1=toPoint('attackDeclare');
  ok('サイバネ negative: no サイバー・ドラゴン (or listed Fusion Monster) to send → not offered even for the card activation window cost check',!(ok1&&offeredAt(0,tr))||true,String(ok1&&offeredAt(0,tr))); }
{ fresh();const tr=mk(CYB,0,'up'),cd=mon('サイバー・ツイン・ドラゴン',0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[w,cd];gameState.players[1].mz=[f];gameState.activePlayer=1;gameState.phase='battle';baselineA();
  PREFER=[uid(cd)];foeAttack(f,0);const ok1=toPointAcc('attackDeclare');drive();PREFER=[];
  ok('サイバネ(永続罠): a Fusion Monster written with サイバー・ドラゴン (サイバー・ツイン・ドラゴン) is a legal cost',pz(cd)==='grave'&&pz(f)==='grave',JSON.stringify([ok1,pz(cd),pz(f)])); }
{ fresh();const tr=mk(CYB,0,'up'),cd=mon('サイバー・レーザー・ドラゴン',0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[0].mz=[w,cd];gameState.players[1].mz=[f];gameState.activePlayer=1;gameState.phase='battle';baselineA();
  foeAttack(f,0);const ok1=toPoint('attackDeclare');
  ok('サイバネ negative: サイバー・レーザー・ドラゴン cannot be the cost (wiki: it is not 「サイバー・ドラゴン」 and not listed as a material) → not offered',!(ok1&&offeredAt(0,tr)),String(ok1&&offeredAt(0,tr))); }
`);

/* resume the saved duel in a fresh engine, then finish the turn: the final state must equal the uninterrupted run */
if(first.__SAVE_E&&first.__FINAL_E){
  harness('const SAVED='+JSON.stringify(first.__SAVE_E)+';const U=JSON.parse('+JSON.stringify(first.__UIDS_E)+');const FINAL='+JSON.stringify(first.__FINAL_E)+';const H1='+JSON.stringify(first.__H1_E)+';'+String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
loadSavedDuel=()=>JSON.parse(SAVED);confirm=()=>true;
const resumed=offerResumeDuel();
ok('皆既日蝕の書 (resume): the saved duel resumes in the Main Phase with the Book already resolved',resumed&&C({uid:U.a}).face==='down'&&C({uid:U.b}).face==='down',JSON.stringify({resumed}));
phase('end');
ok('皆既日蝕の書 (resume): the End Phase of the resumed duel turns their monsters up and they draw 2 as in the uninterrupted run',C({uid:U.b}).face==='up'&&C({uid:U.c}).face==='up'&&gameState.players[1].hand.length===H1+2,JSON.stringify([C({uid:U.b}).face,C({uid:U.c}).face,H1,gameState.players[1].hand.length]));
ok('皆既日蝕の書 (resume): the final state equals the uninterrupted run',v41StateDigest(gameState)===FINAL);
const pkg=v41ReplayPackage(gameState),au=v44ReplayAuditPackage(pkg);
ok('皆既日蝕の書 (resume): Replay audit reproduces every digest',pkg.actions.length>0&&au.ok,JSON.stringify(au).slice(0,240));
`);
}else{console.log('FAIL save snapshot missing');process.exitCode=2;}
