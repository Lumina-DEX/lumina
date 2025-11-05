"use client"

import FactoryManagement from "@/components/factory-management/FactoryManagement"

const Signer = () => {
	return (
		<div
			className="flex flex-col min-w-[360px] w-screen max-w-[1200px]  h-[80vh]  rounded"
			style={{ backgroundColor: "rgb(255, 245, 240)" }}
		>
			<FactoryManagement />
		</div>
	)
}

export default Signer
