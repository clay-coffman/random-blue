import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const generate = customAlphabet(alphabet, 16);

export type IdPrefix =
  | 'fp'
  | 'co'
  | 'r'
  | 'rec'
  | 'bos'
  | 'inv'
  | 'aiv'
  | 'ss'
  | 'sad'
  | 'sc'
  | 'irq';

export const newId = (prefix: IdPrefix) => `${prefix}_${generate()}`;
