const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

server.listen(process.env.PORT || 3000, () => {
  console.log("Сервер працює на порту " + (process.env.PORT || 3000));
});

io.on("connection", (socket) => {
  console.log("Клієнт підключений");

  socket.on("startRecording", () => {
    socket.broadcast.emit("startRecording");
  });

  socket.on("stopRecording", () => {
    socket.broadcast.emit("stopRecording");
  });

  socket.on("message", (data) => {
    const fileName = `${Date.now()}.wav`;
    const audioDir = path.join(__dirname, "audio_recordings");

    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir);
    }

    const filePath = path.join(audioDir, fileName);

    fs.writeFile(filePath, data, (err) => {
      if (err) {
        console.error("Помилка при збереженні аудіо:", err);
        return;
      }
      console.log(`Аудіо записано у файл: ${filePath}`);
    });

    socket.broadcast.emit("audioMessage", data);
  });

  socket.on("updateStatus", (message) => {
    socket.broadcast.emit("syncStatus", message);
  });

  socket.on("disconnect", () => {
    console.log("Клієнт відключився");
  });
});
