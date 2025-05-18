// Landing.jsx
import React, { useEffect, useRef, useState } from "react";
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import backgroundImg from "../Images/flappybirdbg.png";
import logoImg from "../Images/flappyBirdLogo.png";
import playButtom from "../Images/flappyBirdPlayButton.png";

const boardWidth = 360;
const boardHeight = 640;

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const backgroundRef = useRef(new Image());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    backgroundRef.current.src = backgroundImg;

    backgroundRef.current.onload = () => {
      ctx.drawImage(backgroundRef.current, 0, 0, boardWidth, boardHeight);
    };
  }, []);

  return (
    <div style={{display:"flex", justifyContent:"center"}}>
    
    <Box position={"relative"} display={"inline-block"}>
        <canvas
        ref={canvasRef}
        width={boardWidth}
        height={boardHeight}
        style={{ border: '4px solid black', display: 'block'}  }
        >
      </canvas>
      {/* <Typography 
      variant="h3" 
      sx={{
                position: 'absolute',
                top: '30%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 'bold',
                minWidth: 120
            }}
      gutterBottom>Flappy Bird</Typography> */}
    <Box
        position={"absolute"}
        top="35%"
        left="50%"
        sx={{ transform: "translateX(-50%)" }}
      >
        <img src={logoImg} alt="Flappy Bird Logo" style={{ width: "200px" }} />
      </Box>
     <Box
        sx={{
            position: 'absolute',
            top: '53%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            '&:hover img': {
            filter: 'brightness(1.1) hue-rotate(20deg)' // greenish effect
            }
        }}
        onClick={() => navigate('/game')}
        >
        <img
            src={playButtom}
            alt="Play Button"
            style={{ width: "100px", cursor: "pointer" }}
        />
    </Box>

      <Button 
      variant="contained" 
      size="medium"
      sx={{
                position: 'absolute',
                top: '65%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 'bold',
                minWidth: 130,
                '&:hover': {
                backgroundColor: "#3cb371"
                }
        }}
      onClick={() => {
        navigate('/room')
      }}
      >
        Multiplayer
      </Button>
    </Box>
    </div>
  );
}
