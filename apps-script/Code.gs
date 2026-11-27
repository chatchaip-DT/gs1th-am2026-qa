/**
 * GS1 Thailand – Event Q&A (Google Apps Script Web App) — แยกตาม Session
 * ---------------------------------------------------------------
 * หน้าผู้เข้าร่วม : GitHub Pages → ส่งคำถามผ่าน doPost (ไม่ต้องล็อกอิน)
 * หน้าหลังบ้าน   : <WEB_APP_URL>?page=admin&key=<ADMIN_KEY> → Speaker / Officer
 *
 * การเก็บข้อมูลใน Google Sheet
 *  - คำถามแยกแท็บตาม Session เช่น "S01 09.30-09.50", "S02 09.50-10.20", …
 *    · คำถามจากผู้เข้าร่วม: ลำดับ 1, 2, 3 … ต่อ Session (id เช่น S02-003)
 *    · คำถามที่ Officer เตรียมไว้ให้ Speaker: ติดดาวอัตโนมัติ (id เช่น S02-P1)
 *  - แท็บ "Agenda"   : รายการ Session + จำนวนคำถาม (เตรียมไว้ / ผู้เข้าร่วม / ยังไม่ตอบ / ตอบแล้ว)
 *  - แท็บ "AuditLog" : log ทุกการส่ง/แก้ไขคำถาม (รวมแท็บเดียว มีคอลัมน์ Session)
 *
 * สถานะคำถามมี 2 แบบ: pending (ยังไม่ตอบ) / answered (ตอบแล้ว) — Officer เป็นคนกด
 *
 * คำถามเข้า Session ไหน
 *  - Auto: ตามเวลาที่ส่ง (เวลาไทย) — ช่วงพัก/ก่อนเริ่ม จะเข้า Session ถัดไป, หลังจบวันจะเข้า Session สุดท้าย
 *  - ทีมงานล็อก Session ปัจจุบันเองได้จากหน้า Console (กรณีกำหนดการเลื่อน)
 *
 * แก้ CONFIG แล้วรัน setup() ทุกครั้ง (รันซ้ำได้ ไม่ลบข้อมูล)
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
  // คำถามที่ Officer เตรียมไว้ให้ Speaker (ติดดาวอัตโนมัติ, แสดงบนสุดของ Session)
  PRESET_QUESTIONS: {
    S02: [
      'ผู้ประกอบการไทยหลายรายผลิตสินค้าหลายกลุ่ม ทั้งเครื่องสำอาง ยา เครื่องมือแพทย์ รวมถึงอาหาร ซึ่งอยู่คนละกองของ อย. อยากทราบว่า อย. มี plan จะทำแพลตฟอร์มกลางที่เดียวให้รายย่อยใช้หรือไม่?',
      'ผู้ประกอบการจำเป็นต้องใช้ 2D Barcode มาตรฐาน GS1 เพื่อที่จะทำให้ถูกต้องตาม อย. หรือไม่?'
    ],
    S03: [
      "Why do we have to act now? What will happen to us if we don't comply with the EU rules and regulations? Will our product be suddenly denied at the border?",
      'You advised us to start collecting upstream supplier data early, before rules are final. Here in Thailand, many of our local suppliers are small businesses or farms still working on paper and many manufacturers worry about exposing confidential supplier lists. From your Sri Lanka pilot, what is the simplest, low-cost way to get small suppliers on board while protecting our business secrets?'
    ],
    S07: [
      'CPRAM ค่อนข้างประสบความสำเร็จในการใช้ GS1 DataMatrix เพื่อป้องกันการขายสินค้าหมดอายุ ณ จุดขาย แต่ตลาดต้องการ QR Code มากกว่าเพราะทำให้คนทั่วไปสแกนได้ ทาง CPRAM คิดยังไงกับประเด็นนี้บ้าง?',
      'เพราะ GS1 มี Ambition 2027 มีแนวโน้มที่ CP Axtra จะนำ 2D Barcode มาเป็นข้อกำหนดหลักในการนำสินค้าเข้าวางขายไหม และสำหรับแบรนด์ที่ยอมลงทุนทำก่อนในปี 2027 จะได้แต้มต่ออะไรที่เป็นรูปธรรมบ้าง เช่น ตรวจผ่าน QA ขึ้นเชลฟ์ไวขึ้น (Fast-Track) หรืออาจจะอื่นๆ?'
    ]
  },
  ROLES: ['Speaker', 'Officer'],
  LOG_SHEET: 'AuditLog',
  AGENDA_SHEET: 'Agenda',
  MAX_LEN: 500,
  COOLDOWN_SEC: 15
};

// คอลัมน์ในแท็บ Session (ลำดับนี้ = ลำดับในชีต)
const HEADERS = ['no', 'id', 'type', 'submittedAt', 'session', 'question', 'name', 'organization',
  'status', 'starred', 'note', 'updatedAt', 'updatedBy', 'clientId'];
const COL = {};
HEADERS.forEach(function (h, i) { COL[h] = i + 1; });   // เลขคอลัมน์ (เริ่ม 1)
const LOG_HEADERS = ['at', 'by', 'session', 'questionId', 'action'];
const TEXT_COLS = ['question', 'name', 'organization', 'note'];

// ====== 1) รันครั้งแรก/หลังแก้ CONFIG (รันซ้ำได้): สร้าง/ปรับแท็บ + ใส่คำถามที่เตรียมไว้ ======
function setup() {
  const props = PropertiesService.getScriptProperties();
  let ss = null;
  const id = props.getProperty('SHEET_ID');
  if (id) ss = SpreadsheetApp.openById(id);
  if (!ss) { try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; } }
  if (!ss) ss = SpreadsheetApp.create('GS1TH Event Q&A – Data');
  props.setProperty('SHEET_ID', ss.getId());

  CONFIG.SESSIONS.forEach(function (s) { const sh = sessionSheet_(s, true); migrateSessionSheet_(sh); styleSessionSheet_(sh); });
  migrateLog_();
  seedPresets_();
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
    sessions: isAdmin ? CONFIG.SESSIONS : [],   // หน้าส่งคำถามสำรองไม่ให้เลือก Session (เข้าตามเวลา)
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

// ====== 3) ผู้เข้าร่วมส่งคำถาม → เข้าแท็บของ Session ปัจจุบัน (ได้ลำดับ 1, 2, 3 …) ======
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
    const no = nextNo_(sh);
    const id = s.code + '-' + ('00' + no).slice(-3);
    sh.appendRow(rowOf_({ no: no, id: id, type: 'audience', submittedAt: new Date(), session: label_(s),
      question: question, name: name, organization: org, status: 'pending', starred: false, clientId: cid }));
    log_('Attendee', s.code, id, 'submitted #' + no);
    if (cid) cache.put('cd_' + cid, '1', CONFIG.COOLDOWN_SEC);
    return { ok: true, id: id, no: no, session: s.code, sessionTitle: s.title };
  } finally {
    lock.releaseLock();
  }
}

// ====== 4) หลังบ้าน: ภาพรวมทุก Session ======
function getOverview(key) {
  requireKey_(key);
  const ss = ss_();
  const sessions = CONFIG.SESSIONS.map(function (s) {
    const counts = { pending: 0, answered: 0, preset: 0, audience: 0, total: 0 };
    const sh = ss.getSheetByName(tabName_(s));
    const last = sh ? sh.getLastRow() : 0;
    if (last >= 2) {
      sh.getRange(2, 1, last - 1, COL.status).getValues().forEach(function (r) {
        if (!r[COL.id - 1]) return;
        counts[status_(r[COL.status - 1])]++;
        counts[r[COL.type - 1] === 'preset' ? 'preset' : 'audience']++;
        counts.total++;
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
  const items = rows.filter(function (r) { return r[COL.id - 1]; }).map(function (r) {
    const g = function (h) { return r[COL[h] - 1]; };
    return {
      id: String(g('id')),
      no: String(g('no')),
      type: g('type') === 'preset' ? 'preset' : 'audience',
      at: toMs_(g('submittedAt')),
      question: unq_(g('question')),
      name: unq_(g('name')),
      org: unq_(g('organization')),
      status: status_(g('status')),
      starred: bool_(g('starred')),
      note: unq_(g('note')),
      updatedAt: toMs_(g('updatedAt')),
      updatedBy: String(g('updatedBy') || '')
    };
  });
  const json = JSON.stringify(items);
  const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, json, Utilities.Charset.UTF_8));
  if (knownHash && knownHash === hash) return { ok: true, changed: false, hash: hash };
  return { ok: true, changed: true, hash: hash, items: items };
}

// ====== 6) หลังบ้าน (Officer): ตอบแล้ว/ยังไม่ตอบ / ติดดาว / โน้ต / ย้าย Session ======
function updateQuestion(key, id, ch, by) {
  requireKey_(key);
  ch = ch || {};
  by = clean_(by, 60) || 'Officer';
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const loc = locate_(id);
    if (!loc) return { ok: false, error: 'ไม่พบคำถาม ' + id };
    const sh = loc.sheet, r = loc.row, code = loc.code;

    // ย้ายไป Session อื่น (เฉพาะคำถามจากผู้เข้าร่วม): ได้ลำดับใหม่ของ Session ปลายทาง แล้วลบแถวเดิม
    if (ch.moveTo) {
      const target = sessionByCode_(ch.moveTo);
      if (!target) return { ok: false, error: 'ไม่พบ Session ปลายทาง' };
      if (target.code === code) return { ok: true, id: id };
      const vals = sh.getRange(r, 1, 1, HEADERS.length).getValues()[0];
      if (vals[COL.type - 1] === 'preset') return { ok: false, error: 'คำถามที่เตรียมไว้ย้าย Session ไม่ได้' };
      const o = {};
      HEADERS.forEach(function (h, i) { o[h] = vals[i]; });
      const tsh = sessionSheet_(target, true);
      o.no = nextNo_(tsh);
      o.id = target.code + '-' + ('00' + o.no).slice(-3);
      o.session = label_(target); o.updatedAt = new Date(); o.updatedBy = by;
      tsh.appendRow(rowOf_(o));
      sh.deleteRow(r);
      log_(by, code, id, 'moved to ' + target.code + ' as ' + o.id);
      return { ok: true, id: o.id, session: target.code };
    }

    const changes = [];
    if (ch.status !== undefined) {
      if (ch.status !== 'pending' && ch.status !== 'answered') return { ok: false, error: 'สถานะไม่ถูกต้อง' };
      sh.getRange(r, COL.status).setValue(ch.status);
      changes.push(ch.status === 'answered' ? 'answered' : 'unanswered');
    }
    if (ch.starred !== undefined) {
      sh.getRange(r, COL.starred).setValue(!!ch.starred);
      changes.push(ch.starred ? 'starred' : 'unstarred');
    }
    if (ch.note !== undefined) {
      sh.getRange(r, COL.note).setValue(safe_(clean_(ch.note, 300)));
      changes.push('note');
    }
    if (!changes.length) return { ok: true, id: id };
    sh.getRange(r, COL.updatedAt, 1, 2).setValues([[new Date(), by]]);
    log_(by, code, id, changes.join(', '));
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

// ====== 7) หลังบ้าน: ล็อก Session ที่กำลังรับคำถาม ('auto' = ตามเวลา) ======
function setCurrentSession(key, code, by) {
  requireKey_(key);
  const props = PropertiesService.getScriptProperties();
  const s = sessionByCode_(code);
  if (!s) props.deleteProperty('CURRENT_SESSION');
  else props.setProperty('CURRENT_SESSION', code);
  log_(clean_(by, 60) || 'Officer', s ? s.code : '-', '-', 'current_session=' + (s ? s.code : 'auto'));
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

// ลำดับคำถามจากผู้เข้าร่วมถัดไปของแท็บ (ต่อจากเลขสูงสุด กันเลขซ้ำแม้มีการลบ/ย้ายแถว)
function nextNo_(sh) {
  const last = sh.getLastRow();
  let max = 0;
  if (last >= 2) {
    sh.getRange(2, COL.id, last - 1, 1).getValues().forEach(function (r) {
      const m = String(r[0]).match(/-(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
  }
  return max + 1;
}

function locate_(id) {
  id = String(id || '');
  const ss = ss_();
  const first = sessionByCode_(id.split('-')[0]);
  const order = first ? [first].concat(CONFIG.SESSIONS.filter(function (s) { return s !== first; })) : CONFIG.SESSIONS;
  for (var i = 0; i < order.length; i++) {
    const sh = ss.getSheetByName(tabName_(order[i]));
    if (!sh || sh.getLastRow() < 2) continue;
    const cell = sh.getRange(2, COL.id, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
    if (cell) return { sheet: sh, row: cell.getRow(), code: order[i].code };
  }
  return null;
}

// ====== helpers: Sheet ======
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('ยังไม่ได้รันฟังก์ชัน setup()');
  return SpreadsheetApp.openById(id);
}

function rowOf_(o) {
  return HEADERS.map(function (h) {
    const v = o[h] === undefined || o[h] === null ? '' : o[h];
    return TEXT_COLS.indexOf(h) >= 0 ? safe_(v) : v;
  });
}

function styleSessionSheet_(sh) {
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#002C6C').setFontColor('#ffffff');
  sh.setColumnWidth(COL.question, 420);
  sh.setColumnWidth(COL.no, 50);
  sh.setTabColor('#F26334');
  const rows = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, COL.submittedAt, rows, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sh.getRange(2, COL.updatedAt, rows, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function sessionSheet_(s, create) {
  const ss = ss_();
  let sh = ss.getSheetByName(tabName_(s));
  if (!sh && create) {
    sh = ss.insertSheet(tabName_(s));
    sh.appendRow(HEADERS);
    styleSessionSheet_(sh);
  }
  return sh;
}

// แปลงแท็บ Session รูปแบบเก่า (ไม่มี no/type, สถานะ new/approved/hidden) เป็นรูปแบบใหม่ — ข้อมูลเดิมไม่หาย
function migrateSessionSheet_(sh) {
  const width = Math.max(sh.getLastColumn(), 1);
  const head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
  if (head.slice(0, HEADERS.length).join('|') === HEADERS.join('|')) return;
  const last = sh.getLastRow();
  const data = last >= 2 ? sh.getRange(2, 1, last - 1, width).getValues() : [];
  const rows = data.filter(function (r) { return r[head.indexOf('id')]; }).map(function (r) {
    const o = {};
    head.forEach(function (h, i) { if (h) o[h] = r[i]; });
    const id = String(o.id);
    o.type = o.type || (/-P\d+$/.test(id) ? 'preset' : 'audience');
    if (!o.no) o.no = o.type === 'preset' ? id.split('-').pop() : Number((id.match(/-(\d+)$/) || [])[1]) || '';
    o.status = status_(o.status);
    o.starred = bool_(o.starred);
    return rowOf_(o);
  });
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (rows.length) sh.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  styleSessionSheet_(sh);
}

// ใส่/อัปเดตคำถามที่ Officer เตรียมไว้ (id S0X-P1, S0X-P2 …) — สถานะ “ตอบแล้ว” เดิมไม่ถูกรีเซ็ต
function seedPresets_() {
  Object.keys(CONFIG.PRESET_QUESTIONS).forEach(function (code) {
    const s = sessionByCode_(code);
    if (!s) return;
    const sh = sessionSheet_(s, true);
    const last = sh.getLastRow();
    const ids = last >= 2 ? sh.getRange(2, COL.id, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    CONFIG.PRESET_QUESTIONS[code].forEach(function (q, i) {
      const id = code + '-P' + (i + 1);
      const at = ids.indexOf(id);
      if (at < 0) {
        sh.appendRow(rowOf_({ no: 'P' + (i + 1), id: id, type: 'preset', submittedAt: new Date(), session: label_(s),
          question: q, name: 'คำถามที่เตรียมไว้', organization: 'Officer', status: 'pending', starred: true }));
        log_('setup', code, id, 'preset added');
      } else if (unq_(sh.getRange(at + 2, COL.question).getValue()) !== q) {
        sh.getRange(at + 2, COL.question).setValue(safe_(q));
        log_('setup', code, id, 'preset text updated');
      }
    });
  });
}

function logSheet_() {
  const ss = ss_();
  let log = ss.getSheetByName(CONFIG.LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(CONFIG.LOG_SHEET);
    log.appendRow(LOG_HEADERS);
    log.setFrozenRows(1);
    log.getRange(1, 1, 1, LOG_HEADERS.length).setFontWeight('bold');
  }
  return log;
}

// แปลง AuditLog รูปแบบเก่า [at, by, questionId, change] → [at, by, session, questionId, action]
function migrateLog_() {
  const log = logSheet_();
  const width = Math.max(log.getLastColumn(), 1);
  const head = log.getRange(1, 1, 1, width).getValues()[0].map(String);
  if (head.slice(0, LOG_HEADERS.length).join('|') === LOG_HEADERS.join('|')) return;
  const last = log.getLastRow();
  const old = last >= 2 ? log.getRange(2, 1, last - 1, 4).getValues() : [];
  const rows = old.map(function (r) {
    const qid = String(r[2] || '-');
    const m = String(r[3] || '').match(/current_session=(S\d+)/);
    const sess = sessionByCode_(qid.split('-')[0]) ? qid.split('-')[0] : (m ? m[1] : '-');
    return [r[0], r[1], sess, qid, r[3]];
  });
  log.clear();
  log.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]).setFontWeight('bold');
  if (rows.length) log.getRange(2, 1, rows.length, LOG_HEADERS.length).setValues(rows);
  log.setFrozenRows(1);
}

function log_(by, session, id, action) {
  logSheet_().appendRow([new Date(), by, session || '-', String(id), action]);
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
  const L = function (h) { return String.fromCharCode(64 + COL[h]); };   // เลขคอลัมน์ → ตัวอักษร (A–Z)
  const rows = [['Session', 'เวลา', 'หัวข้อ', 'แท็บข้อมูล', 'คำถามทั้งหมด', 'เตรียมไว้ (★)', 'จากผู้เข้าร่วม', 'ยังไม่ตอบ', 'ตอบแล้ว']];
  CONFIG.SESSIONS.forEach(function (s) {
    const t = "'" + tabName_(s) + "'!";
    const rg = function (h) { return t + L(h) + '2:' + L(h); };
    rows.push([s.code, s.start + '-' + s.end, s.title, tabName_(s),
      '=COUNTA(' + rg('id') + ')',
      '=COUNTIF(' + rg('type') + ',"preset")', '=COUNTIF(' + rg('type') + ',"audience")',
      '=COUNTIF(' + rg('status') + ',"pending")', '=COUNTIF(' + rg('status') + ',"answered")']);
  });
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

function status_(v) { return String(v) === 'answered' ? 'answered' : 'pending'; }   // new/approved/hidden เดิม = ยังไม่ตอบ
function bool_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }

function clean_(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

// กันข้อความที่ขึ้นต้นด้วย = + - @ ถูกตีความเป็นสูตรใน Sheet
function safe_(s) {
  s = String(s == null ? '' : s);
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
