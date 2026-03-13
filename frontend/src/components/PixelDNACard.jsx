const PixelDNACard = ({ pixelForensics }) => {
  if (!pixelForensics) return null;

  const colorClass =
    pixelForensics.ai_confidence < 20
      ? 'bg-emerald-500'
      : pixelForensics.ai_confidence > 80
      ? 'bg-red-500'
      : 'bg-amber-500';

  return (
    <div className={`p-8 rounded-3xl shadow-2xl border-4 ${colorClass} text-white relative overflow-hidden`}>
      {/* Image type badge */}
      {pixelForensics.image_type && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
          pixelForensics.image_type === 'screenshot' ? 'bg-blue-500/90' : 'bg-green-500/90'
        }`}>
          {pixelForensics.image_type === 'screenshot' ? '📱 SCREENSHOT' : '📷 CAMERA'}
        </div>
      )}

      <div className="flex gap-6 mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl bg-white/20">
          {pixelForensics.icon_color}
        </div>
        <div>
          <h3 className="text-3xl font-black mb-2">Pixel DNA Analysis</h3>
          <div className="text-6xl font-mono">{pixelForensics.ai_confidence}%</div>
          {pixelForensics.type_label && (
            <div className="text-sm opacity-80 mt-1">{pixelForensics.type_label}</div>
          )}
        </div>
      </div>

      {pixelForensics.signatures && Object.keys(pixelForensics.signatures).length > 0 && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {Object.entries(pixelForensics.signatures).map(([key, value]) => (
            <div key={key} className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur">
              <div className="text-3xl font-bold">{typeof value === 'number' ? value.toFixed(1) : value}%</div>
              <div className="text-xs uppercase opacity-75 mt-1">{key.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm opacity-90 font-mono">{pixelForensics.method}</div>
    </div>
  );
};

export default PixelDNACard;
