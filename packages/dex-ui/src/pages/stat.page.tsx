"use client";
import { Addresses } from "@/utils/addresses";
import { fetchEvents, Mina, UInt32 } from "o1js";
import React, { useEffect, useMemo, useState } from "react";

// @ts-ignore
const Stat = () => {

    const [data, setData] = useState([]);

    const getStat = async () => {
        const list = await Addresses.getEventList(false);

        let total = 0;
        for (let index = 0; index < list.length; index++) {
            const element = list[index];
            console.log("block", element.blockHeight);
            const events = await fetchTransactions(element);
            console.log("pool :", element.poolAddress);
            console.log("events :", events);
            total += events.length;
        }
        console.log("total", total);
    }

    async function fetchTransactions(element: any) {
        let start = element.blockHeight;
        let end = element.blockHeight;

        const allEvents = [];
        for (let index = 0; end < 362084n; index++) {
            end += 100n;
            const events = await fetchEvents({ publicKey: element.poolAddress }, 'https://api.minascan.io/archive/devnet/v1/graphql', { from: UInt32.from(start), to: UInt32.from(end) });
            allEvents.push(...events);
            start += 100n;
        }
        return allEvents;
    }

    async function fetchTransactionsWhile(element: any) {
        let start = element.blockHeight;

        const allEvents = [];
        for (let index = 0; start < 362084n; index++) {

            const events = await fetchEvents({ publicKey: element.poolAddress }, 'https://api.minascan.io/archive/devnet/v1/graphql', { from: UInt32.from(start) });
            allEvents.push(...events);
            if (events.length) {
                const last = events[events.length - 1];
                console.log("actual start", start);
                const blockHeight = last.blockHeight.toBigint();
                console.log("last", blockHeight);
                if (blockHeight === start) {
                    break;
                } else {
                    start = blockHeight;
                }
            } else {
                break;
            }
        }
        return allEvents;

    }


    const exportZeko = async () => {
        const response = await fetch("/api/stat", { body: JSON.stringify({ network: "zeko" }), method: "POST" });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log("export zeko", json);
    };

    return (
        <>
            <div className="flex flex-col min-w-[360px] w-screen max-w-[600px]  h-[600px] p-5  rounded" style={{ backgroundColor: "rgb(255, 245, 240)" }}>
                <button onClick={exportZeko} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">Export zeko</button>
            </div>
        </>
    );
};

export default Stat;
