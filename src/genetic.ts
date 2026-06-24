// @ts-ignore
import Genetic from 'genetic-js'

export type GeneticUserData = {
  needsEmployee: number
  employeeWeight: number
  continuityWeight: number
  charset: string
  col: number
  row: number
}

export function createGenetic () {
  const genetic = Genetic.create()

  genetic.optimize = Genetic.Optimize.Minimize
  genetic.select1 = Genetic.Select1.Tournament2
  genetic.select2 = Genetic.Select2.Tournament2

  genetic.seed = function () {
    let text = ''
    for (let index = 0; index < this.userData.col * this.userData.row; index++) {
      text += this.userData.charset.charAt(Math.floor(Math.random()
        * this.userData.charset.length))
    }
    return text
  }

  genetic.mutate = function (entity: string) {
    const replaceAt = (str: string, index: number, character: string) => {
      return str.slice(0, Math.max(0, index)) + character + str.slice(index + character.length)
    }

    // chromosomal drift
    const index = Math.floor(Math.random() * entity.length)
    return replaceAt(entity, index, this.userData.charset.replace(entity[index], ''))
  }

  genetic.crossover = (mother: string, father: string) => {
    // two-point crossover
    const { length } = mother
    let ca = Math.floor(Math.random() * (length + 1))
    let cb = Math.floor(Math.random() * (length + 1))
    if (ca > cb) {
      const tmp = cb
      cb = ca
      ca = tmp
    }

    const son = father.slice(0, Math.max(0, ca)) + mother.slice(ca, cb) + father.slice(cb)
    const daughter = mother.slice(0, Math.max(0, ca)) + father.slice(ca, cb) + mother.slice(cb)

    return [son, daughter]
  }

  genetic.fitness = function (entity: string) {
    let fitness = 0

    for (let col = 0; col < this.userData.col; col++) {
      let employees = 0
      for (let row = 0; row < this.userData.row; row++) {
        const index = col + (row * this.userData.col)
        if (col < this.userData.col - 1 && entity[index] === '○' && entity[index + 1] === '○') {
          fitness += this.userData.continuityWeight
        }
        employees += (entity[index] === '○' ? 1 : 0)
      }
      fitness += Math.abs(this.userData.needsEmployee - employees) * this.userData.employeeWeight
    }
    return fitness
  }

  return genetic
}
