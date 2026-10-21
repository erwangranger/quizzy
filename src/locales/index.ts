import { ref } from 'vue'

export type Locale = 'en' | 'fr'

const en = {
    'app.title': 'Quizzy 🥴',
    'about.source': 'Source on GitHub',
    'about.issues': 'Report an issue',
    'about.creditLead': 'Quizzy started life as a fork of',
    'about.creditName': "Christopher Murphy's open-source quiz app",
    'instructions.body': 'Symptoms may include knowledge vertigo.',
    'starter.singlePlayer': 'Single Player',
    'starter.multiplayer': 'Multiplayer',
    'starter.start': 'Start',
    'starter.language': 'Language',
    'starter.questionCount': 'Number of Questions',
    'starter.chooseCategory': 'Choose Category',
    'starter.allCategories': 'All Categories',
    'starter.categoriesSelected': 'selected',
    'category.geography': 'Geography',
    'category.history': 'History',
    'category.science': 'Science',
    'category.arts-literature': 'Arts & Literature',
    'category.entertainment': 'Entertainment',
    'category.sports-leisure': 'Sports & Leisure',
    'category.recent-news': 'Recent News',
    'questions.next': 'Next',
    'questions.reveal': 'Reveal',
    'questions.skip': 'Skip',
    'questions.menu': 'Main Menu',
    'questions.poolReset': "You've seen all these questions — starting over!",
    'gameboard.turn': "{name}'s Turn",
    'player.default': 'Player {n}',
    'gameover.title': 'Game Over!',
    'gameover.score': 'Score: {score}/{total}',
    'gameover.points': '{points} pts',
    'gameover.correct': '{correct}/{total} correct',
    'gameover.breakdown': 'Category breakdown',
    'gameover.newGame': 'New Game',
    'gameover.rematch': 'Rematch!',
    'interstitial.passTo': 'Pass to {name}',
    'interstitial.ready': "I'm ready",
    'reveal.correctAnswer': 'Correct answer: {answer}',
    'reveal.explanation': 'Explanation',
    'reveal.source': 'Source',
    'reveal.asOf': 'As of {date}',
    'reveal.whoWasRight': 'Who was right?',
    'starter.players': 'Players',
    'starter.mode': 'Multiplayer Mode',
    'starter.playerName': 'Name of player {n}',
    'starter.quizmaster': 'Quizmaster',
    'starter.passPlay': 'Pass and Play',
    'starter.hideChoices': 'Hide Choices',
    'starter.weightByDifficulty': 'Weight by Difficulty',
    'message.0': "Ouch. Well, at least you can't go down from here.",
    'message.1': 'Time to brush up on your knowledge.',
    'message.2': 'Were you just guessing?',
    'message.4': "Don't worry — that's an average score.",
    'message.6': 'You may one day be a wealth of knowledge. Just not today.',
    'message.8': "You're on your way to becoming a quiz master.",
    'message.10': 'Holy snikes!! A perfect score! Excellent work.',
    'update.prompt': 'New version available — tap to refresh',
    'update.refresh': 'Refresh',
} as const

const fr: Record<keyof typeof en, string> = {
    'app.title': 'Quizzy 🥴',
    'about.source': 'Source sur GitHub',
    'about.issues': 'Signaler un problème',
    'about.creditLead': 'Quizzy a commencé comme un fork de',
    'about.creditName': "l'app quiz open source de Christopher Murphy",
    'instructions.body': 'Symptômes possibles : vertige de la connaissance.',
    'starter.singlePlayer': 'Un joueur',
    'starter.multiplayer': 'Multijoueur',
    'starter.start': 'Commencer',
    'starter.language': 'Langue',
    'starter.questionCount': 'Nombre de questions',
    'starter.chooseCategory': 'Choisir une catégorie',
    'starter.allCategories': 'Toutes les catégories',
    'starter.categoriesSelected': 'sélectionnées',
    'category.geography': 'Géographie',
    'category.history': 'Histoire',
    'category.science': 'Science',
    'category.arts-literature': 'Arts et littérature',
    'category.entertainment': 'Divertissement',
    'category.sports-leisure': 'Sports et loisirs',
    'category.recent-news': 'Actualités récentes',
    'questions.next': 'Suivant',
    'questions.reveal': 'Révéler',
    'questions.skip': 'Passer',
    'questions.menu': 'Menu principal',
    'questions.poolReset': 'Vous avez vu toutes ces questions — on recommence !',
    'gameboard.turn': 'Au tour de {name}',
    'player.default': 'Joueur {n}',
    'gameover.title': 'Partie terminée !',
    'gameover.score': 'Score : {score}/{total}',
    'gameover.points': '{points} pts',
    'gameover.correct': '{correct}/{total} bonnes réponses',
    'gameover.breakdown': 'Détail par catégorie',
    'gameover.newGame': 'Nouvelle partie',
    'gameover.rematch': 'Revanche !',
    'interstitial.passTo': 'Passe à {name}',
    'interstitial.ready': 'Je suis prêt',
    'reveal.correctAnswer': 'Bonne réponse : {answer}',
    'reveal.explanation': 'Explication',
    'reveal.source': 'Source',
    'reveal.asOf': 'Le {date}',
    'reveal.whoWasRight': 'Qui a eu bon ?',
    'starter.players': 'Joueurs',
    'starter.quizmaster': 'Meneur de jeu',
    'starter.mode': 'Mode multijoueur',
    'starter.playerName': 'Nom du joueur {n}',
    'starter.passPlay': 'De main en main',
    'starter.hideChoices': 'Masquer les choix',
    'starter.weightByDifficulty': 'Points selon la difficulté',
    'message.0': 'Aïe. Au moins, on ne peut pas descendre plus bas.',
    'message.1': 'Il est temps de réviser vos connaissances.',
    'message.2': 'Vous deviniez, n\'est-ce pas ?',
    'message.4': 'Ne vous inquiétez pas — c\'est un score moyen.',
    'message.6': 'Vous serez peut-être un jour une mine de connaissances. Mais pas aujourd\'hui.',
    'message.8': 'Vous êtes en bonne voie de devenir un maître du quiz.',
    'message.10': 'Holy snikes !! Un score parfait ! Excellent travail.',
    'update.prompt': 'Nouvelle version disponible — actualisez',
    'update.refresh': 'Actualiser',
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

// Category display name: localized when a key exists, raw slug otherwise
// (every category has keys in both dictionaries).
export function categoryLabel(category: string): string {
  const key = `category.${category}` as keyof typeof en
  const localized = (messages[activeLocale.value] as Record<string, string | undefined>)[key]
  return localized ?? category
}
