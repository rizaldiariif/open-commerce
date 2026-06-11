import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/register')({
  component: Register,
})

function Register() {
  return (
    <section className="auth-page">
      <p className="eyebrow">Account</p>
      <h1>Register</h1>
      <form className="auth-form">
        <label>
          Name
          <input type="text" name="name" autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" />
        </label>
        <button type="submit">Create account</button>
      </form>
    </section>
  )
}
