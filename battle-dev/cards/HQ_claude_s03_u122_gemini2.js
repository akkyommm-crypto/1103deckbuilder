/* S03-U122: デュアル (Gemini) batch 2 on the U119 capability (defineGeminiS03 in cards/HO_claude_s03_u119_gemini.js).
   Only cards whose gained effect maps onto existing capabilities. Texts are the 2011 ones (project carddata). */

/* ---- 巨人ゴーグル ---- ●このカードの元々の攻撃力は2100になる。 */
defineGeminiS03('巨人ゴーグル', {
  type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(card, self){ return card===self ? {setBaseAtk:2100} : null; } }
});

/* ---- サンライズ・ガードナー ---- ●このカードの元々の守備力は2300になる。 */
defineGeminiS03('サンライズ・ガードナー', {
  type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(card, self){ return card===self ? {setBaseDef:2300} : null; } }
});

/* ---- 未来サムライ ----
   ●自分の墓地に存在するモンスター1体をゲームから除外する事で、フィールド上に表側表示で存在するモンスター1体を破壊する。
   この効果は1ターンに1度しか使用できない。（コスト＝墓地のモンスター1体を除外。破壊するモンスターは対象を取らず解決時に選ぶ） */
defineGeminiS03('未来サムライ', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason='フィールドで発動します'; return false; }
    if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m').length){ ctx.reason='墓地に除外できるモンスターがいません'; return false; }
    if(!API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up'}).length){ ctx.reason='表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('未来サムライ：コストで除外する墓地のモンスター', API.pileCards(ctx.player,'grave',x=>x.db.k==='m'), x=>{
      API.banish(x, '未来サムライ（コスト）'); done(true);
    });
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const cands = API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up'});
    if(!cands.length){ API.log('未来サムライ：破壊できる表側表示のモンスターがいない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'未来サムライ：破壊する表側表示のモンスター', candidates:cands, min:1, max:1,
      cancelable:false, resume:{handler:'s03u122.future-samurai-destroy', args:{}}, meta:{scriptName:'未来サムライ'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u122.future-samurai-destroy', (answer)=>{
  const t = (answer && answer.cards || []).filter(x=>x && !x.stale && x.card)[0];
  const h = t && locateCardAnyV4(t.card);
  if(h && h.zone==='mz' && h.card.face==='up') API.destroy(h, '未来サムライ');
});

/* ---- シャドウ・ダイバー ----
   ●自分フィールド上に表側表示で存在する闇属性・レベル4以下モンスター1体を選択して発動する。選択したモンスターはこのターン
   相手プレイヤーに直接攻撃する事ができる。この効果は1ターンに1度しか使用できない。 */
function s03u122ShadowDiverPool(ctx){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card && x.card.face==='up'
    && (typeof currentAttributeV17==='function' ? currentAttributeV17(x.card) : x.db.at)==='闇' && curLV(x.card)<=4});
}
defineGeminiS03('シャドウ・ダイバー', {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason='フィールドで発動します'; return false; }
    if(!s03u122ShadowDiverPool(ctx).length){ ctx.reason='自分フィールドに表側表示の闇属性・レベル4以下のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('シャドウ・ダイバー：直接攻撃できるようにするモンスター', s03u122ShadowDiverPool(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.card.face==='up') API.grantDirectAttack(r);
  },
  afterResolve(){}
});

/* ---- インフィニティ・ダーク ----
   ●このカードの攻撃宣言時、相手フィールド上に存在する表側表示モンスター1体の表示形式を変更する事ができる。
   （任意の誘発。対象を取らず解決時に選ぶ） */
defineGeminiS03('インフィニティ・ダーク', {
  type:'monster', priority:1,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(ctx.eventName!=='onAttackDeclare' || !a || a.attackerUid!==ensureCardUid(gameState, ctx.card)){ ctx.reason='このカードの攻撃宣言時に発動できます'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card && x.card.face==='up'}).length){ ctx.reason='相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const cands = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card && x.card.face==='up'});
    if(!cands.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'インフィニティ・ダーク：表示形式を変更するモンスター', candidates:cands, min:1, max:1,
      cancelable:false, resume:{handler:'s03u122.infinity-dark-pos', args:{}}, meta:{scriptName:'インフィニティ・ダーク'}});
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ const a = gameState.pendingAttack; return ctx.zone==='mz' && !!a && a.attackerUid===ensureCardUid(gameState, ctx.card); } }
});
API.registerChoiceHandler('s03u122.infinity-dark-pos', (answer)=>{
  const t = (answer && answer.cards || []).filter(x=>x && !x.stale && x.card)[0];
  const h = t && locateCardAnyV4(t.card);
  if(h && h.zone==='mz' && h.card.face==='up') API.changePosition(h, h.card.pos==='atk' ? 'def' : 'atk', 'インフィニティ・ダーク');
});

/* ---- ギガプラント ----
   ●1ターンに1度、自分メインフェイズに発動できる。自分の手札・墓地から昆虫族または植物族のモンスター1体を選んで特殊召喚する。 */
function s03u122GigaplantPool(p){
  const ok = x => x.db.k==='m' && (x.db.ra==='昆虫'||x.db.ra==='植物');
  return API.pileCards(p,'hand',ok).concat(API.pileCards(p,'grave',ok));
}
defineGeminiS03('ギガプラント', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason='フィールドで発動します'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason='モンスターゾーンが一杯です'; return false; }
    if(!s03u122GigaplantPool(ctx.player).length){ ctx.reason='手札・墓地に昆虫族・植物族のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const cands = s03u122GigaplantPool(ctx.player);
    if(!cands.length || API.me(ctx).mz.length >= ZONE_LIMITS.mz) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'ギガプラント：特殊召喚する昆虫族・植物族モンスター', candidates:cands, min:1, max:1,
      cancelable:false, resume:{handler:'s03u122.gigaplant-ss', args:{player:ctx.player}}, meta:{scriptName:'ギガプラント'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u122.gigaplant-ss', (answer, args)=>{
  const t = (answer && answer.cards || []).filter(x=>x && !x.stale && x.card)[0];
  const h = t && locateCardAnyV4(t.card);
  if(h && h.p===args.player && (h.zone==='hand'||h.zone==='grave')) API.specialSummon(args.player, h.zone, h.index, 'atk', 'ギガプラント');
});
