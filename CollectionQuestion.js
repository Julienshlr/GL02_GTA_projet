// Classe permettant la création d'une collection de questions

var CollectionQuestions = function() {
    this.questions = [];
};

// Méthode pour ajouter une question
CollectionQuestions.prototype.ajouterQuestion = function(question) {
    var existe = this.questions.some(q => q.id === question.id);
    if (!existe) {
        this.questions.push(question);
        console.log(`Question "${question.titre}" ajoutée avec succès.`);
    } else {
        console.log(`La question avec l'ID "${question.id}" existe déjà dans la collection.`);
    }
};

// Méthode pour retirer une question par son id
CollectionQuestions.prototype.retirerQuestion = function(id) {
    var index = this.questions.findIndex(q => q.id === id);
    if (index !== -1) {
        var questionRetiree = this.questions.splice(index, 1);
        console.log(`Question "${questionRetiree[0].titre}" retirée avec succès.`);
    } else {
        console.log(`Aucune question trouvée avec l'ID "${id}".`);
    }
};

// Méthode pour lister toutes les questions
CollectionQuestions.prototype.listerQuestions = function() {
    if (this.questions.length === 0) {
        console.log("La collection de questions est vide.");
    } else {
        console.log("Liste des questions :");
        this.questions.forEach((q, index) => {
            console.log(`${index + 1}. ${q.titre} (ID: ${q.id})`);
        });
    }
};

module.exports = CollectionQuestions;
