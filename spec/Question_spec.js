const Question = require('../composants/Question');

describe("Tests pour Question", function () {
    beforeAll(function () {
        this.question = new Question(
            "Capital de la France",
            "QCM",
            "Quelle est la capitale de la France ?",
            ["Paris", "Londres", "Berlin"],
            ["Paris"]
        );
    });

    it("Doit créer une question si les propriétés sont correctes", function () {
        expect(this.question).toBeDefined();
        expect(this.question.titre).toBe("Capital de la France");
        expect(this.question.type).toBe("QCM");
    });

    it("Les énoncés et options sont bien stockés", function () {
        expect(this.question.enonce).toBe("Quelle est la capitale de la France ?");
        expect(this.question.options).toEqual(["Paris", "Londres", "Berlin"]);
    });

    it("Les réponses correctes sont bien stockées", function () {
        expect(this.question.reponsesCorrectes).toEqual(["Paris"]);
    });
});
