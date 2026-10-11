import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { analyzeText } from "./engine";
import { MAX_TEXT_LENGTH } from "@contracts/detector";

/**
 * Routeur de détection : expose l'analyse de texte via tRPC.
 */
export const detectorRouter = createRouter({
  analyze: publicQuery
    .input(
      z.object({
        text: z
          .string()
          .min(1, "Le texte ne peut pas être vide.")
          .max(MAX_TEXT_LENGTH, `Le texte ne peut pas dépasser ${MAX_TEXT_LENGTH} caractères.`),
      })
    )
    .mutation(({ input }) => analyzeText(input.text)),

  /** Métadonnées utiles à l'interface (seuils, limites). */
  config: publicQuery.query(() => ({
    minReliableWords: 80,
    maxTextLength: MAX_TEXT_LENGTH,
    targetAccuracy: "60-70 %",
  })),
});
