<template>
  <v-container fluid>
    <v-slide-y-transition mode="out-in">
      <v-layout column align-center>
        <img src="@/assets/logo.png" alt="Vuetify.js" class="mb-5">
        <div>{{ gen }}</div>
        <div>{{ last }}</div>
        <blockquote>
          &#8220;First, solve the problem. Then, write the code.&#8221;
          <footer>
            <small>
              <em>&mdash;John Johnson</em>
            </small>
          </footer>
        </blockquote>
      </v-layout>
    </v-slide-y-transition>
  </v-container>
</template>

<script>
import Genetic from 'genetic-js';

const genetic = Genetic.create();

export default {
  name: 'HelloWorld',
  props: {
    msg: String,
  },
  data() {
    return {
      last: null,
      gen: 0,
      userData: {
        col: 7,
        row: 3,
        charset: '01',
        randomString: () =>
          genetic.userData.charset.charAt(Math.floor(Math.random()
        * genetic.userData.charset.length)),
      },
    };
  },
  created() {
    genetic.optimize = Genetic.Optimize.Minimize;
    genetic.select1 = Genetic.Select1.Tournament2;
    genetic.select2 = Genetic.Select2.Tournament2;

    genetic.seed = () => {
      let text = '';
      for (let i = 0; i < genetic.userData.col * genetic.userData.row; i++) {
        text += genetic.userData.randomString();
      }
      return text;
    };

    genetic.mutate = (entity) => {
      function replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length);
      }

      // chromosomal drift
      const i = Math.floor(Math.random() * entity.length);
      return replaceAt(
        entity,
        i,
        genetic.userData.randomString(),
      );
    };

    genetic.crossover = (mother, father) => {
      // two-point crossover
      const len = mother.length;
      let ca = Math.floor(Math.random() * len);
      let cb = Math.floor(Math.random() * len);
      if (ca > cb) {
        const tmp = cb;
        cb = ca;
        ca = tmp;
      }

      const son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb);
      const daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb);

      return [son, daughter];
    };

    genetic.fitness = (entity) => {
      let fitness = 0;

      for (let col = 0; col < genetic.userData.col; col++) {
        let workers = 0;
        for (let row = 0; row < genetic.userData.row; row++) {
          const idx = col + (row * genetic.userData.col);
          if (col < genetic.userData.col - 1 && entity[idx] === entity[idx + 1]) {
            fitness += 1;
          }
          workers += (entity[idx] === '1' ? 1 : 0);
        }
        fitness += Math.abs(2 - workers);
      }
      return fitness;
    };

    genetic.notification = (pop, gen) => {
      const value = pop[0].entity;
      this.last = this.last || value;
      if (this.last === value) {
        return;
      }
      this.last = value;
      this.gen = gen;
    };

    genetic.evolve(
      {
        iterations: 100,
        size: 100,
        crossover: 0.3,
        mutation: 0.3,
        skip: 20,
      },
      this.userData,
    );
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
