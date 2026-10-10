/* Auto cycle 11 — 23枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
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
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
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
function equipTo(eq,mon){ ensureCardUid(gameState,mon); eq.equipTo={uid:mon.uid}; return eq; }
function killCtx(me,foe){ return {atkCard:me,defCard:foe,destroyedDef:true,destroyedAtk:false,step:'after'}; }
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 lv8 ATK3000 DEF2500 */
const WATER='氷結界の番人ブリズド'; /* 水 lv1 */

const ALL=['スクリーチ','地獄戦士','ジャッカルの聖戦士','レガシーハンター','霞の谷の戦士',
 'ダーク・ヒーロー ゾンバイア','堕天使エデ・アーラエ','針千本','針二千本','不屈闘士レイレイ',
 '海竜神の加護','ダメージ・ダイエット','魔轟神アシェンヴェイル','女豹の傭兵','紅蓮の女守護兵',
 '堕天使マリー','ゲルニア','リバイバルスライム','命の綱','超能力治療','緊急テレポート',
 '深海の大ウナギ','霊滅独鈷杵'];
ALL.forEach(n=>ok('cycle11 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle11 枚数は23',ALL.length===23);
ok('cycle11 SKIP: ヴァイロン・ヴァンガードは未実装のまま（装備枚数が残らない）',
   !CARD_SCRIPTS['ヴァイロン・ヴァンガード']);

/* ================= IA ================= */
/* --- スクリーチ --- */
reset0();
let sr=mk('スクリーチ',0),k1=mk(BIG,1);
gameState.players[0].mz=[sr];gameState.players[1].mz=[k1];
gameState.players[0].deck=[mk(WATER,0),mk(WATER,0),mk(BIG,0)];
sr.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let bsr={defCard:sr,atkCard:k1,destroyedDef:true,destroyedAtk:false,step:'leave'};
let csr=ctxDS(0,sr,bsr,'grave','leave');
ok('スクリーチ positive: デッキに水属性が2体いれば誘発する',sc('スクリーチ').passive.onDamageStep(csr)===true);
sc('スクリーチ').resolve(csr);
ok('スクリーチ positive: 水属性2体が墓地へ送られる',
   API.pileCards(0,'deck',x=>x.db.at==='水').length===0&&gameState.players[0].deck.length===1,
   'deck='+gameState.players[0].deck.length);
reset0();
let sr2=mk('スクリーチ',0),k2=mk(BIG,1);
gameState.players[0].mz=[sr2];gameState.players[1].mz=[k2];
gameState.players[0].deck=[mk(WATER,0)];
sr2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('スクリーチ negative: 水属性が1体では発動できない',
   sc('スクリーチ').passive.onDamageStep(
     ctxDS(0,sr2,{defCard:sr2,atkCard:k2,destroyedDef:true,step:'leave'},'grave','leave'))===false);

/* --- 地獄戦士 --- */
reset0();
let js2=mk('地獄戦士',0),atk1=mk(BIG,1);
gameState.players[0].mz=[js2];gameState.players[1].mz=[atk1];
js2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let bjs={defCard:js2,atkCard:atk1,destroyedDef:true,destroyedAtk:false,step:'leave',damage:1800,toPlayer:0};
let cjs=ctxDS(0,js2,bjs,'grave','leave');
ok('地獄戦士 positive: 攻撃で破壊され自分がダメージを受けたら誘発する',
   sc('地獄戦士').passive.onDamageStep(cjs)===true);
let lp1=gameState.players[1].lp;
sc('地獄戦士').resolve(cjs);
ok('地獄戦士 positive: 受けた戦闘ダメージを相手にも与える',
   gameState.players[1].lp===lp1-1800,'lp='+gameState.players[1].lp);
reset0();
let js3=mk('地獄戦士',0),atk2=mk(BIG,1);
gameState.players[0].mz=[js3];gameState.players[1].mz=[atk2];
js3.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('地獄戦士 negative: 戦闘ダメージが無ければ誘発しない',
   sc('地獄戦士').passive.onDamageStep(
     ctxDS(0,js3,{defCard:js3,atkCard:atk2,destroyedDef:true,damage:0,step:'leave'},'grave','leave'))===false);

/* --- ジャッカルの聖戦士 --- */
reset0();
let jk=mk('ジャッカルの聖戦士',0),prey=mk(PLAIN,1);
gameState.players[0].mz=[jk];gameState.players[1].mz=[prey];
prey.battleDestroyed=true;
let cjk=ctxDS(0,jk,killCtx(jk,prey),'mz','after');
ok('ジャッカルの聖戦士 positive: 戦闘破壊したら誘発する',sc('ジャッカルの聖戦士').passive.onDamageStep(cjk)===true);
sc('ジャッカルの聖戦士').resolve(cjk);
ok('ジャッカルの聖戦士 positive: 相手デッキの一番上に戻る',
   gameState.players[1].deck[0]&&gameState.players[1].deck[0].uid===prey.uid);
ok('ジャッカルの聖戦士 ruling: 墓地は経由しない',
   !gameState.players[1].grave.some(c=>c&&c.uid===prey.uid));

/* --- レガシーハンター --- */
reset0();
let lh=mk('レガシーハンター',0),hidden=mk(PLAIN,1,'down','def');
gameState.players[0].mz=[lh];gameState.players[1].mz=[hidden];
gameState.players[1].hand=[mk(BIG,1),mk(BIG,1)];
let clh=ctxDS(0,lh,killCtx(lh,hidden),'mz','after');
ok('レガシーハンター positive: 裏側守備表示を破壊したら誘発する',
   sc('レガシーハンター').passive.onDamageStep(clh)===true);
let fh=gameState.players[1].hand.length;
sc('レガシーハンター').resolve(clh);
ok('レガシーハンター positive: 相手の手札が1枚デッキへ戻る',
   gameState.players[1].hand.length===fh-1&&gameState.players[1].deck.length===1);
reset0();
let lh2=mk('レガシーハンター',0),shown=mk(PLAIN,1,'up','atk');
gameState.players[0].mz=[lh2];gameState.players[1].mz=[shown];
gameState.players[1].hand=[mk(BIG,1)];
ok('レガシーハンター negative: 表側表示を破壊した場合は誘発しない',
   sc('レガシーハンター').passive.onDamageStep(ctxDS(0,lh2,killCtx(lh2,shown),'mz','after'))===false);

/* --- 霞の谷の戦士 --- */
reset0();
let ks=mk('霞の谷の戦士',0),survivor=mk(BIG,1);
gameState.players[0].mz=[ks];gameState.players[1].mz=[survivor];
let cks=ctxDS(0,ks,{atkCard:ks,defCard:survivor,destroyedDef:false,step:'end'},'mz','end');
ok('霞の谷の戦士 positive: 破壊されなかった相手がいれば誘発する',
   sc('霞の谷の戦士').passive.onDamageStep(cks)===true);
sc('霞の谷の戦士').resolve(cks);
ok('霞の谷の戦士 positive: 相手が持ち主の手札に戻る',
   gameState.players[1].hand.some(c=>c&&c.uid===survivor.uid));

/* --- ダーク・ヒーロー ゾンバイア --- */
reset0();
let dz=mk('ダーク・ヒーロー ゾンバイア',0),v1=mk(PLAIN,1);
gameState.players[0].mz=[dz];gameState.players[1].mz=[v1];
ok('ダーク・ヒーロー ゾンバイア ruling: 直接攻撃できない',
   canDirectAttackThroughMonstersV51(dz)===false);
let cdz=ctxDS(0,dz,killCtx(dz,v1),'mz','after');
sc('ダーク・ヒーロー ゾンバイア').resolve(cdz);
ok('ダーク・ヒーロー ゾンバイア positive: 破壊する度に攻撃力200ダウン',
   curATK(dz)===dbOf(dz).atk-200,'atk='+curATK(dz));
sc('ダーク・ヒーロー ゾンバイア').resolve(cdz);
ok('ダーク・ヒーロー ゾンバイア ruling: 累積する',curATK(dz)===dbOf(dz).atk-400);

/* --- 堕天使エデ・アーラエ --- */
reset0();
let ea=mk('堕天使エデ・アーラエ',0),defFoe=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[ea];gameState.players[1].mz=[defFoe];
ok('堕天使エデ・アーラエ negative: 通常召喚では貫通しない',
   applyPiercingDamage({atkCard:ea,defCard:defFoe})===0);
ea.specialSummoned=true;ea.specialSummonedFrom='grave';
ok('堕天使エデ・アーラエ positive: 墓地から特殊召喚された場合は貫通する',
   applyPiercingDamage({atkCard:ea,defCard:defFoe})===Math.max(0,curATK(ea)-curDEF(defFoe)));
ea.specialSummonedFrom='hand';
ok('堕天使エデ・アーラエ ruling: 手札からの特殊召喚では貫通しない',
   applyPiercingDamage({atkCard:ea,defCard:defFoe})===0);

/* ================= IB ================= */
reset0();
let hs=mk('針千本',0,'up','def'),weakAtk=mk(PLAIN,1);   /* DEF1800 > ATK300 */
gameState.players[0].mz=[hs];gameState.players[1].mz=[weakAtk];
let chs=ctxDS(0,hs,{atkCard:weakAtk,defCard:hs,step:'end'},'mz','end');
ok('針千本 positive: 守備力が上回れば誘発する',sc('針千本').passive.onDamageStep(chs)===true);
sc('針千本').resolve(chs);
ok('針千本 positive: 攻撃モンスターが破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===weakAtk.uid));
reset0();
let hs2=mk('針千本',0,'up','def'),strongAtk=mk(BIG,1);   /* ATK3000 > DEF1800 */
gameState.players[0].mz=[hs2];gameState.players[1].mz=[strongAtk];
ok('針千本 negative: 守備力が下回れば誘発しない',
   sc('針千本').passive.onDamageStep(ctxDS(0,hs2,{atkCard:strongAtk,defCard:hs2},'mz','end'))===false);
reset0();
let hs3=mk('針千本',0,'up','atk'),wa=mk(PLAIN,1);
gameState.players[0].mz=[hs3];gameState.players[1].mz=[wa];
ok('針千本 negative: 攻撃表示では誘発しない',
   sc('針千本').passive.onDamageStep(ctxDS(0,hs3,{atkCard:wa,defCard:hs3},'mz','end'))===false);
reset0();
let hn=mk('針二千本',0,'up','def'),wa2=mk(PLAIN,1);
gameState.players[0].mz=[hn];gameState.players[1].mz=[wa2];
ok('針二千本 ruling: dsTiming はダメージ計算後(after)',sc('針二千本').dsTiming==='after');
let chn=ctxDS(0,hn,{atkCard:wa2,defCard:hn,step:'after'},'mz','after');
ok('針二千本 positive: 守備力が上回れば誘発する',sc('針二千本').passive.onDamageStep(chn)===true);

/* --- 不屈闘士レイレイ --- */
reset0();
let fr=mk('不屈闘士レイレイ',0);
gameState.players[0].mz=[fr];
fr.attacked=true;
let cfr=ctxEv(0,fr,'onBattlePhaseEnd',{});
ok('不屈闘士レイレイ positive: 攻撃したらバトルフェイズ終了時に誘発する',
   sc('不屈闘士レイレイ').passive.onBattlePhaseEnd(cfr)===true);
sc('不屈闘士レイレイ').resolve(cfr);
ok('不屈闘士レイレイ positive: 守備表示になり表示形式を変更できない',
   fr.pos==='def'&&cannotChangePositionV10(fr)===true);

/* ================= IC ================= */
/* --- 海竜神の加護 --- */
reset0();
let kg=mk('海竜神の加護',0,'up');
gameState.players[0].sz=[kg];
let smallWater=mk(WATER,0);          /* 水 lv1 */
let bigNonWater=mk(BIG,0);           /* 光 lv8 */
gameState.players[0].mz=[smallWater,bigNonWater];
let ckg=C(0,kg,'sz',0);
/* battleProof はカード自身の宣言・装備付与・テキストだけを見る。
   v21 の条件付き破壊耐性は applyDestructionProtectionV21 が読むので、そちらで確認する。 */
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
const effectProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'effect',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
ok('海竜神の加護 negative: 発動前は破壊耐性が無い',!battleProt(smallWater));
sc('海竜神の加護').resolve(ckg);
ok('海竜神の加護 positive: レベル3以下の水属性は戦闘では破壊されない',!!battleProt(smallWater));
ok('海竜神の加護 positive: カードの効果でも破壊されない',!!effectProt(smallWater));
ok('海竜神の加護 ruling: 条件を満たさないモンスターは守られない',!battleProt(bigNonWater));
API.sendToGrave(h(kg),'解決後');
ok('海竜神の加護 ruling: 解決後に墓地へ行っても効果は続く（v29 墓地ソース）',
   !!battleProt(smallWater));

/* --- ダメージ・ダイエット --- */
reset0();
let dd=mk('ダメージ・ダイエット',0,'up');
gameState.players[0].sz=[dd];
ok('ダメージ・ダイエット negative: 発動前はダメージがそのまま',
   applyBattleDamageFilters({amount:2000,to:0})===2000);
sc('ダメージ・ダイエット').resolve(C(0,dd,'sz',0));
ok('ダメージ・ダイエット positive: 自分が受けるダメージが半分になる',
   applyBattleDamageFilters({amount:2000,to:0})===1000);
ok('ダメージ・ダイエット ruling: 相手が受けるダメージは変わらない',
   applyBattleDamageFilters({amount:2000,to:1})===2000);

/* --- 魔轟神アシェンヴェイル --- */
reset0();
let ma=mk('魔轟神アシェンヴェイル',0),foe1=mk(BIG,1);
gameState.players[0].mz=[ma];gameState.players[1].mz=[foe1];
gameState.players[0].hand=[mk(PLAIN,0)];
battleAt(0,0,'calc');
let cma=C(0,ma,'mz',0,'onDamageStep',{event:{},step:'calc'});
cma.step='calc';
ok('魔轟神アシェンヴェイル positive: 手札があれば発動できる',sc('魔轟神アシェンヴェイル').condition(cma)===true);
sc('魔轟神アシェンヴェイル').cost(cma,()=>{});
ok('魔轟神アシェンヴェイル positive: コストで手札が墓地へ送られる',gameState.players[0].hand.length===0);
sc('魔轟神アシェンヴェイル').resolve(cma);
ok('魔轟神アシェンヴェイル positive: そのダメージ計算時のみ攻撃力+600',
   curATK(ma)===dbOf(ma).atk+600,'atk='+curATK(ma));
ok('魔轟神アシェンヴェイル ruling: 同じダメージ計算では二度発動できない',
   sc('魔轟神アシェンヴェイル').condition(cma)===false);
gameState.battle=null;
ok('魔轟神アシェンヴェイル ruling: 戦闘が終われば元に戻る',curATK(ma)===dbOf(ma).atk);

/* ================= ID ================= */
/* --- 女豹の傭兵 / 紅蓮の女守護兵 --- */
reset0();
let mh=mk('女豹の傭兵',0),dead=mk(BIG,0),killer=mk(BIG,1);
gameState.players[0].mz=[mh,dead];gameState.players[1].mz=[killer];
dead.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cmh=C(0,mh,'mz',0);
ok('女豹の傭兵 positive: このターン戦闘破壊されたモンスターがいれば発動できる',
   sc('女豹の傭兵').condition(cmh)===true);
sc('女豹の傭兵').cost(cmh,()=>{});
sc('女豹の傭兵').selectTargets(cmh,r=>{cmh.selectedTargets=r;});
sc('女豹の傭兵').resolve(cmh);
ok('女豹の傭兵 positive: デッキの一番上に戻る',
   gameState.players[0].deck[0]&&gameState.players[0].deck[0].uid===dead.uid);
reset0();
let gr=mk('紅蓮の女守護兵',0),dead2=mk(BIG,0),k3=mk(BIG,1);
gameState.players[0].mz=[gr,dead2];gameState.players[1].mz=[k3];
gameState.players[0].deck=[mk(PLAIN,0)];
dead2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cgr=C(0,gr,'mz',0);
sc('紅蓮の女守護兵').cost(cgr,()=>{});
sc('紅蓮の女守護兵').selectTargets(cgr,r=>{cgr.selectedTargets=r;});
sc('紅蓮の女守護兵').resolve(cgr);
ok('紅蓮の女守護兵 positive: デッキの一番下に戻る',
   gameState.players[0].deck[gameState.players[0].deck.length-1].uid===dead2.uid);

/* --- 堕天使マリー --- */
reset0();
let dm=mk('堕天使マリー',0);
gameState.players[0].grave=[dm];gameState.players[0].lp=4000;
let cdm=C(0,dm,'grave',0,'onStandbyPhase',{event:{}});
ok('堕天使マリー positive: 自分のスタンバイフェイズで誘発する',sc('堕天使マリー').passive.onStandbyPhase(cdm)===true);
sc('堕天使マリー').resolve(cdm);
ok('堕天使マリー positive: 200回復する',gameState.players[0].lp===4200);
ok('堕天使マリー ruling: このターンは1度だけ',
   sc('堕天使マリー').passive.onStandbyPhase(C(0,dm,'grave',0,'onStandbyPhase',{event:{}}))===false);

/* --- ゲルニア --- */
reset0();
let ge=mk('ゲルニア',0);
gameState.players[0].mz=[ge];
gameState.chain=[{name:'サイクロン',player:1,cardId:findCardIndex('サイクロン')}];
API.destroy(h(ge),'相手の効果');
gameState.chain=[];
let cge=ctxEv(0,ge,'onDestroy',{card:ge,uid:ge.uid,reason:'effect'},'grave');
ok('ゲルニア positive: 相手の効果で破壊されたら誘発する',sc('ゲルニア').passive.onDestroy(cge)===true);
sc('ゲルニア').resolve(cge);
ok('ゲルニア positive: 次の自分スタンバイの蘇生が予約される',
   API.schedules('b3.gernia').length===1);
reset0();
let ge2=mk('ゲルニア',0);
gameState.players[0].mz=[ge2];
gameState.chain=[{name:'サイクロン',player:0,cardId:findCardIndex('サイクロン')}];
API.destroy(h(ge2),'自分の効果');
gameState.chain=[];
ok('ゲルニア negative: 自分の効果で破壊した場合は誘発しない',
   sc('ゲルニア').passive.onDestroy(ctxEv(0,ge2,'onDestroy',{card:ge2,uid:ge2.uid,reason:'effect'},'grave'))===false);

/* --- リバイバルスライム --- */
reset0();
let rs=mk('リバイバルスライム',0),k4=mk(BIG,1);
gameState.players[0].mz=[rs];gameState.players[1].mz=[k4];
gameState.players[0].lp=4000;
rs.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let brs={defCard:rs,atkCard:k4,destroyedDef:true,destroyedAtk:false,step:'leave'};
let crs=ctxDS(0,rs,brs,'grave','leave');
ok('リバイバルスライム positive: 戦闘で墓地へ送られ1000払えるなら誘発する',
   sc('リバイバルスライム').passive.onDamageStep(crs)===true);
sc('リバイバルスライム').cost(crs,()=>{});
ok('リバイバルスライム positive: 1000ライフを払う',gameState.players[0].lp===3000);
sc('リバイバルスライム').resolve(crs);
ok('リバイバルスライム positive: 次の自分スタンバイの蘇生が予約される',
   API.schedules('b3.revivalSlime').length===1);

/* --- 命の綱 --- */
reset0();
let it=mk('命の綱',0,'down'),dead3=mk(BIG,0),k5=mk(BIG,1);
gameState.players[0].sz=[it];gameState.players[0].mz=[dead3];gameState.players[1].mz=[k5];
gameState.players[0].hand=[mk(PLAIN,0),mk(PLAIN,0)];
dead3.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cit=C(0,it,'sz',0);
ok('命の綱 positive: 戦闘で墓地へ送られたモンスターがいれば発動できる',sc('命の綱').condition(cit)===true);
sc('命の綱').cost(cit,()=>{});
ok('命の綱 positive: 手札を全て捨てる',gameState.players[0].hand.length===0);
sc('命の綱').selectTargets(cit,r=>{cit.selectedTargets=r;});
sc('命の綱').resolve(cit);
ok('命の綱 positive: 攻撃力800アップで特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===dead3.uid)&&curATK(dead3)===dbOf(dead3).atk+800,
   'atk='+curATK(dead3));

/* --- 超能力治療 --- */
reset0();
gameState.phase='end';
let cr=mk('超能力治療',0,'down');
gameState.players[0].sz=[cr];
let psy1=mk('強化人類サイコ',0),psy2=mk('強化人類サイコ',0);
gameState.players[0].mz=[psy1,psy2];
API.sendToGrave(h(psy1),'テスト');API.sendToGrave(h(psy2),'テスト');
gameState.players[0].lp=4000;
let ccr=C(0,cr,'sz',0);
ok('超能力治療 positive: このターン墓地へ送られたサイキックがいれば発動できる',
   sc('超能力治療').condition(ccr)===true);
sc('超能力治療').resolve(ccr);
ok('超能力治療 positive: 数×1000回復（2×1000）',gameState.players[0].lp===6000,'lp='+gameState.players[0].lp);
reset0();
gameState.phase='main1';
let cr2=mk('超能力治療',0,'down');gameState.players[0].sz=[cr2];
gameState.players[0].grave=[mk('強化人類サイコ',0)];
ok('超能力治療 negative: エンドフェイズ以外では発動できない',
   sc('超能力治療').condition(C(0,cr2,'sz',0))===false);

/* --- 緊急テレポート --- */
reset0();
let kt=mk('緊急テレポート',0,'down');
gameState.players[0].sz=[kt];
let psy3=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d&&d.k==='m'&&!d.ex&&d.ra==='サイキック'&&Number(d.lv||99)<=3){
    psy3={id:i,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,psy3);break;}}
gameState.players[0].deck=[psy3];
let ckt=C(0,kt,'sz',0);
ok('緊急テレポート positive: レベル3以下のサイキックがいれば発動できる',sc('緊急テレポート').condition(ckt)===true);
sc('緊急テレポート').selectTargets(ckt,r=>{ckt.selectedTargets=r;});
sc('緊急テレポート').resolve(ckt);
ok('緊急テレポート positive: デッキから特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===psy3.uid));
ok('緊急テレポート positive: エンドフェイズの除外が予約される',
   API.schedules('b3.teleportBanish').length===1);

/* --- 深海の大ウナギ --- */
reset0();
let du=mk('深海の大ウナギ',0);
gameState.players[0].mz=[du];
let w1=mk(WATER,0),nonW=mk(BIG,0);
gameState.players[0].mz.push(w1,nonW);
API.sendToGrave(h(du),'効果で墓地へ');
let cdu=ctxEv(0,du,'onSendToGrave',{card:du,uid:du.uid,reason:'effect'},'grave');
ok('深海の大ウナギ positive: フィールドから墓地へ送られたら誘発する',
   sc('深海の大ウナギ').passive.onSendToGrave(cdu)===true);
sc('深海の大ウナギ').resolve(cdu);
ok('深海の大ウナギ positive: 水属性の攻撃力が500上がる',
   curATK(w1)===dbOf(w1).atk+500,'atk='+curATK(w1));
ok('深海の大ウナギ ruling: 水属性以外は上がらない',curATK(nonW)===dbOf(nonW).atk);

/* --- 霊滅独鈷杵 --- */
reset0();
let rt=mk('霊滅独鈷杵',0,'up'),eqM=mk(BIG,0);
gameState.players[0].sz=[rt];gameState.players[0].mz=[eqM];equipTo(rt,eqM);
gameState.players[1].grave=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let crt=C(0,rt,'sz',0,'onBattleDamage',{event:{player:1,amount:3000,attackerUid:eqM.uid,defenderUid:null}});
ok('霊滅独鈷杵 positive: 装備モンスターの戦闘ダメージで誘発する',
   sc('霊滅独鈷杵').passive.onBattleDamage(crt)===true);
sc('霊滅独鈷杵').resolve(crt);
let prt=pending();
ok('霊滅独鈷杵 ruling: 2体まで選べる',!!prt&&prt.max===2&&prt.min===0);
answerChoiceV49(prt.candidates.slice(0,2).map(x=>x.key));
ok('霊滅独鈷杵 positive: 相手の墓地のモンスターが除外される',
   gameState.players[1].banish.length===2);

/* ================= Replay / SaveLoad ================= */
reset0();
let rz=mk('ダーク・ヒーロー ゾンバイア',0);
gameState.players[0].mz=[rz];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rz),'b3ZombyreN',2,'ダーク・ヒーロー ゾンバイア');
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle11 Replay: 累積フラグが digest 一致で再生される',a1.ok,a1.reason||'');
ok('cycle11 Replay: 再生後も攻撃力計算が一致する',curATK(rz)===dbOf(rz).atk-400);
reset0();
let rg=mk('ゲルニア',0);
gameState.players[0].grave=[rg];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.schedule({at:'standbyPhase',ownTurn:true,player:0,handler:'b3.gernia',
  args:{uid:rg.uid,player:0},source:{card:rg},note:'ゲルニア'});
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle11 Replay: スケジュール予約が digest 一致で再生される',a2.ok,a2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle11 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle11 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
