// types/route.ts
export type ParamsPromise<T> = { params: Promise<T> };
export type HandlerCtx<T> = { params: Promise<T> };
