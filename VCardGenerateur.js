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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur);
};

VCardGenerateur.prototype.validerAdresse = function(valeur) {
    return valeur === "" || /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s,\-\.\']+$/.test(valeur);
};

// Méthode pour générer le contenu VCard
VCardGenerateur.prototype.genererVCard = function(data) {
    const { nom, prenom, telephone, email, adresse, uri } = data;

    if (!this.validerNomPrenom(nom) || !this.validerNomPrenom(prenom)) {
        throw new Error("Nom ou prénom invalide.");
    }
    if (!this.validerTelephone(telephone)) {
        throw new Error("Numéro de téléphone invalide. Format attendu : 5 blocs de 2 chiffres séparés par un espace.");
    }
    if (!this.validerEmail(email)) {
        throw new Error("Adresse email invalide.");
    }
    if (!this.validerAdresse(adresse)) {
        throw new Error("Adresse invalide.");
    }

    return `
BEGIN:VCARD
VERSION:4.0
FN:${nom} ${prenom}
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
