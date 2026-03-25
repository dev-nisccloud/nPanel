import { cn } from "@/lib/utils";

interface TemplateCardProps {
  imageSrc: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  description: string;
  width: number;
  height: number;
}

export const TemplateCard = ({
  imageSrc,
  title,
  onClick,
  disabled,
  description,
  height,
  width,
}: TemplateCardProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex flex-col space-y-2 text-left transition",
        disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
      )}
    >
      <div
        style={{ aspectRatio: `${width}/${height}` }}
        className="relative h-full w-full overflow-hidden rounded-xl border"
      >
        <img
          src={imageSrc}
          alt={title}
          className="absolute inset-0 h-full w-full transform object-cover transition group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 backdrop-blur-sm backdrop-filter transition group-hover:opacity-100">
          <p className="font-medium text-white">Open in editor</p>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs opacity-0 transition group-hover:opacity-75">
          {description}
        </p>
      </div>
    </button>
  );
};
