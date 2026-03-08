import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// In-memory User store (identifier -> password)
const userStore = new Map<string, string>();

// API Routes
app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;
  
  if (!identifier || !password) {
    return res.status(400).json({ error: "Identifier and password are required" });
  }

  const existingPassword = userStore.get(identifier);

  if (existingPassword) {
    // Existing user: check password
    if (existingPassword === password) {
      return res.json({ success: true, message: "Logged in successfully" });
    } else {
      return res.status(401).json({ error: "Invalid password for this account" });
    }
  } else {
    // New user: register them
    userStore.set(identifier, password);
    console.log(`[AUTH] New account created for ${identifier}`);
    return res.json({ success: true, message: "Account created and logged in" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
