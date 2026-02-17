import { apiClient } from '@/shared/api/client'
import type { Instrument } from '@/shared/types/profile'

export interface InstrumentsResponse {
  items: Instrument[]
}

export const instrumentsApi = {
  list: async (): Promise<InstrumentsResponse> => {
    const response = await apiClient.get<InstrumentsResponse>('/instruments')
    return response.data
  },
  setMyInstruments: async (
    instrumentIds: number[],
  ): Promise<InstrumentsResponse> => {
    const response = await apiClient.put<InstrumentsResponse>('/me/instruments', {
      instrumentIds,
    })
    return response.data
  },
}
