<template>
  <v-container
    fluid
    grid-list-lg
  >
    <v-layout
      row
      wrap
    >
      <v-flex
        xs12
        md4
        offset-md4
      >
        Step1. 従業員数を入力してください
        <v-card>
          <v-card-text>
            <v-text-field
              v-model.number="startRows"
              :rules="[(value) => 2 <= value && value <= 10 || '2～10人のみ対応です']"
              type="number"
              max="10"
              min="2"
              label="従業員数"
              @change="change"
            />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex
        xs12
        md4
        offset-md4
      >
        Step2. 1日に必要な人数を入力してください
        <v-card>
          <v-card-text>
            <v-text-field
              v-model.number="needsEmployee"
              :max="startRows"
              :rules="[(value) => 1 <= value && value <= 10 || '1～10人のみ対応です']"
              type="number"
              min="0"
              label="必要人数"
            />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex
        xs12
        offset-md4
      >
        Step3. スケジュールを作成する期間を入力してください
      </v-flex>
      <v-flex
        xs12
        md4
        offset-md2
      >
        <v-card>
          <v-card-title><h4>開始</h4></v-card-title>
          <v-card-text class="text-xs-center">
            <v-date-picker
              v-model="from"
              :max="to"
              :allowed-dates="allowDates"
              locale="ja-jp"
              @change="change"
            />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex
        xs12
        md4
      >
        <v-card>
          <v-card-title><h4>終了</h4></v-card-title>
          <v-card-text class="text-xs-center">
            <v-date-picker
              v-model="to"
              :min="from"
              :allowed-dates="allowDates"
              locale="ja-jp"
              @change="change"
            />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex
        xs12
        md4
        offset-md4
      >
        <div>Step4. さあ、スケジュールを作成してみましょう！</div>
        <v-btn
          color="info"
          block
          @click="generate"
        >
          スケジュール作成
        </v-btn>
      </v-flex>
      <v-flex xs12>
        <div class="hot-table">
          ○：出勤、×：休み
          <HotTable
            ref="hotTableComponent"
            :settings="hotSettings"
          />
        </div>
      </v-flex>
      <v-flex xs12>
        以下デモ用
        <div>世代：{{ gen }}</div>
        <div>評価値：100点満点中 {{ Math.round(100 - fitness) }}点</div>
        <v-slider
          v-model="userData.employeeWeight"
          :tick-labels="['人数は「てげてげ」', ...Array(19).map(() => ''), '人数は「しっかり」']"
          max="2"
          min="0"
          step="0.1"
        />
        <v-slider
          v-model="userData.continuityWeight"
          :tick-labels="['連勤は「少なめ」', ...Array(9).map(() => ''), '連勤は「多め」']"
          max="1"
          min="0"
          step="0.1"
        />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
/* eslint-disable func-names, no-plusplus */
import Genetic from 'genetic-js'
import { HotTable } from '@handsontable/vue'
import 'handsontable/dist/handsontable.full.min.css'
import moment from 'moment'

const genetic = Genetic.create()

export default {
  components: {
    HotTable,
  },
  data() {
    return {
      last: null,
      gen: 0,
      fitness: 100,
      from: moment().date(1).format('YYYY-MM-DD'),
      to: moment().endOf('month').format('YYYY-MM-DD'),
      hotSettings: {
        startCols: 31,
        startRows: 7,
        data: null,
        rowHeaderWidth: 100,
        contextMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
      },
      userData: {
        charset: '×○',
        needsEmployee: 5,
        employeeWeight: 1,
        continuityWeight: 0.5,
      },
    }
  },
  computed: {
    startRows: {
      get() {
        return this.hotSettings.startRows
      },
      set(value) {
        if (value >= 2 && value <= 10) {
          this.hotSettings.startRows = value
        }
      },
    },
    needsEmployee: {
      get() {
        return this.userData.needsEmployee
      },
      set(value) {
        if (value >= 1 && value <= 10) {
          this.userData.needsEmployee = value
        }
      },
    },
  },
  mounted() {
    this.change()
  },
  created() {
    genetic.optimize = Genetic.Optimize.Minimize
    genetic.select1 = Genetic.Select1.Tournament2
    genetic.select2 = Genetic.Select2.Tournament2

    genetic.seed = function () {
      let text = ''
      for (let i = 0; i < this.userData.col * this.userData.row; i++) {
        text += this.userData.charset.charAt(Math.floor(Math.random()
        * this.userData.charset.length))
      }
      return text
    }

    genetic.mutate = function (entity) {
      function replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length)
      }

      // chromosomal drift
      const i = Math.floor(Math.random() * entity.length)
      return replaceAt(
        entity,
        i,
        this.userData.charset.charAt(Math.floor(Math.random()
        * this.userData.charset.length)),
      )
    }

    genetic.crossover = (mother, father) => {
      // two-point crossover
      const len = mother.length
      let ca = Math.floor(Math.random() * len)
      let cb = Math.floor(Math.random() * len)
      if (ca > cb) {
        const tmp = cb
        cb = ca
        ca = tmp
      }

      const son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb)
      const daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb)

      return [son, daughter]
    }

    genetic.fitness = function (entity) {
      let fitness = 0

      for (let col = 0; col < this.userData.col; col++) {
        let workers = 0
        for (let row = 0; row < this.userData.row; row++) {
          const idx = col + (row * this.userData.col)
          if (col < this.userData.col - 1 && entity[idx] === entity[idx + 1]) {
            fitness += 1 - this.userData.continuityWeight
          }
          workers += (entity[idx] === '○' ? 1 : 0)
        }
        fitness += Math.abs(this.userData.needsEmployee - workers) * this.userData.employeeWeight
      }
      return fitness
    }

    genetic.notification = (pop, gen) => {
      const value = pop[0].entity
      this.last = this.last || value
      if (this.last === value) {
        return
      }
      this.last = value
      this.fitness = pop[0].fitness
      this.$refs.hotTableComponent.hotInstance.loadData([...Array(genetic.userData.row)].map((c, idx) => value.substr(idx * genetic.userData.col, genetic.userData.col).split('')))
      this.gen = gen
    }
  },
  methods: {
    generate() {
      this.userData.col = this.hotSettings.startCols
      this.userData.row = this.hotSettings.startRows
      genetic.evolve(
        {
          iterations: 200,
          size: 100,
          crossover: 0.3,
          mutation: 0.3,
          skip: 20,
        },
        this.userData,
      )
    },
    allowDates(date) {
      return moment(date).date(1).diff(moment().date(1), 'months') === 0
    },
    change() {
      this.hotSettings.startCols = moment(this.to).diff(this.from, 'days') + 1
      this.hotSettings.colHeaders = [...Array(this.hotSettings.startCols)].map((a, idx) => moment(this.from).add(idx, 'days').format('MM/DD'))
      this.hotSettings.columns = [...Array(this.hotSettings.startCols)].map(() => ({
        type: 'dropdown',
        source: ['○', '×', ''],
      }))
      this.hotSettings.rowHeaders = [...Array(10)].map((a, idx) => `クルー${idx + 1}`)
      this.$refs.hotTableComponent.hotInstance.updateSettings(this.hotSettings)
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.hot-table {
    width: 100%;
    height: 300px;
    overflow: hidden;
  }
</style>
