const GiftParser = require('../parser/giftParser');

describe("Tests pour giftParser", function () {
    let parser;

    beforeAll(function () {
        parser = new GiftParser(false, false);
    });

    describe("parse", function () {
        it("Doit analyser correctement une question GIFT valide", function () {
            const giftInput = "::Capitale::Quelle est la capitale de la France ?{=Paris}";

            parser.parse(giftInput);
            const result = parser.parsedQuestion[0];
            expect(result.titre).toEqual("Capitale"); 
            expect(result.enonce).toEqual("Quelle est la capitale de la France ?}"); 
            expect(result.reponsesCorrectes).toEqual([["Paris"]]); 
            expect(result.options).toEqual([[]]);
        });

        it("Ne renvoie rien pour une question GIFT invalide", function () {
            const invalidGiftInput = "Ceci n'est pas une question valide {=}";
            parser.parse(invalidGiftInput);
            expect(parser.parsedQuestion[1]).toEqual(undefined);
        });
    });

    describe("parseOptions", function () {
        it("Doit analyser correctement les options des questions à choix multiple", function () {
            const giftInput = "::Question::Quel est votre choix ? {~Option A ~Option B =Option correcte}";

            parser.parse(giftInput);
            const result = parser.parsedQuestion[1];
            expect(result.titre).toEqual("Question"); 
            expect(result.enonce).toEqual("Quel est votre choix ? }"); 
            expect(result.reponsesCorrectes).toEqual([["Option correcte"]]); 
            expect(result.options).toEqual([["Option A", "Option B", "Option correcte"]]);
        });

        it("Doit renvoyer un tableau vide pour des options vides", function () {
            const emptyInput = "::Question::Quel est votre choix ? {}";

            parser.parse(emptyInput);
            const result = parser.parsedQuestion[2];
            expect(result.titre).toEqual("Question"); 
            expect(result.enonce).toEqual("Quel est votre choix ?"); 
            expect(result.reponsesCorrectes).toEqual([[]]); 
            expect(result.options).toEqual([[]]);
        });
    });

    describe("Gestion des erreurs", function () {
        it("Doit lancer une erreur si l'entrée est null ou undefined", function () {
            expect(() => parser.parse(null)).toThrowError("Cannot read properties of null (reading 'length')");
            expect(() => parser.parse(undefined)).toThrowError("Cannot read properties of undefined (reading 'length')");
        });
    });
});
