import type { Metadata } from "next";
import { SubpageFooter, SubpageHeader } from "../_components/subpage-chrome";

export const metadata: Metadata = {
  title: "Resume — Levi McLean",
  description: "View and download Levi McLean's resume.",
};

export default function ResumePage() {
  return (
    <>
      <SubpageHeader />
      <main className="route-main">
        <p className="route-kicker">BACKGROUND & EXPERIENCE</p>
        <h1 className="route-title">Resume</h1>
        <p className="route-intro">
          A little more about my professional background. You can download my
          current resume as a Word document below.
        </p>
        <dl className="detail-list">
          <div>
            <dt>Name</dt>
            <dd>Levi McLean</dd>
          </div>
          <div>
            <dt>Position sought</dt>
            <dd>Software Developer / Internet Applications Developer</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>Woodstock, Ontario</dd>
          </div>
        </dl>
        <section
          className="resume-highlights"
          aria-labelledby="resume-highlights-title"
        >
          <h2 id="resume-highlights-title">Why hire me?</h2>
          <ul>
            <li>Experience in web and software development</li>
            <li>Strong problem-solving and analytical skills</li>
            <li>Communication and teamwork</li>
            <li>A passion for learning and growth</li>
          </ul>
          <p>References available upon request.</p>
        </section>
        <div className="route-actions">
          <a
            className="button-link"
            href="/resume/Levi_McLean_Resume.docx"
            download
          >
            Download resume (DOCX) <span aria-hidden="true">↓</span>
          </a>
          <a href="/contact.php">Contact me</a>
        </div>
      </main>
      <SubpageFooter />
    </>
  );
}
