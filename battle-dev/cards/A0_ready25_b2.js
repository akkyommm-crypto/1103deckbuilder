/* READY 25 — batch 2 / 特殊召喚・儀式・複合 10枚。
   engine は触らない。既存の v16 LevelModifier / v14 StatModifier / v21 Protection /
   v9 link / P24 Ritual registry / P4 authority / v49 P1 だけで書く。
   カード登録の第1引数は必ず文字列リテラル。 */

function rzAt(card){ return locateCardAnyV4(card); }
function rzFaceUpSelf(ctx, zone){
  const hh=rzAt(ctx.card);
  return !!hh && hh.zone===(zone||'mz') && hh.card.face==='up';
}

/* ===== 11. 共振装置
   「自分フィールド上に表側表示で存在する同じ種族・属性のモンスター2体を選択して発動する。
     選択したモンスター1体のレベルはエンドフェイズ時まで、
     もう1体のモンスターのレベルと同じになる。」
   種族・属性は v17 の現在値。レベルは v16 で複製し、raw な lv は書き換えない。 ===== */
function rzOwnFaceUpMonsters(p){
  return API.fieldCards({player:p,zone:'mz',filter:x=>x.card.face==='up'&&(x.db||dbOf(x.card)).k==='m'});
}
function rzSameRaceAttrPartners(p, base){
  return rzOwnFaceUpMonsters(p).filter(x=>x.card!==base
    && currentRaceV17(x.card)===currentRaceV17(base)
    && API.attrOf(x)===API.attrOf(locateCardAnyV4(base)));
}
defineUnifiedCardV4('共振装置',[{
  key:'copy-level-same-race-attr', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    const pool=rzOwnFaceUpMonsters(ctx.player);
    const ok2=pool.some(a=>rzSameRaceAttrPartners(ctx.player,a.card).length>0);
    if(!ok2){ ctx.reason='同じ種族・属性の表側モンスターが2体いません'; return false; }
    return true;},
  target(ctx,done){
    const pool=rzOwnFaceUpMonsters(ctx.player)
      .filter(a=>rzSameRaceAttrPartners(ctx.player,a.card).length>0);
    API.selectCard('共振装置：レベルを変えるモンスター',pool,a=>{
      const ra=resolveTarget(a);
      if(!ra){ done([]); return; }
      API.selectCard('共振装置：レベルの元になるモンスター',
        rzSameRaceAttrPartners(ctx.player,ra.card),b=>done([a,b]));});},
  operation(ctx){
    const ts=ctx.selectedTargets||[];
    const a=ts[0]&&resolveTarget(ts[0]), b=ts[1]&&resolveTarget(ts[1]);
    if(!a||!b||a.zone!=='mz'||b.zone!=='mz'||a.card===b.card) return;
    if(currentRaceV17(a.card)!==currentRaceV17(b.card)) return;
    if(API.attrOf(a)!==API.attrOf(b)) return;
    API.setLevel(a, curLV(b.card), 'endPhase', '共振装置');},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true});

/* ===== 12. 氷結界の輸送部隊
   「1ターンに1度、自分の墓地の「氷結界」モンスター2体を選択して発動できる。
     選択したモンスター2体をデッキに戻してシャッフルする。
     その後、お互いにデッキからカードを1枚ドローする。」 ===== */
function rzGraveIceBarrier(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.ICE_BARRIER));
}
API.registerChoiceHandler('rz.icebarrier-return-then-draw',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer);
  picked.forEach(x=>{
    const hh=locateCardAnyV4(x.card);
    if(hh&&hh.p===args.player&&hh.zone==='grave') API.returnToDeck(hh,false,args.reason);
  });
  API.shuffle(args.player);
  API.draw(args.player,1);
  API.draw(args.player===0?1:0,1);
});
defineUnifiedCardV4('氷結界の輸送部隊',[{
  key:'grave-two-to-deck-both-draw', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE,
  speed:1, events:['activate'],
  condition(ctx){
    if(!rzFaceUpSelf(ctx)){ ctx.reason='表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(ctx.card.rzIceTurn===gameState.turn){ ctx.reason='このターンは既に使用しています'; return false; }
    if(rzGraveIceBarrier(ctx.player).length<2){
      ctx.reason='墓地の「氷結界」モンスターが2体いません'; return false; }
    return true;},
  operation(ctx){
    const pool=rzGraveIceBarrier(ctx.player);
    if(pool.length<2) return;
    const me=rzAt(ctx.card);
    if(me) API.setCardFlag(me,'rzIceTurn',gameState.turn,'氷結界の輸送部隊');
    v49P1Open(ctx,{kind:'card',title:'氷結界の輸送部隊：デッキに戻す「氷結界」2体',
      candidates:pool,min:2,max:2},'rz.icebarrier-return-then-draw',
      {reason:'氷結界の輸送部隊'},false);},
  afterResolve(){}
}],{type:'monster', priority:1, timing:['mainPhase']});

/* ===== 13. ハーフ・シャット（速攻魔法）
   「①:フィールドの表側表示モンスター1体を対象として発動できる。
     そのモンスターはターン終了時まで、攻撃力が半分になり、戦闘では破壊されない。」
   効果破壊までは防がない（v21 の battle だけを立てる）。 ===== */
function rzAnyFaceUpMonsters(){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
}
defineUnifiedCardV4('ハーフ・シャット',[{
  key:'halve-atk-and-battle-proof', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:2, events:['activate'],
  condition(ctx){
    if(!rzAnyFaceUpMonsters().length){ ctx.reason='表側表示モンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('ハーフ・シャット：対象にするモンスター',rzAnyFaceUpMonsters(),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const hh=t&&resolveTarget(t);
    if(!hh||hh.zone!=='mz'||hh.card.face!=='up') return;
    API.setAtk(hh, Math.floor(curATK(hh.card)/2), 'endTurn', 'ハーフ・シャット');
    API.grantProtection(hh,{battle:true, until:'endTurn',
      key:'rz.halfshut', label:'ハーフ・シャット'});},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true});

/* ===== 14. 忍法 変化の術（永続罠）
   「①:自分フィールドの表側表示の「忍者」モンスター1体をリリースしてこのカードを発動できる。
     リリースしたモンスターのレベル＋3以下のレベルを持つ獣族・鳥獣族・昆虫族モンスター1体を、
     手札・デッキから特殊召喚する。
     このカードがフィールドから離れた時にそのモンスターは破壊される。」
   「忍者」は P4 の NINJA setcode。生存リンクは既存 v9（独自 watcher は作らない）。 ===== */
function rzOwnNinja(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&isSetCardV4(x.db||dbOf(x.card),SETCODE.NINJA)});
}
function rzHenge3Races(card){
  const ra=currentRaceV17(card);
  return ra==='獣'||ra==='鳥獣'||ra==='昆虫';
}
defineUnifiedCardV4('忍法 変化の術',[{
  key:'tribute-ninja-summon-linked', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  speed:2, events:['activate'],
  condition(ctx){
    if(!rzOwnNinja(ctx.player).length){
      ctx.reason='自分フィールドに表側表示の「忍者」がいません'; return false; }
    return hasMonsterZoneSpace(ctx.player);},
  cost(ctx,done){
    const pool=rzOwnNinja(ctx.player);
    if(!pool.length){ done(false); return; }
    API.selectCard('忍法 変化の術：リリースする「忍者」',pool,t=>{
      const hh=resolveTarget(t);
      if(!hh){ done(false); return; }
      /* P3: リリース前にレベルを控える。場を離れた後では読めない。 */
      API.recordCostSnapshot(hh.card,['level']);
      const me=rzAt(ctx.card);
      if(me) API.setCardFlag(me,'rzHengeCap',(curLV(hh.card)||0)+3,'忍法 変化の術');
      API.sendToGrave(hh,'忍法 変化の術（リリース）');
      done(true);});},
  operation(ctx){
    const cap=Number(ctx.card&&ctx.card.rzHengeCap)||0;
    if(cap<=0||!hasMonsterZoneSpace(ctx.player)) return;
    const pool=v9HandDeckPool(ctx,x=>x.db.k==='m'&&rzHenge3Races(x.card)&&(curLV(x.card)||99)<=cap);
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'忍法 変化の術：特殊召喚するモンスター',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.ninja-henge-summon',args:{player:ctx.player,sourceUid:ctx.card&&ctx.card.uid!=null?ctx.card.uid:null}},
      meta:{scriptName:'忍法 変化の術'}});},
  afterResolve(){}
}],{type:'trap', priority:2, keep:true, includesSpecialSummon:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。
   v9SummonAndLink はソースカードのハンドルを必要とするため、resume引数のUIDから引き直す。 */
API.registerChoiceHandler('s03u62.ninja-henge-summon',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  const src=args.sourceUid!=null?findCardByUid(args.sourceUid):null;
  if(!src||!src.card)return;
  /* source が離れたら特殊召喚したモンスターが破壊される片方向リンク。 */
  v9SummonAndLink({player:args.player,card:src.card},h,'atk','忍法 変化の術',{oneWay:true,monsterOnGone:'destroy'});
  API.shuffle(args.player);
});

/* ===== 15. 誘発召喚
   「相手フィールド上にモンスターが特殊召喚された時に発動する事ができる。
     お互いは手札からレベル4以下のモンスター1体をフィールド上に特殊召喚する事ができる。」
   相手側の選択は ChoiceRequest の player を相手にして開く。 ===== */
function rzLv4OrLessHand(p){
  return API.pileCards(p,'hand',x=>x.db.k==='m'&&(x.db.lv||99)<=4);
}
API.registerChoiceHandler('rz.induced-own-then-foe',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  if(picked&&hasMonsterZoneSpace(args.player)){
    const hh=locateCardAnyV4(picked.card);
    if(hh&&hh.p===args.player&&hh.zone==='hand')
      API.specialSummon(args.player,'hand',hh.index,'atk',args.reason);
  }
  const foe=(args.player===0)?1:0;
  const pool=API.pileCards(foe,'hand',x=>x.db.k==='m'&&(x.db.lv||99)<=4);
  if(!pool.length||!hasMonsterZoneSpace(foe)) return;
  API.requestChoice({kind:'card',player:foe,cancelable:false,min:0,max:1,
    title:'誘発召喚：特殊召喚するレベル4以下のモンスター',candidates:pool,
    resume:{handler:'rz.induced-foe',args:{player:foe,reason:args.reason}}});
});
API.registerChoiceHandler('rz.induced-foe',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  if(!picked||!hasMonsterZoneSpace(args.player)) return;
  const hh=locateCardAnyV4(picked.card);
  if(hh&&hh.p===args.player&&hh.zone==='hand')
    API.specialSummon(args.player,'hand',hh.index,'atk',args.reason);
});
function rzInducedHit(ctx){
  const e=ctx.event||{};
  if(e.player!==ctx.opponent) return false;
  return !!(e.card||e.uid!=null||Array.isArray(e.uids));
}
defineUnifiedCardV4('誘発召喚',[{
  key:'both-players-summon-lv4', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  speed:2, events:['onSpecialSummon'],
  condition(ctx){
    if(!rzInducedHit(ctx)) return false;
    const mine=rzLv4OrLessHand(ctx.player).length&&hasMonsterZoneSpace(ctx.player);
    const foe=rzLv4OrLessHand(ctx.opponent).length&&hasMonsterZoneSpace(ctx.opponent);
    return !!(mine||foe);},
  operation(ctx){
    const pool=rzLv4OrLessHand(ctx.player);
    if(pool.length&&hasMonsterZoneSpace(ctx.player)){
      v49P1Open(ctx,{kind:'card',title:'誘発召喚：特殊召喚するレベル4以下のモンスター',
        candidates:pool,min:0,max:1},'rz.induced-own-then-foe',{reason:'誘発召喚'},false);
      return;}
    /* 自分が呼べない場合でも相手の選択は開く */
    const fpool=rzLv4OrLessHand(ctx.opponent);
    if(!fpool.length||!hasMonsterZoneSpace(ctx.opponent)) return;
    API.requestChoice({kind:'card',player:ctx.opponent,cancelable:false,min:0,max:1,
      title:'誘発召喚：特殊召喚するレベル4以下のモンスター',candidates:fpool,
      resume:{handler:'rz.induced-foe',args:{player:ctx.opponent,reason:'誘発召喚'}}});},
  afterResolve(){}
}],{type:'trap', priority:2, includesSpecialSummon:true, passive:{onSpecialSummon:rzInducedHit}});

/* ===== 16. D・スクランブル
   「相手が直接攻撃を宣言した時、自分フィールド上にモンスターが存在しない場合に発動できる。
     その攻撃を無効にし、手札から「D」と名のついたモンスター1体を特殊召喚する。」
   「D」は P4 の D_MORPHTRONIC 群。 ===== */
function rzMorphInHand(p){
  return API.pileCards(p,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.D_MORPHTRONIC));
}
function rzDirectAttackOnMe(ctx){
  const a=gameState.pendingAttack;
  if(!a) return false;
  if(a.player!==ctx.opponent) return false;
  if(a.targetUid!=null) return false;              /* 直接攻撃のみ */
  return gameState.players[ctx.player].mz.length===0;
}
defineUnifiedCardV4('D・スクランブル',[{
  key:'negate-direct-then-summon-d', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  speed:2, events:['onAttackDeclare'],
  condition(ctx){
    if(!rzDirectAttackOnMe(ctx)) return false;
    return rzMorphInHand(ctx.player).length>0;},
  operation(ctx){
    API.negateAttack('D・スクランブル');
    const pool=rzMorphInHand(ctx.player);
    if(!pool.length||!hasMonsterZoneSpace(ctx.player)) return;
    v49P1Open(ctx,{kind:'card',title:'D・スクランブル：特殊召喚する「D」モンスター',
      candidates:pool,min:1,max:1},'p1cards.special-summon',
      {from:'hand',pos:'atk',reason:'D・スクランブル'},false);},
  afterResolve(){}
}],{type:'trap', priority:2, includesSpecialSummon:true,
    passive:{onAttackDeclare(ctx){
      return rzDirectAttackOnMe(ctx)&&rzMorphInHand(ctx.player).length>0;}}});

/* ===== 17. 森の番人グリーン・バブーン
   「①:このカードが手札・墓地に存在し、自分フィールドの表側表示の獣族モンスターが
     効果で破壊され墓地へ送られた時、1000LPを払って発動できる。
     このカードを特殊召喚する。」 ===== */
function rzBaboonHit(ctx){
  const e=ctx.event||{};
  const hh=rzAt(ctx.card);
  if(!hh||(hh.zone!=='hand'&&hh.zone!=='grave')) return false;
  if(e.reason!=='effect') return false;
  if(e.player!==ctx.player) return false;
  const gone=e.card||((e.uid!=null)?(findCardByUid(e.uid)||{}).card:null);
  if(!gone||dbOf(gone).k!=='m') return false;
  return currentRaceV17(gone)==='獣';
}
defineUnifiedCardV4('森の番人グリーン・バブーン',[{
  key:'beast-destroyed-self-summon', type:EFFECT_TYPE.ACTIVATE,
  range:LOCATION.HAND|LOCATION.GRAVE, speed:2, events:['onDestroy'],
  condition(ctx){
    if(!rzBaboonHit(ctx)) return false;
    if(API.me(ctx).lp<=1000){ ctx.reason='払える1000LPがありません'; return false; }
    return hasMonsterZoneSpace(ctx.player);},
  cost(ctx,done){ API.payCost(ctx.player,1000); done(true); },
  operation(ctx){
    const hh=rzAt(ctx.card);
    if(!hh||(hh.zone!=='hand'&&hh.zone!=='grave')) return;
    if(!hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player,hh.zone,hh.index,'atk','森の番人グリーン・バブーン');},
  afterResolve(){}
}],{type:'monster', priority:1, includesSpecialSummon:true,
    activateFrom:['hand','grave'], passive:{onDestroy:rzBaboonHit}});

/* ===== 18. 大地讃頌（儀式魔法）
   「地属性の儀式モンスターの降臨に使用する事ができる。
     フィールドか手札から、儀式召喚する地属性モンスターと同じレベルになるように
     生け贄を捧げなければならない。」
   P24 の registry に述語で登録する。RITUAL_SPEC_V5 本体は編集しない。
   個別の儀式モンスター名は列挙しない。 ===== */
registerRitualPredicateV24('EARTH_RITUAL_V24', function(cardDb){
  return !!cardDb && cardDb.at === '地';
});
registerRitualSpecV24('大地讃頌',
  {pred:'EARTH_RITUAL_V24', level:null, levelMode:'exact'});
v5DefineRitualSpell('大地讃頌');

/* ===== 19. カラクリ忍者 七七四九
   ・攻撃可能な場合には攻撃しなければならない
   ・攻撃対象に選択された時、このカードの表示形式を「変更」する（攻⇄守のトグル）
   ・召喚成功時、自分フィールドの表側守備表示「カラクリ」の数だけドローできる
   「カラクリ」は P4 の KARAKURI setcode。 ===== */
function rzKarakuriTargeted(ctx){
  const a=gameState.pendingAttack;
  if(!a||a.targetUid==null) return false;
  const c=ctx.card;
  if(!c||c.uid==null||a.targetUid!==c.uid) return false;
  return ctx.zone==='mz'&&c.face==='up';
}
function rzOwnFaceUpDefKarakuri(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&x.card.pos==='def'
      &&isSetCardV4(x.db||dbOf(x.card),SETCODE.KARAKURI)});
}
function rzKarakuriSummoned(ctx){
  const e=ctx.event||{};
  if(e.card!==ctx.card) return false;
  const hh=rzAt(ctx.card);
  return !!hh&&hh.zone==='mz'&&hh.card.face==='up';
}
defineUnifiedCardV4('カラクリ忍者 七七四九',[{
  key:'attack-target-toggle-position', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onAttackDeclare'],
  condition(ctx){ return rzKarakuriTargeted(ctx); },
  operation(ctx){
    const hh=rzAt(ctx.card);
    if(!hh) return;
    /* 「表示形式を変更する」= 攻撃表示なら守備表示へ、守備表示なら攻撃表示へ。 */
    API.changePosition(hh, hh.card.pos==='atk'?'def':'atk', 'カラクリ忍者 七七四九');},
  afterResolve(){}
},{
  key:'summon-draw-by-defense-karakuri', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onNormalSummon'],
  condition(ctx){
    if(!rzKarakuriSummoned(ctx)) return false;
    const n=rzOwnFaceUpDefKarakuri(ctx.player).length;
    return n>0 && API.me(ctx).deck.length>0;},
  operation(ctx){
    const n=Math.min(rzOwnFaceUpDefKarakuri(ctx.player).length, API.me(ctx).deck.length);
    if(n>0) API.draw(ctx.player,n);},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    continuous:{scope:'self',from:['mz'],apply(){return null;},mustAttack(){return true;}},
    passive:{onAttackDeclare:rzKarakuriTargeted,
      onNormalSummon(ctx){
        return rzKarakuriSummoned(ctx)
          && rzOwnFaceUpDefKarakuri(ctx.player).length>0
          && API.me(ctx).deck.length>0;}}});

/* ===== 20. 太陽の神官
   「①:相手フィールドにのみモンスターが存在する場合、このカードは手札から特殊召喚できる。
     ②:フィールドのこのカードが破壊され墓地へ送られた時に発動できる。
       デッキから「赤蟻アスカトル」または「スーパイ」1体を手札に加える。」 ===== */
function rzSunSearchPool(p){
  const a=dbOf({id:findCardIndex('赤蟻アスカトル')});
  const b=dbOf({id:findCardIndex('スーパイ')});
  return API.pileCards(p,'deck',x=>sameCanonicalCardV4(x.db,a)||sameCanonicalCardV4(x.db,b));
}
defineUnifiedCardV4('太陽の神官',[{
  key:'hand-special-summon', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND,
  speed:1, events:['activate'],
  condition(ctx){
    const hh=rzAt(ctx.card);
    if(!hh||hh.zone!=='hand'){ ctx.reason='手札から発動します'; return false; }
    if(API.me(ctx).mz.length>0){ ctx.reason='自分フィールドにモンスターがいます'; return false; }
    if(API.foe(ctx).mz.length===0){ ctx.reason='相手フィールドにモンスターがいません'; return false; }
    return hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    const hh=rzAt(ctx.card);
    if(!hh||hh.zone!=='hand'||!hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player,'hand',hh.index,'atk','太陽の神官');},
  afterResolve(){}
},{
  key:'destroyed-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE,
  speed:1, events:['onDestroy'],
  condition(ctx){
    const e=ctx.event||{};
    if(e.card!==ctx.card&&e.uid!==ctx.card.uid) return false;
    return rzSunSearchPool(ctx.player).length>0;},
  operation(ctx){
    const pool=rzSunSearchPool(ctx.player);
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'太陽の神官：手札に加えるモンスター',
      candidates:pool,min:1,max:1},'p1cards.deck-to-hand',{reason:'太陽の神官'},false);},
  afterResolve(){}
}],{type:'monster', priority:1, includesSpecialSummon:true,
    activateFrom:['hand','grave'], timing:['mainPhase'],
    passive:{onDestroy(ctx){
      const e=ctx.event||{};
      return (e.card===ctx.card||e.uid===ctx.card.uid)&&rzSunSearchPool(ctx.player).length>0;}}});
