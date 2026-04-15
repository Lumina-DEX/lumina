"use client"
import type { SupportedNetwork } from "@lumina-dex/sdk"
import { archiveUrls, networks } from "@lumina-dex/sdk"
import { useState } from "react"

const exportableNetworks = networks.filter(
	(n) => archiveUrls[n as SupportedNetwork] !== "NOT_IMPLEMENTED"
) as SupportedNetwork[]

function triggerDownload(payload: object[], network: SupportedNetwork) {
	const filename = `lumina-${network.replace(":", "-")}-${Date.now()}.json`
	const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement("a")
	anchor.href = url
	anchor.download = filename
	anchor.click()
	URL.revokeObjectURL(url)
	return filename
}

const Stat = () => {
	const [loading, setLoading] = useState(false)
	const [activeNetwork, setActiveNetwork] = useState<SupportedNetwork | null>(null)
	const [logs, setLogs] = useState<string[]>([])

	const pushLog = (msg: string) => setLogs((prev) => [...prev.slice(-50), msg])

	const handleExport = async (network: SupportedNetwork) => {
		setLoading(true)
		setActiveNetwork(network)
		setLogs([])

		try {
			const response = await fetch("/api/stat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ network })
			})

			if (!response.ok || !response.body) {
				throw new Error(`HTTP ${response.status}`)
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ""

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split("\n")
				buffer = lines.pop() ?? "" // keep incomplete last line

				for (const line of lines) {
					if (!line.trim()) continue
					const event = JSON.parse(line)

					if (event.type === "log") {
						pushLog(event.payload)
					} else if (event.type === "data") {
						const filename = triggerDownload(event.payload, network)
						pushLog(`✅ Done — exported to "${filename}".`)
					} else if (event.type === "error") {
						pushLog(`❌ Error: ${event.payload}`)
					}
				}
			}
		} catch (err) {
			pushLog(`❌ Error: ${String(err)}`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div
			className="flex flex-col min-w-[360px] w-screen max-w-[600px] p-5 gap-3 rounded"
			style={{ backgroundColor: "rgb(255, 245, 240)" }}
		>
			{exportableNetworks.map((network) => (
				<button
					key={network}
					onClick={() => handleExport(network)}
					disabled={loading}
					className="w-full bg-cyan-600 text-lg text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading && activeNetwork === network ? "Exporting…" : `Export ${network}`}
				</button>
			))}

			{logs.length > 0 && (
				<div className="mt-2 bg-gray-900 text-green-300 text-xs font-mono rounded p-3 max-h-52 overflow-y-auto whitespace-pre-wrap">
					{logs.join("\n")}
				</div>
			)}
		</div>
	)
}

export default Stat
