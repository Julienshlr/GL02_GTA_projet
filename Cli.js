const cli = require('@caporal/core').default;
const fs = require('fs');
const path = require('path');
const GiftParser = require('./parser/giftParser.js');
const CollectionQuestion = require('./composants/CollectionQuestion.js');
const VCardGenerateur = require('./composants/VCardGenerateur.js');
const StatsGenerateur = require('./composants/StatsGenerateur.js');


const collectionExamen = new CollectionQuestion();
const chartStats = new StatsGenerateur();


function parseData(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');  
		  let analyzer = new GiftParser(false, false);
		  analyzer.parse(data);

		  if (analyzer.errorCount != 0) {
			//console.log("The .gift file contains errors.");
		  }
			
		  return analyzer.parsedQuestion;
}


cli
    .version('cli 1.0.0')

    // Commande de génération de VCard
    .command('vcard', 'Génère un fichier VCard')
    .argument('<prenom>', 'Prénom de l\'enseignant')
    .argument('<nom>', 'Nom de l\'enseignant')
    .argument('<telephone>', 'Numéro de téléphone (xx xx xx xx xx)')
    .argument('<email>', 'Adresse email (partieLocale@domaine.extension)')
    .option('--adresse <adresse>', 'Adresse complète (numeroRue nomRue, ville codePostal)', { default: "" })
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
    .command('add-question', 'Ajouter une question à l\'examen en cours de création')
    .argument('<fichier>', 'Nom du fichier dans SujetB_data (sans extension)')
    .argument('<titreQuestion>', 'Titre de la question à ajouter')
    .action(({ args, logger }) => {
        try {
            // Vérifier si le fichier temporaire contient déjà 20 questions
            const tempPath = path.join(__dirname, 'temp', 'temp_questions.gift');
            const contenuTemp = fs.existsSync(tempPath) ? fs.readFileSync(tempPath, 'utf-8') : '';
            const questionsExistantes = contenuTemp.split('\n').filter(line => line.startsWith('::')).length;
    
            if (questionsExistantes >= 20) {
                logger.error('Vous ne pouvez pas ajouter plus de 20 questions à l\'examen.');
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
    .command('remove-question', 'Retirer une question de l\'examen en cours de création')
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
    .command('export-exam', 'Exporter l\'examen en cours de création au format .gift')
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
    .command('list-exam', 'Lister toutes les questions de l\'examen en cours de création')
    .action(({ logger }) => {
        try {
            const questionList = collectionExamen.listerQuestionsTemp();
            if (!questionList){
                logger.error('Aucune question dans la liste d\'examen en cours de création.');
                return;
            }
            logger.info('Liste des questions de l\'examen :\n' + questionList);
        } catch (error) {
            logger.error(`Erreur lors de l\'affichage des questions : ${error.message}`);
        }

    })

    // Commande pour chercher une question selon un critères dans la base de données
	.command('recherche', 'Chercher une question selon un critere dans les données')
	.option('--type <type>', 'Les types de question possibles sont :\nshort_answer\nshort_answer_partial_credit\nshort_answer_missing_word\nmultiple_choice\nmultiple_choice_partial_credit\nmultiple_choice_missing_word\nnumeric_intervals\nnumeric_intervals_partial_credit\nnumeric_margin\nnumeric_margin_partial_credit\ncorrespondance\ntrue_false\ndescription\nopen_question', { default: "default" })
    .option('--titre <titre>', 'mot présent dans le titre de la question', { default: "default" })
	.option('--motcle <motcle>', 'mots présents dans le texte', { default: "default" })
	    .action(({ args, options, logger }) => {
        try {
				if(options.type=='default' || options.type=='short_answer' || options.type=='short_answer_partial_credit' || options.type=='short_answer_missing_word' || options.type=='multiple_choice_missing_word'|| options.type=='multiple_choice_partial_credit' || options.type=='multiple_choice' || options.type=='correspondance' || options.type=='description' || options.type=='true_false' || options.type=='numeric_intervals' || options.type=='numeric_intervals_partial_credit' || options.type=='numeric_margin' || options.type=='numeric_margin_partial_credit' || options.type=='open_question'){
					
					let listData = fs.readdirSync('SujetB_data');
					let listQ=[];
					let filepath;
					let questionTrouvee=false;
					for(let i=0; i<listData.length; i++){
						filepath='SujetB_data/'+String(listData[i]);
						listQ= listQ.concat(parseData(filepath));
					}
					if(options.type!="default" && options.titre!="default" && options.motcle!="default"){
						for(let i=0; i<listQ.length; i++){
							if(listQ[i].titre.includes(options.titre) && listQ[i].enonce.includes(options.motcle) && listQ[i].type==options.type){
								questionTrouvee=true;
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
							}
						}
					}else if(options.type=="default" && options.titre!="default" && options.motcle!="default"){
						for(let i=0; i<listQ.length; i++){
							if(listQ[i].titre.includes(options.titre) && listQ[i].enonce.includes(options.motcle)){
								questionTrouvee=true;
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
							}
						}
					}else if(options.type!="default" && options.titre=="default" && options.motcle!="default"){
						for(let i=0; i<listQ.length; i++){
							if(listQ[i].type==options.type && listQ[i].enonce.includes(options.motcle)){
								questionTrouvee=true;
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
							}
						}
					}else if(options.type!="default" && options.titre!="default" && options.motcle=="default"){
						for(let i=0; i<listQ.length; i++){
							if(listQ[i].titre.includes(options.titre) && listQ[i].type==options.type){
								questionTrouvee=true;
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
							}
						}
					}else if(options.type=="default" && options.titre=="default" && options.motcle!="default"){
						for(let i=0; i<listQ.length; i++){
							if(listQ[i].enonce.includes(options.motcle)){
								questionTrouvee=true;
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
							}
						}
					}else if(options.type=="default" && options.titre!="default" && options.motcle=="default"){
						for(let i=0; i<listQ.length; i++){
							if(listQ[i].titre.includes(options.titre)){
								questionTrouvee=true;
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
							}
						}
					}else if(options.type!="default" && options.titre=="default" && options.motcle=="default"){
						for(let i=0; i<listQ.length; i++){
							if(listQ[i].type==options.type){
								questionTrouvee=true;
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
							}
						}
					}else{
						questionTrouvee=true;
						for(let i=0; i<listQ.length; i++){
								console.log('type:'+listQ[i].type+'\n titre:'+listQ[i].titre);
								console.log('\n \n');
						}
					}
					if(questionTrouvee==false){
						console.log('Aucune question correspondant aux critères demandés trouvée');
					}
				}else{
					console.log('Le type de question donné n existe pas. Les types de question possibles sont :\n short_answer \n short_answer_partial_credit \n short_answer_missing_word \n multiple_choice \n multiple_choice_partial_credit \n multiple_choice_missing_word \n numeric_intervals \n numeric_intervals_partial_credit \n numeric_margin \n numeric_margin_partial_credit \n correspondance \n true_false \n description \n open_question');
				}
		} catch (error) {
            logger.error('parsage des fichiers impossible');
        }
    })


    // Commande pour générer un histogramme des types de questions
    .command("generate-histogram", "Générer un histogramme des types de question")
    .argument("<file>", "Chemin du fichier GIFT, exemple : ./examens/test/test.gift")
    .action(({ args, logger }) => {
        const filePath = path.resolve(args.file); // Résolution du chemin du fichier

        // Lire le fichier GIFT
        fs.readFile(filePath, "utf8", (err, content) => {
            if (err) {
                return logger.error(`Erreur de lecture du fichier, ce fichier n'existe pas`);
            }

            try {
                // Analyser le fichier GIFT
                const parser = new GiftParser(false, false);
                parser.parse(content);

                const questionTypesCount = {};

                // Compter les types de questions
                parser.parsedQuestion.forEach((question) => {
                    const type = question.type;
                    if (type) {
                        questionTypesCount[type] = (questionTypesCount[type] || 0) + 1;
                    }
                });

                // Si des types de questions sont trouvés, générer l'histogramme
                if (Object.keys(questionTypesCount).length > 0) {
                    // Créer le dossier "graphiques" s'il n'existe pas
                    const directoryPath = path.join(__dirname, 'graphiques');
                    if (!fs.existsSync(directoryPath)) {
                        fs.mkdirSync(directoryPath, { recursive: true });
                    }

                    // Générer le fichier de l'histogramme
                    const outputFileName = path.join(directoryPath, `histogram_${Date.now()}.svg`);
                    chartStats.createHistogram(questionTypesCount, outputFileName, logger);
                    logger.info(`Histogramme généré avec succès : ${outputFileName}`);
                } else {
                    logger.error("Aucune question valide détectée.");
                }
            } catch (parseErr) {
                logger.error(`Erreur lors du parsing du fichier.`);
            }
        });
    })
	
    // Commande pour faire passer un examen
	.command("examen", "Simuler un examen  à partir d'un fichier donné")
    .argument("<file>", "Chemin du fichier GIFT, exemple : ./examens/test/test.gift")
    .action(({ args, logger }) => {
		try{
			const filepath = path.resolve(args.file); // Résolution du chemin du fichier
			let exam = parseData(filepath);
			
		}catch{
			console.log("Fichier introuvable");
		}
	});


cli.run(process.argv.slice(2));
