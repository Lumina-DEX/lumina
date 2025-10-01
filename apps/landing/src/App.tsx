import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import PrivacyPage from "./pages/PrivacyPage"
// import DisclaimersPage from "./pages/DisclaimersPage";
import SplashPage from "./pages/SplashPage"
import Header from "./components/Header"
import { useEffect, useState } from "react"
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import "./App.css"
import HoloImg from "./assets/backgrounds/holo.png"
import SpinnerImg from "./assets/images/spinner.svg"

function Landing() {
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
				<>
					<Router>
						<Layout>
							<Routes>
								<Route path="/" element={<HomePage />} />
								<Route path="/aaa" element={<SplashPage />} />
							</Routes>
						</Layout>
					</Router>
				</>
			) : (
				<div className="flex h-screen w-full justify-center items-center">
					<img src={SpinnerImg} alt="" />
				</div>
			)}
		</div>
	)
}

function Privacy() {
	return (
		<div className="App bg-primary flex flex-col min-h-screen">
			<Router>
				<Layout>
					<Routes>
						{/* <Route path="/" element={<DisclaimersPage />} /> */}
						<Route path="/privacy-policy" element={<PrivacyPage />} />
					</Routes>
				</Layout>
			</Router>
		</div>
	)
}

function Splash() {
	return (
		<Router>
			<SplashPage />
		</Router>
	)
}

function SignUp() {
	return (
		<div className="w-screen h-screen">
			<Router>
				<Routes>
					<Route path="/" element={<Header />} />
				</Routes>
			</Router>
			<iframe
				className="block mx-auto max-w-full pt-16"
				title="Lumina Signup"
				width="100%"
				height="100%"
				src="https://5ee5af98.sibforms.com/serve/MUIFAFnJk1dGi9MIoIWEIXN_0u0BlTcO2kfbjQwZPN_7LbCAqa_g-R-BbzUtXKAuMRy2yWGqTUgUopFoWyfSK_JT1WDWGfk_uyLmWmkh5hgQ8BWOWmOry4j_h_dl144vs76TbJ9HjKhDWrDW50Bajy4JRRExaYxG7R_jTRIz4OBUj2xg0RJH9N77wZtHTsB-zLRanK9oSvs_4zx_"
				allowFullScreen
			></iframe>
		</div>
	)
}

function Contact() {
	return (
		<div className="w-screen h-screen">
			<iframe
				className="block mx-auto max-w-full"
				title="Lumina Contact"
				width="100%"
				height="100%"
				src="https://5ee5af98.sibforms.com/serve/MUIFAPDRmzxHJyaOtltyLdKJMhQXPYo3ZAMc3N2M2gkPdLb_8EIIE9kspJXyvV3iNNkIxIpOsaAv6hIRAi7iCmBTEv_u69T21nL3Q03M5FuLcp4P9kcgYCG0esHBnDW_b2s4azIIj88xUD2t9KBnxi_b2Gh9lMjQNPhh0D9gFd11jDkJTfrwFiBA_IA4DKlhFHKeSkkFQzViH6HU"
				allowFullScreen
			></iframe>
		</div>
	)
}

function App() {
	const host = window.location.host
	const subDomain = host.replace(".luminadex.com", "")
	if (subDomain === "signup") {
		return <SignUp />
	} else if (subDomain === "contact") {
		return <Contact />
	} else if (subDomain === "disclaimers") {
		return <Privacy />
	} else if (subDomain === "getstarted") {
		return <Splash />
	}
	return <Landing />
}

export default App
