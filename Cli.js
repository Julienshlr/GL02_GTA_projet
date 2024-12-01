const cli = require('@caporal/core').default;
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
cli
    .version('vcard-cli 1.0.0')
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
