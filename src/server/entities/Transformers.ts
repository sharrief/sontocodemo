import { ValueTransformer } from 'typeorm';

export const stringToNumberTransformer: ValueTransformer = {
  from: (dbValue: string) => parseFloat(dbValue),
  to: (entityValue: number) => `${entityValue}`,
};

const isNullOrUndefined = <T>(obj: T | null | undefined): obj is null | undefined => typeof obj === 'undefined' || obj === null;

export const dateTransformer: ValueTransformer = {
  from: (dbValue: Date) => {
    if (isNullOrUndefined(dbValue)) return dbValue;
    return (new Date(dbValue)).getTime();
  },
  to: (entityValue: number) => {
    if (isNullOrUndefined(entityValue)) return entityValue;
    return new Date(entityValue);
  },
};

export const numberToBooleanTransformer: ValueTransformer = {
  from: (dbValue: number) => (dbValue != null ? !!dbValue : dbValue),
  to: (entityValue: boolean) => {
    if (entityValue == null) return entityValue;
    return (entityValue ? 1 : 0);
  },
};

export const currencyTransformer: ValueTransformer = {
  from: (dbValue: string) => {
    if (dbValue == null) return dbValue;
    return Math.floor(100 * parseFloat(dbValue)) / 100;
  },
  to: (entityValue: number) => {
    if (entityValue == null) return entityValue;
    return `${entityValue}`;
  },
};

export const enumArrayTransformer: ValueTransformer = {
  from: function from<T extends number>(dbValue: string): T[] { return dbValue?.split(',').map((val) => Number(val) as T); },
  to: function to<T extends number>(entityValue: T[]): string { return entityValue?.join(','); },
};
