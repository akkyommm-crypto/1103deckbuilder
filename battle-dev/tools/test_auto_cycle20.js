/* Auto cycle 20 — 15枚。除外コスト／アドバンス召喚 provenance。
   アドバンス召喚は engine の正規経路（NORMAL_SUMMON + p3Materials）で作る。 */
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
function pending(){return pendingChoiceV49(gameState);}
/* engine の正規経路でアドバンス召喚する。
   リリース対象を先に墓地へ送り、その uid を p3Materials として渡す。 */
function advanceSummon(p, name, tributes){
  const P=gameState.players[p];
  const card=mk(name,p); P.hand.push(card); ensureCardUid(gameState,card);
  const mats=tributes.map(c=>{ ensureCardUid(gameState,c); return {uid:c.uid}; });
  tributes.forEach(c=>{ const hh=locateCardAnyV4(c); if(hh&&hh.zone==='mz') API.sendToGrave(hh,'アドバンス召喚のリリース'); });
  gameState.deferredEvents=[];
  act({type:'NORMAL_SUMMON',player:p,handIndex:P.hand.indexOf(card),
       tributes:tributes.length,p3Materials:mats,p3SummonType:'tribute',prepaid:true});
  const evts=(gameState.deferredEvents||[]).slice(); gameState.deferredEvents=[];
  return {card, evts};
}
const PLAIN='ワイト';        /* 闇 アンデット lv1 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 */

const ALL=['ギョッ!','フレムベルカウンター','D・D・R','バーサーカークラッシュ','ファイヤー・ソウル',
 'レクンガ','スカイオニヒトクイエイ','フォーチュン・スリップ','エレメンタル・アブソーバー',
 '三連星のトリオン','スパウン・アリゲーター','ヘルフレイムエンペラー',
 '死霊操りしパペットマスター','混沌球体'];
ALL.forEach(n=>ok('cycle20 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle20 枚数は14',ALL.length===14);
ok('cycle20 SKIP: タン・ツイスターは未実装（summonProvenance が領域ローカルで墓地に残らない）',
   !CARD_SCRIPTS['タン・ツイスター']);

/* ============ 前提: アドバンス召喚の provenance ============ */
reset0();
let trib1=mk(PLAIN,0),trib2=mk(PLAIN,0);
gameState.players[0].mz=[trib1,trib2];
let adv=advanceSummon(0,'タン・ツイスター',[trib1,trib2]);
ok('前提: アドバンス召喚したカードが場に出る',
   gameState.players[0].mz.some(c=>c===adv.card),'p0mz='+gameState.players[0].mz.length);
ok('前提: summonProvenance.summonType が tribute になる',
   adv.card.summonProvenance&&adv.card.summonProvenance.summonType==='tribute',
   'prov='+JSON.stringify(adv.card.summonProvenance||null));
ok('前提: tributeCount が入る',Number(adv.card.tributeCount)===2,
   'tributeCount='+adv.card.tributeCount);
ok('前提: リリースされた側に usedAsMaterial が残る',
   trib1.usedAsMaterial&&trib1.usedAsMaterial.summonType==='tribute'
   &&trib1.usedAsMaterial.summonedUid===adv.card.uid,
   'used='+JSON.stringify(trib1.usedAsMaterial||null));
ok('前提: materialRefs でリリースしたモンスターを辿れる',
   Array.isArray(adv.card.summonProvenance.materialRefs)
   &&adv.card.summonProvenance.materialRefs.length===2);

/* ============ 三連星のトリオン ============ */
reset0();
let tr=mk('三連星のトリオン',0),tr2=mk(PLAIN,0);
gameState.players[0].mz=[tr,tr2];
let adv2=advanceSummon(0,BIG,[tr,tr2]);
let ctr=ctxEv(0,tr,'onSendToGrave',{},'grave');
ok('三連星のトリオン positive: アドバンス召喚のリリースで墓地へ行って誘発する',
   sc('三連星のトリオン').passive.onSendToGrave(ctr)===true);
sc('三連星のトリオン').resolve(ctr);
ok('三連星のトリオン positive: エンドフェイズの特殊召喚が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c9.trion'));
let trSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c9.trion');
scheduleHandlerV7('c9.trion')(trSch.args||{}, trSch);
ok('三連星のトリオン positive: 予約が解決すると墓地から特殊召喚される',
   gameState.players[0].mz.some(c=>c===tr),'p0mz='+gameState.players[0].mz.length);
reset0();
let tr3=mk('三連星のトリオン',0);
gameState.players[0].mz=[tr3];
API.sendToGrave(h(tr3),'テスト：ただ墓地へ送る');
ok('三連星のトリオン negative: リリース以外の墓地送りでは発動できない',
   sc('三連星のトリオン').passive.onSendToGrave(ctxEv(0,tr3,'onSendToGrave',{},'grave'))===false);

/* ============ スパウン・アリゲーター ============ */
reset0();
let rep=mk('レプティレス・バイパー',0),rep2=mk(PLAIN,0);
gameState.players[0].mz=[rep,rep2];
let adv3=advanceSummon(0,'スパウン・アリゲーター',[rep,rep2]);
let csa=ctxEv(0,adv3.card,'onNormalSummon',{player:0,uids:[adv3.card.uid]},'mz');
ok('スパウン・アリゲーター positive: 爬虫類族をリリースしたアドバンス召喚で誘発する',
   sc('スパウン・アリゲーター').passive.onNormalSummon(csa)===true);
sc('スパウン・アリゲーター').selectTargets(csa,t=>{csa.selectedTargets=t;});
sc('スパウン・アリゲーター').resolve(csa);
ok('スパウン・アリゲーター positive: エンドフェイズの特殊召喚が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c9.spawnAlligator'));
let saSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c9.spawnAlligator');
scheduleHandlerV7('c9.spawnAlligator')(saSch.args||{}, saSch);
ok('スパウン・アリゲーター positive: リリースした爬虫類族が特殊召喚される',
   gameState.players[0].mz.some(c=>c===rep),'p0mz='+gameState.players[0].mz.length);
reset0();
let nr1=mk(PLAIN,0),nr2=mk(PLAIN,0);
gameState.players[0].mz=[nr1,nr2];
let adv4=advanceSummon(0,'スパウン・アリゲーター',[nr1,nr2]);
ok('スパウン・アリゲーター negative: 爬虫類族をリリースしていなければ発動できない',
   sc('スパウン・アリゲーター').passive.onNormalSummon(
     ctxEv(0,adv4.card,'onNormalSummon',{player:0,uids:[adv4.card.uid]},'mz'))===false);

/* ============ ヘルフレイムエンペラー ============ */
reset0();
let hf1=mk(PLAIN,0),hf2=mk(PLAIN,0);
gameState.players[0].mz=[hf1,hf2];
gameState.players[0].grave=[mk('フレムベル・ドラグノフ',0),mk('フレムベル・ドラグノフ',0)];
let adv5=advanceSummon(0,'ヘルフレイムエンペラー',[hf1,hf2]);
ok('ヘルフレイムエンペラー ruling: 特殊召喚できない宣言を持つ',
   sc('ヘルフレイムエンペラー').cannotSpecialSummon===true);
let chf=ctxEv(0,adv5.card,'onNormalSummon',{player:0,uids:[adv5.card.uid]},'mz');
ok('ヘルフレイムエンペラー positive: アドバンス召喚成功で誘発する',
   sc('ヘルフレイムエンペラー').passive.onNormalSummon(chf)===true);
sc('ヘルフレイムエンペラー').resolve(chf);
let phf=pending();
ok('ヘルフレイムエンペラー ruling: 除外できるのは最大5体まで',
   !!phf&&phf.max<=5&&phf.max===2,'max='+(phf&&phf.max));
answerChoiceV49(phf.candidates.slice(0,2).map(x=>x.key));
ok('ヘルフレイムエンペラー positive: 墓地の炎属性が除外される',
   gameState.players[0].banish.length===2&&gameState.players[0].grave.length===2,
   'banish='+gameState.players[0].banish.length);

/* ============ 死霊操りしパペットマスター ============ */
reset0();
let pm1=mk(PLAIN,0),pm2=mk(PLAIN,0);
gameState.players[0].mz=[pm1,pm2];
gameState.players[0].grave=[mk('デーモン・ソルジャー',0),mk('デーモン・ソルジャー',0)];
let adv6=advanceSummon(0,'死霊操りしパペットマスター',[pm1,pm2]);
let cpm=ctxEv(0,adv6.card,'onNormalSummon',{player:0,uids:[adv6.card.uid]},'mz');
ok('死霊操りしパペットマスター positive: アドバンス召喚成功で誘発する',
   sc('死霊操りしパペットマスター').passive.onNormalSummon(cpm)===true);
sc('死霊操りしパペットマスター').cost(cpm,()=>{});
sc('死霊操りしパペットマスター').selectTargets(cpm,t=>{cpm.selectedTargets=t;});
sc('死霊操りしパペットマスター').resolve(cpm);
ok('死霊操りしパペットマスター positive: 2000払って悪魔族2体が特殊召喚される',
   gameState.players[0].lp===8000-2000
   &&gameState.players[0].mz.filter(c=>dbOf(c).n==='デーモン・ソルジャー').length===2,
   'lp='+gameState.players[0].lp+' mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
let revived=gameState.players[0].mz.find(c=>dbOf(c).n==='デーモン・ソルジャー');
ok('死霊操りしパペットマスター ruling: 特殊召喚したモンスターはこのターン攻撃できない',
   cannotAttackNow(revived)===true);
gameState.turn=gameState.turn+1;
ok('死霊操りしパペットマスター ruling: 次のターンは攻撃できる',
   cannotAttackNow(revived)===false);

/* ============ 混沌球体 ============ */
reset0();
let ko1=mk(PLAIN,0),ko2=mk(PLAIN,0);
gameState.players[0].mz=[ko1,ko2];
gameState.players[0].deck=[mk('電磁ミノ虫',0),mk(BIG,0)];   /* レベル3 */
let adv7=advanceSummon(0,'混沌球体',[ko1,ko2]);
ok('混沌球体 positive: 表側表示の間は光属性としても扱う',
   currentAttributeV17(adv7.card)==='光','attr='+currentAttributeV17(adv7.card));
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
ok('混沌球体 positive: 1ターンに1度だけ戦闘では破壊されない',!!battleProt(adv7.card));
ok('混沌球体 ruling: 2回目は守られない',!battleProt(adv7.card));
let cko=ctxEv(0,adv7.card,'onNormalSummon',{player:0,uids:[adv7.card.uid]},'mz');
ok('混沌球体 positive: アドバンス召喚成功で誘発する',
   sc('混沌球体').passive.onNormalSummon(cko)===true);
sc('混沌球体').selectTargets(cko,t=>{cko.selectedTargets=t;});
sc('混沌球体').resolve(cko);
ok('混沌球体 positive: デッキのレベル3モンスターが手札に加わる',
   gameState.players[0].hand.some(c=>Number(dbOf(c).lv)===3),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));

/* ============ ギョッ! ============ */
reset0();
let gy=mk('ギョッ!',0,'down'),foeMon=mk(BIG,1);
gameState.players[0].sz=[gy];gameState.players[1].mz=[foeMon];
gameState.players[0].banish=[mk('サウザンド・アイズ・フィッシュ',0)];
ensureCardUid(gameState,foeMon);
let evGy={uid:foeMon.uid,player:1,kind:'monster',cardId:foeMon.id};
let cgy=ctxEv(0,gy,'onActivateSuccess',evGy,'sz');
ok('ギョッ! positive: 相手の効果モンスターの効果発動に反応する',
   sc('ギョッ!').passive.onActivateSuccess(cgy)===true);
let deckB=gameState.players[0].deck.length;
sc('ギョッ!').selectTargets(cgy,t=>{cgy.selectedTargets=t;});
sc('ギョッ!').cost(cgy,()=>{});
ok('ギョッ! positive: 除外されている魚族がデッキに戻る',
   gameState.players[0].banish.length===0&&gameState.players[0].deck.length===deckB+1,
   'banish='+gameState.players[0].banish.length);
reset0();
let gy2=mk('ギョッ!',0,'down'),foeSp=mk('強欲な壺',1);
gameState.players[0].sz=[gy2];gameState.players[1].sz=[foeSp];
gameState.players[0].banish=[mk('サウザンド・アイズ・フィッシュ',0)];
ensureCardUid(gameState,foeSp);
ok('ギョッ! negative: 魔法の発動には反応しない',
   sc('ギョッ!').passive.onActivateSuccess(
     ctxEv(0,gy2,'onActivateSuccess',{uid:foeSp.uid,player:1,kind:'spell',cardId:foeSp.id},'sz'))===false);

/* ============ フレムベルカウンター ============ */
reset0();
let fc=mk('フレムベルカウンター',0,'down'),foeSp2=mk('強欲な壺',1);
gameState.players[0].sz=[fc];gameState.players[1].sz=[foeSp2];
gameState.players[0].grave=[mk('フレムベル・ドラグノフ',0)];  /* 炎属性 DEF200 */
ensureCardUid(gameState,foeSp2);
let cfc=ctxEv(0,fc,'onActivateSuccess',{uid:foeSp2.uid,player:1,kind:'spell',cardId:foeSp2.id},'sz');
ok('フレムベルカウンター positive: 相手の魔法発動に反応する',
   sc('フレムベルカウンター').passive.onActivateSuccess(cfc)===true);
sc('フレムベルカウンター').selectTargets(cfc,t=>{cfc.selectedTargets=t;});
sc('フレムベルカウンター').cost(cfc,()=>{});
ok('フレムベルカウンター positive: 墓地の炎属性が除外される',
   gameState.players[0].banish.length===1&&gameState.players[0].grave.length===0);
reset0();
let fc2=mk('フレムベルカウンター',0,'down'),foeSp3=mk('強欲な壺',1);
gameState.players[0].sz=[fc2];gameState.players[1].sz=[foeSp3];
gameState.players[0].grave=[mk(BIG,0)];   /* 守備力2500 */
ensureCardUid(gameState,foeSp3);
ok('フレムベルカウンター negative: 守備力200の炎属性が墓地に無ければ発動できない',
   sc('フレムベルカウンター').passive.onActivateSuccess(
     ctxEv(0,fc2,'onActivateSuccess',{uid:foeSp3.uid,player:1,kind:'spell',cardId:foeSp3.id},'sz'))===false);

/* ============ D・D・R ============ */
reset0();
let ddr=mk('D・D・R',0,'up'),banished=mk(BIG,0);
gameState.players[0].sz=[ddr];gameState.players[0].banish=[banished];
gameState.players[0].hand=[mk(PLAIN,0)];
ensureCardUid(gameState,ddr);ensureCardUid(gameState,banished);
let cddr=C(0,ddr,'sz',0);
ok('D・D・R positive: 手札と除外モンスターがあれば発動できる',
   sc('D・D・R').condition(cddr)===true,cddr.reason||'');
sc('D・D・R').selectTargets(cddr,t=>{cddr.selectedTargets=t;});
sc('D・D・R').cost(cddr,()=>{});
sc('D・D・R').resolve(cddr);
ok('D・D・R positive: 除外モンスターが攻撃表示で特殊召喚される',
   gameState.players[0].mz.some(c=>c===banished)&&banished.pos==='atk',
   'p0mz='+gameState.players[0].mz.length);
ok('D・D・R positive: このカードが装備される',
   !!ddr.equipTo&&ddr.equipTo.uid===banished.uid,'equipTo='+JSON.stringify(ddr.equipTo||null));
ok('D・D・R ruling: 生存リンクが張られる',
   !!banished.linkV9&&Array.isArray(banished.linkV9.watch)
   &&banished.linkV9.watch.some(w=>w.onGone==='destroy'));
API.destroy(h(ddr),'テスト：D・D・R を破壊',1);
ok('D・D・R ruling: このカードが離れると特殊召喚したモンスターが破壊される',
   !gameState.players[0].mz.some(c=>c===banished),'p0mz='+gameState.players[0].mz.length);

/* ============ バーサーカークラッシュ ============ */
reset0();
let bc=mk('バーサーカークラッシュ',0),hane=mk('ハネクリボー',0);
gameState.players[0].sz=[bc];gameState.players[0].mz=[hane];
gameState.players[0].grave=[mk(BIG,0)];
let cbc=C(0,bc,'sz',0);
ok('バーサーカークラッシュ positive: 墓地のモンスターと「ハネクリボー」があれば発動できる',
   sc('バーサーカークラッシュ').condition(cbc)===true,cbc.reason||'');
sc('バーサーカークラッシュ').selectTargets(cbc,t=>{cbc.selectedTargets=t;});
sc('バーサーカークラッシュ').resolve(cbc);
ok('バーサーカークラッシュ positive: 除外したモンスターと同じ攻守になる',
   curATK(hane)===3000&&curDEF(hane)===2500,
   'atk='+curATK(hane)+' def='+curDEF(hane));
reset0();
let bc2=mk('バーサーカークラッシュ',0);
gameState.players[0].sz=[bc2];gameState.players[0].mz=[mk(PLAIN,0)];
gameState.players[0].grave=[mk(BIG,0)];
ok('バーサーカークラッシュ negative: 「ハネクリボー」がいなければ発動できない',
   sc('バーサーカークラッシュ').condition(C(0,bc2,'sz',0))===false);

/* ============ ファイヤー・ソウル ============ */
reset0();
let fs2=mk('ファイヤー・ソウル',0),myMon=mk(PLAIN,0);
gameState.players[0].sz=[fs2];gameState.players[0].mz=[myMon];
gameState.players[0].deck=[mk('ジェネクス・ヒート',0)];   /* 炎族 ATK2000・TESTED */
gameState.players[1].deck=[mk(PLAIN,1)];
let cfs=C(0,fs2,'sz',0);
ok('ファイヤー・ソウル positive: デッキに炎族がいれば発動できる',
   sc('ファイヤー・ソウル').condition(cfs)===true,cfs.reason||'');
let lpB=gameState.players[1].lp;
sc('ファイヤー・ソウル').selectTargets(cfs,t=>{cfs.selectedTargets=t;});
sc('ファイヤー・ソウル').resolve(cfs);
ok('ファイヤー・ソウル positive: 相手が1枚ドローする',
   gameState.players[1].hand.length===1);
ok('ファイヤー・ソウル positive: 除外した炎族の攻撃力の半分のダメージ',
   gameState.players[1].lp===lpB-1000,'lp='+gameState.players[1].lp);
ok('ファイヤー・ソウル ruling: 発動ターン、自分は攻撃宣言できない',
   cannotAttackNow(myMon)===true);
gameState.turn=gameState.turn+1;
ok('ファイヤー・ソウル ruling: 次のターンは攻撃できる',cannotAttackNow(myMon)===false);

/* ============ レクンガ ============ */
reset0();
let rk=mk('レクンガ',0),w1=mk('サウザンド・アイズ・フィッシュ',0),w2=mk('サウザンド・アイズ・フィッシュ',0);
gameState.players[0].mz=[rk];gameState.players[0].grave=[w1,w2];
[w1,w2].forEach(c=>ensureCardUid(gameState,c));
API.banish(h(w1),'テスト除外'); API.banish(h(w2),'テスト除外');
let crk=ctxEv(0,rk,'onRemove',{player:0,uids:[w1.uid,w2.uid]},'mz');
ok('レクンガ positive: 墓地の水属性2体が除外されて誘発する',
   sc('レクンガ').passive.onRemove(crk)===true);
sc('レクンガ').resolve(crk);
ok('レクンガ positive: 「レクンガトークン」が特殊召喚される',
   gameState.players[0].mz.some(c=>cardName(c)==='レクンガトークン'),
   'p0mz='+gameState.players[0].mz.map(c=>cardName(c)).join(','));
reset0();
let rk2=mk('レクンガ',0),w3=mk('サウザンド・アイズ・フィッシュ',0);
gameState.players[0].mz=[rk2];gameState.players[0].grave=[w3];
ensureCardUid(gameState,w3);
API.banish(h(w3),'テスト除外');
ok('レクンガ negative: 1体だけの除外では誘発しない',
   sc('レクンガ').passive.onRemove(ctxEv(0,rk2,'onRemove',{player:0,uids:[w3.uid]},'mz'))===false);

/* ============ スカイオニヒトクイエイ ============ */
reset0();
let so=mk('スカイオニヒトクイエイ',0);
gameState.players[0].mz=[so];ensureCardUid(gameState,so);
ok('スカイオニヒトクイエイ ruling: 直接攻撃できる宣言を持つ',
   sc('スカイオニヒトクイエイ').canDirectAttack===true);
gameState.battlePhaseV6={attacks:[{attackerUid:so.uid,defenderUid:null,player:0}]};
let cso=ctxEv(0,so,'onBattlePhaseEnd',{player:0,turn:gameState.turn},'mz');
ok('スカイオニヒトクイエイ positive: 直接攻撃したバトルフェイズ終了時に誘発する',
   sc('スカイオニヒトクイエイ').passive.onBattlePhaseEnd(cso)===true);
sc('スカイオニヒトクイエイ').resolve(cso);
ok('スカイオニヒトクイエイ positive: ゲームから除外される',
   gameState.players[0].banish.some(c=>c===so)&&gameState.players[0].mz.length===0);
ok('スカイオニヒトクイエイ ruling: 次の自分のスタンバイの帰還が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c9.skyRay'&&s.at==='standbyPhase'));
let soSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c9.skyRay');
scheduleHandlerV7('c9.skyRay')(soSch.args||{}, soSch);
ok('スカイオニヒトクイエイ ruling: 予約が解決するとフィールドに戻る',
   gameState.players[0].mz.some(c=>c===so));
reset0();
let so2=mk('スカイオニヒトクイエイ',0),foeM=mk(PLAIN,1);
gameState.players[0].mz=[so2];gameState.players[1].mz=[foeM];
ensureCardUid(gameState,so2);ensureCardUid(gameState,foeM);
gameState.battlePhaseV6={attacks:[{attackerUid:so2.uid,defenderUid:foeM.uid,player:0}]};
ok('スカイオニヒトクイエイ negative: 直接攻撃でなければ誘発しない',
   sc('スカイオニヒトクイエイ').passive.onBattlePhaseEnd(
     ctxEv(0,so2,'onBattlePhaseEnd',{player:0,turn:gameState.turn},'mz'))===false);

/* ============ フォーチュン・スリップ ============ */
reset0();
let fsl=mk('フォーチュン・スリップ',0,'down'),myTarget=mk(PLAIN,0),foeAtk=mk(BIG,1);
gameState.players[0].sz=[fsl];gameState.players[0].mz=[myTarget];gameState.players[1].mz=[foeAtk];
ensureCardUid(gameState,myTarget);
gameState.pendingAttack={player:1,atkIdx:0,target:0};
let cfsl=C(0,fsl,'sz',0);
ok('フォーチュン・スリップ positive: 相手の攻撃宣言時に発動できる',
   sc('フォーチュン・スリップ').condition(cfsl)===true,cfsl.reason||'');
sc('フォーチュン・スリップ').resolve(cfsl);
ok('フォーチュン・スリップ positive: 攻撃が無効になる',gameState.attackNegated===true);
ok('フォーチュン・スリップ positive: 攻撃対象が除外される',
   gameState.players[0].banish.some(c=>c===myTarget)&&gameState.players[0].mz.length===0);
ok('フォーチュン・スリップ ruling: 次のスタンバイの帰還が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c9.fortuneSlip'));
let fslSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c9.fortuneSlip');
scheduleHandlerV7('c9.fortuneSlip')(fslSch.args||{}, fslSch);
ok('フォーチュン・スリップ ruling: 予約が解決するとフィールドに戻る',
   gameState.players[0].mz.some(c=>c===myTarget));
reset0();
let fsl2=mk('フォーチュン・スリップ',0,'down');
gameState.players[0].sz=[fsl2];
gameState.pendingAttack={player:0,atkIdx:0,target:0};   /* 自分の攻撃 */
ok('フォーチュン・スリップ negative: 自分の攻撃宣言時には発動できない',
   sc('フォーチュン・スリップ').condition(C(0,fsl2,'sz',0))===false);

/* ============ エレメンタル・アブソーバー ============ */
reset0();
let ea=mk('エレメンタル・アブソーバー',0,'up'),lightFoe=mk(BIG,1),darkFoe=mk(PLAIN,1);
gameState.players[0].sz=[ea];gameState.players[1].mz=[lightFoe,darkFoe];
gameState.players[0].hand=[mk(BIG,0)];   /* 光属性を除外する */
let cea=C(0,ea,'sz',0);
ok('エレメンタル・アブソーバー positive: 手札にモンスターがあれば発動できる',
   sc('エレメンタル・アブソーバー').condition(cea)===true,cea.reason||'');
sc('エレメンタル・アブソーバー').selectTargets(cea,t=>{cea.selectedTargets=t;});
sc('エレメンタル・アブソーバー').resolve(cea);
ok('エレメンタル・アブソーバー positive: 手札のモンスターが除外される',
   gameState.players[0].banish.length===1&&gameState.players[0].hand.length===0);
ok('エレメンタル・アブソーバー positive: 同じ属性（光）の相手モンスターは攻撃できない',
   cannotAttackNow(lightFoe)===true);
ok('エレメンタル・アブソーバー ruling: 異なる属性（闇）は攻撃できる',
   cannotAttackNow(darkFoe)===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('三連星のトリオン',0),ro2=mk('レクンガ',0),ro3=mk('スカイオニヒトクイエイ',0);
gameState.players[0].grave=[ro1];gameState.players[0].mz=[ro2,ro3];
[ro2,ro3].forEach(c=>ensureCardUid(gameState,c));
gameState.players[0].deck=[mk(PLAIN,0)];
gameState.battlePhaseV6={attacks:[]};
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('三連星のトリオン').passive.onSendToGrave(ctxEv(0,ro1,'onSendToGrave',{},'grave'));
sc('レクンガ').passive.onRemove(ctxEv(0,ro2,'onRemove',{player:0,uids:[]},'mz'));
sc('スカイオニヒトクイエイ').passive.onBattlePhaseEnd(
  ctxEv(0,ro3,'onBattlePhaseEnd',{player:0},'mz'));
ok('cycle20 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('エレメンタル・アブソーバー',0,'up');
gameState.players[0].sz=[rp1];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rp1),'c9AbsorbedAttr','光','エレメンタル・アブソーバー');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle20 Replay: 宣言した属性が digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('スカイオニヒトクイエイ',0);
gameState.players[0].mz=[rp2];ensureCardUid(gameState,rp2);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.schedule({at:'standbyPhase',ownTurn:true,player:0,handler:'c9.skyRay',
  args:{uid:rp2.uid,player:0},source:{card:rp2},note:'スカイオニヒトクイエイ'});
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle20 Replay: 帰還予約が digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle20 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle20 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
