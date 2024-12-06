const StatsGenerateur = require('../composants/StatsGenerateur');
const fs = require('fs');
const path = require('path');

describe("Tests pour StatsGenerateur", function () {
    beforeAll(function () {
        this.statsGen = new StatsGenerateur();
        this.logger = {
            error: jasmine.createSpy("error"),
        };
        // Assurez-vous que le répertoire existe
        const directoryPath = path.join(__dirname, '../graphiques');
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
    });

    it("Doit créer un histogramme valide", function (done) {
        const data = {
            QCM: 5,
            "Vrai/Faux": 3,
            Libre: 2,
        };
        const outputFileName = './graphiques/test_histogram.svg';

        // Utiliser une promesse pour attendre que le fichier soit créé
        this.statsGen.createHistogram(data, outputFileName, this.logger)
            .then(() => {
                // Vérifier que le fichier a été créé
                expect(fs.existsSync(outputFileName)).toBeTrue();

                fs.unlinkSync(outputFileName);

                done(); // Indiquer à Jasmine que le test est terminé
            })
            .catch((err) => {
                done.fail(`Erreur lors de la création du graphique: ${err.message}`);
            });
    });

    it("Renvoie une erreur si la création d'histogramme échoue", async function () {
        const data = {}; // Données invalides
        const outputFileName = './graphiques/invalid_histogram.svg';

        // Vérification de l'erreur lancée par createHistogram
        try {
            await this.statsGen.createHistogram(data, outputFileName, this.logger);
        } catch (e) {
            expect(e.message).toBe("Données invalides pour la création de l'histogramme");
            // Vérifiez si l'erreur a bien été loggée
            expect(this.logger.error).toHaveBeenCalledWith("Données invalides pour la création de l'histogramme");
        }
    });
});
