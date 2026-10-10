/* Class A bulk — 召喚成功リクルータ／サーチャー 14枚。
   engine は触らない。既存の v49 P1 ChoiceRequest（p1cards.special-summon /
   p1cards.deck-to-hand）と P4 authority、v17 の現在値だけで書く。
   アーキタイプ判定は必ず setcode / overlay 群。カード名の部分一致は使わない。
   カード登録の第1引数は必ず文字列リテラル。ループ登録はしない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
/* このカード自身が召喚・反転召喚・特殊召喚に成功した時か。 */
function caSummonedSelf(ctx){
  const e=ctx.event||{};
  if(e.card!==ctx.card) return false;
  const h=locateCardAnyV4(ctx.card);
  if(!h || h.zone!=='mz' || h.card.face!=='up') return false;
  if(ctx.eventName==='onFlip') return e.flipSummon===true;
  return true;
}
/* 自身がリバースした（反転召喚に限らない）か。 */
function caFlippedSelf(ctx){
  const h=locateCardAnyV4(ctx.card);
  return !!h && h.zone==='mz' && h.card.face==='up' && ctx.zone==='mz';
}
/* 墓地／デッキから1枚を手札へ。deck と grave のどちらでも扱える。 */
API.registerChoiceHandler('carec.pile-to-hand',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.p===args.player&&(h.zone==='deck'||h.zone==='grave')){
    if(h.zone==='deck') API.searchDeck(args.player,h.index,args.reason);
    else API.returnToHand(h,args.reason);
  }
  if(args.shuffleDeck) API.shuffle(args.player);
});
/* 手札から1体を特殊召喚したあと、発動したカード自身を守備表示にする。 */
API.registerChoiceHandler('carec.hand-ss-then-self-def',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  if(picked&&hasMonsterZoneSpace(args.player)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.p===args.player&&h.zone==='hand')
      API.specialSummon(args.player,'hand',h.index,args.pos||'atk',args.reason);
  }
  const me=(args.selfUid!=null)?findCardByUid(args.selfUid):null;
  if(me&&me.zone==='mz'&&me.card.face==='up'&&me.card.pos!=='def')
    API.changePosition(me,'def',args.reason);
});

/* 召喚成功をトリガーに手札／デッキから特殊召喚する定型。
   events / pool / extra はカードごとに渡す。カード名は必ず呼び出し側のリテラル。 */
function caRecruit(name, events, pool, opts){
  const o=opts||{};
  const hit=ctx=>(o.trigger?o.trigger(ctx):caSummonedSelf(ctx));
  const okNow=ctx=>hit(ctx)&&hasMonsterZoneSpace(ctx.player)
    &&(!o.extra||o.extra(ctx))&&pool(ctx).length>0;
  const passive={};
  events.forEach(ev=>{ passive[ev]=okNow; });
  defineUnifiedCardV4(name,[{
    key:'summon-recruit', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
    speed:1, events:events,
    condition(ctx){ return okNow(ctx); },
    operation(ctx){
      const list=pool(ctx);
      if(!list.length||!hasMonsterZoneSpace(ctx.player)) return;
      v49P1Open(ctx,{kind:'card',title:name+'：'+(o.title||'特殊召喚するモンスター'),
        candidates:list,min:1,max:1},
        o.handler||'p1cards.special-summon',
        Object.assign({from:o.from||'hand',pos:'atk',reason:name,
          selfUid:ensureCardUid(gameState,ctx.card)},o.args||{}),false);},
    afterResolve(){}
  }],Object.assign({type:'monster',priority:1,includesSpecialSummon:true,
    forced:!!o.forced, passive:passive},o.meta||{}));
}
/* 召喚成功をトリガーにデッキ／墓地から手札へ加える定型。 */
function caSearch(name, events, pool, opts){
  const o=opts||{};
  const okNow=ctx=>caSummonedSelf(ctx)&&pool(ctx).length>0;
  const passive={};
  events.forEach(ev=>{ passive[ev]=okNow; });
  defineUnifiedCardV4(name,[{
    key:'summon-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
    speed:1, events:events,
    condition(ctx){ return okNow(ctx); },
    operation(ctx){
      const list=pool(ctx);
      if(!list.length) return;
      v49P1Open(ctx,{kind:'card',title:name+'：'+(o.title||'手札に加えるカード'),
        candidates:list,min:1,max:1},
        'carec.pile-to-hand',{reason:name,shuffleDeck:o.shuffleDeck!==false},false);},
    afterResolve(){}
  }],Object.assign({type:'monster',priority:1,forced:!!o.forced,passive:passive},o.meta||{}));
}
/* 手札のモンスター候補 */
function caHand(ctx, f){ return API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&f(x)); }
/* デッキのモンスター候補 */
function caDeck(ctx, f){ return API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&f(x)); }
/* 同名カード（canonical。名前の部分一致ではない） */
function caRefDb(n){ return dbOf({id:findCardIndex(n)}); }

/* ===== 11. エヴォルド・オドケリス — 召喚成功時、手札から「エヴォルダー」1体 ===== */
caRecruit('エヴォルド・オドケリス',['onNormalSummon'],
  ctx=>caHand(ctx,x=>isCardInGroupV4(x.db,GROUP.EVOLSAUR)),
  {title:'特殊召喚する「エヴォルダー」'});

/* ===== 12. エヴォルド・ウェストロ — リバース時、デッキから「エヴォルダー」1体 ===== */
caRecruit('エヴォルド・ウェストロ',['onFlip'],
  ctx=>caDeck(ctx,x=>isCardInGroupV4(x.db,GROUP.EVOLSAUR)),
  {title:'特殊召喚する「エヴォルダー」',from:'deck',forced:true,
   trigger:caFlippedSelf,args:{shuffleDeck:true}});

/* ===== 13. デュアル・スコーピオン — 召喚・特殊召喚成功時、手札からレベル4以下のデュアル ===== */
caRecruit('デュアル・スコーピオン',['onNormalSummon','onSpecialSummon'],
  ctx=>caHand(ctx,x=>(x.db.lv||99)<=4&&(x.db.st||[]).includes('デュアル')),
  {title:'特殊召喚するデュアルモンスター'});

/* ===== 14. ナチュル・パンプキン — 相手フィールドにモンスターがいる時の召喚成功で「ナチュル」 ===== */
caRecruit('ナチュル・パンプキン',['onNormalSummon'],
  ctx=>caHand(ctx,x=>isSetCardV4(x.db,SETCODE.NATURIA)),
  {title:'特殊召喚する「ナチュル」',
   extra:ctx=>API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0});

/* ===== 15. ナチュル・アントジョー — 相手のモンスター特殊召喚成功時、デッキからレベル3以下の「ナチュル」 ===== */
caRecruit('ナチュル・アントジョー',['onSpecialSummon'],
  ctx=>caDeck(ctx,x=>isSetCardV4(x.db,SETCODE.NATURIA)&&(x.db.lv||99)<=3),
  {title:'特殊召喚するレベル3以下の「ナチュル」',from:'deck',args:{shuffleDeck:true},
   trigger(ctx){
     const e=ctx.event||{};
     const h=locateCardAnyV4(ctx.card);
     if(!h||h.zone!=='mz'||h.card.face!=='up') return false;
     if(e.player!==ctx.opponent) return false;
     return !!e.card&&e.card!==ctx.card;}});

/* ===== 16. レアル・ジェネクス・コーディネイター — 召喚・特殊召喚成功時、手札からレベル3以下の「ジェネクス」 ===== */
caRecruit('レアル・ジェネクス・コーディネイター',['onNormalSummon','onSpecialSummon'],
  ctx=>caHand(ctx,x=>isSetCardV4(x.db,SETCODE.GENEX)&&(x.db.lv||99)<=3),
  {title:'特殊召喚するレベル3以下の「ジェネクス」'});

/* ===== 17. ブラッド・オーキス — 召喚成功時、手札から「デス・デンドル」1体 ===== */
caRecruit('ブラッド・オーキス',['onNormalSummon'],
  ctx=>caHand(ctx,x=>sameCanonicalCardV4(x.db,caRefDb('デス・デンドル'))),
  {title:'特殊召喚する「デス・デンドル」'});

/* ===== 18. デイブレーカー — 特殊召喚成功時、手札から同名1体 ===== */
caRecruit('デイブレーカー',['onSpecialSummon'],
  ctx=>caHand(ctx,x=>sameCanonicalCardV4(x.db,dbOf(ctx.card))),
  {title:'特殊召喚する同名カード'});

/* ===== 19. マシンナーズ・ソルジャー — 他に自分のモンスターがいない召喚成功時、手札から他の「マシンナーズ」 ===== */
caRecruit('マシンナーズ・ソルジャー',['onNormalSummon'],
  ctx=>caHand(ctx,x=>isSetCardV4(x.db,SETCODE.MACHINA)
    &&!sameCanonicalCardV4(x.db,dbOf(ctx.card))),
  {title:'特殊召喚する「マシンナーズ」',
   extra:ctx=>API.fieldCards({player:ctx.player,zone:'mz',
     filter:x=>x.card!==ctx.card}).length===0});

/* ===== 20. トライデント・ウォリアー — 召喚成功時、手札からレベル3モンスター1体 ===== */
caRecruit('トライデント・ウォリアー',['onNormalSummon'],
  ctx=>caHand(ctx,x=>(x.db.lv||0)===3),
  {title:'特殊召喚するレベル3モンスター'});

/* ===== 21. ゴブリンドバーグ — 召喚成功時、手札からレベル4以下1体。発動したら自身は守備表示 ===== */
caRecruit('ゴブリンドバーグ',['onNormalSummon'],
  ctx=>caHand(ctx,x=>(x.db.lv||99)<=4),
  {title:'特殊召喚するレベル4以下のモンスター',
   handler:'carec.hand-ss-then-self-def'});

/* ===== 22. マンジュ・ゴッド — 召喚・反転召喚成功時、デッキから儀式モンスターまたは儀式魔法 ===== */
caSearch('マンジュ・ゴッド',['onNormalSummon','onFlip'],
  ctx=>API.pileCards(ctx.player,'deck',
    x=>(x.db.k==='m'&&(x.db.st||[]).includes('儀式'))||(x.db.k==='s'&&x.db.sub==='儀式')),
  {title:'手札に加える儀式モンスターまたは儀式魔法'});

/* ===== 23. ヴォルカニック・ロケット — 召喚・反転召喚・特殊召喚成功時、デッキ・墓地から「ブレイズ・キャノン」 ===== */
caSearch('ヴォルカニック・ロケット',['onNormalSummon','onFlip','onSpecialSummon'],
  ctx=>API.pileCards(ctx.player,'deck',x=>isCardInGroupV4(x.db,GROUP.BLAZE_CANNON))
    .concat(API.pileCards(ctx.player,'grave',x=>isCardInGroupV4(x.db,GROUP.BLAZE_CANNON))),
  {title:'手札に加える「ブレイズ・キャノン」'});

/* ===== 24. リチュア・マーカー — 召喚・反転召喚・特殊召喚成功時、墓地の「リチュア」儀式モンスター／儀式魔法 ===== */
caSearch('リチュア・マーカー',['onNormalSummon','onFlip','onSpecialSummon'],
  ctx=>API.pileCards(ctx.player,'grave',x=>isSetCardV4(x.db,SETCODE.GISHKI)
    &&((x.db.k==='m'&&(x.db.st||[]).includes('儀式'))||(x.db.k==='s'&&x.db.sub==='儀式'))),
  {title:'手札に加える「リチュア」儀式カード',shuffleDeck:false});
