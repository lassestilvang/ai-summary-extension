const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post("/summarize", (req, res) => {
  const { content } = req.body;
  // Here you would implement the summarization logic.
  // For now, we'll just return a placeholder.
  const summary = `${content.substring(0, 100)}...`;
  res.json({ summary });
});

app.listen(port, () => {
  console.log(`Summary server listening at http://localhost:${port}`);
});
