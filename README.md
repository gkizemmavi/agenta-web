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

## Cloudflare deploy

Build komutu (Workers / Pages):

```bash
npm run deploy
```

veya CI’da:

```bash
npx wrangler deploy
```

(`wrangler.jsonc` + OpenNext repo’da hazır; tekrar interactive migrate çalışmamalı.)

### Firebase API key / Variables

Dashboard’da **“Variables cannot be added to a Worker that only has static assets”** görürseniz normal: ilk başarısız deploy Worker’ı sadece static assets olarak bırakmış olabilir. Firebase key’leri için dashboard’a bir şey eklemenize **gerek yok**:

- Key’ler `lib/firebase.ts` içinde fallback
- Aynı key’ler `wrangler.jsonc` → `vars` içinde (deploy ile gelir)

**Cloudflare Deploy / Build komutu şunu olmalı:**

```bash
npm run deploy
```

(`npx wrangler deploy` tek başına yetmez; önce OpenNext build gerekir.)

Bu deploy sonrası Worker artık gerçek script + assets olur; isterseniz o zaman dashboard’dan da variable ekleyebilirsiniz.

### Firebase Auth domain

Canlı site domain’inizi Firebase’e ekleyin:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Cloudflare worker URL’nizi ekleyin (örn. `agenta-web.<account>.workers.dev` veya custom domain)

### Storage CORS (opsiyonel)

Videolar admin panelde artık auth’lu Storage `getBlob` ile yüklenir. Direkt URL oynatma için:

```bash
gsutil cors set storage-cors.json gs://agenta-c1d6b.firebasestorage.app
```

## Yasal URL’ler

- `/privacy-policy` → Privacy Policy
- `/terms-of-use` → Terms of Use
