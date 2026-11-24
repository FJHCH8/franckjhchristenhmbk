/**
 * Les langues du site en plus du français et du Tavissiv : allemand, suédois, breton.
 * Chaque ligne : [français, Deutsch, svenska, brezhoneg]. Les nombres s'écrivent « # » :
 * ils sont repris tels quels à leur place (dates, comptes à rebours, versions…).
 * Les majuscules suivent le texte affiché : un titre en capitales reste en capitales.
 */
export type LangueEtrangere = "de" | "sv" | "br";

const MOIS: [string, string, string, string][] = [
  ["janvier", "Januar", "januari", "Genver"],
  ["février", "Februar", "februari", "C’hwevrer"],
  ["mars", "März", "mars", "Meurzh"],
  ["avril", "April", "april", "Ebrel"],
  ["mai", "Mai", "maj", "Mae"],
  ["juin", "Juni", "juni", "Even"],
  ["juillet", "Juli", "juli", "Gouere"],
  ["août", "August", "augusti", "Eost"],
  ["septembre", "September", "september", "Gwengolo"],
  ["octobre", "Oktober", "oktober", "Here"],
  ["novembre", "November", "november", "Du"],
  ["décembre", "Dezember", "december", "Kerzu"],
];

const LIGNES: [string, string, string, string][] = [
  // navigation
  ["accueil", "Startseite", "Hem", "Degemer"],
  ["qui suis-je", "Wer bin ich", "Vem är jag", "Piv on-me"],
  ["projets", "Projekte", "Projekt", "Raktresoù"],
  ["projet", "Projekt", "Projekt", "Raktres"],
  ["paramètres", "Einstellungen", "Inställningar", "Arventennoù"],
  ["rechercher", "Suchen", "Sök", "Klask"],
  ["recherche", "Suche", "Sökning", "Klask"],
  ["retour", "Zurück", "Tillbaka", "Distro"],
  ["fermer", "Schließen", "Stäng", "Serriñ"],
  ["suivant", "Weiter", "Nästa", "War-lerc’h"],
  ["précédent", "Zurück", "Föregående", "A-raok"],
  ["navigation principale", "Hauptnavigation", "Huvudnavigering", "Merdeiñ pennañ"],
  ["revenir aux tuiles", "Zurück zu den Kacheln", "Tillbaka till rutorna", "Distreiñ d’ar c’harrezennoù"],
  ["[échap]", "[ESC]", "[ESC]", "[ESC]"],
  ["[échap] retour", "[ESC] Zurück", "[ESC] Tillbaka", "[ESC] Distro"],
  ["[entrée] ouvrir", "[Enter] Öffnen", "[Enter] Öppna", "[Enter] Digeriñ"],
  ["[↑ ↓] choisir", "[↑ ↓] Wählen", "[↑ ↓] Välj", "[↑ ↓] Dibab"],
  ["[entrée] ou toucher pour ouvrir", "[Enter] oder tippen zum Öffnen", "[Enter] eller tryck för att öppna", "[Enter] pe stekiñ evit digeriñ"],
  // accueil
  ["identifié", "Identifiziert", "Identifierad", "Anavezet"],
  ["polymathe", "Polymath", "Polymat", "Polimat"],
  ["polymathe · autoromantique · tthpi · tdah", "Polymath · Autoromantiker · TTHPI · ADHS", "Polymat · Autoromantiker · TTHPI · ADHD", "Polimat · Autoromantour · TTHPI · TDAH"],
  ["bienvenue", "Willkommen", "Välkommen", "Degemer mat"],
  ["explorer", "Entdecken", "Utforska", "Ergerzhout"],
  ["le blason des christen · la constellation de franck", "Das Wappen der Christen · Das Sternbild von Franck", "Christens vapen · Francks stjärnbild", "Ardamez ar Christen · Steredeg Franck"],
  ["blason des christen", "Wappen der Christen", "Christens vapen", "Ardamez ar Christen"],
  ["la constellation de franck", "Das Sternbild von Franck", "Francks stjärnbild", "Steredeg Franck"],
  ["code d’aakanos ·", "AakanOS-Code ·", "AakanOS-kod ·", "Kod AakanOS ·"],
  ["code caché : toucher pour l’afficher un instant", "Versteckter Code: tippen, um ihn kurz zu zeigen", "Dold kod: tryck för att visa den en stund", "Kod kuzh: stekiñ evit e welet ur pennadig"],
  ["la polymathie", "Die Polymathie", "Polymatin", "Ar polimatiezh"],
  ["l’autoromantisme", "Die Autoromantik", "Autoromantiken", "An autoromantelezh"],
  ["chercher partout, relier ce qui semble séparé.", "Überall suchen, verbinden, was getrennt scheint.", "Söka överallt, förena det som verkar åtskilt.", "Klask e pep lec’h, liammañ ar pezh a seblant bezañ disrannet."],
  ["die autoromantik nach franck christen. avec freya.", "Die Autoromantik nach Franck Christen. Mit Freya.", "Autoromantiken enligt Franck Christen. Med Freya.", "An autoromantelezh hervez Franck Christen. Gant Freya."],
  ["benjamin franklin, par david martin (#)", "Benjamin Franklin, von David Martin (#)", "Benjamin Franklin, av David Martin (#)", "Benjamin Franklin, gant David Martin (#)"],
  ["titessis, par franck j.h. christen", "Titessis, von Franck J.H. Christen", "Titessis, av Franck J.H. Christen", "Titessis, gant Franck J.H. Christen"],
  ["avancer dans l’enregistrement", "In der Aufnahme springen", "Spola i inspelningen", "Mont war-raok en enrolladenn"],
  ["écouter", "Anhören", "Lyssna", "Selaou"],
  ["pause", "Pause", "Paus", "Ehan"],
  ["lecture", "Wiedergabe", "Uppspelning", "Lenn"],
  ["étoile", "Stern", "Stjärna", "Steredenn"],
  ["transcription", "Transkript", "Transkription", "Treuzskrivadur"],
  ["masquer la transcription", "Transkript ausblenden", "Dölj transkriptionen", "Kuzhat an treuzskrivadur"],
  ["activer le son", "Ton einschalten", "Slå på ljudet", "Lakaat ar son"],
  ["couper le son", "Ton ausschalten", "Stäng av ljudet", "Troc’hañ ar son"],
  // qui suis-je
  ["information", "Information", "Information", "Titouroù"],
  ["rapport", "Bericht", "Rapport", "Danevell"],
  ["fin du rapport", "Ende des Berichts", "Slut på rapporten", "Fin an danevell"],
  ["dossier #", "Akte #", "Akt #", "Teuliad #"],
  ["bonjour, je m’appelle franck j. h. christen h. m. b. k.", "Hallo, ich heiße Franck J. H. Christen H. M. B. K.", "Hej, jag heter Franck J. H. Christen H. M. B. K.", "Demat, Franck J. H. Christen H. M. B. K. eo ma anv."],
  ["je suis né en # en france.", "Ich wurde # in Frankreich geboren.", "Jag föddes # i Frankrike.", "Ganet on bet e # e Frañs."],
  ["je suis né différent : tthpi, profondément et exceptionnellement surdoué, et tdah.", "Ich wurde anders geboren: TTHPI, zutiefst und außergewöhnlich hochbegabt, und ADHS.", "Jag föddes annorlunda: TTHPI, djupt och exceptionellt särbegåvad, och ADHD.", "Ganet on bet disheñvel: TTHPI, donezonet-bras en un doare don ha dibar, ha TDAH."],
  ["depuis toujours, je vis, je vois, je mange, je fais, je parle, je pense et je rêve différemment — je fais tout différemment.", "Schon immer lebe, sehe, esse, handle, spreche, denke und träume ich anders — ich mache alles anders.", "Jag har alltid levt, sett, ätit, gjort, talat, tänkt och drömt annorlunda — jag gör allt annorlunda.", "A-viskoazh e vevan, e welan, e tebran, e ran, e komzan, e soñjan hag e huñvreoan en un doare disheñvel — pep tra a ran en un doare disheñvel."],
  ["depuis toujours, je me suis intéressé à ce que personne ne voulait ou ne pouvait regarder.", "Schon immer habe ich mich für das interessiert, was niemand sehen wollte oder konnte.", "Jag har alltid intresserat mig för det som ingen ville eller kunde se.", "A-viskoazh on bet dedennet gant ar pezh na felle da zen na ne c’helle den sellet outañ."],
  ["ce site, il sert à quoi ?", "Wozu dient diese Seite?", "Vad är den här webbplatsen till för?", "Da betra e talv al lec’hienn-mañ?"],
  ["à publier ce que je fais, à montrer à des gens qui veulent comprendre ce que je fais en tant que polymath au quotidien.", "Um zu veröffentlichen, was ich mache, und es Menschen zu zeigen, die verstehen wollen, was ich als Polymath im Alltag tue.", "Att publicera det jag gör och visa det för människor som vill förstå vad jag gör som polymat i vardagen.", "Da embann ar pezh a ran, ha d’e ziskouez d’an dud a fell dezho kompren petra a ran evel polimat bemdez."],
  ["création de la langue tavissiv", "Erschaffung der Sprache Tavissiv", "Skapandet av språket Tavissiv", "Krouidigezh ar yezh Tavissiv"],
  ["une seconde ne détruit pas la minute, une minute ne détruit pas l’heure, une heure ne détruit pas la journée. le point noir au milieu d’une grande page blanche n’est qu’une toute petite partie de votre journée et de votre vie, concentrez-vous sur cette blancheur.", "Eine Sekunde zerstört nicht die Minute, eine Minute zerstört nicht die Stunde, eine Stunde zerstört nicht den Tag. Der schwarze Punkt mitten auf einer großen weißen Seite ist nur ein winziger Teil Ihres Tages und Ihres Lebens, konzentrieren Sie sich auf dieses Weiß.", "En sekund förstör inte minuten, en minut förstör inte timmen, en timme förstör inte dagen. Den svarta pricken mitt på en stor vit sida är bara en liten del av din dag och ditt liv, fokusera på det vita.", "Un eilenn ne zistruj ket ar vunutenn, ur vunutenn ne zistruj ket an eurvezh, un eurvezh ne zistruj ket an devezh. Ar poent du e-kreiz ur bajenn wenn vras n’eo nemet ul lodenn vihan-vihan eus ho tevezh hag eus ho puhez, en em zalc’hit war ar gwennder-se."],
  ["instagram", "Instagram", "Instagram", "Instagram"],
  ["ici, des vocaux, vidéos, photos, textes et fichiers seront partagés sur cette page. suivez le compte instagram de franck et peut-être serez-vous averti des nouveautés.", "Hier werden Sprachnachrichten, Videos, Fotos, Texte und Dateien geteilt. Folgen Sie Francks Instagram-Konto, dann erfahren Sie vielleicht von den Neuigkeiten.", "Här kommer röstmeddelanden, videor, foton, texter och filer att delas. Följ Francks Instagramkonto så får du kanske veta om nyheterna.", "Amañ e vo rannet kemennadennoù mouezh, videoioù, luc’hskeudennoù, testennoù ha restroù. Heuliit kont Instagram Franck ha marteze e viot kelaouet eus an nevezinti."],
  // projets
  ["citations", "Zitate", "Citat", "Arroudennoù"],
  ["citation", "Zitat", "Citat", "Arroudenn"],
  ["événements", "Ereignisse", "Händelser", "Darvoudoù"],
  ["événement", "Ereignis", "Händelse", "Darvoud"],
  ["éléments", "Elemente", "Element", "Elfennoù"],
  ["médias", "Medien", "Media", "Mediaoù"],
  ["photo", "Foto", "Foto", "Luc’hskeudenn"],
  ["vidéo", "Video", "Video", "Video"],
  ["auteur", "Autor", "Författare", "Aozer"],
  ["date", "Datum", "Datum", "Deiziad"],
  ["aucun résultat.", "Keine Ergebnisse.", "Inga resultat.", "Disoc’h ebet."],
  ["aucun élément pour l’instant.", "Noch keine Elemente.", "Inga element ännu.", "Elfenn ebet evit ar mare."],
  ["un mot, un projet, une citation…", "Ein Wort, ein Projekt, ein Zitat…", "Ett ord, ett projekt, ett citat…", "Ur ger, ur raktres, un arroudenn…"],
  ["réception…", "Empfang…", "Tar emot…", "O resev…"],
  ["interceptions", "Abfangungen", "Avlyssningar", "Spiadennoù"],
  ["opérations", "Operationen", "Operationer", "Oberiadennoù"],
  ["missions", "Missionen", "Uppdrag", "Kefridioù"],
  ["options", "Optionen", "Alternativ", "Dibarzhioù"],
  ["sélection de mission", "Missionsauswahl", "Val av uppdrag", "Dibab ar gefridi"],
  ["dernier", "Neueste", "Senaste", "Diwezhañ"],
  ["dernière", "Neueste", "Senaste", "Diwezhañ"],
  ["volets", "Paneele", "Paneler", "Stalafoù"],
  ["tracé", "Linie", "Spår", "Tres"],
  ["l’aube", "Die Morgendämmerung", "Gryningen", "Ar gouloù-deiz"],
  ["l'aube", "Die Morgendämmerung", "Gryningen", "Ar gouloù-deiz"],
  ["cadran", "Zifferblatt", "Urtavla", "Kadran"],
  ["le cadran · toutes les rubriques = #", "Das Zifferblatt · alle Rubriken = #", "Urtavlan · alla avdelningar = #", "Ar c’hadran · an holl rubrikennoù = #"],
  ["actualité", "Aktuelles", "Aktuellt", "Keleier"],
  ["actualité : endurreisen, l'aube et le cadran", "Aktuelles: Endurreisen, die Morgendämmerung und das Zifferblatt", "Aktuellt: Endurreisen, gryningen och urtavlan", "Keleier: Endurreisen, ar gouloù-deiz hag ar c’hadran"],
  ["ouverture dans", "Öffnung in", "Öppnar om", "Digoradur a-benn"],
  ["début dans", "Beginn in", "Börjar om", "Kregiñ a-benn"],
  ["fin dans", "Ende in", "Slutar om", "Fin a-benn"],
  ["terminé", "Beendet", "Avslutad", "Echu"],
  ["terminée", "Beendet", "Avslutad", "Echu"],
  ["déroulement", "Ablauf", "Förlopp", "Kenderc’h"],
  ["commence dans # jours", "beginnt in # Tagen", "börjar om # dagar", "a grogo a-benn # devezh"],
  ["# jours # # #", "# Tage # # #", "# dagar # # #", "# devezh # # #"],
  ["# jours", "# Tage", "# dagar", "# devezh"],
  ["· # mois", "· # Monate", "· # månader", "· # miz"],
  ["au", "bis", "till", "betek"],
  ["l'aube · du", "Die Morgendämmerung · vom", "Gryningen · från", "Ar gouloù-deiz · eus an"],
  ["endurreisen · ouverture le", "Endurreisen · Öffnung am", "Endurreisen · öppnar den", "Endurreisen · digoradur d’an"],
  ["six mois, du # décembre # au # juin #.", "Sechs Monate, vom #. Dezember # bis zum #. Juni #.", "Sex månader, från # december # till # juni #.", "C’hwec’h miz, eus an # a viz Kerzu # betek an # a viz Even #."],
  ["le compte à rebours de l’ouverture des projets.", "Der Countdown bis zur Öffnung der Projekte.", "Nedräkningen till projektens öppning.", "Ar c’hontadur betek digoradur ar raktresoù."],
  ["aucun événement pour l'instant. chaque compte à rebours terminé viendra s'y ranger.", "Noch keine Ereignisse. Jeder abgelaufene Countdown wird hier eingeordnet.", "Inga händelser ännu. Varje avslutad nedräkning hamnar här.", "Darvoud ebet evit ar mare. Pep kontadur echu a vo renket amañ."],
  // paramètres
  ["apparence", "Darstellung", "Utseende", "Neuz"],
  ["langue", "Sprache", "Språk", "Yezh"],
  ["contact", "Kontakt", "Kontakt", "Darempred"],
  ["à propos", "Über", "Om", "Diwar-benn"],
  ["système", "System", "System", "Reizhiad"],
  ["édition", "Bearbeitung", "Redigering", "Embann"],
  ["easter egg", "Easter Egg", "Påskägg", "Vi Pask"],
  ["présentation", "Vorstellung", "Presentation", "Kinnig"],
  ["horizon", "Horizont", "Horisont", "Dremmwel"],
  ["version", "Version", "Version", "Stumm"],
  ["actuelle", "aktuell", "aktuell", "a-vremañ"],
  ["mise à jour", "Update", "Uppdatering", "Hizivadur"],
  ["site classique", "Klassische Seite", "Klassisk webbplats", "Lec’hienn klasel"],
  ["le site comme un téléphone", "Die Seite als Telefon", "Webbplatsen som en telefon", "Al lec’hienn evel ur pellgomz"],
  ["lancer aakanos", "AakanOS starten", "Starta AakanOS", "Lañsañ AakanOS"],
  ["le site, ou aakanos", "Die Seite oder AakanOS", "Webbplatsen, eller AakanOS", "Al lec’hienn, pe AakanOS"],
  ["pour rentrer sur aakanos, il vous faut un mot de passe caché sur le site. appuyez une nouvelle fois pour entrer.", "Um AakanOS zu betreten, brauchen Sie ein Passwort, das auf der Seite versteckt ist. Tippen Sie noch einmal, um hineinzugehen.", "För att komma in i AakanOS behöver du ett lösenord som är gömt på webbplatsen. Tryck en gång till för att gå in.", "Evit mont en AakanOS ho po ezhomm eus ur ger-tremen kuzhet war al lec’hienn. Stokit adarre evit mont e-barzh."],
  ["pour rentrer sur aakanos, il vous faut un mot de passe caché sur le site.", "Um AakanOS zu betreten, brauchen Sie ein Passwort, das auf der Seite versteckt ist.", "För att komma in i AakanOS behöver du ett lösenord som är gömt på webbplatsen.", "Evit mont en AakanOS ho po ezhomm eus ur ger-tremen kuzhet war al lec’hienn."],
  ["le site classique, ou aakanos : le site comme un téléphone.", "Die klassische Seite oder AakanOS: die Seite als Telefon.", "Den klassiska webbplatsen, eller AakanOS: webbplatsen som en telefon.", "Al lec’hienn klasel, pe AakanOS: al lec’hienn evel ur pellgomz."],
  ["choisis la langue du site", "Wähle die Sprache der Seite", "Välj webbplatsens språk", "Dibab yezh al lec’hienn"],
  ["choisis la langue du site.", "Wähle die Sprache der Seite.", "Välj webbplatsens språk.", "Dibab yezh al lec’hienn."],
  ["bretagne", "Bretagne", "Bretagne", "Breizh"],
  ["le tavissiv s’écrit en aaka, l’alphabet de franck.", "Tavissiv wird in Aaka geschrieben, Francks Alphabet.", "Tavissiv skrivs med Aaka, Francks alfabet.", "An Tavissiv a vez skrivet en Aaka, lizherenneg Franck."],
  ["écriture aaka", "Aaka-Schrift", "Aaka-skrift", "Skritur Aaka"],
  ["deux chemins mènent jusqu’à franck", "Zwei Wege führen zu Franck", "Två vägar leder till Franck", "Daou hent a gas betek Franck"],
  ["deux chemins mènent jusqu’à franck.", "Zwei Wege führen zu Franck.", "Två vägar leder till Franck.", "Daou hent a gas betek Franck."],
  ["une idée, une question, un projet à partager ? deux chemins mènent jusqu’à franck.", "Eine Idee, eine Frage, ein Projekt zum Teilen? Zwei Wege führen zu Franck.", "En idé, en fråga, ett projekt att dela? Två vägar leder till Franck.", "Ur soñj, ur goulenn, ur raktres da rannañ? Daou hent a gas betek Franck."],
  ["e-mail", "E-Mail", "E-post", "Postel"],
  ["ce qu’est ce site, et comment il évolue.", "Was diese Seite ist und wie sie sich entwickelt.", "Vad den här webbplatsen är, och hur den utvecklas.", "Petra eo al lec’hienn-mañ, ha penaos e emdro."],
  ["ce site", "Diese Seite", "Den här webbplatsen", "Al lec’hienn-mañ"],
  ["ce site est conçu pour la publication de la vie, des projets et des annonces de franck.", "Diese Seite ist für die Veröffentlichung von Francks Leben, Projekten und Ankündigungen gedacht.", "Den här webbplatsen är skapad för att publicera Francks liv, projekt och tillkännagivanden.", "Savet eo bet al lec’hienn-mañ evit embann buhez, raktresoù ha kemennoù Franck."],
  ["la vie, les projets et les annonces de franck y prennent place.", "Francks Leben, Projekte und Ankündigungen finden hier ihren Platz.", "Francks liv, projekt och tillkännagivanden får sin plats här.", "Buhez, raktresoù ha kemennoù Franck a gav o flas amañ."],
  ["le site évolue, et des posts paraissent régulièrement, avec des mises à jour environ tous les # jours.", "Die Seite entwickelt sich, regelmäßig erscheinen Beiträge, mit Updates etwa alle # Tage.", "Webbplatsen utvecklas och inlägg publiceras regelbundet, med uppdateringar ungefär var #:e dag.", "Emdreiñ a ra al lec’hienn, embannadennoù a zeu er-maez alies, gant hizivadurioù war-dro bep # devezh."],
  ["odyssée · le système du site et ses mises à jour.", "Odyssée · das System der Seite und seine Updates.", "Odyssée · webbplatsens system och dess uppdateringar.", "Odyssée · reizhiad al lec’hienn hag he hizivadurioù."],
  ["réservé à franck · code à # chiffres.", "Nur für Franck · #-stelliger Code.", "Endast för Franck · #-siffrig kod.", "Miret evit Franck · kod # sifr."],
  ["code d’accès · # chiffres", "Zugangscode · # Ziffern", "Åtkomstkod · # siffror", "Kod moned · # sifr"],
  ["# chiffres sur #", "# von # Ziffern", "# av # siffror", "# sifr war #"],
  ["authentification requise", "Authentifizierung erforderlich", "Autentisering krävs", "Dilesadur rekis"],
  ["connexion établie", "Verbindung hergestellt", "Anslutning upprättad", "Kevreadur savet"],
  ["accès autorisé", "Zugang gewährt", "Åtkomst beviljad", "Moned aotreet"],
  ["vérification…", "Überprüfung…", "Kontrollerar…", "O wiriañ…"],
  ["ce code n’est pas accepté.", "Dieser Code wird nicht akzeptiert.", "Den här koden godtas inte.", "N’eo ket degemeret ar c’hod-mañ."],
  ["effacer", "Löschen", "Radera", "Diverkañ"],
  ["écris en tavissiv, lis en aaka", "Schreibe in Tavissiv, lies in Aaka", "Skriv på Tavissiv, läs på Aaka", "Skriv e Tavissiv, lenn en Aaka"],
  ["écris en tavissiv, lis en aaka.", "Schreibe in Tavissiv, lies in Aaka.", "Skriv på Tavissiv, läs på Aaka.", "Skriv e Tavissiv, lenn en Aaka."],
  ["écris en tavissiv avec les lettres latines : il s'affiche aussitôt dans l'écriture aaka.", "Schreibe Tavissiv mit lateinischen Buchstaben: Es erscheint sofort in der Aaka-Schrift.", "Skriv Tavissiv med latinska bokstäver: det visas direkt i Aaka-skrift.", "Skriv Tavissiv gant al lizherennoù latin: diskouezet e vo diouzhtu er skritur Aaka."],
  ["texte à transcrire", "Zu übertragender Text", "Text att transkribera", "Testenn da dreuzskrivañ"],
  ["le site classique", "Die klassische Seite", "Den klassiska webbplatsen", "Al lec’hienn klasel"],
];

// Dates : « 24 novembre 2026 », « 3 juin »…
for (const [fr, de, sv, br] of MOIS) {
  LIGNES.push([`# ${fr} #`, `#. ${de} #`, `# ${sv} #`, `# a viz ${br} #`]);
  LIGNES.push([`# ${fr}`, `#. ${de}`, `# ${sv}`, `# a viz ${br}`]);
}

const cle = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\d+/g, "#")
    .trim();

const TABLE = new Map<string, [string, string, string]>();
for (const [fr, de, sv, br] of LIGNES) TABLE.set(cle(fr), [de, sv, br]);
const RANG: Record<LangueEtrangere, 0 | 1 | 2> = { de: 0, sv: 1, br: 2 };

function casse(source: string, traduit: string) {
  const lettres = source.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (lettres && lettres === lettres.toUpperCase()) return traduit.toUpperCase();
  if (lettres && lettres === lettres.toLowerCase()) return traduit.toLowerCase();
  return traduit;
}

function chercher(texte: string, l: LangueEtrangere): string | null {
  const t = TABLE.get(cle(texte));
  if (!t) return null;
  const nombres = texte.match(/\d+/g) ?? [];
  let k = 0;
  return casse(texte, t[RANG[l]].replace(/#/g, () => nombres[k++] ?? "#"));
}

/** Traduit un texte affiché ; s'il n'est pas dans le dictionnaire, il reste tel quel. */
export function traduire(source: string, l: LangueEtrangere): string {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(source);
  if (!m) return source;
  const [, avant, coeur, apres] = m;
  if (!/[A-Za-zÀ-ÿ]{2}/.test(coeur!)) return source;
  let r = chercher(coeur!, l);
  if (r === null) {
    // « // 01 · CITATIONS », « 02 · EXPLORER » : on garde le préfixe et on traduit le reste
    const p = /^((?:\/\/\s*)?(?:\d+\s*(?:·\s*)?)?)(.+)$/.exec(coeur!);
    if (p && p[1]) {
      const reste = chercher(p[2]!, l);
      if (reste !== null) r = p[1] + reste;
    }
  }
  if (r === null && coeur!.endsWith("…") && coeur!.length > 20) {
    // texte coupé à l'affichage : on traduit le texte entier puis on le recoupe
    const debut = cle(coeur!.slice(0, -1));
    for (const [k, t] of TABLE) {
      if (k.startsWith(debut)) {
        r = casse(coeur!, t[RANG[l]]).slice(0, coeur!.length - 1).trimEnd() + "…";
        break;
      }
    }
  }
  return r === null ? source : avant + r + apres;
}
