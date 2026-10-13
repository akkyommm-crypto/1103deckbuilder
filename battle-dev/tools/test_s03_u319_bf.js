/* S03-U319: 「BF」 — そよ風のブリーズ, 逆風のガスト, 追い風のアリゼ, 二の太刀のエテジア, 天狗風のヒレン. Real DUEL paths (battles, hand procedures, Synchro Summon, quick-effect windows), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3190001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function doSynchro(mats){const P=gameState.players[0];doExSummon(0,0,mats.map(m=>P.mz.indexOf(m)),'synchro','atk');drive();}
function procOk(name,i){return strictSummonProcedureLegality(name,0,'hand',i).ok;}
function procRun(name,i){runSummonProcedure(name,0,'hand',i);if(!gameState.pendingSummon&&!pc())finishSummonProcedure(name,0,'hand',i,'atk');drive();}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<400;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    break;}
  return done;}

/* ===== ブリーズ: added from the Deck by a card effect → Special Summon from the hand; Synchro Material only for 「BF」 Synchro Monsters ===== */
{ fresh();gameState.phase='battle';const cr=mon('クリッター',0),be=mon('青眼の白龍',1),br=mk('BF－そよ風のブリーズ',0);
  gameState.players[0].mz=[cr];gameState.players[1].mz=[be];gameState.players[0].deck=[mk('ワイト',0),br,mk('ワイト',0)];baselineA();
  PREFER=[uid(br)];atkTarget(0,cr,be);PREFER=[];
  ok('ブリーズ: searched by クリッター (a card effect) → it Special Summons itself from the hand',z(cr)==='grave'&&z(br)==='mz'&&C(br).face==='up',JSON.stringify({cr:z(cr),br:z(br)}));
  audit('ブリーズ ①'); }
{ fresh();gameState.phase='draw';gameState.drawnThisTurn=false;const br=mk('BF－そよ風のブリーズ',0);gameState.players[0].deck=[br,mk('ワイト',0)];baselineA();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
  ok('ブリーズ negative: drawn by the normal draw (not added by a card effect) → stays in the hand',z(br)==='hand',z(br)); }
{ fresh();const br=mon('BF－そよ風のブリーズ',0),ko=mon('ガスタ・コドル',0),gd=mon('ガスタ・ガルド',0),ar=mon('BF－二の太刀のエテジア',0);
  const gy=mk('大地の騎士ガイアナイト',0),aw=mk('BF－アームズ・ウィング',0);gameState.players[0].ex=[gy,aw];gameState.players[0].mz=[br,ko,gd,ar];baselineA();
  const nonBf=exCombos(0,dbOf(gy)).combos.map(c=>c.materials.slice().sort().join()), bf=exCombos(0,dbOf(aw)).combos.map(c=>c.materials.slice().sort().join());
  const i=x=>gameState.players[0].mz.indexOf(x);
  ok('ブリーズ: not usable for a non-「BF」 Synchro Monster (大地の騎士ガイアナイト) — the other Lv3 Tuner ガルド still is',nonBf.indexOf([i(br),i(ko)].sort().join())<0&&nonBf.indexOf([i(gd),i(ko)].sort().join())>=0,JSON.stringify({nonBf,i:[i(br),i(ko),i(gd)]}));
  ok('ブリーズ: usable for a 「BF」 Synchro Monster (アームズ・ウィング) with エテジア (Lv3 non-Tuner)',bf.indexOf([i(br),i(ar)].sort().join())>=0,JSON.stringify(bf)); }

/* ===== ガスト: Special Summon from the hand when I control no card; the attacker of my 「BF」 loses 300 ATK during the Damage Step ===== */
{ fresh();const ga=mk('BF－逆風のガスト',0);gameState.players[0].hand=[ga];baselineA();
  ok('ガスト: with no card on my field the Special Summon procedure is legal',procOk('BF－逆風のガスト',0)===true,'');
  procRun('BF－逆風のガスト',0);
  ok('ガスト: Special Summoned',z(ga)==='mz'&&C(ga).face==='up',z(ga));
  audit('ガスト ①'); }
{ fresh();const ga=mk('BF－逆風のガスト',0);gameState.players[0].hand=[ga];gameState.players[0].sz=[mk('サイクロン',0,'down')];baselineA();
  ok('ガスト negative: a Set Spell/Trap on my field → not legal',procOk('BF－逆風のガスト',0)===false,''); }
{ fresh();const ga=mk('BF－逆風のガスト',0);gameState.players[0].hand=[ga];gameState.players[0].mz=[mon('ワイト',0)];baselineA();
  ok('ガスト negative: a monster on my field → not legal',procOk('BF－逆風のガスト',0)===false,''); }
/* the reduction: 青眼の白龍 (3000) attacks my BF ガスト (900): damage 3000-300-900 = 1800; against my non-BF ワイト (300): 2700 */
{ fresh();const ga=mon('BF－逆風のガスト',0),be=mon('青眼の白龍',1);gameState.players[0].mz=[ga];gameState.players[1].mz=[be];baselineA();
  toOppBattle();const l0=lp(0);atkTarget(1,be,ga);
  ok('ガスト: the attacker has -300 ATK in the Damage Step: battle damage 1800 (not 2100)',l0-lp(0)===1800&&z(ga)==='grave',JSON.stringify({loss:l0-lp(0),ga:z(ga)}));
  audit('ガスト reduction'); }
{ fresh();const ga=mon('BF－逆風のガスト',0),wy=mon('ワイト',0),be=mon('青眼の白龍',1);gameState.players[0].mz=[ga,wy];gameState.players[1].mz=[be];baselineA();
  toOppBattle();const l0=lp(0);atkTarget(1,be,wy);
  ok('ガスト negative: an attack on a non-「BF」 is not reduced (3000-300 = 2700)',l0-lp(0)===2700,JSON.stringify({loss:l0-lp(0)})); }
{ fresh();const ga=mon('BF－逆風のガスト',0),be=mon('青眼の白龍',1);gameState.players[0].mz=[ga];gameState.players[1].mz=[be];baselineA();
  toOppBattle();atkTarget(1,be,'direct');
  ok('ガスト negative: after the battle 青眼 is back to 3000 ATK',curATK(C(be))===3000,String(curATK(C(be)))); }

/* ===== アリゼ: Special Summon from the hand in a turn in which two or more of my 「BF」 were destroyed; +600 LP as Synchro Material ===== */
{ fresh();const b1=mon('BF－二の太刀のエテジア',0),b2=mon('BF－銀盾のミストラル',0),al=mk('BF－追い風のアリゼ',0),bh=mk('ブラック・ホール',0);
  gameState.players[0].mz=[b1,b2];gameState.players[0].hand=[bh,al];baselineA();
  ok('アリゼ: before any destruction the procedure is not legal',procOk('BF－追い風のアリゼ',1)===false,'');
  const bhI=gameState.players[0].hand.indexOf(bh);duelActivateFromHand(bhI);drive();
  ok('アリゼ: ブラック・ホール destroyed both 「BF」',z(b1)==='grave'&&z(b2)==='grave',JSON.stringify({b1:z(b1),b2:z(b2)}));
  const ai=gameState.players[0].hand.indexOf(al);
  ok('アリゼ: two 「BF」 destroyed this turn → the procedure is legal',procOk('BF－追い風のアリゼ',ai)===true,'');
  procRun('BF－追い風のアリゼ',ai);
  ok('アリゼ: Special Summoned',z(al)==='mz',z(al));
  audit('アリゼ ①'); }
{ fresh();const b1=mon('BF－二の太刀のエテジア',0),w1=mon('ワイト',0),al=mk('BF－追い風のアリゼ',0),bh=mk('ブラック・ホール',0);
  gameState.players[0].mz=[b1,w1];gameState.players[0].hand=[bh,al];baselineA();
  duelActivateFromHand(gameState.players[0].hand.indexOf(bh));drive();
  ok('アリゼ negative: only one 「BF」 (and a non-BF) destroyed → not legal',z(b1)==='grave'&&procOk('BF－追い風のアリゼ',gameState.players[0].hand.indexOf(al))===false,''); }
{ fresh();const w1=mon('ワイト',0),w2=mon('ワイト',0),al=mk('BF－追い風のアリゼ',0),bh=mk('ブラック・ホール',0);
  gameState.players[0].mz=[w1,w2];gameState.players[0].hand=[bh,al];baselineA();
  duelActivateFromHand(gameState.players[0].hand.indexOf(bh));drive();
  ok('アリゼ negative: two non-「BF」 destroyed → not legal',procOk('BF－追い風のアリゼ',gameState.players[0].hand.indexOf(al))===false,''); }
/* Synchro Material: ミストラル (BF Tuner Lv2) + アリゼ (Lv5) = アーマード・ウィング (Lv7) → +600 LP */
{ fresh();const mi=mon('BF－銀盾のミストラル',0),al=mon('BF－追い風のアリゼ',0),aw=mk('BF－アーマード・ウィング',0);gameState.players[0].ex=[aw];gameState.players[0].mz=[mi,al];baselineA();
  ok('アリゼ: precondition — ミストラル + アリゼ make Lv7',exCombos(0,dbOf(aw)).combos.length>=1,JSON.stringify(exCombos(0,dbOf(aw)).combos));
  const l0=lp(0);doSynchro([mi,al]);
  ok('アリゼ: used as Synchro Material → I recover 600 LP',z(aw)==='mz'&&z(al)==='grave'&&lp(0)===l0+600,JSON.stringify({aw:z(aw),al:z(al),lp:lp(0),was:l0}));
  audit('アリゼ ②'); }
{ fresh();const al=mon('BF－追い風のアリゼ',0),bh=mk('ブラック・ホール',0);gameState.players[0].mz=[al];gameState.players[0].hand=[bh];baselineA();
  const l0=lp(0);duelActivateFromHand(0);drive();
  ok('アリゼ negative: sent to the Graveyard by destruction (not as Synchro Material) → no recovery',z(al)==='grave'&&lp(0)===l0,JSON.stringify({al:z(al),lp:lp(0),was:l0})); }

/* ===== エテジア: end of the Damage Step, my 「BF」 battled an opponent monster that is still on the field → send from hand, 1000 damage ===== */
{ fresh();const ga=mon('BF－逆風のガスト',0),fo=mon('ガスタ・スクイレル',1,'def'),et=mk('BF－二の太刀のエテジア',0);
  gameState.players[0].mz=[ga];gameState.players[1].mz=[fo];gameState.players[0].hand=[et];baselineA();phase('battle');
  const l1=lp(1);const used=attackRespond(0,ga,fo,0,pl=>pl.kind==='damageStep'&&pl.step==='end','hand',0);
  ok('エテジア: offered and used at the end of the Damage Step: itself to the Graveyard, 1000 damage to the opponent',used&&z(et)==='grave'&&lp(1)===l1-1000&&z(fo)==='mz',JSON.stringify({used,et:z(et),lp1:lp(1),was:l1,fo:z(fo)}));
  audit('エテジア ①'); }
{ fresh();const ga=mon('BF－アームズ・ウィング',0),fo=mon('ワイト',1),et=mk('BF－二の太刀のエテジア',0);
  gameState.players[0].mz=[ga];gameState.players[1].mz=[fo];gameState.players[0].hand=[et];baselineA();phase('battle');
  const l1=lp(1);const used=attackRespond(0,ga,fo,0,pl=>pl.kind==='damageStep'&&pl.step==='end','hand',0);
  ok('エテジア negative: the opponent monster was destroyed in the battle (not on the field at the end) → not usable',!used&&z(et)==='hand'&&z(fo)==='grave',JSON.stringify({used,et:z(et),fo:z(fo)})); }
{ fresh();const wy=mon('ワイト',0),fo=mon('ガスタ・スクイレル',1,'def'),et=mk('BF－二の太刀のエテジア',0);
  gameState.players[0].mz=[wy];gameState.players[1].mz=[fo];gameState.players[0].hand=[et];baselineA();phase('battle');
  const used=attackRespond(0,wy,fo,0,pl=>pl.kind==='damageStep'&&pl.step==='end','hand',0);
  ok('エテジア negative: my battling monster is not a 「BF」 → not usable',!used&&z(et)==='hand',JSON.stringify({used,et:z(et)})); }
/* it also works when my 「BF」 is attacked (and survives) by a monster that survives too */
{ fresh();const ga=mon('BF－二の太刀のエテジア',0,'def'),fo=mon('ワイト',1),et=mk('BF－二の太刀のエテジア',0);
  gameState.players[0].mz=[ga];gameState.players[1].mz=[fo];gameState.players[0].hand=[et];baselineA();
  toOppBattle();const l1=lp(1);const used=attackRespond(1,fo,ga,0,pl=>pl.kind==='damageStep'&&pl.step==='end','hand',0);
  ok('エテジア: also when my 「BF」 is the attacked monster',used&&z(et)==='grave'&&lp(1)===l1-1300-1000,JSON.stringify({used,et:z(et),lp1:lp(1),was:l1})); }

/* ===== ヒレン: a direct attack of 2000+ damage to me → revive it and a Lv3-or-less 「BF」 from my GY, effects negated; once per Duel ===== */
{ fresh();const hi=mk('BF－天狗風のヒレン',0),et=mk('BF－二の太刀のエテジア',0),lv5=mk('BF－追い風のアリゼ',0),be=mon('青眼の白龍',1);
  gameState.players[0].grave=[hi,et,lv5];gameState.players[1].mz=[be];baselineA();
  toOppBattle();const l0=lp(0);PREFER=[uid(et)];atkTarget(1,be,'direct');PREFER=[];
  ok('ヒレン: 3000 direct damage → ヒレン and the chosen Lv3 BF エテジア Special Summoned from the Graveyard (the Lv5 BF stays)',l0-lp(0)===3000&&z(hi)==='mz'&&z(et)==='mz'&&z(lv5)==='grave',JSON.stringify({loss:l0-lp(0),hi:z(hi),et:z(et),lv5:z(lv5)}));
  ok('ヒレン: both monsters\' effects are negated',effectNegated(C(hi))===true&&effectNegated(C(et))===true,JSON.stringify([effectNegated(C(hi)),effectNegated(C(et))]));
  audit('ヒレン ①');
  /* once per Duel: another ヒレン in the Graveyard after a second direct hit cannot do it */
  const hi2=mk('BF－天狗風のヒレン',0),et2=mk('BF－二の太刀のエテジア',0);gameState.players[0].grave.push(hi2,et2);
  endTurn();be.attacked=false;be.attackCount=0;phase('battle');
  gameState.players[0].mz=[];atkTarget(1,be,'direct');
  ok('ヒレン: once per Duel — the second copy does not activate',z(hi2)==='grave'&&z(et2)==='grave',JSON.stringify({hi2:z(hi2),et2:z(et2)})); }
{ fresh();const hi=mk('BF－天狗風のヒレン',0),et=mk('BF－二の太刀のエテジア',0),be=mon('ガスタ・サンボルト',1);
  gameState.players[0].grave=[hi,et];gameState.players[1].mz=[be];baselineA();
  toOppBattle();atkTarget(1,be,'direct');
  ok('ヒレン negative: direct damage of 1800 (below 2000) → nothing happens',z(hi)==='grave'&&z(et)==='grave',JSON.stringify({hi:z(hi),et:z(et),lp:lp(0)})); }
{ fresh();const hi=mk('BF－天狗風のヒレン',0),et=mk('BF－二の太刀のエテジア',0),ga=mon('BF－逆風のガスト',0),be=mon('青眼の白龍',1);
  gameState.players[0].grave=[hi,et];gameState.players[0].mz=[ga];gameState.players[1].mz=[be];baselineA();
  toOppBattle();atkTarget(1,be,ga);
  ok('ヒレン negative: battle damage by a monster battle (not a direct attack) → nothing happens',z(hi)==='grave'&&z(et)==='grave',JSON.stringify({hi:z(hi),et:z(et)})); }
{ fresh();const hi=mk('BF－天狗風のヒレン',0),be=mon('青眼の白龍',1);
  gameState.players[0].grave=[hi];gameState.players[1].mz=[be];baselineA();
  toOppBattle();atkTarget(1,be,'direct');
  ok('ヒレン negative: no Lv3-or-less 「BF」 in the Graveyard → nothing happens',z(hi)==='grave',z(hi)); }

console.log('U319 done');
`);
