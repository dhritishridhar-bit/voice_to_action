const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

console.log("MongoDB URI loaded:", !!MONGODB_URI);

const client = new MongoClient(MONGODB_URI);

async function startServer() {
    try {
        await client.connect();

        console.log("MongoDB connected successfully! ✅");

        const db = client.db("voice_to_action");
        const actionsCollection = db.collection("actions");

        app.use(express.json());
        app.use(express.static(path.join(__dirname)));

        app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "index.html"));
        });

        app.get("/api/actions", async (req, res) => {
            try {
                const actions = await actionsCollection
                    .find()
                    .sort({ createdAt: -1 })
                    .toArray();

                res.json({
                    success: true,
                    actions: actions
                });

            } catch (error) {
                console.error(error);

                res.status(500).json({
                    success: false,
                    message: "Could not fetch actions"
                });
            }
        });

        app.post("/api/actions", async (req, res) => {
            try {
                const { task, priority } = req.body;

                const db = client.db("voice_to_action");
                const actions = db.collection("actions");

                await actions.insertOne({
                    task: task,
                    priority: priority,
                    status: "Pending",
                    createdAt: new Date()
                });

                res.json({
                    success: true,
                    message: "Action saved successfully"
                });

            } catch (error) {
                console.error("Error saving action:", error);

                res.status(500).json({
                    success: false,
                    message: "Failed to save action"
                });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();
