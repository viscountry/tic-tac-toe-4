import Button from '../components/Button.jsx';

export default function Home({ onNavigate }) {
  return (
    <section className="text-center">
      <h1 className="mb-2 text-5xl font-extrabold tracking-tight">Tic-Tac-Four</h1>
      <p className="mb-8 text-lg text-muted">Get four in a row on a 7×6 board</p>
      <div className="flex flex-col gap-3">
        <Button onClick={() => onNavigate('friend')}>Play with a friend</Button>
        <Button variant="secondary" onClick={() => onNavigate('bot')}>Play the robot</Button>
      </div>
    </section>
  );
}
