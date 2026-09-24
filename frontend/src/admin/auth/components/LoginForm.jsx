import { useState } from 'react';
import Input from '../../shared/ui/Input.jsx';
import Button from '../../shared/ui/Button.jsx';

/** Presentational login form. Never calls the API directly; that's `LoginPage`'s job. */
export default function LoginForm({ onSubmit, submitting, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        label="Usuario"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={submitting} className="mt-2">
        {submitting ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
