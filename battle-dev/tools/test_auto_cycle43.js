/* Auto cycle 43 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=30;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});if(extra&&extra.event)c.event=extra.event;return c;}
const TARGETS=['A・O・J サンダー・アーマー','ライトロード・スピリット シャイア','ジュラック・ギガノト','サーマル・ジェネクス'];
TARGETS.forEach(n=>ok('cycle43 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle43 枚数は4',TARGETS.length===4);

reset0();
let ta=mk('A・O・J サンダー・アーマー'), ally=mk('A・O・J クラウソラス'), non=mk('ワイト'), wall=mk('ワイト',1,'up','def');
gameState.players[0].mz=[ta,ally,non];gameState.players[1].mz=[wall];
let taSc=sc('A・O・J サンダー・アーマー');
ok('サンダー・アーマー ruling: 特殊召喚不可',taSc.cannotSpecialSummon===true);
ok('サンダー・アーマー positive: 自分A・O・Jへ貫通付与',taSc.continuous.piercingDamage({self:ta,atkCard:ally,defCard:wall})===Math.max(0,curATK(ally)-curDEF(wall)));
ok('サンダー・アーマー negative: A・O・J以外へ貫通付与しない',taSc.continuous.piercingDamage({self:ta,atkCard:non,defCard:wall})===0);
ta.face='down';
ok('サンダー・アーマー ruling: 自身が裏側なら付与しない',taSc.continuous.piercingDamage({self:ta,atkCard:ally,defCard:wall})===0);

reset0();
let sh=mk('ライトロード・スピリット シャイア'), cel=mk('ライトロード・エンジェル ケルビム'), jain=mk('ライトロード・パラディン ジェイン'), cel2=mk('ライトロード・エンジェル ケルビム');
gameState.players[0].mz=[sh];gameState.players[0].grave=[cel,jain,cel2,mk('ワイト')];
let shSc=sc('ライトロード・スピリット シャイア'), shStat=shSc.continuous.apply(sh,sh,{p:0});
ok('シャイア positive: ライトロード種類2でATK+600',shStat&&shStat.atk===600);
ok('シャイア negative: 非ライトロードは数えない',curATK(sh)===(dbOf(sh).atk||0)+600);
ok('シャイア ruling: エンドフェイズ2枚墓地送り',shSc.endPhaseMill===2);

reset0();
let gig=mk('ジュラック・ギガノト'), jr=mk('ジュラック・アウロ'), other=mk('ワイト'), graveJ1=mk('ジュラック・プロトプス'), graveJ2=mk('ジュラック・ブラキス');
gameState.players[0].mz=[gig,jr,other];gameState.players[0].grave=[graveJ1,graveJ2,mk('ワイト')];
let gigSc=sc('ジュラック・ギガノト');
ok('ギガノト positive: 自分ジュラック全体に墓地2体分ATK+400',gigSc.continuous.apply(jr,gig,{p:0}).atk===400);
ok('ギガノト ruling: 自身もジュラックなので強化対象',gigSc.continuous.apply(gig,gig,{p:0}).atk===400);
ok('ギガノト negative: ジュラック以外は強化しない',gigSc.continuous.apply(other,gig,{p:0})===null);

reset0();
let tg=mk('サーマル・ジェネクス'), flame=mk('炎を操る者'), gen=mk('ジェネクス・コントローラー'), victim=mk('ワイト',1);
gameState.players[0].mz=[tg];gameState.players[0].grave=[flame,gen];gameState.players[1].grave=[victim];
let tgSc=sc('サーマル・ジェネクス'), tgStat=tgSc.continuous.apply(tg,tg,{p:0});
ok('サーマル・ジェネクス positive: 自分墓地炎属性1体でATK+200',tgStat&&tgStat.atk===200);
let ctx=C(0,tg,'mz',0,'onBattleDestroy',{event:{attackerUid:tg.uid,destroyed:{uid:victim.uid,controller:1}}});
ok('サーマル・ジェネクス positive: 自身が相手を戦闘破壊した時に誘発',tgSc.condition(ctx)===true);
const lp0=gameState.players[1].lp;tgSc.resolve(ctx);
ok('サーマル・ジェネクス resolve: 自分墓地ジェネクス1体で200ダメージ',gameState.players[1].lp===lp0-200);
let bad=C(0,tg,'mz',0,'onBattleDestroy',{event:{attackerUid:999,destroyed:{uid:victim.uid,controller:1}}});
ok('サーマル・ジェネクス negative: 自身が戦闘破壊していなければ誘発しない',tgSc.condition(bad)===false);

ok('cycle43 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
