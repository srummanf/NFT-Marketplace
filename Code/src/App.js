import './App.css';
import { BlockchainProvider } from './context/AppConfig';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UploadNFT } from './pages/UploadNFT';
import { Market } from './pages/Market';

function App() {
  return (
    <div className="App">
      <BlockchainProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<UploadNFT />} />
            <Route path="/market" element={<Market />} />
          </Routes>
        </BrowserRouter>
      </BlockchainProvider>
    </div>
  );
}

export default App;
