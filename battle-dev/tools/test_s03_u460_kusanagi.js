/* S03-U460: 草薙剣 — Spirit-only Equip, piercing, and forced self-return when the host returns to hand. */
const harness=require('./astra_harness');
harness(String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function uid(c){return ensureCardUid(gameState,c);}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function mon(n,p,pos){const c=mk(n,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
let PREFER=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){if(pc()){pick();continue;}if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}return;}throw new Error('drive loop');}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4600001;for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function cast(c,target){PREFER=[uid(target)];duelActivateFromHand(gameState.players[0].hand.indexOf(c));drive();PREFER=[];}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function attack(a,d){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(a),target:idx(d)});drive();}
function legal(i){return getLegalHandActions(0,i).some(x=>x.id==='activate');}
const K='草薙剣',S='阿修羅';

ok('草薙剣 registration',!!CARD_SCRIPTS[K]);

{ fresh();const k=mk(K,0),s=mon(S,0),n=mon('ワイト',0),d=mon('ワイト',1,'def');gameState.players[0].hand=[k];gameState.players[0].mz=[s,n];gameState.players[1].mz=[d];baselineA();
  ok('草薙剣: Spiritがいれば手札から発動できる',legal(0)===true,'');cast(k,s);
  ok('草薙剣: 実際にSpiritへ装備され、装備先uidを保存する',z(k)==='sz'&&C(k).equipTo&&C(k).equipTo.uid===s.uid&&C(k).e2HostUid===s.uid,JSON.stringify(C(k)));
  phase('battle');const before=gameState.players[1].lp;attack(s,d);
  ok('草薙剣: 守備表示への攻撃でATK1700-DEF200=1500の貫通ダメージ',gameState.players[1].lp===before-1500,JSON.stringify([before,gameState.players[1].lp,z(d)]));
  audit('草薙剣 piercing'); }

{ fresh();const s=mon(S,0),d=mon('ワイト',1,'def');gameState.players[0].mz=[s];gameState.players[1].mz=[d];baselineA();phase('battle');const before=gameState.players[1].lp;attack(s,d);
  ok('草薙剣 negative: 装備していなければ守備表示へ貫通しない',gameState.players[1].lp===before,JSON.stringify([before,gameState.players[1].lp])); }

{ fresh();const k=mk(K,0),n=mon('ワイト',0);gameState.players[0].hand=[k];gameState.players[0].mz=[n];baselineA();
  ok('草薙剣 negative: Spiritでないモンスターだけでは発動できない',legal(0)===false,''); }

{ fresh();const k=mk(K,0),s=mon(S,0);gameState.players[0].hand=[k];gameState.players[0].mz=[s];baselineA();cast(k,s);
  ok('草薙剣 bounce fixture: 戻る前は装備され、装備先uidを保持する',z(k)==='sz'&&C(k).equipTo&&C(k).equipTo.uid===s.uid&&C(k).e2HostUid===s.uid,JSON.stringify(C(k)));
  API.returnToHand(locateCardAnyV4(s),'S03-U460 bounce');flushDeferredEventsV2();drive();
  ok('草薙剣: 装備モンスターが自分フィールドから手札へ戻ると自身も墓地から手札へ戻る',z(s)==='hand'&&z(k)==='hand',JSON.stringify([z(s),z(k),C(k)&&C(k).graveInfo]));
  audit('草薙剣 bounce'); }

{ fresh();const k=mk(K,0),s=mon(S,0);gameState.players[0].hand=[k];gameState.players[0].mz=[s];baselineA();cast(k,s);
  API.destroy(locateCardAnyV4(s),'S03-U460 destroy');drive();
  ok('草薙剣 negative: 装備モンスターが破壊され墓地へ行った場合、自身は手札へ戻らない',z(s)==='grave'&&z(k)==='grave',JSON.stringify([z(s),z(k)])); }
`);
