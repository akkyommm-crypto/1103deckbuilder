/* S03-U330: ヴァイロン・ステラ / プリズム / ハプト — the monster-to-Equip move from the Graveyard (500 LP), Stella's destruction of the battler, Prism's +1000 in the Damage Step, Haptu's Special Summon of an equipped Vylon (banished when it leaves). Real DUEL paths, Replay-audited. */
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3300001;
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
function equippedTo(eq,host){const e=C(eq),h=C(host);return !!e&&!!h&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===host.uid&&z(eq)==='sz';}

/* the opponent destroys the Vylon (Defense Position) in battle → it is paid 500 LP and equipped to my host */
function vylonToEquip(name,extraMine){
  fresh();const vy=mon(name,0,'def'),host=mon('ワイト',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[vy,host].concat(extraMine?extraMine():[]);gameState.players[1].mz=[f];baselineA();
  toOppBattle();const l0=lp(0);PREFER=[uid(host)];atkTarget(1,f,vy);PREFER=[];
  return {vy,host,f,l0};
}
{ const x=vylonToEquip('ヴァイロン・ステラ');
  ok('ステラ: destroyed in battle (Monster Zone → Graveyard) → 500 LP paid, equipped to my ワイト as an Equip Card',equippedTo(x.vy,x.host)&&lp(0)===x.l0-500-0,JSON.stringify({vy:z(x.vy),lp:lp(0),was:x.l0,eq:C(x.vy)&&C(x.vy).equipTo}));
  audit('ステラ ①'); }
{ fresh();const vy=mon('ヴァイロン・ステラ',0,'def'),host=mon('ワイト',0),f=mon('青眼の白龍',1),foe2=mon('ガスタ・スクイレル',1,'def');
  gameState.players[0].mz=[vy,host];gameState.players[1].mz=[f,foe2];baselineA();
  toOppBattle();PREFER=[uid(host)];atkTarget(1,f,vy);PREFER=[];
  endTurn();phase('battle');const l1=lp(1);
  atkTarget(0,host,foe2);
  ok('ステラ: my host (ATK 300) battles ガスタ・スクイレル (DEF 1800): it survives the battle, then is destroyed at the end of the Damage Step',equippedTo(vy,host)&&z(foe2)==='grave',JSON.stringify({foe2:z(foe2),eq:z(vy)}));
  audit('ステラ ②'); }
{ fresh();const vy=mon('ヴァイロン・ステラ',0,'def'),f=mon('青眼の白龍',1);gameState.players[0].mz=[vy];gameState.players[1].mz=[f];baselineA();
  toOppBattle();atkTarget(1,f,vy);
  ok('ステラ negative: no other monster of mine to equip to → it stays in the Graveyard (no LP paid)',z(vy)==='grave'&&lp(0)===8000,JSON.stringify({vy:z(vy),lp:lp(0)})); }
{ fresh();const vy=mon('ヴァイロン・ステラ',0,'def'),host=mon('ワイト',0),f=mon('青眼の白龍',1);gameState.players[0].mz=[vy,host];gameState.players[1].mz=[f];gameState.players[0].lp=400;baselineA();
  toOppBattle();atkTarget(1,f,vy);
  ok('ステラ negative: with less than 500 LP it cannot pay → stays in the Graveyard',z(vy)==='grave'&&lp(0)>0,JSON.stringify({vy:z(vy),lp:lp(0)})); }

/* ===== プリズム ===== */
{ fresh();const vy=mon('ヴァイロン・プリズム',0,'def'),host=mon('ワイト',0),f=mon('青眼の白龍',1),foe2=mon('ワイト',1);
  gameState.players[0].mz=[vy,host];gameState.players[1].mz=[f,foe2];baselineA();
  toOppBattle();PREFER=[uid(host)];atkTarget(1,f,vy);PREFER=[];
  ok('プリズム: equipped to my ワイト after being destroyed (500 LP paid)',equippedTo(vy,host),JSON.stringify({vy:z(vy)}));
  ok('プリズム: outside battle the host ATK is 300',curATK(C(host))===300,String(curATK(C(host))));
  endTurn();phase('battle');const l1=lp(1);atkTarget(0,host,foe2);
  ok('プリズム: in the Damage Step the host has +1000 ATK (1300 vs 300): ワイト destroyed, 1000 damage',z(foe2)==='grave'&&l1-lp(1)===1000&&z(host)==='mz',JSON.stringify({foe2:z(foe2),loss:l1-lp(1),host:z(host)}));
  audit('プリズム'); }

/* ===== ハプト ===== */
{ fresh();const hp=mon('ヴァイロン・ハプト',0),vy=mon('ヴァイロン・ステラ',0,'def'),host=mon('ワイト',0),f=mon('青眼の白龍',1);
  gameState.players[0].mz=[hp,vy,host];gameState.players[1].mz=[f];baselineA();
  toOppBattle();PREFER=[uid(host)];atkTarget(1,f,vy);PREFER=[];
  endTurn();
  ok('ハプト: available (an equipped 「ヴァイロン」 monster is on my field)',canZ('mz',hp)===true,'');
  PREFER=[uid(vy)];actZ('mz',hp);PREFER=[];
  ok('ハプト: the equipped ステラ is Special Summoned face-up Defense Position (no longer an Equip Card)',z(vy)==='mz'&&C(vy).pos==='def'&&C(vy).face==='up'&&!C(vy).v46MonsterEquip,JSON.stringify({vy:z(vy),pos:C(vy)&&C(vy).pos}));
  ok('ハプト: once per turn',canZ('mz',hp)===false,'');
  audit('ハプト ①');
  API.sendToGrave(findCardByUid(vy.uid),'test');drive();
  ok('ハプト: when the summoned monster leaves the field it is banished instead of going to the Graveyard',z(vy)==='banish',z(vy)); }
{ fresh();const hp=mon('ヴァイロン・ハプト',0),w=mon('ワイト',0);gameState.players[0].mz=[hp,w];baselineA();
  ok('ハプト negative: no equipped 「ヴァイロン」 → not available',canZ('mz',hp)===false,''); }

console.log('U330 done');
`);
