// Next API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"

type Data = {
	name: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
	console.log("process", process.cwd())
	res.status(200).json({ name: process.cwd() })
}
