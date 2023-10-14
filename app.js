import express from "express";
import prisma from "./src/utils/prisma.js";
import morgan from "morgan";
import cors from "cors"; // Import the cors middleware
import { Prisma } from "@prisma/client";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";
import auth from "./src/middlewares/auth.js";
import signUpRouter from "./src/controllers/signUp.controllers.js";
import authRouter from "./src/controllers/auth.controllers.js";
import stripeRouter from "./src/controllers/stripe.controllers.js";

const app = express();
app.use(morgan("combined"));
app.use(cors()); // Use the cors middleware to allow cross-origin requests
app.use(express.json()); // Add this middleware to parse JSON in request bodies
app.use("/sign-up", signUpRouter);
app.use("/auth", authRouter);
app.use("/create-checkout-session", stripeRouter);

// OPEN AI SECTION
// normal set up shit
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// this is the new multer stuff for image variation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public-variation");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "" + file.originalname);
  },
});
const upload = multer({ storage: storage }).single("file");
let filePath;
// ends here

// this is the multer stuff for ori image edit
const editOriStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public-edit");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "" + file.originalname);
  },
});

const editOriUpload = multer({ storage: editOriStorage }).single("file");
let OriFilePath;
//ends here

// multer stuff for mask image edit
const editMaskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public-mask");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "" + file.originalname);
  },
});

const editMaskUpload = multer({ storage: editMaskStorage }).single("file");
let MaskFilePath;
// ends here

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

//endpoint for image generation
app.post("/get-art", auth, async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    if (typeof req.body.prompt === "string") {
      // const imageCompletion = await openai.Image.create(
      const imageCompletion = await openai.images.generate({
        prompt: req.body.prompt,
        n: 1,
        size: req.body.size,
      });

      const generatedImage = imageCompletion.data;

      const createGenImage = await prisma.genImage.create({
        data: {
          userId: req.body.userId,
          prompt: req.body.prompt,
          size: req.body.size,
          url: generatedImage[0].url,
        },
      });
      res.status(200).json({ text: generatedImage });
    }
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error retrieving details:", error);
    res.status(403).json({
      text: "https://images.dog.ceo/breeds/ridgeback-rhodesian/n02087394_1722.jpg",
    });
  }
});

//endpoint for image variation - ORIGINAL ENDPOINT USING AWS AND PRISMA
app.post("/generate-variation/:userId", auth, async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter
  try {
    const imageVariation = await openai.images.createVariation({
      image: fs.createReadStream(filePath),
      n: 2,
      size: "512x512",
    });
    const generatedVariation = imageVariation.data;

    for (let i = 0; i < generatedVariation.length; i++) {
      const createVarImage = await prisma.varImage.create({
        data: {
          userId: userId,
          size: "512x512",
          url: generatedVariation[i].url,
        },
      });
    }
    return res.status(200).json({ text: generatedVariation });
  } catch (error) {
    console.error("Error retrieving details:", error);
    res.status(403).json({
      text: "https://images.dog.ceo/breeds/ridgeback-rhodesian/n02087394_1722.jpg",
    });
  }
});

//endpoint for upload image - ENDPOINT USING MULTER to make a new file
// i made a public directory
app.post("/upload", async (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    filePath = req.file.path;
  });
});

app.post("/upload-original", async (req, res) => {
  editOriUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    OriFilePath = req.file.path;
  });
});

app.post("/upload-mask", async (req, res) => {
  editMaskUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    MaskFilePath = req.file.path;
  });
});

//endpoint for image variation - ORIGINAL ENDPOINT USING AWS AND PRISMA
app.post("/generate-edit", auth, async (req, res) => {
  try {
    const imageEdit = await openai.images.edit({
      image: fs.createReadStream(OriFilePath),
      mask: fs.createReadStream(MaskFilePath),
      prompt: req.body.prompt,
    });
    const generatedEdit = imageEdit.data;

    const createEditImage = await prisma.editImage.create({
      data: {
        userId: req.body.userId,
        prompt: req.body.prompt,
        size: "512x512",
        url: generatedEdit[0].url,
      },
    });
    return res.status(200).json({ text: generatedEdit });
  } catch (error) {
    console.error("Error retrieving details:", error);
    res.status(403).json({
      text: "https://images.dog.ceo/breeds/ridgeback-rhodesian/n02087394_1722.jpg",
    });
  }
});

// endpoint to get my generated images to display in my-libarry page
app.get("/my-gen-images/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter

  try {
    // Use Prisma to find images owned by the specified user
    const myGenImages = await prisma.genImage.findMany({
      where: {
        userId: userId,
      },
    });

    // Return the images as JSON response
    return res.json({ myGenImages, userId }); // added user: for redirect.. place change to userid if needed
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error retrieving images:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// endpoint to get my variation images to display in my-libarry page
app.get("/my-var-images/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter

  try {
    // Use Prisma to find images owned by the specified user
    const myVarImages = await prisma.varImage.findMany({
      where: {
        userId: userId,
      },
    });

    // Return the images as JSON response
    return res.json({ myVarImages, userId }); // added user: for redirect.. place change to userid if needed
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error retrieving images:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// endpoint to get my edit images to display in my-libarry page
app.get("/my-edit-images/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter

  try {
    // Use Prisma to find images owned by the specified user
    const myEditImages = await prisma.editImage.findMany({
      where: {
        userId: userId,
      },
    });

    // Return the images as JSON response
    return res.json({ myEditImages, userId }); // added user: for redirect.. place change to userid if needed
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error retrieving images:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// endpoint to increment noofpromts field by 1
app.post("/inc-no-of-prompts/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter

  try {
    // Use Prisma to increment the no_of_prompts field for the specified user
    const incPrompts = await prisma.user.update({
      where: { id: userId },
      data: {
        no_of_prompts: { increment: 1 },
        prompts_remaining: { decrement: 1 },
      },
    });

    // Return the images as JSON response
    return res.json({ incPrompts, userId });
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error increasing prompts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// endpoint to get number of prompts to be used to calculate prompts remaining in header
app.get("/no-of-prompts/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter

  try {
    // Use Prisma to find the no_of_prompts for the specified user
    const number = await prisma.user.findUnique({
      where: { id: userId },
      select: { no_of_prompts: true }, // Select only the no_of_prompts field
    });

    // Return the images as JSON response
    return res.json({ promptNumber: number.no_of_prompts });
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error retrieving no of prompts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// endpoint to get number of prompts remaining to see if api call can be done by user or not
app.get("/prompts-remaining/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter

  try {
    // Use Prisma to find the no_of_prompts remaining by user
    const number2 = await prisma.user.findUnique({
      where: { id: userId },
      select: { prompts_remaining: true },
    });

    // Return the images as JSON response
    return res.json({ promptsRemaining: number2.prompts_remaining });
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error retrieving no of prompts remaining:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// endpoint to increment noofpromts field by 1
app.post("/inc-prompts-remaining/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId); // Parse userId from the URL parameter

  try {
    // Use Prisma to increment the prompts remaining for this user by 50
    const incPromptsRemaining = await prisma.user.update({
      where: { id: userId },
      data: {
        prompts_remaining: { increment: 50 },
      },
    });

    // Return the images as JSON response
    return res.json({ incPromptsRemaining, userId });
  } catch (error) {
    // Handle errors and return an error response if needed
    console.error("Error increasing prompts remaining:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
export default app;
