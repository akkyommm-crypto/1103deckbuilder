/* S03-U228: NOT_STARTED cards (2011 texts) — 金剛真力, ワーム・コール, 機皇帝の賜与, 獣神機王バルバロスUr, 魔法族の里.
   Engine: the activation lock (engine/1ZD activationLockS03) also reads face-up Spells / Traps and Field Spells. */

/* ---- 金剛真力 / ワーム・コール (Continuous Spells): 相手フィールド上にモンスターが存在し、自分フィールド上にモンスターが存在しない場合、手札から
   レベル4以下のデュアルモンスター（「ワーム」と名のついた爬虫類族モンスター）1体を（裏側守備表示で）特殊召喚する事ができる。この効果は1ターンに1度しか使用できない。 ---- */
function emptyVsOccupiedS03(ctx){ return !(API.me(ctx).mz||[]).length && (API.foe(ctx).mz||[]).length>0; }
function handSummonSpellS03(name, test, faceDown){
  const pool = ctx=>API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && test(x.db) && canEffectSpecialSummonS03(x.card,'hand',name));
  const fire = ctx=>ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending;
  return {
    type:'spell', priority:1, timing:['mainPhase'], fieldIgnition:true, countLimit:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(!fire(ctx)) return true;                                   /* the card activation */
      if(!emptyVsOccupiedS03(ctx)){ ctx.reason = '相手フィールドにのみモンスターが存在する場合に発動します'; return false; }
      if(!pool(ctx).length){ ctx.reason = '手札に特殊召喚できるモンスターがいません'; return false; }
      return true;
    },
    resolve(ctx){
      if(!fire(ctx) && ctx.zone!=='sz') return;
      const p = pool(ctx); if(!p.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.selectCard(name + '：特殊召喚するモンスター', p, t=>{ const r = resolveTarget(t); if(r && r.zone==='hand') API.specialSummon(ctx.player, 'hand', r.index, faceDown ? 'def' : 'atk', name, undefined, faceDown ? {faceDown:true} : undefined); });
    },
    afterResolve(){}
  };
}
defineScript('金剛真力', handSummonSpellS03('金剛真力', db=>Number(db.lv||99)<=4 && (db.st||[]).indexOf('デュアル')>=0, false));
defineScript('ワーム・コール', handSummonSpellS03('ワーム・コール', db=>db.ra==='爬虫類' && isSetCardV4(db, SETCODE.WORM), true));

/* ---- 機皇帝の賜与: フィールド上に表側表示で存在するモンスターが「機皇」と名のついたモンスター2体のみの場合に発動する事ができる。自分のデッキからカードを2枚ドローする。
   このカードを発動するターン、自分はバトルフェイズを行う事ができない。 (Main Phase 1, as the other 「発動するターン、バトルフェイズを行えない」 cards) ---- */
function meklordOnlyTwoS03(){ const up = [0,1].flatMap(q=>(gameState.players[q].mz||[]).filter(c=>c && c.face==='up')); return up.length===2 && up.every(c=>String(cardName(c)).indexOf('機皇')>=0); }
defineScript('機皇帝の賜与', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(gameState.phase!=='main1'){ ctx.reason = 'バトルフェイズを行う前（メインフェイズ1）に発動します'; return false; }
    if(!meklordOnlyTwoS03()){ ctx.reason = 'フィールドの表側表示モンスターが「機皇」2体のみの場合に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ API.setFlag(ctx.player, 'noBattlePhase', true, true); done(true); },
  resolve(ctx){ API.draw(ctx.player, 2); },
  afterResolve(){}
});

/* ---- 獣神機王バルバロスUr: ①:このカードは、自分の手札・フィールド・墓地から獣戦士族モンスターと機械族モンスターを1体ずつ除外して手札から特殊召喚できる。
   ②:このカードの戦闘で相手が受ける戦闘ダメージは0になる。 ---- */
function urPoolS03(p, race, self){
  const P = gameState.players[p], out = [];
  ['hand','mz','grave'].forEach(z=>(P[z]||[]).forEach((c,i)=>{ if(c && c!==self && dbOf(c).k==='m' && (z!=='mz' || c.face==='up') && currentRaceV17(c)===race) out.push({p, zone:z, index:i, card:c, db:dbOf(c)}); }));
  return out;
}
defineScript('獣神機王バルバロスUr', {
  type:'monster', priority:1,
  summonProcedure:{
    from:'hand', positions:['atk','def'],
    condition(ctx){
      if(!urPoolS03(ctx.player,'獣戦士',ctx.card).length || !urPoolS03(ctx.player,'機械',ctx.card).length){ ctx.reason = '獣戦士族と機械族を1体ずつ除外する必要があります'; return false; }
      return true;
    },
    cost(ctx, done){
      API.selectCard('獣神機王バルバロスUr：除外する獣戦士族', urPoolS03(ctx.player,'獣戦士',ctx.card), a=>{
        const ra = resolveTarget(a); const au = ra && ra.card && ra.card.uid;
        API.selectCard('獣神機王バルバロスUr：除外する機械族', urPoolS03(ctx.player,'機械',ctx.card).filter(x=>x.card.uid!==au), b=>{
          const rb = resolveTarget(b); const bu = rb && rb.card && rb.card.uid;
          [au, bu].forEach(u=>{ const h = u!=null ? findCardByUid(u) : null; if(h) API.banish(h, '獣神機王バルバロスUr（特殊召喚の手順）'); });
          const gone = [au, bu].every(u=>{ const h = u!=null ? findCardByUid(u) : null; return !!h && h.zone==='banish'; });
          done(gone);
        });
      });
    }
  },
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    battleDamage(info){
      const self = info.self; if(!self || self.face!=='up' || info.to===info.srcPlayer) return null;
      const inBattle = (info.atkCard && (info.atkCard===self || info.atkCard.uid===self.uid)) || (info.defCard && (info.defCard===self || info.defCard.uid===self.uid));
      return inBattle ? 0 : null;
    } }
});

/* ---- 魔法族の里 (Field Spell): 自分フィールド上にのみ魔法使い族モンスターが存在する場合、相手は魔法カードを発動できない。
   自分フィールド上に魔法使い族モンスターが存在しない場合、自分は魔法カードを発動できない。 ---- */
function hasSpellcasterS03(q){ return (gameState.players[q].mz||[]).some(c=>c && c.face==='up' && currentRaceV17(c)==='魔法使い'); }
defineScript('魔法族の里', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=>{
    if(i.db.k!=='s') return false;
    const own = i.srcPlayer, foe = own===0 ? 1 : 0;
    if(i.p===foe) return hasSpellcasterS03(own) && !hasSpellcasterS03(foe);
    return !hasSpellcasterS03(own);
  }
});
