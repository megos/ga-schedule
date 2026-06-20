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
    for (let i = 0; i < this.userData.col * this.userData.row; i++) {
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

    const son = father.slice(0, Math.max(0, ca)) + mother.slice(ca, cb) + father.slice(cb)
    const daughter = mother.slice(0, Math.max(0, ca)) + father.slice(ca, cb) + mother.slice(cb)

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

  return genetic
}
