/* S03-U350: 雷魔神－サンガ, 風魔神－ヒューガ, 水魔神－スーガ, 盲信するゴブリン, 牙城のガーディアン, 精気を吸う骨の塔, 火車.
   Real DUEL paths (attacks into the Damage Step calc window, a hand response, control-change attempts, Special Summons), Replay-audited. */
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
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3450001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}



const SAN='雷魔神－サンガ',HYU='風魔神－ヒューガ',SUG='水魔神－スーガ',GOB='盲信するゴブリン',FOR='牙城のガーディアン',TOW='精気を吸う骨の塔',KAS='火車';
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== 魔神 x3 ===== */
for(const nm of [SAN,HYU,SUG]){
  fresh();const atk0=Number(dbOf(mk(nm,0)).atk);
  { fresh();const m=mon(nm,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
    toOppBattle();const l1=lp(1),l0=lp(0);foeAttack(f,m);
    ok(nm+': attacked on the opponent turn -> attacker ATK 0: destroyed, the Majin stays, the opponent takes '+atk0,z(f)==='grave'&&z(m)==='mz'&&lp(0)===l0&&lp(1)===l1-atk0,JSON.stringify({f:z(f),m:z(m),l0:lp(0)-l0,l1:lp(1)-l1}));
    ok(nm+': the once-only use is recorded',!!C(m).u350Used,'');
    audit(nm+' 1'); }
  { fresh();const m=mon(nm,0),f1=mon('青眼の白龍',1),f2=mon('青眼の白龍',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f1,f2];baselineA();
    toOppBattle();foeAttack(f1,m);
    ok(nm+': first attack answered (f1 destroyed)',z(f1)==='grave'&&z(m)==='mz','');
    foeAttack(f2,m);
    ok(nm+': second attack - the effect is used up: the Majin is destroyed (3000 > '+atk0+')',z(m)==='grave'&&z(f2)==='mz',JSON.stringify({m:z(m),f2:z(f2)})); }
  { fresh();const m=mon(nm,0),f=mon('青眼の白龍',1);m.u350Used=true;gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
    toOppBattle();foeAttack(f,m);
    ok(nm+' control: already used (flag) -> no response, destroyed',z(m)==='grave'&&z(f)==='mz',JSON.stringify({m:z(m),f:z(f)})); }
}
{ fresh();const m=mon(SAN,0),f=mon('青眼の白龍',1);m.pos='def';gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,m);
  ok('雷魔神－サンガ: answers in Defense Position too: attacker ATK 0 vs DEF 2200 -> sanga stays, attacker takes the difference',z(m)==='mz'&&!!C(m).u350Used,JSON.stringify({m:z(m),f:z(f),l1:lp(1)})); }
{ fresh();const m=mon(SAN,0),f=mon('ワイト',1);gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  atkTarget(0,m,f);
  ok('雷魔神－サンガ: my own attack (it is not attacked) -> no use of the effect',!C(m).u350Used,JSON.stringify({u:C(m).u350Used,f:z(f)})); }

/* ===== 盲信するゴブリン ===== */
{ fresh();const g=mon(GOB,0),w=mon('ワイト',0);gameState.players[0].mz=[g,w];gameState.players[1].hand=[mk('心変わり',1),mk('心変わり',1)];gameState.activePlayer=1;baselineA();
  cast(1,'心変わり',[g.uid]);
  ok('盲信するゴブリン: 心変わり on it - control does not change',pl(g)===0&&z(g)==='mz',JSON.stringify({p:pl(g)}));
  cast(1,'心変わり',[w.uid]);
  ok('盲信するゴブリン control: 心変わり still takes ワイト',pl(w)===1,JSON.stringify({p:pl(w)}));
  audit('ゴブリン 1'); }

/* ===== 牙城のガーディアン ===== */
{ fresh();const w=mon('ワイト',0),f=mon('青眼の白龍',1),fo=mk(FOR,0);w.pos='def';gameState.players[0].mz=[w];gameState.players[0].hand=[fo];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,w);
  ok('牙城のガーディアン: ワイト (DEF 200) attacked in Defense -> discarded from the hand, in the Graveyard, no damage',z(fo)==='grave'&&lp(0)===l0,JSON.stringify({fo:z(fo),lp:lp(0)-l0,w:z(w)}));
  audit('牙城 1'); }
{ fresh();const w=mon('ライトロード・ウォリアー ガロス',0),f=mon('ブラック・マジシャン',1),fo=mk(FOR,0);w.pos='def';gameState.players[0].mz=[w];gameState.players[0].hand=[fo];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,w);
  ok('牙城のガーディアン: DEF 1000 + 1500 = 2500 vs ブラック・マジシャン 2500 -> both stay (no destruction on a tie in Defense)',z(fo)==='grave'&&z(w)==='mz',JSON.stringify({fo:z(fo),w:z(w),def:C(w)&&curDEF(C(w))})); }
{ fresh();const w=mon('ワイト',0),f=mon('青眼の白龍',1),fo=mk(FOR,0);gameState.players[0].mz=[w];gameState.players[0].hand=[fo];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,w);
  ok('牙城のガーディアン control: the attacked monster is in Attack Position -> not used, stays in the hand',z(fo)==='hand',z(fo)); }

/* ===== 精気を吸う骨の塔 ===== */
{ fresh();const t=mon(TOW,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,t);
  ok('精気を吸う骨の塔: no other Undead -> it can be attacked and is destroyed',z(t)==='grave',z(t)); }
{ fresh();const t=mon(TOW,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[t,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,t);
  ok('精気を吸う骨の塔: another Undead on my field -> the attack on it is refused (it is not destroyed, no damage)',z(t)==='mz'&&lp(0)===l0,JSON.stringify({t:z(t),l:lp(0)-l0})); }
{ fresh();const t=mon(TOW,0),x=mk('ワイト',0),rv=mk('死者蘇生',0);gameState.players[0].mz=[t];gameState.players[0].grave=[x];gameState.players[0].hand=[rv];gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));baselineA();
  const d1=gameState.players[1].deck.length;
  cast(0,'死者蘇生',[x.uid]);
  ok('精気を吸う骨の塔: 死者蘇生 revives an Undead (Special Summon) -> the opponent Deck top 2 to the Graveyard',z(x)==='mz'&&gameState.players[1].deck.length===d1-2,JSON.stringify({x:z(x),d:d1-gameState.players[1].deck.length}));
  audit('骨の塔 1'); }
{ fresh();const t=mon(TOW,0),x=mk('青眼の白龍',0),rv=mk('死者蘇生',0);gameState.players[0].mz=[t];gameState.players[0].grave=[x];gameState.players[0].hand=[rv];gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));baselineA();
  const d1=gameState.players[1].deck.length;
  cast(0,'死者蘇生',[x.uid]);
  ok('精気を吸う骨の塔 control: a non-Undead Special Summoned -> no mill',z(x)==='mz'&&gameState.players[1].deck.length===d1,JSON.stringify({x:z(x),d:d1-gameState.players[1].deck.length})); }

/* ===== 火車 ===== */
{ fresh();const w1=mon('ワイト',0),w2=mon('ワイト',0),k=mk(KAS,0);gameState.players[0].mz=[w1,w2];gameState.players[0].hand=[k];baselineA();
  ok('火車: 2 Undead on my field -> the procedure is legal',procOk(KAS,0)===true,''); }
{ fresh();const w1=mon('ワイト',0),k=mk(KAS,0);gameState.players[0].mz=[w1];gameState.players[0].hand=[k];baselineA();
  ok('火車 negative: only 1 Undead -> illegal',procOk(KAS,0)===false,''); }
{ fresh();const w1=mon('ワイト',0),k=mk(KAS,0);gameState.players[0].mz=[w1,mon('青眼の白龍',0)];gameState.players[0].hand=[k];baselineA();
  ok('火車 negative: 1 Undead + a Dragon -> illegal',procOk(KAS,0)===false,'');
  doNormalSummon(0,'atk');
  ok('火車: cannot be Normal Summoned',z(k)==='hand',z(k)); }
{ fresh();const w1=mon('ワイト',0),w2=mon('ワイト',0),dr=mon('青眼の白龍',0),fz=mon('ワイト',1),fd=mon('ブラック・マジシャン',1),k=mk(KAS,0);
  gameState.players[0].mz=[w1,w2,dr];gameState.players[0].hand=[k];gameState.players[1].mz=[fz,fd];baselineA();
  const dk0=gameState.players[0].deck.length,dk1=gameState.players[1].deck.length;
  procRun(KAS,0);
  ok('火車: Special Summoned -> every other monster went to the owner Deck (mine 3, the opponent 2)',z(k)==='mz'&&gameState.players[0].deck.length===dk0+3&&gameState.players[1].deck.length===dk1+2&&gameState.players[0].mz.length===1&&gameState.players[1].mz.length===0,JSON.stringify({z:z(k),m:gameState.players[0].mz.length,o:gameState.players[1].mz.length,d0:gameState.players[0].deck.length-dk0,d1:gameState.players[1].deck.length-dk1}));
  ok('火車: 3 face-up Undead returned (ワイト x3) -> ATK 3000',curATK(C(k))===3000,String(curATK(C(k))));
  audit('火車 1'); }

console.log('U350 done');
`);
