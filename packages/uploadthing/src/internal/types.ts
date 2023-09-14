/* eslint-disable @typescript-eslint/ban-types */
import type { IncomingHttpHeaders } from "node:http";
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

import type {
  FileRouterInputConfig,
  UploadedFile,
  UploadThingError,
} from "@uploadthing/shared";

import type { JsonParser } from "./parser";

//
// Utils
export const unsetMarker = "unsetMarker" as "unsetMarker" & {
  __brand: "unsetMarker";
};
export type UnsetMarker = typeof unsetMarker;

export type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};

export type MaybePromise<TType> = TType | Promise<TType>;

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Overwrite<T, U> = Omit<T, keyof U> & U;

export type RequestLike = Overwrite<
  WithRequired<Partial<Request>, "json">,
  {
    headers: Headers | IncomingHttpHeaders;
  }
>;
//
// Package
type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<
    TParams["_metadata"] extends UnsetMarker ? undefined : TParams["_metadata"]
  >;

  file: UploadedFile;
};

export type AnyRuntime = "app" | "pages" | "web";
export interface AnyParams {
  _input: any;
  _metadata: any; // imaginary field used to bind metadata return type to an Upload resolver
  _runtime: any;
  _errorShape: any;
  _errorFn: any; // used for onUploadError
  _output: any;
}

type MiddlewareFnArgs<TParams extends AnyParams> =
  TParams["_runtime"] extends "web"
    ? { req: Request; res?: never; input: TParams["_input"] }
    : TParams["_runtime"] extends "app"
    ? { req: NextRequest; res?: never; input: TParams["_input"] }
    : { req: NextApiRequest; res: NextApiResponse; input: TParams["_input"] };

type MiddlewareFn<
  TOutput extends Record<string, unknown>,
  TParams extends AnyParams,
> = (opts: MiddlewareFnArgs<TParams>) => MaybePromise<TOutput>;

type ResolverFn<
  TOutput extends Record<string, unknown> | void,
  TParams extends AnyParams,
> = (opts: ResolverOptions<TParams>) => MaybePromise<TOutput>;

type UploadErrorFn = (input: {
  error: UploadThingError;
  fileKey: string;
}) => void;

export type ErrorMessage<TError extends string> = TError;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams["_input"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
    _input: TParser["_output"];
    _metadata: TParams["_metadata"];
    _runtime: TParams["_runtime"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  middleware: <TOutput extends Record<string, unknown>>(
    fn: TParams["_metadata"] extends UnsetMarker
      ? MiddlewareFn<TOutput, TParams>
      : ErrorMessage<"middleware is already set">,
  ) => UploadBuilder<{
    _input: TParams["_input"];
    _metadata: TOutput;
    _runtime: TParams["_runtime"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  onUploadError: (
    fn: TParams["_errorFn"] extends UnsetMarker
      ? UploadErrorFn
      : ErrorMessage<"onUploadError is already set">,
  ) => UploadBuilder<{
    _input: TParams["_input"];
    _metadata: TParams["_metadata"];
    _runtime: TParams["_runtime"];
    _errorShape: TParams["_errorShape"];
    _errorFn: UploadErrorFn;
    _output: UnsetMarker;
  }>;
  onUploadComplete: <TOutput extends Record<string, unknown> | void>(
    fn: ResolverFn<TOutput, TParams>,
  ) => Uploader<{
    _errorFn: TParams["_errorFn"];
    _errorShape: TParams["_errorShape"];
    _input: TParams["_input"];
    _metadata: TParams["_metadata"];
    _runtime: TParams["_runtime"];
    _output: TOutput;
  }>;
}

export type UploadBuilderDef<TParams extends AnyParams> = {
  routerConfig: FileRouterInputConfig;
  inputParser: JsonParser;
  middleware: MiddlewareFn<{}, TParams>;
  errorFormatter: (err: UploadThingError) => TParams["_errorShape"];
  onUploadError: UploadErrorFn;
};

export interface Uploader<TParams extends AnyParams> {
  _def: TParams & UploadBuilderDef<TParams>;
  resolver: ResolverFn<TParams["_output"], TParams>;
}

export type FileRouter<TParams extends AnyParams = AnyParams> = Record<
  string,
  Uploader<TParams>
>;

export type inferEndpointInput<TUploader extends Uploader<any>> =
  TUploader["_def"]["_input"] extends UnsetMarker
    ? undefined
    : TUploader["_def"]["_input"];

export type inferEndpointOutput<TUploader extends Uploader<any>> =
  TUploader["_def"]["_output"] extends UnsetMarker
    ? undefined
    : TUploader["_def"]["_output"];

export type inferErrorShape<TRouter extends FileRouter> =
  TRouter[keyof TRouter]["_def"]["_errorShape"];

export const VALID_ACTION_TYPES = ["upload", "failure"] as const;
export type ActionType = (typeof VALID_ACTION_TYPES)[number];
