"use client"
import React, { useEffect, useMemo, useState } from "react"

// @ts-ignore
const Loading = () => {
	const [counter, setCounter] = React.useState(0)

	useEffect(() => {
		setTimeout(() => setCounter(counter + 1), 1000)
	}, [counter])

	return (
		<>
			<div className="spinner-content" title="Estimated time to create a transaction">
				<div id="divSpinner" className="spinner loading">
					<div className="loading-text">{counter ? counter : ""}</div>
				</div>
			</div>
		</>
	)
}

export default Loading
