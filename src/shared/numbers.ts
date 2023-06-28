import {
  create, chainDependencies, fractionDependencies,
  equalDependencies,
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  formatDependencies,
  randomDependencies,
  floorDependencies,
} from 'mathjs';

export const {
  fraction, add, subtract, multiply, divide, format, chain, equal, random, floor,
} = create({
  fractionDependencies,
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  formatDependencies,
  chainDependencies,
  equalDependencies,
  randomDependencies,
  floorDependencies,
}, { epsilon: 0.01 });

export function percent(number: number) {
  return Intl.NumberFormat('en-us', { style: 'percent', maximumSignificantDigits: 4 }).format(number);
}
