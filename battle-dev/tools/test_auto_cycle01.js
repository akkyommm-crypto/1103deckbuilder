/* Auto cycle 01 — 27枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='battle';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function pickNamed(nm){API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===nm);cb(hit||list[0]);};}
/* onDamageStep 用 ctx（collectHandlers と同じ形で battle を渡す） */
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',
    {event:{},battle:battle,step:step||'leave'});
  c.battle=battle;c.step=step||'leave';return c;}
/* onBattleDamage 用 ctx */
function ctxBD(p,card,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onBattleDamage',{event:evt});
  c.event=evt;return c;}
/* 実際に戦闘破壊させて墓地へ送る（graveInfo を本物にする） */
function killByBattle(victim,killer,vp){
  victim.battleDestroyed=true;
  act({type:'BATTLE_CLEANUP'});
  return {defCard:victim,atkCard:killer,destroyedDef:true,destroyedAtk:false,
          player:vp===0?1:0,step:'leave'};
}
const PLAIN='ワイト';        /* lv1 地 */
const BIG='青眼の白龍';       /* lv8 光 */
const LIGHTM='E・HERO スパークマン'; /* 光 */
const DARKM='デーモンの召喚';   /* 闇 lv6 */
const BEAST4='キラー・トマト';  /* lv4 闇 植物 — 獣ではない */

/* ================= registration ================= */
const ALL=['氷結界の番人ブリズド','迷走悪魔','マイン・ゴーレム','ニュードリュア','フレムベル・パウン','モジャ',
 'サイレントアビス','シャインスピリッツ','ダークネスソウル','デスサイクロン','ヘルプロミネンス','A・ボム',
 'チェイス・スカッド','ドリルロイド','ズババナイト','忍者マスター SASUKE','ナノブレイカー','円盤闘士',
 '一刀両断侍','A・O・J コアデストロイ','BF－空風のジン','異次元の戦士','A・O・J アンノウン・クラッシャー',
 'ブラッド・サッカー','黒蠍盗掘団','ボルテック・コング','グラヴィティ・バインド－超重力の網－'];
ALL.forEach(n=>ok('cycle01 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle01 枚数は27',ALL.length===27);
ok('前提: 青眼の白龍は光属性レベル8',dbOf({id:findCardIndex(BIG)}).at==='光'&&dbOf({id:findCardIndex(BIG)}).lv===8);
ok('前提: ワイトは闇属性レベル1',dbOf({id:findCardIndex(PLAIN)}).at==='闇'&&dbOf({id:findCardIndex(PLAIN)}).lv===1);

/* ================= A. 戦闘破壊され墓地へ送られた時 ================= */

/* --- マイン・ゴーレム --- */
reset0();
let mg=mk('マイン・ゴーレム',0,'up','def'),atk1=mk(BIG,1);
gameState.players[0].mz=[mg];gameState.players[1].mz=[atk1];
let bt=killByBattle(mg,atk1,0);
let cmg=ctxDS(0,mg,bt,'grave');
ok('マイン・ゴーレム positive: 戦闘破壊で墓地へ行った時に誘発する',
   sc('マイン・ゴーレム').passive.onDamageStep(cmg)===true);
let lp1=gameState.players[1].lp;
sc('マイン・ゴーレム').resolve(cmg);
ok('マイン・ゴーレム positive: 相手ライフに500ダメージ',
   gameState.players[1].lp===lp1-500,'lp='+gameState.players[1].lp);
/* negative: 効果破壊では誘発しない */
reset0();
let mg2=mk('マイン・ゴーレム',0);gameState.players[0].mz=[mg2];
API.destroy(h(mg2),'効果破壊');
ok('マイン・ゴーレム negative: 効果破壊では誘発しない',
   sc('マイン・ゴーレム').passive.onDamageStep(ctxDS(0,mg2,{defCard:mg2,destroyedDef:false},'grave'))===false);
/* ruling: 場に残った（破壊されなかった）場合は誘発しない */
reset0();
let mg3=mk('マイン・ゴーレム',0);gameState.players[0].mz=[mg3];
ok('マイン・ゴーレム ruling: 破壊されなければ誘発しない',
   sc('マイン・ゴーレム').passive.onDamageStep(ctxDS(0,mg3,{defCard:mg3,destroyedDef:false},'mz'))===false);

/* --- 氷結界の番人ブリズド --- */
reset0();
let bz=mk('氷結界の番人ブリズド',0),ab=mk(BIG,1);
gameState.players[0].mz=[bz];gameState.players[1].mz=[ab];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
let btb=killByBattle(bz,ab,0);
let cbz=ctxDS(0,bz,btb,'grave');
ok('氷結界の番人ブリズド positive: 戦闘破壊で誘発する',sc('氷結界の番人ブリズド').passive.onDamageStep(cbz)===true);
let hand0=gameState.players[0].hand.length;
sc('氷結界の番人ブリズド').resolve(cbz);
ok('氷結界の番人ブリズド positive: 1枚ドローする',gameState.players[0].hand.length===hand0+1);
reset0();
let bz2=mk('氷結界の番人ブリズド',0),ab2=mk(BIG,1);
gameState.players[0].mz=[bz2];gameState.players[1].mz=[ab2];gameState.players[0].deck=[];
let btb2=killByBattle(bz2,ab2,0);
ok('氷結界の番人ブリズド negative: デッキが無ければ発動できない',
   sc('氷結界の番人ブリズド').passive.onDamageStep(ctxDS(0,bz2,btb2,'grave'))===false);

/* --- 迷走悪魔 --- */
reset0();
let md=mk('迷走悪魔',0),am=mk(BIG,1);
gameState.players[0].mz=[md];gameState.players[1].mz=[am];
gameState.players[0].lp=5000;gameState.players[1].lp=5000;
let btm=killByBattle(md,am,0);
let cmd=ctxDS(0,md,btm,'grave');
sc('迷走悪魔').resolve(cmd);
ok('迷走悪魔 positive: お互いが800回復する',
   gameState.players[0].lp===5800&&gameState.players[1].lp===5800,
   'p0='+gameState.players[0].lp+' p1='+gameState.players[1].lp);

/* --- ニュードリュア --- */
reset0();
let nd=mk('ニュードリュア',0),an=mk(BIG,1),bystander=mk(PLAIN,1);
gameState.players[0].mz=[nd];gameState.players[1].mz=[an,bystander];
let btn=killByBattle(nd,an,0);
let cnd=ctxDS(0,nd,btn,'grave');
ok('ニュードリュア positive: 戦闘破壊で誘発する',sc('ニュードリュア').passive.onDamageStep(cnd)===true);
pickNamed(PLAIN);
sc('ニュードリュア').selectTargets(cnd,r=>{cnd.selectedTargets=r;});
sc('ニュードリュア').resolve(cnd);
ok('ニュードリュア positive: 選んだモンスターを破壊する',
   !gameState.players[1].mz.some(c=>c&&c.uid===bystander.uid));
pickFirst();
reset0();
let nd2=mk('ニュードリュア',0),an2=mk(BIG,1);
gameState.players[0].mz=[nd2];gameState.players[1].mz=[an2];
let btn2=killByBattle(nd2,an2,0);
gameState.players[1].mz=[];   /* 破壊者も場を離れた状況 */
ok('ニュードリュア negative: フィールドにモンスターがいなければ発動できない',
   sc('ニュードリュア').passive.onDamageStep(ctxDS(0,nd2,btn2,'grave'))===false);

/* --- フレムベル・パウン（任意・守備力200） --- */
reset0();
let fp=mk('フレムベル・パウン',0),af=mk(BIG,1);
gameState.players[0].mz=[fp];gameState.players[1].mz=[af];
let def200=mk('フレムベル・パウン',0);      /* 守備力200 */
gameState.players[0].deck=[mk(BIG,0),def200];
let btf=killByBattle(fp,af,0);
let cfp=ctxDS(0,fp,btf,'grave');
ok('フレムベル・パウン positive: デッキに守備力200がいれば発動できる',
   sc('フレムベル・パウン').passive.onDamageStep(cfp)===true);
ok('フレムベル・パウン ruling: 候補は守備力200のモンスターだけ',(()=>{
   const q=API.pileCards(0,'deck',x=>x.db.k==='m'&&!x.db.ex&&Number(x.db.def)===200);
   return q.length===1&&q[0].card.uid===def200.uid;})());
sc('フレムベル・パウン').selectTargets(cfp,r=>{cfp.selectedTargets=r;});
sc('フレムベル・パウン').resolve(cfp);
ok('フレムベル・パウン positive: 守備力200のモンスターを手札に加える',
   gameState.players[0].hand.some(c=>c&&c.uid===def200.uid));
reset0();
let fp2=mk('フレムベル・パウン',0),af2=mk(BIG,1);
gameState.players[0].mz=[fp2];gameState.players[1].mz=[af2];
gameState.players[0].deck=[mk(BIG,0)];
let btf2=killByBattle(fp2,af2,0);
ok('フレムベル・パウン negative: 守備力200がデッキに無ければ発動できない',
   sc('フレムベル・パウン').passive.onDamageStep(ctxDS(0,fp2,btf2,'grave'))===false);

/* --- モジャ（墓地のレベル4獣族） --- */
reset0();
let mj=mk('モジャ',0),aj=mk(BIG,1);
gameState.players[0].mz=[mj];gameState.players[1].mz=[aj];
let beast=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d&&d.k==='m'&&d.ra==='獣'&&Number(d.lv)===4&&!d.ex){beast={id:i,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,beast);break;}}
gameState.players[0].grave=[beast];
let btj=killByBattle(mj,aj,0);
let cmj=ctxDS(0,mj,btj,'grave');
ok('モジャ positive: 墓地にレベル4の獣族がいれば発動できる',
   sc('モジャ').passive.onDamageStep(cmj)===true);
sc('モジャ').selectTargets(cmj,r=>{cmj.selectedTargets=r;});
sc('モジャ').resolve(cmj);
ok('モジャ positive: レベル4の獣族を手札に加える',
   gameState.players[0].hand.some(c=>c&&c.uid===beast.uid));
reset0();
let mj2=mk('モジャ',0),aj2=mk(BIG,1);
gameState.players[0].mz=[mj2];gameState.players[1].mz=[aj2];
gameState.players[0].grave=[mk(BEAST4,0)];
let btj2=killByBattle(mj2,aj2,0);
ok('モジャ negative: レベル4の獣族が墓地に無ければ発動できない',
   sc('モジャ').passive.onDamageStep(ctxDS(0,mj2,btj2,'grave'))===false);

/* --- 属性スイープ（サイレントアビス／シャインスピリッツ） --- */
reset0();
let sa=mk('サイレントアビス',0),asa=mk(BIG,1),water=mk('氷結界の番人ブリズド',0),landm=mk(PLAIN,1);
gameState.players[0].mz=[sa,water];gameState.players[1].mz=[asa,landm];
let bts=killByBattle(sa,asa,0);
let csa=ctxDS(0,sa,bts,'grave');
ok('サイレントアビス positive: 戦闘破壊で誘発する',sc('サイレントアビス').passive.onDamageStep(csa)===true);
sc('サイレントアビス').resolve(csa);
ok('サイレントアビス positive: 水属性以外は破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===asa.uid)&&!gameState.players[1].mz.some(c=>c&&c.uid===landm.uid));
ok('サイレントアビス ruling: 水属性は破壊されない',
   gameState.players[0].mz.some(c=>c&&c.uid===water.uid));
reset0();
let ss=mk('シャインスピリッツ',0),ass=mk(DARKM,1),lightKeep=mk(LIGHTM,1);
gameState.players[0].mz=[ss];gameState.players[1].mz=[ass,lightKeep];
let bts2=killByBattle(ss,ass,0);
let css=ctxDS(0,ss,bts2,'grave');
sc('シャインスピリッツ').resolve(css);
ok('シャインスピリッツ ruling: 光属性だけが残る',
   gameState.players[1].mz.some(c=>c&&c.uid===lightKeep.uid)&&
   !gameState.players[1].mz.some(c=>c&&c.uid===ass.uid));
/* 裏側表示は「表側表示で存在する」に含まれないので破壊されない */
reset0();
let ds=mk('ダークネスソウル',0),ads=mk(BIG,1),faceDown=mk(BIG,1,'down','def');
gameState.players[0].mz=[ds];gameState.players[1].mz=[ads,faceDown];
let bts3=killByBattle(ds,ads,0);
sc('ダークネスソウル').resolve(ctxDS(0,ds,bts3,'grave'));
ok('ダークネスソウル ruling: 裏側表示は「表側表示」に含まれないので闇属性以外でも残る',
   gameState.players[1].mz.some(c=>c&&c.uid===faceDown.uid));

/* --- A・ボム --- */
reset0();
let abm=mk('A・ボム',0),lightKiller=mk(BIG,1),extra1=mk(PLAIN,1);
gameState.players[0].mz=[abm];gameState.players[1].mz=[lightKiller,extra1];
let bta=killByBattle(abm,lightKiller,0);
let cab=ctxDS(0,abm,bta,'grave');
ok('A・ボム positive: 光属性との戦闘で破壊されたら発動できる',
   sc('A・ボム').passive.onDamageStep(cab)===true);
pickFirst();
sc('A・ボム').selectTargets(cab,r=>{cab.selectedTargets=r;});
ok('A・ボム positive: フィールドのカード2枚を選ぶ',(cab.selectedTargets||[]).length===2);
let fieldBefore=API.fieldCards({}).length;
sc('A・ボム').resolve(cab);
ok('A・ボム positive: 選んだ2枚が破壊される',API.fieldCards({}).length===fieldBefore-2);
reset0();
let abm2=mk('A・ボム',0),darkKiller=mk(DARKM,1),extra2=mk(PLAIN,1);
gameState.players[0].mz=[abm2];gameState.players[1].mz=[darkKiller,extra2];
let bta2=killByBattle(abm2,darkKiller,0);
ok('A・ボム negative: 光属性以外との戦闘では発動できない',
   sc('A・ボム').passive.onDamageStep(ctxDS(0,abm2,bta2,'grave'))===false);

/* --- チェイス・スカッド --- */
reset0();
let cs=mk('チェイス・スカッド',0),victimDef=mk(PLAIN,0,'up','def'),killer=mk(BIG,1);
gameState.players[0].mz=[cs,victimDef];gameState.players[1].mz=[killer];
let btc=killByBattle(victimDef,killer,0);
let ccs=ctxDS(0,cs,btc,'mz');
ok('チェイス・スカッド positive: 守備表示が戦闘破壊された時に誘発する',
   sc('チェイス・スカッド').passive.onDamageStep(ccs)===true);
let lpc=gameState.players[1].lp;
sc('チェイス・スカッド').resolve(ccs);
ok('チェイス・スカッド positive: 相手に500ダメージ',gameState.players[1].lp===lpc-500);
reset0();
let cs2=mk('チェイス・スカッド',0),victimAtk=mk(PLAIN,0,'up','atk'),killer2=mk(BIG,1);
gameState.players[0].mz=[cs2,victimAtk];gameState.players[1].mz=[killer2];
let btc2=killByBattle(victimAtk,killer2,0);
ok('チェイス・スカッド negative: 攻撃表示が破壊されても誘発しない',
   sc('チェイス・スカッド').passive.onDamageStep(ctxDS(0,cs2,btc2,'mz'))===false);
reset0();
let cs3=mk('チェイス・スカッド',0),vd3=mk(PLAIN,0,'down','def'),killer3=mk(BIG,1);
gameState.players[0].mz=[cs3,vd3];gameState.players[1].mz=[killer3];
let btc3=killByBattle(vd3,killer3,0);
ok('チェイス・スカッド ruling: 裏側守備表示も「守備表示」に含む',
   sc('チェイス・スカッド').passive.onDamageStep(ctxDS(0,cs3,btc3,'mz'))===true);

/* ================= B. ダメージ計算前 / 行わず破壊 ================= */
/* 攻撃側 index0 が 相手 index0 を攻撃している状態を作る */
function setBattle(attacker,defender){
  ensureCardUid(gameState,attacker);ensureCardUid(gameState,defender);
  gameState.battle={player:0,atkIdx:0,target:0,step:'start',
    atkUid:attacker.uid,targetUid:defender.uid};
}
/* --- ドリルロイド --- */
reset0();
let dr=mk('ドリルロイド',0),dTarget=mk(BIG,1,'up','def');
gameState.players[0].mz=[dr];gameState.players[1].mz=[dTarget];
setBattle(dr,dTarget);
let cdr=ctxDS(0,dr,null,'mz','start');
ok('ドリルロイド positive: 守備表示を攻撃した場合に誘発する',
   sc('ドリルロイド').passive.onDamageStep(cdr)===true);
ok('ドリルロイド ruling: dsTiming はダメージ計算前(start)',sc('ドリルロイド').dsTiming==='start');
sc('ドリルロイド').resolve(cdr);
ok('ドリルロイド positive: 攻撃対象がダメージ計算前に破壊される',
   !gameState.players[1].mz.some(c=>c&&c.uid===dTarget.uid));
ok('ドリルロイド positive: 戦闘が終了しダメージ計算が行われない',gameState.battle===null);
reset0();
let dr2=mk('ドリルロイド',0),atkTarget=mk(BIG,1,'up','atk');
gameState.players[0].mz=[dr2];gameState.players[1].mz=[atkTarget];
setBattle(dr2,atkTarget);
ok('ドリルロイド negative: 攻撃表示モンスターへの攻撃では誘発しない',
   sc('ドリルロイド').passive.onDamageStep(ctxDS(0,dr2,null,'mz','start'))===false);
reset0();
let dr3=mk('ドリルロイド',0),other=mk(PLAIN,0),tgt3=mk(BIG,1,'up','def');
gameState.players[0].mz=[other,dr3];gameState.players[1].mz=[tgt3];
ensureCardUid(gameState,tgt3);
gameState.battle={player:0,atkIdx:0,target:0,step:'start',atkUid:other.uid,targetUid:tgt3.uid};
ok('ドリルロイド negative: 他のモンスターが攻撃している場合は誘発しない',
   sc('ドリルロイド').passive.onDamageStep(ctxDS(0,dr3,null,'mz','start'))===false);

/* --- ズババナイト（表側守備のみ） --- */
reset0();
let zb=mk('ズババナイト',0),faceUpDef=mk(BIG,1,'up','def');
gameState.players[0].mz=[zb];gameState.players[1].mz=[faceUpDef];
setBattle(zb,faceUpDef);
ok('ズババナイト positive: 表側守備表示を攻撃した場合に誘発する',
   sc('ズババナイト').passive.onDamageStep(ctxDS(0,zb,null,'mz','start'))===true);
reset0();
let zb2=mk('ズババナイト',0),faceDownDef=mk(BIG,1,'down','def');
gameState.players[0].mz=[zb2];gameState.players[1].mz=[faceDownDef];
setBattle(zb2,faceDownDef);
ok('ズババナイト negative: 裏側守備表示では誘発しない',
   sc('ズババナイト').passive.onDamageStep(ctxDS(0,zb2,null,'mz','start'))===false);

/* --- 忍者マスター SASUKE --- */
reset0();
let sk=mk('忍者マスター SASUKE',0),sdef=mk(BIG,1,'up','def');
gameState.players[0].mz=[sk];gameState.players[1].mz=[sdef];
setBattle(sk,sdef);
let csk=ctxDS(0,sk,null,'mz','start');
ok('忍者マスター SASUKE positive: 表側守備表示を攻撃した場合に誘発する',
   sc('忍者マスター SASUKE').passive.onDamageStep(csk)===true);
sc('忍者マスター SASUKE').resolve(csk);
ok('忍者マスター SASUKE positive: ダメージ計算を行わず破壊する',
   !gameState.players[1].mz.some(c=>c&&c.uid===sdef.uid)&&gameState.battle===null);

/* --- ナノブレイカー（レベル3以下・表側） --- */
reset0();
let nb=mk('ナノブレイカー',0),low=mk(PLAIN,1,'up','atk');   /* lv1 */
gameState.players[0].mz=[nb];gameState.players[1].mz=[low];
setBattle(nb,low);
ok('ナノブレイカー positive: レベル3以下の表側表示に誘発する',
   sc('ナノブレイカー').passive.onDamageStep(ctxDS(0,nb,null,'mz','start'))===true);
reset0();
let nb2=mk('ナノブレイカー',0),high=mk(BIG,1,'up','atk');   /* lv8 */
gameState.players[0].mz=[nb2];gameState.players[1].mz=[high];
setBattle(nb2,high);
ok('ナノブレイカー negative: レベル4以上には誘発しない',
   sc('ナノブレイカー').passive.onDamageStep(ctxDS(0,nb2,null,'mz','start'))===false);
reset0();
let nb3=mk('ナノブレイカー',0),lowDown=mk(PLAIN,1,'down','def');
gameState.players[0].mz=[nb3];gameState.players[1].mz=[lowDown];
setBattle(nb3,lowDown);
ok('ナノブレイカー ruling: 裏側表示には誘発しない（表側表示限定）',
   sc('ナノブレイカー').passive.onDamageStep(ctxDS(0,nb3,null,'mz','start'))===false);

/* --- 円盤闘士（守備力2000以上の守備表示） --- */
reset0();
let en=mk('円盤闘士',0),wall=mk(BIG,1,'up','def');   /* DEF2500 */
gameState.players[0].mz=[en];gameState.players[1].mz=[wall];
setBattle(en,wall);
ok('円盤闘士 positive: 守備力2000以上の守備表示に誘発する',
   sc('円盤闘士').passive.onDamageStep(ctxDS(0,en,null,'mz','start'))===true,
   'def='+curDEF(wall));
reset0();
let en2=mk('円盤闘士',0),weak=mk(PLAIN,1,'up','def');   /* DEF500 */
gameState.players[0].mz=[en2];gameState.players[1].mz=[weak];
setBattle(en2,weak);
ok('円盤闘士 negative: 守備力2000未満には誘発しない',
   sc('円盤闘士').passive.onDamageStep(ctxDS(0,en2,null,'mz','start'))===false);

/* --- 一刀両断侍（裏側守備限定） --- */
reset0();
let it=mk('一刀両断侍',0),hidden=mk(BIG,1,'down','def');
gameState.players[0].mz=[it];gameState.players[1].mz=[hidden];
setBattle(it,hidden);
let cit=ctxDS(0,it,null,'mz','start');
ok('一刀両断侍 positive: 裏側守備表示に誘発する',
   sc('一刀両断侍').passive.onDamageStep(cit)===true);
sc('一刀両断侍').resolve(cit);
ok('一刀両断侍 ruling: 裏側守備表示のまま破壊される（表になっていない）',(()=>{
   const g=gameState.players[1].grave.find(c=>c&&c.uid===hidden.uid);
   return !!g&&g.graveInfo&&g.graveInfo.face==='down';})());
reset0();
let it2=mk('一刀両断侍',0),shown=mk(BIG,1,'up','def');
gameState.players[0].mz=[it2];gameState.players[1].mz=[shown];
setBattle(it2,shown);
ok('一刀両断侍 negative: 表側守備表示には誘発しない',
   sc('一刀両断侍').passive.onDamageStep(ctxDS(0,it2,null,'mz','start'))===false);

/* --- A・O・J コアデストロイ（攻撃側でも守備側でも） --- */
reset0();
let cd=mk('A・O・J コアデストロイ',0),lightFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[cd];gameState.players[1].mz=[lightFoe];
setBattle(cd,lightFoe);
ok('A・O・J コアデストロイ positive: 自分が攻撃した光属性に誘発する',
   sc('A・O・J コアデストロイ').passive.onDamageStep(ctxDS(0,cd,null,'mz','start'))===true);
reset0();
let cd2=mk('A・O・J コアデストロイ',0),lightAtk=mk(BIG,1,'up','atk');
gameState.players[0].mz=[cd2];gameState.players[1].mz=[lightAtk];
ensureCardUid(gameState,cd2);ensureCardUid(gameState,lightAtk);
gameState.battle={player:1,atkIdx:0,target:0,step:'start',atkUid:lightAtk.uid,targetUid:cd2.uid};
ok('A・O・J コアデストロイ ruling: 光属性に攻撃された場合も誘発する（戦闘を行う場合）',
   sc('A・O・J コアデストロイ').passive.onDamageStep(ctxDS(0,cd2,null,'mz','start'))===true);
reset0();
let cd3=mk('A・O・J コアデストロイ',0),darkFoe=mk(DARKM,1,'up','atk');
gameState.players[0].mz=[cd3];gameState.players[1].mz=[darkFoe];
setBattle(cd3,darkFoe);
ok('A・O・J コアデストロイ negative: 光属性以外には誘発しない',
   sc('A・O・J コアデストロイ').passive.onDamageStep(ctxDS(0,cd3,null,'mz','start'))===false);

/* --- BF－空風のジン（攻撃力以下の守備力） --- */
reset0();
let gj=mk('BF－空風のジン',0),lowDef=mk(PLAIN,1,'up','atk');   /* DEF500 <= ATK600 */
gameState.players[0].mz=[gj];gameState.players[1].mz=[lowDef];
setBattle(gj,lowDef);
ok('BF－空風のジン positive: 攻撃力以下の守備力を持つ表側モンスターに誘発する',
   sc('BF－空風のジン').passive.onDamageStep(ctxDS(0,gj,null,'mz','start'))===true,
   'atk='+curATK(gj)+' def='+curDEF(lowDef));
reset0();
let gj2=mk('BF－空風のジン',0),highDef=mk(BIG,1,'up','atk');   /* DEF2500 */
gameState.players[0].mz=[gj2];gameState.players[1].mz=[highDef];
setBattle(gj2,highDef);
ok('BF－空風のジン negative: 守備力が攻撃力を超えるモンスターには誘発しない',
   sc('BF－空風のジン').passive.onDamageStep(ctxDS(0,gj2,null,'mz','start'))===false);
reset0();
let gj3=mk('BF－空風のジン',0),hiddenLow=mk(PLAIN,1,'down','def');
gameState.players[0].mz=[gj3];gameState.players[1].mz=[hiddenLow];
setBattle(gj3,hiddenLow);
ok('BF－空風のジン ruling: 裏側表示には誘発しない（表側表示限定）',
   sc('BF－空風のジン').passive.onDamageStep(ctxDS(0,gj3,null,'mz','start'))===false);

/* ================= C. 戦闘を行った時の除外 ================= */
reset0();
let dw=mk('異次元の戦士',0),foeW=mk(BIG,1);
gameState.players[0].mz=[dw];gameState.players[1].mz=[foeW];
let btw={atkCard:dw,defCard:foeW,destroyedAtk:false,destroyedDef:false,step:'after'};
let cdw=ctxDS(0,dw,btw,'mz','after');
ok('異次元の戦士 positive: モンスターと戦闘を行った時に誘発する',
   sc('異次元の戦士').passive.onDamageStep(cdw)===true);
ok('異次元の戦士 ruling: dsTiming はダメージ計算後(after)',sc('異次元の戦士').dsTiming==='after');
sc('異次元の戦士').resolve(cdw);
ok('異次元の戦士 positive: 相手と自身の両方が除外される',
   gameState.players[1].banish.some(c=>c&&c.uid===foeW.uid)&&
   gameState.players[0].banish.some(c=>c&&c.uid===dw.uid),
   'p0banish='+gameState.players[0].banish.length+' p1banish='+gameState.players[1].banish.length);
reset0();
let dw2=mk('異次元の戦士',0);
gameState.players[0].mz=[dw2];
ok('異次元の戦士 negative: 直接攻撃（戦闘相手なし）では誘発しない',
   sc('異次元の戦士').passive.onDamageStep(ctxDS(0,dw2,{atkCard:dw2,defCard:null},'mz','after'))===false);

reset0();
let uc=mk('A・O・J アンノウン・クラッシャー',0),lightW=mk(BIG,1);
gameState.players[0].mz=[uc];gameState.players[1].mz=[lightW];
let btu={atkCard:uc,defCard:lightW,destroyedAtk:false,destroyedDef:false,step:'after'};
let cuc=ctxDS(0,uc,btu,'mz','after');
ok('A・O・J アンノウン・クラッシャー positive: 光属性と戦闘を行った時に誘発する',
   sc('A・O・J アンノウン・クラッシャー').passive.onDamageStep(cuc)===true);
sc('A・O・J アンノウン・クラッシャー').resolve(cuc);
ok('A・O・J アンノウン・クラッシャー positive: 相手だけが除外される（自身は残る）',
   gameState.players[1].banish.some(c=>c&&c.uid===lightW.uid)&&
   gameState.players[0].mz.some(c=>c&&c.uid===uc.uid));
reset0();
let uc2=mk('A・O・J アンノウン・クラッシャー',0),darkW=mk(DARKM,1);
gameState.players[0].mz=[uc2];gameState.players[1].mz=[darkW];
ok('A・O・J アンノウン・クラッシャー negative: 光属性以外では誘発しない',
   sc('A・O・J アンノウン・クラッシャー').passive.onDamageStep(
     ctxDS(0,uc2,{atkCard:uc2,defCard:darkW},'mz','after'))===false);

/* ================= D. 戦闘ダメージを与えた時 ================= */
reset0();
let bs=mk('ブラッド・サッカー',0);
gameState.players[0].mz=[bs];
gameState.players[1].deck=[mk(PLAIN,1),mk(PLAIN,1)];
let evtD={player:1,amount:1300,direct:true,attackerUid:bs.uid,defenderUid:null,attackerOwner:0,dealtBy:0};
let cbs=ctxBD(0,bs,evtD);
ok('ブラッド・サッカー positive: 相手に戦闘ダメージを与えた時に誘発する',
   sc('ブラッド・サッカー').passive.onBattleDamage(cbs)===true);
let deck1=gameState.players[1].deck.length;
sc('ブラッド・サッカー').resolve(cbs);
ok('ブラッド・サッカー positive: 相手デッキトップ1枚が墓地へ',
   gameState.players[1].deck.length===deck1-1&&gameState.players[1].grave.length===1);
reset0();
let bs2=mk('ブラッド・サッカー',0);gameState.players[0].mz=[bs2];
gameState.players[1].deck=[mk(PLAIN,1)];
ok('ブラッド・サッカー negative: 自分がダメージを受けた時は誘発しない',
   sc('ブラッド・サッカー').passive.onBattleDamage(
     ctxBD(0,bs2,{player:0,amount:500,attackerUid:bs2.uid,defenderUid:null}))===false);
ok('ブラッド・サッカー negative: 別のモンスターが与えたダメージでは誘発しない',
   sc('ブラッド・サッカー').passive.onBattleDamage(
     ctxBD(0,bs2,{player:1,amount:500,attackerUid:999999,defenderUid:null}))===false);
reset0();
let bs3=mk('ブラッド・サッカー',0);gameState.players[0].mz=[bs3];gameState.players[1].deck=[];
ok('ブラッド・サッカー negative: 相手デッキが空なら発動できない',
   sc('ブラッド・サッカー').passive.onBattleDamage(
     ctxBD(0,bs3,{player:1,amount:500,attackerUid:bs3.uid,defenderUid:null}))===false);

/* --- ボルテック・コング --- */
reset0();
let vk=mk('ボルテック・コング',0),light2=mk(LIGHTM,0);
gameState.players[0].mz=[vk,light2];   /* ボルテック・コング自身も光属性 */
gameState.players[1].deck=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
let cvk=ctxBD(0,vk,{player:1,amount:1800,attackerUid:vk.uid,defenderUid:null});
ok('ボルテック・コング positive: 戦闘ダメージで誘発する',
   sc('ボルテック・コング').passive.onBattleDamage(cvk)===true);
sc('ボルテック・コング').resolve(cvk);
ok('ボルテック・コング positive: 表側光属性の数(2)だけ墓地へ送る',
   gameState.players[1].grave.length===2,'grave='+gameState.players[1].grave.length);
reset0();
let vk2=mk('ボルテック・コング',0,'down','def');
gameState.players[0].mz=[vk2];gameState.players[1].deck=[mk(PLAIN,1)];
ok('ボルテック・コング negative: 表側の光属性がいなければ発動できない',
   sc('ボルテック・コング').passive.onBattleDamage(
     ctxBD(0,vk2,{player:1,amount:500,attackerUid:vk2.uid,defenderUid:null}))===false);

/* --- 黒蠍盗掘団（相手private choice） --- */
reset0();
let kc=mk('黒蠍盗掘団',0);
gameState.players[0].mz=[kc];
let oppSpell=mk('サイクロン',1);
gameState.players[1].deck=[mk(PLAIN,1),oppSpell];
let ckc=ctxBD(0,kc,{player:1,amount:1000,attackerUid:kc.uid,defenderUid:null});
ok('黒蠍盗掘団 positive: 相手デッキに魔法があれば誘発する',
   sc('黒蠍盗掘団').passive.onBattleDamage(ckc)===true);
sc('黒蠍盗掘団').resolve(ckc);
let pc=pendingChoiceV49(gameState);
ok('黒蠍盗掘団 ruling: 選ぶのは相手プレイヤー（hidden information を漏らさない）',
   !!pc&&pc.player===1,'player='+(pc&&pc.player));
ok('黒蠍盗掘団 ruling: 候補は相手デッキの魔法カードだけ',
   !!pc&&pc.candidates.length===1);
answerChoiceV49([pc.candidates[0].key]);
ok('黒蠍盗掘団 positive: 選ばれた魔法が墓地へ送られる',
   gameState.players[1].grave.some(c=>c&&c.uid===oppSpell.uid));
reset0();
let kc2=mk('黒蠍盗掘団',0);gameState.players[0].mz=[kc2];
gameState.players[1].deck=[mk(PLAIN,1)];
ok('黒蠍盗掘団 negative: 相手デッキに魔法が無ければ発動できない',
   sc('黒蠍盗掘団').passive.onBattleDamage(
     ctxBD(0,kc2,{player:1,amount:500,attackerUid:kc2.uid,defenderUid:null}))===false);

/* ================= E. グラヴィティ・バインド ================= */
reset0();
let gb=mk('グラヴィティ・バインド－超重力の網－',0,'up');
gameState.players[0].sz=[gb];
let lv8=mk(BIG,0),lv1=mk(PLAIN,0);
gameState.players[0].mz=[lv8,lv1];
gameState.players[1].mz=[mk(PLAIN,1)];
ok('グラヴィティ・バインド positive: レベル4以上は攻撃できない',
   canDeclareAttackV48(lv8)===false,'lv='+curLV(lv8));
ok('グラヴィティ・バインド negative: レベル3以下は攻撃できる',
   canDeclareAttackV48(lv1)===true,'lv='+curLV(lv1));
ok('グラヴィティ・バインド ruling: 相手のレベル4以上も攻撃できない（両者に及ぶ）',(()=>{
   const foe8=mk(BIG,1);gameState.players[1].mz=[foe8];
   return canDeclareAttackV48(foe8)===false;})());
reset0();
let lv8b=mk(BIG,0);gameState.players[0].mz=[lv8b];
ok('グラヴィティ・バインド negative: カードが無ければ攻撃制限はかからない',
   canDeclareAttackV48(lv8b)===true);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp=mk('マイン・ゴーレム',0,'up','def'),rk=mk(BIG,1);
gameState.players[0].mz=[rp];gameState.players[1].mz=[rk];
/* battleDestroyed は Action ではなく直接フラグなので、初期状態に含めてから
   journal を切る。実戦では ATTACK Action が立てるので再生側でも再現される。 */
rp.battleDestroyed=true;
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
act({type:'BATTLE_CLEANUP'});
act({type:'LP',player:1,delta:-500,cause:'effect'});
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle01 Replay: 戦闘破壊＋LP変動が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle01 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);

reset0();
let rb=mk('異次元の戦士',0),rf=mk(BIG,1);
gameState.players[0].mz=[rb];gameState.players[1].mz=[rf];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(rf),'異次元の戦士');
API.banish(h(rb),'異次元の戦士');
let audit2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle01 Replay: 除外処理が digest 一致で再生される',audit2.ok,audit2.reason||'');

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
