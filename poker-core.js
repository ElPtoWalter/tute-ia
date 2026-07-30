(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.PokerCore=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  const SUITS=['s','h','d','c'];
  const RANKS=[2,3,4,5,6,7,8,9,10,11,12,13,14];
  const CATEGORY_NAMES=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full','Póker','Escalera de color'];
  const RANK_LABEL={11:'J',12:'Q',13:'K',14:'A'};
  const SUIT_LABEL={s:'♠',h:'♥',d:'♦',c:'♣'};

  function createDeck(){
    const deck=[];
    for(const suit of SUITS) for(const rank of RANKS) deck.push({rank,suit,id:`${rank}${suit}`});
    return deck;
  }
  function shuffle(deck,random=Math.random){
    const copy=deck.map(card=>({...card}));
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  function combinations(items,size){
    const out=[];
    function walk(start,current){
      if(current.length===size){out.push(current.slice());return;}
      for(let i=start;i<=items.length-(size-current.length);i++){current.push(items[i]);walk(i+1,current);current.pop();}
    }
    walk(0,[]);return out;
  }
  function compareScores(a,b){
    const aa=a?.score||a,bb=b?.score||b;
    for(let i=0;i<Math.max(aa.length,bb.length);i++){const diff=(aa[i]||0)-(bb[i]||0);if(diff)return diff;}
    return 0;
  }
  function straightHigh(ranks){
    const unique=[...new Set(ranks)].sort((a,b)=>b-a);
    if(unique.includes(14)) unique.push(1);
    let run=1;
    for(let i=1;i<unique.length;i++){
      if(unique[i]===unique[i-1]-1){run++;if(run>=5)return unique[i-4];}
      else if(unique[i]!==unique[i-1]) run=1;
    }
    return 0;
  }
  function evaluate5(cards){
    if(!Array.isArray(cards)||cards.length!==5) throw new Error('evaluate5 requiere cinco cartas');
    const ranks=cards.map(c=>c.rank).sort((a,b)=>b-a);
    const counts=new Map();ranks.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
    const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
    const flush=cards.every(c=>c.suit===cards[0].suit);
    const highStraight=straightHigh(ranks);
    let score;
    if(flush&&highStraight) score=[8,highStraight];
    else if(groups[0][1]===4) score=[7,groups[0][0],groups.find(g=>g[1]===1)[0]];
    else if(groups[0][1]===3&&groups[1]?.[1]===2) score=[6,groups[0][0],groups[1][0]];
    else if(flush) score=[5,...ranks];
    else if(highStraight) score=[4,highStraight];
    else if(groups[0][1]===3) score=[3,groups[0][0],...groups.filter(g=>g[1]===1).map(g=>g[0]).sort((a,b)=>b-a)];
    else if(groups[0][1]===2&&groups[1]?.[1]===2){const pairs=[groups[0][0],groups[1][0]].sort((a,b)=>b-a);score=[2,...pairs,groups.find(g=>g[1]===1)[0]];}
    else if(groups[0][1]===2) score=[1,groups[0][0],...groups.filter(g=>g[1]===1).map(g=>g[0]).sort((a,b)=>b-a)];
    else score=[0,...ranks];
    return {score,category:score[0],name:CATEGORY_NAMES[score[0]],cards:cards.slice()};
  }
  function evaluate(cards){
    if(!Array.isArray(cards)||cards.length<5||cards.length>7) throw new Error('evaluate requiere entre cinco y siete cartas');
    let best=null;
    for(const combo of combinations(cards,5)){
      const current=evaluate5(combo);
      if(!best||compareScores(current,best)>0) best=current;
    }
    return best;
  }
  function buildSidePots(players){
    const contributors=players.filter(p=>(Number(p.totalBet)||0)>0);
    const levels=[...new Set(contributors.map(p=>Number(p.totalBet)||0))].sort((a,b)=>a-b);
    const pots=[];let previous=0;
    for(const level of levels){
      const involved=contributors.filter(p=>(Number(p.totalBet)||0)>=level);
      const amount=(level-previous)*involved.length;
      const eligible=involved.filter(p=>!p.folded).map(p=>p.seat);
      if(amount>0) pots.push({amount,eligible,involved:involved.map(p=>p.seat),level});
      previous=level;
    }
    return pots;
  }
  function settleShowdown(players,board,dealerSeat=0){
    const evaluations={};
    players.filter(p=>!p.folded&&p.hand?.length===2).forEach(p=>{evaluations[p.seat]=evaluate([...p.hand,...board]);});
    const payouts=Object.fromEntries(players.map(p=>[p.seat,0]));
    const pots=buildSidePots(players).map(pot=>{
      const eligible=pot.eligible.filter(seat=>evaluations[seat]);
      let winners=[];
      for(const seat of eligible){
        if(!winners.length) winners=[seat];
        else{const cmp=compareScores(evaluations[seat],evaluations[winners[0]]);if(cmp>0) winners=[seat];else if(cmp===0) winners.push(seat);}
      }
      if(!winners.length){
        const refundSeat=pot.involved?.[0];
        if(refundSeat!==undefined)payouts[refundSeat]+=pot.amount;
        return {...pot,winners:refundSeat===undefined?[]:[refundSeat],refund:true};
      }
      const share=Math.floor(pot.amount/winners.length);let remainder=pot.amount-share*winners.length;
      winners.forEach(seat=>payouts[seat]+=share);
      const ordered=players.map(p=>p.seat).sort((a,b)=>((a-dealerSeat-1+players.length)%players.length)-((b-dealerSeat-1+players.length)%players.length));
      for(const seat of ordered){if(remainder<=0)break;if(winners.includes(seat)){payouts[seat]+=1;remainder--;}}
      return {...pot,winners};
    });
    return {evaluations,payouts,pots};
  }
  function cardLabel(card){return `${RANK_LABEL[card.rank]||card.rank}${SUIT_LABEL[card.suit]||card.suit}`;}
  function preflopStrength(hand){
    if(!hand||hand.length!==2)return .25;
    const [a,b]=hand.slice().sort((x,y)=>y.rank-x.rank);
    let value=(a.rank+b.rank)/32;
    if(a.rank===b.rank) value=.48+a.rank/28;
    else{
      if(a.suit===b.suit)value+=.06;
      const gap=Math.abs(a.rank-b.rank);
      if(gap===1)value+=.07;else if(gap===2)value+=.035;else if(gap>=5)value-=.06;
      if(a.rank>=13)value+=.08;if(b.rank>=10)value+=.04;
    }
    return Math.max(.08,Math.min(.96,value));
  }
  return {SUITS,RANKS,CATEGORY_NAMES,RANK_LABEL,SUIT_LABEL,createDeck,shuffle,combinations,compareScores,evaluate5,evaluate,buildSidePots,settleShowdown,cardLabel,preflopStrength};
});
