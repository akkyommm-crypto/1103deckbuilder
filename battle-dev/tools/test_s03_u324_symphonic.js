/* S03-U324: 音響戦士ドラムス / ピアーノ / ベーシス — the declared Attribute / Type, the hand-size Level rise, the Graveyard effects (banish cost, own monsters only). Real DUEL paths, Replay-audited. */
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
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3240001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function legalZ(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id).indexOf('effect')>=0;}
function actZ(zone,c){duelActivateFromZone(0,zone,idx(c));drive();}
const OA='音響戦士ベーシス',OB='音響戦士ピアーノ';   /* the only other 「音響戦士」 monsters of the 2011 pool are the three of this unit */
const ATTR=c=>currentAttributeV17(C(c)),RACE=c=>currentRaceV17(C(c));

/* ===== ドラムス ===== */
{ fresh();const dr=mon('音響戦士ドラムス',0),g=mon(OA,0),wy=mon('ワイト',0);gameState.players[0].mz=[dr,g,wy];baselineA();
  const was=ATTR(g),to=was==='炎'?'水':'炎';
  ok('ドラムス: available (a face-up 「音響戦士」 is on the field)',legalZ('mz',dr)===true,'');
  PREFER=[to,uid(g)];actZ('mz',dr);PREFER=[];
  ok('ドラムス: the chosen 音響戦士 is now of the declared Attribute ('+was+' → '+to+'); the ワイト is not a candidate and is unchanged',ATTR(g)===to&&ATTR(wy)==='闇',JSON.stringify({was,now:ATTR(g),wy:ATTR(wy)}));
  ok('ドラムス: once per turn',legalZ('mz',dr)===false,'');
  audit('ドラムス ①'); }
{ fresh();const g=mon(OA,0),dr=mk('音響戦士ドラムス',0);gameState.players[0].mz=[g];gameState.players[0].grave=[dr];baselineA();
  const was=ATTR(g),to=was==='光'?'闇':'光';
  ok('ドラムス: its Graveyard effect is offered',legalZ('grave',dr)===true,'');
  PREFER=[to,uid(g)];actZ('grave',dr);PREFER=[];
  ok('ドラムス: banished from the Graveyard (cost); my 音響戦士 changed to '+to,z(dr)==='banish'&&ATTR(g)===to,JSON.stringify({dr:z(dr),now:ATTR(g)}));
  audit('ドラムス ②'); }
{ fresh();const dr=mk('音響戦士ドラムス',0),wy=mon('ワイト',0);gameState.players[0].mz=[wy];gameState.players[0].grave=[dr];baselineA();
  ok('ドラムス negative: no 「音響戦士」 on my field → the Graveyard effect is not offered',legalZ('grave',dr)===false,''); }
{ fresh();const dr=mk('音響戦士ドラムス',0),g=mon(OA,1);gameState.players[1].mz=[g];gameState.players[0].grave=[dr];baselineA();
  ok('ドラムス negative: only the opponent\'s 「音響戦士」 → the Graveyard effect (my own monsters only) is not offered',legalZ('grave',dr)===false,''); }
{ fresh();const dr=mon('音響戦士ドラムス',0),g=mon(OA,1);gameState.players[0].mz=[dr];gameState.players[1].mz=[g];baselineA();
  const was=ATTR(g),to=was==='炎'?'水':'炎';PREFER=[to,uid(g)];actZ('mz',dr);PREFER=[];
  ok('ドラムス: the field effect may choose the opponent\'s face-up 「音響戦士」',ATTR(g)===to,JSON.stringify({was,now:ATTR(g)})); }

/* ===== ピアーノ ===== */
{ fresh();const pi=mon('音響戦士ピアーノ',0),g=mon(OA,0);gameState.players[0].mz=[pi,g];baselineA();
  const was=RACE(g),to=was==='ドラゴン'?'魚':'ドラゴン';
  PREFER=[to,uid(g)];actZ('mz',pi);PREFER=[];
  ok('ピアーノ: the chosen 音響戦士 is now of the declared Type ('+was+' → '+to+')',RACE(g)===to,JSON.stringify({was,now:RACE(g)}));
  ok('ピアーノ: once per turn',legalZ('mz',pi)===false,'');
  audit('ピアーノ ①'); }
{ fresh();const g=mon(OA,0),pi=mk('音響戦士ピアーノ',0);gameState.players[0].mz=[g];gameState.players[0].grave=[pi];baselineA();
  const was=RACE(g),to=was==='悪魔'?'天使':'悪魔';
  PREFER=[to,uid(g)];actZ('grave',pi);PREFER=[];
  ok('ピアーノ: Graveyard effect — banished; my 音響戦士 changed to '+to,z(pi)==='banish'&&RACE(g)===to,JSON.stringify({pi:z(pi),now:RACE(g)}));
  audit('ピアーノ ②'); }

/* ===== ベーシス ===== */
{ fresh();const ba=mon('音響戦士ベーシス',0),g=mon(OB,0);gameState.players[0].mz=[ba,g];gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];baselineA();
  const lv0=curLV(C(g));
  PREFER=[uid(g)];actZ('mz',ba);PREFER=[];
  ok('ベーシス ①: the target Level rises by the hand size (3)',curLV(C(g))===lv0+3,JSON.stringify({lv0,now:curLV(C(g))}));
  ok('ベーシス ①: once per turn',legalZ('mz',ba)===false,'');
  audit('ベーシス ①');
  endTurn();
  ok('ベーシス ①: the Level is back at the end of the turn',curLV(C(g))===lv0,String(curLV(C(g)))); }
{ fresh();const g=mon(OB,0),ba=mk('音響戦士ベーシス',0);gameState.players[0].mz=[g];gameState.players[0].grave=[ba];gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0)];baselineA();
  const lv0=curLV(C(g));PREFER=[uid(g)];actZ('grave',ba);PREFER=[];
  ok('ベーシス ②: banished; my 音響戦士 +2 Levels (hand size 2)',z(ba)==='banish'&&curLV(C(g))===lv0+2,JSON.stringify({ba:z(ba),lv0,now:curLV(C(g))}));
  audit('ベーシス ②'); }
{ fresh();const ba=mk('音響戦士ベーシス',0),g=mon(OB,1);gameState.players[1].mz=[g];gameState.players[0].grave=[ba];baselineA();
  ok('ベーシス negative: ② only reaches my own 「音響戦士」',legalZ('grave',ba)===false,''); }
{ fresh();const ba=mon('音響戦士ベーシス',0),g=mon(OB,1);gameState.players[0].mz=[ba];gameState.players[1].mz=[g];gameState.players[0].hand=[mk('ワイト',0)];baselineA();
  const lv0=curLV(C(g));PREFER=[uid(g)];actZ('mz',ba);PREFER=[];
  ok('ベーシス: ① may target the opponent\'s 「音響戦士」',curLV(C(g))===lv0+1,JSON.stringify({lv0,now:curLV(C(g))})); }

console.log('U324 done');
`);
