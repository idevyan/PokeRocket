// ========================================================
// SISTEMA DE AUDIO
// ========================================================
let soundEnabled = true;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContextClass();
}

function playBeep(freq, type, duration) {
  if (!soundEnabled) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e){}
}

function playClick() { playBeep(520, 'square', 0.05); }
function playLockSound() { playBeep(330, 'triangle', 0.08); }
function playVictory() {
  if (!soundEnabled) return;
  const notes = [261.63, 329.63, 392.00, 523.25];
  notes.forEach((f, i) => setTimeout(() => playBeep(f, 'triangle', 0.18), i * 110));
}

function playPokemonCry(url) {
  if (!soundEnabled || !url) return;
  const audio = new Audio(url);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

// ========================================================
// ROUTING Y NAVEGACIÓN (GENERADOR VS ARENA)
// ========================================================
const viewGenerator = document.getElementById('view-generator');
const viewBattle = document.getElementById('view-battle');
const navModeText = document.getElementById('nav-mode-text');

function switchView(viewName) {
  playClick();
  if (viewName === 'battle') {
    viewGenerator.classList.remove('active');
    viewBattle.classList.add('active');
    navModeText.innerText = 'Generador';
    window.location.hash = 'battle';
    initBattleArena();
  } else {
    viewBattle.classList.remove('active');
    viewGenerator.classList.add('active');
    navModeText.innerText = 'Arena Battle';
    history.pushState("", document.title, window.location.pathname);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('nav-battle-btn').addEventListener('click', () => {
  const isBattleActive = viewBattle.classList.contains('active');
  switchView(isBattleActive ? 'generator' : 'battle');
});

document.getElementById('battle-launcher-tab').addEventListener('click', () => switchView('battle'));
document.getElementById('back-to-gen-btn').addEventListener('click', () => switchView('generator'));
document.getElementById('brand-logo').addEventListener('click', () => switchView('generator'));

// Soporte de enlace directo: #battle
if (window.location.hash === '#battle') {
  switchView('battle');
}

// ========================================================
// ARENA DE COMBATE
// ========================================================
const TYPE_CHART = {
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, flying: 2, ground: 0, electric: 0.5, grass: 0.5, dragon: 0.5 },
  normal: { rock: 0.5, steel: 0.5, ghost: 0 }
};

let bPlayer = null;
let bEnemy = null;
let bBusy = false;
let battleReady = false;

async function fetchBattleFighter() {
  const id = Math.floor(Math.random() * 1020) + 1;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  const hp = data.stats[0].base_stat * 2 + 60;
  const types = data.types.map(t => t.type.name);

  return {
    name: data.name,
    types: types,
    maxHp: hp,
    hp: hp,
    atk: Math.max(data.stats[1].base_stat, data.stats[3].base_stat),
    def: Math.max(data.stats[2].base_stat, data.stats[4].base_stat),
    spe: data.stats[5].base_stat,
    sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
    moves: [
      { name: `Golpe ${types[0]}`, type: types[0], power: 80 },
      { name: `Ráfaga ${types[1] || types[0]}`, type: types[1] || types[0], power: 85 },
      { name: 'Embestida', type: 'normal', power: 65 },
      { name: 'Ataque Veloz', type: 'normal', power: 55 }
    ]
  };
}

async function initBattleArena() {
  if (battleReady && bPlayer && bPlayer.hp > 0 && bEnemy && bEnemy.hp > 0) return;
  setBattleMsg('Convocando contendientes de la PokéAPI...');
  disableBattleButtons(true);

  try {
    const [p, e] = await Promise.all([fetchBattleFighter(), fetchBattleFighter()]);
    bPlayer = p;
    bEnemy = e;
    battleReady = true;

    renderFighterUI(bPlayer, 'player');
    renderFighterUI(bEnemy, 'enemy');
    renderBattleMoves();

    setBattleMsg(`¡Un ${bEnemy.name.toUpperCase()} salvaje te desafía! ¿Qué hará ${bPlayer.name.toUpperCase()}?`);
    disableBattleButtons(false);
  } catch(err) {
    setBattleMsg('Error de conexión. Pulsa "Nuevo Duelo Random".');
  }
}

function renderFighterUI(poke, side) {
  document.getElementById(`b-name-${side}`).innerText = poke.name.replace('-', ' ');
  document.getElementById(`b-img-${side}`).src = poke.sprite;
  updateBattleHpUI(side);
}

function updateBattleHpUI(side) {
  const poke = side === 'player' ? bPlayer : bEnemy;
  const pct = Math.max(0, Math.min(100, (poke.hp / poke.maxHp) * 100));
  const bar = document.getElementById(`b-bar-${side}`);
  const txt = document.getElementById(`b-txt-${side}`);

  bar.style.width = pct + '%';
  txt.innerText = `${Math.max(0, poke.hp)} / ${poke.maxHp}`;

  if (pct > 50) bar.style.backgroundColor = 'var(--accent-green)';
  else if (pct > 20) bar.style.backgroundColor = 'var(--accent-yellow)';
  else bar.style.backgroundColor = 'var(--rocket-red)';
}

function renderBattleMoves() {
  const grid = document.getElementById('b-attacks-grid');
  grid.innerHTML = '';

  bPlayer.moves.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className = 'atk-btn';
    btn.innerHTML = `
      <div class="atk-name">${m.name}</div>
      <div class="atk-meta">
        <span>Potencia: ${m.power}</span>
        <span class="atk-tag t-${m.type}">${m.type}</span>
      </div>
    `;
    btn.onclick = () => executeBattleTurn(idx);
    grid.appendChild(btn);
  });
}

function setBattleMsg(txt) { document.getElementById('b-console').innerText = txt; }
function disableBattleButtons(val) {
  document.querySelectorAll('#b-attacks-grid .atk-btn').forEach(b => b.disabled = val);
}

function calcCombatDmg(attacker, defender, move) {
  let mult = 1;
  if (TYPE_CHART[move.type] && TYPE_CHART[move.type][defender.types[0]]) {
    mult = TYPE_CHART[move.type][defender.types[0]];
  }
  const base = Math.floor((((2 * 50 / 5 + 2) * move.power * (attacker.atk / defender.def)) / 50) + 2);
  const dmg = Math.floor(base * mult * (Math.random() * (1 - 0.85) + 0.85));
  return { dmg: Math.max(1, dmg), mult: mult };
}

async function executeBattleTurn(moveIdx) {
  if (bBusy || bPlayer.hp <= 0 || bEnemy.hp <= 0) return;
  bBusy = true;
  disableBattleButtons(true);

  const pMove = bPlayer.moves[moveIdx];
  const eMove = bEnemy.moves[Math.floor(Math.random() * bEnemy.moves.length)];
  const playerFirst = bPlayer.spe >= bEnemy.spe;

  if (playerFirst) {
    await battleStrike(bPlayer, bEnemy, pMove, 'player', 'enemy');
    if (bEnemy.hp > 0) {
      await sleep(850);
      await battleStrike(bEnemy, bPlayer, eMove, 'enemy', 'player');
    }
  } else {
    await battleStrike(bEnemy, bPlayer, eMove, 'enemy', 'player');
    if (bPlayer.hp > 0) {
      await sleep(850);
      await battleStrike(bPlayer, bEnemy, pMove, 'player', 'enemy');
    }
  }

  if (bPlayer.hp > 0 && bEnemy.hp > 0) {
    disableBattleButtons(false);
    bBusy = false;
  } else {
    endDuel();
  }
}

async function battleStrike(atk, def, move, atkSide, defSide) {
  setBattleMsg(`¡${atk.name.toUpperCase()} usó ${move.name.toUpperCase()}!`);

  const imgAtk = document.getElementById(`b-img-${atkSide}`);
  imgAtk.classList.add(atkSide === 'player' ? 'anim-atk-p' : 'anim-atk-e');
  setTimeout(() => imgAtk.classList.remove('anim-atk-p', 'anim-atk-e'), 300);

  await sleep(350);

  const res = calcCombatDmg(atk, def, move);
  def.hp -= res.dmg;

  const imgDef = document.getElementById(`b-img-${defSide}`);
  imgDef.classList.add('anim-shake');
  setTimeout(() => imgDef.classList.remove('anim-shake'), 350);

  updateBattleHpUI(defSide);

  if (res.mult > 1) { playBeep(650, 'square', 0.2); setBattleMsg(`¡Es súper eficaz! Infligió ${res.dmg} de daño.`); }
  else if (res.mult < 1 && res.mult > 0) { playBeep(200, 'sawtooth', 0.1); setBattleMsg(`No es muy eficaz... Infligió ${res.dmg} de daño.`); }
  else { playBeep(200, 'sawtooth', 0.1); setBattleMsg(`Infligió ${res.dmg} puntos de daño.`); }
}

function endDuel() {
  if (bPlayer.hp <= 0) {
    playBeep(120, 'triangle', 0.4);
    setBattleMsg(`¡${bPlayer.name.toUpperCase()} cayó debilitado! Has sido derrotado.`);
  } else if (bEnemy.hp <= 0) {
    playVictory();
    setBattleMsg(`¡${bEnemy.name.toUpperCase()} enemigo derrotado! ¡Victoria para el Escuadrón!`);
  }
  bBusy = false;
  battleReady = false;
}

document.getElementById('battle-duel-reload').addEventListener('click', () => {
  battleReady = false;
  initBattleArena();
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ========================================================
// MOTOR DEL GENERADOR DE EQUIPOS
// ========================================================
let teamSlots = Array(6).fill(null).map(() => ({ data: null, locked: false }));
const GENERATIONS = {
  1: { name: "Gen I", start: 1, end: 151 }, 2: { name: "Gen II", start: 152, end: 251 },
  3: { name: "Gen III", start: 252, end: 386 }, 4: { name: "Gen IV", start: 387, end: 493 },
  5: { name: "Gen V", start: 494, end: 649 }, 6: { name: "Gen VI", start: 650, end: 721 },
  7: { name: "Gen VII", start: 722, end: 809 }, 8: { name: "Gen VIII", start: 810, end: 905 },
  9: { name: "Gen IX", start: 906, end: 1025 }
};
let activeGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let forceShiny = false;

const TYPE_WEAKNESSES = {
  normal: ['fighting'], fire: ['water', 'ground', 'rock'], water: ['electric', 'grass'],
  grass: ['fire', 'ice', 'poison', 'flying', 'bug'], electric: ['ground'], ice: ['fire', 'fighting', 'rock', 'steel'],
  fighting: ['flying', 'psychic', 'fairy'], poison: ['ground', 'psychic'], ground: ['water', 'grass', 'ice'],
  flying: ['electric', 'ice', 'rock'], psychic: ['bug', 'ghost', 'dark'], bug: ['fire', 'flying', 'rock'],
  rock: ['water', 'grass', 'fighting', 'ground', 'steel'], ghost: ['ghost', 'dark'], dragon: ['ice', 'dragon', 'fairy'],
  steel: ['fire', 'fighting', 'ground'], fairy: ['poison', 'steel'], dark: ['fighting', 'bug', 'fairy']
};

const MISSION_NAMES = [
  "OPERACIÓN: SOMBRA KANTO", "MISIÓN: FURIA NOCTURNA", "PROTOCOLO: ASALTO JOHTO",
  "OPERACIÓN: CÓDIGO GIOVANNI", "ESCUADRÓN: TRUENO NEGRO", "MISIÓN: RELÁMPAGO ROJO"
];

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

const genContainer = document.getElementById('gen-container');
Object.keys(GENERATIONS).forEach(gKey => {
  const g = GENERATIONS[gKey];
  const lbl = document.createElement('label');
  lbl.className = 'gen-btn active';
  lbl.innerHTML = `<input type="checkbox" value="${gKey}" checked/> ${g.name}`;
  lbl.addEventListener('change', (e) => {
    playClick();
    const v = parseInt(gKey);
    if (e.target.checked) { activeGens.push(v); lbl.classList.add('active'); }
    else {
      if (activeGens.length <= 1) { e.target.checked = true; return; }
      activeGens = activeGens.filter(x => x !== v);
      lbl.classList.remove('active');
    }
  });
  genContainer.appendChild(lbl);
});

document.getElementById('shiny-toggle').addEventListener('change', (e) => {
  playClick();
  forceShiny = e.target.checked;
  document.getElementById('shiny-chip').classList.toggle('active', forceShiny);
  renderTeam();
});

function getAvailablePool() {
  let pool = [];
  const lockedIds = teamSlots.filter(s => s.locked && s.data).map(s => s.data.id);
  activeGens.forEach(g => {
    for (let i = GENERATIONS[g].start; i <= GENERATIONS[g].end; i++) {
      if (!lockedIds.includes(i)) pool.push(i);
    }
  });
  return pool;
}

async function fetchPoke(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  return await res.json();
}

window.rerollSlot = async function(index) {
  playClick();
  const pool = getAvailablePool();
  if (!pool.length) return;
  const randId = pool[Math.floor(Math.random() * pool.length)];
  try {
    teamSlots[index].data = await fetchPoke(randId);
    renderTeam();
    updateTacticalRadar();
  } catch(e) { console.error(e); }
};

window.toggleLock = function(index) {
  playLockSound();
  teamSlots[index].locked = !teamSlots[index].locked;
  renderTeam();
};

async function generateFullTeam() {
  playClick();
  const loader = document.getElementById('loading');
  loader.style.display = 'flex';

  try {
    const pool = getAvailablePool();
    const unlockedIndexes = teamSlots.map((s, i) => s.locked ? null : i).filter(i => i !== null);
    const chosenIds = [];
    for (let i = 0; i < unlockedIndexes.length; i++) {
      if (pool.length > 0) {
        const randPos = Math.floor(Math.random() * pool.length);
        chosenIds.push(pool.splice(randPos, 1)[0]);
      }
    }
    const downloadedData = await Promise.all(chosenIds.map(id => fetchPoke(id)));
    unlockedIndexes.forEach((slotIdx, i) => { teamSlots[slotIdx].data = downloadedData[i]; });

    document.getElementById('mission-code').innerText = MISSION_NAMES[Math.floor(Math.random() * MISSION_NAMES.length)];
    renderTeam();
    updateTacticalRadar();
    playVictory();
  } catch (err) {
    console.error(err);
  } finally {
    loader.style.display = 'none';
  }
}

function updateTacticalRadar() {
  const activeData = teamSlots.map(s => s.data).filter(d => d !== null);
  if (!activeData.length) return;

  let totalBST = 0, fastest = activeData[0], strongest = activeData[0], tankest = activeData[0];
  const weaknessCount = {};

  activeData.forEach(p => {
    totalBST += p.stats.reduce((acc, s) => acc + s.base_stat, 0);
    if (p.stats[5].base_stat > fastest.stats[5].base_stat) fastest = p;
    if (Math.max(p.stats[1].base_stat, p.stats[3].base_stat) > Math.max(strongest.stats[1].base_stat, strongest.stats[3].base_stat)) strongest = p;
    if (Math.max(p.stats[2].base_stat, p.stats[4].base_stat) > Math.max(tankest.stats[2].base_stat, tankest.stats[4].base_stat)) tankest = p;

    p.types.forEach(t => {
      const weaks = TYPE_WEAKNESSES[t.type.name] || [];
      weaks.forEach(w => { weaknessCount[w] = (weaknessCount[w] || 0) + 1; });
    });
  });

  const avgBST = Math.round(totalBST / activeData.length);
  document.getElementById('stat-avg-bst').innerText = `${avgBST} Pts`;

  const rankEl = document.getElementById('team-rank');
  if (avgBST > 530) rankEl.innerText = 'RANGO: LÍDER SUPREMO';
  else if (avgBST > 460) rankEl.innerText = 'RANGO: COMANDANTE ÉLITE';
  else if (avgBST > 380) rankEl.innerText = 'RANGO: TENIENTE';
  else rankEl.innerText = 'RANGO: RECLUTA ROCKET';

  document.getElementById('stat-speedster').innerText = fastest.name.replace('-', ' ');
  document.getElementById('stat-speedster-val').innerText = `${fastest.stats[5].base_stat} Velocidad`;
  document.getElementById('stat-mvp').innerText = strongest.name.replace('-', ' ');
  document.getElementById('stat-mvp-val').innerText = `${Math.max(strongest.stats[1].base_stat, strongest.stats[3].base_stat)} Potencia`;
  document.getElementById('stat-tank').innerText = tankest.name.replace('-', ' ');
  document.getElementById('stat-tank-val').innerText = `${Math.max(tankest.stats[2].base_stat, tankest.stats[4].base_stat)} Defensa`;

  let worstType = '', worstCount = 0;
  Object.keys(weaknessCount).forEach(t => {
    if (weaknessCount[t] > worstCount) { worstCount = weaknessCount[t]; worstType = t; }
  });

  const alertBox = document.getElementById('weakness-report');
  if (worstCount >= 3) {
    alertBox.innerHTML = `<strong>¡Alerta Crítica!</strong> ${worstCount} miembros son vulnerables a <span style="text-transform:uppercase; color:var(--rocket-red);">${worstType}</span>.`;
  } else {
    alertBox.innerHTML = `<strong>Equilibrio Estable:</strong> Buena cobertura elemental del escuadrón.`;
  }
}

function renderTeam() {
  const container = document.getElementById('team-container');
  container.innerHTML = '';
  teamSlots.forEach((slot, idx) => {
    const poke = slot.data;
    if (!poke) return;

    const isShiny = forceShiny;
    const sprite = isShiny
      ? (poke.sprites.other['official-artwork'].front_shiny || poke.sprites.front_shiny)
      : (poke.sprites.other['official-artwork'].front_default || poke.sprites.front_default);

    const cryUrl = poke.cries ? (poke.cries.latest || poke.cries.legacy) : '';
    const typesHtml = poke.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('');

    const hp = poke.stats[0].base_stat;
    const atk = poke.stats[1].base_stat;
    const def = poke.stats[2].base_stat;
    const spe = poke.stats[5].base_stat;

    const card = document.createElement('article');
    card.className = `poke-card ${slot.locked ? 'is-locked' : ''} ${isShiny ? 'is-shiny' : ''}`;
    card.innerHTML = `
      <div class="card-top-bar">
        <span class="poke-num">#${String(poke.id).padStart(4, '0')}</span>
        <div class="card-actions">
          ${cryUrl ? `<button class="mini-btn" title="Grito" onclick="playPokemonCry('${cryUrl}')"><svg class="icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>` : ''}
          <button class="mini-btn" title="Reemplazar" onclick="rerollSlot(${idx})"><svg class="icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>
          <button class="mini-btn ${slot.locked ? 'locked' : ''}" title="${slot.locked ? 'Desbloquear' : 'Bloquear'}" onclick="toggleLock(${idx})"><svg class="icon" viewBox="0 0 24 24">${slot.locked ? `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>` : `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`}</svg></button>
        </div>
      </div>
      <div class="poke-img-wrap" onclick="openDetails(${idx})">
        <img class="poke-img" src="${sprite}" alt="${poke.name}" loading="lazy"/>
      </div>
      <h2 class="poke-name" onclick="openDetails(${idx})">${poke.name.replace('-', ' ')} <svg class="icon shiny-tag" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z"/></svg></h2>
      <div class="poke-types">${typesHtml}</div>
      <div class="poke-stats">
        <div class="stat-row"><span class="stat-lbl">HP</span><div class="stat-bar"><div style="height:100%; width:${Math.min((hp/255)*100, 100)}%; background:#22c55e;"></div></div><span class="stat-val">${hp}</span></div>
        <div class="stat-row"><span class="stat-lbl">ATK</span><div class="stat-bar"><div style="height:100%; width:${Math.min((atk/255)*100, 100)}%; background:#ef4444;"></div></div><span class="stat-val">${atk}</span></div>
        <div class="stat-row"><span class="stat-lbl">DEF</span><div class="stat-bar"><div style="height:100%; width:${Math.min((def/255)*100, 100)}%; background:#f59e0b;"></div></div><span class="stat-val">${def}</span></div>
        <div class="stat-row"><span class="stat-lbl">SPD</span><div class="stat-bar"><div style="height:100%; width:${Math.min((spe/255)*100, 100)}%; background:#3b82f6;"></div></div><span class="stat-val">${spe}</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

window.openDetails = function(index) {
  playClick();
  const p = teamSlots[index].data;
  if (!p) return;
  const sprite = forceShiny ? (p.sprites.other['official-artwork'].front_shiny || p.sprites.front_shiny) : (p.sprites.other['official-artwork'].front_default || p.sprites.front_default);
  document.getElementById('modal-poke-img').src = sprite;
  document.getElementById('modal-poke-name').innerText = p.name.replace('-', ' ');
  document.getElementById('modal-poke-types').innerHTML = p.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('');
  document.getElementById('modal-poke-ability').innerText = p.abilities.map(a => a.ability.name.replace('-', ' ')).join(', ');
  document.getElementById('modal-poke-size').innerText = `${p.weight/10} kg / ${p.height/10} m`;

  const statNames = ['HP', 'Ataque', 'Defensa', 'Sp. Atk', 'Sp. Def', 'Velocidad'];
  const statColors = ['#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#3b82f6'];
  let statsHtml = '';
  p.stats.forEach((st, i) => {
    statsHtml += `<div class="stat-row"><span class="stat-lbl" style="width:65px;">${statNames[i]}</span><div class="stat-bar"><div style="height:100%; width:${Math.min((st.base_stat/255)*100, 100)}%; background:${statColors[i]};"></div></div><span class="stat-val">${st.base_stat}</span></div>`;
  });
  document.getElementById('modal-full-stats').innerHTML = statsHtml;
  document.getElementById('poke-modal').style.display = 'flex';
};

document.getElementById('modal-close-btn').addEventListener('click', () => {
  document.getElementById('poke-modal').style.display = 'none';
});

document.getElementById('export-btn').addEventListener('click', () => {
  playClick();
  const valid = teamSlots.filter(s => s.data);
  if (!valid.length) return;
  let summary = "=== REPORTE OPERATIVO POKÉROCKET ===\n\n";
  valid.forEach((s, idx) => {
    const p = s.data;
    const types = p.types.map(t => t.type.name.toUpperCase()).join('/');
    summary += `${idx + 1}. ${p.name.toUpperCase()} [${types}]\n   Stats: HP ${p.stats[0].base_stat} | ATK ${p.stats[1].base_stat} | DEF ${p.stats[2].base_stat} | SPE ${p.stats[5].base_stat}\n\n`;
  });
  navigator.clipboard.writeText(summary).then(() => showToast("¡Reporte copiado!"));
});

document.getElementById('generate-btn').addEventListener('click', generateFullTeam);
window.addEventListener('DOMContentLoaded', generateFullTeam);

// MUTE
const muteBtn = document.getElementById('mute-toggle');
const soundIcon = document.getElementById('sound-icon');
muteBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  playClick();
  soundIcon.innerHTML = soundEnabled 
    ? `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`
    : `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
});

// TEMA
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
if (localStorage.getItem('pk_rocket_theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
}

themeBtn.addEventListener('click', () => {
  playClick();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'light');
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
    localStorage.setItem('pk_rocket_theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
    localStorage.setItem('pk_rocket_theme', 'dark');
  }
});