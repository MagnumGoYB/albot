import { Wechaty, log, Message, ScanStatus } from 'wechaty'
import QrcodeTerminal from 'qrcode-terminal'
import syncTickers from './tasks/sync-tickers'
import monitor from './tasks/monitor'
import Ticker from './database/models/ticker'
import Subscription, {
  SubscriptionDocument
} from './database/models/subscription'
import unescape from 'lodash/unescape'
import escape from 'lodash/escape'
import User from './database/models/user'

const bot = new Wechaty({
  name: 'albot',
  puppet: 'wechaty-puppet-wechat'
})

let botName: string

bot
  .on('login', async (user) => {
    botName = user.name()
    log.info('Bot', `${user.name()} login`)
    onLogin()
    syncTickers()
    monitor(bot)
  })
  .on('logout', (user) => log.info('Bot', `${user.name()} logout`))
  .on('error', (error) => log.error('Bot', 'Error: %s', error))
  .on('scan', (qrcode, status) => {
    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode)
    ].join('')

    log.info(
      'Bot',
      `onScan: ${ScanStatus[status]}(${status}) - ${qrcodeImageUrl}`
    )

    QrcodeTerminal.generate(qrcode, { small: true })
  })
  .on('message', onMessage)
  .on('stop', () => process.exit(-1))
  .on('friendship', async (friendship) => {
    switch (friendship.type()) {
      case bot.Friendship.Type.Receive:
        await friendship.accept()
        break
    }
  })
bot.start().catch(async (error) => {
  log.error('Bot', 'Startup error: %s', error)
  await bot.stop()
  process.exit(-1)
})

async function onLogin() {
  const SLEEP = 7
  log.info('Bot', 'Re-dump contact after %d second... ', SLEEP)
  setTimeout(onlineNotify, SLEEP * 1000)
}

async function onMessage(msg: Message) {
  if (msg.age() > 120 || Message.Type.Text !== msg.type()) return
  const text = msg.text()
  const contact = msg.talker()
  const toContact = msg.to()
  if (toContact) {
    const name = toContact.name()
    if (name === botName) {
      let userId = ''
      const alias = await contact.alias()
      if (alias === null) {
        const user = await new User({
          name: contact.name()
        }).save()
        try {
          await contact.alias(user._id)
          userId = user._id
        } catch (error) {}
      } else {
        userId = alias
      }
      const textContent = unescape(text.trim())

      // #1 查询币种价格
      // -> eth
      // -> bitcoin
      if (/^[A-Za-z]+$/.test(textContent)) {
        const ticker = await Ticker.findOne({
          isValid: true,
          keyword: { $in: [textContent.toLowerCase()] }
        })
        if (ticker) {
          await contact.say(
            `${ticker.name} (${ticker.symbol})\n当前价格: ${ticker.value} USD\n更新时间: ${ticker.lastUpdatedTime}`
          )
        }
        return
      }

      // #2 订阅价格预警
      // -> +eth>2000 (添加订阅)
      // -> -eth>2000 (移除已有订阅)
      if (
        /^[+,-][a-zA-Z]+[>,<](0|[1-9][0-9]*)(.[0-9]{1,15})?$/.test(textContent)
      ) {
        const event = textContent.match(/^[+,-]/)?.toString()
        const keyword = textContent.match(/[a-zA-Z]+/)?.toString()
        const formulaSymbol = textContent.match(/[>,<]/)?.toString()
        let formula = ''
        switch (formulaSymbol) {
          case '>':
            formula = 'gt'
            break
          case '<':
            formula = 'lt'
            break
        }
        const value = textContent
          .match(/(0|[1-9][0-9]*)(.[0-9]{1,15})?$/)
          ?.toString()
          .split(',')[0]
        const triggerValue = Number(value)
        if (
          event &&
          keyword &&
          (formula === 'gt' || formula === 'lt') &&
          triggerValue > 0
        ) {
          const ticker = await Ticker.findOne({
            isValid: true,
            keyword: { $in: [keyword.toLowerCase()] }
          })
          if (!ticker) {
            await contact.say('抱歉，找不到该币种')
            return
          }
          if (event === '+') {
            // 每人不能超出5条订阅信息
            const count = await Subscription.countDocuments({
              isValid: true,
              userId
            })
            if (count >= 5) {
              await contact.say('当前订阅条数超限，请删除已有订阅之后再试')
              return
            }
            const sub = await Subscription.findOne({
              isValid: true,
              ticker: ticker._id,
              userId,
              formula,
              triggerValue
            })
            if (sub) {
              await contact.say(
                `已订阅 ${ticker.name} (${ticker.symbol}) 价格预警\n触发价格：${formulaSymbol} ${triggerValue} USD`
              )
              return
            }
            try {
              await new Subscription({
                ticker: ticker._id,
                userId,
                formula,
                triggerValue
              } as SubscriptionDocument).save()
              await contact.say(
                `订阅成功！\n触发价格：${ticker.symbol} ${formulaSymbol} ${triggerValue} USD`
              )
            } catch (error) {
              console.error(error)
            }
          } else if (event === '-') {
            const sub = await Subscription.findOne({
              isValid: true,
              ticker: ticker._id,
              userId,
              formula,
              triggerValue
            })

            if (!sub) {
              await contact.say(
                `找不到该订阅信息：${ticker.name} (${ticker.symbol}) ${formulaSymbol} ${triggerValue} USD`
              )
              return
            }

            try {
              await Subscription.findByIdAndUpdate(sub._id, { isValid: false })
              await contact.say(
                `已删除订阅：${ticker.name} (${ticker.symbol}) ${formulaSymbol} ${triggerValue} USD`
              )
            } catch (error) {
              console.error(error)
            }
          }
        }
      }

      // #3 获取已订阅列表
      // -> 查询 || 订阅列表 || 查询订阅 || 查询订阅列表
      if (
        textContent === '查询' ||
        textContent === '订阅列表' ||
        textContent === '查询订阅' ||
        textContent === '查询订阅列表'
      ) {
        const ls = await Subscription.find({
          isValid: true,
          userId
        })
          .sort('-createdAt')
          .populate('ticker')

        if (ls.length === 0) {
          await contact.say('暂无订阅信息')
          return
        }

        let say = ''
        ls.forEach((item, index) => {
          let formula = ''
          switch (item.formula) {
            case 'gt':
              formula = '>'
              break
            case 'lt':
              formula = '<'
              break
          }
          const seq = index + 1
          say += `${seq}. ${item.ticker.name} (${item.ticker.symbol}) ${escape(
            formula
          )} ${item.triggerValue} USD${seq !== ls.length ? '\n' : ''}`
        })
        await contact.say(say)
      }

      // #4 使用说明
      // -> 帮助
      if (textContent === '帮助') {
        await contact.say(
          '1.查询币种价格\n输入币种名称或符号，如：eth、bitcoin'
        )
        await contact.say(
          '2.订阅价格预警\n新增订阅方式：输入 + (币种符号) > 或 < (触发价格)，如：+eth>3000、+eth<1000\n删除已订阅方式：输入 - (币种符号) > 或 < (触发价格)，如：-eth>3000、-eth<1000'
        )
        await contact.say('3.获取已订阅列表\n输入关键字：查询、订阅列表')
      }
    }
    console.log(`toContact: ${name} Contact: ${contact?.name()} Text: ${text}`)
  }
}

async function onlineNotify() {
  const contactList = await bot.Contact.findAll()
  log.info('Bot', 'Contact number: %d\n', contactList.length)

  const tickersCount = await Ticker.countDocuments({ isValid: true })

  // 通知已上线
  contactList.forEach(async (contact) => {
    if (contact.type() === undefined && contact.name() && contact.friend()) {
      await contact.say(
        `${botName} 已上线\n\n当前版本：${process.env.npm_package_version}\n收录币种数量：${tickersCount}\n\n- 赠人⭐️ 手有余香\n- 项目地址：https://github.com/MagnumGoYB/albot\n\n回复“帮助”获取使用说明~`
      )
    }
  })
}
