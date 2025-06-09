import express, { Request, Response } from "express"
import dotenv from "dotenv"
import cors from "cors"
import { addJobs } from "./proverBull"

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

const PORT = process.env.PORT

app.get("/", (request: Request, response: Response) => {
	response.status(200).send("Hello World")
})

app.post("/create-pool", async (request: Request, response: Response) => {
	const formData = request.body

	console.time("total")
	const ret = await addJobs(formData)
	const time = console.timeEnd("total")

	response.status(200).send(JSON.stringify({ msg: "create pool", result: ret, time: time }))
})

app
	.listen(PORT, () => {
		console.log("Server running at PORT: ", PORT)
	})
	.on("error", (error) => {
		// gracefully handle error
		throw new Error(error.message)
	})
