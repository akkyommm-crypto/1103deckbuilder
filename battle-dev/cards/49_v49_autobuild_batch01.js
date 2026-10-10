/* Autobuild batch 01 — historically simple 1103 spells/traps. */
function v49Spell(name,operation,condition,meta){
  defineUnifiedCardV4(name,[{key:'main',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],condition:condition||(()=>true),operation,afterResolve(){}}],Object.assign({type:'spell',priority:1},meta||{}));
}
function v49Heal(name,n){v49Spell(name,ctx=>API.recoverLP(ctx.player,n));}
function v49Burn(name,n){v49Spell(name,ctx=>API.damageLP(ctx.opponent,n));}
function v49DestroyRace(name,race){v49Spell(name,()=>API.fieldCards({zone:'mz',filter:x=>x.db.ra===race}).slice().forEach(t=>API.destroy(t,name)),ctx=>API.fieldCards({zone:'mz',filter:x=>x.db.ra===race}).length>0);}
function v49SummonFromHand(name,filter){v49Spell(name,ctx=>{const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);if(r&&r.zone==='hand')API.specialSummon(ctx.player,'hand',r.index,'atk',name);},ctx=>{if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}if(!API.pileCards(ctx.player,'hand',filter).length){ctx.reason='特殊召喚できるモンスターが手札にありません';return false;}return true;},{targets:true,blocksIfNoSpecialSummon:true,includesSpecialSummon:true});const e=nativeEffectsV4(name)[0];EFFECT_REGISTRY_V4[name]=[createEffectV4(Object.assign({},e,{target(ctx,done){API.selectCard(name+'：特殊召喚するモンスター',API.pileCards(ctx.player,'hand',filter),t=>done([t]));}}))];}

defineUnifiedCardV4('御前試合',[{key:'activate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],operation(){},afterResolve(){}}],{type:'trap',priority:2,restriction:{key:'at',jp:'属性'},continuous:{scope:'allMonsters',from:['sz'],apply(){return null;}}});
defineUnifiedCardV4('群雄割拠',[{key:'activate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],operation(){},afterResolve(){}}],{type:'trap',priority:2,restriction:{key:'ra',jp:'種族'},continuous:{scope:'allMonsters',from:['sz'],apply(){return null;}}});

defineUnifiedCardV4('つまずき',[{key:'summon-defense',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onNormalSummon','onSpecialSummon','onFlip'],condition(ctx){return !!(ctx.event&&ctx.event.card&&locateCardAnyV4(ctx.event.card)&&locateCardAnyV4(ctx.event.card).zone==='mz');},operation(ctx){const h=locateCardAnyV4(ctx.event.card);if(h&&h.card.face==='up')API.changePosition(h,'def','つまずき');},afterResolve(){}}],{type:'spell',priority:1,forced:true,passive:{onNormalSummon:()=>true,onSpecialSummon:()=>true,onFlip:()=>true},continuous:{scope:'allMonsters',from:['sz'],apply(){return null;}}});

v49Heal('ゴブリンの秘薬',600);v49Heal('ブルー・ポーション',400);v49Heal('モウヤンのカレー',200);v49Heal('レッド・ポーション',500);v49Heal('天使の生き血',800);v49Heal('治療の神 ディアン・ケト',1000);
v49Burn('ファイヤー・ボール',500);v49Burn('昼夜の大火事',800);v49Burn('火あぶりの刑',600);v49Burn('火の粉',200);v49Burn('雷鳴',300);
v49Spell('盗人ゴブリン',ctx=>{API.damageLP(ctx.opponent,500);API.recoverLP(ctx.player,500);});
v49Spell('革命',ctx=>API.damageLP(ctx.opponent,API.foe(ctx).hand.length*200));
v49Spell('強欲な壺',ctx=>API.draw(ctx.player,2),ctx=>API.me(ctx).deck.length>=2);
v49Spell('強欲な瓶',ctx=>API.draw(ctx.player,1),ctx=>API.me(ctx).deck.length>=1,{type:'trap',priority:2});
v49Spell('恵みの雨',ctx=>{API.recoverLP(ctx.player,1000);API.recoverLP(ctx.opponent,1000);});
v49Spell('ギフトカード',ctx=>API.recoverLP(ctx.opponent,3000),null,{type:'trap',priority:2});

v49Spell('サンダー・ボルト',ctx=>API.fieldCards({player:ctx.opponent,zone:'mz'}).slice().forEach(t=>API.destroy(t,'サンダー・ボルト')),ctx=>API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0,{destroysFieldV46:true});
v49Spell('ハーピィの羽根帚',ctx=>{API.fieldCards({player:ctx.opponent,zone:'sz'}).slice().forEach(t=>API.destroy(t,'ハーピィの羽根帚'));const f=API.fieldCards({player:ctx.opponent,zone:'field'});f.forEach(t=>API.destroy(t,'ハーピィの羽根帚'));},ctx=>API.fieldCards({player:ctx.opponent,zone:'sz'}).length+API.fieldCards({player:ctx.opponent,zone:'field'}).length>0,{destroysFieldV46:true});
v49DestroyRace('トゲトゲ神の殺虫剤','昆虫');v49DestroyRace('悪魔払い','悪魔');v49DestroyRace('永遠の渇水','魚');

defineUnifiedCardV4('スペース・サイクロン',[{key:'detach',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],condition(ctx){return API.fieldCards({zone:'mz',filter:x=>(x.card.xyz||[]).length>0}).length>0;},target(ctx,done){API.selectCard('スペース・サイクロン：素材を取り除くXyzモンスター',API.fieldCards({zone:'mz',filter:x=>(x.card.xyz||[]).length>0}),t=>done([t]));},operation(ctx){const r=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(r&&(r.card.xyz||[]).length){/* S03-U114 */ensureCardUid(gameState,r.card);requestDetachMaterialS03({player:ctx.player,holderUid:r.card.uid,count:1,reason:'スペース・サイクロン',cancelable:false});}},afterResolve(){}}],{type:'spell',priority:2,targets:true});

defineUnifiedCardV4('トゥーン・ワールド',[{key:'activate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],condition(ctx){if(API.me(ctx).lp<=1000){ctx.reason='1000LPを払えません';return false;}return true;},cost(ctx,done){API.payCost(ctx.player,1000);done(true);},operation(){},afterResolve(){}}],{type:'spell',priority:1,continuous:{scope:'self',from:['sz'],apply(){return null;}}});

v49SummonFromHand('偽りの種',x=>x.db.k==='m'&&(x.db.lv||99)<=2&&x.db.ra==='植物');
v49SummonFromHand('古のルール',x=>x.db.k==='m'&&(x.db.lv||0)>=5&&(x.db.st||[]).includes('通常'));
v49SummonFromHand('磁力の召喚円 LV2',x=>x.db.k==='m'&&(x.db.lv||99)<=2&&x.db.ra==='機械');

defineUnifiedCardV4('強引な番兵',[{key:'return-hand',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.HAND,targetSide:'opponent',speed:1,events:['activate'],condition(ctx){return API.foe(ctx).hand.length>0;},target(ctx,done){API.selectCard('強引な番兵：デッキへ戻す相手の手札',API.pileCards(ctx.opponent,'hand'),t=>done([t]));},operation(ctx){const r=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(r&&r.zone==='hand'){API.returnToDeck(r,false,'強引な番兵');API.shuffle(ctx.opponent);}},afterResolve(){}}],{type:'spell',priority:1,targets:true});
defineUnifiedCardV4('未熟な密偵',[{key:'reveal',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.HAND,targetSide:'opponent',speed:1,events:['activate'],condition(ctx){return API.foe(ctx).hand.length>0;},target(ctx,done){API.selectCard('未熟な密偵：確認する相手の手札',API.pileCards(ctx.opponent,'hand'),t=>done([t]));},operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.log('未熟な密偵：'+labelOf(t.card)+'を確認');},afterResolve(){}}],{type:'spell',priority:1,targets:true});

defineUnifiedCardV4('エターナル・ドレッド',[{key:'clock-counters',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.FIELD,targetSide:'self',speed:2,events:['activate'],condition(ctx){return API.fieldCards({player:ctx.player,zone:'field',filter:x=>x.db.n==='幽獄の時計塔'}).length>0;},operation(ctx){const t=API.fieldCards({player:ctx.player,zone:'field',filter:x=>x.db.n==='幽獄の時計塔'})[0];if(t)API.addCounter(t,'時計',2);},afterResolve(){}}],{type:'trap',priority:2});
defineUnifiedCardV4('儀式降臨封印の書',[{key:'destroy-ritual',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],condition(ctx){return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&(x.db.st||[]).includes('儀式')}).length>0;},target(ctx,done){API.selectCard('儀式降臨封印の書：破壊する儀式モンスター',API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&(x.db.st||[]).includes('儀式')}),t=>done([t]));},operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.destroy(t,'儀式降臨封印の書');},afterResolve(){}}],{type:'trap',priority:2,targets:true,destroysFieldV46:true});
