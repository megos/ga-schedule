<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4" offset-md="4">
        Step1. 従業員数を入力してください
        <v-card>
          <v-card-text>
            <v-text-field
              v-model.number="startRows"
              label="従業員数"
              max="10"
              min="2"
              :rules="[(value) => 2 <= value && value <= 10 || '2～10人のみ対応です']"
              type="number"
              @change="change"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" offset-md="4">
        Step2. 1日に必要な人数を入力してください
        <v-card>
          <v-card-text>
            <v-text-field
              v-model.number="needsEmployee"
              label="必要人数"
              :max="startRows"
              min="0"
              :rules="[(value) => 1 <= value && value <= 10 || '1～10人のみ対応です']"
              type="number"
            />
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
            <v-date-picker
              v-model="from"
              :allowed-dates="allowDatesFrom"
              locale="ja-jp"
              :max="to"
              @update:model-value="change"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <h4>終了</h4>
          </v-card-title>
          <v-card-text class="text-xs-center">
            <v-date-picker
              v-model="to"
              :allowed-dates="allowDatesTo"
              locale="ja-jp"
              :min="from"
              @update:model-value="change"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" offset-md="4">
        <div>Step4. さあ、スケジュールを作成してみましょう！</div>
        <v-btn block color="info" @click="generate">
          スケジュール作成
        </v-btn>
      </v-col>
      <v-col cols="12">
        <div>
          ○：出勤、×：休み
          <hot-table ref="tableRef" :settings="hotSettings" />
        </div>
      </v-col>
      <v-col cols="12">
        以下デモ用
        <div>世代：{{ generation }}</div>
        <div>評価値：100点満点中 {{ Math.max(Math.round(100 - fitness), 0) }}点</div>
        <div>人数をゆるく → きびしく</div>
        <v-slider v-model="userData.employeeWeight" max="2" min="0.1" step="0.1" />
        <div>連勤をゆるく → きびしく</div>
        <v-slider v-model="userData.continuityWeight" max="1" min="0.1" step="0.1" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type Handsontable from 'handsontable'
  import { HotTable } from '@handsontable/vue3'

  import { registerAllModules } from 'handsontable/registry'
  import { computed, onMounted, ref, type Ref } from 'vue'
  import { useDate } from 'vuetify'
  import { createGenetic, type GeneticUserData } from '../genetic'
  import { toYYMM } from '../utils'
  import 'handsontable/styles/handsontable.min.css'

  import 'handsontable/styles/ht-theme-main.min.css'

  // register Handsontable's modules
  registerAllModules()

  const genetic = createGenetic()

  genetic.notification = (pop: { fitness: number, entity: string }[], gen: number) => {
    const value = pop[0]!.entity
    last.value ??= value
    if (last.value === value) {
      return
    }
    last.value = value
    fitness.value = pop[0]!.fitness
    tableRef.value?.hotInstance.loadData(Array.from({ length: genetic.userData.row }).map((_, idx) => {
      const start = idx * genetic.userData.col
      const end = start + genetic.userData.col
      return value.slice(start, end).split('')
    }))
    generation.value = gen
  }

  const tableRef = ref<{ hotInstance: Handsontable } | null>(null)

  function change () {
    const startCols = adapter.getDiff(to.value, from.value, 'days') + 1
    hotSettings.value.startCols = startCols
    hotSettings.value.colHeaders = Array.from({ length: startCols }).map((_, idx) => toYYMM(adapter.addDays(from.value, idx) as Date))
    hotSettings.value.startRows = startRows.value
    hotSettings.value.rowHeaders = Array.from({ length: startRows.value }).map((_, idx) => `クルー${idx + 1}`)
    hotSettings.value.data = Array.from({ length: startRows.value }).map(() => Array.from({ length: startCols }).map(() => ''))
    tableRef.value?.hotInstance?.updateSettings(hotSettings.value)
  }
  function generate () {
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
    data: [] as string[][],
    startRows: 7,
    startCols: 31,
    rowHeaders: [] as string[],
    colHeaders: [] as string[],
    rowHeaderWidth: 100,
    columns: () => ({
      type: 'dropdown',
      source: ['○', '×', ''],
    }),
    height: 'auto',
    themeName: 'ht-theme-main',
    licenseKey: 'non-commercial-and-evaluation',
  }) satisfies Ref<Handsontable.GridSettings>

  const startRows = computed<number, number>({
    get: () => hotSettings.value.startRows,
    set: value => {
      if (value >= 2 && value <= 10) {
        hotSettings.value.startRows = value
      }
    },
  })

  const needsEmployee = computed<number, number>({
    get: () => userData.value.needsEmployee,
    set: value => {
      if (value >= 1 && value <= 10) {
        userData.value.needsEmployee = value
      }
    },
  })

  const generation = ref(0)
  const fitness = ref(100)
  const last = ref<string | null>(null)

  const today = new Date()
  const adapter = useDate()
  const from = ref(adapter.startOfMonth(today) as Date)
  const to = ref(adapter.endOfMonth(today) as Date)
  function allowDatesFrom (date: unknown) {
    return adapter.getDiff(to.value, date, 'days') <= 31
  }
  function allowDatesTo (date: unknown) {
    return adapter.getDiff(date, from.value, 'days') <= 31
  }
  const userData = ref<GeneticUserData>({
    needsEmployee: 5,
    employeeWeight: 1,
    continuityWeight: 0.5,
    charset: '×○',
    col: 0,
    row: 0,
  })
</script>
