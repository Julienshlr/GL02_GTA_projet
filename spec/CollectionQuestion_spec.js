const CollectionQuestions = require('../composants/CollectionQuestion');
const fs = require('fs');

describe("Tests pour CollectionQuestions", function () {
    beforeAll(function () {
        this.collection = new CollectionQuestions();
    });

    afterEach(function () {
        fs.writeFileSync(this.collection.tempFile, '', 'utf-8');
    });

    it("Doit ajouter une question valide au fichier temporaire", function () {
        const question = "::Capital::Quelle est la capitale de la France ? {=Paris}";
        this.collection.ajouterQuestionTemp(question);

        const content = fs.readFileSync(this.collection.tempFile, 'utf-8').trim();
        expect(content).toBe(question);
    });

    it("Doit lister toutes les questions dans le fichier temporaire", function () {
        const question1 = "::Capital::Quelle est la capitale de la France ? {=Paris}";
        const question2 = "::Maths::Quelle est 2+2 ? {=4}";
        this.collection.ajouterQuestionTemp(question1);
        this.collection.ajouterQuestionTemp(question2);

        const content = this.collection.listerQuestionsTemp();
        expect(content).toContain(question1);
        expect(content).toContain(question2);
    });

    it("Doit retirer une question par son titre s'il est valide", function () {
        const question = "::Capital::Quelle est la capitale de la France ? {=Paris}";
        this.collection.ajouterQuestionTemp(question);

        this.collection.retirerQuestionTemp("Capital");
        const content = this.collection.listerQuestionsTemp();
        expect(content).toBeFalse();
    });

    it("Renvoie une erreur si la question à retirer n'existe pas", function () {
        const result = this.collection.retirerQuestionTemp("NonExistent");
        expect(result).toBeFalse();
    });
});
