/* LPChange recovery batch — System v18 の LP 置換で解消したカード。
   使う共通機構は API.addLpRule / clearLpRules / lpRuleHits と
   continuous.lpChange、v11 のトークン、v7 の予約、既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

defineTokenSpecV11('ゴースト・トークン',{atk:0,def:0,lv:1,ra:'悪魔',at:'闇',pos:'def'});

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v18Opponent(p){ return p===0?1:0; }
/* 「このターン、自分が受ける効果ダメージは0になる」の共通形 */
function v18PreventOwnEffectDamage(ctx,label){
  API.addLpRule({player:ctx.player,cause:'effect',mode:'prevent',turns:0,label});
}

/* ---- 予約の中身 --------------------------------------------------------- */
/* 受けた回数だけゴースト・トークンを出す */
API.registerScheduleHandler('v18.ghostTokens',(args)=>{
  const n=Math.max(0,Number(API.lpRuleHits(args.label))||0);
  for(let i=0;i<n;i++){
    if(!hasMonsterZoneSpace(args.player)) break;
    API.createTokens(args.player,'ゴースト・トークン',1);
  }
});

/* =====================================================================
   1. 効果ダメージを止める
   ===================================================================== */
/* 手札から捨てて発動。このターン、自分が受ける効果ダメージは0になる。 */
defineUnifiedCardV4('ハネワタ',[{
  key:'discard-prevent-effect-damage',type:EFFECT_TYPE.IGNITION,range:LOCATION.HAND,
  speed:2,events:['activate'],
  condition(ctx){
    const h=locateCardAnyV4(ctx.card);
    return !!h&&h.zone==='hand';},
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(!h||h.zone!=='hand'){ done(false); return; }
    API.discard(ctx.player,h.index,'ハネワタ（コスト）',{byEffect:false});
    done(true);},
  operation(ctx){ v18PreventOwnEffectDamage(ctx,'ハネワタ'); },
  afterResolve(){}
}],{type:'monster',priority:2,activateFrom:['hand'],
    timing:['mainPhase','opponentTurn','free']});

/* このターンのエンドフェイズまで、コントローラーへの効果ダメージは0になる。 */
defineUnifiedCardV4('ピケルの魔法陣',[{
  key:'prevent-effect-damage-this-turn',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(){ return true; },
  operation(ctx){ v18PreventOwnEffectDamage(ctx,'ピケルの魔法陣'); },
  afterResolve(){}
}],{type:'trap',priority:2});

/* 自身をリリースし、このターンのエンドフェイズまで効果ダメージを0にする。 */
defineUnifiedCardV4('サイバー・ジラフ',[{
  key:'tribute-self-prevent-effect-damage',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){
    const h=locateCardAnyV4(ctx.card);
    return !!h&&h.zone==='mz';},
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(!h||h.zone!=='mz'){ done(false); return; }
    API.sendToGrave(h,'サイバー・ジラフ（リリース）');
    done(true);},
  operation(ctx){ v18PreventOwnEffectDamage(ctx,'サイバー・ジラフ'); },
  afterResolve(){}
}],{type:'monster',priority:1,timing:['mainPhase']});

/* お互い1枚ドローし、次の相手ターン終了時まで全てのダメージが0になる。 */
defineUnifiedCardV4('一時休戦',[{
  key:'draw-both-and-stop-all-damage',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){ return API.me(ctx).deck.length>0&&API.foe(ctx).deck.length>0; },
  operation(ctx){
    API.draw(ctx.player,1);
    API.draw(ctx.opponent,1);
    /* 「お互いが受ける全てのダメージ」＝プレイヤー指定なし・戦闘も含む */
    API.addLpRule({player:null,cause:'all',mode:'prevent',turns:1,label:'一時休戦'});},
  afterResolve(){}
}],{type:'spell',priority:1});

/* このターン自分が受ける効果ダメージは半分。エンドフェイズにその回数だけトークン。 */
defineUnifiedCardV4('ダメージ・トランスレーション',[{
  key:'halve-effect-damage-then-tokens',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(){ return true; },
  operation(ctx){
    API.addLpRule({player:ctx.player,cause:'effect',mode:'half',turns:0,
      label:'ダメージ・トランスレーション'});
    API.schedule({at:'endPhase',turns:0,player:ctx.player,
      handler:'v18.ghostTokens',
      args:{player:ctx.player,label:'ダメージ・トランスレーション'},
      note:'ダメージ・トランスレーション'});},
  afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true});

/* =====================================================================
   2. 回復をダメージに変える
   ===================================================================== */
/* 相手の回復効果をダメージに変える（永続罠） */
defineScript('シモッチによる副作用',{
  type:'trap', priority:2, condition(){ return true; },
  resolve(){ API.log('シモッチによる副作用：相手の回復はダメージになる'); },
  afterResolve(){},
  continuous:{scope:'self', from:['sz'], apply(){ return null; },
    lpChange(info,self){
      const loc=locateCardAnyV4(self);
      if(!loc) return null;
      if(info.cause!=='recover' || info.delta<=0) return null;
      /* 「相手ライフを回復する効果」＝このカードのコントローラーから見た相手 */
      return (info.player!==loc.p) ? -info.delta : null;
    }}
});

/* 相手の回復効果をダメージに変える（モンスター） */
defineScript('堕天使ナース－レフィキュル',{
  continuous:{scope:'self', from:['mz'], apply(){ return null; },
    lpChange(info,self){
      const loc=locateCardAnyV4(self);
      if(!loc || self.face!=='up') return null;
      if(info.cause!=='recover' || info.delta<=0) return null;
      return (info.player!==loc.p) ? -info.delta : null;
    }}
});

/* 地獄の扉越し銃・黒板消しの罠（「ダメージを与える効果」の分類が要る）、
   和睦の使者・マッシブ・ウォリアー（戦闘破壊耐性が要る）、
   スピリットバリア・モンク・ファイター・軍隊ピラニア等（v6 の
   continuous.battleDamage で既に書けるためカード実装待ち）は
   ENGINE_GAP のまま残す。 */
