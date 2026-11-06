/* S03-U517: カイザーコロシアム, サモンリミッター, サモンチェーン（1103対象の未実装カード。carddata のテキスト）。

   カイザーコロシアム（永続魔法）①:自分フィールドにモンスターが存在する限り、相手はその数より多くなるように自身のフィールドにモンスターを出す事ができない。
   サモンリミッター（永続罠）    このカードがフィールド上に存在する限り、お互いのプレイヤーは1ターンに合計2回までしかモンスターを召喚・反転召喚・特殊召喚できない。
   サモンチェーン（速攻魔法）    ①:同一チェーン上で複数回同名カードの効果が発動していない場合、そのチェーン3以降に発動できる。このターン自分は通常召喚を3回まで行う事ができる。

   当時の裁定（この実装の根拠。推測ではない）
   - カイザーコロシアム
     WIKI-69B7A89DCDA8  効果適用前に召喚されたモンスターは影響を受けない。自分のモンスターの数が増えるか相手が0になるまで
                        相手はそれ以上召喚できない（相手の数が減った場合は自分の数までは召喚できる）→ 判定は「召喚しようとした時点の盤面」。
     WIKI-902B1F48CA44  （09/08/16）自分のモンスターをリリースして《ヴォルカニック・クイーン》を特殊召喚するのは可能
                        → リリースは召喚より前なので、召喚時点で自分の数が0になり制限が外れる。盤面を都度数えればそのまま一致する。
     WIKI-CEDCCC9F400F  コントロール奪取は「モンスターをフィールド上に出す」ではないので可能 → 召喚の判定だけに入れる。
     WIKI-E315E720E7DE  （09/05/01）数を超えないアドバンス召喚は可能。
     WIKI-A2F5B2F95F39  （10/08/12）《クロス・ソウル》で相手のモンスターだけをリリースしてアドバンス召喚はできない。
     WIKI-ABD803D48412  （11/04/11）このカードに召喚・特殊召喚を無効にする効果はない（止めるだけで、無効化ではない）。
     WIKI-05D8FDD9315F  （07/03/04）自分のモンスターが1体の時、相手は《スケープ・ゴート》を発動できない
     WIKI-3E01B205FCEA / WIKI-83BAECDD9B3A（09/05/28）3回目の召喚行為としての《死者蘇生》/《次元融合》は発動できない
                        → 「特殊召喚そのものを目的とする効果」の発動も止まる（globalSummonLockS03、engine/1ZZS）。
   - サモンリミッター
     WIKI-FA2EC0926915  （08/03/06）このカードの発動前に行った召喚・反転召喚・特殊召喚も数える → 数えるのは常に行う（engine/1ZZS）。
     WIKI-7E37568B7AAA  （08/07/22）お互いが特殊召喚するカードは、それぞれ1回ずつ → プレイヤーごとに数える。
     WIKI-4FD72A35ED9E  （08/08/20）2回目の特殊召喚が無効になった場合はもう一度特殊召喚できる → 成功した時だけ数える。
     WIKI-3E01B205FCEA  （09/05/28）2回終えた相手の3回目の《死者蘇生》は、チェーンして発動した場合も効果が適用されない。
     WIKI-1305B3CE1B4E  （09/08/30）強制の特殊召喚効果は「発動しますが、不発になります」→ 発動の可否ではなく召喚だけを止める側で処理する。
     WIKI-D8FEA13745E1 / WIKI-942ECAD162E6（11/05/30）《人造人間－サイコ・ショッカー》と共にある間はアドバンス召喚でき、
                        ショッカーがリリースされた後は同じターンもう召喚できない → 罠の効果が無効の間は適用しない（engine/1ZZS）。
     WIKI-3990B9280CC0  （11/06/11）同時に特殊召喚された2体を1回と数えるかは「調整中」→ 出来事1回につき1回として数える（その旨を記録する）。
   - サモンチェーン
     WIKI-BD81BAFC2896  （11/04/17）《サモンチェーン》と《二重召喚》の両方を発動しても通常召喚は最大3回。複数枚発動しても増えない
                        → 通常召喚の回数は「与えられた上限の最大値」（engine/00 normalGrantMaxS03）。

   未対応（この単位では直していない。測って確認した残り）
   - トークンの特殊召喚は TOKEN_CREATE が召喚制限を一切見ない（S03-U429 の設計）ので、どちらの制限もトークンを止めない。
     カイザーコロシアム: WIKI-CA7FC24FF02B（11/08/22）「冥府の使者カイエントークンは特殊召喚できません」、
     サモンリミッター: WIKI-04F14179580E（09/10/30）ローズ・トークンは特殊召喚されない。
   - 複数体を出す効果の「発動」の可否は、効果が何体出すかを知らないと決まらない（《スケープ・ゴート》4体、《異次元からの帰還》、
     《レスキューキャット》2体、剣闘獣の特殊召喚）。1体分の判定しか持たないので、カイザーコロシアムはこれらの発動を止めない。
   どちらも「カードの効果が何体出すか」というスクリプト側の情報が無いと直せないので、後続課題として docs に記録する。 */

/* 永続カードの「カードの発動」だけを持つ効果（発動時の効果は無い）。u422Act と同じ形で、罠は speed 2。 */
function u517Act(speed){
  return { key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:speed, events:['activate'],
    condition(ctx){ return u422Fresh(ctx); }, operation(){}, afterResolve(){} };
}

/* ---- カイザーコロシアム ---- */
/* 「自分フィールドにモンスターが存在する限り」「その数より多くなるように」なので、表裏を問わず
   モンスターゾーンの数を都度数える。相手の数が自分の数と同じなら、1体出すと超えるので出せない。 */
function u517ColosseumBlocksS03(i){
  if(i.p === i.srcPlayer) return false;
  const mine = (gameState.players[i.srcPlayer].mz || []).filter(c=>!!c).length;
  if(mine <= 0) return false;
  return (gameState.players[i.p].mz || []).filter(c=>!!c).length >= mine;
}
defineUnifiedCardV4('カイザーコロシアム', [u517Act(1)], {
  type:'spell', priority:1,
  summonLockS03:(i)=> u517ColosseumBlocksS03(i),
  globalSummonLockS03:(i)=> u517ColosseumBlocksS03({p:i.p, srcPlayer:i.srcPlayer})
});

/* ---- サモンリミッター ---- */
function u517LimiterBlocksS03(p){ return summonActsThisTurnS03(p) >= 2; }
defineUnifiedCardV4('サモンリミッター', [u517Act(2)], {
  type:'trap', priority:2,
  summonLockS03:(i)=> u517LimiterBlocksS03(i.p),
  globalSummonLockS03:(i)=> u517LimiterBlocksS03(i.p)
});

/* ---- サモンチェーン ---- */
/* 「そのチェーン3以降に発動できる」= このカードがチェーン3以降になる（既にチェーンが2つ以上ある）。
   「同一チェーン上で複数回同名カードの効果が発動していない場合」= チェーン上に同じ名前が2つ以上並んでいない。 */
function u517ChainHasDupNameS03(){
  const seen = Object.create(null);
  return (gameState.chain || []).some(l=>{
    const n = l && l.name; if(!n) return false;
    if(seen[n]) return true;
    seen[n] = 1; return false;
  });
}
defineScript('サモンチェーン', {
  /* 速攻魔法なので手札からもセットしたゾーンからも発動する。チェーン応答の候補に出すには
     activateFrom の宣言が必要（canActivateFromZone、engine/20）。 */
  type:'quick-play', priority:2, activateFrom:['hand','sz'],
  condition(ctx){
    if((gameState.chain || []).length < 2){ ctx.reason = 'チェーン3以降に発動します'; return false; }
    if(u517ChainHasDupNameS03()){ ctx.reason = '同一チェーン上で同名カードの効果が複数回発動しています'; return false; }
    return true;
  },
  resolve(ctx){
    /* 複数枚発動しても増えない（WIKI-BD81BAFC2896）。上限は最大値を取るので、同じ3を入れ直すだけ。 */
    API.setFlag(ctx.player, 'normalGrantS03', 3, true);
    API.log('サモンチェーン：このターン、通常召喚を3回まで行える');
  },
  afterResolve(){}
});

/* カイザーコロシアム / サモンリミッターは「カードの発動」に要求が無く、発動時の効果も無い（S03-U10 の分類と同じ扱い）。 */
declareCardActivationFreeV32(['カイザーコロシアム','サモンリミッター']);
