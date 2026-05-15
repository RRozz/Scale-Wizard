(function(){

  // ── Guitar tuning (string 0 = low E, 5 = high E) ────────────
  const OPEN_NOTES   = [4, 11, 7, 2, 9, 4]; // e B G D A E  (note index 0-11)
  const STRING_NAMES = ['e₄', 'B₃', 'G₃', 'D₃', 'A₂', 'E₂'];
  const FRET_COUNT   = 12; // frets 0-12 (open + 12)
  const MARKER_FRETS = new Set([3, 5, 7, 9, 12]);
  const DOUBLE_FRETS = new Set([12]);

  // ── State ────────────────────────────────────────────────────
  const selectedFrets = new Set();  // "string-fret" keys
  let   searchResults = null;       // persists across hide/show

  // ── Helpers ─────────────────────────────────────────────────
  function fretNote(stringIdx, fret){
    return (OPEN_NOTES[stringIdx] + fret) % 12;
  }
  function getSelectedNotes(){
    const notes = new Set();
    for(const key of selectedFrets){
      const [s,f] = key.split('-').map(Number);
      notes.add(fretNote(s, f));
    }
    return [...notes];
  }
  function splitScaleName(full){
    // "C# Natural Minor" → root="C#", name="Natural Minor"
    const parts = full.split(' ');
    if(parts[0] === '--') return { root:'', name: full };
    // root may be "C#" or "C"
    const hasSharp = parts[0].endsWith('#') && parts[0].length === 2;
    const root = hasSharp ? parts[0] : parts[0];
    const name = parts.slice(1).join(' ');
    return { root, name };
  }

  // ── Build HTML ───────────────────────────────────────────────
  function buildPanel(){
    const c = document.getElementById('reverseFinderContainer');
    c.innerHTML = '';

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'rfBackdrop';
    backdrop.onclick = hideReverseFinder;
    c.appendChild(backdrop);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'rfPanel';
    panel.innerHTML = `
      <div id="rfHeader">
        <div id="rfTitle">Reverse Scale Finder</div>
        <button id="rfCloseBtn" title="Close">✕</button>
      </div>
      <div id="rfInstruction">
        SELECT FRETS ON THE BOARD → CLICK SEARCH TO IDENTIFY MATCHING SCALES
      </div>
      <div id="rfFretboardWrap">
        <div id="rfFretboard"></div>
        <div id="rfInlayRow"></div>
      </div>
      <div id="rfNotesBar">
        <div id="rfNotesLabel">Notes:</div>
        <div id="rfNotePills"><span id="rfNoneLabel">none selected</span></div>
      </div>
      <div id="rfControls">
        <button class="rf-btn rf-btn-search" id="rfSearchBtn">⬡ Search</button>
        <button class="rf-btn rf-btn-clear"  id="rfClearBtn">Clear All</button>
        <div class="rf-count-badge" id="rfCountBadge"></div>
      </div>
      <div id="rfResults">
        <div id="rfResultsPlaceholder">Select notes on the fretboard above,<br>then click SEARCH to find matching scales.</div>
        <div id="rfResultsHeader" style="display:none">
          Matching Scales <span id="rfResultCount">0</span>
        </div>
        <ul id="rfResultsList"></ul>
      </div>
      <div id="rfFooter">Scale Wizard · Reverse Finder</div>
    `;
    c.appendChild(panel);

    // Wire close button
    panel.querySelector('#rfCloseBtn').onclick = hideReverseFinder;

    // Build fretboard
    buildFretboard();

    // Wire controls
    panel.querySelector('#rfSearchBtn').onclick = doSearch;
    panel.querySelector('#rfClearBtn').onclick  = clearAll;

    // Restore previous state
    restoreState();
  }

  function buildFretboard(){
    const fb = document.getElementById('rfFretboard');
    fb.innerHTML = '';

    // Row 0: fret number labels
    const emptyCorner = document.createElement('div'); // top-left corner
    fb.appendChild(emptyCorner);
    for(let f = 0; f <= FRET_COUNT; f++){
      const label = document.createElement('div');
      label.className = 'rf-fret-num' +
        (f === 0 ? ' rf-nut-label' : '') +
        (MARKER_FRETS.has(f) ? ' rf-marker-label' : '');
      label.textContent = f === 0 ? 'nut' : f;
      fb.appendChild(label);
    }

    // Rows 1-6: strings (low E at top = index 0)
    for(let s = 0; s <= 5; s++){
      // String label
      const lbl = document.createElement('div');
      lbl.className = 'rf-string-label';
      lbl.textContent = STRING_NAMES[s];
      fb.appendChild(lbl);

      // Fret cells
      for(let f = 0; f <= FRET_COUNT; f++){
        const cell = document.createElement('div');
        cell.className = 'rf-cell' + (f === 0 ? ' rf-nut-cell' : '');
        cell.dataset.s = s;
        cell.dataset.f = f;

        const dot = document.createElement('div');
        dot.className = 'rf-dot';
        dot.textContent = noteNames[fretNote(s, f)];
        cell.appendChild(dot);

        cell.onclick = () => toggleFret(s, f);
        fb.appendChild(cell);
      }
    }

    // Inlay dots row (below fretboard)
    const inlayRow = document.getElementById('rfInlayRow');
    inlayRow.style.cssText = `
      display: grid;
      grid-template-columns: 36px repeat(13, 1fr);
      min-width: 560px;
      margin-top: 4px;
    `;
    inlayRow.innerHTML = '';
    inlayRow.appendChild(document.createElement('div')); // spacer
    for(let f = 0; f <= FRET_COUNT; f++){
      const cell = document.createElement('div');
      cell.className = 'rf-marker-row';
      if(MARKER_FRETS.has(f)){
        if(DOUBLE_FRETS.has(f)){
          // Double dot at 12
          const wrap = document.createElement('div');
          wrap.style.cssText = 'display:flex;gap:4px;align-items:center;justify-content:center;';
          wrap.innerHTML = '<div class="rf-inlay"></div><div class="rf-inlay"></div>';
          cell.appendChild(wrap);
        } else {
          const dot = document.createElement('div');
          dot.className = 'rf-inlay';
          cell.appendChild(dot);
        }
      }
      inlayRow.appendChild(cell);
    }
  }

  // ── Toggle a fret cell ───────────────────────────────────────
  function toggleFret(s, f){
    const key = `${s}-${f}`;
    if(selectedFrets.has(key)){
      selectedFrets.delete(key);
    } else {
      selectedFrets.add(key);
    }
    refreshFretboard();
    refreshNotesBar();
    refreshSearchBtn();
  }

  function clearAll(){
    selectedFrets.clear();
    refreshFretboard();
    refreshNotesBar();
    refreshSearchBtn();
  }

  // ── Refresh visuals ──────────────────────────────────────────
  function refreshFretboard(){
    document.querySelectorAll('.rf-cell').forEach(cell => {
      const key = `${cell.dataset.s}-${cell.dataset.f}`;
      cell.classList.toggle('rf-selected', selectedFrets.has(key));
    });
  }

  function refreshNotesBar(){
    const pills = document.getElementById('rfNotePills');
    const notes = getSelectedNotes();
    if(notes.length === 0){
      pills.innerHTML = '<span id="rfNoneLabel">none selected</span>';
    } else {
      // Sort notes chromatically for display
      const sorted = [...notes].sort((a,b) => a - b);
      pills.innerHTML = sorted
        .map(n => `<div class="rf-pill">${noteNames[n]}</div>`)
        .join('');
    }
    const badge = document.getElementById('rfCountBadge');
    badge.textContent = notes.length > 0
      ? `${notes.length} unique note${notes.length > 1 ? 's' : ''} selected`
      : '';
  }

  function refreshSearchBtn(){
    const btn = document.getElementById('rfSearchBtn');
    btn.disabled = selectedFrets.size === 0;
  }

  // ── Search ───────────────────────────────────────────────────
  function doSearch(){
    const noteSet = getSelectedNotes();
    if(noteSet.length === 0) return;

    searchResults = listContainingScales(noteSet);
	
	// censor Chromatic scales; not really helpful here
	var curIdx = 0;
	while(curIdx < searchResults.length){
		if(searchResults[0].indexOf("Chromatic") >= 0){
			searchResults.splice(curIdx, 1);
			continue;
		}
		curIdx++;
	}
	
    renderResults();
  }

  function renderResults(){
    if(searchResults === null) return;

    const placeholder = document.getElementById('rfResultsPlaceholder');
    const header      = document.getElementById('rfResultsHeader');
    const list        = document.getElementById('rfResultsList');
    const countEl     = document.getElementById('rfResultCount');

    placeholder.style.display = 'none';
    header.style.display = 'flex';

    const validResults = searchResults.filter(r => r !== '-- NO MATCHES --');
    countEl.textContent = validResults.length || 0;

    list.innerHTML = '';

    if(validResults.length === 0){
      list.innerHTML = '<li class="rf-no-match">No scales found for these notes.</li>';
      return;
    }

    validResults.forEach((scaleName, idx) => {
      const { root, name } = splitScaleName(scaleName);
      const li = document.createElement('li');
      li.className = 'rf-result-item';
      li.style.animationDelay = `${idx * 30}ms`;
      li.innerHTML = `
        <div class="rf-result-root">${root}</div>
        <div class="rf-result-name">${name}</div>
        <div class="rf-result-arrow">›</div>
      `;
      li.onclick = () => onScaleResultSelected(scaleName);
      list.appendChild(li);
    });
  }

  // ── Restore state after re-build ─────────────────────────────
  function restoreState(){
    if(selectedFrets.size > 0){
      refreshFretboard();
      refreshNotesBar();
    }
    refreshSearchBtn();
    if(searchResults !== null) renderResults();
  }

  // ── Public API ───────────────────────────────────────────────
  window.showReverseFinder = function(){
    const c = document.getElementById('reverseFinderContainer');
    // Build only on first call (or if cleared)
    if(!document.getElementById('rfPanel')) buildPanel();
    c.style.display = '';
    // Animate in
    requestAnimationFrame(() => {
      const p = document.getElementById('rfPanel');
      if(p){ p.style.opacity = '1'; p.style.transform = 'translate(-50%,-50%) scale(1)'; }
      const b = document.getElementById('rfBackdrop');
      if(b) b.style.opacity = '1';
    });
  };

  window.hideReverseFinder = function(){
    const c = document.getElementById('reverseFinderContainer');
    c.style.display = 'none';
  };

  // ── Called when user selects a result ────────────────────────
  window.onScaleResultSelected = function(scaleName){
    console.log('[ReverseFinder] Scale selected:', scaleName);
    selectScaleByName(scaleName);
    hideReverseFinder();
  };

  // ── Initial build (hidden until showReverseFinder() is called) ─
  buildPanel();
  hideReverseFinder();

})();