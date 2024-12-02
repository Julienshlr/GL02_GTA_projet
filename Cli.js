const cli = require('@caporal/core').default;
const fs = require('fs');
const path = require('path');
const GiftParser = require('./parser/giftParser.js');
const CollectionQuestions = require('./CollectionQuestion.js');
const VCardGenerateur = require('./VCardGenerateur.js');
const GiftParser = require("./parser/giftParser");
const fs = require('fs');

function parseData(filePath) {
  const data = fs.readFile(filePath, 'utf8', function (err,data) {
	console.log(data);}
			);
  let analyzer = new GiftParser(false, false);
  analyzer.parse(data);

  if (analyzer.errorCount != 0) {
    console.log("The .gift file contains errors.");
  }

  return analyzer.parsedQuestion;
}

const collectionExamen = new CollectionQuestions();


cli
    .version('cli 1.0.0')

    // Commande de génération de VCard
    .command('vcard', 'Génère un fichier VCard')
    .argument('<prenom>', 'Prénom de l\'enseignant')
    .argument('<nom>', 'Nom de l\'enseignant')
    .argument('<telephone>', 'Numéro de téléphone')
    .argument('<email>', 'Adresse email')
    .option('--adresse <adresse>', 'Adresse complète', { default: "" })
    .option('--uri <uri>', 'Lien vers un profil ou site web', { default: "" })
    .option('--output <nomFichier>', 'Nom du fichier de sortie (sans extension)', { default: "contact" })
    .action(({ args, options, logger }) => {
        try {
            const generateur = new VCardGenerateur();
            const data = {
                prenom: args.prenom,
                nom: args.nom,
                telephone: args.telephone,
                email: args.email,
                adresse: options.adresse,
                uri: options.uri
            };

            generateur.sauvegarderFichier(data, options.output);
            logger.info(`Fichier VCard généré avec succès : VCardGeneree/${options.output}.vcf`);
        } catch (error) {
            logger.error(error.message);
        }
    })




    // Commande pour ajouter une question
    .command('add-question', 'Ajouter une question à l\'examen en cours')
    .argument('<fichier>', 'Nom du fichier dans SujetB_data (sans extension)')
    .argument('<idQuestion>', 'ID de la question à ajouter')
    .action(({ args, logger }) => {
        try {
            // Charger le fichier
            const cheminFichier = path.join(__dirname, 'SujetB_data', `${args.fichier}.gift`);
            if (!fs.existsSync(cheminFichier)) {
                logger.error(`Le fichier ${args.fichier}.gift est introuvable.`);
                return;
            }

            const contenu = fs.readFileSync(cheminFichier, 'utf-8');
            logger.info("Contenu du fichier chargé :\n" + contenu);

            // Parse les questions
            const parser = new GiftParser(false, false);
            parser.parse(contenu);

            console.log("Questions disponibles :", parser.parsedQuestion.map(q => q.titre));

            // Rechercher la question par ID
            const question = parser.parsedQuestion.find(q => q.titre === args.idQuestion);
            if (!question) {
                logger.error(`La question avec l'ID "${args.idQuestion}" est introuvable dans ${args.fichier}.gift.`);
                return;
            }

            // Ajouter la question à la collection d'examen
            if (collectionExamen.questions.length >= 20) {
                logger.warn('Vous ne pouvez pas ajouter plus de 20 questions à l\'examen.');
                return;
            }
            collectionExamen.ajouterQuestion(question);
        } catch (error) {
            logger.error(`Erreur lors de l'ajout de la question : ${error.message}`);
        }
    })

    // Commande pour retirer une question
    .command('remove-question', 'Retirer une question de l\'examen en cours')
    .argument('<idQuestion>', 'ID de la question à retirer')
    .action(({ args, logger }) => {
        try {
            collectionExamen.retirerQuestion(args.idQuestion);
        } catch (error) {
            logger.error(`Erreur lors de la suppression de la question : ${error.message}`);
        }
    })

    // Commande pour exporter l'examen
    .command('export-exam', 'Exporter l\'examen en cours au format .gift')
    .argument('<nomDossier>', 'Nom du dossier de destination')
    .argument('<nomFichier>', 'Nom du fichier de destination (sans extension)')
    .action(({ args, logger }) => {
        try {
            // Vérifier les contraintes de l'examen
            if (collectionExamen.questions.length < 15) {
                logger.error('Un examen doit contenir au moins 15 questions.');
                return;
            }

            // Construire le contenu au format GIFT
            const contenuGift = collectionExamen.questions.map(q => {
                return `::${q.titre}:: ${q.enonce} { ${q.options.map(o => (q.reponsesCorrectes.includes(o) ? '=' : '~') + o).join(' ')} }`;
            }).join('\n\n');

            // Créer le dossier si nécessaire
            const dossier = path.join(__dirname, args.nomDossier);
            if (!fs.existsSync(dossier)) {
                fs.mkdirSync(dossier, { recursive: true });
            }

            // Sauvegarder le fichier
            const cheminFichier = path.join(dossier, `${args.nomFichier}.gift`);
            fs.writeFileSync(cheminFichier, contenuGift, 'utf-8');
            logger.info(`Examen exporté avec succès : ${cheminFichier}`);

            // Réinitialiser la collection pour permettre un nouvel examen
            collectionExamen.questions = [];
            logger.info('La collection d\'examen a été réinitialisée. Vous pouvez commencer un nouvel examen.');
        } catch (error) {
            logger.error(`Erreur lors de l'exportation de l'examen : ${error.message}`);
        }
    })

    // Commande pour lister les questions de l'examen
    .command('list-exam', 'Lister toutes les questions de l\'examen en cours')
    .action(({ logger }) => {
        try {
            collectionExamen.listerQuestions();
        } catch (error) {
            logger.error(`Erreur lors de l\'affichage des questions : ${error.message}`);
        }
    });
cli
	.command('recherche', 'cherche une question selon un critere dans les données')
	.argument('<id>', 'identifiant de la question')
    .argument('<type>', 'type de question')
    .argument('<titre>', 'mot présent dans le titre de la question')
	    .action(({ args, options, logger }) => {
        try {
				let listQ= parseData("/SujetB_data/");
				for(let i=0; i<=listQ.questions.length; i++){
					if(listQ.questions[i].id==args.id || listQ.questions[i].type==args.type || listQ.questions[i].titre.includes(args.titre)){
						console.log('id:'+listQ.questions[i].id+'/n type:'+listQ.questions[i].type+'/n titre:'+listQ.questions[i].titre);
						console.log('/n /n');
					}
					
				}
        } catch (error) {
            logger.error(error.message);
        }
    });





cli.run(process.argv.slice(2));
