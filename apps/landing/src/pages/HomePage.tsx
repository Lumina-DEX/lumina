import { Button } from "antd"
import { useEffect, useState } from "react"
import { FaHandshake } from "react-icons/fa"
import { GiWarPick } from "react-icons/gi"
import { Link } from "react-router-dom"

declare global {
	interface Window {
		sendinblue: any
	}
}

interface User {
	email: string
	firstName: string
	lastName: string
}

function HomePage() {
	const [windowWidth, setWindowWidth] = useState(1920)

	useEffect(() => {
		setWindowWidth(window.innerWidth)
		function handleResize() {
			setWindowWidth(window.innerWidth)
		}
		window.addEventListener("resize", handleResize)
	}, [])

	const trackRecord = (eventName: string, User: User) => {
		const properties = {
			email: User.email,
			FIRSTNAME: User.firstName,
			LASTNAME: User.lastName
		}
		const event_data = {
			name: eventName
		}

		window.sendinblue.track(eventName, properties, event_data)
	}

	const brevoTrack = (eventName: string) => {
		const visitor: User = {
			email: "client@luminadex.com",
			firstName: "client",
			lastName: "client"
		}
		switch (eventName) {
			case "litepaper":
				trackRecord(eventName, visitor)
				break
			case "signup":
				trackRecord(eventName, visitor)
				break
			default:
				break
		}
	}

	const StartBuilding = () => (
		<Link to={"https://sdk.luminadex.com"} target="_blank">
			<Button
				shape="round"
				size={"large"}
				className="font-bold bg-dark-purple text-white border-purple w-[11rem]"
				onClick={() => brevoTrack("signup")}
			>
				Start Building
			</Button>
		</Link>
	)

	const StartSwapping = () => (
		<Link to={"https://beta.luminadex.com"} target="_blank">
			<Button
				shape="round"
				size={"large"}
				onClick={() => brevoTrack("litepaper")}
				className="font-bold text-dark-purple border-purple bg-white w-[11rem]"
			>
				Start Swapping
			</Button>
		</Link>
	)

	return (
		<div className="w-full mt-16">
			{/* section1 */}
			<div className="flex flex-col justify-center">
				<div
					className="w-full flex justify-center items-center flex-row py-20 max-sm:py-10"
					style={{
						backgroundImage: "linear-gradient(#351c75, #1D133C)"
					}}
				>
					<div className="basis-3/5 px-16 max-sm:basis-4/5 max-sm:px-2">
						<img src="/logo/logo2.png" loading="lazy" alt="" className="w-full h-full translate-y-[-32px]" />
					</div>
				</div>
				<div
					className="py-10 flex flex-col gap-6"
					style={{
						backgroundImage: "url(/background/background.png)",
						backgroundSize: "cover",
						backgroundRepeat: "no-repeat"
					}}
				>
					<div className="font-bold text-dark-purple text-3xl font-Verdana px-4">
						The Future of Finance, Illuminated
					</div>
					<div className="text-dark-purple font-bold px-4 font-Trebuchet text-lg">
						Lumina is a zero-knowledge liquidity protocol for building DEXs on Mina and Zeko
					</div>
					<div className="flex flex-row gap-x-4 justify-center">
						<StartBuilding />
						<StartSwapping />
					</div>
				</div>
			</div>
			{/* section2 */}
			<div className="pt-10">
				<div className="container mx-auto flex flex-col gap-8 text-dark-purple">
					<div className="flex flex-row justify-center flex-wrap w-2/3 mx-auto max-[425px]:w-full">
						<div className="flex items-center basis-1/3 px-5 flex-col gap-4 py-2 max-sm:gap-0 max-[425px]:basis-full max-sm:pb-6 max-sm:pt-0">
							<div className="text-xl font-bold">Clarity</div>
							<div
								className="w-36 h-36"
								style={{
									backgroundImage: "url(/icon/clarity.png)",
									backgroundSize: "cover",
									backgroundRepeat: "no-repeat"
								}}
							/>
							{windowWidth <= 425 ? (
								<div className="font-Trebuchet">
									zkProofs enable private transactions
									<br /> with verified counterparties
								</div>
							) : (
								<div className="font-Trebuchet">
									Zero-knowledge proofs enable trustless, private, transactions with verified counterparties without
									exposing sensitive information
								</div>
							)}
						</div>
						<div className="flex items-center basis-1/3 px-5 flex-col gap-4 py-2 max-sm:gap-0 max-[425px]:basis-full max-sm:pb-6 max-sm:pt-0">
							<div className="text-xl font-bold">Compliance</div>
							<div
								className="w-36 h-36"
								style={{
									backgroundImage: "url(/icon/compliance.png)",
									backgroundSize: "cover",
									backgroundRepeat: "no-repeat"
								}}
							/>
							{windowWidth <= 425 ? (
								<div className="font-Trebuchet ">
									Built-in KYC and permissioned <br /> liquidity pools
								</div>
							) : (
								<div className="font-Trebuchet ">
									Built-in KYC, permissioned liquidity pools, and privacy for retail and institutional users in
									accordance with prevailing regulatory requirements
								</div>
							)}
						</div>
						<div className="flex items-center basis-1/3 px-5 flex-col gap-4 py-2 max-sm:gap-0 max-[425px]:basis-full max-sm:py-0">
							<div className="text-xl font-bold">Confidence</div>
							<div
								className="w-36 h-36"
								style={{
									backgroundImage: "url(/icon/confidence.png)",
									backgroundSize: "cover",
									backgroundRepeat: "no-repeat"
								}}
							/>
							{windowWidth <= 425 ? (
								<div className="font-Trebuchet">
									Lumina is the guiding light for TradFi <br /> and Web2 DeFi ambitions
								</div>
							) : (
								<div className="font-Trebuchet ">
									Our thoughtful approach to decentralized compliance positions DeFi as a clear growth catalyst for
									TradFi and Web2 companies
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* section3 */}
			<div className="flex flex-col text-dark-purple pt-10 pb-4">
				<div className="container mx-auto flex flex-col gap-3">
					<div className="text-2xl font-bold">Backed by the Top Names in Blockchain and ZK</div>
					<div className="flex flex-row justify-center items-center flex-wrap px-28 gap-y-4 py-2 sm:py-8">
						<div className="basis-1/2 flex justify-between">
							<div className="flex items-center justify-center basis-1/2 px-2">
								<div className="h-20 w-36 flex justify-center  items-center px-2 py-2  ">
									<Link to={"https://www.bigbrain.holdings/"} target="_blank" className="w-full h-full">
										<img src="/investors/big.png" loading="lazy" alt="Jump" className="w-full h-full" />
									</Link>
								</div>
							</div>
							<div className="flex items-center justify-center basis-1/2 px-2">
								<div className="h-20 w-36 flex justify-center  items-center px-2 py-2 ">
									<Link to={"https://jumpcrypto.com/"} target="_blank" className="w-full h-full">
										<img src="/investors/Jump.png" loading="lazy" alt="Jump" className="w-full h-full" />
									</Link>
								</div>
							</div>
						</div>
						<div className="basis-1/2 flex flex-row">
							<div className="flex items-center justify-center basis-1/2 px-2">
								<div className="h-20 w-36 cursor-pointer flex justify-center  items-center px-2 py-2 ">
									<Link to={"https://www.minafoundation.com/"} target="_blank" className="w-full h-full">
										<img src="/investors/Mina.png" loading="lazy" alt="Mina" className="w-full h-full" />
									</Link>
								</div>
							</div>
							<div className="flex items-center justify-center basis-1/2 px-2">
								<div className="h-20 w-36 cursor-pointer flex justify-center  items-center px-2 py-2">
									<Link to={"https://o1labs.org/"} target="_blank" className="w-full h-full">
										<img src="/investors/O.png" loading="lazy" alt="Mina" className="w-full h-full" />
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="py-4 text-xl font-Trebuchet bg-dark-purple text-white leading-10">
				<div className="container mx-auto px-28 max-md:px-2 font-Trebuchet">
					Lumina is a Zero-Knowledge Markets Aggregator that shines a new light on decentralized finance; inspired by
					permissioned venues for trading large asset blocks while maintaining privacy and compliance.
				</div>
			</div>
			{/* section4 */}
			<div className="container mx-auto flex flex-col gap-8 text-dark-purple py-10">
				<div className="text-2xl font-bold">Builders and Advisors</div>
				<div className="flex flex-row justify-center flex-wrap px-28">
					<div className="flex flex-row basis-1/2">
						<div className="flex flex-col gap-1 basis-1/2 p-4">
							<div className="flex flex-col gap-3 items-center">
								<div
									className="w-32 h-32 rounded-full shadow-pfp shadow-gray-500"
									style={{
										backgroundImage: "url(/builders/Evan.jpg)",
										backgroundSize: "contain",
										backgroundRepeat: "no-repeat"
									}}
								/>
								<div className="font-Trebuchet">
									<Link to="https://www.linkedin.com/in/evan-kereiakes/" target="_blank">
										Evan Kereiakes
									</Link>
									<br />
									<span className="italic">Business</span>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-1 basis-1/2 p-4">
							<div className="flex flex-col gap-3 items-center">
								<div
									className="w-32 h-32 rounded-full shadow-pfp shadow-gray-500"
									style={{
										backgroundImage: "url(/builders/Emmanuel.jpg)",
										backgroundSize: "cover",
										backgroundRepeat: "no-repeat"
									}}
								/>
								<div className="font-Trebuchet">
									<Link to="https://www.linkedin.com/in/emmanuel-donnet/" target="_blank">
										Emmanuel
									</Link>
									<br />
									<span className="italic">Full-Stack Engineer</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex flex-row basis-1/2">
						<div className="flex flex-col gap-1 basis-1/2 p-4">
							<div className="flex flex-col gap-3 items-center">
								<div
									className="w-32 h-32 rounded-full shadow-pfp shadow-gray-500"
									style={{
										backgroundImage: "url(/builders/Eddy.jpg)",
										backgroundSize: "contain",
										backgroundRepeat: "no-repeat"
									}}
								/>
								<div className="font-Trebuchet">
									<Link to="https://www.linkedin.com/in/eddy-boughioul-aa40aaa9/" target="_blank">
										Eddy Boughioul
									</Link>
									<br />
									<span className="italic">Protocol Engineer</span>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-1 basis-1/2 p-4">
							<div className="flex flex-col gap-3 items-center">
								<div
									className="w-32 h-32 rounded-full shadow-pfp shadow-gray-500"
									style={{
										backgroundImage: "url(/builders/Kesu.png)",
										backgroundSize: "180% 108%",
										backgroundRepeat: "no-repeat",
										backgroundPosition: "center"
									}}
								/>
								<div className="font-Trebuchet">
									<Link to={"https://www.linkedin.com/in/kesujames/"} target="_blank">
										Kesu James
									</Link>
									<br />
									<span className="italic">Creative</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* section5 */}
			<div
				className="flex flex-col py-10 gap-y-6"
				style={{
					backgroundImage: "url(/background/background.png)",
					backgroundSize: "cover",
					backgroundRepeat: "no-repeat"
				}}
			>
				<div className="font-bold text-dark-purple text-2xl font-Verdana">Get Involved</div>

				<div className="flex flex-row justify-center gap-6 text-dark-purple flex-wrap">
					<div className="flex flex-col gap-y-4 items-center border-2 border-purple shadow-md shadow-blue-500/50 p-5 rounded-lg ">
						<div className="font-bold">Developers</div>
						<div className="text-5xl cursor-pointer">
							<GiWarPick />
						</div>
						<StartBuilding />
					</div>
					<div className="flex flex-col gap-y-4 items-center border-2 border-purple shadow-md shadow-blue-500/50 p-5 rounded-lg ">
						<div className="font-bold">Frontend Partners</div>
						<div className="text-5xl cursor-pointer">
							<FaHandshake />
						</div>
						<StartSwapping />
					</div>
				</div>
			</div>
		</div>
	)
}

export default HomePage
