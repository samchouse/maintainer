export interface Util {
    name: string
    construct: () => unknown | Promise<unknown>
}
