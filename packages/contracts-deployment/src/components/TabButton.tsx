"use client"
import React, { useEffect, useMemo, useState } from "react"

// @ts-ignore
const TabButton = ({ name, tab, setTab }) => {
	return (
		<button
			style={{ color: tab === name ? "blue" : "black" }}
			className="text-lg text-black p-1 capitalize"
			onClick={() => setTab(name)}
		>
			{name}
		</button>
	)
}

export default TabButton
