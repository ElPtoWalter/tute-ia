window.SalaCeroPokerAssets={
  customCards:true,
  customChips:true,
  customMarkers:true,
  customDealer:true,
  dealer:'assets/poker/anton-crupier.webp',
  dealerFallback:'assets/poker/anton-crupier-placeholder.svg',
  back:'assets/poker/card-back.svg',
  faceCardPath(card){
    if(!card||![11,12,13].includes(Number(card.rank))) return null;
    const rank = ({11:'J',12:'Q',13:'K'})[Number(card.rank)];
    const suit = card.suit;
    return `assets/poker/cards/${rank}-${suit}.webp`;
  },
  chipPath(value){
    const amount = Number(value)||0;
    if(amount>=500) return 'assets/poker/chips/chip-500.webp';
    if(amount>=100) return 'assets/poker/chips/chip-100.webp';
    if(amount>=50) return 'assets/poker/chips/chip-50.webp';
    if(amount>=25) return 'assets/poker/chips/chip-25.webp';
    if(amount>=10) return 'assets/poker/chips/chip-10.webp';
    if(amount>=5) return 'assets/poker/chips/chip-5.webp';
    return 'assets/poker/chips/chip-1.webp';
  },
  markerPath(type){
    const map={dealer:'assets/poker/markers/dealer.webp',sb:'assets/poker/markers/sb.webp',bb:'assets/poker/markers/bb.webp'};
    return map[type]||map.dealer;
  }
};
