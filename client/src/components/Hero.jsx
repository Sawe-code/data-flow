import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(
            circle at 20% 20%,
            rgb(var(--primary) / 0.18),
            transparent 40%
          ),
          radial-gradient(
            circle at 80% 80%,
            rgb(var(--accent) / 0.12),
            transparent 45%
          ),
          rgb(var(--bg))
        `,
      }}
    >
      <div className="absolute inset-0 opacity-[0.05]">
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(to_right,rgb(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--border))_1px,transparent_1px)]
            bg-[size:90px_90px]
          "
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between">

        <div className="h-28" />

        <motion.div
          initial={{ opacity: 0, x: -120 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center">
            <h1
              className="
                uppercase
                font-black
                text-6xl
                sm:text-7xl
                md:text-8xl
                lg:text-[9rem]
                leading-[0.85]
                tracking-tight
              "
            >
              FROM RAW DATA.
            </h1>

            <h1
              className="
                uppercase
                font-black
                text-6xl
                sm:text-7xl
                md:text-8xl
                lg:text-[9rem]
                leading-[0.85]
                tracking-tight
                text-transparent
              "
              style={{
                WebkitTextStroke:
                  "2px rgb(var(--text))",
              }}
            >
              To Real Insights.
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.4,
            duration: 1,
          }}
          className="
            pb-24
            flex
            justify-center
          "
        >
          <p
            className="
              max-w-2xl
              text-center
              text-lg
              md:text-xl
              leading-relaxed
            "
          >
            Upload CSV files, Excel spreadsheets, APIs or databases
            and let DataFlow clean, analyze and visualize your
            data automatically.
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;