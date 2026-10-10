/* P3 Provenance recovery mini-batch — 由来metadata が無いと書けなかったカード。
   使う共通APIは summonProvenance / materialSnapshots / usedAsMaterial /
   movedByOpponentEffect / recordCostSnapshot / costSnapshots のみ。
   カード名で分岐する処理は書かない。 */

/* このカードがアドバンス召喚の素材にされ、その召喚が成功した時か。
   素材側に残る usedAsMaterial と、召喚されたモンスターの uid を突き合わせる。 */
function p3rTributedForSummon(ctx){
  /* uid だけで照合すると、同じモンスターが再びアドバンス召喚されたときに
     前回の素材が誤誘発する。召喚の通し番号で「今回の召喚の素材か」を見る。 */
  const summoned=ctx.event&&ctx.event.card;
  return !!summoned&&API.usedAsMaterialFor(ctx.card,summoned,'tribute');
}
/* 自分自身がアドバンス召喚に成功した時か。 */
function p3rSelfTributeSummoned(ctx){
  const prov=API.summonProvenance(ctx.card);
  return !!(ctx.event&&ctx.event.card===ctx.card&&prov&&prov.summonType==='tribute');
}
/* 相手のカードの効果でこの場所から墓地へ送られたか。 */
function p3rSentByOpponentFrom(ctx,zones){
  const c=ctx.card; if(!c) return false;
  const g=c.graveInfo;
  if(!g||zones.indexOf(g.from)<0) return false;
  return API.movedByOpponentEffect(c,ctx.player);
}
/* 自分フィールドの表側モンスターを属性・種族で絞る。 */
function p3rFaceUpMonsters(player,pred){
  return API.fieldCards({player,zone:'mz',filter:x=>x.card.face==='up'&&x.db.k==='m'&&pred(x.db)});
}
/* リリースをコストとして払い、その時点の攻撃力を記録する。 */
function p3rTributeCostRecordAtk(ctx,title,pool,reason,done){
  if(!pool.length){ done(false); return; }
  API.selectCard(title,pool,t=>{
    const h=resolveTarget(t);
    if(!h){ done(false); return; }
    API.recordCostSnapshot(h.card,['atk']);
    API.sendToGrave(h,reason);
    done(true);
  });
}
/* コスト snapshot から攻撃力を1つ取り出す。 */
function p3rCostAtk(ctx){
  const s=API.costSnapshots(ctx);
  return s.length&&s[0].atk!=null?s[0].atk:null;
}

/* ---- アドバンス召喚の素材側が誘発するカード ---------------------------- */

defineUnifiedCardV4('カイザー・サクリファイス',[{
  key:'return-self-after-tribute-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onNormalSummon'],
  condition(ctx){return ctx.zone==='grave'&&p3rTributedForSummon(ctx);},
  operation(ctx){const h=locateCardAnyV4(ctx.card);if(h&&h.zone==='grave')API.returnToHand(h,'カイザー・サクリファイス');},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,activateFrom:['grave'],
    passive:{onNormalSummon:ctx=>ctx.zone==='grave'&&p3rTributedForSummon(ctx)}});

defineUnifiedCardV4('ゾルガ',[{
  key:'gain-2000-after-tribute-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onNormalSummon'],
  condition(ctx){return ctx.zone==='grave'&&p3rTributedForSummon(ctx);},
  operation(ctx){API.recoverLP(ctx.player,2000);},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,activateFrom:['grave'],
    passive:{onNormalSummon:ctx=>ctx.zone==='grave'&&p3rTributedForSummon(ctx)}});

/* ---- アドバンス召喚した側が素材を参照するカード ------------------------ */

defineUnifiedCardV4('疾風鳥人ジョー',[{
  key:'wind-tribute-bounce-spells',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onNormalSummon'],
  condition(ctx){return p3rSelfTributeSummoned(ctx)&&API.materialSnapshots(ctx.card).some(s=>s.attribute==='風');},
  operation(){
    /* 表側・裏側を問わずフィールドの魔法・罠を持ち主の手札へ戻す。 */
    API.fieldCards({filter:x=>(x.zone==='sz'||x.zone==='field')&&(x.db.k==='s'||x.db.k==='t')})
       .slice().forEach(t=>API.returnToHand(t,'疾風鳥人ジョー'));
  },
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onNormalSummon:ctx=>p3rSelfTributeSummoned(ctx)&&API.materialSnapshots(ctx.card).some(s=>s.attribute==='風')}});

/* ガーゼット2種は永続効果。素材の「元々の攻撃力」から自分の元々の攻撃力が決まる。
   蘇生などアドバンス召喚以外で場に出た場合は素材情報が無いので 0 のままになる。 */
defineScript('偉大魔獣 ガーゼット',{
  type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self) return null;
    const ms=API.materialSnapshots(self);
    if(ms.length!==1||ms[0].originalAtk==null) return null;
    return {setBaseAtk:ms[0].originalAtk*2};
  }}
});

defineScript('合成魔獣 ガーゼット',{
  type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self) return null;
    const ms=API.materialSnapshots(self);
    /* テキストは「生け贄に捧げた2体のモンスター」なので、2体でない場合は決まらない。 */
    if(ms.length!==2||ms.some(s=>s.originalAtk==null)) return null;
    return {setBaseAtk:ms[0].originalAtk+ms[1].originalAtk};
  }}
});

/* ---- リリースしたモンスターの「その時点の攻撃力」を参照するカード ------- */

defineUnifiedCardV4('バーストブレス',[{
  key:'tribute-dragon-destroy-by-def',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return p3rFaceUpMonsters(ctx.player,db=>db.ra==='ドラゴン').length>0;},
  cost(ctx,done){p3rTributeCostRecordAtk(ctx,'バーストブレス：リリースするドラゴン族',
    p3rFaceUpMonsters(ctx.player,db=>db.ra==='ドラゴン'),'バーストブレス（リリース）',done);},
  operation(ctx){
    const atk=p3rCostAtk(ctx); if(atk==null) return;
    /* テキストは「フィールドのモンスター」なので裏側守備表示も含む。 */
    API.fieldCards({zone:'mz',filter:x=>curDEF(x.card)<=atk}).slice()
       .forEach(t=>API.destroy(t,'バーストブレス'));
  },
  afterResolve(){}
}],{type:'trap',priority:2,destroysFieldV46:true});

defineUnifiedCardV4('モーム',[{
  key:'tribute-earth-destroy-by-def',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return p3rFaceUpMonsters(ctx.player,db=>db.at==='地').length>0;},
  cost(ctx,done){p3rTributeCostRecordAtk(ctx,'モーム：リリースする地属性モンスター',
    p3rFaceUpMonsters(ctx.player,db=>db.at==='地'),'モーム（リリース）',done);},
  operation(ctx){
    const atk=p3rCostAtk(ctx); if(atk==null) return;
    /* テキストは「表側表示で存在し」なので裏側は対象外。 */
    API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&curDEF(x.card)<=atk}).slice()
       .forEach(t=>API.destroy(t,'モーム'));
  },
  afterResolve(){}
}],{type:'monster',priority:1,destroysFieldV46:true});

/* ---- 相手の効果で手札・デッキから墓地へ送られたことで誘発するカード ----- */

defineUnifiedCardV4('エレクトリック・スネーク',[{
  key:'opponent-discard-draw-two',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onDiscard'],
  condition(ctx){return ctx.zone==='grave'&&p3rSentByOpponentFrom(ctx,['hand'])&&API.me(ctx).deck.length>0;},
  operation(ctx){API.draw(ctx.player,2);},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,activateFrom:['grave'],
    passive:{onDiscard:ctx=>ctx.zone==='grave'&&p3rSentByOpponentFrom(ctx,['hand'])}});

defineUnifiedCardV4('再生ミイラ',[{
  key:'opponent-hand-to-grave-return-self',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onSendToGrave'],
  condition(ctx){return ctx.zone==='grave'&&p3rSentByOpponentFrom(ctx,['hand']);},
  operation(ctx){const h=locateCardAnyV4(ctx.card);if(h&&h.zone==='grave')API.returnToHand(h,'再生ミイラ');},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,activateFrom:['grave'],
    passive:{onSendToGrave:ctx=>ctx.zone==='grave'&&p3rSentByOpponentFrom(ctx,['hand'])}});

function p3rDefineFearOfDarkness(name){
  defineUnifiedCardV4(name,[{
    key:'opponent-sent-special-summon-self',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onSendToGrave'],
    condition(ctx){return ctx.zone==='grave'&&p3rSentByOpponentFrom(ctx,['hand','deck'])&&hasMonsterZoneSpace(ctx.player);},
    operation(ctx){const h=locateCardAnyV4(ctx.card);if(h&&h.zone==='grave')API.specialSummon(ctx.player,'grave',h.index,'atk',name);},
    afterResolve(){}
  }],{type:'monster',priority:1,forced:true,activateFrom:['grave'],includesSpecialSummon:true,
      blocksIfNoSpecialSummon(ctx){return ctx&&ctx.zone==='grave';},
      passive:{onSendToGrave:ctx=>ctx.zone==='grave'&&p3rSentByOpponentFrom(ctx,['hand','deck'])}});
}
p3rDefineFearOfDarkness('闇よりの恐怖');
p3rDefineFearOfDarkness('闇より出でし絶望');

