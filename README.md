# Linkplek — eigen accounts op Vercel

Nederlandstalige Linktree-app met registratie via e-mailadres en wachtwoord, een beveiligd dashboard, Neon PostgreSQL, foto-upload via Vercel Blob en permanente QR-codes. Google-login is verwijderd. Accountgegevens en wachtwoordhashes staan in je eigen PostgreSQL-database.

## Bestaand Vercel-project bijwerken

1. Kies Framework **Next.js**, Root Directory de repository-root (waar `package.json` en `app/` staan), Node **22.x** en Build Command **`pnpm build`**. Verwijder een eventuele override `next build`: anders wordt de migratie overgeslagen.
2. Controleer de servervariabelen hieronder. De bestaande `DATABASE_URL` en `AUTH_SECRET` kunnen blijven staan. `AUTH_GOOGLE_ID` en `AUTH_GOOGLE_SECRET` zijn niet meer nodig.
3. Bij een **production** build voert `scripts/build.mjs` automatisch de databasemigraties uit voordat Next.js bouwt. Deze voegen tabellen toe en verwijderen geen profielen. Bij een ontbrekende/onbereikbare database stopt de build. Bekijk dan de buildlogs.
4. Open `/registreren`, maak een account en log vervolgens in via `/inloggen`.

Vercel heeft geen duurzame lokale serverdisk voor accounts. De website gebruikt daarom de gekoppelde PostgreSQL-database, bijvoorbeeld Neon via Vercel Marketplace. Registratie en wachtwoordcontrole gebeuren in deze website, zonder externe inlogprovider.

## Configuratie

| Variabele | Waarde |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL-verbindingsstring met SSL |
| `AUTH_SECRET` | Sterk willekeurig geheim, minimaal 32 bytes; houd dit stabiel |
| `AUTH_URL` | Vast productieadres, bijvoorbeeld `https://jouw-project.vercel.app` |
| `BLOB_STORE_ID` | Gekoppelde openbare Vercel Blob-store voor foto's via OIDC |
| `BLOB_READ_WRITE_TOKEN` | Alternatief voor Blob-authenticatie, ook voor lokaal gebruik |

Genereer een geheim met `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Zet geheimen alleen in Vercel of `.env.local`, nooit in GitHub. Gebruik geen `NEXT_PUBLIC_`-prefix. Verbind Neon en een **public** Blob-store met het juiste project. Blob is alleen nodig voor foto-uploads.

Gebruik een aparte database voor development/preview. Previewbuilds passen de database niet automatisch aan; voer daarvoor expliciet `pnpm db:migrate` uit. Gebruik voor `AUTH_URL` het adres van die omgeving. Laat de productiepagina publiek bereikbaar voor QR-bezoekers.

## Lokaal installeren

Gebruik Node 22 en pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# Vul .env.local in, met AUTH_URL=http://localhost:3000
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`. Zonder databaseconfiguratie of `AUTH_SECRET` zijn de formulieren uitgeschakeld. Voer de migratie uit voordat je registreert.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

## Accounts en beveiliging

- Registratie vraagt naam, e-mailadres en tweemaal het wachtwoord. Wachtwoorden hebben 12–128 tekens en worden gehasht met een willekeurige salt en scrypt (N=32768, r=8, p=3). Ze worden nooit leesbaar opgeslagen.
- E-mail wordt getrimd en naar kleine letters omgezet. Een unieke databaseconstraint voorkomt dubbele accounts, ook bij gelijktijdige aanvragen. Herregistreren overschrijft nooit een wachtwoord. De bevestiging verraadt niet of een adres al bestaat.
- Er is nog geen e-mailverificatie of automatische wachtwoordherstelmail. Gebruik e-mailadressen daarom niet als bewijs van identiteit of voor het claimen van bestaande profielen.
- Auth.js Credentials verzorgt HTTP-only sessiecookies met een maximale duur van zeven dagen. Elke beschermde aanvraag controleert ook of het lokale account bestaat. Verwijderde accounts verliezen toegang met bestaande sessies.
- PostgreSQL beperkt aanmeldpogingen atomair: 10 per e-mailadres en 60 per IP per 15 minuten. Registratie: 10 per IP per 15 minuten. Hiervoor wordt op Vercel de door het platform ingestelde IP-header gebruikt; lokaal delen aanvragen één IP-limiet.
- `auth_limits` bevat HMAC-sleutels, geen leesbare e-mails of IP's. Verwijder verlopen records zo nodig met `DELETE FROM auth_limits WHERE expires_at < NOW();`; de migratierunner doet dit ook.
- Server Actions en Auth.js verzorgen CSRF-bescherming. Profiel- en upload-API's controleren daarnaast Origin. Alleen de server bepaalt de eigenaar (`local:<uuid>`).
- Alleen http(s)-links worden geaccepteerd. Uploads zijn beperkt tot PNG/JPEG/WebP van maximaal 2 MB met controles op bestandssignatuur en eigendom.

Bronnen: [Auth.js Credentials](https://authjs.dev/getting-started/authentication/credentials), [OWASP wachtwoordopslag](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Bestaande Google-profielen

Bestaande profielen, foto's, pagina-UUID's en openbare adressen blijven behouden. Hun QR-codes blijven werken zolang het domein hetzelfde blijft. Oude Google-sessies kunnen niet meer inloggen. Nieuwe lokale accounts krijgen een eigen eigenaar.

Er is **geen automatische koppeling op e-mailadres**: een nieuw account heeft geen bewezen eigendom van een oud profiel. Laat een beheerder het eigendom afzonderlijk verifiëren en daarna `profiles.owner` en `avatars.owner` samen in één transactie omzetten van de oude `google:<sub>` naar de geverifieerde nieuwe `local:<uuid>`. Behoud `profiles.slug`. Controleer vooraf dat het nieuwe account nog geen ander profiel heeft en maak een back-up. Voeg accounts nooit blind samen.

## Linkpagina en QR-code

Na de eerste opslag krijgt het account een vaste `/p/<uuid>`-URL. Het dashboard bevat profieltekst, foto/logo, kleuren, knopstijl, toevoegen/bewerken/verwijderen/verbergen van links, verslepen en verplaatsen met toetsenbordknoppen. De QR-code bevat alleen die vaste URL, met zwart/wit contrast en witruimte. Downloads als PNG en SVG staan in het dashboard. Na opslaan zijn wijzigingen direct openbaar zichtbaar zonder nieuwe QR-code. Verander het domein niet zonder permanente redirects voor gedeelde codes.

## Controle na publicatie

1. Maak account A aan, log in, voeg links toe en sla op.
2. Download de QR-code en open de openbare pagina zonder in te loggen.
3. Wijzig/verberg/verwijder een link, sla op en scan dezelfde QR-code opnieuw.
4. Log uit en opnieuw in: de opgeslagen gegevens moeten terugkomen.
5. Maak account B aan: het dashboard moet leeg beginnen, zonder gegevens van A.
6. Controleer dat een verkeerd wachtwoord wordt geweigerd en het juiste werkt.

De tests controleren wachtwoordhashing, invoervalidatie, accountidentiteit, URL-validatie, Origin-controles en begrensde verzoeken. Controleer de volledige registratie-/opslagflow ook met de aangesloten productiedatabase.
