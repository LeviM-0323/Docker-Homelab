import Image from "next/image";
import brandMark from "./icon.png";
import logo from "./logo.png";

const tools = [
  "PHP",
  "JavaScript",
  "SCSS",
  "Python",
  "Java",
  "C",
  "C++",
  "C#",
  "SQL",
  "Bash",
  "Go",
  "Docker",
];

export default function HomePage() {
  return (
    <>
      <header className="site-header" id="top">
        <a className="brand" href="#top" aria-label="Levi McLean, home">
          <Image
            src={logo}
            alt="McLean V1 logo"
            priority
            sizes="(max-width: 600px) 132px, 164px"
          />
        </a>
        <nav aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#toolbox">Toolbox</a>
          <a href="#workbench">Workbench</a>
        </nav>
        <a className="header-contact" href="/contact.php">
          Say hello <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="overline">
              <span className="live-mark" aria-hidden="true" />
              A personal site, still under construction
            </p>
            <h1 id="hero-title">Curious by nature. Building things to find out.</h1>
            <p className="hero-intro">
              I&apos;m Levi. I like learning by building: writing software,
              wiring services together, and following a question until it turns
              into something that works.
            </p>
            <div className="hero-actions">
              <a className="button-link" href="#workbench">
                Have a look around <span aria-hidden="true">↓</span>
              </a>
              <a className="quiet-link" href="mailto:levi@levimclean.tech">
                Or send me a note
              </a>
            </div>
            <p className="hero-footnote">
              Started as a Fanshawe college project. Still learning in public.
            </p>
          </div>

          <aside className="field-note" aria-label="A note from Levi">
            <div className="note-topline">
              <span>FIELD NOTE</span>
              <span>NO. 001</span>
            </div>
            <div className="note-mark">
              <Image src={brandMark} alt="" aria-hidden="true" />
            </div>
            <p className="note-label">CURRENTLY</p>
            <p className="note-title">Making this place feel like mine.</p>
            <div className="note-rule" />
            <p className="note-status">
              <span className="live-mark" aria-hidden="true" />
              <span>Site is online; ideas are loading.</span>
            </p>
            <span className="note-stamp" aria-hidden="true">
              LM
            </span>
          </aside>
        </section>

        <div className="section-index" aria-hidden="true">
          <span>01—03</span>
          <span>A SMALL MAP OF THIS SITE</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>

        <section className="content-section about-section" id="about">
          <div className="section-heading">
            <p className="section-number">01 / ABOUT</p>
            <h2>Who am I?</h2>
          </div>
          <div className="section-copy">
            <p className="lead-copy">
              A curious person with a terminal open and usually one more thing
              to try.
            </p>
            <p>
              This site started as a way to practice PHP, JavaScript, and SCSS
              while I was studying at Fanshawe. It grew into a place to learn
              how the pieces fit together—from a page in the browser to the
              services running behind it.
            </p>
            <p>
              I&apos;m still taking it one project and one rabbit hole at a
              time. That part hasn&apos;t changed.
            </p>
          </div>
        </section>

        <section className="content-section toolbox-section" id="toolbox">
          <div className="section-heading">
            <p className="section-number">02 / TOOLBOX</p>
            <h2>Things I reach for.</h2>
          </div>
          <div className="section-copy">
            <p>
              Languages and tools I&apos;ve spent time with. Some are old
              friends; some still send me to the docs.
            </p>
            <ul className="tool-list" aria-label="Languages and tools">
              {tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="workbench-section" id="workbench">
          <div className="workbench-heading">
            <div>
              <p className="section-number">03 / WORKBENCH</p>
              <h2>Personal projects</h2>
            </div>
            <span className="workbench-status">
              <span className="live-mark" aria-hidden="true" />
              IN PROGRESS
            </span>
          </div>
          <article className="project-note">
            <div className="project-number" aria-hidden="true">
              01
            </div>
            <div>
              <p className="project-kicker">THE THING YOU&apos;RE ON</p>
              <h3>This website, rebuilt one piece at a time.</h3>
              <p>
                It began in PHP and PicoCSS. Now it&apos;s moving to React and
                Next.js—without sanding off all the personality along the way.
              </p>
            </div>
            <span className="project-arrow" aria-hidden="true">
              ↘
            </span>
          </article>
          <p className="workbench-caption">
            More experiments will land here when they&apos;re ready. No
            imaginary launch dates.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <p className="footer-title">That&apos;s the short version.</p>
          <p className="footer-note">
            Have a question, an idea, or a good rabbit hole to recommend?
          </p>
        </div>
        <div className="footer-links">
          <a href="/resume.php">Resume page</a>
          <a href="/resume/Levi_McLean_Resume.docx" download>
            Resume (DOCX) <span aria-hidden="true">↓</span>
          </a>
          <a href="/contact.php">Contact page</a>
          <a href="mailto:levi@levimclean.tech">levi@levimclean.tech</a>
          <a
            href="https://github.com/LeviM-0323"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="footer-baseline">
          <span>© {new Date().getFullYear()} Levi McLean</span>
          <span>
            Good bones from <a href="https://picocss.com">PicoCSS</a>, with a
            few personal quirks.
          </span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}
