import { Link } from 'react-router-dom'

const EFFECTIVE = 'September 5, 2026'

export function TermsOfServicePage() {
  return (
    <article className="section legal">
      <h1 className="page-title">Terms of Service</h1>
      <p className="lead">Beyond The Formula (“we,” “us,” or “our”)</p>
      <p className="muted">Effective date: {EFFECTIVE}</p>

      <p>
        These Terms of Service (“Terms”) govern your use of the Beyond The Formula website and
        related tutoring services (the “Service”). By creating an account or using the Service, you
        agree to these Terms and our <Link to="/privacy">Privacy Policy</Link>. If you do not agree,
        do not use the Service.
      </p>
      <h2>1. Who we are</h2>
      <p>
        Beyond The Formula provides <strong>free nonprofit</strong> math and STEM tutoring and
        learning resources. Mentors are volunteers. The Service is offered as-is for educational
        purposes and is not a substitute for school instruction, counseling, or emergency services.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>You must provide accurate information when registering.</li>
        <li>
          If you are under 18 (or the age of digital consent where you live), you should use the
          Service with a parent or guardian’s permission and supervision.
        </li>
        <li>You are responsible for keeping your login credentials confidential.</li>
        <li>We may suspend or terminate accounts that violate these Terms or pose a safety risk.</li>
      </ul>

      <h2>3. Display names and testimonials</h2>
      <ul>
        <li>
          Your <strong>display name</strong> is shown in the Service so other participants can
          recognize you. Do not use someone else’s name in a misleading way.
        </li>
        <li>
          You grant us a non-exclusive, royalty-free right to use your <strong>display name</strong>{' '}
          in <strong>testimonials and program stories</strong> (for example on our website, social
          media, or outreach materials) describing experiences with Beyond The Formula. We will not
          use your email address for that purpose. You may opt out of future testimonial use by
          contacting us; we may not retract materials already published.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Harass, bully, threaten, or discriminate against others.</li>
        <li>Share personal contact information (phone, personal email, social DMs, addresses) in chat, posts, or profiles when the product asks you not to.</li>
        <li>Post illegal, sexual, violent, or otherwise inappropriate content, especially involving minors.</li>
        <li>Cheat in a way that harms others’ learning environments, disrupt sessions, or abuse the Service.</li>
        <li>Attempt to hack, scrape, or bypass security or access controls.</li>
        <li>Impersonate mentors, admins, or other users.</li>
      </ul>
      <p>
        Mentors must follow program expectations presented in the mentor onboarding flow and any
        codes of conduct we publish.
      </p>

      <h2>5. Educational content and sessions</h2>
      <ul>
        <li>Session availability, recordings, and resources may change without notice.</li>
        <li>Volunteer mentors provide good-faith help; we do not guarantee grades, scores, or outcomes.</li>
        <li>Live sessions may use third-party meeting tools; those tools have their own terms.</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        Site branding, original materials we publish, and the Service software are owned by Beyond
        The Formula or its licensors. You retain rights to content you submit (questions, answers),
        but you grant us a license to host, display, moderate, and use that content to operate the
        Service. Do not upload content you do not have the right to share.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        Sign-in may use providers such as Google, GitHub, and Supabase. Hosting and video platforms (for
        example YouTube) may be linked from the Service. Your use of those services is also subject
        to their terms and privacy policies.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS
        OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT, TO THE FULLEST EXTENT PERMITTED BY LAW. We do not warrant uninterrupted or
        error-free operation.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, BEYOND THE FORMULA AND ITS VOLUNTEERS, OFFICERS, AND
        AFFILIATES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES, OR ANY LOSS OF DATA, GRADES, OR OPPORTUNITY ARISING FROM YOUR USE OF THE SERVICE.
        OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE WILL NOT EXCEED ONE HUNDRED U.S.
        DOLLARS (US $100) OR THE AMOUNT YOU PAID US IN THE PRIOR TWELVE MONTHS (IF ANY), WHICHEVER
        IS GREATER. Some jurisdictions do not allow certain limitations; in those cases, our
        liability is limited to the maximum extent allowed.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You agree to defend and indemnify Beyond The Formula and its volunteers against claims
        arising from your misuse of the Service or violation of these Terms, to the extent permitted
        by law.
      </p>

      <h2>11. Changes and termination</h2>
      <p>
        We may update these Terms by posting a new effective date. Continued use after changes means
        you accept the updated Terms. We may stop offering the Service or any part of it at any time.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of the United States and the state in which the
        nonprofit primarily operates, without regard to conflict-of-law rules, except where local
        consumer law requires otherwise.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: reach us via our YouTube channel{' '}
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
