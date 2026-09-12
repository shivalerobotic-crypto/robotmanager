const KEY = 'robotProgrammerManagerV1';
let db = JSON.parse(localStorage.getItem(KEY) || 'null') || {
  robots: [], selectedRobot: null,
  settings: {},
  overhang: { old: [], new: [] }
};
const $ = s => document.querySelector(s);
const app = $('#app');

function save() { localStorage.setItem(KEY, JSON.stringify(db)); render(); toast('Saved locally'); }
function toast(msg) { let x = document.createElement('div'); x.textContent = msg; x.style = 'position:fixed;right:18px;bottom:18px;background:#111827;color:white;padding:11px 15px;border-radius:8px;z-index:200'; document.body.appendChild(x); setTimeout(() => x.remove(), 1800) }
function robot() { return db.robots.find(r => r.id === db.selectedRobot) || db.robots[0] }
function ensureData(r) {
  r.calibration ||= { base: '', tcp: '', frame: '', payload: '', mastering: '', zero: '', notes: '' };
  r.io ||= {};
  r.io.digitalIn ||= [];
  r.io.digitalOut ||= [];
  r.io.universalIn ||= [];
  r.io.universalOut ||= [];
  r.io.notes ||= '';
  r.ethernet ||= { robotIP: '', controller: '', subnet: '', gateway: '', dns: '', mac: '', ports: [], notes: '' };
  r.overhang ||= { old: [], new: [] };
  r.panel ||= { items: [] };
  r.details ||= { manufacturer: '', model: '', controller: '', software: '', welding: '', cell: '', programPath: '', backupPath: '', notes: '' };
}
function changeGlobalRobot(id) { if (!id) return; db.selectedRobot = id; save() }
window.changeGlobalRobot = changeGlobalRobot;

function nav(page) { document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === page)); location.hash = page; render() }
document.querySelectorAll('.nav-item').forEach(x => x.onclick = () => { nav(x.dataset.page); $('#sidebar').classList.remove('open') });
$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
$('#quickSave').onclick = save;
$('#addRobotTop').onclick = () => openRobotModal();

function render() {
  let page = location.hash.slice(1) || 'dashboard';
  const titles = { dashboard: 'Dashboard', robots: 'Robots', calibration: 'Calibration', io: 'I/O Configuration', ethernet: 'Ethernet Configuration', overhang: 'Overhang Generator', panel: 'Panel Diagram', details: 'Other Details', backup: 'Backup / Restore' };
  $('#pageTitle').textContent = titles[page] || 'Dashboard';
  $('#currentRobotLabel').innerHTML = `<label class="top-robot-label">ROBOT <select onchange="changeGlobalRobot(this.value)">${db.robots.length ? db.robots.map(r => `<option value="${r.id}" ${r.id === db.selectedRobot ? 'selected' : ''}>${r.name}${r.model ? ' • ' + r.model : ''}</option>`).join('') : '<option>No Robot</option>'}</select></label>`;
  ({ dashboard, robots, calibration, io, ethernet, overhang, panel, details, backup }[page] || dashboard)();
}
function dashboard() {
  const r = robot();
  app.innerHTML = `<div class="grid">
 <div class="card"><span class="muted">TOTAL ROBOTS</span><div class="stat">${db.robots.length}</div></div>
 <div class="card"><span class="muted">SELECTED ROBOT</span><div class="stat">${r ? '1' : '0'}</div></div>
 <div class="card"><span class="muted">I/O ENTRIES</span><div class="stat">${r ? (r.io.digitalIn.length + r.io.digitalOut.length + r.io.analogIn.length + r.io.analogOut.length) : 0}</div></div>
 <div class="card"><span class="muted">OVERHANG RECORDS</span><div class="stat">${r ? (r.overhang.old.length + r.overhang.new.length) : 0}</div></div></div>
 <div class="grid-2" style="margin-top:16px">
 <div class="card"><div class="section-title"><h2>Robot Programmer Database</h2><button class="btn primary" onclick="openRobotModal()">+ Add Robot</button></div>
 <p class="muted">Store robot calibration, I/O, Ethernet, overhang, panel and cell information in one place. Data is stored in this browser using local storage.</p>
 ${r ? `<div class="kpi-list"><div class="kpi"><b>Robot</b><span>${r.name}</span></div><div class="kpi"><b>Model</b><span>${r.model || '-'}</span></div><div class="kpi"><b>Controller</b><span>${r.details.controller || '-'}</span></div><div class="kpi"><b>Robot IP</b><span class="mono">${r.ethernet.robotIP || '-'}</span></div></div>` : `<div class="empty">Add your first robot.</div>`}
 </div>
 <div class="card"><h2 style="margin-top:0">Quick Modules</h2><div class="actions">
 ${['calibration', 'io', 'ethernet', 'overhang', 'panel', 'details'].map(p => `<button class="btn secondary" onclick="nav('${p}')">${titles[p]}</button>`).join('')}
 </div><div class="notice" style="margin-top:15px">Tip: Use Backup / Restore to move the database between a PC and phone.</div></div></div>`;
}
const titles = { calibration: 'Calibration', io: 'I/O Configuration', ethernet: 'Ethernet Configuration', overhang: 'Overhang Generator', panel: 'Panel Diagram', details: 'Other Details' };
function robots() {
  app.innerHTML = `<div class="card"><div class="section-title"><h2>Robot List</h2><button class="btn primary" onclick="openRobotModal()">+ Add Robot</button></div>
 ${db.robots.length ? `<div class="table-wrap"><table class="data-table"><tr><th>Name</th><th>Manufacturer</th><th>Model</th><th>Controller</th><th>IP</th><th>Status</th><th>Actions</th></tr>${db.robots.map(r => `<tr><td><b>${r.name}</b></td><td>${r.manufacturer || '-'}</td><td>${r.model || '-'}</td><td>${r.details.controller || '-'}</td><td class="mono">${r.ethernet.robotIP || '-'}</td><td><span class="badge ok">LOCAL</span></td><td class="actions"><button class="btn secondary" onclick="selectRobot('${r.id}')">Open</button><button class="btn danger" onclick="deleteRobot('${r.id}')">Delete</button></td></tr>`).join('')}</table></div>` : '<div class="empty">No robots added.</div>'}</div>`;
}
function selectRobot(id) { db.selectedRobot = id; save() }
function openRobotModal(id = null) {
  const r = id ? db.robots.find(x => x.id === id) : null;
  $('#modalTitle').textContent = r ? 'Edit Robot' : 'Add Robot';
  $('#modalBody').innerHTML = `<div class="form-grid">
 <div class="form-group"><label>Robot Name *</label><input id="m_name" value="${r?.name || ''}"></div>
 <div class="form-group"><label>Manufacturer</label><input id="m_man" value="${r?.manufacturer || ''}" placeholder="FANUC / KUKA / ABB / YASKAWA"></div>
 <div class="form-group"><label>Robot Model</label><input id="m_model" value="${r?.model || ''}"></div>
 <div class="form-group"><label>Controller</label><input id="m_controller" value="${r?.details.controller || ''}"></div>
 <div class="form-group full"><label>Notes</label><textarea id="m_notes">${r?.details.notes || ''}</textarea></div></div>
 <div class="actions" style="margin-top:15px"><button class="btn primary" onclick="saveRobot('${id || ''}')">Save Robot</button></div>`;
  $('#modal').classList.remove('hidden');
}
function saveRobot(id) {
  let r = id ? db.robots.find(x => x.id === id) : { id: crypto.randomUUID(), calibration: {}, io: { digitalIn: Array.from({ length: 10 }, () => ({ range: '', rack: '', slot: '', start: '' })), digitalOut: Array.from({ length: 10 }, () => ({ range: '', rack: '', slot: '', start: '' })), universalIn: Array.from({ length: 10 }, () => ({ range: '', rack: '', slot: '', start: '' })), universalOut: Array.from({ length: 10 }, () => ({ range: '', rack: '', slot: '', start: '' })) }, ethernet: { ports: [] }, overhang: { old: [], new: [] }, panel: { items: [] }, details: {} };
  r.name = $('#m_name').value.trim() || 'Unnamed Robot'; r.manufacturer = $('#m_man').value; r.model = $('#m_model').value; r.details.controller = $('#m_controller').value; r.details.notes = $('#m_notes').value;
  ensureData(r); if (!id) db.robots.push(r); db.selectedRobot = r.id; closeModal(); save(); nav('dashboard');
}
function deleteRobot(id) { if (confirm('Delete this robot and all its stored data?')) { db.robots = db.robots.filter(r => r.id !== id); if (db.selectedRobot === id) db.selectedRobot = db.robots[0]?.id || null; save(); nav('robots') } }
function calibration() {
  const r = robot(); if (!r) return needRobot(); ensureData(r);
  const c = r.calibration;
  c.masterCounts ||= Array(9).fill('');
  app.innerHTML = `<div class="card calibration-card">
  <div class="section-title"><div><h2>Calibration</h2><p class="muted">Select a calibration function for the active robot.</p></div></div>
  <div class="cal-tabs">
   <button class="cal-tab active" onclick="showCalibrationProcess(this)">1. FOLLOW CALIBRATION PROCESS</button>
   <button class="cal-tab" onclick="showCalibrationValues(this)">2. CALIBRATION VALUES</button>
  </div>
  <div id="calibrationPanel"></div>
 </div>`;
  showCalibrationProcess(document.querySelector('.cal-tab'));
}
function showCalibrationProcess(btn) {
  document.querySelectorAll('.cal-tab').forEach(x => x.classList.remove('active')); btn.classList.add('active');
  $('#calibrationPanel').innerHTML = `<div class="cal-process-head"><div><h3>FOLLOW CALIBRATION PROCESS</h3><p class="muted">Calibration procedure document for the selected robot.</p></div><a class="btn primary" href="cal.pdf" target="_blank">OPEN PDF</a></div>
 <div class="pdf-frame-wrap"><iframe class="cal-pdf" src="cal.pdf#view=FitH" title="Calibration Process PDF"></iframe></div>`;
}
function showCalibrationValues(btn) {
  document.querySelectorAll('.cal-tab').forEach(x => x.classList.remove('active')); btn.classList.add('active');
  const r = robot(), c = r.calibration;
  const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  $('#calibrationPanel').innerHTML = `<div class="section-title"><div><h3>CALIBRATION VALUES</h3><p class="muted">Enter the MASTER COUNT values from the robot. Nine positions are provided to match the displayed robot chart.</p></div><button class="btn primary" onclick="saveCalibrationValues()">SAVE VALUES</button></div>
 <div class="cal-master-card"><div class="cal-master-title"><span class="mono">$DMR_GRP[1].$MASTER_COUN</span><span class="badge">MASTER COUNT</span></div>
 <div class="table-wrap"><table class="data-table master-table"><tr><th>SR.NO</th><th>GROUP</th><th>MASTER COUNT</th></tr>${labels.map((n, i) => `<tr><td>${n}</td><td>[${n}]</td><td><input class="master-input" data-master-index="${i}" value="${c.masterCounts[i] || ''}" type="number" step="1" placeholder="Enter value"></td></tr>`).join('')}</table></div></div>
 <div class="form-grid" style="margin-top:16px">${[['base', 'BASE / J1 CALIBRATION'], ['tcp', 'TCP / TOOL CALIBRATION'], ['frame', 'USER FRAME / WORK OBJECT'], ['payload', 'PAYLOAD / LOAD DATA'], ['mastering', 'MASTERING / ZERO DATA'], ['zero', 'ZERO POSITION / HOME DATA']].map(([k, l]) => `<div class="form-group"><label>${l}</label><textarea data-field="${k}" data-module="calibration">${c[k] || ''}</textarea></div>`).join('')}<div class="form-group full"><label>CALIBRATION NOTES</label><textarea data-field="notes" data-module="calibration">${c.notes || ''}</textarea></div></div>`;
}
function saveCalibrationValues() {
  const r = robot(); ensureData(r); r.calibration.masterCounts = [...document.querySelectorAll('.master-input')].map(x => x.value);
  document.querySelectorAll('[data-module="calibration"]').forEach(el => r.calibration[el.dataset.field] = el.value);
  save();
}

function io() {
  const r = robot(); if (!r) return needRobot(); ensureData(r);
  const types = [
    ['digitalIn', 'DIGITAL INPUT'],
    ['digitalOut', 'DIGITAL OUTPUT'],
    ['universalIn', 'UNIVERSAL INPUT'],
    ['universalOut', 'UNIVERSAL OUTPUT']
  ];
  app.innerHTML = `<div class="card io-card">
   <div class="section-title">
     <div><h2>I/O Configuration</h2><p class="muted">FANUC-style I/O range configuration — 10 rows per section</p></div>
     <button class="btn primary" onclick="saveIO()">Save I/O Configuration</button>
   </div>
   <div class="tabs io-tabs">${types.map((x, i) => `<button class="tab ${i === 0 ? 'active' : ''}" onclick="ioTab('${x[0]}',this)">${x[1]}</button>`).join('')}</div>
   <div id="ioTable"></div>
 </div>`;
  ioTab('digitalIn', document.querySelector('.io-tabs .tab'));
}
function ioTab(type, btn) {
  document.querySelectorAll('.io-tabs .tab').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  const r = robot(); ensureData(r);
  const arr = r.io[type] || [];
  while (arr.length < 10) arr.push({ range: '', rack: '', slot: '', start: '' });
  r.io[type] = arr.slice(0, 10);

  $('#ioTable').innerHTML = `
 <div class="io-device-head">
   <div class="io-screen-title">I/O ${type === 'digitalIn' ? 'Digital In' : type === 'digitalOut' ? 'Digital Out' : type === 'universalIn' ? 'Universal In' : 'Universal Out'}</div>
   <span class="badge">10 ROWS</span>
 </div>
 <div class="table-wrap io-table-wrap">
 <table class="data-table io-config-table">
   <thead><tr><th>SR.NO</th><th>RANGE</th><th>RACK</th><th>SLOT</th><th>START</th></tr></thead>
   <tbody>
   ${r.io[type].map((x, i) => `
    <tr>
      <td class="io-sr">${i + 1}</td>
      <td><input class="io-input" data-io-type="${type}" data-io-index="${i}" data-io-field="range" value="${esc(x.range)}" placeholder="RANGE"></td>
      <td><input class="io-input" data-io-type="${type}" data-io-index="${i}" data-io-field="rack" value="${esc(x.rack)}" placeholder="RACK"></td>
      <td><input class="io-input" data-io-type="${type}" data-io-index="${i}" data-io-field="slot" value="${esc(x.slot)}" placeholder="SLOT"></td>
      <td><input class="io-input" data-io-type="${type}" data-io-index="${i}" data-io-field="start" value="${esc(x.start)}" placeholder="START"></td>
    </tr>`).join('')}
   </tbody>
 </table>
 </div>
 <div class="io-footer">
   <span class="muted">Enter all values manually. Blank cells are allowed.</span>
   <button class="btn success" onclick="saveIO()">SAVE THIS SECTION</button>
 </div>`;
}
function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function saveIO() {
  const r = robot(); if (!r) return;
  document.querySelectorAll('.io-input').forEach(el => {
    const type = el.dataset.ioType, i = +el.dataset.ioIndex, field = el.dataset.ioField;
    r.io[type][i][field] = el.value;
  });
  save();
}
function addIO(type) {
  // Kept for compatibility with older saved data; the V4 UI uses fixed 10 rows.
  const r = robot(); ensureData(r);
  if (r.io[type].length < 10) r.io[type].push({ range: '', rack: '', slot: '', start: '' });
  save(); io();
}
function removeIO(type, i) {
  // Kept for compatibility; fixed 10-row UI clears a row instead of removing it.
  const r = robot(); ensureData(r);
  if (r.io[type]?.[i]) r.io[type][i] = { range: '', rack: '', slot: '', start: '' };
  save(); io();
}
function ethernet() {
  const r = robot(); if (!r) return needRobot(); const e = r.ethernet;
  app.innerHTML = `<div class="card"><div class="section-title"><h2>Ethernet / Network Configuration</h2><button class="btn primary" onclick="saveModule('ethernet')">Save</button></div>
 <div class="form-grid">${[['robotIP', 'Robot IP Address'], ['controller', 'Controller / Network Name'], ['subnet', 'Subnet Mask'], ['gateway', 'Gateway'], ['dns', 'DNS'], ['mac', 'MAC Address']].map(([k, l]) => `<div class="form-group"><label>${l}</label><input data-field="${k}" data-module="ethernet" value="${e[k] || ''}"></div>`).join('')}<div class="form-group full"><label>Ethernet Ports / Services</label><textarea data-field="ports" data-module="ethernet">${(e.ports || []).map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\\n')}</textarea></div><div class="form-group full"><label>Network Notes</label><textarea data-field="notes" data-module="ethernet">${e.notes || ''}</textarea></div></div></div>`;
}
function overhang() {
  const r = robot(); if (!r) return needRobot(); ensureData(r);
  app.innerHTML = `<div class="card overhang-matrix-card">
   <div class="section-title"><div><h2>Overhang Matrix</h2><p class="muted">Old Fanuc and New Fanuc overhang generator</p></div></div>
   <div class="sub-tab-container">
     <button id="sub-tab-old" class="sub-tab active" onclick="switchOverhangGen('old')">Old Fanuc</button>
     <button id="sub-tab-new" class="sub-tab" onclick="switchOverhangGen('new')">New Fanuc</button>
   </div>
   <div id="overhang-old-content" class="sub-content active">
     <div class="card inner-card">
       <h2>Old Fanuc Overhang Configuration</h2>
       <div class="form-grid">
         <div class="form-group"><label>X Coordinate</label><input type="number" id="old-x" value="0" step="0.001"></div>
         <div class="form-group"><label>Y Coordinate</label><input type="number" id="old-y" value="0" step="0.001"></div>
         <div class="form-group"><label>Z Coordinate</label><input type="number" id="old-z" value="0" step="0.001"></div>
         <div class="form-group"><label>O (Overhang Base)</label><input type="number" id="old-o" value="0" step="0.001"></div>
       </div>
       <button class="btn primary full-btn" onclick="runOldOverhang()">SUBMIT (Calculate Old)</button>
     </div>
     <div class="card inner-card">
       <h2>Output Parameters</h2>
       <div class="form-grid three-cols">
         <div class="form-group"><label>Output X</label><input type="text" id="old-ox" readonly></div>
         <div class="form-group"><label>Output Y</label><input type="text" id="old-oy" readonly></div>
         <div class="form-group"><label>Output Z</label><input type="text" id="old-oz" readonly></div>
       </div>
     </div>
   </div>
   <div id="overhang-new-content" class="sub-content">
     <div class="card inner-card">
       <h2>New Fanuc Offset Configuration</h2>
       <div class="form-grid">
         <div class="form-group"><label>X Coordinate</label><input type="number" id="new-x" value="0" step="0.001"></div>
         <div class="form-group"><label>Y Coordinate</label><input type="number" id="new-y" value="0" step="0.001"></div>
         <div class="form-group"><label>Z Coordinate</label><input type="number" id="new-z" value="0" step="0.001"></div>
         <div class="form-group"><label>O (Overhang Base)</label><input type="number" id="new-o" value="0" step="0.001"></div>
       </div>
       <button class="btn primary full-btn" onclick="runNewOverhang()">SUBMIT (Calculate New)</button>
     </div>
     <div class="card inner-card">
       <h2>Output Parameters</h2>
       <div class="form-grid three-cols">
         <div class="form-group"><label>Output OX</label><input type="text" id="new-ox" readonly></div>
         <div class="form-group"><label>Output OY</label><input type="text" id="new-oy" readonly></div>
         <div class="form-group"><label>Output OZ</label><input type="text" id="new-oz" readonly></div>
       </div>
     </div>
   </div>
 </div>`;
}
function switchOverhangGen(mode) {
  document.querySelectorAll('.sub-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sub-content').forEach(el => el.classList.remove('active'));
  const isOld = mode === 'old';
  document.getElementById(isOld ? 'sub-tab-old' : 'sub-tab-new').classList.add('active');
  document.getElementById(isOld ? 'overhang-old-content' : 'overhang-new-content').classList.add('active');
}
function runOldOverhang() {
  let zx = parseFloat(document.getElementById('old-x').value) || 0;
  let zy = parseFloat(document.getElementById('old-y').value) || 0;
  let zz = parseFloat(document.getElementById('old-z').value) || 0;
  let zo = parseFloat(document.getElementById('old-o').value) || 0;
  let zxm = Math.abs(zx), zzm = Math.abs(zz), zcc;
  if (zx < 0) { zcc = -((0.707 * zo) + zxm).toFixed(3) } else { zcc = (zxm - (0.707 * zo)).toFixed(3) }
  let zvv = zy, zb = 0.707 * zo, zbv = zb + zzm, zbb;
  if (zz < 0) { zbb = -(zbv).toFixed(3) } else { zbb = zbv.toFixed(3) }
  document.getElementById('old-ox').value = zcc;
  document.getElementById('old-oy').value = zvv;
  document.getElementById('old-oz').value = zbb;
}
function runNewOverhang() {
  let zx = parseFloat(document.getElementById('new-x').value) || 0;
  let zy = parseFloat(document.getElementById('new-y').value) || 0;
  let zz = parseFloat(document.getElementById('new-z').value) || 0;
  let zo = parseFloat(document.getElementById('new-o').value) || 0;
  let zxm = Math.abs(zx), zzm = Math.abs(zz), zcc;
  let zc = 0.574 * zo, zcv = zc + zxm;
  if (zx < 0) { zcc = -(zcv).toFixed(3) } else { zcc = zcv.toFixed(3) }
  let zvv = zy, zb = 0.819 * zo, zbv = zb + zzm, zbb;
  if (zz < 0) { zbb = -(zbv).toFixed(3) } else { zbb = zbv.toFixed(3) }
  document.getElementById('new-ox').value = zcc;
  document.getElementById('new-oy').value = zvv;
  document.getElementById('new-oz').value = zbb;
}
function panel() {
  const r = robot(); if (!r) return needRobot(); ensureData(r);
  app.innerHTML = `<div class="card panel-generator-card">
   <div class="section-title"><div><h2>Aluminium Panel Diagram</h2><p class="muted">Panel stiffener layout generator</p></div></div>
   <div class="form-group"><label>Customer Selection</label><select id="customer" onchange="resetPanel()">
     <option value="STDREV_DECK">STDREV_DECK</option><option value="KALPATARU_DECK">KALPATARU_DECK</option>
     <option value="RAGHAVAN">RAGHAVAN</option><option value="KALPATARU">KALPATARU</option>
     <option value="STDREV">STDREV</option><option value="WT">WT</option><option value="WX">WX</option>
     <option value="NEW LOADHA">NEW LOADHA</option>
                    <option value="UPDATED LOADHA">UPDATED LOADHA</option>
                    <option value="FORSA">FORSA</option>
                    <option value="TECHNO ALPHA">TECHNO ALPHA</option>
                    <option value="TECHNO BETA">TECHNO BETA</option>
   </select></div>
   <div class="form-grid">
     <div class="form-group"><label>Width</label><input type="number" id="width" value="600"></div>
     <div class="form-group"><label>Length</label><input type="number" id="length" value="2400"></div>
   </div>
   <button class="btn primary full-btn" onclick="generate()">Submit</button>
   <div class="panel-note">NOTE : The gap is from center of stiffner to reference</div>
   <div class="panel-scroll"><div id="panel" class="generated-panel"></div></div>
   <div class="panel-summary" id="summary"></div>
   <div class="gauge-box"><b>Gauge :</b><div id="gauge"></div></div>
 </div>`;
  resetPanel();
}
function generate() {
  let customer = document.getElementById('customer').value;
  let length = parseInt(document.getElementById('length').value);
  if (length > 2500) { alert('Panel length cannot exceed 2500 mm.'); return }
  if (length <= 0 || isNaN(length)) { alert('Please enter a valid panel length.'); return }
  let panelEl = document.getElementById('panel'), summary = document.getElementById('summary');
  panelEl.innerHTML = ''; summary.innerHTML = '';
  let ratio = Math.min(0.3, 700 / length); panelEl.style.width = (length * ratio) + 'px';
  let positions = [], gapPattern = [], typePattern = [];
  if (customer === 'WT') {
    let typeCount = { u: 0, ulip: 0, i: 0 };
    if (length >= 250 && length <= 365) positions.push(length / 2); else if (length <= 565) positions.push(250); else { let pos = 250; positions.push(pos); while (true) { pos += 200; if (pos >= length) break; positions.push(pos) } }
    if (positions.length > 0 && length - positions[positions.length - 1] < 116) positions.pop();
    drawStiffeners(positions, ['u'], ratio, panelEl, summary, typeCount); return;
  }
  if (customer === 'WX') {
    let typeCount = { u: 0, ulip: 0, i: 0 };
    if (length >= 250 && length <= 365) positions.push(length / 2); else if (length <= 565) positions.push(250); else { let pos = 250; positions.push(pos); while (true) { pos += 200; if (pos >= length) break; positions.push(pos) } }
    if (positions.length > 0 && length - positions[positions.length - 1] < 116) positions.pop();
    drawStiffeners(positions, ['u'], ratio, panelEl, summary, typeCount); return;
  }
  if (customer === 'STDREV_DECK') { gapPattern = [300]; typePattern = ['i'] }
  if (customer === 'KALPATARU_DECK') { gapPattern = [250, 300, 300, 300, 300, 300, 300, 300]; typePattern = ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'] }
  if (customer === 'RAGHAVAN') { gapPattern = [225, 250, 275, 275, 275, 300, 275, 300, 225]; typePattern = ['u', 'ulip', 'u', 'ulip', 'u', 'ulip', 'u', 'u'] }
  if (customer === 'KALPATARU') { gapPattern = [225, 225, 275, 275, 300, 300, 300, 300, 200]; typePattern = ['u', 'ulip', 'u', 'ulip', 'u', 'ulip', 'u', 'u'] }
  if (customer === 'STDREV') { gapPattern = [225, 225, 275, 275, 300, 300, 300, 350, 150]; typePattern = ['u', 'ulip', 'u', 'ulip', 'u', 'ulip', 'u', 'u'] }
  if (customer === "NEW LOADHA") { gapPattern = [225, 225, 300, 300, 300, 300, 300, 225, 225]; typePattern = ["ulip", "ulip", "ulip", "ulip", "ulip", "ulip", "ulip", "ulip"]; }
  if (customer === "UPDATED LOADHA") { gapPattern = [225, 225, 300, 300, 300, 300, 300, 225, 225]; typePattern = ["l-ulip", "l-ulip", "l-ulip", "l-ulip", "l-ulip", "l-ulip", "l-ulip", "l-ulip"]; }
  if (customer === "FORSA") { gapPattern = [225, 225, 300, 300, 300, 300, 300, 300, 150]; typePattern = ["ulip", "ulip", "ulip", "ulip", "u", "u", "u", "u"]; }
  if (customer === "TECHNO ALPHA") { gapPattern = [225, 250, 250, 260, 260, 275, 280, 300, 300]; typePattern = ["u", "ulip", "u", "ulip", "u", "ulip", "u", "u"]; }
  if (customer === "TECHNO BETA") { gapPattern = [250, 250, 250, 250, 250, 275, 275, 300, 300]; typePattern = ["hor", "l-u", "hor", "l-u", "hor", "l-u", "hor", "hor"]; }

  let center = 0, gapIndex = 0;
  while (gapPattern.length) { let nextGap = gapPattern[gapIndex % gapPattern.length]; center += nextGap; if (center >= length) break; positions.push(center); gapIndex++ }
  if (positions.length > 0 && length - positions[positions.length - 1] < 116) positions.pop();
  drawStiffeners(positions, typePattern, ratio, panelEl, summary);
}
function drawStiffeners(positions, typePattern, ratio, panelEl, summary, typeCountInput) {
  let typeCount = typeCountInput || { u: 0, ulip: 0, i: 0 }; let gauges = [];
  positions.forEach((pos, i) => {
    let type = typePattern[i % typePattern.length], stiff = document.createElement('div');
    stiff.classList.add('stiffener', type); stiff.style.left = (pos * ratio) + 'px'; panelEl.appendChild(stiff); typeCount[type]++;
    let gapValue = (i === 0) ? pos : pos - positions[i - 1], gapLabel = document.createElement('div');
    gapLabel.className = 'label'; gapLabel.innerText = 'Gap: ' + gapValue + 'MM'; gapLabel.style.left = (pos * ratio - 20) + 'px'; panelEl.appendChild(gapLabel);
    let stiffWidth = (type === 'u') ? 25 : (type === 'ulip') ? 35 : (type === 'l-u') ? 30 : (type === 'l-ulip') ? 40 : (type === 'hor') ? 40 :10; gauges.push(pos - stiffWidth);
    let typeLabel = document.createElement('div'); typeLabel.className = 'panel-type-label'; typeLabel.style.left = (pos * ratio - 25) + 'px';
    typeLabel.innerText = type === 'u' ? 'Stiff-U' : type === 'ulip' ? 'Stiff-U Lip' : 'Stiff-I'; if (type === "i") typeLabel.innerText = "Stiff-I";
                if (type === "l-u") typeLabel.innerText = "L-U";
                if (type === "l-ulip") typeLabel.innerText = "L--U Lip";
                if (type === "hor") typeLabel.innerText = "Hor Stiff"; panelEl.appendChild(typeLabel);
  });
  document.getElementById('gauge').innerText = gauges.join(' , ');
  summary.innerHTML = `Total Stiffeners: ${positions.length}<br>Stiff-U Count: ${typeCount.u}<br>Stiff-U Lip Count: ${typeCount.ulip}<br>Stiff-I Count: ${typeCount.i}  <br>
                Stiff-U Count: ${typeCount.l-u} <br>
                Stiff-U Lip Count: ${typeCount.l-ulip} <br>
                Stiff-I Count: ${typeCount.hor} `;
}
function resetPanel() {
  const p = document.getElementById('panel'), s = document.getElementById('summary'), g = document.getElementById('gauge');
  if (p) p.innerHTML = ''; if (s) s.innerHTML = ''; if (g) g.innerHTML = '';
}
function details() {
  const r = robot(); if (!r) return needRobot(); const d = r.details;
  app.innerHTML = `<div class="card"><div class="section-title"><h2>Other Robot / Cell Details</h2><button class="btn primary" onclick="saveModule('details')">Save</button></div><div class="form-grid">${[['manufacturer', 'Manufacturer'], ['model', 'Robot Model'], ['controller', 'Controller'], ['software', 'Robot Software Version'], ['welding', 'Welding Machine / Process'], ['cell', 'Robot Cell / Line'], ['programPath', 'Program Backup Path'], ['backupPath', 'Full Backup Location']].map(([k, l]) => `<div class="form-group"><label>${l}</label><input data-field="${k}" data-module="details" value="${d[k] || ''}"></div>`).join('')}<div class="form-group full"><label>Other Details / Notes</label><textarea data-field="notes" data-module="details">${d.notes || ''}</textarea></div></div></div>`;
}
function backup() {
  app.innerHTML = `<div class="grid-2"><div class="card"><h2>Export Database</h2><p class="muted">Download all robot records as a JSON backup. Works on PC and phone.</p><button class="btn primary" onclick="exportDB()">Download Backup</button></div><div class="card"><h2>Import Database</h2><p class="muted">Restore a previously exported JSON file.</p><input type="file" accept=".json,application/json" id="importFile"><button class="btn success" style="margin-top:10px" onclick="importDB()">Restore Backup</button></div><div class="card"><h2>Data Storage</h2><p class="muted">This version uses browser localStorage. For shared multi-user storage, a backend/database can be added later.</p></div></div>`;
}
function exportDB() { let blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ROBOT_PROGRAMMER_BACKUP.json'; a.click(); URL.revokeObjectURL(a.href) }
function importDB() { let f = $('#importFile').files[0]; if (!f) return alert('Select a backup file first.'); let rd = new FileReader(); rd.onload = () => { try { let x = JSON.parse(rd.result); if (!x.robots) throw Error(); db = x; save(); alert('Backup restored.') } catch (e) { alert('Invalid backup file.') } }; rd.readAsText(f) }
function saveModule(module) {
  const r = robot(); if (!r) return;
  document.querySelectorAll(`[data-module="${module}"]`).forEach(el => { let v = el.value; if (module === 'ethernet' && el.dataset.field === 'ports') v = v.split('\\n').filter(Boolean); r[module][el.dataset.field] = v });
  save();
}
function needRobot() { app.innerHTML = `<div class="card"><div class="empty">Please add a robot first.<br><button class="btn primary" style="margin-top:12px" onclick="openRobotModal()">+ Add Robot</button></div></div>` }
function closeModal() { $('#modal').classList.add('hidden') }
$('#modalClose').onclick = closeModal;
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal() };
window.addEventListener('hashchange', render);
render();
