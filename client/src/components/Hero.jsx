import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-28">
    
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>

      <div className="container-custom text-center max-w-3xl mx-auto">

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
          Turn messy data into{" "}
          <span className="text-gradient">clear insights</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted">
          Upload CSV OR Excel files and instantly clean, structure, and
          visualize your data in seconds. No setup, no complexity.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="btn btn-primary px-6 py-3 rounded-full"
          >
            Start For Free
          </button>
        </div>

        <p className="mt-6 text-sm text-muted">
          No signup required • Works instantly • Works with APIs, databases, and files
        </p>
      </div>
    </section>
  );
};

export default Hero;
