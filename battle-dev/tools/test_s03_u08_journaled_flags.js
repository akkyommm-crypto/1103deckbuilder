/* S03-U08 C-S03-05 JOURNALED_CARD_FLAGS
   Requirement: card and player state written while an effect is processed must be written by a journaled Action,
   so the Replay audit reproduces the live digest (v41CardDigest includes every primitive card field,
   and player temporaryFlags / effectFlags are part of the state digest).
   Found by vertical slice #1: レスキューラビット set rabbitEndDestroyTurn directly → Replay digest mismatch.
   1. Lint over card scripts (no card names): no direct card-field or player-flag writes remain.
   2. Real DUEL paths with Replay audits: レスキューラビット (+ End Phase destroy through its flag), 鬼ガエル ③ (player flag in cost),
      トラゴエディア ④ (+ End Phase level reset clears the flag through an Action), ボルト・ヘッジホッグ, BF－暁のシロッコ.
   3. Flag writes are silent in the duel log; second-VM continuation keeps the flags and the reserve works. */
const harness=require('./astra_harness');
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');

/* ---------- 1. lint (node side) ---------- */
const lint=[];const lok=(name,v,detail='')=>{lint.push({name,ok:!!v,detail});console.log((v?'PASS ':'FAIL ')+name+(v?'':' — '+detail));};
{
  const eng=fs.readFileSync(path.join(ROOT,'engine','00_state_actions.js'),'utf8');
  const a=eng.indexOf('const ZONE_LOCAL_KEYS = ['),b=eng.indexOf('];',a);
  const keys=[...eng.slice(a,b).matchAll(/'([A-Za-z0-9_]+)'/g)].map(m=>m[1]);
  const extra=['negated','negatedUntilTurn','lvMod','cannotAttack','banishWhenLeavesField','spearProof','wallValue'];
  const skip=new Set(['mods','counters','xyz','equips','controller']);
  const names=[...new Set(keys.concat(extra))].filter(k=>!skip.has(k));
  const cardRe=new RegExp('([A-Za-z0-9_\\]\\)\\.]+)\\.('+names.join('|')+'|v\\d{3}[A-Za-z0-9_]+)\\s*=(?!=)','g');
  const playerRe=/(temporaryFlags|effectFlags)(\.[A-Za-z0-9_$]+|\[[^\]]+\])\s*(=(?!=)|\+\+|--|\+=|-=)/g;
  const nonCard=/^(ctx|gs|g|gameState|P|this|state|out|o|entry|opts|a|pl|meta|res|result|step|link|d|desc|args)$/;
  const stripComments=s=>s.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g,(m,p)=>p+' '.repeat(m.length-p.length));
  const cardHits=[],playerHits=[];
  for(const f of fs.readdirSync(path.join(ROOT,'cards')).filter(f=>f.endsWith('.js'))){
    const s=stripComments(fs.readFileSync(path.join(ROOT,'cards',f),'utf8'));let m;
    while((m=cardRe.exec(s))){
      if(nonCard.test(m[1]))continue;
      const before=s.slice(Math.max(0,m.index-40),m.index);
      if(/CARD_SCRIPTS\[[^\]]+\]$/.test(before+m[1].replace(/\.$/,'')))continue; // script definition, not duel state
      if(/^\]$/.test(m[1])&&/CARD_SCRIPTS\[[^\]]*$/.test(before))continue;
      cardHits.push(f+':'+s.slice(0,m.index).split('\n').length+' '+m[1]+'.'+m[2]);
    }
    while((m=playerRe.exec(s)))playerHits.push(f+':'+s.slice(0,m.index).split('\n').length+' '+m[0].slice(0,40));
  }
  lok('lint: card scripts write no card-state field directly (use API.setCardFlag)',cardHits.length===0,cardHits.join(' | '));
  lok('lint: card scripts write no player temporaryFlags/effectFlags directly (use API.setFlag)',playerHits.length===0,playerHits.join(' | '));
  const proc=fs.readFileSync(path.join(ROOT,'engine','30_processor_chain_battle.js'),'utf8');
  const fnStart=proc.indexOf('function resolveReservedEffectsV30('),fnEnd=proc.indexOf('\nfunction ',fnStart+10);
  const body=proc.slice(fnStart,fnEnd);
  lok('lint: reserved-effect processing clears expiry flags through Actions only',fnStart>=0&&!/delete\s+h\.card\[/.test(body)&&/FX_CARD_FLAG_V46/.test(body));
}

/* ---------- 2. real paths (VM) ---------- */
const COMMON=String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function pass(){for(let i=0;i<160;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;}throw Error('pass loop');}
function pickWhere(fn){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(fn);if(i<0)throw Error('candidate missing in '+pc.title+': '+JSON.stringify(pc.candidates.map(x=>x.label)));__choicePickV49(i);}
function pickCard(c){pickWhere(x=>x.uid===c.uid);}
function pickLabel(s){pickWhere(x=>String(x.label||'').includes(s));}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function hit(uid){return findCardByUid(uid);}
function zoneOf(uid){const x=hit(uid);return x?x.zone:null;}
function cardOf(uid){const x=hit(uid);return x?x.card:null;}
function legalAt(uid){const x=hit(uid);return strictScriptLegalityV2(cardName(x.card),x.p,x.zone,x.index,{});}
function activateAt(uid){const x=hit(uid);return prepareDuelActivation(cardName(x.card),x.p,x.zone,x.index,{});}
function kinds(){return V41_ACTION_JOURNAL.map(x=>x.action);}
function flagActs(flag){return kinds().filter(a=>a.type==='FX_CARD_FLAG_V46'&&a.flag===flag);}
function playerFlagActs(key){return kinds().filter(a=>a.type==='PLAYER_FLAG_SET_V42'&&a.key===key);}
function logText(){return JSON.stringify(gameState.log||[]);}
function toEnd(){requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});pass();}
`;

const first=harness(COMMON+String.raw`
/* ===== レスキューラビット: two Special Summons from the Deck, flags, End Phase destroy ===== */
fresh();
let rabbit=mk('レスキューラビット'),s1=mk('セイバーザウルス'),s2=mk('セイバーザウルス'),filler=mk('異次元の女戦士');
gameState.players[0].mz=[rabbit];gameState.players[0].deck=[s1,filler,s2];baselineA();
ok('rabbit ignition is legal in an open Main Phase',legalAt(rabbit.uid).ok,JSON.stringify(legalAt(rabbit.uid)));
activateAt(rabbit.uid);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)pickLabel('セイバーザウルス');
pass();
const summoned=gameState.players[0].mz.filter(c=>cardName(c)==='セイバーザウルス');
ok('rabbit Special Summons both Normal Monsters from the Deck',summoned.length===2&&zoneOf(rabbit.uid)==='banish');
ok('both summoned monsters carry the End Phase destroy mark for this turn',summoned.every(c=>c.rabbitEndDestroyTurn===gameState.turn));
ok('the marks were written by journaled FX_CARD_FLAG_V46 Actions',flagActs('rabbitEndDestroyTurn').length===2&&flagActs('rabbitEndDestroyTurn').every(a=>a.silent===true));
ok('flag writes do not add developer text to the duel log',!/rabbitEndDestroyTurn=/.test(logText()));
replay('rabbit summons');
toEnd();
ok('End Phase destroys both marked monsters (reserve reads the journaled flag)',gameState.players[0].mz.filter(c=>cardName(c)==='セイバーザウルス').length===0&&gameState.players[0].grave.filter(c=>cardName(c)==='セイバーザウルス').length===2);
replay('rabbit End Phase destroy');

/* ===== 鬼ガエル ③: player flag written inside the activation cost callback ===== */
fresh();
let frog=mk('鬼ガエル'),rai=mk('ライオウ'),yomi=mk('黄泉ガエル');
gameState.players[0].mz=[frog,rai];gameState.players[0].hand=[yomi];gameState.players[0].normalSummonUsed=true;baselineA();
ok('鬼ガエル ③ is legal',legalAt(frog.uid).ok,JSON.stringify(legalAt(frog.uid)));
activateAt(frog.uid);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)pickLabel('ライオウ');
pass();
ok('鬼ガエル ③ returns the cost monster and grants one extra Normal Summon',zoneOf(rai.uid)==='hand'&&gameState.players[0].temporaryFlags.v370FrogExtraNormal===1,JSON.stringify(gameState.players[0].temporaryFlags));
ok('the extra-summon right was written by a journaled PLAYER_FLAG_SET_V42 Action',playerFlagActs('v370FrogExtraNormal').length===1&&playerFlagActs('v370FrogExtraNormal')[0].temporary===true);
replay('鬼ガエル ③');

/* ===== BF－暁のシロッコ: player flag holding the only attacker uid ===== */
fresh();
let sirocco=mk('BF－暁のシロッコ'),gale=mk('BF－疾風のゲイル'),blizzard=mk('BF－極北のブリザード');
gameState.players[0].mz=[sirocco,gale,blizzard];baselineA();
ok('BF－暁のシロッコ is legal in Main Phase 1',legalAt(sirocco.uid).ok,JSON.stringify(legalAt(sirocco.uid)));
const baseAtk=curATK(sirocco),gain=curATK(gale)+curATK(blizzard);
activateAt(sirocco.uid);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)pickCard(sirocco);
pass();
ok('BF－暁のシロッコ gains the other BFs ATK',curATK(sirocco)===baseAtk+gain,curATK(sirocco));
ok('only-attacker uid is stored on the player through PLAYER_FLAG_SET_V42',gameState.players[0].temporaryFlags.v350OnlyAttackerUid===sirocco.uid&&playerFlagActs('v350OnlyAttackerUid').length===1);
replay('BF－暁のシロッコ');

/* ===== ボルト・ヘッジホッグ: banish-on-leave mark after its own Special Summon ===== */
fresh();
let bolt=mk('ボルト・ヘッジホッグ'),tuner=mk('エフェクト・ヴェーラー');
gameState.players[0].grave=[bolt];gameState.players[0].mz=[tuner];baselineA();
ok('ボルト・ヘッジホッグ is legal from the GY with a face-up Tuner',legalAt(bolt.uid).ok,JSON.stringify(legalAt(bolt.uid)));
activateAt(bolt.uid);pass();
ok('ボルト・ヘッジホッグ Special Summons itself and is marked to be banished when it leaves',zoneOf(bolt.uid)==='mz'&&cardOf(bolt.uid).banishWhenLeavesField===true&&flagActs('banishWhenLeavesField').length===1);
replay('ボルト・ヘッジホッグ');
API.sendToGrave(hit(bolt.uid),'test leave');
ok('the journaled mark still banishes it when it leaves the field',zoneOf(bolt.uid)==='banish');
replay('ボルト・ヘッジホッグ leaves');

/* ===== トラゴエディア ④: level copy, End Phase reset clears the flag through an Action; save mid-turn ===== */
fresh();
let trag=mk('トラゴエディア'),g4=mk('セイバーザウルス');
gameState.players[0].mz=[trag];gameState.players[0].grave=[g4];baselineA();
ok('トラゴエディア ④ is legal with a GY monster',legalAt(trag.uid).ok,JSON.stringify(legalAt(trag.uid)));
activateAt(trag.uid);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)pickCard(g4);
pass();
ok('トラゴエディア ④ becomes the chosen monster Level',curLV(cardOf(trag.uid))===4,curLV(cardOf(trag.uid)));
ok('level-reset mark written by a journaled Action',cardOf(trag.uid).v370TragoLevelResetTurn===gameState.turn&&flagActs('v370TragoLevelResetTurn').length===1);
replay('トラゴエディア ④');
globalThis.__SAVE=JSON.stringify({state:gameState});globalThis.__DIG=v41StateDigest(gameState);globalThis.__TURN=gameState.turn;
toEnd();
ok('End Phase restores the original Level',curLV(cardOf(trag.uid))===10,curLV(cardOf(trag.uid)));
ok('End Phase clears the level-reset mark with a silent journaled Action',cardOf(trag.uid).v370TragoLevelResetTurn===undefined&&flagActs('v370TragoLevelResetTurn').some(a=>a.value==null&&a.silent===true));
replay('トラゴエディア ④ End Phase reset');
`);

let failed=lint.filter(x=>!x.ok).length;
if(first.__SAVE){
  const second=harness('const SAVED='+JSON.stringify(first.__SAVE)+';const DIG='+JSON.stringify(first.__DIG)+';'+COMMON+String.raw`
  resetA();gameState=JSON.parse(SAVED).state;
  if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
  ok('VM2: saved トラゴエディア state loads with a matching digest',v41StateDigest(gameState)===DIG);
  const t=gameState.players[0].mz.find(c=>cardName(c)==='トラゴエディア');
  ok('VM2: the journaled level-reset mark survives SaveLoad',!!t&&t.v370TragoLevelResetTurn===gameState.turn&&curLV(t)===4);
  toEnd();
  ok('VM2: End Phase after resume restores the Level and clears the mark',curLV(t)===10&&t.v370TragoLevelResetTurn===undefined);
  `);
}
process.on('exit',code=>{if(failed&&!code)process.exitCode=1;});
