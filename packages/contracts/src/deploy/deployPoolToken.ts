/**
 * This script can be used to interact with the Add contract, after deploying it.
 *
 * We call the update() method on the contract, create a proof and send it to the chain.
 * The endpoint that we interact with is read from your config.json.
 *
 * This simulates a user interacting with the zkApp from a browser, except that here, sending the transaction happens
 * from the script and we're using your pre-funded zkApp account to pay the transaction fee. In a real web app, the user's wallet
 * would send the transaction and pay the fee.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/deploy.js`.
 */
import fs from 'fs/promises';
import { AccountUpdate, Bool, Cache, fetchAccount, Field, Mina, NetworkId, PrivateKey, PublicKey, SmartContract, UInt64, UInt8 } from 'o1js';
import { PoolMina, PoolTokenHolder, FungibleToken, PoolMinaDeployProps, FungibleTokenAdmin, mulDiv, Faucet, PoolFactory, PoolHolder, Pool } from '../indexmina.js';
import readline from "readline/promises";
import { PoolFactoryToken } from '../PoolFactoryToken.js';

const prompt = async (message: string) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await rl.question(message);

    rl.close(); // stop listening
    return answer;
};

// check command line arg
let deployAlias = "poolmina";
if (!deployAlias)
    throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/deploy/deployPoolToken.js
`);
Error.stackTraceLimit = 1000;
const DEFAULT_NETWORK_ID = 'zeko';

// parse config and private key from file
type Config = {
    deployAliases: Record<
        string,
        {
            networkId?: string;
            url: string;
            keyPath: string;
            fee: string;
            feepayerKeyPath: string;
            feepayerAlias: string;
        }
    >;
};
let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.deployAliases[deployAlias];
let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
    await fs.readFile(config.feepayerKeyPath, 'utf8'));

let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
// B62qj5TFJJU9poNB9xYZDSn9UeJGFfVHACEzmYTHVSwU4QsDh2uYdL6
let zkAppKey = PrivateKey.fromBase58("EKFPnkGeFtKbfma2ihFjRtfveCnr4WXHupMVams68EDRH6WpYdM8");
// B62qq7cGn7rx6wwbjMP2Q2c8nm3nuwH3JPAuezzihZjNLhV66KCK9Ct
let zkTokenPrivateKey = PrivateKey.fromBase58("EKEk3mQKdVvp42q5ixsLHgFcWanXNFmtGd6qcWyjo4mxLCz5YQa4");
// B62qk8EiCmt3XtpXVRJ41WbcyZKruTkpKnNNTb6kiwLvXaRzBzWPLdD
let zkTokenAdminPrivateKey = PrivateKey.fromBase58("EKEnTVvNkmeNn8pb1TZXb3n7NHhn8k2rAG8a6CdY5F7Bnno2j1xQ");
// B62qnigaSA2ZdhmGuKfQikjYKxb6V71mLq3H8RZzvkH4htHBEtMRUAG
let zkFaucetKey = PrivateKey.fromBase58("EKDrpqX83AMJPT4X2dpPhAESbtrL96YV85gGCjECiK523LnBNqka");
// B62qqJ2zzVh9xJdt25SpFgmcMtaMgHvCNZdYqRh1tjVPu1rScJ67tSd
let zkFactoryKey = PrivateKey.fromBase58("EKE5rPE8TrRWhffPXYAXPBxZ328g1La27A1UuL7hVdjJAEEMmdEB");

// set up Mina instance and contract we interact with
const Network = Mina.Network({
    // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
    // This is to ensure the backward compatibility.
    networkId: (config.networkId ?? DEFAULT_NETWORK_ID) as NetworkId,
    // works only on zeko
    mina: "https://devnet.zeko.io/graphql",
    archive: 'https://devnet.zeko.io/graphql',
});
console.log("network", config.url);
// const Network = Mina.Network(config.url);
const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let zkAppAddress = zkAppKey.toPublicKey();
let zkFactoryAddress = zkFactoryKey.toPublicKey();
let zkFactory = new PoolFactoryToken(zkFactoryAddress);
let zkApp = new Pool(zkAppAddress);
let zkTokenAddress = zkTokenPrivateKey.toPublicKey();
let zkToken = new FungibleToken(zkTokenAddress);
let zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey();
let zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress);
let zkFaucetAddress = zkFaucetKey.toPublicKey();
let zkFaucet = new Faucet(zkFaucetAddress, zkToken.deriveTokenId());

let zkTokaAddress = PublicKey.fromBase58("B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w");
let zkToka = new FungibleToken(zkTokenAddress);

console.log("tokenStandard", zkTokenAddress.toBase58());
console.log("pool", zkAppAddress.toBase58());
console.log("factory", zkFactoryKey.toBase58());
console.log("zkTokenAdmin", zkTokenAdminAddress.toBase58());
console.log("zkFaucet", zkFaucetAddress.toBase58());

// compile the contract to create prover keys
console.log('compile the contract...');

const cache: Cache = Cache.FileSystem('./cache');
const key = await Pool.compile({ cache });
await FungibleToken.compile({ cache });
await FungibleTokenAdmin.compile({ cache });
await PoolHolder.compile({ cache });
await PoolFactoryToken.compile({ cache });
await Faucet.compile({ cache });
//const keyV2 = await PoolMinaV2.compile({ cache });

async function ask() {
    try {
        const result = await
            prompt(`Why do you want to do ?
            1 deploy token
            2 deploy pool      
            3 deploy factory
            4 add liquidity 
            5 swap mina for token
            6 swap token for mina
            7 upgrade
            8 deploy pool eth
            9 mint token
            10 show event
            11 deploy faucet
            `);
        switch (result) {
            case "1":
                await deployToken();
                break;
            case "2":
                await deployPool();
                break;
            case "3":
                await deployFactory();
                break;
            case "4":
                await addLiquidity();
                break;
            case "5":
                await swapMina();
                break;
            case "6":
                await swapToken();
                break;
            case "7":
                await upgrade();
                break;
            case "8":
                //await deployPoolEth();
                break;
            case "9":
                await mintToken();
                break;
            case "10":
                await getEvent();
                break;
            case "11":
                await deployFaucet();
                break;
            default:
                await ask();
                break;
        }
    } catch (error) {
        await ask();
    }
    finally {
        await ask();
    }
}

await ask();

async function deployToken() {
    try {
        console.log("deploy token standard");

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 3);
                await zkTokenAdmin.deploy({
                    adminPublicKey: feepayerAddress,
                });
                await zkToken.deploy({
                    symbol: "TOKB",
                    src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
                });
                await zkToken.initialize(
                    zkTokenAdminAddress,
                    UInt8.from(9),
                    Bool(false),
                );
            }
        );
        await tx.prove();
        //console.log("tx", tx.toPretty());
        let sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey, zkTokenAdminPrivateKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function deployPool() {
    try {
        console.log("deploy pool");
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 5);
                await zkFactory.createPool(zkAppAddress, zkTokaAddress, zkTokenAddress);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkAppKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


async function deployFactory() {
    try {
        console.log("deploy factory");
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                await zkFactory.deploy({ symbol: "FAC", src: "https://luminadex.com/", poolData: feepayerAddress });
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function deployFaucet() {
    try {
        console.log("deploy faucet");

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                // 100 token by claim
                await zkFaucet.deploy({
                    token: zkTokenAddress,
                    amount: UInt64.from(100 * 10 ** 9)
                });
                await zkToken.approveAccountUpdate(zkFaucet.self);

                // 1'000'000 tokens in the faucet
                await zkToken.mint(
                    zkFaucetAddress,
                    UInt64.from(1000000 * 10 ** 9)
                );
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey, zkFaucetKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


async function addLiquidity() {
    try {
        console.log("add liquidity");
        let amt = UInt64.from(5000 * 10 ** 9);
        let amtMina = UInt64.from(20 * 10 ** 9);
        const token = await zkApp.token0.fetch();
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 1);
            await zkApp.supplyFirstLiquidities(amtMina, amt);
        });
        console.log("tx liquidity", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function swapMina() {
    try {
        console.log("swap Mina");

        await fetchAccount({ publicKey: zkAppAddress });
        await fetchAccount({ publicKey: zkAppAddress, tokenId: zkToken.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkToken.deriveTokenId() });

        let amountIn = UInt64.from(1.3 * 10 ** 9);
        let dexTokenHolder = new PoolHolder(zkAppAddress, zkToken.deriveTokenId());

        const reserveIn = Mina.getBalance(zkAppAddress);
        const reserveOut = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());

        const balanceMin = reserveOut.sub(reserveOut.div(100));
        const balanceMax = reserveIn.add(reserveIn.div(100));

        const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await dexTokenHolder.swapFromToken(feepayerAddress, UInt64.from(5), amountIn, expectedOut, balanceMax, balanceMin);
            await zkToken.approveAccountUpdate(dexTokenHolder.self);
        });
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}

async function swapToken() {
    try {
        console.log("swap Token");
        let amountIn = UInt64.from(20 * 10 ** 9);

        await fetchAccount({ publicKey: zkAppAddress });
        await fetchAccount({ publicKey: zkAppAddress, tokenId: zkToken.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkToken.deriveTokenId() });

        const reserveOut = Mina.getBalance(zkAppAddress);
        const reserveIn = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());

        const balanceMin = reserveOut.sub(reserveOut.div(100));
        const balanceMax = reserveIn.add(reserveIn.div(100));

        const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await zkApp.swapFromToken(feepayerAddress, UInt64.from(5), amountIn, expectedOut, balanceMax, balanceMin);
        });
        await tx.prove();
        console.log("swap token proof", tx.toPretty());
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}

async function upgrade() {
    try {
        console.log("upgrade");
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            //  await zkApp.updateVerificationKey(keyV2.verificationKey);
        });
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkAppKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}

async function mintToken() {
    try {
        console.log("mintToken");
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 1);
            await zkToken.mint(feepayerAddress, UInt64.from(100_000 * 10 ** 9));
        });
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}


async function getEvent() {
    try {
        console.log("show event");
        await displayEvents(zkApp);
        let dexTokenHolder = new PoolTokenHolder(zkAppAddress, zkToken.deriveTokenId());
        await displayEvents(dexTokenHolder);
    } catch (err) {
        console.log(err);
    }
}

async function displayEvents(contract: SmartContract) {
    let events = await contract.fetchEvents();
    console.log(
        `events on ${contract.address.toBase58()} ${contract.tokenId}`,
        events.map((e) => {
            return { type: e.type, data: JSON.stringify(e.event) };
        })
    );
}


function sleep() {
    return new Promise(resolve => setTimeout(resolve, 20000));
}


function getTxnUrl(graphQlUrl: string, txnHash: string | undefined) {
    const hostName = new URL(graphQlUrl).hostname;
    const txnBroadcastServiceName = hostName
        .split('.')
        .filter((item) => item === 'minascan')?.[0];
    const networkName = graphQlUrl
        .split('/')
        .filter((item) => item === 'mainnet' || item === 'devnet')?.[0];
    if (txnBroadcastServiceName && networkName) {
        return `https://minascan.io/${networkName}/tx/${txnHash}?type=zk-tx`;
    }
    return `Transaction hash: ${txnHash}`;
}