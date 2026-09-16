# Linkplek — Vercel + Google

Complete Nederlandstalige linkpagina-app voor **Next.js op Vercel**, met **Google-login via Auth.js**, **Neon PostgreSQL** en **Vercel Blob**. Bevat profielbeheer, foto/logo-upload, links toevoegen/bewerken/verbergen/verwijderen, slepen en toetsenbordalternatief, vormgeving, livevoorbeeld en PNG/SVG QR-downloads.

Deze versie is zelfstandig: er zijn geen ChatGPT-account, Sites-hosting of Cloudflare-bindings nodig. De Google-koppeling is geïmplementeerd, maar werkt pas nadat jouw Google OAuth-app en omgevingsvariabelen zijn ingesteld.

## 1. Upload naar GitHub

Pak het ZIP-bestand uit. Zet de **inhoud** van `linkplek-vercel` in de hoofdmap van je repository, zodat `package.json` bovenaan staat. Upload ook `.gitignore` en `.env.example`. Upload geen echte `.env.local`, `node_modules` of `.next`.

Als je de eerdere Sites-code vervangt, gebruik deze volledige map als nieuwe projectinhoud: meng beide versies niet. Deze versie gebruikt `next build`, geen Vinext of Wrangler.

## 2. Maak een Vercel-project

Importeer de GitHub-repository in Vercel. Selecteer **Next.js** en de map met `package.json` als Root Directory. Gebruik Node.js 22.x of hoger (minimaal 22.13). Vercel gebruikt de vastgelegde pnpm-versie en `pnpm run build`.

Kies je vaste productieadres, bijvoorbeeld `https://jouw-project.vercel.app`, of je eigen domein. Dit adres is nodig voor Google-login en staat hieronder aangeduid als `JOUW_DOMEIN`. Gebruik niet het tijdelijke adres van iedere preview-deployment.

## 3. Koppel de database en foto-opslag

- Koppel een **Neon PostgreSQL**-database via Vercel Marketplace/Storage. Zorg dat de verbindingsstring beschikbaar is als `DATABASE_URL`.
- Voer de inhoud van `migrations/001_profiles.sql` één keer uit in de Neon SQL Editor. Dit maakt `profiles` en `avatars`; het script verwijdert geen gegevens. Alternatief: voer lokaal `pnpm db:migrate` uit met `DATABASE_URL` in `.env.local`.
- Maak een **openbare Vercel Blob-store** en verbind deze met het project. Gebruik de door Vercel beheerde OIDC-koppeling met `BLOB_STORE_ID`, of stel `BLOB_READ_WRITE_TOKEN` in. De app gebruikt de SDK-configuratie op de server.
- Houd test- en productiedatabases gescheiden wanneer je previews gebruikt.

Bronnen: [Vercel-opslag](https://vercel.com/docs/storage), [Neon-driver](https://github.com/neondatabase/serverless), [Vercel Blob-configuratie](https://vercel.com/docs/vercel-blob/using-blob-sdk).

## 4. Google-inloggen activeren

1. Open [Google Cloud Console](https://console.cloud.google.com/), selecteer of maak een project en open **Google Auth Platform**.
2. Vul de appnaam `Linkplek`, het supportadres en de benodigde branding/audience-instellingen in. Gebruik External als ook mensen buiten jouw organisatie mogen inloggen.
3. Maak bij Clients een OAuth-client van het type **Web application**.
4. Voeg bij Authorized JavaScript origins je productie-origin toe: `https://JOUW_DOMEIN`.
5. Voeg bij Authorized redirect URIs **exact** toe:

   ```text
   https://JOUW_DOMEIN/api/auth/callback/google
   ```

6. Voor lokale ontwikkeling kun je ook toevoegen:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

7. Zet de Client ID en Client secret in de onderstaande Vercel-variabelen. Bewaar het secret alleen als omgevingsvariabele.
8. Staat je Google-app nog op Testing? Voeg de gebruikers die testen toe aan de testgebruikers. Stel de juiste productie-publicatiestatus in als iedereen de app moet kunnen gebruiken; rond eventuele vereiste Google-controles af.

Alleen de standaard login-scope voor identiteit is nodig; de app vraagt geen toegang tot Gmail, Drive of Agenda. Bron: [Auth.js Google-provider](https://authjs.dev/getting-started/providers/google), [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## 5. Vercel-omgevingsvariabelen

Stel deze waarden in onder Project → Settings → Environment Variables:

| Naam | Waarde |
| --- | --- |
| `AUTH_GOOGLE_ID` | OAuth Client ID van Google |
| `AUTH_GOOGLE_SECRET` | OAuth Client secret van Google |
| `AUTH_SECRET` | Een nieuwe, lange willekeurige geheime waarde |
| `AUTH_URL` | Exacte productie-origin, bijvoorbeeld `https://jouw-project.vercel.app` |
| `DATABASE_URL` | Neon PostgreSQL-verbindingsstring |
| `BLOB_STORE_ID` | Door de gekoppelde Vercel Blob-store ingesteld bij OIDC |
| `BLOB_READ_WRITE_TOKEN` | Alternatief voor de OIDC-koppeling; ook bruikbaar lokaal |

Genereer `AUTH_SECRET` op je eigen computer:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Deze waarden horen **niet** in GitHub en krijgen geen `NEXT_PUBLIC_`-prefix. Na instellen/wijzigen: **Redeploy** in Vercel. Bij gebruik van een eigen domein moeten `AUTH_URL` en de Google redirect URI overeenkomen. Zorg dat anonieme bezoekers toegang hebben tot de productiepublicatie; algemene Vercel Deployment Protection kan anders ook QR-bezoekers tegenhouden.

Bron: [Auth.js-configuratie](https://authjs.dev/getting-started/installation).

## Lokaal ontwikkelen

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
# Vul jouw configuratie in .env.local in.
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`. Zonder Google-configuratie zie je een duidelijke melding en is aanmelden uitgeschakeld. Zonder database kun je geen links opslaan. Voor foto-uploads is ook Blob-configuratie nodig.

Controleer de code met:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

## Gebruik en beveiliging

- `/` vereist een geldige sessie; bezoekers zonder sessie worden naar `/inloggen` gestuurd.
- Na Google-login komt de gebruiker op het eigen dashboard. De eerste opslag maakt het profiel.
- De eigenaar komt uit Google's geverifieerde, onveranderlijke `sub`-identiteit in een door Auth.js beschermde sessie. E-mailadressen worden niet gebruikt voor automatische accountkoppeling.
- API-aanvragen controleren de sessie en de Origin op de server. Gegevens worden met geparametriseerde SQL opgeslagen. De browser kan geen andere eigenaar of pagina-URL kiezen.
- De bestaande pagina-UUID blijft bij iedere opslag gelijk. De QR-code bevat alleen `/p/<uuid>` op het huidige domein. Publieke pagina's tonen alleen zichtbare links en vereisen geen login.
- Profielfoto's zijn openbaar. Een foto uit een profiel verwijderen verwijdert de verwijzing; de oude upload blijft in Blob tot de beheerder deze opruimt.
- Auth.js verzorgt OAuth, CSRF-bescherming voor aanmelden/afmelden en versleutelde sessiecookies. Deze versie gebruikt de vastgelegde Auth.js v5-beta uit de lockfile.

## Overstappen vanaf de eerdere Sites-versie

Deze code verandert de bestaande Sites-publicatie niet en kopieert geen productiegegevens. Bestaande ChatGPT-profielen, foto's en hun oude QR-adressen worden **niet automatisch** naar Google-accounts of een nieuw domein overgezet. Een bestaand profiel veilig overzetten vereist een gecontroleerde eigenaarskoppeling en een gegevens-/fotomigratie. Behoud bij zo'n migratie de pagina-UUID's en regel verwijzingen vanaf het oude domein voordat je al gedrukte QR-codes vervangt. Koppel accounts nooit automatisch alleen op basis van een gelijk e-mailadres.

## Laatste controle na configuratie

1. Log in met Google, maak twee links en sla op.
2. Download de QR-code en open deze op een telefoon zonder ingelogde sessie.
3. Wijzig/verberg een link en scan dezelfde QR-code opnieuw.
4. Log uit en opnieuw in: je eigen profiel hoort terug te komen.
5. Gebruik een tweede Google-account: dit moet een afzonderlijk profiel hebben.

De lokale controles testen accountidentiteit, URL-validatie, Origin-controles en begrensde uploads. Echte Google-aanmelding, productieopslag en camerascans kunnen pas worden getest met de gekoppelde diensten en jouw OAuth-configuratie.
