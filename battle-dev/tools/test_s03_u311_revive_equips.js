/* S03-U311: the Equip Spells that Special Summon a monster and equip themselves to it — 継承の印, 戦線復活の代償, 自律行動ユニット, 契約の履行, 再融合, D・リペアユニット.
   Real DUEL path (activation from the hand, cost, target, resolution, the position choice, the destruction of the Equip Spell through サイクロン), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function ctrl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3110001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function lp(p){return gameState.players[p].lp;}
function legalH(name,i){return strictScriptLegalityV2(name,0,'hand',i||0,{});}
function activate(prefer){PREFER=(prefer||[]).map(uid);duelActivateFromHand(0);drive();PREFER=[];}
/* destroy my Equip Spell with a real サイクロン (a second hand card, index 1) */
let CY=null;
function withCy(){CY=mk('サイクロン',0,'up');gameState.players[0].hand.push(CY);}   /* in the hand before the baseline, so the Replay has it */
function cyclone(target){const i=gameState.players[0].hand.indexOf(CY);PREFER=[uid(target)];duelActivateFromHand(i);drive();PREFER=[];return CY;}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}

/* ===== 継承の印 ===== */
{ fresh();const eq=mk('継承の印',0),w1=mk('ワイト',0),w2=mk('ワイト',0),w3=mk('ワイト',0),o=mk('ライオウ',0);
  gameState.players[0].hand=[eq];gameState.players[0].grave=[w1,w2,w3,o];withCy();baselineA();
  ok('継承の印: 3 same-name monsters in my GY → activatable',legalH('継承の印').ok===true,JSON.stringify(legalH('継承の印')));
  activate([w2]);
  ok('継承の印: the chosen ワイト is Special Summoned and equipped; the other cards stay in the GY',z(w2)==='mz'&&equipped(w2,eq)&&z(w1)==='grave'&&z(w3)==='grave'&&z(o)==='grave',JSON.stringify([z(w2),z(eq),z(o)]));
  cyclone(eq);
  ok('継承の印: the Equip Spell is destroyed → the equipped monster is destroyed',z(eq)==='grave'&&z(w2)==='grave',JSON.stringify([z(eq),z(w2)]));
  audit('継承の印'); }
{ fresh();const eq=mk('継承の印',0);gameState.players[0].hand=[eq];gameState.players[0].grave=[mk('ワイト',0),mk('ワイト',0),mk('ライオウ',0),mk('ライオウ',0)];withCy();baselineA();
  ok('継承の印: refused — only 2 of each name',legalH('継承の印').ok===false,JSON.stringify(legalH('継承の印'))); }

/* ===== 戦線復活の代償 ===== */
{ fresh();const eq=mk('戦線復活の代償',0),nrm=mk('ワイト',0),foe=mk('ライオウ',1);nrm.summonedTurn=3;
  gameState.players[0].hand=[eq];gameState.players[0].mz=[nrm];gameState.players[1].grave=[foe];withCy();baselineA();
  ok('戦線復活の代償: a Normal Monster on my field → activatable',legalH('戦線復活の代償').ok===true,JSON.stringify(legalH('戦線復活の代償')));
  activate([foe]);
  ok('戦線復活の代償: ワイト was sent to the GY (cost); the opponent GY ライオウ is on my field and equipped',z(nrm)==='grave'&&z(foe)==='mz'&&ctrl(foe)===0&&equipped(foe,eq),JSON.stringify([z(nrm),z(foe),ctrl(foe),z(eq)]));
  cyclone(eq);
  ok('戦線復活の代償: the Equip Spell leaves the field → the equipped monster is destroyed',z(eq)==='grave'&&z(foe)==='grave',JSON.stringify([z(eq),z(foe)]));
  audit('戦線復活の代償'); }
{ fresh();const eq=mk('戦線復活の代償',0),nrm=mk('ワイト',0);nrm.summonedTurn=3;
  gameState.players[0].hand=[eq];gameState.players[0].mz=[nrm];withCy();baselineA();activate([nrm]);
  ok('戦線復活の代償: the cost monster itself may be the target (it is in the GY when the target is chosen)',z(nrm)==='mz'&&equipped(nrm,eq),JSON.stringify([z(nrm),z(eq)])); }
{ fresh();const eq=mk('戦線復活の代償',0),eff=mk('ライオウ',0);eff.summonedTurn=3;gameState.players[0].hand=[eq];gameState.players[0].mz=[eff];gameState.players[1].grave=[mk('ワイト',1)];withCy();baselineA();
  ok('戦線復活の代償: refused — no Normal Monster on my field (an Effect Monster does not count)',legalH('戦線復活の代償').ok===false,JSON.stringify(legalH('戦線復活の代償'))); }

/* ===== 自律行動ユニット ===== */
{ fresh();const eq=mk('自律行動ユニット',0),foe=mk('ライオウ',1);gameState.players[0].hand=[eq];gameState.players[1].grave=[foe];withCy();baselineA();
  activate([foe]);
  ok('自律行動ユニット: 1500 LP paid; the opponent GY monster is on my field in Attack Position, equipped',lp(0)===6500&&z(foe)==='mz'&&ctrl(foe)===0&&C(foe).pos==='atk'&&equipped(foe,eq),JSON.stringify([lp(0),z(foe),ctrl(foe),C(foe)&&C(foe).pos]));
  cyclone(eq);
  ok('自律行動ユニット: the Equip Spell leaves the field → that monster is destroyed',z(foe)==='grave',z(foe));
  audit('自律行動ユニット'); }
{ fresh();const eq=mk('自律行動ユニット',0);gameState.players[0].hand=[eq];gameState.players[0].grave=[mk('ライオウ',0)];withCy();baselineA();
  ok('自律行動ユニット: refused — only my own Graveyard has a monster',legalH('自律行動ユニット').ok===false); }
{ fresh();const eq=mk('自律行動ユニット',0);gameState.players[0].hand=[eq];gameState.players[0].lp=1500;gameState.players[1].grave=[mk('ライオウ',1)];withCy();baselineA();
  ok('自律行動ユニット: refused with 1500 LP (the project convention: more LP than the cost)',legalH('自律行動ユニット').ok===false); }

/* ===== 契約の履行 / 再融合 ===== */
{ fresh();const eq=mk('契約の履行',0),rit=mk('カオス・ソルジャー',0);rit.properlySummonedS03=true;gameState.players[0].hand=[eq];gameState.players[0].grave=[rit];withCy();baselineA();
  ok('契約の履行: a properly summoned Ritual Monster in my GY → activatable',legalH('契約の履行').ok===true,JSON.stringify(legalH('契約の履行')));
  activate([rit]);
  ok('契約の履行: 800 LP paid, the Ritual Monster is on my field and equipped',lp(0)===7200&&z(rit)==='mz'&&equipped(rit,eq),JSON.stringify([lp(0),z(rit),z(eq)]));
  cyclone(eq);
  ok('契約の履行: the Equip Spell is destroyed → the equipped monster is banished (not destroyed)',z(eq)==='grave'&&z(rit)==='banish',JSON.stringify([z(eq),z(rit)]));
  audit('契約の履行'); }
{ fresh();const eq=mk('契約の履行',0),rit=mk('カオス・ソルジャー',0);gameState.players[0].hand=[eq];gameState.players[0].grave=[rit];withCy();baselineA();
  ok('契約の履行: refused — the Ritual Monster was never properly summoned',legalH('契約の履行').ok===false,JSON.stringify(legalH('契約の履行'))); }
{ fresh();const eq=mk('契約の履行',0);gameState.players[0].hand=[eq];gameState.players[0].grave=[mk('ライオウ',0)];withCy();baselineA();
  ok('契約の履行: refused — no Ritual Monster in the GY',legalH('契約の履行').ok===false); }
{ fresh();const eq=mk('再融合',0),fus=mk('E・HERO アクア・ネオス',0);fus.properlySummonedS03=true;gameState.players[0].hand=[eq];gameState.players[0].grave=[fus];withCy();baselineA();
  ok('再融合: a properly summoned Fusion Monster in my GY → activatable',legalH('再融合').ok===true,JSON.stringify(legalH('再融合')));
  activate([fus]);
  ok('再融合: 800 LP paid, the Fusion Monster is on my field and equipped',lp(0)===7200&&z(fus)==='mz'&&equipped(fus,eq),JSON.stringify([lp(0),z(fus),z(eq)]));
  cyclone(eq);
  ok('再融合: the Equip Spell is destroyed → the monster is banished',z(eq)==='grave'&&z(fus)==='banish',JSON.stringify([z(eq),z(fus)]));
  audit('再融合'); }
{ fresh();const eq=mk('再融合',0);gameState.players[0].hand=[eq];gameState.players[0].grave=[mk('E・HERO アクア・ネオス',0)];withCy();baselineA();
  ok('再融合: refused — the Fusion Monster was never properly summoned',legalH('再融合').ok===false); }

/* ===== D・リペアユニット ===== */
{ fresh();const eq=mk('D・リペアユニット',0),hd=mk('D・ナポレオン',0),gd=mk('D・ステープラン',0);gameState.players[0].hand=[eq,hd];gameState.players[0].grave=[gd];withCy();baselineA();
  ok('D・リペアユニット: a 「D」 monster in the hand → activatable',legalH('D・リペアユニット').ok===true,JSON.stringify(legalH('D・リペアユニット')));
  activate([gd]);
  ok('D・リペアユニット: the hand 「D」 was sent to the GY (cost); the GY 「D」 is on my field and equipped',z(hd)==='grave'&&z(gd)==='mz'&&equipped(gd,eq),JSON.stringify([z(hd),z(gd),z(eq)]));
  gameState.phase='main1';
  ok('D・リペアユニット: the equipped monster cannot change its battle position',cannotChangePositionV10(C(gd))===true,String(cannotChangePositionV10(C(gd))));
  cyclone(eq);
  ok('D・リペアユニット: the Equip Spell leaves the field → the equipped monster is destroyed',z(gd)==='grave',z(gd));
  audit('D・リペアユニット'); }
{ fresh();const eq=mk('D・リペアユニット',0);gameState.players[0].hand=[eq,mk('ライオウ',0)];gameState.players[0].grave=[mk('D・ステープラン',0)];withCy();baselineA();
  ok('D・リペアユニット: refused — no 「D」 monster in the hand',legalH('D・リペアユニット').ok===false); }
`);
