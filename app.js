import express from "express";
import prisma from "./src/utils/prisma.js";
import morgan from "morgan";
import cors from "cors"; // Import the cors middleware
import { Prisma } from "@prisma/client";
import fs from "fs";
import multer from "multer";
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

// this is the new multer stuff for image variation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public-variarion");
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
app.post("/get-art", async (req, res) => {
  try {
    if (typeof req.body.prompt === "string") {
      // const imageCompletion = await openai.Image.create(
      const imageCompletion = await openai.images.generate({
        prompt: req.body.prompt,
        n: 1,
        size: "1024x1024",
      });

      const generatedImage = imageCompletion.data;
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
app.post("/generate-variation", async (req, res) => {
  try {
    const imageVariation = await openai.images.createVariation({
      image: fs.createReadStream(filePath),
      n: 1,
      size: "1024x1024",
    });
    const generatedVariation = imageVariation.data;
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
app.post("/generate-edit", async (req, res) => {
  try {
    const imageEdit = await openai.images.edit({
      image: fs.createReadStream(OriFilePath),
      mask: fs.createReadStream(MaskFilePath),
      prompt: req.body.prompt,
    });
    const generatedEdit = imageEdit.data;
    return res.status(200).json({ text: generatedEdit });
  } catch (error) {
    console.error("Error retrieving details:", error);
    res.status(403).json({
      text: "https://images.dog.ceo/breeds/ridgeback-rhodesian/n02087394_1722.jpg",
    });
  }
});

export default app;
