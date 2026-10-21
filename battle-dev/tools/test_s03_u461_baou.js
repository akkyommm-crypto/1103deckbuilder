/* S03-U461: 破邪の大剣－バオウ real activation cost, Equip stat, battle-destroyed effect negation, controls and Replay. */
const harness=require('./astra_harness');
harness(String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function uid(c){return ensureCardUid(gameState,c);}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<900;i++){if(pc()){pick();continue;}if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}return;}throw new Error('drive loop');}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4610001;for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
function legal(i){return getLegalHandActions(0,i).some(x=>x.id==='activate');}
function cast(eq,cost,host){PREFER=[uid(cost),uid(host)];duelActivateFromHand(gameState.players[0].hand.indexOf(eq));drive();PREFER=[];}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(a,d){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(a),target:idx(d)});drive();}
const B='破邪の大剣－バオウ';

ok('破邪の大剣－バオウ registration',!!CARD_SCRIPTS[B]&&!!battleDestroyedNegatorSpecS03(B));

{ fresh();const b=mk(B,0),pay=mk('ワイト',0),a=mk('ジェネティック・ワーウルフ',0),foot=mk('紫炎の足軽',1),recruit=mk('六武衆の露払い',1,'down');
  gameState.players[0].hand=[b,pay];gameState.players[0].mz=[a];gameState.players[1].mz=[foot];gameState.players[1].deck=[recruit,mk('ワイト',1,'down')];baselineA();
  ok('バオウ: 墓地へ送れる別の手札と表側モンスターがあれば発動できる',legal(0)===true,'');cast(b,pay,a);
  ok('バオウ: 選んだ手札1枚をコストで墓地へ送る',z(pay)==='grave',z(pay));
  ok('バオウ: モンスターに装備される',z(b)==='sz'&&C(b).equipTo&&C(b).equipTo.uid===a.uid,JSON.stringify(C(b)));
  ok('バオウ: 装備モンスターの攻撃力を500上げる',curATK(C(a))===2500,curATK(C(a)));
  phase('battle');attack(a,foot);const pkg=audit('破邪の大剣－バオウ');
  ok('バオウ: 戦闘破壊した紫炎の足軽は発動しても効果が無効になり、六武衆を呼べない',z(foot)==='grave'&&z(recruit)==='deck'&&!gameState.players[1].mz.length,JSON.stringify({foot:z(foot),recruit:z(recruit)}));
  ok('バオウ: 戦闘破壊されたカードに装備モンスターuidが記録される',foot.graveInfo&&foot.graveInfo.battleNegatorUidS03===a.uid,JSON.stringify(foot.graveInfo));
  ok('バオウ: 紫炎の足軽の誘発自体はチェーンに積まれている',pkg.actions.some(x=>x&&x.action&&x.action.type==='CHAIN_ADD'&&x.action.name==='紫炎の足軽'),''); }

{ fresh();const b=mk(B,0),a=mk('ジェネティック・ワーウルフ',0);gameState.players[0].hand=[b];gameState.players[0].mz=[a];baselineA();
  ok('バオウ negative: 墓地へ送る別の手札がなければ発動できない',legal(0)===false,''); }

{ fresh();const a=mk('ジェネティック・ワーウルフ',0),foot=mk('紫炎の足軽',1),recruit=mk('六武衆の露払い',1,'down');gameState.players[0].mz=[a];gameState.players[1].mz=[foot];gameState.players[1].deck=[recruit,mk('ワイト',1,'down')];baselineA();phase('battle');attack(a,foot);
  ok('バオウ negative: 装備していないモンスターの戦闘では紫炎の足軽が六武衆を特殊召喚する',z(recruit)==='mz',z(recruit)); }

{ fresh();const b=mk(B,0),pay=mk('ワイト',0),a=mk('ジェネティック・ワーウルフ',0),foot=mk('紫炎の足軽',1),recruit=mk('六武衆の露払い',1,'down');gameState.players[0].hand=[b,pay];gameState.players[0].mz=[a];gameState.players[1].mz=[foot];gameState.players[1].deck=[recruit,mk('ワイト',1,'down')];baselineA();cast(b,pay,a);API.destroy(locateCardAnyV4(b),'fixture remove equip');flushDeferredEventsV2();drive();phase('battle');attack(a,foot);
  ok('バオウ negative: 戦闘前に装備カードが失われていれば効果は無効にしない',z(b)==='grave'&&z(recruit)==='mz',JSON.stringify({b:z(b),recruit:z(recruit)}));audit('破邪の大剣－バオウ removed'); }
`);
