import { Link } from "react-router-dom"

const Footer = () => {
	return (
		<div className="bg-dark-purple py-5">
			<div className="container border-t-2 border-purple mx-auto text-primary text-white px-28 max-lg:px-4">
				<div className=" flex flex-row flex-wrap items-center justify-between">
					<div className="flex flex-row gap-4 justify-start items-center max-[425px]:justify-center w-72 max-[425px]:w-full">
						<div className="flex items-center text-lg flex-row gap-3">
							{/* <Link
                to={"https://disclaimers.luminadex.com"}
                target="_blank"
                className="font-Trebuchet"
              >
                ICF disclaimer
              </Link>
              | */}
							<Link to={"https://disclaimers.luminadex.com/privacy-policy"} target="_blank" className="font-Trebuchet">
								Privacy Policy
							</Link>
						</div>
					</div>
					<div className="flex justify-start max-[425px]:justify-center max-[425px]:w-full font-Trebuchet">
						@{new Date().getFullYear()} copyright Lumina Labs Inc
					</div>
				</div>
			</div>
		</div>
	)
}

export default Footer
