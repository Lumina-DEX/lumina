// Importing 'crypto' module
// import crypto from 'crypto';

export const fetchFiles = async () => {
	let currentLocation = self.location.origin
	var headers = new Headers()
	headers.append("Content-Encoding", "br, gzip, deflate")

	// we don't load pk key on the frontend
	const filter = (x: string) => {
		return x.indexOf("-pk-") === -1 && x.indexOf(".header") === -1
	}

	const filesResponse = await fetch(`${currentLocation}/compiled.json`, { headers })
	const json = await filesResponse.json()
	return Promise.all(
		json.filter(filter).map((file) => {
			return Promise.all([
				fetch(`${currentLocation}/cache/${file}.txt`, {
					cache: "force-cache",
					headers
				}).then((res) => res.arrayBuffer())
			]).then(([data]) => ({ file, data }))
		})
	).then((cacheList) =>
		cacheList.reduce((acc: any, { file, data }) => {
			acc[file] = { file, data }

			return acc
		}, {})
	)
}

export const readCache = (files: any): any => ({
	read({ persistentId, uniqueId, dataType }: any) {
		// read current uniqueId, return data if it matches
		if (!files[persistentId]) {
			console.log("not found : ", persistentId)
			return undefined
		}

		console.log("load : ", persistentId)

		if (dataType === "string") {
			const data = files[persistentId].data
			// const hash = crypto.createHash('sha1').update(data).digest('hex');
			// console.log(persistentId + " hash", hash);
			return data
		} else {
			const data = files[persistentId].data
			// const hash = crypto.createHash('sha1').update(data).digest('hex');
			// console.log(persistentId + " hash", hash);
			return data
		}
		console.log("data type not string : ", persistentId)
		return undefined
	},
	write({ persistentId, uniqueId, dataType }: any, data: any) {
		console.log("write")
		console.log({ persistentId, uniqueId, dataType })
	},
	canWrite: false
})

export const readCache2 = async (): Promise<any> => ({
	async read({ persistentId, uniqueId, dataType }: any) {
		let currentLocation = self.location.origin

		if (persistentId.indexOf("-pk-") > -1) {
			return undefined
		}

		// read current uniqueId, return data if it matches
		let currentId = await fetch(`${currentLocation}/cache/${persistentId}.txt`, {
			cache: "force-cache"
		})
		if (!currentId) {
			console.log("not found : ", persistentId)
			return undefined
		}

		console.log("load : ", persistentId)

		if (dataType === "string") {
			const data = currentId.arrayBuffer()
			// const hash = crypto.createHash('sha1').update(data).digest('hex');
			// console.log(persistentId + " hash", hash);
			return data
		} else {
			const data = currentId.arrayBuffer()
			// const hash = crypto.createHash('sha1').update(data).digest('hex');
			// console.log(persistentId + " hash", hash);
			return data
		}
		console.log("data type not string : ", persistentId)
		return undefined
	},
	write({ persistentId, uniqueId, dataType }: any, data: any) {
		console.log("write")
		console.log({ persistentId, uniqueId, dataType })
	},
	canWrite: false
})
