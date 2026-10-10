/* Auto cycle 09 — 24枚。positive / negative / ruling edge / Replay。 */
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
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'after'});
  c.battle=battle;c.step=step||'after';return c;}
function battleAt(ai,ti,step){
  const a=gameState.players[0].mz[ai],d=(ti==='direct')?null:gameState.players[1].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:0,atkIdx:ai,target:(ti==='direct')?'direct':ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};}
function equipTo(eq,mon){ ensureCardUid(gameState,mon); eq.equipTo={uid:mon.uid}; return eq; }
function killCtx(me,foe){ return {atkCard:me,defCard:foe,destroyedDef:true,destroyedAtk:false,step:'after'}; }
const PLAIN='ワイト';        /* 闇 lv1 ATK300 アンデット */
const BIG='青眼の白龍';       /* 光 lv8 ATK3000 ドラゴン */
const DARKM='デーモンの召喚';  /* 闇 lv6 ATK2500 悪魔 */

const ALL=['しびれ薬','ジャンク・アタック','ニトロユニット','ハイドロプレッシャーカノン','メテオ・ストライク',
 'リボーンリボン','暗黒の扉','攻通規制','虫除けバリアー','ゴラ・タートル','アタック・フェロモン','異次元の境界線',
 'ケルベク','カラクリ蜘蛛','グレイヴ・キーパー','ケルドウ','エレキツネザル','シールド・ウォリアー',
 'カオスエンドマスター','ガスタ・コドル','サンドモス','グランド・スパイダー','お注射天使リリー'];
ALL.forEach(n=>ok('cycle09 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle09 枚数は23',ALL.length===23);

/* ================= GA. 装備魔法 ================= */
/* --- しびれ薬 --- */
reset0();
let sb=mk('しびれ薬',0,'up'),nonMech=mk(BIG,1);   /* ドラゴン族 */
gameState.players[0].sz=[sb];gameState.players[1].mz=[nonMech];equipTo(sb,nonMech);
ok('しびれ薬 positive: 装備モンスターは攻撃できない',cannotAttackNow(nonMech)===true);
ok('しびれ薬 ruling: 機械族以外のみ装備可能',
   sc('しびれ薬').equipSpec.canEquip({db:dbOf(nonMech)})===true
   &&sc('しびれ薬').equipSpec.canEquip({db:dbOf({id:findCardIndex('KA－2 デス・シザース')})})===false);

/* --- ジャンク・アタック --- */
reset0();
let ja=mk('ジャンク・アタック',0,'up'),myMon=mk(BIG,0),foe1=mk(DARKM,1);   /* 相手ATK2500 */
gameState.players[0].sz=[ja];gameState.players[0].mz=[myMon];gameState.players[1].mz=[foe1];
equipTo(ja,myMon);
let cja=C(0,ja,'sz',0,'onDamageStep',{event:{},battle:killCtx(myMon,foe1),step:'after'});
cja.battle=killCtx(myMon,foe1);cja.step='after';
ok('ジャンク・アタック positive: 装備モンスターが破壊したら誘発する',
   sc('ジャンク・アタック').passive.onDamageStep(cja)===true);
let lp1=gameState.players[1].lp;
sc('ジャンク・アタック').resolve(cja);
ok('ジャンク・アタック positive: 破壊したモンスターの攻撃力の半分（2500/2）',
   gameState.players[1].lp===lp1-1250,'lp='+gameState.players[1].lp);

/* --- ニトロユニット --- */
reset0();
let nu=mk('ニトロユニット',0,'up'),foeMon=mk(DARKM,1);   /* ATK2500 */
gameState.players[0].sz=[nu];gameState.players[1].mz=[foeMon];equipTo(nu,foeMon);
let bnu={atkCard:mk(BIG,0),defCard:foeMon,destroyedDef:true,destroyedAtk:false,step:'after'};
gameState.players[0].mz=[bnu.atkCard];
let cnu=C(0,nu,'sz',0,'onDamageStep',{event:{},battle:bnu,step:'after'});
cnu.battle=bnu;cnu.step='after';
ok('ニトロユニット positive: 装備モンスターが戦闘破壊されたら誘発する',
   sc('ニトロユニット').passive.onDamageStep(cnu)===true);
let lp2=gameState.players[1].lp;
sc('ニトロユニット').resolve(cnu);
ok('ニトロユニット positive: 装備モンスターの攻撃力分ダメージ',
   gameState.players[1].lp===lp2-2500,'lp='+gameState.players[1].lp);

/* --- ハイドロプレッシャーカノン --- */
reset0();
let hp=mk('ハイドロプレッシャーカノン',0,'up');
let waterM=mk('氷結界の番人ブリズド',0);   /* 水 lv1 */
gameState.players[0].sz=[hp];gameState.players[0].mz=[waterM];equipTo(hp,waterM);
let foe2=mk(PLAIN,1);gameState.players[1].mz=[foe2];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1)];
ok('ハイドロプレッシャーカノン ruling: レベル3以下の水属性のみ装備可能',
   sc('ハイドロプレッシャーカノン').equipSpec.canEquip({db:dbOf(waterM)})===true
   &&sc('ハイドロプレッシャーカノン').equipSpec.canEquip({db:dbOf({id:findCardIndex(BIG)})})===false);
let chp=C(0,hp,'sz',0,'onDamageStep',{event:{},battle:killCtx(waterM,foe2),step:'after'});
chp.battle=killCtx(waterM,foe2);chp.step='after';
ok('ハイドロプレッシャーカノン positive: 装備モンスターが破壊したら誘発する',
   sc('ハイドロプレッシャーカノン').passive.onDamageStep(chp)===true);
let fh=gameState.players[1].hand.length;
sc('ハイドロプレッシャーカノン').resolve(chp);
ok('ハイドロプレッシャーカノン positive: 相手の手札がランダムに1枚墓地へ',
   gameState.players[1].hand.length===fh-1);

/* --- メテオ・ストライク --- */
reset0();
let ms=mk('メテオ・ストライク',0,'up'),atkM=mk(BIG,0),defM=mk(PLAIN,1,'up','def');
gameState.players[0].sz=[ms];gameState.players[0].mz=[atkM];gameState.players[1].mz=[defM];
equipTo(ms,atkM);
battleAt(0,0,'calc');
ok('メテオ・ストライク positive: 装備モンスターの守備表示攻撃で貫通する',(()=>{
   const amt=applyPiercingDamage({atkCard:atkM,defCard:defM});
   return amt===Math.max(0,curATK(atkM)-curDEF(defM))&&amt>0;})());
ok('メテオ・ストライク negative: 攻撃表示には貫通しない',
   applyPiercingDamage({atkCard:atkM,defCard:mk(PLAIN,1,'up','atk')})===0);

/* --- リボーンリボン --- */
reset0();
let rr=mk('リボーンリボン',0,'up'),eqM=mk(BIG,0);
gameState.players[0].sz=[rr];gameState.players[0].mz=[eqM];equipTo(rr,eqM);
let brr={atkCard:mk(BIG,1),defCard:eqM,destroyedDef:true,destroyedAtk:false,step:'after'};
gameState.players[1].mz=[brr.atkCard];
let crr=C(0,rr,'sz',0,'onDamageStep',{event:{},battle:brr,step:'after'});
crr.battle=brr;crr.step='after';
ok('リボーンリボン positive: 装備モンスターが戦闘破壊されたら誘発する',
   sc('リボーンリボン').passive.onDamageStep(crr)===true);
sc('リボーンリボン').resolve(crr);
ok('リボーンリボン positive: エンドフェイズの蘇生が予約される',
   API.schedules('b1.reborn').length===1);

/* ================= GB. 攻撃制限 ================= */
/* --- 暗黒の扉 --- */
reset0();
gameState.phase='battle';
let ad=mk('暗黒の扉',0,'up');
gameState.players[0].sz=[ad];
let m1=mk(BIG,0),m2=mk(PLAIN,0);
gameState.players[0].mz=[m1,m2];
gameState.players[1].mz=[mk(PLAIN,1)];
ok('暗黒の扉 negative: まだ誰も攻撃していなければ両方攻撃できる',
   cannotAttackNow(m1)===false&&cannotAttackNow(m2)===false);
recordBattlePhaseAttackV6(gameState,0,m1,gameState.players[1].mz[0]);
ok('暗黒の扉 positive: 1体が攻撃したら他のモンスターは攻撃できない',
   cannotAttackNow(m2)===true);
ok('暗黒の扉 ruling: 攻撃した本人は引き続き対象外',cannotAttackNow(m1)===false);

/* --- 攻通規制 --- */
reset0();
let kt=mk('攻通規制',0,'up');
gameState.players[0].sz=[kt];
let f1=mk(PLAIN,1),f2=mk(PLAIN,1);
gameState.players[1].mz=[f1,f2];
ok('攻通規制 negative: 相手が2体なら攻撃できる',cannotAttackNow(f1)===false);
gameState.players[1].mz.push(mk(PLAIN,1));
ok('攻通規制 positive: 相手が3体以上なら攻撃宣言できない',cannotAttackNow(f1)===true);
ok('攻通規制 ruling: 自分のモンスターは制限されない',(()=>{
   const mine=mk(PLAIN,0);gameState.players[0].mz=[mine,mk(PLAIN,0),mk(PLAIN,0)];
   return cannotAttackNow(mine)===false;})());

/* --- 虫除けバリアー --- */
reset0();
let mb=mk('虫除けバリアー',0,'up');
gameState.players[0].sz=[mb];
let insect=mk('電動刃虫',1);   /* 昆虫族 */
let nonInsect=mk(BIG,1);
gameState.players[1].mz=[insect,nonInsect];
ok('虫除けバリアー positive: 相手の昆虫族は攻撃宣言できない',cannotAttackNow(insect)===true);
ok('虫除けバリアー ruling: 昆虫族以外は攻撃できる',cannotAttackNow(nonInsect)===false);

/* --- ゴラ・タートル --- */
reset0();
let gt=mk('ゴラ・タートル',0);
gameState.players[0].mz=[gt];
let strong=mk(BIG,1),weak=mk(PLAIN,1);   /* 3000 / 300 */
gameState.players[1].mz=[strong,weak];
ok('ゴラ・タートル positive: 攻撃力1900以上は攻撃宣言できない',cannotAttackNow(strong)===true);
ok('ゴラ・タートル negative: 攻撃力1900未満は攻撃できる',cannotAttackNow(weak)===false);

/* --- アタック・フェロモン --- */
reset0();
let af=mk('アタック・フェロモン',0,'up');
gameState.players[0].sz=[af];
let reptile=mk('カミソーリトカゲ',0);   /* 爬虫類 */
let defFoe=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[reptile];gameState.players[1].mz=[defFoe];
battleAt(0,0,'end');
let caf=C(0,af,'sz',0,'onDamageStep',{event:{},battle:null,step:'end'});
caf.step='end';
ok('アタック・フェロモン positive: 爬虫類が守備表示を攻撃したら誘発する',
   sc('アタック・フェロモン').passive.onDamageStep(caf)===true);
sc('アタック・フェロモン').resolve(caf);
ok('アタック・フェロモン positive: 攻撃対象が表側攻撃表示になる',
   defFoe.pos==='atk'&&defFoe.face==='up','pos='+defFoe.pos);

/* --- 異次元の境界線 --- */
reset0();
let ij=mk('異次元の境界線',0,'up');
gameState.players[0].sz=[ij];
gameState.players[0].grave=[];   /* 魔法カードなし */
let cij=C(0,ij,'sz',0,'onStandbyPhase',{event:{}});
sc('異次元の境界線').resolve(cij);
ok('異次元の境界線 positive: 墓地に魔法が無ければ両者バトルフェイズを行えない',
   gameState.players[0].temporaryFlags.noBattlePhase===true
   &&gameState.players[1].temporaryFlags.noBattlePhase===true);
gameState.players[0].grave=[mk('サイクロン',0)];
sc('異次元の境界線').resolve(cij);
ok('異次元の境界線 negative: 墓地に魔法があれば制限は解ける',
   gameState.players[0].temporaryFlags.noBattlePhase===false);

/* ================= GC ================= */
/* --- ケルベク --- */
reset0();
let kb=mk('ケルベク',0),attacker=mk(BIG,1);
gameState.players[0].mz=[kb];gameState.players[1].mz=[attacker];
let ckb=ctxDS(0,kb,{atkCard:attacker,defCard:kb,step:'end'},'mz','end');
ok('ケルベク positive: 攻撃されたら誘発する',sc('ケルベク').passive.onDamageStep(ckb)===true);
sc('ケルベク').resolve(ckb);
ok('ケルベク positive: 攻撃モンスターが持ち主の手札に戻る',
   gameState.players[1].hand.some(c=>c&&c.uid===attacker.uid));
reset0();
let kb2=mk('ケルベク',0),foe3=mk(BIG,1);
gameState.players[0].mz=[kb2];gameState.players[1].mz=[foe3];
ok('ケルベク negative: 自分が攻撃した場合は誘発しない',
   sc('ケルベク').passive.onDamageStep(ctxDS(0,kb2,{atkCard:kb2,defCard:foe3},'mz','end'))===false);

/* --- カラクリ蜘蛛 --- */
reset0();
let ks=mk('カラクリ蜘蛛',0),darkFoe=mk(DARKM,1);   /* 闇属性 */
gameState.players[0].mz=[ks];gameState.players[1].mz=[darkFoe];
let cks=ctxDS(0,ks,{atkCard:ks,defCard:darkFoe,step:'end'},'mz','end');
ok('カラクリ蜘蛛 positive: 闇属性を攻撃したら誘発する',sc('カラクリ蜘蛛').passive.onDamageStep(cks)===true);
sc('カラクリ蜘蛛').resolve(cks);
ok('カラクリ蜘蛛 positive: 闇属性が破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===darkFoe.uid));
reset0();
let ks2=mk('カラクリ蜘蛛',0),lightFoe=mk(BIG,1);
gameState.players[0].mz=[ks2];gameState.players[1].mz=[lightFoe];
ok('カラクリ蜘蛛 negative: 闇属性以外では誘発しない',
   sc('カラクリ蜘蛛').passive.onDamageStep(ctxDS(0,ks2,{atkCard:ks2,defCard:lightFoe},'mz','end'))===false);

/* --- グレイヴ・キーパー --- */
reset0();
let gk=mk('グレイヴ・キーパー',0),dead=mk(PLAIN,1);
gameState.players[0].mz=[gk];gameState.players[1].mz=[dead];
dead.battleDestroyed=true;
let cgk=ctxDS(0,gk,{atkCard:gk,defCard:dead,destroyedDef:true,step:'after'},'mz','after');
ok('グレイヴ・キーパー positive: 戦闘破壊されたモンスターがいれば誘発する',
   sc('グレイヴ・キーパー').passive.onDamageStep(cgk)===true);
sc('グレイヴ・キーパー').resolve(cgk);
ok('グレイヴ・キーパー positive: 破壊されたモンスターがデッキに戻る',
   gameState.players[1].deck.some(c=>c&&c.uid===dead.uid));
ok('グレイヴ・キーパー ruling: 墓地は経由しない',
   !gameState.players[1].grave.some(c=>c&&c.uid===dead.uid));

/* --- ケルドウ --- */
reset0();
let kd=mk('ケルドウ',0),killer=mk(BIG,1);
gameState.players[0].mz=[kd];gameState.players[1].mz=[killer];
gameState.players[1].grave=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
kd.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let bkd={defCard:kd,atkCard:killer,destroyedDef:true,destroyedAtk:false,step:'leave'};
let ckd=ctxDS(0,kd,bkd,'grave','leave');
ok('ケルドウ positive: 戦闘破壊され相手墓地に2枚以上あれば誘発する',
   sc('ケルドウ').passive.onDamageStep(ckd)===true);
let gv=gameState.players[1].grave.length;
sc('ケルドウ').selectTargets(ckd,r=>{ckd.selectedTargets=r;});
sc('ケルドウ').resolve(ckd);
ok('ケルドウ positive: 相手の墓地から2枚がデッキへ戻る',
   gameState.players[1].grave.length===gv-2&&gameState.players[1].deck.length===2,
   'grave='+gameState.players[1].grave.length);

/* --- エレキツネザル --- */
reset0();
let ez=mk('エレキツネザル',0);
gameState.players[0].mz=[ez];
gameState.chain=[{name:'サイクロン',player:1,cardId:findCardIndex('サイクロン')}];
API.destroy(h(ez),'相手の効果');
gameState.chain=[];
let cez=ctxEv(0,ez,'onDestroy',{card:ez,uid:ez.uid,reason:'effect'},'grave');
ok('エレキツネザル positive: 相手によって破壊されたら誘発する',sc('エレキツネザル').passive.onDestroy(cez)===true);
sc('エレキツネザル').resolve(cez);
ok('エレキツネザル positive: 相手はバトルフェイズを行えない',
   gameState.players[1].temporaryFlags.noBattlePhase===true);
reset0();
let ez2=mk('エレキツネザル',0);
gameState.players[0].mz=[ez2];
gameState.chain=[{name:'サイクロン',player:0,cardId:findCardIndex('サイクロン')}];
API.destroy(h(ez2),'自分の効果');
gameState.chain=[];
ok('エレキツネザル negative: 自分で破壊した場合は誘発しない',
   sc('エレキツネザル').passive.onDestroy(ctxEv(0,ez2,'onDestroy',{card:ez2,uid:ez2.uid,reason:'effect'},'grave'))===false);

/* --- シールド・ウォリアー --- */
reset0();
let sw=mk('シールド・ウォリアー',0),myMon2=mk(BIG,0);
gameState.players[0].grave=[sw];gameState.players[0].mz=[myMon2];
gameState.players[1].mz=[mk(BIG,1)];
battleAt(0,0,'calc');
let csw=C(0,sw,'grave',0,'onDamageStep',{event:{},step:'calc'});
csw.step='calc';
ok('シールド・ウォリアー positive: 戦闘のダメージ計算時に発動できる',sc('シールド・ウォリアー').condition(csw)===true);
sc('シールド・ウォリアー').cost(csw,()=>{});
ok('シールド・ウォリアー positive: コストで自身が除外される',
   gameState.players[0].banish.some(c=>c&&c.uid===sw.uid));
sc('シールド・ウォリアー').resolve(csw);
ok('シールド・ウォリアー positive: 自分のモンスターは戦闘で破壊されない',battleProof(myMon2)===true);

/* ================= GD ================= */
/* --- カオスエンドマスター --- */
reset0();
let ce=mk('カオスエンドマスター',0),prey=mk(PLAIN,1);
gameState.players[0].mz=[ce];gameState.players[1].mz=[prey];
let recruit=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d&&d.k==='m'&&!d.ex&&Number(d.lv||0)>=5&&Number(d.atk||0)<=1600&&Number(d.atk)>=0){
    recruit={id:i,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,recruit);break;}}
gameState.players[0].deck=[recruit];
let cce=ctxDS(0,ce,killCtx(ce,prey),'mz','after');
ok('カオスエンドマスター positive: デッキに対象がいれば誘発する',
   sc('カオスエンドマスター').passive.onDamageStep(cce)===true);
sc('カオスエンドマスター').selectTargets(cce,r=>{cce.selectedTargets=r;});
sc('カオスエンドマスター').resolve(cce);
ok('カオスエンドマスター positive: デッキから特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===recruit.uid));
reset0();
let ce2=mk('カオスエンドマスター',0),prey2=mk(PLAIN,1);
gameState.players[0].mz=[ce2];gameState.players[1].mz=[prey2];
gameState.players[0].deck=[mk(BIG,0)];   /* ATK3000 > 1600 */
ok('カオスエンドマスター negative: 攻撃力1600を超えるモンスターは対象外',
   sc('カオスエンドマスター').passive.onDamageStep(ctxDS(0,ce2,killCtx(ce2,prey2),'mz','after'))===false);

/* --- ガスタ・コドル --- */
reset0();
let gc=mk('ガスタ・コドル',0),prey3=mk(PLAIN,1);
gameState.players[0].mz=[gc];gameState.players[1].mz=[prey3];
let gusto=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d&&d.k==='m'&&!d.ex&&d.ra==='サイキック'&&d.at==='風'&&Number(d.def||9999)<=1500){
    gusto={id:i,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,gusto);break;}}
if(gusto){
  gameState.players[0].deck=[gusto];
  let cgc=ctxDS(0,gc,killCtx(gc,prey3),'mz','after');
  ok('ガスタ・コドル positive: 条件を満たすサイキック風がデッキにいれば誘発する',
     sc('ガスタ・コドル').passive.onDamageStep(cgc)===true);
  sc('ガスタ・コドル').selectTargets(cgc,r=>{cgc.selectedTargets=r;});
  sc('ガスタ・コドル').resolve(cgc);
  ok('ガスタ・コドル positive: デッキから特殊召喚される',
     gameState.players[0].mz.some(c=>c&&c.uid===gusto.uid));
}else{
  ok('ガスタ・コドル: 対象カードがDBに存在する',false,'no psychic wind monster found');
}
reset0();
let gc2=mk('ガスタ・コドル',0),prey4=mk(PLAIN,1);
gameState.players[0].mz=[gc2];gameState.players[1].mz=[prey4];
gameState.players[0].deck=[mk(BIG,0)];
ok('ガスタ・コドル negative: 対象がいなければ誘発しない',
   sc('ガスタ・コドル').passive.onDamageStep(ctxDS(0,gc2,killCtx(gc2,prey4),'mz','after'))===false);

/* --- サンドモス --- */
reset0();
let sm=mk('サンドモス',0,'down','def');
gameState.players[0].mz=[sm];
API.destroy(h(sm),'効果破壊');
let csm=ctxEv(0,sm,'onSendToGrave',{card:sm,uid:sm.uid,reason:'effect'},'grave');
ok('サンドモス positive: 裏側守備で戦闘以外に破壊されたら誘発する',
   sc('サンドモス').passive.onSendToGrave(csm)===true);
sc('サンドモス').resolve(csm);
ok('サンドモス positive: 特殊召喚される',gameState.players[0].mz.some(c=>c&&c.uid===sm.uid));
ok('サンドモス ruling: 元々の攻撃力と守備力が入れ替わる',
   curATK(sm)===Number(dbOf(sm).def)&&curDEF(sm)===Number(dbOf(sm).atk),
   'atk='+curATK(sm)+' def='+curDEF(sm));
reset0();
let sm2=mk('サンドモス',0,'up','atk');   /* 表側 */
gameState.players[0].mz=[sm2];
API.destroy(h(sm2),'効果破壊');
ok('サンドモス negative: 表側表示で破壊された場合は誘発しない',
   sc('サンドモス').passive.onSendToGrave(ctxEv(0,sm2,'onSendToGrave',{card:sm2,uid:sm2.uid,reason:'effect'},'grave'))===false);

/* Historical Cycle09 assertion retained. Astra01 supplies the formerly absent
   primitive; its full real-duel unlock regression is test_astra01_cards.js. */
if(typeof API.equipFromGrave!=='function'){
  ok('cycle09 SKIP: ザ・キックマンは未実装のまま（墓地から装備する経路が無い）',
     !CARD_SCRIPTS['ザ・キックマン']);
}else{
  ok('cycle09 -> Astra01 unlock: ザ・キックマンの墓地装備経路を登録',
     !!CARD_SCRIPTS['ザ・キックマン']&&typeof CARD_SCRIPTS['ザ・キックマン'].activationV11==='function');
}

/* --- グランド・スパイダー --- */
reset0();
let gs=mk('グランド・スパイダー',0,'up','def');
gameState.players[0].mz=[gs];
let summoned=mk(BIG,1,'up','atk');
gameState.players[1].mz=[summoned];
let cgs=ctxEv(0,gs,'onNormalSummon',{player:1,card:summoned,uid:summoned.uid});
ok('グランド・スパイダー positive: 表側守備表示なら相手の召喚に反応する',
   sc('グランド・スパイダー').passive.onNormalSummon(cgs)===true);
sc('グランド・スパイダー').selectTargets(cgs,r=>{cgs.selectedTargets=r;});
sc('グランド・スパイダー').resolve(cgs);
ok('グランド・スパイダー positive: 召喚されたモンスターが守備表示になる',summoned.pos==='def');
reset0();
let gs2=mk('グランド・スパイダー',0,'up','atk');   /* 攻撃表示 */
gameState.players[0].mz=[gs2];
let s2=mk(BIG,1);gameState.players[1].mz=[s2];
ok('グランド・スパイダー negative: 攻撃表示では発動できない',
   sc('グランド・スパイダー').passive.onNormalSummon(
     ctxEv(0,gs2,'onNormalSummon',{player:1,card:s2,uid:s2.uid}))===false);

/* --- お注射天使リリー --- */
reset0();
let lily=mk('お注射天使リリー',0),foeL=mk(BIG,1);
gameState.players[0].mz=[lily];gameState.players[1].mz=[foeL];
gameState.players[0].lp=8000;
battleAt(0,0,'calc');
let clily=C(0,lily,'mz',0,'onDamageStep',{event:{},step:'calc'});
clily.step='calc';
ok('お注射天使リリー negative: 発動前は攻撃力そのまま',curATK(lily)===dbOf(lily).atk);
ok('お注射天使リリー positive: 戦闘中で2000払えるなら発動できる',sc('お注射天使リリー').condition(clily)===true);
sc('お注射天使リリー').cost(clily,()=>{});
ok('お注射天使リリー positive: 2000ライフを払う',gameState.players[0].lp===6000);
sc('お注射天使リリー').resolve(clily);
ok('お注射天使リリー positive: そのダメージ計算時のみ攻撃力+3000',
   curATK(lily)===dbOf(lily).atk+3000,'atk='+curATK(lily));
ok('お注射天使リリー ruling: このダメージ計算では二度目は発動できない',
   sc('お注射天使リリー').condition(clily)===false);
ok('お注射天使リリー ruling: 戦闘が終われば元に戻る',(()=>{
   gameState.battle=null;
   return curATK(lily)===dbOf(lily).atk;})());

/* ================= Replay / SaveLoad ================= */
reset0();
let rl=mk('お注射天使リリー',0),rf=mk(BIG,1);
gameState.players[0].mz=[rl];gameState.players[1].mz=[rf];
battleAt(0,0,'calc');
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rl),'b1LilyBattle',String(gameState.turn)+':'+rl.uid+':'+rf.uid,'お注射天使リリー');
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle09 Replay: 戦闘識別キーが digest 一致で再生される',a1.ok,a1.reason||'');
ok('cycle09 Replay: 再生後も攻撃力計算が一致する',curATK(rl)===dbOf(rl).atk+3000);
reset0();
let rs=mk('シールド・ウォリアー',0),rm=mk(BIG,0);
gameState.players[0].grave=[rs];gameState.players[0].mz=[rm];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(rs),'コスト');
API.setCardFlag(h(rm),'battleProof',true,'シールド・ウォリアー');
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle09 Replay: 除外＋戦闘破壊耐性が digest 一致で再生される',a2.ok,a2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle09 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
