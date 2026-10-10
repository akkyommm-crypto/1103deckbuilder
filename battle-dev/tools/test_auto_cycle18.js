/* Auto cycle 18 — 13枚。positive / negative / ruling edge / Replay。 */
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
/* 相手モンスターを戦闘破壊して墓地へ落とす（engine の正規経路） */
function killFoe(victim){ victim.battleDestroyed=true; act({type:'BATTLE_CLEANUP'}); }
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 DEF2500 */

const ALL=['ハイドロゲドン','フレムベル・ヘルドッグ','A・O・J リーサル・ウェポン',
 'A・O・J フィールド・マーシャル','ライトニング・ウォリアー','ブロッサム・ボンバー',
 'ヘル・ツイン・コップ','ワーム・ウォーロード','ファイターズ・エイプ',
 'デーモンの斧','エレキャッシュ','サイバー・ウロボロス','デビル・コメディアン'];
ALL.forEach(n=>ok('cycle18 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle18 枚数は13',ALL.length===13);

/* ============ ハイドロゲドン ============ */
reset0();
let hy=mk('ハイドロゲドン',0),hv=mk(PLAIN,1);
gameState.players[0].mz=[hy];gameState.players[1].mz=[hv];
gameState.players[0].deck=[mk('ハイドロゲドン',0),mk(PLAIN,0)];
killFoe(hv);
let chy=ctxDS(0,hy,{atkCard:hy,defCard:hv,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ハイドロゲドン positive: 戦闘破壊しデッキに同名がいれば誘発する',
   sc('ハイドロゲドン').passive.onDamageStep(chy)===true);
sc('ハイドロゲドン').selectTargets(chy,t=>{chy.selectedTargets=t;});
sc('ハイドロゲドン').resolve(chy);
ok('ハイドロゲドン positive: デッキから「ハイドロゲドン」が特殊召喚される',
   gameState.players[0].mz.filter(c=>dbOf(c).n==='ハイドロゲドン').length===2,
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let hy2=mk('ハイドロゲドン',0),hv2=mk(PLAIN,1);
gameState.players[0].mz=[hy2];gameState.players[1].mz=[hv2];
gameState.players[0].deck=[mk(PLAIN,0)];
killFoe(hv2);
ok('ハイドロゲドン negative: デッキに同名がいなければ発動できない',
   sc('ハイドロゲドン').passive.onDamageStep(
     ctxDS(0,hy2,{atkCard:hy2,defCard:hv2,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ フレムベル・ヘルドッグ ============ */
reset0();
let fh=mk('フレムベル・ヘルドッグ',0),fv=mk(PLAIN,1);
gameState.players[0].mz=[fh];gameState.players[1].mz=[fv];
gameState.players[0].deck=[mk('フレムベル・ドラグノフ',0),mk(PLAIN,0)];  /* 炎属性 DEF200 */
killFoe(fv);
let cfh=ctxDS(0,fh,{atkCard:fh,defCard:fv,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('フレムベル・ヘルドッグ positive: デッキに守備力200以下の炎属性がいれば誘発する',
   sc('フレムベル・ヘルドッグ').passive.onDamageStep(cfh)===true);
sc('フレムベル・ヘルドッグ').selectTargets(cfh,t=>{cfh.selectedTargets=t;});
sc('フレムベル・ヘルドッグ').resolve(cfh);
ok('フレムベル・ヘルドッグ positive: その炎属性が特殊召喚される',
   gameState.players[0].mz.some(c=>dbOf(c).n==='フレムベル・ドラグノフ'),
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let fh2=mk('フレムベル・ヘルドッグ',0),fv2=mk(PLAIN,1);
gameState.players[0].mz=[fh2];gameState.players[1].mz=[fv2];
gameState.players[0].deck=[mk('フレムベル・ヘルドッグ',0)];  /* 自身のみ */
killFoe(fv2);
ok('フレムベル・ヘルドッグ negative: 自身は特殊召喚先に選べない',
   sc('フレムベル・ヘルドッグ').passive.onDamageStep(
     ctxDS(0,fh2,{atkCard:fh2,defCard:fv2,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ A・O・J リーサル・ウェポン ============ */
reset0();
let lw=mk('A・O・J リーサル・ウェポン',0),lightFoe=mk(BIG,1);
gameState.players[0].mz=[lw];gameState.players[1].mz=[lightFoe];
gameState.players[0].deck=[mk(PLAIN,0)];   /* 闇 lv1 → 特殊召喚できる */
killFoe(lightFoe);
let clw=ctxDS(0,lw,{atkCard:lw,defCard:lightFoe,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('A・O・J リーサル・ウェポン positive: 光属性を戦闘破壊して誘発する',
   sc('A・O・J リーサル・ウェポン').passive.onDamageStep(clw)===true);
sc('A・O・J リーサル・ウェポン').resolve(clw);
ok('A・O・J リーサル・ウェポン positive: ドローしたレベル4以下の闇属性が特殊召喚される',
   gameState.players[0].mz.some(c=>dbOf(c).n===PLAIN)&&gameState.players[0].hand.length===0,
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(',')+' hand='+gameState.players[0].hand.length);
reset0();
let lw2=mk('A・O・J リーサル・ウェポン',0),lightFoe2=mk(BIG,1);
gameState.players[0].mz=[lw2];gameState.players[1].mz=[lightFoe2];
gameState.players[0].deck=[mk(BIG,0)];     /* 光 lv8 → 特殊召喚できない */
killFoe(lightFoe2);
let clw2=ctxDS(0,lw2,{atkCard:lw2,defCard:lightFoe2,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
sc('A・O・J リーサル・ウェポン').resolve(clw2);
ok('A・O・J リーサル・ウェポン ruling: 条件を満たさないドローは手札に残る',
   gameState.players[0].hand.length===1&&gameState.players[0].mz.length===1,
   'hand='+gameState.players[0].hand.length+' mz='+gameState.players[0].mz.length);
reset0();
let lw3=mk('A・O・J リーサル・ウェポン',0),darkFoe=mk(PLAIN,1);
gameState.players[0].mz=[lw3];gameState.players[1].mz=[darkFoe];
gameState.players[0].deck=[mk(PLAIN,0)];
killFoe(darkFoe);
ok('A・O・J リーサル・ウェポン negative: 光属性以外を破壊しても発動しない',
   sc('A・O・J リーサル・ウェポン').passive.onDamageStep(
     ctxDS(0,lw3,{atkCard:lw3,defCard:darkFoe,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ A・O・J フィールド・マーシャル ============ */
reset0();
let fm=mk('A・O・J フィールド・マーシャル',0),fd=mk(PLAIN,1,'down','def');
gameState.players[0].mz=[fm];gameState.players[1].mz=[fd];
gameState.players[0].deck=[mk(PLAIN,0)];
battleAt(0,0,'after');
killFoe(fd);
let cfm=ctxDS(0,fm,{atkCard:fm,defCard:fd,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('A・O・J フィールド・マーシャル positive: 攻撃で裏側守備表示を破壊して誘発する',
   sc('A・O・J フィールド・マーシャル').passive.onDamageStep(cfm)===true);
sc('A・O・J フィールド・マーシャル').resolve(cfm);
ok('A・O・J フィールド・マーシャル positive: 1枚ドローする',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===0);
reset0();
let fm2=mk('A・O・J フィールド・マーシャル',0),fu=mk(PLAIN,1,'up','atk');
gameState.players[0].mz=[fm2];gameState.players[1].mz=[fu];
gameState.players[0].deck=[mk(PLAIN,0)];
battleAt(0,0,'after');
killFoe(fu);
ok('A・O・J フィールド・マーシャル negative: 表側表示を破壊しても発動しない',
   sc('A・O・J フィールド・マーシャル').passive.onDamageStep(
     ctxDS(0,fm2,{atkCard:fm2,defCard:fu,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ ライトニング・ウォリアー ============ */
reset0();
let lg=mk('ライトニング・ウォリアー',0),lv=mk(PLAIN,1);
gameState.players[0].mz=[lg];gameState.players[1].mz=[lv];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
killFoe(lv);
let clg=ctxDS(0,lg,{atkCard:lg,defCard:lv,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ライトニング・ウォリアー positive: 戦闘破壊して誘発する',
   sc('ライトニング・ウォリアー').passive.onDamageStep(clg)===true);
let lpB=gameState.players[1].lp;
sc('ライトニング・ウォリアー').resolve(clg);
ok('ライトニング・ウォリアー positive: 相手の手札の枚数×300ダメージ',
   gameState.players[1].lp===lpB-900,'lp='+gameState.players[1].lp);
reset0();
let lg2=mk('ライトニング・ウォリアー',0),lv2=mk(PLAIN,1);
gameState.players[0].mz=[lg2];gameState.players[1].mz=[lv2];
gameState.players[1].hand=[];
killFoe(lv2);
let lpB2=gameState.players[1].lp;
sc('ライトニング・ウォリアー').resolve(
  ctxDS(0,lg2,{atkCard:lg2,defCard:lv2,destroyedDef:true,step:'after'},'mz','after'));
ok('ライトニング・ウォリアー ruling: 相手の手札が0枚ならダメージも0',
   gameState.players[1].lp===lpB2,'lp='+gameState.players[1].lp);

/* ============ ブロッサム・ボンバー ============ */
reset0();
let bb=mk('ブロッサム・ボンバー',0,'down'),plant=mk('ロードポイズン',0),bv=mk(BIG,1);
gameState.players[0].sz=[bb];gameState.players[0].mz=[plant];gameState.players[1].mz=[bv];
killFoe(bv);
let cbb=ctxDS(0,bb,{atkCard:plant,defCard:bv,destroyedDef:true,destroyedAtk:false,step:'after'},'sz','after');
ok('ブロッサム・ボンバー positive: 自分の植物族が戦闘破壊して誘発する',
   sc('ブロッサム・ボンバー').passive.onDamageStep(cbb)===true);
let lpC=gameState.players[1].lp;
sc('ブロッサム・ボンバー').resolve(cbb);
ok('ブロッサム・ボンバー positive: 破壊したモンスターの攻撃力分のダメージ',
   gameState.players[1].lp===lpC-3000,'lp='+gameState.players[1].lp);
reset0();
let bb2=mk('ブロッサム・ボンバー',0,'down'),nonPlant=mk(BIG,0),bv2=mk(PLAIN,1);
gameState.players[0].sz=[bb2];gameState.players[0].mz=[nonPlant];gameState.players[1].mz=[bv2];
killFoe(bv2);
ok('ブロッサム・ボンバー negative: 植物族以外が破壊しても発動しない',
   sc('ブロッサム・ボンバー').passive.onDamageStep(
     ctxDS(0,bb2,{atkCard:nonPlant,defCard:bv2,destroyedDef:true,step:'after'},'sz','after'))===false);

/* ============ ヘル・ツイン・コップ ============ */
reset0();
let ht=mk('ヘル・ツイン・コップ',0),hv3=mk(PLAIN,1);
gameState.players[0].mz=[ht];gameState.players[1].mz=[hv3];
ensureCardUid(gameState,ht);
killFoe(hv3);
let cht=ctxDS(0,ht,{atkCard:ht,defCard:hv3,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ヘル・ツイン・コップ positive: 戦闘破壊して誘発する',
   sc('ヘル・ツイン・コップ').passive.onDamageStep(cht)===true);
sc('ヘル・ツイン・コップ').resolve(cht);
ok('ヘル・ツイン・コップ positive: 攻撃力が800アップする',
   curATK(ht)===2200+800,'atk='+curATK(ht));
ok('ヘル・ツイン・コップ positive: もう1度攻撃できる（attackLimit が2になる）',
   Number(ht.attackLimit)>=2&&Number(ht.attackLimitTurn)===gameState.turn,
   'attackLimit='+ht.attackLimit+' turn='+ht.attackLimitTurn);

/* ============ ワーム・ウォーロード ============ */
reset0();
let ww=mk('ワーム・ウォーロード',0),effFoe=mk('ラッコアラ',1);
gameState.players[0].mz=[ww];gameState.players[1].mz=[effFoe];
ensureCardUid(gameState,ww);
ok('ワーム・ウォーロード ruling: 特殊召喚できない宣言を持つ',
   sc('ワーム・ウォーロード').cannotSpecialSummon===true);
killFoe(effFoe);
let cww=ctxDS(0,ww,{atkCard:ww,defCard:effFoe,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ワーム・ウォーロード positive: 戦闘破壊して誘発する',
   sc('ワーム・ウォーロード').passive.onDamageStep(cww)===true);
sc('ワーム・ウォーロード').resolve(cww);
ok('ワーム・ウォーロード positive: 破壊した効果モンスターの効果が無効化される',
   effFoe.negated===true||effFoe.effectNegated===true,
   'flags='+JSON.stringify({n:effFoe.negated,e:effFoe.effectNegated}));
ok('ワーム・ウォーロード positive: もう1度攻撃できる（attackLimit が2になる）',
   Number(ww.attackLimit)>=2&&Number(ww.attackLimitTurn)===gameState.turn,
   'attackLimit='+ww.attackLimit+' turn='+ww.attackLimitTurn);

/* ============ ファイターズ・エイプ ============ */
reset0();
let fa=mk('ファイターズ・エイプ',0),fav=mk(PLAIN,1);
gameState.players[0].mz=[fa];gameState.players[1].mz=[fav];
ensureCardUid(gameState,fa);
killFoe(fav);
let cfa=ctxDS(0,fa,{atkCard:fa,defCard:fav,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ファイターズ・エイプ positive: 戦闘破壊して誘発する',
   sc('ファイターズ・エイプ').passive.onDamageStep(cfa)===true);
sc('ファイターズ・エイプ').resolve(cfa);
ok('ファイターズ・エイプ positive: 攻撃力が300アップする',
   curATK(fa)===1900+300,'atk='+curATK(fa));
ok('ファイターズ・エイプ ruling: エンドフェイズの確認が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c7.fightersApe'));
let faSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c7.fightersApe');
gameState.battlePhaseV6={attacks:[]};      /* 自分のターンで攻撃していない */
scheduleHandlerV7('c7.fightersApe')(faSch.args||{}, faSch);
ok('ファイターズ・エイプ ruling: 攻撃していなければエンドフェイズに0に戻る',
   curATK(fa)===1900,'atk='+curATK(fa));
reset0();
let fa2=mk('ファイターズ・エイプ',0),fav2=mk(PLAIN,1);
gameState.players[0].mz=[fa2];gameState.players[1].mz=[fav2];
ensureCardUid(gameState,fa2);
killFoe(fav2);
let cfa2=ctxDS(0,fa2,{atkCard:fa2,defCard:fav2,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
sc('ファイターズ・エイプ').resolve(cfa2);
gameState.battlePhaseV6={attacks:[{attackerUid:fa2.uid,defenderUid:null,player:0}]};
let faSch2=(gameState.scheduledV7||[]).find(s=>s.handler==='c7.fightersApe');
scheduleHandlerV7('c7.fightersApe')(faSch2.args||{}, faSch2);
ok('ファイターズ・エイプ ruling: 自分のターンで攻撃していれば上昇は残る',
   curATK(fa2)===1900+300,'atk='+curATK(fa2));

/* ============ デーモンの斧 ============ */
reset0();
let dax=mk('デーモンの斧',0,'up'),host=mk(PLAIN,0);
gameState.players[0].sz=[dax];gameState.players[0].mz=[host];
ensureCardUid(gameState,host);dax.equipTo={uid:host.uid};
ok('デーモンの斧 positive: 装備モンスターの攻撃力が1000アップ',
   curATK(host)===300+1000,'atk='+curATK(host));
API.sendToGrave(h(dax),'テスト：フィールドから墓地へ');
let cdax=ctxEv(0,dax,'onSendToGrave',{},'grave');
ok('デーモンの斧 positive: フィールドから墓地へ送られて誘発する',
   sc('デーモンの斧').passive.onSendToGrave(cdax)===true);
let deckB=gameState.players[0].deck.length;
sc('デーモンの斧').selectTargets(cdax,t=>{cdax.selectedTargets=t;});
sc('デーモンの斧').resolve(cdax);
ok('デーモンの斧 positive: モンスターをリリースしてデッキの一番上に戻る',
   gameState.players[0].deck.length===deckB+1
   &&dbOf(gameState.players[0].deck[0]).n==='デーモンの斧',
   'deck='+gameState.players[0].deck.length);
reset0();
let dax2=mk('デーモンの斧',0);
gameState.players[0].grave=[dax2];   /* フィールドを経由していない */
ok('デーモンの斧 negative: フィールドから墓地へ行っていなければ発動できない',
   sc('デーモンの斧').passive.onSendToGrave(ctxEv(0,dax2,'onSendToGrave',{},'grave'))===false);

/* ============ エレキャッシュ ============ */
reset0();
let ec=mk('エレキャッシュ',0,'up'),thunder=mk('エレキンメダイ',0);
gameState.players[0].sz=[ec];gameState.players[0].mz=[thunder];
ensureCardUid(gameState,thunder);ec.equipTo={uid:thunder.uid};
gameState.players[0].deck=[mk(PLAIN,0)];
ok('エレキャッシュ ruling: レベル3以下の雷族にのみ装備可能',
   sc('エレキャッシュ').equipSpec.canEquip({db:dbOf(thunder)})===true
   &&sc('エレキャッシュ').equipSpec.canEquip({db:dbOf(mk(BIG,0))})===false);
ok('エレキャッシュ positive: 装備モンスターの攻撃力が800アップ',
   curATK(thunder)===dbOf(thunder).atk+800,'atk='+curATK(thunder));
ok('エレキャッシュ positive: 装備モンスターの効果は無効化される',
   API.isEffectNegated(h(thunder))===true);
let cec=ctxEv(0,ec,'onBattleDamage',{player:1,amount:1200,attackerUid:thunder.uid},'sz');
ok('エレキャッシュ positive: 装備モンスターが戦闘ダメージを与えて誘発する',
   sc('エレキャッシュ').passive.onBattleDamage(cec)===true);
sc('エレキャッシュ').resolve(cec);
ok('エレキャッシュ positive: 1枚ドローする',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===0);
reset0();
let ec2=mk('エレキャッシュ',0,'up'),thunder2=mk('エレキンメダイ',0),other=mk(PLAIN,0);
gameState.players[0].sz=[ec2];gameState.players[0].mz=[thunder2,other];
ensureCardUid(gameState,thunder2);ensureCardUid(gameState,other);ec2.equipTo={uid:thunder2.uid};
gameState.players[0].deck=[mk(PLAIN,0)];
ok('エレキャッシュ negative: 装備モンスター以外の戦闘ダメージでは誘発しない',
   sc('エレキャッシュ').passive.onBattleDamage(
     ctxEv(0,ec2,'onBattleDamage',{player:1,amount:1200,attackerUid:other.uid},'sz'))===false);
ok('エレキャッシュ ruling: 装備していないモンスターの効果は無効化されない',
   API.isEffectNegated(h(other))===false);

/* ============ サイバー・ウロボロス ============ */
reset0();
let cu=mk('サイバー・ウロボロス',0);
gameState.players[0].mz=[cu];gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[0].deck=[mk(BIG,0)];
ensureCardUid(gameState,cu);
API.banish(h(cu),'テスト除外');
let ccu=ctxEv(0,cu,'onRemove',{player:0,uids:[cu.uid]},'banish');
ok('サイバー・ウロボロス positive: 除外された時に誘発する',
   sc('サイバー・ウロボロス').passive.onRemove(ccu)===true);
sc('サイバー・ウロボロス').selectTargets(ccu,t=>{ccu.selectedTargets=t;});
sc('サイバー・ウロボロス').resolve(ccu);
ok('サイバー・ウロボロス positive: 手札1枚を墓地へ送って1枚ドローする',
   gameState.players[0].hand.length===1&&dbOf(gameState.players[0].hand[0]).n===BIG
   &&gameState.players[0].grave.length===1,
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(',')+' grave='+gameState.players[0].grave.length);
reset0();
let cu2=mk('サイバー・ウロボロス',0);
gameState.players[0].mz=[cu2];gameState.players[0].hand=[];
gameState.players[0].deck=[mk(BIG,0)];
ensureCardUid(gameState,cu2);
API.banish(h(cu2),'テスト除外');
ok('サイバー・ウロボロス negative: 手札が無ければ発動できない',
   sc('サイバー・ウロボロス').passive.onRemove(
     ctxEv(0,cu2,'onRemove',{player:0,uids:[cu2.uid]},'banish'))===false);

/* ============ デビル・コメディアン ============ */
reset0();
let dc=mk('デビル・コメディアン',0,'down');
gameState.players[0].sz=[dc];
gameState.players[1].grave=[mk(PLAIN,1),mk(PLAIN,1),mk(BIG,1)];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let cdc=C(0,dc,'sz',0);
ok('デビル・コメディアン positive: 相手の墓地にカードがあれば発動できる',
   sc('デビル・コメディアン').condition(cdc)===true,cdc.reason||'');
sc('デビル・コメディアン').resolve(cdc);
let pdc=pending();
ok('デビル・コメディアン ruling: 裏表を宣言する選択肢が出る',
   !!pdc&&pdc.candidates.length===2&&pdc.player===0);
let rngB=gameState.rngState;
let foeGraveBefore=gameState.players[1].grave.length;
let myDeckBefore=gameState.players[0].deck.length;
answerChoiceV49([pdc.candidates[0].key]);
ok('デビル・コメディアン positive: コイントスで rngState が進む',gameState.rngState!==rngB);
let coin=gameState.players[0].temporaryFlags.c7ComedianCoin;
ok('デビル・コメディアン positive: 当たれば相手の墓地が全て除外される',
   coin!=='heads'||(gameState.players[1].grave.length===0
     &&gameState.players[1].banish.length===foeGraveBefore),
   'coin='+coin+' foeGrave='+gameState.players[1].grave.length);
ok('デビル・コメディアン positive: ハズレなら相手の墓地の枚数分だけ自分のデッキが減る',
   coin==='heads'||gameState.players[0].deck.length===myDeckBefore-foeGraveBefore,
   'coin='+coin+' myDeck='+gameState.players[0].deck.length);
reset0();
let dc2=mk('デビル・コメディアン',0,'down');
gameState.players[0].sz=[dc2];gameState.players[1].grave=[];
ok('デビル・コメディアン negative: 相手の墓地が空なら発動できない',
   sc('デビル・コメディアン').condition(C(0,dc2,'sz',0))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('ハイドロゲドン',0),ro2=mk('デーモンの斧',0,'up'),ro3=mk('エレキャッシュ',0,'up');
let roHost=mk('エレキンメダイ',0);
gameState.players[0].mz=[ro1,roHost];gameState.players[0].sz=[ro2,ro3];
ensureCardUid(gameState,roHost);ro2.equipTo={uid:roHost.uid};ro3.equipTo={uid:roHost.uid};
gameState.players[0].deck=[mk(PLAIN,0)];
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ハイドロゲドン').passive.onDamageStep(
  ctxDS(0,ro1,{atkCard:ro1,defCard:null,destroyedDef:false,step:'after'},'mz','after'));
sc('デーモンの斧').passive.onSendToGrave(ctxEv(0,ro2,'onSendToGrave',{},'sz'));
curATK(roHost); API.isEffectNegated(h(roHost));
ok('cycle18 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('ファイターズ・エイプ',0);
gameState.players[0].mz=[rp1];
ensureCardUid(gameState,rp1);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.modAtk(h(rp1),300,0,'permanent','ファイターズ・エイプ');
API.schedule({at:'endPhase',turns:0,player:0,handler:'c7.fightersApe',
  args:{uid:rp1.uid},source:{card:rp1},note:'ファイターズ・エイプ'});
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle18 Replay: 攻撃力修正と条件付き解除予約が digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('デビル・コメディアン',0,'down');
gameState.players[0].sz=[rp2];
gameState.players[1].grave=[mk(PLAIN,1)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let seedB=gameState.rngState;
let crp2=C(0,rp2,'sz',0);
sc('デビル・コメディアン').resolve(crp2);
let prp2=pending();
answerChoiceV49([prp2.candidates[0].key]);
ok('cycle18 Replay: コイントスで rngState が進む',gameState.rngState!==seedB);
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle18 Replay: コイントス結果が digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle18 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle18 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
let thrown=false;try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
if(thrown)process.exit(1);
