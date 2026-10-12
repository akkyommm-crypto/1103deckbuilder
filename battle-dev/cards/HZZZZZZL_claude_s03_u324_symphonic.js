/* S03-U324: the three 「音響戦士」 Tuners of the carddata (ドラムス / ピアーノ / ベーシス).

   ドラムス   属性を1つ宣言し、フィールド上に表側表示で存在する「音響戦士」と名のついたモンスター1体を選択して発動する。選択したモンスターは宣言した属性になる。この効果は1ターンに1度しか使用できない。
              また、属性を1つ宣言し、自分の墓地に存在するこのカードをゲームから除外する事で、自分フィールド上に表側表示で存在する「音響戦士」と名のついたモンスター1体は宣言した属性になる。
   ピアーノ   (the same with a Type (種族) instead of an Attribute)
   ベーシス   ①:1ターンに1度、フィールドの「音響戦士」モンスター1体を対象として発動できる。ターン終了時まで、そのモンスターのレベルを手札の枚数分上げる。
              ②:墓地のこのカードを除外し、自分フィールドの「音響戦士」モンスター1体を対象として発動できる。ターン終了時まで、その自分の「音響戦士」モンスターのレベルを手札の枚数分上げる。

   Notes
   - 「音響戦士」と名のついた = a monster whose name contains 音響戦士 (face-up for the field effects).
   - ドラムス / ピアーノ: the declaration is made at resolution and then the monster is chosen (the pattern of A・ジェネクス・チェンジャー, cards/9C); the new Attribute / Type is a permanent characteristic modifier (API.setAttribute / API.setRace)
     that ends when the monster leaves the field. ①'s once per turn is the card's own count limit; the Graveyard effect is not limited (its cost is banishing the card) and only reaches the controller's own 「音響戦士」.
   - ベーシス: the Level rise is the hand size at resolution (API.modLevel until the end of the turn); ① may target either player's 「音響戦士」, ② only the controller's own. */

function u324Sym(x){ return !!x && x.db && x.db.k==='m' && String(x.db.n||'').indexOf('音響戦士')>=0; }
function u324Pool(ctx, ownOnly){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && u324Sym(x) && (!ownOnly || x.p===ctx.player)}); }
function u324Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u324DeclCandidates(kind){
  if(kind==='attr') return ['闇','光','地','水','炎','風'].map((v,i)=>({key:'a'+i,label:v,value:v}));
  return declarationCandidatesV11('race');
}
API.registerChoiceHandler('u324.declare-pick', (answer, args)=>{
  const picked = (answer && answer.cards || [])[0];
  const value = picked ? String(picked.value) : '';
  const pool = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && u324Sym(x) && (!args.ownOnly || x.p===args.player)});
  if(!value || !pool.length) return;
  API.requestChoice({kind:'card', title:args.reason+'：'+(args.kind==='attr'?'属性':'種族')+'を変える「音響戦士」', candidates:pool, min:1, max:1, cancelable:false,
    resume:{handler:'u324.apply', args:{player:args.player, reason:args.reason, kind:args.kind, value, ownOnly:!!args.ownOnly}}});
});
API.registerChoiceHandler('u324.apply', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && locateCardAnyV4(picked.card);
  if(!h || h.zone!=='mz' || h.card.face!=='up' || (args.ownOnly && h.p!==args.player)) return;
  if(args.kind==='attr') API.setAttribute(h, String(args.value), 'permanent', args.reason);
  else API.setRace(h, String(args.value), 'permanent', args.reason);
});
function u324DeclareEffects(name, kind, noun){
  return [{
    key:'field-declare', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'both',
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
      if(!u324Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
      if(!u324Pool(ctx, false).length){ ctx.reason = '表側表示の「音響戦士」がいません'; return false; }
      return true;
    },
    operation(ctx){
      v49P1Open(ctx, {kind:'declare', title:name+'：'+noun+'を宣言', candidates:u324DeclCandidates(kind), min:1, max:1}, 'u324.declare-pick', {reason:name, kind, ownOnly:false}, false);
    },
    afterResolve(){}
  }, {
    key:'grave-declare', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'self',
    condition(ctx){
      if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
      if(!u324Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
      if(!u324Pool(ctx, true).length){ ctx.reason = '自分フィールドに表側表示の「音響戦士」がいません'; return false; }
      return true;
    },
    cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='grave'){ done(false); return; } API.banish(h, name+'（コスト）'); done(true); },
    operation(ctx){
      v49P1Open(ctx, {kind:'declare', title:name+'：'+noun+'を宣言', candidates:u324DeclCandidates(kind), min:1, max:1}, 'u324.declare-pick', {reason:name, kind, ownOnly:true}, false);
    },
    afterResolve(){}
  }];
}
function u324Meta(){ return {type:'monster', priority:1, targets:true, activateFrom:['mz','grave'], countLimit:{n:1, effects:['field-declare']}}; }

defineUnifiedCardV4('音響戦士ドラムス', u324DeclareEffects('音響戦士ドラムス', 'attr', '属性'), u324Meta());
defineUnifiedCardV4('音響戦士ピアーノ', u324DeclareEffects('音響戦士ピアーノ', 'race', '種族'), u324Meta());

/* ---- ベーシス ---- */
function u324Levelup(ctx, label){
  const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
  const n = (API.me(ctx).hand||[]).length;
  if(r && r.zone==='mz' && r.card.face==='up' && n>0) API.modLevel(r, n, 'endTurn', label);
}
defineUnifiedCardV4('音響戦士ベーシス', [{
  key:'field-level', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'both',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u324Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u324Pool(ctx, false).length){ ctx.reason = '表側表示の「音響戦士」がいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('音響戦士ベーシス：レベルを上げる「音響戦士」', u324Pool(ctx, false), t=>done([t])); },
  operation(ctx){ u324Levelup(ctx, '音響戦士ベーシス'); },
  afterResolve(){}
}, {
  key:'grave-level', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(!u324Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u324Pool(ctx, true).length){ ctx.reason = '自分フィールドに表側表示の「音響戦士」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='grave'){ done(false); return; } API.banish(h, '音響戦士ベーシス（コスト）'); done(true); },
  target(ctx, done){ API.selectCard('音響戦士ベーシス：レベルを上げる自分の「音響戦士」', u324Pool(ctx, true), t=>done([t])); },
  operation(ctx){ u324Levelup(ctx, '音響戦士ベーシス'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['mz','grave'], countLimit:{n:1, effects:['field-level']}});
