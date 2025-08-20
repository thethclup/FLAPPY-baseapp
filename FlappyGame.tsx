"use client";
import React, { useEffect, useRef, useState } from "react";
import { isAddressAllowed, BASE_CHAIN_ID_DEC } from "../lib/wallet";

class Bird {
  x: number; y: number; vy: number; radius: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; this.vy = 0; this.radius = 14; }
  flap() { this.vy = -6.5; }
  update(gravity: number, height: number) {
    this.vy += gravity; this.y += this.vy;
    if (this.y < this.radius) { this.y = this.radius; this.vy = 0; }
    if (this.y > height - this.radius) { this.y = height - this.radius; this.vy = 0; }
  }
  draw(ctx: CanvasRenderingContext2D) { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); }
}

class Pipe {
  x: number; width: number; gapY: number; gapH: number; speed: number; counted = false;
  constructor(x:number, width:number, gapY:number, gapH:number, speed:number){
    this.x=x; this.width=width; this.gapY=gapY; this.gapH=gapH; this.speed=speed;
  }
  update(){this.x-=this.speed;}
  offscreen(){return this.x+this.width<0;}
  collides(b:Bird){const inX=b.x+b.radius>this.x&&b.x-b.radius<this.x+this.width; const inYGap=b.y-b.radius>this.gapY&&b.y+b.radius<this.gapY+this.gapH; return inX&&!inYGap;}
  draw(ctx:CanvasRenderingContext2D,height:number){ctx.fillRect(this.x,0,this.width,this.gapY); ctx.fillRect(this.x,this.gapY+this.gapH,this.width,height-(this.gapY+this.gapH));}
}

type Props={account:string|null;chainId:number|null;};

export default function FlappyGame({account,chainId}:Props){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const [score,setScore]=useState(0);
  const [running,setRunning]=useState(false);
  const allowed=isAddressAllowed(account);
  const onBase=chainId===BASE_CHAIN_ID_DEC;

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    const DPR=Math.min(2,window.devicePixelRatio||1);
    const W=380,H=600;
    canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=`${W}px`;canvas.style.height=`${H}px`;ctx.scale(DPR,DPR);
    let bird=new Bird(90,H/2),pipes:Pipe[]=[],frame=0,localScore=0,alive=true;
    const gravity=0.35,pipeGap=145,pipeWidth=70,pipeSpeed=2.85,spawnEvery=95;

    function reset(){bird=new Bird(90,H/2);pipes=[];frame=0;localScore=0;alive=true;setScore(0);}
    function tick(){
      if(!running||!allowed||!onBase)return;
      frame++; ctx.clearRect(0,0,W,H); ctx.fillStyle="#C2F0FF"; ctx.fillRect(0,0,W,H);
      if(frame%spawnEvery===0){const top=50,bottom=200,gapY=Math.floor(Math.random()*(H-bottom-top))+top; pipes.push(new Pipe(W,pipeWidth,gapY-pipeGap/2,pipeGap,pipeSpeed));}
      ctx.fillStyle="#4CAF50";
      for(let i=pipes.length-1;i>=0;i--){const p=pipes[i];p.update();p.draw(ctx,H); if(!p.counted&&p.x+p.width<bird.x-bird.radius){p.counted=true;localScore++;setScore(localScore);} if(p.collides(bird))alive=false; if(p.offscreen())pipes.splice(i,1);}
      ctx.fillStyle="#8D6E63"; ctx.fillRect(0,H-20,W,20);
      ctx.fillStyle="#FFB300"; bird.update(gravity,H-20); bird.draw(ctx);
      ctx.fillStyle="#1F2937"; ctx.font="bold 18px sans-serif"; ctx.fillText(`Score: ${localScore}`,12,28);
      if(!alive){ctx.fillText("🔁 Click to restart",50,H/2); setRunning(false);} else {requestAnimationFrame(tick);}
    }

    function flap(){if(!allowed||!onBase)return; bird.flap(); if(!running){reset(); setRunning(true); requestAnimationFrame(tick);}}
    canvas.addEventListener("click",flap);
    return ()=>canvas.removeEventListener("click",flap);
  },[allowed,onBase,running]);

  return <canvas ref={canvasRef} style={{border:"1px solid #000"}} />;
}