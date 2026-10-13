/* S03-U337: 墓守の大神官, 墓守の大筒持ち, マシンナーズ・カノン, 古代の機械合成獣, 古代の採掘機.
   Real DUEL paths (Tribute Summons, the destruction substitute choice, releases, a hand procedure with a choice of any number, gadget Tribute effects, a Deck-set Spell), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3370001;
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


const DSK='墓守の大神官',CAN='墓守の大筒持ち',CNN='マシンナーズ・カノン',CHI='古代の機械合成獣',DIG='古代の採掘機';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function cands(){const q=pc();return q?q.candidates.map(x=>x.uid||(x.card&&x.card.uid)||x.key):[];}
function summonVia(i,tributes){const p=gameState.activePlayer,db=dbOf(gameState.players[p].hand[i]);const ms=normalSummonMethodsFor(db,p,'summon');const m=ms.find(x=>x.tributes===tributes)||ms[0];
  pickTributes(p,m.tributes,[],payment=>finishNormalSummon(i,'atk',payment,m.id,null),db,m,'summon');drive();}

/* ===== 墓守の大神官 ===== */
{ fresh();const kp=mon('墓守の呪術師',0),dsk=mk(DSK,0);gameState.players[0].mz=[kp];gameState.players[0].hand=[dsk];baselineA();
  PREFER=[uid(kp)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('大神官: Tribute Summoned with a single 「墓守の」 monster (呪術師) as the Tribute (Lv8 normally needs two)',z(dsk)==='mz'&&z(kp)==='grave',JSON.stringify({dsk:z(dsk),kp:z(kp)}));
  ok('大神官: ATK 2000 + 200 × the 「墓守の」 monsters in my Graveyard (1) = 2200',curATK(C(dsk))===2200,String(curATK(C(dsk))));
  audit('大神官 ①'); }
{ fresh();const dsk=mon(DSK,0),g1=mk('墓守の末裔',0),g2=mk('墓守の呪術師',0),g3=mk('ワイト',0);gameState.players[0].mz=[dsk];gameState.players[0].grave=[g1,g2,g3];baselineA();
  ok('大神官: ATK 2000 + 200 × 2 「墓守の」 monsters in my Graveyard = 2400; a ワイト is not counted',curATK(C(dsk))===2400,String(curATK(C(dsk)))); }
{ fresh();const w=mon('ワイト',0),dsk=mk(DSK,0);gameState.players[0].mz=[w];gameState.players[0].hand=[dsk];baselineA();
  PREFER=[uid(w)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('大神官 negative: one Tribute that is not a 「墓守の」 monster → no Tribute Summon',z(dsk)==='hand'&&z(w)==='mz',JSON.stringify({dsk:z(dsk),w:z(w)})); }
/* destruction substitute: battle */
function dskBoard(handKeeper){fresh();const dsk=mon(DSK,0),kp=mk('墓守の呪術師',0),w=mk('ワイト',0),foe=mon('青眼の白龍',1);
  gameState.players[0].mz=[dsk];gameState.players[0].hand=handKeeper?[kp,w]:[w];gameState.players[1].mz=[foe];return {dsk,kp,w,foe};}
{ const b=dskBoard(true);baselineA();toOppBattle();PREFER=[uid(b.kp)];atkTarget(1,b.foe,b.dsk);PREFER=[];
  ok('大神官 (battle): destroyed by 青眼 (3000 vs 2000) → a 「墓守の」 monster of the hand discarded instead, 大神官 stays',z(b.dsk)==='mz'&&z(b.kp)==='grave'&&z(b.w)==='hand',JSON.stringify({dsk:z(b.dsk),kp:z(b.kp),w:z(b.w)}));
  audit('大神官 ②'); }
{ const b=dskBoard(true);baselineA();toOppBattle();PREFER=['decline'];atkTarget(1,b.foe,b.dsk);PREFER=[];
  ok('大神官 (battle): the substitute is optional — declined → destroyed, the hand card kept',z(b.dsk)==='grave'&&z(b.kp)==='hand',JSON.stringify({dsk:z(b.dsk),kp:z(b.kp)})); }
{ const b=dskBoard(false);baselineA();toOppBattle();atkTarget(1,b.foe,b.dsk);
  ok('大神官 negative: no 「墓守の」 monster in the hand (a ワイト only) → destroyed, nothing discarded',z(b.dsk)==='grave'&&z(b.w)==='hand',JSON.stringify({dsk:z(b.dsk),w:z(b.w)})); }
{ fresh();const dsk=mon(DSK,0),kp=mk('墓守の呪術師',0),foe=mon('ワイト',1),bh=mk('ブラック・ホール',1);
  gameState.players[0].mz=[dsk];gameState.players[0].hand=[kp];gameState.players[1].mz=[foe];gameState.players[1].hand=[bh];baselineA();
  endTurn();PREFER=[uid(kp)];duelActivateFromHand(0);drive();PREFER=[];
  ok('大神官 (effect): the opponent\'s ブラック・ホール → a 「墓守の」 discarded instead, 大神官 stays while the other monster is destroyed',z(dsk)==='mz'&&z(kp)==='grave'&&z(foe)==='grave',JSON.stringify({dsk:z(dsk),kp:z(kp),foe:z(foe)}));
  audit('大神官 ③'); }

/* ===== 墓守の大筒持ち ===== */
function cannonBoard(mine,hand){fresh();const cn=mon(CAN,0);const ms=mine.map(n=>mon(n,0));gameState.players[0].mz=[cn].concat(ms);const hc=mk(hand,0);gameState.players[0].hand=[hc];return {cn,ms,hc};}
{ const x=cannonBoard(['墓守の呪術師'],DSK);baselineA();
  PREFER=[uid(x.ms[0])];summonVia(0,1);PREFER=[];
  ok('大筒持ち: a 「墓守の」 monster released for the Tribute Summon → 700 damage',z(x.hc)==='mz'&&lp(1)===7300&&lp(0)===8000,JSON.stringify({hc:z(x.hc),lp1:lp(1)}));
  audit('大筒持ち ①'); }
{ const x=cannonBoard(['墓守の呪術師','墓守の番兵'],DSK);gameState.players[0].mz[1].summonedTurn=3;baselineA();
  PREFER=[uid(x.ms[0]),uid(x.ms[1])];summonVia(0,2);PREFER=[];
  ok('大筒持ち: two 「墓守の」 monsters released together → 1400 damage',z(x.hc)==='mz'&&lp(1)===6600,JSON.stringify({hc:z(x.hc),lp1:lp(1)})); }
{ const x=cannonBoard(['ワイト'],'墓守の長');baselineA();
  PREFER=[uid(x.ms[0])];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('大筒持ち negative: a ワイト released (not a 「墓守の」) → no damage',z(x.hc)==='mz'&&z(x.ms[0])==='grave'&&lp(1)===8000,JSON.stringify({lp1:lp(1)})); }
{ const x=cannonBoard(['墓守の呪術師'],'墓守の長');baselineA();
  PREFER=[uid(x.cn)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('大筒持ち negative: 大筒持ち itself released → no damage (it is not counted)',z(x.hc)==='mz'&&z(x.cn)==='grave'&&lp(1)===8000,JSON.stringify({cn:z(x.cn),lp1:lp(1)})); }
{ fresh();const kp=mon('墓守の呪術師',0),hc=mk(DSK,0);gameState.players[0].mz=[kp];gameState.players[0].hand=[hc];baselineA();
  PREFER=[uid(kp)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('大筒持ち negative: not on the field → no damage',z(hc)==='mz'&&lp(1)===8000,String(lp(1))); }
{ fresh();const cn=mon(CAN,0),des=mon('墓守の末裔',0),kp=mon('墓守の呪術師',0),foe=mon('ワイト',1);gameState.players[0].mz=[cn,des,kp];gameState.players[1].mz=[foe];baselineA();
  PREFER=[uid(kp),uid(foe)];actZ(des);PREFER=[];
  ok('大筒持ち: a 「墓守の」 monster released as the cost of 墓守の末裔 is also sacrificed → 700 damage (and the effect destroys the target)',z(kp)==='grave'&&z(foe)==='grave'&&lp(1)===7300,JSON.stringify({kp:z(kp),foe:z(foe),lp1:lp(1)}));
  audit('大筒持ち ②'); }

/* ===== マシンナーズ・カノン ===== */
function cannonHand(){fresh();const cn=mk(CNN,0),m1=mk('サイバー・ドラゴン',0),m2=mk('A・O・J D.D.チェッカー',0),w=mk('ワイト',0);gameState.players[0].hand=[cn,m1,m2,w];baselineA();return {cn,m1,m2,w};}
function runCannon(prefer){PREFER=prefer;runSummonProcedure(CNN,0,'hand',0);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(CNN,0,'hand',0,'atk');drive();PREFER=[];}
{ const x=cannonHand();
  ok('カノン: the hand procedure is available',procOk(CNN,0)===true,'');
  ok('カノン: cannot be Normal Summoned',cannotNormalSummonS03(dbOf(x.cn))===true,'');
  const SEEN=[];const pick0=pick;pick=function(){SEEN.push(cands());return pick0();};
  PREFER=[uid(x.m1),uid(x.m2)];runSummonProcedure(CNN,0,'hand',0);if(!gameState.pendingSummon&&!pc()&&z(x.cn)==='hand')finishSummonProcedure(CNN,0,'hand',0,'atk');drive();PREFER=[];pick=pick0;
  const ids=SEEN[0]||[];
  ok('カノン: the first choice offers the two Machine monsters (not the ワイト) and the 「decide」 entry',ids.indexOf(x.m1.uid)>=0&&ids.indexOf(x.m2.uid)>=0&&ids.indexOf(x.w.uid)<0&&ids.indexOf('done')>=0,JSON.stringify(SEEN));
  ok('カノン: two Machine monsters sent → Special Summoned with ATK 0 + 2 × 800 = 1600 (DEF 2200)',z(x.cn)==='mz'&&z(x.m1)==='grave'&&z(x.m2)==='grave'&&z(x.w)==='hand'&&curATK(C(x.cn))===1600&&curDEF(C(x.cn))===2200,JSON.stringify({cn:z(x.cn),atk:curATK(C(x.cn)),w:z(x.w)}));
  audit('カノン ①'); }
{ const x=cannonHand();runCannon([uid(x.m1),'done']);
  ok('カノン: one Machine monster sent, then 「decide」 → ATK 800; the other stays in the hand',z(x.cn)==='mz'&&z(x.m1)==='grave'&&z(x.m2)==='hand'&&curATK(C(x.cn))===800,JSON.stringify({cn:z(x.cn),m2:z(x.m2),atk:curATK(C(x.cn))})); }
{ const x=cannonHand();runCannon(['done']);
  ok('カノン: any number includes zero → Special Summoned with ATK 0, nothing discarded',z(x.cn)==='mz'&&z(x.m1)==='hand'&&z(x.m2)==='hand'&&curATK(C(x.cn))===0,JSON.stringify({cn:z(x.cn),atk:curATK(C(x.cn))}));
  audit('カノン ②'); }

/* ===== 古代の機械合成獣 (Lv6: one Tribute) ===== */
function chimera(a){fresh();const ma=mk(a,0,'up'),ch=mk(CHI,0);ma.summonedTurn=3;gameState.players[0].mz=[ma];gameState.players[0].hand=[ch];baselineA();
  PREFER=[uid(ma)];doNormalSummon(0,'atk');drive();PREFER=[];return ch;}
{ const ch=chimera('グリーン・ガジェット');
  ok('合成獣: Tribute Summoned by releasing Green Gadget',z(ch)==='mz',z(ch));
  ok('合成獣 (グリーン): ATK 2300 + 300 = 2600',curATK(C(ch))===2600,String(curATK(C(ch))));
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,ch,'direct');
  ok('合成獣 (グリーン): a direct attack deals 2600 only (no Red bonus)',l1-lp(1)===2600,JSON.stringify({loss:l1-lp(1)}));
  audit('合成獣 ①'); }
{ const ch=chimera('レッド・ガジェット');
  ok('合成獣 (レッド): no ATK bonus (2300)',curATK(C(ch))===2300,String(curATK(C(ch))));
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,ch,'direct');
  ok('合成獣 (レッド): a direct attack → 2300 + 500 damage (8000 → 5200)',l1-lp(1)===2800,JSON.stringify({loss:l1-lp(1)}));
  audit('合成獣 ②'); }
{ const ch=chimera('レッド・ガジェット');
  const foe=mon('ワイト',1);gameState.players[1].mz=[foe];baselineA();
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,ch,foe);
  ok('合成獣 (レッド) negative: a battle with a monster is not a direct attack → only the battle damage 2000',z(foe)==='grave'&&l1-lp(1)===2000,JSON.stringify({foe:z(foe),loss:l1-lp(1)})); }
{ const ch=chimera('イエロー・ガジェット');
  const foe=mon('ワイト',1);gameState.players[1].mz=[foe];baselineA();
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,ch,foe);
  ok('合成獣 (イエロー): destroys ワイト (300) by battle → 2000 battle damage + 700',z(foe)==='grave'&&l1-lp(1)===2700,JSON.stringify({foe:z(foe),loss:l1-lp(1)})); }
{ const ch=chimera('ワイト');
  ok('合成獣 negative: released ワイト → no bonus ATK',curATK(C(ch))===2300,String(curATK(C(ch))));
  endTurn();endTurn();phase('battle');const l1=lp(1);atkTarget(0,ch,'direct');
  ok('合成獣 negative: a direct attack deals only the battle damage (2300)',l1-lp(1)===2300,JSON.stringify({loss:l1-lp(1)})); }

/* ===== 古代の採掘機 ===== */
{ fresh();const gear=mon('古代の機械兵士',0),dig=mk(DIG,0),w=mk('ワイト',0),bh=mk('ブラック・ホール',0);
  gameState.players[0].mz=[gear];gameState.players[0].hand=[dig,w];gameState.players[0].deck=[mk('ワイト',0),bh,mk('ワイト',0)];baselineA();
  PREFER=[uid(w),uid(bh)];duelActivateFromHand(0);drive();PREFER=[];
  ok('採掘機: the hand card discarded (cost), the Spell chosen from the Deck is Set face-down',z(w)==='grave'&&z(bh)==='sz'&&C(bh).face==='down',JSON.stringify({w:z(w),bh:z(bh),face:C(bh)&&C(bh).face}));
  const acts=()=>getLegalZoneActions(0,'sz',idx2(bh)).map(a=>a.id);
  function idx2(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
  ok('採掘機: the Set Spell cannot be activated this turn',acts().indexOf('activateSet')<0,JSON.stringify(acts()));
  audit('採掘機 ①');
  endTurn();endTurn();
  ok('採掘機: it can be activated on a later turn',acts().indexOf('activateSet')>=0,JSON.stringify(acts())); }
{ fresh();const gear=mon('古代の機械兵士',0),dig=mk(DIG,0),w=mk('ワイト',0),nv=mk('王家の眠る谷－ネクロバレー',0),old=mk('歯車街',0);
  gameState.players[0].mz=[gear];gameState.players[0].field=old;gameState.players[0].hand=[dig,w];gameState.players[0].deck=[mk('ワイト',0),nv];baselineA();
  PREFER=[uid(w),uid(nv)];duelActivateFromHand(0);drive();PREFER=[];
  ok('採掘機: a Field Spell can be Set and replaces the face-up one (sent to the Graveyard)',z(nv)==='field'&&C(nv).face==='down'&&z(old)==='grave',JSON.stringify({nv:z(nv),old:z(old)}));
  audit('採掘機 ②'); }
{ fresh();const dig=mk(DIG,0),w=mk('ワイト',0);gameState.players[0].mz=[mon('ワイト',0)];gameState.players[0].hand=[dig,w];gameState.players[0].deck=[mk('ブラック・ホール',0)];baselineA();
  duelActivateFromHand(0);drive();
  ok('採掘機 negative: no 「アンティーク・ギア」 monster on my field → cannot be activated',z(dig)==='hand',z(dig)); }
{ fresh();const dig=mk(DIG,0);gameState.players[0].mz=[mon('古代の機械兵士',0)];gameState.players[0].hand=[dig];gameState.players[0].deck=[mk('ブラック・ホール',0)];baselineA();
  duelActivateFromHand(0);drive();
  ok('採掘機 negative: no other card to discard → cannot be activated',z(dig)==='hand',z(dig)); }
{ fresh();const dig=mk(DIG,0),w=mk('ワイト',0);gameState.players[0].mz=[mon('古代の機械兵士',0)];gameState.players[0].hand=[dig,w];baselineA();
  duelActivateFromHand(0);drive();
  ok('採掘機 negative: no Spell Card in the Deck → cannot be activated',z(dig)==='hand'&&z(w)==='hand',JSON.stringify({dig:z(dig),w:z(w)})); }

console.log('U337 done');
`);
