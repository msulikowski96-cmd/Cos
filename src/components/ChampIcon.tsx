import { useState } from "react";
import { iconUrl } from "../lib/icons";
import { CHAMP_BY_ID } from "../lib/champs";

interface Props {
  id: string;
  size?: number;
  className?: string;
  dim?: boolean;
}

/** Ikona championa z zapasowymi inicjałami, gdy obrazek się nie wczyta. */
export function ChampIcon({ id, size = 44, className = "", dim }: Props) {
  const [failed, setFailed] = useState(false);
  const name = CHAMP_BY_ID[id]?.name ?? id;
  const style = { width: size, height: size, minWidth: size };
  if (failed)
    return (
      <div
        style={style}
        className={`hex-frame grid place-items-center bg-panel-2 font-display font-bold text-gold ${className}`}
        aria-label={name}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  return (
    <img
      src={iconUrl(id)}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={style}
      className={`hex-frame object-cover ${dim ? "opacity-30 grayscale" : ""} ${className}`}
    />
  );
}
