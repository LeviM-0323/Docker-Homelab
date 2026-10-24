import Image from "next/image";
import logo from "../logo.png";

export function SubpageHeader() {
  return (
    <header className="site-header subpage-header">
      <a className="brand" href="/" aria-label="Levi McLean, home">
        <Image
          src={logo}
          alt="McLean V1 logo"
          sizes="(max-width: 600px) 112px, 164px"
        />
      </a>
      <nav aria-label="Page navigation">
        <a href="/">Home</a>
        <a href="/contact.php">Contact</a>
        <a href="/resume.php">Resume</a>
      </nav>
    </header>
  );
}

export function SubpageFooter() {
  return (
    <footer className="site-footer subpage-footer">
      <p className="footer-note">A personal corner of the internet by Levi McLean.</p>
      <div className="footer-links">
        <a href="/contact.php">Contact</a>
        <a href="/resume.php">Resume</a>
        <a href="/">Home</a>
      </div>
    </footer>
  );
}
