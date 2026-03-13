const ProductionPixelCard = ({ pixelForensics }) => {
  const isScreenshot = pixelForensics.image_type === 'screenshot';
  const colorClass = pixelForensics.ai_confidence < 25 ? 'bg-emerald-500' : 
                    pixelForensics.ai_confidence > 80 ? 'bg-red-500' : 'bg-amber-500';
  
  return (
    <div className={`p-8 rounded-3xl shadow-2xl border-4 ${colorClass} text-white relative overflow-hidden`}>
      {/* Image type badge */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
        isScreenshot ? 'bg-blue-500/90' : 'bg-green-500/90'
      }`}>
        {isScreenshot ? '📱 SCREENSHOT' : '📷 CAMERA'}
      </div>
      
      <div className="flex gap-6 mb-6 relative z-10">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl bg-white/20`}>
          {pixelForensics.icon_color}
        </div>
        <div>
          <h3 className="text-3xl font-black mb-2">Pixel Forensics</h3>
          <div className="text-6xl font-mono">{pixelForensics.ai_confidence}%</div>
          <div className="text-lg opacity-90 mt-1">{pixelForensics.method}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        {Object.entries(pixelForensics.signatures).map(([key, value]) => (
          <div key={key} className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur">
            <div className="text-3xl font-bold">{value.toFixed(1)}%</div>
            <div className="text-xs uppercase opacity-75 mt-1">{key.replace('_', ' ')}</div>
          </div>
        ))}
      </div>
      
      {/* Technical details */}
      <div className="grid grid-cols-3 gap-4 text-xs opacity-80">
        <div>Brightness: {pixelForensics.technical_details.brightness}</div>
        <div>Noise: {pixelForensics.technical_details.noise_var}</div>
        <div>Edges: {pixelForensics.technical_details.edge_density}</div>
      </div>
    </div>
  );
};

export default ProductionPixelCard;
