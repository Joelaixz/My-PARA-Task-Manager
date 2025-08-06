import { createApp } from 'vue'
import { createPinia } from 'pinia' // 引入 createPinia
import router from './router' // 引入 router
import './style.css'
import App from './App.vue'

const pinia = createPinia() // 建立 Pinia 實例
const app = createApp(App)

app.use(pinia) // 使用 Pinia
app.use(router) // 使用 Vue Router

app.mount('#app').$nextTick(() => {
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
})