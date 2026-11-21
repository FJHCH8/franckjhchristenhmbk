const LAYERS = [
  { blur: "1px", stop: "100%" },
  { blur: "3px", stop: "84%" },
  { blur: "6px", stop: "68%" },
  { blur: "12px", stop: "50%" },
  { blur: "22px", stop: "34%" },
  { blur: "40px", stop: "20%" },
];

export function TopBlur() {
  return (
    <div className="top-frost" aria-hidden="true">
      {LAYERS.map((layer) => (
        <div
          key={layer.blur}
          className="top-frost-layer"
          style={{ ["--blur" as string]: layer.blur, ["--stop" as string]: layer.stop }}
        />
      ))}
      <div className="top-frost-tint" />
    </div>
  );
}
