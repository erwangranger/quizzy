// App bootstrap. When the URL carries a ?bank= parameter, the custom bank is
// loaded and normalized before mount: the game renders with the custom
// category preselected and a fitting default count. A broken or invalid bank
// never blocks the app — errors land in the console and the game simply plays
// without the custom questions. One pinia instance is created here and reused
// for both the preset and the mount: a second createPinia() would install the
// preset into a store the mounted app never sees.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './main.scss'
import { analytics } from './analytics'
import App from './App.vue'
import { loadCustomBankParam, setCustomBank, presetSetup } from './customBank'
import { useGameStore } from './store/store'

const pinia = createPinia()
const bankResult = await loadCustomBankParam()
if (bankResult && bankResult.questions.length > 0) {
  setCustomBank(bankResult.questions, bankResult.name)
  const preset = presetSetup(bankResult.questions)
  useGameStore(pinia).setSetup(preset)
} else if (bankResult && bankResult.errors.length > 0) {
  console.warn(`Custom bank failed to load (${bankResult.source}): ${bankResult.errors.join('; ')}`)
}

createApp(App).use(pinia).mount('#app')
