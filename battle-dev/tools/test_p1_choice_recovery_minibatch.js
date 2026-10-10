/* P1 ChoiceRequest recovery mini-batch — 16 card-specific regressions. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=97900;function mk79(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function reset79(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=1;gameState.phase='main1';gameState.turn=2;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;v41ResetActionJournal(gameState);}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function effect79(name){const e=nativeEffectsV4(name)[0];if(!e)throw new Error('no effect '+name);return e;}
function ctx79(card,zone='sz',eventName='activate',event={}){return makeContext(0,card,zone,0,eventName,{event});}
function pay79(e,ctx){let paid=true;if(e.cost){paid=false;e.cost(ctx,v=>paid=v!==false);}return paid;}
function answer79(keys){const pc=pendingChoiceV49(gameState);if(!pc)throw new Error('no pending choice');return answerChoiceV49(keys||pc.candidates.map(x=>x.key));}
function answerName79(name){const pc=pendingChoiceV49(gameState),c=pc&&pc.candidates.find(x=>x.label===name);if(!c)throw new Error('candidate missing '+name);return answer79([c.key]);}
resetChoiceStatsV49();
const names79=['No.10 白輝士イルミネーター','罰則金','ご隠居の猛毒薬','天使の施し','謙虚な壺','陽気な葬儀屋','D－スピリッツ','狩猟本能','隠れ兵','アポート','ガスタの希望 カムイ','サンダー・ドラゴン','ジェネクス・ワーカー','センジュ・ゴッド','ソニックバード','ミイラの呼び声'];
ok('P1回収 16枚登録',names79.every(n=>CARD_SCRIPTS[n]&&nativeEffectsV4(n).length===1));

// No.10: detach is cost; hand send and draw are resolution operations.
reset79();let self=mk79('No.10 白輝士イルミネーター');self.xyz=[mk79('クリッター')];let h1=mk79('ライオウ'),d1=mk79('サイクロン');gameState.players[0].mz=[self];gameState.players[0].hand=[h1];gameState.players[0].deck=[d1];let e=effect79('No.10 白輝士イルミネーター'),ctx=ctx79(self,'mz');ok('No.10 positive condition',e.condition(ctx));ok('No.10 detach cost',pay79(e,ctx)&&self.xyz.length===0);e.operation(ctx);ok('No.10 serializable Choice',assertChoiceSerializableV49(gameState).ok);answerName79('ライオウ');ok('No.10 sends then draws',gameState.players[0].grave.includes(h1)&&gameState.players[0].hand.includes(d1));reset79();self=mk79('No.10 白輝士イルミネーター');gameState.players[0].mz=[self];ok('No.10 negative without material',!e.condition(ctx79(self,'mz')));

// Penalty Game.
reset79();self=mk79('罰則金');h1=mk79('ライオウ');let h2=mk79('クリッター');gameState.players[0].sz=[self];gameState.players[0].hand=[h1,h2];e=effect79('罰則金');ctx=ctx79(self);ok('罰則金 positive condition',e.condition(ctx));e.operation(ctx);answer79();ok('罰則金 discards exactly two',gameState.players[0].hand.length===0&&gameState.players[0].grave.includes(h1)&&gameState.players[0].grave.includes(h2)&&gameState.players[0].grave.includes(self));reset79();self=mk79('罰則金');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('ライオウ')];ok('罰則金 negative with one hand',!e.condition(ctx79(self)));

// Poison of the Old Man: mode is a serializable non-card choice.
reset79();self=mk79('ご隠居の猛毒薬');gameState.players[0].sz=[self];e=effect79('ご隠居の猛毒薬');ctx=ctx79(self);e.operation(ctx);let pc=pendingChoiceV49(gameState);ok('ご隠居 mode keys are pure data',pc.candidates.map(x=>x.value).join(',')==='recover,damage'&&assertChoiceSerializableV49(gameState).ok);ok('ご隠居 rejects invalid answer',answer79(['bad'])===false&&!!pendingChoiceV49(gameState));const lpPoison=gameState.players[1].lp;answer79(['damage']);ok('ご隠居 damage mode',gameState.players[1].lp===lpPoison-800&&gameState.players[0].grave.includes(self));

// Graceful Charity.
reset79();self=mk79('天使の施し');gameState.players[0].sz=[self];gameState.players[0].deck=[mk79('ライオウ'),mk79('クリッター'),mk79('サイクロン')];e=effect79('天使の施し');ctx=ctx79(self);ok('天使の施し positive condition',e.condition(ctx));e.operation(ctx);ok('天使の施し draws before choice',gameState.players[0].hand.length===3&&pendingChoiceV49(gameState).min===2);answer79(pendingChoiceV49(gameState).candidates.slice(0,2).map(x=>x.key));ok('天使の施し keeps one and discards two',gameState.players[0].hand.length===1&&gameState.players[0].grave.length===3);reset79();self=mk79('天使の施し');gameState.players[0].sz=[self];gameState.players[0].deck=[mk79('ライオウ'),mk79('クリッター')];ok('天使の施し negative short deck',!e.condition(ctx79(self)));

// Pot of Generosity.
reset79();self=mk79('謙虚な壺');h1=mk79('ライオウ');h2=mk79('クリッター');gameState.players[0].sz=[self];gameState.players[0].hand=[h1,h2];gameState.players[0].deck=[mk79('サイクロン')];e=effect79('謙虚な壺');ctx=ctx79(self);ok('謙虚な壺 positive condition',e.condition(ctx));e.operation(ctx);answer79();ok('謙虚な壺 returns two and shuffles',gameState.players[0].hand.length===0&&gameState.players[0].deck.includes(h1)&&gameState.players[0].deck.includes(h2)&&gameState.players[0].grave.includes(self));reset79();self=mk79('謙虚な壺');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('ライオウ')];ok('謙虚な壺 negative with one hand',!e.condition(ctx79(self)));

// Cheerful Coffin.
reset79();self=mk79('陽気な葬儀屋');h1=mk79('ライオウ');h2=mk79('クリッター');let h3=mk79('サイバー・ドラゴン');gameState.players[0].sz=[self];gameState.players[0].hand=[h1,h2,h3,mk79('サイクロン')];e=effect79('陽気な葬儀屋');ctx=ctx79(self);ok('陽気な葬儀屋 positive condition',e.condition(ctx));e.operation(ctx);ok('陽気な葬儀屋 offers monsters only up to three',pendingChoiceV49(gameState).candidates.length===3&&pendingChoiceV49(gameState).max===3);answer79();ok('陽気な葬儀屋 discards selected monsters',gameState.players[0].hand.length===1&&gameState.players[0].hand[0]!==h1&&gameState.players[0].grave.includes(self));reset79();self=mk79('陽気な葬儀屋');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('サイクロン')];ok('陽気な葬儀屋 negative without monster',!e.condition(ctx79(self)));

// D-Spirits.
reset79();self=mk79('D－スピリッツ');h1=mk79('D－HERO ダンクガイ');gameState.players[0].sz=[self];gameState.players[0].hand=[h1];e=effect79('D－スピリッツ');ctx=ctx79(self);ok('D－スピリッツ positive condition',e.condition(ctx));e.operation(ctx);answer79();ok('D－スピリッツ summons level4 D-HERO',gameState.players[0].mz.includes(h1)&&gameState.players[0].grave.includes(self));reset79();self=mk79('D－スピリッツ');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('D－HERO ダンクガイ')];gameState.players[0].mz=[mk79('D－HERO ディアボリックガイ')];ok('D－スピリッツ negative with face-up D-HERO',!e.condition(ctx79(self)));

// Hunting Instinct.
reset79();self=mk79('狩猟本能',0,'down');h1=mk79('セイバーザウルス');gameState.players[0].sz=[self];gameState.players[0].hand=[h1];e=effect79('狩猟本能');ctx=ctx79(self,'sz','onSpecialSummon',{player:1,card:mk79('サイバー・ドラゴン',1)});ok('狩猟本能 positive opponent Special Summon',e.condition(ctx));e.operation(ctx);answer79();ok('狩猟本能 summons Dinosaur',gameState.players[0].mz.includes(h1));reset79();self=mk79('狩猟本能',0,'down');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('セイバーザウルス')];ok('狩猟本能 negative own Special Summon',!e.condition(ctx79(self,'sz','onSpecialSummon',{player:0,card:mk79('ライオウ')})));

// Hidden Soldiers.
reset79();self=mk79('隠れ兵',0,'down');h1=mk79('ダーク・グレファー');gameState.players[0].sz=[self];gameState.players[0].hand=[h1];e=effect79('隠れ兵');ctx=ctx79(self,'sz','onNormalSummon',{player:1,card:mk79('ライオウ',1)});ok('隠れ兵 positive opponent Normal Summon',e.condition(ctx));e.operation(ctx);answer79();ok('隠れ兵 summons level4 DARK',gameState.players[0].mz.includes(h1));reset79();self=mk79('隠れ兵',0,'down');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('ダーク・グレファー')];ok('隠れ兵 negative non-Flip onFlip',!e.condition(ctx79(self,'sz','onFlip',{player:1,flipSummon:false})));

// Telekinetic Power Well / Apport.
reset79();self=mk79('アポート');h1=mk79('クレボンス');gameState.players[0].sz=[self];gameState.players[0].hand=[h1];gameState.players[1].mz=[mk79('ライオウ',1)];e=effect79('アポート');ctx=ctx79(self);ok('アポート positive condition',e.condition(ctx));const lpApport=gameState.players[0].lp;ok('アポート pays 800',pay79(e,ctx)&&gameState.players[0].lp===lpApport-800);e.operation(ctx);answer79();ok('アポート summons Psychic and remains',gameState.players[0].mz.includes(h1)&&gameState.players[0].sz.includes(self));reset79();self=mk79('アポート');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('クレボンス')];gameState.players[0].mz=[mk79('クリッター')];gameState.players[1].mz=[mk79('ライオウ',1)];ok('アポート negative with own monster',!e.condition(ctx79(self)));

// Kamui, Hope of Gusto.
reset79();self=mk79('ガスタの希望 カムイ');d1=mk79('ガスタ・ファルコ');gameState.players[0].mz=[self];gameState.players[0].deck=[d1,mk79('サイクロン')];e=effect79('ガスタの希望 カムイ');ctx=ctx79(self,'mz','onFlip',{player:0,card:self});ok('カムイ positive Flip condition',e.condition(ctx));e.operation(ctx);answerName79('ガスタ・ファルコ');ok('カムイ summons Gusto Tuner from Deck',gameState.players[0].mz.includes(d1));reset79();self=mk79('ガスタの希望 カムイ');gameState.players[0].mz=[self];gameState.players[0].deck=[mk79('ガスタの神官 ムスト')];ok('カムイ negative without Gusto Tuner',!e.condition(ctx79(self,'mz','onFlip',{player:0,card:self})));

// Thunder Dragon.
reset79();self=mk79('サンダー・ドラゴン');d1=mk79('サンダー・ドラゴン');let d2=mk79('サンダー・ドラゴン');gameState.players[0].hand=[self];gameState.players[0].deck=[d1,d2,mk79('サイクロン')];e=effect79('サンダー・ドラゴン');ctx=ctx79(self,'hand');ok('サンダー・ドラゴン positive condition',e.condition(ctx));ok('サンダー・ドラゴン discard cost',pay79(e,ctx)&&gameState.players[0].grave.includes(self));e.operation(ctx);answer79();ok('サンダー・ドラゴン searches up to two copies',gameState.players[0].hand.includes(d1)&&gameState.players[0].hand.includes(d2));reset79();self=mk79('サンダー・ドラゴン');gameState.players[0].hand=[self];ok('サンダー・ドラゴン negative without Deck copy',!e.condition(ctx79(self,'hand')));

// Genex Worker.
reset79();self=mk79('ジェネクス・ワーカー');h1=mk79('ジェネクス・コントローラー');gameState.players[0].mz=[self];gameState.players[0].hand=[h1];e=effect79('ジェネクス・ワーカー');ctx=ctx79(self,'mz');ok('ジェネクス・ワーカー positive condition',e.condition(ctx));ok('ジェネクス・ワーカー tribute cost',pay79(e,ctx)&&gameState.players[0].grave.includes(self));e.operation(ctx);answer79();ok('ジェネクス・ワーカー summons Genex',gameState.players[0].mz.includes(h1));reset79();self=mk79('ジェネクス・ワーカー');gameState.players[0].mz=[self];gameState.players[0].hand=[mk79('ライオウ')];ok('ジェネクス・ワーカー negative without Genex',!e.condition(ctx79(self,'mz')));

// Senju of the Thousand Hands.
reset79();self=mk79('センジュ・ゴッド');d1=mk79('サクリファイス');gameState.players[0].mz=[self];gameState.players[0].deck=[d1,mk79('サイクロン')];e=effect79('センジュ・ゴッド');ctx=ctx79(self,'mz','onNormalSummon',{player:0,card:self});ok('センジュ positive summon condition',e.condition(ctx));e.operation(ctx);answerName79('サクリファイス');ok('センジュ searches Ritual Monster',gameState.players[0].hand.includes(d1));reset79();self=mk79('センジュ・ゴッド');gameState.players[0].mz=[self];gameState.players[0].deck=[mk79('ライオウ')];ok('センジュ negative without Ritual Monster',!e.condition(ctx79(self,'mz','onNormalSummon',{player:0,card:self})));

// Sonic Bird.
reset79();self=mk79('ソニックバード');d1=mk79('イリュージョンの儀式');gameState.players[0].mz=[self];gameState.players[0].deck=[d1,mk79('サイクロン')];e=effect79('ソニックバード');ctx=ctx79(self,'mz','onFlip',{player:0,card:self,flipSummon:true});ok('ソニックバード positive Flip Summon condition',e.condition(ctx));e.operation(ctx);answerName79('イリュージョンの儀式');ok('ソニックバード searches Ritual Spell',gameState.players[0].hand.includes(d1));reset79();self=mk79('ソニックバード');gameState.players[0].mz=[self];gameState.players[0].deck=[mk79('サイクロン')];ok('ソニックバード negative without Ritual Spell',!e.condition(ctx79(self,'mz','onNormalSummon',{player:0,card:self})));

// Call of the Mummy.
reset79();self=mk79('ミイラの呼び声');h1=mk79('ゾンビキャリア');gameState.players[0].sz=[self];gameState.players[0].hand=[h1];e=effect79('ミイラの呼び声');ctx=ctx79(self);ok('ミイラの呼び声 positive empty-field condition',e.condition(ctx));e.operation(ctx);answer79();ok('ミイラの呼び声 summons Zombie and remains',gameState.players[0].mz.includes(h1)&&gameState.players[0].sz.includes(self));reset79();self=mk79('ミイラの呼び声');gameState.players[0].sz=[self];gameState.players[0].hand=[mk79('ゾンビキャリア')];gameState.players[0].mz=[mk79('クリッター')];ok('ミイラの呼び声 negative with own monster',!e.condition(ctx79(self)));

// Card-level P1 persistence and audit: use Poison mode (no hidden closures).
reset79();self=mk79('ご隠居の猛毒薬');gameState.players[0].sz=[self];v41ResetActionJournal(gameState);e=effect79('ご隠居の猛毒薬');e.operation(ctx79(self));const saved79=JSON.parse(JSON.stringify(gameState));gameState=saved79;reconcileChoiceAfterLoadV49(gameState);ok('P1回収 SaveLoad keeps registry choice',!!pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).legacy===false);answer79(['recover']);ok('P1回収 SaveLoad continuation resolves',gameState.players[0].lp===9200&&gameState.players[0].grave.some(c=>cardName(c)==='ご隠居の猛毒薬'));const types79=V41_ACTION_JOURNAL.map(x=>x.action.type);ok('P1回収 Journal records choice',types79.includes('CHOICE_OPEN_V49')&&types79.includes('CHOICE_ANSWER_V49'));let pkg79=v41ReplayPackage(gameState),audit79=v44ReplayAuditPackage(pkg79);ok('P1回収 Replay digest matches',audit79.ok,audit79.reason||audit79.finalDigest);undo();ok('P1回収 Undo rolls back source move',gameState.players[0].sz.some(c=>cardName(c)==='ご隠居の猛毒薬'));undo();ok('P1回収 Undo rolls back LP operation',gameState.players[0].lp===8000);undo();ok('P1回収 Undo restores pending choice',!!pendingChoiceV49(gameState));redo();redo();redo();ok('P1回収 Redo restores resolved result',gameState.players[0].lp===9200&&gameState.players[0].grave.some(c=>cardName(c)==='ご隠居の猛毒薬'));

const stats79=choiceStatsV49();ok('P1回収 migrated count includes all 16',stats79.migrated===17,'migrated='+stats79.migrated);ok('P1回収 uses zero legacy choices',stats79.legacy===0,'legacy='+stats79.legacy);ok('P1回収 pending choices remain serializable',assertChoiceSerializableV49(gameState).ok);
globalThis.__P1REC=R;`;
js+='\n'+probe;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()};
const store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:30000});console.log(c.__P1REC.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__P1REC.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
