"use client"

import MultisigManagement from "@/components/multisig-management/MultisigManagement"

const Multisig = () => {
	return (
		<div
			className="flex flex-col min-w-[360px] w-screen max-w-[1200px]  h-[80vh]  rounded"
			style={{ backgroundColor: "rgb(255, 245, 240)" }}
		>
			<MultisigManagement />
		</div>
	)
}

export default Multisig
