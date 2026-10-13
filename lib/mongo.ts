import { MongoClient, type Db } from "mongodb"

let databasePromise: Promise<Db> | undefined

export function getMongoUri() {
  return process.env.MONGODB_URI
}

export function getDb(): Promise<Db> {
  if (!databasePromise) {
    databasePromise = connect()
    databasePromise.catch(() => {
      databasePromise = undefined
    })
  }
  return databasePromise
}

async function connect(): Promise<Db> {
  const uri = getMongoUri()
  if (!uri) {
    throw new Error("MONGODB_URI is required. Configure a persistent MongoDB connection in .env.local.")
  }

  const mongoClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  })

  try {
    await mongoClient.connect()
    return mongoClient.db(process.env.MONGODB_DB || "no_due_db")
  } catch (error) {
    try {
      await mongoClient.close()
    } catch (closeError) {
      console.error("Unable to close a failed MongoDB connection.", closeError)
    }
    throw new Error("Unable to connect to the configured MongoDB server. Check that it is running and reachable.", {
      cause: error,
    })
  }
}
