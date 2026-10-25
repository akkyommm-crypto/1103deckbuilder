/* S03-U472: 複数のカードを対象にする効果 × メタルシルバー・アーマー（裁定の一般的な回答文に基づく Codex の採用解釈）。
   裁定の出典: wiki-rulings.js WIKI-32A7C5F81B06（《メタルシルバー・アーマー》, answerDate 2009-06-18, backupDate 2011-05-28）
     Q「自分がこのカードと装備モンスターをコントロールしているとき、相手は《ゴッドバードアタック》など複数のカードを対象にするカードでモンスターを対象に発動することができますか？」
     A「複数のカードを対象にする効果の場合、発動を制限することはできません。よって発動することができます。（09/06/18）」
   対照: WIKI-6B27D6D86996（同ページ・同日）「相手は墓地のモンスター１体を対象にする効果を発動できますか？ → いいえ、発動できません。」
   採用した解釈（裁定の一般的な回答文に基づく Codex の採用解釈。回答は「複数のカードを対象にする効果」と述べ、対象の場所を限っていないので墓地を対象にする複数対象にも当てる）: アーマーの対象制限は、複数のカードを対象にする効果には掛からない。装備モンスター以外も対象に選べる。
   設計: 効果が対象にするカードの枚数を、スクリプトの宣言 targetCount で示す（engine/1ZZR の effectInfo.targetCount / targetsMultiple）。
     - 現在の選択の min / max や、1枚ずつ開く選択の回数から推測しない。コストで選ぶカード（ゴッドバードアタックのリリース）は数えない。
     - 唯一の消費者は メタルシルバー・アーマー の immuneToTarget / immuneToTargetOffField（targetCount>=2 の時だけ制限を掛けない）。他の対象耐性は変えない。
   Cards named: 貪欲な壺, 諸刃の活人剣術, 毒蛇の供物, TGX3－DX2, ゴッドバードアタック (TESTED 対象: 実際の発動→対象選択→解決→Replay を通す);
     対照 強制脱出装置, 因果切断, ホルスのしもべ, オベリスクの巨神兵, メタルシルバー・アーマー。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function mon(name,p,face,pos){const c=mk(name,p,face||'up',pos||'atk');c.summonedTurn=3;return c;}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function locOf(c){const h=findCardByUid(c.uid);return h?(h.p+':'+h.zone):null;}
function audit(label,allowEmpty){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest and the final state',(allowEmpty||pkg.actions.length>0)&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,240));}
function jt(j0){return V41_ACTION_JOURNAL.slice(j0).map(e=>e.action.type+(/^PREP_TX/.test(e.action.type)&&e.action.reason?':'+e.action.reason:''));}
const ARM='メタルシルバー・アーマー';
/* 選択を記録しながら進める。PREFER の順に、候補にある最初の uid を選ぶ。各選択の時点の effectInfo（宣言）と、選択の形（min/max）を残す */
let STEPS=[],PREFER=[];
function driveC(opts){opts=opts||{};for(let i=0;i<800;i++){
  if(opts.stopAtChain&&gameState.chain.length&&!pc())return 'chain';
  if(pc()){const q=pc();const info=targetEffectSourceS03(1);
    STEPS.push({title:q.title,min:q.min,max:q.max,uids:q.candidates.map(c=>c.uid),tc:info.targetCount,tm:info.targetsMultiple,prep:ACTIVATION_PREP_S03&&ACTIVATION_PREP_S03.name});
    let j=-1;for(const u of PREFER){j=q.candidates.findIndex(c=>c.uid===u);if(j>=0)break;}
    __choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=1;gameState.firstPlayer=0;gameState.turn=6;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4720001;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
/* 盤面: P0 = メタルシルバー・アーマー（サイバー・ドラゴンに装備）のコントローラー。P1 = 効果を発動する側（アーマーの「相手」）。
   P0 のモンスターはサイバー・ドラゴン（装備モンスター）・ライオウ・ワイト。armor:false で装備なしの対照。 */
function build(spec){
  fresh();const P=gameState.players,x={};
  x.host=mon('サイバー・ドラゴン',0);x.oth=mon('ライオウ',0);x.third=mon('ワイト',0,'up','def');
  P[0].mz=[x.host,x.oth,x.third];
  if(spec.armor!==false){x.armor=mk(ARM,0,'up');P[0].sz=[x.armor];}
  x.beast=mon('ジェネティック・ワーウルフ',1);P[1].mz=[x.beast];
  if(spec.extra)spec.extra(x,P);
  x.card=mk(spec.card,1,'up');
  if(spec.set){x.card.face='down';x.card.setTurn=gameState.turn-1;P[1].sz.push(x.card);x.szIdx=P[1].sz.length-1;x.set=true;}
  else{P[1].hand=(spec.hand?spec.hand():[]).concat([x.card]);x.hidx=P[1].hand.length-1;}
  baselineA();
  if(x.armor)API.equipSpell(locateCardAnyV4(x.armor),locateCardAnyV4(x.host),'S03-U472 fixture');
  x.D0=v41StateDigest(gameState);return x;}
function activate(x){
  TOASTS.length=0;const j0=V41_ACTION_JOURNAL.length;
  const ids=x.set?getLegalZoneActions(1,'sz',x.szIdx).map(a=>a.id):getLegalHandActions(1,x.hidx).map(a=>a.id);
  const offered=ids.indexOf(x.set?'activateSet':'activate')>=0;
  if(offered){ if(x.set)duelActivateFromZone(1,'sz',x.szIdx,{});else duelActivateFromHand(x.hidx); }
  return {offered,j0,toast:TOASTS.slice(-1)[0]||null};}
/* 古いエンジン（この単位の変更なし）では選択が開かず steps が空になる。例外で止まらず各アサーションが FAIL として数えられるよう、添字参照は包みを通す（negative control 用） */
const G=(a,i)=>a[i]||{uids:[],tc:undefined,tm:undefined,min:-1,max:-1,title:''};
function has(list,c){return list.indexOf(c.uid)>=0;}
function savedRaw(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
/* 発動→選択→（チェーンに載った時点の確認）→解決 を1枚分通す。picks は選ぶ順の uid。 */
function runCard(spec,label){
  const x=build(spec);STEPS=[];PREFER=spec.picks(x);
  const r=activate(x);
  const st=driveC({stopAtChain:true});
  const prep=STEPS.slice();   /* チェーンに載るまでの選択（コスト・対象）。解決後に開く別の選択（トリガー等）は含めない */
  const link=gameState.chain[0];
  const mid={chain:gameState.chain.length,tx:gameState.prepTxS03,linkTargets:link&&link.targets?link.targets.length:null,name:link&&link.name,zone:zoneOf(x.card)};
  driveC();
  const types=jt(r.j0);
  return {x,r,st,mid,types,steps:prep};}
function noAbort(res){return res.types.every(t=>!/PREP_TX_ABORT/.test(t))&&res.r.toast!=='選択できるカードが足りません';}
`;

const first=harness(COMMON+String.raw`
globalThis.__SAVES={};

/* ===== 0. 宣言の面（engine/1ZZR）: effectInfo.targetCount / targetsMultiple ===== */
{ const info=n=>targetEffectSourceS03(1,{name:n});
  const expect=[['貪欲な壺',5],['諸刃の活人剣術',2],['毒蛇の供物',3],['TGX3－DX2',3],['ゴッドバードアタック',2]];
  for(const [n,c] of expect){
    ok('declaration: '+n+' declares targetCount '+c+' and surfaces it on the normalized effectInfo (targetsMultiple true)',CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].targetCount===c&&info(n).targetCount===c&&info(n).targetsMultiple===true,JSON.stringify({sc:CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].targetCount,info:info(n).targetCount}));}
  ok('declaration: 強制脱出装置 (1 monster, many candidates) declares nothing — null / not multiple',CARD_SCRIPTS['強制脱出装置'].targetCount===undefined&&info('強制脱出装置').targetCount===null&&info('強制脱出装置').targetsMultiple===false,'');
  ok('declaration: デュアルスパーク / 因果切断 (cost choice + 1 target) declare nothing — a cost is not an effect target',info('デュアルスパーク').targetCount===null&&info('因果切断').targetCount===null,'');
  ok('declaration: an unknown / missing name gives null; an explicit effectInfo.targetCount is honoured; non-positive / non-integer values are ignored',
    targetEffectSourceS03(1,{name:'存在しないカード'}).targetCount===null&&targetEffectSourceS03(1,{name:'強制脱出装置',targetCount:2}).targetCount===2&&targetEffectSourceS03(1,{name:'貪欲な壺',targetCount:0}).targetCount===5&&targetEffectSourceS03(1,{targetCount:1.5}).targetCount===null,'');
  /* 宣言しているスクリプトは丁度この5枚 */
  const decl=Object.keys(CARD_SCRIPTS).filter(n=>CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].targetCount!=null).sort();
  ok('declaration: exactly the five multi-target cards declare targetCount (no other script does)',JSON.stringify(decl)===JSON.stringify(expect.map(e=>e[0]).sort()),JSON.stringify(decl));
  /* 唯一の消費者はアーマー: 対象耐性フックの本文が宣言を読むのはメタルシルバー・アーマーだけ */
  const readers=Object.keys(CARD_SCRIPTS).filter(n=>{const c=CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].continuous;if(!c)return false;
    return [c.immuneToTarget,c.immuneToTargetOffField].some(f=>typeof f==='function'&&/targetCount|targetsMultiple|d2ArmorExemptMultiTarget/.test(String(f)));});
  ok('consumer: the only immunity hook that reads the declaration is メタルシルバー・アーマー (every other target immunity is untouched)',JSON.stringify(readers)===JSON.stringify([ARM]),JSON.stringify(readers)); }

/* ===== 1-5. 複数対象の5枚: 実際の発動 → 対象選択 → チェーン → 解決 → Replay =====
   アーマーの下で（P1 が発動、P0 がアーマーのコントローラー）、保護されているモンスターを含めて選べて、正しく解決する。 */
function sixGrave(p){return ['ライオウ','クリッター','ワイト','はにわ','E・HERO フェザーマン','六武衆のご隠居'].map(n=>mk(n,p));}

/* ---- 1. 貪欲な壺（墓地のモンスター5体）---- */
{ const spec={card:'貪欲な壺',extra:(x,P)=>{x.g=sixGrave(1);P[1].grave=x.g.slice();},picks:x=>[x.g[0].uid,x.g[1].uid,x.g[2].uid,x.g[3].uid,x.g[4].uid]};
  const res=runCard(spec),x=res.x,S=res.steps,P1=gameState.players[1];
  ok('貪欲な壺 under the Armor: the activation is offered and no preparation is aborted (the stuck state of U470/U471 is gone)',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok('貪欲な壺: the target choice opens one card at a time — 5 choices, each min 1 / max 1 (the UI shape does not decide the classification)',S.length===5&&S.every(s=>s.min===1&&s.max===1),JSON.stringify(S.map(s=>[s.min,s.max])));
  ok('貪欲な壺: at EVERY step the effect declares 5 targets (targetCount 5, targetsMultiple) while the live choice is for 1 card',S.every(s=>s.tc===5&&s.tm===true&&s.prep==='貪欲な壺'),JSON.stringify(S.map(s=>[s.tc,s.tm])));
  ok('貪欲な壺: the Armor-protected Graveyard monsters are all offered — step 1 lists all six, then 5,4,3,2',JSON.stringify(S.map(s=>s.uids.length))==='[6,5,4,3,2]'&&x.g.every(c=>has(G(S,0).uids,c)),JSON.stringify(S.map(s=>s.uids.length)));
  ok('貪欲な壺: the chain link holds the 5 targets before resolution',res.mid.chain===1&&res.mid.linkTargets===5&&res.mid.tx===undefined,JSON.stringify(res.mid));
  ok('貪欲な壺 resolves: the 5 chosen monsters went back to the Deck (12 + 5 − 2 drawn), 2 cards drawn, the 6th stays in the Graveyard, the Spell is in the Graveyard',
    x.g.slice(0,5).every(c=>zoneOf(c)==='deck')&&zoneOf(x.g[5])==='grave'&&P1.deck.length===15&&P1.hand.length===2&&zoneOf(x.card)==='grave'&&gameState.chain.length===0,JSON.stringify({deck:P1.deck.length,hand:P1.hand.length,card:zoneOf(x.card)}));
  audit('貪欲な壺');
  /* 対照: アーマー無しでも同じ候補の形・同じ結果（例外が通常の発動を変えていない） */
  const c=runCard(Object.assign({},spec,{armor:false}));
  ok('貪欲な壺 control (no Armor): identical selection shape and result',JSON.stringify(c.steps.map(s=>s.uids.length))===JSON.stringify(S.map(s=>s.uids.length))&&c.x.g.slice(0,5).every(q=>zoneOf(q)==='deck')&&gameState.players[1].deck.length===15,''); }

/* ---- 2. 諸刃の活人剣術（墓地の「六武衆」2体）---- */
{ const spec={card:'諸刃の活人剣術',set:true,extra:(x,P)=>{x.g=['六武衆のご隠居','六武衆の影武者','六武衆－ヤリザ'].map(n=>mk(n,1));P[1].grave=x.g.slice();},picks:x=>[x.g[0].uid,x.g[1].uid]};
  const res=runCard(spec),x=res.x,S=res.steps;
  ok('諸刃の活人剣術 under the Armor: offered, no preparation aborted',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok('諸刃の活人剣術: two choices of min 1 / max 1, targetCount 2 declared at both, protected Graveyard 六武衆 offered (3 then 2)',S.length===2&&S.every(s=>s.min===1&&s.max===1&&s.tc===2&&s.tm===true)&&JSON.stringify(S.map(s=>s.uids.length))==='[3,2]'&&x.g.every(c=>has(G(S,0).uids,c)),JSON.stringify(S.map(s=>[s.tc,s.uids.length])));
  ok('諸刃の活人剣術: the chain link holds the 2 targets',res.mid.chain===1&&res.mid.linkTargets===2&&res.mid.zone==='sz',JSON.stringify(res.mid));
  const h0=findCardByUid(x.g[0].uid),h1=findCardByUid(x.g[1].uid);
  ok('諸刃の活人剣術 resolves: both chosen 六武衆 are Special Summoned in Attack Position, the third stays in the Graveyard, the Trap is in the Graveyard',
    h0&&h1&&h0.zone==='mz'&&h1.zone==='mz'&&h0.card.pos==='atk'&&h1.card.pos==='atk'&&zoneOf(x.g[2])==='grave'&&zoneOf(x.card)==='grave',JSON.stringify({a:h0&&h0.zone,b:h1&&h1.zone,c:zoneOf(x.g[2]),t:zoneOf(x.card)}));
  const rs=(gameState.reserved||gameState.reserveEffects||gameState.reserves||[]);
  ok('諸刃の活人剣術 resolves: the End Phase destruction + damage reservation was registered for the two monsters',JSON.stringify(gameState).indexOf('諸刃の活人剣術：エンド破壊')>=0,'');
  audit('諸刃の活人剣術'); }

/* ---- 3. 毒蛇の供物（自分の爬虫類族1体＋相手フィールドのカード2枚 = 対象3）---- */
{ const spec={card:'毒蛇の供物',set:true,extra:(x,P)=>{x.rep=mon('くちばしヘビ',1);P[1].mz.push(x.rep);},picks:x=>[x.rep.uid,x.oth.uid,x.third.uid]};
  const res=runCard(spec),x=res.x,S=res.steps;
  ok('毒蛇の供物 under the Armor: offered, no preparation aborted',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok('毒蛇の供物: three choices of min 1 / max 1 with targetCount 3 declared at each (own Reptile + 2 opponent cards; no cost)',S.length===3&&S.every(s=>s.min===1&&s.max===1&&s.tc===3&&s.tm===true),JSON.stringify(S.map(s=>[s.tc,s.min,s.max])));
  ok('毒蛇の供物: the own Reptile (itself protected by the Armor) is offered; the opponent cards offered include the protected ライオウ and ワイト',has(G(S,0).uids,x.rep)&&has(G(S,1).uids,x.oth)&&has(G(S,1).uids,x.third)&&has(G(S,1).uids,x.host),JSON.stringify(S.map(s=>s.uids.length)));
  ok('毒蛇の供物: the chain link holds the 3 targets',res.mid.chain===1&&res.mid.linkTargets===3,JSON.stringify(res.mid));
  ok('毒蛇の供物 resolves: the Reptile, ライオウ and ワイト are destroyed; サイバー・ドラゴン and the Armor stay; the Trap is in the Graveyard',
    zoneOf(x.rep)==='grave'&&zoneOf(x.oth)==='grave'&&zoneOf(x.third)==='grave'&&zoneOf(x.host)==='mz'&&zoneOf(x.armor)==='sz'&&zoneOf(x.card)==='grave',JSON.stringify({rep:zoneOf(x.rep),oth:zoneOf(x.oth),third:zoneOf(x.third),host:zoneOf(x.host),armor:zoneOf(x.armor)}));
  audit('毒蛇の供物'); }

/* ---- 4. TGX3－DX2（墓地の「TG」3体）---- */
{ const spec={card:'TGX3－DX2',set:true,extra:(x,P)=>{x.tg=['TG ストライカー','TG ワーウルフ','TG ラッシュ・ライノ'].map(n=>mk(n,1));x.noise=[mk('ライオウ',1),mk('ワイト',1)];P[1].grave=x.noise.concat(x.tg);},picks:x=>x.tg.map(c=>c.uid)};
  const res=runCard(spec),x=res.x,S=res.steps,P1=gameState.players[1];
  ok('TGX3－DX2 under the Armor: offered, no preparation aborted',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok('TGX3－DX2: three choices of min 1 / max 1 with targetCount 3 declared at each, the protected Graveyard 「TG」 offered (3,2,1)',S.length===3&&S.every(s=>s.min===1&&s.max===1&&s.tc===3&&s.tm===true)&&JSON.stringify(S.map(s=>s.uids.length))==='[3,2,1]',JSON.stringify(S.map(s=>[s.tc,s.uids.length])));
  ok('TGX3－DX2: the chain link holds the 3 targets',res.mid.chain===1&&res.mid.linkTargets===3,JSON.stringify(res.mid));
  ok('TGX3－DX2 resolves: the 3 「TG」 left the Graveyard for the Deck (shuffled, so a drawn one may be in hand; 12 + 3 − 2 drawn), 2 cards drawn, the two non-TG stay in the Graveyard, the Trap is in the Graveyard',
    x.tg.every(c=>zoneOf(c)==='deck'||zoneOf(c)==='hand')&&x.noise.every(c=>zoneOf(c)==='grave')&&P1.deck.length===13&&P1.hand.length===2&&zoneOf(x.card)==='grave',JSON.stringify({deck:P1.deck.length,hand:P1.hand.length}));
  audit('TGX3－DX2'); }

/* ---- 5. ゴッドバードアタック（鳥獣族1体のリリース = コスト、フィールドのカード2枚 = 対象）---- */
{ const spec={card:'ゴッドバードアタック',set:true,extra:(x,P)=>{x.bird=mon('BF－そよ風のブリーズ',1);P[1].mz.push(x.bird);},picks:x=>[x.bird.uid,x.oth.uid,x.third.uid]};
  const res=runCard(spec),x=res.x,S=res.steps;
  ok('ゴッドバードアタック under the Armor (the card the ruling names): offered, no preparation aborted',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok('ゴッドバードアタック: three selections happen (cost: the Bird; targets: 1/2, 2/2) but the effect declares targetCount 2 at ALL of them — the Release is a cost and is not counted',
    S.length===3&&S.every(s=>s.tc===2&&s.tm===true&&s.min===1&&s.max===1),JSON.stringify(S.map(s=>[s.title.slice(0,18),s.tc])));
  ok('ゴッドバードアタック: the cost step offers the own Bird (the Armor does not bar a Release cost), the target steps offer the protected ライオウ / ワイト and the own Beast',
    G(S,0).uids.length===1&&has(G(S,0).uids,x.bird)&&has(G(S,1).uids,x.oth)&&has(G(S,1).uids,x.third)&&has(G(S,1).uids,x.beast)&&has(G(S,1).uids,x.host)&&!has(G(S,1).uids,x.bird),JSON.stringify(S.map(s=>s.uids.length)));
  ok('ゴッドバードアタック: the chain link holds exactly 2 targets (not 3) and the Bird is already in the Graveyard (cost paid at activation)',res.mid.chain===1&&res.mid.linkTargets===2&&zoneOf(x.bird)==='grave',JSON.stringify(res.mid));
  ok('ゴッドバードアタック resolves: ライオウ and ワイト are destroyed, サイバー・ドラゴン / the Armor stay, the Trap is in the Graveyard',
    zoneOf(x.oth)==='grave'&&zoneOf(x.third)==='grave'&&zoneOf(x.host)==='mz'&&zoneOf(x.armor)==='sz'&&zoneOf(x.card)==='grave'&&gameState.chain.length===0,JSON.stringify({oth:zoneOf(x.oth),third:zoneOf(x.third),host:zoneOf(x.host)}));
  audit('ゴッドバードアタック'); }

/* ===== 6. 対照: 単体対象は制限されたまま（候補が多くても「1体を対象にする効果」は複数対象ではない）===== */
{ const spec={card:'強制脱出装置',set:true,picks:x=>[x.oth.uid,x.host.uid]};   /* 保護されたライオウを選ぼうとしても候補に無く、装備モンスターだけが選べる */
  const res=runCard(spec),x=res.x,S=res.steps;
  ok('CONTROL 強制脱出装置 under the Armor: offered (the equipped monster is a legal target) and not aborted',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok('CONTROL 強制脱出装置: ONE choice (min 1 / max 1), NO declared target count (null, not multiple)',S.length===1&&G(S,0).min===1&&G(S,0).max===1&&G(S,0).tc===null&&G(S,0).tm===false,JSON.stringify(S.map(s=>[s.tc,s.tm,s.min,s.max])));
  ok('CONTROL 強制脱出装置: only the equipped monster is offered — every other monster on the field (protected by the Armor, both sides) is NOT a candidate',
    JSON.stringify(G(S,0).uids)===JSON.stringify([x.host.uid])&&!has(G(S,0).uids,x.oth)&&!has(G(S,0).uids,x.third)&&!has(G(S,0).uids,x.beast),JSON.stringify(G(S,0).uids));
  ok('CONTROL 強制脱出装置 resolves on the equipped monster: it returns to its owner\'s hand',locOf(x.host)==='0:hand'&&locOf(x.oth)==='0:mz'&&zoneOf(x.card)==='grave',JSON.stringify({host:locOf(x.host),oth:locOf(x.oth)}));
  audit('CONTROL 強制脱出装置');
  const c=runCard(Object.assign({},spec,{armor:false}));
  ok('CONTROL 強制脱出装置 without the Armor: all four field monsters are candidates (the restriction above is the Armor\'s)',c.steps.length===1&&G(c.steps,0).uids.length===4&&G(c.steps,0).tc===null,JSON.stringify(c.steps.map(s=>s.uids.length))); }
/* 単体の墓地対象: 上から断られる（U468/U470 の挙動が変わっていない）*/
{ const x=build({card:'リビングデッドの呼び声',set:true,extra:(x,P)=>{P[1].grave=[mk('ライオウ',1),mk('クリッター',1)];}});
  const r=activate(x);
  ok('CONTROL リビングデッドの呼び声 (1 Graveyard monster) under the Armor is still refused up front — not offered, nothing changes',!r.offered&&v41StateDigest(gameState)===x.D0,JSON.stringify(r)); }

/* ===== 7. コストは数えない: 因果切断（手札を捨てる = コスト、対象 = 1体）===== */
{ const spec={card:'因果切断',set:true,extra:(x,P)=>{x.disc=mk('ワイト',1);P[1].hand=[x.disc];},picks:x=>[x.disc.uid,x.oth.uid,x.host.uid]};
  const res=runCard(spec),x=res.x,S=res.steps;
  ok('COST 因果切断 (1 discard cost + 1 target = 2 selections): offered, not aborted',res.r.offered&&noAbort(res),JSON.stringify({r:res.r,types:res.types.slice(0,6)}));
  ok('COST 因果切断: two selections (cost, target) but NO declared target count at either — counting the cost would have made it 2 and wrongly exempt',S.length===2&&S.every(s=>s.tc===null&&s.tm===false),JSON.stringify(S.map(s=>[s.title.slice(0,10),s.tc])));
  ok('COST 因果切断: the target step still offers only the equipped monster (the Armor restriction applies — a cost choice does not turn a single target into a multi-target)',JSON.stringify(G(S,1).uids)===JSON.stringify([x.host.uid]),JSON.stringify(G(S,1).uids));
  audit('COST 因果切断');
  /* 反事実: コストも数えた宣言（targetCount 2）にすると、保護された ライオウ・ワイト まで候補に入ってしまう = 数え方で分類が変わる */
  const sc=CARD_SCRIPTS['因果切断'];sc.targetCount=2;
  const bad=runCard(spec);delete sc.targetCount;
  ok('COST counterfactual (script patched to count the cost: targetCount 2): the same activation now offers the protected ライオウ / ワイト — the classification depends on what is counted, so the cost must stay out',
    bad.steps.length===2&&G(bad.steps,1).uids.length===3&&has(G(bad.steps,1).uids,bad.x.oth)&&has(G(bad.steps,1).uids,bad.x.third),JSON.stringify(bad.steps.map(s=>s.uids.length)));
  const back=runCard(spec);
  ok('COST counterfactual reverted: the declaration is gone again and the activation is restricted as before',CARD_SCRIPTS['因果切断'].targetCount===undefined&&JSON.stringify(G(back.steps,1).uids)===JSON.stringify([back.x.host.uid]),''); }

/* ===== 8. 選択の形から推測しない: 同じ形の選択でも、宣言が分類を決める ===== */
/* (a) 貪欲な壺から宣言だけを外す: 選択は同じ「1枚ずつ5回」の形のまま、単体扱いに戻り、保護された墓地は候補に出ない → 候補不足で発動前へ戻る（U471） */
{ const sc=CARD_SCRIPTS['貪欲な壺'],keep=sc.targetCount;delete sc.targetCount;
  const x=build({card:'貪欲な壺',extra:(x,P)=>{x.g=sixGrave(1);P[1].grave=x.g.slice();}});STEPS=[];PREFER=[];
  const r=activate(x);sc.targetCount=keep;
  ok('SHAPE 貪欲な壺 with the declaration removed: the Armor restriction applies again — the target step fails for lack of candidates (original symptom) and the preparation is undone by the U471 transaction',
    r.offered&&r.toast==='選択できるカードが足りません'&&!pc()&&gameState.chain.length===0&&v41StateDigest(gameState)===x.D0&&jt(r.j0).slice(-1)[0]==='PREP_TX_ABORT_S03:insufficient',JSON.stringify({r,types:jt(r.j0)}));
  ok('SHAPE the declaration is restored (targetCount 5) — nothing else was changed',CARD_SCRIPTS['貪欲な壺'].targetCount===5,''); }
/* (b) 直接の選択: 同じ min2/max2 の「複数ピック」の形でも、宣言が無いスクリプトでは制限され、宣言があるスクリプトでは掛からない */
{ const x=build({card:'強制脱出装置',set:true});
  const cands=()=>API.fieldCards({zone:'mz'});
  const spec=()=>({kind:'card',title:'S03-U472 live multi-pick',candidates:cands(),min:2,max:2,targeting:true,targetingPlayer:1,player:1,cancelable:true,legacy:{onPick(){}}});
  ACTIVATION_PREP_S03={player:1,uid:x.card.uid,name:'強制脱出装置',afterSeq:0};
  const un=requestChoiceV49(spec());const unPend=pc();
  ok('SHAPE live multi-pick (min 2 / max 2, targeting) from an UNDECLARED single-target script is NOT exempt — only the equipped monster survives the filter, so the 2-card choice is refused',!un&&!unPend,JSON.stringify({un,pend:!!unPend}));
  ACTIVATION_PREP_S03={player:1,uid:x.card.uid,name:'貪欲な壺',afterSeq:0};
  const de=requestChoiceV49(spec());const dePend=pc();
  ok('SHAPE the same live multi-pick shape from a DECLARED script (貪欲な壺) is exempt — all four field monsters are candidates',!!dePend&&dePend.candidates.length===4&&dePend.min===2&&dePend.max===2,JSON.stringify({de,n:dePend&&dePend.candidates.length}));
  if(pc())cancelChoiceV49();ACTIVATION_PREP_S03=null; }

/* ===== 9. 他の対象耐性は変えない（アーマーの例外はアーマーだけ）=====
   ゴッドバードアタックをアーマー有り／無しで。ホルスのしもべが守る「ホルスの黒炎竜」と、自身のテキストで対象にならない「オベリスクの巨神兵」は、複数対象でも候補に出ない。 */
for(const armor of [true,false]){
  const spec={card:'ゴッドバードアタック',set:true,armor,extra:(x,P)=>{x.bird=mon('BF－そよ風のブリーズ',1);P[1].mz.push(x.bird);
      x.servant=mon('ホルスのしもべ',0);x.horus=mon('ホルスの黒炎竜 LV4',0);x.obe=mon('オベリスクの巨神兵',0);P[0].mz=[x.host,x.oth,x.servant,x.horus,x.obe];},
    picks:x=>[x.bird.uid,x.horus.uid,x.obe.uid,x.oth.uid,x.servant.uid]};
  const res=runCard(spec),x=res.x,S=res.steps,L=armor?'with the Armor':'without the Armor';
  ok('OTHER IMMUNITY ('+L+'): ゴッドバードアタック is offered and resolves; 2 targets are declared (the multi-target classification itself is unchanged)',res.r.offered&&noAbort(res)&&S.length===3&&S.every(s=>s.tc===2)&&res.mid.linkTargets===2,JSON.stringify({s:S.length,mid:res.mid}));
  ok('OTHER IMMUNITY ('+L+'): ホルスの黒炎竜 (ホルスのしもべ) and オベリスクの巨神兵 (own text) are NOT candidates at either target step',S.slice(1).every(s=>!has(s.uids,x.horus)&&!has(s.uids,x.obe)),JSON.stringify(S.map(s=>s.uids.length)));
  ok('OTHER IMMUNITY ('+L+'): the unprotected cards ARE candidates (ライオウ'+(armor?' — protected by the Armor but exempt here':'')+', ホルスのしもべ, サイバー・ドラゴン)',has(G(S,1).uids,x.oth)&&has(G(S,1).uids,x.servant)&&has(G(S,1).uids,x.host),'');
  ok('OTHER IMMUNITY ('+L+'): the two picks that were possible resolve; ホルスの黒炎竜 and オベリスクの巨神兵 are untouched',zoneOf(x.oth)==='grave'&&zoneOf(x.servant)==='grave'&&zoneOf(x.horus)==='mz'&&zoneOf(x.obe)==='mz',JSON.stringify({oth:zoneOf(x.oth),servant:zoneOf(x.servant),horus:zoneOf(x.horus),obe:zoneOf(x.obe)}));
  audit('OTHER IMMUNITY ('+L+')');
}
/* 毒蛇の供物 × ホルス／オベリスク: アーマーが複数対象を許しても、他の耐性のカードは相手フィールドの候補に出ない */
{ const x=build({card:'毒蛇の供物',set:true,extra:(x,P)=>{x.rep=mon('くちばしヘビ',1);P[1].mz.push(x.rep);
      x.horus=mon('ホルスの黒炎竜 LV4',0);x.obe=mon('オベリスクの巨神兵',0);x.servant=mon('ホルスのしもべ',0);P[0].mz=[x.host,x.horus,x.obe,x.servant];}});
  STEPS=[];PREFER=[x.rep.uid];const r=activate(x);driveC({stopAtChain:true});
  const fo=STEPS.length>1?G(STEPS,1).uids:[];
  ok('OTHER IMMUNITY 毒蛇の供物: the opponent-card step excludes ホルスの黒炎竜 and オベリスクの巨神兵 even though the Armor exempts multi-target effects (the unprotected cards are offered)',
    r.offered&&STEPS.length>=2&&!has(fo,x.horus)&&!has(fo,x.obe)&&has(fo,x.host)&&has(fo,x.servant),JSON.stringify({steps:STEPS.map(s=>s.uids.length),fo})); }

/* 他の耐性だけで対象が足りない時は、アーマーの例外があっても制限されたまま: 発動が始まってから候補不足になり、U471 の準備トランザクションが発動前へ戻す
   （U470 が記録した「リリースした鳥獣族が戻らない」停止状態の、アーマー以外の耐性による版）。P0 のフィールドはオベリスク2体だけ。 */
{ const x=build({card:'ゴッドバードアタック',set:true,armor:false,extra:(x,P)=>{x.bird=mon('BF－そよ風のブリーズ',1);P[1].mz=[x.bird];
      x.obeA=mon('オベリスクの巨神兵',0);x.obeB=mon('オベリスクの巨神兵',0);P[0].mz=[x.host,x.obeA,x.obeB];}});
  /* アーマーは無し。対象候補は サイバー・ドラゴン + オベリスク2体 のうち前者だけ（オベリスクは自身のテキストで対象にならない）→ 2枚に足りない */
  STEPS=[];PREFER=[x.bird.uid];const r=activate(x);driveC({stopAtChain:true});
  const t=jt(r.j0);
  ok('OTHER IMMUNITY (Obelisk only) ゴッドバードアタック: the raw condition passes, the Release cost is paid, the target step then lacks candidates (only サイバー・ドラゴン is targetable)',r.offered&&STEPS.length===2&&G(STEPS,0).tc===2&&G(STEPS,1).uids.length===1,JSON.stringify(STEPS.map(s=>s.uids.length)));
  ok('OTHER IMMUNITY (Obelisk only) ゴッドバードアタック: the preparation is undone — the Bird is back on the field (the Release is refunded), the Trap is face-down, the state digest equals the pre-activation digest',
    !pc()&&gameState.chain.length===0&&zoneOf(x.bird)==='mz'&&v41StateDigest(gameState)===x.D0&&t[t.length-1]==='PREP_TX_ABORT_S03:insufficient',JSON.stringify({types:t.slice(-3),bird:zoneOf(x.bird)}));
  audit('OTHER IMMUNITY (Obelisk only)'); }

/* ===== 10. Save/Load: チェーンに載った状態（対象に保護されたカードを含む）を保存 → 読込 → 解決 =====
   チェーンリンクの targets は保存の中に入る。読込後に同じ結果になり、Replay も一致する。VM1 で解決まで通して結果を記録し、VM2 が保存から同じ結果を再現する。 */
const SLSPEC={
  '貪欲な壺':{card:'貪欲な壺',extra:(x,P)=>{x.g=sixGrave(1);P[1].grave=x.g.slice();},picks:x=>x.g.slice(0,5).map(c=>c.uid),track:x=>x.g.map(c=>c.uid).concat([x.card.uid])},
  '諸刃の活人剣術':{card:'諸刃の活人剣術',set:true,extra:(x,P)=>{x.g=['六武衆のご隠居','六武衆の影武者','六武衆－ヤリザ'].map(n=>mk(n,1));P[1].grave=x.g.slice();},picks:x=>[x.g[0].uid,x.g[1].uid],track:x=>x.g.map(c=>c.uid).concat([x.card.uid])},
  '毒蛇の供物':{card:'毒蛇の供物',set:true,extra:(x,P)=>{x.rep=mon('くちばしヘビ',1);P[1].mz.push(x.rep);},picks:x=>[x.rep.uid,x.oth.uid,x.third.uid],track:x=>[x.rep.uid,x.oth.uid,x.third.uid,x.host.uid,x.card.uid]},
  'TGX3－DX2':{card:'TGX3－DX2',set:true,extra:(x,P)=>{x.tg=['TG ストライカー','TG ワーウルフ','TG ラッシュ・ライノ'].map(n=>mk(n,1));x.noise=[mk('ライオウ',1),mk('ワイト',1)];P[1].grave=x.noise.concat(x.tg);},picks:x=>x.tg.map(c=>c.uid),track:x=>x.tg.concat(x.noise).map(c=>c.uid).concat([x.card.uid])},
  'ゴッドバードアタック':{card:'ゴッドバードアタック',set:true,extra:(x,P)=>{x.bird=mon('BF－そよ風のブリーズ',1);P[1].mz.push(x.bird);},picks:x=>[x.bird.uid,x.oth.uid,x.third.uid],track:x=>[x.bird.uid,x.oth.uid,x.third.uid,x.host.uid,x.card.uid]},
};
for(const name of Object.keys(SLSPEC)){
  const spec=SLSPEC[name],x=build(spec);STEPS=[];PREFER=spec.picks(x);
  const r=activate(x);driveC({stopAtChain:true});
  const raw=savedRaw(),dMid=v41StateDigest(gameState),linkT=gameState.chain[0]&&gameState.chain[0].targets?gameState.chain[0].targets.length:null;
  const tr=spec.track(x);driveC();
  const P1=gameState.players[1];
  globalThis.__SAVES[name]=JSON.stringify({raw,dMid,linkT,tr,after:tr.map(u=>locOf({uid:u})),dFinal:v41StateDigest(gameState),deck:P1.deck.length,hand:P1.hand.length});
  ok('SAVE '+name+': a state saved with the chain link on the stack (targets include Armor-protected cards) was captured and the live game resolved',r.offered&&linkT>=2&&gameState.chain.length===0,JSON.stringify({offered:r.offered,linkT}));
}

/* ===== 11. 全体の整合: 5枚が TESTED になる条件の要約（個別の assert は上）===== */
{ const names=Object.keys(SLSPEC);
  ok('five cards are each driven through activation → target selection → chain → resolution → Replay audit above ('+names.join(' / ')+')',names.length===5,''); }
`);

const SAVES=first.__SAVES||{};
const NAMES=['貪欲な壺','諸刃の活人剣術','毒蛇の供物','TGX3－DX2','ゴッドバードアタック'];
if(NAMES.some(n=>!SAVES[n])){console.log('FAIL Save/Load VM1 saves missing');process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+COMMON+String.raw`
function loadRaw(raw){resetA();CHOICE_LEGACY_CB_V49.clear();localStorage.setItem(DUEL_SAVE_KEY,raw);TOASTS.length=0;return offerResumeDuel();}
for(const name of ${JSON.stringify(NAMES)}){
  const o=JSON.parse(SAVES[name]);
  const resumed=loadRaw(o.raw);
  ok('SAVE/LOAD '+name+': the chain-link save resumes; the loaded state is the saved state (digest) with 1 link holding its targets and no stale preparation record',
    resumed&&v41StateDigest(gameState)===o.dMid&&gameState.chain.length===1&&gameState.prepTxS03===undefined&&gameState.chain[0].targets&&gameState.chain[0].targets.length===o.linkT,JSON.stringify({resumed,chain:gameState.chain.length,eq:v41StateDigest(gameState)===o.dMid}));
  audit('SAVE/LOAD '+name+' (loaded state)',true);
  driveC();
  const after=o.tr.map(u=>locOf({uid:u})),P1=gameState.players[1];
  ok('SAVE/LOAD '+name+': passing priority after the load resolves the effect to exactly the same result as the uninterrupted game (every tracked card, Deck/hand counts)',
    JSON.stringify(after)===JSON.stringify(o.after)&&P1.deck.length===o.deck&&P1.hand.length===o.hand&&gameState.chain.length===0,JSON.stringify({after,want:o.after}));
  ok('SAVE/LOAD '+name+': the final state digest equals the uninterrupted game\'s',v41StateDigest(gameState)===o.dFinal,v41StateDigest(gameState)+' vs '+o.dFinal);
  audit('SAVE/LOAD '+name+' (after resolving the loaded chain)');
}
`);
