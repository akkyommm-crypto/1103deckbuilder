/* S03-U02: per-effect count limit (countLimit:{n, effects:[key]}).
   「このカードは1ターンに1度だけ裏側守備表示にする事ができる」＋反転召喚時の誘発:
   the flip trigger must not consume the self-set limit. 2011 wiki (ステルスバード) presupposes
   returning it face-down by its own effect on the turn it was flip summoned.
   Real flip summon, trigger, ignition, chain, Undo/Redo, Replay and second-VM continuation.
   Helper cards are already TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function pass(){for(let i=0;i<100;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;
 }throw Error('pass loop');}
/* Answer the pending choice first: the event state stays set while a legacy target choice is open. */
function answerAll(){for(let i=0;i<12;i++){
 const pc=pendingChoiceV49(gameState);
 if(pc){const yes=pc.candidates.findIndex(x=>x.key==='yes');__choicePickV49(yes>=0?yes:0);pass();continue;}
 if(EVT_V2_STATE){eventPickV2(0);continue;}
 pass();if(!EVT_V2_STATE&&!pendingChoiceV49(gameState))return;
 }}
function idle(){return !gameState.chain.length&&!gameState.processorPaused&&!pendingChoiceV49(gameState)&&!EVT_V2_STATE;}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+' Replay nonempty and consistent',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function faceOf(uid){const x=findCardByUid(uid);return x?x.card.face:null;}
function selfLegal(uid){const x=findCardByUid(uid);return strictScriptLegalityV2(cardName(x.card),x.p,'mz',x.index,{});}
function selfSet(uid){const x=findCardByUid(uid);const r=prepareDuelActivation(cardName(x.card),x.p,'mz',x.index,{});answerAll();pass();return r;}
function links(name,filter){return V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_ADD'&&x.action.name===name&&(!filter||filter(x.action)));}
function flipFixture(name){
 fresh();const m=mk(name,0,'down','def');m.setTurn=gameState.turn-1;
 gameState.players[0].mz=[m];gameState.players[0].deck=[mk('E・HERO クレイマン'),mk('E・HERO オーシャン')];
 gameState.players[1].mz=[mk('ゴブリン突撃部隊',1)];gameState.players[1].sz=[mk('サイクロン',1,'down')];baselineA();return m;
}
`;
const CARDS=[['イナゴの軍勢','self-set'],['ガーディアン・スタチュー','self-set'],['スカラベの大群','self-set'],['ステルスバード','self-set'],['デス・ラクーダ','self-set'],['メデューサ・ワーム','self-set'],['守護者スフィンクス','self-set'],['番兵ゴーレム','self-set'],['グレート・スピリット','self-set-face-down']];

const first=harness(COMMON+'const CARDS='+JSON.stringify(CARDS)+';'+String.raw`
for(const [name,key] of CARDS){
 const m=flipFixture(name),sc=CARD_SCRIPTS[name];
 ok(name+' limits only its self-set effect',!!sc.countLimit&&Array.isArray(sc.countLimit.effects)&&sc.countLimit.effects.join()===key,JSON.stringify(sc.countLimit));
 doFlipUp(0,'mz',0,'atk');pass();answerAll();
 const trig=links(name,a=>a.v4EffectKey!==key);
 ok(name+' flip trigger activated and resolved',trig.length>0&&faceOf(m.uid)==='up'&&!gameState.chain.length&&!gameState.systemFault,JSON.stringify({trig:trig.length,chain:gameState.chain.length}));
 ok(name+' flip trigger consumed no count',trig.every(x=>!x.action.v44CountConsume),JSON.stringify(trig.map(x=>x.action.v44CountConsume)));
 const L=selfLegal(m.uid);
 ok(name+' self-set is legal after the flip trigger',L.ok,JSON.stringify(L));
 selfSet(m.uid);
 const set=links(name,a=>a.v4EffectKey===key);
 ok(name+' self-set resolves face-down through the chain',faceOf(m.uid)==='down'&&set.length===1&&!gameState.systemFault,JSON.stringify({face:faceOf(m.uid),set:set.length}));
 ok(name+' self-set consumed its count',set.length===1&&!!set[0].action.v44CountConsume&&countLeft(0,name,sc,findCardByUid(m.uid).card,key)<=0);
 replay(name+' flip trigger then self-set');
}

/* The limit still applies to the self-set effect itself (face-up fixture, second use refused). */
fresh();let bird=mk('ステルスバード');gameState.players[0].mz=[bird];baselineA();
ok('face-up ステルスバード self-set legal',selfLegal(bird.uid).ok);
selfSet(bird.uid);ok('first self-set resolves',faceOf(bird.uid)==='down');
ok('second self-set this turn is refused by the limit',countLeft(0,'ステルスバード',CARD_SCRIPTS['ステルスバード'],findCardByUid(bird.uid).card,'self-set')<=0);

/* Default card-wide countLimit is unchanged: a card-wide 「1ターンに1度」 trigger still consumes its count.
   S03-U156: this used クリッター, whose 「1ターンに1度」 is a later errata (not in 1103: engine/1ZT); ブレイン・クラッシャー's 2011 text
   has 「この効果は1ターンに1度しか使用できない」 on its battle trigger. */
fresh();let crit=mk('ブレイン・クラッシャー');gameState.players[0].mz=[crit];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1)];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});pass();answerAll();
ok('card-wide countLimit trigger still consumes its count',links('ブレイン・クラッシャー').length===1&&!!links('ブレイン・クラッシャー')[0].action.v44CountConsume,JSON.stringify(links('ブレイン・クラッシャー').map(x=>x.action.v44CountConsume)));

/* Undo / Redo around the self-set, then save after the flip trigger for a second VM. */
bird=flipFixture('ステルスバード');doFlipUp(0,'mz',0,'atk');pass();answerAll();
globalThis.__SAVE=JSON.stringify({state:gameState});globalThis.__UID=bird.uid;
selfSet(bird.uid);ok('Undo fixture: self-set resolved',faceOf(bird.uid)==='down'&&idle());globalThis.__AFTERSET=v41StateDigest(gameState);replay('ステルスバード self-set before Undo');
/* Each committed Action is one Undo step; stop at the stable state before the self-set activation. */
const selfSetCommitted=()=>V41_ACTION_JOURNAL.some(x=>x.action.type==='CHAIN_ADD'&&x.action.v4EffectKey==='self-set');
for(let i=0;i<30&&!(faceOf(bird.uid)==='up'&&idle()&&!selfSetCommitted())&&HISTORY.length;i++)undo();
ok('Undo restores face-up ステルスバード with self-set legal',faceOf(bird.uid)==='up'&&idle()&&selfLegal(bird.uid).ok,JSON.stringify({face:faceOf(bird.uid),idle:idle(),L:selfLegal(bird.uid)}));
for(let i=0;i<30&&!(faceOf(bird.uid)==='down'&&idle())&&REDO.length;i++)redo();
ok('Redo restores face-down state and used count',faceOf(bird.uid)==='down'&&idle()&&countLeft(0,'ステルスバード',CARD_SCRIPTS['ステルスバード'],findCardByUid(bird.uid).card,'self-set')<=0);
ok('Redo state digest matches the original self-set result',v41StateDigest(gameState)===globalThis.__AFTERSET,v41StateDigest(gameState)+' vs '+globalThis.__AFTERSET);
`);

if(first.__SAVE){
 harness('const SAVED='+JSON.stringify(first.__SAVE)+';const UID='+JSON.stringify(first.__UID)+';'+COMMON+String.raw`
 resetA();gameState=JSON.parse(SAVED).state;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
 if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
 if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
 reconcileChoiceAfterLoadV49(gameState);
 ok('VM2 loaded ステルスバード after its flip trigger',faceOf(UID)==='up'&&!gameState.chain.length);
 ok('VM2 self-set legal after load',selfLegal(UID).ok,JSON.stringify(selfLegal(UID)));
 selfSet(UID);
 ok('VM2 self-set resolves and consumes the count',faceOf(UID)==='down'&&countLeft(0,'ステルスバード',CARD_SCRIPTS['ステルスバード'],findCardByUid(UID).card,'self-set')<=0);
 replay('VM2 continuation');
 `);
}else{console.log('FAIL VM2 save missing');process.exitCode=2;}
