import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useTulip, FlowData, Flow } from "../api";

import { Scatter } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from 'chart.js';
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export function CorrelationChart({ flows, searchParams }: { flows: Flow[], searchParams: URLSearchParams }) {

    const flowData = flows.map((flow) => (
        { x: flow.time, y: flow.duration, id: flow._id.$oid }
    ));

    const flowMeta = flows.map((flow) => (
        flow._id.$oid
    ));

    const data = {
        datasets: [{
            label: 'Sessions',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: flowData,
            metadata: flowMeta,
        }]
    };

    var options = {
        onClick: function (evt: any, element: any) {
            var e = element[0];
            // TODO; this is terrible
            const clicked = this.data.datasets[0].data[e.index];
            document.location.href = `/flow/${clicked.id}?${searchParams}`
        }
    };

    return (
        <div>
            <Scatter data={data} options={options}></Scatter>
        </div>
    );
}
