import { useState, useEffect } from 'react';
import './App.css';
import { apiClient } from './utils/api';

interface ApiData {
  success: boolean;
  message: string;
  data?: any;
}

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [exampleData, setExampleData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const data = await apiClient.get('/api/health');
      setApiStatus(`✓ Connected - ${data.status}`);
    } catch (error) {
      setApiStatus('✗ Disconnected');
      console.error('API health check failed:', error);
    }
  };

  const fetchExampleData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/example');
      setExampleData(data);
    } catch (error) {
      console.error('Failed to fetch example data:', error);
      alert('Failed to fetch data from API');
    } finally {
      setLoading(false);
    }
  };

  const createExample = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiClient.post('/api/v1/example', formData);
      setExampleData(data);
      setFormData({ name: '', description: '' });
      alert('Data created successfully!');
    } catch (error) {
      console.error('Failed to create example:', error);
      alert('Failed to create data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 NitiSetu</h1>
        <p className="subtitle">React TypeScript + Node.js TypeScript Full Stack</p>
        <div className="api-status">
          Backend API: <span className={apiStatus.includes('✓') ? 'connected' : 'disconnected'}>
            {apiStatus}
          </span>
        </div>
      </header>

      <main className="app-main">
        <section className="section">
          <h2>Test API Connection</h2>
          <button onClick={fetchExampleData} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Example Data'}
          </button>
          
          {exampleData && (
            <div className="api-response">
              <h3>Response:</h3>
              <pre>{JSON.stringify(exampleData, null, 2)}</pre>
            </div>
          )}
        </section>

        <section className="section">
          <h2>Create New Data</h2>
          <form onSubmit={createExample} className="form">
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Enter description"
                rows={4}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Example'}
            </button>
          </form>
        </section>

        <section className="section tech-stack">
          <h2>Tech Stack</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <h3>Frontend</h3>
              <ul>
                <li>React 18</li>
                <li>TypeScript</li>
                <li>Vite</li>
                <li>CSS3</li>
              </ul>
            </div>
            <div className="tech-card">
              <h3>Backend</h3>
              <ul>
                <li>Node.js</li>
                <li>Express</li>
                <li>TypeScript</li>
                <li>CORS</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>NitiSetu - Full Stack TypeScript Application</p>
      </footer>
    </div>
  );
}

export default App;
