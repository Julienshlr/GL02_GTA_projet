const cli = require('@caporal/core').default;
const fs = require('fs');
const path = require('path');
const GiftParser = require('./parser/giftParser.js');
const CollectionQuestions = require('./CollectionQuestion.js');
const VCardGenerateur = require('./VCardGenerateur.js');

const collectionExamen = new CollectionQuestion();


function parseData(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');  
		  let analyzer = new GiftParser(false, false);
		  analyzer.parse(data);

		  if (analyzer.errorCount != 0) {
			console.log("The .gift file contains errors.");
		  }
			//console.log(analyzer.parsedQuestion);
		  return analyzer.parsedQuestion;
		  

}


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
    .command('add-question', 'Ajouter une question à l\'examen temporaire')
    .argument('<fichier>', 'Nom du fichier dans SujetB_data (sans extension)')
    .argument('<titreQuestion>', 'Titre de la question à ajouter')
    .action(({ args, logger }) => {
        try {
            // Vérifier si le fichier temporaire contient déjà 20 questions
            const tempPath = path.join(__dirname, 'temp', 'temp_questions.gift');
            const contenuTemp = fs.existsSync(tempPath) ? fs.readFileSync(tempPath, 'utf-8') : '';
            const questionsExistantes = contenuTemp.split('\n').filter(line => line.startsWith('::')).length;
    
            if (questionsExistantes >= 20) {
                logger.error('Vous ne pouvez pas ajouter plus de 20 questions à l\'examen temporaire.');
                return;
            }
    
            // Charger le fichier source
            const cheminFichier = path.join(__dirname, 'SujetB_data', `${args.fichier}.gift`);
            if (!fs.existsSync(cheminFichier)) {
                logger.error(`Le fichier ${args.fichier}.gift est introuvable.`);
                return;
            }
    
            const contenu = fs.readFileSync(cheminFichier, 'utf-8');
            const regexQuestion = new RegExp(`::${args.titreQuestion}::.*?(?=\\n::|\\n$|$)`, 's');
            const questionTrouvee = contenu.match(regexQuestion);
    
            if (!questionTrouvee) {
                logger.error(`La question avec le titre "${args.titreQuestion}" est introuvable dans ${args.fichier}.gift.`);
                return;
            }

            if (contenuTemp.includes(args.titreQuestion)) {
                logger.error(`La question "${args.titreQuestion}" existe déjà dans l'examen en cours de création.`);
                return;
            }
    
            // Ajouter la question au fichier temporaire après nettoyage
            let nouvelleQuestion = questionTrouvee[0].trim();
    
            // Supprimer les lignes qui commencent par '//'
            nouvelleQuestion = nouvelleQuestion
                .split('\n')                     // Découpe la question en lignes
                .filter(line => !line.trim().startsWith('//')) // Exclut les lignes commençant par //
                .join('\n');                    // Reconstruit la question sans ces lignes
    
            const ajoutReussi = collectionExamen.ajouterQuestionTemp(nouvelleQuestion);
    
            if (ajoutReussi) {
                logger.info(`Question "${args.titreQuestion}" ajoutée avec succès à l'examen en cours de création.`);
            }
        } catch (error) {
            logger.error(`Erreur lors de l'ajout de la question : ${error.message}`);
        }
    })

    // Commande pour retirer une question
    .command('remove-question', 'Retirer une question de l\'examen en cours')
    .argument('<titreQuestion>', 'Titre de la question à retirer')
    .action(({ args, logger }) => {
        try {
            const questionRetiree = collectionExamen.retirerQuestionTemp(args.titreQuestion);
            if (questionRetiree) {
                logger.info(`Question avec le titre "${args.titreQuestion}" retirée avec succès.`);
            } else {
                logger.error(`Aucune question trouvée avec le titre "${args.titreQuestion}".`);
            }
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
            // Définir le chemin du fichier temporaire
            const tempPath = path.join(__dirname, 'temp', 'temp_questions.gift');

            // Vérifier si le fichier temporaire existe
            if (!fs.existsSync(tempPath)) {
                logger.error('Aucun examen en cours de création.');
                return;
            }

            // Lire le contenu du fichier temporaire
            const contenuTemp = fs.readFileSync(tempPath, 'utf-8');

            // Vérifier si le nombre de questions est inférieur à 15
            const questionsExistantes = contenuTemp.split('\n').filter(line => line.startsWith('::')).length;
            if (questionsExistantes < 15) {
                logger.error('Un examen doit contenir au moins 15 questions. Il en contient actuellement : ' + questionsExistantes);
                return;
            }

            // Créer le dossier de destination s'il n'existe pas
            const dossier = path.join(__dirname, "examens/" + `${args.nomDossier}`);
            if (!fs.existsSync(dossier)) {
                fs.mkdirSync(dossier, { recursive: true });
            }

            // Définir le chemin du fichier d'exportation
            const cheminFichier = path.join(dossier, `${args.nomFichier}.gift`);

            // Sauvegarder le fichier temporaire sous le nom spécifié
            fs.writeFileSync(cheminFichier, contenuTemp, 'utf-8');
            logger.info(`Examen exporté avec succès : ${cheminFichier}`);

            // Supprimer le fichier temporaire après l'export
            fs.unlinkSync(tempPath);

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
    })

	.command('recherche', 'cherche une question selon un critere dans les données')
	.argument('<id>', 'identifiant de la question')
    .argument('<type>', 'type de question')
    .argument('<titre>', 'mot présent dans le titre de la question')
	    .action(({ args, options, logger }) => {
        try {
				let listData = fs.readdirSync('SujetB_data');
				let listQ=[];
				let filepath;
				for(let i=0; i<listData.length; i++){
					filepath='SujetB_data/'+String(listData[i]);
					listQ= listQ.concat(parseData(filePath));
				}
				
				for(let i=0; i<listQ.length; i++){
					if(listQ[i].id==args.id || listQ[i].type==args.type || listQ[i].titre.includes(args.titre)){
						console.log('id:'+listQ[i].id+'\n type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
						console.log('\n \n');
					}
					
				}
        } catch (error) {
            logger.error(error.message);
        }
    });





cli.run(process.argv.slice(2));
