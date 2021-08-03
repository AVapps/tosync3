<template>
  <div class="filepicker">
    <label ref="label">
      Sélectionner un fichier
      <input
        type="file"
        ref="input"
        accept=".ics,text/calendar,.pdf,application/pdf"
        @change="onFileInputChange"
      />
    </label>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { importPdfFile } from '@/lib/PlanningImporter.js'

export default defineComponent({
  name: 'FilePicker',
  components: {},
  methods: {
    onFileInputChange(event) {
      if (event.target.files && event.target.files.length) {
        if (!window.FileReader) {
          console.log(
            "Votre navigateur ne supporte pas l'importation de fichiers !"
          )
          return
          // throw new Error(`Votre navigateur ne supporte pas l'importation de fichiers !`)
        }

        const file = event.target.files[0]
        if (file.type === 'text/calendar') {
          const fr = new FileReader()

          fr.onload = () => {
            console.log(fr.result)
            event.target.value = ''
          }

          fr.onerror = () => {
            event.target.value = ''
          }

          return fr.readAsText(file)
        }

        if (file.type === 'application/pdf') {
          const fr = new FileReader()

          fr.onload = async () => {
            try {
              const planning = await importPdfFile(fr.result)
              console.log(planning)
            } catch (err) {
              console.error(err)
            }
            event.target.value = ''
          }

          fr.onerror = () => {
            event.target.value = ''
          }

          return fr.readAsArrayBuffer(file)
        }

        console.log(
          'Format de fichier incorrect. Vous devez séléctionner un fichier .ics encodé utf-8 ou un fichier pdf.'
        )
      }
    }
  }
})
</script>

<style scoped lang="scss">
input[type='file'] {
  display: none;
}

label {
  display: inline-block;
  border-radius: 4px;
  color: var(--ion-color-primary-contrast);
  background-color: var(--ion-color-primary);
  padding: 10px;
  outline: none;
  cursor: pointer;
}
</style>
