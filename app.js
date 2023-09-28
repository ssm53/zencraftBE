import express from "express";
import prisma from "./src/utils/prisma.js";
import morgan from "morgan";
import cors from "cors"; // Import the cors middleware
import { Prisma } from "@prisma/client";
import OpenAI from "openai";

const app = express();
app.use(morgan("combined"));
app.use(cors()); // Use the cors middleware to allow cross-origin requests
app.use(express.json()); // Add this middleware to parse JSON in request bodies

// OPEN AI SECTION
// normal set up shit
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// endpoint for text generation
app.post("/get-answer", async (req, res) => {
  try {
    if (typeof req.body.prompt === "string") {
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: req.body.prompt,
          },
        ],
        model: "gpt-3.5-turbo",
        temperature: 0, // Adjust temperature as needed (0.2 for more focused, 0.8 for more random)
        max_tokens: 100,
      });
      const generatedAnswer = chatCompletion.choices[0].message.content;
      res.status(200).json({ text: generatedAnswer });
    }
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error retrieving details:", error);
    res.status(403).json({ text: "Invalid prompt provided." });
  }
});

// //endpoint for image generation
// app.get("/api/get-painting", async (req, res) => {
//   try {
//     if (typeof req.body.prompt === "string") {
//       const imageCompletion = await openai.Image.create(
//         (prompt = rew.body.prompt),
//         (n = 1),
//         (size = "1024x1024"),
//         (temperature = 0), // not sure if these two are ok for images and shit
//         (max_tokens = 100)
//       );
//       const generatedImage = response["data"][0]["url"];
//     }
//     res.status(200).json({ text: generatedImage });
//   } catch (error) {
//     // Handle errors and return an error response if needed
//     console.error("Error retrieving details:", error);
//     res.status(403).json({
//       text: "https://images.dog.ceo/breeds/ridgeback-rhodesian/n02087394_1722.jpg",
//     });
//   }
// });

export default app;
