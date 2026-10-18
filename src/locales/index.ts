export type Locale = 'en' | 'fr'

const en = {
    'app.title': 'Quizzy 🥴',
    'about.heading': 'triv·i·a',
    'about.partOfSpeech': 'noun',
    'about.definition': 'details, considerations, or pieces of information of little importance or value.',
    'about.love': 'I love trivia and I thought that you might too.',
    'instructions.body': 'Test your trivial knowledge with a trivia quiz. Play against a friend, or challenge yourself.',
    'starter.singlePlayer': 'Single Player',
    'starter.multiplayer': 'Multiplayer',
    'starter.start': 'Start',
    'starter.language': 'Language',
    'starter.questionCount': 'Number of Questions',
    'starter.chooseCategory': 'Choose Category',
    'starter.allCategories': 'All Categories',
    'starter.categoriesSelected': 'selected',
    'questions.next': 'Next',
    'questions.poolReset': "You've seen all these questions — starting over!",
    'gameboard.playerOne': 'Player One',
    'gameboard.playerTwo': 'Player Two',
    'gameover.title': 'Game Over!',
    'gameover.score': 'Score: {score}/{total}',
    'gameover.playerOneWins': 'Player One Wins!',
    'gameover.playerTwoWins': 'Player Two Wins!',
    'gameover.draw': 'Draw!',
    'gameover.playerOne': 'Player One: {score}',
    'gameover.playerTwo': 'Player Two: {score}',
    'gameover.newGame': 'New Game',
    'gameover.rematch': 'Rematch!',
    'message.0': "Ouch. Well, at least you can't go down from here.",
    'message.1': 'Time to brush up on your trivia game.',
    'message.2': 'Were you just guessing?',
    'message.3': "Google is your friend. Consider it today's Encyclopedia Britannica.",
    'message.4': "Don't worry — a 4/10 is average.",
    'message.5': 'So-so performance. Not bad. Not great. Maybe better luck next time.',
    'message.6': 'You may one day be a wealth of trivial knowledge. Just not today.',
    'message.7': 'Not bad. Can you perform this well a second time?',
    'message.8': "You're on your way to becoming a trivia master.",
    'message.9': 'A regular trivia wiz. Nice work.',
    'message.10': 'Holy snikes!! A perfect score! Excellent work.',
} as const

const fr: Record<keyof typeof en, string> = {
    'app.title': 'Quizzy 🥴',
    'about.heading': 'triv·i·a',
    'about.partOfSpeech': 'nom',
    'about.definition': 'détails, considérations ou renseignements de peu d\'importance ou de valeur.',
    'about.love': 'J\'adore le trivia et j\'ai pensé que vous pourriez l\'aimer aussi.',
    'instructions.body': 'Testez vos connaissances avec un quiz. Jouez contre un ami, ou défiez-vous.',
    'starter.singlePlayer': 'Un joueur',
    'starter.multiplayer': 'Multijoueur',
    'starter.start': 'Commencer',
    'starter.language': 'Langue',
    'starter.questionCount': 'Nombre de questions',
    'starter.chooseCategory': 'Choisir une catégorie',
    'starter.allCategories': 'Toutes les catégories',
    'starter.categoriesSelected': 'sélectionnées',
    'questions.next': 'Suivant',
    'questions.poolReset': 'Vous avez vu toutes ces questions — on recommence !',
    'gameboard.playerOne': 'Joueur un',
    'gameboard.playerTwo': 'Joueur deux',
    'gameover.title': 'Partie terminée !',
    'gameover.score': 'Score : {score}/{total}',
    'gameover.playerOneWins': 'Le joueur un gagne !',
    'gameover.playerTwoWins': 'Le joueur deux gagne !',
    'gameover.draw': 'Match nul !',
    'gameover.playerOne': 'Joueur un : {score}',
    'gameover.playerTwo': 'Joueur deux : {score}',
    'gameover.newGame': 'Nouvelle partie',
    'gameover.rematch': 'Revanche !',
    'message.0': 'Aïe. Au moins, on ne peut pas descendre plus bas.',
    'message.1': 'Il est temps de réviser vos connaissances.',
    'message.2': 'Vous deviniez, n\'est-ce pas ?',
    'message.3': 'Google est votre ami. Considérez-le comme l\'Encyclopédie Britannica d\'aujourd\'hui.',
    'message.4': 'Ne vous inquiétez pas — 4/10, c\'est la moyenne.',
    'message.5': 'Performance moyenne. Pas mal. Pas terrible. Peut-être plus de chance la prochaine fois.',
    'message.6': 'Vous serez peut-être un jour une mine de connaissances triviales. Mais pas aujourd\'hui.',
    'message.7': 'Pas mal. Saurez-vous refaire cette performance ?',
    'message.8': 'Vous êtes en bonne voie de devenir un maître du trivia.',
    'message.9': 'Un véritable virtuose du trivia. Beau travail.',
    'message.10': 'Holy snikes !! Un score parfait ! Excellent travail.',
}

const messages: Record<Locale, Record<keyof typeof en, string>> = { en, fr }

export function t(key: keyof typeof en, params?: Record<string, string | number>): string {
  let text = messages.en[key]
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value))
    }
  }
  return text
}
