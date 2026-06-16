# Dizains: spēle "Kuģi - KARTUPELIS"

- Datums: 2026-06-16
- Statuss: apstiprināts (gaida spec review pirms plāna)
- Autors: Gatis

## 1. Mērķis un konteksts

Online, turn-based "Kuģi" (Battleship) spēle, ko divi cilvēki spēlē katrs no sava telefona. Galvenais lietojums: Gatis spēlē ar meitu. Režģis ir 10x10 ar kolonnām, kas apzīmētas ar vārda KARTUPELIS burtiem (K-A-R-T-U-P-E-L-I-S) un rindām 1-10, atveidojot cirkulis.lv papīra versiju digitāli. Hostēts uz Vercel.

Mērķis ir vienkārša, ātri palaižama, mobile-first spēle bez kontiem un bez liekas konfigurācijas.

## 2. Spēles noteikumi (klasiskie LV)

- Režģis: 10x10. Kolonnas K, A, R, T, U, P, E, L, I, S (kreisā -> labā). Rindas 1-10 (augša -> apakša).
- Flote (20 rūtis kopā):
  - 1 kuģis pa 4 rūtīm
  - 2 kuģi pa 3 rūtīm
  - 3 kuģi pa 2 rūtīm
  - 4 kuģi pa 1 rūtij
- Kuģi ir taisni (horizontāli vai vertikāli), nevar būt L-formas.
- Kuģi nedrīkst saskarties - ne ar malu, ne ar stūri (8 kaimiņu rūšu zona ap katru kuģi ir brīva).
- Gājiens: spēlētājs uzsit pretinieka lauka rūti.
  - Trāpījums -> tas pats spēlētājs šauj vēlreiz.
  - Garām -> gājiens pāriet pretiniekam.
- Nogremdēšana: kad kuģa pēdējā rūts trāpīta, visas ap kuģi esošās (8-kaimiņu) rūtis automātiski tiek atklātas kā "garām" (tur kuģu nevar būt). Kuģis tiek atzīmēts kā nogremdēts.
- Uzvara: pirmais, kurš notrāpa visas 20 pretinieka kuģu rūtis, uzvar.

## 3. Tech stack un hostings

- Frontend: Vite + React + TypeScript + Tailwind CSS.
- Backend: Vercel serverless funkcijas mapē `/api` (TypeScript).
- Stāvokļa krātuve: Upstash Redis caur Vercel Marketplace integrāciju (pieslēdz `@upstash/redis`). Spēles JSON glabājas zem atslēgas `game:<KODS>` ar TTL ~24h - spēles pašas iztīrās.
- Hostings: Vercel (statisks SPA + serverless `/api`). Viss vienā projektā, viens deploy.
- Sinhronizācija: klienta puses polling pret `GET /api/state`.
- Bez login: katram pārlūkam anonīms `playerId` (UUID), glabāts localStorage; reconnect pēc tā.

Pamatojums: "viss Vercel" izvēle. Tā kā šāvienus izšķir serveris (serverless funkcijai pieder pilns stāvoklis Redis), pretinieka kuģu izkārtojumu klientam nesūtām - cheat vektors praktiski izzūd bez papildu darba.

## 4. Arhitektūra un datu plūsma

```
[Telefons A]  --HTTP-->  [Vercel /api/*]  <-->  [Upstash Redis: game:<kods>]
[Telefons B]  --HTTP-->  [Vercel /api/*]
   ^   |
   |   +-- polling GET /api/state ik ~1.5s (kamēr gaida pretinieku)
   +------ filtrēts state (tikai tas, ko šim spēlētājam drīkst redzēt)
```

- Visa spēles patiesība dzīvo Redis atslēgā `game:<kods>`.
- Serverless funkcijas ir vienīgās, kas raksta stāvokli; tās validē gājienus un izšķir rezultātus (server-authoritative).
- Klients nekad neredz pretinieka neatklātos kuģus.

## 5. Datu modelis (Redis vērtība zem `game:<kods>`)

```ts
type Status = "waiting" | "placing" | "playing" | "finished";
type PlayerSlot = 1 | 2;
type Orientation = "h" | "v";

interface Ship {
  size: number;          // 1..4
  row: number;           // 0..9 (sākuma rūts)
  col: number;           // 0..9
  orientation: Orientation;
  hits: boolean[];       // garums = size; true = trāpīta
}

interface PlayerState {
  id: string;            // anonīms playerId
  ready: boolean;        // izvietojis floti un nospiedis "Gatavs"
  ships: Ship[];         // šī spēlētāja flote (slepena pretiniekam)
  shotsAt: string[];     // rūtis, kur ŠIS spēlētājs ir šāvis ("r,c")
}

interface GameState {
  code: string;
  status: Status;
  createdAt: number;
  turn: PlayerSlot;          // kura spēlētāja gājiens
  winner: PlayerSlot | null;
  players: {
    1: PlayerState | null;
    2: PlayerState | null;
  };
}
```

Piezīme: `shotsAt` glabā šāvienus pret pretinieku. Pretinieka skats uz manu lauku ir atvasināms no pretinieka `shotsAt`, pielietota manai flotei.

## 6. Filtrētais state, ko atgriež `GET /api/state`

Serveris atgriež filtrētu skatu konkrētam `playerId`:

```ts
interface PlayerView {
  code: string;
  status: Status;
  you: PlayerSlot;
  turn: PlayerSlot;
  winner: PlayerSlot | null;
  opponentJoined: boolean;
  opponentReady: boolean;
  youReady: boolean;

  // Tavs lauks (pilns) + pretinieka trāpījumi tajā
  myShips: Ship[];                 // ar hits[]
  incomingShots: string[];         // pretinieka shotsAt (lai zīmētu garām/trāpījumus uz mana lauka)

  // Pretinieka lauks - TIKAI tas, ko tu jau zini
  myShots: ShotResult[];           // tavi šāvieni ar rezultātu
  sunkOpponentShips: Ship[];       // tikai nogremdētie pretinieka kuģi (atklājas pēc nogremdēšanas)
}

interface ShotResult {
  cell: string;        // "r,c"
  result: "hit" | "miss";
}
```

Pretinieka neatklātie kuģi nekad neparādās PlayerView.

## 7. API galapunkti

Visi POST pieņem/atgriež JSON. Kods ir 4 zīmju (lieli burti + cipari, izņemot neskaidros: bez O/0/I/1).

- `POST /api/create`
  - body: `{}`
  - darbība: ģenerē unikālu kodu, izveido GameState (status `waiting`), pievieno izsaucēju kā spēlētāju 1.
  - resp: `{ code, playerId, you: 1 }`

- `POST /api/join`
  - body: `{ code }`
  - darbība: ja istaba eksistē un 2. slots brīvs -> pievieno kā spēlētāju 2, status -> `placing`.
  - resp: `{ code, playerId, you: 2 }`
  - kļūdas: 404 (nav istabas), 409 (pilna), 410 (beigusies/izdzēsta).

- `POST /api/place`
  - body: `{ code, playerId, ships: Ship[] }`
  - darbība: validē floti (skaits + izmēri + robežas + nesaskaršanās). Saglabā, `ready = true`. Ja abi `ready` -> status `playing`, nejauši izvēlas pirmo `turn`.
  - resp: `{ ok: true, status }`
  - kļūdas: 422 (nederīgs izvietojums) ar iemeslu.

- `POST /api/shoot`
  - body: `{ code, playerId, cell }` (`cell` = "r,c")
  - darbība: validē, ka status `playing`, ka tavs `turn`, ka rūts vēl nav šauta. Izšķir trāpījumu/garām. Atjauno hits. Ja kuģis nogremdēts -> auto atklāj 8-kaimiņu rūtis (pievieno `shotsAt` kā garām). Ja visi pretinieka kuģi nogremdēti -> status `finished`, `winner`. Trāpījums patur gājienu, garām nodod.
  - resp: `{ result: "hit"|"miss", sunk?: Ship, win?: boolean, turn }`
  - kļūdas: 409 (nav tavs gājiens / jau šauts).

- `GET /api/state?code=...&playerId=...`
  - resp: `PlayerView` (skat. 6. sadaļu).

- `POST /api/rematch`
  - body: `{ code, playerId }`
  - darbība: atiestata abu spēlētāju `ships`, `shotsAt`, `ready`, `winner`; status -> `placing`. Patur spēlētājus un kodu.
  - resp: `{ ok: true }`

Konkurences drošība: `shoot` un `place` lasa-modificē-raksta Redis ar optimistic atomicity (Lua `EVAL` vai `WATCH/MULTI` vai versijas lauks `rev`, ko pārbauda pirms raksta). Plānā precizēsim mehānismu.

## 8. State machine (statusi)

```
waiting  --join-->  placing  --(abi ready)-->  playing  --(visi nogremdēti)-->  finished
finished --rematch-->  placing
```

## 9. Moduļi un robežas

Tīras, neatkarīgi testējamas vienības:

- `src/game/coords.ts`
  - KARTUPELIS kolonnu konstante un kartēšana (burts <-> indekss).
  - Rūts <-> "r,c" virkne; robežu pārbaudes.
- `src/game/logic.ts` (TĪRAS funkcijas, bez I/O):
  - `FLEET` specifikācija.
  - `randomPlacement(): Ship[]` - derīgs nejaušs izvietojums (ievēro nesaskaršanos).
  - `validatePlacement(ships): {ok, reason?}` - skaits, izmēri, robežas, nesaskaršanās.
  - `resolveShot(state, shooter, cell): {result, sunk?, win?}`.
  - `surroundingCells(ship): string[]` - 8-kaimiņu zona nogremdēšanas atklāšanai.
  - `isFleetDestroyed(ships): boolean`.
- `api/_store.ts`
  - Redis get/set helperi, koda ģenerēšana, TTL, atomic update, `redactFor(state, playerId): PlayerView`.
- `api/*.ts`
  - Plāni handleri: parsē body -> sauc logic + store -> atgriež JSON.
- `src/useGameState.ts`
  - fetch wrapper + polling hook (cadence atkarīga no status un gājiena).
- UI komponentes:
  - `Home` (izveidot / pievienoties)
  - `Lobby` (kods, dalāma saite, "gaida pretinieku")
  - `PlacementBoard` ("Sajaukt", manuāla novietošana/rotācija/pārvilkšana, "Gatavs")
  - `BattleScreen` -> `OwnBoard`, `TargetBoard`, `Cell`, `FleetLegend`, `TurnIndicator`
  - `Result` (uzvara/zaudējums, "Spēlēt vēlreiz")

## 10. Spēles logic detaļas

- Auto-izvietošana: liek kuģus no lielākā uz mazāko; katram - nejauša rūts + orientācija; pārbauda robežas un ka kuģis + tā 8-kaimiņu zona neskar jau noliktos; retry ar limitu, vajadzības gadījumā restartē izvietojumu (klasiska "blackout" pieeja).
- Manuāla izvietošana: tap, lai paņemtu/noliktu; tap uz nolikta kuģa, lai pagrieztu; pārvilkšana, lai pārvietotu; nederīgas pozīcijas iezīmē sarkanas. Poga "Sajaukt" jebkurā brīdī. "Gatavs" aktīva tikai ar pilnu derīgu floti.
- Šāviena izšķiršana: serverī, pret pretinieka `ships`. Atzīmē attiecīgā kuģa `hits`. Nogremdēšanas atklāšana pievieno apkārtnes rūtis šāvēja `shotsAt` ar rezultātu "miss" (lai klients tās zīmē kā atklātas).
- Uzvara: visi 20 rūts trāpīti.

## 11. Polling stratēģija

- `placing` + gaidot pretinieku: poll ik ~1.5s.
- `playing` un NAV tavs gājiens: poll ik ~1.5s (gaidi pretinieka šāvienu).
- `playing` un IR tavs gājiens: nepoll (tu darbojies); pēc tava šāviena vienreiz refetch.
- `finished`: pārtrauc polling.
- Vizuāls "savienots / gaida" indikators. Redis komandu patēriņš paliek tālu zem Upstash free limita.

## 12. Kļūdu apstrāde un edge cases

- Nederīgs/beidzies kods -> draudzīgs paziņojums, atpakaļ uz Home.
- Pilna istaba -> paziņojums.
- Reconnect: localStorage `playerId` + pēdējais `code`; atverot atkal -> turpina spēli.
- Pretinieks aizgāja: turn-based, bez piespiedu taimera; rāda "gaida pretinieku".
- Dubults šāviens tajā pašā rūtī -> serveris noraida (409).
- Vienlaicīgi raksti -> atomic update (skat. 7. sadaļu).
- Saites dalīšana: poga "Kopēt saiti" + native share (kods URL-ā, piem. `/?kods=ABCD`).

## 13. Testēšana

- Vitest uz `coords.ts` un `logic.ts`:
  - KARTUPELIS kartēšana abos virzienos.
  - Flotes validācija: pareizs skaits/izmēri; noraida pārklāšanos, robežu pārkāpumus, saskaršanos (mala + stūris).
  - `randomPlacement` vienmēr atgriež derīgu floti (palaiž N reizes).
  - Šāviena izšķiršana: hit/miss; nogremdēšana atklāj pareizo 8-kaimiņu zonu; uzvara, kad visi nogremdēti; trāpījums patur gājienu, garām nodod.
- TDD: testi pirms implementācijas (logic slānis).
- Manuāli end-to-end: divi pārlūka logi / telefons + dators (izveido -> pievienojas -> izvieto -> kauja -> uzvara -> rematch).

## 14. Vizuālais / UX vadlīnijas

- Mobile-first, lieli tap-targeti, LV interfeiss.
- KARTUPELIS galvene virs kolonnām (kā drukas versijā), rindas 1-10.
- Skaidri stāvokļi: tukša, kuģis (savs), trāpījums, garām, nogremdēts kuģis, atklātā apkārtne.
- Gājiena indikators ("Tavs gājiens" / "Gaida X").
- Viegls "kartupeļa" akcents, bet gaumīgs (Gatis ir dizainers) - pulēšanai izmanto frontend-design skill.
- Tikai īsā defise tekstos. LV gramatika - pirms gala teksta iet caur LV gramatikas gate.

## 15. Ārpus scope (YAGNI)

Konti/reģistrācija, vairāk par 2 spēlētājiem, čats, gājiena taimeri, skaņa, skatītāji, automātisks matchmaking, topi/statistika, animāciju pārmērība.

## 16. Atvērtie jautājumi / nākotnes uzlabojumi

- Skaņas efekti un haptika (vēlāk).
- SSE/long-polling polling vietā (ja gribas vēl momentānāk).
- Pilns server-authoritative jau tāpat ir; ja gribas - RLS-stila papildu cietināšana nav vajadzīga.
- PWA "pievienot sākuma ekrānam" (vēlāk).
