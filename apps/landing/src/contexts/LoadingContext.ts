import React from "react"

export const LoadingContext = React.createContext({
	isLoading: false,
	setLoading: (loading: boolean) => {},
	loadingMessage: "",
	setLoadingMessage: (message: string) => {}
})
