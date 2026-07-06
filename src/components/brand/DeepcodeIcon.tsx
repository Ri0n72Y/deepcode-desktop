type DeepcodeIconProps = {
  className?: string;
};

const deepcodeIconUrl = new URL("../../assets/deepcoding_icon.svg", import.meta.url).href;

export default function DeepcodeIcon({ className }: DeepcodeIconProps) {
  return (
    <img
      className={className}
      src={deepcodeIconUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
