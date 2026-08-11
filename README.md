# Agenta Web — Next.js Admin Panel

Agenta mobil uygulaması için yönetim paneli ve yasal sayfalar.

## Özellikler

- Üst menüden **Login** (Firebase Auth e-posta + şifre)
- Admin dashboard
- İçerik moderasyonu (`pending` → `approved` / `rejected`)
- Ajan / Exper / Usta / Servis başvuru yönetimi
- Kullanıcı CRUD + kullanıcının ilan/içerikleri
- İlan yönetimi (yayınla / gizle / düzenle / sil)
- Gizlilik ve kullanım koşulları sayfaları

## Kurulum

```bash
npm install
cp .env.example .env.local   # gerekirse düzenleyin
npm run dev
```

Tarayıcı: http://localhost:3000

## Admin hesabı

1. Firebase Console → Authentication’da bir kullanıcı oluşturun (veya mevcut hesabı kullanın).
2. Firestore `users/{uid}` belgesine `isAdmin: true` ekleyin.
3. Web’de Login ile e-posta + şifre girin.

İsteğe bağlı: `.env.local` içinde `NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com` ile ek e-posta beyaz listesi (yine de Firestore yazmaları için `isAdmin: true` gerekir).

## Firestore kuralları

Admin yazma yetkisi mobil repodaki `firestore.rules` içinde `isAdmin()` ile tanımlıdır. Deploy:

```bash
cd ../agenta
firebase deploy --only firestore:rules
```

## Deploy (Firebase Hosting + Next.js)

```bash
firebase experiments:enable webframeworks
firebase use agenta-c1d6b
firebase deploy
```

## Yasal URL’ler

- `/privacy-policy` → Privacy Policy
- `/terms-of-use` → Terms of Use
