import { PrivateKey } from "o1js"

interface ContractConfig {
	contractPrivateKey: PrivateKey
	contractAddress: string
}

export const contract: ContractConfig = {
	contractPrivateKey: PrivateKey.fromBase58("EKEWE9DtZs5LWe3cpqVCojWTjHTptBD5fKJKWtB94eBjN2uuYKmh"),
	contractAddress: "B62qosGw7wrF65oQxetrXx48Y2DqPpeGeRMFThKiEdKPs6aFV4goADD"
}

export const DEPLOYER = "EKFDvpBMGGa1bGrE9BhNLzr4VEBopt9ANfwTzE5Z3yqSBegiUUhk"
