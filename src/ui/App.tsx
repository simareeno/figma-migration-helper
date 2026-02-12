import React, { useState } from 'react';
import { Button, Card, Text, TextArea, Select } from '@gravity-ui/uikit';

interface Library {
  key: string;
  name: string;
}

const App: React.FC = () => {
  const [jsonData, setJsonData] = useState('');
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');

  const handleExport = () => {
    parent.postMessage({ pluginMessage: { type: 'export' } }, '*');
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonData);
      parent.postMessage({ pluginMessage: { type: 'import', data, libraryKey: selectedLibrary } }, '*');
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  React.useEffect(() => {
    // Request libraries on mount
    parent.postMessage({ pluginMessage: { type: 'get-libraries' } }, '*');

    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'export-data') {
        setJsonData(JSON.stringify(msg.data, null, 2));
      } else if (msg.type === 'import-success') {
        alert('Component imported successfully!');
      } else if (msg.type === 'error') {
        alert(`Error: ${msg.message}`);
      } else if (msg.type === 'libraries-data') {
        setLibraries(msg.libraries);
        if (msg.libraries.length > 0) {
          setSelectedLibrary(msg.libraries[0].key);
        }
      }
    };
  }, []);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <Text variant="header-1">
          Figma Migration Helper
        </Text>

        <Text variant="subheader-1" style={{ marginBottom: '8px' }}>
          Target Library
        </Text>
        <Select
          value={[selectedLibrary]}
          onUpdate={(value) => setSelectedLibrary(value[0])}
          placeholder="Select library for styles/variables"
          width="max"
        >
          {libraries.map((lib) => (
            <Select.Option key={lib.key} value={lib.key}>
              {lib.name}
            </Select.Option>
          ))}
        </Select>

        <TextArea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder="Component data will appear here..."
          rows={20}
          style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
        />

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button view="action" size="l" onClick={handleExport} style={{ flex: 1 }}>
          Export
        </Button>
        <Button view="normal" size="l" onClick={handleImport} style={{ flex: 1 }} disabled={!selectedLibrary}>
          Import
        </Button>
      </div>
    </div>
  );
};

export default App;
