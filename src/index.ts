import { ImapFlow } from "imapflow"
import dotenv from "dotenv"
import { Cron } from "croner"
import { checkEmailCleanerMailbox, checkJunkMailbox } from "./jobs"
import { DateTime } from "luxon"
import { parse } from "yaml"
import { readFileSync } from "fs"

dotenv.config()

const config = parse(readFileSync("./config.yaml", "utf8"))
const patterns = (config?.patterns as string[] ?? []).map(p => new RegExp(p))

const init = async () => {
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
  
  const job = async () => {
    console.log(`Running Email Cleaner CRON job at ${DateTime.local().toISO({ suppressMilliseconds: true, includeOffset: false })}`)
    console.log(process.env.EMAIL, process.env.PASS)
  
    await checkJunkMailbox(client, patterns)
    await checkEmailCleanerMailbox(client)
    // await client.logout()
  }
  
  //job()
  Cron("*/30 * * * *", job)
}

init()