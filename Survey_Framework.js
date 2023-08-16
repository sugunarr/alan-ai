// {Name: Survey_Framework}
// {Description: Scripted Framework for Surveys}

title(`Customer Survey`);

// Types of questions
// 1 to 10
// Multiple Choice

let discreteSentiments = [[`very unlikely`, `super unlikely`, `extremely unlikely`, `massively unlikely`],
                          [`unlikely`, `poor chance`, `not likely`], 
                          [`neutral`,`ambivalent`,`maybe`,`don't know`, `not sure`], 
                          [`very likely`,`super likely`, `extremely likely`, `massively likely`], 
                          [`likely`, `probably`, `it's good`, `most likely`, `pretty likely`, `somewhat likely`]];




const extras=`|not Satisfied ~very unlikely|Satisfied~likely|very Satisfied~very likely|not at all~very unlikely|no chance~very unlikely|not a chance~very unlikely|zero chance~very unlikely|zero~very unlikely|okay~neutral`
let dsi = _.flatten(_.map(discreteSentiments, s => _.map(s, e => `${e}~${s[0]}`))).join('|') + extras


const cmdPage = {embeddedPage: true, page: "survey.html"}

let likelihoodQuestion = context(() => {
    follow(`(It's|I find it|It is|I am|I feel|I think|) $(T~${dsi}) (because|since|as|) $(I* (.*)) `, p => {
        if (p.I.length) {
            p.resolve({cmd: 'ok', res: {answer: `<b>${p.T.label}</b> - <i>${p.I}</i>`, label:p.T.label},type:"likelihood"});
        } else {   
            p.resolve({cmd: 'ok', res: {answer: `<b>${p.T}</b>`,label:p.T.label},type:"likelihood"});
        }
    });
    follow(`(It's|I find it|It is|I am|I feel|I think|) $(T~${dsi})`, p => {
        p.resolve({cmd: 'ok', res: {answer: `<b>${p.T.label}</b>`}});
    });
    navigation("likelihood");
    let hint = _.map(discreteSentiments, s=>s[0]).join(', ');
    fallback(`(Sorry, didn't recognize that.|) (To rate your experience,|) just say any of the following (descriptors|). ${hint}.`)
});

let openEndQuestion = context(() => {
    follow(`(I think|It is|I feel|It's|I am|) $(I* (.+))`, p => {
        p.resolve({cmd: 'ok', res: {answer: p.I.value},type:"openEnd"});
    });
    navigation("openEnd");
});
let oneToTenQuestion = context(() => {
    follow(`(I would rate it|Rating|it's|) $(NUMBER) (because|since|as|) $(I* (.*))`,`$(I* (.*))`, p => {
        if((p.NUMBER && (p.NUMBER.number < 1 || p.NUMBER.number > 10)) ||(!p.NUMBER)&& p.I.value ) {
            p.play(`(Sorry|Try again), your rating must be (a number|) between one and ten.`,
                   `you need to pick a number between one and ten for rating`,
                   `your answer has to be a number between one and ten`,
                   `change your answer to a number between one and ten`,
                   `(To rate your experience,|) (Please say a number between 1 and 10)`);
        } else {
            p.resolve({cmd: 'ok', res: {number: p.NUMBER.number, answer: `Rating <b>${p.NUMBER}</b> and feedback <i>"${p.I}"</i>`, feedback: p.I.value},type:"oneToTen"});
        }
    });
    follow(`(I would rate it|Rating|it's|) $(NUMBER)`, p => {
        if((p.NUMBER && (p.NUMBER.number < 1 || p.NUMBER.number > 10)) ||(!p.NUMBER)&& p.I.value) {
            p.play(`(Sorry|Try again), your rating must be (a number|) between one and ten.`,
                   `you need to pick a number between one and ten for rating`,
                   `your answer has to be a number between one and ten`,
                   `change your answer to a number between one and ten`,
                   `(To rate your experience,|) (Please say a number between 1 and 10)`);
        } else {
            p.resolve({cmd: 'ok', res: {answer: `Rating <b>${p.NUMBER}</b>`, rating: p.NUMBER.number},type:"oneToTen"});
        }
    });
    fallback(`(Sorry|Try again), your rating must be (a number|) between one and ten.`,
             `you need to pick a number between one and ten for rating`,
             `your answer has to be a number between one and ten`,
             `change your answer to a number between one and ten`,
             `(To rate your experience,|) (Please say a number between 1 and 10)`)
    navigation("oneToTen");
});

let durationQuestion = context(() => {    
    follow(`$(NUMBER) $(T year|day|month|week|years|days|months|weeks)`,`$(I* (.*))`, p => {
        if(p.I && p.I.value) {
            p.play(`(please Try again|Try again|sorry|), your answer should have a duration format, like one month or two weeks.`);
        }else{
            p.resolve({cmd: 'ok', res: {answer: `${p.NUMBER} ${p.T}`},type:"duration"});  
        }
    });
    follow(`$(A couple|few|many|barely|a long time|not so long|several) (of|any|) $(T year|day|month|week|years|days|months|weeks|)`, p => {

        p.resolve({cmd: 'ok', res: {answer: `${p.A} ${p.T}`},type:"duration"});

    });
    navigation("duration");
});
    function findGoodResponse(p,res){
        if(res === "very unlikely" || res === 0 || res === 2 || res === 3){
           p.play("I am so sorry to hear that","this is disappointing to hear","I hope you give us another change")
        }else if(res === "unlikely" || res === 4 || res === 5 || res === 6){
           p.play("we are going to improve","we will try to make it better","I hope we change your mind in future try")
        }else if(res === "neutral" || res === 7 || res === 8 ){
           p.play("(appreciate your|thank you for your) (response|feedback)","your feedback helps us to improve","your feedback is valuable to us")
        }else if(res === "likely" ||  res === 9 ){
           p.play("thanks for your (feedback|answer)","we Appreciate your feedback","your feedback is valuable to us")
        }else if(res === "very likely" || res === 10 ){
           p.play("I am glad to hear this","this is great, thanks for your feedback","positive feedback is appreciated","we will try to maintain your pisitive feedback")
        }
        
    }
    function navigation(type) {
        follow("(please|) (repeat|start over|again) (the question|)", p => {
            p.play(p.state.q);
        });
        follow("(Stop|Exit|End|Never Mind|Leave|Terminate|Quit) (survey|)", p => p.resolve({cmd: 'exit'}));
        follow("(Please|) (go to|open|return to|) (the|) (previous|previous question|before|go back|back)", p => p.resolve({cmd: 'back'})); 
        follow("(Please|) (go forward|skip|skip question|skip this question|next|next question|pass|I don't know)", p => p.resolve({cmd: 'skip'}));
        follow("(go to|open|return to|) (the|) $(ORDINAL) (question|item)", p=> p.resolve({cmd: 'goto', res: p.ORDINAL.number}));
        follow("(go to|open|return to|) (question|item) $(NUMBER)", 
               p=>{
            if(p.NUMBER.number === 0){
                p.play('questions range is from one to ten, please pick in this range.')
            }else{
                p.resolve({cmd: 'goto', res: p.NUMBER.number}) 
            }
        });
        follow("(go to|open|return to|) (the|) last (question|item)", p=> p.resolve({cmd: 'goto', res: -1}));
        follow("How many questions are in (this|the|) survey", p=> p.resolve({cmd: 'numQ'}));
        follow("How many questions are left (in this survey|in the survey|)", p=> p.resolve({cmd: 'numQleft'}));
    }

    project.questions = [
        {q: 'How likely are you to purchase our company\'s products again?',
         t: likelihoodQuestion,
         h: '<ul><li>Very likely</li> <li>Likely</li> <li>Neutral</li> <li>Unlikely</li> <li>Very unlikely</li></ul>'},    
        {q:'Overall, how satisfied are you with our product and why?', 
         t: openEndQuestion,
         h: 'I am very satisfied with the product because it helps me a lot'},
        {q: 'How well do our products meet your needs as a consumer?', 
         t: openEndQuestion,
         h: 'The products often help me in daily activities and match my needs in every way'},
        {q: 'How would you rate the quality of the product from 1 to 10, and why?',
         t: oneToTenQuestion,
         h: '9 because it is a great product, but has room for improvement'},
        {q: 'How would you rate the pricing of our product? from 1 to 10, and why?', 
         t: oneToTenQuestion,
         h: '<ul><li>7, as the product is very expensive.</li> <li>4, the product is much less useful than anticipated</li></ul>'},
        {q: 'How long have you been a customer for our company?', 
         t: durationQuestion,
         h: '<ul><li>One week.</li><li>Two months.</li><li>Four months</li>'},
    ];

    intent(`(Show me|) what can I do here?`, `How does this app work?`, p => {
        p.play(`In this survey, we ask a series of questions about your satisfaction as a consumer. 
            To begin, say Start Survey.`);
    });

    intent(`(Start|Commence|Begin|Take|) (survey|)`, async p => {
        p.play({embeddedPage:true, page: "survey.html", cmd: 'reset'});
        p.play({embeddedPage: true, page: "survey.html", cmd: 'endMessage', display: false});
        p.play(`Starting the customer survey`);
        let index = 0;
        // p.play({embeddedPage:true, page: "survey.html", command: "comment", comment: `Q${p.index + 1}: ${p.I}`});
        //p.play({embeddedPage:true, page: "survey.html"}); 
        while(index < project.questions.length) {
            let q = project.questions[index];
            p.play({embeddedPage:true, page: "survey.html", cmd: 'showQuestion', questionIndex: index, question: q.q, hints: q.h});
            p.play(q.q);
            let {cmd, res,type} = await p.then(q.t, {state: {q: q.q}});
            if (cmd === 'back') {
                if (index > 0) {
                    p.play(`(Going|Returning) to previous question.`);
                    index -= 1;
                    continue;
                } else {    
                    p.play(`You are on the first question of the survey.`);
                    continue;
                }            
            } else if (cmd == 'goto') {
                if(res == -1){
                    p.play(`(ok|) going to last question`);
                    index = project.questions.length -1;
                    continue;
                }
                if(res < project.questions.length){
                    p.play(`(ok|) going to question ${res} `);
                    index = res -1;
                    continue;                
                }else{
                    p.play(`No such questions exists`);
                    continue;
                }
            } else if (cmd == 'skip') {
                if (index < project.questions.length - 1) {
                    p.play({embeddedPage:true, page: "survey.html", cmd: 'skip', questionIndex: index});
                    p.play(`(Skipping|Next|New) question`);
                    index++;
                    continue;
                } else {
                    p.play(`there are no more questions`);
                    break;
                }
            } else if (cmd == 'exit') {
                p.play({embeddedPage:true, page: "survey.html", cmd: 'reset'});
                p.play("Exiting the survey.")
                return;
            } else if (cmd == 'numQ') {
                p.play(`There are ${project.questions.length} questions in this survey`);
            } else if (cmd == 'numQleft') {
                p.play(`There are ${project.questions.length - index -1} questions left`);
            } else {
                p.play({embeddedPage:true, page: "survey.html", cmd: 'showAnswer', questionIndex: index, answer: res.answer});
                if(type==="likelihood"){ 
                    findGoodResponse(p,res.label)
                }else if(type==="oneToTen"){
                    findGoodResponse(p,res.number)
                }else{
                    findGoodResponse(p,7) 
                }

            }
            index++;
        }
        p.play({embeddedPage: true, page: "survey.html", cmd: 'endMessage', display: true, index: -1});
        p.play('Survey is complete! Thanks for submitting.');

    });

    intent(`Thanks Alan`,
           reply(`You're welcome`));

    projectAPI.greet = (p, param, callback) => {
        p.play("Hi, welcome to the Customer Voice Survey. To (get started|), say '(Begin|Start|Take) Survey'.");
    };
