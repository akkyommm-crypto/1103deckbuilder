/* Auto cycle 32 — 7枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['コアキメイル・アイス','コアキメイル・シーパンサー','鋼核の輝き','黄金の天道虫',
 '星見獣ガリス','黒薔薇の魔女','黒蠍－逃げ足のチック'];
ALL.forEach(n=>ok('cycle32 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle32 枚数は7',ALL.length===7);

const CORE='コアキメイルの鋼核';
const WATERM='E・HERO オーシャン';   /* 水属性 lv4 */

function upkeepEnd(){ gameState.phase='end';gameState.activePlayer=0; }

/* ============ 1. コアキメイル・アイス ============ */
reset0();
let ki=mk('コアキメイル・アイス',0),kiSS=mk(BIG,1);
gameState.players[0].mz=[ki];gameState.players[1].mz=[kiSS];
kiSS.specialSummoned=true;kiSS.specialSummonedFrom='hand';
gameState.players[0].hand=[mk(PLAIN,0)];
let kiCtx=C(0,ki,'mz',0,'activate',{});
ok('コアキメイル・アイス positive: 特殊召喚されたモンスターがいれば発動できる',
   sc('コアキメイル・アイス').condition(kiCtx)===true);
let kiCost=false;sc('コアキメイル・アイス').cost(kiCtx,v=>{kiCost=v;});
ok('コアキメイル・アイス positive: コストで手札を1枚墓地へ送る',
   kiCost&&gameState.players[0].hand.length===0);
sc('コアキメイル・アイス').selectTargets(kiCtx,r=>{kiCtx.selectedTargets=r;});
sc('コアキメイル・アイス').resolve(kiCtx);
ok('コアキメイル・アイス card-specific: 特殊召喚されたモンスターが破壊される',
   gameState.players[1].mz.length===0);
reset0();
let ki2=mk('コアキメイル・アイス',0),ki2Normal=mk(BIG,1);
gameState.players[0].mz=[ki2];gameState.players[1].mz=[ki2Normal];
gameState.players[0].hand=[mk(PLAIN,0)];
ok('コアキメイル・アイス negative: 通常召喚されたモンスターしかいなければ発動できない',
   sc('コアキメイル・アイス').condition(C(0,ki2,'mz',0,'activate',{}))===false);
reset0();
upkeepEnd();
let ki3=mk('コアキメイル・アイス',0),ki3Core=mk(CORE,0);
gameState.players[0].mz=[ki3];gameState.players[0].hand=[ki3Core];
sc('コアキメイル・アイス').resolve(C(0,ki3,'mz',0,'activate',{}));
ok('コアキメイル・アイス card-specific: 維持コストで鋼核を墓地へ送る',
   gameState.players[0].mz.length===1&&gameState.players[0].grave.length===1);

/* ============ 2. コアキメイル・シーパンサー ============ */
reset0();
let sp=mk('コアキメイル・シーパンサー',0),spCore=mk(CORE,0);
gameState.players[0].mz=[sp];gameState.players[0].hand=[spCore];
gameState.players[0].grave=[mk('強欲な壺',0)];
let spCtx=C(0,sp,'mz',0,'activate',{});
ok('コアキメイル・シーパンサー positive: 鋼核と墓地の魔法があれば発動できる',
   sc('コアキメイル・シーパンサー').condition(spCtx)===true);
let spCost=false;sc('コアキメイル・シーパンサー').cost(spCtx,v=>{spCost=v;});
ok('コアキメイル・シーパンサー positive: コストで鋼核を墓地へ送る',
   spCost&&gameState.players[0].hand.length===0);
sc('コアキメイル・シーパンサー').selectTargets(spCtx,r=>{spCtx.selectedTargets=r;});
sc('コアキメイル・シーパンサー').resolve(spCtx);
ok('コアキメイル・シーパンサー card-specific: 墓地の魔法がデッキの一番上に戻る',
   gameState.players[0].deck.length>0
   &&dbOf(gameState.players[0].deck[0]).n==='強欲な壺',
   'top='+(gameState.players[0].deck[0]&&dbOf(gameState.players[0].deck[0]).n));
reset0();
let sp2=mk('コアキメイル・シーパンサー',0);
gameState.players[0].mz=[sp2];gameState.players[0].hand=[];
gameState.players[0].grave=[mk('強欲な壺',0)];
ok('コアキメイル・シーパンサー negative: 鋼核が手札になければ発動できない',
   sc('コアキメイル・シーパンサー').condition(C(0,sp2,'mz',0,'activate',{}))===false);
ok('コアキメイル・シーパンサー ruling: 1ターンに1度（countLimit）',
   sc('コアキメイル・シーパンサー').countLimit===1);
reset0();
upkeepEnd();
let sp3=mk('コアキメイル・シーパンサー',0),sp3W=mk(WATERM,0);
gameState.players[0].mz=[sp3];gameState.players[0].hand=[sp3W];
sc('コアキメイル・シーパンサー').resolve(C(0,sp3,'mz',0,'activate',{}));
ok('コアキメイル・シーパンサー card-specific: 維持コストで水属性を見せて維持される',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===1);

/* ============ 3. 鋼核の輝き ============ */
reset0();
let kb=mk('鋼核の輝き',0,'down'),kbCore=mk(CORE,0),kbFoe=mk('強欲な壺',1);
gameState.players[0].sz=[kb];gameState.players[0].hand=[kbCore];
gameState.players[1].sz=[kbFoe];
ensureCardUid(gameState,kbFoe);
gameState.chain=[{chainId:1,player:1,cardId:kbFoe.id,uid:kbFoe.uid,
  name:dbOf(kbFoe).n,ss:1,targets:[],selection:[]}];
let kbCtx=ctxEv(0,kb,'onActivateSuccess',
  {uid:kbFoe.uid,player:1,kind:'spell',sub:'normal',chainId:1},'sz');
ok('鋼核の輝き positive: 相手の魔法発動に反応する',
   sc('鋼核の輝き').passive.onActivateSuccess(kbCtx)===true);
let kbCost=false;sc('鋼核の輝き').cost(kbCtx,v=>{kbCost=v;});
ok('鋼核の輝き card-specific: 鋼核は見せるだけで墓地へ送らない',
   kbCost&&gameState.players[0].hand.length===1);
ok('鋼核の輝き 隠匿情報: 見せた鋼核は両者に公開される',
   revealListV20(gameState).some(r=>r&&(r.audience==='both'||r.audience==null)));
sc('鋼核の輝き').resolve(kbCtx);
ok('鋼核の輝き card-specific: 相手の発動が無効になる',API.chainLinkNegated(1)===true);
gameState.chain=[];
reset0();
let kb2=mk('鋼核の輝き',0,'down'),kb2Foe=mk('強欲な壺',1);
gameState.players[0].sz=[kb2];gameState.players[0].hand=[];
gameState.players[1].sz=[kb2Foe];ensureCardUid(gameState,kb2Foe);
ok('鋼核の輝き negative: 鋼核が手札になければ発動できない',
   sc('鋼核の輝き').passive.onActivateSuccess(
     ctxEv(0,kb2,'onActivateSuccess',
       {uid:kb2Foe.uid,player:1,kind:'spell',chainId:1},'sz'))===false);
reset0();
let kb3=mk('鋼核の輝き',0,'down'),kb3Core=mk(CORE,0),kb3Mine=mk('強欲な壺',0);
gameState.players[0].sz=[kb3,kb3Mine];gameState.players[0].hand=[kb3Core];
ensureCardUid(gameState,kb3Mine);
ok('鋼核の輝き ruling: 自分の魔法の発動には反応しない',
   sc('鋼核の輝き').passive.onActivateSuccess(
     ctxEv(0,kb3,'onActivateSuccess',
       {uid:kb3Mine.uid,player:0,kind:'spell',chainId:1},'sz'))===false);

/* ============ 4. 黄金の天道虫 ============ */
reset0();
gameState.phase='standby';gameState.activePlayer=0;
let gl=mk('黄金の天道虫',0);
gameState.players[0].hand=[gl];
let glCtx=C(0,gl,'hand',0,'activate',{});
ok('黄金の天道虫 positive: 自分のスタンバイフェイズに発動できる',
   sc('黄金の天道虫').condition(glCtx)===true);
let glLp=gameState.players[0].lp;
sc('黄金の天道虫').resolve(glCtx);
ok('黄金の天道虫 card-specific: 500ライフポイント回復する',
   gameState.players[0].lp===glLp+500,'lp='+glLp+'→'+gameState.players[0].lp);
ok('黄金の天道虫 card-specific: エンドフェイズまで手札で公開され続ける',
   revealListV20(gameState).some(r=>r&&r.until==='endPhase'),
   'reveals='+revealListV20(gameState).length);
ok('黄金の天道虫 card-specific: 公開しても手札に残る',
   gameState.players[0].hand.length===1);
reset0();
gameState.phase='main1';
let gl2=mk('黄金の天道虫',0);
gameState.players[0].hand=[gl2];
ok('黄金の天道虫 negative: メインフェイズでは発動できない',
   sc('黄金の天道虫').condition(C(0,gl2,'hand',0,'activate',{}))===false);
ok('黄金の天道虫 ruling: 1ターンに1度（countLimit）',sc('黄金の天道虫').countLimit===1);

/* ============ 5. 星見獣ガリス ============ */
reset0();
let hg=mk('星見獣ガリス',0);
gameState.players[0].hand=[hg];
gameState.players[0].deck=[mk(BIG,0),mk(PLAIN,0)];   /* 一番上は青眼レベル8 */
let hgCtx=C(0,hg,'hand',0,'activate',{});
ok('星見獣ガリス positive: 手札にあってデッキがあれば発動できる',
   sc('星見獣ガリス').condition(hgCtx)===true);
let hgCost=false;sc('星見獣ガリス').cost(hgCtx,v=>{hgCost=v;});
ok('星見獣ガリス positive: 自身を見せる（手札には残る）',
   hgCost&&gameState.players[0].hand.length===1);
let hgLp=gameState.players[1].lp;
sc('星見獣ガリス').resolve(hgCtx);
ok('星見獣ガリス card-specific: モンスターならレベル×200ダメージ（8×200=1600）',
   gameState.players[1].lp===hgLp-1600,'lp='+hgLp+'→'+gameState.players[1].lp);
ok('星見獣ガリス card-specific: 自身が特殊召喚される',
   gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).n==='星見獣ガリス');
reset0();
let hg2=mk('星見獣ガリス',0);
gameState.players[0].hand=[hg2];
gameState.players[0].deck=[mk('強欲な壺',0),mk(PLAIN,0)];  /* 一番上は魔法 */
let hg2Ctx=C(0,hg2,'hand',0,'activate',{});
sc('星見獣ガリス').cost(hg2Ctx,()=>{});
let hg2Lp=gameState.players[1].lp;
sc('星見獣ガリス').resolve(hg2Ctx);
ok('星見獣ガリス card-specific: モンスター以外なら自身が墓地へ送られダメージも無い',
   gameState.players[0].mz.length===0
   &&gameState.players[0].hand.length===0
   &&gameState.players[1].lp===hg2Lp,
   'grave='+gameState.players[0].grave.length);
reset0();
let hg3=mk('星見獣ガリス',0);
gameState.players[0].hand=[hg3];gameState.players[0].deck=[];
ok('星見獣ガリス negative: デッキが0枚なら発動できない',
   sc('星見獣ガリス').condition(C(0,hg3,'hand',0,'activate',{}))===false);

/* ============ 6. 黒薔薇の魔女 ============ */
reset0();
let br=mk('黒薔薇の魔女',0);
gameState.players[0].mz=[br];gameState.players[0].sz=[];
gameState.players[0].deck=[mk(PLAIN,0),mk(BIG,0)];
let brCtx=ctxEv(0,br,'onNormalSummon',{card:br},'mz');
ok('黒薔薇の魔女 positive: 他のカードが無い状態の召喚成功時に誘発する',
   sc('黒薔薇の魔女').passive.onNormalSummon(brCtx)===true);
sc('黒薔薇の魔女').resolve(brCtx);
ok('黒薔薇の魔女 card-specific: 1枚ドローしモンスターなら残る',
   gameState.players[0].hand.length===1&&gameState.players[0].mz.length===1);
ok('黒薔薇の魔女 隠匿情報: 引いたカードは両者に公開される',
   revealListV20(gameState).some(r=>r&&(r.audience==='both'||r.audience==null)));
reset0();
let br2=mk('黒薔薇の魔女',0);
gameState.players[0].mz=[br2];gameState.players[0].sz=[];
gameState.players[0].deck=[mk('強欲な壺',0),mk(BIG,0)];
let br2Ctx=ctxEv(0,br2,'onNormalSummon',{card:br2},'mz');
sc('黒薔薇の魔女').resolve(br2Ctx);
ok('黒薔薇の魔女 card-specific: モンスター以外なら墓地へ送られ自身も破壊される',
   gameState.players[0].hand.length===0&&gameState.players[0].mz.length===0,
   'hand='+gameState.players[0].hand.length+' mz='+gameState.players[0].mz.length);
reset0();
let br3=mk('黒薔薇の魔女',0),br3Other=mk(BIG,0);
gameState.players[0].mz=[br3,br3Other];
gameState.players[0].deck=[mk(PLAIN,0)];
ok('黒薔薇の魔女 negative: 他のカードがあると発動できない',
   sc('黒薔薇の魔女').condition(
     ctxEv(0,br3,'onNormalSummon',{card:br3},'mz'))===false);
ok('黒薔薇の魔女 ruling: 特殊召喚できない（cannotSpecialSummon）',
   sc('黒薔薇の魔女').cannotSpecialSummon===true);

/* ============ 7. 黒蠍－逃げ足のチック ============ */
reset0();
let ch=mk('黒蠍－逃げ足のチック',0),chFoe=mk(BIG,1);
gameState.players[0].mz=[ch];gameState.players[1].mz=[chFoe];
ensureCardUid(gameState,ch);
for(let i=0;i<5;i++) gameState.players[1].deck.push(mk(PLAIN,1));
let chCtx=ctxEv(0,ch,'onBattleDamage',
  {player:1,amount:1000,attackerUid:ch.uid},'mz');
ok('黒蠍－逃げ足のチック positive: 戦闘ダメージを与えた時に誘発する',
   sc('黒蠍－逃げ足のチック').passive.onBattleDamage(chCtx)===true);
API.confirm=(t,m,yes)=>{ if(yes) yes(); };
sc('黒蠍－逃げ足のチック').resolve(chCtx);
ok('黒蠍－逃げ足のチック positive: 手札に戻すカードの選択要求が出る',
   !!pending()&&pending().player===0);
/* 候補には自分のカードも並ぶ。相手のモンスターを uid で選ぶ。 */
let chPick=pending().candidates.find(c=>{
  const r=resolveTarget(c); return r&&r.card&&r.card.uid===chFoe.uid; })
  ||pending().candidates[0];
API.answerChoice([chPick.key]);
ok('黒蠍－逃げ足のチック card-specific: 選んだカードが持ち主の手札に戻る',
   gameState.players[1].mz.length===0&&gameState.players[1].hand.length===1,
   'foeHand='+gameState.players[1].hand.length);
API.confirm=(t,m,yes,no)=>{ if(no) no(); };
reset0();
let ch2=mk('黒蠍－逃げ足のチック',0);
gameState.players[0].mz=[ch2];ensureCardUid(gameState,ch2);
gameState.players[1].mz=[];gameState.players[0].sz=[];gameState.players[1].sz=[];
for(let i=0;i<5;i++) gameState.players[1].deck.push(mk(PLAIN,1));
let ch2Deck=gameState.players[1].deck.length;
let ch2Ctx=ctxEv(0,ch2,'onBattleDamage',
  {player:1,amount:1000,attackerUid:ch2.uid},'mz');
sc('黒蠍－逃げ足のチック').resolve(ch2Ctx);
ok('黒蠍－逃げ足のチック positive: フィールドにカードが無ければデッキトップをめくる',
   !!pending()&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('黒蠍－逃げ足のチック card-specific: めくったカードがデッキに戻り枚数は変わらない',
   gameState.players[1].deck.length===ch2Deck,
   'deck='+ch2Deck+'→'+gameState.players[1].deck.length);
ok('黒蠍－逃げ足のチック 隠匿情報: めくったカードは公開（reveal）されていない',
   revealListV20(gameState).length===0,
   'reveals='+revealListV20(gameState).length);
reset0();
let ch3=mk('黒蠍－逃げ足のチック',0);
gameState.players[0].mz=[ch3];ensureCardUid(gameState,ch3);
ok('黒蠍－逃げ足のチック negative: 自分がダメージを受けても誘発しない',
   sc('黒蠍－逃げ足のチック').passive.onBattleDamage(
     ctxEv(0,ch3,'onBattleDamage',{player:0,amount:1000,attackerUid:ch3.uid},'mz'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roKi=mk('コアキメイル・アイス',0),roSp=mk('コアキメイル・シーパンサー',0);
gameState.players[0].mz=[roKi,roSp];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roKi);curATK(roSp);
sc('コアキメイル・アイス').passive.onEndPhase(C(0,roKi,'mz',0,'activate',{}));
sc('コアキメイル・シーパンサー').passive.onEndPhase(C(0,roSp,'mz',1,'activate',{}));
ok('cycle32 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('コアキメイル・シーパンサー',0),rp1Core=mk(CORE,0);
gameState.players[0].mz=[rp1];gameState.players[0].hand=[rp1Core];
gameState.players[0].grave=[mk('強欲な壺',0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'mz',0,'activate',{});
sc('コアキメイル・シーパンサー').cost(rp1Ctx,()=>{});
rp1Ctx.selectedTargets=[h(gameState.players[0].grave[gameState.players[0].grave.length-1])];
sc('コアキメイル・シーパンサー').resolve(rp1Ctx);
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle32 Replay: 鋼核コスト＋デッキトップ戻しが digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
gameState.phase='standby';
let rp2=mk('黄金の天道虫',0);
gameState.players[0].hand=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('黄金の天道虫').resolve(C(0,rp2,'hand',0,'activate',{}));
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle32 Replay: 公開（reveal）と回復が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap32=JSON.stringify(gameState);
ok('cycle32 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap32))===snap32);
ok('cycle32 直列化: 予約に関数が入っていない',snap32.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
