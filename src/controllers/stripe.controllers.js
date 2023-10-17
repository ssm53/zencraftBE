import express from "express";
// const app = express();
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { filter } from "../utils/common.js";

const router = express.Router();

// put api key in .env.dev
const stripe = new Stripe(process.env.STRIPE_KEY);

router.post("/", async (req, res) => {
  const userId = req.body.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  // doing try and catch )maybe no need)

  try {
    const unitAmount = 10 * 100; // Assuming the price is in dollars
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Basic package",
              description: "You get a total of 50 prompts",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://zencraft.pages.dev/",
      cancel_url: `https://zencraft.pages.dev/failure`,
    });
    return res.json({ url: session.url, status: "success" });
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error with payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }

  // // return res.json(session.url);
  // // new one
  // // Return an appropriate status code and the session URL
  // if (session.id) {
  //   return res.json({ url: session.url, status: "success" });
  // } else {
  //   return res.json({ url: session.url, status: "failure" });
  // }
  // //new one ends here
});

export default router;
