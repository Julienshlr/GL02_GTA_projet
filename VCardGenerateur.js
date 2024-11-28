const fs = require('fs');
const path = require('path');

// Classe permettant la génération de VCard
var VCardGenerateur = function() {};

// Méthode de validation des champs
VCardGenerateur.prototype.validerNomPrenom = function(valeur) {
    return /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-]+$/.test(valeur);
};

VCardGenerateur.prototype.validerTelephone = function(valeur) {
    // Valide un numéro sous la forme 5 blocs de 2 chiffres séparés par un espace
    return /^(\d{2}\s){4}\d{2}$/.test(valeur);
};

VCardGenerateur.prototype.validerEmail = function(valeur) {
    return /^[\da-zA-ZÀ-ÖØ-öø-ÿ._-]+@[\da-zA-ZÀ-ÖØ-öø-ÿ]+\.[\da-zA-ZÀ-ÖØ-öø-ÿ]+$/.test(valeur);
};

VCardGenerateur.prototype.validerAdresse = function(valeur) {
    return valeur === "" || /^\d+\s+[\da-zA-ZÀ-ÖØ-öø-ÿ\s-]+,\s+[a-zA-ZÀ-ÖØ-öø-ÿ\s-]+\s+\d{5}$/.test(valeur);
};

// Méthode pour générer le contenu VCard
VCardGenerateur.prototype.genererVCard = function(data) {
    const { prenom, nom, telephone, email, adresse, uri } = data;

    if (!this.validerNomPrenom(nom) || !this.validerNomPrenom(prenom)) {
        throw new Error("Nom ou prénom invalide. Utilisez uniquement des caractères.");
    }
    if (!this.validerTelephone(telephone)) {
        throw new Error("Numéro de téléphone invalide. Format attendu : xx xx xx xx xx");
    }
    if (!this.validerEmail(email)) {
        throw new Error("Adresse email invalide. Format attendu : partieLocale@domaine.extension");
    }
    if (!this.validerAdresse(adresse)) {
        throw new Error("Adresse invalide. Format attendu : numeroRue nomRue, ville codePostal");
    }

    return `
BEGIN:VCARD
VERSION:4.0
FN:${prenom} ${nom}
TEL:${telephone}
EMAIL:${email}
ADR:${adresse}
URL:${uri}
END:VCARD
    `.trim();
};

// Méthode pour sauvegarder une VCard
VCardGenerateur.prototype.sauvegarderFichier = function(data, nomFichier) {
    const contenu = this.genererVCard(data);
    const dossier = path.join(__dirname, 'VCardGeneree');

    if (!fs.existsSync(dossier)) {
        fs.mkdirSync(dossier);
    }

    const cheminFichier = path.join(dossier, `${nomFichier}.vcf`);
    fs.writeFileSync(cheminFichier, contenu);
    console.log(`VCard sauvegardée dans le fichier : ${cheminFichier}`);
};

module.exports = VCardGenerateur;
