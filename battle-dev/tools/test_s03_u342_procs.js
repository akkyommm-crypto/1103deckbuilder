/* S03-U342: ゲート・ガーディアン, カード・ブレイカー, ギガストーン・オメガ, ジャイアントワーム, カゲトカゲ, シンクロ・マグネーター.
   Real DUEL paths (hand procedures with releases / sends / banishes, a Graveyard trigger by card effect, optional hand triggers on Normal / Synchro Summons), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3420001;
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


const GAT='ゲート・ガーディアン',BRK='カード・ブレイカー',OME='ギガストーン・オメガ',WRM='ジャイアントワーム',KAG='カゲトカゲ',MAG='シンクロ・マグネーター';
const SAN='雷魔神－サンガ',HYU='風魔神－ヒューガ',SUU='水魔神－スーガ';
function respondHand(c,fn){fn();let done=false;
  for(let k=0;k<200;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused){const h=findCardByUid(c.uid);if(h&&h.zone==='hand'){try{pointActivateV27(0,'hand',h.index,0);}catch(e){}}done=true;continue;}
    if(drive()==='idle')break;}
  drive();return done;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

/* ===== ゲート・ガーディアン ===== */
{ fresh();const g=mk(GAT,0),a=mon(SAN,0),b=mon(HYU,0),c=mon(SUU,0);gameState.players[0].hand=[g];gameState.players[0].mz=[a,b,c];baselineA();
  ok('ゲート・ガーディアン: the procedure is legal with サンガ + ヒューガ + スーガ',procOk(GAT,0)===true,'');
  ok('ゲート・ガーディアン: cannot be Normal Summoned',cannotNormalSummonS03(dbOf(g))===true,'');
  procRun(GAT,0);
  ok('ゲート・ガーディアン: Special Summoned, the three 魔神 released',z(g)==='mz'&&[a,b,c].every(m=>z(m)==='grave'),JSON.stringify({g:z(g),m:[a,b,c].map(z)}));
  audit('ゲート ①'); }
{ fresh();const g=mk(GAT,0),a=mon(SAN,0),b=mon(HYU,0),w=mon('ワイト',0);gameState.players[0].hand=[g];gameState.players[0].mz=[a,b,w];baselineA();
  ok('ゲート・ガーディアン negative: スーガ missing (a ワイト instead) → not legal',procOk(GAT,0)===false,''); }

/* ===== カード・ブレイカー ===== */
{ fresh();const br=mk(BRK,0),st=setCard('サイクロン',0);gameState.players[0].hand=[br];gameState.players[0].sz=[st];baselineA();
  ok('カード・ブレイカー: legal with a card in the Spell & Trap Zone',procOk(BRK,0)===true,'');
  procRun(BRK,0);
  ok('カード・ブレイカー: the Spell & Trap card sent to the Graveyard, Special Summoned face-up Attack',z(br)==='mz'&&C(br).face==='up'&&C(br).pos==='atk'&&z(st)==='grave',JSON.stringify({br:z(br),pos:C(br)&&C(br).pos,st:z(st)}));
  audit('カード・ブレイカー ①'); }
{ fresh();const br=mk(BRK,0);gameState.players[0].hand=[br];baselineA();
  ok('カード・ブレイカー negative: no Spell & Trap card → not legal',procOk(BRK,0)===false,''); }

/* ===== ギガストーン・オメガ ===== */
function omega(){fresh();const om=mk(OME,0),e1=mk('ジェムナイト・エメラル',0),e2=mk('C・リペアラー',0),w=mk('ワイト',0);gameState.players[0].hand=[om];gameState.players[0].grave=[e1,e2,w];return {om,e1,e2,w};}
{ const x=omega();baselineA();
  ok('オメガ: legal with two EARTH monsters in the Graveyard',procOk(OME,0)===true,'');
  procRun(OME,0);
  ok('オメガ: Special Summoned, the two EARTH monsters banished (the ワイト stays)',z(x.om)==='mz'&&z(x.e1)==='banish'&&z(x.e2)==='banish'&&z(x.w)==='grave',JSON.stringify({om:z(x.om),e:[x.e1,x.e2].map(z),w:z(x.w)}));
  audit('オメガ ①'); }
{ const x=omega();x.e2.id=findCardIndex('ワイト');baselineA();
  ok('オメガ negative: only one EARTH monster → not legal',procOk(OME,0)===false,''); }
{ const x=omega();gameState.players[0].field=mk('王家の眠る谷－ネクロバレー',0);baselineA();
  ok('オメガ negative: ネクロバレー applies (no banish from the Graveyard) → not legal',procOk(OME,0)===false,''); }
{ fresh();const om=mon(OME,0),fs1=setCard('サイクロン',1),fs2=mk('王家の眠る谷－ネクロバレー',1),b=mk('ブラック・ホール',0);gameState.players[0].hand=[b];gameState.players[0].mz=[om];gameState.players[1].sz=[fs1];gameState.players[1].field=fs2;baselineA();
  duelActivateFromHand(0);drive();
  ok('オメガ: sent to the Graveyard by a card effect (ブラック・ホール) → every Spell/Trap of the opponent destroyed',z(om)==='grave'&&z(fs1)==='grave'&&z(fs2)==='grave',JSON.stringify({om:z(om),fs1:z(fs1),fs2:z(fs2)}));
  audit('オメガ ②'); }
{ fresh();const om=mon(OME,0),fs1=setCard('サイクロン',1),f=mon('青眼の白龍',1);gameState.players[0].mz=[om];gameState.players[1].sz=[fs1];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,om);
  ok('オメガ negative: destroyed by battle → the opponent\'s Spell/Trap stays',z(om)==='grave'&&z(fs1)==='sz',JSON.stringify({om:z(om),fs1:z(fs1)})); }

/* ===== ジャイアントワーム ===== */
{ fresh();const wm=mk(WRM,0),bee=mk('アーマード・ビー',0),w=mk('ワイト',0);gameState.players[0].hand=[wm];gameState.players[0].grave=[bee,w];baselineA();
  ok('ワーム: legal with an Insect in the Graveyard',procOk(WRM,0)===true,'');
  procRun(WRM,0);
  ok('ワーム: Special Summoned, the Insect banished',z(wm)==='mz'&&z(bee)==='banish'&&z(w)==='grave',JSON.stringify({wm:z(wm),bee:z(bee)}));
  audit('ワーム ①');
  endTurn();endTurn();phase('battle');const d1=gameState.players[1].deck.length,l1=lp(1);atkTarget(0,wm,'direct');
  ok('ワーム: dealt battle damage (1900) → the top card of the opponent\'s Deck goes to the Graveyard',l1-lp(1)===1900&&gameState.players[1].deck.length===d1-1,JSON.stringify({loss:l1-lp(1),d:[d1,gameState.players[1].deck.length]})); }
{ fresh();const wm=mk(WRM,0),w=mk('ワイト',0);gameState.players[0].hand=[wm];gameState.players[0].grave=[w];baselineA();
  ok('ワーム negative: no Insect in the Graveyard → not legal',procOk(WRM,0)===false,''); }
{ fresh();const wm=mk(WRM,0),bee=mk('アーマード・ビー',0);gameState.players[0].hand=[wm];gameState.players[0].grave=[bee];gameState.players[0].field=mk('王家の眠る谷－ネクロバレー',0);baselineA();
  ok('ワーム negative: ネクロバレー applies → not legal',procOk(WRM,0)===false,''); }

/* ===== カゲトカゲ ===== */
{ fresh();const kg=mk(KAG,0),l4=mk('ジェムナイト・エメラル',0);gameState.players[0].hand=[kg,l4];baselineA();
  ok('カゲトカゲ: cannot be Normal Summoned; cannot be a Synchro Material (the script flag)',cannotNormalSummonS03(dbOf(kg))===true&&CARD_SCRIPTS[KAG].cannotSynchroMaterial===true,'');
  respondHand(kg,()=>doNormalSummon(1,'atk'));
  ok('カゲトカゲ: a Level 4 monster Normal Summoned → カゲトカゲ Special Summoned from the hand',z(l4)==='mz'&&z(kg)==='mz'&&C(kg).specialSummonedFrom==='hand',JSON.stringify({l4:z(l4),kg:z(kg)}));
  audit('カゲトカゲ ①'); }
{ fresh();const kg=mk(KAG,0),l3=mk('ワイト',0);gameState.players[0].hand=[kg,l3];baselineA();
  doNormalSummon(1,'atk');drive();
  ok('カゲトカゲ negative: a Level 3 monster summoned → stays in the hand',z(l3)==='mz'&&z(kg)==='hand',JSON.stringify({l3:z(l3),kg:z(kg)})); }
{ fresh();const kg=mk(KAG,0),l4=mk('ジェムナイト・エメラル',1);gameState.activePlayer=1;gameState.players[0].hand=[kg];gameState.players[1].hand=[l4];baselineA();
  doNormalSummon(0,'atk');drive();
  ok('カゲトカゲ negative: the opponent\'s Level 4 summon → not triggered',z(kg)==='hand',z(kg)); }

{ fresh();const kg=mon(KAG,0),w=mon('ワイト',0);gameState.players[0].mz=[kg,w];baselineA();
  const mc=materialCandidates(0,'synchro').map(x=>x.c.uid);
  ok('カゲトカゲ: not offered as a Synchro Material candidate (a ワイト is)',mc.indexOf(w.uid)>=0&&mc.indexOf(kg.uid)<0,JSON.stringify({mc,kg:kg.uid,w:w.uid})); }

/* ===== シンクロ・マグネーター ===== */
function synchroRim(withMag){fresh();const t=mon('エレキツネ',0),n=mon('サンダー・ドラゴン',0),rim=mk('エレキリム',0),mg=mk(MAG,0);gameState.players[0].mz=[t,n];gameState.players[0].ex=[rim];gameState.players[0].hand=withMag?[mg]:[];baselineA();
  const P=gameState.players[0];respondHand(mg,()=>doExSummon(0,0,[P.mz.indexOf(t),P.mz.indexOf(n)],'synchro','atk'));return {rim,mg};}
{ const x=synchroRim(true);
  ok('マグネーター: a Synchro Summon succeeded (エレキリム) → シンクロ・マグネーター Special Summoned from the hand',z(x.rim)==='mz'&&z(x.mg)==='mz',JSON.stringify({rim:z(x.rim),mg:z(x.mg)}));
  audit('マグネーター ①'); }
{ fresh();const mg=mk(MAG,0),w=mk('ワイト',0);gameState.players[0].hand=[mg,w];baselineA();
  doNormalSummon(1,'atk');drive();
  ok('マグネーター negative: a Normal Summon is not a Synchro Summon → stays in the hand',z(mg)==='hand',z(mg)); }
{ const x=synchroRim(false);ok('マグネーター control: the Synchro Summon works without it',z(x.rim)==='mz',z(x.rim)); }

console.log('U342 done');
`);
