/* Auto cycle 46 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=46;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});if(extra&&extra.event)c.event=extra.event;return c;}
const TARGETS=['D・ボードン','エレキマイラ'];
TARGETS.forEach(n=>ok('cycle46 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle46 枚数は2',TARGETS.length===2);

reset0();
let board=mk('D・ボードン'), d1=mk('D・ラジオン'), non=mk('ワイト'), foe=mk('青眼の白龍',1);
gameState.players[0].mz=[board,d1,non];gameState.players[1].mz=[foe];
let bdSc=sc('D・ボードン');
ok('D・ボードン positive: 攻撃表示なら自分Dへ直接攻撃許可',
  bdSc.continuous.grantsDirectAttack(d1,board)===true&&canDirectAttackThroughMonstersV51(d1)===true);
ok('D・ボードン negative: D以外へ直接攻撃許可しない',
  bdSc.continuous.grantsDirectAttack(non,board)===false&&canDirectAttackThroughMonstersV51(non)===false);
board.pos='def';
ok('D・ボードン ruling: 守備表示では直接攻撃許可しない',bdSc.continuous.grantsDirectAttack(d1,board)===false);
let rec=protectionRecordV21(gameState,d1,{cause:'battle',opponentCard:foe});
ok('D・ボードン positive: 守備表示なら自身以外の自分Dは戦闘破壊されない',!!rec&&rec.label==='D・ボードン');
ok('D・ボードン negative: 自身は守らない',protectionRecordV21(gameState,board,{cause:'battle',opponentCard:foe})===null);
ok('D・ボードン negative: D以外は守らない',protectionRecordV21(gameState,non,{cause:'battle',opponentCard:foe})===null);
board.face='down';
ok('D・ボードン ruling: 裏側では保護しない',protectionRecordV21(gameState,d1,{cause:'battle',opponentCard:foe})===null);

reset0();
let chim=mk('エレキマイラ'), h1=mk('ワイト',1), h2=mk('青眼の白龍',1);
gameState.players[0].mz=[chim];gameState.players[1].hand=[h1,h2];gameState.players[1].deck=[mk('サファイアドラゴン',1)];
let chSc=sc('エレキマイラ'), beforeRng=gameState.rngState;
ok('エレキマイラ positive: 自身は直接攻撃可能',chSc.canDirectAttack===true&&canDirectAttackThroughMonstersV51(chim)===true);
let chCtx=C(0,chim,'mz',0,'onDirectBattleDamage',{event:{player:1,amount:2500,direct:true,attackerUid:chim.uid,defenderUid:null}});
ok('エレキマイラ positive: 直接攻撃ダメージで誘発',chSc.passive.onDirectBattleDamage(chCtx)===true);
const handBefore=gameState.players[1].hand.length;chSc.resolve(chCtx);
ok('エレキマイラ positive: 相手手札1枚をデッキトップへ戻す',gameState.players[1].hand.length===handBefore-1&&[h1,h2].includes(gameState.players[1].deck[0]));
ok('エレキマイラ ruling: ランダム選択は deterministic RNG を進める',gameState.rngState!==beforeRng);
ok('エレキマイラ negative: 手札0なら誘発しない',
  (gameState.players[1].hand=[], chSc.passive.onDirectBattleDamage(chCtx)===false));
ok('エレキマイラ negative: 直接攻撃でなければ誘発しない',
  chSc.condition(C(0,chim,'mz',0,'onDirectBattleDamage',{event:{player:1,amount:2500,direct:false,attackerUid:chim.uid}}))===false);

ok('cycle46 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
