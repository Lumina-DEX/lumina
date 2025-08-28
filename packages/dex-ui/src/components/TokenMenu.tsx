"use client"
import type { LuminaPool, LuminaToken, Networks } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { Box, Modal } from "@mui/material"
import { useCallback, useContext, useEffect, useState } from "react"
import { Addresses } from "@/utils/addresses"
import { minaTestnet } from "./Account"
import { LuminaContext } from "./Layout"

const TokenMenu = ({
	poolAddress,
	setPool,
	setToken
}: {
	poolAddress: string
	setPool: (pool: LuminaPool) => void
	setToken: (token: LuminaToken) => void
}) => {
	const [cdnList, setCdnList] = useState<LuminaPool[]>([])
	const { Wallet } = useContext(LuminaContext)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const [current, setCurrent] = useState<LuminaPool | undefined>()
	const [open, setOpen] = useState(false)
	const handleOpen = () => setOpen(true)
	const handleClose = () => setOpen(false)

	const getPools = useCallback(async () => {
		console.log("poolAddress", poolAddress)
		const network: Networks = walletContext.currentNetwork || minaTestnet
		const pools = await Addresses.getList(network)
		setCdnList(pools)

		const poolExist = pools.find((z) => z.address === poolAddress)
		if (poolExist) {
			console.log("poolExist", poolExist)
			setPool(poolExist)
			setToken(poolExist.tokens[1])
			setCurrent(poolExist)
		} else {
			console.log("pool not found", pools[0])
			// if this pool didn't exist for this network we select the first token
			setPool(pools[0])
			setToken(pools[0].tokens[1])
			setCurrent(pools[0])
		}
	}, [walletContext.currentNetwork, poolAddress, setPool, setToken])

	const selectPool = (pool: LuminaPool) => {
		console.log("pool", pool)
		setPool(pool)
		setToken(pool.tokens[1])
		setCurrent(pool)
		setOpen(false)
	}

	const style = {
		position: "absolute" as const,
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
		if (!text) return ""
		return `${text.substring(0, 6)}...${text.substring(text.length - 6, text.length)}`
	}

	useEffect(() => {
		getPools()
	}, [getPools])

	return (
		<div>
			<button type="button" onClick={handleOpen} className=" ml-3 p-1 bg-white">
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
						{cdnList?.map((x) => (
							<button
								type="button"
								style={{ borderBottom: "1px solid black" }}
								onClick={() => selectPool(x)}
								className="button-div flex flex-col bg-blue-100 p-3"
								key={x.address}
							>
								<span title={x.tokens[1].symbol}>{x.tokens[1].symbol}</span>
								<span className="text-sm" title={x.tokens[1].address}>
									Address : {trimText(x.tokens[1].address)}
								</span>
								<span className="text-sm" title={x.address}>
									Pool : {trimText(x.address)}
								</span>
							</button>
						))}
					</div>
				</Box>
			</Modal>
		</div>
	)
}

export default TokenMenu
