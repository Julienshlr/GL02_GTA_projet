const cli = require('@caporal/core').default;
const VCardGenerateur = require('./VCardGenerateur.js');

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

cli.run(process.argv.slice(2));
