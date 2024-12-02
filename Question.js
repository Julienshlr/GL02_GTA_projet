// Classe permettant la création d'une question

var Question = function(id, titre, type, enonce, options, reponsesCorrectes) {
    this.id = id;
    this.titre = titre;
    this.type = type;
    this.enonce = enonce;
    this.options = options;
    this.reponsesCorrectes = reponsesCorrectes;
};

module.exports = Question;
