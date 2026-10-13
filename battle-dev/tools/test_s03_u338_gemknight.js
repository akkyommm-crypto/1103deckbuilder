/* S03-U338: five 「ジェムナイト」 Fusion Monsters — アクアマリナ, アメジス, パーズ, プリズムオーラ, ルビーズ.
   Real DUEL paths (each Fusion Summoned through 「融合」 first; leaving the field, battle kills, ignition effects), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3380001;
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


const AQU='ジェムナイト・アクアマリナ',AME='ジェムナイト・アメジス',PAR='ジェムナイト・パーズ',PRI='ジェムナイト・プリズムオーラ',RUB='ジェムナイト・ルビーズ';
const SAPH='ジェムナイト・サフィア',EMER='ジェムナイト・エメラル',LUMA='ジェムナイト・ルマリン',GARN='ジェムナイト・ガネット',AIOL='ジェムナイト・アイオーラ';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
/* the real Fusion Summon: 融合 + the two materials (+ extra hand cards / field cards) → the Fusion Monster (face-up Attack) */
function fuse(fusion,a,b,o){o=o||{};fresh();const poly=mk('融合',0),ma=mk(a,0),mb=mk(b,0),fm=mk(fusion,0);
  const extra=(o.hand?o.hand():[]);gameState.players[0].hand=[poly,ma,mb].concat(extra);gameState.players[0].ex=[fm];
  if(o.mine)gameState.players[0].mz=o.mine();if(o.sz)gameState.players[0].sz=o.sz();if(o.foes)gameState.players[1].mz=o.foes();if(o.foeSz)gameState.players[1].sz=o.foeSz();
  baselineA();PREFER=['atk'].concat(o.prefer?o.prefer():[]);duelActivateFromHand(0);drive();PREFER=[];
  return {fm,ma,mb,poly};}
const BHF=()=>mk('ブラック・ホール',0);
function castBH(){const i=gameState.players[0].hand.findIndex(c=>cardName(c)==='ブラック・ホール');duelActivateFromHand(i);drive();}

/* ===== アクアマリナ ===== */
{ const x=fuse(AQU,SAPH,EMER,{foes:()=>[mon('ワイト',1,'def')]});const f=gameState.players[1].mz[0];
  ok('アクアマリナ: Fusion Summoned by 融合 (サフィア + ジェムナイト)',z(x.fm)==='mz'&&z(x.ma)==='grave'&&z(x.mb)==='grave'&&x.fm.specialSummonKind==='fusion',JSON.stringify({fm:z(x.fm),k:x.fm.specialSummonKind}));
  endTurn();endTurn();phase('battle');atkTarget(0,x.fm,f);phase('main2');
  ok('アクアマリナ: attacked → Defense Position when the Battle Phase ends',z(x.fm)==='mz'&&C(x.fm).pos==='def',C(x.fm).pos);
  audit('アクアマリナ ①'); }
{ const x=fuse(AQU,SAPH,EMER,{foes:()=>[mon('ワイト',1,'def')]});
  endTurn();endTurn();phase('battle');phase('main2');
  ok('アクアマリナ negative: did not attack → stays in Attack Position',C(x.fm).pos==='atk',C(x.fm).pos); }
{ const x=fuse(AQU,SAPH,EMER,{hand:()=>[BHF()],foeSz:()=>[setCard('サイクロン',1)],foes:()=>[mon('ワイト',1)]});const trap=gameState.players[1].sz[0],w=gameState.players[1].mz[0];
  PREFER=[uid(trap)];castBH();PREFER=[];
  ok('アクアマリナ: sent from the field to the Graveyard (destroyed) → the chosen card of the opponent\'s field returns to the hand',z(x.fm)==='grave'&&z(trap)==='hand'&&pl(trap)===1,JSON.stringify({fm:z(x.fm),trap:z(trap),w:z(w)}));
  audit('アクアマリナ ②'); }
{ const x=fuse(AQU,SAPH,EMER,{hand:()=>[BHF()]});castBH();
  ok('アクアマリナ negative: the opponent has no card on the field → nothing happens',z(x.fm)==='grave'&&gameState.players[1].hand.length===0,JSON.stringify({fm:z(x.fm)})); }

/* ===== アメジス ===== */
{ const x=fuse(AME,EMER,AIOL,{hand:()=>[BHF()],sz:()=>[setCard('サイクロン',0)],foeSz:()=>[setCard('サイクロン',1),mk('王宮の勅命',1,'up')]});
  const mine=gameState.players[0].sz[0],theirs=gameState.players[1].sz[0],up=gameState.players[1].sz[1];
  ok('アメジス: Fusion Summoned (ジェムナイト + 水族)',z(x.fm)==='mz'&&x.fm.specialSummonKind==='fusion',z(x.fm));
  castBH();
  ok('アメジス: sent to the Graveyard → every Set Spell/Trap of both players returns to its owner\'s hand; the face-up one stays',z(x.fm)==='grave'&&z(mine)==='hand'&&pl(mine)===0&&z(theirs)==='hand'&&pl(theirs)===1&&z(up)==='sz',JSON.stringify({mine:z(mine),theirs:z(theirs),up:z(up)}));
  audit('アメジス ①'); }
{ fresh();const poly=mk('融合',0),ma=mk(EMER,0),mb=mk('ワイト',0),fm=mk(AME,0);gameState.players[0].hand=[poly,ma,mb];gameState.players[0].ex=[fm];baselineA();
  duelActivateFromHand(0);drive();
  ok('アメジス negative: ジェムナイト + a non-Aqua monster (ワイト) cannot make it',z(fm)==='ex',z(fm)); }

/* ===== パーズ ===== */
{ const x=fuse(PAR,LUMA,EMER,{foes:()=>[mon('ワイト',1),mon('ワイト',1),mon('ワイト',1)]});const fs=gameState.players[1].mz.slice();
  ok('パーズ: Fusion Summoned (ルマリン + ジェムナイト)',z(x.fm)==='mz'&&x.fm.specialSummonKind==='fusion',z(x.fm));
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,x.fm,fs[0]);
  ok('パーズ: destroyed ワイト by battle → 1500 battle damage + 300 (its original ATK) effect damage',z(fs[0])==='grave'&&l1-lp(1)===1800,JSON.stringify({f:z(fs[0]),loss:l1-lp(1)}));
  atkTarget(0,x.fm,fs[1]);
  ok('パーズ: a second attack in the same Battle Phase',z(fs[1])==='grave'&&z(fs[2])==='mz',JSON.stringify({f1:z(fs[1]),f2:z(fs[2])}));
  atkTarget(0,x.fm,fs[2]);
  ok('パーズ: no third attack',z(fs[2])==='mz',z(fs[2]));
  audit('パーズ ①'); }
{ const x=fuse(PAR,LUMA,EMER,{foes:()=>[mon('青眼の白龍',1)]});const f=gameState.players[1].mz[0];
  endTurn();endTurn();phase('battle');const l0=lp(0);atkTarget(0,x.fm,f);
  ok('パーズ negative: destroyed by 青眼 (it did not destroy the monster) → no effect damage to the opponent',z(x.fm)==='grave'&&z(f)==='mz'&&lp(1)===8000,JSON.stringify({fm:z(x.fm),lp1:lp(1)})); }

/* ===== プリズムオーラ ===== */
{ const dnF=()=>{const c=mon('ワイト',1,'def');c.face='down';return c;};
  const x=fuse(PRI,EMER,'エレキタリス',{hand:()=>[mk(GARN,0)],foes:()=>[mon('青眼の白龍',1),dnF()]});const hi=gameState.players[1].mz[0],dn=gameState.players[1].mz[1],cost=gameState.players[0].hand[0];
  ok('プリズムオーラ: Fusion Summoned (ジェムナイト + 雷族)',z(x.fm)==='mz'&&x.fm.specialSummonKind==='fusion',z(x.fm));
  ok('プリズムオーラ: available with a 「ジェムナイト」 card in the hand',canZ(x.fm)===true,'');
  const SEEN=[];const pick0=pick;pick=function(){SEEN.push(pc().candidates.map(c=>c.uid||(c.card&&c.card.uid)));return pick0();};
  PREFER=[uid(cost),uid(hi)];actZ(x.fm);PREFER=[];pick=pick0;
  ok('プリズムオーラ: the 「ジェムナイト」 card sent to the Graveyard (cost), the chosen face-up 青眼 destroyed',z(cost)==='grave'&&z(hi)==='grave',JSON.stringify({cost:z(cost),hi:z(hi)}));
  ok('プリズムオーラ: a face-down monster is not a candidate for the target',SEEN.every(s=>s.indexOf(dn.uid)<0)&&SEEN.some(s=>s.indexOf(hi.uid)>=0),JSON.stringify(SEEN));
  ok('プリズムオーラ: once per turn',canZ(x.fm)===false,'');
  audit('プリズムオーラ ①'); }
{ const x=fuse(PRI,EMER,'エレキタリス',{hand:()=>[mk('ワイト',0)],foes:()=>[mon('青眼の白龍',1)]});
  ok('プリズムオーラ negative: no 「ジェムナイト」 card in the hand (a ワイト only) → not available',canZ(x.fm)===false,''); }

/* ===== ルビーズ ===== */
{ const x=fuse(RUB,GARN,EMER,{mine:()=>[mon('ジェムナイト・オブシディア',0),mon('ワイト',0)],foes:()=>[mon('ワイト',1,'def')]});
  const ob=gameState.players[0].mz.find(c=>cardName(c)==='ジェムナイト・オブシディア'),w=gameState.players[0].mz.find(c=>cardName(c)==='ワイト'),f=gameState.players[1].mz[0];
  ok('ルビーズ: Fusion Summoned (ガネット + ジェムナイト)',z(x.fm)==='mz'&&x.fm.specialSummonKind==='fusion',z(x.fm));
  const a0=curATK(C(x.fm)),oa=curATK(C(ob));
  PREFER=[uid(ob)];actZ(x.fm);PREFER=[];
  ok('ルビーズ: released the other 「ジェム」 monster (オブシディア, ATK '+oa+') → ATK '+a0+' + '+oa+' until the end of the turn; the ワイト is not a candidate',z(ob)==='grave'&&z(w)==='mz'&&curATK(C(x.fm))===a0+oa,JSON.stringify({ob:z(ob),atk:curATK(C(x.fm)),a0,oa}));
  ok('ルビーズ: once per turn',canZ(x.fm)===false,'');
  audit('ルビーズ ①');
  endTurn();ok('ルビーズ: ATK back after the End Phase',curATK(C(x.fm))===a0,String(curATK(C(x.fm)))); }
{ const x=fuse(RUB,GARN,EMER,{mine:()=>[mon('ワイト',0)],foes:()=>[mon('ワイト',1,'def')]});
  ok('ルビーズ negative: no other 「ジェム」 monster (a ワイト only) → not available',canZ(x.fm)===false,'');
  const f=gameState.players[1].mz[0];endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,x.fm,f);
  ok('ルビーズ: attacked a Defense Position ワイト (DEF 200): piercing ATK − DEF damage',z(f)==='grave'&&l1-lp(1)===curATK(C(x.fm))-200,JSON.stringify({f:z(f),loss:l1-lp(1),atk:curATK(C(x.fm))})); }

console.log('U338 done');
`);
