# agenta-web

Agenta mobil uygulaması için statik yasal sayfalar (Firebase Hosting’e hazır).

## Sayfalar

| URL | Açıklama |
| --- | --- |
| `/` | Ana sayfa |
| `/privacy-policy` | Gizlilik Politikası (TR / EN) |
| `/terms-of-use` | Kullanım Koşulları (TR / EN) |

İçerik, Agenta uygulamasındaki `legal_documents.dart` ile uyumludur.

## Yerel önizleme

```bash
cd public
python3 -m http.server 8080
```

Tarayıcı: http://localhost:8080

## Firebase Hosting deploy

Firebase CLI ile giriş yaptıktan sonra:

```bash
firebase use agenta-c1d6b
firebase deploy --only hosting
```

Deploy sonrası örnek URL’ler:

- `https://agenta-c1d6b.web.app/privacy-policy`
- `https://agenta-c1d6b.web.app/terms-of-use`

## App Store / Play Store

Mağaza formlarına şu URL’leri verebilirsiniz (deploy sonrası kendi domain’iniz varsa onu kullanın):

- Privacy Policy: `https://agenta-c1d6b.web.app/privacy-policy`
- Terms of Use: `https://agenta-c1d6b.web.app/terms-of-use`
