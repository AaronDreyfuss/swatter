import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div>
      <h1>Swatter</h1>
      <p>Track bugs, manage projects, and collaborate with your team.</p>
      <Link to="/login">Log in</Link>
      <Link to="/register">Register</Link>
    </div>
  );
}

export default Landing;
