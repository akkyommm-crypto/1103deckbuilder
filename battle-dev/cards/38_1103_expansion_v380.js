/* =========================================================================
   System v3.8.0: 1103 script expansion batch 4
   Junk / Scrap / BF / Gravekeeper / Nordic / utility
   Focus: increase explicit automation while keeping card-specific behavior here.
   ========================================================================= */

function v380Name(card){ return String(dbOf(card).n||''); }
function v380FaceUp(p,zone,filter){ return API.fieldCards({zone:zone||'mz',player:p,filter:x=>x.card.face==='up'&&(!filter||filter(x))}); }
function v380IsBF(card){ return !!card && typeof isSetCardV4==='function' ? isSetCardV4(card,SETCODE.BLACKWING) : (!!card && v380Name(card).indexOf('BF－')===0); }
function v380IsScrap(card){ return !!card && v380Name(card).indexOf('スクラップ')>=0; }
function v380IsNordic(card){ return !!card && v380Name(card).indexOf('極星')>=0; }
/* S03-U191: 「「極星」と名のついたモンスター」 — v380IsNordic also matches the 極星宝 Spells / Traps */
function v380IsNordicMonster(card){ return v380IsNordic(card) && dbOf(card).k==='m'; }
function v380IsSix(card){ return !!card && typeof isSetCardV4==='function' ? isSetCardV4(card,SETCODE.SIX_SAMURAI) : (!!card && v380Name(card).indexOf('六武衆')>=0); }
function v380IsSynchro(card){ return !!card && (dbOf(card).st||[]).includes('シンクロ'); }
function v380IsTuner(card){ return !!card && (dbOf(card).st||[]).includes('チューナー'); }
function v380FieldAll(p){ return API.fieldCards({player:p}); }
function v380NecrovalleyPresent(){
  for(let p=0;p<2;p++){
    const P=gameState.players[p];
    if(P.field && P.field.face==='up' && v380Name(P.field)==='王家の眠る谷－ネクロバレー') return true;
  }
  // 墓守の巫女は「表側のフィールド魔法が存在しない」時だけフィールドをネクロバレーとして扱う。
  const faceUpField=[0,1].some(p=>gameState.players[p].field&&gameState.players[p].field.face==='up');
  if(faceUpField) return false;
  return [0,1].some(p=>v380FaceUp(p,'mz',x=>v380Name(x.card)==='墓守の巫女').length>0);
}
function v380SelectUpTo(title,pool,max,done,note){
  const chosen=[];
  const pick=()=>{
    const used=new Set(chosen.map(x=>x.card));
    const left=(pool||[]).filter(x=>!used.has(x.card));
    if(!left.length || chosen.length>=max){ done(chosen); return; }
    API.selectCard(`${title}（${chosen.length+1}/${max}）`,left,t=>{
      chosen.push(t);
      if(chosen.length>=max){ done(chosen); return; }
      API.confirm(title,`${chosen.length}枚選択しました。さらに選びますか？`,pick,()=>done(chosen));
    },note||'');
  };
  if(!pool||!pool.length){ done([]); return; }
  pick();
}
function v380SelectExactly(title,pool,n,done){
  const chosen=[];
  const pick=()=>{
    if(chosen.length>=n){done(chosen);return;}
    const used=new Set(chosen.map(x=>x.card));
    API.selectCard(`${title}（${chosen.length+1}/${n}）`,pool.filter(x=>!used.has(x.card)),t=>{chosen.push(t);pick();});
  };
  pick();
}

/* ============================== Junk / Synchron ============================== */

defineScript("クイック・シンクロン", {
  auditNote:"手札モンスター1体を墓地へ送る特殊召喚手順と、シンクロン指定Sモンスター限定の素材制約を自動化",
  type:'monster',priority:1,
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}
    const pool=API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card&&x.db.k==='m');
    if(!pool.length){ctx.reason='墓地へ送る他の手札モンスターが必要です';return false;} return true;
  },cost(ctx,done){
    const pool=API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card&&x.db.k==='m');
    API.selectCard('クイック・シンクロン：墓地へ送る手札モンスター',pool,t=>{const r=resolveTarget(t);if(!r){done(false);return;}API.sendHandToGrave(ctx.player,r.index,'クイック・シンクロン（特殊召喚手順）');done(true);});
  }},
  synchroNameSubstitute(name){return String(name||'').indexOf('シンクロン')>=0;},
  synchroMaterialRestriction(info){return String((info.spec&&info.spec.raw)||'').indexOf('シンクロン')>=0;}
});

defineScript("ボルト・ヘッジホッグ", {
  auditNote:"墓地自己特殊召喚と場を離れた場合の除外を自動化",
  type:'monster',priority:1,activateFrom:['grave'],timing:['mainPhase'],blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='grave'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに墓地で発動します';return false;}
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}
    if(!v380FaceUp(ctx.player,'mz',x=>v380IsTuner(x.card)).length){ctx.reason='自分フィールドに表側表示のチューナーが必要です';return false;} return true;
  },
  resolve(ctx){const i=API.me(ctx).grave.indexOf(ctx.card);if(i<0)return;API.specialSummon(ctx.player,'grave',i,'atk','ボルト・ヘッジホッグ');const h=locateCard(ctx.card);if(h&&h.zone==='mz')API.setCardFlag({card:ctx.card},'banishWhenLeavesField',true,'ボルト・ヘッジホッグ',{silent:true});},afterResolve(){}
});

defineScript("ジャンク・ウォリアー", {
  auditNote:"S召喚成功時のレベル2以下モンスター攻撃力合計分アップを自動化",
  type:'synchro',priority:1,forced:true,
  condition(ctx){const e=ctx.event||{};return ctx.zone==='mz'&&ctx.eventName==='onSpecialSummon'&&e.card===ctx.card&&e.kind==='synchro';},
  resolve(ctx){
    const gain=v380FaceUp(ctx.player,'mz',x=>x.card!==ctx.card&&curLV(x.card)<=2).reduce((s,x)=>s+Math.max(0,curATK(x.card)),0);
    const self=locateCard(ctx.card);if(self&&gain)API.modAtk(self,gain,0,'permanent','ジャンク・ウォリアー');
  },afterResolve(){},passive:{onSpecialSummon(ctx){const e=ctx.event||{};return ctx.zone==='mz'&&e.card===ctx.card&&e.kind==='synchro';}}
});

defineScript("ジャンク・デストロイヤー", {
  auditNote:"S素材の非チューナー数までフィールドカードを選択して破壊を自動化",
  type:'synchro',priority:1,targets:true,
  condition(ctx){
    const e=ctx.event||{};if(ctx.eventName!=='onSpecialSummon'||e.card!==ctx.card||e.kind!=='synchro'){ctx.reason='S召喚成功時に発動します';return false;}
    const n=(ctx.card.v380SummonMaterials||[]).filter(x=>!x.tuner).length;
    if(!n){ctx.reason='非チューナー素材が記録されていません';return false;}
    if(!API.fieldCards().length){ctx.reason='フィールドに破壊できるカードがありません';return false;}return true;
  },
  selectTargets(ctx,done){const n=Math.max(1,(ctx.card.v380SummonMaterials||[]).filter(x=>!x.tuner).length);v380SelectUpTo('ジャンク・デストロイヤー：破壊するカード',API.fieldCards(),n,done);},
  resolve(ctx){ctx.selectedTargets.slice().reverse().forEach(t=>API.destroy(t,'ジャンク・デストロイヤー'));},afterResolve(){},
  passive:{onSpecialSummon(ctx){const e=ctx.event||{};return ctx.zone==='mz'&&e.card===ctx.card&&e.kind==='synchro';}}
});

/* ============================== Generic / Gravekeeper ============================== */

defineScript("王家の生け贄", {
  auditNote:"ネクロバレー存在時、お互いの手札のモンスターを全て効果で捨てる処理を自動化",
  type:'spell',priority:1,
  condition(ctx){if(!v380NecrovalleyPresent()){ctx.reason='「王家の眠る谷－ネクロバレー」が必要です';return false;}return true;},
  resolve(ctx){
    [0,1].forEach(p=>{
      const idx=[];(gameState.players[p].hand||[]).forEach((c,i)=>{if(dbOf(c).k==='m')idx.push(i);});
      idx.sort((a,b)=>b-a).forEach(i=>API.discard(p,i,'王家の生け贄',{byEffect:true,byPlayer:ctx.player}));
    });
  }
});

/* S03-U196: the 「墓守」 +200 applies while it is face-up whatever the Field Zone (only the ネクロバレー part stops when a face-up Field
   Spell exists; before: the +200 stopped too). */
defineScript("墓守の巫女", {
  auditNote:"フィールド魔法不在時のネクロバレー扱い判定と墓守全体+200を自動化",
  type:'monster',priority:1,
  continuous:{scope:'allMonsters',from:['mz'],apply(target,self){
    const loc=locateCard(self);if(!loc||self.face!=='up')return null;
    return String(dbOf(target).n||'').indexOf('墓守')>=0?{atk:200,def:200}:null;
  },pretendNecrovalley(){return v380NecrovalleyPresent();}}
});

/* S03-U196 (text): 「「王家の眠る谷－ネクロバレー」がフィールド上に存在しなければ発動できない。このカードの攻撃宣言時、相手表側表示モンスターの
   表示形式を変更する事ができる。」 — any face-up opponent monster (before: only the attack target, and not on a direct attack). */
function gkAssassinTargetsS03(p){ return API.fieldCards({zone:'mz', player:p, filter:x=>x.card.face==='up'}); }
defineScript("墓守の暗殺者", {
  type:'monster',priority:1,targets:true,
  condition(ctx){
    const a=gameState.pendingAttack;
    if(ctx.eventName!=='onAttackDeclare'||ctx.zone!=='mz'||!a||a.attackerUid!==ctx.card.uid){ctx.reason='このカードの攻撃宣言時に発動します';return false;}
    if(!v380NecrovalleyPresent()){ctx.reason='「王家の眠る谷－ネクロバレー」が存在しません';return false;}
    if(!gkAssassinTargetsS03(ctx.opponent).length){ctx.reason='相手の表側表示モンスターがいません';return false;}
    return true;
  },
  selectTargets(ctx,done){API.selectCard('墓守の暗殺者：表示形式を変更する相手モンスター',gkAssassinTargetsS03(ctx.opponent),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0],h=t&&t.card&&t.card.uid!=null?findCardByUid(t.card.uid):null;if(h&&h.zone==='mz'&&h.card.face==='up')API.changePosition(h,h.card.pos==='atk'?'def':'atk','墓守の暗殺者');},afterResolve(){},
  passive:{onAttackDeclare(ctx){const a=gameState.pendingAttack;return ctx.zone==='mz'&&!!a&&a.attackerUid===ctx.card.uid&&v380NecrovalleyPresent()&&gkAssassinTargetsS03(ctx.opponent).length>0;}}
});

/* ============================== Scrap ============================== */

defineScript("スクラップ・ドラゴン", {
  auditNote:"①自分と相手のカード1枚ずつ破壊を自動化。②相手による破壊時蘇生は破壊者情報が取れる場合に自動化",
  type:'synchro',priority:1,countLimit:1,targets:true,timing:['mainPhase'],
  condition(ctx){
    if(ctx.eventName==='onDestroy'){
      if(ctx.zone!=='grave'||!ctx.event||ctx.event.byPlayer!==ctx.opponent){ctx.reason='相手によって破壊され墓地へ送られた場合に発動します';return false;}
      if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}
      const p=API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v380IsScrap(x.card)&&!(x.db.st||[]).includes('シンクロ'));
      if(!p.length){ctx.reason='墓地にSモンスター以外の「スクラップ」がいません';return false;}return true;
    }
    if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに発動します';return false;}
    if(!v380FieldAll(ctx.player).length||!v380FieldAll(ctx.opponent).length){ctx.reason='自分と相手のフィールドにカードが1枚ずつ必要です';return false;}return true;
  },
  selectTargets(ctx,done){
    if(ctx.eventName==='onDestroy'){API.selectCard('スクラップ・ドラゴン：特殊召喚するスクラップ',API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v380IsScrap(x.card)&&!(x.db.st||[]).includes('シンクロ')),t=>done([t]));return;}
    API.selectCard('スクラップ・ドラゴン：破壊する自分のカード',v380FieldAll(ctx.player),mine=>API.selectCard('スクラップ・ドラゴン：破壊する相手のカード',v380FieldAll(ctx.opponent),foe=>done([mine,foe])));
  },
  resolve(ctx){
    if(ctx.eventName==='onDestroy'){const t=ctx.selectedTargets[0],r=resolveTarget(t);if(r&&r.zone==='grave')API.specialSummon(ctx.player,'grave',r.index,'atk','スクラップ・ドラゴン');return;}
    ctx.selectedTargets.slice().reverse().forEach(t=>API.destroy(t,'スクラップ・ドラゴン'));
  },afterResolve(){},passive:{onDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.byPlayer===ctx.opponent;}}
});

defineScript("スクラップ・エリア", {
  type:'spell',priority:1,blocksIfNoDeckToHand:true, // S03-U05: ライオウ適用中は発動できない
  condition(ctx){if(!API.pileCards(ctx.player,'deck',x=>v380IsScrap(x.card)&&v380IsTuner(x.card)).length){ctx.reason='デッキに「スクラップ」チューナーがいません';return false;}return true;},
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>v380IsScrap(x.card)&&v380IsTuner(x.card));
    if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'スクラップ・エリア：手札に加えるスクラップチューナー',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-search',args:{player:ctx.player,reason:'スクラップ・エリア'}},
      meta:{scriptName:'スクラップ・エリア'}});
  }
});

defineScript("スクラップ・スコール", {
  type:'spell',priority:2,quickEffect:true,targets:true,
  condition(ctx){
    if(!v380FaceUp(ctx.player,'mz',x=>v380IsScrap(x.card)).length){ctx.reason='自分フィールドに表側表示の「スクラップ」がいません';return false;}
    if(!API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&v380IsScrap(x.card)).length){ctx.reason='デッキに「スクラップ」モンスターがいません';return false;}return true;
  },
  selectTargets(ctx,done){API.selectCard('スクラップ・スコール：最後に破壊する自分のスクラップ',v380FaceUp(ctx.player,'mz',x=>v380IsScrap(x.card)),t=>done([t]));},
  resolve(ctx){
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&v380IsScrap(x.card));
    if(!pool.length)return;
    const t=ctx.selectedTargets[0],tr=t&&resolveTarget(t);
    API.requestChoice({player:ctx.player,kind:'card',title:'スクラップ・スコール：デッキから墓地へ送るスクラップ',
      candidates:pool,min:1,max:1,cancelable:false,   /* S03-U194: mandatory (before: cancelable, skipping the draw and the destruction) */
      resume:{handler:'s03u62.scrap-schooller-mill',args:{player:ctx.player,destroyUid:tr&&tr.card&&tr.card.uid!=null?tr.card.uid:null}},
      meta:{scriptName:'スクラップ・スコール'}});
  }
});
/* S03-U62: resolve() 内の legacy API.selectCard（デッキから墓地へ送るスクラップ）を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.scrap-schooller-mill',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(!h||h.zone!=='deck')return;
  API.mill(args.player,h.index,'スクラップ・スコール');
  API.draw(args.player,1);
  const d=args.destroyUid!=null?findCardByUid(args.destroyUid):null;
  if(d&&d.card)API.destroy(d,'スクラップ・スコール');
});

defineScript("スクラップ・キマイラ", {
  auditNote:"召喚時スクラップチューナー蘇生と、このカードを使うS召喚のスクラップ限定素材制約を自動化",
  type:'monster',priority:1,targets:true,blocksIfNoSpecialSummon:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'){ctx.reason='召喚成功時に発動します';return false;}if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}if(!API.pileCards(ctx.player,'grave',x=>v380IsScrap(x.card)&&v380IsTuner(x.card)).length){ctx.reason='墓地に「スクラップ」チューナーがいません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('スクラップ・キマイラ：特殊召喚するスクラップチューナー',API.pileCards(ctx.player,'grave',x=>v380IsScrap(x.card)&&v380IsTuner(x.card)),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0],r=resolveTarget(t);if(r&&r.zone==='grave')API.specialSummon(ctx.player,'grave',r.index,'def','スクラップ・キマイラ');},afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz';}},
  synchroMaterialRestriction(info){return String(info.exDb&&info.exDb.n||'').indexOf('スクラップ')>=0 && (info.set||[]).every(x=>v380IsScrap(x.card||x.c));}
});

/* ============================== HERO ============================== */

defineScript("ヒーローアライブ", {
  type:'spell',priority:1,blocksIfNoSpecialSummon:true,targets:false,
  condition(ctx){
    if(v380FaceUp(ctx.player,'mz').length){ctx.reason='自分フィールドに表側表示モンスターが存在します';return false;}
    if(API.me(ctx).lp<2){ctx.reason='LPを半分払えません';return false;}
    if(!API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&(x.db.lv||99)<=4&&String(x.db.n||'').indexOf('E・HERO')===0).length){ctx.reason='デッキにレベル4以下のE・HEROがいません';return false;}return true;
  },
  cost(ctx,done){API.payCost(ctx.player,Math.floor(API.me(ctx).lp/2));done(true);},
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&(x.db.lv||99)<=4&&String(x.db.n||'').indexOf('E・HERO')===0);
    if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'ヒーローアライブ：特殊召喚するE・HERO',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-special',args:{player:ctx.player,pos:'atk',reason:'ヒーローアライブ'}},
      meta:{scriptName:'ヒーローアライブ'}});
  }
});

/* ============================== Blackwing ============================== */

defineScript("BF－精鋭のゼピュロス", {
  auditNote:"デュエル中1度、自分表側カードを手札へ戻すコスト→墓地自己SS→400ダメージを自動化",
  type:'monster',priority:1,activateFrom:['grave'],timing:['mainPhase'],blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='grave'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに墓地で発動します';return false;}
    if(ctx.card.v380ZephyrosUsed){ctx.reason='このデュエルでは既に使用済みです';return false;}
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}
    const pool=API.fieldCards({player:ctx.player,filter:x=>x.card.face==='up'});if(!pool.length){ctx.reason='手札へ戻す自分の表側表示カードがありません';return false;}return true;
  },
  cost(ctx,done){API.selectCard('BF－精鋭のゼピュロス：手札へ戻す自分の表側カード',API.fieldCards({player:ctx.player,filter:x=>x.card.face==='up'}),t=>{API.setCardFlag({card:ctx.card},'v380ZephyrosUsed',true,'BF－精鋭のゼピュロス',{silent:true});API.returnToHand(t,'BF－精鋭のゼピュロス（コスト）');done(true);});},
  resolve(ctx){const i=API.me(ctx).grave.indexOf(ctx.card);if(i>=0){API.specialSummon(ctx.player,'grave',i,'atk','BF－精鋭のゼピュロス');API.damageLP(ctx.player,400);}},afterResolve(){}
});

defineScript("BF－大旆のヴァーユ", {
  auditNote:"フィールドではS素材不可、墓地から自身＋非チューナーBFを除外して同レベルBF Sモンスターを効果無効で特殊召喚",
  type:'monster',priority:1,activateFrom:['grave'],timing:['mainPhase'],cannotSynchroMaterial:true,blocksIfNoSpecialSummon:true,targets:true,
  condition(ctx){
    if(ctx.zone!=='grave'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに墓地で発動します';return false;}
    if(typeof graveMoveBlocked==='function'&&graveMoveBlocked('grave','banish')){ctx.reason='墓地のカードを除外できません';return false;}
    const mates=API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v380IsBF(x.card)&&!v380IsTuner(x.card));
    if(!mates.some(x=>API.pileCards(ctx.player,'ex',e=>v380IsBF(e.card)&&(e.db.st||[]).includes('シンクロ')&&(e.db.lv||0)===(curLV(ctx.card)+curLV(x.card))).length)){ctx.reason='組み合わせられるBFとBFシンクロがありません';return false;}return true;
  },
  selectTargets(ctx,done){
    const mates=API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v380IsBF(x.card)&&!v380IsTuner(x.card)).filter(x=>API.pileCards(ctx.player,'ex',e=>v380IsBF(e.card)&&(e.db.st||[]).includes('シンクロ')&&(e.db.lv||0)===(curLV(ctx.card)+curLV(x.card))).length);
    API.selectCard('BF－大旆のヴァーユ：除外する非チューナーBF',mates,m=>{const lv=curLV(ctx.card)+curLV(m.card);const ex=API.pileCards(ctx.player,'ex',e=>v380IsBF(e.card)&&(e.db.st||[]).includes('シンクロ')&&(e.db.lv||0)===lv);API.selectCard(`ヴァーユ：特殊召喚するLv${lv}のBFシンクロ`,ex,e=>done([{mate:m,ex:e}]));});
  },
  resolve(ctx){
    const s=ctx.selectedTargets[0];if(!s)return;const mr=resolveTarget(s.mate),self=resolveTarget({card:ctx.card}),er=resolveTarget(s.ex);if(!mr||mr.zone!=='grave'||!self||self.zone!=='grave'||!er||er.zone!=='ex')return;
    API.banish(mr,'BF－大旆のヴァーユ');const self2=resolveTarget({card:ctx.card});if(!self2||self2.zone!=='grave')return;API.banish(self2,'BF－大旆のヴァーユ');const exNow=resolveTarget({card:s.ex.card});if(!exNow||exNow.zone!=='ex')return;API.specialSummon(ctx.player,'ex',exNow.index,'atk','BF－大旆のヴァーユ');const h=locateCard(s.ex.card);if(h&&h.zone==='mz')API.setCardFlag({card:s.ex.card},'negated',true,'BF－大旆のヴァーユ',{silent:true});   /* S03-U48: locateCard は card を返さない */
  },afterResolve(){},cannotSynchroMaterial:true
});

/* 黒羽の宝札: S03-U68 (C-S03-27) で cards/H8D_claude_s03u68_activation_negated_release_secondary.js に移設
   （cost() ではなく resolve() で noSpecialSummon を立てる修正、declareActivationNegatedReleaseS03 の追加）。 */

defineScript("デルタ・クロウ－アンチ・リバース", {
  type:'trap',priority:2,quickEffect:true,activateFrom:['hand'],
  condition(ctx){
    if(!v380FaceUp(ctx.player,'mz',x=>v380IsBF(x.card)).length){ctx.reason='自分フィールドにBFが必要です';return false;}
    if(ctx.zone==='hand'){
      const mons=API.fieldCards({zone:'mz',player:ctx.player});if(mons.length!==3||!mons.every(x=>x.card.face==='up'&&v380IsBF(x.card))){ctx.reason='手札から発動するには自分モンスターが表側BF3体のみ必要です';return false;}
    }
    const set=API.fieldCards({player:ctx.opponent,filter:x=>(x.zone==='sz'||x.zone==='field')&&x.card.face==='down'});if(!set.length){ctx.reason='相手フィールドにセットされた魔法・罠がありません';return false;}return true;
  },
  resolve(ctx){API.fieldCards({player:ctx.opponent,filter:x=>(x.zone==='sz'||x.zone==='field')&&x.card.face==='down'}).slice().reverse().forEach(t=>API.destroy(t,'デルタ・クロウ－アンチ・リバース'));}
});

/* ============================== Six Samurai ============================== */

defineScript("諸刃の活人剣術", {
  auditNote:"墓地の六武衆2体を同時特殊召喚し、End Phaseに残っている個体を破壊して破壊時攻撃力合計分の自分ダメージまで自動化",
  type:'trap',priority:2,targets:true,targetCount:2/* S03-U472: 墓地の六武衆2体を対象にする */,blocksIfNoSpecialSummon:true,
  condition(ctx){if(API.me(ctx).mz.length>ZONE_LIMITS.mz-2){ctx.reason='モンスターゾーンに2枠必要です';return false;}if(API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&v380IsSix(x.card)).length<2){ctx.reason='墓地に六武衆モンスターが2体必要です';return false;}return true;},
  selectTargets(ctx,done){v380SelectExactly('諸刃の活人剣術：特殊召喚する六武衆',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&v380IsSix(x.card)),2,done);},
  resolve(ctx){
    /* S03-U45: 対象の一方が解決前に墓地を離れていても（D.D.クロウ等で除外）、残る1体だけ特殊召喚する（11/08/03）。
       離れた対象は deserializeChainSelectionV2 で null になるので除く。以前は null.card で解決エラーになり、デュエルが止まった。 */
    const cards=(ctx.selectedTargets||[]).filter(x=>x&&x.card).map(x=>x.card),uids=[];
    cards.forEach(c=>{const h=resolveTarget({card:c});if(!h||h.zone!=='grave')return;API.specialSummon(ctx.player,'grave',h.index,'atk','諸刃の活人剣術');const f=locateCard(c);if(f&&f.zone==='mz'){ensureCardUid(gameState,c);API.setCardFlag({card:c},'v380DoubleEdgeTurn',gameState.turn,'諸刃の活人剣術',{silent:true});uids.push(c.uid);}});
    if(uids.length)API.registerReserveEffect(ctx.player,'諸刃の活人剣術：エンド破壊＋ダメージ','endPhase','',{kind:'destroyDamageUids',uids,flagKey:'v380DoubleEdgeTurn',data:{damagePlayer:ctx.player}});
  }
});

/* ============================== Nordic ============================== */

defineScript("神の桎梏グレイプニル", {
  type:'trap',priority:2,blocksIfNoDeckToHand:true, // S03-U05: ライオウ適用中は発動できない
  condition(ctx){if(!API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&v380IsNordic(x.card)).length){ctx.reason='デッキに「極星」モンスターがいません';return false;}return true;},
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&v380IsNordic(x.card));
    if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'神の桎梏グレイプニル：手札に加える極星',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-search',args:{player:ctx.player,reason:'神の桎梏グレイプニル'}},
      meta:{scriptName:'神の桎梏グレイプニル'}});
  }
});

defineScript("極星獣グルファクシ", {
  type:'monster',priority:1,
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){if(API.me(ctx).mz.length){ctx.reason='自分フィールドにモンスターが存在します';return false;}if(!v380FaceUp(ctx.opponent,'mz',x=>v380IsSynchro(x.card)).length){ctx.reason='相手フィールドに表側表示のSモンスターが必要です';return false;}return true;}}
});

defineScript("極星霊デックアールヴ", {
  type:'monster',priority:1,targets:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'){ctx.reason='召喚成功時に発動します';return false;}if(!API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v380IsNordicMonster(x.card)).length){ctx.reason='墓地に「極星」モンスターがいません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('極星霊デックアールヴ：手札に戻す極星',API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&v380IsNordicMonster(x.card)),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.returnToHand(t,'極星霊デックアールヴ');},afterResolve(){},passive:{onNormalSummon(ctx){return ctx.zone==='mz';}}
});

defineScript("極星霊リョースアールヴ", {
  type:'monster',priority:1,targets:true,blocksIfNoSpecialSummon:true,
  condition(ctx){if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'){ctx.reason='召喚成功時に発動します';return false;}const own=v380FaceUp(ctx.player,'mz',x=>x.card!==ctx.card);if(!own.length){ctx.reason='このカード以外の表側表示モンスターが必要です';return false;}if(!API.pileCards(ctx.player,'hand',x=>v380IsNordicMonster(x.card)).some(h=>own.some(o=>curLV(h.card)<=curLV(o.card)))){ctx.reason='特殊召喚できる手札の極星がいません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('極星霊リョースアールヴ：レベル基準にする自分モンスター',v380FaceUp(ctx.player,'mz',x=>x.card!==ctx.card),base=>{const hand=API.pileCards(ctx.player,'hand',x=>v380IsNordicMonster(x.card)&&curLV(x.card)<=curLV(base.card));API.selectCard(`リョースアールヴ：Lv${curLV(base.card)}以下の極星を特殊召喚`,hand,h=>done([{base,hand:h}]));});},
  resolve(ctx){const s=ctx.selectedTargets[0];if(!s)return;const h=resolveTarget(s.hand);if(h&&h.zone==='hand')API.specialSummon(ctx.player,'hand',h.index,'atk','極星霊リョースアールヴ');},afterResolve(){},passive:{onNormalSummon(ctx){return ctx.zone==='mz';}}
});

defineScript("極星天ヴァルキュリア", {
  type:'monster',priority:1,blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon'||ctx.zone!=='mz'){ctx.reason='召喚成功時に発動します';return false;}
    if(!API.fieldCards({zone:'mz',player:ctx.opponent}).length){ctx.reason='相手フィールドにモンスターが必要です';return false;}
    if(API.fieldCards({player:ctx.player}).some(x=>x.card!==ctx.card)){ctx.reason='自分フィールドはこのカード以外空である必要があります';return false;}
    if(API.pileCards(ctx.player,'hand',x=>v380IsNordicMonster(x.card)).length<2){ctx.reason='手札に除外する極星モンスターが2体必要です';return false;}return true;
  },
  cost(ctx,done){v380SelectExactly('極星天ヴァルキュリア：除外する手札の極星',API.pileCards(ctx.player,'hand',x=>v380IsNordicMonster(x.card)),2,sel=>{const cards=sel.map(x=>x.card);cards.forEach(c=>{const h=resolveTarget({card:c});if(h&&h.zone==='hand')API.banish(h,'極星天ヴァルキュリア（コスト）');});done(true);});},
  resolve(ctx){API.createToken(ctx.player,{name:'エインヘリアル・トークン',atk:1000,def:1000,lv:4,ra:'戦士',at:'地',pos:'def'},2);},afterResolve(){},passive:{onNormalSummon(ctx){return ctx.zone==='mz';}}
});

/* ============================== Other utility ============================== */

defineScript("パペット・プラント", {
  type:'monster',priority:1,activateFrom:['hand'],targets:true,timing:['mainPhase'],
  condition(ctx){if(ctx.zone!=='hand'||ctx.player!==gameState.activePlayer||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに手札から発動します';return false;}if(!API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'&&(x.db.ra==='戦士'||x.db.ra==='魔法使い')}).length){ctx.reason='相手に戦士族・魔法使い族がいません';return false;}return true;},
  cost(ctx,done){const i=API.me(ctx).hand.indexOf(ctx.card);if(i<0){done(false);return;}API.discard(ctx.player,i,'パペット・プラント（コスト）');done(true);},
  selectTargets(ctx,done){API.selectCard('パペット・プラント：コントロールを得るモンスター',API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'&&(x.db.ra==='戦士'||x.db.ra==='魔法使い')}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.changeControl(t,ctx.player,'パペット・プラント','endPhase');},afterResolve(){}
});

defineScript("大嵐", {
  type:'spell',priority:1,
  condition(ctx){const all=API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).filter(x=>x.card!==ctx.card);if(!all.length){ctx.reason='他に魔法・罠カードがありません';return false;}return true;},
  resolve(ctx){API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).filter(x=>x.card!==ctx.card).slice().reverse().forEach(t=>API.destroy(t,'大嵐'));}
});

defineScript("くず鉄のかかし", {
  auditNote:"攻撃無効後、墓地へ送らず再セットを自動化",
  type:'trap',priority:2,quickEffect:true,targets:true,
  condition(ctx){const a=gameState.pendingAttack;if(ctx.eventName!=='onAttackDeclare'&&!a){ctx.reason='相手モンスターの攻撃宣言時に発動します';return false;}if(!a||a.player!==ctx.opponent){ctx.reason='相手の攻撃宣言ではありません';return false;}return true;},
  selectTargets(ctx,done){const a=gameState.pendingAttack,h=a&&findCardByUid(a.attackerUid);if(!h){done([]);return;}done([h]);},
  resolve(ctx){API.negateAttack('くず鉄のかかし');},   /* S03-U39: 攻撃無効は Action（NEGATE_ATTACK_V45）で記録する */
  afterResolve(ctx){const h=locateCard(ctx.card);if(h&&(h.zone==='sz'||h.zone==='field'))act({type:'FX_SET_STATE',player:h.p,zone:h.zone,index:h.index,face:'down',reason:'くず鉄のかかし'});}
  ,passive:{onAttackDeclare(ctx){const a=gameState.pendingAttack;return ctx.zone==='sz'&&!!a&&a.player===ctx.opponent;}}
});

defineScript("魂を削る死霊", {
  auditNote:"戦闘破壊耐性と直接戦闘ダメージ時のランダム1枚ハンデス。効果対象になった時の自壊は S03-U137 の declareTargetedSelfDestroyS03（engine/1ZM）",
  type:'monster',priority:1,battleProof:true,forced:true,dsTiming:'after',
  condition(ctx){const b=ctx.battle||{};return ctx.eventName==='onDamageStep'&&ctx.step==='after'&&b.atkCard===ctx.card&&b.target==='direct'&&b.damage>0&&API.foe(ctx).hand.length>0;},
  resolve(ctx){const H=API.foe(ctx).hand;if(!H.length)return;API.discard(ctx.opponent,(typeof duelRandomInt==='function'?duelRandomInt(H.length):Math.floor(Math.random()*H.length)),'魂を削る死霊',{byEffect:true,byPlayer:ctx.player});},afterResolve(){},
  passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.step==='after'&&b.atkCard===ctx.card&&b.target==='direct'&&b.damage>0&&API.foe(ctx).hand.length>0;}}
});
/* S03-U137: 「このカードがカードの効果の対象になった時、このカードを破壊する」 */
declareTargetedSelfDestroyS03("魂を削る死霊");
