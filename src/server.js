import express from "express";

const PORT = process.env.PORT || 3000;

const initServer = (wechaty) => {
  const app = express();
  app.get("/", (req, res) => {
    if (!wechaty.isLoggedIn) {
      res.status(500).send("Wechaty is not logged in");
      return;
    }
    res.send("Wechaty is logged in");
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

export default initServer;
