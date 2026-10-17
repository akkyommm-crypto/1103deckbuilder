/* S03-U135: AUTO_DECK_TABLE identity filters (cardCode / group / canonical) were never applied by autoDeckMatches, so the
   live auto-table cards could search / recruit / mill ANY Deck card. コアキメイル・ロック gets a card-specific script.
   Real DUEL path where a duel is involved, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[],SEEN=[];
function pick(){const q=pc();SEEN.push({title:q.title,cands:q.candidates.map(x=>x.name||x.label||(x.card?nm(x.card):x.value))});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<400;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';}
const DB=CARD_DB.filter?CARD_DB:Object.values(CARD_DB);
`;

/* ===== A. every live auto-table entry with an identity filter: a non-matching card is never a candidate, the named ones are ===== */
harness(COMMON+String.raw`
let checked=0;const leak=[],lost=[];
for(const [name,ent] of Object.entries(AUTO_DECK_TABLE)){
  const sc=CARD_SCRIPTS[name];
  /* S03-U156: entries migrated to the shared deck-trigger engine (engine/1ZT) are checked through the engine's own pool */
  const viaEngine=(typeof DECK_TRIGGER_S03!=='undefined')?DECK_TRIGGER_S03[name]:null;
  if(!viaEngine&&!(sc&&sc.autoDeck)) continue;
  const f=ent.f||{}; if(f.cardCode==null&&f.group==null&&f.canonical==null) continue;
  const match=viaEngine?()=>deckTriggerPoolS03(name,Object.assign({},viaEngine,{action:'search',from:['deck']}),0):()=>autoDeckMatches(0,f);
  checked++;
  resetA();
  let targets;
  if(f.cardCode!=null) targets=DB.filter(d=>d&&d.c===Number(f.cardCode));
  else if(f.canonical!=null) targets=DB.filter(d=>d&&canonicalCardCodeV4(d)===Number(f.canonical));
  else targets=DB.filter(d=>d&&d.n&&isCardInGroupV4(d,f.group));
  /* keep the targets that also satisfy the entry's other filters (the full filter is applied to a single-card Deck) */
  const ok1=targets.filter(d=>{gameState.players[0].deck=[mk(d.n,0)];return match().length===1;});
  gameState.players[0].deck=[mk('ワイト',0),mk('サンダー・ボルト',0)].concat(ok1.slice(0,4).map(d=>mk(d.n,0)));
  const got=match().map(x=>x.db.n);
  if(got.some(n=>n==='ワイト'||n==='サンダー・ボルト')) leak.push(name);
  if(ok1.length && !got.length) lost.push(name);
}
/* S03-U372: six entries (ハイエナ, スーパイ, クロス・ポーター, メンタルマスター, リバース・オブ・ネオス, トライアングル・エリア) became exact card scripts and left the auto table, so the live count fell from 82 to 76; the floor is 70. S03-U373: five more left (ヴァイロン・マテリアル, 極星宝ドラウプニル, スクラップ・シャーク, 見習い魔術師, 機皇城); the PARTIAL auto-table entries are being replaced one batch at a time, so the floor is lowered to 50 (no behaviour expectation changes). */
ok('A: all live identity-filter entries checked',checked>=50,String(checked));
ok('A: no entry offers a non-matching card (ワイト / サンダー・ボルト)',leak.length===0,JSON.stringify(leak));
ok('A: every entry still finds its named card / group member',lost.length===0,JSON.stringify(lost));
`);

/* ===== B. real DUEL activation: D・リモコン (group D) and バード・フェイス (canonical ハーピィ・レディ) only offer matching cards ===== */
harness(COMMON+String.raw`
fresh();
const rc=mk('D・リモコン',0,'up');gameState.players[0].mz=[rc];
const dm=DB.find(d=>d.k==='m'&&isCardInGroupV4(d,GROUP.D_MORPHTRONIC)&&d.n!=='D・リモコン');
gameState.players[0].deck=[mk('ワイト',0),mk(dm.n,0),mk('サンダー・ボルト',0)];
baselineA();
duelActivateFromZone(0,'mz',0);drive();
const q=SEEN.find(s=>/D・リモコン/.test(s.title));
ok('B: D・リモコン offers only the D monster ('+dm.n+')',!!q&&JSON.stringify(q.cands)===JSON.stringify([dm.n]),JSON.stringify(SEEN));
ok('B: … and adds it to the hand',gameState.players[0].hand.map(nm).indexOf(dm.n)>=0);
audit('B');
/* S03-U156: バード・フェイス is 「このカードが戦闘によって破壊され墓地へ送られた時」 (it was an ignition effect from the field here):
   destroyed by an attack, its trigger searches through the shared deck-trigger engine (engine/1ZT). */
fresh();SEEN=[];
const bf=mk('バード・フェイス',0,'up');gameState.players[0].mz=[bf];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
gameState.players[0].deck=[mk('ワイト',0),mk('ハーピィ・レディ1',0),mk('ハーピィ・ガール',0)];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
const q2=SEEN.find(s=>/バード・フェイス/.test(s.title));
ok('B: バード・フェイス offers ハーピィ・レディ1 (treated as ハーピィ・レディ) only — not ハーピィ・ガール / ワイト',!!q2&&JSON.stringify(q2.cands)==='["ハーピィ・レディ1"]',JSON.stringify(SEEN));
audit('B2');
`);

/* ===== C. コアキメイル・ロック: destroyed by battle → add コアキメイルの鋼核 or a Lv4-or-lower コアキメイル monster ===== */
harness(COMMON+String.raw`
fresh();
const kl=mk('コアキメイル・ロック',0,'up');gameState.players[0].mz=[kl];
const foe=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[foe];
const core=mk('コアキメイルの鋼核',0),hi=mk('コアキメイル・ルークロード',0);gameState.players[0].deck=[mk('ワイト',0),hi,mk('コアキメイル・ドラゴ',0),core];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
ok('C: not an ignition effect any more (illegal in the Main Phase)',(gameState.phase='main1',strictScriptLegalityV2('コアキメイル・ロック',0,'mz',0,{}).ok===false));
gameState.phase='battle';
PREFER=[uid(core)];
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();PREFER=[];
const q=SEEN.find(s=>/コアキメイル・ロック/.test(s.title));
ok('C: destroyed by battle → the search offers 鋼核 and the Lv4 コアキメイル・ドラゴ, but not ワイト / the Lv5+ コアキメイル',z(kl)==='grave'&&!!q&&q.cands.indexOf('コアキメイルの鋼核')>=0&&q.cands.indexOf('コアキメイル・ドラゴ')>=0&&q.cands.indexOf('ワイト')<0&&q.cands.indexOf('コアキメイル・ルークロード')<0,JSON.stringify({kl:z(kl),SEEN}));
ok('C: コアキメイルの鋼核 added to the hand',z(core)==='hand');
audit('C');
`);
