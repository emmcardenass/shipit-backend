import express from "express";
import { recibirWebhookShipday } from "../controllers/shipdayWebhookController.js";

const router = express.Router();

router.post("/webhook", express.json(), recibirWebhookShipday);

export default router;
