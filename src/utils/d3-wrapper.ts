import * as d3Library from 'd3';

// Create a wrapper that ensures d3 is only initialized after window is available
const getD3 = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Explicitly set the this context for d3
  const context = window;
  context.document = window.document;

  // Initialize d3 with the proper context
  const d3 = (function(context) {
    return d3Library;
  }).call(context, context);

  return d3;
};

export const d3 = getD3();