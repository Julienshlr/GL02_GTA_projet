// Import des bibliothèques nécessaires
const fs = require("fs");
const path = require('path');
const VegaLite = require("vega-lite");
const GiftParser = require("../parser/giftParser");

/**
 * Fonction principale pour générer le profil statistique des examens
 * @param {string[]} filePaths - liste des chemins vers les fichiers GIFT
 */
const examFiles = [
  path.join(__dirname, '..', 'examens', 'test.gift'),
];

function generateExamProfile(filePaths) {
  if (!filePaths || filePaths.length === 0) {
    console.error("Erreur : Aucun fichier GIFT fourni.");
    return;
  }

  const questionTypesCount = {}; // stocke le nombre de chaque type de question
  const parser = new GiftParser(false, false); // initialiser le parser avec options
  

  // parcourir tous les fichiers fournis
  filePaths.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8"); // lire le fichier
      parser.parse(content); // analyser le contenu avec le parser

      // compter les types de questions détectés
      parser.parsedQuestion.forEach((question) => {
        const type = question.type;
        if (type) {
          questionTypesCount[type] = (questionTypesCount[type] || 0) + 1;
          console.log(`Question type: ${type}, count: ${questionTypesCount[type]}`); // suvi dans la console
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la lecture ou du parsing du fichier ${filePath} :`, error.message);
    }
  });

  // générer et enregistrer l'histogramme
  if (Object.keys(questionTypesCount).length > 0) {
    createHistogram(questionTypesCount);
  } else {
    console.error("Aucune question valide détectée.");
  }
}

/**
 * fonction pour créer un histogramme des types de questions
 * @param {Object} data - données des types de questions
 */
function createHistogram(data) {
  const histogramData = Object.entries(data).map(([type, count]) => ({
    QuestionType: type,
    Count: count,
  }));

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Histogramme des types de questions dans les examens",
    data: { values: histogramData },
    mark: "bar",
    encoding: {
      x: { field: "QuestionType", type: "ordinal", title: "Type de question" },
      y: { field: "Count", type: "quantitative", title: "Nombre de questions" },
    },
  };

  // générer le fichier PNG pour l'histogramme (avec la date pour que le nom soit unique)
const outputFileName = `histogram_${Date.now()}.png`;
VegaLite.renderToFile(spec, outputFileName)
  .then(() => console.log(`Histogramme généré : ${outputFileName}`))
  .catch((err) => console.error("Erreur lors de la création de l'histogramme :", err));
}

generateExamProfile(examFiles);
