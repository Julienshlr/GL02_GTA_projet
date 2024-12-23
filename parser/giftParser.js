let Question = require('../composants/Question.js');

// giftParser

let GiftParser = function(sTokenize, sParsedSymb){
    // The list of GIFT parsed from the input file.
    this.parsedQuestion = [];
    this.showTokenize = sTokenize;
    this.showParsedSymbols = sParsedSymb;
    this.errorCount = 0;
}

// Parser procedure

// tokenize : transform the data input into a list
GiftParser.prototype.tokenize = function(data){

    while (!this.check2Char('//', data) && !this.check2Char('::', data) && data.length > 0){
        this.next(data);
        data = this.reduce(data);
    }

    let tData = [];
    while (data.length > 0){

        let element_tab = [];
        let element = '';
        // titre
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
            // le reste de la question
            while (!this.check2Char('::', data) && data.length > 0){
				if(this.check2Char('//', data)){
					while(!this.check('\n', data) && !this.check('\r', data)){
						data=this.reduce(data);
					}
				}
                element_tab.push(this.next(data));
                data = this.reduce(data);
            }

        }else if (this.check2Char('//', data)){// commentaires avant le 1er titre
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
    //console.log("Parsing Error ! on "+input+" -- msg : "+msg);
}

// Donne le premier élément de l'input
GiftParser.prototype.next = function(input){

    let curS = input[0];
    if(this.showParsedSymbols){
        console.log(curS);
    }
    return curS;
}

// supprime le premier caractère de l'input
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

// Check pour deux caractères de suite
GiftParser.prototype.check2Char = function(s, input){
    if (input && input.substring(0, 2) == s){  // Vérification si `input` est défini et contient les deux premiers caractères
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

        // Texte / réponses
        let type_question = 'description';
        let ca = [];
        let choices = [];

        let question_text = '';

        while (input.length > 0){
            if (this.check('{', input)){ // réponses
                input = this.reduce(input);
                let answers = this.answers(input);
                input = answers.in;
                type_question = answers.tq;
                ca.push(answers.ca);
				choices.push(answers.choices);
            }
            if (input.length > 0){ // texte
                output = this.text(input);
                question_text = question_text + output.t;
                input = output.in;
            }
        }

        question_text = this.removeSpaces(question_text);

        let q = new Question(title, type_question, question_text, choices, ca);
        if (title == ''){
            this.errMsg('Missing title', q);
        }
        this.parsedQuestion.push(q);

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
	while (input[0] == ' ' || input[0] == '\n' || input[0] == '\r'){
        input = this.reduce(input);
    }
    while (!this.check('{', input) && input.length > 0){
        text_tab.push(this.next(input));
        input = this.reduce(input);
    }
    let text = text_tab.join('');
    return {in: input, t: text};
}

GiftParser.prototype.deleteFeedback = function(input){ //suppression des commentaires des questions pour facilité de manipulation
	if(this.check('#', input)){
		while(!this.check('=',this.reduce(input)) && !this.check('~',this.reduce(input)) && !this.check('}',this.reduce(input))){
			input=this.reduce(input);
		}
	}
	return input;
}


GiftParser.prototype.answers = function(input){

    while (input[0] == ' ' || input[0] == '\n' || input[0] == '\r'){
        input = this.reduce(input);
    }

    // question ouverte
    if (this.check('}', input)){
		input=this.deleteFeedback(input);
        input = this.reduce(input);
        return { tq: "open_question", ca: [], choices: [], in: input};
    }

    let correct_answers = [];
    let choices = [];
    let type_question='';  // Déclaration ici, une seule fois au début de la fonction.
    
    // plages numériques, réponse : tolérance et inf .. sup sont stockés tels quels dans l'objet 
	//prendres plusieurs options en compte
    if (this.check('#', input)){
		let numeric_answer_tab = [];
		let numeric_answer = '';
        input = this.reduce(input);
            while (input[0] == ' ' || input[0] == '\n' || input[0] == '\r'){
				input = this.reduce(input);
			}
			if (this.check('=', input)){
				input = this.reduce(input);
				type_question = "numeric_partial_credit";
		    }
            while (!this.check('}', input)){
				let numeric_answer_tab = [];
				let numeric_answer = '';
				if (this.check('=', input)){
					input = this.reduce(input);
				}
				while (!this.check('=', input) && !this.check('}', input)){
					input=this.deleteFeedback(input);
					numeric_answer_tab.push(this.next(input));
					input = this.reduce(input);
					if (this.check(':', input)){
						if( type_question== "numeric_partial_credit"){
							type_question = "numeric_margin_partial_credit";
						}else if(type_question== ''){
							type_question = "numeric_margin";
						}
					}
					if (this.check2Char('..', input)){
						if( type_question=='numeric_partial_credit'){
							type_question = "numeric_intervals_partial_credit";
						}else if(type_question== ''){
							type_question = "numeric_intervals";
						}
					}
				}
				numeric_answer = numeric_answer_tab.join('');
				numeric_answer = this.removeSpaces(numeric_answer);
				correct_answers.push(numeric_answer);
				
            
            }
       
            return {tq: type_question, ca: correct_answers, choices: choices, in: input};
    }

    // Vrai / Faux
    if (this.check2Char('T}', input) || this.check2Char('F}', input)){
        if (this.check('T', input)){
            correct_answers.push('TRUE');
        } else if (this.check('F', input)){
            correct_answers.push('FALSE');
        }
        input = this.reduce(input);
		input=this.deleteFeedback(input);
        input = this.reduce(input);
        return {tq: "true_false", ca: correct_answers, choices: choices, in: input};
    }
	if (input.startsWith('TRUE')){
		for (let i = 0; i < 4; i++){
			input = this.reduce(input);
		}
		input=this.deleteFeedback(input);
		correct_answers.push('TRUE');
		input = this.reduce(input);
		return {tq: "true_false", ca: correct_answers, choices: choices, in: input};
	}
	if (input.startsWith('FALSE')){
		for (let i = 0; i < 5; i++){
			input = this.reduce(input);
		}
		input=this.deleteFeedback(input);
		correct_answers.push('FALSE');
		input = this.reduce(input);
		return {tq: "true_false", ca: correct_answers, choices: choices, in: input};
	}


	

    // Autres types de questions
	while (!this.check('=', input) && !this.check('~', input)){
		input = this.reduce(input);
	}
    while (!this.check('}', input)){
        let answer_tab = [];
        let answer = '';
        if (this.check('=', input) || this.check2Char('~=', input) ){ //~= n'est pas correct mais est présent dans les fichiers
            if(this.check2Char('~=', input)){
				input = this.reduce(input);
				input = this.reduce(input);
			}else{
				input = this.reduce(input);
			}
            if (this.check('%', input)){
                type_question = "short_answer_partial_credit"; // crédit partiel avec pourcentage sans choix(commentaire et pourcentage inclus dans réponse)
			}
            while (!this.check('=', input) && !this.check('~', input) && !this.check('}', input)){
				input=this.deleteFeedback(input);
                answer_tab.push(this.next(input));
                input = this.reduce(input);
                if(this.check(':', input)){
                    type_question = "short_answer_partial_credit"; // crédit partiel avec tolérance sans choix(commentaire et tolérance inclus dans réponse)
                }
	     		if(this.check2Char('->', input)){
					type_question = "correspondance"; // correspondance
                }
            }
                answer = answer_tab.join('');
                answer = this.removeSpaces(answer);
                correct_answers.push(answer);
				
            } else if (this.check('~', input)){
                input = this.reduce(input);
				if (this.check('%', input)){
					type_question = "multiple_choice_partial_credit"; // crédit partiel avec pourcentage à choix multiple(commentaire et pourcentage inclus dans réponse)
			    }
                while (!this.check('=', input) && !this.check('~', input) && !this.check('}', input)){
					input=this.deleteFeedback(input);
                    answer_tab.push(this.next(input));
                    input = this.reduce(input);
					if(this.check(':', input)){
                        type_question = "multiple_choice_partial_credit"; // crédit partiel avec tolérance (commentaire et tolérance inclus dans réponse)
                    }
                }
                answer = answer_tab.join('');
                answer = this.removeSpaces(answer);
                choices.push(answer);
            }
        }
    

    if (choices.length > 0 ) {
		for (let i = 0; i < correct_answers.length; i++){// si choix existent, mise des bonnes reponses dans les choix
			choices.push(correct_answers[i]);
		}
        if (input.length > 0){
			let test = true;
			let test_input= input;
            for (let i = 0; i < test_input.length; i++){
				test_input=this.reduce(test_input);
                if (!this.check('\r', test_input) && !this.check('\n', test_input) && !this.check(' ', test_input)){
                    test = false;
                }
				
            }
            if (test){  
				if(type_question!='multiple_choice_partial_credit'){ //choix multiples classiques
					type_question = "multiple_choice";
				}
            } else {
                type_question = "multiple_choice_missing_word";
            }
        }else{
				if(type_question!='multiple_choice_partial_credit'){ //choix multiples classiques
					type_question = "multiple_choice";
				}
		}
    } else if(type_question==''){
        if (input.length > 0){
            let test = true;
			let test_input= input;
            for (let i = 0; i < test_input.length; i++){
				test_input=this.reduce(test_input);
                if (!this.check('\r', test_input) && !this.check('\n', test_input) && !this.check(' ', test_input)){
                    test = false;
                }
				
            }
            if (test){  
				if(type_question!='short_answer_partial_credit'){ 
					type_question = "short_answer"; //questions classiques à une reponse
				}
            } else {
                type_question = "short_answer_missing_word";
            }
        } else{
			if(type_question!='short_answer_partial_credit'){ 
					type_question = "short_answer"; //questions classiques à une reponse
				}
		}
			
    }

    return {tq: type_question, ca: correct_answers, choices: choices, in: input};
}


module.exports = GiftParser;
