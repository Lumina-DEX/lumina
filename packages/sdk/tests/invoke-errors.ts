// import { createActor, fromPromise, setup } from "xstate"

// type Input = { shouldThrow: "input" | "actor" | "onDone" | null }

// const myPromiseActor = fromPromise<string, Input>(
// 	({ input }) => {
// 		return new Promise((resolve, reject) => {
// 			if (input.shouldThrow === "actor") {
// 				console.error("Throwing error from within the actor's promise.")
// 				reject(new Error("Error from actor"))
// 			} else {
// 				resolve("Promise resolved")
// 			}
// 		})
// 	}
// )

// const promiseMachine = setup({
// 	types: {
// 		context: {} as Input,
// 		input: {} as Input,
// 		events: {} as { type: "error" }
// 	},
// 	actors: { myPromiseActor }
// }).createMachine({
// 	id: "promiseMachine",
// 	initial: "loading",
// 	context: ({ input }) => input,
// 	states: {
// 		loading: {
// 			on: { error: { target: "manualFailure" } },
// 			invoke: {
// 				src: "myPromiseActor",
// 				input: ({ context }) => {
// 					if (context.shouldThrow === "input") {
// 						console.error("Throwing error from input function.")
// 						throw new Error("Error from input function")
// 					}
// 					return context
// 				},
// 				onDone: {
// 					target: "success",
// 					actions: ({ context, self }) => {
// 						if (context.shouldThrow === "onDone") {
// 							console.error("Throwing error from within the onDone hook.")
// 							self.send({ type: "error" })
// 							throw new Error("Error from onDone hook")
// 						}
// 						console.log("onDone hook executed successfully.")
// 					}
// 				},
// 				onError: {
// 					target: "failure",
// 					actions: () => {
// 						console.error("Caught error")
// 					}
// 				}
// 			}
// 		},
// 		success: { type: "final" },
// 		manualFailure: { type: "final" },
// 		failure: { type: "final" }
// 	}
// })

// const actor = createActor(promiseMachine, { input: { shouldThrow: "onDone" } }).start()
// actor.subscribe({
// 	next: state => {
// 		console.log("Actor state:", state.value)
// 	},
// 	complete: () => {
// 		console.log("Actor has reached a final state.")
// 	},
// 	error: err => {
// 		console.error("Actor encountered an error:", actor.getSnapshot().value)
// 	}
// })
