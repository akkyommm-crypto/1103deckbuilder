/* S03-U29 NEGATED_ACTIVATION_TO_GRAVE
   Requirement: a Spell/Trap card whose card activation is negated is sent to the GY when that chain link resolves. It is not destroyed,
   and it is not treated as sent from the field to the GY (1103 ruling R1103-SUPERVISE-002:
   「カードの発動を無効にされた場合、表側表示でフィールド上から墓地へ送られた扱いにならない」).
   Before the fix: resolveOnePreparedLinkV27 returned early for activation-negated links, so a card whose activation was negated without
   destruction (ミドル・シールド・ガードナー, ダメージ・ポラリライザー) stayed face-up in the Spell & Trap Zone.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;QEV.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
/* record the events queued for each card; LEAVE are the ones a card sent from the field would cause */
/* the events a card really sent from the field to the GY causes (FX_TO_GRAVE).
   System v9's generic onLeaveField is a snapshot diff of the zones and is not one of them (S03-U29 ②). */
const LEAVE=['onDestroy','onSendToGrave','onRemove'];
function leaveEvents(uid){return QEV.filter(e=>e.uid===uid&&LEAVE.includes(e.n)).map(e=>e.n);}
const QEV=[];const __qev=queueDeferredEventV2;
queueDeferredEventV2=function(n,e){QEV.push({n,uid:e?(e.uid!=null?e.uid:(e.card?e.card.uid:null)):null});return __qev.apply(this,arguments);};
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
/* a card really sent from the field to the GY records graveInfo.from = mz/sz/field; a negated activation must not */
function graveFromField(c){const h=findCardByUid(c.uid),gi=h&&h.card&&h.card.graveInfo;return !!(gi&&['mz','sz','field'].includes(gi.from));}
function ready(p){gameState.activePlayer=p;gameState.phase='main1';baselineA();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
function negatedSend(pkg){return pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='FX_SELF_TO_GRAVE'&&x.reason==='発動を無効');}
function respond(p,name){const list=getChainResponsesV2(p).map(x=>x.db.n);if(!list.includes(name))throw Error(name+' not offered: '+JSON.stringify(list)+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  duelActivateResponseV2(p,'sz',gameState.players[p].sz.findIndex(c=>nm(c)===name));}
function setCard(name,p){const c=mk(name,p,'down');c.setTurn=gameState.turn-1;return c;}
function decks(){gameState.players[0].deck=[mk('はにわ',0,'down'),mk('はにわ',0,'down')];gameState.players[1].deck=[mk('はにわ',1,'down'),mk('はにわ',1,'down')];}

/* ===== A. ダメージ・ポラリライザー negates 火の粉 (a Normal Spell activated from the hand) ===== */
fresh();decks();
gameState.players[0].sz=[setCard('ダメージ・ポラリライザー',0)];
let hk=mk('火の粉',1);gameState.players[1].hand=[hk];ready(1);
let lp0=gameState.players[0].lp;
duelActivateFromHand(0);respond(0,'ダメージ・ポラリライザー');settle();
let pkg=audit('ダメージ・ポラリライザー vs 火の粉');
ok('ダメージ・ポラリライザー: 火の粉, whose activation it negated, is sent to P2’s GY when its link resolves (not left in the Spell & Trap Zone); P1 takes no damage',
  zoneOf(hk)==='grave'&&gameState.players[1].grave.some(c=>c.uid===hk.uid)&&gameState.players[0].lp===lp0&&negatedSend(pkg),
  JSON.stringify({hk:zoneOf(hk),sz1:gameState.players[1].sz.map(nm),g1:gameState.players[1].grave.map(nm),lp0:gameState.players[0].lp,toasts:TOASTS.slice(-3)}));
ok('ダメージ・ポラリライザー: 火の粉 is not destroyed and is not treated as sent from the field to the GY (no destroy / send-to-GY / field-departure event for it)',
  leaveEvents(hk.uid).length===0,JSON.stringify({leave:leaveEvents(hk.uid),qev:QEV}));
ok('ダメージ・ポラリライザー: the negated 火の粉 in the GY does not record that it came from the field (1103 R1103-SUPERVISE-002)',
  !graveFromField(hk),JSON.stringify({gi:(findCardByUid(hk.uid)||{}).card&&findCardByUid(hk.uid).card.graveInfo||null}));

/* ===== B. ミドル・シールド・ガードナー negates シールドクラッシュ (S03-U28 ②) ===== */
fresh();
let msg=mk('ミドル・シールド・ガードナー',0,'down','def');msg.setTurn=gameState.turn-1;gameState.players[0].mz=[msg];
let shc=mk('シールドクラッシュ',1);gameState.players[1].hand=[shc];ready(1);
duelActivateFromHand(0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===msg.uid);__choicePickV49(i<0?0:i);}
settle();
pkg=audit('MSG vs シールドクラッシュ');
ok('MSG: シールドクラッシュ, whose activation MSG negated, is sent to P2’s GY; MSG stays face-up in Defense Position',
  zoneOf(shc)==='grave'&&zoneOf(msg)==='mz'&&faceOf(msg)==='up'&&negatedSend(pkg)&&leaveEvents(shc.uid).length===0&&!graveFromField(shc),
  JSON.stringify({shc:zoneOf(shc),msg:zoneOf(msg),face:faceOf(msg),sz1:gameState.players[1].sz.map(nm),qev:QEV,toasts:TOASTS.slice(-3)}));

/* ===== C. ダメージ・ポラリライザー negates the set Normal Trap 岩投げアタック (activation from the set state) ===== */
fresh();decks();
gameState.players[0].sz=[setCard('ダメージ・ポラリライザー',0)];
let rock=setCard('岩投げアタック',1);gameState.players[1].sz=[rock];ready(1);
lp0=gameState.players[0].lp;
duelActivateFromZone(1,'sz',0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)__choicePickV49(0);
respond(0,'ダメージ・ポラリライザー');settle();
pkg=audit('ダメージ・ポラリライザー vs set 岩投げアタック');
ok('ダメージ・ポラリライザー: the set 岩投げアタック, whose activation it negated, is sent to P2’s GY; no Rock monster is milled and P1 takes no damage',
  zoneOf(rock)==='grave'&&!gameState.players[1].grave.some(c=>nm(c)==='はにわ')&&gameState.players[0].lp===lp0&&negatedSend(pkg)&&leaveEvents(rock.uid).length===0&&!graveFromField(rock),
  JSON.stringify({rock:zoneOf(rock),g1:gameState.players[1].grave.map(nm),sz1:gameState.players[1].sz.map(nm),lp0:gameState.players[0].lp,qev:QEV,toasts:TOASTS.slice(-3)}));

/* ===== D. control: ゴブリンのその場しのぎ returns the negated 火の粉 to the hand ===== */
fresh();decks();
gameState.players[0].sz=[setCard('ゴブリンのその場しのぎ',0)];
hk=mk('火の粉',1);gameState.players[1].hand=[hk];ready(1);
duelActivateFromHand(0);respond(0,'ゴブリンのその場しのぎ');settle();
pkg=audit('control ゴブリンのその場しのぎ');
ok('control: 火の粉 negated by ゴブリンのその場しのぎ returns to P2’s hand and is not sent to the GY',
  zoneOf(hk)==='hand'&&!negatedSend(pkg),JSON.stringify({hk:zoneOf(hk),g1:gameState.players[1].grave.map(nm),toasts:TOASTS.slice(-3)}));

/* ===== E. control: 誤作動 sets the negated 岩投げアタック again ===== */
fresh();decks();
gameState.players[0].sz=[setCard('誤作動',0)];
rock=setCard('岩投げアタック',1);gameState.players[1].sz=[rock];ready(1);
duelActivateFromZone(1,'sz',0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)__choicePickV49(0);
respond(0,'誤作動');settle();
pkg=audit('control 誤作動');
ok('control: 岩投げアタック negated by 誤作動 is set face-down again in P2’s Spell & Trap Zone and is not sent to the GY',
  zoneOf(rock)==='sz'&&faceOf(rock)==='down'&&!negatedSend(pkg),JSON.stringify({rock:zoneOf(rock),face:faceOf(rock),g1:gameState.players[1].grave.map(nm),toasts:TOASTS.slice(-3)}));

/* ===== F. control: an unnegated 火の粉 resolves and goes to the GY as before ===== */
fresh();decks();
hk=mk('火の粉',1);gameState.players[1].hand=[hk];ready(1);
lp0=gameState.players[0].lp;
duelActivateFromHand(0);settle();
pkg=audit('control 火の粉 resolves');
ok('control: an unnegated 火の粉 deals 200 damage and goes to the GY after resolving',
  zoneOf(hk)==='grave'&&gameState.players[0].lp===lp0-200&&!negatedSend(pkg),JSON.stringify({hk:zoneOf(hk),lp0:gameState.players[0].lp}));
`);
