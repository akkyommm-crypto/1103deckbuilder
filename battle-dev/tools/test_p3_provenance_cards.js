/* P3 Provenance recovery mini-batch — 由来metadataで解消した11枚の positive/negative。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=88000;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function resetC(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=1;gameState.phase='main1';gameState.turn=2;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;v41ResetActionJournal(gameState);API.selectCard=(title,list,cb)=>cb(list[0]);}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
/* カードの現在地からコンテキストを作る（indexを手で書かない） */
function gctx(card,ev,extra){const h=locateCardAnyV4(card);if(!h)throw new Error('not on board');return makeContext(0,card,h.zone,h.index,ev||'activate',extra||{});}
/* アドバンス召喚をエンジンのAction経由で行う */
function tsummon(p,summonCard,materials){
  const P=gameState.players[p];if(P.hand.indexOf(summonCard)<0)P.hand.push(summonCard);
  const mats=materials.map(c=>snapshotCardV3(c,['atk','def','level','attribute','race','owner','originalAtk']));
  materials.slice().forEach(c=>{const l=locateCard(c);if(l)act({type:'FX_TO_GRAVE',player:l.p,zone:l.zone,index:l.index,reason:'アドバンス召喚のリリース',byDestroy:false,p3:{reason:'tribute',actingPlayer:p,fromZone:l.zone}});});
  act({type:'NORMAL_SUMMON',player:p,handIndex:P.hand.indexOf(summonCard),pos:'atk',tributes:mats.length,tributeValue:mats.length,p3Materials:mats});
  return P.mz[P.mz.length-1];
}
/* 相手(P1)の効果で手札／デッキから墓地へ送る */
function oppSend(type,card,extra){
  p3BeginEffectContextV3(1);
  act(Object.assign({type,player:0},extra||{}));
  p3EndEffectContextV3();
  return gameState.players[0].grave[gameState.players[0].grave.length-1];
}
const NAMES=['カイザー・サクリファイス','ゾルガ','偉大魔獣 ガーゼット','合成魔獣 ガーゼット','疾風鳥人ジョー','バーストブレス','モーム','エレクトリック・スネーク','再生ミイラ','闇よりの恐怖','闇より出でし絶望'];
NAMES.forEach(n=>ok('P3 recovery registration '+n,!!CARD_SCRIPTS[n]));

/* ---- カイザー・サクリファイス ---- */
resetC();let k=mk('カイザー・サクリファイス'),h=mk('冥界の魔王 ハ・デス');gameState.players[0].mz=[k];
let summoned=tsummon(0,h,[k]);
let e=eff('カイザー・サクリファイス'),c=gctx(k,'onNormalSummon',{event:{card:summoned,player:0}});
ok('カイザー・サクリファイス positive 自身をリリースした生け贄召喚',e.condition(c));
e.operation(c);
ok('カイザー・サクリファイス 手札へ戻る',gameState.players[0].hand.includes(k),'hand='+gameState.players[0].hand.length);
resetC();k=mk('カイザー・サクリファイス');h=mk('冥界の魔王 ハ・デス');let other=mk('ヂェミナイ・エルフ');
gameState.players[0].mz=[other];gameState.players[0].grave=[k];
summoned=tsummon(0,h,[other]);
ok('カイザー・サクリファイス negative 別のカードをリリースした召喚では誘発しない',
   !eff('カイザー・サクリファイス').condition(gctx(k,'onNormalSummon',{event:{card:summoned,player:0}})));

/* ---- ゾルガ ---- */
resetC();let z=mk('ゾルガ');h=mk('冥界の魔王 ハ・デス');gameState.players[0].mz=[z];
summoned=tsummon(0,h,[z]);
e=eff('ゾルガ');c=gctx(z,'onNormalSummon',{event:{card:summoned,player:0}});
ok('ゾルガ positive 自身をリリースした生け贄召喚',e.condition(c));
let lp0=gameState.players[0].lp;e.operation(c);
ok('ゾルガ 2000回復',gameState.players[0].lp===lp0+2000,'lp='+gameState.players[0].lp);
resetC();z=mk('ゾルガ');gameState.players[0].grave=[z];h=mk('冥界の魔王 ハ・デス');other=mk('ヂェミナイ・エルフ');gameState.players[0].mz=[other];
summoned=tsummon(0,h,[other]);
ok('ゾルガ negative 素材でなければ誘発しない',
   !eff('ゾルガ').condition(gctx(z,'onNormalSummon',{event:{card:summoned,player:0}})));

/* ---- 偉大魔獣 ガーゼット（元々の攻撃力×2） ---- */
resetC();let mat=mk('ヂェミナイ・エルフ');gameState.players[0].mz=[mat];
mat.mods=[{atk:900}];                                   /* 現在値ではなく元々の値を使うこと */
let gz=tsummon(0,mk('偉大魔獣 ガーゼット'),[mat]);
ok('偉大魔獣 ガーゼット positive 元々の攻撃力の2倍',curATK(gz)===3800,'atk='+curATK(gz));
resetC();gz=mk('偉大魔獣 ガーゼット');gameState.players[0].mz=[gz];
ok('偉大魔獣 ガーゼット negative 生け贄召喚以外では0',curATK(gz)===0,'atk='+curATK(gz));

/* ---- 合成魔獣 ガーゼット（2体の元々の攻撃力の合計） ---- */
resetC();let m1=mk('ヂェミナイ・エルフ'),m2=mk('岩石の巨兵');gameState.players[0].mz=[m1,m2];
let gz2=tsummon(0,mk('合成魔獣 ガーゼット'),[m1,m2]);
ok('合成魔獣 ガーゼット positive 2体の元々の攻撃力の合計',curATK(gz2)===1900+1300,'atk='+curATK(gz2));
resetC();m1=mk('ヂェミナイ・エルフ');gameState.players[0].mz=[m1];
gz2=tsummon(0,mk('合成魔獣 ガーゼット'),[m1]);
ok('合成魔獣 ガーゼット negative 1体では数値が決まらない',curATK(gz2)===0,'atk='+curATK(gz2));

/* ---- 疾風鳥人ジョー ---- */
resetC();let wind=mk('ハーピィ・レディ');gameState.players[0].mz=[wind];
/* 小道具は coverage を動かさないよう TESTED 済みのカードから選ぶ */
let sp0=mk('サイクロン',0,'down'),sp1=mk('くず鉄のかかし',1,'down');
gameState.players[0].sz=[sp0];gameState.players[1].sz=[sp1];
let joe=tsummon(0,mk('疾風鳥人ジョー'),[wind]);
e=eff('疾風鳥人ジョー');c=gctx(joe,'onNormalSummon',{event:{card:joe,player:0}});
ok('疾風鳥人ジョー positive 風属性をリリースした生け贄召喚',e.condition(c));
e.operation(c);
ok('疾風鳥人ジョー 両者の魔法・罠を裏側も含めて手札へ戻す',
   gameState.players[0].sz.length===0&&gameState.players[1].sz.length===0&&
   gameState.players[0].hand.includes(sp0)&&gameState.players[1].hand.includes(sp1));
resetC();let earth=mk('ヂェミナイ・エルフ');gameState.players[0].mz=[earth];
joe=tsummon(0,mk('疾風鳥人ジョー'),[earth]);
ok('疾風鳥人ジョー negative 風属性以外のリリースでは誘発しない',
   !eff('疾風鳥人ジョー').condition(gctx(joe,'onNormalSummon',{event:{card:joe,player:0}})));

/* ---- バーストブレス（リリース時の攻撃力を参照） ---- */
resetC();let bb=mk('バーストブレス'),dragon=mk('青眼の白龍');
dragon.mods=[{atk:-2000}];                              /* リリース時点の現在ATK=1000 */
let weak=mk('ヂェミナイ・エルフ',1),tough=mk('ナチュル・ラグウィード',1),hidden=mk('ヂェミナイ・エルフ',1,'down','def');
gameState.players[0].sz=[bb];gameState.players[0].mz=[dragon];gameState.players[1].mz=[weak,tough,hidden];
e=eff('バーストブレス');c=gctx(bb);
ok('バーストブレス positive ドラゴン族がいる',e.condition(c));
let paid=false;e.cost(c,v=>{paid=v;});
ok('バーストブレス リリースをコストとして払う',paid&&gameState.players[0].grave.includes(dragon));
e.operation(c);
ok('バーストブレス リリース時の攻撃力以下の守備力を破壊する',
   gameState.players[1].grave.includes(weak)&&gameState.players[1].mz.includes(tough),
   'grave='+gameState.players[1].grave.length);
ok('バーストブレス 裏側守備表示も対象になる',gameState.players[1].grave.includes(hidden));
resetC();bb=mk('バーストブレス');gameState.players[0].sz=[bb];gameState.players[0].mz=[mk('ヂェミナイ・エルフ')];
ok('バーストブレス negative ドラゴン族がいない',!eff('バーストブレス').condition(gctx(bb)));

/* ---- モーム ---- */
resetC();let mome=mk('モーム');let hidden2=mk('ヂェミナイ・エルフ',1,'down','def');
let weak2=mk('ヂェミナイ・エルフ',1),tough2=mk('ナチュル・ラグウィード',1);
gameState.players[0].mz=[mome];gameState.players[1].mz=[weak2,tough2,hidden2];
e=eff('モーム');c=gctx(mome);
ok('モーム positive 地属性がいる（自身も可）',e.condition(c));
paid=false;e.cost(c,v=>{paid=v;});
ok('モーム 自身をリリースできる',paid&&gameState.players[0].grave.includes(mome));
e.operation(c);
ok('モーム 攻撃力以下の守備力の表側モンスターを破壊する',
   gameState.players[1].grave.includes(weak2)&&gameState.players[1].mz.includes(tough2));
ok('モーム 裏側表示は破壊しない',gameState.players[1].mz.includes(hidden2));
resetC();mome=mk('モーム',0,'down','def');gameState.players[0].mz=[mome,mk('青眼の白龍')];
ok('モーム negative 表側の地属性がいない（自身が裏側なら払えない）',
   !eff('モーム').condition(makeContext(0,mome,'mz',0,'activate',{})));

/* ---- エレクトリック・スネーク ---- */
resetC();let snake=mk('エレクトリック・スネーク');gameState.players[0].hand=[snake];
gameState.players[0].deck=[mk('ヂェミナイ・エルフ'),mk('岩石の巨兵')];
let sent=oppSend('FX_DISCARD',snake,{index:0,byEffect:true,byPlayer:1,reason:'相手の効果'});
e=eff('エレクトリック・スネーク');c=gctx(sent,'onDiscard',{});
ok('エレクトリック・スネーク positive 相手の効果で手札から捨てられた',e.condition(c));
e.operation(c);
ok('エレクトリック・スネーク 2枚ドロー',gameState.players[0].hand.length===2,'hand='+gameState.players[0].hand.length);
resetC();snake=mk('エレクトリック・スネーク');gameState.players[0].hand=[snake];
p3BeginEffectContextV3(0);act({type:'FX_DISCARD',player:0,index:0,byEffect:true,reason:'自分の効果'});p3EndEffectContextV3();
ok('エレクトリック・スネーク negative 自分の効果では誘発しない',
   !eff('エレクトリック・スネーク').condition(gctx(gameState.players[0].grave[0],'onDiscard',{})));

/* ---- 再生ミイラ ---- */
resetC();let mummy=mk('再生ミイラ');gameState.players[0].hand=[mummy];
sent=oppSend('FX_HAND_SEND_GRAVE',mummy,{handIndex:0,reason:'相手の効果'});
e=eff('再生ミイラ');c=gctx(sent,'onSendToGrave',{});
ok('再生ミイラ positive 相手の効果で手札から墓地へ送られた',e.condition(c));
e.operation(c);
ok('再生ミイラ 手札へ戻る',gameState.players[0].hand.includes(mummy));
resetC();mummy=mk('再生ミイラ');gameState.players[0].mz=[mummy];
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('再生ミイラ negative フィールドから墓地へ送られた場合は誘発しない',
   !eff('再生ミイラ').condition(gctx(gameState.players[0].grave[0],'onSendToGrave',{})));

/* ---- 闇よりの恐怖 / 闇より出でし絶望 ---- */
['闇よりの恐怖','闇より出でし絶望'].forEach(nm=>{
  resetC();const card=mk(nm);gameState.players[0].deck=[card];
  const sentC=oppSend('FX_MILL',card,{deckIndex:0,reason:'相手の効果'});
  const ee=eff(nm),cc=gctx(sentC,'onSendToGrave',{});
  ok(nm+' positive 相手の効果でデッキから墓地へ送られた',ee.condition(cc));
  ee.operation(cc);
  ok(nm+' 自身を特殊召喚する',gameState.players[0].mz.includes(card),'mz='+gameState.players[0].mz.length);
  resetC();const card2=mk(nm);gameState.players[0].hand=[card2];
  const sentH=oppSend('FX_DISCARD',card2,{index:0,byEffect:true,byPlayer:1,reason:'相手の効果'});
  ok(nm+' positive 手札から墓地へ送られた場合も誘発する',eff(nm).condition(gctx(sentH,'onSendToGrave',{})));
  resetC();const card3=mk(nm);gameState.players[0].deck=[card3];
  p3BeginEffectContextV3(0);act({type:'FX_MILL',player:0,deckIndex:0,reason:'自分の効果'});p3EndEffectContextV3();
  ok(nm+' negative 自分の効果では誘発しない',!eff(nm).condition(gctx(gameState.players[0].grave[0],'onSendToGrave',{})));
});

/* ---- 古い由来情報での誤誘発（実カードでの検証） ---- */

/* ゾルガ: 素材として使われた後も墓地に残る。同じモンスターが再びアドバンス召喚
   されたとき、1回目の記録で2回目に誘発してはいけない。 */
resetC();
let zg=mk('ゾルガ'),zb=mk('ヂェミナイ・エルフ'),zx=mk('冥界の魔王 ハ・デス');
gameState.players[0].mz=[zg,zb];
let zx1=tsummon(0,zx,[zg]);
ok('ゾルガ 1回目: 自身を素材にした召喚で誘発する',
   eff('ゾルガ').condition(gctx(zg,'onNormalSummon',{event:{card:zx1,player:0}})));
/* X を場から退かせ、手札へ戻し、素材Bで同じXを再びアドバンス召喚する */
let zxl=locateCard(zx1);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:zxl.index,reason:'破壊',byDestroy:true});
let zxg=findCardByUid(zx.uid);
act({type:'FX_BOUNCE',player:0,zone:'grave',index:zxg.index,reason:'手札へ'});
gameState.players[0].normalSummonUsed=false;
let zbl=locateCard(zb);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:zbl.index,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
let zxh=findCardByUid(zx.uid);
act({type:'NORMAL_SUMMON',player:0,handIndex:zxh.index,pos:'atk',tributes:1,tributeValue:1,
     p3Materials:[snapshotCardV3(zb,['atk'])]});
let zx2=findCardByUid(zx.uid).card;
ok('ゾルガ 2回目: 同じuidのモンスターの再召喚では誘発しない（古い世代）',
   !eff('ゾルガ').condition(gctx(zg,'onNormalSummon',{event:{card:zx2,player:0}})),
   JSON.stringify(zg.usedAsMaterial)+' vs '+JSON.stringify(zx2.summonProvenance));
ok('ゾルガ 2回目: 今回の素材Bの方は誘発条件を満たす（別カードだが同じ判定式）',
   API.usedAsMaterialFor(findCardByUid(zb.uid).card,zx2,'tribute'));

/* 偉大魔獣 ガーゼット: アドバンス召喚で決まった攻撃力が、蘇生後に残らない */
resetC();
let ggm=mk('ヂェミナイ・エルフ');gameState.players[0].mz=[ggm];
let gg=tsummon(0,mk('偉大魔獣 ガーゼット'),[ggm]);
ok('偉大魔獣 ガーゼット: アドバンス召喚時は3800',curATK(gg)===3800,'atk='+curATK(gg));
let ggl=locateCard(gg);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:ggl.index,reason:'破壊',byDestroy:true});
let ggg=findCardByUid(gg.uid);
API.specialSummon(0,'grave',ggg.index,'atk','蘇生');
ok('偉大魔獣 ガーゼット: 蘇生後は古い素材情報を使わず0に戻る',
   curATK(findCardByUid(gg.uid).card)===0,'atk='+curATK(findCardByUid(gg.uid).card));

/* エレクトリック・スネーク: 相手効果で捨てられた後に手札へ戻り、
   ルール処理で墓地へ送られた場合は誘発しない */
resetC();
let es=mk('エレクトリック・スネーク');gameState.players[0].hand=[es];
gameState.players[0].deck=[mk('ヂェミナイ・エルフ'),mk('岩石の巨兵')];
let esg=oppSend('FX_DISCARD',es,{index:0,byEffect:true,byPlayer:1,reason:'相手の効果'});
ok('エレクトリック・スネーク 1回目: 相手の効果で誘発する',
   eff('エレクトリック・スネーク').condition(gctx(esg,'onDiscard',{})));
let esl=findCardByUid(es.uid);
act({type:'FX_BOUNCE',player:0,zone:'grave',index:esl.index,reason:'手札へ'});
let esh=findCardByUid(es.uid);
act({type:'FX_DISCARD',player:0,index:esh.index,byEffect:false,reason:'手札制限（ルール処理）'});
ok('エレクトリック・スネーク 2回目: ルール処理では古い「相手の効果」で誘発しない',
   !eff('エレクトリック・スネーク').condition(gctx(findCardByUid(es.uid).card,'onDiscard',{})),
   JSON.stringify(API.moveProvenance(findCardByUid(es.uid).card)));

/* 再生ミイラ: 相手効果で戻った後、自分の効果で墓地へ送っても誘発しない */
resetC();
let rm=mk('再生ミイラ');gameState.players[0].hand=[rm];
let rmg=oppSend('FX_HAND_SEND_GRAVE',rm,{handIndex:0,reason:'相手の効果'});
ok('再生ミイラ 1回目: 相手の効果で誘発する',
   eff('再生ミイラ').condition(gctx(rmg,'onSendToGrave',{})));
let rml=findCardByUid(rm.uid);
act({type:'FX_BOUNCE',player:0,zone:'grave',index:rml.index,reason:'手札へ'});
let rmh=findCardByUid(rm.uid);
p3BeginEffectContextV3(0);
act({type:'FX_HAND_SEND_GRAVE',player:0,handIndex:rmh.index,reason:'自分の効果'});
p3EndEffectContextV3();
ok('再生ミイラ 2回目: 自分の効果では古い記録で誘発しない',
   !eff('再生ミイラ').condition(gctx(findCardByUid(rm.uid).card,'onSendToGrave',{})),
   JSON.stringify(API.moveProvenance(findCardByUid(rm.uid).card)));

/* ---- 全体の健全性 ---- */
ok('P3 recovery 盤面はJSON直列化できる',!!JSON.stringify(gameState));
ok('P3 recovery Action Journalが生きている',Array.isArray(V41_ACTION_JOURNAL));
/* Replay検証は盤面を組み終えてから初期状態を取る。
   先にJournalを初期化すると、直接代入した盤面が初期スナップショットに入らない。 */
resetC();
let rz=mk('ゾルガ'),rh=mk('冥界の魔王 ハ・デス'),rs=mk('エレクトリック・スネーク');
gameState.players[0].mz=[rz];gameState.players[0].hand=[rh,rs];
gameState.players[0].deck=[mk('ヂェミナイ・エルフ'),mk('岩石の巨兵')];
v41ResetActionJournal(gameState);
let rsum=tsummon(0,rh,[rz]);
eff('ゾルガ').operation(gctx(rz,'onNormalSummon',{event:{card:rsum,player:0}}));
oppSend('FX_DISCARD',rs,{index:gameState.players[0].hand.indexOf(rs),byEffect:true,byPlayer:1,reason:'相手の効果'});
let pkg=v41ReplayPackage(gameState),audit=v44ReplayAuditPackage(pkg);
ok('P3 recovery 由来metadataを含む進行がdigest一致で再生される',audit.ok,audit.reason||audit.finalDigest);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:30000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}

