import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getDDVersion } from "../lib/ddragon";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/ddragon-version", (_req, res) => {
  res.json({ version: getDDVersion() });
});

export default router;
