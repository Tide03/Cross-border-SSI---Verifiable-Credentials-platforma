# 🎓 SSI Microcredentials Platform

## O Aplikaciji

**SSI Microcredentials** je platforma za digitalne preverjljive poverilnice na osnovi Self-Sovereign Identity (SSI). Omogoča decentralizirano izdajanje, deljenje in preverjanje digitalnih certifikatov z vgrajeno podporo za cross-border interoperabilnost in GDPR compliance.

### 🌍 Ključne Lastnosti

- **Tri vloge:**
  - 👨‍🎓 **Learner (Prejemnik)** - prejema in deli poverilnice
  - 🏫 **Issuer (Izdajatelj)** - kreira in izdaja poverilnice
  - ✅ **Verifier (Preverjatelj)** - preverja pristnost poverilnic

- **Selective Disclosure** - deli le relevantne podatke, ne vsega
- **Kriptografska Varnost** - vse je digitalno podpisano in nevmešljivo
- **Consent Management** - ekspliciten consent z jasno komunikacijo (kaj/kdo/zakaj)
- **Audit Trail** - transparentna zgodovina brez osebnih podatkov
- **Multi-language** - Slovenščina in Angleščina vgrajeni
- **Batch Operations** - množična izdajanja za institucije
- **WCAG 2.1 AA** - dostopnost za vse uporabnike

---

## 🚀 Hitri Začetek

### Instalacija

```bash
# Kloniraj projekt
git clone <repo-url>
cd Projekt

# Instaliraj odvisnosti
npm install

# Zaženi development server
npm run dev
```

Server se bo zagnal na `http://localhost:5173`

### Build za Produkcijo

```bash
npm run build
npm run preview
```

---

## 📋 Kako Deluje

### 1️⃣ Registracija in Prijava

1. Pojdi na aplikacijo
2. Izberi **Sign Up**
3. Izberi vlogo: **Learner**, **Issuer** ali **Verifier**
4. Izberi jezik (**English** ali **Slovenščina**)
5. Ustvari račun

### 2️⃣ Learner Workflow (Prejemnik)

```
Prejmi poverilnico → Vidi v inbox → Izberi atribute → Deli s soglasjem → QR kod
```

- Denarnica za hrambo poverilnic
- Inbox z najnovejšimi prejemami
- Selective disclosure - izbira katerih podatkov želiš deliti
- Explicit consent - potrditev deljenja
- Share history - sledenje kaj si delil, s kom in kdaj

### 3️⃣ Issuer Workflow (Izdajatelj)

```
Ustvari template → Izdaj poverilnico (eno ali batch) → Upravljaj → Revizijska poročila
```

- Template builder - definiraj strukturo poverilnic
- Single issue - ročna izdaja eni osebi
- Batch issue - masovna izdaja (JSON array)
- Revocations - preklic veljavnosti
- Audit logs - detaljno sledenje brez PII

### 4️⃣ Verifier Workflow (Preverjatelj)

```
Prejmi poverilnico → Paste/Scan JSON → Avtomatska verifikacija → Rezultat
```

- QR koda skeniranje
- JSON paste opcija
- Avtomatska preverjanja:
  - ✅ Podpis veljaven?
  - ✅ Izdajatelj je pravi?
  - ✅ Ni bila preklicana?
  - ✅ Ni potekla?
- Export receipt - potrdilo preverjanja

---

## 🗂️ Testiranje

### Test Podatki

V `/TEST_DATA.md` najdeš:
- Test poverilnice za Learner
- Template specifikacije za Issuer
- Batch issue primere
- Verification primere

### Hitri Test

1. **Learner:** Kopiraj poverilnico iz TEST_DATA in jo deli
2. **Issuer:** Ustvari template in batch issue s podatki
3. **Verifier:** Paste test poverilnico in jo preveri

---

## 🏗️ Arhitektura

```
src/
├── app/
│   ├── App.tsx              # Main router
│   └── components/
│       ├── Auth.tsx         # Login & Sign Up
│       ├── LearnerDashboard.tsx    # Prejemnik
│       ├── IssuerDashboard.tsx     # Izdajatelj
│       └── VerifierDashboard.tsx   # Preverjatelj
├── lib/
│   ├── api.ts              # API klici
│   └── i18n.ts             # Prevodi (EN/SL)
└── styles/
    └── index.css           # Tailwind styles
```

---

## 🔐 Varnost & Compliance

- ✅ **GDPR compliant** - obvestilo v Auth
- ✅ **WCAG 2.1 AA** - ARIA labels, keyboard navigation
- ✅ **Kriptografska varnost** - RSA signatures
- ✅ **Audit trail** - brez PII, samo metadata
- ✅ **Data residency** - obvestilo o lokaciji podatkov

---

## 🌐 Lokalizacija

Aplikacija podpira:
- 🇬🇧 **English**
- 🇸🇮 **Slovenščina**

Language selector je dostopan povsod - nastavitve se spremenijo v realnem času.

---

## 📞 Kontakt & Podporа

- 📧 Email: [tvoj-email]
- 🐛 Bugs: [issue-tracker]
- 📚 Dokumentacija: [wiki]

---

## 📄 Licenca

[Dodaj licenco - MIT, GPL, itd.]

---

## 🙏 Zahvala

Projekt je razvit kot del projekta za cross-border SSI platformo.

Osnovna Figma zasnova: https://www.figma.com/design/61DPNccIv7EuEcJPT5pkLI/Cross-Border-Credential-Platform
  