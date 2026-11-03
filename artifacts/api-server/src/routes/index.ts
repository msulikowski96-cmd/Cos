import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import summonerRouter from "./summoner";
import analysisRouter from "./analysis-v2";
import championRouter from "./champion";
import matchRouter from "./match";
import aiAnalysisRouter from "./ai-analysis";
import aiCoachRouter from "./ai-coach";
import cardRouter from "./card";
import adminRouter from "./admin";
import draftRouter from "./draft";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Public
router.use(healthRouter);
router.use("/auth", authRouter);

// Public profile and live-game lookups. Usage-gated AI/analysis routes remain
// protected below, while the public UI can still search and view profiles.
router.use("/summoner", summonerRouter);
// Independent statistical analysis only reads Riot match data and is part of
// the public profile. The AI report remains protected below.
router.use("/summoner", analysisRouter);

// Nexus Draft: analiza draftu publiczna, trener AI sam sprawdza logowanie i limit.
router.use("/draft", draftRouter);

// All other API requires authentication
router.use(requireAuth);
router.use("/summoner", championRouter);
router.use("/summoner", aiAnalysisRouter);
router.use("/match", matchRouter);
router.use("/coach", aiCoachRouter);
router.use("/card", cardRouter);
router.use("/admin", adminRouter);

export default router;
