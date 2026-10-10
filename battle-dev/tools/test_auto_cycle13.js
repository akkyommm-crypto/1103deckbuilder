/* Auto cycle 13 — 23枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'end'});
  c.battle=battle;c.step=step||'end';return c;}
function battleAt(ai,ti,step){
  const a=gameState.players[0].mz[ai],d=(ti==='direct')?null:gameState.players[1].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:0,atkIdx:ai,target:(ti==='direct')?'direct':ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};}
function pending(){return pendingChoiceV49(gameState);}
/* S03-U62: some cards now open a real (SaveLoad-safe) API.requestChoice pending choice instead of the
   old synchronous API.selectCard closure the reset0() stub above intercepts. Auto-answer any such pending
   choice by always picking the first candidate (matches the stub's own semantics). */
function drain0(){for(let i=0;i<10&&pending();i++)__choicePickV49(0);}
function battleKill(card,foe){
  card.battleDestroyed=true; act({type:'BATTLE_CLEANUP'});
  return {defCard:card,atkCard:foe,destroyedDef:true,destroyedAtk:false,step:'leave'};
}
/* 召喚・リバースイベントの ctx。onFlip は evt.card、onNormalSummon は evt.uids。 */
function flipCtx(p,card){ return ctxEv(p,card,'onFlip',{player:p,card:card,flipSummon:true},'mz'); }
function summonCtx(p,card){ ensureCardUid(gameState,card);
  return ctxEv(p,card,'onNormalSummon',{player:p,uids:[card.uid]},'mz'); }
function endCtx(p,card){ gameState.phase='end';
  return ctxEv(p,card,'onEndPhase',{player:p,turn:gameState.turn},'mz'); }
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 DEF2500 */

const SPIRITS=['夜叉','月読命','砂塵の悪霊','鳳凰','竜宮之姫','磨破羅魏','伊弉波','金華猫','氷結界の神精霊'];
const OTHERS=['暗黒のミミック LV1','電磁ミノ虫','ワーム・ルクイエ','7つの武器を持つハンター',
 'ヴァイロン・オーム','封魔の伝承者','アルカナフォースI－THE MAGICIAN','アルカナフォースVII－THE CHARIOT',
 'ネフティスの鳳凰神','ダークブレイズドラゴン','スパイダー・スパイダー','ブレイン・クラッシャー',
 'アギド','サイボーグドクター'];
const ALL=SPIRITS.concat(OTHERS);
ALL.forEach(n=>ok('cycle13 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle13 枚数は23',ALL.length===23);
/* S03-U266: a one-sided turn Set ban now exists (temporaryFlags.noSetS03 in SET_MONSTER / SET_ST); TESTED in tools/test_s03_u266_unlocks2.js */
ok('cycle13 SKIP lifted (S03-U266): サーチライトメン is scripted',!!CARD_SCRIPTS['サーチライトメン']);
/* リバース記録が無いため落とした残りのスピリット */
['大和神']
  .forEach(n=>ok('cycle13 SKIP: '+n+' は未実装（リバースしたターンの記録が engine に無い）',!CARD_SCRIPTS[n]));
/* S03-U266: 因幡之白兎 / 阿修羅 implemented on the S03-U244 record (and engine/1ZU / 1ZQ); the old SKIP checks become these (count unchanged). */
['因幡之白兎','阿修羅']
  .forEach(n=>ok('cycle13 S03-U266 implemented: '+n,!!CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].cannotSpecialSummon===true));
/* S03-U244: engine/19 が「リバースしたターン」(card.flippedTurnS03) を記録するようになり、7枚は S03-U244 で実装・テスト済み
   （tools/test_s03_u244_spirits.js）。当時この理由で落とした記録として名前を残し、実装された事を確認する。 */
['不死之炎鳥','偉大天狗','八俣大蛇','八汰烏','火之迦具土','軍荼利','雷帝神']
  .forEach(n=>ok('cycle13 S03-U244 implemented: '+n+'（リバースしたターンの記録 flippedTurnS03）',!!CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].cannotSpecialSummon===true));
ok('cycle13 SKIP: リチュア・エミリアは未実装（「リチュア」の authority が無い）',
   !CARD_SCRIPTS['リチュア・エミリア']);

/* ============ スピリット共通の骨格 ============ */
reset0();
SPIRITS.forEach(n=>ok('スピリット '+n+' は特殊召喚できない宣言を持つ',
  CARD_SCRIPTS[n].cannotSpecialSummon===true));
/* 通常召喚 → そのターンのエンドフェイズに手札へ戻る */
reset0();
let ys=mk('夜叉',0);
gameState.players[0].mz=[ys];ys.summonedTurn=gameState.turn;
let cys=endCtx(0,ys);
ok('夜叉 positive: 召喚したターンのエンドフェイズに帰還が誘発する',
   sc('夜叉').passive.onEndPhase(cys)===true);
sc('夜叉').resolve(cys);
ok('夜叉 positive: 持ち主の手札に戻る',
   gameState.players[0].hand.some(c=>dbOf(c).n==='夜叉')&&gameState.players[0].mz.length===0,
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let ys2=mk('夜叉',0);
gameState.players[0].mz=[ys2];ys2.summonedTurn=gameState.turn-1;
ok('夜叉 negative: 召喚したターンでなければ帰還しない',
   sc('夜叉').passive.onEndPhase(endCtx(0,ys2))===false);
/* リバースした場合：engine は記録しないので、トリガーの resolve が印を付ける */
reset0();
let ys3=mk('夜叉',0,'down','def');
gameState.players[0].mz=[ys3];ys3.summonedTurn=gameState.turn-3;
ys3.face='up';ys3.pos='atk';
let fys=flipCtx(0,ys3);
ok('夜叉 positive: リバースでも召喚時トリガーが誘発する',sc('夜叉').passive.onFlip(fys)===true);
sc('夜叉').selectTargets(fys,t=>{fys.selectedTargets=t;});
sc('夜叉').resolve(fys);
ok('夜叉 ruling: リバースしたターンが記録される',Number(ys3.c2SpiritTurn)===gameState.turn);
ok('夜叉 ruling: 記録があればそのターンのエンドフェイズに帰還する',
   sc('夜叉').passive.onEndPhase(endCtx(0,ys3))===true);
/* 夜叉の固有効果 */
reset0();
let ys4=mk('夜叉',0),foeST=mk('落とし穴',1,'down');
gameState.players[0].mz=[ys4];gameState.players[1].sz=[foeST];
let fys4=summonCtx(0,ys4);
sc('夜叉').selectTargets(fys4,t=>{fys4.selectedTargets=t;});
sc('夜叉').resolve(fys4);
ok('夜叉 positive: 相手の魔法・罠1枚が持ち主の手札に戻る',
   gameState.players[1].sz.length===0&&gameState.players[1].hand.length===1,
   'sz='+gameState.players[1].sz.length+' hand='+gameState.players[1].hand.length);

/* ============ 月読命 ============ */
reset0();
let tk=mk('月読命',0),tgt=mk(BIG,1);
gameState.players[0].mz=[tk];gameState.players[1].mz=[tgt];
let ctk=summonCtx(0,tk);
ok('月読命 positive: 召喚成功時に誘発する',sc('月読命').passive.onNormalSummon(ctk)===true);
API.selectCard=(t,list,cb)=>cb(list.find(x=>x.card===tgt)||list[0]);
sc('月読命').selectTargets(ctk,t=>{ctk.selectedTargets=t;});
sc('月読命').resolve(ctk);
API.selectCard=(t,list,cb)=>cb(list[0]);
ok('月読命 positive: 対象が裏側守備表示になる',
   tgt.face==='down'&&tgt.pos==='def','face='+tgt.face+' pos='+tgt.pos);

/* ============ 砂塵の悪霊 ============ */
reset0();
let sj=mk('砂塵の悪霊',0),m1=mk(PLAIN,0),m2=mk(BIG,1),m3=mk(PLAIN,1,'down','def');
gameState.players[0].mz=[sj,m1];gameState.players[1].mz=[m2,m3];
let csj=summonCtx(0,sj);
ok('砂塵の悪霊 positive: 召喚成功時に誘発する',sc('砂塵の悪霊').passive.onNormalSummon(csj)===true);
sc('砂塵の悪霊').resolve(csj);
ok('砂塵の悪霊 positive: 自身以外の表側表示モンスターを全て破壊する',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0]===sj,
   'p0='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('砂塵の悪霊 ruling: 裏側表示のモンスターは破壊されない',
   gameState.players[1].mz.length===1&&gameState.players[1].mz[0]===m3,
   'p1='+gameState.players[1].mz.length);

/* ============ 鳳凰 ============ */
reset0();
let ho=mk('鳳凰',0),setST=mk('落とし穴',1,'down'),upST=mk('落とし穴',1,'up'),myST=mk('落とし穴',0,'down');
gameState.players[0].mz=[ho];gameState.players[0].sz=[myST];
gameState.players[1].sz=[setST,upST];
let cho=summonCtx(0,ho);
sc('鳳凰').resolve(cho);
ok('鳳凰 positive: 相手のセットされた魔法・罠を破壊する',
   gameState.players[1].sz.length===1&&gameState.players[1].sz[0]===upST,
   'p1sz='+gameState.players[1].sz.length);
ok('鳳凰 ruling: 表側の魔法・罠と自分のカードは破壊しない',
   gameState.players[0].sz.length===1);

/* ============ 竜宮之姫 ============ */
reset0();
let rg=mk('竜宮之姫',0),rt=mk(BIG,1,'up','atk');
gameState.players[0].mz=[rg];gameState.players[1].mz=[rt];
let crg=summonCtx(0,rg);
sc('竜宮之姫').selectTargets(crg,t=>{crg.selectedTargets=t;});
sc('竜宮之姫').resolve(crg);
ok('竜宮之姫 positive: 相手の表側モンスターの表示形式が変わる',rt.pos==='def','pos='+rt.pos);
reset0();
let rg2=mk('竜宮之姫',0),rt2=mk(BIG,1,'down','def');
gameState.players[0].mz=[rg2];gameState.players[1].mz=[rt2];
let crg2=summonCtx(0,rg2);
sc('竜宮之姫').selectTargets(crg2,t=>{crg2.selectedTargets=t;});
sc('竜宮之姫').resolve(crg2);
ok('竜宮之姫 negative: 裏側表示は対象に選べない（表示形式は変わらない）',
   rt2.face==='down'&&rt2.pos==='def');

/* ============ 磨破羅魏 ============ */
reset0();
let mh=mk('磨破羅魏',0);
gameState.players[0].mz=[mh];
gameState.players[0].deck=[mk(BIG,0),mk(PLAIN,0),mk(PLAIN,0)];
let cmh=summonCtx(0,mh);
sc('磨破羅魏').resolve(cmh);
ok('磨破羅魏 positive: 次の自分のドローフェイズに予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c2.maharagi'&&s.at==='drawPhase'));
let mhSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c2.maharagi');
scheduleHandlerV7('c2.maharagi')(mhSch.args||{}, mhSch);
let pmh=pending();
ok('磨破羅魏 ruling: 確認するのはデッキの持ち主だけ',!!pmh&&pmh.player===0);
let topBefore=dbOf(gameState.players[0].deck[0]).n;
answerChoiceV49([pmh.candidates.find(x=>x.key==='bottom').key]);
ok('磨破羅魏 positive: 一番下に戻すと一番上が入れ替わる',
   dbOf(gameState.players[0].deck[0]).n!==topBefore
   &&dbOf(gameState.players[0].deck[gameState.players[0].deck.length-1]).n===topBefore,
   'top='+dbOf(gameState.players[0].deck[0]).n);

/* ============ 伊弉波 ============ */
reset0();
let iz=mk('伊弉波',0);
gameState.players[0].mz=[iz];
gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[0].grave=[mk('八汰烏',0)];      /* スピリット */
let ciz=summonCtx(0,iz);
ok('伊弉波 positive: 召喚成功時に誘発する',sc('伊弉波').passive.onNormalSummon(ciz)===true);
sc('伊弉波').selectTargets(ciz,t=>{ciz.selectedTargets=t;});
sc('伊弉波').resolve(ciz);
ok('伊弉波 positive: 手札を1枚捨てて墓地のスピリットを手札に加える',
   gameState.players[0].hand.length===1&&dbOf(gameState.players[0].hand[0]).n==='八汰烏',
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let iz2=mk('伊弉波',0);
gameState.players[0].mz=[iz2];
gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[0].grave=[mk(BIG,0)];          /* スピリットではない */
let ciz2=summonCtx(0,iz2);
sc('伊弉波').selectTargets(ciz2,t=>{ciz2.selectedTargets=t;});
sc('伊弉波').resolve(ciz2);
ok('伊弉波 negative: 墓地にスピリットがいなければ何も起きない',
   gameState.players[0].hand.length===1&&dbOf(gameState.players[0].hand[0]).n!=='青眼の白龍',
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));

/* ============ 金華猫 ============ */
reset0();
let kk=mk('金華猫',0),lv1=mk(PLAIN,0);      /* ワイト = レベル1 */
gameState.players[0].mz=[kk];gameState.players[0].grave=[lv1];
let ckk=summonCtx(0,kk);
ok('金華猫 positive: 召喚成功時に誘発する',sc('金華猫').passive.onNormalSummon(ckk)===true);
sc('金華猫').selectTargets(ckk,t=>{ckk.selectedTargets=t;});
sc('金華猫').resolve(ckk);
ok('金華猫 positive: 墓地のレベル1モンスターが特殊召喚される',
   gameState.players[0].mz.some(c=>c===lv1),'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('金華猫 ruling: 特殊召喚したモンスターに生存リンクが張られる',
   !!lv1.linkV9&&Array.isArray(lv1.linkV9.watch)&&lv1.linkV9.watch.some(w=>w.onGone==='banish'),
   'link='+JSON.stringify(lv1.linkV9||null));
API.sendToGrave(h(kk),'テスト：金華猫が場を離れる');
ok('金華猫 ruling: 金華猫が離れると特殊召喚したモンスターは除外される',
   gameState.players[0].banish.some(c=>c===lv1),
   'banish='+gameState.players[0].banish.length+' mz='+gameState.players[0].mz.length);
reset0();
let kk2=mk('金華猫',0);
gameState.players[0].mz=[kk2];gameState.players[0].grave=[mk(BIG,0)];   /* レベル8 */
let ckk2=summonCtx(0,kk2);
sc('金華猫').selectTargets(ckk2,t=>{ckk2.selectedTargets=t;});
sc('金華猫').resolve(ckk2);
ok('金華猫 negative: レベル1以外は特殊召喚できない',gameState.players[0].mz.length===1);

/* ============ 氷結界の神精霊 ============ */
reset0();
let hs=mk('氷結界の神精霊',0),ib=mk('氷結界の武士',0),foeM=mk(BIG,1);
gameState.players[0].mz=[hs,ib];gameState.players[1].mz=[foeM];
hs.summonedTurn=gameState.turn;
let chs=endCtx(0,hs);
ok('氷結界の神精霊 positive: エンドフェイズに誘発する',
   sc('氷結界の神精霊').passive.onEndPhase(chs)===true);
sc('氷結界の神精霊').resolve(chs);
ok('氷結界の神精霊 positive: 他の「氷結界」がいる場合は相手モンスターを手札に戻す',
   gameState.players[1].mz.length===0&&gameState.players[0].mz.some(c=>c===hs),
   'p1mz='+gameState.players[1].mz.length+' p0mz='+gameState.players[0].mz.length);
reset0();
let hs2=mk('氷結界の神精霊',0),foeM2=mk(BIG,1);
gameState.players[0].mz=[hs2];gameState.players[1].mz=[foeM2];
hs2.summonedTurn=gameState.turn;
let chs2=endCtx(0,hs2);
sc('氷結界の神精霊').resolve(chs2);
ok('氷結界の神精霊 negative: 他の「氷結界」がいなければ自身が手札に戻る',
   gameState.players[0].mz.length===0&&gameState.players[1].mz.length===1
   &&gameState.players[0].hand.some(c=>dbOf(c).n==='氷結界の神精霊'),
   'p0mz='+gameState.players[0].mz.length+' hand='+gameState.players[0].hand.length);

/* ============ 暗黒のミミック LV1 ============ */
reset0();
let mm=mk('暗黒のミミック LV1',0);
gameState.players[0].mz=[mm];gameState.players[0].deck=[mk(PLAIN,0)];
let cmm=flipCtx(0,mm);
ok('暗黒のミミック LV1 positive: リバースでドローが誘発する',
   sc('暗黒のミミック LV1').passive.onFlip(cmm)===true);
sc('暗黒のミミック LV1').resolve(cmm);
ok('暗黒のミミック LV1 positive: 1枚ドローする',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===0);
reset0();
let mm2=mk('暗黒のミミック LV1',0);
gameState.players[0].mz=[mm2];gameState.players[0].deck=[mk('暗黒のミミック LV3',0)];
gameState.phase='standby';gameState.activePlayer=0;
let cmm2=ctxEv(0,mm2,'onStandbyPhase',{},'mz');
ok('暗黒のミミック LV1 positive: 自分のスタンバイでレベルアップが誘発する',
   sc('暗黒のミミック LV1').passive.onStandbyPhase(cmm2)===true);
sc('暗黒のミミック LV1').resolve(cmm2);
ok('暗黒のミミック LV1 positive: 自身を墓地へ送り LV3 が特殊召喚される',
   gameState.players[0].mz.length===1&&dbOf(gameState.players[0].mz[0]).n==='暗黒のミミック LV3'
   &&gameState.players[0].grave.some(c=>dbOf(c).n==='暗黒のミミック LV1'));
reset0();
let mm3=mk('暗黒のミミック LV1',0);
gameState.players[0].mz=[mm3];gameState.players[0].deck=[mk(PLAIN,0)];
gameState.phase='standby';gameState.activePlayer=0;
ok('暗黒のミミック LV1 negative: LV3 が無ければスタンバイでは発動できない',
   sc('暗黒のミミック LV1').passive.onStandbyPhase(ctxEv(0,mm3,'onStandbyPhase',{},'mz'))===false);

/* ============ 電磁ミノ虫 ============ */
reset0();
let dm=mk('電磁ミノ虫',0),mach=mk('ジェネクス・コントローラー',1);  /* 機械族 */
gameState.players[0].mz=[dm];gameState.players[1].mz=[mach];
let cdm=flipCtx(0,dm);
ok('電磁ミノ虫 positive: リバースで誘発する（相手に機械族がいる）',
   sc('電磁ミノ虫').passive.onFlip(cdm)===true);
sc('電磁ミノ虫').selectTargets(cdm,t=>{cdm.selectedTargets=t;});
sc('電磁ミノ虫').resolve(cdm);
ok('電磁ミノ虫 positive: 機械族のコントロールを得る',
   gameState.players[0].mz.some(c=>c===mach),'p0mz='+gameState.players[0].mz.length);
ok('電磁ミノ虫 ruling: 返却がエンドフェイズに予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c2.minomushi'&&s.at==='endPhase'));
let dmSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c2.minomushi');
scheduleHandlerV7('c2.minomushi')(dmSch.args||{}, dmSch);
ok('電磁ミノ虫 ruling: 予約が解決すると相手に戻る',
   gameState.players[1].mz.some(c=>c===mach),'p1mz='+gameState.players[1].mz.length);
reset0();
let dm2=mk('電磁ミノ虫',0),nonMach=mk(BIG,1);
gameState.players[0].mz=[dm2];gameState.players[1].mz=[nonMach];
ok('電磁ミノ虫 negative: 相手に機械族がいなければリバース効果は発動できない',
   sc('電磁ミノ虫').passive.onFlip(flipCtx(0,dm2))===false);
reset0();
let dm3=mk('電磁ミノ虫',0),killer=mk(BIG,1);
gameState.players[0].mz=[dm3];gameState.players[1].mz=[killer];
let bdm=battleKill(dm3,killer);
let cdm3=ctxDS(0,dm3,bdm,'grave','leave');
ok('電磁ミノ虫 positive: 戦闘破壊された場合にも誘発する',
   sc('電磁ミノ虫').passive.onDamageStep(cdm3)===true);
sc('電磁ミノ虫').resolve(cdm3);
ok('電磁ミノ虫 positive: 破壊したモンスターの攻守が500ダウンする',
   curATK(killer)===3000-500&&curDEF(killer)===2500-500,
   'atk='+curATK(killer)+' def='+curDEF(killer));

/* ============ ワーム・ルクイエ ============ */
reset0();
let wl=mk('ワーム・ルクイエ',0);
gameState.players[0].mz=[wl];ensureCardUid(gameState,wl);
ok('ワーム・ルクイエ negative: リバースしたターンでなければ攻撃宣言できない',
   cannotAttackNow(wl)===true);
let cwl=flipCtx(0,wl);
sc('ワーム・ルクイエ').resolve(cwl);
ok('ワーム・ルクイエ positive: リバースしたターンは攻撃できる',cannotAttackNow(wl)===false);
gameState.phase='battle';
gameState.battlePhaseV6={attacks:[{attackerUid:wl.uid,defenderUid:null,player:0}]};
let cwl2=ctxEv(0,wl,'onBattlePhaseEnd',{player:0,turn:gameState.turn},'mz');
ok('ワーム・ルクイエ positive: 攻撃したバトルフェイズ終了時に誘発する',
   sc('ワーム・ルクイエ').passive.onBattlePhaseEnd(cwl2)===true);
sc('ワーム・ルクイエ').resolve(cwl2);
ok('ワーム・ルクイエ positive: 裏側守備表示になる',
   wl.face==='down'&&wl.pos==='def','face='+wl.face+' pos='+wl.pos);
/* 裏側になった後は engine 側で攻撃自体ができないので、
   「リバースしたターンでなければ攻撃できない」宣言は表側の状態で確かめる。 */
reset0();
let wl2=mk('ワーム・ルクイエ',0);
gameState.players[0].mz=[wl2];ensureCardUid(gameState,wl2);
wl2.c2LuqiaeTurn=gameState.turn-1;
ok('ワーム・ルクイエ ruling: 前のターンにリバースしただけでは攻撃宣言できない',
   cannotAttackNow(wl2)===true);
wl2.c2LuqiaeTurn=gameState.turn;
ok('ワーム・ルクイエ ruling: 同じターンにリバースしていれば攻撃できる',
   cannotAttackNow(wl2)===false);

/* ============ 7つの武器を持つハンター ============ */
reset0();
let hn=mk('7つの武器を持つハンター',0),drg=mk(BIG,1);
gameState.players[0].mz=[hn];gameState.players[1].mz=[drg];
let chn=summonCtx(0,hn);
ok('7つの武器を持つハンター positive: 召喚成功時に誘発する',
   sc('7つの武器を持つハンター').passive.onNormalSummon(chn)===true);
sc('7つの武器を持つハンター').resolve(chn);
let phn=pending();
ok('7つの武器を持つハンター ruling: 種族を1つ宣言する',!!phn&&phn.min===1&&phn.max===1);
answerChoiceV49([phn.candidates.find(x=>x.key==='ドラゴン').key]);
ok('7つの武器を持つハンター positive: 宣言した種族が記録される',hn.c2HunterRace==='ドラゴン');
battleAt(0,0,'calc');
ok('7つの武器を持つハンター positive: 宣言種族との戦闘のダメージ計算時のみ攻撃力1000アップ',
   curATK(hn)===1000+1000,'atk='+curATK(hn));
gameState.battle.step='start';
ok('7つの武器を持つハンター ruling: ダメージ計算時以外は上がらない',
   curATK(hn)===1000,'atk='+curATK(hn));
reset0();
let hn2=mk('7つの武器を持つハンター',0),notDrg=mk(PLAIN,1);
gameState.players[0].mz=[hn2];gameState.players[1].mz=[notDrg];
hn2.c2HunterRace='ドラゴン';
battleAt(0,0,'calc');
ok('7つの武器を持つハンター negative: 宣言していない種族には上がらない',
   curATK(hn2)===1000,'atk='+curATK(hn2));

/* ============ ヴァイロン・オーム ============ */
reset0();
let vo=mk('ヴァイロン・オーム',0),eq=mk('デーモンの斧',0);
gameState.players[0].mz=[vo];gameState.players[0].grave=[eq];
let cvo=summonCtx(0,vo);
ok('ヴァイロン・オーム positive: 墓地に装備魔法があれば誘発する',
   sc('ヴァイロン・オーム').passive.onNormalSummon(cvo)===true);
sc('ヴァイロン・オーム').selectTargets(cvo,t=>{cvo.selectedTargets=t;});
sc('ヴァイロン・オーム').resolve(cvo);
ok('ヴァイロン・オーム positive: 装備魔法が除外される',
   gameState.players[0].banish.some(c=>c===eq),'banish='+gameState.players[0].banish.length);
ok('ヴァイロン・オーム ruling: 次の自分のスタンバイに回収が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c2.vylonOhm'&&s.at==='standbyPhase'));
let voSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c2.vylonOhm');
scheduleHandlerV7('c2.vylonOhm')(voSch.args||{}, voSch);
ok('ヴァイロン・オーム positive: 予約が解決すると手札に加わる',
   gameState.players[0].hand.some(c=>c===eq),'hand='+gameState.players[0].hand.length);
reset0();
let vo2=mk('ヴァイロン・オーム',0);
gameState.players[0].mz=[vo2];gameState.players[0].grave=[mk(BIG,0)];
ok('ヴァイロン・オーム negative: 墓地に装備魔法が無ければ発動できない',
   sc('ヴァイロン・オーム').passive.onNormalSummon(summonCtx(0,vo2))===false);

/* ============ 封魔の伝承者 ============ */
reset0();
let fd=mk('封魔の伝承者',0),lightFoe=mk(BIG,1);   /* 青眼＝光属性 */
gameState.players[0].mz=[fd];gameState.players[1].mz=[lightFoe];
gameState.players[0].grave=[mk('封魔の伝承者',0)];
let cfd=summonCtx(0,fd);
ok('封魔の伝承者 positive: 墓地の同名の数だけ宣言できる',
   sc('封魔の伝承者').passive.onNormalSummon(cfd)===true);
sc('封魔の伝承者').resolve(cfd);
let pfd=pending();
ok('封魔の伝承者 ruling: 宣言数は墓地の同名の数（1体なら1つ）',!!pfd&&pfd.min===1&&pfd.max===1);
answerChoiceV49([pfd.candidates.find(x=>x.key==='光').key]);
ok('封魔の伝承者 positive: 宣言した属性が記録される',fd.c2DenshoAttrs==='光');
battleAt(0,0,'start');
let cfd2=ctxDS(0,fd,{atkCard:fd,defCard:lightFoe,step:'start'},'mz','start');
ok('封魔の伝承者 positive: 宣言属性への攻撃で誘発する',
   sc('封魔の伝承者').passive.onDamageStep(cfd2)===true);
sc('封魔の伝承者').resolve(cfd2);
ok('封魔の伝承者 positive: ダメージ計算を行わず破壊する',gameState.players[1].mz.length===0);
reset0();
let fd3=mk('封魔の伝承者',0),darkFoe=mk(PLAIN,1);  /* ワイト＝闇属性 */
gameState.players[0].mz=[fd3];gameState.players[1].mz=[darkFoe];
fd3.c2DenshoAttrs='光';
battleAt(0,0,'start');
ok('封魔の伝承者 negative: 宣言していない属性には適用されない',
   sc('封魔の伝承者').passive.onDamageStep(
     ctxDS(0,fd3,{atkCard:fd3,defCard:darkFoe,step:'start'},'mz','start'))===false);
reset0();
let fd4=mk('封魔の伝承者',0);
gameState.players[0].mz=[fd4];gameState.players[0].grave=[];
ok('封魔の伝承者 negative: 墓地に同名がいなければ宣言できない',
   sc('封魔の伝承者').passive.onNormalSummon(summonCtx(0,fd4))===false);

/* ============ アルカナフォースI－THE MAGICIAN ============ */
reset0();
let am=mk('アルカナフォースI－THE MAGICIAN',0);
gameState.players[0].mz=[am];
let cam=summonCtx(0,am);
ok('アルカナフォースI positive: 召喚成功時にコイントスが誘発する',
   sc('アルカナフォースI－THE MAGICIAN').passive.onNormalSummon(cam)===true);
let rngBefore=gameState.rngState;
sc('アルカナフォースI－THE MAGICIAN').resolve(cam);
ok('アルカナフォースI positive: コイントスは replay 安全な duelRandomInt を使う',
   gameState.rngState!==rngBefore);
ok('アルカナフォースI positive: 表か裏が記録される',
   am.c2ArcanaCoin==='heads'||am.c2ArcanaCoin==='tails','coin='+am.c2ArcanaCoin);
/* 表・裏それぞれの挙動を決め打ちで確認する */
am.c2ArcanaCoin='heads';
let cam2=ctxEv(0,am,'onActivateSuccess',{player:1,kind:'spell'},'mz');
ok('アルカナフォースI positive: 表なら魔法発動時に誘発する',
   sc('アルカナフォースI－THE MAGICIAN').passive.onActivateSuccess(cam2)===true);
sc('アルカナフォースI－THE MAGICIAN').resolve(cam2);
ok('アルカナフォースI positive: 表なら元々の攻撃力の分だけ攻撃力が上がる（＝倍）',
   curATK(am)===1100*2,'atk='+curATK(am));
reset0();
let am3=mk('アルカナフォースI－THE MAGICIAN',0);
gameState.players[0].mz=[am3];am3.c2ArcanaCoin='tails';
let lpFoe=gameState.players[1].lp;
sc('アルカナフォースI－THE MAGICIAN').resolve(ctxEv(0,am3,'onActivateSuccess',{player:0,kind:'spell'},'mz'));
ok('アルカナフォースI positive: 裏なら相手が500ライフ回復する',
   gameState.players[1].lp===lpFoe+500,'lp='+gameState.players[1].lp);
reset0();
let am4=mk('アルカナフォースI－THE MAGICIAN',0);
gameState.players[0].mz=[am4];am4.c2ArcanaCoin='heads';
ok('アルカナフォースI negative: 罠の発動では誘発しない',
   sc('アルカナフォースI－THE MAGICIAN').passive.onActivateSuccess(
     ctxEv(0,am4,'onActivateSuccess',{player:1,kind:'trap'},'mz'))===false);

/* ============ アルカナフォースVII－THE CHARIOT ============ */
reset0();
let ac=mk('アルカナフォースVII－THE CHARIOT',0);
gameState.players[0].mz=[ac];
sc('アルカナフォースVII－THE CHARIOT').resolve(summonCtx(0,ac));
ok('アルカナフォースVII positive: コイントスの結果が記録される',
   ac.c2ArcanaCoin==='heads'||ac.c2ArcanaCoin==='tails');
ok('アルカナフォースVII ruling: 裏ならコントロールが相手に移り、表なら移らない',
   (ac.c2ArcanaCoin==='tails')===gameState.players[1].mz.some(c=>c===ac),
   'coin='+ac.c2ArcanaCoin+' p1mz='+gameState.players[1].mz.length);
reset0();
let ac2=mk('アルカナフォースVII－THE CHARIOT',0),victim=mk(PLAIN,1);
gameState.players[0].mz=[ac2];gameState.players[1].mz=[victim];
ac2.c2ArcanaCoin='heads';
victim.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cac=ctxDS(0,ac2,{atkCard:ac2,defCard:victim,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('アルカナフォースVII positive: 表なら戦闘破壊したモンスターで誘発する',
   sc('アルカナフォースVII－THE CHARIOT').passive.onDamageStep(cac)===true);
sc('アルカナフォースVII－THE CHARIOT').resolve(cac);
ok('アルカナフォースVII positive: 破壊したモンスターを自分フィールドに特殊召喚する',
   gameState.players[0].mz.some(c=>c===victim),'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let ac3=mk('アルカナフォースVII－THE CHARIOT',0),victim3=mk(PLAIN,1);
gameState.players[0].mz=[ac3];gameState.players[1].mz=[victim3];
ac3.c2ArcanaCoin='tails';
victim3.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('アルカナフォースVII negative: 裏なら戦闘破壊しても特殊召喚できない',
   sc('アルカナフォースVII－THE CHARIOT').passive.onDamageStep(
     ctxDS(0,ac3,{atkCard:ac3,defCard:victim3,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ ネフティスの鳳凰神 ============ */
reset0();
let nf=mk('ネフティスの鳳凰神',0);
gameState.players[0].mz=[nf];
API.destroy(h(nf),'テスト効果破壊',1);
let cnf=ctxEv(0,nf,'onDestroy',{},'grave');
ok('ネフティスの鳳凰神 positive: 効果破壊で誘発する',
   sc('ネフティスの鳳凰神').passive.onDestroy(cnf)===true);
sc('ネフティスの鳳凰神').resolve(cnf);
ok('ネフティスの鳳凰神 positive: 次の自分スタンバイに蘇生が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c2.nephthys'));
let nfSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c2.nephthys');
gameState.players[0].sz=[mk('落とし穴',0,'down')];
gameState.players[1].sz=[mk('落とし穴',1,'down')];
scheduleHandlerV7('c2.nephthys')(nfSch.args||{}, nfSch);
ok('ネフティスの鳳凰神 positive: 予約が解決すると墓地から特殊召喚される',
   gameState.players[0].mz.some(c=>c===nf));
let cnf2=ctxEv(0,nf,'onSpecialSummon',{},'mz');
ok('ネフティスの鳳凰神 positive: その特殊召喚成功時に破壊効果が誘発する',
   sc('ネフティスの鳳凰神').passive.onSpecialSummon(cnf2)===true);
sc('ネフティスの鳳凰神').resolve(cnf2);
ok('ネフティスの鳳凰神 positive: フィールドの魔法・罠を全て破壊する',
   gameState.players[0].sz.length===0&&gameState.players[1].sz.length===0,
   'p0sz='+gameState.players[0].sz.length+' p1sz='+gameState.players[1].sz.length);
ok('ネフティスの鳳凰神 ruling: 同じターンに二重発動しない',
   sc('ネフティスの鳳凰神').passive.onSpecialSummon(ctxEv(0,nf,'onSpecialSummon',{},'mz'))===false);
reset0();
let nf2=mk('ネフティスの鳳凰神',0),nfk=mk(BIG,1);
gameState.players[0].mz=[nf2];gameState.players[1].mz=[nfk];
let bnf=battleKill(nf2,nfk);
ok('ネフティスの鳳凰神 negative: 戦闘破壊では蘇生効果は発動しない',
   sc('ネフティスの鳳凰神').passive.onDestroy(ctxEv(0,nf2,'onDestroy',{},'grave'))===false);

/* ============ ダークブレイズドラゴン ============ */
reset0();
let db=mk('ダークブレイズドラゴン',0);
gameState.players[0].grave=[db];
ensureCardUid(gameState,db);
API.specialSummon(0,'grave',0,'atk','テスト蘇生',0);
let dbOn=gameState.players[0].mz[0];
let cdb=ctxEv(0,dbOn,'onSpecialSummon',{},'mz');
ok('ダークブレイズドラゴン positive: 墓地からの特殊召喚で誘発する',
   sc('ダークブレイズドラゴン').passive.onSpecialSummon(cdb)===true);
sc('ダークブレイズドラゴン').resolve(cdb);
ok('ダークブレイズドラゴン positive: 攻守が元々の数値の倍になる',
   curATK(dbOn)===1200*2&&curDEF(dbOn)===1000*2,
   'atk='+curATK(dbOn)+' def='+curDEF(dbOn));
reset0();
let db2=mk('ダークブレイズドラゴン',0),dv=mk(BIG,1);
gameState.players[0].mz=[db2];gameState.players[1].mz=[dv];
dv.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cdb2=ctxDS(0,db2,{atkCard:db2,defCard:dv,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ダークブレイズドラゴン positive: 戦闘破壊でも誘発する',
   sc('ダークブレイズドラゴン').passive.onDamageStep(cdb2)===true);
let lpD=gameState.players[1].lp;
sc('ダークブレイズドラゴン').resolve(cdb2);
ok('ダークブレイズドラゴン positive: 破壊したモンスターの元々の攻撃力分のダメージ',
   gameState.players[1].lp===lpD-3000,'lp='+gameState.players[1].lp);

/* ============ スパイダー・スパイダー ============ */
reset0();
let sp=mk('スパイダー・スパイダー',0),defFoe=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[sp];gameState.players[1].mz=[defFoe];
gameState.players[0].grave=[mk('電磁ミノ虫',0)];   /* 昆虫族 lv3 */
defFoe.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let csp=ctxDS(0,sp,{atkCard:sp,defCard:defFoe,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('スパイダー・スパイダー positive: 守備表示を戦闘破壊して誘発する',
   sc('スパイダー・スパイダー').passive.onDamageStep(csp)===true);
sc('スパイダー・スパイダー').selectTargets(csp,t=>{csp.selectedTargets=t;});
sc('スパイダー・スパイダー').resolve(csp);
ok('スパイダー・スパイダー positive: 墓地のレベル4以下の昆虫族が特殊召喚される',
   gameState.players[0].mz.some(c=>dbOf(c).ra==='昆虫'),
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let sp2=mk('スパイダー・スパイダー',0),atkFoe=mk(PLAIN,1,'up','atk');
gameState.players[0].mz=[sp2];gameState.players[1].mz=[atkFoe];
gameState.players[0].grave=[mk('電磁ミノ虫',0)];
atkFoe.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('スパイダー・スパイダー negative: 攻撃表示を破壊した場合は発動できない',
   sc('スパイダー・スパイダー').passive.onDamageStep(
     ctxDS(0,sp2,{atkCard:sp2,defCard:atkFoe,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ ブレイン・クラッシャー ============ */
reset0();
let bc=mk('ブレイン・クラッシャー',0),bv=mk(PLAIN,1);
gameState.players[0].mz=[bc];gameState.players[1].mz=[bv];
bv.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cbc=ctxDS(0,bc,{atkCard:bc,defCard:bv,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ブレイン・クラッシャー positive: 戦闘破壊して誘発する',
   sc('ブレイン・クラッシャー').passive.onDamageStep(cbc)===true);
sc('ブレイン・クラッシャー').resolve(cbc);
ok('ブレイン・クラッシャー positive: そのターンのエンドフェイズに蘇生が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c2.brainCrusher'&&s.at==='endPhase'));
let bcSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c2.brainCrusher');
scheduleHandlerV7('c2.brainCrusher')(bcSch.args||{}, bcSch);
ok('ブレイン・クラッシャー positive: 破壊したモンスターが自分フィールドに特殊召喚される',
   gameState.players[0].mz.some(c=>c===bv),'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('ブレイン・クラッシャー ruling: 1ターンに1度の宣言がある',sc('ブレイン・クラッシャー').countLimit===1);

/* ============ アギド ============ */
reset0();
let ag=mk('アギド',0),agk=mk(BIG,1);
gameState.players[0].mz=[ag];gameState.players[1].mz=[agk];
/* レベル1〜6の天使族を墓地に並べ、どの出目でも対象がある状態にする */
/* 出目1〜6のどれが出ても対象があるよう、レベル1〜6の天使族を並べる。
   スピリット（特殊召喚できない）は蘇生先にならないので入れない。 */
gameState.players[0].grave=['もけもけ','スケルエンジェル','きまぐれの女神',
  'アルカナフォースIII－THE EMPRESS','アイツ','キング・もけもけ'].map(n=>mk(n,0));
gameState.players[0].grave.forEach(c=>{ if(dbOf(c).n==='キング・もけもけ') c.properlySummonedS03=true; });   /* S03-U127: 融合召喚済みで墓地へ送られていた扱い */
let bag=battleKill(ag,agk);
let cag=ctxDS(0,ag,bag,'grave','leave');
ok('アギド positive: 戦闘破壊されて誘発する',sc('アギド').passive.onDamageStep(cag)===true);
let agRng=gameState.rngState;
sc('アギド').resolve(cag);drain0();
ok('アギド positive: サイコロは duelRandomInt を使う（rngState が進む）',
   gameState.rngState!==agRng);
let roll=Number(gameState.players[0].temporaryFlags.c2AgidoRoll);
ok('アギド ruling: 出目は1〜6',roll>=1&&roll<=6,'roll='+roll);
/* 出目は乱数なので、出目に応じた正しい結果かどうかを判定する */
let agSummoned=gameState.players[0].mz[0]||null;
ok('アギド positive: 出目と同じレベルの天使族が特殊召喚される（6なら6以上）',
   !!agSummoned&&(roll>=6?curLV(agSummoned)>=6:curLV(agSummoned)===roll),
   'roll='+roll+' summoned='+(agSummoned?dbOf(agSummoned).n:'-'));
ok('アギド ruling: 特殊召喚できないスピリットは蘇生先に選ばれない',
   !agSummoned||!(CARD_SCRIPTS[dbOf(agSummoned).n]||{}).cannotSpecialSummon);
reset0();
let ag2=mk('アギド',0),agk2=mk(BIG,1);
gameState.players[0].mz=[ag2];gameState.players[1].mz=[agk2];
gameState.players[0].grave=[mk(PLAIN,0)];      /* アンデット族しかいない */
let bag2=battleKill(ag2,agk2);
let cag2=ctxDS(0,ag2,bag2,'grave','leave');
sc('アギド').resolve(cag2);drain0();
let roll2=Number(gameState.players[0].temporaryFlags.c2AgidoRoll);
/* アギド自身が天使族レベル4なので、出目4のときだけ自己蘇生が成立する */
ok('アギド negative: 出目と一致する天使族がいなければ特殊召喚されない',
   (roll2===4)===(gameState.players[0].mz.length===1),
   'roll='+roll2+' mz='+gameState.players[0].mz.length);
ok('アギド ruling: アギド自身（天使族レベル4）も蘇生対象になりうる',
   roll2!==4||dbOf(gameState.players[0].mz[0]).n==='アギド');

/* ============ サイボーグドクター ============ */
reset0();
let cy=mk('サイボーグドクター',0),tuner=mk('ジェネクス・コントローラー',0);  /* 闇 lv3 */
gameState.players[0].mz=[cy,tuner];
gameState.players[0].grave=[mk('D・キャメラン',0),mk(BIG,0)];
/* D・キャメランは光 lv2 なので不一致。闇 lv3 を用意する */
gameState.players[0].grave=[mk('ジェネクス・コントローラー',0)];
let ccy=C(0,cy,'mz',0);
ok('サイボーグドクター positive: 同じ属性・レベルが墓地にいれば発動できる',
   sc('サイボーグドクター').condition(ccy)===true,ccy.reason||'');
sc('サイボーグドクター').selectTargets(ccy,t=>{ccy.selectedTargets=t;});
sc('サイボーグドクター').resolve(ccy);
ok('サイボーグドクター positive: チューナーをリリースして墓地から特殊召喚する',
   gameState.players[0].grave.some(c=>c===tuner)
   &&gameState.players[0].mz.filter(c=>dbOf(c).n==='ジェネクス・コントローラー').length===1,
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(',')+' grave='+gameState.players[0].grave.length);
ok('サイボーグドクター ruling: 1ターンに1度の宣言がある',sc('サイボーグドクター').countLimit===1);
reset0();
let cy2=mk('サイボーグドクター',0),tuner2=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[cy2,tuner2];
gameState.players[0].grave=[mk(BIG,0)];        /* 光 lv8 で不一致 */
ok('サイボーグドクター negative: 同じ属性・レベルが墓地にいなければ発動できない',
   sc('サイボーグドクター').condition(C(0,cy2,'mz',0))===false);
reset0();
let cy3=mk('サイボーグドクター',0),nonTuner=mk(PLAIN,0);
gameState.players[0].mz=[cy3,nonTuner];
gameState.players[0].grave=[mk(PLAIN,0)];
ok('サイボーグドクター negative: チューナーがいなければ発動できない',
   sc('サイボーグドクター').condition(C(0,cy3,'mz',0))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('夜叉',0),ro2=mk('ワーム・ルクイエ',0),ro3=mk('7つの武器を持つハンター',0);
gameState.players[0].mz=[ro1,ro2,ro3];
[ro1,ro2,ro3].forEach(c=>{ensureCardUid(gameState,c);c.summonedTurn=gameState.turn;});
gameState.phase='end';
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('夜叉').passive.onEndPhase(endCtx(0,ro1));
sc('ワーム・ルクイエ').passive.onFlip(flipCtx(0,ro2));
sc('7つの武器を持つハンター').passive.onNormalSummon(summonCtx(0,ro3));
curATK(ro3); cannotAttackNow(ro2);
ok('cycle13 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('夜叉',0);
gameState.players[0].mz=[rp1];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rp1),'c2SpiritTurn',gameState.turn,'スピリット');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle13 Replay: スピリットの召喚・リバース記録が digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('アルカナフォースI－THE MAGICIAN',0);
gameState.players[0].mz=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let seedBefore=gameState.rngState;
sc('アルカナフォースI－THE MAGICIAN').resolve(summonCtx(0,rp2));
ok('cycle13 Replay: コイントスで rngState が進む',gameState.rngState!==seedBefore);
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle13 Replay: コイントス結果が digest 一致で再生される',ra2.ok,ra2.reason||'');
reset0();
let rp3=mk('磨破羅魏',0);
gameState.players[0].mz=[rp3];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.schedule({at:'drawPhase',ownTurn:true,player:0,handler:'c2.maharagi',
  args:{player:0},source:{card:rp3},note:'磨破羅魏'});
let ra3=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle13 Replay: ドローフェイズ予約が digest 一致で再生される',ra3.ok,ra3.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle13 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle13 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
