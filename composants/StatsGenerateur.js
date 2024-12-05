const fs = require('fs');
const vg = require('vega');
const vegalite = require('vega-lite');

// Classe permettant la création d'histogrammes
var StatsGenerateur = function() {
    
};

// Méthode pour créer et exporter un histogramme
StatsGenerateur.prototype.createHistogram = function(data, outputFileName, logger) {
    const histogramData = Object.entries(data).map(([type, count]) => ({
        QuestionType: type,
        Count: count,
    }));

    const chartSpec = {
        data: { values: histogramData },
        mark: 'bar',
        encoding: {
            x: {
                field: 'QuestionType',
                type: 'ordinal',
                axis: { title: 'Type de question' },
            },
            y: {
                field: 'Count',
                type: 'quantitative',
                axis: { title: 'Nombre de questions' },
            },
        },
    };

    // Compilation et génération du graphique SVG
    const compiledChart = vegalite.compile(chartSpec).spec;
    const runtime = vg.parse(compiledChart);
    const view = new vg.View(runtime).renderer('svg').run();

    view
        .toSVG()
        .then((svg) => {
            fs.writeFileSync(outputFileName, svg);
            view.finalize();
        })
        .catch((err) => logger.error(`Erreur lors de la génération du graphique : ${err.message}`));
};

module.exports = StatsGenerateur;
