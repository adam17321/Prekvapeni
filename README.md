# Kája · narozeninová mise

Hravá narozeninová stránka v češtině, připravená pro telefon a GitHub Pages. Používá jen HTML, CSS a JavaScript — bez serveru a bez build kroku.

## Odpočet a předčasný vstup

Předstartovní obrazovka odpočítává do **8. 11. 2026 ve 20:00 pražského času** a poté automaticky otevře hru. Čas je nastaven v `game.js` v proměnné `ACCESS_UNLOCK_AT`. Odpočet běží na zařízení návštěvníka; GitHub Pages k tomu nepotřebuje server.

Pokud chceš hru otevřít dřív, nastav v `game.js` hodnotu `EARLY_ACCESS_PASSWORD` místo prázdného řetězce, například `const EARLY_ACCESS_PASSWORD = 'sem-si-zvol-heslo';`. Heslo rozlišuje malá a velká písmena. Dokud zůstane prázdné, předčasný vstup není dostupný.

**Důležité:** toto není skutečné zabezpečení. Na veřejném GitHub Pages je heslo uložené v JavaScriptu a kdokoli může zobrazit zdrojové soubory; návštěvník může také změnit hodiny zařízení. Použij jen heslo, které nepoužíváš jinde, a nespoléhej na zámek kvůli utajení obsahu. Skutečné ověřování by vyžadovalo službu s přihlášením nebo server.

## Jak hra postupuje

1. Úvod řekne, co si zabalit, kdy ji vyzvedneš a že čas upřesníš během dne.
2. První hádanka odhalí Brno a hotel JeštěBrno. Potom si vybere, kdo bude řídit.
3. Ukáže se návrh první večeře ve FLANK nebo objednané jídlo a možnost wellness. Večerní otázka na hodnocení prvního dne čeká až před spaním.
4. Po stisku **Zobrazit program 10. 11.** se odemkne druhý den: snídaně na hotelu, volitelné fitko, procházka centrem, kavárna a tipovačka na skořicového šneka.
5. Další otázka odhalí pizzu k obědu. Pak může uhodnout přezdívku brněnské přehrady a vybrat si odpolední plán včetně možnosti chvíli rozvážet Bolt Food.
6. Večer počítá se sushi a wellness. Po stisku **Zobrazit program dne odjezdu** se samostatně otevře poslední den: snídaně, volitelné Form Factory, procházka nebo její vlastní nápad.

Za čtyři správné odpovědi získá po bodu a večerní hodnocení prvního dne přidá bonus. Dohromady může získat **5 bodů**. Její vlastní nápad na poslední den zůstane jen v aktuální kartě prohlížeče a nikam se neposílá.

## Co upravit před zveřejněním

Otevři `game.js` v textovém editoru:

- `EVENT_DATE` nahoře nastavuje datum druhého dne. Výchozí hodnota je `10. 11.`; datum se použije v postupu, programu i kalendářní kartě.
- Texty a nápovědy upravíš v příslušných funkcích `renderPacking`, `renderBrnoQuiz`, `renderEveningPlan`, `renderDayTwoMorning`, `renderLunchQuiz`, `renderRiverQuiz`, `renderDepartureLock` a `renderDeparturePlan`.
- Správné odpovědi upravíš v příslušných voláních `bindQuiz(...)`. Hra ignoruje velikost písmen a diakritiku.
- Nabídku večeře změníš ve `renderEveningPlan`; odpolední možnosti najdeš ve `renderDayTwoEvening`.
- Závěrečný text a volitelný nápad na odjezd upravíš ve `renderDeparturePlan` a `renderFinale`.
- `MAX_SCORE` uprav jen tehdy, když přidáš nebo odebereš bodovanou otázku či bonus. Při úpravě počtu bodů změň také vysvětlující text v `renderProgress` a tomto návodu.
- Balicí seznam je v `renderPacking`. Můžeš změnit názvy, popisky i počet položek.

Barvy, rozložení, interakce a animace jsou v `styles.css`. Stránka se přizpůsobuje mobilům i větším obrazovkám a respektuje nastavení omezeného pohybu zařízení.

Postup, body a vybrané možnosti se ukládají jen v místním úložišti daného prohlížeče. Textová odpověď při check-inu ani vlastní nápad na odjezd se neukládají. Tlačítkem **Začít znovu** smažeš uložený postup v tomto prohlížeči.

## Soukromí

GitHub Pages zveřejní stránku. Všechno vložené do HTML, CSS nebo JavaScriptu — včetně otázek, odpovědí, názvů hotelu, restaurace, předčasného vstupního hesla a dalších odhalení — může kdokoli s odkazem najít také ve zdrojových souborech. Odpočet se řídí hodinami zařízení návštěvníka. Zamčená obrazovka ani veřejný odkaz nejsou ochranou před prozrazením. Nevkládej sem hesla používaná jinde, čísla rezervací, přesnou adresu pokoje ani jiné citlivé informace.

Hra nemá backend ani analytiku. Jediný odkaz ven vede na web restaurace FLANK. Odpovědi, hodnocení a její nápady se nikam neposílají.

## Publikování přes GitHub Pages

1. Vytvoř na GitHubu nový repozitář. Pokud chceš použít GitHub Pages s osobním účtem zdarma, zvol veřejný repozitář.
2. Nahraj **obsah této složky přímo do kořene repozitáře**: `index.html`, `styles.css`, `game.js` a `README.md`.
3. Otevři **Settings → Pages**.
4. V části **Build and deployment** vyber **Deploy from a branch**.
5. Jako zdroj zvol větev `main` a složku `/(root)`, potom klikni na **Save**.
6. Po zveřejnění najdeš adresu stránky v nastavení Pages. Zkontroluj ji v telefonu předtím, než ji pošleš Káje.

Po nahrání upravených souborů do stejného GitHub repozitáře se stránka znovu publikuje jako běžný statický web. Nepotřebuješ zapnout backend ani sestavení projektu.

GitHub Pages z této složky publikuje statické soubory přímo. Podrobnosti najdeš v [oficiálním návodu k vytvoření webu GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) a v [návodu k výběru zdroje publikování](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Soubory

- `index.html` — stránka, úvod a upozornění k soukromí;
- `styles.css` — responzivní vzhled, interakce a animace;
- `game.js` — posloupnost, otázky, body, volby a ukládání postupu;
- `README.md` — tento návod.
