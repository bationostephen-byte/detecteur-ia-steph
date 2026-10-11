/**
 * Suite de tests du moteur de détection — Détecteur IA Steph.
 *
 * Objectif : vérifier que le détecteur atteint sa cible de précision (60-70 %)
 * sur un corpus étiqueté, et qu'il reste robuste dans tous les cas limites :
 * textes courts, vides, sans ponctuation, code source, listes, très longs.
 *
 * Le corpus est organisé en 3 familles :
 *   - Textes rédigés "à la manière d'un LLM" (fluides, connecteurs, réguliers)
 *   - Textes rédigés "à la manière d'un humain" (irréguliers, personnels)
 *   - Cas limites (robustesse, pas de crash, sorties cohérentes)
 */
import { describe, it, expect } from "vitest";
import { analyzeText } from "./engine";

// ---------------------------------------------------------------------------
// Corpus IA (français) — style LLM : connecteurs, phrases régulières, ton formel
// ---------------------------------------------------------------------------

const AI_FR_1 = `
L'intelligence artificielle joue un rôle crucial dans la transformation du secteur éducatif moderne. En effet, elle permet de personnaliser les parcours d'apprentissage en fonction des besoins spécifiques de chaque élève. De plus, les plateformes adaptatives analysent en temps réel les performances des apprenants afin d'ajuster les contenus proposés. Il est important de noter que ces technologies ne remplacent pas les enseignants, mais les accompagnent dans leurs missions quotidiennes. Par ailleurs, l'automatisation des tâches administratives libère un temps précieux pour l'accompagnement pédagogique individualisé des élèves en difficulté. En outre, les assistants virtuels répondent aux questions fréquentes des étudiants à toute heure de la journée. Dans ce contexte, il convient de souligner que la formation des enseignants constitue un enjeu majeur pour la réussite de cette transition numérique. Ainsi, les établissements scolaires doivent investir dans des programmes de développement professionnel adaptés aux réalités du terrain. Par conséquent, une collaboration étroite entre les concepteurs de technologies et les acteurs éducatifs apparaît indispensable. En conclusion, l'intelligence artificielle offre des perspectives prometteuses pour l'éducation, à condition d'être déployée de manière réfléchie et éthique.
`;

const AI_FR_2 = `
Le changement climatique représente l'un des défis les plus importants de notre époque contemporaine. Dans ce contexte, la transition énergétique joue un rôle essentiel dans la réduction des émissions de gaz à effet de serre. Tout d'abord, les énergies renouvelables comme le solaire et l'éolien connaissent une croissance remarquable à l'échelle mondiale. Ensuite, les politiques publiques encouragent de plus en plus les entreprises à adopter des pratiques durables et responsables. Il est crucial de noter que l'engagement des citoyens constitue également un levier déterminant pour atteindre les objectifs climatiques. De plus, les innovations technologiques permettent d'améliorer significativement l'efficacité énergétique des bâtiments et des transports. Par ailleurs, la coopération internationale s'avère indispensable pour coordonner les efforts de décarbonation entre les différents pays. Néanmoins, des obstacles considérables subsistent, notamment en termes de financement et d'acceptabilité sociale des projets. Il convient également de mentionner que les inégalités entre pays développés et pays en développement compliquent la mise en œuvre des accords. Ainsi, une approche globale et équitable apparaît nécessaire pour garantir une transition juste pour tous. En conclusion, la lutte contre le changement climatique exige une mobilisation collective sans précédent à tous les niveaux de la société.
`;

const AI_FR_3 = `
L'économie numérique a profondément transformé les modes de consommation au cours des deux dernières décennies. En effet, les plateformes de commerce en ligne offrent désormais un accès instantané à des millions de produits et de services. Il est important de souligner que cette transformation a également modifié les attentes des consommateurs en matière de rapidité et de personnalisation. De plus, les réseaux sociaux jouent un rôle clé dans les stratégies de marketing des entreprises contemporaines. Par ailleurs, l'analyse des données permet aux organisations de mieux comprendre les comportements d'achat de leurs clients. Dans cette perspective, l'intelligence artificielle contribue à optimiser les recommandations de produits et à améliorer l'expérience utilisateur. Toutefois, cette évolution soulève des questions importantes concernant la protection de la vie privée et la sécurité des données personnelles. Il est essentiel de rappeler que les réglementations comme le RGPD visent à encadrer ces pratiques pour protéger les consommateurs. En outre, la concurrence entre les grandes plateformes stimule l'innovation mais pose aussi des défis en termes de concurrence loyale. Ainsi, les pouvoirs publics cherchent à établir un cadre juridique équilibré favorisant à la fois l'innovation et la protection des utilisateurs. En résumé, l'économie numérique continuera de façonner nos sociétés, et il appartient à chacun de s'adapter à ces transformations majeures.
`;

const AI_FR_4 = `
La santé publique constitue un pilier fondamental du développement des sociétés modernes et prospères. Dans ce contexte, la prévention joue un rôle central dans l'amélioration de la qualité de vie des populations. Tout d'abord, les campagnes de vaccination ont permis d'éliminer ou de contrôler de nombreuses maladies infectieuses autrefois redoutables. Ensuite, les politiques de lutte contre le tabagisme illustrent l'efficacité des interventions sanitaires à grande échelle. Il est à noter que les inégalités d'accès aux soins demeurent néanmoins un problème majeur dans de nombreux pays. De plus, les maladies chroniques comme le diabète et les maladies cardiovasculaires représentent un fardeau croissant pour les systèmes de santé. Par ailleurs, la santé mentale est désormais reconnue comme une composante essentielle du bien-être général des individus. En outre, les avancées technologiques telles que la télémédecine facilitent l'accès aux soins dans les zones rurales isolées. Cependant, le financement des systèmes de santé reste un défi considérable face au vieillissement de la population mondiale. Ainsi, une approche intégrée combinant prévention, soins de qualité et innovation apparaît indispensable pour l'avenir. En conclusion, investir dans la santé publique constitue un choix stratégique qui bénéficie à l'ensemble de la société.
`;

// ---------------------------------------------------------------------------
// Corpus IA (anglais)
// ---------------------------------------------------------------------------

const AI_EN_1 = `
Artificial intelligence plays a crucial role in shaping the future of modern healthcare systems around the world. Furthermore, machine learning algorithms can analyze medical images with a level of precision that rivals experienced radiologists. It is important to note that these technologies are designed to assist doctors rather than replace them entirely. In addition, predictive analytics enables hospitals to allocate their resources more efficiently and reduce waiting times for patients. Moreover, natural language processing helps researchers navigate the complexities of vast medical literature databases. As a result, drug discovery processes have been accelerated significantly over the past few years. However, it is essential to address the ethical concerns surrounding patient data privacy and algorithmic bias. In this context, regulatory frameworks must evolve to keep pace with rapid technological advancements in the medical field. Notably, collaboration between engineers, clinicians, and policymakers underscores the importance of a multidisciplinary approach. Overall, the integration of artificial intelligence into healthcare paves the way for more personalized and accessible medical services. In conclusion, while challenges remain, the potential benefits of these innovations are truly remarkable for society.
`;

const AI_EN_2 = `
Climate change represents one of the most pressing challenges of our time, requiring urgent collective action. In today's world, the transition to renewable energy sources plays a vital role in reducing greenhouse gas emissions. Firstly, solar and wind power have experienced remarkable growth across both developed and developing nations. Secondly, governments are increasingly implementing policies that encourage sustainable business practices and green investments. It is worth noting that individual consumer choices also contribute significantly to the overall environmental impact of society. Furthermore, technological innovation continues to improve the efficiency of energy storage systems and smart grids. On the other hand, substantial obstacles persist, particularly regarding financing and social acceptance of large-scale projects. Additionally, international cooperation is essential to coordinate decarbonization efforts across different regions and economies. In this regard, global agreements such as the Paris Accord highlight the importance of shared commitments and accountability. Consequently, a comprehensive and equitable approach appears necessary to ensure a just transition for all communities. In summary, addressing climate change demands an unprecedented level of mobilization at every level of society.
`;

// ---------------------------------------------------------------------------
// Corpus humain (français) — style irrégulier, personnel, vocabulaire concret
// ---------------------------------------------------------------------------

const HUMAN_FR_1 = `
Hier, je suis retourné dans le village de ma grand-mère, près de Millau. Rien n'a changé. La boulangerie sent toujours le pain chaud à six heures du matin, et le vieux monsieur Ferrand arrose ses géraniums comme si sa vie en dépendait. J'ai retrouvé mon vélo d'enfant dans la grange, rouillé, la selle crevée. Ça m'a fichu un coup. Dix ans ont passé et j'avais l'impression d'avoir quinze ans à nouveau. Mamie m'a fait sa fameuse aligot — trop de fromage, jamais assez sel, parfait. On a parlé de tout et de rien jusqu'à minuit. Elle m'a raconté comment elle avait connu Papi, une histoire de bal musette et de chaussures trop serrées. Je riais, mais j'avais la gorge serrée. Le matin, les chèvres du voisin m'ont réveillé à cinq heures. Cinq heures ! Je déteste ces bêtes. Et pourtant, en partant, j'ai pleuré comme un gamin. Le train filait vers Paris et je regardais les collines de l'Aubrac disparaître. Pourquoi est-ce que je n'y vais pas plus souvent ? La réponse m'échappe. Peut-être que la vie parisienne nous avale tout cru. En tout cas, j'y retourne en août. C'est promis.
`;

const HUMAN_FR_2 = `
Franchement, ce tutoriel m'a rendu fou. Trois heures ! Trois heures pour configurer un foutu serveur web qui refuse de démarrer. Le message d'erreur ? Aucun sens. J'ai écumé les forums, essayé quinze solutions différentes, redémarré ma machine quatre fois. Rien. Alors j'ai fait ce que j'aurais dû faire dès le début : lire la doc. Évidemment, il manquait une ligne dans le fichier de config. UNE ligne. Bon. Le serveur tourne maintenant, et je me sens à la fois soulagé et complètement idiot. Mon chat, lui, a dormi sur le clavier pendant toute la séance — ce qui n'a probablement pas aidé, soyons honnêtes. Demain j'attaque la partie base de données. J'appréhende déjà. Si quelqu'un a un bon tuto Postgres sous la main, je prends. En attendant, je mérite une bière. Ou deux.
`;

const HUMAN_FR_3 = `
Le marché de samedi matin, c'est mon rituel. J'y vais à huit heures pile, avant la foule. D'abord chez Ahmed pour les olives — les vertes, cassées, celles qui sentent le fenouil. Ensuite la fromagerie où la patronne me fait toujours goûter un bout de comté "pour la route". Ce samedi-là, il pleuvait des cordes. Les parapluies se cognaient entre les étals, une dame a renversé son panier de tomates, le poissonnier gueulait contre son frigo en panne. Le chaos. J'adore ça. J'ai acheté des girolles hors de prix et un fromage dont j'ai oublié le nom, un truc de chèvre affiné dans de la cendre. Douze euros le morceau ! Mon portefeuille saigne mais mes papilles me remercient. Au retour, trempé jusqu'aux os, j'ai croisé la voisine qui déménage. Elle m'a filé un pied de figuier dans un pot en plastique. "Tu verras, ça pousse tout seul." On verra bien. Je n'ai jamais réussi à faire pousser quoi que ce soit.
`;

const HUMAN_FR_4 = `
Ma fille a perdu sa première dent mardi. Un événement ! Elle courait partout dans l'appartement en brandissant ce minuscule bout d'ivoire comme un trophée olympique. Le soir, grande négociation : combien la petite souris allait-elle déposer sous l'oreiller ? Elle réclamait dix euros. Dix ! Dans mon enfance c'était une pièce de deux francs et on était contents. On a transigé à deux euros et un dessin de licorne. Évidemment, à minuit et demi, panique à bord : impossible de mettre la main sur une pièce dans toute la baraque. Qui paie encore en liquide ? J'ai fini par glisser un vieux jeton de caddie en espérant qu'elle n'y voie que du feu. Verdict au réveil : "Papa, la petite souris elle est bizarre, elle donne des pièces de supermarché." Bien joué, papa. La semaine prochaine, je prévois un stock de pièces. On apprend de ses erreurs, paraît-il.
`;

// ---------------------------------------------------------------------------
// Corpus humain (anglais)
// ---------------------------------------------------------------------------

const HUMAN_EN_1 = `
okay so i finally watched that movie everyone keeps raving about and honestly?? kind of a letdown. dont get me wrong, the cinematography was gorgeous, some shots looked like actual paintings. but the plot dragged SO much in the middle. i checked my phone twice. my friend dave fell asleep, which, fair. the ending though... no spoilers but i sat in my car for ten minutes after just staring at the steering wheel. why do i do this to myself. also the popcorn cost nine dollars. NINE. for popcorn!! anyway would i recommend it? yeah probably. im mad about it but id watch it again. make it make sense.
`;

const HUMAN_EN_2 = `
My grandfather kept bees for forty years out behind the barn, and nobody in the family ever learned the trade from him. We just watched. He'd shuffle out there in this ridiculous veil, no gloves, humming something tuneless, and the bees would crawl all over his bare hands like they knew him. Maybe they did. When he passed last spring, my uncle tried to move the hives and got stung eleven times in about thirty seconds. Eleven! We counted. Now the boxes sit there going quiet, and none of us knows what to do with them. Sell them? Keep them? Mom says she'd feel guilty either way. Yesterday I found his old smoker in the shed, still smelling faintly of pine needles and woodsmoke. I just stood there holding it for a while.
`;

// ---------------------------------------------------------------------------
// Cas limites
// ---------------------------------------------------------------------------

const TEXT_EMPTY = "   ";
const TEXT_TINY = "Bonjour le monde.";
const TEXT_NO_PUNCT =
  "ce texte n a aucune ponctuation et il continue comme ça sans jamais s arrêter avec des mots qui s enchaînent les uns après les autres sans structure ni pause";
const TEXT_CODE = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
const result = fibonacci(10);
console.log(result);
`;
const TEXT_LIST = `
- Pommes
- Poires
- Fromage de chèvre
- Pain complet
- Huile d'olive
- Tomates cerises
- Basilic frais
`;
const TEXT_REPEATED = "Le chat dort. ".repeat(120);

// ---------------------------------------------------------------------------
// Tests : précision sur corpus étiqueté
// ---------------------------------------------------------------------------

describe("Détecteur IA Steph — précision sur corpus étiqueté", () => {
  const aiTexts = [
    ["AI_FR_1", AI_FR_1],
    ["AI_FR_2", AI_FR_2],
    ["AI_FR_3", AI_FR_3],
    ["AI_FR_4", AI_FR_4],
    ["AI_EN_1", AI_EN_1],
    ["AI_EN_2", AI_EN_2],
  ] as const;
  const humanTexts = [
    ["HUMAN_FR_1", HUMAN_FR_1],
    ["HUMAN_FR_2", HUMAN_FR_2],
    ["HUMAN_FR_3", HUMAN_FR_3],
    ["HUMAN_FR_4", HUMAN_FR_4],
    ["HUMAN_EN_1", HUMAN_EN_1],
    ["HUMAN_EN_2", HUMAN_EN_2],
  ] as const;

  it("classifie les textes IA au-dessus du seuil IA (>= 58)", () => {
    for (const [name, text] of aiTexts) {
      const r = analyzeText(text);
      expect(r.score, `${name} devrait être détecté IA (score=${r.score})`).toBeGreaterThanOrEqual(58);
      expect(r.verdict).toBe("ia");
    }
  });

  it("classifie les textes humains en dessous du seuil humain (<= 42)", () => {
    for (const [name, text] of humanTexts) {
      const r = analyzeText(text);
      expect(r.score, `${name} devrait être détecté humain (score=${r.score})`).toBeLessThanOrEqual(42);
      expect(r.verdict).toBe("humain");
    }
  });

  it("atteint une précision globale d'au moins 60 % sur le corpus", () => {
    let correct = 0;
    let total = 0;
    for (const [, text] of aiTexts) {
      total++;
      if (analyzeText(text).verdict === "ia") correct++;
    }
    for (const [, text] of humanTexts) {
      total++;
      if (analyzeText(text).verdict === "humain") correct++;
    }
    const accuracy = correct / total;
    expect(accuracy).toBeGreaterThanOrEqual(0.6);
  });

  it("produit toujours un score dans [0, 100]", () => {
    for (const [, text] of [...aiTexts, ...humanTexts]) {
      const s = analyzeText(text).score;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests : structure du résultat
// ---------------------------------------------------------------------------

describe("Détecteur IA Steph — structure du résultat", () => {
  it("retourne les 9 caractéristiques avec poids et explications", () => {
    const r = analyzeText(AI_FR_1);
    expect(r.features).toHaveLength(9);
    const totalWeight = r.features.reduce((a, f) => a + f.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 1);
    for (const f of r.features) {
      expect(f.aiLikelihood).toBeGreaterThanOrEqual(0);
      expect(f.aiLikelihood).toBeLessThanOrEqual(1);
      expect(f.explanation.length).toBeGreaterThan(10);
    }
  });

  it("détecte correctement la langue (fr / en)", () => {
    expect(analyzeText(AI_FR_1).language).toBe("fr");
    expect(analyzeText(AI_EN_1).language).toBe("en");
  });

  it("signale des phrases prévisibles dans un texte IA", () => {
    const r = analyzeText(AI_FR_2);
    expect(r.flaggedSentences.length).toBeGreaterThan(0);
    for (const f of r.flaggedSentences) {
      expect(f.predictability).toBeGreaterThanOrEqual(0.6);
      expect(f.predictability).toBeLessThanOrEqual(1);
    }
  });

  it("inclut toujours un avertissement méthodologique", () => {
    expect(analyzeText(AI_FR_1).disclaimer).toContain("60");
  });
});

// ---------------------------------------------------------------------------
// Tests : robustesse sur cas limites
// ---------------------------------------------------------------------------

describe("Détecteur IA Steph — robustesse (cas limites)", () => {
  it("gère un texte vide sans planter", () => {
    const r = analyzeText(TEXT_EMPTY);
    expect(r.score).toBe(50);
    expect(r.lowConfidence).toBe(true);
  });

  it("signale un texte trop court comme peu fiable", () => {
    const r = analyzeText(TEXT_TINY);
    expect(r.lowConfidence).toBe(true);
    expect(r.verdictLabel).toContain("trop court");
  });

  it("gère un texte sans ponctuation", () => {
    const r = analyzeText(TEXT_NO_PUNCT);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("gère du code source sans planter", () => {
    const r = analyzeText(TEXT_CODE);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.lowConfidence).toBe(true);
  });

  it("gère une simple liste d'éléments", () => {
    const r = analyzeText(TEXT_LIST);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("gère un texte très répétitif", () => {
    const r = analyzeText(TEXT_REPEATED);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("gère un texte très long (troncature du parcours sans crash)", () => {
    const long = (AI_FR_1 + " " + HUMAN_FR_1).repeat(20);
    const r = analyzeText(long);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.lowConfidence).toBe(false);
  });

  it("un texte mixte humain+IA donne un score intermédiaire", () => {
    const mixed = AI_FR_1 + "\n\n" + HUMAN_FR_2;
    const r = analyzeText(mixed);
    expect(r.score).toBeGreaterThanOrEqual(30);
    expect(r.score).toBeLessThanOrEqual(75);
  });
});
