import sleep from '../utils/sleep'
import request from '../utils/request'
import process from 'process'

interface FetchProps {
  limit: number
  start: number
}

export interface TickerItemType {
  id: string
  name: string
  symbol: string
  rank: number
  logo: string
  logoPng: string
  priceUsd: number
  priceBtc: number
  volume24hUsd: number
  marketCapUsd: number
  availableSupply: number
  totalSupply: number
  maxSupply: number
  percentChange1h: number
  percentChange24h: number
  percentChange7d: number
  lastUpdated: number
}

const url = 'https://fxhapi.feixiaohao.com/public/v1/ticker'
const items: TickerItemType[] = []

function fetch({ limit, start }: FetchProps) {
  console.log(`Fetch data from ${url}?limit=${limit}&start=${start}`)
  return request
    .get<TickerItemType[]>(`${url}?limit=${limit}&start=${start}`)
    .then((res) => res.data)
}

function fetchItems(limit: number) {
  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = 0
      let hasMore = true
      while (hasMore) {
        try {
          console.time('Fetched time using')
          const items = await fetch({
            limit,
            start: currentPage !== 0 ? limit * currentPage : 0
          })
          console.timeEnd('Fetched time using')
          console.log(`Fetched ${items.length} items`)
          yield items
          if (items.length < limit) hasMore = false
          currentPage++
        } catch (error) {
          console.error('There has been an error fetching all the items!')
          console.error(error)
        }
      }
    }
  }
}

;(async function () {
  try {
    console.time('Fetched total time using')
    for await (const pageItems of fetchItems(3000)) {
      pageItems.forEach((item) => items.push(item))
      // Wait for 0.05 seconds between requests
      await sleep(50)
    }
    console.timeEnd('Fetched total time using')
    console.log(`Fetched ${items.length} total items`)

    process.send?.(items)
  } catch (error) {
    console.error(error)
  }
})()
