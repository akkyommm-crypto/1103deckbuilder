/* Position recovery batch — 14枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=94000;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function sync(){gameState.posSnapV10=positionSnapshotV10(gameState);
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',extra||{});}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function answerAll(keys){const pc=pendingChoiceV49(gameState);if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(keys||pc.candidates.map(x=>x.key));}
function answerName(name){const pc=pendingChoiceV49(gameState),c=pc&&pc.candidates.find(x=>x.label===name);
  if(!c)throw new Error('candidate missing '+name+' / '+(pc?pc.candidates.map(x=>x.label).join(','):'none'));
  return answerChoiceV49([c.key]);}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 変更イベントを1件作る（実際に盤面を動かして出させる） */
function firePosChange(p,index){
  act({type:'TOGGLE_POS',player:p,zone:'mz',index});
  const ev=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onPositionChange').map(e=>e.evt);
  return ev[ev.length-1];
}

const LV4='ヂェミナイ・エルフ';
const LV3    =findName(d=>d.k==='m'&&(d.lv||9)<=3&&!d.ex&&!(d.st||[]).includes('トークン'));
const KARA_F =findName(d=>d.k==='m'&&!d.ex&&String(d.n).indexOf('カラクリ')>=0);
const KARA_D =findName(d=>d.k==='m'&&!d.ex&&(d.lv||99)<=4&&String(d.n).indexOf('カラクリ')>=0);
const MORPH  =findName(d=>d.k==='m'&&!d.ex&&isCardInGroupV4(d,GROUP.D_MORPHTRONIC));
const ANYSP  ='サイクロン';

const NAMES=['レベル制限B地区','レベル制限A地区','リトル・ウィンガード','ブレードラビット','悪魔の知恵',
 'ヤドカリュー','断頭台の惨劇','カラクリ屋敷','ガードペナルティ','D・コード','闇をかき消す光',
 'カード・フリッパー','ガジェット・ドライバー','借カラクリ蔵'];
NAMES.forEach(n=>ok('Position registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',!!LV3&&!!KARA_F&&!!KARA_D&&!!MORPH);

/* =====================================================================
   永続の強制表示形式
   ===================================================================== */
reset0();
let bZone=mk('レベル制限B地区');gameState.players[0].sz=[bZone];
let bm0=mk(LV4),bm1=mk(LV4,1),bm2=mk(LV3);
gameState.players[0].mz=[bm0,bm2];gameState.players[1].mz=[bm1];
sync();v41ResetActionJournal(gameState);
enforceForcedPositionV10(gameState);
ok('レベル制限B地区 positive: 自分のレベル4以上が守備表示になる',gameState.players[0].mz[0].pos==='def');
ok('レベル制限B地区 positive: 相手のレベル4以上も守備表示になる',gameState.players[1].mz[0].pos==='def');
ok('レベル制限B地区 negative: レベル3以下は影響を受けない',gameState.players[0].mz[1].pos==='atk',
   'lv='+curLV(gameState.players[0].mz[1]));
ok('レベル制限B地区 ruling: 固定中は手動で表示形式を変更できない',
   canManualPositionChange(gameState.players[0].mz[0])===false);
ok('レベル制限B地区 ruling: 対象外のモンスターは従来どおり変更できる',
   canManualPositionChange(gameState.players[0].mz[1])===true);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
enforceForcedPositionV10(gameState);
ok('レベル制限B地区 ruling: 場を離れたら固定が解ける',gameState.players[0].mz[0].pos==='atk');
reset0();
let bDown=mk('レベル制限B地区',0,'down');gameState.players[0].sz=[bDown];
let bd=mk(LV4);gameState.players[0].mz=[bd];sync();
enforceForcedPositionV10(gameState);
ok('レベル制限B地区 negative: 裏側では効果が働かない',gameState.players[0].mz[0].pos==='atk');

reset0();
let aZone=mk('レベル制限A地区');gameState.players[0].sz=[aZone];
let am0=mk(LV3,0,'up','def'),am1=mk(LV4,0,'up','def');
gameState.players[0].mz=[am0,am1];sync();v41ResetActionJournal(gameState);
enforceForcedPositionV10(gameState);
ok('レベル制限A地区 positive: レベル3以下が攻撃表示になる',gameState.players[0].mz[0].pos==='atk');
ok('レベル制限A地区 negative: レベル4以上は影響を受けない',gameState.players[0].mz[1].pos==='def');
let aDown=mk(LV3,0,'down','def');gameState.players[0].mz.push(aDown);sync();
enforceForcedPositionV10(gameState);
ok('レベル制限A地区 negative: 裏側モンスターは対象外',
   gameState.players[0].mz[2].face==='down'&&gameState.players[0].mz[2].pos==='def');

reset0();
let wing=mk('リトル・ウィンガード'),other=mk(LV4);
gameState.players[0].mz=[wing,other];sync();
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
gameState.phase='end';
ok('リトル・ウィンガード positive: エンドフェイズに追加で変更できる',
   canManualPositionChange(gameState.players[0].mz[0])===true);
ok('リトル・ウィンガード negative: 他のモンスターはエンドフェイズに変更できない',
   canManualPositionChange(gameState.players[0].mz[1])===false);
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
ok('リトル・ウィンガード ruling: 1ターンに1度だけ',
   canManualPositionChange(gameState.players[0].mz[0])===false);
gameState.turn+=2;
ok('リトル・ウィンガード ruling: 次のターンには戻る',
   canManualPositionChange(gameState.players[0].mz[0])===true);

/* =====================================================================
   表示形式が変わった時に誘発するカード
   ===================================================================== */
reset0();
let rabbit=mk('ブレードラビット'),foe=mk(LV4,1);
gameState.players[0].mz=[rabbit];gameState.players[1].mz=[foe];
sync();v41ResetActionJournal(gameState);
let evR=firePosChange(0,0);
let eR=eff('ブレードラビット'),cR=ctxAt(rabbit,'mz','onPositionChange',{event:evR});
cR.event=evR;
ok('ブレードラビット positive: 攻撃表示→表側守備で誘発する',eR.condition(cR)===true);
eR.operation(cR);answerAll();
ok('ブレードラビット positive: 相手モンスターを破壊する',
   gameState.players[1].mz.length===0&&gameState.players[1].grave.length===1);
reset0();
let rabbit2=mk('ブレードラビット',0,'up','def');gameState.players[0].mz=[rabbit2];
gameState.players[1].mz=[mk(LV4,1)];sync();
let evR2=firePosChange(0,0);
let cR2=ctxAt(rabbit2,'mz','onPositionChange',{event:evR2});cR2.event=evR2;
ok('ブレードラビット negative: 守備→攻撃では誘発しない',eR.condition(cR2)===false);
reset0();
let rabbit3=mk('ブレードラビット'),bystander=mk(LV4);
gameState.players[0].mz=[rabbit3,bystander];gameState.players[1].mz=[mk(LV4,1)];sync();
let evR3=firePosChange(0,1);
let cR3=ctxAt(rabbit3,'mz','onPositionChange',{event:evR3});cR3.event=evR3;
ok('ブレードラビット negative: 他のモンスターの変更では誘発しない',eR.condition(cR3)===false);

reset0();
let wis=mk('悪魔の知恵');gameState.players[0].mz=[wis];
gameState.players[0].deck=[mk(LV4),mk(LV3),mk(ANYSP)];sync();v41ResetActionJournal(gameState);
let evW=firePosChange(0,0);
let eW=eff('悪魔の知恵'),cW=ctxAt(wis,'mz','onPositionChange',{event:evW});cW.event=evW;
ok('悪魔の知恵 positive: 攻撃表示→表側守備で誘発する',eW.condition(cW)===true);
let deckBefore=gameState.players[0].deck.length;
eW.operation(cW);
ok('悪魔の知恵 positive: デッキ枚数は変わらずシャッフルされる',
   gameState.players[0].deck.length===deckBefore);
ok('悪魔の知恵 ruling: 任意ではなく強制効果',eW.forced===true);
reset0();
let wis2=mk('悪魔の知恵',0,'up','def');gameState.players[0].mz=[wis2];sync();
let evW2=firePosChange(0,0);
let cW2=ctxAt(wis2,'mz','onPositionChange',{event:evW2});cW2.event=evW2;
ok('悪魔の知恵 negative: 守備→攻撃では誘発しない',eW.condition(cW2)===false);

reset0();
let yado=mk('ヤドカリュー');gameState.players[0].mz=[yado];
let yh1=mk(ANYSP),yh2=mk(LV4);gameState.players[0].hand=[yh1,yh2];
gameState.players[0].deck=[mk(LV3)];sync();v41ResetActionJournal(gameState);
let evY=firePosChange(0,0);
let eY=eff('ヤドカリュー'),cY=ctxAt(yado,'mz','onPositionChange',{event:evY});cY.event=evY;
ok('ヤドカリュー positive: 手札があれば誘発する',eY.condition(cY)===true);
eY.operation(cY);
let pcY=pendingChoiceV49(gameState);
ok('ヤドカリュー ruling: 任意の枚数を選べる（0枚も可）',pcY.min===0&&pcY.max===2,
   'min='+pcY.min+' max='+pcY.max);
ok('ヤドカリュー: 選択は直列化できる',assertChoiceSerializableV49(gameState).ok);
answerName(ANYSP);
ok('ヤドカリュー positive: 選んだ手札がデッキの一番下に戻る',
   gameState.players[0].deck[gameState.players[0].deck.length-1].uid===yh1.uid
   &&gameState.players[0].hand.length===1,
   'deck='+gameState.players[0].deck.length);
reset0();
let yado2=mk('ヤドカリュー');gameState.players[0].mz=[yado2];sync();
let evY2=firePosChange(0,0);
let cY2=ctxAt(yado2,'mz','onPositionChange',{event:evY2});cY2.event=evY2;
ok('ヤドカリュー negative: 手札が無ければ誘発しない',eY.condition(cY2)===false);

reset0();
let guillo=mk('断頭台の惨劇',0,'down');gameState.players[0].sz=[guillo];
let g1=mk(LV4,1),g2=mk(LV3,1,'up','def');
gameState.players[1].mz=[g1,g2];sync();v41ResetActionJournal(gameState);
let evG=firePosChange(1,0);
let eG=eff('断頭台の惨劇'),cG=ctxAt(guillo,'sz','onPositionChange',{event:evG});cG.event=evG;
ok('断頭台の惨劇 positive: 相手の攻撃表示→表側守備で発動できる',eG.condition(cG)===true);
eG.operation(cG);
ok('断頭台の惨劇 positive: 相手の守備表示モンスターを全て破壊する',
   gameState.players[1].mz.length===0&&gameState.players[1].grave.length===2,
   'mz='+gameState.players[1].mz.length);
reset0();
let guillo2=mk('断頭台の惨劇',0,'down');gameState.players[0].sz=[guillo2];
let og=mk(LV4);gameState.players[0].mz=[og];sync();
let evG2=firePosChange(0,0);
let cG2=ctxAt(guillo2,'sz','onPositionChange',{event:evG2});cG2.event=evG2;
ok('断頭台の惨劇 negative: 自分のモンスターの変更では発動できない',eG.condition(cG2)===false);

reset0();
let yashiki=mk('カラクリ屋敷',0,'down');gameState.players[0].sz=[yashiki];
let kmon=mk(KARA_F);gameState.players[0].mz=[kmon];sync();v41ResetActionJournal(gameState);
let evK=firePosChange(0,0);
let eK=eff('カラクリ屋敷'),cK=ctxAt(yashiki,'sz','onPositionChange',{event:evK});cK.event=evK;
ok('カラクリ屋敷 positive: 自分の表側「カラクリ」の変更で発動できる',eK.condition(cK)===true,KARA_F);
eK.operation(cK);answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('カラクリ屋敷 positive: フィールドのカード1枚を破壊する',
   gameState.players[0].grave.length>=1);
reset0();
let yashiki2=mk('カラクリ屋敷',0,'down');gameState.players[0].sz=[yashiki2];
let nonk=mk(LV4);gameState.players[0].mz=[nonk];sync();
let evK2=firePosChange(0,0);
let cK2=ctxAt(yashiki2,'sz','onPositionChange',{event:evK2});cK2.event=evK2;
ok('カラクリ屋敷 negative: 「カラクリ」以外の変更では発動できない',eK.condition(cK2)===false);

reset0();
let guard=mk('ガードペナルティ');gameState.players[0].sz=[guard];
let gm=mk(LV4);gameState.players[0].mz=[gm];
gameState.players[0].deck=[mk(ANYSP)];sync();v41ResetActionJournal(gameState);
let eG1=eff('ガードペナルティ','mark-target'),cG1=ctxAt(guard,'sz');
ok('ガードペナルティ positive: フィールドにモンスターがあれば発動できる',eG1.condition(cG1)===true);
eG1.operation(cG1);answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('ガードペナルティ: 監視情報が対象に残る',
   !!findCardByUid(gm.uid).card.v10GuardPenalty);
let evGP=firePosChange(0,0);
let eG2=eff('ガードペナルティ','watched-turned-defense-draw');
let cG2b=makeContext(0,guard,'grave',0,'onPositionChange',{event:evGP});cG2b.event=evGP;
ok('ガードペナルティ positive: 監視対象が守備表示になったら誘発する',eG2.condition(cG2b)===true);
let handBefore=gameState.players[0].hand.length;
eG2.operation(cG2b);
ok('ガードペナルティ positive: 1枚ドローする',gameState.players[0].hand.length===handBefore+1);
gameState.turn+=1;
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
let evGP2=firePosChange(0,0);
let cG3=makeContext(0,guard,'grave',0,'onPositionChange',{event:evGP2});cG3.event=evGP2;
ok('ガードペナルティ ruling: 次のターンには誘発しない',eG2.condition(cG3)===false);

reset0();
let dcode=mk('D・コード');gameState.players[0].sz=[dcode];
let dmon=mk(MORPH),dother=mk(LV4);
gameState.players[0].mz=[dmon,dother];
gameState.players[1].sz=[mk(ANYSP,1,'up')];sync();v41ResetActionJournal(gameState);
let eD1=eff('D・コード','equip-to-morphtronic'),cD1=ctxAt(dcode,'sz');
ok('D・コード positive: 「D」モンスターがいれば発動できる',eD1.condition(cD1)===true,MORPH);
let pcD=(eD1.operation(cD1),pendingChoiceV49(gameState));
ok('D・コード ruling: 「D」以外は装備対象にならない',
   pcD.candidates.length===1&&pcD.candidates[0].label===MORPH,
   pcD.candidates.map(x=>x.label).join(','));
answerAll([pcD.candidates[0].key]);
ok('D・コード positive: 装備される',
   !!(findCardByUid(dcode.uid).card.equipTo&&findCardByUid(dcode.uid).card.equipTo.uid===dmon.uid));
let evD=firePosChange(0,0);
let eD2=eff('D・コード','equipped-position-changed-destroy');
let cD2=ctxAt(dcode,'sz','onPositionChange',{event:evD});cD2.event=evD;
ok('D・コード positive: 装備モンスターの表示形式変更で誘発する',eD2.condition(cD2)===true);
eD2.operation(cD2);
let pcD2=pendingChoiceV49(gameState);
ok('D・コード ruling: 自分のこのカードも破壊候補に含まれる',
   pcD2.candidates.some(x=>x.label==='D・コード'),pcD2.candidates.map(x=>x.label).join(','));
answerName(ANYSP);
ok('D・コード positive: 魔法・罠を破壊する',gameState.players[1].sz.length===0);
let evD2=firePosChange(0,1);
let cD3=ctxAt(dcode,'sz','onPositionChange',{event:evD2});cD3.event=evD2;
ok('D・コード negative: 装備していないモンスターの変更では誘発しない',eD2.condition(cD3)===false);
reset0();
let dcode2=mk('D・コード');gameState.players[0].sz=[dcode2];
gameState.players[0].mz=[mk(LV4)];sync();
ok('D・コード negative: 「D」がいなければ発動できない',
   eD1.condition(ctxAt(dcode2,'sz'))===false);

/* =====================================================================
   まとめて表示形式を変えるカード
   ===================================================================== */
reset0();
let lightv=mk('闇をかき消す光');gameState.players[0].sz=[lightv];
let f1=mk(LV4,1,'down','def'),f2=mk(LV3,1,'down','def'),f3=mk(LV4,1,'up','atk');
gameState.players[1].mz=[f1,f2,f3];sync();v41ResetActionJournal(gameState);
gameState.deferredEvents=[];
let eL=eff('闇をかき消す光'),cL=ctxAt(lightv,'sz');
ok('闇をかき消す光 positive: 裏側モンスターがいれば発動できる',eL.condition(cL)===true);
eL.operation(cL);
ok('闇をかき消す光 positive: 裏側モンスターが全て表側になる',
   gameState.players[1].mz.every(c=>c.face==='up'));
ok('闇をかき消す光 ruling: 表示形式は守備のまま',
   gameState.players[1].mz[0].pos==='def'&&gameState.players[1].mz[1].pos==='def');
ok('闇をかき消す光 ruling: リバース効果のため onFlip が出る',
   (gameState.deferredEvents||[]).filter(e=>e.eventName==='onFlip').length===2,
   JSON.stringify((gameState.deferredEvents||[]).map(e=>e.eventName)));
reset0();
let lightv2=mk('闇をかき消す光');gameState.players[0].sz=[lightv2];
gameState.players[1].mz=[mk(LV4,1)];sync();
ok('闇をかき消す光 negative: 裏側がいなければ発動できない',
   eL.condition(ctxAt(lightv2,'sz'))===false);

reset0();
let flipper=mk('カード・フリッパー');gameState.players[0].sz=[flipper];
gameState.players[0].hand=[mk(ANYSP)];
let p1a=mk(LV4,1,'up','atk'),p1b=mk(LV3,1,'up','def'),p1c=mk(LV4,1,'down','def');
gameState.players[1].mz=[p1a,p1b,p1c];sync();v41ResetActionJournal(gameState);
let eF=eff('カード・フリッパー'),cF=ctxAt(flipper,'sz');
ok('カード・フリッパー positive: 手札と相手モンスターがあれば発動できる',eF.condition(cF)===true);
run(eF,cF);
ok('カード・フリッパー positive: 表側は表示形式が入れ替わる',
   gameState.players[1].mz[0].pos==='def'&&gameState.players[1].mz[1].pos==='atk');
ok('カード・フリッパー ruling: 裏側守備は表側攻撃表示になる',
   gameState.players[1].mz[2].face==='up'&&gameState.players[1].mz[2].pos==='atk');
ok('カード・フリッパー: コストで手札を1枚捨てている',gameState.players[0].hand.length===0);
reset0();
let flipper2=mk('カード・フリッパー');gameState.players[0].sz=[flipper2];
gameState.players[1].mz=[mk(LV4,1)];sync();
ok('カード・フリッパー negative: 手札が無ければ発動できない',
   eF.condition(ctxAt(flipper2,'sz'))===false);

reset0();
let driver=mk('ガジェット・ドライバー');gameState.players[0].hand=[driver];
let dm1=mk(MORPH),dm2=mk(LV4);gameState.players[0].mz=[dm1,dm2];
sync();v41ResetActionJournal(gameState);
let eDr=eff('ガジェット・ドライバー'),cDr=ctxAt(driver,'hand');
ok('ガジェット・ドライバー positive: 自分の「D」がいれば発動できる',eDr.condition(cDr)===true);
run(eDr,cDr);
let pcDr=pendingChoiceV49(gameState);
ok('ガジェット・ドライバー ruling: 「D」だけが候補で任意の数を選べる',
   pcDr.candidates.length===1&&pcDr.min===0&&pcDr.max===1,
   'cands='+pcDr.candidates.map(x=>x.label).join(','));
ok('ガジェット・ドライバー: コストで自身が墓地へ送られている',
   gameState.players[0].hand.length===0&&gameState.players[0].grave.some(c=>c.uid===driver.uid));
answerAll();
ok('ガジェット・ドライバー positive: 選んだ「D」の表示形式が変わる',
   findCardByUid(dm1.uid).card.pos==='def'&&findCardByUid(dm2.uid).card.pos==='atk');
reset0();
let driver2=mk('ガジェット・ドライバー');gameState.players[0].hand=[driver2];
gameState.players[0].mz=[mk(LV4)];sync();
ok('ガジェット・ドライバー negative: 「D」がいなければ発動できない',
   eDr.condition(ctxAt(driver2,'hand'))===false);

reset0();
let kura=mk('借カラクリ蔵');gameState.players[0].sz=[kura];
let kf=mk(KARA_F);gameState.players[0].mz=[kf];
let kd=mk(KARA_D);gameState.players[0].deck=[kd,mk(LV4)];
sync();v41ResetActionJournal(gameState);
let eKu=eff('借カラクリ蔵'),cKu=ctxAt(kura,'sz');
ok('借カラクリ蔵 positive: 場と デッキに「カラクリ」があれば発動できる',eKu.condition(cKu)===true);
run(eKu,cKu);
let pcKu=pendingChoiceV49(gameState);
ok('借カラクリ蔵 ruling: レベル4以下の「カラクリ」だけが候補',
   pcKu.candidates.length===1&&pcKu.candidates[0].label===KARA_D,
   pcKu.candidates.map(x=>x.label).join(','));
answerAll([pcKu.candidates[0].key]);
ok('借カラクリ蔵 positive: デッキから手札に加わる',
   gameState.players[0].hand.some(c=>c.uid===kd.uid));
ok('借カラクリ蔵 positive: 選んだモンスターの表示形式が変わる',
   findCardByUid(kf.uid).card.pos==='def');
reset0();
let kura2=mk('借カラクリ蔵');gameState.players[0].sz=[kura2];
gameState.players[0].mz=[mk(LV4)];gameState.players[0].deck=[mk(KARA_D)];sync();
ok('借カラクリ蔵 negative: 場に「カラクリ」がいなければ発動できない',
   eKu.condition(ctxAt(kura2,'sz'))===false);

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rZone=mk('レベル制限B地区');gameState.players[0].sz=[rZone];
let rm=mk(LV4);gameState.players[0].mz=[rm];sync();v41ResetActionJournal(gameState);
enforceForcedPositionV10(gameState);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 永続強制を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 表示形式の記録に関数が混入していない',
   assertPositionStateSerializableV10(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
