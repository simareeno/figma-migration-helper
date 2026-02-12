import React, { useState } from 'react';
import { Button, Card, Text, TextArea } from '@gravity-ui/uikit';

const App: React.FC = () => {
  const [jsonData, setJsonData] = useState('');

  const handleExport = () => {
    parent.postMessage({ pluginMessage: { type: 'export' } }, '*');
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonData);
      parent.postMessage({ pluginMessage: { type: 'import', data } }, '*');
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  React.useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'export-data') {
        setJsonData(JSON.stringify(msg.data, null, 2));
      } else if (msg.type === 'import-success') {
        alert('Component imported successfully!');
      } else if (msg.type === 'error') {
        alert(`Error: ${msg.message}`);
      }
    };
  }, []);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <Card>
        <Text variant="header-1">
          Figma Migration Helper
        </Text>
      </Card>
      
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Text variant="subheader-1" style={{ marginBottom: '8px' }}>
          Component JSON
        </Text>
        <TextArea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder="Component data will appear here..."
          rows={20}
          style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
        />
      </Card>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button view="action" size="l" onClick={handleExport} style={{ flex: 1 }}>
          Export
        </Button>
        <Button view="normal" size="l" onClick={handleImport} style={{ flex: 1 }}>
          Import
        </Button>
      </div>
    </div>
  );
};

export default App;
