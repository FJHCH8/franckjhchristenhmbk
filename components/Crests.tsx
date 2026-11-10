import Image from "next/image";

export function CrestFilters() {
  return (
    <svg className="crest-filters" width="0" height="0" aria-hidden="true">
      <filter id="crest-ink" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0"
        />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0 0.06 0.4 0.82 1" />
        </feComponentTransfer>
      </filter>
      <filter id="crest-glow" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.2126 0.7152 0.0722 0 0"
        />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0 0.06 0.4 0.82 1" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}

const starCrop = {
  position: "absolute" as const,
  width: "187.266%",
  height: "248.756%",
  maxWidth: "none",
  left: "-41.074%",
  top: "-70.315%",
};

export function Crests() {
  return (
    <div className="crests">
      <CrestFilters />
      <span className="crest crest-blason">
        <Image className="for-clair" src="/blason-christen.jpg" alt="Blason Christen" fill sizes="320px" quality={95} priority />
        <Image className="for-sombre" src="/blason-christen.jpg" alt="" aria-hidden fill sizes="320px" quality={95} priority />
      </span>
      <span className="crest crest-stars">
        <Image className="for-clair" src="/logo-etoiles.jpg" alt="Étoiles" width={1500} height={1500} sizes="360px" quality={95} priority style={starCrop} />
        <Image
          className="for-sombre"
          src="/logo-etoiles.jpg"
          alt=""
          aria-hidden
          width={1500}
          height={1500}
          sizes="360px"
          quality={95}
          style={starCrop}
        />
      </span>
    </div>
  );
}
