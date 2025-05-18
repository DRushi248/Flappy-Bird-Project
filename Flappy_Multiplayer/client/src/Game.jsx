import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import flappyBirdImg from "../Images/flappybird.png";
import topPipeImg from "../Images/toppipe.png";
import bottomPipeImg from "../Images/bottompipe.png";
import gameOverImgSrc from "../Images/gameover.png";
import backgroundImg from "../Images/flappybirdbg.png";
import logoImg from "../Images/flappyBirdLogo.png";


const boardWidth = 360;
const boardHeight = 640;
const gravity = 0.4;
const velocityX = -2;

export default function Game({ onRestart }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const birdImg = useRef(new Image());
  const topPipe = useRef(new Image());
  const bottomPipe = useRef(new Image());
  const backgroundRef = useRef(new Image());
  const gameOverImg = useRef(new Image());

  const scoreRef = useRef(0);
  const highScoreRef =  useRef(0);



  const bird = useRef({ x: boardWidth / 8, y: boardHeight / 2, width: 34, height: 24 });
  const pipes = useRef([]);

  const velocityY = useRef(0);
  
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

      const resetGame = () => {
      bird.current.y = boardHeight / 2;
      pipes.current = [];
      velocityY.current = 0;
        scoreRef.current = 0;
      setGameOver(false);
    };

    useEffect(() => {
      const storedHighScore = localStorage.getItem("highScore");
      if (storedHighScore) {
        highScoreRef.current = parseInt(storedHighScore);
        setHighScore(highScoreRef.current);
      }
    }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    birdImg.current.src = flappyBirdImg;
    topPipe.current.src = topPipeImg;
    bottomPipe.current.src = bottomPipeImg;
    backgroundRef.current.src = backgroundImg;
    gameOverImg.current.src = gameOverImgSrc;

    let animationFrameId;
    let pipeIntervalId;

    const draw = () => {
    //   if (gameOver) return;

      ctx.clearRect(0, 0, boardWidth, boardHeight);
      ctx.drawImage(backgroundRef.current, 0, 0, boardWidth, boardHeight);

      // gravity
      velocityY.current += gravity;
      bird.current.y = Math.max(bird.current.y + velocityY.current, 0);
      if (bird.current.y > boardHeight) setGameOver(true);

      ctx.drawImage(backgroundRef.current, 0, 0, boardWidth, boardHeight);

      ctx.drawImage(birdImg.current, bird.current.x, bird.current.y, bird.current.width, bird.current.height);

      pipes.current.forEach((pipe) => {
        pipe.x += velocityX;
        ctx.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.current.x > pipe.x + pipe.width) {
            scoreRef.current += 0.5;
          pipe.passed = true;
        }

        if (checkCollision(bird.current, pipe)) setGameOver(true);
      });

      // remove off-screen pipes
      pipes.current = pipes.current.filter(pipe => pipe.x + pipe.width > 0);

      // score
      ctx.fillStyle = "white";
      ctx.font = "45px sans-serif";
    //   ctx.textAlign = "right";
      ctx.fillText(Math.floor(scoreRef.current), 5, 45);

      if(scoreRef.current >= highScoreRef.current) {
        highScoreRef.current = scoreRef.current;
        localStorage.setItem("highScore", highScoreRef.current.toString());
      }
    //   console.log(highScoreRef.current);
      
        ctx.fillStyle = "red";
        ctx.font = "20px sans-serif";
        // ctx.textAlign = "left";
        ctx.fillText("High Score: " + highScoreRef.current, boardWidth-140, 35);
      if (gameOver) {
        return;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

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
        passed: false
      };

      const bottom = {
        img: bottomPipe.current,
        x: boardWidth,
        y: randomY + pipeHeight + opening,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
      };

      pipes.current.push(top, bottom);
    };

    const moveBird = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === "KeyX") {
        velocityY.current = -6;
        if (gameOver) {
          resetGame();
        }
      }
    };



    document.addEventListener('keydown', moveBird);
    pipeIntervalId = setInterval(addPipes, 1500);
    draw();

    return () => {
      document.removeEventListener('keydown', moveBird);
      clearInterval(pipeIntervalId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver]);

  const checkCollision = (a, b) => {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  };

  return (
    <div style={{ textAlign: 'center'}}>
    <Box position={"relative"} display={"inline-block"}>
      <canvas
        ref={canvasRef}
        width={boardWidth}
        height={boardHeight}
        style={{ border: '4px solid black', display: 'block'}  }
      >

      </canvas>
        {gameOver && (
        <>
            <Box
                position={"absolute"}
                top="37%"
                left="52%"
                sx={{ transform: "translateX(-50%)" }}
              >
                <img src={gameOverImgSrc} alt="Game Over Logo" style={{ width: "300px" }} />
            </Box>
            <Button
            variant="contained"
            onClick={resetGame}
            startIcon={<span>&#x21bb;</span>} // Unicode for restart arrow
            size="medium"
            sx={{
                position: 'absolute',
                top: '55%',
                left: '30%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 'bold',
                minWidth: 120,
                minHeight: 50
            }}
            >
            Restart
            </Button>,

            <Button 
                variant="contained"
                onClick={() => navigate("/")}
                // startIcon={<span>&#x2302;</span>}
                size="medium"
                sx={{
                    position: 'absolute',
                    top: "55%",
                    left: "70%",
                    transform: "translate(-50%, -50%)",
                    fontWeight: "bold",
                    minWidth: 120,
                    minHeight: 50
                }}
            >
                Home
            </Button>
        </>
        )}
    </Box>
    </div>
  );
}

