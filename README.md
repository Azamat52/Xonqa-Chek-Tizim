# Xonqa Tandir Tovuq — React + Vite

Loyiha mavjud dizayn va biznes logikasini saqlagan holda React + Vite konfiguratsiyasiga moslangan. Frontend `src/` ichida JavaScript/JSX ishlatadi. Supabase Edge Function va Drizzle konfiguratsiyasidagi TypeScript fayllari faqat backend/tooling uchun qoldirilgan; ular React frontend qismi emas.

## Ishga tushirish

1. Node.js 22.12+ (yoki undan yangi LTS) o‘rnating.
2. `.env.example` faylidan `.env` yarating va o‘zingizning Supabase URL hamda publishable key qiymatlaringizni kiriting. ZIP ichida haqiqiy `.env` saqlanmaydi.
3. `npm install` — dependency’larni o‘rnating va yangi `package-lock.json` yarating. Keyingi deploylarda lockfile’ni repozitoriyga qo‘shib, `npm ci` ishlating.
4. `npm run dev` — sayt `http://localhost:8080` da ochiladi.
5. `npm run build` — production build `dist/` papkasiga yig‘iladi.
6. `npm run preview` — buildni lokal tekshirish.
7. `npm run check` — lint, format, test va production build tekshiruvlarini ketma-ket bajarish.

## Sahifalar

- Boshqaruv: `/`
- Yangi savdo: `/pos`
- Savdolar va tafsilotlar: `/sales`
- Admin kirish: `/login`

## Admin kirish ma’lumotlari

Xavfsizlik uchun loyihada `admin/admin` kabi standart parol yo‘q. Birinchi kirishdan oldin Supabase Edge Function secrets ichida `ADMIN_INITIAL_LOGIN` va kamida 12 belgili `ADMIN_INITIAL_PASSWORD` o‘rnating. Birinchi kirishdan so‘ng admin panel sozlamalarida login va parolni o‘zgartiring. Saqlangandan keyin admin ma’lumotlari `app_settings` jadvalidan olinadi.

## Supabase sozlash

1. Supabase SQL Editor’da faqat `supabase/setup.sql` faylini to‘liq ishga tushiring. Eski Drizzle va buyurtma migratsiyalarini qayta ishlatmang. Avval bazani zaxiralang: eski buyurtmalar va aksiyalar o‘chiriladi, POS savdolari saqlanadi.
2. `supabase/functions/api` Edge Function’ni deploy qiling (`supabase functions deploy api`). Supabase project uchun CLI login/link ham bajarilgan bo‘lishi kerak.
3. Supabase Edge Function muhitida `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` mavjudligini tekshiring. Service-role kalitini `.env` frontend o‘zgaruvchisiga yoki `VITE_` nomiga hech qachon qo‘ymang.
4. Supabase project URL va publishable key’ni hosting muhitida ham sozlang.

## Eslatma

- `VITE_` bilan boshlangan o‘zgaruvchilar brauzerga chiqadi. Faqat publishable key ishlating.
- Ma’lumotlar bazasida RLS yoqilgan; backend amallari service-role kalitidan foydalanuvchi Edge Function orqali bajariladi.
- Frontend static hosting uchun SPA fallback/rewrite’ni `index.html` ga sozlang, shunda `/admin/login` kabi yo‘llar to‘g‘ri ochiladi.
- `npm run lint`, `npm run format:check`, `npm test` va `npm run build` production oldi tekshiruvlari uchun mavjud.
- Recharts 3 va ESLint 10 ga yangilangan. Recharts grafiklarining amaliy ko‘rinishini brauzerda ham tekshiring.
- `package-lock.json` ZIPga kiritilmagan: ish muhitida registry’ga ulanish cheklangani sababli lockfile’ni ishonchli qayta generatsiya qilib tekshirish imkoni bo‘lmadi. Birinchi `npm install` yangi lockfile yaratadi; uni Git’ga qo‘shing va CI/deployda `npm ci` ishlating.

## v3 — Savdolar

- Mijozlar bo‘limi o‘rnida Savdolar: barcha saqlangan savdolar, nomi, umumiy narxi, sarflangan vaqt va mahsulotlar tafsilotlari.
- Nom ixtiyoriy. Vaqt birinchi mahsulot qo‘shilganidan savdo saqlanguncha hisoblanadi; savdo vaqti bazadan olinib Toshkent vaqti bilan `yil.oy.kun soat:daqiqa` shaklida chiqadi.
- Eski savdolarda nom va davomiylik noma’lum bo‘lsa `Nomsiz savdo` / `—` chiqadi. Mavjud savdolar o‘chirilmaydi.
- Mahsulot nomi va narxi savdo vaqtida nusxa qilib saqlanadi; keyinchalik mahsulot o‘zgarsa eski chek o‘zgarmaydi.
- Savdo, mahsulotlar va qoldiq bitta SQL amali bilan saqlanadi; faqat admin sessiyasi tasdiqlangandan keyin.
- Savdolar saqlangandan so‘ng yangilanadi; boshqa ochiq oynalarda har 4 soniyada tekshiriladi.

### Yangilash tartibi

1. Zaxira nusxa oling, so‘ng SQL Editor’da `supabase/setup.sql` ni to‘liq bajaring. Fayl yangi baza uchun ham, mavjud v2 baza uchun ham mos; qayta bajarish POS savdolarini o‘chirmaydi.
2. **API ni ham yangilang:** `supabase functions deploy api`. Faqat frontend yoki SQL ni yangilash yetmaydi.
3. Frontendni yangilab build/deploy qiling; mavjud `.env` sozlamalaringizni saqlang. ZIP ichida maxfiy `.env` yo‘q.
4. Bir savdoni nomsiz, birini nom bilan saqlab, `/sales` dagi tafsilotlarini oching va chekni tekshiring.
5. Eski `order-receipts` fayllari kerak bo‘lmasa Storage boshqaruvidan o‘chiring. SQL orqali Storage metadata o‘chirilmaydi.

### Sinovlar

- `node --test src/test/sale-rules.test.js` — Toshkent sana/vaqti, davomiylik va eski savdolardagi noma’lum vaqt.
- `src/test/sale-persistence.sql` — setup bajarilgandan keyin SQL Editor’da alohida ishlating; sinovlar transaction oxirida ROLLBACK qiladi va ma’lumot qoldirmaydi.
- Mahalliy PostgreSQL sinovida yangi setup, qayta setup, eski v2 ustunlaridan yangilash va savdo saqlash tekshirildi.
- Haqiqiy hosting/bazada admin kirish va chop etish tekshirilmagan; yuqoridagi yangilashdan so‘ng tekshiring.

## v3.2.3 — savdo holati tuzatishi

- Agar savdolarda **"Yetkazildi"** chiqsa — Supabase’dagi `api` funksiyasi eski. Albatta bajaring:
  1. Supabase SQL Editor’da `supabase/setup.sql` ni ishga tushiring.
  2. Terminalda: `supabase functions deploy api`.
- Chop etilgan / saqlangan savdoda tovush chalinadi, bekor qilinganda faqat xabar chiqadi.
- Xabardagi **"Ko‘rish"** savdolar sahifasini shu holat filtri bilan ochadi.
## Production deploy oldidan

- Hosting’da `VITE_SUPABASE_URL` va `VITE_SUPABASE_PUBLISHABLE_KEY` ni environment variables sifatida kiriting. `VITE_` qiymatlari brauzerga chiqadi; faqat publishable key ishlating.
- `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_INITIAL_PASSWORD` va boshqa maxfiy qiymatlarni faqat Supabase Edge Function secrets’da saqlang.
- Supabase SQL setup/migratsiyalarini backup va staging tekshiruvisiz production bazada qayta bajarmang.
- Supabase Auth/Edge Function uchun CORS, RLS siyosatlari, admin sessiya muddati va login urinishlari cheklovlarini production loyihangizda tekshiring.
- Static hosting’da SPA fallback/rewrite’ni `index.html` ga yo‘naltiring; HTTPS yoqing.
- ZIP tarkibidagi `supabase/.temp` va lokal `.env` ataylab chiqarib tashlangan.

## Chek chop etish

POS chek standart kengligi 80 mm qilib sozlangan. Chop etishda sahifa balandligi chekdagi mahsulotlar soniga qarab avtomatik hisoblanadi; bu A4 sahifada chek burchakda juda kichik chiqishi va ortiqcha bo'sh sahifa hosil bo'lishi muammosini kamaytiradi. Printer drayverida imkon bo'lsa, qog'oz turini `80 mm` (80×80 yoki 80 mm roll) qilib tanlang. 58 mm printerda 80 mm qog'oz sozlamasi bilan chop etmang — bu tizim hozircha 80 mm standartga mo'ljallangan.
