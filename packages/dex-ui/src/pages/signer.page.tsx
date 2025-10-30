"use client"
import SignerManagement from "@/components/SignerManagement"

const Signer = () => {
	return (
		<div
			className="flex flex-col min-w-[360px] w-screen max-w-[1200px]  h-[600px]  rounded"
			style={{ backgroundColor: "rgb(255, 245, 240)" }}
		>
			<SignerManagement></SignerManagement>
		</div>
	)
}

export default Signer
