/* Auto cycle 03 — 15枚。positive / negative / ruling edge / Replay。 */
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
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',
    {event:{},battle:battle,step:step||'leave'});
  c.battle=battle;c.step=step||'leave';return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});
  c.event=evt;return c;}
function ctxFL(p,card){return ctxEv(p,card,'onFlip',{player:p,card:card,uid:card.uid,flipSummon:true});}
function ctxNS(p,card){return ctxEv(p,card,'onNormalSummon',{player:p,card:card,uid:card.uid});}
/* 攻撃宣言中の状態（p0 の mz[ai] が p1 の mz[ti] を攻撃） */
function battleAt(ai,ti,step){
  const a=gameState.players[0].mz[ai],d=(ti==='direct')?null:gameState.players[1].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:0,atkIdx:ai,target:(ti==='direct')?'direct':ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};
}
function killByBattle(victim,killer,vp){
  victim.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
  return {defCard:victim,atkCard:killer,destroyedDef:true,destroyedAtk:false,player:vp===0?1:0,step:'leave'};}
const PLAIN='ワイト';       /* 闇 lv1 */
const BIG='青眼の白龍';      /* 光 lv8 ATK3000 */
const DARKM='デーモンの召喚'; /* 闇 lv6 ATK2500 */
const WIND='空の昆虫兵';     /* 風 lv3 ATK1000 */

const ALL=['ダッシュ・ウォリアー','太陽の戦士','月の女戦士','空の昆虫兵','エトワール・サイバー',
 '逆ギレパンダ','ミレニアム・スコーピオン','A・O・J エネミー・キャッチャー','X・E・N・O','シエンの間者',
 'コアラッコ','強化人類サイコ','パワー・インジェクター','オプションハンター','オイスターマイスター'];
ALL.forEach(n=>ok('cycle03 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle03 枚数は15',ALL.length===15);

/* ================= P. ダメージステップ限定の攻撃力上昇 ================= */
/* --- ダッシュ・ウォリアー --- */
reset0();
let dw=mk('ダッシュ・ウォリアー',0),foe1=mk(PLAIN,1);
gameState.players[0].mz=[dw];gameState.players[1].mz=[foe1];
let baseDW=dbOf(dw).atk;
ok('ダッシュ・ウォリアー negative: 戦闘外では攻撃力は上がらない',curATK(dw)===baseDW,'atk='+curATK(dw));
battleAt(0,0,'calc');
ok('ダッシュ・ウォリアー positive: 攻撃するダメージステップ中は+1200',
   curATK(dw)===baseDW+1200,'atk='+curATK(dw));
reset0();
let dw2=mk('ダッシュ・ウォリアー',0),atkFoe=mk(BIG,1);
gameState.players[0].mz=[dw2];gameState.players[1].mz=[atkFoe];
ensureCardUid(gameState,dw2);ensureCardUid(gameState,atkFoe);
gameState.battle={player:1,atkIdx:0,target:0,step:'calc',atkUid:atkFoe.uid,targetUid:dw2.uid};
ok('ダッシュ・ウォリアー negative: 攻撃される側では上がらない',
   curATK(dw2)===dbOf(dw2).atk,'atk='+curATK(dw2));

/* --- 太陽の戦士（闇と戦闘） --- */
reset0();
let ts=mk('太陽の戦士',0),darkFoe=mk(DARKM,1);
gameState.players[0].mz=[ts];gameState.players[1].mz=[darkFoe];
battleAt(0,0,'calc');
ok('太陽の戦士 positive: 闇属性と戦闘するダメージステップ中は+500',
   curATK(ts)===dbOf(ts).atk+500,'atk='+curATK(ts));
reset0();
let ts2=mk('太陽の戦士',0),lightFoe=mk(BIG,1);
gameState.players[0].mz=[ts2];gameState.players[1].mz=[lightFoe];
battleAt(0,0,'calc');
ok('太陽の戦士 negative: 闇属性以外なら上がらない',curATK(ts2)===dbOf(ts2).atk);
reset0();
let ts3=mk('太陽の戦士',0),darkAtk=mk(DARKM,1);
gameState.players[0].mz=[ts3];gameState.players[1].mz=[darkAtk];
ensureCardUid(gameState,ts3);ensureCardUid(gameState,darkAtk);
gameState.battle={player:1,atkIdx:0,target:0,step:'calc',atkUid:darkAtk.uid,targetUid:ts3.uid};
ok('太陽の戦士 ruling: 攻撃されて戦闘する場合も上がる（戦闘を行う場合）',
   curATK(ts3)===dbOf(ts3).atk+500,'atk='+curATK(ts3));

/* --- 月の女戦士（光と戦闘） --- */
reset0();
let mw=mk('月の女戦士',0),lf=mk(BIG,1);
gameState.players[0].mz=[mw];gameState.players[1].mz=[lf];
battleAt(0,0,'calc');
ok('月の女戦士 positive: 光属性と戦闘するダメージステップ中は+1000',
   curATK(mw)===dbOf(mw).atk+1000,'atk='+curATK(mw));

/* --- 空の昆虫兵（風を攻撃する場合のみ） --- */
reset0();
let sk=mk('空の昆虫兵',0),windFoe=mk(WIND,1);
gameState.players[0].mz=[sk];gameState.players[1].mz=[windFoe];
battleAt(0,0,'calc');
ok('空の昆虫兵 positive: 風属性を攻撃するダメージステップ中は+1000',
   curATK(sk)===dbOf(sk).atk+1000,'atk='+curATK(sk));
reset0();
let sk2=mk('空の昆虫兵',0),windAtk=mk(WIND,1);
gameState.players[0].mz=[sk2];gameState.players[1].mz=[windAtk];
ensureCardUid(gameState,sk2);ensureCardUid(gameState,windAtk);
gameState.battle={player:1,atkIdx:0,target:0,step:'calc',atkUid:windAtk.uid,targetUid:sk2.uid};
ok('空の昆虫兵 ruling: 攻撃される側では上がらない（攻撃する場合限定）',
   curATK(sk2)===dbOf(sk2).atk,'atk='+curATK(sk2));

/* --- エトワール・サイバー（直接攻撃） --- */
reset0();
let ec=mk('エトワール・サイバー',0);
gameState.players[0].mz=[ec];
battleAt(0,'direct','calc');
ok('エトワール・サイバー positive: 直接攻撃のダメージステップ中は+500',
   curATK(ec)===dbOf(ec).atk+500,'atk='+curATK(ec));
reset0();
let ec2=mk('エトワール・サイバー',0),blocker=mk(PLAIN,1);
gameState.players[0].mz=[ec2];gameState.players[1].mz=[blocker];
battleAt(0,0,'calc');
ok('エトワール・サイバー negative: モンスターへの攻撃では上がらない',
   curATK(ec2)===dbOf(ec2).atk,'atk='+curATK(ec2));

/* ================= Q ================= */
/* --- 逆ギレパンダ --- */
reset0();
let gp=mk('逆ギレパンダ',0);
gameState.players[0].mz=[gp];
ok('逆ギレパンダ negative: 相手モンスターが0体なら上がらない',curATK(gp)===dbOf(gp).atk,'atk='+curATK(gp));
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
ok('逆ギレパンダ positive: 相手モンスター1体につき+500',
   curATK(gp)===dbOf(gp).atk+1500,'atk='+curATK(gp));
reset0();
let gp2=mk('逆ギレパンダ',0),defFoe=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[gp2];gameState.players[1].mz=[defFoe];
battleAt(0,0,'calc');
ok('逆ギレパンダ positive: 守備表示への攻撃で貫通ダメージが出る',(()=>{
   const amt=applyPiercingDamage({atkCard:gp2,defCard:defFoe});
   return amt===Math.max(0,curATK(gp2)-curDEF(defFoe))&&amt>0;})(),
   'pierce='+applyPiercingDamage({atkCard:gp2,defCard:defFoe}));
ok('逆ギレパンダ ruling: 攻撃表示への攻撃では貫通しない',
   applyPiercingDamage({atkCard:gp2,defCard:mk(PLAIN,1,'up','atk')})===0);

/* --- ミレニアム・スコーピオン --- */
reset0();
let ms=mk('ミレニアム・スコーピオン',0),victim=mk(PLAIN,1);
gameState.players[0].mz=[ms];gameState.players[1].mz=[victim];
ok('ミレニアム・スコーピオン negative: 初期値は上がっていない',curATK(ms)===dbOf(ms).atk);
let btm=killByBattle(victim,ms,1);
btm={atkCard:ms,defCard:victim,destroyedDef:true,destroyedAtk:false,step:'leave'};
let cms=ctxDS(0,ms,btm,'mz');
ok('ミレニアム・スコーピオン positive: 戦闘破壊で誘発する',sc('ミレニアム・スコーピオン').passive.onDamageStep(cms)===true);
sc('ミレニアム・スコーピオン').resolve(cms);
ok('ミレニアム・スコーピオン positive: 攻撃力が500上がる',
   curATK(ms)===dbOf(ms).atk+500,'atk='+curATK(ms));
sc('ミレニアム・スコーピオン').resolve(cms);
ok('ミレニアム・スコーピオン ruling: 破壊する度に累積する',
   curATK(ms)===dbOf(ms).atk+1000,'atk='+curATK(ms));
ok('ミレニアム・スコーピオン 直列化: 累積は純粋な数値としてカードに残る',
   typeof ms.a5ScorpionN==='number'&&ms.a5ScorpionN===2);

/* ================= R. コントロール ================= */
/* --- A・O・J エネミー・キャッチャー --- */
reset0();
let ek=mk('A・O・J エネミー・キャッチャー',0),hiddenFoe=mk(BIG,1,'down','def');
gameState.players[0].mz=[ek];gameState.players[1].mz=[hiddenFoe];
let cek=ctxNS(0,ek);
ok('A・O・J エネミー・キャッチャー positive: 召喚成功時に裏側守備がいれば誘発する',
   sc('A・O・J エネミー・キャッチャー').passive.onNormalSummon(cek)===true);
sc('A・O・J エネミー・キャッチャー').selectTargets(cek,r=>{cek.selectedTargets=r;});
sc('A・O・J エネミー・キャッチャー').resolve(cek);
ok('A・O・J エネミー・キャッチャー positive: コントロールを得る',
   gameState.players[0].mz.some(c=>c&&c.uid===hiddenFoe.uid));
reset0();
let ek2=mk('A・O・J エネミー・キャッチャー',0),shownFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[ek2];gameState.players[1].mz=[shownFoe];
ok('A・O・J エネミー・キャッチャー negative: 表側表示は対象にできない',
   sc('A・O・J エネミー・キャッチャー').passive.onNormalSummon(ctxNS(0,ek2))===false);

/* --- X・E・N・O --- */
reset0();
let xn=mk('X・E・N・O',0,'up'),stolen=mk(BIG,1,'up');
gameState.players[0].mz=[xn];gameState.players[1].mz=[stolen];
let cxn=ctxFL(0,xn);
ok('X・E・N・O positive: リバースで誘発する',sc('X・E・N・O').passive.onFlip(cxn)===true);
sc('X・E・N・O').selectTargets(cxn,r=>{cxn.selectedTargets=r;});
sc('X・E・N・O').resolve(cxn);
ok('X・E・N・O positive: コントロールを得る',
   gameState.players[0].mz.some(c=>c&&c.uid===stolen.uid));
ok('X・E・N・O ruling: 得たモンスターは直接攻撃できる',
   canDirectAttackThroughMonstersV51(stolen)===true);
reset0();
let xn2=mk('X・E・N・O',0,'up');
gameState.players[0].mz=[xn2];
ok('X・E・N・O negative: 相手モンスターがいなければ発動できない',
   sc('X・E・N・O').passive.onFlip(ctxFL(0,xn2))===false);

/* --- シエンの間者 --- */
reset0();
let sm=mk('シエンの間者',0,'down'),mine=mk(BIG,0,'up');
gameState.players[0].sz=[sm];gameState.players[0].mz=[mine];
let csm=makeContext(0,sm,'sz',0,'activate',{});
ok('シエンの間者 positive: 自分の表側モンスターがいれば発動できる',sc('シエンの間者').condition(csm)===true);
sc('シエンの間者').selectTargets(csm,r=>{csm.selectedTargets=r;});
sc('シエンの間者').resolve(csm);
ok('シエンの間者 positive: コントロールが相手へ移る',
   gameState.players[1].mz.some(c=>c&&c.uid===mine.uid),
   'p0='+gameState.players[0].mz.length+' p1='+gameState.players[1].mz.length);
reset0();
let sm2=mk('シエンの間者',0,'down');
gameState.players[0].sz=[sm2];
ok('シエンの間者 negative: 自分の表側モンスターがいなければ発動できない',
   sc('シエンの間者').condition(makeContext(0,sm2,'sz',0,'activate',{}))===false);

/* ================= S ================= */
/* --- コアラッコ --- */
reset0();
let kr=mk('コアラッコ',0),beast=mk('逆ギレパンダ',0),tgt=mk(BIG,1);
gameState.players[0].mz=[kr,beast];gameState.players[1].mz=[tgt];
let ckr=makeContext(0,kr,'mz',0,'activate',{});
ok('コアラッコ positive: 他の獣族がいれば発動できる',sc('コアラッコ').condition(ckr)===true);
sc('コアラッコ').selectTargets(ckr,r=>{ckr.selectedTargets=r;});
sc('コアラッコ').resolve(ckr);
ok('コアラッコ positive: 対象の攻撃力が0になる',curATK(tgt)===0,'atk='+curATK(tgt));
reset0();
let kr2=mk('コアラッコ',0),notBeast=mk(BIG,0),tgt2=mk(BIG,1);
gameState.players[0].mz=[kr2,notBeast];gameState.players[1].mz=[tgt2];
ok('コアラッコ negative: 他の獣族がいなければ発動できない',
   sc('コアラッコ').condition(makeContext(0,kr2,'mz',0,'activate',{}))===false);
ok('コアラッコ ruling: 1ターンに1度だけ',sc('コアラッコ').countLimit===1);

/* --- 強化人類サイコ --- */
reset0();
let ps=mk('強化人類サイコ',0);
gameState.players[0].mz=[ps];
let psyGrave=mk('強化人類サイコ',0);gameState.players[0].grave=[psyGrave];
let cps=makeContext(0,ps,'mz',0,'activate',{});
ok('強化人類サイコ positive: 墓地にサイキックがいれば発動できる',sc('強化人類サイコ').condition(cps)===true);
let paid=false;sc('強化人類サイコ').cost(cps,okv=>{paid=okv;});
ok('強化人類サイコ positive: コストでサイキックが除外される',
   paid===true&&gameState.players[0].banish.some(c=>c&&c.uid===psyGrave.uid));
sc('強化人類サイコ').resolve(cps);
ok('強化人類サイコ positive: 攻撃力が500上がる',curATK(ps)===dbOf(ps).atk+500,'atk='+curATK(ps));
ok('強化人類サイコ ruling: 1ターンに2度まで',sc('強化人類サイコ').countLimit===2);
reset0();
let ps2=mk('強化人類サイコ',0);gameState.players[0].mz=[ps2];
gameState.players[0].grave=[mk(BIG,0)];
ok('強化人類サイコ negative: 墓地にサイキックがいなければ発動できない',
   sc('強化人類サイコ').condition(makeContext(0,ps2,'mz',0,'activate',{}))===false);

/* --- パワー・インジェクター --- */
reset0();
let pi=mk('パワー・インジェクター',0),psy2=mk('強化人類サイコ',0),nonPsy=mk(BIG,0);
gameState.players[0].mz=[pi,psy2,nonPsy];
gameState.players[0].lp=8000;
let cpi=makeContext(0,pi,'mz',0,'activate',{});
ok('パワー・インジェクター positive: 600払えるなら発動できる',sc('パワー・インジェクター').condition(cpi)===true);
sc('パワー・インジェクター').cost(cpi,()=>{});
ok('パワー・インジェクター positive: 600ライフを払う',gameState.players[0].lp===7400,'lp='+gameState.players[0].lp);
sc('パワー・インジェクター').resolve(cpi);
ok('パワー・インジェクター positive: サイキック族の攻撃力が500上がる',
   curATK(psy2)===dbOf(psy2).atk+500&&curATK(pi)===dbOf(pi).atk+500,
   'psy='+curATK(psy2)+' self='+curATK(pi));
ok('パワー・インジェクター ruling: サイキック族以外は上がらない',
   curATK(nonPsy)===dbOf(nonPsy).atk,'atk='+curATK(nonPsy));
reset0();
let pi2=mk('パワー・インジェクター',0);gameState.players[0].mz=[pi2];
gameState.players[0].lp=600;
ok('パワー・インジェクター negative: ライフが600以下なら発動できない',
   sc('パワー・インジェクター').condition(makeContext(0,pi2,'mz',0,'activate',{}))===false);

/* --- オプションハンター --- */
reset0();
let oh=mk('オプションハンター',0,'down'),myMon=mk(BIG,0),killer=mk(BIG,1);
gameState.players[0].sz=[oh];gameState.players[0].mz=[myMon];gameState.players[1].mz=[killer];
gameState.players[0].lp=4000;
let bth=killByBattle(myMon,killer,0);
let coh=makeContext(0,oh,'sz',0,'onDamageStep',{event:{},battle:bth,step:'leave'});
coh.battle=bth;coh.step='leave';
ok('オプションハンター positive: 自分のモンスターが戦闘破壊された時に誘発する',
   sc('オプションハンター').passive.onDamageStep(coh)===true);
sc('オプションハンター').resolve(coh);
ok('オプションハンター positive: 元々の攻撃力分だけ回復する',
   gameState.players[0].lp===4000+dbOf(myMon).atk,'lp='+gameState.players[0].lp);
reset0();
let oh2=mk('オプションハンター',0,'down'),foeMon=mk(BIG,1),myKiller=mk(BIG,0);
gameState.players[0].sz=[oh2];gameState.players[1].mz=[foeMon];gameState.players[0].mz=[myKiller];
let bth2=killByBattle(foeMon,myKiller,1);
let coh2=makeContext(0,oh2,'sz',0,'onDamageStep',{event:{},battle:bth2,step:'leave'});
coh2.battle=bth2;coh2.step='leave';
ok('オプションハンター negative: 相手のモンスターが破壊されても発動できない',
   sc('オプションハンター').passive.onDamageStep(coh2)===false);

/* --- オイスターマイスター --- */
reset0();
let om=mk('オイスターマイスター',0);
gameState.players[0].mz=[om];
API.sendToGrave(h(om),'効果で墓地へ');
let com=ctxEv(0,om,'onSendToGrave',{card:om,uid:om.uid,reason:'effect'},'grave');
ok('オイスターマイスター positive: 戦闘以外で墓地へ送られた時に誘発する',
   sc('オイスターマイスター').passive.onSendToGrave(com)===true);
sc('オイスターマイスター').resolve(com);
ok('オイスターマイスター positive: オイスタートークンが1体出る',
   gameState.players[0].mz.length===1,'mz='+gameState.players[0].mz.length);
ok('オイスターマイスター ruling: トークンは魚族・水・レベル1・攻守0',(()=>{
   const t=gameState.players[0].mz[0],d=dbOf(t);
   return d.ra==='魚'&&d.at==='水'&&Number(d.lv)===1&&Number(d.atk)===0&&Number(d.def)===0;})());
reset0();
let om2=mk('オイスターマイスター',0),ok2=mk(BIG,1);
gameState.players[0].mz=[om2];gameState.players[1].mz=[ok2];
killByBattle(om2,ok2,0);
ok('オイスターマイスター negative: 戦闘破壊では誘発しない',
   sc('オイスターマイスター').passive.onSendToGrave(
     ctxEv(0,om2,'onSendToGrave',{card:om2,uid:om2.uid,reason:'battle'},'grave'))===false);

/* ================= Replay / SaveLoad ================= */
reset0();
let rs=mk('ミレニアム・スコーピオン',0);
gameState.players[0].mz=[rs];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rs),'a5ScorpionN',3,'ミレニアム・スコーピオン');
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle03 Replay: 累積フラグが digest 一致で再生される',a1.ok,a1.reason||'');
ok('cycle03 Replay: 再生後も攻撃力計算が一致する',curATK(rs)===dbOf(rs).atk+1500,'atk='+curATK(rs));
reset0();
let rp=mk('強化人類サイコ',0),rg=mk('強化人類サイコ',0);
gameState.players[0].mz=[rp];gameState.players[0].grave=[rg];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(rg),'cost');
API.modAtk(h(rp),500,0,'permanent','強化人類サイコ');
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle03 Replay: 除外コスト＋永続攻撃力上昇が digest 一致で再生される',a2.ok,a2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle03 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle03 直列化: 継続効果は gameState に関数を残さない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
