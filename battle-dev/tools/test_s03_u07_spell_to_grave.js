/* S03-U07: C-S03-04 RESOLVED_SPELL_TO_GY.
   Game rule: a Normal / Quick-Play / Counter Spell or a Normal / Counter Trap is sent to the GY after it resolves.
   Before the fix, unified cards whose effect declared afterResolve(){} stayed in the S/T zone (measured on U05 build).
   Exceptions kept on the field: Continuous / Field / Equip (link.keep), cards that became Equip Cards, cards set
   face-down again (くず鉄のかかし), and cards declaring remainsOnFieldAfterResolve (光の護封剣).
   Helper cards are TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function pass(){for(let i=0;i<120;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;
 }throw Error('pass loop');}
function pick(c){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>x.uid===c.uid);if(i<0)throw Error('candidate missing '+cardName(c));__choicePickV49(i);}
function pickFirst(){const pc=pendingChoiceV49(gameState);if(!pc)return false;__choicePickV49(0);if(pc.max>1||pc.min!==pc.max)__choiceCommitV49();return true;}
function settle(){for(let i=0;i<10;i++){pass();if(!pickFirst())break;}pass();}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+' Replay nonempty and consistent',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function zoneOf(uid){const x=findCardByUid(uid);return x?x.zone:null;}
function faceOf(uid){const x=findCardByUid(uid);return x?x.card.face:null;}
function deck5(){return [mk('サイクロン'),mk('サイクロン'),mk('E・HERO クレイマン'),mk('ゴブリン突撃部隊'),mk('サイクロン')];}
function spellCase(name,setup,drive){
 fresh();const s=mk(name);gameState.players[0].hand=[s];gameState.players[0].deck=deck5();const extra=setup()||{};baselineA();
 const L=strictScriptLegalityV2(name,0,'hand',0,{cardOverride:s,logicalZone:'sz',prospectiveIndex:gameState.players[0].sz.length});
 ok(name+' is legal in the fixture',L.ok,JSON.stringify(L));
 duelActivateFromHand(0);(drive||settle)(extra);settle();
 return {s,extra};
}
`;

harness(COMMON+String.raw`
/* ===== unified Normal Spells now go to the GY after resolving ===== */
let c=spellCase('調和の宝札',()=>{const t=mk('ドラグニティ－ファランクス');gameState.players[0].hand.push(t);return {t};},x=>{pick(x.t);});
ok('調和の宝札 draws 2 and goes to GY',zoneOf(c.s.uid)==='grave'&&zoneOf(c.extra.t.uid)==='grave'&&gameState.players[0].hand.length===2,JSON.stringify({s:zoneOf(c.s.uid),hand:gameState.players[0].hand.length}));
replay('調和の宝札');

c=spellCase('トレード・イン',()=>{const t=mk('青眼の白龍');gameState.players[0].hand.push(t);return {t};},x=>{pick(x.t);});
ok('トレード・イン draws 2 and goes to GY',zoneOf(c.s.uid)==='grave'&&zoneOf(c.extra.t.uid)==='grave'&&gameState.players[0].hand.length===2);
replay('トレード・イン');

c=spellCase('太陽の書',()=>{const t=mk('ゴブリン突撃部隊',1,'down','def');gameState.players[1].mz=[t];return {t};},x=>{pick(x.t);});
ok('太陽の書 flips the monster and goes to GY',zoneOf(c.s.uid)==='grave'&&faceOf(c.extra.t.uid)==='up');
replay('太陽の書');

c=spellCase('アドバンスドロー',()=>{const t=mk('青眼の白龍');gameState.players[0].mz=[t];return {t};},x=>{pick(x.t);});
ok('アドバンスドロー tributes, draws 2 and goes to GY',zoneOf(c.s.uid)==='grave'&&zoneOf(c.extra.t.uid)==='grave'&&gameState.players[0].hand.length===2);
replay('アドバンスドロー');

c=spellCase('押収',()=>{const t=mk('サイクロン',1);gameState.players[1].hand=[t];return {t};},()=>{});
ok('押収 discards from opponent hand and goes to GY',zoneOf(c.s.uid)==='grave'&&zoneOf(c.extra.t.uid)==='grave'&&gameState.players[0].lp===7000);
replay('押収');

c=spellCase('強引な番兵',()=>{const t=mk('サイクロン',1);gameState.players[1].hand=[t];return {t};},()=>{});
ok('強引な番兵 returns a card to the opponent Deck and goes to GY',zoneOf(c.s.uid)==='grave'&&zoneOf(c.extra.t.uid)==='deck');
replay('強引な番兵');

c=spellCase('化石調査',()=>{const t=mk('ジュラック・ガリム');gameState.players[0].deck.unshift(t);return {t};},x=>{pick(x.t);});
ok('化石調査 adds and goes to GY',zoneOf(c.s.uid)==='grave'&&zoneOf(c.extra.t.uid)==='hand');
replay('化石調査');

/* ===== unified Normal Trap ===== */
fresh();let trap=mk('援軍',0,'down');trap.setTurn=gameState.turn-1;let mon=mk('ゴブリン突撃部隊');
gameState.players[0].mz=[mon];gameState.players[0].sz=[trap];baselineA();
prepareDuelActivation('援軍',0,'sz',0,{});pick(mon);settle();
ok('援軍 boosts ATK and the Normal Trap goes to GY',zoneOf(trap.uid)==='grave'&&curATK(mon)===(dbOf(mon).atk||0)+500,JSON.stringify({z:zoneOf(trap.uid),atk:curATK(mon)}));
replay('援軍');

/* ===== legacy Normal Spell with an empty afterResolve ===== */
c=spellCase('心変わり',()=>{const t=mk('ゴブリン突撃部隊',1);gameState.players[1].mz=[t];return {t};},x=>{pick(x.t);});
ok('心変わり takes control and goes to GY',zoneOf(c.s.uid)==='grave'&&findCardByUid(c.extra.t.uid).p===0);
replay('心変わり');

/* ===== intended exceptions stay on the field ===== */
c=spellCase('光の護封剣',()=>{gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'down','def')];},()=>{});
ok('光の護封剣 remains face-up on the field after resolving',zoneOf(c.s.uid)==='sz'&&faceOf(c.s.uid)==='up');
replay('光の護封剣 remains');

c=spellCase('団結の力',()=>{const t=mk('ゴブリン突撃部隊');gameState.players[0].mz=[t];return {t};},x=>{pick(x.t);});
ok('Equip Spell 団結の力 stays equipped',zoneOf(c.s.uid)==='sz'&&!!findCardByUid(c.s.uid).card.equipTo);
replay('団結の力 stays');
`);
