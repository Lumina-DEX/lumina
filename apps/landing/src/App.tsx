import { useEffect, useState } from "react"
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import PrivacyPage from "./pages/PrivacyPage"
import "./App.css"
import HoloImg from "./assets/backgrounds/holo.png"
import SpinnerImg from "./assets/images/spinner.svg"

function App() {
	const [imageLoaded, setImageLoaded] = useState(false)

	useEffect(() => {
		const image = new Image()
		image.src = HoloImg
		image.onload = () => {
			setImageLoaded(true)
		}
	}, [])

	return (
		<div className={`App flex flex-col min-h-screen ${imageLoaded && "bg-primary"}`}>
			{imageLoaded ? (
				<Router>
					<Layout>
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/privacy-policy" element={<PrivacyPage />} />
						</Routes>
					</Layout>
				</Router>
			) : (
				<div className="flex h-screen w-full justify-center items-center">
					<img src={SpinnerImg} alt="" />
				</div>
			)}
		</div>
	)
}

export default App
