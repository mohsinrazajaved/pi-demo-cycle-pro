import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>} props
   * @param {React.ElementRef<typeof SliderPrimitive.Root>} ref
   */
  function Slider(props, ref) {
    const { className, ...rest } = props;
    return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...rest}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-700">
        <SliderPrimitive.Range className="absolute h-full bg-[#FF3F03]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-4 w-4 rounded-full border-2 border-[#FF3F03] bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3F03] disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
