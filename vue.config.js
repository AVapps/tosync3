module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-auto-import/webpack')({
        imports: [
          // presets
          'vue',
          'vue-router',
          '@vueuse/core'
        ],
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true,
        },
      }),
      require('unplugin-vue-components/webpack')({
        // dts: true,
        include: [/\.vue$/, /\.vue\?vue/],
        resolvers: [
          (name) => {
            if (name.startsWith('Ion')) {
              return {
                name,
                from: '@ionic/vue',
              }
            }
            if (name.endsWith('Outline')) {
              return {
                name,
                from: 'ionicons/icons',
              }
            }
          },
        ],
      })
    ]
  }
}

