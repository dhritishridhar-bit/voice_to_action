const recordBtn = document.getElementById("recordBtn");
const status = document.getElementById("status");
const transcript = document.getElementById("transcript");
const actionBtn = document.getElementById("actionBtn");
const actionBox = document.getElementById("actionBox");
const actionText = document.getElementById("actionText");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    status.textContent = "Speech recognition is not supported in this browser.";
    recordBtn.disabled = true;
} else {

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recordBtn.addEventListener("click", () => {

        recognition.start();

        recordBtn.textContent = "🔴 Recording...";
        recordBtn.classList.add("recording");

        status.textContent = "Listening... Speak now 🎙️";
    });

    recognition.onresult = (event) => {

        const text = event.results[0][0].transcript;

        transcript.textContent = text;

        status.textContent = "Voice note captured! ✅";

        recordBtn.textContent = "🎙️ Start Recording";
        recordBtn.classList.remove("recording");

        actionBtn.disabled = false;
    };

    recognition.onerror = (event) => {

        console.log(event.error);

        status.textContent =
            "Something went wrong. Please try again.";

        recordBtn.textContent = "🎙️ Start Recording";
        recordBtn.classList.remove("recording");
    };

    recognition.onend = () => {

        recordBtn.textContent = "🎙️ Start Recording";
        recordBtn.classList.remove("recording");
    };
}


actionBtn.addEventListener("click", async () => {

    const text = transcript.textContent;

    if (
        !text ||
        text === "Your transcript will appear here..."
    ) {
        return;
    }

    // Detect priority
    let priority = "Medium";

    if (/(urgent|asap|immediately|critical)/i.test(text)) {
        priority = "High";
    } else if (/(later|whenever|eventually)/i.test(text)) {
        priority = "Low";
    }

    try {

        const response = await fetch("/api/actions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                task: text,
                priority: priority
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        await loadActions();

        // Show action on screen
        actionText.innerHTML = `
            <strong>Task:</strong> ${text}<br><br>
            <strong>Priority:</strong> ${priority}<br><br>
            <strong>Status:</strong> Pending
        `;

        actionBox.classList.remove("hidden");

    } catch (error) {

        console.error("Error:", error);

        status.textContent =
            "Could not save action. Please try again.";
    }
});

async function loadActions() {
    try {
        const response = await fetch("/api/actions");
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        const existing = document.getElementById("savedActions");

        if (existing) {
            existing.remove();
        }

        const section = document.createElement("div");
        section.id = "savedActions";
        section.className = "saved-actions";

        section.innerHTML = `
            <h2>📋 Saved Actions</h2>
            ${data.actions.map(action => `
                <div class="saved-action">
                    <h3>✅ ${action.task}</h3>
                    <p><strong>Priority:</strong> ${action.priority}</p>
                    <p><strong>Status:</strong> ${action.status}</p>
                </div>
            `).join("")}
        `;

        document.querySelector(".container").appendChild(section);

    } catch (error) {
        console.error("Could not load actions:", error);
    }
}

loadActions();