export const NODE_ENV = process.env.NODE_ENV || 'dev'
export const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

export * as DB from './database'
