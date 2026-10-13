/* S03-U339: ブラック・マジシャンズ・ナイト, サイバー・バリア・ドラゴン, サイバー・レーザー・ドラゴン, ブラック・バック, 氷結界のロイヤル・ナイト, ヴァイロン・マター.
   Real DUEL paths (the enabling cards are used for the restricted monsters; attack-declaration response, ignition effect, a Normal Summon through the tribute path, three-card Graveyard target), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3390001;
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


const KNI='ブラック・マジシャンズ・ナイト',BAR='サイバー・バリア・ドラゴン',LAS='サイバー・レーザー・ドラゴン',BBK='ブラック・バック',ROY='氷結界のロイヤル・ナイト',MAT='ヴァイロン・マター';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
/* the opponent (player 1) attacks with its first monster; at the declaration player 0 responds with the card at (zone, index) when respond is given */
function foeAttack(att,target,respond){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<200;k++){const w=gameState.processorWaiting;
    if(respond&&!done&&gameState.pendingAttack&&w&&w.type==='POINT'&&gameState.processorPaused){try{pointActivateV27(0,respond[0],respond[1],0);}catch(e){}done=true;continue;}
    if(drive()==='idle')break;}
  drive();return done;}

/* ===== ブラック・マジシャンズ・ナイト ===== */
{ fresh();const bm=mon('ブラック・マジシャン',0),ti=mk('騎士の称号',0),kn=mk(KNI,0),foe=mon('青眼の白龍',1);
  gameState.players[0].mz=[bm];gameState.players[0].hand=[ti,kn];gameState.players[1].mz=[foe];baselineA();
  ok('ナイト: cannot be Normal Summoned',cannotNormalSummonS03(dbOf(kn))===true,'');
  PREFER=[uid(bm),uid(foe)];duelActivateFromHand(0);drive();PREFER=[];
  ok('ナイト: Special Summoned by 騎士の称号 (ブラック・マジシャン released)',z(kn)==='mz'&&z(bm)==='grave'&&z(ti)==='grave',JSON.stringify({kn:z(kn),bm:z(bm)}));
  ok('ナイト: on its Special Summon the chosen card of the field (青眼) is destroyed',z(foe)==='grave',z(foe));
  audit('ナイト ①'); }

/* ===== サイバー・バリア・ドラゴン ===== */
{ fresh();const ba=mon(BAR,0),w=mon('ワイト',0),f1=mon('青眼の白龍',1),f2=mon('青眼の白龍',1);gameState.players[0].mz=[ba,w];gameState.players[1].mz=[f1,f2];baselineA();
  ok('バリア: cannot be Normal Summoned',cannotNormalSummonS03(dbOf(ba))===true,'');
  toOppBattle();const lp0=lp(0);const r=foeAttack(f1,w,['mz',idx(ba)]);
  ok('バリア: the attack of 青眼 on the ワイト is negated (no damage, ワイト survives)',z(w)==='mz'&&lp(0)===lp0,JSON.stringify({r,w:z(w),loss:lp0-lp(0)}));
  const r2=foeAttack(f2,w,['mz',idx(ba)]);
  ok('バリア: only once per turn — the second attack is not negated (ワイト destroyed)',z(w)==='grave',JSON.stringify({r2,w:z(w)}));
  audit('バリア ①'); }
{ fresh();const ba=mon(BAR,0),w=mon('ワイト',0),f1=mon('青眼の白龍',1);ba.pos='def';gameState.players[0].mz=[ba,w];gameState.players[1].mz=[f1];baselineA();
  toOppBattle();foeAttack(f1,w,['mz',idx(ba)]);
  ok('バリア negative: in Defense Position it does not negate the attack (ワイト destroyed)',z(w)==='grave',z(w)); }
{ fresh();const w=mon('ワイト',0),f1=mon('青眼の白龍',1);gameState.players[0].mz=[w];gameState.players[1].mz=[f1];baselineA();
  toOppBattle();foeAttack(f1,w,null);
  ok('バリア control: without it the ワイト is destroyed',z(w)==='grave',z(w)); }

/* ===== サイバー・レーザー・ドラゴン ===== */
{ fresh();const la=mon(LAS,0),sm=mon('ワイト',0),hi=mon('青眼の白龍',1),dfs=mon('スーパーバグマン',1),lo=mon('ワイト',1);gameState.players[0].mz=[la,sm];gameState.players[1].mz=[hi,dfs,lo];baselineA();
  ok('レーザー: cannot be Normal Summoned',cannotNormalSummonS03(dbOf(la))===true,'');
  ok('レーザー: available (青眼 ATK 3000 ≥ 2400)',canZ(la)===true,'');
  const SEEN=[];const pick0=pick;pick=function(){SEEN.push(pc().candidates.map(c=>c.uid||(c.card&&c.card.uid)));return pick0();};
  PREFER=[uid(dfs)];actZ(la);PREFER=[];pick=pick0;
  ok('レーザー: destroyed the monster whose DEF (3000) ≥ its ATK; the 青眼 and the DEF-3000 are candidates, the ワイト / my ワイト are not',z(dfs)==='grave'&&z(hi)==='mz'&&SEEN.some(s=>s.indexOf(hi.uid)>=0&&s.indexOf(dfs.uid)>=0&&s.indexOf(lo.uid)<0&&s.indexOf(sm.uid)<0),JSON.stringify({dfs:z(dfs),SEEN}));
  ok('レーザー: once per turn',canZ(la)===false,'');
  audit('レーザー ①'); }
{ fresh();const la=mon(LAS,0),lo=mon('ワイト',1);gameState.players[0].mz=[la];gameState.players[1].mz=[lo];baselineA();
  ok('レーザー negative: no monster with ATK or DEF ≥ 2400 → not available',canZ(la)===false,''); }

/* ===== ブラック・バック ===== */
{ fresh();const bb=mk(BBK,0),g1=mk('BF－疾風のゲイル',0),g2=mk('BF－漆黒のエルフェン',0),w=mk('ワイト',0);
  gameState.players[0].hand=[bb,w];gameState.players[0].grave=[g1,g2];baselineA();
  const SEEN=[];const pick0=pick;pick=function(){SEEN.push(pc().candidates.map(c=>c.uid||(c.card&&c.card.uid)));return pick0();};
  PREFER=[uid(g1)];duelActivateFromHand(0);drive();PREFER=[];pick=pick0;
  ok('ブラック・バック: Special Summoned the 「BF」 with ATK ≤ 2000 (ゲイル); the ATK 2200 エルフェン was not a candidate',z(g1)==='mz'&&z(g2)==='grave'&&SEEN.some(s=>s.indexOf(g1.uid)>=0&&s.indexOf(g2.uid)<0),JSON.stringify({g1:z(g1),g2:z(g2),SEEN}));
  const ns=()=>getLegalHandActions(0,gameState.players[0].hand.indexOf(w)).map(a=>a.id).indexOf('normalSummon')>=0;
  ok('ブラック・バック: no Normal Summon this turn (the ワイト cannot be Normal Summoned)',ns()===false,JSON.stringify(getLegalHandActions(0,gameState.players[0].hand.indexOf(w)).map(a=>a.id)));
  audit('ブラック・バック ①');
  endTurn();endTurn();
  ok('ブラック・バック: Normal Summon is possible again on a later turn',ns()===true,'');
  { fresh();const bb2=mk(BBK,0),g=mk('BF－疾風のゲイル',0),w2=mk('ワイト',0);gameState.players[0].hand=[bb2,w2];gameState.players[0].grave=[g];baselineA();
    const ns2=()=>getLegalHandActions(0,gameState.players[0].hand.indexOf(w2)).map(a=>a.id).indexOf('normalSummon')>=0;
    ok('ブラック・バック control: before it is activated the ワイト can be Normal Summoned',ns2()===true,''); } }
{ fresh();const bb=mk(BBK,0),g2=mk('BF－漆黒のエルフェン',0);gameState.players[0].hand=[bb];gameState.players[0].grave=[g2];baselineA();
  duelActivateFromHand(0);drive();
  ok('ブラック・バック negative: only a 「BF」 with ATK 2200 in the Graveyard → cannot be activated',z(bb)==='hand'&&z(g2)==='grave',JSON.stringify({bb:z(bb)})); }
{ fresh();const bb=mk(BBK,0),g1=mk('BF－疾風のゲイル',0);gameState.players[0].hand=[bb];gameState.players[0].grave=[g1];baselineA();
  endTurn();duelActivateFromHand(0);drive();
  ok('ブラック・バック negative: not on my own turn → cannot be activated',z(bb)==='hand'&&z(g1)==='grave',JSON.stringify({bb:z(bb),g1:z(g1)})); }

/* ===== 氷結界のロイヤル・ナイト ===== */
{ fresh();const w=mon('ワイト',0),ro=mk(ROY,0);gameState.players[0].mz=[w];gameState.players[0].hand=[ro];baselineA();
  PREFER=[uid(w)];doNormalSummon(0,'atk');drive();PREFER=[];
  const tk=gameState.players[1].mz[0];
  ok('ロイヤル・ナイト: Advance Summoned (Lv5, one Tribute) → an アイスコフュントークン on the opponent\'s field in Attack Position',z(ro)==='mz'&&!!tk&&cardName(tk)==='アイスコフュントークン'&&tk.pos==='atk'&&curATK(tk)===1000&&curDEF(tk)===0,JSON.stringify({ro:z(ro),tk:tk&&cardName(tk),pos:tk&&tk.pos}));
  audit('ロイヤル・ナイト ①');
  const other=mk('ワイト',1);gameState.players[1].mz.push(other);
  const cand=tributeCandidates(1,dbOf(mk('ブラック・マジシャン',1))).map(x=>x.card.uid);
  ok('ロイヤル・ナイト: the token cannot be released for an Advance Summon (another monster can)',!!tk&&cand.indexOf(tk.uid)<0&&cand.indexOf(other.uid)>=0,JSON.stringify({cand,tk:tk&&tk.uid,other:other.uid})); }
{ fresh();const ro=mk(ROY,0);gameState.players[0].hand=[ro];baselineA();
  API.specialSummon(0,'hand',0,'atk','test');drive();
  ok('ロイヤル・ナイト negative: Special Summoned (not an Advance Summon) → no token',z(ro)==='mz'&&gameState.players[1].mz.length===0,JSON.stringify({n:gameState.players[1].mz.length})); }
{ fresh();const w=mon('ワイト',0),ro=mk(ROY,0);gameState.players[0].mz=[w];gameState.players[0].hand=[ro];gameState.players[1].mz=Array.from({length:5},()=>mon('ワイト',1));baselineA();
  PREFER=[uid(w)];doNormalSummon(0,'atk');drive();PREFER=[];
  ok('ロイヤル・ナイト negative: the opponent has no free Monster Zone → no token (nothing breaks)',z(ro)==='mz'&&gameState.players[1].mz.length===5,JSON.stringify({n:gameState.players[1].mz.length})); }

/* ===== ヴァイロン・マター ===== */
function matterBoard(){fresh();const ma=mk(MAT,0),g1=mk('デーモンの斧',0),g2=mk('団結の力',0),g3=mk('魔導師の力',0),ns=mk('ブラック・ホール',0);
  gameState.players[0].hand=[ma];gameState.players[0].grave=[g1,g2,g3,ns];return {ma,g1,g2,g3,ns};}
{ const x=matterBoard();baselineA();const d0=gameState.players[0].deck.length,h0=gameState.players[0].hand.length;
  PREFER=[uid(x.g1),uid(x.g2),uid(x.g3),'draw'];duelActivateFromHand(0);drive();PREFER=[];
  ok('マター: the three Equip Spells shuffled into the Deck (the other Spell stays in the Graveyard)',z(x.g1)==='deck'&&z(x.g2)==='deck'&&z(x.g3)==='deck'&&z(x.ns)==='grave'&&z(x.ma)==='grave',JSON.stringify({g:[x.g1,x.g2,x.g3].map(z),ns:z(x.ns)}));
  ok('マター: ●draw → 1 card drawn (Deck +3 −1)',gameState.players[0].hand.length===h0-1+1&&gameState.players[0].deck.length===d0+3-1,JSON.stringify({hand:gameState.players[0].hand.length,deck:gameState.players[0].deck.length,d0}));
  audit('マター ①'); }
{ const x=matterBoard();const tg=setCard('サイクロン',1);gameState.players[1].sz=[tg];baselineA();
  PREFER=[uid(x.g1),uid(x.g2),uid(x.g3),'destroy',uid(tg)];duelActivateFromHand(0);drive();PREFER=[];
  ok('マター: ●destroy → the chosen card of the opponent\'s field is destroyed',z(tg)==='grave'&&z(x.g1)==='deck',JSON.stringify({tg:z(tg)}));
  audit('マター ②'); }
{ fresh();const ma=mk(MAT,0),g1=mk('デーモンの斧',0),g2=mk('団結の力',0),ns=mk('ブラック・ホール',0);gameState.players[0].hand=[ma];gameState.players[0].grave=[g1,g2,ns];baselineA();
  duelActivateFromHand(0);drive();
  ok('マター negative: only two Equip Spells in the Graveyard (a normal Spell is not counted) → cannot be activated',z(ma)==='hand',z(ma)); }

console.log('U339 done');
`);
