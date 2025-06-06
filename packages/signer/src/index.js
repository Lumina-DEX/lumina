"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
var express_1 = require("express")
var dotenv_1 = require("dotenv")
// configures dotenv to work in your application
dotenv_1.default.config()
var app = (0, express_1.default)()
var PORT = process.env.PORT
app.get("/", function (request, response) {
	response.status(200).send("Hello World")
})
app
	.listen(PORT, function () {
		console.log("Server running at PORT: ", PORT)
	})
	.on("error", function (error) {
		// gracefully handle error
		throw new Error(error.message)
	})
