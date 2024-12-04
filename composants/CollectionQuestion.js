const fs = require('fs');
const path = require('path');

// Classe permettant la création d'une collection de questions
var CollectionQuestions = function() {
    this.tempFolder = path.join(__dirname, '../temp');
    if (!fs.existsSync(this.tempFolder)) {
        fs.mkdirSync(this.tempFolder);
    }

    this.tempFile = path.join(this.tempFolder, 'temp_questions.gift');
    if (!fs.existsSync(this.tempFile)) {
        fs.writeFileSync(this.tempFile, '', 'utf-8');
    }
};

// Méthode pour ajouter une question au fichier temporaire
CollectionQuestions.prototype.ajouterQuestionTemp = function(questionTexte) {
    const contenuTemp = fs.readFileSync(this.tempFile, 'utf-8').trim();

    // Ajouter la question avec gestion des lignes vides
    const nouveauContenu = contenuTemp
        ? `${contenuTemp}\n\n${questionTexte}` // Ajouter avec saut de ligne si le fichier n'est pas vide
        : questionTexte; // Ajouter sans saut de ligne si le fichier est vide

    fs.writeFileSync(this.tempFile, nouveauContenu, 'utf-8');
    return true; // Retourne true pour indiquer que la question a été ajoutée
};

// Méthode pour retirer une question du fichier temporaire
CollectionQuestions.prototype.retirerQuestionTemp = function (titre) {
    try {
        // Charger le contenu actuel du fichier et normaliser les sauts de ligne
        const contenuTemp = fs.readFileSync(this.tempFile, 'utf-8');

        // Expression régulière pour capturer la question avec son contexte
        const regexQuestion = new RegExp(`(?:^|\\n)(::${titre}::.*?)(?:::|$)`, 's');
        const match = contenuTemp.match(regexQuestion);

        if (!match) {
            return false; // Si aucune question correspondante n'est trouvée
        }

        let [blocCorrespondant] = match; // Récupérer le bloc correspondant

        const regexBloc = new RegExp(`(?:^|\\n)(::${titre}::.*?)(?:\\n::)`, 's');
        const matchBloc = blocCorrespondant.match(regexBloc);

        if (matchBloc) {
            blocCorrespondant = blocCorrespondant.replace(/\n::$/, ''); // Supprimer les :: à la fin du bloc
        }

        let nouvelleListe;

        if (contenuTemp.startsWith(blocCorrespondant) && contenuTemp.endsWith(blocCorrespondant)) {
            // Si la question est en première position et en dernière
            nouvelleListe = contenuTemp.replace(blocCorrespondant, '').trim();
        }
        else if (contenuTemp.startsWith(blocCorrespondant)) {
            // Si la question est en première position
            nouvelleListe = contenuTemp.replace(blocCorrespondant + '\n', '').trim();
        } 
        else {
            // Si la question est ailleurs
            nouvelleListe = contenuTemp.replace(blocCorrespondant, '').trim();
        }

        // Réécrire le contenu du fichier sans le dernier saut de ligne
        // On retire un saut de ligne supplémentaire s'il y en a en fin de fichier
        fs.writeFileSync(this.tempFile, nouvelleListe + (nouvelleListe ? '\n' : ''), 'utf-8');
        return true; // Indique que la suppression a réussi
    } catch (error) {
        throw new Error(`Erreur lors de la suppression de la question : ${error.message}`);
    }
};

// Méthode pour lister toutes les questions de l'examen en cours de création
CollectionQuestions.prototype.listerQuestionsTemp = function() {
    const contenuTemp = fs.readFileSync(this.tempFile, 'utf-8');
    if (!contenuTemp.trim()) {
        return false;
    } else {
        return contenuTemp;
    }
};

module.exports = CollectionQuestions;
