import Hero from "../components/Hero";
import Upload from "../components/Upload";
import Charts from "../components/Charts";

const Home = () => {
  return (
    <main>
      <Hero />
      <section className="section">
        <div className="container-custom space-y-8">

          <Upload />

        </div>
      </section>

    </main>
  );
};

export default Home;