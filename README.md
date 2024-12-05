# Projet GL02 : Equipe GTA

## Description

Dans le cadre de l'UE GL02 à l'[UTT](https://www.utt.fr/), nous avons développé un outil en ligne de commande à partir du cahier des charges transmis par l'équipe QuarkStudio.

L'objectif de ce projet est selon le cahier des charges "de fournir aux enseignants un outil de ligne de commande simple et intuitif pour composer des tests à partir de la banque de questions nationale, générer des fichiers VCard pour les informations de contact, et garantir la conformité des examens (nombre défini de questions, absence de doublons). L'outil doit également permettre la simulation d’examens et offrir des options d’analyse des profils de tests."

L'outil livré suit les différentes spécifications présentes dans le cahier des charges afin de satisfaire ce besoin.

## Commentaires sur le cahier des charges

### Spécifications couvertes :

- [x] SPEC1
- [x] SPEC2
- [x] SPEC3
- [x] SPEC4
- [x] SPEC5
- [ ] SPEC6
- [x] SPEC7
- [x] SPEC8

### ABNF :



### Initiatives prises :

Quelques initiatives ont été prise afin d'assurer le bon fonctionnement de l'application.

Tout d'abord concernant le parseur, comme mentionné dans la section ABNF, des types de question manquaient dans le cahier des charges par rapport à la base de données. Nous avons donc dû ajouter des types de question en plus de ceux fournis dans le cahier des charges pour que le parseur puisse fonctionner sans problème.
Une commande permettant de lister les questions d'un examen en cours de création a été ajoutée pour simplifier la visualtion.
Pour finir, la vérification des contraintes liées à la création d'un examen se fait directement via l'ajout de questions et l'exportation de l'examen afin d'éviter la surcharge de commandes inutiles.

## Installation

Placez vous dans le répertoire du projet avec la commande :

```bash
cd
```


Installez les modules requis avec la commande :

```bash
npm install
```

## Utilisation

> [!IMPORTANT]
> Vérifiez que vous vous situez bien dans le répertoire du projet avec la commande :

```bash
pwd
```



### Commandes utiles

> [!TIP]
> Obtenir la liste des commandes et leur utilité
```bash
node Cli.js --help
```




> [!TIP]
> Obtenir de l'aide sur une commande précise
```bash
node Cli.js <commande> --help
```



### Commandes principales

- 1 -  Générer un fichier VCard

Sans options
```bash
node Cli.js vcard <prenom> <nom> <telephone> <email>
```




Avec options
```bash
node Cli.js vcard <prenom> <nom> <telephone> <email> --adresse <adresse> --output <nomFichier> --uri <uri>
```

> [!NOTE]
> Pour plus d'informations notamment concernant les formats des différents champs, référez-vous au Tip "Obtenir de l'aide sur une commande précise".




- 2 - Rechercher une question selon un critère dans les données

Rechercher le type et le titre de chaque question de la base de données
```bash
node Cli.js recherche
```




Rechercher le type et le titre d'une question en fonction d'un critère dans la base de données
```bash
node Cli.js recherche --motcle <mots clés> --titre <titre> --type <type>
```

> [!NOTE]
> Pour plus d'informations notamment concernant les types possibles, référez-vous au Tip "Obtenir de l'aide sur une commande précise".




- 3 - Ajouter une question à l'examen en cours de création

```bash
node Cli.js add-question <nomFichier> <titre>
```

> [!NOTE]
> Pour plus d'informations notamment concernant le nom du fichier, référez-vous au Tip "Obtenir de l'aide sur une commande précise".




- 4 - Retirer une question de l'examen en cours de création

```bash
node Cli.js remove-question <titre>
```

> [!NOTE]
> Pour plus d'informations, référez-vous au Tip "Obtenir de l'aide sur une commande précise".




- 5 - Lister les questions de l'examen en cours de création

```bash
node Cli.js list-exam
```

> [!NOTE]
> Pour plus d'informations, référez-vous au Tip "Obtenir de l'aide sur une commande précise".




- 6 - Exporter un examen en cours de création

```bash
node Cli.js export-exam <nomDossier> <nomFichier>
```

> [!NOTE]
> Pour plus d'informations notamment concernant le nom du fichier, référez-vous au Tip "Obtenir de l'aide sur une commande précise".




- 7 - Générer un histogramme des types de question d'un fichier

```bash
node Cli.js generate-histogram <chemin du fichier>
```

> [!NOTE]
> Pour plus d'informations, référez-vous au Tip "Obtenir de l'aide sur une commande précise".




#### Version : **1.0.0**


## Contributeurs

### Équipe **GTA** (développement) :

- Guillaume Guthier : <guillaume.guthier@utt.fr>
- Antoine Kuntz : <antoine.kuntz@utt.fr>
- Théo Bousmaha--Jouve : <theo.bousmaha__jouve@utt.fr>

### Équipe **QuarkStudio** (commanditaire) :

- Simon Gelbart : <simon.gelbart@utt.fr>
- Romain Goldenchtein : <romain.goldenchtein@utt.fr>
- Julien Schieler : <julien.schieler@utt.fr>

## Licence

Ce projet est sous la licence **MIT**. Pour plus d'informations rendez vous dans le fichier LICENSE