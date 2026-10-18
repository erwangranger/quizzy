import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './main.scss'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')
