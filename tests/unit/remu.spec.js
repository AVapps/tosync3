import * as RemuPNT from '@/lib/Remu/RemuPNT'
import data from './data.json'

test('test RemuPNT', () => {
  const remuRotation1 = RemuPNT.remuRotation(data[0])
  console.log(remuRotation1)
  expect(remuRotation1.countVol).toBe(2)
  expect(remuRotation1.countMEP).toBe(0)
  expect(remuRotation1.H2AF).toBe(4.4)
  expect(remuRotation1.H2rAF).toBe(4.75)
})
