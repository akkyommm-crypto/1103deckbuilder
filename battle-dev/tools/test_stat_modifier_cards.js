/* StatModifier recovery batch — 11枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function sync(){gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  gameState.posSnapV10=positionSnapshotV10(gameState);}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',extra||{});}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function answerAll(keys){const pc=pendingChoiceV49(gameState);if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(keys||pc.candidates.map(x=>x.key));}
function evts(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvts(){gameState.deferredEvents=[];}
function fire(name,player,zone,index,card){
  clearEvts();
  act({type:'CHAIN_ADD',player,cardId:findCardIndex(name),uid:card?card.uid:null,name,from:zone,index});
  return evts('onActivateSuccess').slice(-1)[0];
}
function evCtx(card,zone,evt){const c=ctxAt(card,zone,'onActivateSuccess',{event:evt});c.event=evt;return c;}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具は既に TESTED のカードだけを使う（IMPLEMENTED を使うと誤昇格する）。 */
const MON='ヂェミナイ・エルフ', SPELL='死者蘇生';
const LV2NORMAL=findName(d=>d.k==='m'&&!d.ex&&(d.st||[]).indexOf('通常')>=0&&d.lv===2);
const LV1NORMAL=findName(d=>d.k==='m'&&!d.ex&&(d.st||[]).indexOf('通常')>=0&&d.lv===1);
const LIGHTMON=findName(d=>d.k==='m'&&!d.ex&&d.at==='光');
const DARKMON=findName(d=>d.k==='m'&&!d.ex&&d.at==='闇');
const EARTHMON=findName(d=>d.k==='m'&&!d.ex&&d.at==='地');
const FAIRY=findName(d=>d.k==='m'&&!d.ex&&d.ra==='天使');
const NATURIA=findName(d=>d.k==='m'&&!d.ex&&String(d.n).indexOf('ナチュル')>=0);
const SYNCHRO=findName(d=>d.k==='m'&&(d.st||[]).indexOf('シンクロ')>=0);

const NAMES=['カラテマン','ナチュル・ビートル','闇の芸術家','勇気の砂時計','怒れるもけもけ',
 'サウザンドエナジー','トライアングルパワー','ガオドレイクのタテガミ','グレート・スピリット',
 '極星宝ブリージンガ・メン','シンクロ・ギフト'];
NAMES.forEach(n=>ok('StatModifier registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',
   !!LV2NORMAL&&!!LV1NORMAL&&!!LIGHTMON&&!!EARTHMON&&!!FAIRY&&!!NATURIA&&!!SYNCHRO);

/* =====================================================================
   自分自身の数値を変えるモンスター
   ===================================================================== */
reset0();
let karate=mk('カラテマン');gameState.players[0].mz=[karate];sync();
let eK=eff('カラテマン'),cK=ctxAt(karate,'mz');
let baseK=dbOf(karate).atk;
ok('カラテマン positive: メインフェイズなら発動できる',eK.condition(cK)===true);
eK.operation(cK);
ok('カラテマン positive: 攻撃力が元々の攻撃力の倍になる',
   curATK(findCardByUid(karate.uid).card)===baseK*2,
   'atk='+curATK(findCardByUid(karate.uid).card)+' base='+baseK);
ok('カラテマン positive: エンドフェイズの自壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.note==='カラテマン'));
ok('カラテマン ruling: 元々の攻撃力そのものは変わらない',
   API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(karate.uid).card})===baseK);
gameState.phase='battle';
ok('カラテマン negative: バトルフェイズでは発動できない',
   eK.condition(ctxAt(findCardByUid(karate.uid).card,'mz'))===false);

reset0();
let beetle=mk('ナチュル・ビートル');gameState.players[0].mz=[beetle];
let sp=mk(SPELL,1);gameState.players[1].sz=[sp];sync();
let eBe=eff('ナチュル・ビートル');
let bAtk=dbOf(beetle).atk,bDef=dbOf(beetle).def;
let evBe=fire(SPELL,1,'sz',0,sp);
let cBe=evCtx(beetle,'mz',evBe);
ok('ナチュル・ビートル positive: 魔法の発動で誘発する',eBe.condition(cBe)===true);
eBe.operation(cBe);
ok('ナチュル・ビートル positive: 元々の攻守が入れ替わる',
   API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(beetle.uid).card})===bDef
   &&API.baseDef({p:0,zone:'mz',index:0,card:findCardByUid(beetle.uid).card})===bAtk,
   'atk='+API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(beetle.uid).card}));
eBe.operation(evCtx(beetle,'mz',fire(SPELL,1,'sz',0,mk(SPELL,1))));
ok('ナチュル・ビートル ruling: 2回目で元に戻る',
   API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(beetle.uid).card})===bAtk);
ok('ナチュル・ビートル negative: 罠の発動では誘発しない',
   eBe.condition(evCtx(beetle,'mz',fire('D2シールド',1,'sz',0,mk('D2シールド',1))))===false);

reset0();
let artist=mk('闇の芸術家');gameState.players[0].mz=[artist];
let lightAtk=mk(LIGHTMON,1);gameState.players[1].mz=[lightAtk];sync();
let eAr=eff('闇の芸術家');
let baseDefA=dbOf(artist).def;
gameState.battle={player:1,atkUid:lightAtk.uid,targetUid:artist.uid,step:'declare'};
let cAr=ctxAt(artist,'mz','onAttackDeclare',{});
ok('闇の芸術家 positive: 光属性に攻撃されたら誘発する',eAr.condition(cAr)===true,LIGHTMON);
eAr.operation(cAr);
ok('闇の芸術家 positive: 守備力が半分になる',
   curDEF(findCardByUid(artist.uid).card)===Math.floor(baseDefA/2),
   'def='+curDEF(findCardByUid(artist.uid).card)+' base='+baseDefA);
reset0();
let artist2=mk('闇の芸術家');gameState.players[0].mz=[artist2];
let darkAtk=mk(DARKMON,1);gameState.players[1].mz=[darkAtk];sync();
gameState.battle={player:1,atkUid:darkAtk.uid,targetUid:artist2.uid,step:'declare'};
ok('闇の芸術家 negative: 光属性以外の攻撃では誘発しない',
   eAr.condition(ctxAt(artist2,'mz','onAttackDeclare',{}))===false,DARKMON);
reset0();
let artist3=mk('闇の芸術家'),other=mk(MON);
gameState.players[0].mz=[artist3,other];
let la2=mk(LIGHTMON,1);gameState.players[1].mz=[la2];sync();
gameState.battle={player:1,atkUid:la2.uid,targetUid:other.uid,step:'declare'};
ok('闇の芸術家 negative: 別のモンスターが攻撃されても誘発しない',
   eAr.condition(ctxAt(artist3,'mz','onAttackDeclare',{}))===false);

reset0();
let glass=mk('勇気の砂時計');gameState.players[0].mz=[glass];sync();
let eGl=eff('勇気の砂時計');
let gAtk=dbOf(glass).atk,gDef=dbOf(glass).def;
let cGl=ctxAt(glass,'mz','onNormalSummon',{event:{card:glass}});cGl.event={card:glass};
ok('勇気の砂時計 positive: 召喚成功で誘発する',eGl.condition(cGl)===true);
eGl.operation(cGl);
ok('勇気の砂時計 positive: 元々の攻守が半分になる',
   API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(glass.uid).card})===Math.floor(gAtk/2),
   'base='+API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(glass.uid).card}));
ok('勇気の砂時計 positive: 次の自分のターンの予約が入る',
   (gameState.scheduledV7||[]).some(s=>s.note==='勇気の砂時計'));
/* 予約の中身（倍化）が単体で正しく動くことを確認する */
scheduleHandlerV7('v14.hourglassDouble')({uid:glass.uid});
ok('勇気の砂時計 ruling: 予約が走ると元々の攻守が倍になる',
   API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(glass.uid).card})===gAtk*2,
   'base='+API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(glass.uid).card}));
ok('勇気の砂時計 negative: 他のモンスターの召喚では誘発しない',
   eGl.condition(ctxAt(glass,'mz','onNormalSummon',{event:{card:mk(MON)}}))===false);

reset0();
let angry=mk('怒れるもけもけ',0,'down');gameState.players[0].sz=[angry];
let moke=mk('もけもけ');gameState.players[0].mz=[moke];
let fairy=mk(FAIRY);gameState.players[0].mz.push(fairy);sync();
clearEvts();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:1,reason:'破壊',byDestroy:true});
let leaveEvt=evts('onLeaveField')[0];
let eAn=eff('怒れるもけもけ');
let cAn=ctxAt(angry,'sz','onLeaveField',{event:leaveEvt});cAn.event=leaveEvt;
ok('怒れるもけもけ positive: 自分の天使族が破壊されたら発動できる',eAn.condition(cAn)===true,
   JSON.stringify(leaveEvt));
eAn.operation(cAn);
ok('怒れるもけもけ positive: 「もけもけ」の攻撃力が3000になる',
   curATK(findCardByUid(moke.uid).card)===3000);
reset0();
let angry2=mk('怒れるもけもけ',0,'down');gameState.players[0].sz=[angry2];
let fairy2=mk(FAIRY);gameState.players[0].mz=[fairy2];sync();clearEvts();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let le2=evts('onLeaveField')[0];
let cAn2=ctxAt(angry2,'sz','onLeaveField',{event:le2});cAn2.event=le2;
ok('怒れるもけもけ negative: 「もけもけ」がいなければ発動できない',eAn.condition(cAn2)===false);

/* =====================================================================
   元々の数値をまとめて変える魔法
   ===================================================================== */
reset0();
let energy=mk('サウザンドエナジー');gameState.players[0].sz=[energy];
let n2a=mk(LV2NORMAL),n2b=mk(LV2NORMAL),other2=mk(MON);
gameState.players[0].mz=[n2a,n2b,other2];sync();
let eEn=eff('サウザンドエナジー'),cEn=ctxAt(energy,'sz');
let bAtk2=dbOf(n2a).atk;
ok('サウザンドエナジー positive: レベル2通常モンスターがいれば発動できる',eEn.condition(cEn)===true,LV2NORMAL);
eEn.operation(cEn);
ok('サウザンドエナジー positive: 元々の攻守が1000アップする',
   API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(n2a.uid).card})===bAtk2+1000);
ok('サウザンドエナジー negative: 対象外のモンスターは変わらない',
   API.baseAtk({p:0,zone:'mz',index:2,card:findCardByUid(other2.uid).card})===dbOf(other2).atk);
ok('サウザンドエナジー positive: エンドフェイズの破壊が予約される',
   (gameState.scheduledV7||[]).filter(s=>s.note==='サウザンドエナジー').length===2);
reset0();
let energy2=mk('サウザンドエナジー');gameState.players[0].sz=[energy2];
gameState.players[0].mz=[mk(MON)];sync();
ok('サウザンドエナジー negative: 対象がいなければ発動できない',
   eEn.condition(ctxAt(energy2,'sz'))===false);

reset0();
let tri=mk('トライアングルパワー');gameState.players[0].sz=[tri];
let n1a=mk(LV1NORMAL);gameState.players[0].mz=[n1a];sync();
let eTr=eff('トライアングルパワー'),cTr=ctxAt(tri,'sz');
let bAtk1=dbOf(n1a).atk;
ok('トライアングルパワー positive: レベル1通常モンスターがいれば発動できる',eTr.condition(cTr)===true,LV1NORMAL);
eTr.operation(cTr);
ok('トライアングルパワー positive: 元々の攻守が2000アップする',
   API.baseAtk({p:0,zone:'mz',index:0,card:findCardByUid(n1a.uid).card})===bAtk1+2000);
reset0();
let tri2=mk('トライアングルパワー');gameState.players[0].sz=[tri2];
API.createToken(0,{name:'テストトークン',atk:0,def:0,lv:1},1);sync();
ok('トライアングルパワー ruling: トークンは対象外',
   eTr.condition(ctxAt(tri2,'sz'))===false);

/* =====================================================================
   対象の数値を変えるカード
   ===================================================================== */
reset0();
let mane=mk('ガオドレイクのタテガミ');gameState.players[0].sz=[mane];
let nat=mk(NATURIA);gameState.players[0].mz=[nat];
let notNat=mk(MON);gameState.players[0].mz.push(notNat);sync();
let eMa=eff('ガオドレイクのタテガミ'),cMa=ctxAt(mane,'sz');
ok('ガオドレイクのタテガミ positive: 「ナチュル」がいれば発動できる',eMa.condition(cMa)===true,NATURIA);
eMa.operation(cMa);
let pcMa=pendingChoiceV49(gameState);
ok('ガオドレイクのタテガミ ruling: 「ナチュル」だけが候補',
   pcMa.candidates.length===1&&pcMa.candidates[0].label===NATURIA);
answerAll([pcMa.candidates[0].key]);
ok('ガオドレイクのタテガミ positive: 攻撃力が3000になる',
   curATK(findCardByUid(nat.uid).card)===3000);
ok('ガオドレイクのタテガミ positive: 効果が無効化される',
   effectNegated(findCardByUid(nat.uid).card)===true);
reset0();
let mane2=mk('ガオドレイクのタテガミ');gameState.players[0].sz=[mane2];
gameState.players[0].mz=[mk(MON)];sync();
ok('ガオドレイクのタテガミ negative: 「ナチュル」がいなければ発動できない',
   eMa.condition(ctxAt(mane2,'sz'))===false);

reset0();
let spirit=mk('グレート・スピリット');gameState.players[0].mz=[spirit];sync();
let eSp1=eff('グレート・スピリット','self-set-face-down');
ok('グレート・スピリット positive: 自身を裏側守備表示にできる',eSp1.condition(ctxAt(spirit,'mz'))===true);
eSp1.operation(ctxAt(spirit,'mz'));
ok('グレート・スピリット positive: 裏側守備表示になる',
   (()=>{const h=findCardByUid(spirit.uid);
     return h.card.face==='down'&&h.card.pos==='def';})());
ok('グレート・スピリット negative: 裏側では再度使えない',
   eSp1.condition(ctxAt(findCardByUid(spirit.uid).card,'mz'))===false);
reset0();
let spirit2=mk('グレート・スピリット');gameState.players[0].mz=[spirit2];
let earth=mk(EARTHMON);gameState.players[0].mz.push(earth);sync();
let eSp2=eff('グレート・スピリット','flip-summon-swap-earth-base');
let cSp2=ctxAt(spirit2,'mz','onFlip',{event:{card:spirit2,flipSummon:true}});
cSp2.event={card:spirit2,flipSummon:true};
ok('グレート・スピリット positive: 反転召喚成功で誘発する',eSp2.condition(cSp2)===true,EARTHMON);
let eAtk=dbOf(earth).atk,eDef=dbOf(earth).def;
eSp2.operation(cSp2);
answerAll([pendingChoiceV49(gameState).candidates.find(x=>x.label===EARTHMON).key]);
ok('グレート・スピリット positive: 地属性の元々の攻守が入れ替わる',
   API.baseAtk({p:0,zone:'mz',index:1,card:findCardByUid(earth.uid).card})===eDef
   &&API.baseDef({p:0,zone:'mz',index:1,card:findCardByUid(earth.uid).card})===eAtk);
ok('グレート・スピリット negative: 通常のリバースでは誘発しない',
   eSp2.condition(ctxAt(spirit2,'mz','onFlip',{event:{card:spirit2}}))===false);

reset0();
let bris=mk('極星宝ブリージンガ・メン');gameState.players[0].sz=[bris];
let mine=mk(MON);gameState.players[0].mz=[mine];
let foe=mk(LIGHTMON,1);gameState.players[1].mz=[foe];sync();
let eBr=eff('極星宝ブリージンガ・メン'),cBr=ctxAt(bris,'sz');
ok('極星宝ブリージンガ・メン positive: 双方にモンスターがいれば発動できる',eBr.condition(cBr)===true);
eBr.operation(cBr);
let pcBr=pendingChoiceV49(gameState);
answerAll([pcBr.candidates[0].key,pcBr.candidates[1].key]);
ok('極星宝ブリージンガ・メン positive: 自分のモンスターの攻撃力が相手の元々の攻撃力になる',
   curATK(findCardByUid(mine.uid).card)===dbOf(foe).atk,
   'atk='+curATK(findCardByUid(mine.uid).card)+' foeBase='+dbOf(foe).atk);
reset0();
let bris2=mk('極星宝ブリージンガ・メン');gameState.players[0].sz=[bris2];
gameState.players[0].mz=[mk(MON)];sync();
ok('極星宝ブリージンガ・メン negative: 相手にモンスターがいなければ発動できない',
   eBr.condition(ctxAt(bris2,'sz'))===false);

reset0();
let sg=mk('シンクロ・ギフト');gameState.players[0].sz=[sg];
let syn=mk(SYNCHRO);gameState.players[0].mz=[syn];
let plain=mk(MON);gameState.players[0].mz.push(plain);sync();
let eSg=eff('シンクロ・ギフト'),cSg=ctxAt(sg,'sz');
let synBase=dbOf(syn).atk,plainAtk=dbOf(plain).atk;
ok('シンクロ・ギフト positive: シンクロと非シンクロがいれば発動できる',eSg.condition(cSg)===true,SYNCHRO);
eSg.operation(cSg);
let pcSg=pendingChoiceV49(gameState);
answerAll([pcSg.candidates[0].key,pcSg.candidates[1].key]);
ok('シンクロ・ギフト positive: シンクロの攻撃力が0になる',
   curATK(findCardByUid(syn.uid).card)===0);
ok('シンクロ・ギフト positive: もう1体がその元々の攻撃力分アップする',
   curATK(findCardByUid(plain.uid).card)===plainAtk+synBase,
   'atk='+curATK(findCardByUid(plain.uid).card));
reset0();
let sg2=mk('シンクロ・ギフト');gameState.players[0].sz=[sg2];
gameState.players[0].mz=[mk(MON)];sync();
ok('シンクロ・ギフト negative: シンクロがいなければ発動できない',
   eSg.condition(ctxAt(sg2,'sz'))===false);

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rK=mk('カラテマン');gameState.players[0].mz=[rK];sync();
v41ResetActionJournal(gameState);
eK.operation(ctxAt(rK,'mz'));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 攻守修整を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 攻守修整に関数が混入していない',
   assertStatModStateSerializableV14(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
