import pino from "./pino";
export default function pinoHttp(opts?: { logger?: any }) {
  const logger = opts?.logger ?? pino();
  return (req: any, _res: any, next: () => void) => { req.log = logger; next(); };
}
