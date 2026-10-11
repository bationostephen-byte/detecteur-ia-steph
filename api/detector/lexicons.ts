/**
 * Lexiques du Détecteur IA Steph.
 *
 * - Mots les plus fréquents du français et de l'anglais (listes de fréquence
 *   dérivées de corpus publics type Lexique.org / SUBTLEX, tronquées).
 *   Elles servent à estimer la "prévisibilité" lexicale : un texte de LLM
 *   sur-utilise les mots très fréquents et évite les mots rares.
 * - Connecteurs / formules de transition surreprésentés dans les sorties LLM
 *   (observés empiriquement dans la littérature sur la détection).
 */

/** ~320 mots français les plus fréquents (formes de base). */
export const FRENCH_COMMON_WORDS = new Set(
  (
    "le la les un une des de du au aux en dans sur sous avec sans pour par vers chez entre avant après pendant depuis " +
    "ce cet cette ces son sa ses mon ma mes ton ta tes notre nos votre vos leur leurs il elle ils elles on nous vous je tu " +
    "me te se lui qui que quoi dont où quand comment pourquoi combien quel quelle quels quelles " +
    "et ou mais donc or ni car si comme lorsque puisque quoique ainsi alors aussi très trop peu plus moins bien mal mieux " +
    "être avoir faire dire aller voir venir pouvoir vouloir devoir savoir prendre mettre donner trouver parler passer " +
    "rester devenir partir tenir porter regarder suivre penser croire connaître falloir valoir sembler paraître servir " +
    "sentir sortir vivre mourir naître ouvrir fermer entendre attendre perdre rendre répondre apprendre comprendre " +
    "est sont était été être avoir fait font peut veut doit sait va vient voit prend met donne trouve parle passe reste " +
    "ne pas plus jamais toujours souvent parfois déjà encore hier aujourd'hui demain ici là où maintenant alors " +
    "homme femme enfant fille garçon jour nuit temps année monde vie mort main yeux tête corps cœur âme esprit " +
    "chose chose cas point état question problème exemple moment raison façon manière forme sens suite fin début " +
    "ville pays maison place rue porte fenêtre eau feu terre air soleil lune ciel mer montagne fleuve arbre fleur " +
    "grand petit gros long court haut bas bon mauvais beau laid jeune vieux nouveau ancien premier dernier même autre " +
    "tout toute tous toutes chaque aucun aucune certain certaine plusieurs quelque quelques autre autres " +
    "deux trois quatre cinq six sept huit neuf dix cent mille million " +
    "non oui voilà voici merci monsieur madame mademoiselle " +
    "travail école livre lettre mot phrase texte page histoire compte nom nommer appeler écrire lire jouer manger boire " +
    "dormir marcher courir lever asseoir coucher réveiller habiller laver essuyer frapper toucher tirer pousser jeter " +
    "heure minute semaine mois matin soir midi minuit printemps été automne hiver fête dimanche lundi " +
    "ami amie famille père mère frère sœur fils parent mari femme époux épouse roi reine prince peuple roi " +
    "vrai faux juste droit gauche plein vide fort faible dur mou doux chaud froid sec humide propre sale riche pauvre " +
    "blanc noir rouge bleu vert jaune gris brun rose violet orange clair foncé sombre " +
    "afin contre selon malgré hormis excepté durant voici autour derrière devant dessus dessous dedans dehors partout ailleurs nulle " +
    "cela ceci celui celle ceux celles lequel laquelle lesquels lesquelles nôtre vôtre mien tien sien nôtres vôtres " +
    "groupe nombre partie côté droite gauche milieu centre bout bord face fond hauteur longueur largeur poids mesure prix valeur"
  ).split(/\s+/)
);

/** ~300 mots anglais les plus fréquents. */
export const ENGLISH_COMMON_WORDS = new Set(
  (
    "the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will " +
    "my one all would there their what so up out if about who get which go me when make can like time no just him know take " +
    "people into year your good some could them see other than then now look only come its over think also back after use two " +
    "how our work first well way even new want because any these give day most us is are was were been has had did said each " +
    "more very much where through before between never under while might must shall should being against own same such here " +
    "those both few many few during too very again once upon around down off above below does doing done went gone came become " +
    "became began begin brought bring took taken gave given found find told tell asked ask seemed seem felt feel left leave " +
    "man woman child children boy girl world life hand eye head body heart mind soul home house room door window water fire " +
    "earth air sun moon sky sea mountain river tree flower place city country town village street road way end start " +
    "thing things case point state question problem example moment reason way form sense right fact word words line " +
    "big small large little long short high low good bad old young new first last same other another different " +
    "every each all any some no none several few many much most more less least enough own such " +
    "three four five six seven eight nine ten hundred thousand million " +
    "yes no here there now then today yesterday tomorrow always never often sometimes already still yet soon ago later early " +
    "mister sir lady friend family father mother brother sister son daughter husband wife king queen prince people " +
    "true false right wrong full empty strong weak hard soft hot cold dry wet clean dirty rich poor " +
    "white black red blue green yellow gray brown pink purple orange light dark " +
    "important however therefore moreover furthermore additionally consequently nevertheless thus hence indeed notably overall " +
    "system systems process information data number part side center middle edge surface level area group type kind sort " +
    "help play run move live believe hold bring happen write provide sit stand lose pay meet include continue set learn " +
    "change lead understand watch follow stop create speak read allow add spend grow open walk win offer remember love " +
    "consider appear buy wait serve die send expect build stay fall cut reach kill remain suggest raise pass sell require " +
    "report decide pull major develop agree receive explain produce deep significant particular general specific various"
  ).split(/\s+/)
);

/**
 * Formules de transition / tournures surreprésentées dans les textes LLM.
 * Comptées par occurrence pour 100 mots.
 */
export const AI_CONNECTOR_PHRASES_FR = [
  "de plus", "en outre", "par ailleurs", "en effet", "ainsi", "par conséquent",
  "il est important de noter", "il convient de noter", "il est essentiel de",
  "il est crucial de", "en conclusion", "pour conclure", "en résumé",
  "dans l'ensemble", "globalement", "dans ce contexte", "dans cette perspective",
  "il est à noter que", "notons que", "soulignons que", "il apparaît que",
  "en ce qui concerne", "au regard de", "d'une part", "d'autre part",
  "tout d'abord", "ensuite", "enfin", "premièrement", "deuxièmement", "troisièmement",
  "cependant", "néanmoins", "toutefois", "en dépit de", "malgré tout",
  "joue un rôle clé", "joue un rôle crucial", "joue un rôle essentiel",
  "il est important de souligner", "dans le cadre de", "au fil du temps",
  "à l'ère de", "à l'échelle", "en termes de", "force est de constater",
];

export const AI_CONNECTOR_PHRASES_EN = [
  "furthermore", "moreover", "additionally", "in addition", "consequently",
  "it is important to note", "it's important to note", "it is worth noting",
  "it's worth noting", "in conclusion", "to conclude", "in summary",
  "overall", "in this context", "firstly", "secondly", "thirdly",
  "on the other hand", "on the one hand", "as a result", "as such",
  "plays a crucial role", "plays a key role", "plays an important role",
  "plays a vital role", "in today's world", "in today's society",
  "it is essential to", "it is crucial to", "notably", "significantly",
  "in terms of", "with respect to", "delve into", "delves into",
  "navigate the complexities", "ever-evolving", "fast-paced world",
  "a testament to", "underscores the importance", "highlights the importance",
  "in the realm of", "paves the way", "shed light on", "foster", "leverage",
  "landscape", "tapestry", "multifaceted", "holistic approach",
];

/** Mots vides pour la détection de langue. */
export const FRENCH_STOPWORDS = new Set(
  "le la les des de du un une et est dans que qui il elle on ne se son sa ses pour pas sur avec au aux ce cette ces en par plus ".split(/\s+/)
);
export const ENGLISH_STOPWORDS = new Set(
  "the is are and of to in that it for on with as was were be been this these those have has had not but at by an or ".split(/\s+/)
);
