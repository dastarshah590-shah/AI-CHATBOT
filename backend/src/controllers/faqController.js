import { z } from "zod";
import { createFAQ, deleteFAQ, listFAQs, updateFAQ } from "../services/faqService.js";
import { asyncHandler, sendError, sendSuccess } from "../utils/responseFormatter.js";

const faqSchema = z.object({
  question: z.string().min(4),
  answer: z.string().min(4),
  category: z.string().default("General"),
  language: z.string().default("en"),
  isActive: z.boolean().default(true)
});

export const getFAQs = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const faqs = await listFAQs(includeInactive);
  sendSuccess(res, { faqs });
});

export const addFAQ = asyncHandler(async (req, res) => {
  const faq = await createFAQ({
    ...faqSchema.parse(req.body),
    createdBy: req.user?.id
  });
  sendSuccess(res, { message: "FAQ added successfully", faq }, 201);
});

export const editFAQ = asyncHandler(async (req, res) => {
  const faq = await updateFAQ(req.params.id, faqSchema.partial().parse(req.body));

  if (!faq) {
    sendError(res, "FAQ not found", 404);
    return;
  }

  sendSuccess(res, { message: "FAQ updated successfully", faq });
});

export const removeFAQ = asyncHandler(async (req, res) => {
  const deleted = await deleteFAQ(req.params.id);

  if (!deleted) {
    sendError(res, "FAQ not found", 404);
    return;
  }

  sendSuccess(res, { message: "FAQ deleted successfully" });
});
