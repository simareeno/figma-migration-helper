console.clear();
figma.showUI(__html__, { width: 700, height: 700 });

interface LayoutSettings {
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;
  layoutWrap?: 'NO_WRAP' | 'WRAP';
}

interface LayerData {
  name: string;
  type: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

interface VariantData {
  name: string;
  properties: { [key: string]: string };
  width: number;
  height: number;
  layoutSettings?: LayoutSettings;
  layers: LayerData[];
}

interface ComponentData {
  type: 'COMPONENT' | 'COMPONENT_SET';
  name: string;
  key: string;
  width?: number;
  height?: number;
  layoutSettings?: LayoutSettings;
  variants?: VariantData[];
  layers?: LayerData[];
}

function extractLayoutSettings(node: ComponentNode | FrameNode): LayoutSettings | undefined {
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    return {
      layoutMode: node.layoutMode,
      primaryAxisSizingMode: node.primaryAxisSizingMode,
      counterAxisSizingMode: node.counterAxisSizingMode,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems,
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      itemSpacing: node.itemSpacing,
      counterAxisSpacing: node.counterAxisSpacing ?? undefined,
      layoutWrap: node.layoutWrap,
    };
  }
  return undefined;
}

function applyLayoutSettings(node: ComponentNode | FrameNode, settings?: LayoutSettings) {
  if (!settings || !settings.layoutMode || settings.layoutMode === 'NONE') {
    return;
  }
  
  node.layoutMode = settings.layoutMode;
  
  if (settings.primaryAxisSizingMode) {
    node.primaryAxisSizingMode = settings.primaryAxisSizingMode;
  }
  
  if (settings.counterAxisSizingMode) {
    node.counterAxisSizingMode = settings.counterAxisSizingMode;
  }
  
  if (settings.primaryAxisAlignItems) {
    node.primaryAxisAlignItems = settings.primaryAxisAlignItems;
  }
  
  if (settings.counterAxisAlignItems) {
    node.counterAxisAlignItems = settings.counterAxisAlignItems;
  }
  
  if (settings.paddingLeft !== undefined) {
    node.paddingLeft = settings.paddingLeft;
  }
  
  if (settings.paddingRight !== undefined) {
    node.paddingRight = settings.paddingRight;
  }
  
  if (settings.paddingTop !== undefined) {
    node.paddingTop = settings.paddingTop;
  }
  
  if (settings.paddingBottom !== undefined) {
    node.paddingBottom = settings.paddingBottom;
  }
  
  if (settings.itemSpacing !== undefined) {
    node.itemSpacing = settings.itemSpacing;
  }
  
  if (settings.counterAxisSpacing !== undefined) {
    node.counterAxisSpacing = settings.counterAxisSpacing;
  }
  
  if (settings.layoutWrap) {
    node.layoutWrap = settings.layoutWrap;
  }
}

function extractLayerData(node: SceneNode): LayerData {
  return {
    name: node.name,
    type: node.type,
    width: 'width' in node ? node.width : 0,
    height: 'height' in node ? node.height : 0,
    x: 'x' in node ? node.x : 0,
    y: 'y' in node ? node.y : 0,
  };
}

function extractComponentData(node: ComponentNode | ComponentSetNode): ComponentData {
  if (node.type === 'COMPONENT_SET') {
    const variants: VariantData[] = [];
    
    for (const child of node.children) {
      if (child.type === 'COMPONENT') {
        const layers: LayerData[] = [];
        
        for (const layer of child.children) {
          layers.push(extractLayerData(layer));
        }
        
        variants.push({
          name: child.name,
          properties: child.variantProperties || {},
          width: child.width,
          height: child.height,
          layoutSettings: extractLayoutSettings(child),
          layers,
        });
      }
    }
    
    return {
      type: 'COMPONENT_SET',
      name: node.name,
      key: node.key,
      layoutSettings: extractLayoutSettings(node as any),
      variants,
    };
  } else {
    const layers: LayerData[] = [];
    
    for (const layer of node.children) {
      layers.push(extractLayerData(layer));
    }
    
    return {
      type: 'COMPONENT',
      name: node.name,
      key: node.key,
      width: node.width,
      height: node.height,
      layoutSettings: extractLayoutSettings(node),
      layers,
    };
  }
}

async function createLayerFromData(parent: ComponentNode | FrameNode, layerData: LayerData) {
  let layer: SceneNode;
  
  switch (layerData.type) {
    case 'FRAME':
      layer = figma.createFrame();
      break;
    case 'RECTANGLE':
      layer = figma.createRectangle();
      break;
    case 'TEXT':
      layer = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      break;
    case 'ELLIPSE':
      layer = figma.createEllipse();
      break;
    case 'LINE':
      layer = figma.createLine();
      break;
    case 'VECTOR':
      layer = figma.createVector();
      break;
    default:
      layer = figma.createFrame();
  }
  
  layer.name = layerData.name;
  
  if ('resize' in layer) {
    layer.resize(layerData.width, layerData.height);
  }
  
  if ('x' in layer && layerData.x !== undefined) {
    layer.x = layerData.x;
  }
  
  if ('y' in layer && layerData.y !== undefined) {
    layer.y = layerData.y;
  }
  
  parent.appendChild(layer);
}

async function importComponentData(data: ComponentData) {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Please select a component to update' });
    return;
  }
  
  const targetNode = selection[0];
  
  if (targetNode.type !== 'COMPONENT' && targetNode.type !== 'COMPONENT_SET') {
    figma.ui.postMessage({ type: 'error', message: 'Selected node must be a Component or Component Set' });
    return;
  }
  
  if (data.type === 'COMPONENT_SET' && targetNode.type === 'COMPONENT_SET') {
    // Handle Component Set
    const existingVariants = new Map<string, ComponentNode>();
    
    for (const child of targetNode.children) {
      if (child.type === 'COMPONENT') {
        existingVariants.set(child.name, child);
      }
    }
    
    // Process variants from data
    const processedVariants = new Set<string>();
    const orderedVariants: ComponentNode[] = [];
    
    for (const variantData of data.variants || []) {
      processedVariants.add(variantData.name);
      
      let variantNode = existingVariants.get(variantData.name);
      
      if (!variantNode) {
        // Create new variant
        variantNode = figma.createComponent();
        variantNode.name = variantData.name;
        targetNode.appendChild(variantNode);
      } else {
        // Update existing variant name if needed
        variantNode.name = variantData.name;
      }
      
      // Clear existing layers first
      for (const layer of [...variantNode.children]) {
        layer.remove();
      }
      
      // Create layers
      for (const layerData of variantData.layers) {
        await createLayerFromData(variantNode, layerData);
      }
      
      // Set variant dimensions after creating layers
      if (variantData.width && variantData.height) {
        variantNode.resize(variantData.width, variantData.height);
      }
      
      // Apply layout settings after everything is set up
      applyLayoutSettings(variantNode, variantData.layoutSettings);
      
      // Track the order
      orderedVariants.push(variantNode);
    }
    
    // Remove variants that are not in the data
    for (const [name, variant] of existingVariants) {
      if (!processedVariants.has(name)) {
        variant.remove();
      }
    }
    
    // Reorder variants to match the data order
    for (let i = 0; i < orderedVariants.length; i++) {
      targetNode.insertChild(i, orderedVariants[i]);
    }
    
    targetNode.name = data.name;
    
    // Apply layout settings to the ComponentSet itself
    applyLayoutSettings(targetNode as any, data.layoutSettings);
    
  } else if (data.type === 'COMPONENT' && targetNode.type === 'COMPONENT') {
    // Handle single Component
    targetNode.name = data.name;
    
    // Clear existing layers first
    for (const layer of [...targetNode.children]) {
      layer.remove();
    }
    
    // Create layers
    for (const layerData of data.layers || []) {
      await createLayerFromData(targetNode, layerData);
    }
    
    // Set dimensions after creating layers
    if (data.width && data.height) {
      targetNode.resize(data.width, data.height);
    }
    
    // Apply layout settings after everything is set up
    applyLayoutSettings(targetNode, data.layoutSettings);
  } else {
    figma.ui.postMessage({ type: 'error', message: 'Component type mismatch' });
    return;
  }
  
  figma.ui.postMessage({ type: 'import-success' });
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Please select a component to export' });
      return;
    }
    
    const node = selection[0];
    
    if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET') {
      figma.ui.postMessage({ type: 'error', message: 'Selected node must be a Component or Component Set' });
      return;
    }
    
    const data = extractComponentData(node);
    figma.ui.postMessage({ type: 'export-data', data });
    
  } else if (msg.type === 'import') {
    await importComponentData(msg.data);
  }
};
