import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import './style.css'
import './styles/components.css'
import './styles/footer.css'

createApp(App)
  .use(router)
  .mount('#app')