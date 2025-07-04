"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { Addresses } from "@/utils/addresses"
import { minaTestnet } from "@/lib/wallet"
import { Box, Typography, Modal } from "@mui/material"
import { LuminaContext } from "./Layout"
import { useSelector } from "@lumina-dex/sdk/react"
import { LuminaPool, Networks } from "@lumina-dex/sdk"

const TokenMenu = ({ poolAddress, setPool, setToken }) => {
	const [cdnList, setCdnList] = useState<LuminaPool[]>([])
	const [eventList, setEventList] = useState<LuminaPool[]>([])
	const { Wallet, Dex } = useContext(LuminaContext)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const [current, setCurrent] = useState<LuminaPool | undefined>()
	const [open, setOpen] = useState(false)
	const [indexed, setIndexed] = useState([])
	const handleOpen = () => setOpen(true)
	const handleClose = () => setOpen(false)

	useEffect(() => {
		console.log("token", poolAddress)
		console.log("accountState update")
		getPools().then()
	}, [walletContext.currentNetwork])

	const getPools = async () => {
		const network: Networks = walletContext.currentNetwork || minaTestnet
		const pools = await Addresses.getList(network)
		setCdnList(pools)

		const fetchEvent = await Addresses.getEventList(network)
		console.log("fetch event", fetchEvent)
		setEventList([])
		if (fetchEvent?.length) {
			setEventList(fetchEvent)
		}

		let poolExist = pools.find((z) => z.address === poolAddress)
		console.log("pool exist", poolExist)
		if (!poolExist && pools?.length) {
			poolExist = fetchEvent?.find((z) => z.address === poolAddress)
			console.log("pool exist 2", poolExist)
			if (poolExist) {
				setPool(poolExist)
				setToken(poolExist.tokens[1])
				setCurrent(poolExist)
			} else {
				// if this pool didn't exist for this network we select the first token
				setPool(pools[0])
				setToken(pools[0].tokens[1])
				setCurrent(pools[0])
			}
		} else if (poolExist) {
			setToken(poolExist)
			setCurrent(poolExist)
		}
	}

	const selectPool = (pool: any) => {
		console.log("pool", pool)
		setPool(pool)
		setToken(pool.tokens[1])
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

	return (
		<div>
			<button onClick={handleOpen} className=" ml-3 p-1 bg-white">
				{current?.tokens[1].symbol} &#x25BC;
			</button>
			<Modal
				open={open}
				onClose={handleClose}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<div className="flex flex-col">
						{eventList &&
							eventList.map((x) => (
								<div
									style={{ borderBottom: "1px solid black" }}
									onClick={() => selectPool(x)}
									className="flex flex-col bg-blue-100 p-3"
									key={x.address}
								>
									<span title={x.tokens[1].symbol}>{x.tokens[1].symbol}</span>
									<span className="text-sm" title={x.tokens[1].address}>
										Address : {trimText(x.tokens[1].address)}
									</span>
									<span className="text-sm" title={x.address}>
										Pool : {trimText(x.address)}
									</span>
								</div>
							))}
					</div>
				</Box>
			</Modal>
		</div>
	)
}

export default TokenMenu
