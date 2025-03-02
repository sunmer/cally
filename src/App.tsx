import { useEffect, useState } from 'react';
import './App.css';
import ThreeJsRoom from './ThreeJSRoom';
import Settings from './Settings';

function App() {
  const [showRoom, setShowRoom] = useState(false);
  const [query, setQuery] = useState('');

  // This state holds the JSON modifications returned by the API.
  const [sceneModifications, setSceneModifications] = useState({});

  // Room configuration is separate from the dynamic modifications 
  // so that simple dimension or color changes come from this config 
  // (for example, if the user adjusts width, floor color, etc. in a form)
  // whereas the LLM modifies the scene in real-time via sceneModifications.
  const [roomConfig, setRoomConfig] = useState({
    width: 20,
    height: 8,
    depth: 20,
    wallColor: '#a1887f',
    floorColor: '#5d4037'
  });

  // Handle form input changes for the manual config
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomConfig(prev => ({
      ...prev,
      [name]: name === 'width' || name === 'height' || name === 'depth' 
        ? Number(value) 
        : value
    }));
  };

  // This is called each time the user wants to apply a query to the scene.
  // For example, the user can press "Enter" or a "Send" button in the UI.
  const handleSendQuery = async () => {
    try {
      const response = await fetch(`${Settings.API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          promptId: 1,
          text: query
        })
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // This is the JSON with modifications for the scene (colors, code, etc.)
      const modifications = await response.json();
      console.log('Scene modifications from LLM:', modifications);

      // Save it in state so we pass it down to <ThreeJsRoom />
      setSceneModifications(modifications);

    } catch (error) {
      console.error("Error fetching suggested data:", error);
    }
  };

  return (
    <div className="body">
      Hello world
    </div>
  );
}

export default App;
