/* S03-U16 C-S03-13 COST_SELECTION_FIRST
   Requirement: a legacy script whose selectTargets picks the card used as cost (tribute, banish, discard) and whose cost reads
   ctx.selectedTargets can be activated on the real path: the cost card is chosen, the cost is paid, the cost card is not left
   as a chain-link target, a real target that the cost does not move stays, and values the cost records on ctx
   (original ATK, Level) reach the resolution.
   Before the fix: prepareDuelActivation paid cost before selectTargets, so these activations failed with 「コストを払えません」
   (a set card was left face-up), and resolution rebuilt ctx without the values recorded during cost.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function settle(){for(let k=0;k<12;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function link(name){return (gameState.chain||[]).find(l=>l.name===name)||null;}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
const DECLARED=['キング・オブ・ビースト','昇天の角笛','XX－セイバー ガトムズ','吹き荒れるウィン','D・チャッカン','ジュラック・ティラヌス','ダーク・ダイブ・ボンバー','ヘル・ドラゴン',
 'ギョッ!','フレムベルカウンター','ダーク・パーシアス','シンクロ・チェンジ','泣き神の石像','ビーストライザー','ドラグニティナイト－ゲイボルグ','フューチャー・グロウ','ユニバード',
 '鬼ゴブリン','アサルト・スピリッツ','D・クリーナン','ジェムエレファント'];

/* ===== declaration coverage ===== */
const missing=DECLARED.filter(n=>!(typeof costSelectionFirstS03==='function'&&costSelectionFirstS03(n,CARD_SCRIPTS[n])));
ok('all 21 scripts whose cost reads the selection (and whose text or rulings make it a cost) are declared and still have selectTargets + cost',DECLARED.length===21&&!missing.length,JSON.stringify(missing));
const PROCEDURES=['異次元の精霊','マジック・ストライカー','パワー・ジャイアント'];
ok('the three chain-less Special Summon procedures (summon procedures since S03-U17) are not declared (異次元の精霊: Wiki 10/11/17 召喚ルール効果)',PROCEDURES.every(n=>!(typeof costSelectionFirstS03==='function'&&costSelectionFirstS03(n,CARD_SCRIPTS[n]))));

/* ===== キング・オブ・ビースト: tribute モジャ from the hand activation ===== */
fresh();gameState.players[0].mz=[mk('モジャ')];gameState.players[0].hand=[mk('キング・オブ・ビースト')];baselineA();
duelActivateFromHand(0);
ok('キング・オブ・ビースト: activation from the hand first asks which モジャ to tribute',!!pendingChoiceV49(gameState)&&labels().some(l=>l.includes('モジャ')),JSON.stringify({labels:labels(),toasts:TOASTS}));
pick('モジャ');
const kbLink=link('キング・オブ・ビースト');
ok('キング・オブ・ビースト: モジャ is tributed as cost and is not left as a chain-link target',!!kbLink&&(kbLink.targets||[]).length===0&&gameState.players[0].grave.some(c=>nm(c)==='モジャ'),JSON.stringify({link:kbLink&&kbLink.targets,grave:gameState.players[0].grave.map(nm),toasts:TOASTS}));
settle();
ok('キング・オブ・ビースト: resolution Special Summons it from the hand',mzNames(0).includes('キング・オブ・ビースト'),JSON.stringify(mzNames(0)));
replay('キング・オブ・ビースト');

/* ===== ビーストライザー: the banished monster's original ATK reaches the resolution ===== */
fresh();const riser=mk('ビーストライザー',0,'down');riser.setTurn=3;gameState.players[0].sz=[riser];
const ele=mk('エレファン'),air=mk('X－セイバー エアベルン');gameState.players[0].mz=[ele,air];baselineA();
duelActivateFromZone(0,'sz',0);
settle();
ok('ビーストライザー: the set Continuous Trap is activated first as a card (no effect choice; it stays face-up)',riser.face==='up'&&gameState.players[0].sz.includes(riser)&&!gameState.chain.length&&!pendingChoiceV49(gameState),JSON.stringify({face:riser.face,toasts:TOASTS}));
duelActivateFromZone(0,'sz',0);
pick('エレファン');
const brLink=link('ビーストライザー');
ok('ビーストライザー: エレファン is banished as cost; the link carries its original ATK 500 and no target',
  !!brLink&&(brLink.targets||[]).length===0&&brLink.costCtxS03&&brLink.costCtxS03.e4BanishedAtk===500&&gameState.players[0].banish.some(c=>nm(c)==='エレファン'),
  JSON.stringify({link:brLink&&{t:brLink.targets,c:brLink.costCtxS03},toasts:TOASTS}));
const airAtk0=curATK(air);
if(drive()==='choice')pick('X－セイバー エアベルン');settle();
ok('ビーストライザー: resolution raises X－セイバー エアベルン by the banished original ATK (1600 → 2100)',curATK(air)===airAtk0+500,JSON.stringify({before:airAtk0,now:curATK(air)}));
replay('ビーストライザー');

/* ===== シンクロ・チェンジ: the banished Synchro Level reaches the resolution ===== */
fresh();const synField=mk('C・ドラゴン'),synEx=mk('C・ドラゴン');gameState.players[0].mz=[synField];gameState.players[0].ex=[synEx];
gameState.players[0].hand=[mk('シンクロ・チェンジ')];baselineA();
duelActivateFromHand(0);
pick('C・ドラゴン');
const scLink=link('シンクロ・チェンジ');
ok('シンクロ・チェンジ: the field C・ドラゴン is banished as cost; the link carries Level 6',
  !!scLink&&scLink.costCtxS03&&scLink.costCtxS03.d5SyncLv===6&&gameState.players[0].banish.some(c=>c===synField),JSON.stringify({link:scLink&&scLink.costCtxS03,toasts:TOASTS}));
settle();
ok('シンクロ・チェンジ: resolution Special Summons the Level 6 Synchro from the Extra Deck with its effects negated',
  gameState.players[0].mz.includes(synEx)&&effectNegated(synEx),JSON.stringify({mz:mzNames(0),ex:gameState.players[0].ex.map(nm)}));
replay('シンクロ・チェンジ');

/* ===== 昇天の角笛: negates a Normal Summon in the summon-negation window ===== */
fresh();const horn=mk('昇天の角笛',1,'down');horn.setTurn=3;gameState.players[1].sz=[horn];gameState.players[1].mz=[mk('セイバーザウルス',1)];
gameState.players[0].hand=[mk('ヂェミナイ・エルフ')];baselineA();
doNormalSummon(0,'atk');
activateSummonNegatorV2(1,'sz',0);
pick('セイバーザウルス');
settle();
ok('昇天の角笛: tributing セイバーザウルス negates the Normal Summon; ヂェミナイ・エルフ goes to the GY and the window closes',
  gameState.players[0].grave.some(c=>nm(c)==='ヂェミナイ・エルフ')&&!mzNames(0).includes('ヂェミナイ・エルフ')&&!gameState.pendingSummon
  &&gameState.players[1].grave.some(c=>nm(c)==='セイバーザウルス')&&gameState.players[1].grave.some(c=>nm(c)==='昇天の角笛'),
  JSON.stringify({p0:{mz:mzNames(0),grave:gameState.players[0].grave.map(nm)},p1grave:gameState.players[1].grave.map(nm),toasts:TOASTS}));
replay('昇天の角笛');

/* ===== アサルト・スピリッツ (not equipped): a real target that the cost does not move stays on the link ===== */
fresh();const spirits=mk('アサルト・スピリッツ',0,'down');spirits.setTurn=3;gameState.players[0].sz=[spirits];const host=mk('ワイト');gameState.players[0].mz=[host];baselineA();
duelActivateFromZone(0,'sz',0);
pick('ワイト');
const asLink=link('アサルト・スピリッツ');
ok('アサルト・スピリッツ: the equip target ワイト stays on the link (its cost does not move it)',!!asLink&&(asLink.targets||[]).length===1,JSON.stringify({link:asLink&&asLink.targets,toasts:TOASTS}));
settle();
ok('アサルト・スピリッツ: resolution equips it to ワイト',!!spirits.equipTo&&spirits.equipTo.uid===host.uid,JSON.stringify({equipTo:spirits.equipTo}));
replay('アサルト・スピリッツ');
`);
