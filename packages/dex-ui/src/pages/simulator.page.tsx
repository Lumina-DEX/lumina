"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";
import Liquidity from "@/components/Liquidity";
import Withdraw from "@/components//Withdraw";
import TabButton from "@/components/TabButton";
import Create from "@/components/Create";
import useAccount from "@/states/useAccount";

type Percent = number | string;

// @ts-ignore
const Pool = () => {

    const [data, setData] = useState({ amountIn: 10, amountOut: 0, liquidityMina: 20000, liquidityToken: 10000 });

    const [source, setSource] = useState("mina");

    const calculFromToken = () => {
        const result = getAmountOut(data.amountIn, data.liquidityToken, data.liquidityMina, 1);
        setData({ ...data, amountOut: result.amountOut });
    }

    const calculFromMina = () => {
        const result = getAmountOut(data.amountIn, data.liquidityMina, data.liquidityToken, 1);
        setData({ ...data, amountOut: result.amountOut });
    }

    function getAmountOut(amountIn: number, balanceIn: number, balanceOut: number, percent: number) {

        const balanceInMax = balanceIn + balanceIn * percent / 100;
        const balanceOutMin = balanceOut - balanceOut * percent / 100;

        let amountOut = balanceOutMin * amountIn / (balanceInMax + amountIn);
        // 0.45 % tax
        amountOut = amountOut - amountOut / 220;

        return { amountIn, amountOut, balanceOutMin, balanceInMax };
    }

    useEffect(() => {
        if (source === "mina") {
            calculFromMina();
        } else {
            calculFromToken();
        }
    }, [data, source]);
    return (
        <>
            <div className="flex flex-col min-w-[360px] w-screen max-w-[600px]  h-[600px] p-5  rounded" style={{ backgroundColor: "rgb(255, 245, 240)" }}>
                <div className="m-5">
                    <span>Liquidity mina : </span>
                    <input type="number" onChange={(ev) => { setData({ ...data, liquidityMina: ev.target.valueAsNumber }); }} value={data.liquidityMina}></input></div>
                <div className="m-5">
                    <span>Liquidity token : </span>
                    <input type="number" value={data.liquidityToken} onChange={(ev) => { setData({ ...data, liquidityToken: ev.target.valueAsNumber }); }}></input>
                </div>
                <div className="m-5">
                    <span>Amount In : </span>
                    <input type="number" value={data.amountIn} onChange={(ev) => { setData({ ...data, amountIn: ev.target.valueAsNumber }); }}></input>
                    <select className="ml-3" value={source} onChange={(ev) => setSource(ev.target.value)}>
                        <option value="mina">Mina</option>
                        <option value="token">Token</option>
                    </select>
                </div>
                <div className="m-5">
                    <span>Amount Out : </span><span>{data.amountOut.toFixed(2)}</span>
                </div>
            </div>
        </>
    );
};

export default Pool;
