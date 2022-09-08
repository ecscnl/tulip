import {
    useSearchParams,
    useParams,
    useNavigate,
} from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAtom } from "jotai";
import { Flow, useTulip } from "../api";
import {
    SERVICE_FILTER_KEY,
    TEXT_FILTER_KEY,
    START_FILTER_KEY,
    END_FILTER_KEY,
    CORRELATION_MODE_KEY,
} from "../App";
import useDebounce from "../hooks/useDebounce";
import { lastRefreshAtom } from "./Header";

import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface GraphProps {
    flowList: Flow[];
    mode: string;
    searchParams: URLSearchParams;
    setSearchParams: (a: URLSearchParams) => void;
    onClickNavigate: (a: string) => void;
}

export const Corrie = () => {
    let params = useParams();

    const { services, api, getFlows } = useTulip();

    const [flowList, setFlowList] = useState<Flow[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();

    const service_name = searchParams.get(SERVICE_FILTER_KEY) ?? "";
    const service = services.find((s) => s.name == service_name);

    const text_filter = searchParams.get(TEXT_FILTER_KEY) ?? undefined;
    const from_filter = searchParams.get(START_FILTER_KEY) ?? undefined;
    const to_filter = searchParams.get(END_FILTER_KEY) ?? undefined;

    const debounced_text_filter = useDebounce(text_filter, 300);

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);

    const [lastRefresh, setLastRefresh] = useAtom(lastRefreshAtom);

    useEffect(() => {
        const fetchData = async () => {
            const data = await api.getTags();
            setAvailableTags(data);
            console.log(data);
        };
        fetchData().catch(console.error);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getFlows({
                "flow.data": debounced_text_filter,
                dst_ip: service?.ip,
                dst_port: service?.port,
                from_time: from_filter,
                to_time: to_filter,
                service: "", // FIXME
                tags: selectedTags,
            });
            setFlowList(data);
            setLoading(false);
        };
        fetchData().catch(console.error);
    }, [
        service,
        debounced_text_filter,
        from_filter,
        to_filter,
        selectedTags,
        lastRefresh,
    ]);

    const mode = searchParams.get("correlation") ?? "time";
    const setCorrelationMode = (mode: string) => {
        searchParams.set(CORRELATION_MODE_KEY, mode);
        setSearchParams(searchParams);
    }

    const inactiveButtonClass = "bg-blue-100 text-gray-800 rounded-md px-2 py-1";
    const activeButtonClass = `${inactiveButtonClass} ring-2 ring-gray-500`;

    const navigate = useNavigate();
    const onClickNavigate = useCallback((loc: string) => navigate(loc, { replace: true }), [navigate]);

    const graphProps: GraphProps = {
        flowList: flowList,
        mode: mode,
        searchParams: searchParams,
        setSearchParams: setSearchParams,
        onClickNavigate: onClickNavigate,
    }

    return (
        <div>
            <div className="flex flex-col h-full">
                <div className="text-sm bg-white border-b-gray-300 border-b shadow-md flex flex-col">
                    <div className="p-2 flex space-x-2" style={{ height: 50 }}>
                        <a className="text-center px-2 py-2">Correlation mode: </a>
                        <button className={mode == "time" ? activeButtonClass : inactiveButtonClass}
                                onClick={() => setCorrelationMode("time")}>
                            time
                        </button>
                        <button className={mode == "packets" ? activeButtonClass : inactiveButtonClass}
                                onClick={() => setCorrelationMode("packets")}>
                            packets
                        </button>
                        <button className={mode == "tags" ? activeButtonClass : inactiveButtonClass}
                                onClick={() => setCorrelationMode("tags")}>
                            tags
                        </button>
                    </div>
                </div>
            </div>
            <div>
            </div>
            <div>
                {(mode == "packets" || mode == "time") && TimePacketGraph(graphProps)}
                {(mode == "tags") && TagGraph(graphProps)}
            </div>
        </div>
    );
}



function TimePacketGraph(graphProps: GraphProps) {
    const flowList = graphProps.flowList;
    const mode = graphProps.mode;
    const searchParams = graphProps.searchParams;
    const setSearchParams = graphProps.setSearchParams;
    const onClickNavigate = graphProps.onClickNavigate;

    const series: ApexAxisChartSeries = [{
        name: 'Flows',
        data: flowList.map((flow) => {
            let y = flow.duration;
            if (mode == "packets") {
                y = flow.num_packets
            }
            return { "x": flow.time, "y": y }
        })
    }];

    const options: ApexOptions = {
        dataLabels: {
            enabled: false
        },
        grid: {
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
        },
        xaxis: {
            type: 'datetime', // FIXME: Timezone is not displayed correctly
        },
        labels: flowList.map((flow) => { return flow._id.$oid; }),
        chart: {
            animations: {
                enabled: false
            },
            events: {
                dataPointSelection: (event: any, chartContext: any, config: any) => {
                    // Retrieve flowList from chart's labels. This is hacky, refer to FIXME above.
                    const flowIdList = config.w.config.labels;
                    const flow = flowIdList[config.dataPointIndex];
                    onClickNavigate(`/flow/${flow}?${searchParams}`);
                },
                beforeZoom: function(chartContext, { xaxis }) {
                    const start = Math.floor(xaxis.min);
                    const end = Math.ceil(xaxis.max);
                    searchParams.set(START_FILTER_KEY, start.toString())
                    searchParams.set(END_FILTER_KEY, end.toString())
                    setSearchParams(searchParams);
                }
            }
        },
    };

    return (
        <ReactApexChart
            options={options}
            series={series}
            type="scatter"
        />
    )
}


function TagGraph(graphProps: GraphProps) {
    const flowList = graphProps.flowList;
    const mode = graphProps.mode;
    const searchParams = graphProps.searchParams;
    const setSearchParams = graphProps.setSearchParams;

    function chunkData(flowList: Flow[]) {
        let ret: any = [];
        let ts = 0;
        let acc = 0;
        const window_size = 30000;
        flowList.forEach((flow) => {
            if (ts == 0) {ts = flow.time}

            if (ts - flow.time> window_size) {
                ret.push({"x": ts, "y": acc})
                ts = 0;
                acc = 0;
            } else {
                if (flow.tags.includes("flag-out")) {
                    acc++;
                }
            }
        });
        
        return ret;
    }

    const series_out: ApexAxisChartSeries = [{
        name: 'Flag-out',
        data:  chunkData(flowList)
    }];

    const options: ApexOptions = {
        dataLabels: {
            enabled: false
        },
        grid: {
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
        },
        xaxis: {
            type: 'datetime', // FIXME: Timezone is not displayed correctly
        },
        labels: flowList.map((flow) => { return flow._id.$oid; }),
        chart: {
            animations: {
                enabled: false
            },
            events: {
                  beforeZoom: function(chartContext, { xaxis }) {
                    const start = Math.floor(xaxis.min);
                    const end = Math.ceil(xaxis.max);
                    searchParams.set(START_FILTER_KEY, start.toString())
                    searchParams.set(END_FILTER_KEY, end.toString())
                    setSearchParams(searchParams);
                }
            }
        },
    };

    return (
        <ReactApexChart
            options={options}
            series={series_out}
            type="line"
        />
    )
}