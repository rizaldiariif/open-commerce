import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  return (
    <section className="auth-page">
      <p className="eyebrow">Account</p>
      <h1>Login</h1>
      <form className="auth-form">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
          />
        </label>
        <button type="submit">Login</button>
      </form>
    </section>
  )
}
