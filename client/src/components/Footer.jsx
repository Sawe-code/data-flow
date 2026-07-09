const Footer = () => {
  return (
    <footer className="border-t border-default mt-20">
      <div className="container-custom py-10 flex flex-col md:flex-row items-center justify-between gap-6">

        
        <div className="flex items-center gap-2">
          <img
            src="/icons/dataflow.png"
            alt="logo"
            className="w-8 h-8 rounded-md"
          />
          <span className="font-semibold text-lg">DataFlow</span>
        </div>

        
        <p className="text-sm text-muted text-center">
          Visualize your data.
        </p>

        
        <div className="flex gap-4 text-sm">
          <a href="#" className="nav-link">Privacy</a>
          <a href="#" className="nav-link">Terms</a>
          <a href="#" className="nav-link">Contact</a>
        </div>

      </div>

      <div className="text-center text-xs text-muted pb-6">
        &copy; {new Date().getFullYear()} DataFlow. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;