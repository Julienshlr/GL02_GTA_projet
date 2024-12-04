// Classe permettant la création d'une question

var Question = function(titre, type, enonce, options, reponsesCorrectes) {
    this.titre = titre;
    this.type = type;
    this.enonce = enonce;
    this.options = options;
    this.reponsesCorrectes = reponsesCorrectes;
};

module.exports = Question;
