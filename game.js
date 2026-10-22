/*
 * UPRAV SI HRU: texty, otázky a odpovědi můžeš upravit přímo v tomto souboru.
 * Všechno v JavaScriptu je viditelné ve zdrojovém kódu veřejné stránky.
 */
const EVENT_DATE = '10. 11.';
// Datum používá pražské pásmo UTC+1. Heslo vyplň před publikováním; bude viditelné ve zdrojovém kódu.
const ACCESS_UNLOCK_AT = new Date('2026-11-08T20:00:00+01:00');
const EARLY_ACCESS_PASSWORD = 'Narozeniny_123';
const ACCESS_STORAGE_KEY = 'kajaNarozeninyAccess-v1';
const STORAGE_KEY = 'kajaNarozeninyProgress-v4';
const MAX_SCORE = 5; // Čtyři správné odpovědi + bonus za večerní check-in

const VALID_SCREENS = [
  'packing', 'brnoQuiz', 'destinationReveal', 'driveChoice', 'eveningPlan',
  'nightWait', 'nightCheckin', 'dayTwoLock', 'dayTwoMorning', 'snackReveal',
  'lunchQuiz', 'riverQuiz', 'dayTwoEvening', 'departureLock', 'departurePlan', 'finale',
];

function freshState() {
  return {
    screen: 'packing',
    score: 0,
    answered: [],
    checkinBonus: false,
    driveChoice: '',
    dinnerChoice: '',
    afternoonChoice: '',
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !VALID_SCREENS.includes(saved.screen)) return freshState();
    return {
      ...freshState(),
      screen: saved.screen,
      score: Math.max(0, Math.min(MAX_SCORE, Number(saved.score) || 0)),
      answered: Array.isArray(saved.answered) ? saved.answered.filter((id) => ['brno', 'snack', 'pizza', 'prygl'].includes(id)) : [],
      checkinBonus: Boolean(saved.checkinBonus),
      driveChoice: ['me', 'you', 'later'].includes(saved.driveChoice) ? saved.driveChoice : '',
      dinnerChoice: ['flank', 'order'].includes(saved.dinnerChoice) ? saved.dinnerChoice : '',
      afternoonChoice: ['prehrada', 'odpocinek', 'bolt'].includes(saved.afternoonChoice) ? saved.afternoonChoice : '',
    };
  } catch {
    return freshState();
  }
}

let state = loadState();
let selectedRating = 0;
let dayIdea = '';
const screen = document.querySelector('#screen');
const cardKicker = document.querySelector('#card-kicker');
const scoreView = document.querySelector('#score');
const scoreFill = document.querySelector('#score-fill');
const panelCaption = document.querySelector('#panel-caption');
const stepItems = [...document.querySelectorAll('.journey-step')];
const resetButton = document.querySelector('#reset-button');

function saveState() {
  try {
    // Jen postup a body, nikdy neukládáme její textové odpovědi ani osobní nápady.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      screen: state.screen,
      score: state.score,
      answered: state.answered,
      checkinBonus: state.checkinBonus,
      driveChoice: state.driveChoice,
      dinnerChoice: state.dinnerChoice,
      afternoonChoice: state.afternoonChoice,
    }));
  } catch { /* Stránka jde hrát i bez lokálního ukládání. */ }
}

function normalize(value) {
  return value.toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function phaseFor(screenName) {
  if (screenName === 'finale') return 4;
  if (['packing', 'brnoQuiz'].includes(screenName)) return 0;
  if (['destinationReveal', 'driveChoice', 'eveningPlan', 'nightWait', 'nightCheckin'].includes(screenName)) return 1;
  if (['dayTwoLock', 'dayTwoMorning', 'snackReveal', 'lunchQuiz', 'riverQuiz', 'dayTwoEvening'].includes(screenName)) return 2;
  return 3;
}

function getEventDay() {
  return EVENT_DATE.match(/^\s*(\d{1,2})\s*\./)?.[1] || '10';
}

function getEventMonth() {
  const month = Number(EVENT_DATE.match(/^\s*\d{1,2}\s*\.\s*(\d{1,2})/)?.[1] || 11);
  return new Intl.DateTimeFormat('cs-CZ', { month: 'long' })
    .format(new Date(2026, month - 1, 1)).toLocaleUpperCase('cs-CZ');
}

function renderProgress() {
  const phase = phaseFor(state.screen);
  scoreView.innerHTML = `${state.score} <small>/ ${MAX_SCORE} bodů</small>`;
  scoreFill.style.width = `${(state.score / MAX_SCORE) * 100}%`;
  panelCaption.textContent = state.score === MAX_SCORE
    ? 'Plný počet! Teď už jen užívat narozeninový výlet.'
    : 'Za čtyři správné odpovědi a večerní check-in můžeš nasbírat až pět bodů.';

  stepItems.forEach((item, index) => {
    const isCurrent = index === phase;
    const isDone = index < phase;
    item.classList.toggle('is-current', isCurrent);
    item.classList.toggle('is-done', isDone);
    item.querySelector('.step-mark').textContent = isDone ? '✓' : isCurrent ? '→' : '✦';
  });
  stepItems[2].querySelector('.step-name').textContent = EVENT_DATE || 'Druhý den';
}

function mount(kicker, markup) {
  cardKicker.textContent = kicker;
  screen.innerHTML = markup;
  screen.classList.remove('is-entering');
  void screen.offsetWidth;
  screen.classList.add('is-entering');
  renderProgress();
}

function go(screenName) {
  state.screen = screenName;
  saveState();
  render();
  document.querySelector('#game-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function celebrate() {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  const shapes = ['✦', '✳', '●', '▲'];
  for (let index = 0; index < 22; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.textContent = shapes[index % shapes.length];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty('--drift', `${Math.round(Math.random() * 160 - 80)}px`);
    piece.style.setProperty('--delay', `${Math.round(Math.random() * 260)}ms`);
    piece.style.setProperty('--spin', `${Math.round(Math.random() * 360)}deg`);
    layer.append(piece);
  }
  document.body.append(layer);
  window.setTimeout(() => layer.remove(), 2100);
}

function bindQuiz(formId, answerId, answers, nextScreen) {
  const form = screen.querySelector(`#${formId}`);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector('input');
    const feedback = screen.querySelector(`#${answerId}`);
    const answer = normalize(input.value);
    const isCorrect = answers.some((accepted) => normalize(accepted) === answer);
    if (!isCorrect) {
      feedback.textContent = 'Ještě to není ono. Zkus jinou odpověď nebo si vezmi nápovědu.';
      feedback.classList.remove('is-success');
      input.focus();
      return;
    }
    if (!state.answered.includes(form.dataset.question)) {
      state.answered.push(form.dataset.question);
      state.score = Math.min(MAX_SCORE, state.score + 1);
    }
    state.screen = nextScreen;
    saveState();
    render();
    celebrate();
  });
}

function bindHint(buttonId, hintId) {
  const button = screen.querySelector(`#${buttonId}`);
  const hint = screen.querySelector(`#${hintId}`);
  button.addEventListener('click', () => {
    const opening = hint.hidden;
    hint.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
    button.textContent = opening ? 'Schovat nápovědu' : 'Malá nápověda?';
  });
}

function selectChoice(selector, field) {
  screen.querySelectorAll(selector).forEach((button) => {
    button.addEventListener('click', () => {
      state[field] = button.dataset.choice;
      screen.querySelectorAll(selector).forEach((other) => {
        const selected = other === button;
        other.classList.toggle('is-selected', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      saveState();
      const note = screen.querySelector('.choice-feedback');
      if (note) note.textContent = field === 'dinnerChoice'
        ? (state[field] === 'flank' ? 'FLANK zní dobře.' : 'Jasně — vybereme nebo objednáme něco podle chuti.')
        : 'Platí. Když se nálada změní, upravíme plán.';
    });
  });
}

function renderPacking() {
  mount('NEJDŘÍV SI ZABAL', `
    <div class="screen-content packing-screen">
      <p class="screen-eyebrow">Důležitá příprava</p>
      <h2>Než vyrazíme…</h2>
      <p class="screen-copy">Zabal si pár věcí na malý výlet. Vím, že máš ráda, když se spolu hezky oblékneme, tak si přibal i něco pěkného na sebe.</p>
      <div class="packing-list" aria-label="Co si zabalit">
        <div class="packing-item"><span class="packing-icon" aria-hidden="true">♨</span><span><strong>Plavky</strong><small>Wellness volá.</small></span></div>
        <div class="packing-item"><span class="packing-icon" aria-hidden="true">♡</span><span><strong>Spodní prádlo na dva dny</strong><small>Pro jistotu celé balení.</small></span></div>
        <div class="packing-item"><span class="packing-icon" aria-hidden="true">⌁</span><span><strong>Podzimní fitík</strong><small>Na naši podzimní procházku.</small></span></div>
        <div class="packing-item"><span class="packing-icon" aria-hidden="true">✧</span><span><strong>Pěkný outfit na večeři</strong><small>Kdybychom někam vyrazili.</small></span></div>
        <div class="packing-item"><span class="packing-icon" aria-hidden="true">♢</span><span><strong>Podpatky</strong><small>Jestli budeš mít chuť.</small></span></div>
        <div class="packing-item playful-item"><span class="packing-icon" aria-hidden="true">✧</span><span><strong>Pěkné prádlo navíc</strong><small>Na večer.</small></span></div>
      </div>
      <div class="cosmetics-note"><span aria-hidden="true">✦</span><span>Kosmetiku můžeš nechat doma — základní věci budou čekat na hotelu.</span></div>
      <div class="pickup-note"><span class="pickup-icon" aria-hidden="true">↗</span><p>Po práci tě vyzvednu. Během dne ti dám vědět, kdy přesně. Zatím nevyzvídej. 😇</p></div>
      <button class="button-primary" id="packing-button" type="button">Dobře. Co je první stopa? <span aria-hidden="true">↗</span></button>
    </div>`);
  screen.querySelector('#packing-button').addEventListener('click', () => go('brnoQuiz'));
}

function renderBrnoQuiz() {
  mount('MISE 01 · PRVNÍ STOPA', `
    <div class="screen-content quiz-screen">
      <p class="screen-eyebrow">Odemkni naši destinaci <span class="point-tag">+1 bod</span></p>
      <h2>Kam jedeme?</h2>
      <p class="screen-copy">Je místo, kam jsme říkali, že jsme spolu ještě pořádně nebyli. A zároveň to bylo první místo, kam jsme spolu jeli po koupi našeho auta.</p>
      <form class="answer-form" id="brno-form" data-question="brno">
        <label class="visually-hidden" for="brno-answer">Tvoje odpověď</label>
        <input id="brno-answer" type="text" autocomplete="off" placeholder="Napiš město…" required>
        <button class="button-primary" type="submit">Odemknout <span aria-hidden="true">↗</span></button>
      </form>
      <button class="hint-button" id="brno-hint-button" type="button" aria-expanded="false">Malá nápověda?</button>
      <p class="hint-text" id="brno-hint" hidden>Začíná na B. A ze Slezska je to pěkný výlet.</p>
      <p class="answer-feedback" id="brno-feedback" role="status" aria-live="polite"></p>
    </div>`);
  bindHint('brno-hint-button', 'brno-hint');
  bindQuiz('brno-form', 'brno-feedback', ['Brno'], 'destinationReveal');
}

function renderDestinationReveal() {
  mount('MÍSTO ODEMČENO · MISE SPLNĚNA', `
    <div class="screen-content reveal-screen">
      <div class="unlock-badge" aria-hidden="true">✦</div>
      <p class="screen-eyebrow">Správně! Získáváš bod.</p>
      <h2>Brno. Hotel JeštěBrno.</h2>
      <p class="screen-copy">První místo, kam jsme spolu vyjeli po koupi auta, se teď stane základnou pro tenhle narozeninový výlet.</p>
      <div class="destination-stamp"><span aria-hidden="true">⌖</span><span>UBYTOVÁNÍ<br><strong>JEŠTĚBRNO</strong></span></div>
      <button class="button-primary" id="drive-question-button" type="button">Ještě jedna otázka… <span aria-hidden="true">↗</span></button>
    </div>`);
  screen.querySelector('#drive-question-button').addEventListener('click', () => go('driveChoice'));
}

function renderDriveChoice() {
  mount('OTÁZKA O CESTĚ · BEZ BODU', `
    <div class="screen-content drive-screen">
      <p class="screen-eyebrow">Už víš, kam jedeme</p>
      <h2>Chceš tentokrát řídit?</h2>
      <p class="screen-copy">Cesta do Brna může být taky součástí výletu. Vyber, co ti bude příjemnější.</p>
      <div class="choice-grid drive-choices" role="group" aria-label="Kdo bude řídit">
        <button class="choice-card" data-choice="me" type="button" aria-pressed="false"><span aria-hidden="true">🚗</span><strong>Chci řídit já</strong><small>Beru klíčky!</small></button>
        <button class="choice-card" data-choice="you" type="button" aria-pressed="false"><span aria-hidden="true">🎵</span><strong>Řiď ty</strong><small>Já vybírám hudbu.</small></button>
        <button class="choice-card drive-unsure" data-choice="later" type="button" aria-pressed="false"><span aria-hidden="true">☁</span><strong>Rozhodnu se později</strong><small>Uvidíme podle nálady.</small></button>
      </div>
      <p class="choice-feedback drive-feedback" role="status" aria-live="polite"></p>
      <button class="button-primary" id="drive-confirm" type="button" disabled>Potvrdit a ukázat večerní plán <span aria-hidden="true">↗</span></button>
    </div>`);

  const feedback = screen.querySelector('.drive-feedback');
  const confirmButton = screen.querySelector('#drive-confirm');
  screen.querySelectorAll('.drive-choices .choice-card').forEach((button) => {
    const selected = button.dataset.choice === state.driveChoice;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.addEventListener('click', () => {
      state.driveChoice = button.dataset.choice;
      saveState();
      screen.querySelectorAll('.drive-choices .choice-card').forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-selected', active);
        other.setAttribute('aria-pressed', String(active));
      });
      confirmButton.disabled = false;
      feedback.textContent = state.driveChoice === 'me'
        ? 'Tak to je jasné — volant je tvůj.'
        : state.driveChoice === 'you'
          ? 'Platí. Ty vybíráš hudbu.'
          : 'Fér. Rozhodneme se podle nálady a provozu.';
    });
  });
  confirmButton.disabled = !state.driveChoice;
  if (state.driveChoice) {
    feedback.textContent = state.driveChoice === 'me'
      ? 'Tak to je jasné — volant je tvůj.'
      : state.driveChoice === 'you'
        ? 'Platí. Ty vybíráš hudbu.'
        : 'Fér. Rozhodneme se podle nálady a provozu.';
  }
  confirmButton.addEventListener('click', () => { if (state.driveChoice) go('eveningPlan'); });
}

function renderEveningPlan() {
  mount('PRVNÍ VEČER · PO CESTĚ', `
    <div class="screen-content reveal-screen">
      <div class="unlock-badge" aria-hidden="true">✦</div>
      <p class="screen-eyebrow">Večerní plán je na světě</p>
      <h2>První večer v Brně.</h2>
      <p class="screen-copy">Ubytujeme se v JeštěBrně a pak už záleží hlavně na tom, na co budeš mít chuť.</p>
      <div class="itinerary-card first-night-card">
        <div class="itinerary-header"><span class="day-label">PRVNÍ VEČER</span><span class="day-spark" aria-hidden="true">✳</span></div>
        <div class="plan-row"><span class="plan-time">VEČEŘE</span><div><strong>FLANK?</strong><p>Mohli bychom zajít na večeři do <a href="https://www.flank.cz/jidlo/" target="_blank" rel="noopener noreferrer">FLANK</a>.</p></div></div>
        <div class="plan-row"><span class="plan-time">POTOM</span><div><strong>Podle tvé chuti</strong><p>Po návratu wellness, nebo si objednáme něco jiného, jestli dostaneš chuť.</p></div></div>
      </div>
      <p class="choice-prompt">Co tě láká víc?</p>
      <div class="choice-grid dinner-choices" role="group" aria-label="Vyber plán večeře">
        <button class="choice-card" data-choice="flank" type="button" aria-pressed="false"><span aria-hidden="true">🍽</span><strong>Večeře ve FLANK</strong><small>Pak wellness?</small></button>
        <button class="choice-card" data-choice="order" type="button" aria-pressed="false"><span aria-hidden="true">🥡</span><strong>Objednat něco jiného</strong><small>Necháme to na chuti.</small></button>
      </div>
      <p class="choice-feedback" role="status" aria-live="polite"></p>
      <div class="later-callout"><span aria-hidden="true">🌙</span><span>Další otázka počká až na večer, před spaním.</span></div>
      <button class="button-primary" id="evening-done" type="button">Uložit plán na večer <span aria-hidden="true">↗</span></button>
    </div>`);
  selectChoice('.dinner-choices .choice-card', 'dinnerChoice');
  screen.querySelectorAll('.dinner-choices .choice-card').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.choice === state.dinnerChoice);
    button.setAttribute('aria-pressed', String(button.dataset.choice === state.dinnerChoice));
  });
  screen.querySelector('#evening-done').addEventListener('click', () => go('nightWait'));
}

function renderNightWait() {
  mount('VEČERNÍ CHECK-IN · AŽ PŘED SPANÍM', `
    <div class="screen-content night-wait-screen">
      <div class="moon-art" aria-hidden="true">☾<span>✦</span></div>
      <p class="screen-eyebrow">Tohle si nech na později</p>
      <h2>Už jsme v posteli?</h2>
      <p class="screen-copy">Až bude první den za námi a budete se chystat spát, otevři si tuhle otázku. Teď už jen užívej večer.</p>
      <div class="later-callout"><span aria-hidden="true">🌙</span><span>Odpověz až před spaním: jaký byl tvůj první narozeninový den?</span></div>
      <button class="button-primary" id="open-checkin" type="button">Ano, jdeme spát <span aria-hidden="true">↗</span></button>
    </div>`);
  screen.querySelector('#open-checkin').addEventListener('click', () => go('nightCheckin'));
}

function renderNightCheckin() {
  selectedRating = 0;
  mount('MALÁ OTÁZKA PŘED SPANÍM', `
    <div class="screen-content checkin-screen">
      <p class="screen-eyebrow">Bez špatných odpovědí <span class="point-tag bonus-tag">+1 bonus</span></p>
      <h2>Jaký byl první den?</h2>
      <p class="screen-copy">Ohodnoť ho od jedné do pěti hvězdiček. Bonusový bod je za upřímnost, ne za vysoké hodnocení.</p>
      <form id="checkin-form" class="checkin-form">
        <fieldset class="rating-fieldset"><legend>Kolik hvězdiček si zasloužil?</legend>
          <div class="rating-row" role="group" aria-label="Hodnocení od jedné do pěti hvězdiček">
            <button class="rating-button" type="button" data-rating="1" aria-label="1 hvězdička" aria-pressed="false">★</button>
            <button class="rating-button" type="button" data-rating="2" aria-label="2 hvězdičky" aria-pressed="false">★</button>
            <button class="rating-button" type="button" data-rating="3" aria-label="3 hvězdičky" aria-pressed="false">★</button>
            <button class="rating-button" type="button" data-rating="4" aria-label="4 hvězdičky" aria-pressed="false">★</button>
            <button class="rating-button" type="button" data-rating="5" aria-label="5 hvězdiček" aria-pressed="false">★</button>
          </div>
        </fieldset>
        <label class="field-label" for="best-part">Co bylo zatím nejlepší? <small>(nepovinné)</small></label>
        <textarea id="best-part" rows="2" placeholder="Řekni mi to, jestli chceš…"></textarea>
        <button class="button-primary" type="submit">Uložit dnešní hodnocení <span aria-hidden="true">↗</span></button>
        <p class="answer-feedback" id="checkin-feedback" role="status" aria-live="polite"></p>
      </form>
    </div>`);

  screen.querySelectorAll('.rating-button').forEach((button) => {
    button.addEventListener('click', () => {
      selectedRating = Number(button.dataset.rating);
      screen.querySelectorAll('.rating-button').forEach((star) => {
        const active = Number(star.dataset.rating) <= selectedRating;
        star.classList.toggle('is-active', active);
        star.setAttribute('aria-pressed', String(star === button));
      });
    });
  });

  screen.querySelector('#checkin-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const feedback = screen.querySelector('#checkin-feedback');
    if (!selectedRating) {
      feedback.textContent = 'Nejdřív vyber počet hvězdiček.';
      return;
    }
    if (!state.checkinBonus) {
      state.checkinBonus = true;
      state.score = Math.min(MAX_SCORE, state.score + 1);
    }
    state.screen = 'dayTwoLock';
    saveState();
    render();
    celebrate();
  });
}

function renderDayTwoLock() {
  mount('DALŠÍ DEN · ZAMČENO DO RÁNA', `
    <div class="screen-content day-lock-screen">
      <div class="calendar-art" aria-hidden="true"><span>${getEventMonth()}</span><strong>${getEventDay()}</strong><i>✦</i></div>
      <p class="screen-eyebrow">Druhá část narozeninového dobrodružství</p>
      <h2>Program na ${EVENT_DATE || 'druhý den'}</h2>
      <p class="screen-copy">Snídaně, trochu pohybu, Brno a dobré jídlo. Co přesně? Otevři si plán až bude nový den.</p>
      <button class="button-primary" id="show-day-two" type="button">Zobrazit program ${EVENT_DATE || 'druhého dne'} <span aria-hidden="true">↗</span></button>
      <p class="quiet-caption">Večerní check-in uložen · +1 bonusový bod</p>
    </div>`);
  screen.querySelector('#show-day-two').addEventListener('click', () => go('dayTwoMorning'));
}

function renderDayTwoMorning() {
  mount(`${EVENT_DATE || 'DRUHÝ DEN'} · RÁNO A DOPOLEDNE`, `
    <div class="screen-content day-two-screen">
      <p class="screen-eyebrow">Druhý den · žádný spěch</p>
      <h2>Dobré ráno. Plán na druhý den.</h2>
      <div class="timeline">
        <div class="timeline-item"><span class="timeline-icon" aria-hidden="true">☕</span><div><strong>Snídaně na hotelu</strong><p>V klidu se najíme a vymyslíme, na co máme chuť.</p></div></div>
        <div class="timeline-item"><span class="timeline-icon" aria-hidden="true">✦</span><div><strong>Fitko, pokud se nám bude chtít</strong><p>Trocha pohybu a pak vyrazíme do centra.</p></div></div>
        <div class="timeline-item"><span class="timeline-icon" aria-hidden="true">⌖</span><div><strong>Procházka centrem Brna</strong><p>Mrkneme po městě a zastavíme se na kávu a něco malého v příjemné kavárně.</p></div></div>
      </div>
      <div class="quiz-inset">
        <p class="screen-eyebrow">Mise 02 <span class="point-tag">+1 bod</span></p>
        <h3>Kávová tipovačka</h3>
        <p>Jaká zatočená sladká dobrota se může hodit ke kávě?</p>
        <form class="answer-form compact-form" id="snack-form" data-question="snack">
          <label class="visually-hidden" for="snack-answer">Tvoje tipovaná odpověď</label>
          <input id="snack-answer" type="text" autocomplete="off" placeholder="Můj tip je…" required>
          <button class="button-primary" type="submit">Odpovědět <span aria-hidden="true">↗</span></button>
        </form>
        <button class="hint-button" id="snack-hint-button" type="button" aria-expanded="false">Malá nápověda?</button>
        <p class="hint-text" id="snack-hint" hidden>Je to sladký šnek se skořicí.</p>
        <p class="answer-feedback" id="snack-feedback" role="status" aria-live="polite"></p>
      </div>
    </div>`);
  bindHint('snack-hint-button', 'snack-hint');
  bindQuiz('snack-form', 'snack-feedback', ['skořicový šnek', 'skořicového šneka', 'šnek', 'cinnamon roll'], 'snackReveal');
}

function renderSnackReveal() {
  mount('SPRÁVNĚ · KÁVA A SKOŘICOVÝ ŠNEK', `
    <div class="screen-content reveal-screen">
      <div class="unlock-badge" aria-hidden="true">✳</div>
      <p class="screen-eyebrow">Další bod pro tebe!</p>
      <h2>Skořicový šnek ke kávě. ☕</h2>
      <p class="screen-copy">Na procházce centrem si dáme pauzu na kávu a něco dobrého. Teď už zbývá uhodnout oběd.</p>
      <button class="button-primary" id="lunch-quiz-button" type="button">Další otázka: co bude k obědu? <span aria-hidden="true">↗</span></button>
    </div>`);
  screen.querySelector('#lunch-quiz-button').addEventListener('click', () => go('lunchQuiz'));
}

function renderLunchQuiz() {
  mount('MISE 03 · TIPOVAČKA NA OBĚD', `
    <div class="screen-content quiz-screen">
      <p class="screen-eyebrow">Mysli na něco kulatého <span class="point-tag">+1 bod</span></p>
      <h2>Co si dáme k obědu?</h2>
      <p class="screen-copy">Po procházce a kávě přijde čas na něco vydatnějšího. Co myslíš, že bude na talíři?</p>
      <form class="answer-form" id="pizza-form" data-question="pizza">
        <label class="visually-hidden" for="pizza-answer">Tvoje tipovaná odpověď</label>
        <input id="pizza-answer" type="text" autocomplete="off" placeholder="Můj tip je…" required>
        <button class="button-primary" type="submit">Odpovědět <span aria-hidden="true">↗</span></button>
      </form>
      <button class="hint-button" id="pizza-hint-button" type="button" aria-expanded="false">Malá nápověda?</button>
      <p class="hint-text" id="pizza-hint" hidden>Těsto, rajčata, sýr a pec.</p>
      <p class="answer-feedback" id="pizza-feedback" role="status" aria-live="polite"></p>
    </div>`);
  bindHint('pizza-hint-button', 'pizza-hint');
  bindQuiz('pizza-form', 'pizza-feedback', ['pizza', 'pizzu'], 'riverQuiz');
}

function renderRiverQuiz() {
  mount('SPRÁVNĚ · PIZZA K OBĚDU', `
    <div class="screen-content quiz-screen">
      <p class="screen-eyebrow">Pizza odemčena! Teď ještě jedna stopa.</p>
      <h2>Jak jí říkají místní?</h2>
      <p class="screen-copy">Brněnská přehrada má přezdívku, kterou uslyšíš hlavně od místních. Jakou?</p>
      <form class="answer-form" id="prygl-form" data-question="prygl">
        <label class="visually-hidden" for="prygl-answer">Přezdívka brněnské přehrady</label>
        <input id="prygl-answer" type="text" autocomplete="off" placeholder="Místní jí říkají…" required>
        <button class="button-primary" type="submit">Odpovědět <span aria-hidden="true">↗</span></button>
      </form>
      <button class="hint-button" id="prygl-hint-button" type="button" aria-expanded="false">Malá nápověda?</button>
      <p class="hint-text" id="prygl-hint" hidden>Začíná na P a má pět písmen.</p>
      <p class="answer-feedback" id="prygl-feedback" role="status" aria-live="polite"></p>
    </div>`);
  bindHint('prygl-hint-button', 'prygl-hint');
  bindQuiz('prygl-form', 'prygl-feedback', ['Prýgl'], 'dayTwoEvening');
}

function renderDayTwoEvening() {
  mount('PIZZA ODEMČENA · ODPOLEDNE SI VYBÍRÁŠ', `
    <div class="screen-content reveal-screen">
      <div class="unlock-badge" aria-hidden="true">✳</div>
      <p class="screen-eyebrow">Přehradu už znáš. Další bod je tvůj!</p>
      <h2>Pizza a potom podle tebe.</h2>
      <p class="screen-copy">Po obědě už je program hlavně na tobě. Vyber si, co by ti udělalo radost — klidně se rozhodneme až na místě.</p>
      <p class="choice-prompt">Co by tě po obědě lákalo?</p>
      <div class="choice-grid afternoon-choices" role="group" aria-label="Odpolední možnosti">
        <button class="choice-card" data-choice="prehrada" type="button" aria-pressed="false"><span aria-hidden="true">🌊</span><strong>Přehrada a káva</strong><small>Procházka u vody.</small></button>
        <button class="choice-card" data-choice="odpocinek" type="button" aria-pressed="false"><span aria-hidden="true">☁</span><strong>Odpočinek</strong><small>Zpátky na hotel.</small></button>
        <button class="choice-card" data-choice="bolt" type="button" aria-pressed="false"><span aria-hidden="true">🚲</span><strong>Chvilku Bolt Food</strong><small>Jestli tě to láká.</small></button>
      </div>
      <p class="choice-feedback" role="status" aria-live="polite"></p>
      <div class="itinerary-card evening-card">
        <div class="itinerary-header"><span class="day-label">VEČER · PODLE NÁLADY</span><span class="day-spark" aria-hidden="true">✦</span></div>
        <div class="plan-row"><span class="plan-time">VEČEŘE</span><div><strong>Sushi na objednávku</strong><p>Vybereme sushi, které bude mít otevřeno a na které dostaneme chuť.</p></div></div>
        <div class="plan-row"><span class="plan-time">POTOM</span><div><strong>Wellness a klidný večer</strong><p>Po večeři wellness, zbytek večera bez pevného plánu.</p></div></div>
      </div>
      <button class="button-primary" id="departure-button" type="button">A co den odjezdu? <span aria-hidden="true">↗</span></button>
    </div>`);
  selectChoice('.afternoon-choices .choice-card', 'afternoonChoice');
  screen.querySelectorAll('.afternoon-choices .choice-card').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.choice === state.afternoonChoice);
    button.setAttribute('aria-pressed', String(button.dataset.choice === state.afternoonChoice));
  });
  screen.querySelector('#departure-button').addEventListener('click', () => go('departureLock'));
}

function renderDepartureLock() {
  mount('POSLEDNÍ ETAPA · PROGRAM ZAMČEN', `
    <div class="screen-content day-lock-screen departure-lock-screen">
      <div class="calendar-art departure-art" aria-hidden="true"><span>DEN</span><strong>03</strong><i>↗</i></div>
      <p class="screen-eyebrow">Před odjezdem</p>
      <h2>Ještě jedna zastávka.</h2>
      <p class="screen-copy">Snídaně, případně trochu pohybu a pak volný program. Otevři si celý plán, až budeš chtít.</p>
      <button class="button-primary" id="show-departure-plan" type="button">Zobrazit program dne odjezdu <span aria-hidden="true">↗</span></button>
    </div>`);
  screen.querySelector('#show-departure-plan').addEventListener('click', () => go('departurePlan'));
}

function renderDeparturePlan() {
  mount('POSLEDNÍ DEN · VOLNÝ PLÁN', `
    <div class="screen-content departure-plan-screen">
      <div class="unlock-badge" aria-hidden="true">03</div>
      <p class="screen-eyebrow">Poslední ráno v Brně</p>
      <h2>Volnější den odjezdu.</h2>
      <div class="timeline departure-timeline">
        <div class="timeline-item"><span class="timeline-icon" aria-hidden="true">☕</span><div><strong>Nejdřív snídaně</strong><p>Klidně znovu na hotelu, ať nikam nespěcháme.</p></div></div>
        <div class="timeline-item"><span class="timeline-icon" aria-hidden="true">✦</span><div><strong>Form Factory?</strong><p>Fitko jen pokud budeme mít chuť — žádná povinnost.</p></div></div>
        <div class="timeline-item"><span class="timeline-icon" aria-hidden="true">♡</span><div><strong>Pak něco podle nálady</strong><p>Procházka, další káva, nebo tvůj vlastní nápad.</p></div></div>
      </div>
      <form class="idea-form" id="idea-form">
        <label class="field-label" for="day-idea">Co by sis chtěla vymyslet ty? <small>(klidně nechej prázdné)</small></label>
        <div class="idea-input-row"><input id="day-idea" type="text" maxlength="120" placeholder="Třeba procházka nebo další kavárna…"><button class="button-secondary" type="submit">Mám nápad</button></div>
        <p class="idea-feedback" id="idea-feedback" role="status" aria-live="polite"></p>
      </form>
      <button class="button-primary" id="finish-button" type="button">Dokončit plán <span aria-hidden="true">↗</span></button>
    </div>`);

  screen.querySelector('#idea-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = screen.querySelector('#day-idea');
    const feedback = screen.querySelector('#idea-feedback');
    dayIdea = input.value.trim();
    feedback.textContent = dayIdea
      ? `Beru na vědomí: „${dayIdea}“. Řekni mi to ráno a plán přizpůsobíme.`
      : 'V pohodě. Ráno se rozhodneme podle nálady.';
    if (dayIdea) input.value = '';
  });
  screen.querySelector('#finish-button').addEventListener('click', () => go('finale'));
}

function renderFinale() {
  mount('SPIS UZAVŘEN · MISE SPLNĚNA', `
    <div class="screen-content finale-screen">
      <div class="finale-mark" aria-hidden="true">✳</div>
      <p class="screen-eyebrow">Všechno nejlepší k dvacítce!</p>
      <h2>Mise splněna.</h2>
      <p class="screen-copy">Brno, dobré jídlo a program podle počasí i nálady. Zbytek doladíme průběžně.</p>
      <div class="final-score"><strong>${state.score}</strong><span>z ${MAX_SCORE} bodů<br><small>plán připraven</small></span></div>
      <p class="final-message">Tak dobrou cestu a příjemný výlet.</p>
      <button class="button-secondary" id="restart-button" type="button">Zahrát si znovu</button>
    </div>`);
  screen.querySelector('#restart-button').addEventListener('click', resetGame);
}

function render() {
  renderProgress();
  switch (state.screen) {
    case 'packing': renderPacking(); break;
    case 'brnoQuiz': renderBrnoQuiz(); break;
    case 'destinationReveal': renderDestinationReveal(); break;
    case 'driveChoice': renderDriveChoice(); break;
    case 'eveningPlan': renderEveningPlan(); break;
    case 'nightWait': renderNightWait(); break;
    case 'nightCheckin': renderNightCheckin(); break;
    case 'dayTwoLock': renderDayTwoLock(); break;
    case 'dayTwoMorning': renderDayTwoMorning(); break;
    case 'snackReveal': renderSnackReveal(); break;
    case 'lunchQuiz': renderLunchQuiz(); break;
    case 'riverQuiz': renderRiverQuiz(); break;
    case 'dayTwoEvening': renderDayTwoEvening(); break;
    case 'departureLock': renderDepartureLock(); break;
    case 'departurePlan': renderDeparturePlan(); break;
    case 'finale': renderFinale(); break;
    default: state = freshState(); saveState(); renderPacking();
  }
}

function resetGame() {
  if (!window.confirm('Vrátit narozeninovou hru úplně na začátek? Smažou se body a postup v tomto prohlížeči.')) return;
  state = freshState();
  selectedRating = 0;
  dayIdea = '';
  saveState();
  render();
  document.querySelector('#game-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const accessGate = document.querySelector('#access-gate');
const gameContent = document.querySelector('#game-content');
const earlyAccessForm = document.querySelector('#early-access-form');
const earlyAccessInput = document.querySelector('#early-access-password');
const gateFeedback = document.querySelector('#gate-feedback');
let countdownInterval;

function showGame() {
  accessGate.hidden = true;
  gameContent.hidden = false;
  window.clearInterval(countdownInterval);
  try { localStorage.setItem(ACCESS_STORAGE_KEY, 'unlocked'); } catch { /* Stránka funguje i bez úložiště. */ }
  resetButton.addEventListener('click', resetGame);
  render();
}

function updateCountdown() {
  const remaining = ACCESS_UNLOCK_AT.getTime() - Date.now();
  if (remaining <= 0) {
    showGame();
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  document.querySelector('#count-days').textContent = String(Math.floor(totalSeconds / 86400)).padStart(2, '0');
  document.querySelector('#count-hours').textContent = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0');
  document.querySelector('#count-minutes').textContent = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  document.querySelector('#count-seconds').textContent = String(totalSeconds % 60).padStart(2, '0');
}

function initializeAccessGate() {
  let alreadyUnlocked = false;
  try { alreadyUnlocked = localStorage.getItem(ACCESS_STORAGE_KEY) === 'unlocked'; } catch { /* Pokračuj bez úložiště. */ }
  if (alreadyUnlocked || Date.now() >= ACCESS_UNLOCK_AT.getTime()) {
    showGame();
    return;
  }

  earlyAccessForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!EARLY_ACCESS_PASSWORD) {
      gateFeedback.textContent = 'Předčasný vstup ještě není nastavený. V souboru game.js doplň heslo do EARLY_ACCESS_PASSWORD.';
      return;
    }
    if (earlyAccessInput.value !== EARLY_ACCESS_PASSWORD) {
      gateFeedback.textContent = 'Tohle heslo nesedí. Zkus to ještě jednou.';
      earlyAccessInput.select();
      return;
    }
    gateFeedback.textContent = '';
    showGame();
  });

  updateCountdown();
  countdownInterval = window.setInterval(updateCountdown, 1000);
}

initializeAccessGate();
