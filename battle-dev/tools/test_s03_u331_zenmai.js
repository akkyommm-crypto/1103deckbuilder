/* S03-U331: ゼンマイウォリアー / ナイト / ハンター / バット / マジシャン — each effect once while the card is face-up. Real DUEL paths (ignitions, the attack-declare negation, the random hand card, the trigger after another ゼンマイ effect), Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3310001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function canZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(zone,c){duelActivateFromZone(0,zone,idx(c));drive();}
const WA='ゼンマイウォリアー',KN='ゼンマイナイト',HU='ゼンマイハンター',BA='ゼンマイバット',MA='ゼンマイマジシャン';

/* ===== ウォリアー ===== */
{ fresh();const wa=mon(WA,0),ba=mon(BA,0),wy=mon('ワイト',0);gameState.players[0].mz=[wa,ba,wy];baselineA();
  const lv0=curLV(C(ba)),a0=curATK(C(ba));PREFER=[uid(ba)];actZ('mz',wa);PREFER=[];
  ok('ウォリアー: the chosen ゼンマイ (バット) is Lv+1 and ATK+600 until the End Phase (the ワイト is not a candidate)',curLV(C(ba))===lv0+1&&curATK(C(ba))===a0+600&&curATK(C(wy))===300,JSON.stringify({lv:curLV(C(ba)),a:curATK(C(ba)),lv0,a0}));
  ok('ウォリアー: only once while face-up',canZ('mz',wa)===false,'');
  audit('ウォリアー');
  endTurn();
  ok('ウォリアー: the boost ends with the turn',curLV(C(ba))===lv0&&curATK(C(ba))===a0,JSON.stringify({lv:curLV(C(ba)),a:curATK(C(ba))})); }
{ fresh();const wa=mon(WA,0),wy=mon('ワイト',0);gameState.players[0].mz=[wa,wy];baselineA();
  PREFER=[uid(wa)];actZ('mz',wa);PREFER=[];
  ok('ウォリアー: it may choose itself',curATK(C(wa))===1200+600,String(curATK(C(wa)))); }

/* ===== ナイト ===== */
{ fresh();const kn=mon(KN,0),wa=mon(WA,0),f1=mon('青眼の白龍',1),f2=mon('青眼の白龍',1);gameState.players[0].mz=[kn,wa];gameState.players[1].mz=[f1,f2];baselineA();
  toOppBattle();const l0=lp(0);atkTarget(1,f1,wa);
  ok('ナイト: 青眼 attacked my ゼンマイウォリアー → the attack negated (no damage, ウォリアー alive)',lp(0)===l0&&z(wa)==='mz',JSON.stringify({lp:lp(0),was:l0,wa:z(wa)}));
  audit('ナイト');
  atkTarget(1,f2,wa);
  ok('ナイト: only once while face-up — the second attack goes through',z(wa)==='grave'||lp(0)<l0,JSON.stringify({wa:z(wa),lp:lp(0)})); }
{ fresh();const kn=mon(KN,0),wy=mon('ワイト',0),f1=mon('青眼の白龍',1);gameState.players[0].mz=[kn,wy];gameState.players[1].mz=[f1];baselineA();
  toOppBattle();atkTarget(1,f1,wy);
  ok('ナイト negative: the attacked monster is not a 「ゼンマイ」 → not used (ワイト destroyed)',z(wy)==='grave',z(wy)); }

/* ===== ハンター ===== */
{ fresh();const hu=mon(HU,0),wa=mon(WA,0),h1=mk('ワイト',1),h2=mk('青眼の白龍',1);gameState.players[0].mz=[hu,wa];gameState.players[1].hand=[h1,h2];baselineA();
  PREFER=[uid(wa)];actZ('mz',hu);PREFER=[];
  const gone=[h1,h2].filter(c=>z(c)==='grave').length,kept=[h1,h2].filter(c=>z(c)==='hand').length;
  ok('ハンター: released ウォリアー (cost); one random card of the opponent hand sent to the Graveyard (1 gone, 1 kept)',z(wa)==='grave'&&gone===1&&kept===1,JSON.stringify({wa:z(wa),gone,kept}));
  ok('ハンター: only once while face-up',canZ('mz',hu)===false,'');
  audit('ハンター'); }
{ fresh();const hu=mon(HU,0),h1=mk('ワイト',1);gameState.players[0].mz=[hu];gameState.players[1].hand=[h1];baselineA();
  ok('ハンター negative: no other 「ゼンマイ」 to release → not available',canZ('mz',hu)===false,''); }
{ fresh();const hu=mon(HU,0),hu2=mon(HU,0),h1=mk('ワイト',1);gameState.players[0].mz=[hu,hu2];gameState.players[1].hand=[h1];baselineA();
  ok('ハンター negative: another ゼンマイハンター is not a legal release',canZ('mz',hu)===false,''); }

/* ===== バット ===== */
{ fresh();const ba=mon(BA,0),g1=mk(WA,0),g2=mk('ワイト',0);gameState.players[0].mz=[ba];gameState.players[0].grave=[g1,g2];baselineA();
  PREFER=[uid(g1)];actZ('mz',ba);PREFER=[];
  ok('バット: changed to face-up Defense Position, the chosen 「ゼンマイ」 of the Graveyard added to the hand (ワイト stays)',C(ba).pos==='def'&&z(g1)==='hand'&&z(g2)==='grave',JSON.stringify({pos:C(ba).pos,g1:z(g1),g2:z(g2)}));
  ok('バット: only once while face-up',canZ('mz',ba)===false,'');
  audit('バット'); }
{ fresh();const ba=mon(BA,0,'def'),g1=mk(WA,0);gameState.players[0].mz=[ba];gameState.players[0].grave=[g1];baselineA();
  ok('バット negative: in Defense Position it cannot be used',canZ('mz',ba)===false,''); }
{ fresh();const ba=mon(BA,0),g2=mk('ワイト',0);gameState.players[0].mz=[ba];gameState.players[0].grave=[g2];baselineA();
  ok('バット negative: no 「ゼンマイ」 in the Graveyard → not available',canZ('mz',ba)===false,''); }

/* ===== マジシャン ===== */
{ fresh();const ma=mon(MA,0),wa=mon(WA,0),dk=mk(KN,0);
  gameState.players[0].mz=[ma,wa];gameState.players[0].deck=[dk,mk('ワイト',0)];baselineA();
  PREFER=[uid(wa),uid(dk)];actZ('mz',wa);PREFER=[];
  ok('マジシャン: after ゼンマイウォリアー used its effect → ゼンマイナイト Special Summoned from the Deck in face-up Defense Position',z(dk)==='mz'&&C(dk).pos==='def'&&C(dk).face==='up'&&pl(dk)===0,JSON.stringify({dk:z(dk),pos:C(dk)&&C(dk).pos}));
  audit('マジシャン'); }
{ fresh();const ma=mon(MA,0),g=mon('ガスタ・ガルド',0),dk=mk(KN,0),ec=mk('エネミーコントローラー',0);gameState.players[0].mz=[ma,g];gameState.players[0].deck=[dk,mk('ワイト',0)];gameState.players[0].hand=[ec];gameState.players[1].mz=[mon('ワイト',1)];baselineA();
  PREFER=['yes',uid(gameState.players[1].mz[0])];duelActivateFromHand(0);drive();PREFER=[];
  ok('マジシャン negative: a Spell (エネミーコントローラー) is not a 「ゼンマイ」 monster effect → nothing summoned',z(dk)==='deck',z(dk)); }

console.log('U331 done');
`);
