// Monarch syntax highlighting for the model-modeling-language language.
export default {
    keywords: [
        '@opposite','abstract','as','attribute','bool','class','derived','double','enum','extends','false','float','for','function','id','implements','import','in','instance','int','interface','macro','ordered','package','readonly','reference','resolve','return','returns','string','transient','true','tuple','unique','unsettable','using','volatile'
    ],
    operators: [
        '%','*','+',',','-','->','.','..','/',':',';','=','^'
    ],
    symbols:  /%|\(|\)|\*|\+|,|-|->|\.|\.\.|/|:|;|=|\[|\]|\^|\{|\}/,

    tokenizer: {
        initial: [
            { regex: /-?\d+\.\d+/, action: {"token":"number"} },
            { regex: /-?\d+/, action: {"token":"number"} },
            { regex: /"[^"]*"/, action: {"token":"string"} },
            { regex: /[a-zA-Z_][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"string"} }} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /\s+/, action: {"token":"white"} },
            { regex: /\/\*/, action: {"token":"comment","next":"@comment"} },
            { regex: /[^:]\/\/[^\n\r]*/, action: {"token":"comment"} },
        ],
        comment: [
            { regex: /[^\/\*]+/, action: {"token":"comment"} },
            { regex: /\*\//, action: {"token":"comment","next":"@pop"} },
            { regex: /[\/\*]/, action: {"token":"comment"} },
        ],
    }
};
