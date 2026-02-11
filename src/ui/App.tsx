import React from 'react';
import { Button, Card, Text } from '@gravity-ui/uikit';

const App: React.FC = () => {
  console.log('App component rendered');

  const handleCreateRectangle = () => {
    console.log('Create rectangle clicked');
    parent.postMessage({ pluginMessage: { type: 'create-rectangle' } }, '*');
  };

  const handleCancel = () => {
    console.log('Cancel clicked');
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  return (
    <div style={{
      padding: '20px',
      height: '100vh',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <Card style={{ padding: '20px' }}>
        <Text variant="header-1" style={{ marginBottom: '20px' }}>
          Figma Gravity Plugin
        </Text>
        <Text variant="body-2" style={{ marginBottom: '20px' }}>
          Это базовый плагин для Figma с React и Gravity UI
        </Text>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button view="action" size="l" onClick={handleCreateRectangle}>
            Создать прямоугольник
          </Button>
          <Button view="outlined" size="l" onClick={handleCancel}>
            Закрыть
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default App;
