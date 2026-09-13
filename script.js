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
// ICONOS DE TIPOS VECTORIALES (SIN EMOJIS)
// ========================================================
const TYPE_SVG_ICONS = {
  fire: `<svg viewBox="0 0 24 24"><path d="M12 2c-.5 2-2 4-3 6-1.5 3-1 6 1 8.5 2 2.5 5 2.5 7 0 2-2.5 2.5-5.5 1-8.5-1-2-2.5-4-3-6-1 2-2 3-3 3s-2-1-3-3z"/></svg>`,
  water: `<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  grass: `<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.75C12 7.8 15 8 17 8z"/></svg>`,
  electric: `<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  normal: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`,
  ice: `<svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"/></svg>`,
  fighting: `<svg viewBox="0 0 24 24"><path d="M14 6l3 3-5 5-3-3 5-5zM4 18l5-5 3 3-5 5H4v-3z"/></svg>`,
  poison: `<svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5c0 2 1 3 2 4v4h6v-4c1-1 2-2 2-4a5 5 0 0 0-5-5z"/></svg>`,
  ground: `<svg viewBox="0 0 24 24"><path d="M2 18h20M5 14h14M8 10h8"/></svg>`,
  flying: `<svg viewBox="0 0 24 24"><path d="M3 15c4-6 14-8 18-2-5 0-8 3-10 6-3 0-6-2-8-4z"/></svg>`,
  psychic: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>`,
  bug: `<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="5"/><path d="M12 9V5M9 7l-2-2M15 7l2-2M4 13h3M17 13h3M5 18l3-1M19 18l-3-1"/></svg>`,
  rock: `<svg viewBox="0 0 24 24"><polygon points="12 3 21 8 18 19 6 19 3 8"/></svg>`,
  ghost: `<svg viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-8 8v11l4-2 4 2 4-2 4 2V10a8 8 0 0 0-8-8z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>`,
  dragon: `<svg viewBox="0 0 24 24"><path d="M4 15c4-4 8-3 11-1 2-3 5-3 6-3-2 5-6 7-8 10-4 1-7-2-9-6z"/></svg>`,
  steel: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>`,
  fairy: `<svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/></svg>`,
  dark: `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
};

function renderTypeBadge(type) {
  const icon = TYPE_SVG_ICONS[type] || TYPE_SVG_ICONS.normal;
  return `<span class="type-badge type-${type}">${icon} ${type}</span>`;
}

// ========================================================
// SISTEMA DE NAVEGACIÓN (TABS)
// ========================================================
const tabGen = document.getElementById('btn-tab-gen');
const tabRogue = document.getElementById('btn-tab-rogue');
const tabQuiz = document.getElementById('btn-tab-quiz');
const tabCasino = document.getElementById('btn-tab-casino');

const viewGen = document.getElementById('view-generator');
const viewRogue = document.getElementById('view-battle');
const viewQuiz = document.getElementById('view-quiz');
const viewCasino = document.getElementById('view-casino');

function setTab(tabName) {
  playClick();
  [tabGen, tabRogue, tabQuiz, tabCasino].forEach(b => b.classList.remove('active'));
  [viewGen, viewRogue, viewQuiz, viewCasino].forEach(v => v.classList.remove('active'));

  if (tabName === 'gen') {
    tabGen.classList.add('active');
    viewGen.classList.add('active');
    history.pushState("", document.title, window.location.pathname);
  } else if (tabName === 'rogue') {
    tabRogue.classList.add('active');
    viewRogue.classList.add('active');
    window.location.hash = 'rogue';
    initTowerMatch();
  } else if (tabName === 'quiz') {
    tabQuiz.classList.add('active');
    viewQuiz.classList.add('active');
    window.location.hash = 'quiz';
    initSilhouetteQuiz();
  } else if (tabName === 'casino') {
    tabCasino.classList.add('active');
    viewCasino.classList.add('active');
    window.location.hash = 'casino';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

tabGen.addEventListener('click', () => setTab('gen'));
tabRogue.addEventListener('click', () => setTab('rogue'));
tabQuiz.addEventListener('click', () => setTab('quiz'));
tabCasino.addEventListener('click', () => setTab('casino'));
document.getElementById('brand-logo').addEventListener('click', () => setTab('gen'));

if (window.location.hash === '#rogue') setTab('rogue');
if (window.location.hash === '#quiz') setTab('quiz');
if (window.location.hash === '#casino') setTab('casino');

// ========================================================
// MOTOR ROGUELIKE INFINITO (CON MUERTE PERMANENTE)
// ========================================================
let towerFloor = 1;
let playerParty = [];
let pActiveIdx = 0;
let enemyPokemon = null;
let battleBusy = false;

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const TYPE_CHART = {
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, flying: 2, ground: 0, electric: 0.5, grass: 0.5, dragon: 0.5 },
  normal: { rock: 0.5, steel: 0.5, ghost: 0 }
};

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

async function initTowerMatch() {
  document.getElementById('rogue-reward-screen').style.display = 'none';

  if (playerParty.length === 0 || towerFloor === 1) {
    towerFloor = 1;
    playerParty = [];
    pActiveIdx = 0;
    showStarterChoice();
    return;
  }

  loadNextFloorBattle();
}

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
      <div style="margin-top:4px;">${poke.types.map(t => renderTypeBadge(t)).join('')}</div>
    `;
    card.onclick = () => {
      playerParty = [poke];
      pActiveIdx = 0;
      modal.style.display = 'none';
      loadNextFloorBattle();
    };
    container.appendChild(card);
  });
}

async function loadNextFloorBattle() {
  document.getElementById('tower-floor-txt').innerText = `PISO ${towerFloor} (INFINITO)`;
  document.getElementById('tower-enemy-title').innerText = `CUEVA OSCURA - NIVEL ${towerFloor}`;
  setDialog(`Entrando al Piso ${towerFloor}...`);
  battleBusy = true;

  try {
    enemyPokemon = await fetchTowerPokemon(towerFloor);
    renderField();
    updateBalls();
    showCommandMenu('main');
    setDialog(`¡Un ${enemyPokemon.name.toUpperCase()} salvaje te ataca en el Piso ${towerFloor}!`);
    battleBusy = false;
  } catch(e) {
    setDialog("Error de red. Pulsa Reiniciar Partida.");
    battleBusy = false;
  }
}

function renderField() {
  const p = playerParty[pActiveIdx];

  document.getElementById('p-name').innerText = p.name;
  document.getElementById('p-gender').innerText = p.gender;
  document.getElementById('p-sprite').src = p.sprite;
  updateHpBar('p', p);

  document.getElementById('e-name').innerText = enemyPokemon.name;
  document.getElementById('e-gender').innerText = enemyPokemon.gender;
  document.getElementById('e-sprite').src = enemyPokemon.sprite;
  updateHpBar('e', enemyPokemon);
}

function updateHpBar(side, poke) {
  const pct = Math.max(0, Math.min(100, (poke.hp / poke.maxHp) * 100));
  const bar = document.getElementById(`${side}-hp-bar`);
  
  if (bar) {
    bar.style.width = pct + '%';
    if (pct > 50) bar.style.backgroundColor = '#22C55E';
    else if (pct > 20) bar.style.backgroundColor = '#F59E0B';
    else bar.style.backgroundColor = '#E11D48';
  }

  const cur = document.getElementById(`${side}-hp-current`);
  const max = document.getElementById(`${side}-hp-max`);
  if (cur && max) {
    cur.innerText = Math.max(0, poke.hp);
    max.innerText = poke.maxHp;
  }
}

function updateBalls() {
  const pContainer = document.getElementById('p-party-balls');
  if (pContainer) {
    pContainer.innerHTML = playerParty.map(p => 
      `<div class="pkball ${p.hp <= 0 ? 'fainted' : ''}" title="${p.name}"></div>`
    ).join('');
  }
}

function setDialog(txt) {
  document.getElementById('battle-dialog-txt').innerText = txt;
}

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

document.getElementById('cmd-fight-btn').addEventListener('click', () => { 
  if (!battleBusy && playerParty[pActiveIdx] && playerParty[pActiveIdx].hp > 0) showCommandMenu('moves'); 
});

document.getElementById('cmd-poke-btn').addEventListener('click', () => { 
  if (!battleBusy) showCommandMenu('party'); 
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
  battleBusy = true;
  showCommandMenu('main');
  pActiveIdx = newIdx;
  setDialog(`¡Adelante ${playerParty[pActiveIdx].name.toUpperCase()}!`);
  renderField();
  updateBalls();
  await sleep(800);

  const eMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
  await attackStep(enemyPokemon, playerParty[pActiveIdx], eMove, 'e', 'p');
  checkFaintStatus();
}

async function doTowerTurn(moveIdx) {
  const p = playerParty[pActiveIdx];
  if (battleBusy || p.hp <= 0 || enemyPokemon.hp <= 0) return;

  battleBusy = true;
  showCommandMenu('main');

  const pMove = p.moves[moveIdx];
  const eMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];

  try {
    if (p.spe >= enemyPokemon.spe) {
      await attackStep(p, enemyPokemon, pMove, 'p', 'e');
      if (enemyPokemon.hp > 0) {
        await sleep(700);
        await attackStep(enemyPokemon, p, eMove, 'e', 'p');
      }
    } else {
      await attackStep(enemyPokemon, p, eMove, 'e', 'p');
      if (p.hp > 0) {
        await sleep(700);
        await attackStep(p, enemyPokemon, pMove, 'p', 'e');
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    checkFaintStatus();
  }
}

async function attackStep(atk, def, move, atkSide, defSide) {
  setDialog(`¡${atk.name.toUpperCase()} usó ${move.name.toUpperCase()}!`);

  const spriteAtk = document.getElementById(`${atkSide}-sprite`);
  if (spriteAtk) {
    spriteAtk.classList.add(atkSide === 'p' ? 'anim-atk-p' : 'anim-atk-e');
    setTimeout(() => spriteAtk.classList.remove('anim-atk-p', 'anim-atk-e'), 300);
  }
  await sleep(400);

  let mult = 1;
  if (TYPE_CHART[move.type] && TYPE_CHART[move.type][def.types[0]]) {
    mult = TYPE_CHART[move.type][def.types[0]];
  }

  const base = Math.floor((((2 * 50 / 5 + 2) * move.power * (atk.atk / def.def)) / 50) + 2);
  const dmg = Math.max(12, Math.floor(base * mult * (Math.random() * 0.15 + 0.85)));

  def.hp = Math.max(0, def.hp - dmg);
  updateHpBar(defSide, def);

  const spriteDef = document.getElementById(`${defSide}-sprite`);
  if (spriteDef) {
    spriteDef.classList.add('anim-shake');
    setTimeout(() => spriteDef.classList.remove('anim-shake'), 350);
  }

  if (mult > 1) { playBeep(650, 'square', 0.2); setDialog(`¡Es súper eficaz! Infligió ${dmg} de daño.`); }
  else if (mult < 1 && mult > 0) { playBeep(200, 'sawtooth', 0.1); setDialog(`No es muy eficaz... Infligió ${dmg} de daño.`); }
  else { playBeep(200, 'sawtooth', 0.1); setDialog(`Infligió ${dmg} de daño.`); }
  await sleep(700);
}

// PERMADEATH (MUERTE PERMANENTE)
async function checkFaintStatus() {
  const p = playerParty[pActiveIdx];

  // 1. SI TU POKÉMON ACTIVO MUERE: ¡SE ELIMINA DEL EQUIPO PARA SIEMPRE!
  if (p && p.hp <= 0) {
    playBeep(100, 'sawtooth', 0.4);
    setDialog(`¡${p.name.toUpperCase()} ha caído y se ha perdido para siempre!`);
    playerParty.splice(pActiveIdx, 1);
    updateBalls();
    await sleep(1000);

    if (playerParty.length > 0) {
      pActiveIdx = 0;
      setDialog(`¡Solo te quedan ${playerParty.length} Pokémon! ¡Adelante ${playerParty[pActiveIdx].name.toUpperCase()}!`);
      renderField();
      updateBalls();
      battleBusy = false;
    } else {
      showGameOverScreen();
    }
    return;
  }

  // 2. SI EL RIVAL MUERE: VICTORIA DE PISO
  if (enemyPokemon.hp <= 0) {
    playVictory();
    setDialog(`¡El ${enemyPokemon.name.toUpperCase()} rival ha sido derrotado!`);
    await sleep(1000);
    showVictoryRewardDraft();
    return;
  }

  battleBusy = false;
}

function showGameOverScreen() {
  const modal = document.getElementById('rogue-reward-screen');
  const title = document.getElementById('reward-modal-title');
  const sub = document.getElementById('reward-modal-sub');
  const container = document.getElementById('rewards-options-container');

  title.innerText = "¡EXPEDICIÓN FALLIDA!";
  title.style.color = "#EF4444";
  sub.innerText = `Todos tus Pokémon murieron en el Piso ${towerFloor}. Al perder, la partida se reinicia desde el Piso 1.`;

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
  playerParty = [];
  pActiveIdx = 0;
  towerFloor = 1;
  initTowerMatch();
};

async function showVictoryRewardDraft() {
  const modal = document.getElementById('rogue-reward-screen');
  const title = document.getElementById('reward-modal-title');
  const sub = document.getElementById('reward-modal-sub');
  const container = document.getElementById('rewards-options-container');

  title.innerText = `¡PISO ${towerFloor} SUPERADO!`;
  title.style.color = "#F59E0B";
  sub.innerText = `Elige tu recompensa (Equipo: ${playerParty.length}/3 sobrevivientes):`;
  container.innerHTML = "<p>Buscando especímenes...</p>";
  modal.style.display = 'flex';

  const choices = await Promise.all([
    fetchTowerPokemon(towerFloor + 1),
    fetchTowerPokemon(towerFloor + 1),
    fetchTowerPokemon(towerFloor + 1)
  ]);

  container.innerHTML = '';

  choices.forEach((poke, idx) => {
    const card = document.createElement('div');
    card.className = 'reward-choice-card';
    card.innerHTML = `
      <span style="color:#10B981; font-size:0.75rem; font-weight:700;">OPCIÓN ${idx + 1}</span>
      <img src="${poke.sprite}" />
      <strong>${poke.name.toUpperCase()}</strong>
      <span style="font-size:0.75rem; color:#94A3B8;">HP: ${poke.maxHp} | ATK: ${poke.atk}</span>
      <small style="margin-top:6px; color:#38BDF8;">
        ${playerParty.length < 3 ? '+ Añadir al Equipo' : 'Reemplazar Miembro'}
      </small>
    `;
    card.onclick = () => {
      if (playerParty.length < 3) {
        playerParty.push(poke);
        advanceNextFloor();
      } else {
        showSwapScreen(poke);
      }
    };
    container.appendChild(card);
  });

  // Opción curar
  const healCard = document.createElement('div');
  healCard.className = 'reward-choice-card';
  healCard.style.borderColor = '#F59E0B';
  healCard.innerHTML = `
    <span style="color:#F59E0B; font-size:0.75rem; font-weight:700;">DESCANSAR</span>
    <div style="margin:10px 0;">
      <svg class="icon" style="width:36px; height:36px; color:#F59E0B;" viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/></svg>
    </div>
    <strong>CURAR EQUIPO</strong>
    <span style="font-size:0.75rem; color:#10B981;">Restaura 50% PS a todos</span>
  `;
  healCard.onclick = () => {
    playerParty.forEach(p => p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.5)));
    advanceNextFloor();
  };
  container.appendChild(healCard);
}

function showSwapScreen(newCandidate) {
  const container = document.getElementById('rewards-options-container');
  container.innerHTML = `
    <div style="grid-column: 1 / -1;">
      <p style="color:#EF4444; font-weight:700; margin-bottom:10px;">¡Tu equipo está lleno (3/3)! Elige a quién soltar:</p>
      ${playerParty.map((p, i) => `
        <button class="retro-btn" style="display:block; width:100%; margin-bottom:6px; padding:10px;" onclick="replacePokemon(${i}, '${encodeURIComponent(JSON.stringify(newCandidate))}')">
          Soltar a ${p.name.toUpperCase()} (HP: ${p.hp}/${p.maxHp})
        </button>
      `).join('')}
      <button class="cancel-move-btn" onclick="advanceNextFloor()" style="margin-top:8px;">Conservar mi equipo actual</button>
    </div>
  `;
}

window.replacePokemon = function(index, candidateJson) {
  const newPoke = JSON.parse(decodeURIComponent(candidateJson));
  playerParty[index] = newPoke;
  advanceNextFloor();
};

function advanceNextFloor() {
  towerFloor++;
  initTowerMatch(towerFloor);
}

document.getElementById('tower-restart-btn').addEventListener('click', restartEntireGame);

// ========================================================
// MINIJUEGO 1: ¿QUIÉN ES ESE POKÉMON? (SILUETA)
// ========================================================
let quizStreak = 0;
let quizBest = 0;
let currentQuizPokemon = null;
let quizBusy = false;

async function initSilhouetteQuiz() {
  if (quizBusy) return;
  quizBusy = true;
  const imgEl = document.getElementById('quiz-silhouette-img');
  const msgEl = document.getElementById('quiz-status-msg');
  const optionsEl = document.getElementById('quiz-options-container');

  msgEl.innerText = "Preparando silueta misteriosa...";
  imgEl.classList.remove('revealed');
  optionsEl.innerHTML = "";

  try {
    const correctId = Math.floor(Math.random() * 850) + 1;
    const wrongIds = [];
    while (wrongIds.length < 3) {
      const rId = Math.floor(Math.random() * 850) + 1;
      if (rId !== correctId && !wrongIds.includes(rId)) wrongIds.push(rId);
    }

    const [correctData, ...wrongDataList] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${correctId}`).then(r => r.json()),
      ...wrongIds.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()))
    ]);

    currentQuizPokemon = correctData;
    const sprite = correctData.sprites.other['official-artwork'].front_default || correctData.sprites.front_default;
    imgEl.src = sprite;

    const allChoices = [
      { name: correctData.name, isCorrect: true },
      ...wrongDataList.map(p => ({ name: p.name, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    optionsEl.innerHTML = "";
    allChoices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'quiz-btn';
      btn.innerText = choice.name.replace('-', ' ');
      btn.onclick = () => handleQuizAnswer(choice, btn);
      optionsEl.appendChild(btn);
    });

    msgEl.innerText = "¿Quién es ese Pokémon? ¡Elige la respuesta correcta!";
    playBeep(440, 'triangle', 0.15);
  } catch(e) {
    msgEl.innerText = "Error cargando silueta. Pulsa 'Siguiente Pokémon'.";
  } finally {
    quizBusy = false;
  }
}

async function handleQuizAnswer(choice, clickedBtn) {
  if (quizBusy) return;
  quizBusy = true;

  const imgEl = document.getElementById('quiz-silhouette-img');
  const msgEl = document.getElementById('quiz-status-msg');
  const allBtns = document.querySelectorAll('.quiz-btn');
  allBtns.forEach(b => b.disabled = true);

  imgEl.classList.add('revealed');

  if (choice.isCorrect) {
    clickedBtn.classList.add('correct');
    quizStreak++;
    if (quizStreak > quizBest) quizBest = quizStreak;
    document.getElementById('quiz-streak').innerText = quizStreak;
    document.getElementById('quiz-best').innerText = quizBest;
    playVictory();
    msgEl.innerText = `¡Correcto! ¡Es ${currentQuizPokemon.name.toUpperCase()}!`;
  } else {
    clickedBtn.classList.add('wrong');
    quizStreak = 0;
    document.getElementById('quiz-streak').innerText = 0;
    playBeep(120, 'sawtooth', 0.35);
    msgEl.innerText = `¡Incorrecto! Era ${currentQuizPokemon.name.toUpperCase()}.`;
    allBtns.forEach(b => {
      if (b.innerText.toLowerCase() === currentQuizPokemon.name.replace('-', ' ').toLowerCase()) {
        b.classList.add('correct');
      }
    });
  }

  quizBusy = false;
}

document.getElementById('btn-next-quiz').addEventListener('click', () => {
  playClick();
  initSilhouetteQuiz();
});

// ========================================================
// MINIJUEGO 2: CASINO ROCKET (SLOTS / TRAGAPERRAS)
// ========================================================
let casinoCoins = 150;
let currentBet = 10;
let spinningCasino = false;

const SLOT_SYMBOLS = [
  { id: 'rocket', label: 'R', mult: 25 },
  { id: 'seven', label: '7', mult: 15 },
  { id: 'ball', svg: TYPE_SVG_ICONS.normal, mult: 10 },
  { id: 'pikachu', svg: TYPE_SVG_ICONS.electric, mult: 8 },
  { id: 'voltorb', svg: TYPE_SVG_ICONS.poison, mult: 0 }
];

document.querySelectorAll('.bet-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playClick();
    document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentBet = parseInt(btn.getAttribute('data-bet'));
  });
});

document.getElementById('btn-spin').addEventListener('click', async () => {
  if (spinningCasino) return;
  if (casinoCoins < currentBet) {
    playBeep(100, 'sawtooth', 0.3);
    document.getElementById('casino-status-msg').innerText = "¡No tienes suficientes fichas! El Casino Rocket te presta 50 fichas.";
    casinoCoins += 50;
    document.getElementById('casino-coins').innerText = casinoCoins;
    return;
  }

  spinningCasino = true;
  casinoCoins -= currentBet;
  document.getElementById('casino-coins').innerText = casinoCoins;
  document.getElementById('casino-status-msg').innerText = "¡Los rodillos están girando...!";
  playBeep(330, 'square', 0.1);

  const reels = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3')
  ];

  reels.forEach(r => r.classList.add('spinning'));

  for (let i = 0; i < 8; i++) {
    playBeep(200 + (i * 40), 'triangle', 0.05);
    await sleep(90);
  }

  const finalSymbols = [
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
  ];

  reels.forEach((reel, idx) => {
    reel.classList.remove('spinning');
    const sym = finalSymbols[idx];
    reel.innerHTML = sym.svg 
      ? `<span class="reel-symbol">${sym.svg}</span>`
      : `<span class="reel-symbol" style="color:var(--rocket-red);">${sym.label}</span>`;
  });

  // Comprobar premio
  const [s1, s2, s3] = finalSymbols;
  const statusMsg = document.getElementById('casino-status-msg');

  if (s1.id === s2.id && s2.id === s3.id) {
    if (s1.id === 'voltorb') {
      playBeep(90, 'sawtooth', 0.5);
      statusMsg.innerText = "¡BOOM! ¡Triple Voltorb autodestrucción! No ganas nada.";
    } else {
      const win = currentBet * s1.mult;
      casinoCoins += win;
      playVictory();
      statusMsg.innerText = `¡JACKPOT! ¡Triple ${s1.id.toUpperCase()}! Ganaste ${win} fichas.`;
    }
  } else if (s1.id === s2.id || s2.id === s3.id || s1.id === s3.id) {
    const win = currentBet * 2;
    casinoCoins += win;
    playBeep(580, 'square', 0.15);
    statusMsg.innerText = `¡Par coincidente! Ganaste ${win} fichas.`;
  } else {
    statusMsg.innerText = "¡Mala suerte! Sigue intentándolo.";
  }

  document.getElementById('casino-coins').innerText = casinoCoins;
  spinningCasino = false;
});

// ========================================================
// GENERADOR DE EQUIPOS (ULTRARRÁPIDO)
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
  document.getElementById('stat-speedster-val').innerText = `${fastest.stats[5].base_stat} SPD`;
  document.getElementById('stat-mvp').innerText = strongest.name;
  document.getElementById('stat-mvp-val').innerText = `${Math.max(strongest.stats[1].base_stat, strongest.stats[3].base_stat)} ATK`;
  document.getElementById('stat-tank').innerText = tankest.name;
  document.getElementById('stat-tank-val').innerText = `${Math.max(tankest.stats[2].base_stat, tankest.stats[4].base_stat)} DEF`;
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
          <button class="mini-btn" onclick="rerollSingle(${idx})" title="Cambiar">
            <svg class="icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <button class="mini-btn ${slot.locked ? 'locked' : ''}" onclick="toggleLock(${idx})" title="Fijar">
            <svg class="icon" viewBox="0 0 24 24">${slot.locked ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}</svg>
          </button>
        </div>
      </div>
      <div class="poke-img-wrap" onclick="openDetails(${idx})">
        <img class="poke-img" src="${sprite}" alt="${p.name}" />
      </div>
      <h2 class="poke-name" onclick="openDetails(${idx})">${p.name}</h2>
      <div class="poke-types">${p.types.map(t => renderTypeBadge(t)).join('')}</div>
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
  document.getElementById('modal-poke-types').innerHTML = p.types.map(t => renderTypeBadge(t)).join('');
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
  const icon = document.getElementById('sound-icon');
  icon.innerHTML = soundEnabled 
    ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>'
    : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  playClick();
  const isDark = document.body.getAttribute('data-theme') === 'light';
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
});

generateFullTeam();
