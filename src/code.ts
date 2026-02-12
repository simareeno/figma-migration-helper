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

interface BoundVariableData {
  field: string;
  variableKey: string;
  variableName: string;
}

interface LayerData {
  name: string;
  type: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  fills?: ReadonlyArray<Paint> | typeof figma.mixed;
  fillStyleId?: string;
  fillStyleKey?: string;
  fillStyleName?: string;
  boundVariables?: BoundVariableData[];
}

interface VariantData {
  name: string;
  properties: { [key: string]: string };
  width: number;
  height: number;
  layoutSettings?: LayoutSettings;
  fills?: ReadonlyArray<Paint> | typeof figma.mixed;
  fillStyleId?: string;
  fillStyleKey?: string;
  fillStyleName?: string;
  boundVariables?: BoundVariableData[];
  layers: LayerData[];
}

interface ComponentData {
  type: 'COMPONENT' | 'COMPONENT_SET';
  name: string;
  key: string;
  width?: number;
  height?: number;
  layoutSettings?: LayoutSettings;
  fills?: ReadonlyArray<Paint> | typeof figma.mixed;
  fillStyleId?: string;
  fillStyleKey?: string;
  fillStyleName?: string;
  boundVariables?: BoundVariableData[];
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
  // If no settings or layoutMode is NONE, reset to NONE
  if (!settings || !settings.layoutMode || settings.layoutMode === 'NONE') {
    node.layoutMode = 'NONE';
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

async function extractBoundVariables(node: SceneNode): Promise<BoundVariableData[]> {
  const boundVars: BoundVariableData[] = [];
  
  if ('boundVariables' in node && node.boundVariables) {
    const boundVariables = node.boundVariables as any;
    
    for (const field in boundVariables) {
      const value = boundVariables[field];
      
      // Handle both single variable and array of variables (e.g., fills)
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const varAlias = value[i];
          if (varAlias && varAlias.id) {
            try {
              const variable = await figma.variables.getVariableByIdAsync(varAlias.id);
              if (variable) {
                boundVars.push({
                  field: `${field}[${i}]`,
                  variableKey: variable.key,
                  variableName: variable.name
                });
                console.log(`Extracted variable binding - field: ${field}[${i}], key: ${variable.key}, name: ${variable.name}`);
              }
            } catch (e) {
              console.warn(`Failed to get variable by id ${varAlias.id}:`, e);
            }
          }
        }
      } else if (value && value.id) {
        try {
          const variable = await figma.variables.getVariableByIdAsync(value.id);
          if (variable) {
            boundVars.push({
              field: field,
              variableKey: variable.key,
              variableName: variable.name
            });
            console.log(`Extracted variable binding - field: ${field}, key: ${variable.key}, name: ${variable.name}`);
          }
        } catch (e) {
          console.warn(`Failed to get variable by id ${value.id}:`, e);
        }
      }
    }
  }
  
  return boundVars;
}

async function extractLayerData(node: SceneNode): Promise<LayerData> {
  const data: LayerData = {
    name: node.name,
    type: node.type,
    width: 'width' in node ? node.width : 0,
    height: 'height' in node ? node.height : 0,
    x: 'x' in node ? node.x : 0,
    y: 'y' in node ? node.y : 0,
  };
  
  // Capture fillStyleId, key and name if the node has a style applied
  if ('fillStyleId' in node && node.fillStyleId && node.fillStyleId !== '' && node.fillStyleId !== figma.mixed) {
    data.fillStyleId = node.fillStyleId as string;
    // Get the style key and name for cross-file compatibility using async method
    try {
      const style = await figma.getStyleByIdAsync(node.fillStyleId as string);
      if (style) {
        data.fillStyleKey = style.key;
        data.fillStyleName = style.name;
        console.log(`Extracted style - key: ${style.key}, name: ${style.name}`);
      }
    } catch (e) {
      console.warn(`Failed to get style by id ${node.fillStyleId}:`, e);
    }
  }
  
  // Always capture fills as fallback
  if ('fills' in node && node.fills !== figma.mixed) {
    data.fills = node.fills;
  }
  
  // Extract bound variables
  const boundVars = await extractBoundVariables(node);
  if (boundVars.length > 0) {
    data.boundVariables = boundVars;
  }
  
  return data;
}

async function extractComponentData(node: ComponentNode | ComponentSetNode): Promise<ComponentData> {
  if (node.type === 'COMPONENT_SET') {
    const variants: VariantData[] = [];
    
    for (const child of node.children) {
      if (child.type === 'COMPONENT') {
        const layers: LayerData[] = [];
        
        for (const layer of child.children) {
          layers.push(await extractLayerData(layer));
        }
        
        const variantFillStyleId = child.fillStyleId && child.fillStyleId !== '' && child.fillStyleId !== figma.mixed ? child.fillStyleId as string : undefined;
        let variantFillStyleKey: string | undefined = undefined;
        let variantFillStyleName: string | undefined = undefined;
        if (variantFillStyleId) {
          try {
            const style = await figma.getStyleByIdAsync(variantFillStyleId);
            if (style) {
              variantFillStyleKey = style.key;
              variantFillStyleName = style.name;
            }
          } catch (e) {
            console.warn(`Failed to get style by id ${variantFillStyleId}:`, e);
          }
        }
        const variantFills = child.fills !== figma.mixed ? child.fills : undefined;
        
        // Extract bound variables for variant
        const variantBoundVars = await extractBoundVariables(child);
        
        variants.push({
          name: child.name,
          properties: child.variantProperties || {},
          width: child.width,
          height: child.height,
          layoutSettings: extractLayoutSettings(child),
          fills: variantFills,
          fillStyleId: variantFillStyleId,
          fillStyleKey: variantFillStyleKey,
          fillStyleName: variantFillStyleName,
          boundVariables: variantBoundVars.length > 0 ? variantBoundVars : undefined,
          layers,
        });
      }
    }
    
    const componentSetFillStyleId = (node as any).fillStyleId && (node as any).fillStyleId !== '' && (node as any).fillStyleId !== figma.mixed ? (node as any).fillStyleId as string : undefined;
    let componentSetFillStyleKey: string | undefined = undefined;
    let componentSetFillStyleName: string | undefined = undefined;
    if (componentSetFillStyleId) {
      try {
        const style = await figma.getStyleByIdAsync(componentSetFillStyleId);
        if (style) {
          componentSetFillStyleKey = style.key;
          componentSetFillStyleName = style.name;
        }
      } catch (e) {
        console.warn(`Failed to get style by id ${componentSetFillStyleId}:`, e);
      }
    }
    const componentSetFills = (node as any).fills !== figma.mixed ? (node as any).fills : undefined;
    
    // Extract bound variables for ComponentSet
    const componentSetBoundVars = await extractBoundVariables(node);
    
    return {
      type: 'COMPONENT_SET',
      name: node.name,
      key: node.key,
      layoutSettings: extractLayoutSettings(node as any),
      fills: componentSetFills,
      fillStyleId: componentSetFillStyleId,
      fillStyleKey: componentSetFillStyleKey,
      fillStyleName: componentSetFillStyleName,
      boundVariables: componentSetBoundVars.length > 0 ? componentSetBoundVars : undefined,
      variants,
    };
  } else {
    const layers: LayerData[] = [];
    
    for (const layer of node.children) {
      layers.push(await extractLayerData(layer));
    }
    
    const componentFillStyleId = node.fillStyleId && node.fillStyleId !== '' && node.fillStyleId !== figma.mixed ? node.fillStyleId as string : undefined;
    let componentFillStyleKey: string | undefined = undefined;
    let componentFillStyleName: string | undefined = undefined;
    if (componentFillStyleId) {
      try {
        const style = await figma.getStyleByIdAsync(componentFillStyleId);
        if (style) {
          componentFillStyleKey = style.key;
          componentFillStyleName = style.name;
        }
      } catch (e) {
        console.warn(`Failed to get style by id ${componentFillStyleId}:`, e);
      }
    }
    const componentFills = node.fills !== figma.mixed ? node.fills : undefined;
    
    // Extract bound variables for Component
    const componentBoundVars = await extractBoundVariables(node);
    
    return {
      type: 'COMPONENT',
      name: node.name,
      key: node.key,
      width: node.width,
      height: node.height,
      layoutSettings: extractLayoutSettings(node),
      fills: componentFills,
      fillStyleId: componentFillStyleId,
      fillStyleKey: componentFillStyleKey,
      fillStyleName: componentFillStyleName,
      boundVariables: componentBoundVars.length > 0 ? componentBoundVars : undefined,
      layers,
    };
  }
}

async function applyBoundVariablesToNode(node: SceneNode, boundVariablesData?: BoundVariableData[], libraryKey?: string): Promise<void> {
  if (!boundVariablesData || boundVariablesData.length === 0) {
    return;
  }
  
  for (const varData of boundVariablesData) {
    try {
      // Try to import variable by key
      const variable = await figma.variables.importVariableByKeyAsync(varData.variableKey);
      
      if (variable) {
        console.log(`Successfully imported variable: ${variable.name} (key: ${varData.variableKey})`);
        
        // Parse field name to handle array indices like "fills[0]"
        const arrayMatch = varData.field.match(/^(\w+)\[(\d+)\]$/);
        
        if (arrayMatch) {
          // Handle array fields (e.g., fills[0])
          const fieldName = arrayMatch[1];
          const index = parseInt(arrayMatch[2]);
          
          if (fieldName === 'fills' && 'fills' in node) {
            const fills = node.fills;
            if (fills !== figma.mixed && Array.isArray(fills) && fills[index]) {
              const paint = fills[index];
              if (paint.type === 'SOLID') {
                const updatedPaint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
                const newFills = [...fills];
                newFills[index] = updatedPaint;
                (node as any).fills = newFills;
                console.log(`Applied variable to ${fieldName}[${index}]`);
              }
            }
          }
        } else {
          // Handle simple fields
          if ('setBoundVariable' in node) {
            (node as any).setBoundVariable(varData.field as any, variable);
            console.log(`Applied variable to field: ${varData.field}`);
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to import or apply variable "${varData.variableName}" (key: ${varData.variableKey}):`, e);
    }
  }
}

async function applyStyleToNode(node: SceneNode, styleKey?: string, styleName?: string, libraryKey?: string): Promise<boolean> {
  if (!('fillStyleId' in node)) {
    return false;
  }
  
  // Step 1: Try to find local style by name
  if (styleName) {
    const localStyles = figma.getLocalPaintStyles();
    const matchedStyle = localStyles.find(style => style.name === styleName);
    
    if (matchedStyle) {
      console.log(`Found local style: ${matchedStyle.name}`);
      node.fillStyleId = matchedStyle.id;
      return true;
    }
  }
  
  // Step 2: Try to import from library by key
  if (styleKey) {
    try {
      console.log(`Style "${styleName}" not found locally, trying to import by key: ${styleKey}`);
      const importedStyle = await figma.importStyleByKeyAsync(styleKey);
      if (importedStyle && importedStyle.type === 'PAINT') {
        console.log(`Successfully imported style: ${importedStyle.name}`);
        node.fillStyleId = importedStyle.id;
        return true;
      }
    } catch (e) {
      console.warn(`Failed to import style with key ${styleKey}:`, e);
    }
  }
  
  // Step 3: If still not found, log a message
  console.warn(`Style "${styleName}" (key: ${styleKey}) not found locally or in library`);
  return false;
}

async function createLayerFromData(parent: ComponentNode | FrameNode, layerData: LayerData, libraryKey?: string) {
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
  
  // Apply fills first as fallback
  if (layerData.fills && 'fills' in layer && layerData.fills !== figma.mixed) {
    layer.fills = layerData.fills as Paint[];
  }
  
  // Apply fillStyle if available (has priority over variables)
  const styleApplied = layerData.fillStyleKey || layerData.fillStyleName
    ? await applyStyleToNode(layer, layerData.fillStyleKey, layerData.fillStyleName, libraryKey)
    : false;
  
  // Apply bound variables only if style was not applied
  if (!styleApplied && layerData.boundVariables) {
    await applyBoundVariablesToNode(layer, layerData.boundVariables, libraryKey);
  }
  
  parent.appendChild(layer);
}

async function importComponentData(data: ComponentData, libraryKey?: string) {
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
        await createLayerFromData(variantNode, layerData, libraryKey);
      }
      
      // Set variant dimensions after creating layers
      if (variantData.width && variantData.height) {
        variantNode.resize(variantData.width, variantData.height);
      }
      
      // Apply fills first as fallback
      if (variantData.fills && variantData.fills !== figma.mixed) {
        variantNode.fills = variantData.fills as Paint[];
      }
      
      // Apply style to variant if available (has priority over variables)
      const variantStyleApplied = variantData.fillStyleKey || variantData.fillStyleName
        ? await applyStyleToNode(variantNode, variantData.fillStyleKey, variantData.fillStyleName, libraryKey)
        : false;
      
      // Apply bound variables to variant only if style was not applied
      if (!variantStyleApplied && variantData.boundVariables) {
        await applyBoundVariablesToNode(variantNode, variantData.boundVariables, libraryKey);
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
    
    // Apply fills first as fallback
    if (data.fills && data.fills !== figma.mixed) {
      (targetNode as any).fills = data.fills as Paint[];
    }
    
    // Apply style to ComponentSet if available (has priority over variables)
    const componentSetStyleApplied = data.fillStyleKey || data.fillStyleName
      ? await applyStyleToNode(targetNode as any, data.fillStyleKey, data.fillStyleName, libraryKey)
      : false;
    
    // Apply bound variables to ComponentSet only if style was not applied
    if (!componentSetStyleApplied && data.boundVariables) {
      await applyBoundVariablesToNode(targetNode as any, data.boundVariables, libraryKey);
    }
    
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
      await createLayerFromData(targetNode, layerData, libraryKey);
    }
    
    // Set dimensions after creating layers
    if (data.width && data.height) {
      targetNode.resize(data.width, data.height);
    }
    
    // Apply fills first as fallback
    if (data.fills && data.fills !== figma.mixed) {
      targetNode.fills = data.fills as Paint[];
    }
    
    // Apply style to component if available (has priority over variables)
    const componentStyleApplied = data.fillStyleKey || data.fillStyleName
      ? await applyStyleToNode(targetNode, data.fillStyleKey, data.fillStyleName, libraryKey)
      : false;
    
    // Apply bound variables to component only if style was not applied
    if (!componentStyleApplied && data.boundVariables) {
      await applyBoundVariablesToNode(targetNode, data.boundVariables, libraryKey);
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
    
    const data = await extractComponentData(node);
    figma.ui.postMessage({ type: 'export-data', data });
    
  } else if (msg.type === 'import') {
    await importComponentData(msg.data, msg.libraryKey);
  } else if (msg.type === 'get-libraries') {
    try {
      // Get all variable collections from libraries added to this file
      const variableCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
      console.log('Available variable collections:', variableCollections);
      
      // Extract unique libraries from variable collections
      const libraryMap = new Map<string, { key: string; name: string }>();
      
      for (const collection of variableCollections) {
        if (collection.libraryName) {
          // Use the collection's key to derive a library identifier
          // Collections from the same library will have keys with the same prefix
          const libraryKey = collection.key.split(':')[0];
          
          if (!libraryMap.has(collection.libraryName)) {
            libraryMap.set(collection.libraryName, {
              key: libraryKey,
              name: collection.libraryName
            });
          }
        }
      }
      
      const librariesData = Array.from(libraryMap.values());
      
      // Add a default "Local File" option at the beginning
      librariesData.unshift({
        key: 'local',
        name: 'Local File (Current File)'
      });
      
      console.log('Sending libraries data:', librariesData);
      figma.ui.postMessage({ type: 'libraries-data', libraries: librariesData });
    } catch (e) {
      console.error('Failed to get libraries:', e);
      // Send at least the local option
      figma.ui.postMessage({
        type: 'libraries-data',
        libraries: [{ key: 'local', name: 'Local File (Current File)' }]
      });
    }
  }
};
