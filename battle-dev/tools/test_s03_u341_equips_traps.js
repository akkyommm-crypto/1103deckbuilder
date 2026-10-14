/* S03-U341: 憎悪の棘, 竜殺しの剣, 閃光のイリュージョン, 早すぎた復活, 能力吸収コア, 魔導書整理.
   Real DUEL paths (equip battles, a linked continuous revival, lingering revival restrictions, a chain response to a monster effect, a Deck reorder), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3410001;
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


const THO='憎悪の棘',SLA='竜殺しの剣',ILL='閃光のイリュージョン',EAR='早すぎた復活',COR='能力吸収コア',MAG='魔導書整理';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalZ(p,zone,i){return getLegalZoneActions(p,zone,i).map(a=>a.id);}

/* ===== 憎悪の棘 ===== */
function thorn(foe,foePos){fresh();const pl=mon('キラー・トマト',0),eq=mk(THO,0),f=mon(foe,1,foePos);gameState.players[0].mz=[pl];gameState.players[0].hand=[eq];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);drive();return {pl,eq,f};}
{ const x=thorn('ジェムナイト・エメラル');
  ok('憎悪の棘: equipped to the Plant (キラー・トマト 1400 + 600 = 2000)',z(x.eq)==='sz'&&curATK(C(x.pl))===2000,JSON.stringify({eq:z(x.eq),atk:curATK(C(x.pl))}));
  phase('battle');const l1=lp(1);atkTarget(0,x.pl,x.f);
  ok('憎悪の棘: attacked エメラル (1800) → 200 battle damage but the opponent\'s monster is not destroyed by that battle',z(x.f)==='mz'&&z(x.pl)==='mz'&&l1-lp(1)===200,JSON.stringify({f:z(x.f),loss:l1-lp(1)}));
  ok('憎悪の棘: after the damage calculation the attacked monster loses 600 ATK and DEF (1800/800 → 1200/200)',curATK(C(x.f))===1200&&curDEF(C(x.f))===200,JSON.stringify({atk:curATK(C(x.f)),def:curDEF(C(x.f))}));
  audit('憎悪の棘 ①'); }
{ const x=thorn('ワイト','def');
  phase('battle');const l1=lp(1);atkTarget(0,x.pl,x.f);
  ok('憎悪の棘: piercing against a Defense Position ワイト (DEF 200): 2000 − 200 = 1800 damage; ワイト not destroyed',z(x.f)==='mz'&&l1-lp(1)===1800,JSON.stringify({f:z(x.f),loss:l1-lp(1)})); }
{ fresh();const w=mon('ワイト',0),eq=mk(THO,0);gameState.players[0].mz=[w];gameState.players[0].hand=[eq];baselineA();
  duelActivateFromHand(0);drive();
  ok('憎悪の棘 negative: only a non-Plant monster on the field → cannot be equipped',z(eq)==='hand',z(eq)); }
{ fresh();const pl=mon('キラー・トマト',0),f=mon('ジェムナイト・エメラル',1);gameState.players[0].mz=[pl];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,pl,f);
  ok('憎悪の棘 control: without it キラー・トマト (1400) loses to エメラル (1800)',z(pl)==='grave'&&z(f)==='mz',JSON.stringify({pl:z(pl),f:z(f)})); }

/* ===== 竜殺しの剣 ===== */
function slayer(foe){fresh();const wr=mon('ライトロード・ウォリアー ガロス',0),eq=mk(SLA,0),f=mon(foe,1);gameState.players[0].mz=[wr];gameState.players[0].hand=[eq];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);drive();return {wr,eq,f};}
{ const x=slayer('エレメント・ドラゴン');const a0=dbOf(C(x.wr)).atk;
  ok('竜殺しの剣: equipped to the Warrior (ATK +700)',z(x.eq)==='sz'&&curATK(C(x.wr))===a0+700,JSON.stringify({eq:z(x.eq),atk:curATK(C(x.wr)),a0})); }
{ fresh();const wr=mon('ライトロード・ウォリアー ガロス',0),eq=mk(SLA,0),f=mon('ガード・オブ・フレムベル',1,'def');
  gameState.players[0].mz=[wr];gameState.players[0].hand=[eq];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);drive();
  const atk=curATK(C(wr));
  /* make the battle not destroy it: the Dragon's DEF is raised above the host's ATK with a +1000 DEF modifier (a modifier is an Action) */
  API.modAtk(findCardByUid(f.uid),0,1000,'endTurn','test');drive();
  phase('battle');atkTarget(0,wr,f);
  ok('竜殺しの剣: the Dragon (DEF 3000 > ATK '+atk+') survives the battle…',z(f)==='mz',z(f));
  phase('main2');
  ok('竜殺しの剣: …and is destroyed at the end of the Battle Phase',z(f)==='grave',z(f));
  audit('竜殺しの剣 ②'); }
{ fresh();const wr=mon('ライトロード・ウォリアー ガロス',0),eq=mk(SLA,0),f=mon('ブラック・マジシャン',1,'def');
  gameState.players[0].mz=[wr];gameState.players[0].hand=[eq];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);drive();
  API.modAtk(findCardByUid(f.uid),0,3000,'endTurn','test');drive();
  phase('battle');atkTarget(0,wr,f);phase('main2');
  ok('竜殺しの剣 negative: a non-Dragon monster that fought it is not destroyed at the Battle Phase end',z(f)==='mz',z(f)); }
{ fresh();const w=mon('ワイト',0),eq=mk(SLA,0);gameState.players[0].mz=[w];gameState.players[0].hand=[eq];baselineA();
  duelActivateFromHand(0);drive();
  ok('竜殺しの剣 negative: a non-Warrior cannot be equipped',z(eq)==='hand',z(eq)); }

/* ===== 閃光のイリュージョン ===== */
function illusion(extraHand){fresh();const il=setCard(ILL,0),lord=mk('ライトロード・ウォリアー ガロス',0);gameState.players[0].sz=[il];gameState.players[0].grave=[lord];if(extraHand)gameState.players[0].hand=extraHand();baselineA();
  PREFER=[uid(lord)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];return {il,lord};}
{ const x=illusion();
  ok('イリュージョン: the 「ライトロード」 revived face-up Attack, the card stays on the field',z(x.lord)==='mz'&&C(x.lord).pos==='atk'&&z(x.il)==='sz'&&C(x.il).face==='up',JSON.stringify({lord:z(x.lord),il:z(x.il)}));
  const d0=gameState.players[0].deck.length;phase('end');
  ok('イリュージョン: at my End Phase the top 2 cards of the Deck go to the Graveyard',gameState.players[0].deck.length===d0-2,JSON.stringify({d0,d1:gameState.players[0].deck.length}));
  audit('イリュージョン ①'); }
{ const x=illusion(()=>[mk('ブラック・ホール',0)]);const bh=gameState.players[0].hand[0];
  duelActivateFromHand(0);drive();
  ok('イリュージョン: the monster destroyed → this card is destroyed too',z(x.lord)==='grave'&&z(x.il)==='grave',JSON.stringify({lord:z(x.lord),il:z(x.il)}));
  audit('イリュージョン ②'); }
{ const x=illusion(()=>[mk('サイクロン',0)]);const cy=gameState.players[0].hand[0];
  PREFER=[uid(x.il)];duelActivateFromHand(0);drive();PREFER=[];
  ok('イリュージョン: this card destroyed → the monster is destroyed too',z(x.il)==='grave'&&z(x.lord)==='grave',JSON.stringify({lord:z(x.lord),il:z(x.il)}));
  audit('イリュージョン ③'); }
{ fresh();const il=setCard(ILL,0),w=mk('ワイト',0);gameState.players[0].sz=[il];gameState.players[0].grave=[w];baselineA();
  ok('イリュージョン negative: no 「ライトロード」 in the Graveyard → not activatable',legalZ(0,'sz',0).indexOf('activateSet')<0,JSON.stringify(legalZ(0,'sz',0))); }

/* ===== 早すぎた復活 ===== */
{ fresh();const tr=setCard(EAR,0),ck=mk('地縛神 Ccarayhua',0),f=mon('ワイト',1);gameState.players[0].field=mk('歯車街',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[ck];gameState.players[1].mz=[f];baselineA();
  PREFER=[uid(ck)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('早すぎた復活: the 「地縛神」 (Ccarayhua) Special Summoned from my Graveyard',z(ck)==='mz'&&C(ck).face==='up',JSON.stringify({ck:z(ck)}));
  phase('battle');const l1=lp(1);atkTarget(0,ck,'direct');
  ok('早すぎた復活: it cannot declare an attack this turn (no damage)',lp(1)===l1&&z(f)==='mz',JSON.stringify({loss:l1-lp(1)}));
  audit('早すぎた復活 ①');
  endTurn();endTurn();phase('battle');const l2=lp(1);atkTarget(0,ck,f);
  ok('早すぎた復活: on a later turn it attacks, destroys the monster, but the opponent takes no battle damage',z(f)==='grave'&&lp(1)===l2,JSON.stringify({f:z(f),loss:l2-lp(1)})); }
{ fresh();const tr=setCard(EAR,0),w=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[w];baselineA();
  ok('早すぎた復活 negative: no 「地縛神」 in the Graveyard → not activatable',legalZ(0,'sz',0).indexOf('activateSet')<0,JSON.stringify(legalZ(0,'sz',0))); }

/* ===== 能力吸収コア ===== */
function coreBoard(withCore){fresh();const co=mon('コアキメイル・クルセイダー',0),tr=setCard(COR,0),dash=mon('D－HERO ダッシュガイ',1),fw=mon('ワイト',1);gameState.activePlayer=1;
  gameState.players[0].mz=[co];gameState.players[0].sz=[tr];if(withCore)gameState.players[0].grave=[mk('コアキメイルの鋼核',0)];gameState.players[1].mz=[dash,fw];baselineA();return {co,tr,dash,fw};}
{ const x=coreBoard(true);
  PREFER=[uid(x.fw)];duelActivateFromZone(1,'mz',idx(x.dash));for(let i=0;i<6&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('能力吸収コア: offered against the opponent\'s monster effect (ダッシュガイ)',resp.some(x2=>x2.card===x.tr),JSON.stringify(resp.map(r=>r.db.n)));
  duelActivateResponseV2(0,'sz',0);drive();
  ok('能力吸収コア: the activation negated and ダッシュガイ destroyed (its cost was paid: the ワイト released)',z(x.dash)==='grave'&&z(x.tr)==='grave'&&curATK(C(x.dash)||x.dash)!==3100,JSON.stringify({dash:z(x.dash),tr:z(x.tr),fw:z(x.fw)}));
  audit('能力吸収コア ①'); }
{ const x=coreBoard(false);
  PREFER=[uid(x.fw)];duelActivateFromZone(1,'mz',idx(x.dash));for(let i=0;i<6&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('能力吸収コア negative: no コアキメイルの鋼核 in my Graveyard → not offered',!resp.some(x2=>x2.card===x.tr),JSON.stringify(resp.map(r=>r.db.n))); drive(); }
{ fresh();const co=mon('ワイト',0),tr=setCard(COR,0),dash=mon('D－HERO ダッシュガイ',1),fw=mon('ワイト',1);gameState.activePlayer=1;
  gameState.players[0].mz=[co];gameState.players[0].sz=[tr];gameState.players[0].grave=[mk('コアキメイルの鋼核',0)];gameState.players[1].mz=[dash,fw];baselineA();
  PREFER=[uid(fw)];duelActivateFromZone(1,'mz',idx(dash));for(let i=0;i<6&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('能力吸収コア negative: no 「コアキメイル」 monster on my field → not offered',!resp.some(x2=>x2.card===tr),JSON.stringify(resp.map(r=>r.db.n))); drive(); }

/* ===== 魔導書整理 ===== */
{ fresh();const mg=mk(MAG,0),a=mk('ワイト',0),b=mk('青眼の白龍',0),c=mk('ブラック・ホール',0);
  gameState.players[0].hand=[mg];gameState.players[0].deck=[a,b,c,mk('ワイト',0),mk('ワイト',0)];baselineA();
  PREFER=[uid(c),uid(a)];duelActivateFromHand(0);drive();PREFER=[];
  const top=gameState.players[0].deck.slice(0,3).map(x=>x.uid);
  ok('魔導書整理: the top three cards returned in the chosen order (ブラック・ホール, ワイト, 青眼)',JSON.stringify(top)===JSON.stringify([c.uid,a.uid,b.uid])&&gameState.players[0].deck.length===5,JSON.stringify({top,want:[c.uid,a.uid,b.uid],n:gameState.players[0].deck.length}));
  audit('魔導書整理 ①'); }
{ fresh();const mg=mk(MAG,0);gameState.players[0].hand=[mg];gameState.players[0].deck=[];baselineA();
  duelActivateFromHand(0);drive();
  ok('魔導書整理 negative: empty Deck → cannot be activated',z(mg)==='hand',z(mg)); }

console.log('U341 done');
`);
