/* Auto cycle 19 — 15枚。engine 変更なし。
     シンクロ素材／シンクロ召喚成功をトリガーにする一族。

   【重要な実測】シンクロ素材の provenance は engine に既に存在する。
     EX_SUMMON_TRY_V42（00_state_actions.js:1532〜）で素材を墓地へ送る際に
       - 素材の graveInfo = {turn, from:'mz', reason:'synchroMaterial', lv, face}
       - onSendToGrave イベント = {player, uid, reason:'synchroMaterial',
                                   kind:'synchro', summonUid}
     EX_SUMMON_COMMIT_V42 で
       - シンクロ側に v380SummonMaterials = [{name, tuner, lv}...]
       - specialSummonKind = 'synchro'
       - onSpecialSummon イベント = {player, name, uid, kind:'synchro'}
     が入る。以前「素材の provenance が無い」と判断してスキップしていたのは誤りで、
     この cycle はその訂正にあたる。

   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function c8MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }

/* このカードがシンクロ素材として墓地へ送られたイベントか。
   返り値はシンクロ召喚されたモンスターのハンドル（場に出ていれば）。 */
function c8AsSynchroMaterial(ctx){
  if(ctx.zone !== 'grave') return null;
  const e = ctx.event || {};
  if(e.reason !== 'synchroMaterial' || e.kind !== 'synchro') return null;
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'grave') return null;
  if(e.uid == null || me.card.uid !== e.uid) return null;
  if(e.summonUid == null) return { synchro:null };
  const h = findCardByUid(e.summonUid);
  return { synchro:(h && h.zone === 'mz') ? h : null };
}
/* 素材として使われた事だけを見る（シンクロ側の情報を要求しない） */
function c8WasMaterial(ctx){ return !!c8AsSynchroMaterial(ctx); }
/* シンクロ側が条件を満たすか（属性・種族・名前） */
function c8SynchroIs(ctx, test){
  const r = c8AsSynchroMaterial(ctx);
  if(!r || !r.synchro) return null;
  return test(dbOf(r.synchro.card)) ? r.synchro : null;
}
/* このカードがシンクロ召喚に成功したか（シンクロ側の視点） */
function c8SelfSynchroSummoned(ctx){
  const e = ctx.event || {};
  if(e.kind !== 'synchro') return false;
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  return e.uid != null && me.card.uid === e.uid;
}
/* 相手フィールドの表側表示モンスター */
function c8FoeFaceUp(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' });
}

/* ===================== A. 素材 → シンプルな効果 ===================== */

/* 1. ダークシー・レスキュー — シンクロ素材として墓地へ送られた場合、1枚ドローする */
defineScript('ダークシー・レスキュー', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!c8WasMaterial(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return c8WasMaterial(ctx) && API.me(ctx).deck.length > 0; } }
});

/* 2. サニー・ピクシー — 光属性のシンクロモンスターの素材になった場合、1000回復する */
defineScript('サニー・ピクシー', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!c8SynchroIs(ctx, d => d.at === '光')){
      ctx.reason = '光属性のシンクロモンスターの素材になった場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.recoverLP(ctx.player, 1000); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return !!c8SynchroIs(ctx, d => d.at === '光'); } }
});

/* 3. チェンジ・シンクロン — シンクロ素材になった場合、
      相手モンスター1体を選択して表示形式を変更する */
defineScript('チェンジ・シンクロン', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8WasMaterial(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('チェンジ・シンクロン：表示形式を変更する相手モンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    if(r.card.face === 'down') API.flip(r, 'up', 'チェンジ・シンクロン');
    const now = locateCardAnyV4(r.card);
    if(now && now.zone === 'mz')
      API.changePosition(now, now.card.pos === 'atk' ? 'def' : 'atk', 'チェンジ・シンクロン');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return c8WasMaterial(ctx)
      && API.fieldCards({ player:ctx.opponent, zone:'mz' }).length > 0; } }
});

/* 4. アタック・ゲイナー — シンクロ素材になった場合、相手の表側モンスター1体の
      攻撃力がエンドフェイズ時まで1000ダウンする */
defineScript('アタック・ゲイナー', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8WasMaterial(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    if(!c8FoeFaceUp(ctx).length){ ctx.reason = '相手フィールドに表側表示モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('アタック・ゲイナー：攻撃力を下げる相手モンスター', c8FoeFaceUp(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.modAtk(r, -1000, 0, 'endTurn', 'アタック・ゲイナー');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return c8WasMaterial(ctx) && c8FoeFaceUp(ctx).length > 0; } }
});

/* 5. クイック・スパナイト — シンクロ素材になった場合、
      相手の表側モンスター1体の攻撃力が500ダウンする（期限なし） */
defineScript('クイック・スパナイト', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8WasMaterial(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    if(!c8FoeFaceUp(ctx).length){ ctx.reason = '相手フィールドに表側表示モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('クイック・スパナイト：攻撃力を下げる相手モンスター', c8FoeFaceUp(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    /* 「500ポイントダウンする」に期限の記述が無いので permanent */
    if(r && r.zone === 'mz') API.modAtk(r, -500, 0, 'permanent', 'クイック・スパナイト');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return c8WasMaterial(ctx) && c8FoeFaceUp(ctx).length > 0; } }
});

/* 6. ダーク・スプロケッター — 闇属性のシンクロモンスターの素材になった場合、
      フィールドの表側表示の魔法または罠1枚を破壊できる */
function c8FaceUpST(){
  return API.fieldCards({ zone:'sz', filter:x => x.card.face === 'up' });
}
defineScript('ダーク・スプロケッター', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8SynchroIs(ctx, d => d.at === '闇')){
      ctx.reason = '闇属性のシンクロモンスターの素材になった場合に発動します'; return false; }
    if(!c8FaceUpST().length){ ctx.reason = '表側表示の魔法・罠カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ダーク・スプロケッター：破壊する魔法・罠', c8FaceUpST(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'sz') API.destroy(r, 'ダーク・スプロケッター', ctx.player);
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return !!c8SynchroIs(ctx, d => d.at === '闇') && c8FaceUpST().length > 0; } }
});

/* 7. マジドッグ — 魔法使い族のシンクロモンスターの素材になった場合、
      墓地のフィールド魔法1枚を手札に加えられる */
function c8FieldSpellGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 's' && x.db.sub === 'フィールド');
}
defineScript('マジドッグ', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8SynchroIs(ctx, d => d.ra === '魔法使い')){
      ctx.reason = '魔法使い族のシンクロモンスターの素材になった場合に発動します'; return false; }
    if(!c8FieldSpellGrave(ctx.player).length){ ctx.reason = '墓地にフィールド魔法がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('マジドッグ：手札に加えるフィールド魔法', c8FieldSpellGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, 'マジドッグ');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return !!c8SynchroIs(ctx, d => d.ra === '魔法使い')
      && c8FieldSpellGrave(ctx.player).length > 0; } }
});

/* 8. ヴァイロン・キューブ — 光属性モンスターのシンクロ召喚に使われた場合、
      デッキから装備魔法1枚を手札に加えられる */
function c8EquipDeck(p){
  return API.pileCards(p, 'deck', x => x.db.k === 's' && x.db.sub === '装備');
}
defineScript('ヴァイロン・キューブ', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8SynchroIs(ctx, d => d.at === '光')){
      ctx.reason = '光属性のシンクロモンスターの素材になった場合に発動します'; return false; }
    if(!c8EquipDeck(ctx.player).length){ ctx.reason = 'デッキに装備魔法がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヴァイロン・キューブ：手札に加える装備魔法', c8EquipDeck(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.returnToHand(r, 'ヴァイロン・キューブ');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return !!c8SynchroIs(ctx, d => d.at === '光') && c8EquipDeck(ctx.player).length > 0; } }
});

/* ===================== B. 素材 → シンクロ側を強化する ===================== */

/* 9. メンタル・カウンセラー リリー — シンクロ素材になった場合、500払って
      そのシンクロモンスターの攻撃力をエンドフェイズ時まで1000アップできる */
defineScript('メンタル・カウンセラー リリー', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    const r = c8AsSynchroMaterial(ctx);
    if(!r || !r.synchro){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).lp <= 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    const r = c8AsSynchroMaterial(ctx);
    if(r && r.synchro) API.modAtk(r.synchro, 1000, 0, 'endTurn', 'メンタル・カウンセラー リリー');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    const r = c8AsSynchroMaterial(ctx);
    return !!(r && r.synchro) && API.me(ctx).lp > 500; } }
});

/* 10. ブライ・シンクロン — シンクロ素材になった場合、そのシンクロモンスターは
       このターンのエンドフェイズ時まで攻撃力600アップし、効果は無効化される */
defineScript('ブライ・シンクロン', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    const r = c8AsSynchroMaterial(ctx);
    if(!r || !r.synchro){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const r = c8AsSynchroMaterial(ctx);
    if(!r || !r.synchro) return;
    API.modAtk(r.synchro, 600, 0, 'endTurn', 'ブライ・シンクロン');
    /* 「効果は無効化される」— 期限付きの効果無効化は v13 の API を使う */
    API.negateEffectUntil(r.synchro, 'endTurn', 'ブライ・シンクロン', ctx.card);
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    const r = c8AsSynchroMaterial(ctx);
    return !!(r && r.synchro); } }
});

/* 11. ハイパー・シンクロン — ドラゴン族のシンクロ召喚に使われた場合、
       そのシンクロモンスターは攻撃力800アップし、エンドフェイズ時に除外される */
API.registerScheduleHandler('c8.hyperSynchron', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.banish(h, 'ハイパー・シンクロン');
});
defineScript('ハイパー・シンクロン', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8SynchroIs(ctx, d => d.ra === 'ドラゴン')){
      ctx.reason = 'ドラゴン族のシンクロモンスターの素材になった場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const s = c8SynchroIs(ctx, d => d.ra === 'ドラゴン');
    if(!s) return;
    ensureCardUid(gameState, s.card);
    API.modAtk(s, 800, 0, 'permanent', 'ハイパー・シンクロン');
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c8.hyperSynchron',
                   args:{ uid:s.card.uid }, source:{ card:ctx.card }, note:'ハイパー・シンクロン' });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return !!c8SynchroIs(ctx, d => d.ra === 'ドラゴン'); } }
});

/* 12. バイス・バーサーカー — シンクロ素材になった場合、そのプレイヤーに2000ダメージ。
       また、そのシンクロモンスターの攻撃力はエンドフェイズ時まで2000アップする */
defineScript('バイス・バーサーカー', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8WasMaterial(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    /* 「そのプレイヤー」＝ シンクロ召喚を行った、このカードのコントローラー */
    API.damageLP(ctx.player, 2000);
    const r = c8AsSynchroMaterial(ctx);
    if(r && r.synchro) API.modAtk(r.synchro, 2000, 0, 'endTurn', 'バイス・バーサーカー');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return c8WasMaterial(ctx); } }
});

/* ===================== C. シンクロ召喚成功（シンクロ側） ===================== */

/* 13. X－セイバー ウェイン — このカードがシンクロ召喚に成功した時、
       手札からレベル4以下の戦士族1体を特殊召喚する */
function c8WarriorHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && x.db.ra === '戦士'
    && Number(x.db.lv || 99) <= 4);
}
defineScript('X－セイバー ウェイン', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'],
  condition(ctx){
    if(!c8SelfSynchroSummoned(ctx)){ ctx.reason = 'このカードがシンクロ召喚に成功した時に発動します'; return false; }
    if(!c8WarriorHand(ctx.player).length){ ctx.reason = '手札にレベル4以下の戦士族がいません'; return false; }
    if(!c8MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('X－セイバー ウェイン：特殊召喚する戦士族', c8WarriorHand(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand' || !c8MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'X－セイバー ウェイン', r.p);
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return c8SelfSynchroSummoned(ctx) && c8WarriorHand(ctx.player).length > 0
      && c8MzOpen(ctx.player); } }
});

/* 14. エンシェント・ゴッド・フレムベル — シンクロ召喚に成功した時、
       相手の手札の枚数分まで相手の墓地のカードを除外し、
       このカードの攻撃力は除外した数×200アップする */
API.registerChoiceHandler('c8.ancientGod', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const uid = args && args.uid;
  const picked = (answer && answer.cards ? answer.cards : []);
  if(!picked.length) return;
  const rs = picked.map(x => resolveTarget(x)).filter(r => r && r.zone === 'grave');
  rs.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, 'エンシェント・ゴッド・フレムベル'));
  if(uid == null || !rs.length) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz')
    API.modAtk(h, rs.length * 200, 0, 'permanent', 'エンシェント・ゴッド・フレムベル');
});
defineScript('エンシェント・ゴッド・フレムベル', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!c8SelfSynchroSummoned(ctx)){ ctx.reason = 'このカードがシンクロ召喚に成功した時に発動します'; return false; }
    if(!(gameState.players[ctx.opponent].grave || []).length){
      ctx.reason = '相手の墓地にカードがありません'; return false; }
    if(!(gameState.players[ctx.opponent].hand || []).length){
      ctx.reason = '相手の手札が0枚なので除外できません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    const max = Math.min((gameState.players[ctx.opponent].hand || []).length,
                         (gameState.players[ctx.opponent].grave || []).length);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:max,
      title:'エンシェント・ゴッド・フレムベル：除外する相手の墓地のカード（最大' + max + '枚）',
      candidates: API.pileCards(ctx.opponent, 'grave', () => true),
      resume:{ handler:'c8.ancientGod', args:{ player:ctx.player, uid:me.card.uid } }
    });
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return c8SelfSynchroSummoned(ctx)
      && (gameState.players[ctx.opponent].grave || []).length > 0
      && (gameState.players[ctx.opponent].hand || []).length > 0; } }
});

/* 15. スターダスト・シャオロン — 自分が「スターダスト・ドラゴン」の
       シンクロ召喚に成功した時、墓地のこのカードを表側攻撃表示で特殊召喚できる。
       このカードは1ターンに1度だけ、戦闘では破壊されない */
function c8StardustSummoned(ctx){
  const e = ctx.event || {};
  if(e.kind !== 'synchro') return false;
  if(e.player !== ctx.player) return false;
  if(e.uid == null) return false;
  const h = findCardByUid(e.uid);
  return !!(h && h.zone === 'mz' && dbOf(h.card).n === 'スターダスト・ドラゴン');
}
defineScript('スターダスト・シャオロン', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave'){ ctx.reason = '墓地に存在する必要があります'; return false; }
    if(!c8StardustSummoned(ctx)){
      ctx.reason = '「スターダスト・ドラゴン」のシンクロ召喚に成功した時に発動します'; return false; }
    if(!c8MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave' || !c8MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'スターダスト・シャオロン', me.p);
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return c8StardustSummoned(ctx) && c8MzOpen(ctx.player); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'スターダスト・シャオロン', label:'スターダスト・シャオロン', perTurn:1,
      battle: (target, self) => target === self
    }
  }
});
