import { mockService } from './mock/mockService'
import { httpService } from './http/httpService'

const USE_MOCK = false
export const api = USE_MOCK ? mockService : httpService
