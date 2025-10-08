/**
 * Parse a single line of SSE data
 */
async function* parseLine(line: string) {
	if (line.startsWith("data: ")) {
		const data = line.slice(6).trim()
		if (data && data !== "[object Object]") {
			try {
				yield JSON.parse(data)
			} catch {}
		}
	}
}

/**
 * Parse SSE stream as an async generator - yields parsed events as they arrive
 */
async function* parseSSEStream(response: Response) {
	const reader = response.body?.getReader()
	if (!reader) return

	const decoder = new TextDecoder()
	const buffer: string[] = []

	try {
		while (true) {
			const { value, done } = await reader.read()
			if (done) break

			const text = decoder.decode(value, { stream: true })
			const lines = text.split("\n")

			if (buffer.length > 0) {
				lines[0] = buffer.pop() + lines[0]
			}

			const incompleteLine = lines.pop()
			if (incompleteLine) buffer.push(incompleteLine)

			for (const line of lines) yield* parseLine(line)
		}

		if (buffer.length > 0) yield* parseLine(buffer.join(""))
	} finally {
		reader.releaseLock()
		reader.cancel()
	}
}

/**
 * Read SSE stream and extract the first GraphQL subscription result matching the field name
 */
export async function readSSEStream<T>(response: Response, fieldName: string): Promise<T | null> {
	for await (const event of parseSSEStream(response)) {
		if (event.data?.[fieldName]) return event.data[fieldName] as T
	}
	return null
}

/**
 * Check if SSE stream contains a specific error message
 */
export async function streamContainsError(response: Response, errorText: string): Promise<boolean> {
	for await (const event of parseSSEStream(response)) {
		const eventString = JSON.stringify(event)
		if (eventString.includes(errorText)) return true
	}
	return false
}
