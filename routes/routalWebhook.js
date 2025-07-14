import express from "express";
import { recibirWebhookRoutal } from "../controllers/routalWebhookController.js";
const router = express.Router();

router.post("/webhook", recibirWebhookRoutal);

export default router;
