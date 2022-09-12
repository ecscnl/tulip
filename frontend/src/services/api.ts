import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { API_BASE_PATH } from "../const";
import { Service, FullFlow, Signature } from "../types";

export const tulipApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_PATH }),
  endpoints: (builder) => ({
    getServices: builder.query<Service[], void>({
      query: () => "/services",
    }),
    getFlow: builder.query<FullFlow, string>({
      query: (id) => `/flow/${id}`,
    }),
    getTags: builder.query<string[], void>({
      query: () => `/tags`,
    }),
    getSignature: builder.query<Signature[], number>({
      query: (id) => `/signature/${id}`,
    }),
    toPwnTools: builder.query<string, string>({
      query: (id) => ({ url: `/to_pwn/${id}`, responseHandler: "text" }),
    }),
    toSinglePythonRequest: builder.query<
      string,
      { body: string; id: string; tokenize: boolean }
    >({
      query: ({ body, id, tokenize }) => ({
        url: `/to_single_python_request?tokenize/${
          tokenize ? "1" : "0"
        }&id=${id}`,
        method: "POST",
        responseHandler: "text",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
        body,
      }),
    }),
    toFullPythonRequest: builder.query<string, string>({
      query: (id) => ({
        url: `/to_python_request/${id}`,
        responseHandler: "text",
      }),
    }),
    // TODO: optimistic cache update
    starFlow: builder.mutation<unknown, { id: string; star: boolean }>({
      query: ({ id, star }) => `/star/${id}/${star ? "1" : "0"}`,
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetFlowQuery,
  useGetTagsQuery,
  useGetSignatureQuery,
  useLazyToPwnToolsQuery,
  useLazyToFullPythonRequestQuery,
  useToSinglePythonRequestQuery,
  useStarFlowMutation,
} = tulipApi;
