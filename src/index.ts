import { ImapFlow } from "imapflow"
import dotenv from "dotenv"
import { Cron } from "croner"
import { checkEmailCleanerMailbox, checkJunkMailbox } from "./jobs"
import { DateTime } from "luxon"

dotenv.config()

const job = async () => {
  console.log(`Running Email Cleaner CRON job at ${DateTime.local().toISO({ suppressMilliseconds: true, includeOffset: false })}`)

  const client = new ImapFlow({
    host: "outlook.office365.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL ?? "",
      pass: process.env.PASS,
    },
    logger: false,
  })

  await client.connect()
  await checkJunkMailbox(client)
  await checkEmailCleanerMailbox(client)
  await client.logout()
}

// job()
Cron("*/30 * * * *", job)