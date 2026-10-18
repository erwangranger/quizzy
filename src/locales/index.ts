import { ref } from 'vue'

export type Locale = 'en' | 'fr'

const en = {
    'app.title': 'Quizzy 🥴',
    'about.heading': 'Quizzy',
    'about.partOfSpeech': 'noun',
    'about.definition': 'a quiz game about knowledge, played with friends on one phone.',
    'about.love': 'I love learning and I thought you might too.',
    'instructions.body': 'Test your knowledge with a quiz. Play against a friend, or challenge yourself.',
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
    'message.1': 'Time to brush up on your knowledge.',
    'message.2': 'Were you just guessing?',
    'message.4': "Don't worry — that's an average score.",
    'message.6': 'You may one day be a wealth of knowledge. Just not today.',
    'message.8': "You're on your way to becoming a quiz master.",
    'message.10': 'Holy snikes!! A perfect score! Excellent work.',
} as const

const fr: Record<keyof typeof en, string> = {
    'app.title': 'Quizzy 🥴',
    'about.heading': 'Quizzy',
    'about.partOfSpeech': 'nom',
    'about.definition': 'un quiz de connaissances, à jouer entre amis sur un seul téléphone.',
    'about.love': 'J\'adore apprendre et j\'ai pensé que vous pourriez l\'aimer aussi.',
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
    'message.4': 'Ne vous inquiétez pas — c\'est un score moyen.',
    'message.6': 'Vous serez peut-être un jour une mine de connaissances. Mais pas aujourd\'hui.',
    'message.8': 'Vous êtes en bonne voie de devenir un maître du quiz.',
    'message.10': 'Holy snikes !! Un score parfait ! Excellent travail.',
}

const messages: Record<Locale, Record<keyof typeof en, string>> = { en, fr }

// Active locale, kept in a Vue ref so every t() call site re-renders on change.
// The store sets it when the language selection changes; defaults to 'en'.
const activeLocale = ref<Locale>('en')

export function setLocale(locale: Locale): void {
  activeLocale.value = locale
}

export function t(key: keyof typeof en, params?: Record<string, string | number>): string {
  let text = messages[activeLocale.value][key]
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value))
    }
  }
  return text
}
