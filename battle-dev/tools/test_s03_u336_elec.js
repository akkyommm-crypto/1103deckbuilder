/* S03-U336: five 「エレキ」 cards — エレキツネ, エレキャンセル, エレキリギリス, エレキリム, エレキンモグラ.
   Real DUEL paths (battles, the summon-negation window, chain responses, targeting, a real Synchro Summon, the Standby Phase schedule), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3360001;
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


const FOX='エレキツネ',CAN='エレキャンセル',GRA='エレキリギリス',RIM='エレキリム',MOG='エレキンモグラ';
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function lockWhy(p,c){return activationTypeLockReasonS03(p,c,'hand',dbOf(c));}
function tgts(c){return battleTargetsV29(c.uid).targets.map(x=>x.card.uid);}
function direct0(c){return battleTargetsV29(c.uid).direct;}

/* ===== エレキツネ: destroyed by the opponent → this turn the opponent cannot Special Summon nor activate Spell / Trap / monster effects ===== */
{ fresh();const fox=mon(FOX,0),w=mon('ワイト',0),foe=mon('青眼の白龍',1),bh=mk('ブラック・ホール',1),imp=mk('ライオウ',1);
  gameState.players[0].mz=[fox,w];gameState.players[1].mz=[foe];gameState.players[1].hand=[bh,imp];baselineA();
  ok('エレキツネ control: before it is destroyed the opponent is not locked',lockWhy(1,bh)===''&&!v46GlobalSpecialSummonRestrictionReason(1),lockWhy(1,bh));
  toOppBattle();atkTarget(1,foe,fox);
  ok('エレキツネ: destroyed by battle (青眼 3000 vs 800)',z(fox)==='grave'&&pl(fox)===0,z(fox));
  ok('エレキツネ: the opponent cannot activate the Spell (ブラック・ホール) nor the monster effect (ライオウ) this turn',lockWhy(1,bh)!==''&&lockWhy(1,imp)!=='',JSON.stringify({s:lockWhy(1,bh),m:lockWhy(1,imp)}));
  ok('エレキツネ: the opponent cannot Special Summon this turn',!!v46GlobalSpecialSummonRestrictionReason(1),String(v46GlobalSpecialSummonRestrictionReason(1)));
  phase('main2');duelActivateFromHand(0);drive();
  ok('エレキツネ: really not activatable (the Spell stays in the hand, nothing destroyed)',z(bh)==='hand'&&z(w)==='mz'&&z(foe)==='mz',JSON.stringify({bh:z(bh),w:z(w)}));
  audit('エレキツネ ①');
  endTurn();
  ok('エレキツネ: the lock ends with the turn',lockWhy(1,bh)===''&&!v46GlobalSpecialSummonRestrictionReason(1),String(lockWhy(1,bh))); }
{ fresh();const fox=mon(FOX,0),bh=mk('ブラック・ホール',0),cy=mk('ライオウ',1);
  gameState.players[0].hand=[bh];gameState.players[0].mz=[fox];gameState.players[1].hand=[cy];baselineA();
  duelActivateFromHand(0);drive();
  ok('エレキツネ negative: destroyed by my own Black Hole (not by the opponent) → the opponent is not locked',z(fox)==='grave'&&lockWhy(1,cy)===''&&!v46GlobalSpecialSummonRestrictionReason(1),JSON.stringify({fox:z(fox),why:lockWhy(1,cy)})); }

/* ===== エレキャンセル: discard a 「エレキ」 monster → negate and destroy the opponent's summon ===== */
{ fresh();const w=mk('ワイト',0),ek=mk(FOX,1),can=setCard(CAN,1);gameState.players[0].hand=[w];gameState.players[1].hand=[ek];gameState.players[1].sz=[can];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('エレキャンセル: the summon-negation window offers it to the opponent',neg.some(x=>x.card===can&&x.p===1),JSON.stringify(neg.map(x=>[x.db.n,x.p])));
  activateSummonNegatorV2(1,'sz',0);drive();
  ok('エレキャンセル: the 「エレキ」 monster was discarded (cost), the Normal Summon negated and the monster destroyed',z(ek)==='grave'&&z(w)==='grave'&&z(can)==='grave'&&!gameState.pendingSummon,JSON.stringify({ek:z(ek),w:z(w),can:z(can)}));
  audit('エレキャンセル ①'); }
{ fresh();const w=mk('ワイト',0),can=setCard(CAN,1);gameState.players[0].hand=[w];gameState.players[1].hand=[mk('ワイト',1)];gameState.players[1].sz=[can];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('エレキャンセル negative: no 「エレキ」 monster in the hand (a ワイト only) → not offered',!neg.some(x=>x.card===can),JSON.stringify(neg.map(x=>x.db.n))); drive(); }
{ fresh();const w=mk('ワイト',0),ek=mk(FOX,0),can=setCard(CAN,0);gameState.players[0].hand=[w,ek];gameState.players[0].sz=[can];baselineA();
  doNormalSummon(0,'atk');
  const neg=gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon):[];
  ok('エレキャンセル negative: my own summon → not offered',!neg.some(x=>x.card===can),JSON.stringify(neg.map(x=>x.db.n))); drive(); }
{ fresh();const rev=mk('死者蘇生',0),gy=mk('青眼の白龍',0),ek=mk(FOX,1),can=setCard(CAN,1);
  gameState.players[0].hand=[rev];gameState.players[0].grave=[gy];gameState.players[1].hand=[ek];gameState.players[1].sz=[can];baselineA();
  PREFER=[uid(gy)];duelActivateFromHand(0);
  for(let i=0;i<10&&pc();i++)pick();PREFER=[];
  const resp=gameState.chainWindow&&gameState.chain.length?getChainResponsesV2(1):[];
  ok('エレキャンセル: offered against 死者蘇生 (a Special Summon effect)',resp.some(x=>x.card===can),JSON.stringify(resp.map(x=>x.db.n)));
  duelActivateResponseV2(1,'sz',0);drive();
  ok('エレキャンセル: 死者蘇生 negated, 青眼 stays in the Graveyard; the 「エレキ」 monster discarded',z(gy)==='grave'&&z(ek)==='grave'&&z(rev)==='grave',JSON.stringify({gy:z(gy),ek:z(ek),rev:z(rev)}));
  audit('エレキャンセル ②'); }

/* ===== エレキリギリス: other face-up 「エレキ」 monsters can be neither attacked nor targeted by the opponent ===== */
{ fresh();const gra=mon(GRA,0),el=mon('エレキタリス',0),w=mon('ワイト',0),foe=mon('青眼の白龍',1);gameState.players[0].mz=[gra,el,w];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();const t=tgts(foe);
  ok('エレキリギリス: the opponent can attack ワイト and エレキリギリス itself, but not the other 「エレキ」 monster',t.indexOf(w.uid)>=0&&t.indexOf(gra.uid)>=0&&t.indexOf(el.uid)<0,JSON.stringify({t,el:el.uid})); }
{ fresh();const gra=mon(GRA,0),el=mon('エレキタリス',0),w=mon('ワイト',0);el.face='down';el.pos='def';const foe=mon('青眼の白龍',1);gameState.players[0].mz=[gra,el,w];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();
  ok('エレキリギリス: a face-down 「エレキ」 monster is not covered (face-up only)',tgts(foe).indexOf(el.uid)>=0,JSON.stringify(tgts(foe))); }
{ fresh();const el=mon('エレキタリス',0),w=mon('ワイト',0),foe=mon('青眼の白龍',1);gameState.players[0].mz=[el,w];gameState.players[1].mz=[foe];baselineA();
  toOppBattle();
  ok('エレキリギリス negative (control): without it the 「エレキ」 monster can be attacked',tgts(foe).indexOf(el.uid)>=0,JSON.stringify(tgts(foe))); }
{ fresh();const gra=mon(GRA,0),el=mon('エレキタリス',0),w=mon('ワイト',0);gameState.players[0].mz=[gra,el,w];baselineA();
  const cands=API.fieldCards({player:0,zone:'mz'});
  p3BeginEffectContextV3(1);const byOpp=filterTargetable(cands,1).map(x=>x.card.uid);p3EndEffectContextV3();
  p3BeginEffectContextV3(0);const byMe=filterTargetable(cands,0).map(x=>x.card.uid);p3EndEffectContextV3();
  ok('エレキリギリス: as the opponent\'s effect target the other 「エレキ」 monster is removed (リギリス itself and ワイト stay)',byOpp.indexOf(el.uid)<0&&byOpp.indexOf(gra.uid)>=0&&byOpp.indexOf(w.uid)>=0,JSON.stringify(byOpp));
  ok('エレキリギリス: my own effects may still target it',byMe.indexOf(el.uid)>=0,JSON.stringify(byMe)); }
{ fresh();const gra=mon(GRA,0),el=mon('エレキタリス',0),w=mon('ワイト',0),ec=mk('エネミーコントローラー',1);gameState.players[0].mz=[gra,el,w];gameState.players[1].hand=[ec];gameState.activePlayer=1;baselineA();
  duelActivateFromHand(0);
  for(let i=0;i<4&&pc()&&!(pc().candidates||[]).some(x=>x.uid===w.uid||(x.card&&x.card.uid===w.uid));i++){const q0=pc(),j=q0.candidates.findIndex(x=>x.value===true||x.key==='yes'||x.label==='はい');__choicePickV49(j>=0?j:0);}
  const q=pc(),ids=q?q.candidates.map(x=>x.uid||(x.card&&x.card.uid)):[];
  ok('エレキリギリス: a real targeting Spell of the opponent (エネミーコントローラー) offers ワイト and リギリス but not the other 「エレキ」 monster',!!q&&ids.indexOf(w.uid)>=0&&ids.indexOf(gra.uid)>=0&&ids.indexOf(el.uid)<0,JSON.stringify({q:!!q,ids,el:el.uid,w:w.uid,title:q&&q.title,c:q&&q.candidates.map(x=>x.label)})); drive(); }

/* ===== エレキリム: Synchro (「エレキ」 Tuner + non-Tuner Thunder), direct attack, banish a Deck card, back to the hand at the 2nd Standby Phase ===== */
function synchroRim(tun,non){fresh();const t=mon(tun,0),n=mon(non,0),rim=mk(RIM,0);gameState.players[0].mz=[t,n];gameState.players[0].ex=[rim];baselineA();
  const P=gameState.players[0];doExSummon(0,0,[P.mz.indexOf(t),P.mz.indexOf(n)],'synchro','atk');drive();return {t,n,rim};}
{ const x=synchroRim(FOX,'サンダー・ドラゴン');
  ok('エレキリム: Synchro Summoned with エレキツネ (Lv2 Tuner) + サンダー・ドラゴン (Lv5 Thunder)',z(x.rim)==='mz'&&x.rim.specialSummonKind==='synchro',JSON.stringify({z:z(x.rim)}));
  const rim=x.rim;rim.summonedTurn=3;const target=mk('ブラック・ホール',0);gameState.players[0].deck.unshift(target);
  gameState.players[1].mz=[mon('青眼の白龍',1)];baselineA();
  ok('エレキリム: direct attack granted while the opponent has a monster',direct0(rim)===true,JSON.stringify(battleTargetsV29(rim.uid)).slice(0,120));
  const l1=lp(1);PREFER=[uid(target)];phase('battle');atkTarget(0,rim,'direct');PREFER=[];
  ok('エレキリム: direct attack → 1500 damage and the chosen Deck card is banished',l1-lp(1)===1500&&z(target)==='banish',JSON.stringify({loss:l1-lp(1),t:z(target)}));
  audit('エレキリム ①');
  endTurn();endTurn();
  ok('エレキリム: still banished at my 1st Standby Phase after the activation',z(target)==='banish',z(target));
  endTurn();endTurn();
  ok('エレキリム: added to the hand at my 2nd Standby Phase',z(target)==='hand'&&pl(target)===0,JSON.stringify({z:z(target)}));
  audit('エレキリム ②'); }
{ fresh();const t=mon('BF－銀盾のミストラル',0),n=mon('サンダー・ドラゴン',0),rim=mk(RIM,0);gameState.players[0].mz=[t,n];gameState.players[0].ex=[rim];baselineA();
  const P=gameState.players[0];doExSummon(0,0,[P.mz.indexOf(t),P.mz.indexOf(n)],'synchro','atk');drive();
  ok('エレキリム negative: with a Tuner that is not a 「エレキ」 monster the Synchro Summon is refused',z(rim)==='ex',z(rim)); }
{ fresh();const t=mon(FOX,0),n=mon('ワイト',0),rim=mk(RIM,0);gameState.players[0].mz=[t,n];gameState.players[0].ex=[rim];baselineA();
  const P=gameState.players[0];doExSummon(0,0,[P.mz.indexOf(t),P.mz.indexOf(n)],'synchro','atk');drive();
  ok('エレキリム negative: with a non-Thunder non-Tuner the Synchro Summon is refused',z(rim)==='ex',z(rim)); }

/* ===== エレキンモグラ: two attacks per Battle Phase; a face-down Defense Position monster is destroyed without damage calculation ===== */
{ fresh();const mog=mon(MOG,0),f1=mon('スケルエンジェル',1,'def'),f2=mon('スケルエンジェル',1,'def'),f3=mon('スケルエンジェル',1,'def');f1.face='down';f2.face='down';f3.face='down';
  gameState.players[0].mz=[mog];gameState.players[1].mz=[f1,f2,f3];baselineA();const h0=gameState.players[1].hand.length;
  phase('battle');atkTarget(0,mog,f1);
  ok('エレキンモグラ: the face-down monster is destroyed (the Flip effect of スケルエンジェル did not draw)',z(f1)==='grave'&&gameState.players[1].hand.length===h0&&lp(0)===8000,JSON.stringify({f1:z(f1),h:gameState.players[1].hand.length,lp0:lp(0)}));
  atkTarget(0,mog,f2);
  ok('エレキンモグラ: a second attack in the same Battle Phase destroys the next one',z(f2)==='grave'&&z(f3)==='mz',JSON.stringify({f2:z(f2),f3:z(f3)}));
  atkTarget(0,mog,f3);
  ok('エレキンモグラ: no third attack',z(f3)==='mz',z(f3));
  audit('エレキンモグラ ①'); }
{ fresh();const mog=mon(MOG,0),f=mon('ワイト',1,'def');gameState.players[0].mz=[mog];gameState.players[1].mz=[f];baselineA();
  phase('battle');atkTarget(0,mog,f);
  ok('エレキンモグラ negative: a face-up Defense Position monster is not destroyed (ATK 0 vs DEF 200: 200 damage to me)',z(f)==='mz'&&lp(0)===7800,JSON.stringify({f:z(f),lp0:lp(0)})); }

console.log('U336 done');
`);
