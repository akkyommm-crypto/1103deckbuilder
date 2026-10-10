/* S03-U14 SUMMON_COUNTER_PLACEMENT — 武士道カウンター（「六武衆」の召喚・特殊召喚）
   ① 「六武衆」モンスターが召喚・特殊召喚される度に置く：engine/1N_summon_counter_s03.js の summonCounterS03 宣言。
      チェーンを作らず、ダメージステップでも置く（R1103-SIXGATE-001、R1103-SIXUNITED-001/003）。
      同時に特殊召喚された「六武衆」は1回の出来事として N 個だけ置く（R1103-SIXGATE-002）。
   ② カウンターを取り除く／このカードを墓地へ送るコストと効果の選択は、P1.1 activationV11 と v49 の選択で行う
      （閉包を使わないので、保存・Replay から再開できる）。
   「六武衆」は P4 group SIX_SAMURAI_NAMED（setcode 0x1000 から紫炎系を除いた集合）で判定する。
   「紫炎」は名前に「紫炎」を含むカード。効果テキストは data/carddata.json に従う。 */
const S03_BUSHIDO = '武士道';
const S03_BUSHIDO_DECL = {kind:S03_BUSHIDO, group:'SIX_SAMURAI_NAMED', label:'六武衆'};
declareCardActivationFreeV32(['六武院']);   /* フィールド魔法。カードの発動は効果を発動しない */

function s03SixNamed(x){ const c=x&&(x.card||x); return !!c&&isCardInGroupV4(c,'SIX_SAMURAI_NAMED'); }
function s03ShienNamed(x){ const c=x&&(x.card||x); return !!c&&String(cardName(c)||'').indexOf('紫炎')>=0; }
function s03EffectMonster(x){ const d=(x&&(x.db||dbOf(x.card||x)))||{}; return d.k==='m'&&Array.isArray(d.st)&&d.st.indexOf('効果')>=0; }
function s03BushidoOn(card){ return (card&&card.counters&&Number(card.counters[S03_BUSHIDO]))||0; }
function s03GraveLeaveBlocked(){ return typeof graveMoveBlocked==='function'&&!!graveMoveBlocked('grave','leave'); }
function s03CanSpecialSummon(p,db){ return !(typeof v46SpecialSummonRestrictionReason==='function'&&v46SpecialSummonRestrictionReason(p,db)); }

/* ---- 六武の門 ---------------------------------------------------------- */
function s03GateBoostTargets(){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&s03EffectMonster(x)&&(s03SixNamed(x)||s03ShienNamed(x))});
}
function s03GateSearchPool(p){
  const deck=deckToHandLockReasonV32(p)?[]:API.pileCards(p,'deck',x=>x.db.k==='m'&&s03SixNamed(x));
  const grave=s03GraveLeaveBlocked()?[]:API.pileCards(p,'grave',x=>x.db.k==='m'&&s03SixNamed(x));
  return deck.concat(grave);
}
function s03GateReviveTargets(p){
  if(s03GraveLeaveBlocked()||!hasMonsterZoneSpace(p)) return [];
  return API.pileCards(p,'grave',x=>s03EffectMonster(x)&&s03ShienNamed(x)&&s03CanSpecialSummon(p,x.db));
}
function s03GateModes(p){
  const n=API.counterTotal(p,S03_BUSHIDO), out=[];
  if(n>=2&&s03GateBoostTargets().length) out.push({key:'m2',cost:2,label:'2つ：「六武衆」「紫炎」効果モンスター1体の攻撃力を500アップ'});
  if(n>=4&&s03GateSearchPool(p).length) out.push({key:'m4',cost:4,label:'4つ：デッキ・墓地から「六武衆」モンスター1体を手札に加える'});
  if(n>=6&&s03GateReviveTargets(p).length) out.push({key:'m6',cost:6,label:'6つ：墓地の「紫炎」効果モンスター1体を特殊召喚'});
  return out;
}
function s03GatePay(d,m,uids){
  API.removeCounterSpread(uids,S03_BUSHIDO,'六武の門（コスト）');
  if(m.key==='m4'){ p11cCommit(d,[],'m4'); return; }
  const cands=m.key==='m2'?s03GateBoostTargets():s03GateReviveTargets(d.player);
  p11cOpen(d,{title:m.key==='m2'?'六武の門：攻撃力を500アップするモンスター':'六武の門：特殊召喚する「紫炎」効果モンスター',
    candidates:cands,targeting:true,min:1,max:1,cancelable:false},'s03u14.gate-target',{mode:m.key});
}
API.registerChoiceHandler('s03u14.gate-mode',(answer,args)=>{
  const d=args.activation; if(answer.cancelled) return p11cAbort(d);
  const key=String(answer.cards&&answer.cards[0]&&answer.cards[0].value||'');
  const m=s03GateModes(d.player).find(x=>x.key===key); if(!m) return p11cAbort(d);
  const units=API.counterUnits(d.player,S03_BUSHIDO);
  if(new Set(units.map(u=>u.card.uid)).size<=1){ s03GatePay(d,m,units.slice(0,m.cost).map(u=>u.card.uid)); return; }
  API.requestChoice({player:d.player,kind:'card',title:`六武の門：取り除く武士道カウンター（${m.cost}つ）`,candidates:units,
    min:m.cost,max:m.cost,cancelable:true,resume:{handler:'s03u14.gate-pay',args:{activation:d,mode:m.key}},meta:{scriptName:d.name}});
});
API.registerChoiceHandler('s03u14.gate-pay',(answer,args)=>{
  const d=args.activation; if(answer.cancelled) return p11cAbort(d);
  const m=s03GateModes(d.player).find(x=>x.key===args.mode), uids=v22AnswerUids(answer);
  if(!m||uids.length!==m.cost) return p11cAbort(d);
  s03GatePay(d,m,uids);
});
API.registerChoiceHandler('s03u14.gate-target',(answer,args)=>{
  const q=p11cCards(answer); if(q.length!==1) return p11cAbort(args.activation);
  p11cCommit(args.activation,q,args.mode);
});
API.registerChoiceHandler('s03u14.to-hand',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0], h=picked&&locateCardAnyV4(picked.card);
  if(!h||h.p!==args.player) return;
  if(h.zone==='deck') API.searchDeck(args.player,h.index,'六武の門');
  else if(h.zone==='grave') API.returnToHand(h,'六武の門');
});

defineScript('六武の門',{
  type:'continuous-spell', priority:1, fieldIgnition:true, targets:true, includesSpecialSummon:true,
  summonCounterS03:Object.assign({n:2},S03_BUSHIDO_DECL), counterCapableV22:{'武士道':true},
  condition(ctx){
    if(ctx.zone!=='sz'){ ctx.reason='表側表示の六武の門から発動します'; return false; }
    if(API.counterTotal(ctx.player,S03_BUSHIDO)<2){ ctx.reason='自分フィールドの武士道カウンターが足りません'; return false; }
    if(!s03GateModes(ctx.player).length){ ctx.reason='発動できる効果がありません'; return false; }
    return true;
  },
  activationV11(ctx,d){
    const modes=s03GateModes(d.player); if(!modes.length){ p11cAbort(d); return; }
    API.requestChoice({player:d.player,kind:'option',title:'六武の門：発動する効果（取り除く武士道カウンターの数）',
      candidates:modes.map(m=>({key:m.key,value:m.key,label:m.label})),min:1,max:1,cancelable:true,
      resume:{handler:'s03u14.gate-mode',args:{activation:d}},meta:{scriptName:d.name}});
  },
  resolve(ctx){
    const mode=ctx.chainLink&&ctx.chainLink.v4EffectKey;
    const t=(ctx.selectedTargets||[])[0], h=t&&resolveTarget(t);
    if(mode==='m2'){
      if(h&&h.zone==='mz'&&h.card.face==='up'&&s03EffectMonster(h)&&(s03SixNamed(h)||s03ShienNamed(h))) API.modAtk(h,500,0,'endTurn','六武の門');
      return;
    }
    if(mode==='m4'){
      const pool=s03GateSearchPool(ctx.player);
      if(pool.length) v49P1Open(ctx,{kind:'card',title:'六武の門：手札に加える「六武衆」モンスター',candidates:pool,min:1,max:1},'s03u14.to-hand',{},false);
      return;
    }
    if(mode==='m6'){
      if(h&&h.zone==='grave'&&h.p===ctx.player&&s03EffectMonster(h)&&s03ShienNamed(h)&&hasMonsterZoneSpace(ctx.player)&&!s03GraveLeaveBlocked())
        API.specialSummon(ctx.player,'grave',h.index,'atk','六武の門');
    }
  },
  afterResolve(){}
});

/* ---- このカードを墓地へ送って発動する2枚 --------------------------------- */
/* コストを払った時点で乗っていた数を activation cost の amount に残す（解決時にはカードが墓地にある）。 */
function s03SendSelfCost(d,reason){
  const h=findCardByUid(d.uid);
  if(!h||h.zone!=='sz'||s03BushidoOn(h.card)<=0){ p11cAbort(d); return; }
  API.recordActivationCost(p11cCtx(d.player),'bushido-self',[h],[],s03BushidoOn(h.card));
  API.sendToGrave(h,reason+'（コスト）');
  p11cCommit(d,[],null);
}
function s03SelfCostCount(ctx){ const r=API.activationCosts(ctx,'bushido-self')[0]; return r?(Number(r.amount)||0):0; }

defineScript('六武衆の結束',{
  type:'continuous-spell', priority:1, fieldIgnition:true,
  summonCounterS03:Object.assign({n:1},S03_BUSHIDO_DECL), counterCapableV22:{'武士道':true}, counterMaxV22:{'武士道':2},
  condition(ctx){
    if(ctx.zone!=='sz'){ ctx.reason='表側表示の六武衆の結束から発動します'; return false; }
    if(s03BushidoOn(ctx.card)<=0){ ctx.reason='武士道カウンターが置かれていません'; return false; }
    return true;
  },
  activationV11(ctx,d){ s03SendSelfCost(d,'六武衆の結束'); },
  resolve(ctx){ const n=s03SelfCostCount(ctx); if(n>0) API.draw(ctx.player,n); },
  afterResolve(){}
});

function s03DojoPool(p,maxLv){
  if(!hasMonsterZoneSpace(p)) return [];
  return API.pileCards(p,'deck',x=>s03EffectMonster(x)&&(s03SixNamed(x)||s03ShienNamed(x))&&(Number(x.db.lv)||0)<=maxLv&&s03CanSpecialSummon(p,x.db));
}
defineScript('紫炎の道場',{
  type:'continuous-spell', priority:1, fieldIgnition:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  summonCounterS03:Object.assign({n:1},S03_BUSHIDO_DECL), counterCapableV22:{'武士道':true},
  condition(ctx){
    const n=s03BushidoOn(ctx.card);
    if(ctx.zone!=='sz'){ ctx.reason='表側表示の紫炎の道場から発動します'; return false; }
    if(n<=0){ ctx.reason='武士道カウンターが置かれていません'; return false; }
    if(!s03DojoPool(ctx.player,n).length){ ctx.reason='デッキに特殊召喚できるモンスターがいません'; return false; }
    return true;
  },
  activationV11(ctx,d){ s03SendSelfCost(d,'紫炎の道場'); },
  resolve(ctx){
    const pool=s03DojoPool(ctx.player,s03SelfCostCount(ctx));
    if(pool.length) v49P1Open(ctx,{kind:'card',title:'紫炎の道場：デッキから特殊召喚するモンスター',candidates:pool,min:1,max:1},
      'p1cards.special-summon',{from:'deck',pos:'atk',reason:'紫炎の道場'},false);
  },
  afterResolve(){}
});

/* ---- 六武院 ------------------------------------------------------------ */
defineScript('六武院',{
  type:'field', priority:1,
  summonCounterS03:Object.assign({n:1},S03_BUSHIDO_DECL), counterCapableV22:{'武士道':true},
  /* 表側表示の六武院には発動する効果が無い（カードの発動は H2 の宣言で扱う） */
  condition(ctx){ ctx.reason='六武院には発動する効果がありません'; return false; },
  continuous:{scope:'oppMonsters',from:['field'],apply(card,self){
    if(!card||card.face!=='up') return null;
    const n=s03BushidoOn(self); return n>0?{atk:-100*n}:null;
  }},
  afterResolve(){}
});
