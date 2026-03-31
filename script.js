// Runs immediately, before DOMContentLoaded
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark');
}

document.addEventListener('DOMContentLoaded', () => {

  // ===== HELPERS =====

  function parseTimeToSeconds(str) {
    // Handles "16:44.5" and "16:43.8 PR"
    const clean = str.replace(/[^\d:.]/g, '');
    const [min, sec] = clean.split(':');
    return parseFloat(min) * 60 + parseFloat(sec);
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = (totalSeconds % 60).toFixed(1).padStart(4, '0');
    return `${m}:${s}`;
  }

  function parseCardData(card) {
    const getField = (label) => {
      for (const p of card.querySelectorAll('p')) {
        if (p.textContent.includes(label))
          return p.textContent.replace(label, '').trim();
      }
      return '';
    };
    const timeRaw = getField('Time:');
    return {
      card,
      title:   card.querySelector('h2')?.textContent || '',
      date:    new Date(getField('Date:')),
      timeRaw,
      timeSec: parseTimeToSeconds(timeRaw),
      place:   parseInt(getField('Place:')) || 0,
      isPR:    timeRaw.includes('PR'),
    };
  }

  // ===== STATS BAR =====

  function buildStatsBar(data) {
    const times  = data.map(d => d.timeSec);
    const places = data.map(d => d.place);
    const best   = Math.min(...times);
    const avg    = places.reduce((a, b) => a + b, 0) / places.length;

    const stats = [
      { label: 'Races',       value: data.length },
      { label: 'Best Time',   value: formatTime(best) },
      { label: 'Avg Place',   value: avg.toFixed(1) },
      { label: 'Best Place',  value: Math.min(...places) },
    ];

    const bar = document.createElement('div');
    bar.id = 'stats-bar';
    bar.innerHTML = stats.map(s => `
      <div class="stat">
        <span class="stat-value">${s.value}</span>
        <span class="stat-label">${s.label}</span>
      </div>
    `).join('');

    document.querySelector('main').prepend(bar);
  }

  // ===== SORT & FILTER =====

  function buildControls(data) {
    const controls = document.createElement('div');
    controls.id = 'controls';
    controls.innerHTML = `
      <div class="control-group">
        <label for="sort-select">Sort by</label>
        <select id="sort-select">
          <option value="date-desc">Date (newest first)</option>
          <option value="date-asc">Date (oldest first)</option>
          <option value="time-asc">Time (fastest first)</option>
          <option value="time-desc">Time (slowest first)</option>
          <option value="place-asc">Place (best first)</option>
          <option value="place-desc">Place (worst first)</option>
        </select>
      </div>
      <div class="control-group">
        <label for="filter-input">Search meets</label>
        <input id="filter-input" type="text" placeholder="e.g. SEC, Portage…">
      </div>
    `;

    document.querySelector('main').prepend(controls);

    const select = document.getElementById('sort-select');
    const input  = document.getElementById('filter-input');
    const main   = document.querySelector('main');

    function applyControls() {
      const sortVal   = select.value;
      const filterVal = input.value.toLowerCase();

      let filtered = data.filter(d =>
        d.title.toLowerCase().includes(filterVal)
      );

      filtered.sort((a, b) => {
        switch (sortVal) {
          case 'date-desc':  return b.date - a.date;
          case 'date-asc':   return a.date - b.date;
          case 'time-asc':   return a.timeSec - b.timeSec;
          case 'time-desc':  return b.timeSec - a.timeSec;
          case 'place-asc':  return a.place - b.place;
          case 'place-desc': return b.place - a.place;
        }
      });

      // Hide all, then re-append in sorted order
      data.forEach(d => { d.card.hidden = true; });
      filtered.forEach(d => {
        d.card.hidden = false;
        main.appendChild(d.card);
      });
    }

    select.addEventListener('change', applyControls);
    input.addEventListener('input', applyControls);
  }

  // ===== DARK MODE TOGGLE =====

    function buildDarkModeToggle() {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.setAttribute('aria-label', 'Toggle dark mode');

        btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            btn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });

        document.querySelector('header').appendChild(btn);
    }

  // ===== INIT =====

  const data = Array.from(document.querySelectorAll('.card')).map(parseCardData);
  buildStatsBar(data);
  buildControls(data);
  buildDarkModeToggle();
});
