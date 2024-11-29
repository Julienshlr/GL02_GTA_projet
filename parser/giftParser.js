

let Question = require('../Question.js');
let CollectionQuestion = require('../CollectionQuestion.js');

// giftParser

let GiftParser = function(sTokenize, sParsedSymb){
    // The list of GIFT parsed from the input file.
    this.parsedQuestion = [];
	// this.symb = ['//', '::', '{', '}', '[', ']', '=', '~', '#', ' '];
	this.showTokenize = sTokenize;
	this.showParsedSymbols = sParsedSymb;
	this.errorCount = 0;
}

// Parser procedure

// tokenize : tranform the data input into a list
// <eol> = CRLF
GiftParser.prototype.tokenize = function(data){

	while (!this.check2Char('//', data) && !this.check2Char('::', data) && data.length > 0){
		this.next(data);
		data = this.reduce(data);
	}

	let tData = [];
	while (data.length > 0){

		let element_tab = [];
		let element = '';
		//titre
		if (this.check2Char('::', data)){
			element_tab.push(this.next(data));
			data = this.reduce(data);
			element_tab.push(this.next(data));
			data = this.reduce(data);

			while (!this.check2Char('::', data)){
				element_tab.push(this.next(data));
				data = this.reduce(data);
			}

			element_tab.push(this.next(data));
			data = this.reduce(data);
			element_tab.push(this.next(data));
			data = this.reduce(data);
			//le reste de la question
			while (!this.check2Char('//', data) && !this.check2Char('::', data) && data.length > 0){
				element_tab.push(this.next(data));
				data = this.reduce(data);
			}

		}else if (this.check2Char('//', data)){//commentaire 
			element_tab.push(this.next(data));
			data = this.reduce(data);
			element_tab.push(this.next(data));
			data = this.reduce(data);
			while (!this.check2Char('//', data) && !this.check2Char('::', data) && data.length > 0){
				element_tab.push(this.next(data));
				data = this.reduce(data);
			}
		}
		element = element_tab.join('');
		
		tData.push(element);
	}

	return tData;

}

// parse : analyze data by calling the first non terminal rule of the grammar
GiftParser.prototype.parse = function(data){
	let tData = this.tokenize(data);
	if(this.showTokenize){
		console.log(tData);
	}
	this.listGift(tData);
}

// Parser operand

GiftParser.prototype.errMsg = function(msg, input){
	this.errorCount++;
	console.log("Parsing Error ! on "+input+" -- msg : "+msg);
}


// Donne le premier element de l'input
GiftParser.prototype.next = function(input){

	let curS = input[0];
	if(this.showParsedSymbols){
		console.log(curS);
	}
	return curS;

	/*
	let curS = input.shift();
	if(this.showParsedSymbols){
		console.log(curS);
	}
	return curS
	*/
}

// supprime le premier caractere de l'input 
GiftParser.prototype.reduce = function(input){
	return input.substring(1);
}


// check : check whether the arg elt is on the head of the list
GiftParser.prototype.check = function(s, input){
	if(input[0] == s){
		return true;	
	}
	return false;
}

// Check pour deux caracteres de suite
GiftParser.prototype.check2Char = function(s, input){
	if (input.substring(0, 2) == s){
		return true;
	}
	return false;
}

// Remove spaces, \r, \n at the end of the string
GiftParser.prototype.removeSpaces = function(input){
	for (let i = input.length - 1; i >= 0; i--){
		if (input[i] == ' ' || input[i] == '\n' || input[i] == '\r'){
			input = input.substring(0, i);
		}else{
			break;
		}
	}
	return input;
}

// Parser rules

// <liste_gift> = *(<gift>)
GiftParser.prototype.listGift = function(input){
	for (let i = 0; i < input.length; i++){
		this.gift(input[i]);
	}
}

// <gift> = "::" <question_title> "::" <text> "{" <answers> "}" <text> / "//" <comment>
GiftParser.prototype.gift = function(input){

	if(this.check2Char("::", input)){
		// titre
		input = this.reduce(input);
		input = this.reduce(input);
		let output = this.title(input);
		let title = output.ttl;
		input = output.in;


		// Texte / reponses
		let type_question = null;
		let ca = [];
		let choices = [];

		let question_text = '';

		while (input.length > 0){
			if (this.check('{', input)){//reponses
				input = this.reduce(input);
				let answers = this.answers(input);
				input = answers.in;
				type_question = answers.tq;
				ca.push(answers.ca);
				choices.push(answers.choices);
			}
			if ( input.length > 0){//texte
				output = this.text(input);
				question_text = question_text + output.t;
				input = output.in;
			}
		}

		question_text = this.removeSpaces(question_text);

		let q = new Question(null, title, question_text, type_question, ca, ia);
		if (title == ''){
			this.errMsg('Missing title', q);
		}
		this.parsedQuestion.push(q);
		//Question.questionBank.push(q);

		return true;
	}else{
		this.errMsg('Invalid format', input);
		return false;
	}

}

// <title> = <title> '::'
GiftParser.prototype.title = function(input){
	let title_tab = [];
	while (!this.check2Char('::', input)){
		title_tab.push(this.next(input));
		input = this.reduce(input);
	}
	input = this.reduce(input);
	input = this.reduce(input);
	let title = title_tab.join('');
	return {in: input, ttl: title};
}


// <text>
GiftParser.prototype.text = function(input){
	let text_tab = [];
	while (!this.check('{', input) && input.length > 0){
		text_tab.push(this.next(input));
		input = this.reduce(input);
	}
	let text = text_tab.join('');
	return {in: input, t: text};
}


GiftParser.prototype.answers = function(input){

	while (input[0] == ' ' || input[0] == '\n' || input[0] == '\r'){
		input = this.reduce(input);
	}

	// question ouverte
	if (this.check('}', input)){
		input = this.reduce(input);
		Question.nbOpenQuestion++;
		return { tq: "open_question", ca: [], choices: [], in: input};
	}

	let correct_answers = [];
	let choices = [];
	let type_question;
	// plages numériques, reponse : tolerance et inf .. sup sont stockés tel quels dans l'objet 
	if (this.check('#', input)){
		input = this.reduce(input);
		while (!this.check('}', input)){
			let numeric_answer_tab = [];
			let numeric_answer = '';
			
			while (!this.check('}', input)){
					numeric_answer.push(this.next(input));
					input = this.reduce(input);
					if (this.check(':', input)){
						type_question="numeric"
					}
					if (this.check2Char('..', input)){
						type_question="numeric_intervals"
					}
						
			}
			numeric_answer = numeric_answer_tab.join('');
			numeric_answer = this.removeSpaces(numeric_answer);
			correct_answers.push(numeric_answer);

			}
		}
		input = this.reduce(input);
		Question.nbNumeric++;
		return {tq: type_question, ca: correct_answers, choices: choices, in: input};
	}

	// Vrai Faux
	if (this.check2Char('T}', input) || this.check2Char('F}', input)){
		if (this.check('T', input)){
			correct_answers.push('T');
		}else if (this.check('F', input)){
			correct_answers.push('F');
		}
		input = this.reduce(input);
		input = this.reduce(input);
		Question.nbTrueFalse++;
		return {tq: "true_false", ca: correct_answers, choices: choices, in: input};
	}

	// Choix multiples (commentaires inclus dans la string reponse, à trier plus tard si necessaire),créddit partiel, texte à trous et correspondances
	while (!this.check('}', input)){
		let answer_tab = [];
		let answer = '';
		if (this.check('=', input)){
			input = this.reduce(input);
			if (!this.check('%', input)){
				type_question="partial_credit"; //crédit partiel avec pourcentage (commentaire et pourcentage inclus dans reponse)
			while (!this.check('=', input) && !this.check('~', input)&& !this.check('}', input)){
				answer_tab.push(this.next(input));
				input = this.reduce(input);
				if(this.check(':', input)){
					type_question="partial_credit"; // crédit partiel avec tolerance (commentaire et tolerance inclus dans reponse)
				}
			}
			answer = answer_tab.join('');
			answer = this.removeSpaces(answer);
			correct_answers.push(answer);
			
		}else if (this.check('~', input)){
			input = this.reduce(input);
			while (!this.check('=', input) && !this.check('~', input) && !this.check('}', input)){
				answer_tab.push(this.next(input));
				input = this.reduce(input);
			}
			answer = answer_tab.join('');
			answer = this.removeSpaces(answer);
			choices.push(answer);
		}else{
			while (!this.check('=', input) && !this.check('~', input) && !this.check('}', input)){
				input = this.reduce(input);
			}
		}

	}
	let type_question; 
	if (choices.length > 0 || type_question=="partial_credit" {
		if (input.length > 0){
			let test = true;
			for (let i = 0; i < input.length; i++){
				if (input[i] != ' ' && input[i] != '\n' && input[i] != '\r'){
					test = false;
				}
			}
			if (test){	
				type_question = "choix_multiples";
				Question.nbMulipleChoice++;
			}else{
				type_question = "texte_à_trous";
				Question.nbMissingWord++;
			}
		}
	} else {
		type_question = "correspondance";//questions de correspondance
		Question.nbMatching++;
		
	}
	

	return {tq: type_question, ca: correct_answers, choices: choices, in: input};
}


module.exports = GiftParser;