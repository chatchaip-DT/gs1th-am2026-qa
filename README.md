# GS1 Thailand – Event Q&A (AM2026) แยกตาม Session

ระบบรับคำถามจากผู้เข้าร่วมงานผ่าน QR Code (ไม่ต้องล็อกอิน) แล้วแยกคำถามตาม Session ของ Agenda ให้ **Speaker** และ **Officer** ดูในหน้า Q&A Console **ไม่มีหน้าไหนแสดงคำถามขึ้นจอ**

## ลิงก์

| ใช้ทำอะไร | URL |
|---|---|
| ผู้เข้าร่วม (QR) | `https://chatchaip-dt.github.io/gs1th-am2026-qa/` |
| Q&A Console (Speaker / Officer) | `https://script.google.com/macros/s/AKfycbyxSR-L_L0JbU11pKINL_boSwREgmqtHj0bRd-KpVn6N6hbUJrw-ekqsEB6I9jEfeL4/exec?page=admin&key=<ADMIN_KEY>` |
| Google Sheet | `GS1TH Event Q&A – Data` |

`ADMIN_KEY` อยู่ใน Apps Script → Project Settings → Script properties (เปลี่ยนได้ทันที ลิงก์เก่าจะใช้ไม่ได้)

## Session (ตาม Agenda)

| รหัส | เวลา | หัวข้อ |
|---|---|---|
| S01 | 09:30–09:50 | GS1 Thailand SMART Barcode |
| S02 | 09:50–10:20 | GS1 Thailand x FDA : Digital Labeling |
| S03 | 10:30–11:00 | Digital Product Passport: Understanding Tomorrow's Product Requirements, Preparing Thai Industry Today |
| S04 | 11:00–11:30 | GS1 Thailand SMART Services |
| S05 | 11:30–12:00 | Beyond the Barcode: Unlocking Business Value (EN) |
| S06 | 12:00–12:15 | Innovative Coding Solutions for GS1 & 2D Codes through LEIBINGER Solutions |
| S07 | 13:00–13:45 | Panel Discussion: CP Thailand World (Supply Chain) |
| S08 | 14:00–14:45 | T-Beauty Ascends to the Global Stage |
| S09 | 14:45–15:00 | ยกระดับ Traceability ให้สมบูรณ์แบบ ด้วยระบบผูกข้อมูลสินค้า (Aggregation Solution) |
| S10 | 15:00–15:15 | ยกระดับการทำงานยุคใหม่ ด้วยเทคโนโลยี Auto-ID |

แก้หัวข้อ/เวลาได้ที่ `CONFIG.SESSIONS` ใน `Code.gs` → บันทึก → รัน `setup()` → Deploy เวอร์ชันใหม่

### คำถามเข้า Session ไหน
- **อัตโนมัติตามเวลา (เวลาไทย):** ส่งระหว่าง Session → เข้า Session นั้น, ช่วงพัก/ก่อนเริ่ม → เข้า Session ถัดไป, หลัง 15:15 → เข้า S10
- **ล็อกเอง:** ถ้ากำหนดการเลื่อน ทีมงานเลือก “ล็อก S0X” ที่หน้า Console ได้ทันที และกลับเป็น “อัตโนมัติตามเวลา” เมื่อไรก็ได้
- **ย้ายภายหลัง:** คำถามที่เข้าผิด Session กด “ย้าย Session” ในการ์ดคำถามได้ (จะได้หมายเลขใหม่ของ Session ปลายทาง และบันทึกใน AuditLog)

## คำถามที่เตรียมไว้ (★)

Officer เตรียมคำถามให้ Speaker ไว้ใช้กรณีผู้เข้าร่วมไม่มีคำถาม — ติดดาวอัตโนมัติและแสดงบนสุดของ Session เสมอ (id `S0X-P1`, `S0X-P2`)

| Session | จำนวน | Speaker |
|---|---|---|
| S02 Digital Labeling | 2 | Pharm. Kulthida (อย.) |
| S03 Digital Product Passport | 2 | Patrik |
| S07 Panel Discussion: CP Thailand World | 2 | CPRAM / CP Axtra |

แก้/เพิ่มได้ที่ `CONFIG.PRESET_QUESTIONS` ใน `Code.gs` → รัน `setup()` (สถานะ “ตอบแล้ว” เดิมไม่ถูกรีเซ็ต)

## Google Sheet

| แท็บ | เก็บอะไร |
|---|---|
| Agenda | รายการ Session + จำนวนคำถาม (ทั้งหมด / เตรียมไว้ / จากผู้เข้าร่วม / ยังไม่ตอบ / ตอบแล้ว) คำนวณอัตโนมัติ |
| S01 09.30-09.50 … S10 15.00-15.15 | คำถามของแต่ละ Session คอลัมน์ `no, id, type, submittedAt, session, question, name, organization, status, starred, note, updatedAt, updatedBy, clientId` |
| AuditLog | log การส่งคำถามและทุกการเปลี่ยนแปลง คอลัมน์ `at, by, session, questionId, action` |
| Questions | แท็บเดิมก่อนแยก Session ระบบไม่ใช้แล้ว ลบได้ |

- `type` = `preset` (เตรียมไว้) / `audience` (ผู้เข้าร่วม), `no` = เลขลำดับ 1, 2, 3 … ต่อ Session (preset = `P1`, `P2`)
- `status` = `pending` (ยังไม่ตอบ) / `answered` (ตอบแล้ว)
- `action` ใน AuditLog เช่น `submitted #3`, `answered`, `unanswered`, `starred`, `note`, `moved to S04 as S04-002`, `current_session=S02`, `preset added`

## Q&A Console

| บทบาท | ทำอะไรได้ |
|---|---|
| Speaker | ดูคำถามอย่างเดียว (ไม่มีปุ่ม) |
| Officer | ✓ ตอบแล้ว / ↺ ยังไม่ตอบ, ติดดาว, โน้ต, ย้าย Session, ล็อก Session ที่กำลังรับคำถาม |

1. หน้าแรกเป็นการ์ด Session พร้อมไอคอน จำนวนคำถาม และป้าย **LIVE** ที่ Session ที่กำลังรับคำถาม
2. กดการ์ด (หรือ “เปิด Session นี้”) เพื่อเข้า Session — เห็นเฉพาะคำถามของ Session นั้น
3. แท็บ **ยังไม่ตอบ / ตอบแล้ว / ทั้งหมด** — ★ คำถามที่เตรียมไว้อยู่บนสุด ตามด้วยคำถามที่ติดดาว แล้วคำถามจากผู้เข้าร่วมใหม่สุดอยู่บน
4. คำถามจากผู้เข้าร่วมมี **ไอคอนเลขลำดับ** 1, 2, 3 … ตามลำดับที่ส่งเข้ามาใน Session นั้น
5. อัปเดตจาก Sheet อัตโนมัติ (หน้า Session ทุก ~4 วินาที, หน้ารวมทุก ~8 วินาที)

## โครงสร้าง repo

| ไฟล์ | ใช้ที่ไหน |
|---|---|
| `index.html` | หน้าส่งคำถามสำหรับผู้เข้าร่วม (GitHub Pages) — ส่งคำถามไป Apps Script ผ่าน `doPost` |
| `apps-script/Code.gs` | Backend ของ Apps Script โปรเจกต์ “GS1 Q&A AM 2026” |
| `apps-script/Admin.html` | หน้า Q&A Console สำหรับ Speaker / Officer |
| `apps-script/Index.html` | หน้าส่งคำถามแบบเดิมใน Apps Script (สำรอง) |

> ใน repo ไม่มีความลับ: `ADMIN_KEY`, `SHEET_ID`, `PUBLIC_URL` เก็บใน Script properties ของ Apps Script เท่านั้น
> แก้โค้ดใน `apps-script/` แล้วต้องคัดลอกไปวางใน Apps Script editor → บันทึก → รัน `setup()` → Deploy → Manage deployments → Edit → New version

## ก่อนวันงาน
- [ ] ลบแท็บ `Questions` (เก่า), คำถามทดสอบในแท็บ S01/S04/S10 และแถวทดสอบใน AuditLog
- [ ] ตั้ง Session ที่กำลังรับคำถามกลับเป็น “อัตโนมัติตามเวลา” (ถ้าล็อกไว้ตอนทดสอบ)
- [ ] ทดสอบส่งคำถามจากมือถือ แล้วดูว่าเข้า Session ถูกต้อง
- [ ] แจกลิงก์ Console เฉพาะทีมงาน
