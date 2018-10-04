<template>
  <v-container fluid>
    <v-slide-y-transition mode="out-in">
      <v-layout column align-center>
        <img src="@/assets/logo.png" alt="Vuetify.js" class="mb-5">
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
    };
  },
  created() {
    genetic.optimize = Genetic.Optimize.Maximize;
    genetic.select1 = Genetic.Select1.Tournament2;
    genetic.select2 = Genetic.Select2.Tournament2;

    genetic.seed = function () {
      function randomString(len) {
        let text = '';
        const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < len; i++) {
          text += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        return text;
      }

      // create random strings that are equal in length to solution
      return randomString(this.userData.solution.length);
    };
    genetic.mutate = function (entity) {
      function replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length);
      }

      // chromosomal drift
      const i = Math.floor(Math.random() * entity.length);
      return replaceAt(
        entity, i,
        String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)),
      );
    };
    genetic.crossover = function (mother, father) {
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
    genetic.fitness = function (entity) {
      let fitness = 0;

      let i;
      for (i = 0; i < entity.length; ++i) {
        // increase fitness for each character that matches
        if (entity[i] === this.userData.solution[i]) { fitness += 1; }

        // award fractions of a point as we get warmer
        fitness += (127 - Math.abs(entity.charCodeAt(i)
        - this.userData.solution.charCodeAt(i))) / 50;
      }
      return fitness;
    };
    genetic.generation = function (pop) {
      // stop running once we've reached the solution
      return pop[0].entity !== this.userData.solution;
    };

    genetic.notification = function (pop) {
      const value = pop[0].entity;
      this.last = this.last || value;

      if (pop !== 0 && value === this.last) { return; }

      this.last = value;
    };

    genetic.evolve(
      {
        iterations: 4000,
        size: 250,
        crossover: 0.3,
        mutation: 0.3,
        skip: 20,
      },
      {
        solution: 'hogehogehogehoge',
      },
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
