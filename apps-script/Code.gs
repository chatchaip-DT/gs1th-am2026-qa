/**
 * GS1 Thailand – Event Q&A (Google Apps Script Web App) — แยกตาม Session
 * ---------------------------------------------------------------
 * หน้าผู้เข้าร่วม : GitHub Pages → ส่งคำถามผ่าน doPost (ไม่ต้องล็อกอิน)
 * หน้าหลังบ้าน   : <WEB_APP_URL>?page=admin&key=<ADMIN_KEY> → MC / Moderator / Officer
 *
 * การเก็บข้อมูลใน Google Sheet
 *  - คำถามแยกแท็บตาม Session เช่น "S01 09.30-09.50", "S02 09.50-10.20", …
 *  - แท็บ "Agenda"   : รายการ Session + จำนวนคำถามแต่ละ Session
 *  - แท็บ "AuditLog" : log การแก้ไขทุกคำถาม (รวมแท็บเดียวเหมือนเดิม)
 *
 * คำถามเข้า Session ไหน
 *  - Auto: ตามเวลาที่ส่ง (เวลาไทย) — ช่วงพัก/ก่อนเริ่ม จะเข้า Session ถัดไป, หลังจบวันจะเข้า Session สุดท้าย
 *  - ทีมงานล็อก Session ปัจจุบันเองได้จากหน้า Console (กรณีกำหนดการเลื่อน)
 */

// ====== ตั้งค่างาน ======
const CONFIG = {
  EVENT_NAME: 'GS1 Thailand Annual Meeting 2026',
  EVENT_SUBTITLE: 'ส่งคำถามถึงวิทยากร',
  TIMEZONE: 'Asia/Bangkok',
  // เรียงตามเวลา (start/end รูปแบบ HH:mm) — icon: barcode, label, passport, services, growth, code, truck, globe, boxes, scan
  SESSIONS: [
    { code: 'S01', start: '09:30', end: '09:50', icon: 'barcode',  title: 'GS1 Thailand SMART Barcode' },
    { code: 'S02', start: '09:50', end: '10:20', icon: 'label',    title: 'GS1 Thailand x FDA : Digital Labeling' },
    { code: 'S03', start: '10:30', end: '11:00', icon: 'passport', title: "Digital Product Passport: Understanding Tomorrow's Product Requirements, Preparing Thai Industry Today" },
    { code: 'S04', start: '11:00', end: '11:30', icon: 'services', title: 'GS1 Thailand SMART Services' },
    { code: 'S05', start: '11:30', end: '12:00', icon: 'growth',   title: 'Beyond the Barcode: Unlocking Business Value (EN)' },
    { code: 'S06', start: '12:00', end: '12:15', icon: 'code',     title: 'Innovative Coding Solutions for GS1 & 2D Codes through LEIBINGER Solutions' },
    { code: 'S07', start: '13:00', end: '13:45', icon: 'truck',    title: 'Panel Discussion: CP Thailand World (Supply Chain)' },
    { code: 'S08', start: '14:00', end: '14:45', icon: 'globe',    title: 'T-Beauty Ascends to the Global Stage' },
    { code: 'S09', start: '14:45', end: '15:00', icon: 'boxes',    title: 'ยกระดับ Traceability ให้สมบูรณ์แบบ ด้วยระบบผูกข้อมูลสินค้า (Aggregation Solution)' },
    { code: 'S10', start: '15:00', end: '15:15', icon: 'scan',     title: 'ยกระดับการทำงานยุคใหม่ ด้วยเทคโนโลยี Auto-ID' }
  ],
  ROLES: ['MC', 'Moderator', 'Officer'],
  LOG_SHEET: 'AuditLog',
  AGENDA_SHEET: 'Agenda',
  MAX_LEN: 500,
  COOLDOWN_SEC: 15
};

const HEADERS = ['id', 'submittedAt', 'session', 'question', 'name', 'organization',
  'status', 'starred', 'note', 'updatedAt', 'updatedBy', 'clientId'];
const STATUS = ['new', 'approved', 'answered', 'hidden'];

// ====== 1) รันครั้งแรก (หรือรันซ้ำได้): สร้างแท็บทั้งหมด ======
function setup() {
  const props = PropertiesService.getScriptProperties();
  let ss = null;
  const id = props.getProperty('SHEET_ID');
  if (id) ss = SpreadsheetApp.openById(id);
  if (!ss) { try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; } }
  if (!ss) ss = SpreadsheetApp.create('GS1TH Event Q&A – Data');
  props.setProperty('SHEET_ID', ss.getId());

  CONFIG.SESSIONS.forEach(function (s) { sessionSheet_(s, true); });
  logSheet_();
  agendaSheet_(true);
  orderTabs_();

  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', Utilities.getUuid().replace(/-/g, ''));
  Logger.log('Sheet: ' + ss.getUrl());
  Logger.log('Console: <WEB_APP_URL>?page=admin&key=' + props.getProperty('ADMIN_KEY'));
}

// ====== 2) Routing ======
function doGet(e) {
  const p = (e && e.parameter) || {};
  const isAdmin = p.page === 'admin';
  if (isAdmin && !keyOk_(p.key)) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:40px;text-align:center">' +
      '<h2>ลิงก์ไม่ถูกต้อง</h2><p>กรุณาใช้ลิงก์ Q&amp;A Console ที่ได้รับจากทีม DT</p></div>')
      .setTitle('Q&A Console').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  const t = HtmlService.createTemplateFromFile(isAdmin ? 'Admin' : 'Index');
  const cfg = {
    eventName: CONFIG.EVENT_NAME,
    subtitle: CONFIG.EVENT_SUBTITLE,
    sessions: CONFIG.SESSIONS,
    roles: CONFIG.ROLES,
    maxLen: CONFIG.MAX_LEN
  };
  if (isAdmin) cfg.key = String(p.key);
  t.cfgJson = JSON.stringify(cfg).replace(/</g, '\\u003c');
  return t.evaluate()
    .setTitle(isAdmin ? 'Q&A Console – ' + CONFIG.EVENT_NAME : 'ส่งคำถาม – ' + CONFIG.EVENT_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ====== 2.1) API สำหรับหน้าส่งคำถามบน GitHub Pages ======
function doPost(e) {
  let res;
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'config') {
      const cur = currentSession_();
      res = { ok: true, eventName: CONFIG.EVENT_NAME, subtitle: CONFIG.EVENT_SUBTITLE, maxLen: CONFIG.MAX_LEN,
        currentSession: { code: cur.session.code, title: cur.session.title } };
    } else {
      res = submitQuestion(body);
    }
  } catch (err) {
    res = { ok: false, error: 'ระบบไม่ว่างชั่วคราว กรุณาลองใหม่อีกครั้ง' };
  }
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

// ====== 3) ผู้เข้าร่วมส่งคำถาม → เข้าแท็บของ Session ปัจจุบัน ======
function submitQuestion(p) {
  p = p || {};
  if (p.website) return { ok: true, id: '' };            // honeypot กันบอท

  const question = clean_(p.question, CONFIG.MAX_LEN);
  if (question.length < 3) return { ok: false, error: 'กรุณาพิมพ์คำถามอย่างน้อย 3 ตัวอักษร' };
  const name = clean_(p.name, 80);
  const org = clean_(p.organization, 120);
  const cid = String(p.clientId || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);

  const cache = CacheService.getScriptCache();
  if (cid && cache.get('cd_' + cid)) {
    return { ok: false, error: 'ส่งคำถามถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' };
  }

  // ถ้าหน้าเว็บระบุ session มา (รหัส S01–S10) ใช้ตามนั้น ไม่งั้นใช้ Session ปัจจุบัน
  const s = sessionByCode_(p.session) || currentSession_().session;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sessionSheet_(s, true);
    const id = nextId_(sh, s.code);
    sh.appendRow([id, new Date(), label_(s), safe_(question), safe_(name), safe_(org),
      'new', false, '', '', '', cid]);
    if (cid) cache.put('cd_' + cid, '1', CONFIG.COOLDOWN_SEC);
    return { ok: true, id: id, session: s.code, sessionTitle: s.title };
  } finally {
    lock.releaseLock();
  }
}

// ====== 4) หลังบ้าน: ภาพรวมทุก Session (จำนวนคำถามแต่ละสถานะ + Session ปัจจุบัน) ======
function getOverview(key) {
  requireKey_(key);
  const ss = ss_();
  agendaSheet_(false);
  const sessions = CONFIG.SESSIONS.map(function (s) {
    const counts = { new: 0, approved: 0, answered: 0, hidden: 0, total: 0 };
    const sh = ss.getSheetByName(tabName_(s));
    const last = sh ? sh.getLastRow() : 0;
    if (last >= 2) {
      sh.getRange(2, 1, last - 1, 7).getValues().forEach(function (r) {
        if (!r[0]) return;
        const st = STATUS.indexOf(String(r[6])) >= 0 ? String(r[6]) : 'new';
        counts[st]++; counts.total++;
      });
    }
    return { code: s.code, counts: counts };
  });
  const cur = currentSession_();
  return {
    ok: true,
    sessions: sessions,
    current: { code: cur.session.code, mode: cur.mode },
    auto: autoSession_(new Date()).code,
    now: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'HH:mm')
  };
}

// ====== 5) หลังบ้าน: ดึงคำถามของ Session เดียว (อ่านสดจาก Sheet) ======
function listQuestions(key, code, knownHash) {
  requireKey_(key);
  const s = sessionByCode_(code);
  if (!s) return { ok: false, error: 'ไม่พบ Session ' + code };
  const sh = ss_().getSheetByName(tabName_(s));
  const last = sh ? sh.getLastRow() : 0;
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const items = rows.filter(function (r) { return r[0]; }).map(function (r) {
    return {
      id: String(r[0]),
      at: toMs_(r[1]),
      question: unq_(r[3]),
      name: unq_(r[4]),
      org: unq_(r[5]),
      status: STATUS.indexOf(String(r[6])) >= 0 ? String(r[6]) : 'new',
      starred: r[7] === true || String(r[7]).toUpperCase() === 'TRUE',
      note: unq_(r[8]),
      updatedAt: toMs_(r[9]),
      updatedBy: String(r[10] || '')
    };
  });
  const json = JSON.stringify(items);
  const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, json, Utilities.Charset.UTF_8));
  if (knownHash && knownHash === hash) return { ok: true, changed: false, hash: hash };
  return { ok: true, changed: true, hash: hash, items: items };
}

// ====== 6) หลังบ้าน: เปลี่ยนสถานะ / ปักดาว / โน้ต / ย้าย Session ======
function updateQuestion(key, id, ch, by) {
  requireKey_(key);
  ch = ch || {};
  by = clean_(by, 60) || 'Console';
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const loc = locate_(id);
    if (!loc) return { ok: false, error: 'ไม่พบคำถาม ' + id };
    const sh = loc.sheet, r = loc.row;

    // ย้ายไป Session อื่น: คัดลอกแถวไปแท็บปลายทาง (ได้หมายเลขใหม่) แล้วลบแถวเดิม
    if (ch.moveTo) {
      const target = sessionByCode_(ch.moveTo);
      if (!target) return { ok: false, error: 'ไม่พบ Session ปลายทาง' };
      if (tabName_(target) === sh.getName()) return { ok: true, id: id };
      const row = sh.getRange(r, 1, 1, HEADERS.length).getValues()[0];
      const tsh = sessionSheet_(target, true);
      const newId = nextId_(tsh, target.code);
      row[0] = newId; row[2] = label_(target); row[9] = new Date(); row[10] = by;
      tsh.appendRow(row);
      sh.deleteRow(r);
      log_(by, id, 'moved to ' + target.code + ' as ' + newId);
      return { ok: true, id: newId, session: target.code };
    }

    const changes = [];
    if (ch.status !== undefined) {
      if (STATUS.indexOf(ch.status) < 0) return { ok: false, error: 'สถานะไม่ถูกต้อง' };
      sh.getRange(r, 7).setValue(ch.status); changes.push('status=' + ch.status);
    }
    if (ch.starred !== undefined) {
      sh.getRange(r, 8).setValue(!!ch.starred); changes.push('starred=' + !!ch.starred);
    }
    if (ch.note !== undefined) {
      sh.getRange(r, 9).setValue(safe_(clean_(ch.note, 300))); changes.push('note');
    }
    if (!changes.length) return { ok: true, id: id };
    sh.getRange(r, 10, 1, 2).setValues([[new Date(), by]]);
    log_(by, id, changes.join(', '));
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

// ====== 7) หลังบ้าน: ล็อก Session ที่กำลังรับคำถาม ('auto' = ตามเวลา) ======
function setCurrentSession(key, code, by) {
  requireKey_(key);
  const props = PropertiesService.getScriptProperties();
  if (code === 'auto' || !sessionByCode_(code)) props.deleteProperty('CURRENT_SESSION');
  else props.setProperty('CURRENT_SESSION', code);
  log_(clean_(by, 60) || 'Console', '-', 'current_session=' + (sessionByCode_(code) ? code : 'auto'));
  return getOverview(key);
}

// ====== 8) หลังบ้าน: ลิงก์สำหรับทำ QR และลิงก์ชีต ======
function getAdminInfo(key) {
  requireKey_(key);
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  return {
    ok: true,
    attendeeUrl: publicUrl_(props.getProperty('PUBLIC_URL') || ScriptApp.getService().getUrl()),
    sheetUrl: id ? 'https://docs.google.com/spreadsheets/d/' + id + '/edit' : ''
  };
}

// ====== helpers: Session ======
function sessionByCode_(code) {
  for (var i = 0; i < CONFIG.SESSIONS.length; i++) if (CONFIG.SESSIONS[i].code === code) return CONFIG.SESSIONS[i];
  return null;
}

// Session ตามเวลา: ช่วงที่กำลังดำเนินอยู่ หรือ Session ถัดไป (ช่วงพัก/ก่อนเริ่ม) — หลังจบวันใช้ Session สุดท้าย
function autoSession_(date) {
  const hm = Utilities.formatDate(date, CONFIG.TIMEZONE, 'HH:mm');
  for (var i = 0; i < CONFIG.SESSIONS.length; i++) if (hm < CONFIG.SESSIONS[i].end) return CONFIG.SESSIONS[i];
  return CONFIG.SESSIONS[CONFIG.SESSIONS.length - 1];
}

function currentSession_() {
  const pin = PropertiesService.getScriptProperties().getProperty('CURRENT_SESSION');
  const s = sessionByCode_(pin);
  return s ? { session: s, mode: 'pinned' } : { session: autoSession_(new Date()), mode: 'auto' };
}

// ชื่อแท็บใช้จุดแทนโคลอน เช่น "S01 09.30-09.50"
function tabName_(s) { return s.code + ' ' + s.start.replace(':', '.') + '-' + s.end.replace(':', '.'); }
function label_(s) { return s.code + ' ' + s.start + '-' + s.end + ' ' + s.title; }

function nextId_(sh, code) {
  // เลขรันต่อจากเลขสูงสุดในแท็บ (กันเลขซ้ำแม้มีการลบ/ย้ายแถว)
  const last = sh.getLastRow();
  let max = 0;
  if (last >= 2) {
    sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) {
      const m = String(r[0]).match(/-(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
  }
  return code + '-' + ('00' + (max + 1)).slice(-3);
}

function locate_(id) {
  id = String(id || '');
  const ss = ss_();
  const first = sessionByCode_(id.split('-')[0]);
  const order = first ? [first].concat(CONFIG.SESSIONS.filter(function (s) { return s !== first; })) : CONFIG.SESSIONS;
  for (var i = 0; i < order.length; i++) {
    const sh = ss.getSheetByName(tabName_(order[i]));
    if (!sh || sh.getLastRow() < 2) continue;
    const cell = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
    if (cell) return { sheet: sh, row: cell.getRow() };
  }
  return null;
}

// ====== helpers: Sheet ======
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('ยังไม่ได้รันฟังก์ชัน setup()');
  return SpreadsheetApp.openById(id);
}

function sessionSheet_(s, create) {
  const ss = ss_();
  let sh = ss.getSheetByName(tabName_(s));
  if (!sh && create) {
    sh = ss.insertSheet(tabName_(s));
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#002C6C').setFontColor('#ffffff');
    sh.setColumnWidth(4, 420);
    sh.setTabColor('#F26334');
  }
  return sh;
}

function logSheet_() {
  const ss = ss_();
  let log = ss.getSheetByName(CONFIG.LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(CONFIG.LOG_SHEET);
    log.appendRow(['at', 'by', 'questionId', 'change']);
    log.setFrozenRows(1);
  }
  return log;
}

function log_(by, id, change) {
  logSheet_().appendRow([new Date(), by, String(id), change]);
}

// เรียงแท็บ: Agenda → S01 … S10 → AuditLog (แท็บอื่นอยู่ท้าย)
function orderTabs_() {
  const ss = ss_();
  const names = [CONFIG.AGENDA_SHEET].concat(CONFIG.SESSIONS.map(tabName_)).concat([CONFIG.LOG_SHEET]);
  names.forEach(function (n, i) {
    const sh = ss.getSheetByName(n);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); }
  });
  const first = ss.getSheetByName(CONFIG.AGENDA_SHEET);
  if (first) ss.setActiveSheet(first);
}

// แท็บ Agenda: สรุปรายการ Session + จำนวนคำถาม (สูตรนับจากแท็บของแต่ละ Session)
function agendaSheet_(rebuild) {
  const ss = ss_();
  let sh = ss.getSheetByName(CONFIG.AGENDA_SHEET);
  if (sh && !rebuild) return sh;
  if (!sh) sh = ss.insertSheet(CONFIG.AGENDA_SHEET, 0);
  sh.clear();
  const rows = [['Session', 'เวลา', 'หัวข้อ', 'แท็บข้อมูล', 'คำถามทั้งหมด', 'ใหม่', 'คิว MC', 'ตอบแล้ว', 'ซ่อน']];
  CONFIG.SESSIONS.forEach(function (s) {
    const t = "'" + tabName_(s) + "'!";
    rows.push([s.code, s.start + '-' + s.end, s.title, tabName_(s),
      '=COUNTA(' + t + 'A2:A)',
      '=COUNTIF(' + t + 'G2:G,"new")', '=COUNTIF(' + t + 'G2:G,"approved")',
      '=COUNTIF(' + t + 'G2:G,"answered")', '=COUNTIF(' + t + 'G2:G,"hidden")']);
  });
  CONFIG.SESSIONS.forEach(function (s) { sessionSheet_(s, true); });
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold').setBackground('#002C6C').setFontColor('#ffffff');
  sh.setColumnWidth(3, 460);
  return sh;
}

// ====== helpers: อื่น ๆ ======
// ถ้าหน้าส่งคำถามอยู่บนเว็บอื่น (เช่น GitHub Pages) ให้ตั้ง Script property PUBLIC_URL เป็นลิงก์นั้น
function publicUrl_(url) {
  return String(url || '')
    .replace(/\/a\/macros\/[^/]+\//, '/macros/')
    .replace(/\/macros\/u\/\d+\//, '/macros/');
}

function keyOk_(key) {
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  return !!real && String(key || '') === real;
}

function requireKey_(key) {
  if (!keyOk_(key)) throw new Error('INVALID_KEY');
}

function clean_(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

// กันข้อความที่ขึ้นต้นด้วย = + - @ ถูกตีความเป็นสูตรใน Sheet
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function unq_(v) {
  const s = String(v == null ? '' : v);
  return s.charAt(0) === "'" ? s.slice(1) : s;
}

function toMs_(v) {
  if (v instanceof Date) return v.getTime();
  const t = v ? new Date(v).getTime() : 0;
  return isNaN(t) ? 0 : t;
}
