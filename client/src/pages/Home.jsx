export default function Home() {
  return (
    <div className="page home">
      <h1>AI Capsule</h1>
      <p className="tagline">Your private library of useful AI prompts.</p>

      <p>
        AI Capsule lets you save, review and improve the prompts you use with
        tools like ChatGPT, Copilot, Gemini and Claude for coding, writing,
        debugging and study &mdash; so a good prompt is never lost again.
      </p>

      <ul>
        <li>Sign in securely with GitHub</li>
        <li>Create, view, update and delete your own prompt records</li>
        <li>Track project, version, category, usefulness and review status</li>
      </ul>

      {/* Full page navigation on purpose: /login is an Express route that
          starts the OAuth redirect, not a client-side React route. */}
      <a className="btn btn-primary" href="/login">
        Login with GitHub
      </a>
    </div>
  );
}
