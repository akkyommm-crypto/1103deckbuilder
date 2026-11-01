/* READY 25 — batch 1 / 除去・バーン・ステータス 10枚。
   engine は触らない。既存の v20 Reveal / v14 StatModifier / v49 P1 /
   onDestroy・onSendToGrave・onPositionChange・onActivateSuccess（すべて実 emit 済み）
   と P4 authority だけで書く。
   カード登録の第1引数は必ず文字列リテラル。 */

/* 自身が表側で所定のゾーンにいるか */
function rzSelfAt(ctx, zone){
  const h=locateCardAnyV4(ctx.card);
  return !!h && h.zone===zone && h.card.face==='up';
}

/* ===== 1. 魔法除去
   「①:フィールドの表側表示の魔法カード1枚またはフィールドにセットされた
     魔法・罠カード1枚を対象として発動できる。その魔法カードを破壊する
     （セットされている場合、めくって確認する）。」
   青い忍者と同じ作法。inspect ではなく v20 reveal を使う。 ===== */
function rzSpellOrSetTargets(self){
  const out=[];
  ['sz','field'].forEach(z=>{
    API.fieldCards({zone:z}).forEach(hh=>{
      if(!hh||!hh.card) return;
      if(self && hh.card===self) return;   /* 発動中のこのカード自身は対象にしない */
      if(hh.card.face==='down'){ out.push(hh); return; }
      if((hh.db||dbOf(hh.card)).k==='s') out.push(hh);
    });
  });
  return out;
}
defineUnifiedCardV4('魔法除去',[{
  key:'reveal-then-destroy-spell', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.SZONE, targetSide:'both', speed:1, events:['activate'],
  condition(ctx){
    if(!rzSpellOrSetTargets(ctx.card).length){ ctx.reason='対象になる魔法カードがありません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('魔法除去：破壊する魔法カード',rzSpellOrSetTargets(ctx.card),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const hh=t&&resolveTarget(t);
    if(!hh||!hh.card) return;
    /* セットされていた場合だけ「めくって確認する」。公開範囲は両者。 */
    if(hh.card.face==='down')
      API.reveal({player:hh.p,audience:'both',cards:[hh],label:'魔法除去',until:'resolution'});
    if((hh.db||dbOf(hh.card)).k==='s') API.destroy(hh,'魔法除去');
    else API.log('魔法除去：魔法カードではなかったので元に戻す');},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true});

/* ===== 2. 古代の整備場
   「①:自分の墓地の「アンティーク・ギア」モンスター1体を対象として発動できる。
     そのモンスターを手札に加える。」 ===== */
function rzGraveAncientGear(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.ANCIENT_GEAR));
}
defineUnifiedCardV4('古代の整備場',[{
  key:'grave-ancient-gear-to-hand', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(!rzGraveAncientGear(ctx.player).length){
      ctx.reason='墓地に「アンティーク・ギア」モンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('古代の整備場：手札に加える「アンティーク・ギア」',
      rzGraveAncientGear(ctx.player),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const hh=t&&resolveTarget(t);
    if(hh&&hh.p===ctx.player&&hh.zone==='grave') API.returnToHand(hh,'古代の整備場');},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true});

/* =====================================================================
   3. コザッキーの自爆装置 は READY25 当時 SKIP（ENGINE_GAP）だった。
   → System v30 B1 で解消済み。実装は cards/A2_engine_b123_unlocked.js、
     検証は tools/test_provenance_v30.js。以下は当時の記録として残す。
   「セットされたこのカードを破壊した**プレイヤー**に1000ダメージ」だが、
   通常の破壊経路 API.destroy → FX_TO_GRAVE は byPlayer を載せない
   （engine/40_legal_script_engine.js:599。byPlayer を渡すのは
     destroyAndBanish と discard だけ）。
   その結果 onDestroy の evt.byPlayer は undefined で、
   「誰が破壊したか」をカード側から特定できない。
   evt.player は破壊されたカードのコントローラーであって破壊者ではないため
   代用できない。カード側で推測すると誤ったプレイヤーへダメージを与える。
   必要なのは destroy 経路への byPlayer 伝播（engine 変更）。
   → System v30 B1: destroyerPlayerV30 が解決中チェーンリンクの発動
     プレイヤーを既定の破壊者として FX_TO_GRAVE / FX_DESTROY_BANISH へ
     伝播し、graveInfo.byPlayer と onDestroy.byPlayer が埋まるようになった。
   ===================================================================== */

/* ===== 4. 死角からの一撃
   「相手フィールド上に表側守備表示で存在するモンスター1体と、
     自分フィールド上に表側攻撃表示で存在するモンスター1体を選択して発動する。
     選択した自分のモンスターの攻撃力はエンドフェイズ時まで、
     選択した相手モンスターの守備力の数値分アップする。」 ===== */
function rzFoeFaceUpDef(foe){
  return API.fieldCards({player:foe,zone:'mz',
    filter:x=>x.card.face==='up'&&x.card.pos==='def'});
}
function rzOwnFaceUpAtk(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&x.card.pos==='atk'});
}
defineUnifiedCardV4('死角からの一撃',[{
  key:'add-foe-def-to-own-atk', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:2, events:['activate'],
  condition(ctx){
    if(!rzFoeFaceUpDef(ctx.opponent).length){
      ctx.reason='相手フィールドに表側守備表示モンスターがいません'; return false; }
    if(!rzOwnFaceUpAtk(ctx.player).length){
      ctx.reason='自分フィールドに表側攻撃表示モンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('死角からの一撃：守備力を参照する相手モンスター',
      rzFoeFaceUpDef(ctx.opponent),foe=>{
        API.selectCard('死角からの一撃：攻撃力を上げる自分のモンスター',
          rzOwnFaceUpAtk(ctx.player),mine=>done([foe,mine]));});},
  operation(ctx){
    const ts=ctx.selectedTargets||[];
    const foe=ts[0]&&resolveTarget(ts[0]);
    const mine=ts[1]&&resolveTarget(ts[1]);
    if(!foe||!mine||foe.zone!=='mz'||mine.zone!=='mz') return;
    if(mine.p!==ctx.player||foe.p!==ctx.opponent) return;
    const gain=Math.max(0,curDEF(foe.card));
    if(gain<=0) return;
    API.setAtk(mine,curATK(mine.card)+gain,'endPhase','死角からの一撃');},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true});

/* ===== 5. ダークシー・フロート
   「フィールド上に存在するこのカードがカードの効果によって破壊され
     墓地へ送られた時、自分のデッキからカードを1枚ドローする。」
   戦闘破壊（reason:'battle'）では誘発しない。 ===== */
function rzDarkseaBlown(ctx){
  const e=ctx.event||{};
  if(e.card!==ctx.card&&e.uid!==ctx.card.uid) return false;
  return e.reason==='effect';
}
defineUnifiedCardV4('ダークシー・フロート',[{
  key:'effect-destroyed-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE,
  speed:1, events:['onDestroy'],
  condition(ctx){ return rzDarkseaBlown(ctx) && API.me(ctx).deck.length>0; },
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, activateFrom:['grave'],
    passive:{onDestroy:ctx=>rzDarkseaBlown(ctx)&&API.me(ctx).deck.length>0}});

/* ===== 6. 棺桶売り（永続罠）
   「モンスターカードが相手の墓地に送られる度に、相手ライフに300ポイントダメージ。」
   墓地は持ち主のものなので、送られた先が相手の墓地＝owner が相手。
   破壊に限定しない（あらゆる墓地送りで誘発）。 ===== */
function rzCoffinHit(ctx){
  const e=ctx.event||{};
  if(!rzSelfAt(ctx,'sz')) return false;
  const gone=e.card||((e.uid!=null)?(findCardByUid(e.uid)||{}).card:null);
  if(!gone) return false;
  if(dbOf(gone).k!=='m') return false;
  return gone.owner===ctx.opponent;
}
defineUnifiedCardV4('棺桶売り',[{
  key:'foe-monster-to-grave-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE,
  speed:1, events:['onSendToGrave'],
  condition(ctx){ return rzCoffinHit(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent,300); },
  afterResolve(){}
}],{type:'trap', priority:2, keep:true, forced:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onSendToGrave:rzCoffinHit}});

/* ===== 7. ピラミッドパワー（速攻魔法）
   「次の効果から1つを選択して発動する事ができる。
     ●自分の全モンスターの攻撃力はエンドフェイズ時まで200アップ
     ●自分の全モンスターの守備力はエンドフェイズ時まで500アップ」
   2択は同時に適用しない。 ===== */
API.registerChoiceHandler('rz.pyramid-mode',(answer,args)=>{
  const picked=(answer&&answer.cards||[])[0];
  const mode=picked&&picked.value;
  const pool=API.fieldCards({player:args.player,zone:'mz',filter:x=>x.card.face==='up'});
  if(mode==='def') pool.forEach(hh=>API.setDef(hh,curDEF(hh.card)+500,'endPhase','ピラミッドパワー'));
  else pool.forEach(hh=>API.setAtk(hh,curATK(hh.card)+200,'endPhase','ピラミッドパワー'));
});
defineUnifiedCardV4('ピラミッドパワー',[{
  key:'choose-atk-or-def', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  speed:2, events:['activate'],
  condition(ctx){
    if(!API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'}).length){
      ctx.reason='自分フィールドに表側表示モンスターがいません'; return false; }
    return true;},
  operation(ctx){
    v49P1Open(ctx,{kind:'declare',title:'ピラミッドパワー：適用する効果を選ぶ',
      candidates:[{key:'atk',value:'atk',label:'攻撃力200アップ'},
                  {key:'def',value:'def',label:'守備力500アップ'}],min:1,max:1},
      'rz.pyramid-mode',{reason:'ピラミッドパワー'},false);},
  afterResolve(){}
}],{type:'spell', priority:1});

/* ===== 8. 毒蛇の供物
   「①:自分フィールドの爬虫類族モンスター1体と、相手フィールドのカード2枚を
     対象として発動できる。その自分の爬虫類族モンスター1体と、
     その相手のカード2枚を破壊する。」 ===== */
function rzOwnReptiles(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&currentRaceV17(x.card)==='爬虫類'});
}
function rzFoeCards(foe){
  return API.fieldCards({player:foe,zone:'mz'})
    .concat(API.fieldCards({player:foe,zone:'sz'}))
    .concat(API.fieldCards({player:foe,zone:'field'}));
}
defineUnifiedCardV4('毒蛇の供物',[{
  key:'tribute-reptile-destroy-two', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:2, events:['activate'],
  condition(ctx){
    if(!rzOwnReptiles(ctx.player).length){
      ctx.reason='自分フィールドに爬虫類族モンスターがいません'; return false; }
    if(rzFoeCards(ctx.opponent).length<2){
      ctx.reason='相手フィールドのカードが2枚ありません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('毒蛇の供物：破壊する自分の爬虫類族',rzOwnReptiles(ctx.player),mine=>{
      const first=resolveTarget(mine);
      API.selectCard('毒蛇の供物：破壊する相手のカード（1枚目）',rzFoeCards(ctx.opponent),a=>{
        const ra=resolveTarget(a);
        const rest=rzFoeCards(ctx.opponent).filter(x=>!ra||x.card!==ra.card);
        if(!rest.length){ done([mine,a]); return; }
        API.selectCard('毒蛇の供物：破壊する相手のカード（2枚目）',rest,b=>done([mine,a,b]));});});},
  operation(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{
      const hh=t&&resolveTarget(t);
      if(hh) API.destroy(hh,'毒蛇の供物');});},
  afterResolve(){}
}],{type:'trap', priority:2, targets:true, targetCount:3/* S03-U472: 自分の爬虫類族1体＋相手フィールドのカード2枚＝対象3つ（①の文言ではいずれも対象。コストは無い） */, destroysFieldV46:true});

/* ===== 9. ドリーム・ピエロ
   「フィールド上に攻撃表示で存在するこのカードが表側守備表示になった時、
     相手フィールド上に存在するモンスター1体を選択して破壊する。」 ===== */
function rzPierrotTurned(ctx){
  const e=ctx.event||{};
  if(e.uid==null||ctx.card.uid==null||e.uid!==ctx.card.uid) return false;
  if(typeof turnedToFaceUpDefenseV10==='function') return turnedToFaceUpDefenseV10(e)===true;
  return e.fromPos==='atk'&&e.toPos==='def'&&e.toFace==='up';
}
defineUnifiedCardV4('ドリーム・ピエロ',[{
  key:'turned-to-defense-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1, events:['onPositionChange'],
  condition(ctx){
    if(!rzPierrotTurned(ctx)) return false;
    return API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;},
  target(ctx,done){
    API.selectCard('ドリーム・ピエロ：破壊する相手モンスター',
      API.fieldCards({player:ctx.opponent,zone:'mz'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const hh=t&&resolveTarget(t);
    if(hh&&hh.zone==='mz') API.destroy(hh,'ドリーム・ピエロ');},
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, forced:true,
    passive:{onPositionChange(ctx){
      return rzPierrotTurned(ctx)&&API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;}}});

/* ===== 10. 瓶亀
   「このカードがフィールド上に表側表示で存在する限り、
     「強欲な瓶」が発動する度に自分のデッキからカードを1枚ドローする。」
   canonical 判定。カード名の部分一致は使わない。 ===== */
function rzJarRef(){ return dbOf({id:findCardIndex('強欲な瓶')}); }
function rzJarActivated(ctx){
  const e=ctx.event||{};
  if(!rzSelfAt(ctx,'mz')) return false;
  if(e.cardId==null) return false;
  const db=(typeof CARD_DB!=='undefined')?CARD_DB[e.cardId]:null;
  return !!db && sameCanonicalCardV4(db, rzJarRef());
}
defineUnifiedCardV4('瓶亀',[{
  key:'jar-activated-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onActivateSuccess'],
  condition(ctx){ return rzJarActivated(ctx) && API.me(ctx).deck.length>0; },
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onActivateSuccess:ctx=>rzJarActivated(ctx)&&API.me(ctx).deck.length>0}});
