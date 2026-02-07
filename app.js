'use strict';

/**
 * Guía visual para cambio de cuerdas (Musicala)
 * - Flujo: guitarra -> terminación -> puente -> pasos
 * - Assets reales (según tu estructura):
 *   assets/img/ballend.png
 *   assets/img/loopend.png
 *   assets/img/tieend.png
 *   assets/img/pines.png
 *   assets/img/puentestrat.png
 *   assets/img/logo.png
 *
 * Nota: Aún no tienes imágenes "step-*.png", así que este JS usa fallbacks
 * a las imágenes existentes para que SIEMPRE haya algo visible.
 */

// =============================================================================
// Helpers
// =============================================================================
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const STORAGE_KEY = 'musicala_strings_guide_v1';

function escapeHtml(str){
  return String(str ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function clampBool(x){ return !!x; }

// =============================================================================
// State
// =============================================================================
const state = {
  guitar: null, // acustica | electrica | nose
  end: null,    // ball | loop | tie
  bridge: null, // pin | tremolo | otro (en tu index actual)
  checks: {},   // stepId -> boolean
};

// =============================================================================
// DOM
// =============================================================================
const views = {
  start:  $('#viewStart'),
  bridge: $('#viewBridge'),
  steps:  $('#viewSteps'),
};

const pillGuitar = $('#pillGuitar strong');
const pillEnd    = $('#pillEnd strong');
const pillBridge = $('#pillBridge strong');

const stepsList  = $('#stepsList');
const errorsList = $('#errorsList');
const stepsHint  = $('#stepsHint');

const tutorialPane = $('#tutorialPane');
const errorsPane   = $('#errorsPane');

// =============================================================================
// Labels
// =============================================================================
const labels = {
  guitar: {
    acustica: 'Acústica',
    electrica: 'Eléctrica',
    nose: 'No sé',
  },
  end: {
    ball: 'Ball end (bola)',
    loop: 'Loop end (lazo)',
    tie:  'Tie end (amarre)',
  },
  bridge: {
    pin:     'Acústico con pines',
    tremolo: 'Trémolo (Strat)',
    otro:    'Otro / No sé',
  }
};

// =============================================================================
// Imagenes base (las que SÍ tienes)
// =============================================================================
const IMG = {
  ball:   'assets/img/ballend.png',
  loop:   'assets/img/loopend.png',
  tie:    'assets/img/tieend.png',
  pin:    'assets/img/pines.png',
  strat:  'assets/img/puentestrat.png',
};

// Fallback visual por paso (mientras no existan step-*.png)
function stepImgFor(kind){
  // "kind" es un string tipo 'prep','anchor','wind'...
  // devolvemos algo que tenga sentido y exista
  if (kind.includes('anchor')) {
    if (state.bridge === 'pin') return IMG.pin;
    if (state.bridge === 'tremolo') return IMG.strat;
    return state.end === 'tie' ? IMG.tie : IMG.ball;
  }
  if (kind.includes('end')) return state.end === 'loop' ? IMG.loop : (state.end === 'tie' ? IMG.tie : IMG.ball);
  if (kind.includes('bridge')) return state.bridge === 'pin' ? IMG.pin : (state.bridge === 'tremolo' ? IMG.strat : IMG.ball);
  // default:
  return state.end === 'tie' ? IMG.tie : IMG.ball;
}

// =============================================================================
// Contenido (pasos + errores)
// =============================================================================
function getContent(s) {
  const warnings = [];

  // Validaciones suaves (no bloquean, solo advierten)
  if (!s.end) warnings.push('Te falta elegir el tipo de terminación (ball/loop/tie).');
  if (!s.bridge) warnings.push('Te falta identificar el puente (pines/strat/otro).');

  // Reglas “anti-ruta absurda”
  if (s.end === 'tie' && s.bridge && s.bridge !== 'otro') {
    // Ojo: tie end normalmente es clásico, pero tu app está enfocada acústica/eléctrica
    warnings.push('Elegiste Tie end (amarre). Eso es más típico de guitarra clásica. Igual te muestro la guía de amarre.');
  }

  const hintParts = [];
  if (warnings.length) hintParts.push('⚠️ ' + warnings.join(' '));
  hintParts.push(`Ruta: ${labels.guitar[s.guitar] ?? '—'} · ${labels.end[s.end] ?? '—'} · ${labels.bridge[s.bridge] ?? '—'}`);
  const hint = hintParts.join('  |  ');

  // Pasos base (sirven para casi todo)
  const common = [
    step('prep', 'Prepárate (sin drama)', 'Ten a mano: afinador, corta alambre (si tienes) y un paño. Cambia una cuerda a la vez para no perder tensión y referencia.', stepImgFor('prep')),
    step('loosen', 'Afloja y retira la cuerda vieja', 'Baja la tensión girando la clavija. Cuando esté floja, desenrolla y retírala con calma.', stepImgFor('loosen')),
  ];

  // Anclaje según puente/terminación
  const anchor = [];

  // Puente acústico con pines
  if (s.bridge === 'pin') {
    if (s.end === 'ball' || s.end === 'loop' || !s.end) {
      anchor.push(step(
        'anchor-pin',
        'Ancla en puente con pines',
        'Inserta la cuerda en el agujero, mete el pin y hala suave para que el ball end quede asentado. Si el pin se sube, es porque la bola no “sentó” abajo.',
        IMG.pin,
        ['Tip: hala suave la cuerda mientras empujas el pin.']
      ));
    } else if (s.end === 'tie') {
      anchor.push(step(
        'anchor-tie-on-pin',
        'Tie end + puente con pines (caso raro)',
        'Si tu cuerda no tiene bola y tu puente es de pines, probablemente estás usando el tipo de cuerda incorrecto. Revisa el empaque. Igual: necesitas un anclaje (bola o adaptador).',
        IMG.pin,
        ['Recomendación: usa cuerdas con Ball end para puente con pines.']
      ));
    }
  }

  // Puente Strat / trémolo
  else if (s.bridge === 'tremolo') {
    if (s.end === 'ball' || s.end === 'loop' || !s.end) {
      anchor.push(step(
        'anchor-strat',
        'Ancla en puente tipo Strat',
        'Pasa la cuerda por el bloque/puente (normalmente entra por atrás). Verifica que el ball end quedó fijo antes de enrollar en la clavija.',
        IMG.strat,
        ['Tip: si no asienta, empuja desde el lado de atrás y hala suave.']
      ));
    } else if (s.end === 'tie') {
      anchor.push(step(
        'anchor-tie-on-strat',
        'Tie end + Strat (caso raro)',
        'En Strat casi siempre se usa Ball end. Si tu cuerda es tie end, revisa: puede ser cuerda para clásica. No es lo normal aquí.',
        IMG.strat,
        ['Recomendación: usa Ball end para eléctrica.']
      ));
    }
  }

  // Otro / no sé
  else {
    if (s.end === 'tie') {
      anchor.push(step(
        'anchor-tie',
        'Amarre (Tie end)',
        'Pasa la cuerda por el bloque del puente y haz el amarre: 2–3 vueltas en cuerdas delgadas. La idea es que la cuerda se “muerda” a sí misma para que no se deslice.',
        IMG.tie,
        ['Tip: el amarre debe apretar la cuerda, no rayar el puente.']
      ));
    } else {
      anchor.push(step(
        'anchor-generic',
        'Anclaje general',
        'Tu objetivo es simple: que el final de la cuerda quede fijo (bola o lazo) y no se deslice cuando empieces a tensar. Si no estás seguro del puente, mira si la cuerda entra por atrás o se engancha.',
        stepImgFor('anchor-generic'),
        ['Tip: antes de enrollar, confirma que ya quedó firme en el puente.']
      ));
    }
  }

  // Enrollado y afinación (común)
  const winding = [
    step('measure', 'Deja la holgura correcta', 'Antes de enrollar, deja una holgura razonable: pocas vueltas se zafa, demasiadas vueltas se vuelve inestable. Un punto medio. 😉', stepImgFor('measure')),
    step('thread', 'Pasa por el poste de la clavija', 'Pasa la cuerda por el agujero del poste y mantén tensión con la mano para que enrolle ordenado.', stepImgFor('thread')),
    step('wind', 'Enrolla ordenado', 'Haz que las vueltas bajen hacia la base del poste, sin cruzarse. Así la afinación se estabiliza mejor.', stepImgFor('wind')),
    step('tune', 'Afina progresivo', 'Sube a afinación poco a poco. Estira suave la cuerda (sin violencia) y vuelve a afinar 2–3 veces.', stepImgFor('tune')),
    step('trim', 'Corta sobrante (si aplica)', 'Cuando esté estable, corta el exceso dejando un poquito de seguridad. Si no tienes corta alambre, al menos dobla la punta para que no pinche.', stepImgFor('trim')),
  ];

  const errors = [
    err('El pin se sube (acústica)', 'Suele ser porque el ball end no quedó asentado abajo. Retira pin, empuja la cuerda más adentro y vuelve a poner el pin mientras halas suave.'),
    err('Vueltas cruzadas en la clavija', 'Cruzar vueltas hace que se desafine y a veces “salte”. Mantén tensión con la mano y guía el enrollado para que baje ordenado.'),
    err('Muy pocas / demasiadas vueltas', 'Muy pocas: se zafa. Demasiadas: se vuelve una resortera. Busca un punto medio y que quede limpio.'),
    err('Cortar antes de tiempo', 'Si cortas y te faltó holgura, te toca repetir. Primero estabiliza afinación, luego cortas.'),
    err('Subir afinación de golpe', 'Subir rápido aumenta riesgo de romper cuerda (sobre todo las agudas). Ve suave.'),
  ];

  const steps = [...common, ...anchor, ...winding];
  return { steps, errors, hint };
}

function step(id, title, text, img, tips = []) {
  return { id, title, text, img, tips };
}

function err(title, text) {
  return { title, text };
}

// =============================================================================
// Render
// =============================================================================
function setView(name) {
  Object.values(views).forEach(v => (v.hidden = true));
  views[name].hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePills() {
  pillGuitar.textContent = labels.guitar[state.guitar] ?? '—';
  pillEnd.textContent    = labels.end[state.end] ?? '—';
  pillBridge.textContent = labels.bridge[state.bridge] ?? '—';
}

function renderSteps() {
  const { steps, errors, hint } = getContent(state);
  if (stepsHint) stepsHint.textContent = hint;

  if (stepsList) {
    stepsList.innerHTML = steps.map(s => {
      const checked = clampBool(state.checks[s.id]);
      const tipsHtml = (s.tips || []).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join(' ');

      return `
        <li class="step">
          <img src="${s.img}" alt="${escapeHtml(s.title)}" loading="lazy"
               onerror="this.style.opacity=.35; this.alt='(Falta imagen)';" />
          <div class="stepBody">
            <div class="stepTitle">${escapeHtml(s.title)}</div>
            <p class="stepText">${escapeHtml(s.text)}</p>
            <div class="stepTools">
              <label class="check">
                <input type="checkbox" data-step="${escapeHtml(s.id)}" ${checked ? 'checked' : ''} />
                Listo
              </label>
              ${tipsHtml}
            </div>
          </div>
        </li>
      `;
    }).join('');
  }

  if (errorsList) {
    errorsList.innerHTML = errors.map(e => `
      <div class="err">
        <h3>${escapeHtml(e.title)}</h3>
        <p>${escapeHtml(e.text)}</p>
      </div>
    `).join('');
  }
}

// =============================================================================
// Persistencia
// =============================================================================
function saveState() {
  try {
    const data = {
      guitar: state.guitar,
      end: state.end,
      bridge: state.bridge,
      checks: state.checks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) { /* silencio dramático */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.guitar = data.guitar ?? null;
    state.end    = data.end ?? null;
    state.bridge = data.bridge ?? null;
    state.checks = data.checks ?? {};
  } catch (_) { /* si se rompe, se ignora */ }
}

function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

// =============================================================================
// UI Events
// =============================================================================
function setTab(tab) {
  const btns = $$('.segBtn');
  btns.forEach(b => {
    const isOn = b.dataset.tab === tab;
    b.classList.toggle('isOn', isOn);
    b.setAttribute('aria-selected', isOn ? 'true' : 'false');
  });

  const isTut = tab === 'tutorial';
  if (tutorialPane) tutorialPane.hidden = !isTut;
  if (errorsPane) errorsPane.hidden = isTut;
}

function softRequireBasics() {
  // No bloquea, solo ayuda a que no lleguen a steps con todo en blanco
  const missing = [];
  if (!state.end) missing.push('terminación');
  if (!state.bridge) missing.push('puente');

  if (!missing.length) return true;

  // Si hay aviso en hint, ya lo verán arriba. Además damos un alert corto (opcional).
  // Si no quieres alert, borra estas 2 líneas.
  alert(`Te falta elegir: ${missing.join(' y ')}. Igual puedes seguir, pero la guía será más genérica.`);
  return false;
}

function initChoices() {
  // Delegación para choices (más robusto si agregas más después)
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.choice');
    if (!btn) return;

    const set = btn.dataset.set;
    const value = btn.dataset.value;
    if (!set || !value) return;

    state[set] = value;

    // Auto sugerencias razonables
    // Si elige tie end y el puente está vacío, lo dejamos para que en "bridge" elija.
    // Si ya eligió bridge "pin" o "tremolo", no forzamos, pero la guía advierte.
    if (set === 'end' && value === 'tie' && !state.bridge) {
      // No forzamos bridge porque tu UI solo tiene pin/strat/otro,
      // pero sí es útil sugerir "otro" si no han escogido nada:
      state.bridge = 'otro';
    }

    updatePills();
    saveState();
  });
}

function initNav() {
  $('#btnGoBridge')?.addEventListener('click', () => {
    setView('bridge');
  });

  $('#btnBackStart')?.addEventListener('click', () => setView('start'));

  $('#btnGoSteps')?.addEventListener('click', () => {
    updatePills();
    softRequireBasics();
    renderSteps();
    setTab('tutorial');
    setView('steps');
    saveState();
  });

  $('#btnBackBridge')?.addEventListener('click', () => setView('bridge'));
  $('#btnBackBridge2')?.addEventListener('click', () => setView('bridge'));

  $('#btnHome')?.addEventListener('click', () => setView('start'));

  $('#btnReset')?.addEventListener('click', () => resetAll());

  $('#btnMarkAll')?.addEventListener('click', () => {
    const { steps } = getContent(state);
    steps.forEach(s => { state.checks[s.id] = true; });
    renderSteps();
    saveState();
  });
}

function initTabs() {
  $$('.segBtn').forEach(b => {
    b.addEventListener('click', () => setTab(b.dataset.tab));
  });
}

function initChecklist() {
  stepsList?.addEventListener('change', (ev) => {
    const input = ev.target;
    if (!(input instanceof HTMLInputElement)) return;
    const id = input.dataset.step;
    if (!id) return;
    state.checks[id] = input.checked;
    saveState();
  });
}

function resetAll(){
  state.guitar = null;
  state.end = null;
  state.bridge = null;
  state.checks = {};
  updatePills();
  clearState();
  setView('start');
}

// =============================================================================
// Boot
// =============================================================================
function boot(){
  loadState();
  updatePills();
  initChoices();
  initNav();
  initTabs();
  initChecklist();

  // Si ya hay selección guardada, dejamos al usuario donde estaba (opcional)
  // Por ahora los mando a inicio para no confundir.
  setView('start');
  setTab('tutorial');
}

boot();
