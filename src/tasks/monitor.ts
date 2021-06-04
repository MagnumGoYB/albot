import schedule from 'node-schedule'
import Subscription from '../database/models/subscription'
import { Wechaty } from 'wechaty'

export default async function monitor(bot: Wechaty) {
  let invoked = false
  schedule.scheduleJob('30 * * * * *', async () => {
    if (invoked) return
    console.log(`Monitor schedule start at: ${new Date()}`)
    invoked = true
    const ls = await Subscription.find({
      isValid: true,
      remainingTimes: { $gt: 0 }
    }).populate('ticker')
    console.time('Broadcast to users total time using')
    ls.forEach(async (item) => {
      const contact = await bot.Contact.find({ alias: item.userId })
      if (contact) {
        let cut = false
        if (item.formula === 'gt' && item.ticker.value > item.triggerValue) {
          await contact.say(
            `${item.ticker.name} (${item.ticker.symbol})\n3分钟内价格已高于 ${item.triggerValue} USD\n报价时间：${item.ticker.lastUpdatedTime}`
          )
          cut = true
        } else if (
          item.formula === 'lt' &&
          item.ticker.value < item.triggerValue
        ) {
          await contact.say(
            `${item.ticker.name} (${item.ticker.symbol})\n3分钟内价格已低于 ${item.triggerValue} USD\n报价时间：${item.ticker.lastUpdatedTime}`
          )
          cut = true
        }

        if (cut) {
          const remainingTimes = item.remainingTimes - 1
          await Subscription.findByIdAndUpdate(item._id, {
            isValid: remainingTimes !== 0,
            remainingTimes
          })
        }
      }
    })
    console.timeEnd('Broadcast to users total time using')
    invoked = false
  })
}
