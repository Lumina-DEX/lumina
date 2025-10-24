import React from "react"

export const AppContext = React.createContext({
	darkMode: true,
	setDarkMode: (darkMode: boolean) => {}
})
