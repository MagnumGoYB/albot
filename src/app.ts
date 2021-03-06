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
import { getGitVersion } from './utils/version'

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
  try {
    const gitVersion = await getGitVersion()
    let lastVersion = gitVersion.trim().substr(1)
    if (!lastVersion) {
      throw new Error('Get git version error')
    }
    const lastVersionArray = lastVersion.match(/\d/g)
    if (!lastVersionArray) {
      throw new Error('Get git version error')
    }
    lastVersion = lastVersionArray.join('')

    let currentVersion = process.env.npm_package_version
    if (!currentVersion) {
      throw new Error('Get package version error')
    }
    const currentVersionArray = lastVersion.match(/\d/g)
    if (!currentVersionArray) {
      throw new Error('Get git version error')
    }
    currentVersion = currentVersionArray.join('')

    if (parseInt(lastVersion) > parseInt(currentVersion)) {
      // ??????????????????????????????????????????
      const SLEEP = 7
      log.info('Bot', 'Re-dump contact after %d second... ', SLEEP)
      setTimeout(onlineNotify, SLEEP * 1000)
    }
  } catch (err) {
    console.error(err)
  }
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

      // #1 ??????????????????
      // -> eth
      // -> bitcoin
      if (/^[A-Za-z]+$/.test(textContent)) {
        const ticker = await Ticker.findOne({
          isValid: true,
          keyword: { $in: [textContent.toLowerCase()] }
        })
        if (ticker) {
          await contact.say(
            `${ticker.name} (${ticker.symbol})\n????????????: ${ticker.value} USD\n????????????: ${ticker.lastUpdatedTime}`
          )
        }
        return
      }

      // #2 ??????????????????
      // -> +eth>2000 (????????????)
      // -> -eth>2000 (??????????????????)
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
            await contact.say('???????????????????????????')
            return
          }
          if (event === '+') {
            // ??????????????????5???????????????
            const count = await Subscription.countDocuments({
              isValid: true,
              userId
            })
            if (count >= 5) {
              await contact.say('????????????????????????????????????????????????????????????')
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
                `????????? ${ticker.name} (${ticker.symbol}) ????????????\n???????????????${formulaSymbol} ${triggerValue} USD`
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
                `???????????????\n???????????????${ticker.symbol} ${formulaSymbol} ${triggerValue} USD`
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
                `???????????????????????????${ticker.name} (${ticker.symbol}) ${formulaSymbol} ${triggerValue} USD`
              )
              return
            }

            try {
              await Subscription.findByIdAndUpdate(sub._id, { isValid: false })
              await contact.say(
                `??????????????????${ticker.name} (${ticker.symbol}) ${formulaSymbol} ${triggerValue} USD`
              )
            } catch (error) {
              console.error(error)
            }
          }
        }
      }

      // #3 ?????????????????????
      // -> ?????? || ???????????? || ???????????? || ??????????????????
      if (
        textContent === '??????' ||
        textContent === '????????????' ||
        textContent === '????????????' ||
        textContent === '??????????????????'
      ) {
        const ls = await Subscription.find({
          isValid: true,
          userId
        })
          .sort('-createdAt')
          .populate('ticker')

        if (ls.length === 0) {
          await contact.say('??????????????????')
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

      // #4 ????????????
      // -> ??????
      if (textContent === '??????') {
        await contact.say(
          '1.??????????????????\n????????????????????????????????????eth???bitcoin'
        )
        await contact.say(
          '2.??????????????????\n??????????????????????????? + (????????????) > ??? < (????????????)?????????+eth>3000???+eth<1000\n?????????????????????????????? - (????????????) > ??? < (????????????)?????????-eth>3000???-eth<1000'
        )
        await contact.say('3.?????????????????????\n???????????????????????????????????????')
      }
    }
    console.log(`toContact: ${name} Contact: ${contact?.name()} Text: ${text}`)
  }
}

async function onlineNotify() {
  const contactList = await bot.Contact.findAll()
  log.info('Bot', 'Contact number: %d\n', contactList.length)

  const tickersCount = await Ticker.countDocuments({ isValid: true })

  // ???????????????
  contactList.forEach(async (contact) => {
    if (contact.type() === undefined && contact.name() && contact.friend()) {
      await contact.say(
        `${botName} ?????????\n\n???????????????${process.env.npm_package_version}\n?????????????????????${tickersCount}\n\n- ???????????? ????????????\n- ???????????????https://github.com/MagnumGoYB/albot\n\n????????????????????????????????????~`
      )
    }
  })
}
