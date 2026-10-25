/* S03-U475: v70SelectExactly の「選択結果がチェーンに載る際に複製として保存され、解決で元のカードが動かない」欠陥クラス（S03-U472 が TGX3－DX2 で発見）の全数調査と修正。
   仕組み（U472 の発見の一般化）:
     v70SelectExactly は選択結果を {card}（p / zone / index なし）で返す。チェーンに載る時 serializeChainSelectionV2 は p と zone を持つ値だけを
     カード参照（uid+ゾーン）に置き換えるので、{card} は「普通のオブジェクト」として再帰コピーされ、解決時には card の複製（元のカードではない）になる。
     resolveTarget({card:複製}) は同一性（locateCard / indexOf）で探すので見つからず、効果は何も動かさない（API.shuffle / API.draw のような対象に依らない部分だけが動く）。
     v380SelectExactly は選択結果 t（p / zone / index / card をそのまま持つ）を返すので、参照に直されて解決時に元のカードに戻る。
   cost フックで使う場合は選択結果をその場（同じコールバック内）で処理し、チェーンへは載らないので影響を受けない。
   調査した利用: target フック 18 枚（下の表）と cost フック 4 枚（魔法再生 / 魔法石の採掘 / ブラック・ブースト / ガスタの静寂 カーム）。
   各カードで: 実際の発動 → 選択 → チェーン → 解決 → 選んだ「実際のカード」(uid) が正しいゾーンへ動く → Replay。target フックのカードは Save/Load（2VM）も通す。 */
const fs=require('fs'),path=require('path');
const harness=require('./astra_harness');
const ROOT=path.resolve(__dirname,'..');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function locOf(c){const h=findCardByUid(c.uid);return h?(h.p+':'+h.zone):null;}
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',(allowEmpty||pkg.actions.length>0)&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
function jt(j0){return V41_ACTION_JOURNAL.slice(j0).map(e=>e.action.type+(/^PREP_TX/.test(e.action.type)&&e.action.reason?':'+e.action.reason:''));}
let STEPS=[],PREFER=[];
function driveC(opts){opts=opts||{};for(let i=0;i<800;i++){
  if(opts.stopAtChain&&gameState.chain.length&&!pc())return 'chain';
  if(pc()){const q=pc();
    STEPS.push({title:q.title,min:q.min,max:q.max,uids:q.candidates.map(c=>c.uid)});
    let j=-1;for(const u of PREFER){j=q.candidates.findIndex(c=>c.uid===u);if(j>=0)break;}
    __choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=1;gameState.firstPlayer=0;gameState.turn=6;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4750001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
const G=(a,i)=>a[i]||{uids:[],min:-1,max:-1,title:''};
function has(list,c){return list.indexOf(c.uid)>=0;}
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
/* P1 が発動する側（自分のターン）。P0 は相手。spec.mode: hand（手札の魔法）/ set（セットした罠）/ mz（場のモンスターの起動効果）/ summon（手札のモンスターを通常召喚して誘発） */
function build(spec){
  fresh();const P=gameState.players,x={};
  x.card=mk(spec.card,1,'up');x.hand=[];
  if(spec.extra)spec.extra(x,P);
  if(spec.mode==='set'){x.card.face='down';x.card.setTurn=gameState.turn-1;P[1].sz.push(x.card);x.szIdx=P[1].sz.length-1;}
  else if(spec.mode==='mz'){x.card.summonedTurn=3;P[1].mz.push(x.card);x.mzIdx=P[1].mz.length-1;}
  else{P[1].hand=x.hand.concat([x.card]);x.hidx=P[1].hand.length-1;}
  baselineA();x.D0=v41StateDigest(gameState);return x;}
function activate(x,spec){
  TOASTS.length=0;const j0=V41_ACTION_JOURNAL.length;let offered=true;
  if(spec.mode==='set'){offered=getLegalZoneActions(1,'sz',x.szIdx).map(a=>a.id).indexOf('activateSet')>=0;if(offered)duelActivateFromZone(1,'sz',x.szIdx,{});}
  else if(spec.mode==='mz'){offered=getLegalZoneActions(1,'mz',x.mzIdx).map(a=>a.id).some(i=>/^(effect|legacyEffect)$/.test(i));if(offered)duelActivateFromZone(1,'mz',x.mzIdx,{});}
  else if(spec.mode==='summon'){doNormalSummon(x.hidx,'atk');}
  else{offered=getLegalHandActions(1,x.hidx).map(a=>a.id).indexOf('activate')>=0;if(offered)duelActivateFromHand(x.hidx);}
  return {offered,j0,toast:TOASTS.slice(-1)[0]||null};}
function noAbort(res){return res.types.every(t=>!/PREP_TX_ABORT/.test(t))&&res.r.toast!=='選択できるカードが足りません';}
/* 発動→選択→（チェーンに載った時点の確認）→解決 を1枚分通す */
function runCard(spec){
  const x=build(spec);STEPS=[];PREFER=spec.prefer(x);
  const r=activate(x,spec);
  driveC({stopAtChain:true});
  const prep=STEPS.slice();
  const link=gameState.chain[0];
  const chosen=spec.chosen?spec.chosen(x):[];
  let live=null;
  if(link&&link.targets){const rt=deserializeChainSelectionV2(link.targets);live=rt.length===chosen.length&&chosen.every((c,i)=>!!(rt[i]&&rt[i].card===c));}
  const mid={chain:gameState.chain.length,linkTargets:link&&link.targets?link.targets.length:null,name:link&&link.name,live};
  driveC();
  const types=jt(r.j0);
  return {x,r,mid,types,steps:prep};}
`;

/* ---- カード別の仕様 ----
   kind: 'target'（target フック。チェーンに載る）/ 'cost'（cost フック。その場で処理される）
   prefer: 選ぶ順の uid（コスト → 対象の順）/ chosen: 対象として選ぶカード（チェーンリンクの targets と一致するはず）/ expect: 解決後の期待（[ラベル, 真偽]） */
const SPECS=String.raw`
const Z=zoneOf,L=locOf;
const W=n=>mk('ワイト',1);
const SPECS=[
/* ===== target フック: 18 枚 ===== */
{name:'グラディアル・リターン',kind:'target',card:'グラディアル・リターン',mode:'hand',nt:3,steps:3,
 extra:(x,P)=>{x.g=['剣闘獣アンダル','剣闘獣エクイテ','剣闘獣サムニテ','剣闘獣アレクサンデル'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid,x.g[2].uid],chosen:x=>[x.g[0],x.g[1],x.g[2]],
 expect:(x,P)=>[['the 3 chosen 剣闘獣 left the Graveyard (Deck / hand after the draw)',[0,1,2].every(i=>['deck','hand'].includes(Z(x.g[i])))],['the 4th 剣闘獣 and the noise stay in the Graveyard',Z(x.g[3])==='grave'&&Z(x.n[0])==='grave'],['Deck 12 + 3 − 1 drawn, 1 card drawn',P[1].deck.length===14&&P[1].hand.length===1],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'サルベージ',kind:'target',card:'サルベージ',mode:'hand',nt:2,steps:2,
 extra:(x,P)=>{x.g=['C・ドルフィーナ','N・アクア・ドルフィン','とろける赤き影'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen Water monsters were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd Water monster and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'バッテリーリサイクル',kind:'target',card:'バッテリーリサイクル',mode:'hand',nt:2,steps:2,
 extra:(x,P)=>{x.g=['D・マグネンU','RAI－MEI','でんきトカゲ'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen Thunder monsters were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd Thunder monster and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'急速充電器',kind:'target',card:'急速充電器',mode:'hand',nt:2,steps:2,
 extra:(x,P)=>{x.g=['電池メン－単三型','電池メン－単二型','電池メン－単四型'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen 電池メン were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd 電池メン and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'悪夢再び',kind:'target',card:'悪夢再び',mode:'hand',nt:2,steps:2,
 extra:(x,P)=>{x.g=['アンノウン・シンクロン','TG ワーウルフ','D－HERO ディパーテッドガイ'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen DARK DEF 0 monsters were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'闇の量産工場',kind:'target',card:'闇の量産工場',mode:'hand',nt:2,steps:2,
 extra:(x,P)=>{x.g=['13人目の埋葬者','2人3脚ゾンビ','B・プラント'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen Normal Monsters were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'スネーク・レイン',kind:'target',card:'スネーク・レイン',mode:'hand',nt:4,steps:5,
 extra:(x,P)=>{x.c=mk('クリッター',1);x.hand=[x.c];x.r=['C・スネーク','くちばしヘビ','エヴォルド・ウェストロ','エヴォルド・オドケリス','エーリアンモナイト'].map(n=>mk(n,1));P[1].deck=P[1].deck.concat(x.r);},
 prefer:x=>[x.c.uid,x.r[0].uid,x.r[1].uid,x.r[2].uid,x.r[3].uid],chosen:x=>[x.r[0],x.r[1],x.r[2],x.r[3]],
 expect:(x,P)=>[['the discard cost went to the Graveyard',Z(x.c)==='grave'],['the 4 chosen Reptiles were sent from the Deck to the Graveyard',[0,1,2,3].every(i=>Z(x.r[i])==='grave')],['the 5th Reptile stays in the Deck',Z(x.r[4])==='deck'],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.r.concat([x.c,x.card])},
{name:'希望の光',kind:'target',card:'希望の光',mode:'set',nt:2,steps:2,
 extra:(x,P)=>{x.g=['C・ピニー','D・キャメラン','D・スコープン'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen LIGHT monsters went back to the Deck',Z(x.g[0])==='deck'&&Z(x.g[1])==='deck'],['the 3rd and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['Deck 12 + 2',P[1].deck.length===14],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'暗黒よりの軍勢',kind:'target',card:'暗黒よりの軍勢',mode:'set',nt:2,steps:2,
 extra:(x,P)=>{x.g=['暗黒界の刺客 カーキ','暗黒界の導師 セルリ','暗黒界の斥候 スカー'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen 暗黒界 monsters were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'狡猾な落とし穴',kind:'target',card:'狡猾な落とし穴',mode:'set',nt:2,steps:2,
 extra:(x,P)=>{x.a=mon('はにわ',0);x.b=mon('E・HERO フェザーマン',0);x.own=mon('ジェネティック・ワーウルフ',1);P[0].mz=[x.a,x.b];P[1].mz=[x.own];},
 prefer:x=>[x.a.uid,x.b.uid],chosen:x=>[x.a,x.b],
 expect:(x,P)=>[['the 2 chosen monsters were destroyed (Graveyard)',Z(x.a)==='grave'&&Z(x.b)==='grave'],['the unchosen own monster is still on the field',Z(x.own)==='mz'],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>[x.a,x.b,x.own,x.card]},
{name:'転生の予言',kind:'target',card:'転生の予言',mode:'set',nt:2,steps:2,
 extra:(x,P)=>{x.a=mk('はにわ',0);x.a2=mk('ライオウ',0);x.b=mk('クリッター',1);x.b2=mk('E・HERO フェザーマン',1);P[0].grave=[x.a,x.a2];P[1].grave=[x.b,x.b2];},
 prefer:x=>[x.a.uid,x.b.uid],chosen:x=>[x.a,x.b],
 expect:(x,P)=>[['the chosen cards went back to their OWNERS\' Decks (P0 and P1)',L(x.a)==='0:deck'&&L(x.b)==='1:deck'],['the unchosen cards stay in their Graveyards',L(x.a2)==='0:grave'&&L(x.b2)==='1:grave'],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>[x.a,x.a2,x.b,x.b2,x.card]},
{name:'隠された魔導書',kind:'target',card:'隠された魔導書',mode:'set',nt:2,steps:2,
 extra:(x,P)=>{x.g=['サンダー・ボルト','ブラック・ホール','死者蘇生'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen Spells went back to the Deck',Z(x.g[0])==='deck'&&Z(x.g[1])==='deck'],['the 3rd Spell and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['Deck 12 + 2',P[1].deck.length===14],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'メタボ・シャーク',kind:'target',card:'メタボ・シャーク',mode:'summon',nt:2,steps:2,
 extra:(x,P)=>{x.g=['C・ドルフィーナ','キラー・ラブカ','シャーク・サッカー'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen Fish went back to the Deck',Z(x.g[0])==='deck'&&Z(x.g[1])==='deck'],['the 3rd Fish and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['Deck 12 + 2',P[1].deck.length===14],['the shark was Normal Summoned and is on the field',Z(x.card)==='mz']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'原初の種',kind:'target',card:'原初の種',mode:'hand',nt:2,steps:2,
 extra:(x,P)=>{x.f=mon('カオス・ソルジャー －開闢の使者－',1);P[1].mz=[x.f];x.g=[mk('ライオウ',1),mk('はにわ',1),mk('クリッター',1)];P[1].banish=x.g.slice();},
 prefer:x=>[x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen banished cards were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd banished card stays banished',Z(x.g[2])==='banish'],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat([x.f,x.card])},
{name:'ガトムズの緊急指令',kind:'target',card:'ガトムズの緊急指令',mode:'set',nt:2,steps:2,
 extra:(x,P)=>{x.f=mon('XX－セイバー フラムナイト',1);P[1].mz=[x.f];x.a=mk('XX－セイバー ガルセム',0);x.b=mk('XX－セイバー エマーズブレイド',1);x.c=mk('XX－セイバー レイジグラ',1);P[0].grave=[x.a];P[1].grave=[x.b,x.c];},
 prefer:x=>[x.a.uid,x.b.uid],chosen:x=>[x.a,x.b],
 expect:(x,P)=>[['both chosen X-Sabers (one from EACH Graveyard) were Special Summoned onto P1\'s field',L(x.a)==='1:mz'&&L(x.b)==='1:mz'],['the unchosen X-Saber stays in the Graveyard',L(x.c)==='1:grave'],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>[x.f,x.a,x.b,x.c,x.card]},
{name:'サイコ・チャージ',kind:'target',card:'サイコ・チャージ',mode:'set',nt:3,steps:3,
 extra:(x,P)=>{x.g=['カバリスト','クレボンス','サイコジャンパー','サイコ・コマンダー'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.g[0].uid,x.g[1].uid,x.g[2].uid],chosen:x=>[x.g[0],x.g[1],x.g[2]],
 expect:(x,P)=>[['the 3 chosen Psychics left the Graveyard (Deck / hand after the draw)',[0,1,2].every(i=>['deck','hand'].includes(Z(x.g[i])))],['the 4th Psychic and the noise stay in the Graveyard',Z(x.g[3])==='grave'&&Z(x.n[0])==='grave'],['Deck 12 + 3 − 2 drawn, 2 cards drawn',P[1].deck.length===13&&P[1].hand.length===2],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.card])},
{name:'儀水鏡の瞑想術',kind:'target',card:'儀水鏡の瞑想術',mode:'set',nt:2,steps:3,
 extra:(x,P)=>{x.rit=mk('イリュージョンの儀式',1);x.hand=[x.rit];P[1].hand=[x.rit];x.g=['イビリチュア・ガストクラーケ','イビリチュア・ソウルオーガ','シャドウ・リチュア'].map(n=>mk(n,1));x.n=[W()];P[1].grave=x.g.concat(x.n);},
 prefer:x=>[x.rit.uid,x.g[0].uid,x.g[1].uid],chosen:x=>[x.g[0],x.g[1]],
 expect:(x,P)=>[['the 2 chosen リチュア were added to the hand',Z(x.g[0])==='hand'&&Z(x.g[1])==='hand'],['the 3rd リチュア and the noise stay in the Graveyard',Z(x.g[2])==='grave'&&Z(x.n[0])==='grave'],['the revealed Ritual Spell is still in the hand',Z(x.rit)==='hand'],['the Trap is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat(x.n,[x.rit,x.card])},
{name:'ガスタの交信',kind:'target',card:'ガスタの交信',mode:'hand',nt:3,steps:3,
 extra:(x,P)=>{x.g=['ガスタの巫女 ウィンダ','ガスタの希望 カムイ','ガスタの神官 ムスト'].map(n=>mk(n,1));P[1].grave=x.g.slice();x.t=mon('はにわ',0);P[0].mz=[x.t];},
 prefer:x=>[x.g[0].uid,x.g[1].uid,x.t.uid],chosen:x=>[x.g[0],x.g[1],x.t],
 expect:(x,P)=>[['the 2 chosen ガスタ went back to the Deck',Z(x.g[0])==='deck'&&Z(x.g[1])==='deck'],['the 3rd ガスタ stays in the Graveyard',Z(x.g[2])==='grave'],['the chosen opponent card was destroyed',L(x.t)==='0:grave'],['Deck 12 + 2',P[1].deck.length===14],['the Spell is in the Graveyard',Z(x.card)==='grave']],
 track:x=>x.g.concat([x.t,x.card])},
/* ===== cost フック: 4 枚（選択結果はその場で処理される。チェーンには載らない = 影響を受けないはずの対照）===== */
{name:'魔法再生',kind:'cost',card:'魔法再生',mode:'hand',
 extra:(x,P)=>{x.cs=[mk('強欲な壺',1),mk('天使の施し',1)];x.hand=x.cs;x.g=[mk('死者蘇生',1)];P[1].grave=x.g.slice();},
 prefer:x=>[x.g[0].uid,x.cs[0].uid,x.cs[1].uid],track:x=>x.cs.concat(x.g,[x.card]),
 expect:(x,P)=>[['the 2 Spells chosen as the cost were sent to the Graveyard',Z(x.cs[0])==='grave'&&Z(x.cs[1])==='grave'],['the target Spell was added to the hand',Z(x.g[0])==='hand'],['the activating Spell is in the Graveyard',Z(x.card)==='grave']]},
{name:'魔法石の採掘',kind:'cost',card:'魔法石の採掘',mode:'hand',
 extra:(x,P)=>{x.cs=[mk('ライオウ',1),mk('クリッター',1)];x.hand=x.cs;x.g=[mk('死者蘇生',1)];P[1].grave=x.g.slice();},
 prefer:x=>[x.g[0].uid,x.cs[0].uid,x.cs[1].uid],track:x=>x.cs.concat(x.g,[x.card]),
 expect:(x,P)=>[['the 2 cards chosen as the cost were discarded',Z(x.cs[0])==='grave'&&Z(x.cs[1])==='grave'],['the target Spell was added to the hand',Z(x.g[0])==='hand'],['the activating Spell is in the Graveyard',Z(x.card)==='grave']]},
{name:'ブラック・ブースト',kind:'cost',card:'ブラック・ブースト',mode:'set',
 extra:(x,P)=>{x.bf=[mon('BF－そよ風のブリーズ',1),mon('BF－大旆のヴァーユ',1)];P[1].mz=x.bf.slice();},
 prefer:x=>[x.bf[0].uid,x.bf[1].uid],track:x=>x.bf.concat([x.card]),
 expect:(x,P)=>[['the 2 chosen BF Tuners were banished as the cost',Z(x.bf[0])==='banish'&&Z(x.bf[1])==='banish'],['2 cards were drawn (Deck 12 − 2)',P[1].deck.length===10&&P[1].hand.length===2],['the Trap is in the Graveyard',Z(x.card)==='grave']]},
{name:'ガスタの静寂 カーム',kind:'cost',card:'ガスタの静寂 カーム',mode:'mz',
 extra:(x,P)=>{x.g=['ガスタの巫女 ウィンダ','ガスタの希望 カムイ','ガスタの神官 ムスト'].map(n=>mk(n,1));P[1].grave=x.g.slice();},
 prefer:x=>[x.g[0].uid,x.g[1].uid],track:x=>x.g.concat([x.card]),
 expect:(x,P)=>[['the 2 chosen ガスタ were returned to the Deck as the cost (Deck / hand after the draw)',['deck','hand'].includes(Z(x.g[0]))&&['deck','hand'].includes(Z(x.g[1]))],['the 3rd ガスタ stays in the Graveyard',Z(x.g[2])==='grave'],['1 card drawn (Deck 12 + 2 − 1)',P[1].deck.length===13&&P[1].hand.length===1],['カーム is still on the field',Z(x.card)==='mz']]},
];
`;

/* cards/ の v70SelectExactly 呼び出しを、直前の最も近いフック（target / cost）で分類する（Node 側で読む）。 */
const SURVEY=(()=>{const files=fs.readdirSync(path.join(ROOT,'cards')).filter(f=>f.endsWith('.js'));const sites=[];
  for(const f of files){const lines=fs.readFileSync(path.join(ROOT,'cards',f),'utf8').split(/\r?\n/);
    lines.forEach((ln,i)=>{ if(/^function v70SelectExactly\(/.test(ln)) return;
      let from=0;for(;;){const k=ln.indexOf('v70SelectExactly(',from);if(k<0)break;from=k+1;
        const m=[...ln.slice(0,k).matchAll(/\b(target|cost|operation|condition|selectTargets)\(ctx,done\)\{|\b(operation|condition)\(ctx\)\{/g)];
        sites.push({f,line:i+1,hook:m.length?(m[m.length-1][1]||m[m.length-1][2]):'?'});}});}
  const byHook={};sites.forEach(s=>{byHook[s.hook]=(byHook[s.hook]||0)+1;});return {byHook,sites};})();

const first=harness('const SURVEY='+JSON.stringify(SURVEY)+';'+COMMON+SPECS+String.raw`
globalThis.__SAVES={};

/* ===== 0. 仕組み: 選択結果が {card} だけ（p / zone なし）だと、チェーンを通ると元のカードではなく複製になる。v70SelectExactly は S03-U475 以後 v380SelectExactly と同じ形を返す ===== */
{ fresh();const P=gameState.players;
  const a=mk('C・ドルフィーナ',1),b=mk('N・アクア・ドルフィン',1),c=mk('とろける赤き影',1);P[1].grave=[a,b,c];baselineA();
  const pool=()=>API.pileCards(1,'grave');
  let r70=null,r380=null;
  STEPS=[];PREFER=[a.uid,b.uid];
  v70SelectExactly('shape',pool(),2,sel=>{r70=sel;});driveC();
  v380SelectExactly('shape',pool(),2,sel=>{r380=sel;});driveC();
  const full=r=>!!r&&r.length===2&&r.every(e=>typeof e.zone==='string'&&e.p===1&&typeof e.index==='number'&&e.card)&&r[0].card===a&&r[1].card===b;
  ok('mechanism: v70SelectExactly returns the full selection entries (p, zone, index, card), the same shape as v380SelectExactly (it used to return bare {card} entries)',full(r70)&&full(r380),JSON.stringify({a:r70&&Object.keys(r70[0]),b:r380&&Object.keys(r380[0])}));
  const rt70=deserializeChainSelectionV2(serializeChainSelectionV2(r70)),rt380=deserializeChainSelectionV2(serializeChainSelectionV2(r380));
  ok('mechanism: through the chain (serialize → deserialize) the entries of both helpers come back as the LIVE cards on the board',rt70.every((e,i)=>e&&e.card===r70[i].card)&&rt380.every((e,i)=>e&&e.card===r380[i].card),'');
  ok('mechanism: resolveTarget finds the live card in its current zone from the round-trip of both helpers',[rt70,rt380].every(rt=>rt.every(e=>{const h=resolveTarget(e);return h&&h.card===e.card&&h.zone==='grave';})),'');
  /* 欠陥の仕組み（特性化）: 旧 v70SelectExactly の形 {card} は複製として保存され、resolveTarget は見つけられない */
  const bare=[{card:a},{card:b}],rtb=deserializeChainSelectionV2(serializeChainSelectionV2(bare));
  ok('mechanism (the defect, characterized): a bare {card} entry (p / zone missing) is stored as a COPY of the card, and resolveTarget cannot find the real card from it — an effect acting on it moves nothing',
    rtb.every((e,i)=>e.card&&e.card!==bare[i].card&&e.card.uid===bare[i].card.uid)&&rtb.every(e=>resolveTarget(e)===null)&&bare.every(e=>resolveTarget(e)&&resolveTarget(e).card===e.card),''); }

/* ===== 0b. 利用の全数: cards/ の v70SelectExactly 呼び出し（定義を除く）===== */
ok('survey: v70SelectExactly has 21 call sites in cards/ — 18 in target hooks (chain-carried: the defective case) and 3 in cost hooks (resolved in place; 4 cards because one site is shared by 魔法再生 / 魔法石の採掘)',SURVEY.byHook.target===18&&SURVEY.byHook.cost===3&&Object.keys(SURVEY.byHook).length===2,JSON.stringify(SURVEY.byHook));
ok('survey: this test drives every card of the survey table ('+SPECS.length+' cards: 18 target + 4 cost)',SPECS.filter(s=>s.kind==='target').length===18&&SPECS.filter(s=>s.kind==='cost').length===4,SPECS.length+'');

/* ===== 1. カード別: 発動 → 選択 → チェーン → 解決 → 選んだ実カードが動く → Replay ===== */
for(const spec of SPECS){
  const res=runCard(spec),x=res.x,S=res.steps,P=gameState.players;
  ok(spec.name+' ['+spec.kind+']: the activation is offered and no preparation is aborted',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok(spec.name+': '+(spec.kind==='target'?spec.steps+' selection steps (cost + targets) opened and each picked card was a candidate of its step':'the cost selection opened ('+(spec.prefer(x).length)+' picks)'),
    spec.kind==='target'?(S.length===spec.steps):(S.length>=1),JSON.stringify(S.map(s=>s.uids.length)));
  if(spec.kind==='target'){
    ok(spec.name+': the chain link holds '+spec.nt+' targets and they restore to the LIVE cards that were chosen (not copies)',res.mid.chain===1&&res.mid.linkTargets===spec.nt&&res.mid.live===true,JSON.stringify(res.mid));
  }
  const ex=spec.expect(x,P);
  ex.forEach(e=>ok(spec.name+' resolves: '+e[0],e[1]&&gameState.chain.length===0,JSON.stringify({chain:gameState.chain.length,deck:P[1].deck.length,hand:P[1].hand.length,zones:(spec.track?spec.track(x):[]).map(c=>locOf(c))})));
  audit(spec.name);
}

/* ===== 2. Save/Load（target フックの18枚）: チェーンに載った状態を保存 → 読込 → 解決 ===== */
for(const spec of SPECS.filter(s=>s.kind==='target')){
  const x=build(spec);STEPS=[];PREFER=spec.prefer(x);
  const r=activate(x,spec);driveC({stopAtChain:true});
  const raw=savedRaw(),dMid=v41StateDigest(gameState),linkT=gameState.chain[0]&&gameState.chain[0].targets?gameState.chain[0].targets.length:null;
  const tr=spec.track(x);driveC();
  const P1=gameState.players[1];
  globalThis.__SAVES[spec.name]=JSON.stringify({raw,dMid,linkT,tr:tr.map(c=>c.uid),after:tr.map(c=>locOf(c)),dFinal:v41StateDigest(gameState),deck:P1.deck.length,hand:P1.hand.length});
  ok('SAVE '+spec.name+': a state saved with the chain link on the stack was captured and the live game resolved',r.offered&&linkT===spec.nt&&gameState.chain.length===0,JSON.stringify({offered:r.offered,linkT}));
}
`);

const SAVES=first.__SAVES||{};
const NAMES=[]; // 第2 VM は SPECS から対象名を取る
harness('const SAVES='+JSON.stringify(SAVES)+';'+COMMON+SPECS+String.raw`
function loadRaw(raw){resetA();CHOICE_LEGACY_CB_V49.clear();localStorage.setItem(DUEL_SAVE_KEY,raw);TOASTS.length=0;return offerResumeDuel();}
for(const spec of SPECS.filter(s=>s.kind==='target')){
  const name=spec.name;
  if(!SAVES[name]){ok('SAVE/LOAD '+name+': VM1 save present',false,'missing');continue;}
  const o=JSON.parse(SAVES[name]);
  const resumed=loadRaw(o.raw);
  ok('SAVE/LOAD '+name+': the chain-link save resumes; the loaded state is the saved state (digest) with 1 link holding its '+spec.nt+' targets',
    resumed&&v41StateDigest(gameState)===o.dMid&&gameState.chain.length===1&&gameState.chain[0].targets&&gameState.chain[0].targets.length===o.linkT,JSON.stringify({resumed,chain:gameState.chain.length,eq:v41StateDigest(gameState)===o.dMid}));
  audit('SAVE/LOAD '+name+' (loaded state)',true);
  driveC();
  const after=o.tr.map(u=>locOf({uid:u})),P1=gameState.players[1];
  ok('SAVE/LOAD '+name+': passing priority after the load resolves to exactly the same result as the uninterrupted game (every tracked card by uid, Deck/hand counts)',
    JSON.stringify(after)===JSON.stringify(o.after)&&P1.deck.length===o.deck&&P1.hand.length===o.hand&&gameState.chain.length===0,JSON.stringify({after,want:o.after}));
  ok('SAVE/LOAD '+name+': the final state digest equals the uninterrupted game\'s',v41StateDigest(gameState)===o.dFinal,v41StateDigest(gameState)+' vs '+o.dFinal);
  audit('SAVE/LOAD '+name+' (after resolving the loaded chain)');
}
`);
