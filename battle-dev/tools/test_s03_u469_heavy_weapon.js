/* S03-U469: 強化支援メカ・ヘビーウェポン（ユニオン、carddata「①:」表記）— declareUnionS03 の targeted:true（装備先を発動時に対象に取る）の最初の利用者。
   実際のDUEL経路（モンスターゾーンからの起動効果、対象選択、チェーン応答、戦闘・効果破壊の身代わり、同時破壊、リミッター解除）とReplay監査、Save/Load（2つのVM）で確認する。
   1103の裁定（wiki-rulings.js、answerDate付き。このカード自身についてのもの）:
   - 身代わりは戦闘・効果のどちらも（奈落の落とし穴 2008-09-05 WIKI-0D89609E8794 / リミッター解除 2011-08-27 WIKI-D032A4FED8D2 / サイバー・フェニックス 2010-11-08 WIKI-BFA4797D19E1）。
   - 装備は起動効果で、装備状態は機械族を対象にする装備魔法カード（2008-07-15 WIKI-86A8AFF69A68 / 2010-11-08 WIKI-003014546AD2）。
   - 装備解除は表側攻撃表示で特殊召喚（2009-01-20 WIKI-8294B5F99F4B / WIKI-3694902B2D8A）。
   - 装備モンスターと同時に破壊される場合、装備モンスターは場に残る（最終戦争・ブラック・ローズ 2010-12-11 WIKI-A171EBB2ACB6 / ゴッドバードアタック 2011-05-25 WIKI-3ACC61A3F03B）。 */
const harness=require('./astra_harness');
const first=harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
/* the host choice is a TARGET here, so the picker records the candidates it is offered */
const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key||(x.card&&x.card.uid))});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3130001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function zacts(zone,c){return getLegalZoneActions(0,zone,idx(c)).map(a=>a.id);}
function canEffect(zone,c){return zacts(zone,c).indexOf('effect')>=0;}
function equipU(u,host){PREFER=host?[uid(host)]:[];duelActivateFromZone(0,'mz',idx(u));drive();PREFER=[];}
function releaseU(u){duelActivateFromZone(0,'sz',idx(u));drive();}
function equippedTo(u,host){const e=C(u),h=C(host);return !!e&&!!h&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0&&z(u)==='sz';}
/* pass the turns for real (the draw, standby and Main Phase of each new turn are stepped through) */
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
/* my End Phase → the opponent turn (to its End Phase) → my next turn, Main Phase 1 */
function nextOwnTurn(){endTurn();endTurn();}
/* the opponent's turn: pass my turn, go to its Battle Phase */
function toOppBattle(){endTurn();phase('battle');}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function castHand(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let k=0;k<10&&pc();k++)pick();PREFER=[];}
const HW='強化支援メカ・ヘビーウェポン',CD='サイバー・ドラゴン';
/* activate the equip effect and answer the target prompt; stops with the link on the chain (the opponent response window) */
function activateEquip(u,host){SEEN.length=0;PREFER=host?[uid(host)]:[];duelActivateFromZone(0,'mz',idx(u));for(let k=0;k<10&&pc();k++)pick();PREFER=[];}

ok('fixture: 強化支援メカ・ヘビーウェポン is a Union Effect Monster whose carddata 「①:」 text targets, substitutes for 戦闘・効果 and gives +500',(()=>{const d=CARD_DB.find(x=>x.n===HW);return !!d&&d.st.indexOf('ユニオン')>=0&&d.e.indexOf('対象とし')>=0&&d.e.indexOf('戦闘・効果で破壊される場合')>=0&&d.e.indexOf('500アップ')>=0;})(),'');
ok('registration: the card is a Union with the destruction substitute for every destruction (not the battle-only classic scope)',CARD_SCRIPTS[HW]&&CARD_SCRIPTS[HW].unionS03===true&&CARD_SCRIPTS[HW].equipSubstituteS03===true,JSON.stringify(CARD_SCRIPTS[HW]&&[CARD_SCRIPTS[HW].unionS03,CARD_SCRIPTS[HW].equipSubstituteS03]));
ok('registration: the classic Unions keep their own scope (ドイツ battle only, オイルメン every destruction) and still choose the host on resolution',CARD_SCRIPTS['ドイツ'].equipSubstituteS03==='battle'&&CARD_SCRIPTS['オイルメン'].equipSubstituteS03===true&&!CARD_SCRIPTS['オイルメン'].targets,JSON.stringify([CARD_SCRIPTS['ドイツ'].equipSubstituteS03,CARD_SCRIPTS['オイルメン'].equipSubstituteS03,CARD_SCRIPTS['オイルメン'].targets]));

/* ===== equip: a TARGET chosen on activation, Machines only ===== */
{ fresh();const u=mon(HW,0),host=mon(CD,0),carrier=mon(CD,0),oil=mon('オイルメン',0),wight=mon('ワイト',0),foeM=mon(CD,1);
  gameState.players[0].mz=[u,host,carrier,oil,wight];gameState.players[1].mz=[foeM];baselineA();
  PREFER=[uid(carrier)];duelActivateFromZone(0,'mz',idx(oil));drive();PREFER=[];   /* a non-targeting Union (S03-U313): the host is chosen on resolution */
  ok('setup: オイルメン is equipped to the second Machine (a Machine carries one Union only)',equippedTo(oil,carrier),JSON.stringify([z(oil),C(oil)&&C(oil).equipTo]));
  ok('ヘビーウェポン: offered its effect in the Monster Zone',canEffect('mz',u),JSON.stringify(zacts('mz',u)));
  activateEquip(u,host);
  const offered=SEEN.length?SEEN[0].cands:[];
  ok('ヘビーウェポン: the host is chosen as a TARGET on activation — only the free own Machine is offered (not ワイト, not the opponent Machine, not the Machine already carrying a Union, and not the Union itself)',SEEN.length===1&&offered.indexOf(host.uid)>=0&&offered.indexOf(wight.uid)<0&&offered.indexOf(foeM.uid)<0&&offered.indexOf(carrier.uid)<0&&offered.indexOf(u.uid)<0,JSON.stringify(SEEN));
  ok('ヘビーウェポン: activation puts a chain link that records the target (the opponent has a response window)',gameState.chain.length===1&&Array.isArray(gameState.chain[0].targets)&&gameState.chain[0].targets.length===1&&!!gameState.chainWindow,JSON.stringify({chain:gameState.chain.length,tg:gameState.chain[0]&&gameState.chain[0].targets,win:!!gameState.chainWindow}));
  ok('ヘビーウェポン: nothing is equipped before the link resolves',z(u)==='mz'&&!equippedTo(u,host),z(u));
  drive();
  ok('ヘビーウェポン: resolution → equipped to the targeted Machine as an Equip Card',equippedTo(u,host),JSON.stringify([z(u),C(u)&&C(u).equipTo]));
  ok('ヘビーウェポン: ATK / DEF +500 while equipped (サイバー・ドラゴン 2100/1600 → 2600/2100); the other Machine is unchanged',curATK(C(host))===2600&&curDEF(C(host))===2100&&curATK(C(carrier))===2100,JSON.stringify([curATK(C(host)),curDEF(C(host)),curATK(C(carrier))]));
  ok('ヘビーウェポン: once per turn — no second use (neither the equip nor the release) this turn',!canEffect('sz',u),JSON.stringify(zacts('sz',u)));
  audit('ヘビーウェポン equip');
  nextOwnTurn();
  ok('ヘビーウェポン: the next turn the equip can be released',canEffect('sz',u),JSON.stringify(zacts('sz',u)));
  releaseU(u);
  ok('ヘビーウェポン: release → Special Summoned face-up in Attack Position (2009-01-20, WIKI-8294B5F99F4B), the host back to its own stats',z(u)==='mz'&&C(u).pos==='atk'&&C(u).face==='up'&&curATK(C(host))===2100&&curDEF(C(host))===1600&&!(C(host).equippedBy&&C(host).equippedBy.length),JSON.stringify([z(u),C(u)&&C(u).pos,curATK(C(host))]));
  ok('ヘビーウェポン: a released Union has spent its use for the turn (it cannot equip again the same turn)',!canEffect('mz',u),JSON.stringify(zacts('mz',u)));
  audit('ヘビーウェポン release'); }
/* the host rule: Machine only, own monsters only */
{ fresh();const u=mon(HW,0),wight=mon('ワイト',0),foeM=mon(CD,1);gameState.players[0].mz=[u,wight];gameState.players[1].mz=[foeM];baselineA();
  ok('host rule: with no own Machine (ワイト, and an opponent Machine) the equip effect is not offered',!canEffect('mz',u),JSON.stringify(zacts('mz',u)));
  const wi=mon('ワイト',0);gameState.players[0].mz.push(wi);
  ok('host rule control: a non-Machine monster is not a host either',!canEffect('mz',u),JSON.stringify(zacts('mz',u))); }
/* a face-down Machine is not a host; the Union itself is not a candidate; two Machines → both are offered, the player picks */
{ fresh();const u=mon(HW,0),m1=mon(CD,0),m2=mon('ジェネクス・コントローラー',0),down=mk(CD,0,'down','def');gameState.players[0].mz=[u,m1,m2,down];baselineA();
  activateEquip(u,m2);
  const offered=SEEN.length?SEEN[0].cands:[];
  ok('host choice: both face-up own Machines are offered, the face-down Machine and the Union itself are not',SEEN.length===1&&offered.indexOf(m1.uid)>=0&&offered.indexOf(m2.uid)>=0&&offered.indexOf(down.uid)<0&&offered.indexOf(u.uid)<0,JSON.stringify(SEEN));
  drive();
  ok('host choice: the picked Machine (not the first one offered) carries the Union',equippedTo(u,m2)&&!(C(m1).equippedBy&&C(m1).equippedBy.length),JSON.stringify([z(u),C(u)&&C(u).equipTo&&C(u).equipTo.uid,m2.uid])); }

/* ===== the target is really a target: a response that removes it ===== */
{ fresh();const u=mon(HW,0),host=mon(CD,0),spare=mon('ジェネクス・コントローラー',0),esc=setCard('強制脱出装置',1);gameState.players[0].mz=[u,host,spare];gameState.players[1].sz=[esc];baselineA();
  activateEquip(u,host);
  ok('target: the opponent is offered 強制脱出装置 in response to the equip activation',offeredTo(1,esc),'');
  respond(1,esc,[uid(host)]);drive();
  ok('target: the targeted Machine is bounced in response → the equip does not happen (it is NOT redirected to the other Machine); ヘビーウェポン stays in the Monster Zone',z(host)==='hand'&&z(u)==='mz'&&!(C(u).v46MonsterEquip===true)&&!(C(spare).equippedBy&&C(spare).equippedBy.length),JSON.stringify([z(host),z(u),C(spare).equippedBy]));
  ok('target: the once-per-turn use is spent by the activation — a free Machine is still on the field but no second try is offered this turn',!canEffect('mz',u),JSON.stringify(zacts('mz',u)));
  audit('ヘビーウェポン target response'); }
{ /* control: the same response window with no removal → the equip resolves */
  fresh();const u=mon(HW,0),host=mon(CD,0),esc=setCard('強制脱出装置',1);gameState.players[0].mz=[u,host];gameState.players[1].sz=[esc];baselineA();
  activateEquip(u,host);drive();
  ok('target control: with nobody answering, the equip resolves on the same chain',equippedTo(u,host),JSON.stringify([z(u),z(host)])); }

/* ===== the substitute: battle AND effect destruction ===== */
{ fresh();const u=mon(HW,0),host=mon(CD,0),att=mon('青眼の白龍',1);gameState.players[0].mz=[u,host];gameState.players[1].mz=[att];baselineA();
  activateEquip(u,host);drive();toOppBattle();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:idx(host)});drive();
  ok('substitute (battle): the equipped サイバー・ドラゴン (2600) is attacked by 青眼 (3000) → ヘビーウェポン is destroyed instead, the Machine stays',z(host)==='mz'&&z(u)==='grave',JSON.stringify([z(host),z(u)]));
  audit('ヘビーウェポン substitute battle'); }
{ fresh();const u=mon(HW,0),host=mon(CD,0);gameState.players[0].mz=[u,host];baselineA();
  activateEquip(u,host);drive();
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(host),reason:'test',byDestroy:true});
  ok('substitute (effect): destroyed by an effect → ヘビーウェポン is destroyed instead, the Machine stays',z(host)==='mz'&&z(u)==='grave',JSON.stringify([z(host),z(u)]));
  audit('ヘビーウェポン substitute effect'); }
{ /* control: a Machine that is NOT sent by a destruction (a plain send to the Graveyard) is not substituted */
  fresh();const u=mon(HW,0),host=mon(CD,0);gameState.players[0].mz=[u,host];baselineA();
  activateEquip(u,host);drive();
  API.sendToGrave(locateCardAnyV4(host),'S03-U469 control (not a destruction)');
  ok('substitute control: a send to the Graveyard that is not a destruction is not replaced — the Machine goes, ヘビーウェポン is sent with it',z(host)==='grave'&&z(u)==='grave',JSON.stringify([z(host),z(u)])); }
{ /* a real targeted destruction: the opponent's サンダー・ブレイク */
  fresh();const u=mon(HW,0),host=mon(CD,0),tb=setCard('サンダー・ブレイク',1);gameState.players[0].mz=[u,host];gameState.players[1].sz=[tb];gameState.players[1].hand=[mk('ワイト',1)];baselineA();
  activateEquip(u,host);drive();endTurn();   /* the opponent turn (really passed) */
  const i=gameState.players[1].sz.indexOf(tb);PREFER=[uid(host)];duelActivateFromZone(1,'sz',i);for(let k=0;k<10&&pc();k++)pick();PREFER=[];drive();
  ok('substitute (real サンダー・ブレイク targeting the Machine): ヘビーウェポン is destroyed instead, the Machine stays',z(host)==='mz'&&z(u)==='grave'&&z(tb)==='grave',JSON.stringify([z(host),z(u),z(tb)]));
  audit('ヘビーウェポン substitute サンダー・ブレイク'); }
{ /* リミッター解除（2011-08-27, WIKI-D032A4FED8D2）: the Machine that would be destroyed at the End Phase is substituted; its ATK goes back */
  fresh();const u=mon(HW,0),host=mon(CD,0),lim=mk('リミッター解除',0);gameState.players[0].mz=[u,host];gameState.players[0].hand=[lim];baselineA();
  activateEquip(u,host);drive();
  castHand(0,'リミッター解除');drive();
  ok('リミッター解除: the equipped Machine ATK is doubled (2600 → 5200)',curATK(C(host))===5200,String(curATK(C(host))));
  phase('end');
  ok('リミッター解除 (WIKI-D032A4FED8D2): at the End Phase the equipped Machine is NOT destroyed — ヘビーウェポン is destroyed instead',z(host)==='mz'&&z(u)==='grave',JSON.stringify([z(host),z(u)]));
  endTurn();
  ok('リミッター解除 (WIKI-53F9211D65D2): the turn ends → the Machine ATK is back to its own 2100 (the +500 left with the card)',z(host)==='mz'&&curATK(C(host))===2100,JSON.stringify([z(host),curATK(C(host))]));
  audit('ヘビーウェポン リミッター解除'); }
{ /* simultaneous destruction (WIKI-A171EBB2ACB6): 最終戦争 destroys the Machine and the Union together → the Machine stays */
  fresh();const u=mon(HW,0),host=mon(CD,0),wight=mon('ワイト',0),fm=mon('ライオウ',1),war=mk('最終戦争',0);
  gameState.players[0].mz=[u,host,wight];gameState.players[1].mz=[fm];gameState.players[0].hand=[war].concat(Array.from({length:5},()=>mk('ワイト',0)));baselineA();
  activateEquip(u,host);drive();
  castHand(0,'最終戦争');drive();
  ok('最終戦争 (WIKI-A171EBB2ACB6): every card on the field is destroyed together → the equipped Machine remains on the field, ヘビーウェポン is destroyed',z(host)==='mz'&&z(u)==='grave'&&z(wight)==='grave'&&z(fm)==='grave',JSON.stringify({host:z(host),u:z(u),wight:z(wight),fm:z(fm)}));
  audit('ヘビーウェポン 最終戦争'); }

/* ===== Save/Load: saved with the target already chosen and the link on the chain (S1), and in the equipped state before the opponent attack (S2) ===== */
globalThis.__SAVES={};
function saveCase(key,extra){globalThis.__SAVES[key]=JSON.stringify(Object.assign({state:gameState,digest:v41StateDigest(gameState)},extra||{}));}
function addFinal(key){globalThis.__SAVES[key]=JSON.stringify(Object.assign(JSON.parse(globalThis.__SAVES[key]),{final:v41StateDigest(gameState)}));}
/* S1: the equip on the chain with the target chosen; the opponent holds 強制脱出装置 (not used) */
{ fresh();const u=mon(HW,0),host=mon(CD,0),other=mon('ジェネクス・コントローラー',0);gameState.players[0].mz=[u,host,other];baselineA();
  const ids=[uid(u),uid(host),uid(other)];
  activateEquip(u,host);
  ok('Save/Load S1 setup: the equip is on the chain with the target chosen, nothing equipped yet',gameState.chain.length===1&&Array.isArray(gameState.chain[0].targets)&&gameState.chain[0].targets.length===1&&!equippedTo(u,host),JSON.stringify({chain:gameState.chain.length}));
  saveCase('S1',{ids});
  drive();
  ok('Save/Load S1 VM1 reference: the Union is equipped to the targeted Machine, not the other one',equippedTo(u,host)&&!(C(other).equippedBy&&C(other).equippedBy.length),JSON.stringify([z(u)]));
  addFinal('S1'); }
/* S2: equipped this turn (the use is spent); saved in the opponent Battle Phase before 青眼 attacks */
{ fresh();const u=mon(HW,0),host=mon(CD,0),att=mon('青眼の白龍',1);gameState.players[0].mz=[u,host];gameState.players[1].mz=[att];baselineA();
  const ids=[uid(u),uid(host),uid(att)];
  activateEquip(u,host);drive();toOppBattle();
  ok('Save/Load S2 setup: equipped, the opponent Battle Phase',equippedTo(u,host)&&gameState.activePlayer===1&&gameState.phase==='battle',JSON.stringify([gameState.activePlayer,gameState.phase]));
  saveCase('S2',{ids});
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:idx(host)});drive();
  ok('Save/Load S2 VM1 reference: the battle destruction is substituted',z(host)==='mz'&&z(u)==='grave',JSON.stringify([z(host),z(u)]));
  addFinal('S2'); }
`);

/* ===== VM2: a fresh engine loads each saved state and carries on ===== */
const SAVES=first.__SAVES||{};
if(!SAVES.S1||!SAVES.S2){console.log('FAIL Save/Load VM1 saves missing');process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+String.raw`
function pc(){return pendingChoiceV49(gameState);}
function zoneOf(u){const x=findCardByUid(u);return x?x.zone:null;}
function cardOf(u){const x=findCardByUid(u);return x?x.card:null;}
function pickU(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}__choicePickV49(0);}
function driveU(){for(let i=0;i<800;i++){
  if(pc()){pickU();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function load(key){const o=JSON.parse(SAVES[key]);resetA();gameState=o.state;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
  reconcileChoiceAfterLoadV49(gameState);return o;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function phaseU(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});driveU();}
function endTurnU(){phaseU('end');requestProcessorV27(PROCESSOR_V27.TURN);driveU();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});driveU();phaseU('standby');phaseU('main1');}
function eqTo(uu,hh){const e=cardOf(uu),h=cardOf(hh);return !!e&&!!h&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===hh&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0&&zoneOf(uu)==='sz';}
function zacts(zone,uu){const h=findCardByUid(uu);return getLegalZoneActions(0,zone,h.index).map(a=>a.id);}

/* S1 */
{ const o=load('S1'),[u,host,other]=o.ids;
  ok('Save/Load S1: the loaded state is the saved state (digest) with the equip link still on the chain and the target recorded',v41StateDigest(gameState)===o.digest&&gameState.chain.length===1&&Array.isArray(gameState.chain[0].targets)&&gameState.chain[0].targets.length===1&&zoneOf(u)==='mz','');
  driveU();
  ok('Save/Load S1 resumed: the loaded link resolves — the Union is equipped to the TARGETED Machine (not the other one)',eqTo(u,host)&&!(cardOf(other).equippedBy&&cardOf(other).equippedBy.length),JSON.stringify([zoneOf(u),cardOf(u)&&cardOf(u).equipTo&&cardOf(u).equipTo.uid]));
  ok('Save/Load S1 resumed: ATK +500 applies and the use is spent (the flag survived the save)',curATK(cardOf(host))===2600&&zacts('sz',u).indexOf('effect')<0,JSON.stringify([curATK(cardOf(host)),zacts('sz',u)]));
  ok('Save/Load S1 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,v41StateDigest(gameState)+' vs '+o.final);
  audit('Save/Load S1'); }
/* S2 */
{ const o=load('S2'),[u,host,att]=o.ids;
  ok('Save/Load S2: loaded equipped in the opponent Battle Phase (digest equal), the Union still carries the Machine and the use is spent',v41StateDigest(gameState)===o.digest&&eqTo(u,host)&&gameState.activePlayer===1&&zacts('sz',u).indexOf('effect')<0,'');
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:findCardByUid(att).index,target:findCardByUid(host).index});driveU();
  ok('Save/Load S2 resumed: 青眼 (3000) attacks the equipped サイバー・ドラゴン (2600) — the loaded Union is destroyed instead, the Machine stays',zoneOf(host)==='mz'&&zoneOf(u)==='grave',JSON.stringify([zoneOf(host),zoneOf(u)]));
  ok('Save/Load S2 resumed: the final digest equals the uninterrupted VM1 run',v41StateDigest(gameState)===o.final,'');
  audit('Save/Load S2'); }
`);
