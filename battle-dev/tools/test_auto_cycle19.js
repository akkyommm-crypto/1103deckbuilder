/* Auto cycle 19 — 15枚。シンクロ素材／シンクロ召喚成功の一族。
   素材イベントは engine の正規経路（EX_SUMMON_PREPARE_V42 → EX_SUMMON_COMMIT_V42）で作る。 */
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
/* engine の正規経路でシンクロ召喚を行い、素材イベントを実際に発生させる。
   戻り値 {syn, evts} — evts は deferredEvents から拾った onSendToGrave / onSpecialSummon。 */
function synchroSummon(p, synName, materials){
  const P=gameState.players[p];
  const ex=mk(synName,p); P.ex=[ex]; ensureCardUid(gameState,ex);
  materials.forEach(c=>ensureCardUid(gameState,c));
  const indices=materials.map(c=>P.mz.indexOf(c)).filter(i=>i>=0).sort((a,b)=>b-a);
  gameState.deferredEvents=[];
  act({type:'EX_SUMMON_PREPARE_V42',player:p,exIndex:0,materials:indices,kind:'synchro',pos:'atk'});
  act({type:'EX_SUMMON_COMMIT_V42'});
  const evts=(gameState.deferredEvents||[]).slice();
  gameState.deferredEvents=[];
  return {syn:ex, evts};
}
/* 素材カードに対応する onSendToGrave イベントを取り出す */
function matEvt(pack, card){
  const e=pack.evts.find(x=>x.eventName==='onSendToGrave'&&x.evt&&x.evt.uid===card.uid);
  return e?e.evt:null;
}
function synEvt(pack){
  const e=pack.evts.find(x=>x.eventName==='onSpecialSummon');
  return e?e.evt:null;
}
const PLAIN='ワイト';        /* 闇 アンデット lv1 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 */

const ALL=['ダークシー・レスキュー','サニー・ピクシー','チェンジ・シンクロン','アタック・ゲイナー',
 'クイック・スパナイト','ダーク・スプロケッター','マジドッグ','ヴァイロン・キューブ',
 'メンタル・カウンセラー リリー','ブライ・シンクロン','ハイパー・シンクロン','バイス・バーサーカー',
 'X－セイバー ウェイン','エンシェント・ゴッド・フレムベル','スターダスト・シャオロン'];
ALL.forEach(n=>ok('cycle19 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle19 枚数は15',ALL.length===15);

/* ============ 前提: engine が素材の provenance を持っている ============ */
reset0();
let pm=mk('ダークシー・レスキュー',0),pt=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[pm,pt];
gameState.players[0].deck=[mk(PLAIN,0)];
let pk=synchroSummon(0,'BF－アーマード・ウィング',[pm,pt]);
ok('前提: シンクロ素材は墓地へ送られる',
   gameState.players[0].grave.some(c=>c===pm),'grave='+gameState.players[0].grave.length);
ok('前提: 素材の graveInfo に reason=synchroMaterial が入る',
   pm.graveInfo&&pm.graveInfo.reason==='synchroMaterial',
   'graveInfo='+JSON.stringify(pm.graveInfo||null));
let pe=matEvt(pk,pm);
ok('前提: onSendToGrave に reason/kind/summonUid が載る',
   !!pe&&pe.reason==='synchroMaterial'&&pe.kind==='synchro'&&pe.summonUid===pk.syn.uid,
   'evt='+JSON.stringify(pe));
ok('前提: シンクロモンスターは場に出ている',
   gameState.players[0].mz.some(c=>c===pk.syn));
ok('前提: onSpecialSummon の kind は synchro',
   !!synEvt(pk)&&synEvt(pk).kind==='synchro');
ok('前提: シンクロ側に v380SummonMaterials が入る',
   Array.isArray(pk.syn.v380SummonMaterials)&&pk.syn.v380SummonMaterials.length===2,
   'mats='+JSON.stringify(pk.syn.v380SummonMaterials||null));

/* ============ ダークシー・レスキュー ============ */
let cdr=ctxEv(0,pm,'onSendToGrave',pe,'grave');
ok('ダークシー・レスキュー positive: 素材になって誘発する',
   sc('ダークシー・レスキュー').passive.onSendToGrave(cdr)===true);
sc('ダークシー・レスキュー').resolve(cdr);
ok('ダークシー・レスキュー positive: 1枚ドローする',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===0);
reset0();
let dr2=mk('ダークシー・レスキュー',0);
gameState.players[0].grave=[dr2];
ok('ダークシー・レスキュー negative: 素材以外の墓地送りでは誘発しない',
   sc('ダークシー・レスキュー').passive.onSendToGrave(
     ctxEv(0,dr2,'onSendToGrave',{player:0,uid:dr2.uid,reason:'effect'},'grave'))===false);

/* ============ サニー・ピクシー（光属性シンクロ） ============ */
reset0();
let sp2=mk('サニー・ピクシー',0),st2=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[sp2,st2];
let spk2=synchroSummon(0,'マジカル・アンドロイド',[sp2,st2]);
let spe=matEvt(spk2,sp2);
ok('前提: 使用したシンクロは光属性',dbOf(spk2.syn).at==='光','at='+dbOf(spk2.syn).at);
let csp=ctxEv(0,sp2,'onSendToGrave',spe,'grave');
ok('サニー・ピクシー positive: 光属性シンクロの素材になって誘発する',
   sc('サニー・ピクシー').passive.onSendToGrave(csp)===true);
let lpB=gameState.players[0].lp;
sc('サニー・ピクシー').resolve(csp);
ok('サニー・ピクシー positive: 1000ライフポイント回復する',
   gameState.players[0].lp===lpB+1000,'lp='+gameState.players[0].lp);
reset0();
let sp3=mk('サニー・ピクシー',0),st3=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[sp3,st3];
let spk3=synchroSummon(0,'BF－アーマード・ウィング',[sp3,st3]);  /* 水属性 */
ok('サニー・ピクシー negative: 光属性以外のシンクロでは誘発しない',
   sc('サニー・ピクシー').passive.onSendToGrave(
     ctxEv(0,sp3,'onSendToGrave',matEvt(spk3,sp3),'grave'))===false,
   'at='+dbOf(spk3.syn).at);

/* ============ チェンジ・シンクロン ============ */
reset0();
let cs=mk('チェンジ・シンクロン',0),ct=mk('ジェネクス・コントローラー',0),cfoe=mk(BIG,1);
gameState.players[0].mz=[cs,ct];gameState.players[1].mz=[cfoe];
let csk=synchroSummon(0,'BF－アーマード・ウィング',[cs,ct]);
let ccs=ctxEv(0,cs,'onSendToGrave',matEvt(csk,cs),'grave');
ok('チェンジ・シンクロン positive: 素材になって誘発する',
   sc('チェンジ・シンクロン').passive.onSendToGrave(ccs)===true);
sc('チェンジ・シンクロン').selectTargets(ccs,t=>{ccs.selectedTargets=t;});
sc('チェンジ・シンクロン').resolve(ccs);
ok('チェンジ・シンクロン positive: 相手モンスターの表示形式が変わる',
   cfoe.pos==='def','pos='+cfoe.pos);

/* ============ アタック・ゲイナー ============ */
reset0();
let ag=mk('アタック・ゲイナー',0),at2=mk('ジェネクス・コントローラー',0),afoe=mk(BIG,1);
gameState.players[0].mz=[ag,at2];gameState.players[1].mz=[afoe];
let agk=synchroSummon(0,'BF－アーマード・ウィング',[ag,at2]);
let cag=ctxEv(0,ag,'onSendToGrave',matEvt(agk,ag),'grave');
ok('アタック・ゲイナー positive: 素材になって誘発する',
   sc('アタック・ゲイナー').passive.onSendToGrave(cag)===true);
sc('アタック・ゲイナー').selectTargets(cag,t=>{cag.selectedTargets=t;});
sc('アタック・ゲイナー').resolve(cag);
ok('アタック・ゲイナー positive: 相手モンスターの攻撃力が1000ダウン',
   curATK(afoe)===3000-1000,'atk='+curATK(afoe));

/* ============ クイック・スパナイト ============ */
reset0();
let qs=mk('クイック・スパナイト',0),qt=mk('ジェネクス・コントローラー',0),qfoe=mk(BIG,1);
gameState.players[0].mz=[qs,qt];gameState.players[1].mz=[qfoe];
let qsk=synchroSummon(0,'BF－アーマード・ウィング',[qs,qt]);
let cqs=ctxEv(0,qs,'onSendToGrave',matEvt(qsk,qs),'grave');
sc('クイック・スパナイト').selectTargets(cqs,t=>{cqs.selectedTargets=t;});
sc('クイック・スパナイト').resolve(cqs);
ok('クイック・スパナイト positive: 相手モンスターの攻撃力が500ダウン',
   curATK(qfoe)===3000-500,'atk='+curATK(qfoe));
gameState.turn=gameState.turn+1;
ok('クイック・スパナイト ruling: 期限の記述が無いので次のターンも継続する',
   curATK(qfoe)===3000-500,'atk='+curATK(qfoe));

/* ============ ダーク・スプロケッター（闇属性シンクロ） ============ */
reset0();
let ds=mk('ダーク・スプロケッター',0),dt=mk('ジェネクス・コントローラー',0),dST=mk('落とし穴',1,'up');
gameState.players[0].mz=[ds,dt];gameState.players[1].sz=[dST];
let dsk=synchroSummon(0,'BF－アーマード・ウィング',[ds,dt]);
ok('前提: 使用したシンクロは闇属性',dbOf(dsk.syn).at==='闇','at='+dbOf(dsk.syn).at);
let cds=ctxEv(0,ds,'onSendToGrave',matEvt(dsk,ds),'grave');
ok('ダーク・スプロケッター positive: 闇属性シンクロの素材になって誘発する',
   sc('ダーク・スプロケッター').passive.onSendToGrave(cds)===true);
sc('ダーク・スプロケッター').selectTargets(cds,t=>{cds.selectedTargets=t;});
sc('ダーク・スプロケッター').resolve(cds);
ok('ダーク・スプロケッター positive: 表側表示の魔法・罠が破壊される',
   gameState.players[1].sz.length===0);
reset0();
let ds2=mk('ダーク・スプロケッター',0),dt2=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[ds2,dt2];gameState.players[1].sz=[mk('落とし穴',1,'up')];
let dsk2=synchroSummon(0,'マジカル・アンドロイド',[ds2,dt2]);  /* 光属性 */
ok('ダーク・スプロケッター negative: 闇属性以外のシンクロでは誘発しない',
   sc('ダーク・スプロケッター').passive.onSendToGrave(
     ctxEv(0,ds2,'onSendToGrave',matEvt(dsk2,ds2),'grave'))===false);

/* ============ メンタル・カウンセラー リリー ============ */
reset0();
let ml=mk('メンタル・カウンセラー リリー',0),mt=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[ml,mt];
let mlk=synchroSummon(0,'BF－アーマード・ウィング',[ml,mt]);
let cml=ctxEv(0,ml,'onSendToGrave',matEvt(mlk,ml),'grave');
ok('メンタル・カウンセラー リリー positive: 素材になって誘発する',
   sc('メンタル・カウンセラー リリー').passive.onSendToGrave(cml)===true);
let synAtk=dbOf(mlk.syn).atk;
sc('メンタル・カウンセラー リリー').cost(cml,()=>{});
sc('メンタル・カウンセラー リリー').resolve(cml);
ok('メンタル・カウンセラー リリー positive: 500払ってシンクロの攻撃力が1000アップ',
   gameState.players[0].lp===8000-500&&curATK(mlk.syn)===synAtk+1000,
   'lp='+gameState.players[0].lp+' atk='+curATK(mlk.syn));

/* ============ ブライ・シンクロン ============ */
reset0();
let bs=mk('ブライ・シンクロン',0),bt=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[bs,bt];
let bsk=synchroSummon(0,'BF－アーマード・ウィング',[bs,bt]);
let cbs=ctxEv(0,bs,'onSendToGrave',matEvt(bsk,bs),'grave');
ok('ブライ・シンクロン positive: 素材になって誘発する',
   sc('ブライ・シンクロン').passive.onSendToGrave(cbs)===true);
let bAtk=dbOf(bsk.syn).atk;
sc('ブライ・シンクロン').resolve(cbs);
ok('ブライ・シンクロン positive: シンクロの攻撃力が600アップ',
   curATK(bsk.syn)===bAtk+600,'atk='+curATK(bsk.syn));
ok('ブライ・シンクロン positive: シンクロの効果が無効化される',
   API.isEffectNegated(h(bsk.syn))===true);

/* ============ ハイパー・シンクロン（ドラゴン族シンクロ） ============ */
reset0();
let hs=mk('ハイパー・シンクロン',0),ht=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[hs,ht];
let hsk=synchroSummon(0,'スクラップ・ドラゴン',[hs,ht]);
ok('前提: 使用したシンクロはドラゴン族',dbOf(hsk.syn).ra==='ドラゴン','ra='+dbOf(hsk.syn).ra);
let chs=ctxEv(0,hs,'onSendToGrave',matEvt(hsk,hs),'grave');
ok('ハイパー・シンクロン positive: ドラゴン族シンクロの素材になって誘発する',
   sc('ハイパー・シンクロン').passive.onSendToGrave(chs)===true);
let hAtk=dbOf(hsk.syn).atk;
sc('ハイパー・シンクロン').resolve(chs);
ok('ハイパー・シンクロン positive: シンクロの攻撃力が800アップ',
   curATK(hsk.syn)===hAtk+800,'atk='+curATK(hsk.syn));
ok('ハイパー・シンクロン ruling: エンドフェイズの除外が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c8.hyperSynchron'));
let hsSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c8.hyperSynchron');
scheduleHandlerV7('c8.hyperSynchron')(hsSch.args||{}, hsSch);
ok('ハイパー・シンクロン ruling: 予約が解決するとシンクロが除外される',
   gameState.players[0].banish.some(c=>c===hsk.syn),
   'banish='+gameState.players[0].banish.length);

/* ============ バイス・バーサーカー ============ */
reset0();
let vb=mk('バイス・バーサーカー',0),vt=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[vb,vt];
let vbk=synchroSummon(0,'BF－アーマード・ウィング',[vb,vt]);
let cvb=ctxEv(0,vb,'onSendToGrave',matEvt(vbk,vb),'grave');
ok('バイス・バーサーカー positive: 素材になって誘発する',
   sc('バイス・バーサーカー').passive.onSendToGrave(cvb)===true);
let vLp=gameState.players[0].lp, vAtk=dbOf(vbk.syn).atk;
sc('バイス・バーサーカー').resolve(cvb);
ok('バイス・バーサーカー positive: シンクロ召喚したプレイヤーが2000ダメージを受ける',
   gameState.players[0].lp===vLp-2000,'lp='+gameState.players[0].lp);
ok('バイス・バーサーカー positive: シンクロの攻撃力が2000アップ',
   curATK(vbk.syn)===vAtk+2000,'atk='+curATK(vbk.syn));

/* ============ マジドッグ（魔法使い族シンクロ） ============ */
reset0();
let md=mk('マジドッグ',0),mdt=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[md,mdt];
gameState.players[0].grave=[mk('天空の聖域',0)];
let mdk=synchroSummon(0,'マジックテンペスター',[md,mdt]);
ok('前提: 使用したシンクロは魔法使い族',dbOf(mdk.syn).ra==='魔法使い','ra='+dbOf(mdk.syn).ra);
let cmd=ctxEv(0,md,'onSendToGrave',matEvt(mdk,md),'grave');
ok('マジドッグ positive: 魔法使い族シンクロの素材になって誘発する',
   sc('マジドッグ').passive.onSendToGrave(cmd)===true);
sc('マジドッグ').selectTargets(cmd,t=>{cmd.selectedTargets=t;});
sc('マジドッグ').resolve(cmd);
ok('マジドッグ positive: 墓地のフィールド魔法が手札に加わる',
   gameState.players[0].hand.some(c=>dbOf(c).n==='天空の聖域'),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let md2=mk('マジドッグ',0),mdt2=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[md2,mdt2];gameState.players[0].grave=[mk('天空の聖域',0)];
let mdk2=synchroSummon(0,'BF－アーマード・ウィング',[md2,mdt2]);  /* ドラゴン族 */
ok('マジドッグ negative: 魔法使い族以外のシンクロでは誘発しない',
   sc('マジドッグ').passive.onSendToGrave(
     ctxEv(0,md2,'onSendToGrave',matEvt(mdk2,md2),'grave'))===false);

/* ============ ヴァイロン・キューブ（光属性シンクロ） ============ */
reset0();
let vc=mk('ヴァイロン・キューブ',0),vct=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[vc,vct];
gameState.players[0].deck=[mk('デーモンの斧',0),mk(PLAIN,0)];
let vck=synchroSummon(0,'マジカル・アンドロイド',[vc,vct]);
let cvc=ctxEv(0,vc,'onSendToGrave',matEvt(vck,vc),'grave');
ok('ヴァイロン・キューブ positive: 光属性シンクロの素材になって誘発する',
   sc('ヴァイロン・キューブ').passive.onSendToGrave(cvc)===true);
sc('ヴァイロン・キューブ').selectTargets(cvc,t=>{cvc.selectedTargets=t;});
sc('ヴァイロン・キューブ').resolve(cvc);
ok('ヴァイロン・キューブ positive: デッキの装備魔法が手札に加わる',
   gameState.players[0].hand.some(c=>dbOf(c).sub==='装備'),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));

/* ============ X－セイバー ウェイン ============ */
reset0();
let xw=mk('ジェネクス・コントローラー',0),xn=mk(PLAIN,0);
gameState.players[0].mz=[xw,xn];
gameState.players[0].hand=[mk('切り込み隊長',0)];   /* 戦士族 lv3 */
let xwk=synchroSummon(0,'X－セイバー ウェイン',[xw,xn]);
let cxw=ctxEv(0,xwk.syn,'onSpecialSummon',synEvt(xwk),'mz');
ok('X－セイバー ウェイン positive: 自身のシンクロ召喚成功で誘発する',
   sc('X－セイバー ウェイン').passive.onSpecialSummon(cxw)===true);
sc('X－セイバー ウェイン').selectTargets(cxw,t=>{cxw.selectedTargets=t;});
sc('X－セイバー ウェイン').resolve(cxw);
ok('X－セイバー ウェイン positive: 手札のレベル4以下の戦士族が特殊召喚される',
   gameState.players[0].mz.some(c=>dbOf(c).n==='切り込み隊長')
   &&gameState.players[0].hand.length===0,
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let xw2=mk('ジェネクス・コントローラー',0),xn2=mk(PLAIN,0);
gameState.players[0].mz=[xw2,xn2];
gameState.players[0].hand=[mk(BIG,0)];             /* ドラゴン族 lv8 */
let xwk2=synchroSummon(0,'X－セイバー ウェイン',[xw2,xn2]);
ok('X－セイバー ウェイン negative: 手札にレベル4以下の戦士族がいなければ発動できない',
   sc('X－セイバー ウェイン').passive.onSpecialSummon(
     ctxEv(0,xwk2.syn,'onSpecialSummon',synEvt(xwk2),'mz'))===false);

/* ============ エンシェント・ゴッド・フレムベル ============ */
reset0();
let ag2=mk('ジェネクス・コントローラー',0),an2=mk(PLAIN,0);
gameState.players[0].mz=[ag2,an2];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1)];
gameState.players[1].grave=[mk(PLAIN,1),mk(BIG,1),mk(PLAIN,1)];
let agk2=synchroSummon(0,'エンシェント・ゴッド・フレムベル',[ag2,an2]);
let cag2=ctxEv(0,agk2.syn,'onSpecialSummon',synEvt(agk2),'mz');
ok('エンシェント・ゴッド・フレムベル positive: 自身のシンクロ召喚成功で誘発する',
   sc('エンシェント・ゴッド・フレムベル').passive.onSpecialSummon(cag2)===true);
let egAtk=dbOf(agk2.syn).atk;
sc('エンシェント・ゴッド・フレムベル').resolve(cag2);
let peg=pending();
ok('エンシェント・ゴッド・フレムベル ruling: 除外できるのは相手の手札の枚数まで',
   !!peg&&peg.max===2,'max='+(peg&&peg.max));
answerChoiceV49(peg.candidates.slice(0,2).map(x=>x.key));
ok('エンシェント・ゴッド・フレムベル positive: 相手の墓地が除外される',
   gameState.players[1].banish.length===2&&gameState.players[1].grave.length===1,
   'banish='+gameState.players[1].banish.length);
ok('エンシェント・ゴッド・フレムベル positive: 除外した数×200アップ',
   curATK(agk2.syn)===egAtk+400,'atk='+curATK(agk2.syn));

/* ============ スターダスト・シャオロン ============ */
reset0();
let sx=mk('スターダスト・シャオロン',0),sm1=mk('ジェネクス・コントローラー',0),sm2=mk(PLAIN,0);
gameState.players[0].grave=[sx];
gameState.players[0].mz=[sm1,sm2];
let sxk=synchroSummon(0,'スターダスト・ドラゴン',[sm1,sm2]);
let csx=ctxEv(0,sx,'onSpecialSummon',synEvt(sxk),'grave');
ok('スターダスト・シャオロン positive: 「スターダスト・ドラゴン」のシンクロ召喚で誘発する',
   sc('スターダスト・シャオロン').passive.onSpecialSummon(csx)===true);
sc('スターダスト・シャオロン').resolve(csx);
ok('スターダスト・シャオロン positive: 墓地から表側攻撃表示で特殊召喚される',
   gameState.players[0].mz.some(c=>c===sx)&&sx.pos==='atk'&&sx.face==='up');
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
ok('スターダスト・シャオロン positive: 1ターンに1度だけ戦闘では破壊されない',!!battleProt(sx));
ok('スターダスト・シャオロン ruling: 2回目は守られない',!battleProt(sx));
reset0();
let sx2=mk('スターダスト・シャオロン',0),sn1=mk('ジェネクス・コントローラー',0),sn2=mk(PLAIN,0);
gameState.players[0].grave=[sx2];gameState.players[0].mz=[sn1,sn2];
let sxk2=synchroSummon(0,'BF－アーマード・ウィング',[sn1,sn2]);
ok('スターダスト・シャオロン negative: 他のシンクロモンスターでは誘発しない',
   sc('スターダスト・シャオロン').passive.onSpecialSummon(
     ctxEv(0,sx2,'onSpecialSummon',synEvt(sxk2),'grave'))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('ダークシー・レスキュー',0),ro2=mk('ブライ・シンクロン',0);
gameState.players[0].grave=[ro1,ro2];
gameState.players[0].deck=[mk(PLAIN,0)];
[ro1,ro2].forEach(c=>ensureCardUid(gameState,c));
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ダークシー・レスキュー').passive.onSendToGrave(
  ctxEv(0,ro1,'onSendToGrave',{player:0,uid:ro1.uid,reason:'effect'},'grave'));
sc('ブライ・シンクロン').passive.onSendToGrave(
  ctxEv(0,ro2,'onSendToGrave',{player:0,uid:ro2.uid,reason:'effect'},'grave'));
ok('cycle19 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('ハイパー・シンクロン',0),rt1=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[rp1,rt1];
let rpk=synchroSummon(0,'BF－アーマード・ウィング',[rp1,rt1]);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.modAtk(h(rpk.syn),800,0,'permanent','ハイパー・シンクロン');
API.schedule({at:'endPhase',turns:0,player:0,handler:'c8.hyperSynchron',
  args:{uid:rpk.syn.uid},source:{card:rp1},note:'ハイパー・シンクロン'});
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle19 Replay: 攻撃力修正と除外予約が digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('ブライ・シンクロン',0),rt2=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[rp2,rt2];
let rpk2=synchroSummon(0,'BF－アーマード・ウィング',[rp2,rt2]);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.negateEffectUntil(h(rpk2.syn),'endTurn','ブライ・シンクロン',rp2);
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle19 Replay: 期限付き効果無効化が digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle19 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle19 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
