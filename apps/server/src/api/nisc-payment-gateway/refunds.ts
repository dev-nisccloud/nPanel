/**
 * Nisc Payment Gateway - Refunds API
 * 
 * Create and query refunds via gateway
 */

import { Router } from "express";
import { z } from "zod";

import type { NiscPaymentGatewayRequest } from "@npanel/api/middleware/nisc-payment-gateway-auth";
import { requirePermission } from "@npanel/api/middleware/nisc-payment-gateway-auth";

// =============================================================================
// SCHEMAS
// =============================================================================

const createRefundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive().optional(), // Full refund if not specified
  reason: z.string().optional(),
});

// =============================================================================
// ROUTER
// =============================================================================

export const refundsRouter = Router();

/**
 * Create refund
 * 
 * POST /v1/refunds
 */
refundsRouter.post(
  "/",
  requirePermission("REFUND_CREATE"),
  async (req: NiscPaymentGatewayRequest, res) => {
    try {
      const input = createRefundSchema.parse(req.body);

      // TODO: Implement refund logic

      res.status(501).json({
        error: {
          code: "NOT_IMPLEMENTED",
          message: "Refunds not yet implemented",
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.errors,
          },
        });
        return;
      }

      throw error;
    }
  }
);

/**
 * Get refund by ID
 * 
 * GET /v1/refunds/:id
 */
refundsRouter.get(
  "/:id",
  requirePermission("REFUND_READ"),
  async (req: NiscPaymentGatewayRequest, res) => {
    res.status(501).json({
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Refunds not yet implemented",
      },
    });
  }
);
