/* S03-U445: ヘイト・クレバス, デステニー・ミラージュ, サイバネティック・ヒドゥン・テクノロジー, 皆既日蝕の書, 強欲なカケラ (stale ENGINE_GAP Spells / Traps, carddata texts).

   ヘイト・クレバス                    （罠）自分フィールド上に存在するモンスター1体が相手のカードの効果によって破壊され墓地へ送られた時、相手フィールド上に存在するモンスター1体を選択して墓地へ送り、その元々の攻撃力分のダメージを相手ライフに与える。
   デステニー・ミラージュ              （罠）自分フィールド上の「D－HERO」と名のついたモンスターが相手のカードの効果によって破壊され墓地へ送られた時に発動する事ができる。このターンに破壊され墓地へ送られた「D－HERO」と名のついたモンスターを、全て自分フィールド上に特殊召喚する。
   サイバネティック・ヒドゥン・テクノロジー  （罠）相手モンスターが攻撃宣言を行う度に、自分フィールド上の「サイバー・ドラゴン」または融合素材として「サイバー・ドラゴン」が記されている融合モンスター1体を墓地へ送って発動できる。その攻撃モンスター1体を選択して破壊する。
   皆既日蝕の書                        ①：フィールドの表側表示モンスターを全て裏側守備表示にする。このターンのエンドフェイズに、相手フィールドの裏側守備表示モンスターを全て表側守備表示にし、その後、この効果で表側守備表示にしたモンスターの数だけ相手はデッキからドローする。
   強欲なカケラ                        （永続魔法）①：このカードが魔法&罠ゾーンに存在する限り、自分ドローフェイズに通常のドローをする度に、このカードに強欲カウンターを1つ置く。②：強欲カウンターが2つ以上置かれているこのカードを墓地へ送って発動できる。自分はデッキから2枚ドローする。

   Notes
   - ヘイト・クレバス / デステニー・ミラージュ: Set Traps on a monster of mine sent from the field to the Graveyard by DESTRUCTION this turn (graveInfo.byDestroy, not battle, byPlayer = the opponent; the U444 pattern). ヘイト・クレバス: the opponent monster of my choice goes to the Graveyard and its printed ATK is dealt to the opponent. デステニー・ミラージュ: every 「D－HERO」 of my Graveyard destroyed this turn (graveInfo.byDestroy, turn) is Special Summoned while Monster Zones are free.
   - サイバネティック・ヒドゥン・テクノロジー: (S03-U449 rewrite) a Continuous Trap: the card activation (u422Act-style, Spell Speed 2) only places it face-up; its effect is a separate TRIGGER activation at every attack declaration of the opponent while it is face-up - the cost sends my face-up 「サイバー・ドラゴン」 or a Fusion Monster listing it among its materials to the Graveyard, the attacker (the target) is destroyed.
   - 皆既日蝕の書: face-up monsters of both fields -> face-down Defense (FX_SET_STATE); a scheduled End Phase handler turns the opponent's face-down Defense monsters face-up Defense (the Flip effect trigger of an effect-turned monster, v10FlipEffect) and the opponent draws that many cards.
   - 強欲なカケラ: u422Act(false) activation; forced onDrawCard of my normal draw (event.normalDraw) adds a 「強欲」 counter; an ignition from the Spell & Trap Zone with 2+ counters sends the card to the Graveyard as the cost and draws 2. */

/* ---- ヘイト・クレバス / デステニー・ミラージュ ---- */
function u445FellByFoe(ctx, pred){
  const ev = ctx.event || {}; if(ev.uid==null) return null;
  const h = findCardByUid(ev.uid); if(!h || h.zone!=='grave' || h.p!==ctx.player) return null;
  const g = h.card.graveInfo; if(!g || g.from!=='mz' || !g.byDestroy || g.battle || g.rule || g.selfRuleS03 || g.byPlayer!==ctx.opponent || Number(g.turn)!==Number(gameState.turn) || dbOf(h.card).k!=='m') return null;
  return (!pred || pred(h.card)) ? h : null;
}
defineScript('ヘイト・クレバス', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!u445FellByFoe(ctx)){ ctx.reason = '自分のモンスターが相手のカードの効果によって破壊され墓地へ送られた時に発動します'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz'}).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ヘイト・クレバス：墓地へ送る相手のモンスター', API.fieldCards({player:ctx.opponent, zone:'mz'}), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(!r || r.zone!=='mz') return;
    const atk = Math.max(0, Number(dbOf(r.card).atk) || 0);
    API.sendToGrave(r, 'ヘイト・クレバス'); API.damageLP(ctx.opponent, atk, 'ヘイト・クレバス');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && !!u445FellByFoe(ctx); } }
});
function u445DHero(card){ return String(dbOf(card).n||'').indexOf('D－HERO')>=0; }
function u445DHeroFallen(p){
  return (gameState.players[p].grave||[]).filter(c=>{ const g = c && c.graveInfo; return g && g.from==='mz' && g.byDestroy && Number(g.turn)===Number(gameState.turn) && dbOf(c).k==='m' && u445DHero(c); });
}
defineScript('デステニー・ミラージュ', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u445FellByFoe(ctx, u445DHero)){ ctx.reason = '自分の「D－HERO」が相手のカードの効果によって破壊され墓地へ送られた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    u445DHeroFallen(ctx.player).map(c=>ensureCardUid(gameState, c)).forEach(u=>{
      if(!hasMonsterZoneSpace(ctx.player)) return;
      const h = findCardByUid(u); if(h && h.zone==='grave' && h.p===ctx.player) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'デステニー・ミラージュ');
    });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && !!u445FellByFoe(ctx, u445DHero); } }
});

/* ---- サイバネティック・ヒドゥン・テクノロジー ----
   S03-U449 (ChatGPT audit): a Continuous Trap (永続罠). Activating the Set card only places it face-up (the card activation, Spell Speed 2, u422Fresh); the
   effect is a separate activation made each time the opponent declares an attack WHILE the card is face-up (yugioh-wiki 《サイバネティック・ヒドゥン・テクノロジー》:
   「効果の発動の度にコストを要求する」「複数回の効果の発動ができる」, FAQ 08/03/19 墓地へ送るのはコストです; the effect targets the attacker). No once-per-turn limit.
   The cost: a 「サイバー・ドラゴン」 (name as it stands, so cards treated as it count) or a Fusion Monster written with 「サイバー・ドラゴン」 as a material - the printed
   サイバー・ツイン / サイバー・エンド / キメラテック・フォートレス / キメラテック・オーバー・ドラゴン (not the 「サイバー・ドラゴンモンスター」 ones: ランページ, メガフリート). */
const U445_CYBER_FUSIONS = ['サイバー・ツイン・ドラゴン','サイバー・エンド・ドラゴン','キメラテック・フォートレス・ドラゴン','キメラテック・オーバー・ドラゴン'];
function u445CyberCost(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.n==='サイバー・ドラゴン' || currentNameV17(x.card)==='サイバー・ドラゴン' || ((x.db.st||[]).indexOf('融合')>=0 && U445_CYBER_FUSIONS.indexOf(x.db.n)>=0))});
}
function u445Attacker(ctx){ const a = gameState.pendingAttack; if(!a || a.player!==ctx.opponent || a.attackerUid==null) return null; const h = findCardByUid(a.attackerUid); return (h && h.zone==='mz') ? h : null; }
function u445CybReady(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && !!u445Attacker(ctx) && u445CyberCost(ctx.player).length>0; }
defineUnifiedCardV4('サイバネティック・ヒドゥン・テクノロジー', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return u422Fresh(ctx); },
  operation(){}, afterResolve(){}
},{
  key:'smite', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:2, events:['onAttackDeclare'],
  condition(ctx){ if(!u445CybReady(ctx)){ ctx.reason = '表側表示で、相手モンスターの攻撃宣言時に、墓地へ送る「サイバー・ドラゴン」が必要です'; return false; } return true; },
  cost(ctx, done){
    const pool = u445CyberCost(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('サイバネティック・ヒドゥン・テクノロジー：墓地へ送る「サイバー・ドラゴン」', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, 'サイバネティック・ヒドゥン・テクノロジー（コスト）'); done(true);
    });
  },
  target(ctx, done){ const h = u445Attacker(ctx); done(h ? [h] : []); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz') API.destroy(r, 'サイバネティック・ヒドゥン・テクノロジー'); },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, forced:false, activateFrom:['sz'], passive:{ onAttackDeclare(ctx){ return u445CybReady(ctx); } }});

/* ---- 皆既日蝕の書 ---- */
API.registerScheduleHandler('s03u445.eclipse-end', (args)=>{
  const foe = args.foe;
  const down = API.fieldCards({player:foe, zone:'mz', filter:x=>x.card.face==='down' && x.card.pos==='def'}).map(x=>ensureCardUid(gameState, x.card));
  let n = 0;
  down.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz' && h.card.face==='down'){ act({type:'FX_SET_STATE', player:h.p, zone:'mz', index:h.index, face:'up', pos:'def', reason:'皆既日蝕の書', v10FlipEffect:true}); n++; } });
  if(n) API.draw(foe, n, '皆既日蝕の書');
});
defineScript('皆既日蝕の書', {
  type:'spell', priority:1,
  condition(ctx){ if(!API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = 'フィールドに表側表示のモンスターがいません'; return false; } return true; },
  resolve(ctx){
    API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{
      const h = findCardByUid(u); if(h && h.zone==='mz' && h.card.face==='up') act({type:'FX_SET_STATE', player:h.p, zone:'mz', index:h.index, face:'down', pos:'def', reason:'皆既日蝕の書'});
    });
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u445.eclipse-end', args:{foe:ctx.opponent}, note:'皆既日蝕の書'});
  },
  afterResolve(){}
});

/* ---- 強欲なカケラ ---- */
function u445ShardDue(ctx){ const e = ctx.event || {}; return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && !!e.normalDraw && e.player===ctx.player; }
defineUnifiedCardV4('強欲なカケラ', [u422Act(false), {
  key:'count', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDrawCard'], forced:true,
  condition(ctx){ return u445ShardDue(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.addCounter(me, '強欲', 1); },
  afterResolve(){}
},{
  key:'cash', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1,
  condition(ctx){
    if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.card.activationPending) return false;
    const me = locateCardAnyV4(ctx.card); if(!me || API.countCounter(me, '強欲')<2){ ctx.reason = '強欲カウンターが2つ以上必要です'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz'){ done(false); return; } API.sendToGrave(me, '強欲なカケラ（コスト）'); done(true); },
  operation(ctx){ API.draw(ctx.player, 2, '強欲なカケラ'); },
  afterResolve(){}
}], {type:'spell', priority:1, forced:false, activateFrom:['sz'], passive:{ onDrawCard(ctx){ return u445ShardDue(ctx); } } });
