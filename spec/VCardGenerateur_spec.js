const VCardGenerateur = require('../composants/VCardGenerateur');

describe("Tests pour VCardGenerateur", function () {
    beforeAll(function () {
        this.generator = new VCardGenerateur();
    });

    it("Valide des noms corrects", function () {
        expect(this.generator.validerNomPrenom("Jean Dupont")).toBeTrue();
        expect(this.generator.validerNomPrenom("Émilie")).toBeTrue();
    });

    it("Erreur si noms incorrects", function () {
        expect(this.generator.validerNomPrenom("Jean123")).toBeFalse();
        expect(this.generator.validerNomPrenom("@Jean")).toBeFalse();
    });

    it("Valide un numéro de téléphone valide", function () {
        expect(this.generator.validerTelephone("01 23 45 67 89")).toBeTrue();
    });

    it("Erreur si le numéro de téléphone est invalide", function () {
        expect(this.generator.validerTelephone("12345")).toBeFalse();
    });

    it("Doit générer un string VCard correct", function () {
        const data = {
            prenom: "Jean",
            nom: "Dupont",
            telephone: "01 23 45 67 89",
            email: "jean.dupont@example.com",
            adresse: "10 rue de Paris, Paris 75001",
            uri: "http://example.com",
        };

        const vCard = this.generator.genererVCard(data);
        expect(vCard).toContain("FN:Jean Dupont");
        expect(vCard).toContain("TEL:01 23 45 67 89");
        expect(vCard).toContain("EMAIL:jean.dupont@example.com");
    });

    it("Renvoie une erreur si les données sont incorrectes", function () {
        const data = {
            prenom: "Jean",
            nom: "Dupont",
            telephone: "12345",
            email: "jean.dupont@example.com",
            adresse: "10 rue de Paris, Paris 75001",
            uri: "http://example.com",
        };

        expect(() => this.generator.genererVCard(data)).toThrowError("Numéro de téléphone invalide. Format attendu : xx xx xx xx xx");
    });
});
