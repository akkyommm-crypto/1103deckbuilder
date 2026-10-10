/* =========================================================================
   System v4.0 — ADS architecture layer (independent implementation)
   -------------------------------------------------------------------------
   This module copies no ocgcore/ygopro source code. It adopts only the public
   engine concepts that fit 1103: LOCATION masks, archetype set codes, alias /
   canonical identity, and serializable RESET-controlled runtime effects.

   Important separation:
     - CARD_SCRIPTS / effect definitions contain functions.
     - gameState.runtimeEffects contains JSON data only, so Undo/save/replay can
       serialize it safely.
   ========================================================================= */

/* -------------------- LOCATION -------------------- */
const LOCATION = Object.freeze({
  DECK:      0x0001,
  HAND:      0x0002,
  MZONE:     0x0004,
  SZONE:     0x0008,
  GRAVE:     0x0010,
  REMOVED:   0x0020,
  EXTRA:     0x0040,
  FIELD:     0x0080,
  OVERLAY:   0x0100,
  ONFIELD:   0x0004|0x0008|0x0080,
  ALL:       0x01ff,
});
const V4_ZONE_LOCATION = Object.freeze({
  deck:LOCATION.DECK, hand:LOCATION.HAND, mz:LOCATION.MZONE, sz:LOCATION.SZONE,
  grave:LOCATION.GRAVE, banish:LOCATION.REMOVED, ex:LOCATION.EXTRA,
  field:LOCATION.FIELD, xyz:LOCATION.OVERLAY,
});
function locationOfZoneV4(zone){ return V4_ZONE_LOCATION[zone]||0; }
function locationMatchesV4(zone, mask){ return !!(locationOfZoneV4(zone) & (Number(mask)||0)); }
function locateCardAnyV4(card){
  if(!card)return null;
  if(card.uid!=null){const h=findCardByUid(card.uid);if(h)return h;}
  for(let p=0;p<2;p++){const P=gameState&&gameState.players&&gameState.players[p];if(!P)continue;if(P.field===card)return {p,zone:'field',index:0,card};for(const z of ['hand','mz','sz','grave','banish','deck','ex']){const i=(P[z]||[]).indexOf(card);if(i>=0)return {p,zone:z,index:i,card};}}
  return null;
}
function locationOfCardV4(card){ const h=locateCardAnyV4(card); return h?locationOfZoneV4(h.zone):0; }

/* -------------------- SETCODE / alias --------------------
   data/carddata.json is enriched at build/source level. Existing `tg` remains
   for compatibility, while `setcode` is the authoritative archetype metadata
   for new v4 scripts. Generic utility tg groups 53..56 are not set codes. */
const SETCODE = Object.freeze({
  SIX_SAMURAI:0x1000, AGENT_RELATED:0x1001, LIGHTSWORN:0x1002, HERO:0x1003,
  BLACKWING:0x1004, INFERNITY:0x1005, KARAKURI:0x1006, GADGET:0x1007,
  MACHINA:0x1008, DRAGUNITY:0x1009, TG:0x100a, JUNK:0x100b,
  SYNCHRON:0x100c, ICE_BARRIER:0x100d, WORM:0x100e, GEM_KNIGHT:0x100f,
  LAVAL:0x1010, GUSTO:0x1011, GISHKI:0x1012, NATURIA:0x1013,
  JURRAC:0x1014, FLAMVELL:0x1015, VYLON:0x1016, INVELLZ:0x1017,
  SCRAP:0x1019, WIND_UP:0x101a, DARK_WORLD:0x101b, FABLED:0x101c,
  GRAVEKEEPER:0x101d, GLADIATOR_BEAST:0x101e, BATTERYMAN:0x101f,
  OJAMA:0x1020, CRYSTAL_BEAST:0x1021, CLOUDIAN:0x1022, AOJ:0x1023,
  X_SABER:0x1024, NORDIC:0x1025, MIST_VALLEY:0x1026, HARPIE:0x1027,
  AMAZONESS:0x1028, FROG:0x1029, KOAKI_MEIRU:0x102a, FORTUNE_LADY:0x102b,
  MORPHTRONIC:0x102c, GENEX:0x102d, ALIEN:0x102e, BLUE_EYES:0x102f,
  RED_EYES:0x1030, DARK_MAGICIAN:0x1031, CYBER_DRAGON:0x1032, NINJA:0x1033,
  PHOTON:0x1034,
  ELEMENTAL_HERO:0x2001, DESTINY_HERO:0x2002, EVIL_HERO:0x2003,
  LEGENDARY_SIX_SAMURAI:0x2004, AGENT:0x2005, XX_SABER:0x2006,
});
function v4DbOf(x){
  if(!x) return {};
  if(x.n && x.k) return x;
  if(x.db && x.db.n) return x.db;
  if(x.card) return dbOf(x.card)||{};
  return dbOf(x)||{};
}
function setcodesOfV4(x){
  const d=v4DbOf(x), raw=d.setcode;
  if(Array.isArray(raw)) return raw.map(Number).filter(Number.isFinite);
  if(raw!=null) return [Number(raw)].filter(Number.isFinite);
  return [];
}
function isSetCardV4(x, code){ return setcodesOfV4(x).includes(Number(code)); }
function hasAnySetcodeV4(x, codes){ const s=new Set(setcodesOfV4(x)); return [].concat(codes||[]).some(c=>s.has(Number(c))); }
function canonicalCardCodeV4(x){
  /* System v17: 「カード名を〜として扱う」は identity 判定の入口である
     ここだけで反映する。P4 の authority metadata 自体は書き換えない。 */
  let d=null;
  if(typeof overriddenNameDbV17==='function' && x && typeof x==='object' && !x.n){
    d = overriddenNameDbV17(x);
  }
  if(!d) d = v4DbOf(x);
  const n=Number(d.alias||d.c||0);
  return Number.isFinite(n)&&n>0?n:0;
}
function sameCanonicalCardV4(a,b){
  const ac=canonicalCardCodeV4(a), bc=canonicalCardCodeV4(b);
  return !!ac && ac===bc;
}

/* -------------------- RESET --------------------
   RESET is a lifetime axis, separate from ATK/DEF calculation layers. */
const RESET = Object.freeze({
  LEAVE:       1<<0, // registered field source/target leaves the field
  TO_GRAVE:    1<<1, // source or target reaches GY
  TURN_SET:    1<<2, // any turn changes
  SELF_TURN:   1<<3, // controller's turn ends
  OPPO_TURN:   1<<4, // opponent's turn ends
  END:         1<<5, // End Phase processing
  DISABLE:     1<<6, // source is explicitly negated/disabled
  PHASE:       1<<7, // reserved for a named phase in effect.data.resetPhase
  FACE_DOWN:   1<<8, // source/target is turned face-down
});
function v4EnsureRuntimeEffects(gs){
  if(!gs) return [];
  if(!Array.isArray(gs.runtimeEffects)) gs.runtimeEffects=[];
  if(!Number.isFinite(Number(gs.runtimeEffectSeq))) gs.runtimeEffectSeq=0;
  return gs.runtimeEffects;
}
function v4RuntimeEffectByRid(rid){ return v4EnsureRuntimeEffects(gameState).find(e=>e&&e.rid===rid)||null; }
function v4RegisterRuntimeEffect(spec){
  const e=Object.assign({
    owner:null, controller:null, code:'', kind:'state', data:{}, resetMask:0,
    sourceUid:null, targetUid:null, sourceZone:null, targetZone:null,
  },spec||{});
  if(e.sourceUid==null && e.sourceCard){ e.sourceUid=ensureCardUid(gameState,e.sourceCard); const h=locateCard(e.sourceCard); if(h)e.sourceZone=h.zone; }
  if(e.targetUid==null && e.targetCard){ e.targetUid=ensureCardUid(gameState,e.targetCard); const h=locateCard(e.targetCard); if(h)e.targetZone=h.zone; }
  delete e.sourceCard; delete e.targetCard;
  const before=Number(gameState.runtimeEffectSeq||0);
  act({type:'V4_EFFECT_REGISTER',effect:e});
  return v4EnsureRuntimeEffects(gameState).find(x=>x.rid>before)||null;
}
function v4RemoveRuntimeEffect(rid){ if(v4RuntimeEffectByRid(rid)) act({type:'V4_EFFECT_REMOVE',rid}); }
function v4EffectCardLocation(uid){ return uid==null?null:findCardByUid(uid); }
function v4WasFieldZone(zone){ return ['mz','sz','field'].includes(zone); }
function v4EffectLeftRegisteredField(e, which){
  const uid=which==='source'?e.sourceUid:e.targetUid, z=which==='source'?e.sourceZone:e.targetZone;
  if(uid==null || !v4WasFieldZone(z)) return false;
  const h=v4EffectCardLocation(uid);
  return !h || !v4WasFieldZone(h.zone);
}
function v4EffectReachedGrave(e){
  for(const uid of [e.sourceUid,e.targetUid]){ const h=v4EffectCardLocation(uid); if(h&&h.zone==='grave') return true; }
  return false;
}
function v4ExpireRuntimeEffects(predicate, reason){
  const arr=v4EnsureRuntimeEffects(gameState), before=arr.length;
  gameState.runtimeEffects=arr.filter(e=>!(e&&predicate(e)));
  const n=before-gameState.runtimeEffects.length;
  if(n && reason && typeof logIt==='function') logIt(gameState,`v4 RESET：${reason}（${n}効果終了）`);
  return n;
}
function v4ResetRuntimeEffects(eventName, info){
  const inf=info||{};
  if(eventName==='endPhase') return v4ExpireRuntimeEffects(e=>!!(e.resetMask&RESET.END),'End Phase');
  if(eventName==='turnChange'){
    const ending=inf.endingPlayer;
    return v4ExpireRuntimeEffects(e=>{
      const m=Number(e.resetMask||0), c=e.controller;
      return !!(m&RESET.TURN_SET) || (!!(m&RESET.SELF_TURN) && c===ending) || (!!(m&RESET.OPPO_TURN) && c!=null && c!==ending);
    },'turn change');
  }
  if(eventName==='phase') return v4ExpireRuntimeEffects(e=>!!(e.resetMask&RESET.PHASE) && e.data&&e.data.resetPhase===inf.phase,`phase ${inf.phase||''}`);
  return 0;
}

/* Capture only the information that cannot be reconstructed after applyAction. */
function v4CaptureBeforeAction(gs,a){
  if(!gs||!a) return null;
  const p=a.player!=null?a.player:gs.activePlayer, P=gs.players[p];
  let zone=null,index=null;
  if(a.type==='MOVE'){ zone=a.from; index=a.fromIndex; }
  else if(['FX_TO_GRAVE','FX_BOUNCE','FX_RETURN_DECK','FX_BANISH','FX_DESTROY_BANISH','FX_SELF_TO_GRAVE','FX_NEGATE','FX_SET_STATE','FX_CONTROL'].includes(a.type)){ zone=a.zone; index=a.index; }
  const c=(zone&&P)?zoneCard(P,zone,index):null;
  return {activePlayer:gs.activePlayer,phase:gs.phase,player:p,uid:c?ensureCardUid(gs,c):null,zone,face:c&&c.face,pos:c&&c.pos,name:c?cardName(c):null};
}
function v4OnActionApplied(gs,a,before){
  v4EnsureRuntimeEffects(gs);
  if(!a || a.type==='V4_EFFECT_REGISTER' || a.type==='V4_EFFECT_REMOVE') return;
  // Generic field-leave / to-GY expiry works for single moves, wipes and battle cleanup.
  v4ExpireRuntimeEffects(e=>{
    const m=Number(e.resetMask||0);
    if((m&RESET.LEAVE) && (v4EffectLeftRegisteredField(e,'source')||v4EffectLeftRegisteredField(e,'target'))) return true;
    if((m&RESET.TO_GRAVE) && v4EffectReachedGrave(e)) return true;
    if((m&RESET.DISABLE) && before&&before.uid!=null && e.sourceUid===before.uid && a.type==='FX_NEGATE') return true;
    if((m&RESET.FACE_DOWN) && a.type==='FX_SET_STATE' && a.face==='down' && before&&before.uid!=null && (e.sourceUid===before.uid||e.targetUid===before.uid)) return true;
    return false;
  },'state change');
  if(a.type==='PASS_TURN') v4ResetRuntimeEffects('turnChange',{endingPlayer:before?before.activePlayer:null});
  if(a.type==='SET_PHASE') v4ResetRuntimeEffects('phase',{phase:a.phase});
}

/* Runtime stat modifiers use the same calculation layers as existing continuous effects,
   but lifetime is handled by RESET instead of card.mods/until strings. */
function v4RegisterStatModifier(t, values, opts){
  const r=resolveTarget(t); if(!r) return null;
  const o=opts||{}, source=o.sourceCard||null;
  return v4RegisterRuntimeEffect({
    owner:o.owner!=null?o.owner:r.p, controller:o.controller!=null?o.controller:r.p,
    code:o.code||o.label||'v4StatModifier', kind:'statModifier', data:Object.assign({},values||{}),
    resetMask:o.resetMask==null?(RESET.LEAVE|RESET.END|RESET.FACE_DOWN):o.resetMask,
    sourceCard:source, targetCard:r.card,
  });
}
function v4RuntimeStatLayers(card){
  const layers={setBase:[],set:[],update:[],setFinal:[]}; if(!card) return layers;
  const uid=ensureCardUid(gameState,card);
  v4EnsureRuntimeEffects(gameState).forEach(e=>{
    if(!e||e.kind!=='statModifier'||e.targetUid!==uid) return;
    const r=Object.assign({},e.data||{}, {src:e.code||'v4'});
    if(r.setBaseAtk!=null||r.setBaseDef!=null) layers.setBase.push(r);
    if(r.setAtk!=null||r.setDef!=null) layers.set.push(r);
    if(r.atk!=null||r.def!=null) layers.update.push(r);
    if(r.setFinalAtk!=null||r.setFinalDef!=null) layers.setFinal.push(r);
  });
  return layers;
}
