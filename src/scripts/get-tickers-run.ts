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

const targetUrl = 'https://fxhapi.feixiaohao.com/public/v1/ticker'
const items: TickerItemType[] = []

function fetch({ limit, start }: FetchProps) {
  console.log(`Fetch data from ${targetUrl}?limit=${limit}&start=${start}`)
  return request
    .get<TickerItemType[]>(`${targetUrl}?limit=${limit}&start=${start}`, {
      // headers: {
      //   Connection: 'keep-alive',
      //   'Accept-Encoding': 'gzip, deflate, br',
      //   'User-Agent':
      //     'Mozilla/5.0 AppleWebKit/537.36 Chrome/91.0.4472.106 Safari/537.36'
      // }
    })
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
          // Wait for 3 seconds between requests
          console.log('Sleep...')
          console.time('Sleep')
          await sleep(3000)
          console.timeEnd('Sleep')
        } catch (error) {
          console.timeEnd('Fetched time using')
          console.error('There has been an error fetching all the items!')
          console.log('Sleep...')
          console.time('Sleep for error')
          // Wait for 10 seconds between requests
          await sleep(10000)
          console.timeEnd('Sleep for error')
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
    }
    console.timeEnd('Fetched total time using')
    console.log(`Fetched ${items.length} total items`)

    process.send?.(items)
  } catch (error) {
    console.error(error)
  }
})()
