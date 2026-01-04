import React from 'react';
import { createRoot } from 'react-dom/client';
import AdaptiveRAGDiagram from './AdaptiveRAGDiagram';

// Find the root element
const rootElement = document.getElementById('rag-diagrams-root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AdaptiveRAGDiagram />);
}
