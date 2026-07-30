window.SalaCeroPokerAssets={
  customCards:false,
  customChips:false,
  customMarkers:false,
  customDealer:false,
  dealer:'assets/poker/anton-crupier.webp',
  dealerFallback:'assets/poker/anton-crupier-placeholder.svg',
  back:'assets/poker/card-back.webp',
  backFallback:'assets/poker/card-back.svg',
  cardPath(card){
    const ranks={14:'A',13:'K',12:'Q',11:'J'};
    const suits={h:'corazones',d:'diamantes',c:'treboles',s:'picas'};
    return `assets/poker/cards/${ranks[card.rank]||card.rank}-${suits[card.suit]}.webp`;
  }
};
