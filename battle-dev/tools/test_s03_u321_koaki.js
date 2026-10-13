/* S03-U321: 「コアキメイル」 — クルセイダー, ウルナイト, スピード, マキシマム, ルークロード, ヴァラファール. Real DUEL paths (End Phase upkeep, battles, the draw, hand procedure, one-Tribute Summons), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3210001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function doAct(c){duelActivateFromZone(0,'mz',idx(c));drive();}
function canEffect(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function raceName(r){const d=CARD_DB.find(x=>x.k==='m'&&x.ra===r&&!x.ex&&(x.lv||0)<=4&&(x.st||[]).includes('通常')&&x.d<='2011-08-31');return d.n;}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
const CORE='コアキメイルの鋼核';

/* ===== upkeep (ヴァラファール: 鋼核 only; クルセイダー: 鋼核 or a 獣戦士 shown) ===== */
{ fresh();const va=mon('コアキメイル・ヴァラファール',0),co=mk(CORE,0);gameState.players[0].mz=[va];gameState.players[0].hand=[co];baselineA();
  phase('end');
  ok('ヴァラファール: End Phase — 鋼核 sent to the Graveyard, it stays',z(va)==='mz'&&z(co)==='grave',JSON.stringify({va:z(va),co:z(co)}));
  audit('ヴァラファール upkeep'); }
{ fresh();const va=mon('コアキメイル・ヴァラファール',0),wh=mk(raceName('戦士'),0);gameState.players[0].mz=[va];gameState.players[0].hand=[wh];baselineA();
  phase('end');
  ok('ヴァラファール: no 鋼核 (showing a warrior is not enough for it) → destroyed',z(va)==='grave'&&z(wh)==='hand',JSON.stringify({va:z(va),wh:z(wh)})); }
{ fresh();const cr=mon('コアキメイル・クルセイダー',0),bw=mk(raceName('獣戦士'),0);gameState.players[0].mz=[cr];gameState.players[0].hand=[bw];baselineA();
  phase('end');
  ok('クルセイダー: no 鋼核, a 獣戦士 shown from the hand → stays; the shown card stays in hand',z(cr)==='mz'&&z(bw)==='hand',JSON.stringify({cr:z(cr),bw:z(bw)})); }
{ fresh();const cr=mon('コアキメイル・クルセイダー',0);gameState.players[0].mz=[cr];baselineA();
  phase('end');
  ok('クルセイダー: neither → destroyed',z(cr)==='grave',z(cr)); }
{ fresh();const cr=mon('コアキメイル・クルセイダー',0);gameState.players[0].mz=[cr];gameState.activePlayer=1;gameState.phase='main1';baselineA();
  phase('end');
  ok('クルセイダー: the opponent End Phase is not its upkeep (no cost, no destruction)',z(cr)==='mz',z(cr)); }

/* ===== クルセイダー: destroyed an opponent monster by battle → add a 「コアキメイル」 card of my Graveyard to the hand ===== */
{ fresh();const cr=mon('コアキメイル・クルセイダー',0),co=mk(CORE,0),rk=mk('コアキメイル・ロック',0),wy=mk('ワイト',0),f=mon('ワイト',1);
  gameState.players[0].mz=[cr];gameState.players[0].hand=[mk(CORE,0)];gameState.players[0].grave=[co,rk,wy];gameState.players[1].mz=[f];baselineA();phase('battle');
  PREFER=[uid(rk)];atkTarget(0,cr,f);PREFER=[];
  ok('クルセイダー: ワイト destroyed → ロック (chosen) back to the hand; 鋼核 and the non-コアキメイル stay in the Graveyard',z(f)==='grave'&&z(rk)==='hand'&&z(co)==='grave'&&z(wy)==='grave',JSON.stringify({f:z(f),rk:z(rk),co:z(co),wy:z(wy)}));
  audit('クルセイダー'); }
{ fresh();const cr=mon('コアキメイル・クルセイダー',0),rk=mk('コアキメイル・ロック',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[cr];gameState.players[0].grave=[rk];gameState.players[1].mz=[f];baselineA();phase('battle');
  atkTarget(0,cr,f);
  ok('クルセイダー negative: it did not destroy the opponent monster (it was destroyed) → no recovery',z(cr)==='grave'&&z(rk)==='grave',JSON.stringify({cr:z(cr),rk:z(rk)})); }

/* ===== ウルナイト: show 鋼核 → Special Summon a Lv4- 「コアキメイル」 (not ウルナイト) from the Deck ===== */
{ fresh();const ul=mon('コアキメイル・ウルナイト',0),co=mk(CORE,0),rk=mk('コアキメイル・ロック',0),u2=mk('コアキメイル・ウルナイト',0),hi=mk('コアキメイル・ヴァラファール',0);
  gameState.players[0].mz=[ul];gameState.players[0].hand=[co];gameState.players[0].deck=[u2,hi,rk,mk('ワイト',0)];baselineA();
  ok('ウルナイト: available with 鋼核 in hand',canEffect(ul)===true,'');
  PREFER=[uid(u2),uid(rk)];doAct(ul);PREFER=[];
  ok('ウルナイト: ロック (Lv4) Special Summoned (another ウルナイト and the Lv8 are not candidates); 鋼核 only shown, still in hand',z(rk)==='mz'&&z(co)==='hand'&&z(u2)==='deck'&&z(hi)==='deck',JSON.stringify({rk:z(rk),co:z(co),u2:z(u2),hi:z(hi)}));
  ok('ウルナイト: once per turn',canEffect(ul)===false,'');
  audit('ウルナイト'); }
{ fresh();const ul=mon('コアキメイル・ウルナイト',0),rk=mk('コアキメイル・ロック',0);gameState.players[0].mz=[ul];gameState.players[0].deck=[rk];baselineA();
  ok('ウルナイト negative: no 鋼核 in hand → not available',canEffect(ul)===false,''); }
{ fresh();const ul=mon('コアキメイル・ウルナイト',0),co=mk(CORE,0);gameState.players[0].mz=[ul];gameState.players[0].hand=[co];gameState.players[0].deck=[mk('コアキメイル・ウルナイト',0)];baselineA();
  ok('ウルナイト negative: only another ウルナイト in the Deck → not available',canEffect(ul)===false,''); }

/* ===== スピード: the normal draw is 鋼核 → show it to draw one more card ===== */
{ fresh();gameState.phase='draw';gameState.drawnThisTurn=false;const sp=mon('コアキメイル・スピード',0),co=mk(CORE,0),x1=mk('青眼の白龍',0);
  gameState.players[0].mz=[sp];gameState.players[0].deck=[co,x1,mk('ワイト',0)];baselineA();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
  ok('スピード: drew 鋼核 → showed it and drew one more (2 cards in hand)',z(co)==='hand'&&z(x1)==='hand'&&gameState.players[0].hand.length===2,JSON.stringify({co:z(co),x1:z(x1),n:gameState.players[0].hand.length}));
  audit('スピード'); }
{ fresh();gameState.phase='draw';gameState.drawnThisTurn=false;const sp=mon('コアキメイル・スピード',0),x1=mk('青眼の白龍',0),x2=mk('ワイト',0);
  gameState.players[0].mz=[sp];gameState.players[0].deck=[x1,x2];baselineA();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
  ok('スピード negative: the drawn card is not 鋼核 → only the normal draw',gameState.players[0].hand.length===1,String(gameState.players[0].hand.length)); }
{ fresh();gameState.phase='draw';gameState.drawnThisTurn=false;const co=mk(CORE,0),x1=mk('青眼の白龍',0);
  gameState.players[0].deck=[co,x1,mk('ワイト',0)];baselineA();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
  ok('スピード negative: not on the field → no extra draw',gameState.players[0].hand.length===1,String(gameState.players[0].hand.length)); }

/* ===== マキシマム: hand procedure (banish 鋼核), its own upkeep, once per turn destroy 1 opponent card ===== */
{ fresh();const mx=mk('コアキメイル・マキシマム',0),co=mk(CORE,0);gameState.players[0].hand=[mx,co];baselineA();
  const mi=gameState.players[0].hand.indexOf(mx);
  ok('マキシマム: with 鋼核 in hand the Special Summon procedure is legal',procOk('コアキメイル・マキシマム',mi)===true,'');
  procRun('コアキメイル・マキシマム',mi);
  ok('マキシマム: Special Summoned, 鋼核 banished',z(mx)==='mz'&&z(co)==='banish',JSON.stringify({mx:z(mx),co:z(co)}));
  audit('マキシマム ①'); }
{ fresh();const mx=mk('コアキメイル・マキシマム',0);gameState.players[0].hand=[mx];baselineA();
  ok('マキシマム negative: no 鋼核 → the procedure is not legal',procOk('コアキメイル・マキシマム',0)===false,''); }
{ fresh();const mx=mon('コアキメイル・マキシマム',0),f=mon('青眼の白龍',1),fs=mk('サイクロン',1,'down');fs.setTurn=3;
  gameState.players[0].mz=[mx];gameState.players[1].mz=[f];gameState.players[1].sz=[fs];baselineA();
  PREFER=[uid(fs)];doAct(mx);PREFER=[];
  ok('マキシマム: destroyed the chosen opponent card (the Set Spell/Trap; 青眼 stays)',z(fs)==='grave'&&z(f)==='mz',JSON.stringify({fs:z(fs),f:z(f)}));
  ok('マキシマム: once per turn',canEffect(mx)===false,'');
  audit('マキシマム ②'); }
{ fresh();const mx=mon('コアキメイル・マキシマム',0),co=mk(CORE,0);gameState.players[0].mz=[mx];gameState.players[0].hand=[co,mk('コアキメイル・ロック',0)];baselineA();
  phase('end');
  ok('マキシマム: End Phase — 鋼核 sent (the Koaki monster is kept) and it stays',z(mx)==='mz'&&z(co)==='grave'&&gameState.players[0].hand.length===1,JSON.stringify({mx:z(mx),co:z(co),hand:gameState.players[0].hand.length})); }
{ fresh();const mx=mon('コアキメイル・マキシマム',0),rk=mk('コアキメイル・ロック',0);gameState.players[0].mz=[mx];gameState.players[0].hand=[rk];baselineA();
  phase('end');
  ok('マキシマム: End Phase — no 鋼核, a 「コアキメイル」 monster is sent to the Graveyard and it stays',z(mx)==='mz'&&z(rk)==='grave',JSON.stringify({mx:z(mx),rk:z(rk)})); }
{ fresh();const mx=mon('コアキメイル・マキシマム',0),w=mk('ワイト',0);gameState.players[0].mz=[mx];gameState.players[0].hand=[w];baselineA();
  phase('end');
  ok('マキシマム: End Phase — nothing to send → destroyed',z(mx)==='grave'&&z(w)==='hand',JSON.stringify({mx:z(mx),w:z(w)})); }

/* ===== ルークロード: one-Tribute Advance Summon (a 「コアキメイル」), summon trigger: banish a Koaki card from my GY → destroy up to 2 opponent cards ===== */
{ fresh();const lr=mk('コアキメイル・ルークロード',0),rk=mon('コアキメイル・ロック',0),gc=mk(CORE,0),f1=mon('青眼の白龍',1),f2=mon('ワイト',1);
  gameState.players[0].hand=[lr];gameState.players[0].mz=[rk];gameState.players[0].grave=[gc];gameState.players[1].mz=[f1,f2];baselineA();
  const mths=normalSummonMethodsFor(dbOf(C(lr)),0,'summon');
  ok('ルークロード: a 1-Tribute method is offered (a 「コアキメイル」 is on my field)',mths.some(m=>m.tributes===1),JSON.stringify(mths.map(m=>m.id+':'+m.tributes)));
  PREFER=[mths.find(m=>m.tributes===1).id,uid(gc),uid(rk),uid(f1),'yes',uid(f2)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('ルークロード: Advance Summoned with ロック; 鋼核 banished; both opponent monsters destroyed',z(lr)==='mz'&&z(rk)==='grave'&&z(gc)==='banish'&&z(f1)==='grave'&&z(f2)==='grave',JSON.stringify({lr:z(lr),rk:z(rk),gc:z(gc),f1:z(f1),f2:z(f2),t:TOASTS.slice(-3)}));
  audit('ルークロード'); }
{ fresh();const lr=mk('コアキメイル・ルークロード',0),wy=mon('ワイト',0);gameState.players[0].hand=[lr];gameState.players[0].mz=[wy];baselineA();
  const mths=normalSummonMethodsFor(dbOf(C(lr)),0,'summon');
  ok('ルークロード negative: with only a non-「コアキメイル」 on my field the 1-Tribute method is not offered',!mths.some(m=>m.tributes===1),JSON.stringify(mths.map(m=>m.id+':'+m.tributes))); }

/* ===== ヴァラファール: one-Tribute method, piercing damage, not destroyed by a Trap's effect ===== */
{ fresh();const va=mk('コアキメイル・ヴァラファール',0),rk=mon('コアキメイル・ロック',0);gameState.players[0].hand=[va];gameState.players[0].mz=[rk];baselineA();
  const mths=normalSummonMethodsFor(dbOf(C(va)),0,'summon');
  PREFER=[mths.find(m=>m.tributes===1).id,uid(rk)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('ヴァラファール: Advance Summoned with 1 「コアキメイル」',z(va)==='mz'&&z(rk)==='grave',JSON.stringify({va:z(va),rk:z(rk)}));
  audit('ヴァラファール ①'); }
{ fresh();const va=mon('コアキメイル・ヴァラファール',0),f=mon('ワイト',1,'def');f.def=200;
  gameState.players[0].mz=[va];gameState.players[1].mz=[f];baselineA();phase('battle');
  const l1=lp(1);atkTarget(0,va,f);
  ok('ヴァラファール: attacking a Defense Position monster (DEF 200): piercing damage 3000-200 = 2800',z(f)==='grave'&&l1-lp(1)===2800,JSON.stringify({loss:l1-lp(1),f:z(f)}));
  audit('ヴァラファール ②'); }
{ fresh();const va=mon('コアキメイル・ヴァラファール',0),tr=mk('奈落の落とし穴',1,'down');tr.setTurn=3;
  gameState.players[0].mz=[va];gameState.players[1].sz=[tr];baselineA();
  const un=protectionRecordV21(gameState,C(va),{cause:'effect',byPlayer:1,reason:'罠',sourceKind:'t',targeting:false});
  const spl=protectionRecordV21(gameState,C(va),{cause:'effect',byPlayer:1,reason:'魔法',sourceKind:'s',targeting:false});
  ok('ヴァラファール: protected against a Trap effect only (not a Spell effect, not battle)',!!un&&!spl,JSON.stringify({trap:!!un,spell:!!spl})); }

console.log('U321 done');
`);
