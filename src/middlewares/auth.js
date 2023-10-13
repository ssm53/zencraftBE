import { verifyAccessToken } from "../utils/jwt.js";

export default async function auth(req, res, next) {
  console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  console.log("check1");

  // const token = req.headers.authorization.split(" ")[1];
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  console.log("check2");

  await verifyAccessToken(token)
    .then((user) => {
      console.log("check3");
      req.user = user; // store the user in the `req` object. our next route now has access to the user via `req.user`
      next();
    })
    .catch((e) => {
      console.log("check4");
      return res.status(401).send({ error: e.message });
    });
}
