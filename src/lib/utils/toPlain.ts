import { instanceToPlain } from 'class-transformer';

export function toPlain<T>(obj: T): any {
  return instanceToPlain(obj);
}

export function toPlainArray<T>(arr: T[]): any[] {
  return arr.map((x) => instanceToPlain(x));
}
