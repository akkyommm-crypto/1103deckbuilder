/* S03-U119: デュアル (Gemini) monsters on the Gemini Summon capability (engine/1ZI_gemini_s03.js).
   defineGeminiS03 gates every effect of the script on geminiActiveS03(card): condition, passive trigger checks,
   continuous hooks and attackLimit. While not Gemini-Summoned (or in the GY) the card is a Normal Monster. */
function defineGeminiS03(name, spec){
  const need = 'もう1度召喚された状態でのみ有効です';
  const desc = Object.assign({}, spec);
  const oc = desc.condition;
  desc.condition = function(ctx){
    if(!geminiActiveS03(ctx.card)){ ctx.reason = need; return false; }
    return typeof oc==='function' ? oc.call(this, ctx) : true;
  };
  if(desc.passive){
    const p = {};
    Object.keys(desc.passive).forEach(k=>{ const f = desc.passive[k]; p[k] = function(ctx){ return geminiActiveS03(ctx.card) && !!f.call(this, ctx); }; });
    desc.passive = p;
  }
  if(desc.continuous){
    const c = {};
    Object.keys(desc.continuous).forEach(k=>{
      const v = desc.continuous[k];
      if(typeof v!=='function'){ c[k] = v; return; }
      /* info-style hooks carry the source card as info.self; the others are (card, self, ...) */
      if(k==='piercingDamage') c[k] = function(info){ return geminiActiveS03(info && info.self) ? v.apply(this, arguments) : 0; };
      else c[k] = function(card, self){ return geminiActiveS03(self) ? v.apply(this, arguments) : null; };
    });
    desc.continuous = c;
  }
  if(typeof desc.attackLimit==='function'){
    const f = desc.attackLimit;
    desc.attackLimit = function(card){ return geminiActiveS03(card) ? f.apply(this, arguments) : 1; };
  }
  defineScript(name, desc);
}

/* ---- E・HERO アナザー・ネオス ---- ●このカードはモンスターゾーンに存在する限り、カード名を「E・HERO ネオス」として扱う。 */
defineGeminiS03('E・HERO アナザー・ネオス', {
  type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    nameOverride(card, self){ return card===self ? 'E・HERO ネオス' : null; } }
});

/* ---- チューンド・マジシャン ---- ●このカードがフィールド上に表側表示で存在する限り、このカードをチューナーとして扱う。 */
defineGeminiS03('チューンド・マジシャン', {
  type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    tunerOverride(card, self){ return card===self ? true : null; } }
});

/* ---- 灼熱王パイロン ---- ●1ターンに1度、自分のメインフェイズ時に発動できる。相手ライフに1000ポイントダメージを与える。 */
defineGeminiS03('灼熱王パイロン', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  condition(ctx){ return ctx.zone==='mz'; },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){ API.damageLP(ctx.opponent, 1000, '灼熱王パイロン'); },
  afterResolve(){}
});

/* ---- ヘルカイザー・ドラゴン ---- ●このカードは1度のバトルフェイズ中に2回攻撃する事ができる。 */
defineGeminiS03('ヘルカイザー・ドラゴン', {
  type:'monster', priority:1,
  attackLimit(){ return 2; }
});

/* ---- デュアル・ランサー ---- ●守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ戦闘ダメージを与える。 */
defineGeminiS03('デュアル・ランサー', {
  type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      if(info.atkCard!==info.self || !info.defCard || info.defCard.pos!=='def') return 0;
      return Math.max(0, curATK(info.atkCard)-curDEF(info.defCard));
    } }
});

/* ---- 幸運の笛吹き ---- ●このカードが戦闘によって相手モンスターを破壊し墓地へ送った時、自分のデッキからカードを1枚ドローする。 */
function s03u119BattleKillToGrave(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.step!=='leave') return false;
  const foe = b.atkCard===ctx.card ? (b.destroyedDef && b.defCard) : b.defCard===ctx.card ? (b.destroyedAtk && b.atkCard) : null;
  const h = foe && locateCardAnyV4(foe);
  return !!(h && h.zone==='grave');
}
defineGeminiS03('幸運の笛吹き', {
  type:'monster', priority:1, forced:true, dsTiming:'leave',
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){ API.draw(ctx.player, 1, '幸運の笛吹き'); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return s03u119BattleKillToGrave(ctx); } }
});
