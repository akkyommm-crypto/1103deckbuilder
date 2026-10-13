/* S03-U335: five 「D－HERO」 monsters — D－HERO ダイハードガイ, D－HERO ダガーガイ, D－HERO ダッシュガイ, D－HERO ドゥームガイ, D－HERO ドグマガイ.
   Real DUEL paths (battles, Standby Phase schedules, the draw, hand quick effect, hand procedure), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3350001;
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
const DIE='D－HERO ダイハードガイ',DAG='D－HERO ダガーガイ',DASH='D－HERO ダッシュガイ',DOOM='D－HERO ドゥームガイ',DOGMA='D－HERO ドグマガイ';

/* ===== ダイハードガイ: another D－HERO destroyed by battle → revived at my next Standby Phase ===== */
{ fresh();const d=mon(DIE,0),dash=mon(DASH,0),foe=mon('青眼の白龍',1);gameState.players[0].mz=[d,dash];gameState.players[1].mz=[foe];baselineA();
  phase('battle');atkTarget(0,dash,foe);
  ok('ダイハードガイ: ダッシュガイ (2100) attacked 青眼 (3000) and was destroyed by battle',z(dash)==='grave'&&z(d)==='mz',JSON.stringify({dash:z(dash),d:z(d)}));
  endTurn();
  ok('ダイハードガイ: still in the Graveyard during the opponent\'s Standby Phase',z(dash)==='grave',z(dash));
  endTurn();
  ok('ダイハードガイ: revived (face-up Attack) at my next Standby Phase',z(dash)==='mz'&&pl(dash)===0&&C(dash).face==='up'&&C(dash).pos==='atk',JSON.stringify({z:z(dash),p:pl(dash)}));
  audit('ダイハードガイ ①'); }
{ fresh();const d=mon(DIE,0),dash=mon(DASH,0),foe=mon('青眼の白龍',1);gameState.players[0].mz=[d,dash];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();atkTarget(1,foe,dash);
  ok('ダイハードガイ (opponent\'s battle): ダッシュガイ destroyed',z(dash)==='grave',z(dash));
  endTurn();
  ok('ダイハードガイ (opponent\'s battle): revived at my next Standby Phase',z(dash)==='mz'&&pl(dash)===0,JSON.stringify({z:z(dash)}));
  audit('ダイハードガイ ②'); }
{ fresh();const d=mon(DIE,0),foe=mon('青眼の白龍',1);gameState.players[0].mz=[d];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();atkTarget(1,foe,d);endTurn();endTurn();
  ok('ダイハードガイ negative: itself destroyed by battle → not revived',z(d)==='grave',z(d)); }
{ fresh();const d=mon(DIE,0),w=mon('ワイト',0),foe=mon('青眼の白龍',1);gameState.players[0].mz=[d,w];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();atkTarget(1,foe,w);endTurn();
  ok('ダイハードガイ negative: a monster that is not a 「D－HERO」 destroyed by battle → not revived',z(w)==='grave',z(w)); }
{ fresh();const d=mon(DIE,0),dash=mon(DASH,0),bh=mk('ブラック・ホール',0);gameState.players[0].hand=[bh];gameState.players[0].mz=[d,dash];baselineA();
  duelActivateFromHand(0);drive();endTurn();endTurn();
  ok('ダイハードガイ negative: destroyed by an effect (not by battle) → not revived',z(dash)==='grave'&&z(d)==='grave',JSON.stringify({dash:z(dash),d:z(d)})); }
{ fresh();const d=mon(DIE,0),dash=mon(DASH,0),dash2=mon(DASH,0),foe=mon('青眼の白龍',1),foe2=mon('青眼の白龍',1);gameState.players[0].mz=[d,dash,dash2];gameState.players[1].mz=[foe,foe2];baselineA();
  toOppBattle();atkTarget(1,foe,dash);atkTarget(1,foe2,dash2);
  ok('ダイハードガイ once per turn: two 「D－HERO」 destroyed by battle in the same turn',z(dash)==='grave'&&z(dash2)==='grave',JSON.stringify({dash:z(dash),dash2:z(dash2)}));
  endTurn();
  const back=[dash,dash2].filter(c=>z(c)==='mz').length;
  ok('ダイハードガイ once per turn: only one of the two is revived',back===1,String(back)); }

/* ===== ダガーガイ: discard in the opponent's Battle Phase → every 「D－HERO」 +800 until the End Phase ===== */
/* the opponent (player 1) attacks with its first monster; at the attack declaration player 0 responds with the card at hand index 0 (if offered) */
function foeAttackRespond(att,target,respond){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<200;k++){const w=gameState.processorWaiting;
    if(respond&&!done&&gameState.pendingAttack&&w&&w.type==='POINT'&&gameState.processorPaused){pointActivateV27(0,'hand',0,0);done=true;continue;}
    const r=drive();if(r==='idle')break;}
  drive();return done;}
{ fresh();const dag=mk(DAG,0),dash=mon(DASH,0),w=mon('ワイト',0),foe=mon('ブラック・マジシャン',1);gameState.players[0].hand=[dag];gameState.players[0].mz=[dash,w];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();const a0=curATK(C(dash)),w0=curATK(C(w));foeAttackRespond(foe,dash,true);
  ok('ダガーガイ: discarded from the hand at the attack declaration; ダッシュガイ 2100 + 800 = 2900 beats ブラック・マジシャン (2500)',z(dag)==='grave'&&z(dash)==='mz'&&z(foe)==='grave'&&curATK(C(dash))===a0+800&&curATK(C(w))===w0,JSON.stringify({dag:z(dag),dash:z(dash),foe:z(foe),a:curATK(C(dash)),a0,w:curATK(C(w))}));
  audit('ダガーガイ ①');
  endTurn();
  ok('ダガーガイ: back to the normal ATK after the End Phase',curATK(C(dash))===a0,String(curATK(C(dash)))); }
{ fresh();const dag=mk(DAG,0),dash=mon(DASH,0),w=mon('ワイト',0),foe=mon('ブラック・マジシャン',1);gameState.players[0].hand=[dag];gameState.players[0].mz=[dash,w];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();foeAttackRespond(foe,dash,false);
  ok('ダガーガイ control: without it ダッシュガイ (2100) loses to ブラック・マジシャン (2500)',z(dash)==='grave'&&z(dag)==='hand',JSON.stringify({dash:z(dash),dag:z(dag)})); }
{ fresh();const dag=mk(DAG,0),dash=mon(DASH,0),foe=mon('ワイト',1,'def');gameState.players[0].hand=[dag];gameState.players[0].mz=[dash];gameState.players[1].mz=[foe];baselineA();
  phase('battle');
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(dash),target:idx(foe)});let offered=false;
  for(let k=0;k<200;k++){const w=gameState.processorWaiting;
    if(!offered&&gameState.pendingAttack&&w&&w.type==='POINT'&&gameState.processorPaused){offered=true;try{pointActivateV27(0,'hand',0,0);}catch(e){}continue;}
    if(drive()==='idle')break;}
  ok('ダガーガイ negative: in my own Battle Phase → cannot be activated',z(dag)==='hand',z(dag)); }
{ fresh();const dag=mk(DAG,0),dash=mon(DASH,0),foe=mon('ワイト',1);gameState.players[0].hand=[dag];gameState.players[0].mz=[dash];gameState.players[1].mz=[foe];baselineA();
  endTurn();const a0=curATK(C(dash));duelActivateFromHand(0);drive();
  ok('ダガーガイ negative: in the opponent\'s Main Phase (not the Battle Phase) → cannot be activated',z(dag)==='hand'&&curATK(C(dash))===a0,JSON.stringify({dag:z(dag)})); }

/* ===== ダッシュガイ ===== */
{ fresh();const dash=mon(DASH,0),w=mon('ワイト',0);gameState.players[0].mz=[dash,w];baselineA();
  const a0=curATK(C(dash));ok('ダッシュガイ: the effect is offered',canZ(dash)===true,'');
  PREFER=[uid(w)];actZ(dash);PREFER=[];
  ok('ダッシュガイ: released the chosen monster (the cost) → ATK +1000',z(w)==='grave'&&curATK(C(dash))===a0+1000,JSON.stringify({w:z(w),a:curATK(C(dash)),a0}));
  ok('ダッシュガイ once per turn: not offered again',canZ(dash)===false,'');
  audit('ダッシュガイ ①');
  endTurn();ok('ダッシュガイ: ATK back to normal after the End Phase',curATK(C(dash))===a0,String(curATK(C(dash)))); }
{ fresh();const dash=mon(DASH,0);gameState.players[0].mz=[dash];baselineA();
  PREFER=[uid(dash)];actZ(dash);PREFER=[];
  ok('ダッシュガイ: with itself as the only monster it can release itself (cost), and nothing more happens',z(dash)==='grave',z(dash)); }
{ fresh();const dash=mon(DASH,0),f=mon('ワイト',1,'def');gameState.players[0].mz=[dash];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,dash,f);phase('main2');
  ok('ダッシュガイ: attacked → Defense Position at the end of the Battle Phase',z(dash)==='mz'&&C(dash).pos==='def',C(dash).pos); }
{ fresh();const dash=mon(DASH,0),f=mon('ワイト',1,'def');gameState.players[0].mz=[dash];gameState.players[1].mz=[f];baselineA();
  phase('battle');phase('main2');
  ok('ダッシュガイ negative: did not attack → stays in Attack Position',C(dash).pos==='atk',C(dash).pos); }
{ fresh();const dash=mk(DASH,0);dash.face='up';gameState.phase='draw';gameState.drawnThisTurn=false;const top=mk('ワイト',0);
  gameState.players[0].grave=[dash];gameState.players[0].deck=[top,mk('ワイト',0),mk('ワイト',0)];baselineA();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
  ok('ダッシュガイ (Graveyard): the drawn card is a monster → shown and Special Summoned',z(top)==='mz'&&pl(top)===0&&C(top).face==='up',JSON.stringify({top:z(top)}));
  ok('ダッシュガイ (Graveyard): the hand stays empty (the drawn monster left it)',gameState.players[0].hand.length===0,String(gameState.players[0].hand.length));
  audit('ダッシュガイ ②');
  phase('standby');phase('main1');endTurn();endTurn();
  ok('ダッシュガイ (Graveyard): only once while it stays in the Graveyard → the draw of my next turn (a monster) stays in the hand',gameState.activePlayer===0&&gameState.players[0].mz.length===1&&gameState.players[0].hand.length===1&&z(dash)==='grave',JSON.stringify({mz:gameState.players[0].mz.length,hand:gameState.players[0].hand.length,ap:gameState.activePlayer,turn:gameState.turn})); }
{ fresh();const dash=mk(DASH,0);dash.face='up';gameState.phase='draw';gameState.drawnThisTurn=false;const sp=mk('サイクロン',0);
  gameState.players[0].grave=[dash];gameState.players[0].deck=[sp,mk('ワイト',0),mk('ワイト',0)];baselineA();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
  ok('ダッシュガイ (Graveyard) negative: the drawn card is a Spell → stays in the hand',z(sp)==='hand'&&gameState.players[0].mz.length===0,JSON.stringify({sp:z(sp)})); }
{ fresh();gameState.phase='draw';gameState.drawnThisTurn=false;const top=mk('ワイト',0);
  gameState.players[0].deck=[top,mk('ワイト',0)];baselineA();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
  ok('ダッシュガイ negative: not in the Graveyard → the drawn monster stays in the hand',z(top)==='hand',z(top)); }

/* ===== ドゥームガイ: destroyed by battle → at my next Standby Phase a 「D－HERO」 from my Graveyard (not ドゥームガイ) ===== */
{ fresh();const doom=mon(DOOM,0),gy=mk(DASH,0),gyd=mk(DOOM,0),foe=mon('青眼の白龍',1);gy.face='up';gyd.face='up';gameState.players[0].mz=[doom];gameState.players[0].grave=[gy,gyd];gameState.players[1].mz=[foe];baselineA();
  phase('battle');atkTarget(0,doom,foe);
  ok('ドゥームガイ: destroyed by battle',z(doom)==='grave',z(doom));
  endTurn();ok('ドゥームガイ: nothing is Special Summoned in the opponent\'s Standby Phase',z(gy)==='grave',z(gy));
  PREFER=[uid(gy)];endTurn();PREFER=[];
  ok('ドゥームガイ: at my next Standby Phase the chosen 「D－HERO」 is Special Summoned (the other ドゥームガイ is not a candidate)',z(gy)==='mz'&&pl(gy)===0&&z(gyd)==='grave'&&z(doom)==='grave',JSON.stringify({gy:z(gy),gyd:z(gyd),doom:z(doom)}));
  audit('ドゥームガイ ①'); }
{ fresh();const doom=mon(DOOM,0),gyd=mk(DOOM,0),foe=mon('青眼の白龍',1);gyd.face='up';gameState.players[0].mz=[doom];gameState.players[0].grave=[gyd];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();atkTarget(1,foe,doom);endTurn();
  ok('ドゥームガイ (opponent\'s battle) negative: no 「D－HERO」 other than ドゥームガイ in the Graveyard → nothing happens',z(gyd)==='grave'&&z(doom)==='grave'&&gameState.players[0].mz.length===0,JSON.stringify({gyd:z(gyd)})); }
{ fresh();const doom=mon(DOOM,0),gy=mk(DASH,0),bh=mk('ブラック・ホール',0);gy.face='up';gameState.players[0].hand=[bh];gameState.players[0].mz=[doom];gameState.players[0].grave=[gy];baselineA();
  duelActivateFromHand(0);drive();endTurn();endTurn();
  ok('ドゥームガイ negative: destroyed by an effect → nothing is Special Summoned',z(doom)==='grave'&&z(gy)==='grave',JSON.stringify({doom:z(doom),gy:z(gy)})); }
{ fresh();const doom=mon(DOOM,0),gy=mk(DASH,0),foe=mon('青眼の白龍',1);gy.face='up';gameState.players[0].mz=[doom];gameState.players[0].grave=[gy];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();atkTarget(1,foe,doom);
  PREFER=[uid(gy)];endTurn();PREFER=[];
  ok('ドゥームガイ (opponent\'s battle): revives at my next Standby Phase',z(gy)==='mz'&&pl(gy)===0,JSON.stringify({gy:z(gy)}));
  audit('ドゥームガイ ②'); }

/* ===== ドグマガイ: hand procedure (release three monsters including a 「D－HERO」) → halve the opponent's LP at their next Standby Phase ===== */
{ fresh();const dg=mk(DOGMA,0),dash=mon(DASH,0),w1=mon('ワイト',0),w2=mon('ワイト',0);gameState.players[0].hand=[dg];gameState.players[0].mz=[dash,w1,w2];baselineA();
  ok('ドグマガイ: the procedure is legal (three monsters including a 「D－HERO」)',procOk(DOGMA,0)===true,'');
  procRun(DOGMA,0);
  ok('ドグマガイ: Special Summoned, the three monsters released',z(dg)==='mz'&&[dash,w1,w2].every(m=>z(m)==='grave'),JSON.stringify({dg:z(dg),m:[dash,w1,w2].map(z)}));
  ok('ドグマガイ: the opponent\'s LP is not halved yet (my turn)',lp(1)===8000,String(lp(1)));
  endTurn();
  ok('ドグマガイ: halved at the opponent\'s next Standby Phase (8000 → 4000)',lp(1)===4000&&lp(0)===8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
  audit('ドグマガイ ①');
  endTurn();endTurn();
  ok('ドグマガイ: only once',lp(1)===4000,String(lp(1))); }
{ fresh();const dg=mk(DOGMA,0),w1=mon('ワイト',0),w2=mon('ワイト',0),w3=mon('ワイト',0);gameState.players[0].hand=[dg];gameState.players[0].mz=[w1,w2,w3];baselineA();
  ok('ドグマガイ negative: three monsters but no 「D－HERO」 → not legal',procOk(DOGMA,0)===false,''); }
{ fresh();const dg=mk(DOGMA,0),dash=mon(DASH,0),w1=mon('ワイト',0);gameState.players[0].hand=[dg];gameState.players[0].mz=[dash,w1];baselineA();
  ok('ドグマガイ negative: only two monsters → not legal',procOk(DOGMA,0)===false,''); }
{ fresh();const dg=mk(DOGMA,0);gameState.players[0].hand=[dg];baselineA();
  ok('ドグマガイ negative: cannot be Normal Summoned',cannotNormalSummonS03(dbOf(dg))===true,''); }
{ fresh();const dg=mk(DOGMA,0);gameState.players[0].hand=[dg];baselineA();
  API.specialSummon(0,'hand',0,'atk','test');drive();endTurn();
  ok('ドグマガイ negative: Special Summoned by another effect → not halved',z(dg)==='mz'&&lp(1)===8000,JSON.stringify({dg:z(dg),lp1:lp(1)})); }

console.log('U335 done');
`);
