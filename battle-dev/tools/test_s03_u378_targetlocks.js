/* S03-U378: ヴァイロン・セグメント, 闇の侯爵ベリアル, 滅びの爆裂疾風弾 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3780001;
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




const SEG='ヴァイロン・セグメント',BER='闇の侯爵ベリアル',BLA='滅びの爆裂疾風弾';
function targetsOf(prefix){const s=SEEN.filter(x=>x.title.indexOf(prefix)>=0);return s.length?s[s.length-1].cands:null;}

/* ===== ヴァイロン・セグメント ===== */
function segField(withSeg){
  fresh();const v=mon('ヴァイロン・ソルジャー',0),w=mon('ワイト',0),sg=mk(SEG,0),tr=setCard('強制脱出装置',1),mn=mk('月の書',1,'up'),gn=mon('氷結界の龍 グングニール',1),hc=mk('ワイト',1);
  gameState.players[0].hand=withSeg?[sg]:[];gameState.players[0].mz=[v,w];gameState.players[1].sz=[tr];gameState.players[1].hand=[mn,hc];gameState.players[1].mz=[gn];baselineA();
  if(withSeg){cast(0,SEG,[uid(v)]);}
  return {v,w,sg,tr,mn,gn,hc};}
{ const x=segField(true);
  ok('セグメント: equipped to the 「ヴァイロン」 monster',equipped(x.v,x.sg),String(z(x.sg)));
  endTurn();
  SEEN.length=0;PREFER=[uid(x.w)];duelActivateFromZone(1,'sz',idx(x.tr));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const l=targetsOf('強制脱出装置');
  ok('セグメント: the opponent\'s Trap cannot target the equipped monster (only ワイト is offered)',l!==null&&l.indexOf(x.v.uid)<0&&l.indexOf(x.w.uid)>=0,JSON.stringify(l)+' v='+x.v.uid);
  audit('セグメント 1'); }
{ const x=segField(false);
  endTurn();
  SEEN.length=0;PREFER=[uid(x.w)];duelActivateFromZone(1,'sz',idx(x.tr));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const l=targetsOf('強制脱出装置');
  ok('セグメント control: without the Equip Spell the Trap may target ヴァイロン・ソルジャー',l!==null&&l.indexOf(x.v.uid)>=0,JSON.stringify(l)); }
{ const x=segField(true);
  endTurn();
  SEEN.length=0;PREFER=[uid(x.v)];cast(1,'月の書',[uid(x.v)]);
  const l=targetsOf('月の書');
  ok('セグメント: the opponent\'s Spell (not a Trap / Effect Monster) can still target the equipped monster',(l===null&&C(x.v).face==='down')||(l!==null&&l.indexOf(x.v.uid)>=0),JSON.stringify([l,C(x.v).face])); }
{ const x=segField(true);
  endTurn();
  SEEN.length=0;PREFER=[uid(x.hc),uid(x.w)];duelActivateFromZone(1,'mz',idx(x.gn));for(let i=0;i<10&&pc();i++)pick();PREFER=[];drive();
  const lists=SEEN.map(s=>s.cands);
  ok('セグメント: an opponent Effect Monster (氷結界の龍 グングニール) cannot target the equipped monster',lists.length>0&&lists.every(c=>c.indexOf(x.v.uid)<0)&&lists.some(c=>c.indexOf(x.w.uid)>=0),JSON.stringify(lists)); }

/* ===== 闇の侯爵ベリアル ===== */
{ fresh();const b=mon(BER,0),w=mon('ワイト',0),f=mon('ライオウ',1),mn=mk('月の書',1,'up'),mn2=mk('月の書',0,'up');
  gameState.players[0].mz=[b,w];gameState.players[1].mz=[f];gameState.players[1].hand=[mn];gameState.players[0].hand=[mn2];baselineA();
  toOppBattle();
  ok('ベリアル: the opponent can attack only ベリアル, not ワイト',JSON.stringify(battleTargetsV29(f.uid).targets.map(t=>t.card.uid))===JSON.stringify([b.uid]),JSON.stringify(battleTargetsV29(f.uid).targets.map(t=>t.card.uid))+' b='+b.uid);
  audit('ベリアル 1'); }
{ fresh();const b=mon(BER,0),w=mon('ワイト',0),f=mon('ライオウ',1),mn=mk('月の書',1,'up');
  gameState.players[0].mz=[b,w];gameState.players[1].mz=[f];gameState.players[1].hand=[mn];baselineA();
  endTurn();SEEN.length=0;cast(1,'月の書',[uid(b)]);
  const l=targetsOf('月の書');
  ok('ベリアル: the opponent\'s Spell cannot target ワイト (ベリアル itself can be targeted)',(l===null||l.indexOf(w.uid)<0)&&C(b).face==='down',JSON.stringify([l,C(b).face])); }
{ fresh();const b=mon(BER,0),w=mon('ワイト',0),mn=mk('月の書',0,'up');
  gameState.players[0].mz=[b,w];gameState.players[0].hand=[mn];baselineA();
  SEEN.length=0;cast(0,'月の書',[uid(w)]);
  ok('ベリアル: my own Spell may still target my other monster',C(w).face==='down',String(C(w).face)); }

/* ===== 滅びの爆裂疾風弾 ===== */
{ fresh();const sp=mk(BLA,0,'up'),be=mon('青眼の白龍',0),f1=mon('ライオウ',1),f2=mon('ワイト',1),rv=mk('死者蘇生',0,'up'),b2=mk('青眼の白龍',0);
  gameState.players[0].hand=[sp,rv];gameState.players[0].mz=[be];gameState.players[0].grave=[b2];gameState.players[1].mz=[f1,f2];baselineA();
  cast(0,BLA);
  ok('爆裂疾風弾: all of the opponent\'s monsters destroyed',z(f1)==='grave'&&z(f2)==='grave',JSON.stringify([z(f1),z(f2)]));
  ok('爆裂疾風弾: my 青眼の白龍 cannot attack this turn',cannotAttackNow(C(be))===true,String(cannotAttackNow(C(be))));
  PREFER=[uid(b2)];cast(0,'死者蘇生',[uid(b2)]);
  ok('爆裂疾風弾: a 青眼の白龍 Special Summoned afterwards cannot attack either',z(b2)==='mz'&&cannotAttackNow(C(b2))===true,JSON.stringify([z(b2),cannotAttackNow(C(b2))]));
  endTurn();endTurn();
  ok('爆裂疾風弾: next turn 青眼の白龍 can attack again',cannotAttackNow(C(be))===false,String(cannotAttackNow(C(be))));
  audit('爆裂疾風弾 1'); }
{ fresh();const sp=mk(BLA,0,'up'),w=mon('ワイト',0);gameState.players[0].hand=[sp];gameState.players[0].mz=[w];gameState.players[1].mz=[mon('ライオウ',1)];baselineA();
  ok('爆裂疾風弾 negative: no 青眼の白龍 on my field -> not activatable',getLegalHandActions(0,0).some(a=>a.id==='activate')===false,''); }
`);
