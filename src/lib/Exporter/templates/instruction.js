import { has, forEach } from 'lodash'

export default function (instruction) {
  let str = ''
  if (has(instruction, 'own')) {
    str += `${instructionListString(instruction.own)}\n`
  }
  if (has(instruction, 'other')) {
    str += `${instructionListString(instruction.other)}\n`
  }
  return str
}

function instructionListString(list) {
  let str = ''
  forEach(list, (group) => {
    str += `\n${instructionGroupString(group)}`
  })
  return str
}

function instructionGroupString(group) {
  let str = `${group.title} [${group.code}] :\n`
  if (has(group, 'inst')) {
    str += `Instructeur : ${group.inst}`
  }
  if (has(group, 'fonction')) {
    str += `Rôle : ${group.fonction}`
  }
  if (has(group, 'peq')) {
    forEach(group.peq, (list, key) => {
      str += `\n${key} : ${list.join(' ')}`
    })
  }
  return str
}
