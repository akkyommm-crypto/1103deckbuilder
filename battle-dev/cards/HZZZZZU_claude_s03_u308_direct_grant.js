/* S03-U308: cards that let a chosen monster attack directly this turn (API.grantDirectAttack — journaled, turn-stamped; engine/15 grantedDirectAttackV6). 2011 texts (project carddata).

   バトル・テレポーテーション (Trap) 自分フィールド上に表側表示で存在するサイキック族モンスターが1体のみの場合、そのモンスター1体を選択して発動する。このターン選択したモンスターは
                            相手プレイヤーに直接攻撃する事ができる。このターンのバトルフェイズ終了時、選択したモンスターのコントロールを相手に移す。
   マジック・ホール・ゴーレム  1ターンに1度、自分フィールド上に表側表示で存在するモンスター1体を選択して発動する事ができる。選択したモンスターはエンドフェイズ時まで攻撃力が半分になり、
                            このターン相手プレイヤーに直接攻撃する事ができる。この効果を発動するターン、選択したモンスター以外のモンスターは攻撃する事ができない。
   クロス・アタック (Spell)   自分フィールド上に表側攻撃表示で存在する、同じ攻撃力を持つモンスター2体を選択して発動する。このターン、選択したモンスター1体は相手プレイヤーに直接攻撃する事ができる。
                            もう1体のモンスターは攻撃する事ができない。
   中央突破 (Trap)           自分フィールド上に表側表示で存在する「六武衆」と名のついたモンスター1体を選択して発動する。このターンのバトルフェイズ中、選択したモンスターが相手モンスターを
                            戦闘によって破壊した場合、自分フィールド上に存在する「大将軍 紫炎」または「六武衆」と名のついたモンスターは相手プレイヤーに直接攻撃する事ができる。

   Notes
   - クロス・アタック: both monsters are chosen on activation, in the order "the one that attacks directly", then "the one that cannot attack" (the text leaves the choice open; the
     controller decides it while choosing). The condition is checked on activation (equal current ATK); at resolution the monsters must still be on the field face-up.
   - マジック・ホール・ゴーレム: "other monsters cannot attack" also covers monsters that arrive later this turn. It is a lingering effect of the Golem (API.lingerS03, S03-U257), so it
     holds even if the Golem leaves the field; the stamp is a card flag outside the zone-local keys.
   - バトル・テレポーテーション: the control change happens at the end of this turn's Battle Phase (scheduler 'battlePhaseEnd'); it is skipped when the opponent has no free Monster Zone
     or the monster is no longer on the field.
   - 中央突破: the used card lingers for the turn (S03-U257). The condition 「選択したモンスターが戦闘によって相手モンスターを破壊した」 is read from gameState.battleKillsS03 (engine/00,
     BATTLE_CLEANUP: the uids of this turn's battle destroyers), so it stays true if that monster leaves the field afterwards. 「大将軍 紫炎」 is named by card name (one specific card);
     「六武衆」 is GROUP.SIX_SAMURAI_NAMED (P4, passcode). */

function u308Own(ctx, f){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card && x.card.face==='up' && x.db.k==='m' && (!f || f(x))});
}
function u308Here(t, ctx){
  const r = t && resolveTarget(t);
  return (r && r.p===ctx.player && r.zone==='mz' && r.card.face==='up') ? r : null;
}

/* ---- バトル・テレポーテーション ---- */
API.registerScheduleHandler('s03u308.teleport-control', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='mz' || h.card.face!=='up') return;
  const to = h.p===0 ? 1 : 0;
  if(!hasMonsterZoneSpace(to)) return;
  API.changeControl(h, to, 'バトル・テレポーテーション');
});
function u308Psychics(ctx){ return u308Own(ctx, x=>x.db.ra==='サイキック'); }
defineScript('バトル・テレポーテーション', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(u308Psychics(ctx).length!==1){ ctx.reason = '自分フィールド上に表側表示のサイキック族モンスターが1体のみの場合に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){ const ps = u308Psychics(ctx); done(ps.length===1 ? [ps[0]] : []); },
  resolve(ctx){
    const r = u308Here(ctx.selectedTargets && ctx.selectedTargets[0], ctx);
    if(!r) return;
    API.grantDirectAttack(r);
    API.schedule({at:'battlePhaseEnd', turns:0, player:ctx.player, handler:'s03u308.teleport-control',
      args:{uid:ensureCardUid(gameState, r.card), turn:gameState.turn}, note:'バトル・テレポーテーション'});
  },
  afterResolve(){}
});

/* ---- マジック・ホール・ゴーレム ---- */
defineScript('マジック・ホール・ゴーレム', {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = 'フィールドで発動します'; return false; }
    if(!u308Own(ctx).length){ ctx.reason = '自分フィールド上に表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('マジック・ホール・ゴーレム：直接攻撃できるようにするモンスター', u308Own(ctx), t=>done([t])); },
  resolve(ctx){
    const r = u308Here(ctx.selectedTargets && ctx.selectedTargets[0], ctx);
    const me = locateCardAnyV4(ctx.card);
    if(!r || !me) return;
    const uid = ensureCardUid(gameState, r.card);
    API.modAtk(r, -Math.floor(API.curAtk(r)/2), 0, 'endTurn', 'マジック・ホール・ゴーレム');
    const r2 = locateCardAnyV4(r.card);
    if(r2 && r2.zone==='mz') API.grantDirectAttack(r2);
    API.setCardFlag(me, 'u308GolemUid', uid, 'マジック・ホール・ゴーレム', {silent:true});
    API.setCardFlag(me, 'u308GolemTurn', gameState.turn, 'マジック・ホール・ゴーレム', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'マジック・ホール・ゴーレム');
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    cannotAttack(target, self){ return !!self && Number(self.u308GolemTurn)===gameState.turn && target.uid!==self.u308GolemUid; } }
});

/* ---- クロス・アタック ---- */
function u308AtkPos(ctx){ return u308Own(ctx, x=>x.card.pos==='atk'); }
function u308Partners(ctx, a){ return u308AtkPos(ctx).filter(x=>x.card!==a.card && curATK(x.card)===curATK(a.card)); }
defineScript('クロス・アタック', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!u308AtkPos(ctx).some(a=>u308Partners(ctx, a).length>0)){ ctx.reason = '自分フィールド上に表側攻撃表示の、同じ攻撃力を持つモンスターが2体必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const firsts = u308AtkPos(ctx).filter(a=>u308Partners(ctx, a).length>0);
    API.selectCard('クロス・アタック：直接攻撃できるようにするモンスター', firsts, a=>{
      const ra = resolveTarget(a);
      if(!ra){ done([]); return; }
      API.selectCard('クロス・アタック：攻撃できなくなる同じ攻撃力のモンスター', u308Partners(ctx, ra), b=>done([a, b]));
    });
  },
  resolve(ctx){
    const t = ctx.selectedTargets || [];
    const a = u308Here(t[0], ctx), b = u308Here(t[1], ctx);
    if(a) API.grantDirectAttack(a);
    if(b) API.setCardFlag(b, 'cannotAttackTurn', gameState.turn, 'クロス・アタック', {silent:true});
  },
  afterResolve(){}
});

/* ---- 中央突破 ---- */
function u308ChuoKilled(self){
  const k = gameState.battleKillsS03;
  return !!self && self.u308ChuoUid!=null && Number(self.u308ChuoTurn)===gameState.turn && !!k && k.turn===gameState.turn && k.uids.indexOf(self.u308ChuoUid)>=0;
}
defineScript('中央突破', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!u308Own(ctx, x=>isCardInGroupV4(x.card, GROUP.SIX_SAMURAI_NAMED)).length){ ctx.reason = '自分フィールド上に表側表示の「六武衆」と名のついたモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('中央突破：選択する「六武衆」', u308Own(ctx, x=>isCardInGroupV4(x.card, GROUP.SIX_SAMURAI_NAMED)), t=>done([t])); },
  resolve(ctx){
    const r = u308Here(ctx.selectedTargets && ctx.selectedTargets[0], ctx);
    const me = locateCardAnyV4(ctx.card);
    if(!r || !me) return;
    API.setCardFlag(me, 'u308ChuoUid', ensureCardUid(gameState, r.card), '中央突破', {silent:true});
    API.setCardFlag(me, 'u308ChuoTurn', gameState.turn, '中央突破', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, '中央突破');
  },
  afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['linger'], apply(){ return null; },
    grantsDirectAttack(card, self){
      if(!card || card.face!=='up' || gameState.phase!=='battle' || !u308ChuoKilled(self)) return false;
      return isCardInGroupV4(card, GROUP.SIX_SAMURAI_NAMED) || dbOf(card).n==='大将軍 紫炎';
    } }
});
