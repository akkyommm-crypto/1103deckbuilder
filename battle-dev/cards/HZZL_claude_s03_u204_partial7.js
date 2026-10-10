/* S03-U204: PARTIAL cards whose AUTO_DECK_TABLE entries (cards/40) were coarse — now their 2011 texts (shared pool / choice helpers:
   engine/1ZT deckTriggerPoolS03 — its canEffectSpecialSummonS03 check lets a 「「X」の効果でのみ特殊召喚できる」 monster through only for X —
   cards/HZZF poolSpecS03 / poolS03 / askPoolS03, cards/HZZJ defineDiscardSearchS03, engine/1ZZF destroyWithoutFieldS03).
   - release-cost recruiters: アタック・リフレクター・ユニット, ブルーメンブラット, 拘束解除, ドラゴニック・タクティクス, 六武ノ書, ジェムナイト・アレキサンド;
   - キングス・ナイト; 万華鏡－華麗なる分身－;
   - E・HERO キャプテン・ゴールド / ジェネラルデーモン: discard search + 「…が存在しない場合、このカードを破壊する」. */

/* ---- 「自分フィールド上の…を生け贄に捧げて（リリースして）発動する」 Spell / Trap recruiters ---- */
function defineReleaseRecruitS03(name, spec){
  poolSpecS03(name, Object.assign({action:'summon', pos:'faceUp'}, spec.pool));
  const cands = ctx=>API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card && spec.release.ok(x.card, x.db)});
  defineScript(name, {
    type:spec.kind||'spell', priority:spec.kind==='trap'?2:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(cands(ctx).length < spec.release.count){ ctx.reason = spec.release.why; return false; }
      if(!poolS03(name, ctx.player).length){ ctx.reason = '特殊召喚できるモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const n = spec.release.count;
      const finish = sel=>{
        const uids = sel.map(x=>ensureCardUid(gameState, x.card));
        uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, `${name}（リリース）`); });
        done(true);
      };
      if(n===1) API.selectCard(`${name}：リリースするモンスター`, cands(ctx), t=>finish([t]));
      else v380SelectExactly(`${name}：リリースするモンスター`, cands(ctx), n, finish);
    },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：特殊召喚するモンスター`); }
  });
}
/* アタック・リフレクター・ユニット: 自分フィールド上の「サイバー・ドラゴン」1体を生け贄に捧げて発動する。自分の手札・デッキから「サイバー・バリア・ドラゴン」1体を特殊召喚する。 */
defineReleaseRecruitS03('アタック・リフレクター・ユニット', {kind:'trap', pool:{from:['hand','deck'], filter:{name:'サイバー・バリア・ドラゴン'}},
  release:{count:1, ok:(c,d)=>d.n==='サイバー・ドラゴン' || (typeof sameCanonicalCardV4==='function' && sameCanonicalCardV4(d,{n:'サイバー・ドラゴン'})), why:'自分フィールドに「サイバー・ドラゴン」がいません'}});
/* ブルーメンブラット: 自分フィールド上の「E・HERO クノスペ」1体を生け贄に捧げて発動する。自分の手札またはデッキから「E・HERO ブルーメ」1体を特殊召喚する。 */
defineReleaseRecruitS03('ブルーメンブラット', {pool:{from:['hand','deck'], filter:{name:'E・HERO ブルーメ'}},
  release:{count:1, ok:(c,d)=>d.n==='E・HERO クノスペ', why:'自分フィールドに「E・HERO クノスペ」がいません'}});
/* 拘束解除: 自分フィールド上の「鉄の騎士 ギア・フリード」1体を生け贄に捧げる事で、自分の手札またはデッキから「剣聖－ネイキッド・ギア・フリード」1体を特殊召喚する。 */
defineReleaseRecruitS03('拘束解除', {pool:{from:['hand','deck'], filter:{name:'剣聖－ネイキッド・ギア・フリード'}},
  release:{count:1, ok:(c,d)=>d.n==='鉄の騎士 ギア・フリード', why:'自分フィールドに「鉄の騎士 ギア・フリード」がいません'}});
/* ドラゴニック・タクティクス: 自分フィールド上に存在するドラゴン族モンスター2体をリリースして発動する。自分のデッキからレベル8のドラゴン族モンスター1体を特殊召喚する。 */
defineReleaseRecruitS03('ドラゴニック・タクティクス', {pool:{filter:{ra:'ドラゴン', lv:8}},
  release:{count:2, ok:(c,d)=>c.face==='up' ? ((typeof currentRaceV17==='function'?currentRaceV17(c):d.ra)==='ドラゴン') : d.ra==='ドラゴン', why:'自分フィールドにドラゴン族モンスターが2体必要です'}});
/* 六武ノ書: 自分フィールド上に表側表示で存在する「六武衆」と名のついたモンスター2体をリリースして発動する。自分のデッキから「大将軍 紫炎」1体を特殊召喚する。 */
defineReleaseRecruitS03('六武ノ書', {pool:{filter:{name:'大将軍 紫炎'}},
  release:{count:2, ok:(c,d)=>c.face==='up' && v380IsSix(c), why:'自分フィールドに表側表示の「六武衆」が2体必要です'}});

/* ---- ジェムナイト・アレキサンド: このカードをリリースして発動できる。デッキから「ジェムナイト」と名のついた通常モンスター1体を特殊召喚する。 ---- */
poolSpecS03('ジェムナイト・アレキサンド', {action:'summon', pos:'faceUp', filter:{set:SETCODE.GEM_KNIGHT, normalOnly:true}});
defineScript('ジェムナイト・アレキサンド', {
  type:'monster', priority:1, timing:['mainPhase'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!poolS03('ジェムナイト・アレキサンド', ctx.player).length){ ctx.reason = 'デッキに「ジェムナイト」通常モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = findCardByUid(ctx.card.uid); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, 'ジェムナイト・アレキサンド（リリース）'); done(true); },
  resolve(ctx){ askPoolS03(ctx, 'ジェムナイト・アレキサンド', 'ジェムナイト・アレキサンド：特殊召喚する「ジェムナイト」通常モンスター'); },
  afterResolve(){}
});

/* ---- キングス・ナイト: 自分フィールド上に「クィーンズ・ナイト」が存在する場合にこのカードが召喚に成功した時、自分のデッキから「ジャックス・ナイト」1体を特殊召喚する
   事ができる。 ---- */
defineSummonRecruitS03('キングス・ナイト', {filter:{name:'ジャックス・ナイト'}, title:'キングス・ナイト：特殊召喚する「ジャックス・ナイト」'});
(function(){
  const sc = CARD_SCRIPTS['キングス・ナイト'], cond = sc.condition, pas = sc.passive.onNormalSummon;
  const queen = ctx=>API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && x.db.n==='クィーンズ・ナイト'}).length>0;
  sc.condition = function(ctx){ if(!queen(ctx)){ ctx.reason = '自分フィールドに「クィーンズ・ナイト」が必要です'; return false; } return cond.call(this, ctx); };
  sc.passive.onNormalSummon = function(ctx){ return pas(ctx) && queen(ctx); };
})();

/* ---- 万華鏡－華麗なる分身－: フィールド上に「ハーピィ・レディ」が存在する場合に発動できる。手札・デッキから「ハーピィ・レディ」または「ハーピィ・レディ三姉妹」1体を
   特殊召喚する。 ---- */
poolSpecS03('万華鏡－華麗なる分身－', {from:['hand','deck'], action:'summon', pos:'faceUp', filter:{names:['ハーピィ・レディ','ハーピィ・レディ三姉妹']}});
function kaleidoPoolS03(p){ return poolS03('万華鏡－華麗なる分身－', p); }
defineScript('万華鏡－華麗なる分身－', {
  type:'spell', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && deckTriggerNamedS03(x.db, x.card, 'ハーピィ・レディ')}).length){ ctx.reason = 'フィールドに「ハーピィ・レディ」が必要です'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = kaleidoPoolS03(ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'万華鏡：特殊召喚する「ハーピィ・レディ」／「ハーピィ・レディ三姉妹」', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'万華鏡－華麗なる分身－', action:'summon', pos:'faceUp'}}, meta:{scriptName:'万華鏡－華麗なる分身－'}});
  }
});

/* ---- E・HERO キャプテン・ゴールド / ジェネラルデーモン ---- */
defineDiscardSearchS03('E・HERO キャプテン・ゴールド', {filter:{name:'摩天楼 －スカイスクレイパー－', anyCard:true}});
CARD_SCRIPTS['E・HERO キャプテン・ゴールド'].destroyWithoutFieldS03 = '摩天楼 －スカイスクレイパー－';
defineDiscardSearchS03('ジェネラルデーモン', {filter:{name:'万魔殿－悪魔の巣窟－', anyCard:true}});
CARD_SCRIPTS['ジェネラルデーモン'].destroyWithoutFieldS03 = '万魔殿－悪魔の巣窟－';
