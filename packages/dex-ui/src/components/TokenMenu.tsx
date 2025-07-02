"use client"
import React, { useEffect, useMemo, useState } from "react"
import { Addresses } from "@/utils/addresses"
import { minaTestnet } from "@/lib/wallet"
import { Box, Typography, Modal } from "@mui/material"
import { fetchAccount, fetchEvents, Field, PublicKey, SmartContract } from "o1js"
import { ZKFACTORY_ADDRESS } from "./Layout"

const TokenMenu = ({ pool, setPool, setToken }) => {
	const [cdnList, setCdnList] = useState([])
	const [eventList, setEventList] = useState([])
	const accountState = { network: "", publicKeyBase58: "", balances: { mina: 0 } }
	const [current, setCurrent] = useState({ symbol: "TokenA" })
	const [open, setOpen] = useState(false)
	const [indexed, setIndexed] = useState([])
	const handleOpen = () => setOpen(true)
	const handleClose = () => setOpen(false)

	useEffect(() => {
		console.log("token", pool)
		console.log("accountState update")
		getTokens().then()
	}, [])

	const getTokens = async () => {
		//	const network: Networks = accountState.network === minaTestnet ? "mina:devnet" : "zeko:testnet"
		// TODO support zeko
		const network: string = "mina:devnet"
		const tokens = await Addresses.getList(network)
		setCdnList(tokens)

		const fetchEvent = await Addresses.getEventList(network)
		console.log("fetch event", fetchEvent)
		setEventList([])
		if (fetchEvent?.length) {
			setEventList(fetchEvent)
		}

		let poolExist = tokens.find((z) => z.poolAddress === pool)
		console.log("pool exist", poolExist)
		if (!poolExist && tokens?.length) {
			poolExist = fetchEvent?.find((z) => z.poolAddress === pool)
			console.log("pool exist 2", poolExist)
			if (poolExist) {
				setToken(poolExist)
				setCurrent(poolExist)
			} else {
				// if this pool didn't exist for this network we select the first token
				setPool(tokens[0].poolAddress)
				setToken(tokens[0])
				setCurrent(tokens[0])
			}
		} else if (poolExist) {
			setToken(poolExist)
			setCurrent(poolExist)
		}
	}

	const selectPool = (pool: any) => {
		console.log("pool", pool)
		setPool(pool.poolAddress)
		setToken(pool)
		setCurrent(pool)
		setOpen(false)
	}

	const style = {
		position: "absolute" as "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: 400,
		bgcolor: "background.paper",
		border: "2px solid #000",
		boxShadow: 24,
		p: 4,
		maxHeight: "90vh",
		overflow: "auto"
	}

	const trimText = (text: string) => {
		if (!text) {
			return ""
		}
		return text.substring(0, 6) + "..." + text.substring(text.length - 6, text.length)
	}

	const alreadyExist = (poolAddress: string) => {
		return cdnList?.find((z) => z.poolAddress === poolAddress) || false
	}

	return (
		<div>
			<button onClick={handleOpen} className=" ml-3 p-1 bg-white">
				{current.symbol} &#x25BC;
			</button>
			<Modal
				open={open}
				onClose={handleClose}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<div className="flex flex-col">
						{cdnList &&
							cdnList.map((x) => (
								<div
									style={{ borderBottom: "1px solid black" }}
									onClick={() => selectPool(x)}
									className="flex flex-col bg-blue-100 p-3"
									key={x.poolAddress}
								>
									<span title={x.name}>{x.symbol}</span>
									<span className="text-sm" title={x.address}>
										Address : {trimText(x.address)}
									</span>
									<span className="text-sm" title={x.poolAddress}>
										Pool : {trimText(x.poolAddress)}
									</span>
								</div>
							))}
					</div>
					<div className="flex flex-col">
						{eventList &&
							eventList.map((x) => {
								return alreadyExist ? (
									<div key={x.poolAddress}></div>
								) : (
									<div
										style={{ borderBottom: "1px solid black" }}
										onClick={() => selectPool(x)}
										className="flex flex-col bg-red-100 p-3"
										key={x.poolAddress}
									>
										<span title={x.name}>{x.symbol}</span>
										<span className="text-sm" title={x.address}>
											Address : {trimText(x.address)}
										</span>
										<span className="text-sm" title={x.poolAddress}>
											Pool : {trimText(x.poolAddress)}
										</span>
									</div>
								)
							})}
					</div>
				</Box>
			</Modal>
		</div>
	)
}

export default TokenMenu
