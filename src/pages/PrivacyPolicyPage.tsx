const EFFECTIVE = 'September 5, 2026'

export function PrivacyPolicyPage() {
  return (
    <article className="section legal">
      <h1 className="page-title">Privacy Policy</h1>
      <p className="lead">Beyond The Formula Tutoring (“we,” “us,” or “our”)</p>
      <p className="muted">Effective date: {EFFECTIVE}</p>

      <p>
        This Privacy Policy explains how we collect, use, and share information when you use our
        website and tutoring services. We are a free nonprofit math and STEM tutoring program. We
        design the product so that <strong>email addresses are used for sign-in only</strong> and are
        not shown on public pages. Public-facing identity is limited to the <strong>display name</strong>{' '}
        you choose (or that comes from your sign-in provider).
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> Email address (for authentication), password or
          OAuth credentials handled by our auth provider (Supabase / Google), and a public{' '}
          <strong>display name</strong>.
        </li>
        <li>
          <strong>Profile and role data.</strong> Whether you are a student, mentor applicant, approved
          mentor, or admin; application and approval status for mentors.
        </li>
        <li>
          <strong>Service activity.</strong> Session bookings and requests, homework completion
          markers, stuck-question posts and answers, mentor messages related to sessions, and similar
          tutoring records needed to run the program.
        </li>
        <li>
          <strong>Technical data.</strong> Basic usage signals such as page views (if enabled) and
          standard browser/security logs processed by our hosting and database providers.
        </li>
        <li>
          <strong>What we do not collect for public profiles.</strong> We do not ask for photos for
          profiles, and we do not publish personal contact details (phone, personal email, social
          handles) on public pages.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>To create and secure your account and keep you signed in (including token refresh).</li>
        <li>
          To <strong>display your display name</strong> in the product where other participants need
          to recognize you (for example schedules, Q&amp;A, dashboards).
        </li>
        <li>
          To use your <strong>display name in testimonials or program stories</strong> about Beyond
          The Formula (website, social posts, or outreach), unless you ask us not to. We will not use
          your email address in those testimonials.
        </li>
        <li>To operate tutoring: bookings, mentor matching, homework, and community Q&amp;A.</li>
        <li>To moderate abuse, enforce our Terms of Service, and protect the safety of minors and volunteers.</li>
        <li>To improve the service and understand aggregate usage.</li>
      </ul>

      <h2>3. How we share information</h2>
      <ul>
        <li>
          <strong>Other users.</strong> Display names and tutoring-related content you post may be
          visible to other signed-in users or, where the product allows, on public schedule views.
        </li>
        <li>
          <strong>Service providers.</strong> We use vendors such as Supabase (auth and database),
          Google (optional Sign in with Google), and hosting providers (for example GitHub Pages) to
          run the site. They process data on our behalf under their own terms and privacy policies.
        </li>
        <li>
          <strong>Legal / safety.</strong> We may disclose information if required by law or to
          protect rights, safety, or integrity of the program.
        </li>
        <li>We do not sell personal information.</li>
      </ul>

      <h2>4. Children and students</h2>
      <p>
        Our program serves students, including minors, with volunteer mentors. If you are under 18
        (or the age of digital consent in your region), use the service with a parent or guardian’s
        guidance. Parents or guardians may contact us to request correction or deletion of a child’s
        account information where applicable.
      </p>

      <h2>5. Retention</h2>
      <p>
        We keep account and tutoring records as long as needed to operate the nonprofit, meet
        moderation and safety needs, and comply with law. You may request deletion of your account;
        some anonymized or aggregated records may remain.
      </p>

      <h2>6. Security</h2>
      <p>
        We rely on industry-standard practices from our providers (encrypted connections, access
        control, and database row-level security). No method of transmission or storage is 100%
        secure. Do not share passwords, and do not post personal contact information in chat or
        public questions.
      </p>

      <h2>7. Your choices</h2>
      <ul>
        <li>Update your display name in the product where that feature is available.</li>
        <li>Sign out at any time; use “Forgot password” if you use email/password login.</li>
        <li>
          Opt out of testimonial use of your display name by emailing us (see Contact). We will stop
          new uses; we may not be able to recall materials already published.
        </li>
        <li>Request access, correction, or deletion of your account data by contacting us.</li>
      </ul>

      <h2>8. International users</h2>
      <p>
        Our providers may process data in the United States or other countries. By using the
        service, you understand that information may be transferred to those locations.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this Privacy Policy. We will change the effective date above and, when
        changes are material, provide additional notice on the site when practical.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about privacy: reach us via our YouTube channel{' '}
        <a
          href="https://www.youtube.com/@beyondtheformulatutoring"
          rel="noopener noreferrer"
        >
          @beyondtheformulatutoring
        </a>{' '}
        or the contact email we publish on the site.
      </p>

      <p className="muted legal-disclaimer">
        This document is a practical template for a small nonprofit tutoring site. It is not legal
        advice. Consider having counsel review it for your jurisdiction.
      </p>
    </article>
  )
}
