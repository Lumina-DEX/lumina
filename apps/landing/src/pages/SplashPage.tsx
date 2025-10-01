import { Link } from "react-router-dom"
import { Input } from "antd"

function SplashPage() {
	interface User {
		email: string
		firstName: string
		lastName: string
	}

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
			case "Meeting":
				trackRecord(eventName, visitor)
				break
			case "Linkedin":
				trackRecord(eventName, visitor)
				break
			case "Telegram":
				trackRecord(eventName, visitor)
				break
			case "Website":
				trackRecord(eventName, visitor)
				break
			case "Signup":
				trackRecord(eventName, visitor)
				break
			case "Email":
				trackRecord(eventName, visitor)
				break
			case "ForgetPassword":
				trackRecord(eventName, visitor)
				break
			default:
				break
		}
	}

	return (
		<div className="min-h-screen splash-background">
			<div className="container flex flex-col mx-auto relative py-5 gap-y-16 max-sm:gap-y-6">
				<div className="flex justify-center">
					<img src="/logo/logo.png" loading="lazy" alt="logo" width="120px" height="200px"></img>
				</div>
				<div className="flex text-center justify-center font-Verdana text-zinc-700 text-4xl font-bold uppercase max-sm:text-2xl">
					Enterprise Portal
				</div>
				<div className="flex justify-center gap-4 px-3 flex-wrap">
					<div className="bg-gray-100 rounded-[36px] py-4 px-3 flex flex-col gap-y-2 w-[294px] custom-shadow">
						<div className="text-center uppercase text-zinc-700 text-2xl">Connect</div>
						<div className="flex gap-x-2 justify-center mt-2">
							<Link
								className="w-32 bg-zinc-700 py-3 text-center text-lg text-white rounded-md font-Metrophobic uppercase"
								to={"https://www.linkedin.com/in/evan-kereiakes/"}
								target="_blank"
								onClick={() => brevoTrack("Linkedin")}
							>
								Linkedin
							</Link>
							<Link
								className="w-32   bg-zinc-700 py-3 text-center text-lg text-white rounded-md font-Metrophobic uppercase"
								to={"https://t.me/evankereiakes"}
								target="_blank"
								onClick={() => brevoTrack("Telegram")}
							>
								Telegram
							</Link>
						</div>
						<div className="flex gap-x-2 justify-center">
							<Link
								className="w-32   bg-zinc-700 py-3 text-center text-lg text-white rounded-md font-Metrophobic uppercase"
								to={"mailto:contact@luminadex.com"}
								target="_blank"
								onClick={() => brevoTrack("Email")}
							>
								Email
							</Link>
							<Link
								className="w-32   bg-zinc-700 py-3 text-center text-lg text-white rounded-md font-Metrophobic uppercase"
								to={"https://calendly.com/luminadex"}
								target="_blank"
								onClick={() => brevoTrack("Meeting")}
							>
								Meeting
							</Link>
						</div>
						<div className="flex gap-x-2 justify-center">
							<Link
								className="w-32   bg-zinc-700 py-3 text-center text-lg text-white rounded-md font-Metrophobic uppercase"
								to={"https://luminadex.com/"}
								target="_blank"
								onClick={() => brevoTrack("Website")}
							>
								Website
							</Link>
							<Link
								className="w-32   bg-zinc-700 py-3 text-center text-lg text-white rounded-md font-Metrophobic uppercase"
								to={"https://twitter.com/LuminaDEX"}
								target="_blank"
								onClick={() => brevoTrack("Social")}
							>
								Social
							</Link>
						</div>
					</div>
					<div className="bg-white rounded-[36px] py-4 px-4 flex flex-col gap-y-2 w-[294px] custom-shadow">
						<div className="text-center text-zinc-700 text-2xl">SANDBOX</div>
						<div className="flex gap-y-2 flex-col mt-2">
							<div>
								<Input
									placeholder="Email"
									className="text-center border-zinc-300 text-zinc-700 italic bg-gray-100 h-11"
								/>
							</div>
							<div>
								<input
									type="password"
									className="text-center border-zinc-300 text-zinc-700 italic bg-gray-100 h-11 w-full rounded-md border"
									placeholder="Password"
								/>
							</div>
							<Link
								className="w-full bg-zinc-700 py-2 text-center text-lg text-white rounded-md font-Metrophobic"
								to={""}
								target="_blank"
								onClick={() => brevoTrack("SignIn")}
							>
								SIGN IN
							</Link>
							<div className="flex justify-between">
								<Link
									className="text-zinc-700 font-Metrophobic text-xs underline"
									to={"https://contact.luminadex.com/"}
									target="_blank"
									onClick={() => brevoTrack("Signup")}
								>
									Sign Up
								</Link>
								<Link
									className="text-zinc-700 font-Metrophobic text-xs underline"
									to={""}
									target="_blank"
									onClick={() => brevoTrack("ForgetPassword")}
								>
									Forget Password
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SplashPage
