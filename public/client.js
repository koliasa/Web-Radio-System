const socket = io("ws://localhost:3000");
const button = document.getElementById("talkButton");
const statusElement = document.getElementById("status");
const indicatorElement = document.getElementById("indicator");
let localStream = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

function updateStatusMessage(message) {
  statusElement.textContent = message;
  socket.emit("updateStatus", message);
}

socket.on("startRecording", () => {
  indicatorElement.style.backgroundColor = "red";
  button.innerHTML = '<i class="fas fa-stop"></i>';
  button.style.backgroundColor = "#f44336";
  button.disabled = true;
  updateStatusMessage("Лінія зайнята");
});

socket.on("stopRecording", () => {
  indicatorElement.style.backgroundColor = "green";
  button.innerHTML = '<i class="fas fa-microphone"></i>';
  button.style.backgroundColor = "#4caf50";
  button.disabled = false;
  updateStatusMessage("Готові до розмови!");
});

socket.on("audioMessage", (data) => {
  const audioBlob = new Blob([data], { type: "audio/wav" });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();

  indicatorElement.style.backgroundColor = "yellow";
  updateStatusMessage("Відтворення аудіо...");
  audio.onended = () => {
    indicatorElement.style.backgroundColor = "green";
    updateStatusMessage("Готові до розмови!");
  };
});

socket.on("syncStatus", (message) => {
  statusElement.textContent = message;
});

async function startMicrophone() {
  try {
    if (location.protocol !== "https:" && !navigator.mediaDevices) {
      updateStatusMessage("Мікрофон працює тільки через HTTPS.");
      return;
    }
    if (localStream) return;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    updateStatusMessage("Готові до розмови!");
  } catch (err) {
    console.error("Помилка доступу до мікрофону:", err);
    updateStatusMessage("Помилка при доступі до мікрофону.");
  }
}

function stopMicrophone() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
    updateStatusMessage("Мікрофон відключено.");
  }
}

function startRecording() {
  audioChunks = [];
  mediaRecorder = new MediaRecorder(localStream);
  mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    socket.emit("message", audioBlob);
  };
  mediaRecorder.start();
  isRecording = true;
  updateStatusMessage("Говоріть...");
  socket.emit("startRecording");
}

function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    updateStatusMessage("Запис завершено.");
    stopMicrophone();
    isRecording = false;
    socket.emit("stopRecording");
  }
}

button.addEventListener("mousedown", async () => {
  if (!isRecording) {
    indicatorElement.style.backgroundColor = "red";
    await startMicrophone();
    startRecording();
  }
});

button.addEventListener("mouseup", () => {
  if (isRecording) {
    indicatorElement.style.backgroundColor = "green";
    stopRecording();
  }
});

button.addEventListener("touchstart", async () => {
  if (!isRecording) {
    indicatorElement.style.backgroundColor = "red";
    await startMicrophone();
    startRecording();
  }
});

button.addEventListener("touchend", () => {
  if (isRecording) {
    indicatorElement.style.backgroundColor = "green";
    stopRecording();
  }
});
