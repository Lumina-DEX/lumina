"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { fetchPoolList } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { Box, Modal } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useContext, useEffect, useState } from "react"
import { LuminaContext } from "./Layout"

interface PoolMenuProps {
	poolAddress: string
	setPool: (pool: LuminaPool) => void
}
const PoolMenu = ({ poolAddress, setPool }: PoolMenuProps) => {
	const { Wallet } = useContext(LuminaContext)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const [current, setCurrent] = useState<LuminaPool | undefined>()
	const [open, setOpen] = useState(false)

	const handleOpen = () => setOpen(true)
	const handleClose = () => setOpen(false)

	const { data: cdnList } = useQuery({
		queryKey: [walletContext.currentNetwork],
		queryFn: () => fetchPoolList(walletContext.currentNetwork),
		initialData: []
	})

	const poolExist = cdnList.find((z) => z.address === poolAddress)

	const selectPool = (pool: LuminaPool) => {
		setPool(pool)
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
		return `${text.substring(0, 6)}...${text.substring(text.length - 6)}`
	}

	useEffect(() => {
		if (poolExist) {
			setPool(poolExist)
			setCurrent(poolExist)
		} else if (cdnList.length > 0) {
			// If the pool doesn't exist on this network, we take the first one
			setPool(cdnList[0])
			setCurrent(cdnList[0])
		}
	}, [poolExist, cdnList, setPool])

	const getName = (pool: LuminaPool) => {
		return pool?.tokens[0].symbol + "/" + pool?.tokens[1].symbol
	}

	return (
		<div>
			<button type="button" onClick={handleOpen} className="ml-3 p-1 bg-white">
				{getName(current)} &#x25BC;
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
								key={x.address}
								onClick={() => selectPool(x)}
								className="flex flex-col bg-blue-100 p-3 text-left"
								style={{ borderBottom: "1px solid black" }}
							>
								<span title={getName(x)}>{getName(x)}</span>
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

export default PoolMenu
