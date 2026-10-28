/* S03-U479: P1.1 targeting choices reconstruct their effect source from
   meta.scriptName after activation preparation has ended.  This compact
   regression supplements (not replaces) the fuller U478/U263/U375 paths. */
const harness=require('./astra_harness');
harness(String.raw`
const ARM='メタルシルバー・アーマー';
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngState=0x4790001;for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
function pc(){return pendingChoiceV49(gameState);} function H(c){return findCardByUid(c.uid);} function loc(c){const x=H(c);return x&&x.zone;}
function equipArmor(p){const host=mk('サイバー・ドラゴン',p),other=mk('ライオウ',p),arm=mk(ARM,p);gameState.players[p].mz=[host,other];gameState.players[p].sz=[arm];API.equipSpell(locateCardAnyV4(arm),locateCardAnyV4(host),'U479');return {host,other,arm};}
function answer(keys){return answerChoiceV49(keys);}
function drive(){for(let i=0;i<500;i++){if(pc())return 'choice';if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}if(gameState.processorWaiting&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}return 'idle';}return 'loop';}
function audit(n){const a=v44ReplayAuditPackage(v41ReplayPackage(gameState));ok(n,a.ok,JSON.stringify(a).slice(0,160));}

/* (a) actual P1.1 Gusta activation: the central requestChoiceV49 path sees
   targetCount:2 from meta.scriptName, so Armor's multi-target exception holds. */
fresh();const gcard=mk('ガスタのつむじ風',1,'down'),ga=mk('ガスタの神官 ムスト',1),gb=mk('ガスタ・イグル',1),sum=mk('ガスタの巫女 ウィンダ',1);gcard.setTurn=3;gameState.players[1].sz=[gcard];gameState.players[1].grave=[ga,gb];gameState.players[1].deck.push(sum);const a0=equipArmor(0);baselineA();duelActivateFromZone(1,'sz',0);let q=pc();ok('Gusta: central P1.1 choice is targeting and Armor keeps both protected Graveyard targets',q&&q.targeting===true&&q.meta.scriptName==='ガスタのつむじ風'&&q.candidates.some(x=>x.uid===ga.uid)&&q.candidates.some(x=>x.uid===gb.uid),JSON.stringify(q&&{t:q.targeting,n:q.meta.scriptName,c:q.candidates.map(x=>x.uid)}));answer(q.candidates.filter(x=>x.uid===ga.uid||x.uid===gb.uid).map(x=>x.key));drive();if(pc())answer([pc().candidates.find(x=>x.uid===sum.uid).key]);drive();ok('Gusta: normal chain resolution returned both targets and summoned Winda',loc(ga)==='deck'&&loc(gb)==='deck'&&loc(sum)==='mz');audit('Gusta: Replay');

/* (b) the two formerly unflagged choices are targeting choices.  Scroll's
   field target and Gap's off-field target are each excluded by Armor. */
fresh();const scroll=mk('幻惑の巻物',0),own=mk('ワイト',0),a1=equipArmor(1);gameState.players[0].hand=[scroll];gameState.players[0].mz=[own];baselineA();duelActivateFromHand(0);q=pc();answer([q.candidates.find(x=>x.value==='炎').key]);q=pc();ok('Scroll: target choice is targeting and excludes Armor-protected opposing monster',q&&q.targeting===true&&!q.candidates.some(x=>x.uid===a1.other.uid)&&q.candidates.some(x=>x.uid===a1.host.uid),JSON.stringify(q&&q.candidates.map(x=>x.uid)));answer([q.candidates.find(x=>x.uid===a1.host.uid).key]);drive();ok('Scroll: normal path equips the chosen legal monster',H(scroll).card.equipTo.uid===a1.host.uid);audit('Scroll: Replay');

fresh();const gap=mk('異次元への隙間',0,'down'),light1=mk('青眼の白龍',0),light2=mk('青眼の白龍',0),guard=mk('ホルスのしもべ',1),enemyGrave=mk('ホーリー・エルフ',1);gap.setTurn=3;gameState.players[0].sz=[gap];gameState.players[0].grave=[light1,light2];gameState.players[1].mz=[guard];gameState.players[1].grave=[enemyGrave];const gsc=CARD_SCRIPTS['ホルスのしもべ'],oldOff=gsc.continuous.immuneToTargetOffField;gsc.continuous.immuneToTargetOffField=(card)=>card===enemyGrave;baselineA();duelActivateFromZone(0,'sz',0);q=pc();answer([q.candidates.find(x=>x.value==='光').key]);q=pc();ok('Gap: target choice is targeting and excludes protected opposing Graveyard monster',q&&q.targeting===true&&!q.candidates.some(x=>x.uid===enemyGrave.uid)&&q.candidates.filter(x=>x.uid===light1.uid||x.uid===light2.uid).length===2,JSON.stringify(q&&q.candidates.map(x=>x.uid)));answer(q.candidates.filter(x=>x.uid===light1.uid||x.uid===light2.uid).map(x=>x.key));drive();ok('Gap: normal path banishes both selected targets',loc(light1)==='banish'&&loc(light2)==='banish');audit('Gap: Replay');gsc.continuous.immuneToTargetOffField=oldOff;

/* (c) explicit effectInfo wins, and the targeting player is independent from
   the player answering the choice.  (d) selection:'cost' still bypasses it. */
API.registerChoiceHandler('u479.noop',()=>{});
fresh();const a3=equipArmor(0);baselineA();const single=targetEffectSourceS03(1,{name:'強制脱出装置'});API.requestChoice({player:0,targetingPlayer:1,kind:'card',title:'U479 explicit',candidates:API.fieldCards({player:0,zone:'mz'}),targeting:true,effectInfo:single,resume:{handler:'u479.noop',args:{}}});q=pc();ok('explicit effectInfo + targetingPlayer: chooser 0 differs from effect player 1, so Armor leaves only its host',q&&q.player===0&&q.targeting===true&&q.candidates.length===1&&q.candidates[0].uid===a3.host.uid,JSON.stringify(q&&q.candidates.map(x=>x.uid)));answer([q.candidates[0].key]);
fresh();const a4=equipArmor(0);baselineA();API.requestChoice({player:0,targetingPlayer:1,kind:'card',title:'U479 cost',candidates:API.fieldCards({player:0,zone:'mz'}),targeting:true,selection:'cost',resume:{handler:'u479.noop',args:{}}});q=pc();ok('cost choice: targeting is false and Armor does not remove the cost candidate',q&&q.selection==='cost'&&q.targeting===false&&q.candidates.some(x=>x.uid===a4.other.uid));answer([q.candidates[0].key]);

/* pending P1.1 metadata is JSON-safe and continues after a real save-shaped
   reload; the journal remains Replay-auditable. */
fresh();const live=mk('ライオウ',0);gameState.players[0].mz=[live];baselineA();API.requestChoice({player:0,kind:'card',title:'U479 save',candidates:API.fieldCards({player:0,zone:'mz'}),targeting:true,resume:{handler:'u479.noop',args:{}},meta:{scriptName:'ガスタのつむじ風',v4EffectKey:null}});gameState=JSON.parse(JSON.stringify(gameState));reconcileChoiceAfterLoadV49(gameState);q=pc();ok('Save/Load: P1.1 scriptName survives pending choice restore',q&&q.meta.scriptName==='ガスタのつむじ風'&&q.targeting===true);answer([q.candidates[0].key]);audit('Save/Load choice: Replay');
globalThis.__R=R;
`);
