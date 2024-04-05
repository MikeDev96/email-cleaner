import { ImapFlow, SearchObject } from "imapflow"
import { BlacklistEntry } from "./types/BlacklistEntry"
import { insertBlacklistMany, queryBlacklist } from "./db"

export const checkEmailCleanerMailbox = async (client: ImapFlow) => {
  const lock = await client.getMailboxLock("Email Cleaner")
  
  try {
    const blacklistMsgs: BlacklistEntry[] = []

    for await (let msg of client.fetch("1:*", { envelope: true })) {
      for (const from of msg.envelope.from ?? []) {
        console.log(`[EMAIL CLEANER] Marking [${msg.envelope.subject}] from [${from.name}] [${from.address}] to be blacklisted`)
        blacklistMsgs.push({ fromAddress: from.address, fromName: from.name, subject: msg.envelope.subject, uid: msg.uid.toString() })
      }
    }

    if (blacklistMsgs.length) {
      console.log(`[EMAIL CLEANER] Adding ${blacklistMsgs.length} messages to the blacklist`)
      insertBlacklistMany(blacklistMsgs)

      console.log(`[EMAIL CLEANER] Deleting ${blacklistMsgs.length} messages`)
      await client.messageDelete({ or: blacklistMsgs.map(msg => ({ uid: msg.uid.toString() })) })
    }
  }
  finally {
    lock.release()
  }
}

export const checkJunkMailbox = async (client: ImapFlow, patterns: RegExp[]) => {
  const lock = await client.getMailboxLock("Junk")
  
  try {
    const deleteMsgs: SearchObject[] = []

    for await (let msg of client.fetch("1:*", { envelope: true })) {
      for (const from of msg.envelope.from) {
        const isBlacklisted = (queryBlacklist.get({ fromAddress: from.address, fromName: from.name, subject: msg.envelope.subject, uid: "" }) as { exist: number }).exist
        if (isBlacklisted) {
          deleteMsgs.push({ uid: msg.uid.toString() })
          console.log(`[JUNK] Marking [${msg.envelope.subject}] from [${from.name}] [${from.address}] for deletion as it is blacklisted`)
        }
        else {
          for (const pattern of patterns) {
            if (!from.address) continue
            if (!pattern.test(from.address)) continue

            deleteMsgs.push({ uid: msg.uid.toString() })
            console.log(`[JUNK] Marking [${msg.envelope.subject}] from [${from.name}] [${from.address}] for deletion as it matched pattern ${pattern}`)
          }
        }
      }
    }

    if (deleteMsgs.length) {
      console.log(`[JUNK] Deleting ${deleteMsgs.length} messages`)
      await client.messageDelete({ or: deleteMsgs })
    }
  }
  finally {
    lock.release()
  }
}