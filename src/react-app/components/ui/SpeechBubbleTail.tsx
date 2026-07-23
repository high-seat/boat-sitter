/** Chat bubble tail — dual-curve cutout (scooped tip toward the avatar). */
export function SpeechBubbleTail({
  side,
  testId,
  tone,
}: {
  side: "left" | "right";
  testId?: string;
  tone: "cream" | "navy";
}) {
  const fill = tone === "navy" ? "bg-navy" : "bg-cream";
  const isLeft = side === "left";

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0">
      <span
        className={
          isLeft
            ? `absolute bottom-0 -left-[7px] h-[25px] w-5 ${fill}`
            : `absolute bottom-0 -right-[7px] h-[25px] w-5 ${fill}`
        }
        data-testid={testId}
        style={
          isLeft
            ? { borderBottomRightRadius: "16px 14px" }
            : { borderBottomLeftRadius: "16px 14px" }
        }
      />
      <span
        className={
          isLeft
            ? "absolute bottom-0 -left-[26px] h-[25px] w-[26px] bg-white"
            : "absolute bottom-0 -right-[26px] h-[25px] w-[26px] bg-white"
        }
        style={isLeft ? { borderBottomRightRadius: "10px" } : { borderBottomLeftRadius: "10px" }}
      />
    </span>
  );
}
