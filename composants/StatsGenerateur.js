const fs = require('fs');
const vg = require('vega');
const vegalite = require('vega-lite');

// Classe permettant la création d'histogrammes
var StatsGenerateur = function() {
    
};

// Méthode pour créer et exporter un histogramme
StatsGenerateur.prototype.createHistogram = function(data, outputFileName, logger) {
    return new Promise((resolve, reject) => {
        // Vérification de la validité des données
        if (!data || Object.keys(data).length === 0) {
            const errorMessage = "Données invalides pour la création de l'histogramme";
            logger.error(errorMessage);
            reject(new Error(errorMessage));
            return;
        }

        const histogramData = Object.entries(data).map(([type, count]) => ({
            QuestionType: type,
            Count: count,
        }));

        // StatsGenerateur.js
        const chartSpec = {
            data: { values: histogramData },
            width: 800, // Augmenter la largeur du graphique
            height: 400,
            mark: 'bar',
            encoding: {
                x: {
                    field: 'QuestionType',
                    type: 'nominal',
                    axis: {
                        title: 'Type de question',
                        labelAngle: -45, // Incliner les étiquettes à -45 degrés
                        labelFontSize: 12,
                        labelLimit: 300 // Éviter que les étiquettes soient tronquées
                    },
                    sort: null,
                },
                y: {
                    field: 'Count',
                    type: 'quantitative',
                    axis: { title: 'Nombre de questions' },
                },
            },
        };


                const compiledChart = vegalite.compile(chartSpec).spec;
                const runtime = vg.parse(compiledChart);
                const view = new vg.View(runtime).renderer('svg').run();

                view
                    .toSVG()
                    .then((svg) => {
                        fs.writeFileSync(outputFileName, svg);
                        view.finalize();
                        resolve(); // Signale la fin de la création
                    })
                    .catch((err) => {
                        logger.error(`Erreur lors de la génération du graphique : ${err.message}`);
                        reject(err); // Signale l'erreur
                    });
            });
        };


module.exports = StatsGenerateur;
