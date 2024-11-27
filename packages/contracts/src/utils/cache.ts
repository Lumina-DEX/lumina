import fs from "fs/promises"
import {
  AccountUpdate,
  Bool,
  Cache,
  fetchAccount,
  Field,
  Mina,
  NetworkId,
  PrivateKey,
  PublicKey,
  SmartContract,
  UInt64,
  UInt8,
} from "o1js"
import path from "path"
import readline from "readline/promises"
import { Faucet, FungibleToken, FungibleTokenAdmin, mulDiv, Pool, PoolFactory, PoolTokenHolder } from "../index.js"

// node build/src/cache.js

const cache = Cache.FileSystem("./cache")
for (let index = 0; index < 6; index++) {
  // compile 3 time to get all files
  await PoolFactory.compile({ cache })
  await Pool.compile({ cache })
  await FungibleToken.compile({ cache })
  await FungibleTokenAdmin.compile({ cache })
  await PoolTokenHolder.compile({ cache })
  await Faucet.compile({ cache })
}

const folder = await fs.readdir("./cache")

const filter = (x: string) => {
  return x.indexOf("-pk-") === -1 && x.indexOf(".header") === -1
}
// we will filter pk directly on the frontend
// const filter = (x: string) => { return x.indexOf('.header') === -1 };
const fileName = folder.filter(filter)
const json = JSON.stringify(fileName)

await fs.cp("./cache", "../website/public/cache", {
  recursive: true,
  filter: (source, _destination) => {
    return filter(source)
  },
})

const folderPath = "../website/public/cache"
let filesArr = await fs.readdir(folderPath)

// Loop through array and rename all files
filesArr.forEach(async (file) => {
  let fullPath = path.join(folderPath, file)
  let fileExtension = path.extname(file)
  let fileName = path.basename(file, fileExtension)

  // we use textfile to get browser compression
  let newFileName = fileName + ".txt"
  try {
    await fs.rename(fullPath, path.join(folderPath, newFileName))
  } catch (error) {
    console.error(error)
  }
})

await fs.writeFile("../website/public/compiled.json", json, "utf8")
