export function SkinField() {
  return (
    <div className="skin-field" aria-hidden="true">
      <picture className="skin-layer skin-sharp">
        <source
          type="image/avif"
          sizes="100vw"
          srcSet="/fond/peau-640.avif 640w, /fond/peau-960.avif 960w, /fond/peau-1280.avif 1280w, /fond/peau-1500.avif 1500w"
        />
        <source
          type="image/webp"
          sizes="100vw"
          srcSet="/fond/peau-640.webp 640w, /fond/peau-960.webp 960w, /fond/peau-1280.webp 1280w, /fond/peau-1500.webp 1500w"
        />
        <img src="/fond/peau-1280.webp" alt="" width={1280} height={1708} />
      </picture>
      <picture className="skin-layer skin-mid">
        <img src="/fond/peau-flou-doux.webp" alt="" width={960} height={1281} />
      </picture>
      <picture className="skin-layer skin-far">
        <img src="/fond/peau-flou-fort.webp" alt="" width={720} height={961} />
      </picture>
    </div>
  );
}
