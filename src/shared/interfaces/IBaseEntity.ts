export interface IBaseEntityRecord {
  id: number;
}
export type FieldNames<T> = {[key in keyof T]: string}
type Enum = {[x: string]: string|number}
type EnumValueArray = (string|number)[]
export type BaseEntityProperty = number|string|boolean|{}|{}[]|Enum|EnumValueArray;
