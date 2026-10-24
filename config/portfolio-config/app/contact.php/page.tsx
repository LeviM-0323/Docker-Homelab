import type { Metadata } from "next";
import { SubpageFooter, SubpageHeader } from "../_components/subpage-chrome";

export const metadata: Metadata = {
  title: "Contact Levi McLean",
  description: "Contact Levi McLean by phone, email, or GitHub.",
};

export default function ContactPage() {
  return (
    <>
      <SubpageHeader />
      <main className="route-main">
        <p className="route-kicker">A LINE IS OPEN</p>
        <h1 className="route-title">Contact Information</h1>
        <p className="route-intro">
          Have a question, an idea, or a good rabbit hole to recommend? Here
          are a few ways to reach me.
        </p>
        <dl className="detail-list">
          <div>
            <dt>Phone</dt>
            <dd>
              <a href="tel:+15195351398">(519) 535-1398</a>
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href="mailto:levi@levimclean.tech">levi@levimclean.tech</a>
            </dd>
          </div>
          <div>
            <dt>GitHub</dt>
            <dd>
              <a
                href="https://github.com/LeviM-0323"
                target="_blank"
                rel="noreferrer"
              >
                LeviM0323
              </a>
            </dd>
          </div>
        </dl>
        <p className="route-backlink">
          Looking for my background?{" "}
          <a href="/resume.php">Visit the resume page.</a>
        </p>
      </main>
      <SubpageFooter />
    </>
  );
}
