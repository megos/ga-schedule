<template>
  <v-app>
    <v-toolbar
      app
      dark
      color="primary"
    >
      <v-toolbar-title v-text="title" />
    </v-toolbar>
    <v-content>
      <Top />
    </v-content>
  </v-app>
</template>

<script>
import Top from './components/Top'

export default {
  name: 'App',
  components: {
    Top,
  },
  data() {
    return {
      clipped: false,
      drawer: true,
      fixed: false,
      items: [{
        icon: 'bubble_chart',
        title: 'Inspire',
      }],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'てげてげスケジュール',
    }
  },
}
</script>
