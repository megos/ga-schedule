<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4" offset-md="4">
        Step1. 従業員数を入力してください
        <v-card>
          <v-card-text>
            <v-text-field v-model.number="startRows" :rules="[(value) => 2 <= value && value <= 10 || '2～10人のみ対応です']"
              type="number" max="10" min="2" label="従業員数" @change="change" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" offset-md="4">
        Step2. 1日に必要な人数を入力してください
        <v-card>
          <v-card-text>
            <v-text-field v-model.number="needsEmployee" :max="startRows"
              :rules="[(value) => 1 <= value && value <= 10 || '1～10人のみ対応です']" type="number" min="0" label="必要人数" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" offset-md="4">
        Step3. スケジュールを作成する期間を入力してください
      </v-col>
      <v-col cols="12" md="4" offset-md="2">
        <v-card>
          <v-card-title>
            <h4>開始</h4>
          </v-card-title>
          <v-card-text class="text-xs-center">
            <v-date-picker v-model="from" :max="to" :allowed-dates="allowDatesFrom" locale="ja-jp"
              @update:model-value="change" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <h4>終了</h4>
          </v-card-title>
          <v-card-text class="text-xs-center">
            <v-date-picker v-model="to" :min="from" :allowed-dates="allowDatesTo" locale="ja-jp"
              @update:model-value="change" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" offset-md="4">
        <div>Step4. さあ、スケジュールを作成してみましょう！</div>
        <v-btn color="info" block @click="generate">
          スケジュール作成
        </v-btn>
      </v-col>
      <v-col cols="12">
        <div>
          ○：出勤、×：休み
          <hot-table :settings="hotSettings" ref="tableRef">
          </hot-table>
        </div>
      </v-col>
      <v-col cols="12">
        以下デモ用
        <div>世代：{{ generation }}</div>
        <div>評価値：100点満点中 {{ Math.round(100 - fitness) }}点</div>
        <div>人数をゆるく → きびしく</div>
        <v-slider v-model="userData.employeeWeight" max="2" min="0" step="0.1" />
        <div>連勤をゆるく → きびしく</div>
        <v-slider v-model="userData.continuityWeight" max="1" min="0" step="0.1" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, type Ref } from 'vue'
import { useDate } from 'vuetify'

import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import Handsontable from 'handsontable';
// @ts-ignore
import Genetic from 'genetic-js'

import { toYYMM } from '../utils'

// register Handsontable's modules
registerAllModules();

const genetic = Genetic.create()

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

genetic.mutate = function (entity: string) {
  const replaceAt = (str: string, index: number, character: string) => {
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

genetic.crossover = (mother: string, father: string) => {
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

genetic.fitness = function (entity: string) {
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

genetic.notification = (pop: { fitness: number, entity: string }[], gen: number) => {
  const value = pop[0]!.entity
  last.value ??= value
  if (last.value === value) {
    return
  }
  last.value = value
  fitness.value = pop[0]!.fitness
  tableRef.value?.hotInstance.loadData([...Array(genetic.userData.row)].map((c, idx) => value.substr(idx * genetic.userData.col, genetic.userData.col).split('')))
  generation.value = gen
}

const tableRef = ref<{ hotInstance: Handsontable } | null>(null)

const change = () => {
  const startCols = adapter.getDiff(to.value, from.value, 'days')
  hotSettings.value.startCols = startCols
  hotSettings.value.colHeaders = [...new Array(startCols)].map((_, idx) => toYYMM(adapter.addDays(from.value, idx) as Date))
  hotSettings.value.startRows = startRows.value
  hotSettings.value.rowHeaders = [...new Array(startRows.value)].map((_, idx) => `クルー${idx + 1}`)
  tableRef.value?.hotInstance?.updateSettings(hotSettings.value)
}
const generate = () => {
  userData.value.col = hotSettings.value.startCols
  userData.value.row = hotSettings.value.startRows
  genetic.evolve(
    {
      iterations: 200,
      size: 100,
      crossover: 0.3,
      mutation: 0.3,
      skip: 20,
    },
    userData.value,
  )
}

onMounted(change)

const hotSettings = ref({
  startRows: 7,
  startCols: 31,
  rowHeaders: [] as string[],
  colHeaders: [] as string[],
  rowHeaderWidth: 100,
  columns: [...new Array(31)].map(() => ({
    type: 'dropdown',
    source: ['○', '×', ''],
  })),
  height: 'auto',
  themeName: 'ht-theme-main',
  licenseKey: 'non-commercial-and-evaluation',
}) satisfies Ref<Handsontable.GridSettings>

const startRows = computed<number, number>({
  get: () => hotSettings.value.startRows,
  set: (value) => {
    if (value >= 2 && value <= 10) {
      hotSettings.value.startRows = value
    }
  },
})

const needsEmployee = computed<number, number>({
  get: () => userData.value.needsEmployee,
  set: (value) => {
    if (value >= 1 && value <= 10) {
      userData.value.needsEmployee = value
    }
  },
})

const generation = ref(0)
const fitness = ref(0)
const last = ref<string | null>(null)

const today = new Date()
const adapter = useDate()
const from = ref(adapter.startOfMonth(today) as Date)
const to = ref(adapter.endOfMonth(today) as Date)
const allowDatesFrom = (date: unknown) => {
  return adapter.getDiff(to.value, date, 'days') <= 31
}
const allowDatesTo = (date: unknown) => {
  return adapter.getDiff(date, from.value, 'days') <= 31
}
const userData = ref({
  needsEmployee: 5,
  employeeWeight: 0,
  continuityWeight: 0,
  charset: '×○',
  col: 0,
  row: 0,
})
</script>
