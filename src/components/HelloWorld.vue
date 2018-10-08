<template>
  <v-container fluid>
    <v-layout row wrap>
      <v-flex xs12 md3>
        <v-text-field
          v-model.number="hotSettings.startRows"
          type="number"
          max=10
          min=0
          @change="change"
          label="従業員数"/>
      </v-flex>
      <v-flex xs12 md3>
        <v-text-field
          v-model.number="userData.needsEmployee"
          type="number"
          :max="hotSettings.startRows"
          min=0
          label="必要人数"/>
      </v-flex>
      <v-flex xs12 md3>
        <v-date-picker v-model="from" locale="ja-jp" @change="change"/>
      </v-flex>
      <v-flex xs12 md3>
        <v-date-picker v-model="to" locale="ja-jp" @change="change"/>
      </v-flex>
      <v-flex xs12>
        <v-btn @click="generate">シフト生成</v-btn>
      </v-flex>
      <v-flex xs12>
        <div class="hot-table">
          <HotTable ref="hotTableComponent" :settings="hotSettings"/>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Genetic from 'genetic-js';
import { HotTable } from '@handsontable/vue';
import 'handsontable/dist/handsontable.full.min.css';
import moment from 'moment';

const genetic = Genetic.create();

export default {
  name: 'HelloWorld',
  components: {
    HotTable,
  },
  props: {
    msg: String,
  },
  data() {
    return {
      last: null,
      gen: 0,
      from: moment().date(1).format('YYYY-MM-DD'),
      to: moment().endOf('month').format('YYYY-MM-DD'),
      hotSettings: {
        startCols: 31,
        startRows: 7,
        data: null,
        rowHeaderWidth: 100,
      },
      userData: {
        charset: '×○',
        needsEmployee: 5,
      },
    };
  },
  mounted() {
    this.change();
  },
  created() {
    genetic.optimize = Genetic.Optimize.Minimize;
    genetic.select1 = Genetic.Select1.Tournament2;
    genetic.select2 = Genetic.Select2.Tournament2;

    genetic.seed = function () {
      let text = '';
      for (let i = 0; i < this.userData.col * this.userData.row; i++) {
        text += this.userData.charset.charAt(Math.floor(Math.random()
        * this.userData.charset.length));
      }
      return text;
    };

    genetic.mutate = function (entity) {
      function replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length);
      }

      // chromosomal drift
      const i = Math.floor(Math.random() * entity.length);
      return replaceAt(
        entity,
        i,
        this.userData.charset.charAt(Math.floor(Math.random()
        * this.userData.charset.length)),
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

    genetic.fitness = function (entity) {
      let fitness = 0;

      for (let col = 0; col < this.userData.col; col++) {
        let workers = 0;
        for (let row = 0; row < this.userData.row; row++) {
          const idx = col + (row * this.userData.col);
          if (col < this.userData.col - 1 && entity[idx] === entity[idx + 1]) {
            fitness += 0.5;
          }
          workers += (entity[idx] === '○' ? 1 : 0);
        }
        fitness += Math.abs(this.userData.needsEmployee - workers);
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
      this.$refs.hotTableComponent.hotInstance.loadData([...Array(genetic.userData.row)].map((c, idx) => value.substr(idx * genetic.userData.col, genetic.userData.col).split('')));
      this.gen = gen;
    };
  },
  methods: {
    generate() {
      this.userData.col = this.hotSettings.startCols;
      this.userData.row = this.hotSettings.startRows;
      genetic.evolve(
        {
          iterations: 200,
          size: 100,
          crossover: 0.3,
          mutation: 0.3,
          skip: 20,
        },
        this.userData,
      );
    },
    change() {
      this.hotSettings.startCols = moment(this.to).diff(this.from, 'days') + 1;
      this.hotSettings.colHeaders = [...Array(this.hotSettings.startCols)].map((a, idx) => moment(this.from).add(idx, 'days').format('MM/DD'));
      this.hotSettings.rowHeaders = [...Array(10)].map((a, idx) => `クルー${idx + 1}`);
      this.$refs.hotTableComponent.hotInstance.updateSettings(this.hotSettings);
    },
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

.hot-table {
    width: 100%;
    height: 300px;
    overflow: hidden;
  }
</style>
