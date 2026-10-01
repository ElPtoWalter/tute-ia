/* Motor independiente: fichas virtuales, ruleta europea, sin DOM ni temporizadores. */
(() => {
  "use strict";
  const order = Object.freeze([0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]);
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const chips = Object.freeze([1,5,10,25,50,100,500]);
  const color = n => n === 0 ? "green" : reds.has(n) ? "red" : "black";
  const bets = {};
  function add(id, type, numbers, odds, label) {
    bets[id] = Object.freeze({ id, type, numbers: Object.freeze(numbers), odds, label });
  }
  for (let n = 0; n <= 36; n++) add(`straight:${n}`, "straight", [n], 35, `Pleno ${n}`);
  function inside(type, numbers, odds, title) {
    numbers.sort((a,b) => a-b);
    add(`${type}:${numbers.join(",")}`, type, numbers, odds, `${title} ${numbers.join(" · ")}`);
  }
  for (let n = 1; n <= 36; n++) {
    if (n % 3 !== 0) inside("split", [n,n+1], 17, "Caballo");
    if (n <= 33) inside("split", [n,n+3], 17, "Caballo");
    if (n % 3 === 1) {
      inside("street", [n,n+1,n+2], 11, "Calle");
      if (n <= 31) inside("six", [n,n+1,n+2,n+3,n+4,n+5], 5, "Seisena");
    }
    if (n <= 32 && n % 3 !== 0) inside("corner", [n,n+1,n+3,n+4], 8, "Cuadro");
  }
  [1,2,3].forEach(n => inside("split", [0,n], 17, "Caballo"));
  inside("street", [0,1,2], 11, "Trío");
  inside("street", [0,2,3], 11, "Trío");
  inside("corner", [0,1,2,3], 8, "Primeros cuatro");
  const range = (start,end) => Array.from({length:end-start+1}, (_,i) => start+i);
  add("red", "outside", range(1,36).filter(n => reds.has(n)), 1, "Rojo");
  add("black", "outside", range(1,36).filter(n => !reds.has(n)), 1, "Negro");
  add("even", "outside", range(1,36).filter(n => n%2===0), 1, "Par");
  add("odd", "outside", range(1,36).filter(n => n%2===1), 1, "Impar");
  add("low", "outside", range(1,18), 1, "1–18");
  add("high", "outside", range(19,36), 1, "19–36");
  for (let i=1;i<=3;i++) {
    add(`dozen:${i}`, "outside", range((i-1)*12+1,i*12), 2, `Docena ${i}`);
    add(`column:${i}`, "outside", range(1,36).filter(n => (n-1)%3===i-1), 2, `Columna ${i}`);
  }
  Object.freeze(bets);
  function randomNumber(source) {
    // 2^32 no es divisible por 37: descartar el extremo evita el sesgo módulo.
    const limit = 4294967296 - (4294967296 % 37);
    for (let attempts=0; attempts<1024; attempts++) {
      let value;
      if (source) value = source();
      else {
        try { value = globalThis.crypto.getRandomValues(new Uint32Array(1))[0]; }
        catch (_) { value = Math.floor(Math.random()*4294967296); }
      }
      if (!Number.isInteger(value) || value < 0 || value > 4294967295) throw new Error("Fuente aleatoria inválida");
      if (value < limit) return value % 37;
    }
    throw new Error("No se pudo obtener un resultado aleatorio");
  }
  const sum = wagers => Object.values(wagers).reduce((a,b) => a+b,0);
  const copy = value => JSON.parse(JSON.stringify(value));
  const validMoney = n => Number.isSafeInteger(n) && n>=0 && n<=1000000000;
  function validateWagers(wagers) {
    if (!wagers || Array.isArray(wagers) || typeof wagers !== "object") return false;
    return Object.entries(wagers).every(([id,amount]) => bets[id] && validMoney(amount) && amount>0) && validMoney(sum(wagers));
  }
  function payout(wagers, number) {
    if (!Number.isInteger(number) || number<0 || number>36 || !validateWagers(wagers)) throw new Error("Apuesta o resultado inválido");
    return Object.entries(wagers).reduce((total,[id,amount]) => total + (bets[id].numbers.includes(number) ? amount*(bets[id].odds+1) : 0), 0);
  }
  class Session {
    constructor({ balance=500, names=["Jugador"], rng=randomNumber }={}) {
      if (!Number.isInteger(balance) || balance<1 || balance>100000 || !Array.isArray(names) || names.length<1 || names.length>6) throw new Error("Sesión inválida");
      this.rng=rng;
      this.players=names.map((name,i) => ({name:String(name||`Jugador ${i+1}`).trim().slice(0,18),balance,bets:{}}));
      this.current=0; this.state="BETTING"; this.ready=names.map(()=>false);
      this.previous=names.map(()=>({})); this.undo=names.map(()=>[]);
      this.history=[]; this.pending=null; this.lastRound=null;
    }
    get player() { return this.players[this.current]; }
    get stake() { return sum(this.player.bets); }
    editable() { if (this.state==="SPINNING") throw new Error("La bola está girando"); }
    checkpoint() {
      this.undo[this.current].push(copy({balance:this.player.balance,bets:this.player.bets}));
      if (this.undo[this.current].length>100) this.undo[this.current].shift();
      this.state="BETTING"; this.ready[this.current]=false;
    }
    place(id,amount) {
      this.editable();
      if (!bets[id] || !chips.includes(amount)) throw new Error("Ficha o apuesta inválida");
      if (this.player.balance<amount) throw new Error("Saldo insuficiente");
      this.checkpoint(); this.player.balance-=amount; this.player.bets[id]=(this.player.bets[id]||0)+amount;
    }
    clear() { this.editable(); this.checkpoint(); this.player.balance+=this.stake; this.player.bets={}; }
    repeat() {
      this.editable(); const previous=this.previous[this.current]; const cost=sum(previous);
      if (!cost) throw new Error("Todavía no hay apuestas anteriores");
      if (cost>this.player.balance+this.stake) throw new Error("Saldo insuficiente para repetir");
      this.checkpoint(); this.player.balance+=this.stake-cost; this.player.bets=copy(previous);
    }
    double() {
      this.editable(); const cost=this.stake;
      if (!cost) throw new Error("Coloca primero una apuesta");
      if (cost>this.player.balance) throw new Error("Saldo insuficiente para doblar");
      this.checkpoint(); this.player.balance-=cost;
      Object.keys(this.player.bets).forEach(id => this.player.bets[id]*=2);
    }
    undoLast() {
      this.editable(); const previous=this.undo[this.current].pop();
      if (!previous) throw new Error("No hay ninguna acción que deshacer");
      Object.assign(this.player,previous); this.state="BETTING"; this.ready[this.current]=false;
    }
    select(index) {
      this.editable(); if (!Number.isInteger(index) || !this.players[index]) throw new Error("Jugador inválido");
      this.current=index;
    }
    confirm() {
      this.editable(); this.ready[this.current]=true;
      const next=this.ready.findIndex(value => !value);
      if (next>=0) this.current=next;
      return next;
    }
    canSpin() { return this.state!=="SPINNING" && this.players.some(p=>sum(p.bets)>0) && (this.players.length===1 || this.ready.every(Boolean)); }
    spin() {
      if (!this.canSpin()) throw new Error("Confirma las apuestas antes de girar");
      const number=this.rng();
      if (!Number.isInteger(number) || number<0 || number>36) throw new Error("Resultado inválido");
      this.previous=this.players.map(p=>copy(p.bets));
      this.state="SPINNING"; this.pending={number}; this.undo=this.players.map(()=>[]);
      return number;
    }
    finish() {
      if (this.state!=="SPINNING" || !this.pending) return null;
      const number=this.pending.number;
      const results=this.players.map(p => {
        const stake=sum(p.bets), returned=payout(p.bets,number);
        p.balance+=returned; p.bets={};
        return {name:p.name,stake,returned,net:returned-stake,balance:p.balance};
      });
      this.lastRound={number,color:color(number),results};
      this.history.unshift(number); this.history=this.history.slice(0,20);
      this.pending=null; this.state="RESULT"; this.ready=this.players.map(()=>false);
      return this.lastRound;
    }
    serialize() { const {rng,...data}=this; return copy({schema:1,...data}); }
    static restore(data, rng=randomNumber) {
      try {
        if (data?.schema!==1 || !Array.isArray(data.players) || data.players.length<1 || data.players.length>6) return null;
        if (!data.players.every(p => typeof p.name==="string" && validMoney(p.balance) && validateWagers(p.bets) && p.balance+sum(p.bets)<=1000000000)) return null;
        if (!["BETTING","SPINNING","RESULT"].includes(data.state) || !Number.isInteger(data.current) || !data.players[data.current]) return null;
        if (!Array.isArray(data.previous) || data.previous.length!==data.players.length || !data.previous.every(validateWagers)) return null;
        if (!Array.isArray(data.ready) || data.ready.length!==data.players.length || !data.ready.every(v=>typeof v==="boolean")) return null;
        if (!Array.isArray(data.history) || data.history.length>20 || !data.history.every(n=>Number.isInteger(n)&&n>=0&&n<=36)) return null;
        if (data.state==="SPINNING" && (!Number.isInteger(data.pending?.number) || data.pending.number<0 || data.pending.number>36)) return null;
        const session=new Session({names:data.players.map(p=>p.name),rng});
        session.players=copy(data.players); session.current=data.current; session.previous=copy(data.previous);
        session.ready=copy(data.ready); session.history=[...data.history]; session.state=data.state;
        // No confiar en pilas de deshacer ni mensajes provenientes de almacenamiento externo.
        session.undo=data.players.map(()=>[]);
        session.lastRound=data.lastRound && Number.isInteger(data.lastRound.number) && data.lastRound.number>=0 && data.lastRound.number<=36 && Array.isArray(data.lastRound.results) && data.lastRound.results.length===data.players.length && data.lastRound.results.every(r=>typeof r.name==="string" && validMoney(r.stake) && validMoney(r.returned) && Number.isSafeInteger(r.net) && validMoney(r.balance)) ? copy(data.lastRound) : null;
        session.pending=data.state==="SPINNING" ? {number:data.pending.number} : null;
        if (session.pending) session.finish(); // Liquidación única al recuperar un giro interrumpido.
        return session;
      } catch (_) { return null; }
    }
  }
  globalThis.SalaCeroRouletteCore=Object.freeze({order,chips,color,bets,randomNumber,payout,sum,Session});
})();
