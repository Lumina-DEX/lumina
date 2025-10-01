import React, { useState } from "react"
import { AppContext } from "../../contexts/AppContext"
import { LoadingContext } from "../../contexts/LoadingContext"
import Header from "../Header"
import Footer from "../Footer"

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
	const [isLoading, setLoading] = useState(true)
	const [loadingMessage, setLoadingMessage] = useState("")
	const [darkMode, setDarkMode] = useState(true)

	return (
		<AppContext.Provider value={{ darkMode, setDarkMode }}>
			<LoadingContext.Provider value={{ isLoading, setLoading, loadingMessage, setLoadingMessage }}>
				<Header />
				{children}
				<Footer />
			</LoadingContext.Provider>
		</AppContext.Provider>
	)
}

export default Layout
