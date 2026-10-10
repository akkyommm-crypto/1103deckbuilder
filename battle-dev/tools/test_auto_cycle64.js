/* Auto cycle 64 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.phase='battle';gameState.turn=64;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('missing script '+n);return s;}
function battleCtx(src,def,destroyed=true){const c=makeContext(0,src,'mz',0,'onDamageStep',{});c.step='leave';c.battle={atkCard:src,defCard:def,destroyedDef:destroyed,target:0};return c;}
const TARGETS=['E・HERO フレイム・ウィングマン','E・HERO スチーム・ヒーラー','アルティメットサイキッカー'];TARGETS.forEach(n=>ok('cycle64 registration '+n,!!sc(n)));ok('cycle64 枚数は3',TARGETS.length===3);

reset0();let flame=mk('E・HERO フレイム・ウィングマン'),victim=mk('ライオウ',1);gameState.players[0].mz=[flame];gameState.players[1].grave=[victim];let c=battleCtx(flame,victim,true),before=gameState.players[1].lp;
ok('フレイム・ウィングマン positive: 攻撃で戦闘破壊し墓地へ送ると誘発',sc('E・HERO フレイム・ウィングマン').condition(c));sc('E・HERO フレイム・ウィングマン').resolve(c);
ok('フレイム・ウィングマン ruling: 破壊モンスターの元々のATK分ダメージ',before-gameState.players[1].lp===(dbOf(victim).atk||0));
c=battleCtx(flame,victim,false);ok('フレイム・ウィングマン negative: 戦闘破壊できなければ誘発しない',!sc('E・HERO フレイム・ウィングマン').condition(c));

reset0();let healer=mk('E・HERO スチーム・ヒーラー'),small=mk('ワイト',1);gameState.players[0].mz=[healer];gameState.players[1].grave=[small];gameState.players[0].lp=3000;c=battleCtx(healer,small,true);before=gameState.players[0].lp;
ok('スチーム・ヒーラー positive: 攻撃で戦闘破壊し墓地へ送ると誘発',sc('E・HERO スチーム・ヒーラー').condition(c));sc('E・HERO スチーム・ヒーラー').resolve(c);
ok('スチーム・ヒーラー ruling: 破壊モンスターの元々のATK分回復',gameState.players[0].lp-before===(dbOf(small).atk||0));
let notGrave=mk('ライオウ',1);gameState.players[1].mz=[notGrave];c=battleCtx(healer,notGrave,true);ok('スチーム・ヒーラー negative: 相手が墓地へ送られていなければ誘発しない',!sc('E・HERO スチーム・ヒーラー').condition(c));

reset0();let kicker=mk('アルティメットサイキッカー'),wall=mk('ワイト',1,'up','def');gameState.players[0].mz=[kicker];gameState.players[1].mz=[wall];let pierce=sc('アルティメットサイキッカー').continuous.piercingDamage;
ok('アルティメットサイキッカー positive: 守備表示へ貫通',pierce({self:kicker,atkCard:kicker,defCard:wall})===Math.max(0,curATK(kicker)-curDEF(wall)));
ok('アルティメットサイキッカー negative: 攻撃表示へは貫通なし',pierce({self:kicker,atkCard:kicker,defCard:mk('ワイト',1,'up','atk')})===0);
ok('アルティメットサイキッカー positive: カード効果で破壊されない',!!protectionRecordV21(gameState,kicker,{cause:'effect',sourcePlayer:1}));
ok('アルティメットサイキッカー negative: 戦闘破壊耐性はない',protectionRecordV21(gameState,kicker,{cause:'battle',opponentCard:mk('青眼の白龍',1)})===null);
gameState.players[1].mz=[];gameState.players[1].grave=[wall];gameState.players[0].lp=2500;c=battleCtx(kicker,wall,true);before=gameState.players[0].lp;sc('アルティメットサイキッカー').resolve(c);
ok('アルティメットサイキッカー ruling: 戦闘破壊モンスターの元々のATK分回復',gameState.players[0].lp-before===(dbOf(wall).atk||0));
ok('cycle64 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;let thrown=false;try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}if(thrown||f||!RR.length)process.exit(2);
