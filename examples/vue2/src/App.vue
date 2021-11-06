<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import HelloWorld from "./components/HelloWorld.vue";
// import logo from "./assets/logo.png";
const typeDemo: Record<number, boolean> = {1: true};
@Component({
  components: {
    HelloWorld,
  },
})
export default class App extends Vue {
  get imgSrc() {
    return require("images/logo.png");
  }
  get typeDemo() {
    return typeDemo
  }
  count = 0;
}

</script>
<template>
  <div>
    <h1>vue2 demook</h1>
    <img alt="Vue logo" :src="imgSrc" />
    <img alt="favicon" :src="require('./favicon.svg')" style="width: 200px" />
    <button @click="count++">count: {{count}}</button>
    <HelloWorld></HelloWorld>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
<style lang="css" scoped>
#app .demo {
  margin-top: 12px;
}
</style>


