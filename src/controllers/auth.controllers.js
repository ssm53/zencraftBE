import express from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { validateLogin } from "../validators/auth.js";
import { filter } from "../utils/common.js";
import { signAccessToken } from "../utils/jwt.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const data = req.body;

  const validationErrors = validateLogin(data);

  if (Object.keys(validationErrors).length != 0)
    return res.status(400).send({
      error: validationErrors,
    });

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  // so these parts is the start of the issue. other errors are ok
  if (!user)
    return res.status(401).send({
      error: "Email address or password not valid",
    });

  const checkPassword = bcrypt.compareSync(data.password, user.password);
  if (!checkPassword)
    return res.status(401).send({
      error: "Email address or password not valid",
    });

  const userFiltered = filter(user, "id", "name", "email");
  const accessToken = await signAccessToken(userFiltered);
  // const refreshToken = await signRefreshToken(userFiltered);

  // // Update the user's refreshToken in the database
  // await prisma.user.update({
  //   where: {
  //     id: user.id,
  //   },
  //   data: {
  //     refreshToken,
  //   },
  // });

  const userId = user.id;
  return res.json({ accessToken, userId });
});

export default router;
