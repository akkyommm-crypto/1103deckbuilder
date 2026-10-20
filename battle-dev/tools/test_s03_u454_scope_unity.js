/* S03-U454: 古代の遠眼鏡, コザッキーの研究成果, 電磁シールド, 同姓同名同盟条約, 成功確率0%, 友情 YU－JYO (stale ENGINE_GAP Spells / Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4350001;
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




























































































const SEEN=[];const LABELS=[];
const SCP='古代の遠眼鏡',KOZ='コザッキーの研究成果',ELM='電磁シールド',TRE='同姓同名同盟条約',ZER='成功確率0%',YUJ='友情 YU－JYO';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}
function actSz(i,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',i);drive();PREFER=[];}
const __p454=pick;pick=function(){const q=pc();if(q&&q.title.indexOf('古代の遠眼鏡')>=0)LABELS.push(q.candidates[0].label);return __p454();};
function foeAtk(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:idx(target)});drive();}

/* ===== 古代の遠眼鏡 ===== */
{ fresh();const sp=mk(SCP,0),d=['ワイト','ブラック・マジシャン','アイヴィ・ウォール','サイバー・ドラゴン','ガガガマジシャン','青眼の白龍'].map(n=>mk(n,1));gameState.players[0].hand=[sp];gameState.players[1].deck=d.slice().concat(gameState.players[1].deck);baselineA();
  const order0=gameState.players[1].deck.map(c=>c.uid).join(',');LABELS.length=0;cast(0,SCP);
  ok('古代の遠眼鏡: I saw the names of the top 5 cards of the opponent Deck (not the 6th)',LABELS.length===1&&LABELS[0].indexOf('ワイト')>=0&&LABELS[0].indexOf('ガガガマジシャン')>=0&&LABELS[0].indexOf('青眼の白龍')<0,JSON.stringify(LABELS));
  ok('古代の遠眼鏡: the Deck order is unchanged',gameState.players[1].deck.map(c=>c.uid).join(',')===order0,'');
  audit('古代の遠眼鏡 1'); }
{ fresh();const sp=mk(SCP,0);gameState.players[0].hand=[sp];gameState.players[1].deck=[];baselineA();
  ok('古代の遠眼鏡 negative: empty opponent Deck → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== コザッキーの研究成果 ===== */
{ fresh();const tr=setTrap(KOZ,0),a=mk('ワイト',0),b=mk('ブラック・マジシャン',0),c=mk('アイヴィ・ウォール',0),rest=gameState.players[0].deck.slice();gameState.players[0].sz=[tr];gameState.players[0].deck=[a,b,c].concat(rest);baselineA();
  const ua=uid(a),ub=uid(b),uc=uid(c);actSz(0,[uc,ua]);
  const dk=gameState.players[0].deck;
  ok('コザッキーの研究成果: the top three cards were put back in the chosen order (c, a, b) and the 4th card is unchanged',dk[0].uid===uc&&dk[1].uid===ua&&dk[2].uid===ub&&dk[3].uid===rest[0].uid&&dk.length===rest.length+3,JSON.stringify([dk[0].uid,dk[1].uid,dk[2].uid,dk[3].uid,uc,ua,ub]));
  audit('コザッキー 1'); }
{ fresh();const tr=setTrap(KOZ,0);gameState.players[0].sz=[tr];gameState.players[0].deck=[];baselineA();
  ok('コザッキーの研究成果 negative: empty Deck → not activatable',legalT(0)===false,''); }

/* ===== 電磁シールド ===== */
{ fresh();const sp=mk(ELM,0),e=mon('エレキタリス',0,'def'),big=mon('サンダー・ドラゴン',0,'def'),foe=mon('ブラック・マジシャン',1);gameState.players[0].hand=[sp];gameState.players[0].mz=[e,big];gameState.players[1].mz=[foe];baselineA();cast(0,ELM);
  ok('電磁シールド: stays on the field with only Defense Position monsters of mine',z(sp)==='sz',z(sp));
  ok('電磁シールド: the Level 3 Thunder in Defense Position is battle-proof, the Level 5 Thunder is not',battleProof(C(e))===true&&battleProof(C(big))===false,JSON.stringify([battleProof(C(e)),battleProof(C(big))]));
  audit('電磁シールド 1'); }
{ fresh();const sp=mk(ELM,0),e=mon('エレキタリス',0,'def'),atk=mon('ガガガマジシャン',0,'atk');gameState.players[0].hand=[sp];gameState.players[0].mz=[e,atk];baselineA();cast(0,ELM);
  ok('電磁シールド: with a face-up Attack Position monster of mine the card is destroyed',z(sp)==='grave',z(sp));
  audit('電磁シールド 2'); }
{ fresh();const sp=mk(ELM,0),e=mon('エレキタリス',0,'def'),foe=mon('ブラック・マジシャン',1);gameState.players[0].hand=[sp];gameState.players[0].mz=[e];gameState.players[1].mz=[foe];baselineA();cast(0,ELM);
  gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
  foeAtk(foe,e);
  ok('電磁シールド: the Defense Position Level 3 Thunder survives a battle with an ATK 2500 monster',z(e)==='mz',z(e)); }

/* ===== 同姓同名同盟条約 ===== */
function treatyBoard(n){fresh();const tr=setTrap(TRE,0),ws=[],s1=mk('サイクロン',1,'down'),s2=mk('サンダー・ボルト',1,'up');for(let i=0;i<n;i++)ws.push(mon('ワイト',0));
  gameState.players[0].sz=[tr];gameState.players[0].mz=ws;gameState.players[1].sz=[s1,s2];baselineA();return {tr,s1,s2};}
{ const B=treatyBoard(2);actSz(0,[]);
  ok('同姓同名同盟条約: 2 same-name monsters → one opponent Spell/Trap destroyed (only one of them)',[z(B.s1),z(B.s2)].filter(x=>x==='grave').length===1&&z(B.tr)==='grave',JSON.stringify([z(B.s1),z(B.s2),z(B.tr)]));
  audit('同盟条約 1'); }
{ const B=treatyBoard(3);actSz(0);
  ok('同姓同名同盟条約: 3 same-name monsters → all opponent Spell/Trap Cards destroyed',z(B.s1)==='grave'&&z(B.s2)==='grave',JSON.stringify([z(B.s1),z(B.s2)]));
  audit('同盟条約 2'); }
{ const B=treatyBoard(1);
  ok('同姓同名同盟条約 negative: only one monster of the name → not activatable',legalT(0)===false,''); }
{ fresh();const tr=setTrap(TRE,0);gameState.players[0].sz=[tr];gameState.players[0].mz=[mon('ワイト',0),mon('ブラック・マジシャン',0)];baselineA();
  ok('同姓同名同盟条約 negative: two monsters with different names → not activatable',legalT(0)===false,''); }

/* ===== 成功確率0% ===== */
{ fresh();const tr=setTrap(ZER,0),f=['E・HERO フレイム・ウィングマン','サイバー・ツイン・ドラゴン','キメラテック・フォートレス・ドラゴン'].map(n=>mk(n,1));gameState.players[0].sz=[tr];gameState.players[1].ex=f.slice();baselineA();
  actSz(0);
  const g=f.filter(c=>z(c)==='grave').length;
  ok('成功確率0%: two random Fusion Monsters of the opponent Extra Deck were sent to the Graveyard (one stays)',g===2&&gameState.players[1].ex.length===1,JSON.stringify([g,gameState.players[1].ex.length]));
  audit('成功確率0% 1'); }

/* ===== 友情 YU－JYO ===== */
{ fresh();const sp=mk(YUJ,0);gameState.players[0].hand=[sp];gameState.players[0].lp=8000;gameState.players[1].lp=2000;baselineA();
  cast(0,YUJ,['yes']);
  ok('友情 YU－JYO: the opponent shook hands → both LP are half of the total (5000)',lp(0)===5000&&lp(1)===5000,JSON.stringify([lp(0),lp(1)]));
  audit('友情 1'); }
{ fresh();const sp=mk(YUJ,0);gameState.players[0].hand=[sp];gameState.players[0].lp=8000;gameState.players[1].lp=2000;baselineA();
  cast(0,YUJ,['no']);
  ok('友情 YU－JYO: the opponent refused → LP unchanged',lp(0)===8000&&lp(1)===2000,JSON.stringify([lp(0),lp(1)]));
  audit('友情 2'); }
{ fresh();const sp=mk(YUJ,0),un=mk('結束 UNITY',0);gameState.players[0].hand=[sp,un];gameState.players[0].lp=8000;gameState.players[1].lp=2000;baselineA();
  cast(0,YUJ,['unity']);
  ok('友情 YU－JYO: showing 結束 UNITY applies the effect without asking the opponent',lp(0)===5000&&lp(1)===5000&&!pc(),JSON.stringify([lp(0),lp(1)]));
  audit('友情 3'); }
`);
