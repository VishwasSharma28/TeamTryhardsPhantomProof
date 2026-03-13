import Dither from "../background/Dither";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#040816]">
      <Dither 
        waveColor={[0.5, 0.7, 0.3]} 
        colorNum={6} 
        pixelSize={2}
        waveSpeed={0.05}
        waveFrequency={3}
        waveAmplitude={0.3}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#040816] via-transparent to-[#040816]/50 pointer-events-none"></div>
    </div>
  );
}
