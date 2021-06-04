import cp from 'child_process'
import path from 'path'
import schedule from 'node-schedule'
import { TickerItemType } from '../scripts/get-tickers-run'
import Ticker, { TickerDocument } from '../database/models/ticker'
import dayjs from 'dayjs'

export default function syncTickers() {
  let invoked = false
  schedule.scheduleJob(
    {
      minute: [
        0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54,
        57
      ]
    },
    () => {
      if (invoked) return
      console.log(`Sync-Tickers schedule start at: ${new Date()}`)
      const script = path.resolve(__dirname, '../scripts/get-tickers-run')
      const child = cp.fork(script, [])
      if (child.connected) invoked = true
      child.on('error', (err) => console.error(err))
      child.on('exit', (code) => {
        console.log(`Child process has exited by code: [${code}]`)
        invoked = false
      })
      child.on('message', async (data: TickerItemType[]) => {
        if (Array.isArray(data)) {
          let syncedCount = 0
          console.time('Sync to db total time using')
          for (const item of data) {
            if (
              !item.id ||
              !item.symbol ||
              (item.availableSupply === 0 &&
                item.totalSupply === 0 &&
                item.volume24hUsd === 0)
            ) {
              console.log(`Removed ${item.name}`)
              continue
            }
            try {
              const ticker = await Ticker.findOne({
                isValid: true,
                source: item.id
              })

              if (!ticker) {
                await new Ticker({
                  name: item.name,
                  symbol: item.symbol,
                  value: item.priceUsd,
                  source: item.id,
                  keyword: [item.name.toLowerCase(), item.symbol.toLowerCase()],
                  lastUpdatedTime: dayjs(item.lastUpdated * 1000).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )
                } as TickerDocument).save()
              } else {
                await Ticker.findByIdAndUpdate(ticker._id, {
                  value: item.priceUsd,
                  lastUpdatedTime: dayjs(item.lastUpdated * 1000).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )
                })
              }
              syncedCount++
            } catch (error) {
              console.error(error)
            }
          }
          console.timeEnd('Sync to db total time using')
          console.log(`Synced ${syncedCount} total items`)
        }
      })
    }
  )
}
