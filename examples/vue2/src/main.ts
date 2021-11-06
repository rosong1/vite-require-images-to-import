import Vue from 'vue'
import VCA from '@vue/composition-api'
import App from './App.vue'
Vue.use(VCA)

new Vue({
    render: h => h(App),
}).$mount('#app')