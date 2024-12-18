const cli = require('@caporal/core').default;
const fs = require('fs');
const path = require('path');
const GiftParser = require('./parser/giftParser.js');
const CollectionQuestion = require('./composants/CollectionQuestion.js');
const VCardGenerateur = require('./composants/VCardGenerateur.js');
const StatsGenerateur = require('./composants/StatsGenerateur.js');
const prompt = require('prompt-sync')({sigint: true});

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
	.command("sim-exam", "Simuler un examen  à partir d'un fichier donné")
    .argument("<file>", "Chemin du fichier GIFT, exemple : ./examens/test/test.gift")
    .action(({ args, logger }) => {
		try{
			let filePath = path.resolve(args.file); // Résolution du chemin du fichier
			let exam = parseData(filePath);
			let score=0
			for(let i=0; i<exam.length; i++){
				// Nettoyer l'énoncé avant l'affichage
				const enonceNettoye = nettoyerEnonce(exam[i].enonce);
				console.log(enonceNettoye);

				if (exam[i].type=='multiple_choice'){
					console.log('\n Les choix possibles sont: \n'+exam[i].options);
					const a = prompt('Votre réponse: ');
					if(exam[i].reponsesCorrectes[0].includes(a)){
						console.log('bonne réponse');
						score++;
					}else{
						console.log('mauvaise réponse');
					}
					
				}else if (exam[i].type=='short_answer'){
					const a = prompt('Votre réponse: ');
					if(exam[i].reponsesCorrectes[0].includes(a)){
						console.log('bonne réponse');
						score++;
					}else{
						console.log('mauvaise réponse');
					}
				}else if (exam[i].type=='true_false'){
					const a = prompt('TRUE or FALSE(écrit de cette manière): ');
					if(a==exam[i].reponsesCorrectes[0]){
							console.log('bonne réponse');
							score++;
						}else{
							console.log('mauvaise réponse');
						}
						
				}else if (exam[i].type=='description'){	
					console.log('\n');
				}else if (exam[i].type=='open_question'){
					const a = prompt('Votre réponse: ');
					console.log('\n Ce type de question doit être corrigé manuellement. Le point vous est accordé');
					score++;
				}else if (exam[i].type=='short_answer_missing_word'){
					
					if(exam[i].reponsesCorrectes.length>1){
						for(let j=0; j<exam[i].reponsesCorrectes.length; j++){
							const a = prompt('Quel mot(s) doivent être placés à l emplacement de l accolade n°'+(j+1)+' ? : ');
							if(exam[i].reponsesCorrectes[j].includes(a)){
								console.log('bonne réponse');
								score++;
							}else{
								console.log('mauvaise réponse');
							}
						}	
					}else{
						const a = prompt('Quel mot(s) doivent être placés à l emplacement de l accolade ? : ');
						if(exam[i].reponsesCorrectes[0].includes(a)){
							console.log('bonne réponse');
							score++;
						}else{
							console.log('mauvaise réponse');
						}
					}
				}else if (exam[i].type=='multiple_choice_missing_word'){
					if(exam[i].reponsesCorrectes.length>1){
						for(let j=0; j<exam[i].reponsesCorrectes.length; j++){
							console.log('\n Les choix possibles sont: \n'+exam[i].options[j]);
							const a = prompt('Quel mot(s) doivent être placés à l emplacement de l accolade n°'+(j+1)+' ? : ');
							if(exam[i].reponsesCorrectes[j].includes(a)){
								console.log('bonne réponse');
								score++;
							}else{
								console.log('mauvaise réponse');
								
							}
						}	
					}else{
						console.log('\n Les choix possibles sont: \n'+exam[i].options);
						const a = prompt('Quel mot(s) doivent être placés à l emplacement de l accolade ? : ');
						if(exam[i].reponsesCorrectes[0].includes(a)){
							console.log('bonne réponse');
							score++;
						}else{
							console.log('mauvaise réponse');
						}
					}
				}else if (exam[i].type=='numeric_margin'){
					let tolerance=0;
					let q=String(exam[i].reponsesCorrectes[0])
					for(let j=0; j<q.length; j++){
						if(q[j]==':'){
							tolerance=q.slice(j+1);
							q=q.slice(0,j);
							break;
						}
					}
					const a = prompt('Entrez un nombre, la marge d erreur qui vous est accordée est de'+tolerance+': ');
					const inf=Number(q)-Number(tolerance);
					const sup=Number(q)+Number(tolerance);
					if(Number(a)<sup && Number(a)>inf){
						console.log('bonne réponse');
						score++;
					}else{
						console.log('mauvaise réponse');
					}
					
				}else if (exam[i].type=='numeric_intervals'){
					let inf='';
					let sup='';
					let j=0;
					let q=String(exam[i].reponsesCorrectes[0])
					while(q[j]=='.' && q[j+1]=='.'){
						inf=inf+q[j];
					}
					j=j+2;
					while(j<q.length){
						sup=sup+q[j];
					}
					inf=Number(inf);
					sup=Number(sup);
					const a = prompt('Entrez un nombre, une certaine marge d erreur vous est autorisée:');
					if(Number(a)<sup && Number(a)>inf){
						console.log('bonne réponse');
						score++;
					}else{
						console.log('mauvaise réponse');
					}
					

				}else if (exam[i].type=='numeric_margin_partial_credit'){
					let tolerance=0;
					let perfectAnswer=false;
					let repCorrectes=[];
					let pourcentages=[];
					let tolerances = [];
					let data=String(exam[i].reponsesCorrectes[0]);
					let h=0;
					while(h<data.length-1){
						let perfectAnswer=false;
						if(data[h]=='%'){
							h++;
						}else{
							perfectAnswer=true;	
						}
						let pourcentage='';
						let rep='';
						if(perfectAnswer==false){
							while(data[h]!='%'){
								pourcentage=pourcentage+data[h];
								h++;
								
							}
							h++;
						}else{
							pourcentage=100;
						}
						
						const posVal=h;
						while(data[h]!=',' && h!=data.length){
							if(data[h]==':'){
								const posTol=h+1;
								rep=data.slice(posVal,h);
								while(data[h]!=',' && h!=data.length){
									h++;
								}
								tolerance=data.slice(posTol,h);
								break;
							}
							h++;
						}
						h++;
						

						repCorrectes.push(Number(rep));
						pourcentages.push(Number(pourcentage));
						tolerances.push(Number(tolerance));
					}
					const a = prompt('Entrez un nombre, votre note depend de sa precision :');
					for (let h=0; h<repCorrectes.length; h++){
						const inf=repCorrectes[h]-tolerances[h];
						const sup=repCorrectes[h]+tolerances[h];
						if(Number(a)<=sup && Number(a)>=inf){
							console.log('bonne réponse, vous avez '+pourcentages[h]+'% des points');
							score= score+(pourcentages[h]/100) ;
							break;
						}else{
							if(h===(repCorrectes.length)-1){
								console.log('mauvaise réponse');
							}
						}
					}
				}else if (exam[i].type=='numeric_intervals_partial_credit'){
					let perfectAnswer=false;
					let pourcentages=[];
					let sups = [];
					let infs = [];
					let data=String(exam[i].reponsesCorrectes[0]);
					let h=0;
					while(h<data.length-1){
						let perfectAnswer=false;
						if(data[h]=='%'){
							h++;
						}else{
							perfectAnswer=true;	
						}
						let pourcentage='';
						
						if(perfectAnswer==false){
							while(data[h]!='%'){
								pourcentage=pourcentage+data[h];
								h++;
								
							}
							h++;
						}else{
							pourcentage=100;
						}
						let inf='';
						let sup='';
						const posInf=h;
						while(data[h]!=',' && h!=data.length){
							if(data[h]=='.' && data[h+1]=='.'){
								const posSup=h+2;
								inf=data.slice(posInf,h);
								while(data[h]!=',' && h!=data.length){
									h++;
								}
								sup=data.slice(posSup,h);
								break;
							}
							h++;
						}
						h++;
						

						sups.push(Number(sup));
						pourcentages.push(Number(pourcentage));
						infs.push(Number(inf));
					}
					const a = prompt('Entrez un nombre, votre note depend de sa precision :');
					for (let h=0; h<sups.length; h++){
						if(Number(a)<=sups[h] && Number(a)>=infs[h]){
							console.log('bonne réponse, vous avez '+pourcentages[h]+'% des points');
							score= score+(pourcentages[h]/100) ;
							break;
						}else{
							if(h===(sups.length)-1){
								console.log('mauvaise réponse');
							}
						}
					}
				}else if (exam[i].type=='short_answer_partial_credit'){
					let perfectAnswer=false;
					let pourcentages=[];
					let reponses= [];
					let data=String(exam[i].reponsesCorrectes[0]);
					let h=0;
					while(h<data.length-1){
						let perfectAnswer=false;
						if(data[h]=='%'){
							h++;
						}else{
							perfectAnswer=true;	
						}
						let pourcentage='';
						
						if(perfectAnswer==false){
							while(data[h]!='%'){
								pourcentage=pourcentage+data[h];
								h++;
								
							}
							h++;
						}else{
							pourcentage=100;
						}
						const posRep=h;
						while(data[h]!=',' && h!=data.length){
							h++;
						}
						const rep= data.slice(posRep,h);
						h++;
						reponses.push(rep);
						pourcentages.push(Number(pourcentage));
					}
					console.log('Une reponse partiellement correcte vous donnera une partie des points');
					const a = prompt('Votre réponse:');
					for (let h=0; h<reponses.length; h++){
						if(a==reponses[h]){
							console.log('bonne réponse, vous avez '+pourcentages[h]+'% des points');
							score= score+(pourcentages[h]/100) ;
							break;
						}else{
							if(h===(reponses.length)-1){
								console.log('mauvaise réponse');
							}
						}
					}
				}else if (exam[i].type=='multiple_choice_partial_credit'){
					let perfectAnswer=false;
					let pourcentages=[];
					let reponses= [];
					let data=String(exam[i].options[0]);
					let h=0;
					while(h<data.length-1){
						let perfectAnswer=false;
						if(data[h]=='%'){
							h++;
							if (data[h]=='-'){
								h++;
							}
						}else{
							perfectAnswer=true;	
						}
						let pourcentage='';
						
						if(perfectAnswer==false){
							while(data[h]!='%'){
								pourcentage=pourcentage+data[h];
								h++;
								
							}
							h++;
						}else{
							pourcentage=100;
						}
						const posRep=h;
						while(data[h]!=',' && h!=data.length){
							h++;
						}
						const rep= data.slice(posRep,h);
						h++;
						reponses.push(rep);
						pourcentages.push(Number(pourcentage));
					}
					console.log('Une reponse partiellement correcte vous donnera une partie des points');
					console.log('Les reponses possibles sont:'+reponses+'\n');
					const a = prompt('Votre réponse:');
					for (let h=0; h<reponses.length; h++){
						if(a==reponses[h] && pourcentages[h]!=0){
							console.log('bonne réponse, vous avez '+pourcentages[h]+'% des points');
							score= score+(pourcentages[h]/100) ;
							break;
						}else{
							if(h===(reponses.length)-1){
								console.log('mauvaise réponse');
							}
						}
					}
				}else if (exam[i].type === 'correspondance') {
					let options = [];
					let reponses = [];
					let data=String(exam[i].reponsesCorrectes[0]);
					let h=0;
					while(h<data.length-1){
						let optn='';
						let rep='';
						while(data[h]==' '){
							h++;
						}
						const posOptn=h;
						while(data[h]!=',' && h!=data.length){
							if(data[h]=='-' && data[h+1]=='>'){
								optn=data.slice(posOptn,h);
								h++;
								h++;
								while(data[h]==' '){
									h++;
								}
								const posRep=h;
								
								while(data[h]!=',' && h!=data.length){
									h++;
								}
								rep=data.slice(posRep,h);
								break;
							}
							h++;
						}
						h++;
						reponses.push(rep);
						options.push(optn);
					}
					for (let h=0; h<reponses.length; h++){
						console.log(options[h]);
						const a = prompt('Votre réponse:');
						if(a==reponses[h]){
							console.log('bonne réponse');
							score++ ;
						}else{
							console.log('mauvaise réponse');
						}
					}
					
                
                }
				
			}
			logger.info('L\'examen est terminé, vous avez obtenu une note de '+score);
		}catch{
			logger.error("ERREUR. Peut être que le fichier demandé n'existe pas");
		}
	});

	function nettoyerEnonce(enonce) {
		// Supprimer les balises HTML
		enonce = enonce.replace(/<[^>]*>/g, '');
		// Remplacer les accolades par des caractères soulignés
		enonce = enonce.replace(/[\{\}]/g, '_');
		// Supprimer les espaces inutiles
		return enonce.trim();
	}
	


cli.run(process.argv.slice(2));
