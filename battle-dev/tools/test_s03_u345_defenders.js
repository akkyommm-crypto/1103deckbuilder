/* S03-U345: デッド・ガードナー, カードブロッカー, シャトルロイド, ロックストーン・ウォリアー, 魔力吸収球体, 傀儡虫, クリボン.
   Real DUEL paths (attack declarations aimed at my monsters, redirects, banish-and-return, a chain response from the field, a hand ignition), Replay-audited. */
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


const DEA='デッド・ガードナー',BLK='カードブロッカー',SHU='シャトルロイド',ROC='ロックストーン・ウォリアー',SPH='魔力吸収球体',PUP='傀儡虫',KUR='クリボン';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
/* the opponent (player 1) attacks; everything is answered by the event driver (optional triggers are taken in order) or by PREFER */
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}

/* ===== デッド・ガードナー ===== */
{ fresh();const d=mon(DEA,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);d.pos='def';gameState.players[0].mz=[d,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);foeAttack(f,w);
  ok('デッド・ガードナー: the attack on ワイト was moved to it (Defense 1900 < 3000: destroyed, no battle damage); ワイト untouched',z(d)==='grave'&&z(w)==='mz'&&lp(0)===l0,JSON.stringify({d:z(d),w:z(w),loss:l0-lp(0)}));
  ok('デッド・ガードナー: destroyed → the opponent\'s monster loses 1000 ATK until the End Phase (3000 → 2000)',curATK(C(f))===2000,String(curATK(C(f))));
  audit('デッドガードナー ①');
  endTurn();ok('デッド・ガードナー: back to 3000',curATK(C(f))===3000,String(curATK(C(f)))); }
{ fresh();const d=mon(DEA,0),f=mon('青眼の白龍',1);d.pos='def';gameState.players[0].mz=[d];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,d);
  ok('デッド・ガードナー: attacked directly (no other monster): destroyed, the ATK drop still applies',z(d)==='grave'&&curATK(C(f))===2000,JSON.stringify({d:z(d),atk:curATK(C(f))})); }
{ fresh();const w=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,w);
  ok('デッド・ガードナー control: without it the attacked ワイト is destroyed',z(w)==='grave',z(w)); }

/* ===== カードブロッカー ===== */
{ fresh();const b=mk(BLK,0);gameState.players[0].hand=[b];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('カードブロッカー: Normal Summoned → Defense Position',z(b)==='mz'&&C(b).pos==='def',JSON.stringify({z:z(b),pos:C(b)&&C(b).pos}));
  audit('ブロッカー ①'); }
{ fresh();const b=mon(BLK,0),w=mon('ワイト',0),f=mon('青眼の白龍',1);b.pos='def';gameState.players[0].mz=[b,w];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,w);
  ok('カードブロッカー: the attack on ワイト moved to it',z(w)==='mz'&&(z(b)==='grave'||lp(0)===8000),JSON.stringify({w:z(w),b:z(b)})); }
{ fresh();const b=mon(BLK,0),f=mon('ライトロード・ウォリアー ガロス',1);b.pos='def';gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const d0=gameState.players[0].deck.length;PREFER=['3'];foeAttack(f,b);PREFER=[];
  ok('カードブロッカー: attacked → the top 3 cards of my Deck sent to the Graveyard, DEF 400 + 1500 = 1900 beats ガロス (1850): it survives',gameState.players[0].deck.length===d0-3&&z(b)==='mz',JSON.stringify({d:[d0,gameState.players[0].deck.length],b:z(b)}));
  audit('ブロッカー ②'); }
{ fresh();const b=mon(BLK,0),f=mon('ライトロード・ウォリアー ガロス',1);b.pos='def';gameState.players[0].mz=[b];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const d0=gameState.players[0].deck.length;PREFER=['0'];foeAttack(f,b);PREFER=[];
  ok('カードブロッカー: 「send none」 → DEF 400 only, destroyed by ガロス (1850), Deck unchanged',gameState.players[0].deck.length===d0&&z(b)==='grave',JSON.stringify({d:[d0,gameState.players[0].deck.length],b:z(b)})); }

/* ===== シャトルロイド ===== */
{ fresh();const s=mon(SHU,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[s];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,s);
  ok('シャトルロイド: selected as an attack target → banished (no battle)',z(s)==='banish'&&lp(0)===8000,JSON.stringify({s:z(s),lp0:lp(0)}));
  ok('シャトルロイド: the attack is a Replay (the target is gone) — the attacker cancels it',!!gameState.pendingAttack&&typeof battleReplayCancelV28==='function','');
  battleReplayCancelV28();drive();
  audit('シャトルロイド ①');
  const l1=lp(1);endTurn();
  ok('シャトルロイド: back on my field at my next Standby Phase, and the opponent takes 1000',z(s)==='mz'&&pl(s)===0&&l1-lp(1)===1000,JSON.stringify({s:z(s),loss:l1-lp(1)}));
  audit('シャトルロイド ②'); }

/* ===== ロックストーン・ウォリアー ===== */
{ fresh();const r=mon(ROC,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,r,f);
  const toks=gameState.players[0].mz.filter(c=>cardName(c)==='ロックストーン・トークン');
  ok('ロックストーン・ウォリアー: it attacked 青眼 and was destroyed → two ロックストーン・トークン; no battle damage to me',z(r)==='grave'&&toks.length===2&&lp(0)===8000,JSON.stringify({r:z(r),n:toks.length,lp0:lp(0)}));
  const other=mk('ブラック・マジシャン',0);const cand=tributeCandidates(0,dbOf(other)).map(x=>x.card.uid);
  ok('ロックストーン・ウォリアー: the tokens cannot be released for an Advance Summon',toks.every(t=>cand.indexOf(t.uid)<0),JSON.stringify(cand));
  audit('ロックストーン ①'); }
{ fresh();const r=mon(ROC,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[r];gameState.players[1].mz=[f];baselineA();
  toOppBattle();foeAttack(f,r);
  ok('ロックストーン・ウォリアー negative: destroyed while defending → no token; still no battle damage',z(r)==='grave'&&gameState.players[0].mz.length===0&&lp(0)===8000,JSON.stringify({r:z(r),n:gameState.players[0].mz.length,lp0:lp(0)})); }

/* ===== 魔力吸収球体 ===== */
{ fresh();const sp=mon(SPH,0),bh=mk('ブラック・ホール',1);gameState.activePlayer=1;gameState.players[0].mz=[sp];gameState.players[1].hand=[bh];baselineA();
  duelActivateFromHand(0);for(let i=0;i<4&&pc();i++)pick();
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(0):[];
  ok('魔力吸収球体: offered against the opponent\'s Spell Card activation in their turn',resp.some(x=>x.card===sp),JSON.stringify(resp.map(x=>x.db.n)));
  duelActivateResponseV2(0,'mz',0);drive();
  ok('魔力吸収球体: released (cost), ブラック・ホール negated and destroyed',z(sp)==='grave'&&z(bh)==='grave',JSON.stringify({sp:z(sp),bh:z(bh)}));
  audit('球体 ①'); }
{ fresh();const sp=mon(SPH,0),bh=mk('ブラック・ホール',0);gameState.players[0].mz=[sp];gameState.players[0].hand=[bh];baselineA();
  duelActivateFromHand(0);drive();
  ok('魔力吸収球体 negative: my own Spell (my turn) → not answered; it is destroyed with everything else',z(sp)==='grave'&&z(bh)==='grave',JSON.stringify({sp:z(sp),bh:z(bh)})); }

/* ===== 傀儡虫 ===== */
{ fresh();const p=mk(PUP,0),w=mon('ワイト',1),f=mon('青眼の白龍',1);gameState.players[0].hand=[p];gameState.players[1].mz=[w,f];baselineA();
  PREFER=[uid(w)];duelActivateFromHand(0);drive();PREFER=[];
  ok('傀儡虫: discarded as the cost; the Undead ワイト is now under my control (the Dragon cannot be chosen)',z(p)==='grave'&&z(w)==='mz'&&pl(w)===0&&pl(f)===1,JSON.stringify({p:z(p),w:pl(w),f:pl(f)}));
  audit('傀儡虫 ①');
  phase('end');
  ok('傀儡虫: back to the opponent at the End Phase',pl(w)===1,String(pl(w))); }
{ fresh();const p=mk(PUP,0),f=mon('青眼の白龍',1);gameState.players[0].hand=[p];gameState.players[1].mz=[f];baselineA();
  duelActivateFromHand(0);drive();
  ok('傀儡虫 negative: no Fiend / Zombie monster on the opponent\'s field → cannot be activated',z(p)==='hand',z(p)); }

/* ===== クリボン ===== */
{ fresh();const k=mon(KUR,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[k];gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0),l1=lp(1);foeAttack(f,k);
  ok('クリボン: attacked at damage calculation → it returned to my hand, I took no battle damage and the opponent recovered 3000',z(k)==='hand'&&lp(0)===l0&&lp(1)===l1+3000,JSON.stringify({k:z(k),lp0:lp(0),gain:lp(1)-l1}));
  audit('クリボン ①'); }

console.log('U345 done');
`);
