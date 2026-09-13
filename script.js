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
// CAMBIO DE VISTA (Generador <-> Torre Batalla)
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
    window.location.hash = 'tower';
    initTowerMatch();
  } else {
    viewBattle.classList.remove('active');
    viewGen.classList.add('active');
    navModeText.innerText = 'Torre Batalla';
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

if (window.location.hash === '#tower' || window.location.hash === '#battle') {
  switchView('battle');
}

// ========================================================
// MOTOR ROGUELIKE INFINITO (1 Inicial -> Máximo 3 Pokémon)
// ========================================================
let towerFloor = 1;
let playerParty = []; // Máximo 3 Pokémon
let enemyParty = [];
let pActiveIdx = 0;
let eActiveIdx = 0;
let battleBusy = false;
let playerBag = { potions: 3 }; // Pociones iniciales

// Generar Pokémon con escalado infinito de nivel según el piso
async function fetchTowerPokemon(floor = 1) {
  const randId = Math.floor(Math.random() * 1020) + 1;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randId}`);
  const d = await res.json();
  
  // Escalado de vida y ataque por cada piso superado
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
      { name: 'Ataque Rápido', type: 'normal', power: 55 }
    ]
  };
}

// Iniciar Partida Roguelike
async function initTowerMatch(floor = 1) {
  towerFloor = floor;
  document.getElementById('tower-floor-txt').innerText = `PISO ${towerFloor} (INFINITO)`;
  document.getElementById('tower-enemy-title').innerText = `PROFUNDIDAD: NIVEL ${towerFloor}`;
  document.getElementById('rogue-reward-screen').style.display = 'none';
  document.getElementById('bag-screen').style.display = 'none';
  
  setDialog(`Entrando a la Cueva - Piso ${towerFloor}...`);
  battleBusy = true;

  try {
    // Si es el inicio absoluto (Piso 1), comienzas solo con 1 Pokémon inicial
    if (playerParty.length === 0 || floor === 1) {
      playerParty = [await fetchTowerPokemon(1)];
      pActiveIdx = 0;
      playerBag.potions = 3;
    }

    // Enemigos: 1 en el piso 1, 2 en el piso 2, y 3 de ahí en adelante
    const enemyCount = Math.min(3, Math.max(1, Math.floor(towerFloor / 2) + 1));
    const enemyPromises = [];
    for(let i=0; i < enemyCount; i++) enemyPromises.push(fetchTowerPokemon(towerFloor));
    enemyParty = await Promise.all(enemyPromises);
    eActiveIdx = 0;

    renderField();
    updateBalls();
    showCommandMenu('main');
    setDialog(`¡Un ${enemyParty[eActiveIdx].name.toUpperCase()} salvaje bloquea el camino!`);
    battleBusy = false;
  } catch(e) {
    setDialog('Error de red al invocar Pokémon.');
    battleBusy = false;
  }
}

function renderField() {
  const p = playerParty[pActiveIdx];
  const e = enemyParty[eActiveIdx];

  document.getElementById('p-name').innerText = p.name;
  document.getElementById('p-gender').innerText = p.gender;
  document.getElementById('p-sprite').src = p.sprite;
  updateHpBar('p', p);

  document.getElementById('e-name').innerText = e.name;
  document.getElementById('e-gender').innerText = e.gender;
  document.getElementById('e-sprite').src = e.sprite;
  updateHpBar('e', e);
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

function updateBalls() {
  const pContainer = document.getElementById('p-party-balls');
  pContainer.innerHTML = playerParty.map(p => `<div class="pkball ${p.hp <= 0 ? 'fainted' : ''}"></div>`).join('');

  const eContainer = document.getElementById('e-party-balls');
  eContainer.innerHTML = enemyParty.map(e => `<div class="pkball ${e.hp <= 0 ? 'fainted' : ''}"></div>`).join('');
}

function setDialog(txt) {
  document.getElementById('battle-dialog-txt').innerText = txt;
}

// Menús
const menuCommands = document.getElementById('menu-commands');
const menuMoves = document.getElementById('menu-moves');
const menuParty = document.getElementById('menu-party-switch');

function showCommandMenu(which) {
  menuCommands.style.display = 'none';
  menuMoves.style.display = 'none';
  menuParty.style.display = 'none';

  if (which === 'main') menuCommands.style.display = 'grid';
  if (which === 'moves') { renderMovesButtons(); menuMoves.style.display = 'block'; }
  if (which === 'party') { renderPartySwitchList(); menuParty.style.display = 'block'; }
}

document.getElementById('cmd-fight-btn').addEventListener('click', () => { if (!battleBusy) showCommandMenu('moves'); });
document.getElementById('cmd-poke-btn').addEventListener('click', () => { if (!battleBusy) showCommandMenu('party'); });

// ABRIR MOCHILA (ITEMS)
document.getElementById('cmd-bag-btn').addEventListener('click', () => {
  if (battleBusy) return;
  const bagScreen = document.getElementById('bag-screen');
  const itemsBox = document.getElementById('bag-items-container');
  itemsBox.innerHTML = `
    <div style="background:#1F2937; padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <span>🧪 Poción (+60 HP) x${playerBag.potions}</span>
      <button class="retro-btn" id="use-potion-btn" ${playerBag.potions <= 0 ? 'disabled' : ''}>USAR</button>
    </div>
  `;
  bagScreen.style.display = 'flex';

  document.getElementById('use-potion-btn').onclick = () => {
    if (playerBag.potions > 0) {
      playerBag.potions--;
      const p = playerParty[pActiveIdx];
      p.hp = Math.min(p.maxHp, p.hp + 60);
      updateHpBar('p', p);
      bagScreen.style.display = 'none';
      setDialog(`¡Usaste una Poción! ${p.name.toUpperCase()} recuperó 60 PS.`);
    }
  };
});

document.getElementById('close-bag-btn').addEventListener('click', () => {
  document.getElementById('bag-screen').style.display = 'none';
});

document.getElementById('cmd-run-btn').addEventListener('click', () => {
  setDialog('¡No puedes escapar en una expedición Roguelike!');
});

document.getElementById('cmd-back-move').addEventListener('click', () => showCommandMenu('main'));
document.getElementById('cmd-back-party').addEventListener('click', () => showCommandMenu('main'));

function renderMovesButtons() {
  const p = playerParty[pActiveIdx];
  const container = document.getElementById('moves-slots-container');
  container.innerHTML = '';

  p.moves.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className = 'atk-sub-btn';
    btn.innerHTML = `<div class="atk-sub-name">${m.name}</div><div class="atk-sub-meta"><span>POT ${m.power}</span><span>${m.type}</span></div>`;
    btn.onclick = () => doTowerTurn(idx);
    container.appendChild(btn);
  });
}

function renderPartySwitchList() {
  const container = document.getElementById('party-switch-container');
  container.innerHTML = '';

  playerParty.forEach((poke, idx) => {
    const row = document.createElement('div');
    row.className = `switch-poke-row ${poke.hp <= 0 ? 'fainted' : ''}`;
    row.innerHTML = `<span>${idx === pActiveIdx ? '▶ ' : ''}${poke.name.toUpperCase()}</span><span>${Math.max(0, poke.hp)}/${poke.maxHp} HP</span>`;
    if (poke.hp > 0 && idx !== pActiveIdx) {
      row.onclick = () => switchPlayerPokemon(idx);
    }
    container.appendChild(row);
  });
}

async function switchPlayerPokemon(newIdx) {
  battleBusy = true;
  showCommandMenu('main');
  pActiveIdx = newIdx;
  setDialog(`¡Adelante ${playerParty[pActiveIdx].name.toUpperCase()}!`);
  renderField();
  await sleep(800);

  const enemy = enemyParty[eActiveIdx];
  const eMove = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
  await attackStep(enemy, playerParty[pActiveIdx], eMove, 'e', 'p');
  checkFaintStatus();
  battleBusy = false;
}

// Combate
async function doTowerTurn(moveIdx) {
  if (battleBusy) return;
  battleBusy = true;
  showCommandMenu('main');

  const p = playerParty[pActiveIdx];
  const e = enemyParty[eActiveIdx];
  const pMove = p.moves[moveIdx];
  const eMove = e.moves[Math.floor(Math.random() * e.moves.length)];

  if (p.spe >= e.spe) {
    await attackStep(p, e, pMove, 'p', 'e');
    if (e.hp > 0) { await sleep(750); await attackStep(e, p, eMove, 'e', 'p'); }
  } else {
    await attackStep(e, p, eMove, 'e', 'p');
    if (p.hp > 0) { await sleep(750); await attackStep(p, e, pMove, 'p', 'e'); }
  }

  checkFaintStatus();
  battleBusy = false;
}

async function attackStep(atk, def, move, atkSide, defSide) {
  setDialog(`¡${atk.name.toUpperCase()} usó ${move.name.toUpperCase()}!`);

  const spriteAtk = document.getElementById(`${atkSide}-sprite`);
  spriteAtk.classList.add(atkSide === 'p' ? 'anim-atk-p' : 'anim-atk-e');
  setTimeout(() => spriteAtk.classList.remove('anim-atk-p', 'anim-atk-e'), 300);
  await sleep(350);

  const base = Math.floor((((2 * 50 / 5 + 2) * move.power * (atk.atk / def.def)) / 50) + 2);
  const dmg = Math.max(1, Math.floor(base * (Math.random() * 0.15 + 0.85)));
  def.hp -= dmg;

  const spriteDef = document.getElementById(`${defSide}-sprite`);
  spriteDef.classList.add('anim-shake');
  setTimeout(() => spriteDef.classList.remove('anim-shake'), 350);

  updateHpBar(defSide, def);
  setDialog(`¡Causó ${dmg} de daño!`);
  await sleep(650);
}

// Comprobar derrotas y recompensas Roguelike
async function checkFaintStatus() {
  updateBalls();
  const p = playerParty[pActiveIdx];
  const e = enemyParty[eActiveIdx];

  // Enemigo derrotado
  if (e.hp <= 0) {
    setDialog(`¡${e.name.toUpperCase()} salvaje cayó debilitado!`);
    await sleep(800);
    eActiveIdx++;

    if (eActiveIdx < enemyParty.length) {
      setDialog(`¡Aparece otro enemigo: ${enemyParty[eActiveIdx].name.toUpperCase()}!`);
      renderField();
      updateBalls();
    } else {
      // PISO LIMPIADO -> PANTALLA ROGUELIKE
      playVictory();
      await sleep(1000);
      showRoguelikeRewards();
      return;
    }
  }

  // Jugador derrotado
  if (p.hp <= 0) {
    setDialog(`¡${p.name.toUpperCase()} se debilitó!`);
    await sleep(800);
    const nextAlive = playerParty.findIndex(poke => poke.hp > 0);
    if (nextAlive !== -1) {
      pActiveIdx = nextAlive;
      setDialog(`¡Sal ${playerParty[pActiveIdx].name.toUpperCase()}!`);
      renderField();
      updateBalls();
    } else {
      setDialog(`¡Tu equipo ha sucumbido! Fin de la partida en el Piso ${towerFloor}.`);
    }
  }
}

// ========================================================
// SISTEMA DE RECOMPENSAS ROGUELIKE (CAPTURAR O SOLTAR)
// ========================================================
async function showRoguelikeRewards() {
  const modal = document.getElementById('rogue-reward-screen');
  const container = document.getElementById('rewards-options-container');
  container.innerHTML = '<p>Buscando recompensas...</p>';
  modal.style.display = 'flex';

  const newPokemonCandidate = await fetchTowerPokemon(towerFloor);

  container.innerHTML = `
    <!-- OPCIÓN 1: RECLUTAR NUEVO POKÉMON -->
    <div class="reward-choice-card" id="reward-recruit-btn">
      <span style="color:#10B981; font-size:0.75rem; font-weight:700;">RECLUTAR POKÉMON</span>
      <img src="${newPokemonCandidate.sprite}" />
      <strong>${newPokemonCandidate.name.toUpperCase()}</strong>
      <span style="font-size:0.75rem; color:#94A3B8;">HP: ${newPokemonCandidate.maxHp} | ATK: ${newPokemonCandidate.atk}</span>
      <small style="margin-top:6px; color:#F59E0B;">(Equipo actual: ${playerParty.length}/3)</small>
    </div>

    <!-- OPCIÓN 2: SUMINISTROS (POCIONES Y CURA) -->
    <div class="reward-choice-card" id="reward-supplies-btn">
      <span style="color:#3B82F6; font-size:0.75rem; font-weight:700;">SUMINISTROS</span>
      <div style="font-size:2.5rem; margin:10px 0;">🧪</div>
      <strong>+2 POCIONES & CURA</strong>
      <span style="font-size:0.75rem; color:#94A3B8;">Restaura 50% de PS a tu equipo</span>
    </div>
  `;

  // Opción Reclutar
  document.getElementById('reward-recruit-btn').onclick = () => {
    if (playerParty.length < 3) {
      playerParty.push(newPokemonCandidate);
      advanceNextFloor();
    } else {
      // El equipo ya tiene 3: debe elegir a quién reemplazar
      showSwapScreen(newPokemonCandidate);
    }
  };

  // Opción Pociones
  document.getElementById('reward-supplies-btn').onclick = () => {
    playerBag.potions += 2;
    playerParty.forEach(poke => poke.hp = Math.min(poke.maxHp, poke.hp + Math.floor(poke.maxHp * 0.5)));
    advanceNextFloor();
  };
}

// Pantalla para reemplazar si ya tienes 3
function showSwapScreen(candidate) {
  const container = document.getElementById('rewards-options-container');
  container.innerHTML = `
    <div style="grid-column: 1 / -1;">
      <p style="color:#EF4444; font-weight:700; margin-bottom:10px;">¡Tu equipo ya tiene 3 miembros! Elige a quién soltar:</p>
      ${playerParty.map((p, i) => `
        <button class="retro-btn" style="display:block; width:100%; margin-bottom:6px; padding:8px;" onclick="replacePokemon(${i}, '${encodeURIComponent(JSON.stringify(candidate))}')">
          Reemplazar a ${p.name.toUpperCase()} (HP: ${p.hp}/${p.maxHp})
        </button>
      `).join('')}
      <button class="cancel-move-btn" onclick="advanceNextFloor()" style="margin-top:6px;">Descartar nuevo Pokémon</button>
    </div>
  `;
}

window.replacePokemon = function(index, candidateJson) {
  const newPoke = JSON.parse(decodeURIComponent(candidateJson));
  playerParty[index] = newPoke;
  advanceNextFloor();
};

function advanceNextFloor() {
  initTowerMatch(towerFloor + 1);
}

document.getElementById('tower-restart-btn').addEventListener('click', () => {
  playerParty = [];
  initTowerMatch(1);
});

// Generar 1 Pokémon de combate
async function fetchTowerPokemon(boostFloor = 1) {
  const randId = Math.floor(Math.random() * 1020) + 1;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randId}`);
  const d = await res.json();
  const hpBase = d.stats[0].base_stat * 2 + 50 + (boostFloor * 5);
  const types = d.types.map(t => t.type.name);

  return {
    name: d.name,
    gender: Math.random() > 0.5 ? '♂' : '♀',
    types: types,
    maxHp: hpBase,
    hp: hpBase,
    atk: Math.max(d.stats[1].base_stat, d.stats[3].base_stat) + (boostFloor * 2),
    def: Math.max(d.stats[2].base_stat, d.stats[4].base_stat) + (boostFloor * 2),
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

// Iniciar Combate en la Torre
async function initTowerMatch(floor = 1) {
  towerFloor = floor;
  document.getElementById('tower-floor-txt').innerText = `PISO ${towerFloor} / 10`;
  document.getElementById('tower-enemy-title').innerText = `RIVAL: ${TOWER_RANKS[Math.min(towerFloor - 1, TOWER_RANKS.length - 1)]}`;
  setDialog(`¡Entrando al Piso ${towerFloor} de la Torre Rocket! Preparando combate 3 vs 3...`);
  battleBusy = true;

  try {
    // Si el jugador no tiene equipo o reinició, generamos 3 Pokémon para él
    if (playerParty.length === 0 || floor === 1) {
      playerParty = await Promise.all([fetchTowerPokemon(1), fetchTowerPokemon(1), fetchTowerPokemon(1)]);
      pActiveIdx = 0;
    } else {
      // Curación leve de recompensa entre pisos (+30% vida)
      playerParty.forEach(p => p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.35)));
      // Buscar primer pokemon vivo
      pActiveIdx = playerParty.findIndex(p => p.hp > 0);
      if (pActiveIdx === -1) pActiveIdx = 0;
    }

    // Equipo del rival escalado según el piso
    enemyParty = await Promise.all([
      fetchTowerPokemon(towerFloor),
      fetchTowerPokemon(towerFloor),
      fetchTowerPokemon(towerFloor)
    ]);
    eActiveIdx = 0;

    renderField();
    updateBalls();
    showCommandMenu('main');
    setDialog(`¡El ${TOWER_RANKS[towerFloor - 1]} envía a ${enemyParty[eActiveIdx].name.toUpperCase()}!`);
    battleBusy = false;
  } catch(e) {
    setDialog('Error de red al conectar con PokéAPI. Pulsa Reiniciar Torre.');
    battleBusy = false;
  }
}

function renderField() {
  const p = playerParty[pActiveIdx];
  const e = enemyParty[eActiveIdx];

  // Jugador
  document.getElementById('p-name').innerText = p.name;
  document.getElementById('p-gender').innerText = p.gender;
  document.getElementById('p-sprite').src = p.sprite;
  updateHpBar('p', p);

  // Rival
  document.getElementById('e-name').innerText = e.name;
  document.getElementById('e-gender').innerText = e.gender;
  document.getElementById('e-sprite').src = e.sprite;
  updateHpBar('e', e);
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

function updateBalls() {
  const pBalls = document.querySelectorAll('#p-party-balls .pkball');
  playerParty.forEach((p, i) => {
    if (p.hp <= 0) pBalls[i].classList.add('fainted');
    else pBalls[i].classList.remove('fainted');
  });

  const eBalls = document.querySelectorAll('#e-party-balls .pkball');
  enemyParty.forEach((e, i) => {
    if (e.hp <= 0) eBalls[i].classList.add('fainted');
    else eBalls[i].classList.remove('fainted');
  });
}

function setDialog(txt) {
  document.getElementById('battle-dialog-txt').innerText = txt;
}

// Menús de la consola
const menuCommands = document.getElementById('menu-commands');
const menuMoves = document.getElementById('menu-moves');
const menuParty = document.getElementById('menu-party-switch');

function showCommandMenu(which) {
  menuCommands.style.display = 'none';
  menuMoves.style.display = 'none';
  menuParty.style.display = 'none';

  if (which === 'main') menuCommands.style.display = 'grid';
  if (which === 'moves') {
    renderMovesButtons();
    menuMoves.style.display = 'block';
  }
  if (which === 'party') {
    renderPartySwitchList();
    menuParty.style.display = 'block';
  }
}

// Botones del menú principal
document.getElementById('cmd-fight-btn').addEventListener('click', () => {
  if (battleBusy) return;
  playClick();
  showCommandMenu('moves');
});

document.getElementById('cmd-poke-btn').addEventListener('click', () => {
  if (battleBusy) return;
  playClick();
  showCommandMenu('party');
});

document.getElementById('cmd-bag-btn').addEventListener('click', () => {
  playClick();
  setDialog('¡La bolsa está bloqueada bajo las reglas de la Torre Rocket!');
});

document.getElementById('cmd-run-btn').addEventListener('click', () => {
  playClick();
  setDialog('¡No puedes huir de un combate oficial en la Torre Rocket!');
});

document.getElementById('cmd-back-move').addEventListener('click', () => { playClick(); showCommandMenu('main'); });
document.getElementById('cmd-back-party').addEventListener('click', () => { playClick(); showCommandMenu('main'); });

// Render ataques
function renderMovesButtons() {
  const p = playerParty[pActiveIdx];
  const container = document.getElementById('moves-slots-container');
  container.innerHTML = '';

  p.moves.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className = 'atk-sub-btn';
    btn.innerHTML = `
      <div class="atk-sub-name">${m.name}</div>
      <div class="atk-sub-meta">
        <span>POT ${m.power}</span>
        <span style="text-transform:uppercase;">${m.type}</span>
      </div>
    `;
    btn.onclick = () => doTowerTurn(idx);
    container.appendChild(btn);
  });
}

// Render lista de cambio
function renderPartySwitchList() {
  const container = document.getElementById('party-switch-container');
  container.innerHTML = '';

  playerParty.forEach((poke, idx) => {
    const row = document.createElement('div');
    row.className = `switch-poke-row ${poke.hp <= 0 ? 'fainted' : ''}`;
    row.innerHTML = `
      <span>${idx === pActiveIdx ? '▶ ' : ''}${poke.name.toUpperCase()}</span>
      <span>${Math.max(0, poke.hp)}/${poke.maxHp} HP</span>
    `;
    if (poke.hp > 0 && idx !== pActiveIdx) {
      row.onclick = () => switchPlayerPokemon(idx);
    }
    container.appendChild(row);
  });
}

async function switchPlayerPokemon(newIdx) {
  playClick();
  battleBusy = true;
  showCommandMenu('main');
  pActiveIdx = newIdx;
  setDialog(`¡Adelante ${playerParty[pActiveIdx].name.toUpperCase()}!`);
  renderField();
  await sleep(900);

  // El enemigo aprovecha el turno de cambio para atacar
  const enemy = enemyParty[eActiveIdx];
  const eMove = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
  await attackStep(enemy, playerParty[pActiveIdx], eMove, 'e', 'p');
  
  checkFaintStatus();
  battleBusy = false;
}

// Turno de Pelea
async function doTowerTurn(moveIdx) {
  if (battleBusy) return;
  battleBusy = true;
  showCommandMenu('main');

  const p = playerParty[pActiveIdx];
  const e = enemyParty[eActiveIdx];
  const pMove = p.moves[moveIdx];
  const eMove = e.moves[Math.floor(Math.random() * e.moves.length)];

  const playerFirst = p.spe >= e.spe;

  if (playerFirst) {
    await attackStep(p, e, pMove, 'p', 'e');
    if (e.hp > 0) {
      await sleep(800);
      await attackStep(e, p, eMove, 'e', 'p');
    }
  } else {
    await attackStep(e, p, eMove, 'e', 'p');
    if (p.hp > 0) {
      await sleep(800);
      await attackStep(p, e, pMove, 'p', 'e');
    }
  }

  checkFaintStatus();
  battleBusy = false;
}

async function attackStep(atk, def, move, atkSide, defSide) {
  setDialog(`¡${atk.name.toUpperCase()} usó ${move.name.toUpperCase()}!`);

  const spriteAtk = document.getElementById(`${atkSide}-sprite`);
  spriteAtk.classList.add(atkSide === 'p' ? 'anim-atk-p' : 'anim-atk-e');
  setTimeout(() => spriteAtk.classList.remove('anim-atk-p', 'anim-atk-e'), 300);

  await sleep(350);

  let mult = 1;
  if (TYPE_CHART[move.type] && TYPE_CHART[move.type][def.types[0]]) {
    mult = TYPE_CHART[move.type][def.types[0]];
  }

  const base = Math.floor((((2 * 50 / 5 + 2) * move.power * (atk.atk / def.def)) / 50) + 2);
  const dmg = Math.max(1, Math.floor(base * mult * (Math.random() * 0.15 + 0.85)));

  def.hp -= dmg;

  const spriteDef = document.getElementById(`${defSide}-sprite`);
  spriteDef.classList.add('anim-shake');
  setTimeout(() => spriteDef.classList.remove('anim-shake'), 350);

  updateHpBar(defSide, def);

  if (mult > 1) { playBeep(650, 'square', 0.2); setDialog(`¡Es súper eficaz! Infligió ${dmg} de daño.`); }
  else if (mult < 1 && mult > 0) { playBeep(200, 'sawtooth', 0.1); setDialog(`No es muy eficaz... Infligió ${dmg} de daño.`); }
  else { playBeep(200, 'sawtooth', 0.1); setDialog(`Causó ${dmg} de daño.`); }
  await sleep(700);
}

// Verificación de K.O. y Avance de Piso
async function checkFaintStatus() {
  updateBalls();
  const p = playerParty[pActiveIdx];
  const e = enemyParty[eActiveIdx];

  // K.O. Enemigo
  if (e.hp <= 0) {
    playBeep(120, 'triangle', 0.3);
    setDialog(`¡El ${e.name.toUpperCase()} rival se debilitó!`);
    await sleep(900);

    eActiveIdx++;
    if (eActiveIdx < enemyParty.length) {
      // Siguiente Pokémon enemigo
      setDialog(`¡El rival envía a su siguiente Pokémon: ${enemyParty[eActiveIdx].name.toUpperCase()}!`);
      renderField();
      updateBalls();
    } else {
      // PISO SUPERADO
      playVictory();
      if (towerFloor >= 10) {
        setDialog('¡VICTORIA TOTAL! ¡Has conquistado los 10 pisos de la Torre y derrotado a Giovanni!');
      } else {
        setDialog(`¡PISO ${towerFloor} SUPERADO! Subiendo al siguiente piso...`);
        await sleep(1500);
        initTowerMatch(towerFloor + 1);
      }
      return;
    }
  }

  // K.O. Jugador
  if (p.hp <= 0) {
    playBeep(100, 'sawtooth', 0.4);
    setDialog(`¡${p.name.toUpperCase()} se debilitó!`);
    await sleep(900);

    const nextAlive = playerParty.findIndex(poke => poke.hp > 0);
    if (nextAlive !== -1) {
      pActiveIdx = nextAlive;
      setDialog(`¡Adelante ${playerParty[pActiveIdx].name.toUpperCase()}!`);
      renderField();
      updateBalls();
    } else {
      setDialog(`¡Todo tu equipo ha sido derrotado! Fin del asalto en el Piso ${towerFloor}.`);
    }
  }
}

document.getElementById('tower-restart-btn').addEventListener('click', () => {
  playClick();
  playerParty = [];
  initTowerMatch(1);
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ========================================================
// GENERADOR DE EQUIPOS (OPTIMIZACIÓN INSTANTÁNEA)
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

// DESCARGA PARALELA INMEDIATA
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
    
    // IDs al azar en memoria (0 milisegundos)
    const randomIds = [];
    for (let i = 0; i < unlockedIdxs.length; i++) {
      const r = Math.floor(Math.random() * pool.length);
      randomIds.push(pool.splice(r, 1)[0]);
    }

    // Petición múltiple concurrente (Descarga ultrarrápida)
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
