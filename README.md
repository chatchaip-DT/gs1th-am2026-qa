# GS1 Thailand – Event Q&A (AM2026) แยกตาม Session

ระบบรับคำถามจากผู้เข้าร่วมงานผ่าน QR Code (ไม่ต้องล็อกอิน) แล้วแยกคำถามตาม Session ของ Agenda ให้ MC / Moderator / Officer ดูในหน้า Q&A Console **ไม่มีหน้าไหนแสดงคำถามขึ้นจอ**

## ลิงก์

| ใช้ทำอะไร | URL |
|---|---|
| ผู้เข้าร่วม (QR) | `https://chatchaip-dt.github.io/gs1th-am2026-qa/` |
| Q&A Console (ทีมงาน) | `https://script.google.com/macros/s/AKfycbyxSR-L_L0JbU11pKINL_boSwREgmqtHj0bRd-KpVn6N6hbUJrw-ekqsEB6I9jEfeL4/exec?page=admin&key=<ADMIN_KEY>` |
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

## Google Sheet

| แท็บ | เก็บอะไร |
|---|---|
| Agenda | รายการ Session + จำนวนคำถาม (ทั้งหมด / ใหม่ / คิว MC / ตอบแล้ว / ซ่อน) คำนวณอัตโนมัติ |
| S01 09.30-09.50 … S10 15.00-15.15 | คำถามของแต่ละ Session หมายเลขรูปแบบ `S03-001` |
| AuditLog | log ทุกการเปลี่ยนแปลงของทุกคำถาม (รวมแท็บเดียว) |
| Questions | แท็บเดิมก่อนแยก Session ระบบไม่ใช้แล้ว ลบได้ |

## Q&A Console

1. หน้าแรกเป็นการ์ด Session พร้อมไอคอน จำนวนคำถามแต่ละสถานะ และป้าย **LIVE** ที่ Session ที่กำลังรับคำถาม
2. กดการ์ด (หรือ “เปิด Session นี้”) เพื่อเข้า Session — เห็นเฉพาะคำถามของ Session นั้น
3. แท็บ ใหม่ → คิว MC → ตอบแล้ว / ซ่อน ทำงานเหมือนเดิม คำถามใหม่สุดอยู่บน ปักดาวดันขึ้นบนสุด
4. อัปเดตจาก Sheet อัตโนมัติ (หน้า Session ทุก ~4 วินาที, หน้ารวมทุก ~8 วินาที)

## โครงสร้าง repo

| ไฟล์ | ใช้ที่ไหน |
|---|---|
| `index.html` | หน้าส่งคำถามสำหรับผู้เข้าร่วม (GitHub Pages) — ส่งคำถามไป Apps Script ผ่าน `doPost` |
| `apps-script/Code.gs` | Backend ของ Apps Script โปรเจกต์ “GS1 Q&A AM 2026” |
| `apps-script/Admin.html` | หน้า Q&A Console สำหรับ MC / Moderator / Officer |
| `apps-script/Index.html` | หน้าส่งคำถามแบบเดิมใน Apps Script (สำรอง) |

> ใน repo ไม่มีความลับ: `ADMIN_KEY`, `SHEET_ID`, `PUBLIC_URL` เก็บใน Script properties ของ Apps Script เท่านั้น
> แก้โค้ดใน `apps-script/` แล้วต้องคัดลอกไปวางใน Apps Script editor → บันทึก → Deploy → Manage deployments → Edit → New version

## ก่อนวันงาน
- [ ] ลบแท็บ `Questions` (เก่า) และแถวทดสอบใน AuditLog
- [ ] ทดสอบส่งคำถามจากมือถือ แล้วดูว่าเข้า Session ถูกต้อง
- [ ] แจกลิงก์ Console เฉพาะทีมงาน
