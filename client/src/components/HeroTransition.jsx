import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

import Hero from "./Hero";
import Upload from "./Upload";

const HeroTransition = () => {
    const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const uploadX = useTransform(
    scrollYProgress,
    [0, 0.55],
    ["100%", "0%"]
  );

  const uploadRadius = useTransform(
    scrollYProgress,
    [0, 0.55],
    [50, 0]
  );

  const heroScale = useTransform(
    scrollYProgress,
    [0, 0.55],
    [1, 0.96]
  );

  const heroOpacity = useTransform(
    scrollYProgress,
    [0, 0.55],
    [1, 0.35]
  );

  return (
    <div className="relative h-[220vh]" ref={containerRef}>
      <div
        className="
        sticky
        top-0
        h-screen
        overflow-hidden
      "
      >
        <motion.div
          style={{
            scale: heroScale,
            opacity: heroOpacity,
          }}
          className="
            absolute
            inset-0
            z-10
            bg-main
          "
        >
          <Hero />
        </motion.div>

        <motion.div
          style={{
            x: uploadX,
            borderTopLeftRadius:
              uploadRadius,
            borderBottomLeftRadius:
              uploadRadius,
          }}
          className="
            absolute
            inset-0
            z-20
            bg-main
            overflow-y-auto
            shadow-2xl
            border-l
            border-default
          "
        >
          <div
            className="
            min-h-screen
            flex
            items-center
            justify-center
          "
          >
            <Upload />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroTransition;