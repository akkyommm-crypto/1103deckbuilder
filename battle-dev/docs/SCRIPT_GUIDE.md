# Card Script Guide

Card scripts must describe card-specific behavior. Do not mutate `gameState` directly when an API/action primitive exists.

Preferred stages:
1. condition / legality
2. cost
3. target / selection
4. operation / resolve
5. afterResolve

Shared mechanics such as Xyz detach, summon windows, chain resolution, battle timing and ownership rules belong in `engine/`.

When Claude or ChatGPT fixes a bug, include the reproduction state and affected card names in the test.


## v4 Unified Effect

新規カードは可能なら `defineUnifiedCardV4()` を使用します。

```js
defineUnifiedCardV4('カード名', [{
  key:'main',
  type:EFFECT_TYPE.ACTIVATE,
  range:LOCATION.HAND|LOCATION.SZONE,
  targetRange:LOCATION.MZONE,
  condition(ctx){ return true; },
  cost(ctx,done){ done(true); },
  target(ctx,done){ done([]); },
  operation(ctx){}
}], {type:'spell',priority:1});
```

重要: `cost` は対象選択より前、`target` は発動時、`operation` は解決時です。一時的な攻守変更は `v4RegisterStatModifier()` + `RESET.*` を優先してください。アーキタイプ判定は文字列検索ではなく `isSetCardV4()` を使用します。
