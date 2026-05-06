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
      <SliderPrimitive.Track className="relative w-full grow overflow-hidden rounded-full" style={{ height: '8px', background: '#000' }}>
        <SliderPrimitive.Range className="absolute h-full bg-[#FF3F03]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block rounded-full bg-white transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        style={{ width: '20px', height: '20px', border: '3px solid #FF3F03' }}
      />
    </SliderPrimitive.Root>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
