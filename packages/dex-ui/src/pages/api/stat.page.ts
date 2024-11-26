import { ZKFACTORY_ADDRESS } from '@/components/Layout';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchEvents, Field, Mina, PublicKey, UInt32 } from 'o1js';


const devnet = Mina.Network(
    {
        networkId: "testnet",
        mina: "https://devnet.minaprotocol.network/graphql",
        archive: 'https://api.minascan.io/archive/devnet/v1/graphql'
    });

const zeko = Mina.Network(
    {
        networkId: "testnet",
        mina: "https://devnet.zeko.io/graphql",
        archive: "https://devnet.zeko.io/graphql"
    });

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const json = req.body;
    const network = json.network as string;
    const result = network === "mina" ? await exportMina() : await exportZeko();
    console.log("result", result);
    res.status(200).send(result);
}

async function exportZeko() {
    Mina.setActiveInstance(zeko);
    const events = await fetchEvents({ publicKey: ZKFACTORY_ADDRESS });
    for (let index = 0; index < events.length; index++) {
        const element = events[index] as unknown as any;
        const data = element.events[0].data;
        const poolAddress = PublicKey.fromFields([Field.from(data[2]), Field.from(data[3])]);
        const tokenAddress = PublicKey.fromFields([Field.from(data[4]), Field.from(data[5])]);

        let start = element.blockHeight.toBigint();
        let end = element.blockHeight.toBigint();
        const allEvents = [];
        for (let index = 0; end < 2700n; index++) {
            end += 500n;
            const events = await fetchEvents({ publicKey: poolAddress.toBase58() }, "https://devnet.zeko.io/graphql", { from: UInt32.from(start), to: UInt32.from(end) });
            allEvents.push(...events);
            start += 500n;
        }
        element.transactions = allEvents;
    }
    return events;
}

async function exportMina() {
    Mina.setActiveInstance(devnet);
    const events = await fetchEvents({ publicKey: ZKFACTORY_ADDRESS });
    return events;
}
