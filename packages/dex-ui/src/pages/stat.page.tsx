"use client";
import { Addresses } from "@/utils/addresses";
import { fetchEvents, Mina } from "o1js";
import React, { useEffect, useMemo, useState } from "react";

// @ts-ignore
const Stat = () => {

    const [data, setData] = useState([]);

    const getStat = async () => {
        const list = await Addresses.getEventList(true);

        let total = 0;
        for (let index = 0; index < list.length; index++) {
            const element = list[index];
            const events = await fetchEvents({ publicKey: element.poolAddress });
            console.log("pool :", element.poolAddress);
            console.log("events :", events);
            total += events.length;
        }
        console.log("total", total);
    }

    useEffect(() => { getStat().then() }, [])

    return (
        <>
            <div className="flex flex-col min-w-[360px] w-screen max-w-[90vw]  h-[600px] p-5  rounded" style={{ backgroundColor: "rgb(255, 245, 240)" }}>

            </div>
        </>
    );
};

export default Stat;
