// ========================================================
// MOTOR DE AUDIO (Web Audio API Retro)
// ========================================================
let soundEnabled = true;
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
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
function playVictory() {
  if (!soundEnabled) return;
  const notes = [261.63, 329.63, 392.00, 523.25];
  notes.forEach((f, i) => setTimeout(() => playBeep(f, 'triangle', 0.18), i * 110));
}

// ========================================================
// ROUTING (Generador <-> Modo Roguelike)
// ========================================================
const viewGen = document.getElementById('view-generator');
const viewBattle = document.getElementById('view-battle');
const navModeBtn = document.getElementById('nav-mode-btn');
const navModeText = document.getElementById('nav-mode-text');

function switchView(mode) {
  playClick();
  if (mode === 'battle') {
    viewGen.classList.remove('active');
    viewBattle.classList.add('active');
    navModeText.innerText = 'Generador';
    window.location.hash = 'rogue';
    initTowerMatch();
  } else {
    viewBattle.classList.remove('active');
    viewGen.classList.add('active');
    navModeText.innerText = 'Modo Roguelike';
    history.pushState("", document.title, window.location.pathname);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navModeBtn.addEventListener('click', () => {
  const isBattle = viewBattle.classList.contains('active');
  switchView(isBattle ? 'generator' : 'battle');
});

document.getElementById('tower-back-btn').addEventListener('click', () => switchView('generator'));
document.getElementById('brand-logo').addEventListener('click', () => switchView('generator'));

if (window.location.hash === '#rogue' || window.location.hash === '#battle') {
  switchView('battle');
}

// ========================================================
// MOTOR ROGUELIKE INFINITO (1 SOLO POKÉMON & 3 ELECCIONES)
// ========================================================
let towerFloor = 1;
let playerPokemon = null; // Solo 1 Pokémon activo
let enemyPokemon = null;
let battleBusy = false;
let playerBag = { potions: 2 };

const TYPE_CHART = {
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, flying: 2, ground: 0, electric: 0.5, grass: 0.5, dragon: 0.5 },
  normal: { rock: 0.5, steel: 0.5, ghost: 0 }
};

// Generar 1 Pokémon con estadísticas escaladas al piso infinito
async function fetchTowerPokemon(floor = 1) {
  const randId = Math.floor(Math.random() * 1020) + 1;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randId}`);
  const d = await res.json();
  const hpBase = d.stats[0].base_stat * 2 + 50 + (floor * 6);
  const types = d.types.map(t => t.type.name);

  return {
    name: d.name,
    gender: Math.random() > 0.5 ? '♂' : '♀',
    types: types,
    maxHp: hpBase,
    hp: hpBase,
    atk: Math.max(d.stats[1].base_stat, d.stats[3].base_stat) + (floor * 3),
    def: Math.max(d.stats[2].base_stat, d.stats[4].base_stat) + (floor * 2),
    spe: d.stats[5].base_stat,
    sprite: d.sprites.other['official-artwork'].front_default || d.sprites.front_default,
    moves: [
      { name: `Golpe ${types[0]}`, type: types[0], power: 80 },
      { name: `Ráfaga ${types[1] || types[0]}`, type: types[1] || types[0], power: 85 },
      { name: 'Embestida', type: 'normal', power: 65 },
      { name: 'Ataque Veloz', type: 'normal', power: 55 }
    ]
  };
}

// Iniciar Partida
async function initTowerMatch() {
  document.getElementById('rogue-reward-screen').style.display = 'none';
  document.getElementById('bag-screen').style.display = 'none';

  // Si es la primera partida o reinicio por derrota, damos a elegir entre 3 iniciales
  if (!playerPokemon || towerFloor === 1) {
    towerFloor = 1;
    playerBag.potions = 2;
    showStarterChoice();
    return;
  }

  loadNextFloorBattle();
}

// PANTALLA: ELEGIR ENTRE 3 POKÉMON AL INICIAR
async function showStarterChoice() {
  setDialog("Generando 3 opciones para tu Pokémon inicial...");
  const modal = document.getElementById('rogue-reward-screen');
  const title = document.getElementById('reward-modal-title');
  const sub = document.getElementById('reward-modal-sub');
  const container = document.getElementById('rewards-options-container');

  title.innerText = "¡ELIGE TU INICIAL!";
  sub.innerText = "Selecciona 1 de estos 3 Pokémon para comenzar tu descenso:";
  container.innerHTML = "<p>Buscando especímenes...</p>";
  modal.style.display = 'flex';

  const starters = await Promise.all([fetchTowerPokemon(1), fetchTowerPokemon(1), fetchTowerPokemon(1)]);
  container.innerHTML = '';

  starters.forEach(poke => {
    const card = document.createElement('div');
    card.className = 'reward-choice-card';
    card.innerHTML = `
      <img src="${poke.sprite}" />
      <strong>${poke.name.toUpperCase()}</strong>
      <span style="font-size:0.75rem; color:#94A3B8;">HP: ${poke.maxHp} | ATK: ${poke.atk}</span>
      <span style="font-size:0.7rem; color:#F59E0B; text-transform:uppercase; margin-top:4px;">Tipo: ${poke.types.join('/')}</span>
    `;
    card.onclick = () => {
      playerPokemon = poke;
      modal.style.display = 'none';
      loadNextFloorBattle();
    };
    container.appendChild(card);
  });
}

// Cargar combate del piso actual
async function loadNextFloorBattle() {
  document.getElementById('tower-floor-txt').innerText = `PISO ${towerFloor} (INFINITO)`;
  document.getElementById('tower-enemy-title').innerText = `CUEVA OSCURA - NIVEL ${towerFloor}`;
  setDialog(`Entrando al Piso ${towerFloor}...`);
  battleBusy = true;

  try {
    enemyPokemon = await fetchTowerPokemon(towerFloor);
    renderField();
    showCommandMenu('main');
    setDialog(`¡Un ${enemyPokemon.name.toUpperCase()} salvaje te ataca en el Piso ${towerFloor}!`);
    battleBusy = false;
  } catch(e) {
    setDialog("Error de red. Pulsa Reiniciar Partida.");
    battleBusy = false;
  }
}

function renderField() {
  // Jugador
  document.getElementById('p-name').innerText = playerPokemon.name;
  document.getElementById('p-gender').innerText = playerPokemon.gender;
  document.getElementById('p-sprite').src = playerPokemon.sprite;
  updateHpBar('p', playerPokemon);

  // Rival
  document.getElementById('e-name').innerText = enemyPokemon.name;
  document.getElementById('e-gender').innerText = enemyPokemon.gender;
  document.getElementById('e-sprite').src = enemyPokemon.sprite;
  updateHpBar('e', enemyPokemon);
}

function updateHpBar(side, poke) {
  const pct = Math.max(0, Math.min(100, (poke.hp / poke.maxHp) * 100));
  const bar = document.getElementById(`${side}-hp-bar`);
  bar.style.width = pct + '%';

  if (side === 'p') {
    document.getElementById('p-hp-current').innerText = Math.max(0, poke.hp);
    document.getElementById('p-hp-max').innerText = poke.maxHp;
  }

  if (pct > 50) bar.style.backgroundColor = '#22C55E';
  else if (pct > 20) bar.style.backgroundColor = '#F59E0B';
  else bar.style.backgroundColor = '#E11D48';
}

function setDialog(txt) {
  document.getElementById('battle-dialog-txt').innerText = txt;
}

// Menús GBA
const menuCommands = document.getElementById('menu-commands');
const menuMoves = document.getElementById('menu-moves');

function showCommandMenu(which) {
  menuCommands.style.display = 'none';
  menuMoves.style.display = 'none';

  if (which === 'main') menuCommands.style.display = 'grid';
  if (which === 'moves') { renderMovesButtons(); menuMoves.style.display = 'block'; }
}

document.getElementById('cmd-fight-btn').addEventListener('click', () => { if (!battleBusy && playerPokemon.hp > 0) showCommandMenu('moves'); });
document.getElementById('cmd-poke-btn').addEventListener('click', () => { setDialog(`Solo tienes a ${playerPokemon.name.toUpperCase()}. ¡No puedes cambiar!`); });

// MOCHILA
document.getElementById('cmd-bag-btn').addEventListener('click', () => {
  if (battleBusy || playerPokemon.hp <= 0) return;
  const bagScreen = document.getElementById('bag-screen');
  const itemsBox = document.getElementById('bag-items-container');
  itemsBox.innerHTML = `
    <div style="background:#1F2937; padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <span>🧪 Poción (+70 HP) x${playerBag.potions}</span>
      <button class="retro-btn" id="use-potion-btn" ${playerBag.potions <= 0 ? 'disabled' : ''}>USAR</button>
    </div>
  `;
  bagScreen.style.display = 'flex';

  document.getElementById('use-potion-btn').onclick = () => {
    if (playerBag.potions > 0) {
      playerBag.potions--;
      playerPokemon.hp = Math.min(playerPokemon.maxHp, playerPokemon.hp + 70);
      updateHpBar('p', playerPokemon);
      bagScreen.style.display = 'none';
      setDialog(`¡${playerPokemon.name.toUpperCase()} recuperó 70 PS!`);
    }
  };
});

document.getElementById('close-bag-btn').addEventListener('click', () => { document.getElementById('bag-screen').style.display = 'none'; });
document.getElementById('cmd-run-btn').addEventListener('click', () => { setDialog("¡No puedes huir en una cueva Roguelike!"); });
document.getElementById('cmd-back-move').addEventListener('click', () => showCommandMenu('main'));

function renderMovesButtons() {
  const container = document.getElementById('moves-slots-container');
  container.innerHTML = '';
  playerPokemon.moves.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className = 'atk-sub-btn';
    btn.innerHTML = `<div class="atk-sub-name">${m.name}</div><div class="atk-sub-meta"><span>POT ${m.power}</span><span>${m.type}</span></div>`;
    btn.onclick = () => doTowerTurn(idx);
    container.appendChild(btn);
  });
}

// FIX CRÍTICO DEL BUG DE 0 PS: Turno de pelea con corte inmediato
// Temporizador seguro para animaciones
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Combate corregido: resta vida y no se traba
async function doTowerTurn(moveIdx) {
  if (battleBusy || playerPokemon.hp <= 0 || enemyPokemon.hp <= 0) return;

  battleBusy = true;
  showCommandMenu('main');

  const pMove = playerPokemon.moves[moveIdx];
  const eMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];

  try {
    if (playerPokemon.spe >= enemyPokemon.spe) {
      // Atacas tú primero
      await attackStep(playerPokemon, enemyPokemon, pMove, 'p', 'e');
      if (enemyPokemon.hp > 0) {
        await sleep(700);
        await attackStep(enemyPokemon, playerPokemon, eMove, 'e', 'p');
      }
    } else {
      // Ataca el rival primero
      await attackStep(enemyPokemon, playerPokemon, eMove, 'e', 'p');
      if (playerPokemon.hp > 0) {
        await sleep(700);
        await attackStep(playerPokemon, enemyPokemon, pMove, 'p', 'e');
      }
    }
  } catch (error) {
    console.error("Error en turno:", error);
  } finally {
    checkFaintStatus();
  }
}

async function attackStep(atk, def, move, atkSide, defSide) {
  setDialog(`¡${atk.name.toUpperCase()} usó ${move.name.toUpperCase()}!`);

  // Animación de salto de ataque
  const spriteAtk = document.getElementById(`${atkSide}-sprite`);
  if (spriteAtk) {
    spriteAtk.classList.add(atkSide === 'p' ? 'anim-atk-p' : 'anim-atk-e');
    setTimeout(() => spriteAtk.classList.remove('anim-atk-p', 'anim-atk-e'), 300);
  }
  
  await sleep(400);

  // Cálculo de Daño con multiplicador de tipo
  let mult = 1;
  if (TYPE_CHART[move.type] && TYPE_CHART[move.type][def.types[0]]) {
    mult = TYPE_CHART[move.type][def.types[0]];
  }

  const base = Math.floor((((2 * 50 / 5 + 2) * move.power * (atk.atk / def.def)) / 50) + 2);
  const dmg = Math.max(1, Math.floor(base * mult * (Math.random() * 0.15 + 0.85)));

  // Restar vida y actualizar visualmente la barra
  def.hp = Math.max(0, def.hp - dmg);
  updateHpBar(defSide, def);

  // Animación de daño en el receptor
  const spriteDef = document.getElementById(`${defSide}-sprite`);
  if (spriteDef) {
    spriteDef.classList.add('anim-shake');
    setTimeout(() => spriteDef.classList.remove('anim-shake'), 350);
  }

  // Mensajes de efectividad y sonido
  if (mult > 1) {
    playBeep(650, 'square', 0.2);
    setDialog(`¡Es súper eficaz! Infligió ${dmg} de daño.`);
  } else if (mult < 1 && mult > 0) {
    playBeep(200, 'sawtooth', 0.1);
    setDialog(`No es muy eficaz... Infligió ${dmg} de daño.`);
  } else {
    playBeep(200, 'sawtooth', 0.1);
    setDialog(`Infligió ${dmg} de daño.`);
  }

  await sleep(700);
}

// Comprobación estricta de fin de turno
async function checkFaintStatus() {
  // 1. SI TU POKÉMON MUERE: Se bloquea y fin de la partida
  if (playerPokemon.hp <= 0) {
    battleBusy = true;
    playBeep(100, 'sawtooth', 0.4);
    setDialog(`¡Tu ${playerPokemon.name.toUpperCase()} se debilitó por completo! Fin de la partida.`);
    await sleep(1000);
    showGameOverScreen();
    return;
  }

  // 2. SI EL RIVAL MUERE: Victoria de piso y 3 opciones
  if (enemyPokemon.hp <= 0) {
    battleBusy = true;
    playVictory();
    setDialog(`¡El ${enemyPokemon.name.toUpperCase()} rival ha sido derrotado!`);
    await sleep(1000);
    showVictoryRewardDraft();
    return;
  }

  battleBusy = false;
}

// PANTALLA GAME OVER (REINICIO TOTAL DE PISOS)
function showGameOverScreen() {
  const modal = document.getElementById('rogue-reward-screen');
  const title = document.getElementById('reward-modal-title');
  const sub = document.getElementById('reward-modal-sub');
  const container = document.getElementById('rewards-options-container');

  title.innerText = "¡GAME OVER!";
  title.style.color = "#EF4444";
  sub.innerText = `Has caído en el Piso ${towerFloor}. Al perder, la partida se reinicia desde el Piso 1.`;

  container.innerHTML = `
    <div style="grid-column: 1 / -1;">
      <button class="retro-btn" style="background:#E11D48; padding:15px; font-size:0.9rem; width:100%; border:3px solid #000;" onclick="restartEntireGame()">
        COMENZAR NUEVA PARTIDA (PISO 1)
      </button>
    </div>
  `;
  modal.style.display = 'flex';
}

window.restartEntireGame = function() {
  playerPokemon = null;
  towerFloor = 1;
  initTowerMatch();
};

// PANTALLA: 3 ELECCIONES TRAS DERROTAR AL RIVAL
async function showVictoryRewardDraft() {
  const modal = document.getElementById('rogue-reward-screen');
  const title = document.getElementById('reward-modal-title');
  const sub = document.getElementById('reward-modal-sub');
  const container = document.getElementById('rewards-options-container');

  title.innerText = `¡PISO ${towerFloor} SUPERADO!`;
  title.style.color = "#F59E0B";
  sub.innerText = "Elige 1 de estos 3 Pokémon para cambiar de compañero, o quédate con el tuyo:";
  container.innerHTML = "<p>Buscando especímenes...</p>";
  modal.style.display = 'flex';

  const choices = await Promise.all([
    fetchTowerPokemon(towerFloor + 1),
    fetchTowerPokemon(towerFloor + 1),
    fetchTowerPokemon(towerFloor + 1)
  ]);

  container.innerHTML = '';

  // Las 3 elecciones de Pokémon nuevos
  choices.forEach((poke, idx) => {
    const card = document.createElement('div');
    card.className = 'reward-choice-card';
    card.innerHTML = `
      <span style="color:#10B981; font-size:0.75rem; font-weight:700;">OPCIÓN ${idx + 1}</span>
      <img src="${poke.sprite}" />
      <strong>${poke.name.toUpperCase()}</strong>
      <span style="font-size:0.75rem; color:#94A3B8;">HP: ${poke.maxHp} | ATK: ${poke.atk}</span>
      <small style="margin-top:6px; color:#38BDF8;">Cambiar a este</small>
    `;
    card.onclick = () => {
      playerPokemon = poke; // Cambias a tu único Pokémon
      advanceNextFloor();
    };
    container.appendChild(card);
  });

  // Opción 4: Conservar el actual y curar vida
  const keepCard = document.createElement('div');
  keepCard.className = 'reward-choice-card';
  keepCard.style.borderColor = '#F59E0B';
  keepCard.innerHTML = `
    <span style="color:#F59E0B; font-size:0.75rem; font-weight:700;">CONSERVAR ACTUAL</span>
    <img src="${playerPokemon.sprite}" />
    <strong>${playerPokemon.name.toUpperCase()}</strong>
    <span style="font-size:0.75rem; color:#10B981;">Cura +50% de Vida</span>
    <small style="margin-top:6px; color:#F59E0B;">+1 Poción de regalo</small>
  `;
  keepCard.onclick = () => {
    playerPokemon.hp = Math.min(playerPokemon.maxHp, playerPokemon.hp + Math.floor(playerPokemon.maxHp * 0.5));
    playerBag.potions++;
    advanceNextFloor();
  };
  container.appendChild(keepCard);
}

function advanceNextFloor() {
  towerFloor++;
  initTowerMatch(towerFloor);
}

document.getElementById('tower-restart-btn').addEventListener('click', restartEntireGame);

// ========================================================
// GENERADOR DE EQUIPOS (DESCARGA ULTRARRÁPIDA)
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

const genContainer = document.getElementById('gen-container');
Object.keys(GENERATIONS).forEach(gKey => {
  const g = GENERATIONS[gKey];
  const lbl = document.createElement('label');
  lbl.className = 'gen-btn active';
  lbl.innerHTML = `<input type="checkbox" value="${gKey}" checked/> ${g.name}`;
  lbl.addEventListener('change', (e) => {
    playClick();
    const v = parseInt(gKey);
    if (e.target.checked) activeGens.push(v);
    else activeGens = activeGens.filter(x => x !== v);
    lbl.classList.toggle('active', e.target.checked);
  });
  genContainer.appendChild(lbl);
});

document.getElementById('shiny-toggle').addEventListener('change', (e) => {
  playClick();
  forceShiny = e.target.checked;
  document.getElementById('shiny-chip').classList.toggle('active', forceShiny);
  renderTeam();
});

async function generateFullTeam() {
  playClick();
  const loader = document.getElementById('loading');
  loader.style.display = 'flex';

  try {
    let pool = [];
    const lockedIds = teamSlots.filter(s => s.locked && s.data).map(s => s.data.id);
    activeGens.forEach(g => {
      for (let i = GENERATIONS[g].start; i <= GENERATIONS[g].end; i++) {
        if (!lockedIds.includes(i)) pool.push(i);
      }
    });

    const unlockedIdxs = teamSlots.map((s, i) => s.locked ? null : i).filter(i => i !== null);
    const randomIds = [];
    for (let i = 0; i < unlockedIdxs.length; i++) {
      const r = Math.floor(Math.random() * pool.length);
      randomIds.push(pool.splice(r, 1)[0]);
    }

    const results = await Promise.all(
      randomIds.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()))
    );

    unlockedIdxs.forEach((slotIdx, i) => teamSlots[slotIdx].data = results[i]);

    renderTeam();
    updateRadar();
    playVictory();
  } catch(e) {
    console.error(e);
  } finally {
    loader.style.display = 'none';
  }
}

function updateRadar() {
  const active = teamSlots.map(s => s.data).filter(d => d !== null);
  if (!active.length) return;

  let bstSum = 0, fastest = active[0], strongest = active[0], tankest = active[0];

  active.forEach(p => {
    bstSum += p.stats.reduce((a, s) => a + s.base_stat, 0);
    if (p.stats[5].base_stat > fastest.stats[5].base_stat) fastest = p;
    if (Math.max(p.stats[1].base_stat, p.stats[3].base_stat) > Math.max(strongest.stats[1].base_stat, strongest.stats[3].base_stat)) strongest = p;
    if (Math.max(p.stats[2].base_stat, p.stats[4].base_stat) > Math.max(tankest.stats[2].base_stat, tankest.stats[4].base_stat)) tankest = p;
  });

  document.getElementById('stat-avg-bst').innerText = `${Math.round(bstSum / active.length)} Pts`;
  document.getElementById('stat-speedster').innerText = fastest.name;
  document.getElementById('stat-speedster-val').innerText = `${fastest.stats[5].base_stat} Velocidad`;
  document.getElementById('stat-mvp').innerText = strongest.name;
  document.getElementById('stat-mvp-val').innerText = `${Math.max(strongest.stats[1].base_stat, strongest.stats[3].base_stat)} Potencia`;
  document.getElementById('stat-tank').innerText = tankest.name;
  document.getElementById('stat-tank-val').innerText = `${Math.max(tankest.stats[2].base_stat, tankest.stats[4].base_stat)} Defensa`;
}

function renderTeam() {
  const container = document.getElementById('team-container');
  container.innerHTML = '';

  teamSlots.forEach((slot, idx) => {
    const p = slot.data;
    if (!p) return;

    const sprite = forceShiny 
      ? (p.sprites.other['official-artwork'].front_shiny || p.sprites.front_shiny) 
      : (p.sprites.other['official-artwork'].front_default || p.sprites.front_default);

    const card = document.createElement('article');
    card.className = `poke-card ${slot.locked ? 'is-locked' : ''} ${forceShiny ? 'is-shiny' : ''}`;
    card.innerHTML = `
      <div class="card-top-bar">
        <span class="poke-num">#${String(p.id).padStart(4, '0')}</span>
        <div class="card-actions">
          <button class="mini-btn" onclick="rerollSingle(${idx})">🔄</button>
          <button class="mini-btn ${slot.locked ? 'locked' : ''}" onclick="toggleLock(${idx})">${slot.locked ? '🔒' : '🔓'}</button>
        </div>
      </div>
      <div class="poke-img-wrap" onclick="openDetails(${idx})">
        <img class="poke-img" src="${sprite}" alt="${p.name}" />
      </div>
      <h2 class="poke-name" onclick="openDetails(${idx})">${p.name}</h2>
      <div class="poke-types">${p.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('')}</div>
      <div class="poke-stats">
        <div class="stat-row"><span class="stat-lbl">HP</span><div class="stat-bar"><div style="height:100%; width:${Math.min((p.stats[0].base_stat/255)*100, 100)}%; background:#22c55e;"></div></div><span class="stat-val">${p.stats[0].base_stat}</span></div>
        <div class="stat-row"><span class="stat-lbl">ATK</span><div class="stat-bar"><div style="height:100%; width:${Math.min((p.stats[1].base_stat/255)*100, 100)}%; background:#ef4444;"></div></div><span class="stat-val">${p.stats[1].base_stat}</span></div>
        <div class="stat-row"><span class="stat-lbl">DEF</span><div class="stat-bar"><div style="height:100%; width:${Math.min((p.stats[2].base_stat/255)*100, 100)}%; background:#f59e0b;"></div></div><span class="stat-val">${p.stats[2].base_stat}</span></div>
        <div class="stat-row"><span class="stat-lbl">SPD</span><div class="stat-bar"><div style="height:100%; width:${Math.min((p.stats[5].base_stat/255)*100, 100)}%; background:#3b82f6;"></div></div><span class="stat-val">${p.stats[5].base_stat}</span></div>
      </div>
    `;
    container.appendChild(card);
  });
}

window.rerollSingle = async function(i) {
  playClick();
  const id = Math.floor(Math.random() * 1020) + 1;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  teamSlots[i].data = await res.json();
  renderTeam();
  updateRadar();
};

window.toggleLock = function(i) {
  playClick();
  teamSlots[i].locked = !teamSlots[i].locked;
  renderTeam();
};

window.openDetails = function(i) {
  const p = teamSlots[i].data;
  if (!p) return;
  document.getElementById('modal-poke-img').src = p.sprites.other['official-artwork'].front_default || p.sprites.front_default;
  document.getElementById('modal-poke-name').innerText = p.name;
  document.getElementById('modal-poke-types').innerHTML = p.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('');
  document.getElementById('modal-poke-ability').innerText = p.abilities.map(a => a.ability.name).join(', ');
  document.getElementById('modal-poke-size').innerText = `${p.weight/10} kg / ${p.height/10} m`;
  document.getElementById('poke-modal').style.display = 'flex';
};

document.getElementById('modal-close-btn').addEventListener('click', () => {
  document.getElementById('poke-modal').style.display = 'none';
});

document.getElementById('export-btn').addEventListener('click', () => {
  playClick();
  let txt = "=== ESCUADRÓN POKÉROCKET ===\n\n";
  teamSlots.forEach((s, idx) => {
    if (s.data) txt += `${idx+1}. ${s.data.name.toUpperCase()} [${s.data.types.map(t => t.type.name).join('/')}]\n`;
  });
  navigator.clipboard.writeText(txt).then(() => {
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  });
});

document.getElementById('generate-btn').addEventListener('click', generateFullTeam);

// TEMA Y AUDIO
document.getElementById('mute-toggle').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  playClick();
  document.getElementById('sound-text').innerText = soundEnabled ? 'Audio: ON' : 'Audio: OFF';
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  playClick();
  const isDark = document.body.getAttribute('data-theme') === 'light';
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
});

// INICIO AUTOMÁTICO
generateFullTeam();
