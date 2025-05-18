
import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { io } from "socket.io-client";

import flappyBirdImg from "../Images/flappybird.png";
import topPipeImg from "../Images/toppipe.png";
import bottomPipeImg from "../Images/bottompipe.png";
import gameOverImgSrc from "../Images/gameover.png";
import backgroundImg from "../Images/flappybirdbg.png";

// Constants
const boardWidth = 360;
const boardHeight = 640;
const gravity = 0.4;
const velocityX = -2;

export default function Multiplayer({ onRestart }) {
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [roomFull, setRoomFull] = useState(false);
  const socketRef = useRef(null);

  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Image refs
  const birdImg = useRef(new Image());
  const topPipe = useRef(new Image());
  const bottomPipe = useRef(new Image());
  const backgroundRef = useRef(new Image());
  const gameOverImg = useRef(new Image());

  // Refs for bird position, velocity, score
  const bird = useRef({ x: boardWidth / 8, y: boardHeight / 2, width: 34, height: 24 });
  const pipes = useRef([]);
  const velocityY = useRef(0);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);

  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Reset the game state
  const resetGame = () => {
    bird.current.y = boardHeight / 2;
    pipes.current = [];
    velocityY.current = 0;
    scoreRef.current = 0;
    setGameOver(false);
  };

  // Load images once
  useEffect(() => {
    birdImg.current.src = flappyBirdImg;
    topPipe.current.src = topPipeImg;
    bottomPipe.current.src = bottomPipeImg;
    backgroundRef.current.src = backgroundImg;
    gameOverImg.current.src = gameOverImgSrc;
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setPlayerId(newSocket.id);
      console.log("Connected as", newSocket.id);
    });

    newSocket.on("roomFull", () => {
      setRoomFull(true);
      alert("Room is full. Try again later.");
      navigate("/");
    });

    newSocket.on("playerJoined", (count) => {
      console.log("Players in room:", count);
    });

    newSocket.on("scores", (playerArray) => {
      setPlayers(prev => JSON.stringify(prev) !== JSON.stringify(playerArray) ? playerArray : prev);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load high score from localStorage
  useEffect(() => {
    const storedHighScore = localStorage.getItem("highScore");
    if (storedHighScore) {
      highScoreRef.current = parseInt(storedHighScore);
      setHighScore(highScoreRef.current);
    }
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let pipeIntervalId;
    let lastScoreSent = 0;

    const draw = () => {
      ctx.clearRect(0, 0, boardWidth, boardHeight);

      // Draw background
      ctx.drawImage(backgroundRef.current, 0, 0, boardWidth, boardHeight);

      // Gravity effect
      velocityY.current += gravity;
      bird.current.y = Math.max(bird.current.y + velocityY.current, 0);
      if (bird.current.y > boardHeight) setGameOver(true);

      // Draw bird
      ctx.drawImage(birdImg.current, bird.current.x, bird.current.y, bird.current.width, bird.current.height);

      // Move and draw pipes
      pipes.current.forEach((pipe) => {
        pipe.x += velocityX;
        ctx.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.current.x > pipe.x + pipe.width) {
          scoreRef.current += 0.5;
          pipe.passed = true;
        }

        const roundedScore = Math.floor(scoreRef.current);
        if (socketRef.current && roundedScore !== lastScoreSent) {
          lastScoreSent = roundedScore;
          socketRef.current.emit("scoreUpdate", roundedScore);
        }

        if (checkCollision(bird.current, pipe)) setGameOver(true);
      });

      // Remove off-screen pipes
      pipes.current = pipes.current.filter(pipe => pipe.x + pipe.width > 0);

      // Draw score
      ctx.fillStyle = "white";
      ctx.font = "45px sans-serif";
      ctx.fillText(Math.floor(scoreRef.current), 5, 45);

      // Update and show high score
      if (scoreRef.current >= highScoreRef.current) {
        highScoreRef.current = scoreRef.current;
        localStorage.setItem("highScore", highScoreRef.current.toString());
        setHighScore(highScoreRef.current);
      }

      ctx.fillStyle = "red";
      ctx.font = "20px sans-serif";
      ctx.fillText("High Score: " + highScoreRef.current, boardWidth - 140, 35);

      // Display other players' scores
      let y = 65;
      players.forEach((p) => {
        if (p.playerId !== socketRef.current?.id) {
          ctx.fillText(`Opponent: ${p.score}`, boardWidth - 140, y);
          y += 25;
        }
      });

      if (!gameOver) animationFrameId = requestAnimationFrame(draw);
    };

    // Add pipe pair to canvas
    const addPipes = () => {
      if (gameOver) return;

      const pipeY = 0;
      const pipeHeight = 512;
      const pipeWidth = 64;
      const opening = boardHeight / 4;
      const randomY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

      const top = {
        img: topPipe.current,
        x: boardWidth,
        y: randomY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
      };

      const bottom = {
        img: bottomPipe.current,
        x: boardWidth,
        y: randomY + pipeHeight + opening,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
      };

      pipes.current.push(top, bottom);
    };

    // Handle key press
    const moveBird = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
        velocityY.current = -6;
        if (gameOver) {
          resetGame();
        }
      }
    };

    document.addEventListener("keydown", moveBird);
    pipeIntervalId = setInterval(addPipes, 1500);
    draw();

    return () => {
      document.removeEventListener("keydown", moveBird);
      clearInterval(pipeIntervalId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver]);

  // Collision detection
  const checkCollision = (a, b) => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  if (roomFull) {
    return (
      <Box textAlign="center" mt={10}>
        <Typography variant="h4" color="error">
          Room is full. Try again later.
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/")}>
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <Box position={"relative"} display={"inline-block"}>
        <canvas
          ref={canvasRef}
          width={boardWidth}
          height={boardHeight}
          style={{ border: "4px solid black", display: "block" }}
        ></canvas>

        {gameOver && (
          <>
            {/* Game Over Message */}
            <Box
              position={"absolute"}
              top="37%"
              left="52%"
              sx={{ transform: "translateX(-50%)" }}
            >
              <img
                src={gameOverImgSrc}
                alt="Game Over Logo"
                style={{ width: "300px" }}
              />
            </Box>

            {/* Restart Button */}
            <Button
              variant="contained"
              onClick={resetGame}
              startIcon={<span>&#x21bb;</span>}
              size="medium"
              sx={{
                position: "absolute",
                top: "55%",
                left: "30%",
                transform: "translate(-50%, -50%)",
                fontWeight: "bold",
                minWidth: 120,
                minHeight: 50,
              }}
            >
              Restart
            </Button>

            {/* Home Button */}
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              size="medium"
              sx={{
                position: "absolute",
                top: "55%",
                left: "70%",
                transform: "translate(-50%, -50%)",
                fontWeight: "bold",
                minWidth: 120,
                minHeight: 50,
              }}
            >
              Home
            </Button>
          </>
        )}
      </Box>

      {/* Show all players' scores */}
      <Box mt={2}>
        <Typography variant="h6" gutterBottom>
          Players in Room
        </Typography>
        {players.map((p) => (
          <Typography
            key={p.playerId}
            color={p.playerId === playerId ? "primary" : "textSecondary"}
          >
            {p.playerId === playerId ? "You" : "Player"}: {p.score}
          </Typography>
        ))}
      </Box>
    </div>
  );
}

