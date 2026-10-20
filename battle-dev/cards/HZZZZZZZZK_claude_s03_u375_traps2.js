/* S03-U375: four NOT_STARTED cards (carddata texts).

   ハーピィ・レディ・SB  このカードのカード名はルール上「ハーピィ・レディ」として扱う。
   異次元への隙間        属性を1つ宣言し、お互いの墓地に存在する宣言した属性のモンスターを合計2体選択して発動する。選択したモンスターをゲームから除外する。
   バーサーキング        （永続罠）1ターンに1度、フィールド上に表側表示で存在する獣族モンスター2体を選択して発動する事ができる。そのターンのエンドフェイズ時まで、選択したモンスター1体の攻撃力を半分にし、その数値分もう1体のモンスターの攻撃力をアップする。この効果は自分のメインフェイズ時及び相手のバトルフェイズ時にのみ発動する事ができる。
   能力吸収石            （永続罠）モンスターの効果が発動する度に、このカードに魔石カウンターを1つ置く(最大2つまで)。このカードに魔石カウンターが2つ乗っている場合、フィールド上に表側表示で存在するモンスターは、効果を発動する事ができず無効化される。エンドフェイズ時、このカードに乗っている魔石カウンターを全て取り除く。

   Notes
   - ハーピィ・レディ・SB: the carddata row already carries the alias of ハーピィ・レディ (canonicalCardCodeV4 identity); the script only registers the continuous-text-only card.
   - 異次元への隙間: the attribute is declared at activation (API.declare, as 幻惑の巻物 S03-U263), then two Graveyard monsters of that attribute (either Graveyard) are chosen as targets; resolution banishes the ones still there (ネクロバレー respected).
   - バーサーキング: the face-up Continuous Trap's effect (fieldIgnition, as スターゲート S03-U367) as a quick effect: own Main Phase or the opponent's Battle Phase, once per turn; two stat modifiers until the End Phase (the first target loses half its ATK, the second gains that amount).
   - 能力吸収石: onActivateSuccess (a monster effect) places 魔石 counters (counterMaxV22 2); with 2, the continuous negateEffect hits every face-up monster and activationLockS03 stops new monster effect activations from the field; an End Phase trigger removes all counters. */

/* ---- ハーピィ・レディ・SB ---- */
defineScript('ハーピィ・レディ・SB', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){}
});

/* ---- 異次元への隙間 ---- */
const U375_ATTRS = ['光','闇','地','水','炎','風','神'];
function u375GapPool(attr){ const out = []; [0,1].forEach(p=>API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.at===attr).forEach(x=>out.push(x))); return out; }
API.registerChoiceHandler('u375.gap-target', (a, x)=>{
  if(a.cancelled) return p11cAbort(x.activation);
  const attr = declaredValueV11(null, 'attribute', gameState);
  const pool = attr ? u375GapPool(attr) : [];
  if(pool.length<2) return p11cAbort(x.activation);
  p11cOpen(x.activation, {title:'異次元への隙間：除外する墓地のモンスター（合計2体）', candidates:pool, min:2, max:2, cancelable:false}, 'p11cards.commit-targets', {});
});
defineScript('異次元への隙間', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!U375_ATTRS.some(a=>u375GapPool(a).length>=2)){ ctx.reason = 'お互いの墓地に同じ属性のモンスターが2体以上いません'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため除外できません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    API.declare(ctx, 'attribute', {title:'異次元への隙間：属性を宣言', activation:d, cancelable:false}, {handler:'u375.gap-target', args:{}});
  },
  resolve(ctx){
    (ctx.selectedTargets||[]).slice().reverse().forEach(t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='grave') API.banish(r, '異次元への隙間');
    });
  },
  afterResolve(){}
});

/* ---- バーサーキング ---- */
function u375Beasts(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.ra==='獣'}); }
function u375KingWindow(ctx){
  const mineMain = ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2');
  const foeBattle = ctx.player!==gameState.activePlayer && gameState.phase==='battle';
  return mineMain || foeBattle;
}
function u375SwingEffect(key, type, faceDown){
  return {
    key, type, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:2, events:['activate'],
    condition(ctx){
      if(faceDown ? !(ctx.zone==='sz' && ctx.card.face==='down') : !(ctx.zone==='sz' && ctx.card.face==='up')){ ctx.reason = faceDown ? 'セットされた状態で発動します' : '表側表示で存在する必要があります'; return false; }
      if(!u375KingWindow(ctx, faceDown)){ ctx.reason = '自分のメインフェイズ・相手のバトルフェイズに発動できます'; return false; }
      if(u375Beasts().length<2){ ctx.reason = 'フィールドに表側表示の獣族モンスターが2体必要です'; return false; }
      return true;
    },
    target(ctx, done){
      API.selectCard('バーサーキング：攻撃力を半分にする獣族モンスター', u375Beasts(), t1=>{
        const u = t1 && t1.card ? t1.card.uid : null;
        API.selectCard('バーサーキング：攻撃力をアップする獣族モンスター', u375Beasts().filter(x=>x.card.uid!==u), t2=>done([t1, t2]));
      });
    },
    operation(ctx){
      const a = ctx.selectedTargets && ctx.selectedTargets[0] && resolveTarget(ctx.selectedTargets[0]);
      const b = ctx.selectedTargets && ctx.selectedTargets[1] && resolveTarget(ctx.selectedTargets[1]);
      if(!a || !b || a.zone!=='mz' || b.zone!=='mz' || a.card.face!=='up' || b.card.face!=='up') return;
      const half = Math.floor(curATK(a.card)/2);
      v4RegisterStatModifier(a, {atk:-half}, {code:'バーサーキング', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
      v4RegisterStatModifier(b, {atk:half}, {code:'バーサーキング', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    },
    afterResolve(){}
  };
}
defineUnifiedCardV4('バーサーキング', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); },   /* the card activation does nothing: the effect is activated separately, face-up (ruling 10/09/23, engine S03-U10) */
  operation(){}, afterResolve(){}
}, u375SwingEffect('swing', EFFECT_TYPE.QUICK, false)],
  {type:'trap', priority:2, targets:true, countLimit:{n:1, effects:['swing']}, fieldIgnition:true, activateFrom:['sz'], timing:['free'] });

/* ---- 能力吸収石 ---- */
function u375StoneFull(self){ return !!self && self.face==='up' && Number((self.counters||{})['魔石'])>=2; }
function u375StoneSeen(ctx){ const e = ctx.event; return ctx.zone==='sz' && ctx.card.face==='up' && !!e && e.kind==='monster' && Number((ctx.card.counters||{})['魔石']||0)<2; }
function u375StoneEnd(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && Number((ctx.card.counters||{})['魔石']||0)>0; }
defineUnifiedCardV4('能力吸収石', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); },
  operation(){}, afterResolve(){}
}, {
  key:'absorb', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onActivateSuccess'], forced:true,
  condition(ctx){ return u375StoneSeen(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz' && me.card.face==='up') API.addCounter(me, '魔石', 1); },
  afterResolve(){}
}, {
  key:'release', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u375StoneEnd(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz'){ const n = API.countCounter(me, '魔石'); if(n>0) API.removeCounter(me, '魔石', n); } },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true, counterCapableV22:{'魔石':true}, counterMaxV22:{'魔石':2},
  locksStEffectsS03:false,
  activationLockS03:(i)=> i.db.k==='m' && i.zone==='mz' && !!i.card && i.card.face==='up' && Array.from([0,1]).some(q=>{
    const sz = gameState.players[q].sz || []; return sz.some(c=>c && cardName(c)==='能力吸収石' && u375StoneFull(c));
  }),
  passive:{ onActivateSuccess(ctx){ return u375StoneSeen(ctx); }, onEndPhase(ctx){ return u375StoneEnd(ctx); } },
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; },
    negateEffect(target, self){ return u375StoneFull(self) && !!target && target.face==='up'; } } });
