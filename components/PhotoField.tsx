export function PhotoField({
  name,
  width,
  height,
  focus,
}: {
  name: string;
  width: number;
  height: number;
  focus: string;
}) {
  const file = (ext: string, size: number) => `/fond/${name}-${size}.${ext}`;
  return (
    <div className="photo-field" style={{ ["--photo-pos" as string]: focus }} aria-hidden="true">
      <picture className="skin-layer skin-sharp">
        <source
          type="image/avif"
          sizes="100vw"
          srcSet={`${file("avif", 640)} 640w, ${file("avif", 960)} 960w, ${file("avif", 1280)} 1280w, ${file("avif", width)} ${width}w`}
        />
        <source
          type="image/webp"
          sizes="100vw"
          srcSet={`${file("webp", 640)} 640w, ${file("webp", 960)} 960w, ${file("webp", 1280)} 1280w, ${file("webp", width)} ${width}w`}
        />
        <img src={file("jpg", 1280)} alt="" width={width} height={height} draggable={false} />
      </picture>
      <picture className="skin-layer skin-mid">
        <img src={`/fond/${name}-flou-doux.webp`} alt="" width={960} height={height} draggable={false} />
      </picture>
      <picture className="skin-layer skin-far">
        <img src={`/fond/${name}-flou-fort.webp`} alt="" width={720} height={height} draggable={false} />
      </picture>
    </div>
  );
}
