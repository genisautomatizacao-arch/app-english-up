// =====================================================
// LESSONS DATA — English Learning App
// Every English word/phrase MUST have a 'pronunciation'
// field written as PT-BR phonetics.
// =====================================================

const LESSONS = [

  // ─────────────────────────────
  // MODULE 1: SAUDAÇÕES (3 lições)
  // ─────────────────────────────

  {
    id: 1, module: 1, title: "Olá e Tchau", icon: "👋", xpReward: 20,
    exercises: [
      {
        type: "multiple_choice",
        prompt: "Como se diz 'Olá' em inglês?",
        word: "Hello",
        pronunciation: "Rélou",
        options: [
          { text: "Hello",   pronunciation: "Rélou",  correct: true  },
          { text: "Goodbye", pronunciation: "Gudbái", correct: false },
          { text: "Please",  pronunciation: "Plíiz",  correct: false },
          { text: "Sorry",   pronunciation: "Sôri",   correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "O que significa 'Goodbye'?",
        word: "Goodbye",
        pronunciation: "Gudbái",
        options: [
          { text: "Até logo",   pronunciation: "", correct: true  },
          { text: "Por favor",  pronunciation: "", correct: false },
          { text: "Obrigado",   pronunciation: "", correct: false },
          { text: "Com licença",pronunciation: "", correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "Como se diz 'Boa noite' em inglês?",
        word: "Good night",
        pronunciation: "Guid náit",
        options: [
          { text: "Good night",   pronunciation: "Guid náit",   correct: true  },
          { text: "Good morning", pronunciation: "Guid mórnin", correct: false },
          { text: "Good afternoon", pronunciation: "Guid afturnúun", correct: false },
          { text: "Good luck",    pronunciation: "Guid lâk",    correct: false }
        ]
      },
      {
        type: "fill_blank",
        prompt: "Complete a frase:",
        sentence: "___ morning!",
        sentence_pronunciation: "___ mórnin!",
        translation: "___ manhã! (Bom dia!)",
        options: [
          { text: "Good", pronunciation: "Guid", correct: true  },
          { text: "Nice", pronunciation: "Náis", correct: false },
          { text: "Fine", pronunciation: "Fáin", correct: false }
        ]
      },
      {
        type: "word_order",
        prompt: "Monte a frase em inglês:",
        translation: "Olá, meu nome é Ana!",
        words: [
          { text: "Hello",  pronunciation: "Rélou" },
          { text: ",",      pronunciation: "" },
          { text: "my",     pronunciation: "Mái" },
          { text: "name",   pronunciation: "Néim" },
          { text: "is",     pronunciation: "Iz" },
          { text: "Ana",   pronunciation: "Êna" },
          { text: "!",      pronunciation: "" }
        ],
        correct_order: [0, 1, 2, 3, 4, 5, 6]
      }
    ]
  },

  {
    id: 2, module: 1, title: "Como Você Está?", icon: "😊", xpReward: 20,
    exercises: [
      {
        type: "multiple_choice",
        prompt: "O que significa 'How are you?'",
        word: "How are you?",
        pronunciation: "Ráu ári iu?",
        options: [
          { text: "Como você está?",   pronunciation: "", correct: true  },
          { text: "Qual é o seu nome?", pronunciation: "", correct: false },
          { text: "Onde você mora?",   pronunciation: "", correct: false },
          { text: "O que você quer?",  pronunciation: "", correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "Como se responde 'Estou bem, obrigado'?",
        word: "I'm fine, thank you",
        pronunciation: "Áim fáin, thênk iu",
        options: [
          { text: "I'm fine, thank you", pronunciation: "Áim fáin, thênk iu", correct: true  },
          { text: "I'm tired",           pronunciation: "Áim táierd",          correct: false },
          { text: "I don't know",        pronunciation: "Ái dônt nôu",         correct: false },
          { text: "Nice to meet you",    pronunciation: "Náis tu míit iu",      correct: false }
        ]
      },
      {
        type: "fill_blank",
        prompt: "Complete a resposta:",
        sentence: "I'm ___, thank you!",
        sentence_pronunciation: "Áim ___, thênk iu!",
        translation: "Estou ___, obrigado(a)!",
        options: [
          { text: "fine",  pronunciation: "Fáin",  correct: true  },
          { text: "bad",   pronunciation: "Bêd",   correct: false },
          { text: "lost",  pronunciation: "Lôst",  correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "O que significa 'Nice to meet you'?",
        word: "Nice to meet you",
        pronunciation: "Náis tu míit iu",
        options: [
          { text: "Prazer em conhecer você", pronunciation: "", correct: true  },
          { text: "Bom dia",                 pronunciation: "", correct: false },
          { text: "Até mais",                pronunciation: "", correct: false },
          { text: "Com licença",             pronunciation: "", correct: false }
        ]
      },
      {
        type: "word_order",
        prompt: "Monte a frase:",
        translation: "Como você está?",
        words: [
          { text: "How",  pronunciation: "Ráu"  },
          { text: "are",  pronunciation: "Ári"  },
          { text: "you",  pronunciation: "Iu"   },
          { text: "?",    pronunciation: ""      }
        ],
        correct_order: [0, 1, 2, 3]
      }
    ]
  },

  {
    id: 3, module: 1, title: "Por Favor e Obrigado", icon: "🙏", xpReward: 20,
    exercises: [
      {
        type: "multiple_choice",
        prompt: "Como se diz 'Por favor'?",
        word: "Please",
        pronunciation: "Plíiz",
        options: [
          { text: "Please",   pronunciation: "Plíiz",  correct: true  },
          { text: "Sorry",    pronunciation: "Sôri",   correct: false },
          { text: "Excuse me",pronunciation: "Ekskiúz mi", correct: false },
          { text: "Help",     pronunciation: "Rélp",   correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "O que significa 'Thank you very much'?",
        word: "Thank you very much",
        pronunciation: "Thênk iu vériê mâtch",
        options: [
          { text: "Muito obrigado(a)", pronunciation: "", correct: true  },
          { text: "De nada",           pronunciation: "", correct: false },
          { text: "Com licença",       pronunciation: "", correct: false },
          { text: "Desculpe",          pronunciation: "", correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "Como se diz 'De nada'?",
        word: "You're welcome",
        pronunciation: "Iúr uélkâm",
        options: [
          { text: "You're welcome", pronunciation: "Iúr uélkâm", correct: true  },
          { text: "I'm sorry",      pronunciation: "Áim sôri",   correct: false },
          { text: "No problem",     pronunciation: "Nôu prôblem",correct: false },
          { text: "Help me",        pronunciation: "Rélp mi",    correct: false }
        ]
      },
      {
        type: "fill_blank",
        prompt: "Complete com a palavra certa:",
        sentence: "___ me, where is the bathroom?",
        sentence_pronunciation: "___ mi, uér iz dê bêthruun?",
        translation: "___ me, onde fica o banheiro?",
        options: [
          { text: "Excuse",  pronunciation: "Ekskiúz", correct: true  },
          { text: "Sorry",   pronunciation: "Sôri",    correct: false },
          { text: "Please",  pronunciation: "Plíiz",   correct: false }
        ]
      },
      {
        type: "word_order",
        prompt: "Monte a frase:",
        translation: "Obrigado muito!",
        words: [
          { text: "Thank",  pronunciation: "Thênk" },
          { text: "you",    pronunciation: "Iu"    },
          { text: "very",   pronunciation: "Véri"  },
          { text: "much",   pronunciation: "Mâtch" },
          { text: "!",      pronunciation: ""       }
        ],
        correct_order: [0, 1, 2, 3, 4]
      }
    ]
  },

  // ─────────────────────────────
  // MODULE 2: NÚMEROS (3 lições)
  // ─────────────────────────────

  {
    id: 4, module: 2, title: "Números 1–5", icon: "🔢", xpReward: 20,
    exercises: [
      {
        type: "multiple_choice",
        prompt: "Como se fala '1' em inglês?",
        word: "One",
        pronunciation: "Uân",
        options: [
          { text: "One",   pronunciation: "Uân",  correct: true  },
          { text: "Two",   pronunciation: "Tuu",  correct: false },
          { text: "Three", pronunciation: "Thrí", correct: false },
          { text: "Four",  pronunciation: "Fór",  correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "O que significa 'Three'?",
        word: "Three",
        pronunciation: "Thrí",
        options: [
          { text: "3 (três)",  pronunciation: "", correct: true  },
          { text: "2 (dois)",  pronunciation: "", correct: false },
          { text: "4 (quatro)",pronunciation: "", correct: false },
          { text: "5 (cinco)", pronunciation: "", correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "Como se diz '5' em inglês?",
        word: "Five",
        pronunciation: "Fáiv",
        options: [
          { text: "Five",  pronunciation: "Fáiv",  correct: true  },
          { text: "Four",  pronunciation: "Fór",   correct: false },
          { text: "Fine",  pronunciation: "Fáin",  correct: false },
          { text: "Free",  pronunciation: "Frí",   correct: false }
        ]
      },
      {
        type: "fill_blank",
        prompt: "Complete:",
        sentence: "I have ___ cats.",
        sentence_pronunciation: "Ái rêv ___ kêts.",
        translation: "Eu tenho ___ gatos. (dois)",
        options: [
          { text: "two",   pronunciation: "Tuu",  correct: true  },
          { text: "four",  pronunciation: "Fór",  correct: false },
          { text: "five",  pronunciation: "Fáiv", correct: false }
        ]
      },
      {
        type: "word_order",
        prompt: "Monte em ordem:",
        translation: "Um, dois, três",
        words: [
          { text: "one",   pronunciation: "Uân"  },
          { text: ",",     pronunciation: ""      },
          { text: "two",   pronunciation: "Tuu"  },
          { text: ",",     pronunciation: ""      },
          { text: "three", pronunciation: "Thrí" }
        ],
        correct_order: [0, 1, 2, 3, 4]
      }
    ]
  },

  {
    id: 5, module: 2, title: "Números 6–10", icon: "🔟", xpReward: 20,
    exercises: [
      {
        type: "multiple_choice",
        prompt: "Como se diz '7' em inglês?",
        word: "Seven",
        pronunciation: "Sêvên",
        options: [
          { text: "Seven",  pronunciation: "Sêvên", correct: true  },
          { text: "Six",    pronunciation: "Síks",  correct: false },
          { text: "Eight",  pronunciation: "Éit",   correct: false },
          { text: "Nine",   pronunciation: "Náin",  correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "O que é 'Ten'?",
        word: "Ten",
        pronunciation: "Tên",
        options: [
          { text: "10 (dez)",   pronunciation: "", correct: true  },
          { text: "3 (três)",   pronunciation: "", correct: false },
          { text: "8 (oito)",   pronunciation: "", correct: false },
          { text: "6 (seis)",   pronunciation: "", correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "Como se diz '9' em inglês?",
        word: "Nine",
        pronunciation: "Náin",
        options: [
          { text: "Nine",  pronunciation: "Náin",  correct: true  },
          { text: "Five",  pronunciation: "Fáiv",  correct: false },
          { text: "Line",  pronunciation: "Láin",  correct: false },
          { text: "Mine",  pronunciation: "Máin",  correct: false }
        ]
      },
      {
        type: "fill_blank",
        prompt: "Complete:",
        sentence: "I am ___ years old.",
        sentence_pronunciation: "Ái êm ___ íers ôld.",
        translation: "Eu tenho ___ anos. (oito)",
        options: [
          { text: "eight",  pronunciation: "Éit",   correct: true  },
          { text: "nine",   pronunciation: "Náin",  correct: false },
          { text: "six",    pronunciation: "Síks",  correct: false }
        ]
      },
      {
        type: "word_order",
        prompt: "Monte em ordem:",
        translation: "Seis, sete, oito",
        words: [
          { text: "six",    pronunciation: "Síks"  },
          { text: ",",      pronunciation: ""       },
          { text: "seven",  pronunciation: "Sêvên" },
          { text: ",",      pronunciation: ""       },
          { text: "eight",  pronunciation: "Éit"   }
        ],
        correct_order: [0, 1, 2, 3, 4]
      }
    ]
  },

  {
    id: 6, module: 2, title: "Cores Básicas", icon: "🎨", xpReward: 20,
    exercises: [
      {
        type: "multiple_choice",
        prompt: "Como se diz 'Vermelho' em inglês?",
        word: "Red",
        pronunciation: "Rêd",
        options: [
          { text: "Red",    pronunciation: "Rêd",   correct: true  },
          { text: "Blue",   pronunciation: "Bluu",  correct: false },
          { text: "Green",  pronunciation: "Gríin", correct: false },
          { text: "Yellow", pronunciation: "Iélou", correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "O que é 'Blue'?",
        word: "Blue",
        pronunciation: "Bluu",
        options: [
          { text: "Azul",     pronunciation: "", correct: true  },
          { text: "Verde",    pronunciation: "", correct: false },
          { text: "Amarelo",  pronunciation: "", correct: false },
          { text: "Roxo",     pronunciation: "", correct: false }
        ]
      },
      {
        type: "multiple_choice",
        prompt: "Como se diz 'Branco' em inglês?",
        word: "White",
        pronunciation: "Uáit",
        options: [
          { text: "White",  pronunciation: "Uáit",  correct: true  },
          { text: "Black",  pronunciation: "Blêk",  correct: false },
          { text: "Light",  pronunciation: "Láit",  correct: false },
          { text: "Right",  pronunciation: "Ráit",  correct: false }
        ]
      },
      {
        type: "fill_blank",
        prompt: "Complete:",
        sentence: "The sky is ___.",
        sentence_pronunciation: "Dê skái iz ___.",
        translation: "O céu é ___. (azul)",
        options: [
          { text: "blue",   pronunciation: "Bluu",  correct: true  },
          { text: "red",    pronunciation: "Rêd",   correct: false },
          { text: "black",  pronunciation: "Blêk",  correct: false }
        ]
      },
      {
        type: "word_order",
        prompt: "Monte a frase:",
        translation: "Meu carro é preto.",
        words: [
          { text: "My",    pronunciation: "Mái"   },
          { text: "car",   pronunciation: "Kár"   },
          { text: "is",    pronunciation: "Iz"    },
          { text: "black", pronunciation: "Blêk"  },
          { text: ".",     pronunciation: ""       }
        ],
        correct_order: [0, 1, 2, 3, 4]
      }
    ]
  }

];
