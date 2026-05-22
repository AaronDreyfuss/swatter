import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div>Swatter</div>
    </AuthProvider>
  );
}

export default App;
