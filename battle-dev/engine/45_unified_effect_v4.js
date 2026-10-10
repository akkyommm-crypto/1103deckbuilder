/* =========================================================================
   System v4.0 — Unified Effect API v1 (independent implementation)
   -------------------------------------------------------------------------
   New card effects can be declared as one object shape:
     type / range / targetRange / condition / cost / target / operation

   Existing CARD_SCRIPTS remain untouched. `legacyScriptToEffectsV4()` exposes
   them through the same read model, while `defineUnifiedCardV4()` bridges new
   effects into the current chain/processor engine. Migration can therefore be
   incremental instead of a risky all-at-once rewrite.
   ========================================================================= */
const EFFECT_TYPE = Object.freeze({
  SINGLE:'single', FIELD:'field', EQUIP:'equip', ACTIVATE:'activate',
  TRIGGER:'trigger', IGNITION:'ignition', QUICK:'quick', CONTINUOUS:'continuous',
});
const EFFECT_REGISTRY_V4 = Object.create(null);

function createEffectV4(def){
  const e=Object.assign({
    key:'main', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.ALL,
    targetRange:LOCATION.ALL, targetSide:'both', speed:1, events:null,
    condition:null, cost:null, target:null, operation:null, afterResolve:null,
    resetMask:0,
  },def||{});
  if(!e.key) e.key='main';
  if(!Number.isFinite(Number(e.range))) e.range=LOCATION.ALL;
  if(!Number.isFinite(Number(e.targetRange))) e.targetRange=LOCATION.ALL;
  /* S03-U114: X素材コストを宣言した効果（cost なし）には、同じ素材選択で払う cost を付ける
     （発動パイプラインは detachCostS03 を先に処理する。effect.cost を直接呼ぶ経路との整合用。freeze より前に付ける） */
  if(e.detachCostS03 && typeof e.cost!=='function'){
    const spec=e.detachCostS03;
    e.cost=function(ctx,done){
      const sp=(typeof spec==='function')?spec(ctx):spec;
      if(!sp||typeof runScriptDetachCostS03!=='function'){ done(false); return; }
      runScriptDetachCostS03(ctx,sp,ok=>done(ok!==false));
    };
  }
  return Object.freeze(e);
}
function registerEffectsV4(name,effects){
  const arr=[].concat(effects||[]).map(createEffectV4);
  const seen=new Set();
  arr.forEach(e=>{ if(seen.has(e.key)) throw new Error(`v4 effect key duplicate: ${name}/${e.key}`); seen.add(e.key); });
  EFFECT_REGISTRY_V4[name]=arr;
  return arr;
}
function nativeEffectsV4(name){ return EFFECT_REGISTRY_V4[name]||[]; }
function v4EffectEventOk(e,ctx){
  if(!e.events) return true;
  const events=[].concat(e.events);
  const raw=(ctx&&ctx.eventName)||'activate';
  const ev=raw==='legalCheck'?'activate':raw;
  return events.includes(ev);
}
function v4EffectRangeOk(e,ctx){
  if(!e.range || e.range===LOCATION.ALL) return true;
  const zone=(ctx&&ctx.logicalZone)||ctx.zone;
  return locationMatchesV4(zone,e.range);
}
function v4EffectConditionOk(e,ctx){
  if(!v4EffectEventOk(e,ctx)||!v4EffectRangeOk(e,ctx)) return false;
  if(typeof e.condition!=='function') return true;
  try{return e.condition(ctx)!==false;}catch(err){ctx.reason=ctx.reason||`v4 condition error: ${err.message||err}`;return false;}
}
function v4EffectByKey(name,key){ return nativeEffectsV4(name).find(e=>e.key===key)||null; }
function v4SelectEffectForContext(name,ctx){
  if(ctx&&ctx.v4EffectKey){ const locked=v4EffectByKey(name,ctx.v4EffectKey); if(locked) return locked; }
  const candidates=nativeEffectsV4(name).filter(e=>v4EffectEventOk(e,ctx)&&v4EffectRangeOk(e,ctx));
  for(const e of candidates){ if(v4EffectConditionOk(e,ctx)){ ctx.v4EffectKey=e.key; return e; } }
  return null;
}
function v4RunCost(e,ctx,done){
  /* S03-U114: X素材コストを宣言した効果（cost なし）は、cost 経由でも同じ素材選択で払う */
  if(e && typeof e.cost!=='function' && e.detachCostS03 && typeof runScriptDetachCostS03==='function'){
    const sp = (typeof e.detachCostS03==='function') ? e.detachCostS03(ctx) : e.detachCostS03;
    if(!sp){ done(false); return; }
    runScriptDetachCostS03(ctx, sp, ok=>done(ok!==false)); return;
  }
  if(!e||typeof e.cost!=='function'){done(true);return;}
  let called=false; const cb=v=>{if(called)return;called=true;done(v!==false);};
  let r; try{r=e.cost(ctx,cb);}catch(err){ctx.reason=`v4 cost error: ${err.message||err}`;cb(false);return;}
  if(called)return;
  if(r===false||r===true){cb(r);return;}
  if(e.cost.length<2) cb(true); // synchronous cost that only mutates state
}
function v4RunTarget(e,ctx,done){
  if(!e||typeof e.target!=='function'){done([]);return;}
  let called=false; const cb=v=>{if(called)return;called=true;done(Array.isArray(v)?v:[]);};
  let r; try{r=e.target(ctx,cb);}catch(err){ctx.reason=`v4 target error: ${err.message||err}`;cb([]);return;}
  if(called)return;
  if(Array.isArray(r)){cb(r);return;}
  if(e.target.length<2) cb([]);
}
function v4DefaultAfterResolve(ctx){
  if(!ctx||!ctx.card)return;
  const d=dbOf(ctx.card)||{};
  if(d.k==='m') return;
  if(['永続','フィールド','装備'].includes(d.sub)) return;
  selfToGrave(ctx);
}

/* Register a new v4-native card while preserving the legacy processor surface.
   v1 intentionally resolves one effect per event/range. Multiple same-window
   modes can be introduced later without changing the Effect object shape. */
function defineUnifiedCardV4(name,effects,legacyMeta){
  registerEffectsV4(name,effects);
  const meta=Object.assign({},legacyMeta||{});
  const def=Object.assign({},meta,{
    v4Unified:true,
    condition(ctx){
      const e=v4SelectEffectForContext(name,ctx);
      if(!e){ctx.reason=ctx.reason||'この場所・タイミングで発動できる効果がありません';return false;}
      return true;
    },
    cost(ctx,done){
      const e=v4SelectEffectForContext(name,ctx);
      if(!e){done(false);return;}
      v4RunCost(e,ctx,done);
    },
    selectTargets(ctx,done){
      const e=v4SelectEffectForContext(name,ctx);
      if(!e){done([]);return;}
      v4RunTarget(e,ctx,done);
    },
    resolve(ctx){
      const e=v4SelectEffectForContext(name,ctx);
      if(!e||typeof e.operation!=='function') return;
      e.operation(ctx);
    },
    afterResolve(ctx){
      const e=v4SelectEffectForContext(name,ctx);
      if(e&&typeof e.afterResolve==='function') e.afterResolve(ctx);
      else v4DefaultAfterResolve(ctx);
    },
  });
  /* S03-U234: in a DUEL a trigger reaches the SEGOC candidates only through passive[eventName] (collectHandlers, engine/40).
     A TRIGGER effect declared with events but without a matching passive (王立魔法図書館, ブレードラビット, スネークポット, …) never fired outside
     direct script calls. The missing passive entries are derived from the effects themselves: the event has a TRIGGER effect whose range and
     condition hold (the same test v4SelectEffectForContext makes when it is activated). Passives the script declares are kept as written. */
  {
    const pv=Object.assign({},def.passive||{});
    let added=false;
    nativeEffectsV4(name).forEach(e=>{
      if(e.type!==EFFECT_TYPE.TRIGGER || !e.events) return;
      [].concat(e.events).forEach(ev=>{
        if(!ev || ev==='activate' || pv[ev]) return;
        pv[ev]=function(ctx){
          const c=Object.assign({},ctx,{eventName:ev}); delete c.v4EffectKey;
          return nativeEffectsV4(name).some(x=>x.type===EFFECT_TYPE.TRIGGER && v4EffectConditionOk(x,c));
        };
        added=true;
      });
    });
    if(added) def.passive=pv;
  }
  // If no effect targets, don't force target-immunity filtering in the old API.
  if(meta.targets==null) def.targets=nativeEffectsV4(name).some(e=>typeof e.target==='function');
  return defineScript(name,def);
}

/* Read-only legacy adapter. It does not alter execution of the existing 299
   scripts; it only lets tooling/debug UI inspect old and new cards uniformly. */
function legacyScriptToEffectsV4(name,sc){
  if(!sc) return [];
  if(sc.v4Unified && nativeEffectsV4(name).length) return nativeEffectsV4(name);
  let type=EFFECT_TYPE.ACTIVATE;
  const ts=scriptTimings(sc);
  if(sc.continuous) type=EFFECT_TYPE.CONTINUOUS;
  else if(sc.quickEffect||sc.type==='counter'||(ts&&ts.includes('chain'))) type=EFFECT_TYPE.QUICK;
  else if(sc.passive && Object.keys(sc.passive).length) type=EFFECT_TYPE.TRIGGER;
  else if(sc.type==='monster'&&ts&&ts.includes('mainPhase')) type=EFFECT_TYPE.IGNITION;
  let range=LOCATION.ALL;
  if(Array.isArray(sc.activateFrom)&&sc.activateFrom.length){
    range=sc.activateFrom.reduce((m,z)=>m|locationOfZoneV4(z),0)||LOCATION.ALL;
  }
  return [createEffectV4({
    key:'legacy-main',type,range,speed:sc.priority||1,
    condition:sc.condition||null,cost:sc.cost||null,target:sc.selectTargets||null,
    operation:sc.resolve||null,legacy:true,
  })];
}
function effectsOfCardV4(name){
  const n=nativeEffectsV4(name); if(n.length)return n;
  return legacyScriptToEffectsV4(name,CARD_SCRIPTS[name]);
}

/* Target-side/range helper for new card scripts. */
function targetAllowedByEffectV4(effect,ctx,t){
  if(!effect||!t)return false;
  if(effect.targetSide==='self'&&t.p!==ctx.player)return false;
  if(effect.targetSide==='opponent'&&t.p===ctx.player)return false;
  return locationMatchesV4(t.zone,effect.targetRange||LOCATION.ALL);
}
