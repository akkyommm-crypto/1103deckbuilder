/* P4 SetcodeAuthority 回帰テスト
   authority 第5版 + AESIR（predicate 34 / 延べ479 / D=27 / C分割5+6）を唯一の根拠とする。
   S03-U161: authority P4-v6 = 上記 + GAERU（「ガエル」と名のついた。名前にガエルを含む10枚。イレカエル／サシカエル／粋カエル／
   フロッグ・バリアは非member — EDOPro Frog setcode は上位集合）→ predicate 35 / authority 484 / overlay 338 / 延べ489。
   S03-U169: authority P4-v7 = 上記 + TOMABO（「トマボー」と名のついた。トマボー／プチトマボー）→ predicate 36 / authority 486 / overlay 340 / 延べ491。
   S03-U307: authority P4-v8 = 上記 + GEM（「ジェム」と名のついた。名前にジェムを含む24枚）+ GEMKNIGHT（「ジェムナイト」と名のついた17枚。ジェム・エンハンス／輝石融合／パーティカル・フュージョンは非member）→ predicate 38 / authority 510 / overlay 364 / 延べ532。
   S03-U312: authority P4-v9 = 上記 + NINJA（「忍者」と名のついた。名前に忍者を含む11枚）+ VYLON（「ヴァイロン」と名のついた26枚）→ predicate 40 / authority 547 / overlay 401 / 延べ569。
   S03-U315: authority P4-v10 = 上記 + XSABER（「X－セイバー」と名のついた。名前にX－セイバーを含む18枚、XX－セイバー8枚を含む）→ predicate 41 / authority 565 / overlay 419 / 延べ587。
   named predicate / setcode / alias / canonical identity の分離も検証する。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const OVERLAY=JSON.parse(fs.readFileSync(path.join(ROOT,'data','setcode_overlay_v4.json'),'utf8'));

const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
const OV=globalThis.__OVERLAY__;
const byName={}; CARD_DB.forEach(c=>{ if(!(c.n in byName)) byName[c.n]=c; });
const byCode={}; CARD_DB.forEach(c=>{ byCode[c.c]=c; });
const card=n=>byName[n];
const code=n=>byName[n]?byName[n].c:0;

/* ---- 1. overlay 整合性 ---- */
const audit=p4AuditV4();
ok('P4 overlay: 自己診断がPASS',audit.ok,(audit.problems||[]).join(' / '));
ok('P4 overlay: predicate総数=41',audit.predicates===41,'='+audit.predicates);
ok('P4 overlay: GROUP定数が41件',Object.keys(GROUP).length===41,'='+Object.keys(GROUP).length);
/* 件数3種の名前と値を固定する（混同防止） */
ok('P4 件数: authority_unique_passcode_count=565',
   audit.authorityUniquePasscodes===565 && OV.authority_unique_passcode_count===565,
   'audit='+audit.authorityUniquePasscodes+' json='+OV.authority_unique_passcode_count);
ok('P4 件数: overlay_unique_passcode_count=419',
   audit.overlayUniquePasscodes===419 && OV.overlay_unique_passcode_count===419,
   'audit='+audit.overlayUniquePasscodes+' json='+OV.overlay_unique_passcode_count);
ok('P4 件数: total_membership_count=587',
   audit.totalMembership===587 && OV.total_membership_count===587,
   'audit='+audit.totalMembership+' json='+OV.total_membership_count);
ok('P4 件数: 565(authority) と 419(overlay-only) は別物として保持されている',
   OV.authority_unique_passcode_count!==OV.overlay_unique_passcode_count &&
   typeof OV.count_glossary==='object');
ok('P4 件数: 旧キー unique_passcode_count は残っていない',
   !('unique_passcode_count' in OV));

/* ---- 2. 全328 overlay passcode の整合性（setcode_exact 5群を除く） ---- */
let ovUniq=new Set(), setcodeExactGroups=[];
Object.keys(OV.groups).forEach(k=>{
  const g=OV.groups[k];
  if(g.setcode_exact){ setcodeExactGroups.push(k); return; }
  (g.members||[]).forEach(c=>ovUniq.add(c));
});
ok('P4 overlay: setcode_exact群は5つ',setcodeExactGroups.length===5,setcodeExactGroups.join(','));
ok('P4 overlay: overlay固有ユニークpasscode=419',ovUniq.size===419,'='+ovUniq.size);
let allExist=true,badCode=null;
Object.keys(OV.groups).forEach(k=>(OV.groups[k].members||[]).forEach(c=>{ if(!byCode[c]){allExist=false;badCode=badCode||(k+':'+c);} }));
ok('P4 overlay: 全memberがカードDBに実在する',allExist,badCode||'');

/* ---- 3. 全33 predicate の positive membership ---- */
let posFail=[];
Object.keys(OV.groups).forEach(k=>{
  (OV.groups[k].members||[]).forEach(c=>{
    if(!isCardInGroupV4(byCode[c],k)) posFail.push(k+':'+c);
  });
});
ok('P4 positive: 全33predicateの全memberがtrue',posFail.length===0,posFail.slice(0,5).join(' / '));
let posByCodeFail=[];
Object.keys(OV.groups).forEach(k=>{
  const m=(OV.groups[k].members||[])[0];
  if(m!=null && !isCardInGroupV4(m,k)) posByCodeFail.push(k);
});
ok('P4 positive: 数値passcode直接指定でもtrue',posByCodeFail.length===0,posByCodeFail.join(','));

/* ---- 4. 代表 negative membership ---- */
const NEG=[
 ['D.D.クロウ','D_MORPHTRONIC'],['DNA改造手術','D_MORPHTRONIC'],['ADチェンジャー','D_MORPHTRONIC'],
 ['首領・ザルーグ','BLACK_SCORPION'],['首領亀','BLACK_SCORPION'],
 ['毒蛇の供物','VENOM'],['ブレイズ・キャノン','VOLCANIC'],
 ['ニードルワーム','WORM'],['サイバーポッド','D_MORPHTRONIC'],
 ['女王の選択','AMAZONESS'],['宝札雲','CLOUDIAN'],
 ['紫炎の霞城','SIX_SAMURAI_NAMED'],['大将軍 紫炎','SIX_SAMURAI_NAMED'],
];
let negFail=[];
NEG.forEach(([n,g])=>{ const c=card(n); if(c && isCardInGroupV4(c,g)) negFail.push(n+'∈'+g); });
ok('P4 negative: 代表的な非memberがfalse',negFail.length===0,negFail.join(' / '));

/* ---- 5. C_CHAIN と C_CHRYSALIS の完全分離 ---- */
const chain=['C・コイル','C・シューター','C・スネーク','C・ドラゴン','C・リペアラー'];
const chrys=['C・チッキー','C・ドルフィーナ','C・パンテール','C・ピニー','C・モーグ','C・ラーバ'];
ok('P4 C分離: C_CHAIN=5枚',groupMembersV4('C_CHAIN').length===5,'='+groupMembersV4('C_CHAIN').length);
ok('P4 C分離: C_CHRYSALIS=6枚',groupMembersV4('C_CHRYSALIS').length===6,'='+groupMembersV4('C_CHRYSALIS').length);
ok('P4 C分離: chain5枚は全てC_CHAIN',chain.every(n=>isCardInGroupV4(card(n),'C_CHAIN')));
ok('P4 C分離: chain5枚は1枚もC_CHRYSALISでない',chain.every(n=>!isCardInGroupV4(card(n),'C_CHRYSALIS')));
ok('P4 C分離: chrysalis6枚は全てC_CHRYSALIS',chrys.every(n=>isCardInGroupV4(card(n),'C_CHRYSALIS')));
ok('P4 C分離: chrysalis6枚は1枚もC_CHAINでない',chrys.every(n=>!isCardInGroupV4(card(n),'C_CHAIN')));
const interC=groupMembersV4('C_CHAIN').filter(x=>groupMembersV4('C_CHRYSALIS').includes(x));
ok('P4 C分離: 両群の共通passcodeが0',interC.length===0,interC.join(','));

/* ---- 6. D 27枚の正確な membership ---- */
ok('P4 D: D_MORPHTRONIC=27枚',groupMembersV4('D_MORPHTRONIC').length===27,'='+groupMembersV4('D_MORPHTRONIC').length);
ok('P4 D: ダブルツールD&C は false',!isCardInGroupV4(card('ダブルツールD&C'),'D_MORPHTRONIC'));
ok('P4 D: ブレンD は false',!isCardInGroupV4(card('ブレンD'),'D_MORPHTRONIC'));
const dhero=CARD_DB.filter(c=>c.n.indexOf('D－HERO')===0);
ok('P4 D: D－HERO 全16枚が false',dhero.length>0&&dhero.every(c=>!isCardInGroupV4(c,'D_MORPHTRONIC')),'D-HERO='+dhero.length);
ok('P4 D: D・ゲイザー / D・スピードユニット は true',
   isCardInGroupV4(card('D・ゲイザー'),'D_MORPHTRONIC')&&isCardInGroupV4(card('D・スピードユニット'),'D_MORPHTRONIC'));
const dAll=groupMembersV4('D_MORPHTRONIC').map(c=>byCode[c].n);
ok('P4 D: 全memberが「D・」始まり',dAll.every(n=>n.indexOf('D・')===0),dAll.filter(n=>n.indexOf('D・')!==0).join(','));

/* ---- 7. ロイド（種族非依存の literal 包含） ---- */
ok('P4 ロイド: マジカル・アンドロイド(サイキック族)が member',isCardInGroupV4(card('マジカル・アンドロイド'),'ROID'));
ok('P4 ロイド: ダークジェロイド(悪魔族)が member',isCardInGroupV4(card('ダークジェロイド'),'ROID'));
ok('P4 ロイド: E・HERO ネクロイド・シャーマン が member',isCardInGroupV4(card('E・HERO ネクロイド・シャーマン'),'ROID'));

/* ---- 8. アンティーク・ギア（ルビ由来 membership） ---- */
ok('P4 ルビ由来: 古代の機械巨人 が ANCIENT_GEAR',isCardInGroupV4(card('古代の機械巨人'),'ANCIENT_GEAR'));
ok('P4 ルビ由来: ANCIENT_GEAR の ruby メタが保持されている',
   (groupMetaV4('ANCIENT_GEAR')||{}).ruby==='アンティーク・ギア');
ok('P4 ルビ由来: D_MORPHTRONIC の ruby メタ=ディフォーマー',
   (groupMetaV4('D_MORPHTRONIC')||{}).ruby==='ディフォーマー');

/* ---- 9. setcode 支援カードが named predicate へ誤混入しない ---- */
const SUPPORT=[['ガジェット・アームズ','D_MORPHTRONIC'],['ジャンクBOX','D_MORPHTRONIC'],
 ['ディフォーム','D_MORPHTRONIC'],['百機夜工','D_MORPHTRONIC'],['パワーアップ・コネクター','D_MORPHTRONIC'],
 ['グラディアル・チェンジ','SIX_SAMURAI_NAMED'],['召喚雲','CLOUDIAN']];
let supFail=[];
SUPPORT.forEach(([n,g])=>{ const c=card(n); if(c&&isCardInGroupV4(c,g)) supFail.push(n+'∈'+g); });
ok('P4 支援除外: setcode支援カードがpredicateに入らない',supFail.length===0,supFail.join(' / '));
/* 支援カードは setcode 側には居る（＝概念が別物であることの確認） */
ok('P4 概念分離: ガジェット・アームズはsetcode 0x102c を持つがpredicateではない',
   isSetCardV4(card('ガジェット・アームズ'),0x102c)&&!isCardInGroupV4(card('ガジェット・アームズ'),'D_MORPHTRONIC'));

/* ---- 10. setcode_exact 5群は setcode と一致 ---- */
let exFail=[];
setcodeExactGroups.forEach(k=>{
  const g=OV.groups[k];
  const viaSet=CARD_DB.filter(c=>isSetCardV4(c,g.setcode)).map(c=>c.c).sort((a,b)=>a-b);
  const viaOv=(g.members||[]).slice().sort((a,b)=>a-b);
  if(JSON.stringify(viaSet)!==JSON.stringify(viaOv)) exFail.push(k);
});
ok('P4 setcode流用: 検証済み5群はsetcodeとoverlayが完全一致',exFail.length===0,exFail.join(','));

/* ---- 11. 入れ子と重複 membership の固定 ---- */
/* 機皇兵 ⊂ 機皇 は意図的な入れ子。エヴォルド/エヴォルダーは別predicateであり入れ子ではない。 */
ok('P4 入れ子: 機皇兵は機皇の部分集合',
   groupMembersV4('MEKLORD_ARMY').every(c=>groupMembersV4('MEKLORD').includes(c)));
const evoA=groupMembersV4('EVOLTILE'), evoB=groupMembersV4('EVOLSAUR');
const evoInter=evoA.filter(x=>evoB.includes(x));
ok('P4 別predicate: EVOLTILE ∩ EVOLSAUR = 0',evoInter.length===0,'共通='+evoInter.join(','));
ok('P4 別predicate: EVOLTILE=3枚 / EVOLSAUR=3枚',evoA.length===3&&evoB.length===3,
   evoA.length+'/'+evoB.length);
ok('P4 別predicate: エヴォルド・ウェストロはEVOLTILEのみ',
   isCardInGroupV4(card('エヴォルド・ウェストロ'),'EVOLTILE')&&
   !isCardInGroupV4(card('エヴォルド・ウェストロ'),'EVOLSAUR'));
ok('P4 別predicate: エヴォルダー・ケラトはEVOLSAURのみ',
   isCardInGroupV4(card('エヴォルダー・ケラト'),'EVOLSAUR')&&
   !isCardInGroupV4(card('エヴォルダー・ケラト'),'EVOLTILE'));

/* ---- AESIR（極神）: NORDIC setcode の上位集合と厳密に分離する ---- */
const AESIR_POS=['極神皇トール','極神皇ロキ','極神聖帝オーディン'];
AESIR_POS.forEach(n=>ok('P4 AESIR positive: '+n+' は極神',isCardInGroupV4(card(n),'AESIR')===true));
ok('P4 AESIR: メンバーはちょうど3枚',groupMembersV4('AESIR').length===3,
   '='+groupMembersV4('AESIR').length);
const NORDIC_NOT_AESIR=['極星天ミーミル','極星天ヴァルキュリア','極星宝グングニル','極星宝ドラウプニル',
  '極星宝ブリージンガ・メン','極星宝レーヴァテイン','極星將テュール','極星獣ガルム','極星獣グルファクシ',
  '極星獣タングニョースト','極星獣タングリスニ','極星霊デックアールヴ','極星霊ドヴェルグ',
  '極星霊リョースアールヴ','神の桎梏グレイプニル'];
NORDIC_NOT_AESIR.forEach(n=>ok('P4 AESIR negative: '+n+' は極神ではない',
  isCardInGroupV4(card(n),'AESIR')===false));
ok('P4 AESIR: NORDIC(0x1025) 上位集合との差は 15枚',(()=>{
  const nordic=CARD_DB.filter(c=>c&&isSetCardV4(c,SETCODE.NORDIC)).map(c=>c.c);
  const aesir=groupMembersV4('AESIR');
  const only=nordic.filter(c=>aesir.indexOf(c)<0);
  return nordic.length===17&&only.length===15;})());
ok('P4 AESIR: 極神聖帝オーディンは setcode を持たないので setcode では表現できない',
   (card('極神聖帝オーディン').setcode==null)&&isCardInGroupV4(card('極神聖帝オーディン'),'AESIR')===true);

/* 複数groupに属する passcode と所属組を完全固定する。
   意図しない重複membershipが増えたらここでFAILする。 */
const EXPECTED_MULTI={
  2137678:['MEKLORD','MEKLORD_ARMY'],      // 機皇兵グランエル・アイン
  39648965:['MEKLORD','MEKLORD_ARMY'],     // 機皇兵ワイゼル・アイン
  59371387:['MEKLORD','MEKLORD_ARMY'],     // 鉄壁の機皇兵
  75733063:['MEKLORD','MEKLORD_ARMY'],     // 機皇兵スキエル・アイン
  77336644:['ARCHFIEND_DEMON','ASSAULT_MODE'] // レッド・デーモンズ・ドラゴン／バスター
};
/* S03-U307: 「ジェムナイト」と名のついたカードは名前に「ジェム」を含むので、GEMKNIGHT の17枚はすべて GEM にも属する（意図した包含）。
   以前の「重複は5件のみ」は包含する述語の組が無かった時点の固定。重複は GEM ⊃ GEMKNIGHT の17件だけが増え、他は増えていないことを下で確かめる。 */
const GEMK=(OV.groups.GEMKNIGHT&&OV.groups.GEMKNIGHT.members)||[], GEMALL=(OV.groups.GEM&&OV.groups.GEM.members)||[];
ok('P4 包含: GEMKNIGHT は17枚で、すべて GEM の member（GEM は24枚）',GEMK.length===17&&GEMALL.length===24&&GEMK.every(c=>GEMALL.indexOf(c)>=0),GEMK.length+'/'+GEMALL.length);
GEMK.forEach(c=>{EXPECTED_MULTI[c]=['GEM','GEMKNIGHT'];});
const actualMulti={};
Object.keys(OV.groups).forEach(k=>(OV.groups[k].members||[]).forEach(c=>{
  (actualMulti[c]=actualMulti[c]||[]).push(k);
}));
Object.keys(actualMulti).forEach(c=>{ if(actualMulti[c].length<2) delete actualMulti[c]; });
Object.keys(actualMulti).forEach(c=>actualMulti[c].sort());
const expKeys=Object.keys(EXPECTED_MULTI).sort(), actKeys=Object.keys(actualMulti).sort();
ok('P4 重複固定: 複数groupに属するpasscodeは5件＋ジェムナイト17件（GEM ⊃ GEMKNIGHT）=22件のみ',
   actKeys.length===22,'='+actKeys.length+' → '+actKeys.join(','));
ok('P4 重複固定: 対象passcodeの集合が期待どおり',
   JSON.stringify(expKeys)===JSON.stringify(actKeys),
   '期待='+expKeys.join(',')+' 実際='+actKeys.join(','));
let comboBad=[];
expKeys.forEach(c=>{
  if(JSON.stringify(EXPECTED_MULTI[c])!==JSON.stringify(actualMulti[c]))
    comboBad.push(c+':'+JSON.stringify(actualMulti[c]));
});
ok('P4 重複固定: 各passcodeの所属group組が期待どおり',comboBad.length===0,comboBad.join(' / '));
ok('P4 重複固定: groupsOfCardV4 も同じ組を返す',
   JSON.stringify(groupsOfCardV4(byCode[77336644]))===JSON.stringify(['ARCHFIEND_DEMON','ASSAULT_MODE']),
   JSON.stringify(groupsOfCardV4(byCode[77336644])));
ok('P4 重複固定: 単一group所属のカードは1件だけ返す',
   groupsOfCardV4(card('D・ゲイザー')).length===1);

/* ---- 12. alias / canonical identity へ影響しない（alias跨ぎで検証） ---- */
const hb=card('ハーピィ・レディ'), h1=card('ハーピィ・レディ1'),
      h2=card('ハーピィ・レディ2'), h3=card('ハーピィ・レディ3'),
      hsb=card('ハーピィ・レディ・SB'), h3s=card('ハーピィ・レディ三姉妹');
ok('P4 alias: 前提としてalias値が保持されている',
   h1&&h1.alias===76812113&&h2&&h2.alias===76812113&&h3&&h3.alias===76812113&&hsb&&hsb.alias===76812113);
ok('P4 alias: canonicalCardCodeV4 が alias を跨いで同一値を返す',
   canonicalCardCodeV4(hb)===76812113 && canonicalCardCodeV4(h1)===76812113 &&
   canonicalCardCodeV4(h2)===76812113 && canonicalCardCodeV4(hsb)===76812113,
   [canonicalCardCodeV4(hb),canonicalCardCodeV4(h1),canonicalCardCodeV4(h2),canonicalCardCodeV4(hsb)].join(','));
ok('P4 alias: sameCanonicalCardV4(ハーピィ・レディ, ハーピィ・レディ1)=true',
   sameCanonicalCardV4(hb,h1)===true);
ok('P4 alias: sameCanonicalCardV4(ハーピィ・レディ1, ハーピィ・レディ3)=true',
   sameCanonicalCardV4(h1,h3)===true);
ok('P4 alias: 三姉妹は別カード（alias同一視されない）',
   h3s && sameCanonicalCardV4(hb,h3s)===false,
   'canonical(三姉妹)='+(h3s?canonicalCardCodeV4(h3s):'-'));
ok('P4 alias: 無関係カード同士は false',
   sameCanonicalCardV4(card('青眼の白龍'),card('真紅眼の黒竜'))===false);
/* P4 導入が alias/canonical の挙動を変えていないこと */
ok('P4 概念分離: aliasカードはP4のgroupに属さない',
   groupsOfCardV4(h1).length===0 && groupsOfCardV4(hb).length===0,
   JSON.stringify(groupsOfCardV4(h1)));
ok('P4 概念分離: isCardInGroupV4 は alias を辿らない',
   !isCardInGroupV4(h1,'D_MORPHTRONIC') && !isCardInGroupV4(h1,'ROID'));
/* autoMatch の canonical フィルタが alias 跨ぎで機能すること */
const canonFilter=autoMatch({canonical:76812113});
ok('P4 canonical: autoMatch canonical が alias 5枚すべてに一致',
   [hb,h1,h2,h3,hsb].every(c=>canonFilter(c)===true));
ok('P4 canonical: autoMatch canonical が三姉妹には一致しない',
   h3s ? canonFilter(h3s)===false : true);
const codeFilter=autoMatch({cardCode:76812113});
ok('P4 cardCode: cardCode は本体1枚のみに一致（aliasを辿らない）',
   codeFilter(hb)===true && codeFilter(h1)===false);

/* ---- 13. トークン・不正入力の安全性 ---- */
ok('P4 安全性: トークンは false',!isCardInGroupV4({token:{n:'トークン'}},'D_MORPHTRONIC'));
ok('P4 安全性: null/undefined は false',!isCardInGroupV4(null,'D_MORPHTRONIC')&&!isCardInGroupV4(undefined,'ROID'));
ok('P4 安全性: 未知groupは false',!isCardInGroupV4(card('D・ゲイザー'),'NO_SUCH_GROUP'));
ok('P4 安全性: 文字列(カード名)は受け付けない',!isCardInGroupV4('D・ゲイザー','D_MORPHTRONIC'));

/* ---- 14. gameState / digest 不変 ---- */
gameState=newGame(); PLAY_MODE=PLAY_MODES.DUEL;
const d0=v41StateDigest(gameState);
isCardInGroupV4(card('D・ゲイザー'),'D_MORPHTRONIC');
groupsOfCardV4(card('マジカル・アンドロイド'));
p4AuditV4(); groupMembersV4('C_CHAIN'); filterByGroupV4([],'ROID');
const d1=v41StateDigest(gameState);
ok('P4 digest: authority API 呼び出しで digest が変化しない',d0===d1,d0+' vs '+d1);
ok('P4 digest: gameStateにP4由来のフィールドが増えていない',
   !('setcodeAuthority' in gameState) && !('p4Groups' in gameState) && !('groupIndex' in gameState));
const txt=v41StateDigestText(gameState);
ok('P4 digest: digest文字列にoverlay由来の追加がない',txt.indexOf('SETCODE_OVERLAY')<0&&txt.indexOf('p4')<0);

/* ---- 15. SaveLoad / Undo / Redo に影響しない ---- */
const snap=JSON.stringify(gameState);
const round=JSON.parse(snap);
ok('P4 SaveLoad: gameStateはJSON往復で完全一致',JSON.stringify(round)===snap);
HISTORY.length=0;REDO.length=0;turnActions=[];
v41ResetActionJournal(gameState);
act({type:'LP',player:0,delta:-100});
const afterAct=v41StateDigest(gameState);
/* Journal は undo 時に v41SyncJournalToState で巻き戻る既存仕様のため、
   記録の確認は undo の前に行う。 */
ok('P4 Journal: LP Action が記録されている',V41_ACTION_JOURNAL.some(e=>e.action.type==='LP'),
   'entries='+V41_ACTION_JOURNAL.length);
undo(); const afterUndo=v41StateDigest(gameState);
redo(); const afterRedo=v41StateDigest(gameState);
ok('P4 Undo/Redo: authority導入後も往復でdigest一致',afterUndo===d1&&afterRedo===afterAct);

/* ---- 16. 実行時に名前 substring 判定が残っていないこと ---- */
const srcAuthority=globalThis.__AUTH_SRC__;
const banned=[/\.n\s*\.\s*includes\s*\(/, /\.n\.indexOf\s*\(/, /String\(\s*[a-zA-Z_.]*\.n\s*\)\s*\.indexOf/,
              /\.name\.includes\s*\(/, /new RegExp/];
let bad=[];
banned.forEach(rx=>{ if(rx.test(srcAuthority)) bad.push(String(rx)); });
ok('P4 禁止: authorityモジュールに名前substring判定が無い',bad.length===0,bad.join(' / '));
ok('P4 禁止: authorityモジュールがcardCodeでのみ判定する',
   srcAuthority.indexOf('cardCodeOfV4')>0 && srcAuthority.indexOf('members')>0);

/* ---- 17. autoMatch 移行状況の固定（legacy arch が増えないことを保証） ---- */
const autoSrc=globalThis.__AUTO_SRC__;
const nArch=(autoSrc.match(/arch:"/g)||[]).length;
const nGroup=(autoSrc.match(/group:GROUP\./g)||[]).length;
const nCode=(autoSrc.match(/cardCode:/g)||[]).length;
const nCanon=(autoSrc.match(/canonical:/g)||[]).length;
ok('P4 移行: group へ移行済み=23箇所',nGroup===23,'='+nGroup);
ok('P4 移行: cardCode へ移行済み=76箇所',nCode===76,'='+nCode);
ok('P4 移行: canonical へ移行済み=2箇所',nCanon===2,'='+nCanon);
ok('P4 移行: legacy arch 残存=50箇所（authority未整備の述語のみ）',nArch===50,'='+nArch);
ok('P4 移行: 合計が移行前の151箇所と一致',nGroup+nCode+nCanon+nArch===151,
   '='+(nGroup+nCode+nCanon+nArch));

/* legacy arch に残ってよいのは「authority未整備のpredicate」だけ。
   ① 特定カード名（cardCodeへ戻せる）が残っていない
   ② authority が持つ述語（groupへ戻せる）が残っていない
   を機械的に検証する。 */
const archVals=[...new Set((autoSrc.match(/arch:"((?:[^"\\]|\\.)*)"/g)||[])
  .map(s=>s.slice(6,-1)))];
ok('P4 legacy: 残存arch のユニーク値は29種',archVals.length===29,'='+archVals.length);
const stillCard=archVals.filter(v=>!!byName[v]);
ok('P4 legacy: 特定カード名が arch に残っていない（cardCode化漏れなし）',
   stillCard.length===0,stillCard.join(' / '));
/* authority の導出キー（日本語）と衝突していないか */
const AUTH_KEYS=['D','N・','ネオス','ロイド','デーモン','幻獣','Sin','／バスター','機皇','機皇兵',
 '地縛神','ヴェノム','レプティレス','古代の機械','黒蠍','竹光','ヴォルカニック','ブレイズ・キャノン',
 'エヴォルド','エヴォルダー','エレキ','リゾネーター','ペンギン','六武衆','雲魔物','アマゾネス',
 'ワーム','氷結界','魔轟神','ガスタ','ジェネクス'];
const stillGroup=archVals.filter(v=>AUTH_KEYS.indexOf(v)>=0);
ok('P4 legacy: authority済みの述語が arch に残っていない（group化漏れなし）',
   stillGroup.length===0,stillGroup.join(' / '));
/* 「N」は authority(N_NEOSPACIAN) 済みなので arch に残ってはいけない */
ok('P4 legacy: arch:"N" は残っていない（N_NEOSPACIANへ移行済み）',
   autoSrc.indexOf('arch:"N"')<0);
ok('P4 legacy: クロス・ポーター/コンバート・コンタクトがN_NEOSPACIANを使う',
   autoSrc.indexOf('"クロス・ポーター":{op:"search",trig:"ignition",f:{group:GROUP.N_NEOSPACIAN')>=0 &&
   autoSrc.indexOf('"コンバート・コンタクト":{op:"mill",trig:"ignition",f:{group:GROUP.N_NEOSPACIAN')>=0);
/* 残存29種の内容を固定（増減したらFAIL）。いずれも authority 未整備の述語。 */
const EXPECTED_LEGACY=['BF','D－HERO','E・HERO','HERO','X－セイバー','インヴェルズ',
 'インフェルニティ','ヴァイロン','エーリアン','カラクリ','ガーディアン','ジェムナイト','ジュラック',
 'スクラップ','トゥーン','ナチュル','フォーチュンレディ','マシンナーズ','ラヴァル','リチュア',
 'レアル・ジェネクス','宝玉獣','巨大戦艦','剣闘獣','墓守の','極星','極星宝','機皇帝','電池メン'];
ok('P4 legacy: 残存29種の内容が固定どおり',
   JSON.stringify(archVals.slice().sort())===JSON.stringify(EXPECTED_LEGACY.slice().sort()),
   '差分='+archVals.filter(v=>EXPECTED_LEGACY.indexOf(v)<0).join(','));
ok('P4 移行: autoMatch が group/cardCode/canonical を解釈する',
   globalThis.__PRIM_SRC__.indexOf('f.group')>0 &&
   globalThis.__PRIM_SRC__.indexOf('f.cardCode')>0 &&
   globalThis.__PRIM_SRC__.indexOf('f.canonical')>0);

globalThis.__R=R;
`;
js+='\n'+probe;

function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map();
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()};
const store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),
  __OVERLAY__:OVERLAY,
  __AUTH_SRC__:fs.readFileSync(path.join(ROOT,'engine','04_setcode_authority_v4.js'),'utf8'),
  __AUTO_SRC__:fs.readFileSync(path.join(ROOT,'cards','40_auto_interpreter.js'),'utf8'),
  __PRIM_SRC__:fs.readFileSync(path.join(ROOT,'engine','20_effect_primitives_ex.js'),'utf8'),
  document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};
c.window=c;c.globalThis=c;
try{
  vm.runInNewContext(js,c,{timeout:60000});
  console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));
  if(c.__R.some(x=>!x.ok)) process.exit(2);
}catch(e){ console.error(e.stack||e); process.exit(1); }
