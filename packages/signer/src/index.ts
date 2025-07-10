import cors from "cors"
import dotenv from "dotenv"
import { drizzle } from "drizzle-orm/libsql"
import express, { type Request, type Response } from "express"
import path from "path"
import { fileURLToPath } from "url"
import { addJobs } from "./queue.js"

// configures dotenv to work in your application
dotenv.config()
const app = express()

var corsOptions = {
	origin: "*",
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const db = drizzle(process.env.DB_FILE_NAME!)

const PORT = process.env.PORT

// we preload contract
const concurrency = process.env.CONCURRENCY
const nbProcess = concurrency ? Number.parseInt(concurrency) : 1
console.log("concurrency", concurrency)

for (let index = 0; index < nbProcess; index++) {
	await addJobs({ onlyCompile: true })
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fullPath = path.join(__dirname, "public")

app.get("/", (request: Request, response: Response) => {
	response.status(200).send("Hello World")
})

app.use("/pool", express.static(fullPath))

app.post("/create-pool", async (request: Request, response: Response) => {
	const formData = request.body

	console.log("request data", formData)

	console.time("total")
	const start = Date.now()
	const ret = await addJobs(formData)
	const time = Date.now() - start
	console.timeEnd("total")

	response.status(200).send(JSON.stringify({ msg: "create pool", time: time, result: ret }))
})

app
	.listen(PORT, () => {
		console.log("Server running at PORT: ", PORT)
	})
	.on("error", (error) => {
		// gracefully handle error
		throw new Error(error.message)
	})
