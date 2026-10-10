/* =========================================================================
   S03-U174 — contact fusion (engine/1ZW) for cards whose other effects are implemented here.
   Texts (2011 carddata):
   E・HERO エアー・ネオス  「E・HERO ネオス」＋「N・エア・ハミングバード」 / デッキに戻した場合のみ… / 自分のライフポイントが相手の
     ライフポイントよりも少ない場合、その数値だけこのカードの攻撃力がアップする。 / エンドフェイズ時にこのカードは融合デッキに戻る。
   E・HERO フレア・ネオス 「E・HERO ネオス」＋「N・フレア・スカラベ」 / … / このカードの攻撃力は、フィールド上の魔法・罠カードの数×400
     ポイントアップする。 / また、エンドフェイズ時、このカードはエクストラデッキに戻る。
   キメラテック・フォートレス・ドラゴン 「サイバー・ドラゴン」＋機械族モンスター1体以上 / 自分・相手フィールドの上記カードを墓地へ送った
     場合のみ… / 元々の攻撃力は、このカードの融合素材としたモンスターの数×1000になる（continuous in cards/10_themes_a.js）.
   (E・HERO グラン・ネオス: cards/G8_auto_cycle66.js.)
   ========================================================================= */
defineUnifiedCardV4('E・HERO エアー・ネオス',[endPhaseReturnExEffectS03('E・HERO エアー・ネオス')],{
  type:'fusion', priority:1,
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}},
  continuous:{scope:'self', from:['mz'], apply(target, self, info){
    const p = info && info.p!=null ? info.p : 0, me = gameState.players[p].lp, op = gameState.players[p===0?1:0].lp;
    return me < op ? {atk:op-me} : null;
  }}
});
declareContactFusionS03('E・HERO エアー・ネオス');

/* 「フィールド上の魔法・罠カード」: every card in both players' Spell & Trap Zones (face-up or set) and Field Zones */
function flareNeosSpellTrapCountS03(){
  let n = 0;
  gameState.players.forEach(P=>{ n += (P.sz||[]).filter(Boolean).length; if(P.field) n++; });
  return n;
}
defineUnifiedCardV4('E・HERO フレア・ネオス',[endPhaseReturnExEffectS03('E・HERO フレア・ネオス')],{
  type:'fusion', priority:1,
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}},
  continuous:{scope:'self', from:['mz'], apply(){ const n=flareNeosSpellTrapCountS03(); return n ? {atk:n*400} : null; }}
});
declareContactFusionS03('E・HERO フレア・ネオス');

declareContactFusionS03('キメラテック・フォートレス・ドラゴン', {
  afterSummonS03(h, data){
    if(h && data && data.n) API.setCardFlag(h, 'fusionMaterialCount', data.n, 'キメラテック・フォートレス・ドラゴン', {silent:true});
  }
});
