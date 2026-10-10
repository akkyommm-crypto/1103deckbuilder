/* System P3 — Provenance 第1弾 回帰テスト
   対象は承認された3系統のみ:
     1. summon provenance   … 召喚方法と素材 identity / snapshot
     2. cost snapshot       … コストにした時点の値
     3. move provenance     … どこから／なぜ／誰の効果で移動したか
   検証項目:
     schema / 疎snapshot / 直列化 / 既存フィールド不変 /
     digest後方互換 / Replay / Undo / Redo / SaveLoad                      */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');

const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};

const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=77100;
/* engine 側の reset(card) を隠さないよう、ヘルパ名は resetP3 にする */
function mk3(n,p){p=p||0;const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  return {id,owner:p,controller:p,face:'up',pos:'atk',uid:__u++};}
function resetP3(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  v41ResetActionJournal(gameState);
}
const BLUE='青眼の白龍', ELF='ヂェミナイ・エルフ', GOLEM='岩石の巨兵';

/* =====================================================================
   1. 疎 snapshot の schema
   ===================================================================== */
resetP3();
let sm=mk3(ELF); gameState.players[0].mz=[sm];
let snapA=snapshotCardV3(sm,['atk']);
ok('P3 snapshot: uid と code は常に入る', snapA.uid===sm.uid && typeof snapA.code==='number');
ok('P3 snapshot: 指定しないフィールドは保存しない',
   Object.keys(snapA).sort().join(',')==='atk,code,uid', Object.keys(snapA).join(','));
ok('P3 snapshot: 許可外フィールドは無視される',
   Object.keys(snapshotCardV3(sm,['atk','secretPlan'])).indexOf('secretPlan')<0);
ok('P3 snapshot: identity にカード名を使わない',
   JSON.stringify(snapA).indexOf(ELF)<0);
/* 現在値と元々の値の区別 */
sm.mods=[{atk:800}];
let snapCur=snapshotCardV3(sm,['atk']), snapOrg=snapshotOriginalCardV3(sm,['atk']);
ok('P3 snapshot: 現在ATKを取れる', snapCur.atk===curATK(sm), 'cur='+snapCur.atk+' curATK='+curATK(sm));
ok('P3 snapshot: 元々のATKは修正値に影響されない', snapOrg.atk===1900, 'org='+snapOrg.atk);
ok('P3 snapshot: 現在値と元々の値は別物', snapCur.atk!==snapOrg.atk);
delete sm.mods;
let snapMulti=snapshotCardV3(sm,['atk','def','level','attribute','race','controller','owner','zone']);
ok('P3 snapshot: 複数フィールド指定が効く',
   snapMulti.level===4 && snapMulti.controller===0 && snapMulti.zone==='mz',
   JSON.stringify(snapMulti));
ok('P3 snapshot: 直列化可能', assertProvenanceSerializableV3(snapMulti).ok);
ok('P3 直列化: 関数は拒否される', !assertProvenanceSerializableV3({f:()=>{}}).ok);
ok('P3 直列化: Map は拒否される', !assertProvenanceSerializableV3({m:new Map()}).ok);
ok('P3 直列化: Promise は拒否される', !assertProvenanceSerializableV3({p:Promise.resolve(1)}).ok);

/* =====================================================================
   2. summon provenance（アドバンス召喚）
   ===================================================================== */
resetP3();
let m1=mk3(ELF), m2=mk3(ELF), blue=mk3(BLUE);
gameState.players[0].mz=[m1,m2];
gameState.players[0].hand=[blue];
m1.mods=[{atk:500}];                       /* リリース前に強化しておく */
v41ResetActionJournal(gameState);
let mats=[m1,m2].map(c=>snapshotCardV3(c,['atk','level','race','attribute','owner']));
let preAtk=curATK(m1);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:1,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:2,tributeValue:2,p3Materials:mats});
let sumCard=gameState.players[0].mz[0];
let sp=summonProvenanceOfV3(sumCard);
ok('P3 召喚: アドバンス召喚は summonType=tribute', !!sp && sp.summonType==='tribute', JSON.stringify(sp));
ok('P3 召喚: 素材 identity は uid で残る',
   !!sp && sp.materialRefs.length===2 && sp.materialRefs.indexOf(m1.uid)>=0 && sp.materialRefs.indexOf(m2.uid)>=0);
ok('P3 召喚: 素材 snapshot がリリース前の値を保持する',
   materialSnapshotsOfV3(sumCard).some(s=>s.uid===m1.uid&&s.atk===preAtk) && preAtk===2400,
   'preAtk='+preAtk);
ok('P3 召喚: 素材 snapshot は名前を持たない',
   JSON.stringify(materialSnapshotsOfV3(sumCard)).indexOf(ELF)<0);
let matNow=findCardByUid(m1.uid);
ok('P3 召喚: 素材側からも召喚を辿れる',
   !!matNow && wasUsedAsMaterialV3(matNow.card,'tribute') &&
   matNow.card.usedAsMaterial.summonedUid===sumCard.uid, JSON.stringify(matNow&&matNow.card.usedAsMaterial));
ok('P3 召喚: 素材は墓地にいる', matNow.zone==='grave');
ok('P3 召喚: 素材の移動は reason=tribute で残る',
   moveProvenanceOfV3(matNow.card) && moveProvenanceOfV3(matNow.card).reason==='tribute' &&
   moveProvenanceOfV3(matNow.card).fromZone==='mz');
ok('P3 召喚: 既存 tributeCount/tributeValue は変わらない',
   sumCard.tributeCount===2 && sumCard.tributeValue===2);
ok('P3 召喚: provenance は直列化可能', assertProvenanceSerializableV3(sp).ok);

/* 通常召喚（リリース無し） */
resetP3();
let golem=mk3(GOLEM); gameState.players[0].hand=[golem]; v41ResetActionJournal(gameState);
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:0,tributeValue:0,p3Materials:[]});
let g0=gameState.players[0].mz[0];
ok('P3 召喚: リリース無しは summonType=normal', summonProvenanceOfV3(g0).summonType==='normal');
ok('P3 召喚: 素材が無ければ materialRefs を作らない',
   summonProvenanceOfV3(g0).materialRefs===undefined && materialSnapshotsOfV3(g0).length===0);
ok('P3 召喚: 素材でないカードは usedAsMaterial を持たない', !wasUsedAsMaterialV3(g0));

/* セットは召喚ではない */
resetP3();
let s1=mk3(ELF), setTarget=mk3(BLUE);
gameState.players[0].mz=[s1]; gameState.players[0].hand=[setTarget];
v41ResetActionJournal(gameState);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'SET_MONSTER',player:0,handIndex:0,tributes:1,tributeValue:1,
     p3Materials:[snapshotCardV3(s1,['atk'])]});
let setCard=gameState.players[0].mz[0];
ok('P3 セット: セットは召喚ではないので summonProvenance を付けない',
   summonProvenanceOfV3(setCard)===null, JSON.stringify(setCard.summonProvenance));
ok('P3 セット: アドバンスセットの素材に usedAsMaterial を付けない',
   !wasUsedAsMaterialV3(findCardByUid(s1.uid).card));
ok('P3 セット: リリース自体は moveProvenance に残る',
   moveProvenanceOfV3(findCardByUid(s1.uid).card).reason==='tribute');

/* =====================================================================
   3. pickTributes 経路（スナップショットはリリース前に取られること）
   ===================================================================== */
resetP3();
let t1=mk3(ELF), t2=mk3(ELF), tSummon=mk3(BLUE);
gameState.players[0].mz=[t1,t2]; gameState.players[0].hand=[tSummon];
t1.mods=[{atk:1000}];
v41ResetActionJournal(gameState);
let payment=null;
pickTributes(0,2,[{card:t1,value:1},{card:t2,value:1}],pay=>{payment=pay;},dbOf(tSummon));
ok('P3 pickTributes: payment に素材 snapshot が乗る',
   !!payment && Array.isArray(payment.p3Materials) && payment.p3Materials.length===2);
ok('P3 pickTributes: snapshot はリリース前の現在ATK',
   !!payment && payment.p3Materials.some(s=>s.uid===t1.uid&&s.atk===2900),
   JSON.stringify(payment&&payment.p3Materials));
ok('P3 pickTributes: 素材は既に墓地へ送られている',
   gameState.players[0].mz.length===0 && gameState.players[0].grave.length===2);
ok('P3 pickTributes: 既存 payment フィールドは不変',
   payment.bodies===2 && payment.value===2);
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',
     tributes:payment.bodies,tributeValue:payment.value,p3Materials:payment.p3Materials});
ok('P3 pickTributes: payment を渡すと召喚 provenance が完成する',
   summonProvenanceOfV3(gameState.players[0].mz[0]).materialRefs.length===2);

/* =====================================================================
   4. move provenance（既存フィールドの意味を変えないこと）
   ===================================================================== */
resetP3();
let mv=mk3(ELF); gameState.players[0].mz=[mv]; v41ResetActionJournal(gameState);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'通常破壊'});
ok('P3 移動: p3 の無い Action は moveProvenance を作らない',
   moveProvenanceOfV3(gameState.players[0].grave[0])===null);
ok('P3 移動: 既存 graveInfo は従来どおり作られる',
   !!gameState.players[0].grave[0].graveInfo && gameState.players[0].grave[0].graveInfo.from==='mz');

/* 手札コスト捨て: discardInfo の既存意味（byEffect=false なら null）を保つ */
resetP3();
let hc=mk3(ELF); gameState.players[0].hand=[hc]; v41ResetActionJournal(gameState);
act({type:'FX_DISCARD',player:0,index:0,byEffect:false,
     p3:{reason:'cost',actingPlayer:0,fromZone:'hand'}});
let disc=gameState.players[0].grave[0];
ok('P3 移動: コスト捨ては reason=cost',
   moveProvenanceOfV3(disc) && moveProvenanceOfV3(disc).reason==='cost');
ok('P3 移動: 既存 discardInfo の意味を変えない（コストでは付かない）',
   disc.discardInfo==null, JSON.stringify(disc.discardInfo));

/* 相手の効果で捨てさせる: byPlayer は手札の持ち主基準、actingPlayer は効果側 */
resetP3();
let hd=mk3(ELF,0); gameState.players[0].hand=[hd]; v41ResetActionJournal(gameState);
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,
     p3:{reason:'effect',actingPlayer:1,fromZone:'hand'}});
let disc2=gameState.players[0].grave[0];
ok('P3 移動: 既存 discardInfo.byPlayer の意味は従来のまま',
   !!disc2.discardInfo && disc2.discardInfo.byEffect===true && disc2.discardInfo.byPlayer===0,
   JSON.stringify(disc2.discardInfo));
ok('P3 移動: actingPlayer は別フィールドとして併設される',
   moveProvenanceOfV3(disc2).actingPlayer===1);
ok('P3 移動: 相手の効果で動かされたと判定できる', movedByOpponentEffectV3(disc2,0)===true);
ok('P3 移動: 自分の効果なら相手効果とは判定しない', movedByOpponentEffectV3(disc2,1)===false);
ok('P3 移動: reason=cost は「相手の効果で移動」に含めない',
   movedByOpponentEffectV3(disc,1)===false);
/* 未知 reason は effect へ丸める（不正値でスキーマが壊れない） */
resetP3();
let hz=mk3(ELF); gameState.players[0].hand=[hz]; v41ResetActionJournal(gameState);
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,p3:{reason:'なにか未知',actingPlayer:0}});
ok('P3 移動: 未知 reason は effect に正規化される',
   moveProvenanceOfV3(gameState.players[0].grave[0]).reason==='effect');

/* =====================================================================
   5. cost snapshot
   ===================================================================== */
resetP3();
let cc=mk3(ELF); gameState.players[0].mz=[cc]; cc.mods=[{atk:100}];
v41ResetActionJournal(gameState);
beginCostSnapshotsV3(gameState);
recordCostSnapshotV3(cc,['atk','level'],gameState);
ok('P3 コスト: 記録は pendingCostSnapshots に貯まる',
   gameState.pendingCostSnapshots.length===1 && gameState.pendingCostSnapshots[0].atk===2000);
act({type:'CHAIN_ADD',player:0,cardId:cc.id,uid:cc.uid,name:'テスト発動',ss:'spell',from:'sz',index:0,
     costSnapshots:takeCostSnapshotsV3(gameState)});
let link=gameState.chain[gameState.chain.length-1];
ok('P3 コスト: チェーンリンクへ引き継がれる',
   costSnapshotsOfChainLinkV3(link).length===1 && costSnapshotsOfChainLinkV3(link)[0].atk===2000);
ok('P3 コスト: identity は uid', costSnapshotsOfChainLinkV3(link)[0].uid===cc.uid);
ok('P3 コスト: 消費後に pending は空になる', gameState.pendingCostSnapshots.length===0);
ok('P3 コスト: 直列化可能', assertProvenanceSerializableV3(link.costSnapshots).ok);
/* コスト無しの発動ではフィールドを作らない */
resetP3();
let cn=mk3(ELF); gameState.players[0].sz=[cn]; v41ResetActionJournal(gameState);
act({type:'CHAIN_ADD',player:0,cardId:cn.id,uid:cn.uid,name:'コスト無し',ss:'spell',from:'sz',index:0});
ok('P3 コスト: コストが無ければリンクにフィールドを作らない',
   gameState.chain[0].costSnapshots===undefined && costSnapshotsOfChainLinkV3(gameState.chain[0]).length===0);

/* =====================================================================
   6. digest 後方互換
   ===================================================================== */
resetP3();
let d1=mk3(ELF); gameState.players[0].mz=[d1]; v41ResetActionJournal(gameState);
let txtPlain=v41StateDigestText(gameState), digPlain=v41StateDigest(gameState);
ok('P3 後方互換: provenance が無ければ digest 文字列に P3C を足さない', txtPlain.indexOf('P3C')<0);
ok('P3 後方互換: provenance が無いカードの digest に新キーが出ない',
   v41CardDigest(d1).indexOf('summonProvenance')<0 && v41CardDigest(d1).indexOf('moveProvenance')<0,
   v41CardDigest(d1));
let digBefore=v41CardDigest(d1);
d1.moveProvenance={reason:'effect',actingPlayer:1,fromZone:'hand'};
ok('P3 digest: provenance が付くと digest は変化する', v41CardDigest(d1)!==digBefore);
delete d1.moveProvenance;
ok('P3 digest: provenance を外すと元の digest に戻る', v41CardDigest(d1)===digBefore);
gameState.chain=[{chainId:1,costSnapshots:[{uid:1,code:2,atk:100}]}];
ok('P3 digest: cost snapshot があるときだけ P3C が載る',
   v41StateDigestText(gameState).indexOf('P3C')>=0);
gameState.chain=[];
ok('P3 digest: 元に戻すと digest も一致する', v41StateDigest(gameState)===digPlain);

/* =====================================================================
   7. Replay / Undo / Redo / SaveLoad
   ===================================================================== */
resetP3();
let r1=mk3(ELF), r2=mk3(ELF), rb=mk3(BLUE);
gameState.players[0].mz=[r1,r2]; gameState.players[0].hand=[rb];
v41ResetActionJournal(gameState);
let rmats=[r1,r2].map(c=>snapshotCardV3(c,['atk','level']));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:1,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:2,tributeValue:2,p3Materials:rmats});
let pkg=v41ReplayPackage(gameState), audit=v44ReplayAuditPackage(pkg);
ok('P3 Replay: provenance を含む進行が digest 一致で再生される', audit.ok, audit.reason||audit.finalDigest);

let snapJson=JSON.stringify(gameState);
let round=JSON.parse(snapJson);
ok('P3 SaveLoad: gameState は JSON 往復で完全一致', JSON.stringify(round)===snapJson);
gameState=round;
ok('P3 SaveLoad: 復元後も summonProvenance が読める',
   summonProvenanceOfV3(gameState.players[0].mz[0]).summonType==='tribute');
ok('P3 SaveLoad: 復元後も素材 snapshot が読める',
   materialSnapshotsOfV3(gameState.players[0].mz[0]).length===2);
ok('P3 SaveLoad: 復元後も usedAsMaterial が読める',
   wasUsedAsMaterialV3(findCardByUid(r1.uid).card,'tribute'));

undo();
ok('P3 Undo: 召喚が巻き戻る', gameState.players[0].hand.length===1 && gameState.players[0].mz.length===0);
undo(); undo();
ok('P3 Undo: リリースまで巻き戻ると素材が場に戻る', gameState.players[0].mz.length===2);
ok('P3 Undo: 巻き戻した素材に usedAsMaterial が残らない',
   gameState.players[0].mz.every(c=>!wasUsedAsMaterialV3(c)));
ok('P3 Undo: 巻き戻した素材に moveProvenance が残らない',
   gameState.players[0].mz.every(c=>moveProvenanceOfV3(c)===null));
redo(); redo(); redo();
ok('P3 Redo: 召喚 provenance まで復元される',
   gameState.players[0].mz.length===1 &&
   summonProvenanceOfV3(gameState.players[0].mz[0]).materialRefs.length===2);
ok('P3 Redo: 素材の usedAsMaterial も復元される',
   wasUsedAsMaterialV3(findCardByUid(r1.uid).card,'tribute'));

/* gameState 全体に関数・非直列化物が混入していないこと */
function scanFns3(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFns3(v[k],d+1)); }
ok('P3 直列化: gameState 全体に関数が混入していない',
   !scanFns3(JSON.parse(JSON.stringify(gameState)),0));
ok('P3 履歴: gameState に無制限の provenance ログを作っていない',
   gameState.provenanceLog===undefined && Array.isArray(gameState.pendingCostSnapshots) &&
   gameState.pendingCostSnapshots.length===0);

/* =====================================================================
   8. provenance の自動付与（既存カードスクリプトを一切書き換えないこと）
   ===================================================================== */
resetP3();
let a1=mk3(ELF); gameState.players[0].hand=[a1]; v41ResetActionJournal(gameState);
p3BeginEffectContextV3(1);                       /* 相手(P1)の効果が解決中 */
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,byPlayer:1,reason:'押収'});
p3EndEffectContextV3();
let auto1=gameState.players[0].grave[0];
ok('P3 自動付与: スクリプトが何も渡さなくても actingPlayer が付く',
   moveProvenanceOfV3(auto1) && moveProvenanceOfV3(auto1).actingPlayer===1 &&
   moveProvenanceOfV3(auto1).reason==='effect', JSON.stringify(moveProvenanceOfV3(auto1)));
ok('P3 自動付与: 相手の効果で手札から墓地へ送られたと判定できる',
   movedByOpponentEffectV3(auto1,0)===true);
ok('P3 自動付与: 既存 discardInfo.byPlayer の意味は変えない',
   auto1.discardInfo.byPlayer===1);

/* デッキから墓地（discardInfo が存在しない経路） */
resetP3();
let a2=mk3(ELF); gameState.players[0].deck=[a2]; v41ResetActionJournal(gameState);
p3BeginEffectContextV3(1);
act({type:'FX_MILL',player:0,count:1,reason:'相手の効果'});
p3EndEffectContextV3();
let auto2=gameState.players[0].grave[0];
ok('P3 自動付与: デッキ→墓地にも actingPlayer が付く',
   moveProvenanceOfV3(auto2) && moveProvenanceOfV3(auto2).actingPlayer===1);
ok('P3 自動付与: デッキ経路は discardInfo を持たないので P3 でしか判定できない',
   auto2.discardInfo==null && movedByOpponentEffectV3(auto2,0)===true);

/* コスト中は reason=cost になる */
resetP3();
let a3=mk3(ELF); gameState.players[0].hand=[a3]; v41ResetActionJournal(gameState);
p3BeginEffectContextV3(0); SCRIPT_PHASE='cost';
act({type:'FX_DISCARD',player:0,index:0,byEffect:false,reason:'コスト'});
SCRIPT_PHASE=null; p3EndEffectContextV3();
ok('P3 自動付与: コスト支払い中は reason=cost',
   moveProvenanceOfV3(gameState.players[0].grave[0]).reason==='cost');

/* 効果解決中でなければ何も付けない */
resetP3();
let a4=mk3(ELF); gameState.players[0].mz=[a4]; v41ResetActionJournal(gameState);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'ルール処理'});
ok('P3 自動付与: 効果解決中でなければ provenance を付けない',
   moveProvenanceOfV3(gameState.players[0].grave[0])===null);

/* 明示指定は自動付与より優先される */
resetP3();
let a5=mk3(ELF); gameState.players[0].mz=[a5]; v41ResetActionJournal(gameState);
p3BeginEffectContextV3(1);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'リリース',
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
p3EndEffectContextV3();
ok('P3 自動付与: 明示 p3 は上書きされない',
   moveProvenanceOfV3(gameState.players[0].grave[0]).reason==='tribute' &&
   moveProvenanceOfV3(gameState.players[0].grave[0]).actingPlayer===0);

/* Action へ焼き込まれているので Replay が再現できる（隠れ状態に依存しない） */
resetP3();
let a6=mk3(ELF); gameState.players[0].hand=[a6]; v41ResetActionJournal(gameState);
p3BeginEffectContextV3(1);
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,byPlayer:1,reason:'押収'});
p3EndEffectContextV3();
let jEntry=V41_ACTION_JOURNAL[V41_ACTION_JOURNAL.length-1];
ok('P3 自動付与: provenance は Action へ焼き込まれ Journal に残る',
   !!jEntry && !!jEntry.action.p3 && jEntry.action.p3.actingPlayer===1);
let autoPkg=v41ReplayPackage(gameState), autoAudit=v44ReplayAuditPackage(autoPkg);
ok('P3 自動付与: 自動付与を含む進行が digest 一致で再生される',
   autoAudit.ok, autoAudit.reason||autoAudit.finalDigest);

/* =====================================================================
   9. 元々の攻撃力（ガーゼット系が必要とする）
   ===================================================================== */
resetP3();
let o1=mk3(ELF); gameState.players[0].mz=[o1];
o1.mods=[{atk:700}];
ok('P3 元々の値: 一時修正は originalAtk に影響しない',
   snapshotCardV3(o1,['atk','originalAtk']).originalAtk===1900 &&
   snapshotCardV3(o1,['atk','originalAtk']).atk===2600);
o1.procedureBaseStats={atk:950,def:450};
ok('P3 元々の値: 召喚手順が変えた元々の数値を反映する',
   snapshotCardV3(o1,['originalAtk']).originalAtk===950);
ok('P3 元々の値: snapshotOriginalCardV3 も同じ値を返す',
   snapshotOriginalCardV3(o1,['atk']).atk===950);
delete o1.procedureBaseStats; delete o1.mods;
/* リリース経路で originalAtk が残ること */
resetP3();
let z1=mk3(ELF), z2=mk3(ELF), zb=mk3(BLUE);
gameState.players[0].mz=[z1,z2]; gameState.players[0].hand=[zb];
z1.mods=[{atk:1200}];
v41ResetActionJournal(gameState);
let zpay=null;
pickTributes(0,2,[{card:z1,value:1},{card:z2,value:1}],x=>{zpay=x;},dbOf(zb));
ok('P3 元々の値: リリース素材 snapshot に originalAtk が入る',
   zpay.p3Materials.every(m=>m.originalAtk===1900) &&
   zpay.p3Materials.some(m=>m.uid===z1.uid&&m.atk===3100),
   JSON.stringify(zpay.p3Materials));

/* =====================================================================
   10. 由来情報の「世代」— 古いイベント情報を今回の情報として使わないこと
   ===================================================================== */

/* ---- 10-1. usedAsMaterial: 同じuidのモンスターを再度アドバンス召喚しても
             1回目の素材が2回目の素材として扱われないこと ---- */
resetP3();
let genA=mk3(ELF), genB=mk3(ELF), genX=mk3(BLUE);
gameState.players[0].mz=[genA,genB]; gameState.players[0].hand=[genX];
v41ResetActionJournal(gameState);
/* 1回目: A をリリースして X をアドバンス召喚 */
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:1,tributeValue:1,
     p3Materials:[snapshotCardV3(genA,['atk'])]});
let firstX=gameState.players[0].mz[gameState.players[0].mz.length-1];
let firstProv=summonProvenanceOfV3(firstX);
ok('P3 世代: 1回目の召喚でAが素材として記録される',
   wasUsedAsMaterialV3(findCardByUid(genA.uid).card,'tribute') &&
   findCardByUid(genA.uid).card.usedAsMaterial.summonedUid===firstX.uid);
/* X が一度フィールドを離れ、手札へ戻る */
let xloc=locateCard(firstX);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:xloc.index,reason:'破壊',byDestroy:true});
let xg=findCardByUid(genX.uid);
act({type:'FX_BOUNCE',player:0,zone:'grave',index:xg.index,reason:'手札へ'});
ok('P3 世代: 同じ実体Xが手札へ戻る（uidは不変）',
   findCardByUid(genX.uid).zone==='hand' && findCardByUid(genX.uid).card.uid===genX.uid);
/* 2回目: B をリリースして同じ X をアドバンス召喚（素材はAではない） */
gameState.players[0].normalSummonUsed=false;   /* 次のターンを模す */
let bLoc=locateCard(genB);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:bLoc.index,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
let xh=findCardByUid(genX.uid);
act({type:'NORMAL_SUMMON',player:0,handIndex:xh.index,pos:'atk',tributes:1,tributeValue:1,
     p3Materials:[snapshotCardV3(genB,['atk'])]});
let secondX=gameState.players[0].mz[gameState.players[0].mz.length-1];
let secondProv=summonProvenanceOfV3(secondX);
let aStale=findCardByUid(genA.uid).card;
ok('P3 世代: 2回目の召喚の素材はBだけ',
   secondProv.materialRefs.length===1 && secondProv.materialRefs[0]===genB.uid);
ok('P3 世代: 2回目の召喚は1回目と別の召喚として識別できる',
   firstProv.summonInstance!=null && secondProv.summonInstance!=null &&
   firstProv.summonInstance!==secondProv.summonInstance,
   'first='+firstProv.summonInstance+' second='+secondProv.summonInstance);
/* 本命: 1回目の素材Aが2回目の召喚の素材と誤認されないこと */
ok('P3 世代: 1回目の素材Aは2回目の召喚の素材ではない',
   !(aStale.usedAsMaterial && secondProv.summonInstance!=null &&
     aStale.usedAsMaterial.summonInstance===secondProv.summonInstance),
   JSON.stringify(aStale.usedAsMaterial)+' vs '+JSON.stringify(secondProv));
ok('P3 世代: uid一致だけでは世代を区別できないことを確認',
   aStale.usedAsMaterial && aStale.usedAsMaterial.summonedUid===secondX.uid,
   'uidは同一実体なので一致する＝uidだけの比較は不十分');

/* ---- 10-2. summonProvenance は「最後に成功した今回の召喚」を表すこと ---- */
resetP3();
let sv=mk3(BLUE), svMat=mk3(ELF);
gameState.players[0].mz=[svMat]; gameState.players[0].hand=[sv];
v41ResetActionJournal(gameState);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:1,tributeValue:1,
     p3Materials:[snapshotCardV3(svMat,['atk','originalAtk'])]});
ok('P3 鮮度: アドバンス召喚直後は tribute',
   summonProvenanceOfV3(findCardByUid(sv.uid).card).summonType==='tribute');
/* 場を離れる -> 特殊召喚 */
let svl=locateCard(findCardByUid(sv.uid).card);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:svl.index,reason:'破壊',byDestroy:true});
ok('P3 鮮度: 場を離れたら召喚由来は残らない',
   summonProvenanceOfV3(findCardByUid(sv.uid).card)===null,
   JSON.stringify(findCardByUid(sv.uid).card.summonProvenance));
let svg=findCardByUid(sv.uid);
API.specialSummon(0,'grave',svg.index,'atk','蘇生');
ok('P3 鮮度: 特殊召喚後に古いアドバンス召喚の素材情報を参照しない',
   materialSnapshotsOfV3(findCardByUid(sv.uid).card).length===0,
   JSON.stringify(summonProvenanceOfV3(findCardByUid(sv.uid).card)));
/* もう一度場を離れて通常召喚（リリース無し） */
let svl2=locateCard(findCardByUid(sv.uid).card);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:svl2.index,reason:'破壊',byDestroy:true});
let svg2=findCardByUid(sv.uid);
act({type:'FX_BOUNCE',player:0,zone:'grave',index:svg2.index,reason:'手札へ'});
gameState.players[0].normalSummonUsed=false;
let svh=findCardByUid(sv.uid);
act({type:'NORMAL_SUMMON',player:0,handIndex:svh.index,pos:'atk',tributes:0,tributeValue:0,p3Materials:[]});
ok('P3 鮮度: 再度の通常召喚は normal で素材を持たない',
   summonProvenanceOfV3(findCardByUid(sv.uid).card).summonType==='normal' &&
   materialSnapshotsOfV3(findCardByUid(sv.uid).card).length===0);

/* ---- 10-3. moveProvenance は「今回の移動」だけを表すこと ---- */
resetP3();
let mvc=mk3(ELF); gameState.players[0].hand=[mvc]; v41ResetActionJournal(gameState);
p3BeginEffectContextV3(1);
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,byPlayer:1,reason:'相手の効果'});
p3EndEffectContextV3();
ok('P3 鮮度: 相手の効果で手札から墓地へ送られた',
   movedByOpponentEffectV3(findCardByUid(mvc.uid).card,0)===true);
/* 墓地->手札（自分の効果） */
let mvg=findCardByUid(mvc.uid);
p3BeginEffectContextV3(0);
act({type:'FX_BOUNCE',player:0,zone:'grave',index:mvg.index,reason:'自分の効果'});
p3EndEffectContextV3();
ok('P3 鮮度: 手札へ戻った後に古い「相手の効果」が残らない',
   movedByOpponentEffectV3(findCardByUid(mvc.uid).card,0)===false,
   JSON.stringify(moveProvenanceOfV3(findCardByUid(mvc.uid).card)));
/* ルール処理で手札から墓地へ（効果ではない） */
let mvh=findCardByUid(mvc.uid);
act({type:'FX_DISCARD',player:0,index:mvh.index,byEffect:false,reason:'手札制限'});
ok('P3 鮮度: ルール処理の移動を「相手の効果」と誤認しない',
   movedByOpponentEffectV3(findCardByUid(mvc.uid).card,0)===false,
   JSON.stringify(moveProvenanceOfV3(findCardByUid(mvc.uid).card)));
/* 墓地->除外 */
resetP3();
let bnc=mk3(ELF); gameState.players[0].hand=[bnc]; v41ResetActionJournal(gameState);
p3BeginEffectContextV3(1);
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,byPlayer:1,reason:'相手の効果'});
p3EndEffectContextV3();
let bng=findCardByUid(bnc.uid);
act({type:'FX_BANISH',player:0,zone:'grave',index:bng.index,reason:'ルール処理'});
let bnAfter=findCardByUid(bnc.uid);
ok('P3 鮮度: 除外された後に古い手札由来を今回の移動として使えない',
   bnAfter && bnAfter.zone==='banish' && movedByOpponentEffectV3(bnAfter.card,0)===false,
   JSON.stringify(bnAfter&&moveProvenanceOfV3(bnAfter.card)));

/* ---- 10-4. cost snapshot バッファが次の効果へ漏れないこと ---- */
resetP3();
let cb1=mk3(ELF), cb2=mk3(BLUE);
gameState.players[0].mz=[cb1,cb2]; v41ResetActionJournal(gameState);
/* (a) 発動を中断した場合（CHAIN_ADDに到達しない） */
beginCostSnapshotsV3(gameState);
recordCostSnapshotV3(cb1,['atk'],gameState);
ok('P3 コスト漏れ: 中断前はバッファに残っている',gameState.pendingCostSnapshots.length===1);
beginCostSnapshotsV3(gameState);
ok('P3 コスト漏れ: 次の発動準備でバッファが空になる',gameState.pendingCostSnapshots.length===0);
act({type:'CHAIN_ADD',player:0,cardId:cb2.id,uid:cb2.uid,name:'別の効果',ss:'spell',from:'sz',index:0,
     costSnapshots:takeCostSnapshotsV3(gameState)});
ok('P3 コスト漏れ: 中断した効果のコストが別の効果に混ざらない',
   costSnapshotsOfChainLinkV3(gameState.chain[gameState.chain.length-1]).length===0);
/* (b) チェーンに乗らない発動の後 */
resetP3();
let cb3=mk3(ELF), cb4=mk3(BLUE);
gameState.players[0].mz=[cb3,cb4]; v41ResetActionJournal(gameState);
beginCostSnapshotsV3(gameState);
recordCostSnapshotV3(cb3,['atk'],gameState);
ok('P3 コスト漏れ: チェーンに乗らない発動でも自分のコストは読める',
   gameState.pendingCostSnapshots.length===1 && gameState.pendingCostSnapshots[0].uid===cb3.uid);
beginCostSnapshotsV3(gameState);
ok('P3 コスト漏れ: 次のスクリプト開始で必ず空になる',gameState.pendingCostSnapshots.length===0);
/* (c) 正常にCHAIN_ADDした後 */
resetP3();
let cb5=mk3(ELF); gameState.players[0].mz=[cb5]; v41ResetActionJournal(gameState);
beginCostSnapshotsV3(gameState);
recordCostSnapshotV3(cb5,['atk'],gameState);
act({type:'CHAIN_ADD',player:0,cardId:cb5.id,uid:cb5.uid,name:'正常な効果',ss:'spell',from:'sz',index:0,
     costSnapshots:takeCostSnapshotsV3(gameState)});
ok('P3 コスト漏れ: 正常なCHAIN_ADD後はバッファが空',gameState.pendingCostSnapshots.length===0);
ok('P3 コスト漏れ: リンク側には残る',
   costSnapshotsOfChainLinkV3(gameState.chain[0]).length===1);

/* ---- 10-5. 世代情報を含めても Replay / Undo / SaveLoad が壊れないこと ---- */
resetP3();
let rg1=mk3(ELF), rg2=mk3(ELF), rgx=mk3(BLUE);
gameState.players[0].mz=[rg1,rg2]; gameState.players[0].hand=[rgx];
v41ResetActionJournal(gameState);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'リリース',byDestroy:false,
     p3:{reason:'tribute',actingPlayer:0,fromZone:'mz'}});
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:1,tributeValue:1,
     p3Materials:[snapshotCardV3(rg1,['atk'])]});
let rgAudit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('P3 世代: 世代情報を含む進行が digest 一致で再生される',rgAudit.ok,rgAudit.reason||rgAudit.finalDigest);
let rgJson=JSON.stringify(gameState);
ok('P3 世代: 世代情報はJSON往復で完全一致',JSON.stringify(JSON.parse(rgJson))===rgJson);
ok('P3 世代: 世代識別子は数値（配列indexや参照ではない）',
   typeof (summonProvenanceOfV3(findCardByUid(rgx.uid).card)||{}).summonInstance==='number',
   JSON.stringify(summonProvenanceOfV3(findCardByUid(rgx.uid).card)));
undo();
ok('P3 世代: Undoで召喚が巻き戻る',findCardByUid(rgx.uid).zone==='hand');
redo();
ok('P3 世代: Redoで世代情報ごと復元される',
   typeof (summonProvenanceOfV3(findCardByUid(rgx.uid).card)||{}).summonInstance==='number');

globalThis.__R=R;
`;
js+='\n'+probe;

function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map();
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()};
const store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};
c.window=c;c.globalThis=c;
try{
  vm.runInNewContext(js,c,{timeout:30000});
  console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));
  if(c.__R.some(x=>!x.ok)) process.exit(2);
}catch(e){ console.error(e.stack||e); process.exit(1); }

