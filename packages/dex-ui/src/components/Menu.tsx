"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { fetchAccount, PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import useAccount from "@/states/useAccount"
import { connect, minaTestnet, requestAccounts, switchChain, zekoTestnet } from "@/lib/wallet"
import Link from "next/link"

// @ts-ignore
const Menu = () => {
	const router = useRouter()
	const [isNavOpen, setIsNavOpen] = useState(false)
	const handleRouteChange = (url, { shallow }) => {
		setIsNavOpen(false)
	}
	router?.events?.on("routeChangeStart", handleRouteChange)

	return (
		<>
			<nav>
				<section className="MOBILE-MENU flex lg:hidden">
					<div className="HAMBURGER-ICON space-y-2" onClick={() => setIsNavOpen((prev) => !prev)}>
						<div className="block h-0.5 w-8 animate-pulse bg-gray-600"></div>
						<div className="block h-0.5 w-8 animate-pulse bg-gray-600"></div>
						<div className="block h-0.5 w-8 animate-pulse bg-gray-600"></div>
					</div>

					<div className={isNavOpen ? "showMenuNav" : "hideMenuNav"}>
						<div
							className="CROSS-ICON absolute top-0 right-0 px-8 py-8"
							onClick={() => setIsNavOpen(false)}
						>
							<svg
								className="h-8 w-8 text-gray-600"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</div>
						<ul className="MENU-LINK-MOBILE-OPEN flex flex-col items-center justify-between min-h-[250px] text-xl text-black">
							<li>
								<Link className="text-xl" href="/">
									Swap
								</Link>
							</li>
							<li>
								<Link className="text-xl" href="/pool">
									Pool
								</Link>
							</li>
							<li>
								<Link className="" href="/faucet">
									Faucet
								</Link>
							</li>
							<li>
								<Link className="" href="/token">
									Token
								</Link>
							</li>
						</ul>
					</div>
				</section>

				<ul className="DESKTOP-MENU hidden space-x-8 lg:flex flex-row gap-5 justify-between items-center text-xl text-black">
					<li className={router.pathname == "/" ? "text-blue-500" : ""}>
						<Link className="text-xl" href="/">
							Swap
						</Link>
					</li>
					<li className={router.pathname == "/pool" ? "text-blue-500" : ""}>
						<Link className="text-xl" href="/pool">
							Pool
						</Link>
					</li>
					<li className={router.pathname == "/faucet" ? "text-blue-500" : ""}>
						<Link className="" href="/faucet">
							Faucet
						</Link>
					</li>
					<li className={router.pathname == "/token" ? "text-blue-500" : ""}>
						<Link className="" href="/token">
							Token
						</Link>
					</li>
				</ul>
			</nav>
			<style>{`
        .hideMenuNav {
          display: none;
        }
        .showMenuNav {
          display: block;
          position: absolute;
          width: 100%;
          height: 100vh;
          top: 0;
          left: 0;
          background: white;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          align-items: center;
        }
      `}</style>
		</>
	)
}

export default Menu
