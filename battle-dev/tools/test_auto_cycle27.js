/* Auto cycle 27 — 11枚。positive / negative / ruling edge / Replay。 */
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
function pending(){return pendingChoiceV49(gameState);}
function synchroSummon(p, synName, materials){
  const P=gameState.players[p];
  const ex=mk(synName,p); P.ex=[ex]; ensureCardUid(gameState,ex);
  materials.forEach(c=>ensureCardUid(gameState,c));
  const indices=materials.map(c=>P.mz.indexOf(c)).filter(i=>i>=0).sort((a,b)=>b-a);
  gameState.deferredEvents=[];
  act({type:'EX_SUMMON_PREPARE_V42',player:p,exIndex:0,materials:indices,kind:'synchro',pos:'atk'});
  act({type:'EX_SUMMON_COMMIT_V42'});
  const evts=(gameState.deferredEvents||[]).slice(); gameState.deferredEvents=[];
  return {syn:ex, evts};
}
function matEvt(pack, card){
  const e=pack.evts.find(x=>x.eventName==='onSendToGrave'&&x.evt&&x.evt.uid===card.uid);
  return e?e.evt:null;
}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 */
const TUNER='ジェネクス・コントローラー';

const ALL=['A・ジェネクス・バードマン','アンノウン・シンクロン','泣き神の石像',
 'ガーディアン・エアトス','地球巨人 ガイア・プレート','ヘルウェイ・パトロール',
 '召喚師セームベル','吹き荒れるウィン','ゼータ・レティキュラント',
 'パワー・ジャイアント','ソード・マスター'];
ALL.forEach(n=>ok('cycle27 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle27 枚数は11',ALL.length===11);

const WIND='E・HERO フェザーマン';   /* 風 lv3 */
const TUNER2='ジャンク・シンクロン';  /* 戦士 チューナー lv3 */
const ROCK='はにわ';                /* 岩石 lv2 */
const DEMON='なぞの手';             /* 悪魔 lv2 atk500 */
const LV2='A・ボム';                /* lv2 */
const WARR='D.D.アサイラント';       /* 戦士 lv4 atk1700 */
const EQUIP='7カード';              /* 装備魔法 */

function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}
function survivedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:false,destroyedAtk:false};
}

/* ============ 1. A・ジェネクス・バードマン ============ */
reset0();
let bm=mk('A・ジェネクス・バードマン',0),bmWind=mk(WIND,0);
gameState.players[0].hand=[bm];gameState.players[0].mz=[bmWind];
let bmCtx=C(0,bm,'hand',0,'activate',{});
ok('A・ジェネクス・バードマン positive: 自分の表側モンスターがいれば発動できる',
   sc('A・ジェネクス・バードマン').condition(bmCtx)===true);
bmCtx.selectedTargets=[h(bmWind)];
sc('A・ジェネクス・バードマン').resolve(bmCtx);
ok('A・ジェネクス・バードマン positive: 対象が手札に戻り自身が特殊召喚される',
   gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).n==='A・ジェネクス・バードマン'
   &&gameState.players[0].hand.some(c=>dbOf(c).n===WIND));
ok('A・ジェネクス・バードマン card-specific: 風属性を戻したので攻撃力が500アップ',
   curATK(bm)===dbOf(bm).atk+500,'atk='+curATK(bm));
ok('A・ジェネクス・バードマン card-specific: 離れた場合に除外される印が付く',
   bm.banishWhenLeavesField===true);
reset0();
let bm2=mk('A・ジェネクス・バードマン',0),bm2Other=mk(BIG,0);
gameState.players[0].hand=[bm2];gameState.players[0].mz=[bm2Other];
let bm2Ctx=C(0,bm2,'hand',0,'activate',{});
bm2Ctx.selectedTargets=[h(bm2Other)];
sc('A・ジェネクス・バードマン').resolve(bm2Ctx);
ok('A・ジェネクス・バードマン ruling: 風属性以外を戻した場合は攻撃力が上がらない',
   curATK(bm2)===dbOf(bm2).atk,'atk='+curATK(bm2));
reset0();
let bm3=mk('A・ジェネクス・バードマン',0);
gameState.players[0].hand=[bm3];gameState.players[0].mz=[];
ok('A・ジェネクス・バードマン negative: 手札に戻すモンスターがいなければ発動できない',
   sc('A・ジェネクス・バードマン').condition(C(0,bm3,'hand',0,'activate',{}))===false);

/* ============ 2. アンノウン・シンクロン ============ */
reset0();
let us=mk('アンノウン・シンクロン',0),usFoe=mk(BIG,1);
gameState.players[0].hand=[us];gameState.players[0].mz=[];gameState.players[1].mz=[usFoe];
let usCtx=C(0,us,'hand',0,'activate',{});
ok('アンノウン・シンクロン positive: 自分に居らず相手に居れば発動できる',
   sc('アンノウン・シンクロン').condition(usCtx)===true);
sc('アンノウン・シンクロン').resolve(usCtx);
ok('アンノウン・シンクロン positive: 手札から特殊召喚される',
   gameState.players[0].mz.length===1);
ok('アンノウン・シンクロン card-specific: デュエル中に1度（countLimit scope=duel）',
   sc('アンノウン・シンクロン').countLimit.scope==='duel'
   &&sc('アンノウン・シンクロン').countLimit.n===1);
reset0();
let us2=mk('アンノウン・シンクロン',0),us2Mine=mk(BIG,0),us2Foe=mk(BIG,1);
gameState.players[0].hand=[us2];gameState.players[0].mz=[us2Mine];gameState.players[1].mz=[us2Foe];
ok('アンノウン・シンクロン negative: 自分フィールドにモンスターがいると発動できない',
   sc('アンノウン・シンクロン').condition(C(0,us2,'hand',0,'activate',{}))===false);
reset0();
let us3=mk('アンノウン・シンクロン',0);
gameState.players[0].hand=[us3];gameState.players[0].mz=[];gameState.players[1].mz=[];
ok('アンノウン・シンクロン ruling: 相手フィールドにモンスターがいなければ発動できない',
   sc('アンノウン・シンクロン').condition(C(0,us3,'hand',0,'activate',{}))===false);

/* ============ 3. 泣き神の石像 ============ */
reset0();
let ns=mk('泣き神の石像',0);
gameState.players[0].hand=[ns];gameState.players[0].grave=[mk(TUNER2,0)];
let nsCtx=C(0,ns,'hand',0,'activate',{});
ok('泣き神の石像 positive: 墓地にチューナーがいれば発動できる',
   sc('泣き神の石像').condition(nsCtx)===true);
nsCtx.selectedTargets=[h(gameState.players[0].grave[0])];
let nsCost=false;sc('泣き神の石像').cost(nsCtx,v=>{nsCost=v;});
ok('泣き神の石像 positive: コストでチューナーが除外される',
   nsCost&&gameState.players[0].banish.length===1&&gameState.players[0].grave.length===0);
sc('泣き神の石像').resolve(nsCtx);
ok('泣き神の石像 card-specific: 手札から特殊召喚される',
   gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).n==='泣き神の石像');
reset0();
let ns2=mk('泣き神の石像',0);
gameState.players[0].hand=[ns2];gameState.players[0].grave=[mk(BIG,0)];
ok('泣き神の石像 negative: 墓地にチューナーがいなければ発動できない',
   sc('泣き神の石像').condition(C(0,ns2,'hand',0,'activate',{}))===false);

/* ============ 4. ガーディアン・エアトス ============ */
reset0();
let ga=mk('ガーディアン・エアトス',0);
gameState.players[0].hand=[ga];gameState.players[0].grave=[];
let gaCtx=C(0,ga,'hand',0,'activate',{});
ok('ガーディアン・エアトス positive: 自分の墓地にモンスターがいなければ発動できる',
   sc('ガーディアン・エアトス').condition(gaCtx)===true);
sc('ガーディアン・エアトス').resolve(gaCtx);
ok('ガーディアン・エアトス positive: 手札から特殊召喚される',
   gameState.players[0].mz.length===1);
reset0();
let ga2=mk('ガーディアン・エアトス',0);
gameState.players[0].hand=[ga2];gameState.players[0].grave=[mk(BIG,0)];
ok('ガーディアン・エアトス negative: 自分の墓地にモンスターがいると発動できない',
   sc('ガーディアン・エアトス').condition(C(0,ga2,'hand',0,'activate',{}))===false);
reset0();
let ga3=mk('ガーディアン・エアトス',0),ga3Eq=mk(EQUIP,0);
gameState.players[0].mz=[ga3];gameState.players[0].sz=[ga3Eq];
ensureCardUid(gameState,ga3);ensureCardUid(gameState,ga3Eq);
ga3Eq.equipUid=ga3Eq.equipUid||777;ga3Eq.equipTo={p:0,uid:ga3.uid};
ga3.equippedBy=[ga3Eq.equipUid];
gameState.players[1].grave=[mk(BIG,1),mk(PLAIN,1),mk(PLAIN,1)];
let ga3Ctx=C(0,ga3,'mz',0,'activate',{});
ok('ガーディアン・エアトス positive: 装備魔法があれば②を発動できる',
   sc('ガーディアン・エアトス').condition(ga3Ctx)===true);
let ga3Cost=false;sc('ガーディアン・エアトス').cost(ga3Ctx,v=>{ga3Cost=v;});
ok('ガーディアン・エアトス positive: コストで装備魔法が墓地へ送られる',
   ga3Cost&&gameState.players[0].sz.length===0);
let ga3Atk=curATK(ga3);
sc('ガーディアン・エアトス').resolve(ga3Ctx);
API.answerChoice(pending().candidates.slice(0,3).map(c=>c.key));
ok('ガーディアン・エアトス card-specific: 相手の墓地3体を除外し攻撃力が×500アップ',
   gameState.players[1].banish.length===3&&curATK(ga3)===ga3Atk+1500,
   'banish='+gameState.players[1].banish.length+' atk='+ga3Atk+'→'+curATK(ga3));

/* ============ 5. 地球巨人 ガイア・プレート ============ */
reset0();
let gp=mk('地球巨人 ガイア・プレート',0);
gameState.players[0].hand=[gp];
gameState.players[0].grave=[mk(ROCK,0),mk(ROCK,0)];
ensureCardUid(gameState,gp);
let gpCtx=C(0,gp,'hand',0,'activate',{});
ok('地球巨人 ガイア・プレート positive: 墓地に岩石族2体いれば発動できる',
   sc('地球巨人 ガイア・プレート').condition(gpCtx)===true);
sc('地球巨人 ガイア・プレート').resolve(gpCtx);
ok('地球巨人 ガイア・プレート positive: 除外2体の選択要求が出る',
   !!pending()&&pending().min===2);
API.answerChoice(pending().candidates.slice(0,2).map(c=>c.key));
ok('地球巨人 ガイア・プレート card-specific: 岩石族2体を除外して手札から特殊召喚される',
   gameState.players[0].banish.length===2&&gameState.players[0].mz.length===1,
   'banish='+gameState.players[0].banish.length+' mz='+gameState.players[0].mz.length);
let gpFoe=mk(BIG,1);gameState.players[1].mz=[gpFoe];
let gpOn=gameState.players[0].mz[0];
gameState.battle={player:1,atkIdx:0,target:0};
ok('地球巨人 ガイア・プレート card-specific: 戦闘相手の攻撃力・守備力がダメージ計算時のみ半分',
   curATK(gpFoe)===Math.floor(dbOf(gpFoe).atk/2)
   &&curDEF(gpFoe)===Math.floor(dbOf(gpFoe).def/2),
   'atk='+curATK(gpFoe)+' def='+curDEF(gpFoe));
gameState.battle=null;
ok('地球巨人 ガイア・プレート ruling: 戦闘中でなければ元の数値',
   curATK(gpFoe)===dbOf(gpFoe).atk,'atk='+curATK(gpFoe));
reset0();
let gp2=mk('地球巨人 ガイア・プレート',0);
gameState.players[0].hand=[gp2];gameState.players[0].grave=[mk(ROCK,0)];
ok('地球巨人 ガイア・プレート negative: 岩石族が1体では発動できない',
   sc('地球巨人 ガイア・プレート').condition(C(0,gp2,'hand',0,'activate',{}))===false);
reset0();
gameState.phase='standby';
let gp3=mk('地球巨人 ガイア・プレート',0);
gameState.players[0].mz=[gp3];gameState.players[0].grave=[mk(ROCK,0)];
sc('地球巨人 ガイア・プレート').resolve(C(0,gp3,'mz',0,'activate',{}));
ok('地球巨人 ガイア・プレート card-specific: スタンバイに墓地の岩石族を除外して維持する',
   gameState.players[0].banish.length===1&&gameState.players[0].mz.length===1);
reset0();
gameState.phase='standby';
let gp4=mk('地球巨人 ガイア・プレート',0);
gameState.players[0].mz=[gp4];gameState.players[0].grave=[];
sc('地球巨人 ガイア・プレート').resolve(C(0,gp4,'mz',0,'activate',{}));
ok('地球巨人 ガイア・プレート ruling: 岩石族がいなければ自身が墓地へ送られる',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);

/* ============ 6. ヘルウェイ・パトロール ============ */
reset0();
let hw=mk('ヘルウェイ・パトロール',0),hwFoe=mk(BIG,1);
gameState.players[0].mz=[hw];gameState.players[1].grave=[hwFoe];
let hwCtx=ctxDS(0,hw,killedBattle(hw,hwFoe));
ok('ヘルウェイ・パトロール positive: 戦闘破壊した時に誘発する',
   sc('ヘルウェイ・パトロール').passive.onDamageStep(hwCtx)===true);
let hwLp=gameState.players[1].lp;
sc('ヘルウェイ・パトロール').resolve(hwCtx);
ok('ヘルウェイ・パトロール card-specific: 元々のレベル×100ダメージ（青眼レベル8＝800）',
   gameState.players[1].lp===hwLp-800,'lp='+hwLp+'→'+gameState.players[1].lp);
reset0();
let hw2=mk('ヘルウェイ・パトロール',0),hwDemon=mk(DEMON,0);
gameState.players[0].grave=[hw2];gameState.players[0].hand=[hwDemon];
let hw2Ctx=C(0,hw2,'grave',0,'activate',{});
ok('ヘルウェイ・パトロール positive: 墓地から②を発動できる',
   sc('ヘルウェイ・パトロール').condition(hw2Ctx)===true);
let hw2Cost=false;sc('ヘルウェイ・パトロール').cost(hw2Ctx,v=>{hw2Cost=v;});
ok('ヘルウェイ・パトロール positive: コストで自身が除外される',
   hw2Cost&&gameState.players[0].banish.length===1);
sc('ヘルウェイ・パトロール').selectTargets(hw2Ctx,r=>{hw2Ctx.selectedTargets=r;});
sc('ヘルウェイ・パトロール').resolve(hw2Ctx);
ok('ヘルウェイ・パトロール card-specific: 手札の攻撃力2000以下の悪魔族が特殊召喚される',
   gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).ra==='悪魔');
reset0();
let hw3=mk('ヘルウェイ・パトロール',0);
gameState.players[0].grave=[hw3];gameState.players[0].hand=[mk(BIG,0)];
ok('ヘルウェイ・パトロール negative: 手札に条件を満たす悪魔族がいなければ発動できない',
   sc('ヘルウェイ・パトロール').condition(C(0,hw3,'grave',0,'activate',{}))===false);

/* ============ 7. 召喚師セームベル ============ */
reset0();
let sb=mk('召喚師セームベル',0),sbLv2=mk(LV2,0);
gameState.players[0].mz=[sb];gameState.players[0].hand=[sbLv2];
let sbCtx=C(0,sb,'mz',0,'activate',{});
ok('召喚師セームベル positive: 同じレベルのモンスターが手札にあれば発動できる',
   sc('召喚師セームベル').condition(sbCtx)===true);
sbCtx.selectedTargets=[h(sbLv2)];
sc('召喚師セームベル').resolve(sbCtx);
ok('召喚師セームベル card-specific: 同じレベルのモンスターが特殊召喚される',
   gameState.players[0].mz.length===2
   &&Number(dbOf(gameState.players[0].mz[1]).lv)===Number(dbOf(sb).lv));
ok('召喚師セームベル card-specific: 使用済みの印が残り再発動できない',
   Number(sb.d6SembleUsed)===1
   &&sc('召喚師セームベル').condition(C(0,sb,'mz',0,'activate',{}))===false);
reset0();
let sb2=mk('召喚師セームベル',0);
gameState.players[0].mz=[sb2];gameState.players[0].hand=[mk(BIG,0)];
ok('召喚師セームベル negative: 同じレベルのモンスターが手札になければ発動できない',
   sc('召喚師セームベル').condition(C(0,sb2,'mz',0,'activate',{}))===false);

/* ============ 8. 吹き荒れるウィン ============ */
reset0();
let fw=mk('吹き荒れるウィン',0),fwTrib=mk(WIND,0),fwHand=mk(WIND,0);
gameState.players[0].mz=[fw,fwTrib];gameState.players[0].hand=[fwHand];
ensureCardUid(gameState,fw);
let fwCtx=C(0,fw,'mz',0,'activate',{});
ok('吹き荒れるウィン positive: 他の風属性とリリース先があれば発動できる',
   sc('吹き荒れるウィン').condition(fwCtx)===true);
fwCtx.selectedTargets=[h(fwTrib)];
let fwCost=false;sc('吹き荒れるウィン').cost(fwCtx,v=>{fwCost=v;});
ok('吹き荒れるウィン positive: コストで他の風属性がリリースされる',
   fwCost&&gameState.players[0].mz.length===1);
sc('吹き荒れるウィン').resolve(fwCtx);
ok('吹き荒れるウィン card-specific: 手札の風属性が特殊召喚される',
   gameState.players[0].mz.length===2
   &&gameState.players[0].mz.some(c=>c&&c.uid===fwHand.uid));
ok('吹き荒れるウィン card-specific: ウィンが離れたら破壊される連結が張られる',
   !!API.linkState(h(fwHand)),'link='+JSON.stringify(API.linkState(h(fwHand))));
ok('吹き荒れるウィン ruling: 1ターンに1度（countLimit）',sc('吹き荒れるウィン').countLimit===1);
reset0();
let fw2=mk('吹き荒れるウィン',0),fw2Hand=mk(WIND,0);
gameState.players[0].mz=[fw2];gameState.players[0].hand=[fw2Hand];
ok('吹き荒れるウィン negative: リリースできる他の風属性がいなければ発動できない',
   sc('吹き荒れるウィン').condition(C(0,fw2,'mz',0,'activate',{}))===false);

/* ============ 9. ゼータ・レティキュラント ============ */
reset0();
let zt=mk('ゼータ・レティキュラント',0),ztFoe=mk(BIG,1);
gameState.players[0].grave=[zt];gameState.players[1].banish=[ztFoe];
ensureCardUid(gameState,ztFoe);
let ztCtx=ctxEv(0,zt,'onRemove',
  {player:1,card:ztFoe,fromPlayer:1,fromZone:'mz',reason:'banish'},'grave');
ok('ゼータ・レティキュラント positive: 相手フィールドのモンスターが除外された時に誘発する',
   sc('ゼータ・レティキュラント').passive.onRemove(ztCtx)===true);
sc('ゼータ・レティキュラント').resolve(ztCtx);
ok('ゼータ・レティキュラント card-specific: 「イーバトークン」が特殊召喚される',
   gameState.players[0].mz.length===1
   &&API.isToken(h(gameState.players[0].mz[0]))
   &&API.tokenKey(h(gameState.players[0].mz[0]))==='イーバトークン',
   'mz='+gameState.players[0].mz.length);
let ztHand=mk('ゼータ・レティキュラント',0);
gameState.players[0].hand=[ztHand];
let ztCtx2=C(0,ztHand,'hand',0,'activate',{});
ok('ゼータ・レティキュラント positive: トークンがいれば手札から特殊召喚できる',
   sc('ゼータ・レティキュラント').condition(ztCtx2)===true);
let ztCost=false;sc('ゼータ・レティキュラント').cost(ztCtx2,v=>{ztCost=v;});
sc('ゼータ・レティキュラント').resolve(ztCtx2);
ok('ゼータ・レティキュラント card-specific: トークンをリリースして手札から出る',
   ztCost&&gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).n==='ゼータ・レティキュラント',
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n||'token').join(','));
reset0();
let zt2=mk('ゼータ・レティキュラント',0),zt2Mine=mk(BIG,0);
gameState.players[0].grave=[zt2];gameState.players[0].banish=[zt2Mine];
ensureCardUid(gameState,zt2Mine);
ok('ゼータ・レティキュラント negative: 自分のモンスターが除外されても誘発しない',
   sc('ゼータ・レティキュラント').passive.onRemove(
     ctxEv(0,zt2,'onRemove',
       {player:0,card:zt2Mine,fromPlayer:0,fromZone:'mz',reason:'banish'},'grave'))===false);

/* ============ 10. パワー・ジャイアント ============ */
reset0();
let pg=mk('パワー・ジャイアント',0),pgSend=mk(LV2,0);
gameState.players[0].hand=[pg,pgSend];
/* S03-U17: 「墓地へ送り、手札から特殊召喚する事ができる」はチェーンを作らない特殊召喚手順。 */
let pgCtx=C(0,pg,'hand',0,'summonProcedure',{});
ok('パワー・ジャイアント positive: 手札にレベル4以下がいれば特殊召喚手順を使える（発動する効果は持たない）',
   sc('パワー・ジャイアント').summonProcedure.condition(pgCtx)===true&&typeof sc('パワー・ジャイアント').resolve!=='function');
let pgCost=false;sc('パワー・ジャイアント').summonProcedure.cost(pgCtx,v=>{pgCost=v;});
ok('パワー・ジャイアント positive: 手順でレベル4以下が墓地へ送られる',
   pgCost&&gameState.players[0].grave.length===1);
API.specialSummon(0,'hand',gameState.players[0].hand.indexOf(pg),'atk','パワー・ジャイアント');
sc('パワー・ジャイアント').summonProcedure.afterSummonS03(h(pg),pgCtx.procedureDataS03);
ok('パワー・ジャイアント card-specific: 特殊召喚され送ったレベル分だけレベルが下がる（6-2=4）',
   gameState.players[0].mz.length===1&&Number(API.levelOf(h(pg)))===4,
   'lv='+API.levelOf(h(pg)));
let pgFoe=mk(BIG,1);gameState.players[1].mz=[pgFoe];
gameState.battle={player:0,atkIdx:0,target:0};
let pgLp=gameState.players[0].lp;
API.damageLP(0,1000);
ok('パワー・ジャイアント card-specific: 戦闘中は自分が受ける効果ダメージが0になる',
   gameState.players[0].lp===pgLp,'lp='+pgLp+'→'+gameState.players[0].lp);
gameState.battle=null;
let pgLp2=gameState.players[0].lp;
API.damageLP(0,1000);
ok('パワー・ジャイアント ruling: 戦闘中でなければ効果ダメージは通る',
   gameState.players[0].lp===pgLp2-1000,'lp='+pgLp2+'→'+gameState.players[0].lp);
reset0();
let pg2=mk('パワー・ジャイアント',0);
gameState.players[0].hand=[pg2,mk(BIG,0)];
ok('パワー・ジャイアント negative: 手札にレベル4以下がいなければ特殊召喚手順を使えない',
   sc('パワー・ジャイアント').summonProcedure.condition(C(0,pg2,'hand',0,'summonProcedure',{}))===false);

/* ============ 11. ソード・マスター ============ */
reset0();
let sm=mk('ソード・マスター',0),smWar=mk(WARR,0),smFoe=mk(BIG,1);
gameState.players[0].hand=[sm];gameState.players[0].mz=[smWar];
gameState.players[1].mz=[smFoe];
let smCtx=ctxDS(0,sm,survivedBattle(smWar,smFoe),'hand');
ok('ソード・マスター positive: 戦士族の攻撃で破壊できなかった時に誘発する',
   sc('ソード・マスター').passive.onDamageStep(smCtx)===true);
sc('ソード・マスター').resolve(smCtx);
ok('ソード・マスター card-specific: 手札から特殊召喚される',
   gameState.players[0].mz.length===2
   &&gameState.players[0].mz.some(c=>c&&dbOf(c).n==='ソード・マスター'));
reset0();
let sm2=mk('ソード・マスター',0),sm2War=mk(WARR,0),sm2Foe=mk(PLAIN,1);
gameState.players[0].hand=[sm2];gameState.players[0].mz=[sm2War];
gameState.players[1].mz=[sm2Foe];
ok('ソード・マスター negative: 相手モンスターを破壊した場合は誘発しない',
   sc('ソード・マスター').passive.onDamageStep(
     ctxDS(0,sm2,killedBattle(sm2War,sm2Foe),'hand'))===false);
reset0();
let sm3=mk('ソード・マスター',0),sm3NonWar=mk(BIG,0),sm3Foe=mk(BIG,1);
gameState.players[0].hand=[sm3];gameState.players[0].mz=[sm3NonWar];
gameState.players[1].mz=[sm3Foe];
ok('ソード・マスター ruling: 戦士族以外の攻撃では誘発しない',
   sc('ソード・マスター').passive.onDamageStep(
     ctxDS(0,sm3,survivedBattle(sm3NonWar,sm3Foe),'hand'))===false);
ok('ソード・マスター card-specific: 貫通を宣言している（continuous.piercingDamage）',
   typeof sc('ソード・マスター').continuous.piercingDamage==='function');

/* ================= passive / continuous は read-only ================= */
reset0();
let roGp=mk('地球巨人 ガイア・プレート',0),roPg=mk('パワー・ジャイアント',0),roFoe=mk(BIG,1);
gameState.players[0].mz=[roGp,roPg];gameState.players[1].mz=[roFoe];
gameState.battle={player:1,atkIdx:0,target:0};
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roFoe);curDEF(roFoe);curATK(roGp);curATK(roPg);
ok('cycle27 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);
gameState.battle=null;

/* ================= 隠匿情報 ================= */
reset0();
let hiGa=mk('ガーディアン・エアトス',0),hiEq=mk(EQUIP,0);
gameState.players[0].mz=[hiGa];gameState.players[0].sz=[hiEq];
ensureCardUid(gameState,hiGa);ensureCardUid(gameState,hiEq);
hiEq.equipUid=hiEq.equipUid||776;hiEq.equipTo={p:0,uid:hiGa.uid};
hiGa.equippedBy=[hiEq.equipUid];
gameState.players[1].grave=[mk(BIG,1)];
gameState.players[1].hand=[mk(BIG,1),mk(BIG,1)];
sc('ガーディアン・エアトス').resolve(C(0,hiGa,'mz',0,'activate',{}));
ok('cycle27 隠匿情報: 候補は相手の墓地（公開領域）だけで手札は含まれない',
   pending().candidates.every(c=>{const r=resolveTarget(c);return !r||r.zone==='grave';}),
   'n='+pending().candidates.length);
API.answerChoice([pending().candidates[0].key]);

/* ================= Replay / SaveLoad ================= */
reset0();
let re1=mk('泣き神の石像',0);
gameState.players[0].hand=[re1];gameState.players[0].grave=[mk(TUNER2,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let re1Ctx=C(0,re1,'hand',0,'activate',{});
re1Ctx.selectedTargets=[h(gameState.players[0].grave[0])];
/* 特殊召喚は onSpecialSummon を deferredEvents に積み、
   ライブ側だけが flush するため digest 比較には載せない（cost だけを監査する）。 */
sc('泣き神の石像').cost(re1Ctx,()=>{});
let ru1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle27 Replay: 除外コストが digest 一致で再生される',ru1.ok,ru1.reason||'');
reset0();
let re2=mk('ゼータ・レティキュラント',0),re2Foe=mk(BIG,1);
gameState.players[0].grave=[re2];gameState.players[1].banish=[re2Foe];
ensureCardUid(gameState,re2Foe);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('ゼータ・レティキュラント').resolve(
  ctxEv(0,re2,'onRemove',{player:1,card:re2Foe,fromPlayer:1,fromZone:'mz'},'grave'));
let ru2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle27 Replay: トークン生成が digest 一致で再生される',ru2.ok,ru2.reason||'');
let snap27=JSON.stringify(gameState);
ok('cycle27 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap27))===snap27);
ok('cycle27 直列化: 予約に関数が入っていない',snap27.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
