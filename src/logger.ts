/**
 * Configuration options for the logger.
 */
export interface LoggerOptions {
  /**
   * Whether to render the error log div in the DOM.
   * @default true
   */
  renderErrorLogDiv?: boolean;

  /**
   * The HTML element ID to use for the error log div.
   * @default 'error-log'
   */
  errorLogDivId?: string;

  /**
   * Custom CSS styles for the expanded error log div.
   */
  style?: Partial<CSSStyleDeclaration>;

  /**
   * Whether to attach the logger instance to the window object as 'window.logger'.
   * @default true
   */
  attachToWindow?: boolean;

  /**
   * Maximum number of characters for error messages before truncation.
   * Hovering over truncated messages shows the full text.
   * @default 100
   */
  maxMessageLength?: number;

  /**
   * Whether the error log should be initially collapsed.
   * @default true
   */
  startCollapsed?: boolean;
}

export interface Logger {
  readonly errorCount: number;
  readonly errors: string[];
  readonly sourceMap: Map<string, ErrorInfo>;
  showSource: (errorId: string) => void;
}

interface ErrorInfo {
  message: string;
  stack?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  codeContext?: string;
}

/**
 * Initializes the logger.
 *
 * This function overrides console methods, sets up a global error listener, and (optionally)
 * renders a fixed error log div that can be toggled between expanded and collapsed states.
 *
 * @param options - Optional configuration for the logger.
 * @returns A Logger object exposing error count and logged error messages.
 */
export function initLogger(options?: LoggerOptions): Logger {
  const defaultOptions: LoggerOptions = {
    renderErrorLogDiv: true,
    errorLogDivId: 'error-log',
    style: {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      fontSize: '12px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: '1000',
      padding: '20px 30px',
      fontFamily: 'monospace'
    },
    attachToWindow: true,
    maxMessageLength: 100,
    startCollapsed: true,
  };

  const config = { ...defaultOptions, ...options };

  // Store the original style config to ensure we can fully restore it
  const originalStyle = { ...config.style };

  let errorCount = 0;
  const errors: string[] = [];
  const sourceMap = new Map<string, ErrorInfo>();

  // Create tooltip element
  let tooltip: HTMLDivElement | null = null;
  let tooltipActiveMsgSpan: HTMLElement | null = null;

  // Create source code viewer
  let sourceViewer: HTMLDivElement | null = null;

  // Create error log div and list if enabled
  let errorLogDiv: HTMLElement | null = null;
  let errorList: HTMLUListElement | null = null;
  let isExpanded = !config.startCollapsed;
  let closeButton: HTMLSpanElement;
  let errorCountBadge: HTMLSpanElement;

  // Create a debounce function for performance optimization
  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    waitFor: number
  ): ((...args: Parameters<F>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function (this: any, ...args: Parameters<F>): void {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func.apply(this, args), waitFor);
    };
  };

  // Helper to escape HTML characters - memoize for performance
  const escapeHTMLCache = new Map<string, string>();
  const escapeHTML = (str: string): string => {
    if (escapeHTMLCache.has(str)) {
      return escapeHTMLCache.get(str)!;
    }

    const escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    escapeHTMLCache.set(str, escaped);
    return escaped;
  };

  // Initialize tooltip
  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.fontFamily = 'monospace';
    tooltip.style.maxWidth = '400px';
    tooltip.style.wordWrap = 'break-word';
    tooltip.style.zIndex = '1001';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }

  // Initialize source code viewer
  function createSourceViewer() {
    sourceViewer = document.createElement('div');
    sourceViewer.style.position = 'fixed';
    sourceViewer.style.top = '50%';
    sourceViewer.style.left = '50%';
    sourceViewer.style.transform = 'translate(-50%, -50%)';
    sourceViewer.style.backgroundColor = '#1e1e1e';
    sourceViewer.style.color = '#d4d4d4';
    sourceViewer.style.padding = '20px';
    sourceViewer.style.borderRadius = '5px';
    sourceViewer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    sourceViewer.style.zIndex = '1002';
    sourceViewer.style.maxWidth = '80%';
    sourceViewer.style.maxHeight = '80%';
    sourceViewer.style.overflowY = 'auto';
    sourceViewer.style.fontFamily = 'monospace';
    sourceViewer.style.fontSize = '14px';
    sourceViewer.style.display = 'none';

    // Add close button to source viewer
    const sourceViewerClose = document.createElement('span');
    sourceViewerClose.textContent = '×';
    sourceViewerClose.style.position = 'absolute';
    sourceViewerClose.style.top = '10px';
    sourceViewerClose.style.right = '15px';
    sourceViewerClose.style.cursor = 'pointer';
    sourceViewerClose.style.fontSize = '24px';
    sourceViewerClose.style.fontWeight = 'bold';
    sourceViewerClose.style.color = '#999';
    sourceViewerClose.style.userSelect = 'none';
    sourceViewerClose.addEventListener('click', () => {
      if (sourceViewer) {
        sourceViewer.style.display = 'none';
      }
    });

    sourceViewer.appendChild(sourceViewerClose);
    document.body.appendChild(sourceViewer);
  }

  function createSolutionViewer() {
    let solutionViewer = document.getElementById('solution-viewer');
    if (!solutionViewer) {
      solutionViewer = document.createElement('div');
      solutionViewer.id = 'solution-viewer';
      solutionViewer.style.position = 'fixed';
      solutionViewer.style.top = '50%';
      solutionViewer.style.left = '50%';
      solutionViewer.style.transform = 'translate(-50%, -50%)';
      solutionViewer.style.backgroundColor = '#1e1e1e';
      solutionViewer.style.color = '#d4d4d4';
      solutionViewer.style.padding = '20px';
      solutionViewer.style.borderRadius = '5px';
      solutionViewer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
      solutionViewer.style.zIndex = '1002';
      solutionViewer.style.maxWidth = '80%';
      solutionViewer.style.maxHeight = '80%';
      solutionViewer.style.overflowY = 'auto';
      solutionViewer.style.fontFamily = 'monospace';
      solutionViewer.style.fontSize = '14px';
      solutionViewer.style.display = 'none';

      // Add close button
      const closeBtn = document.createElement('span');
      closeBtn.textContent = '×';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '10px';
      closeBtn.style.right = '15px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '24px';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.color = '#999';
      closeBtn.style.userSelect = 'none';
      closeBtn.addEventListener('click', () => {
        if (solutionViewer)
          solutionViewer.style.display = 'none';
      });

      solutionViewer.appendChild(closeBtn);
      document.body.appendChild(solutionViewer);
    }

    return solutionViewer;
  }

  // Function to hide tooltip
  const hideTooltip = (): void => {
    if (tooltip) {
      tooltip.style.display = 'none';
      document.removeEventListener('mousemove', updateTooltipPosition);
      tooltipActiveMsgSpan = null;
    }
  };

  if (config.renderErrorLogDiv) {
    // Create tooltip and source viewer
    createTooltip();
    createSourceViewer();

    errorLogDiv = document.createElement('div');
    errorLogDiv.id = config.errorLogDivId || 'error-log';

    errorList = document.createElement('ul');
    errorList.style.margin = '0';
    errorList.style.padding = '0';
    errorList.style.listStyleType = 'disc'; // Bullet points

    errorLogDiv.appendChild(errorList);

    // Create error count badge for the collapsed state
    errorCountBadge = document.createElement('span');
    errorCountBadge.textContent = '0';
    errorCountBadge.style.position = 'absolute';
    errorCountBadge.style.top = '50%';
    errorCountBadge.style.left = '50%';
    errorCountBadge.style.transform = 'translate(-50%, -50%)';
    errorCountBadge.style.color = 'white';
    errorCountBadge.style.fontWeight = 'bold';
    errorLogDiv.appendChild(errorCountBadge);

    // Create a close button for the expanded state.
    closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '4px';
    closeButton.style.right = '8px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '14px';
    closeButton.style.color = 'white';
    closeButton.style.userSelect = 'none';
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      isExpanded = false;
      updateErrorLogStyle();
    });

    // Apply initial styles based on config
    updateErrorLogStyle();

    // When clicking the error log div, toggle its state
    errorLogDiv.addEventListener('click', () => {
      if (!isExpanded) {
        isExpanded = true;
        updateErrorLogStyle();
      }
    });

    // Append the error log div once the DOM is ready.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(errorLogDiv!);
      });
    } else {
      document.body.appendChild(errorLogDiv);
    }
  }

  // Update the error log div's style based on its state.
  function updateErrorLogStyle() {
    if (!errorLogDiv) return;

    if (isExpanded) {
      // Reset all inline styles first to avoid style conflicts
      errorLogDiv.removeAttribute('style');

      // Reapply all original styles
      for (const prop in originalStyle) {
        errorLogDiv.style[prop as any] = originalStyle[prop as keyof typeof originalStyle] as string;
      }

      if (errorList) {
        errorList.style.display = 'block';
      }

      if (!errorLogDiv.contains(closeButton)) {
        errorLogDiv.appendChild(closeButton);
      }

      // Hide error count in expanded state
      errorCountBadge.style.display = 'none';
    } else {
      // Collapsed: shrink into a small circle at the bottom left.
      // Reset styles first to avoid conflicts
      errorLogDiv.removeAttribute('style');

      // Apply collapsed styles
      errorLogDiv.style.position = 'fixed';
      errorLogDiv.style.bottom = '10px';
      errorLogDiv.style.left = '10px';
      errorLogDiv.style.right = 'auto';
      errorLogDiv.style.width = '30px';
      errorLogDiv.style.height = '30px';
      errorLogDiv.style.borderRadius = '50%';
      errorLogDiv.style.padding = '0';
      errorLogDiv.style.overflow = 'hidden';
      errorLogDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      errorLogDiv.style.fontSize = '12px';
      errorLogDiv.style.cursor = 'pointer';
      errorLogDiv.style.zIndex = '1000'; // Preserve z-index from original style

      if (errorList) {
        errorList.style.display = 'none';
      }

      // Remove the close button
      if (errorLogDiv.contains(closeButton)) {
        errorLogDiv.removeChild(closeButton);
      }

      // Show error count in collapsed state
      errorCountBadge.style.display = 'block';
      errorCountBadge.textContent = errorCount.toString();
    }
  }

  // Helper to truncate text
  const truncateText = (text: string, maxLength: number = config.maxMessageLength!): string => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  // Helper to format error messages - memoize for performance
  const formatErrorCache = new WeakMap<Error, string>();
  const formatError = (...args: any[]): string => {
    const result = args.map(arg => {
      if (arg instanceof Error) {
        // Check cache first
        if (formatErrorCache.has(arg)) {
          return formatErrorCache.get(arg);
        }
        const formatted = arg.stack || arg.toString();
        formatErrorCache.set(arg, formatted);
        return formatted;
      }
      return String(arg);
    }).join(' ');

    return result;
  };

  function updateContentDiv(parsedData) {
    // Find the target div in your DOM
    const contentDiv = document.getElementById('contentDiv');
    if (!contentDiv) {
      console.error('contentDiv not found.');
      return;
    }
  
    let htmlContent = '';
  
    // Add "Issue" section if present
    if (parsedData.issue) {
      htmlContent += `<div style="margin-bottom:15px;">
        <h4 style="color:#6ab0ff;margin-bottom:5px;">Issue</h4>
        <p>${escapeHTML(parsedData.issue)}</p>
      </div>`;
    }
  
    // Add "Fix" section if present
    if (parsedData.fix) {
      htmlContent += `<div style="margin-bottom:15px;">
        <h4 style="color:#6ab0ff;margin-bottom:5px;">Fix</h4>
        <pre style="white-space:pre-wrap;margin:0;">${escapeHTML(parsedData.fix)}</pre>
      </div>`;
    }
  
    // Add "Code Example" section if present
    if (parsedData.codeExample) {
      htmlContent += `<div>
        <h4 style="color:#6ab0ff;margin-bottom:5px;">Code Example</h4>
        <pre style="background-color:#2d2d2d;padding:10px;border-radius:4px;overflow-x:auto;margin:0;">
          <code>${escapeHTML(parsedData.codeExample)}</code>
        </pre>
      </div>`;
    }
  
    // Update the contentDiv with the new HTML content
    contentDiv.innerHTML = htmlContent;
  }

  // Function to fetch AI fix for an error
  const fetchAIFix = async (errorId: string) => {
    // Hide tooltip when AI fix is requested
    hideTooltip();

    const errorInfo = sourceMap.get(errorId);
    if (!errorInfo) {
      alert('Error information not available');
      return;
    }

    try {
      // If we don't have code context yet, try to fetch it
      if (!errorInfo.codeContext && errorInfo.fileName) {
        try {
          const response = await fetch(errorInfo.fileName);
          if (response.ok) {
            const sourceCode = await response.text();
            const lines = sourceCode.split('\n');

            // Extract relevant code context
            const lineNumber = errorInfo.lineNumber || 0;
            const startLine = Math.max(0, lineNumber - 5);
            const endLine = Math.min(lines.length, lineNumber + 5);
            errorInfo.codeContext = lines.slice(startLine, endLine).join('\n');

            // Store updated error info with code context
            sourceMap.set(errorId, errorInfo);
          }
        } catch (e) {
          console.log('Failed to fetch code context:', e);
        }
      }

      // Prepare data for the AI fix request with code context
      const errorData = {
        message: errorInfo.message,
        stack: errorInfo.stack,
        fileName: errorInfo.fileName,
        lineNumber: errorInfo.lineNumber,
        columnNumber: errorInfo.columnNumber,
        codeContext: errorInfo.codeContext || 'No code context available'
      };

      // Create and show the solution viewer with loading state
      const solutionViewer = createSolutionViewer();
      solutionViewer.innerHTML = '<h3 style="margin-top:0;color:#ccc;">AI Fix - Loading...</h3>';
      solutionViewer.innerHTML += '<div class="solution-content"></div>';
      solutionViewer.style.display = 'block';

      const contentDiv = solutionViewer.querySelector('.solution-content');

      const response = await fetch(`http://localhost:3000/api/suggest/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      })

      if (!response.ok) {
        throw new Error(`Failed to get AI fix: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let jsonText = '';

        // Process the stream chunks
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk and append to our JSON text
          const chunk = decoder.decode(value, { stream: true });
          console.log(chunk)
          jsonText += chunk;

          try {
            // Attempt to parse the current JSON text
            const parsedData = JSON.parse(jsonText);

            // Update the UI with the parsed data
            if (contentDiv) {
              let htmlContent = '';

              // Add issue section
              if (parsedData.issue) {
                htmlContent += `<div style="margin-bottom:15px;">
                  <h4 style="color:#6ab0ff;margin-bottom:5px;">Issue</h4>
                  <p>${escapeHTML(parsedData.issue)}</p>
                </div>`;
              }

              // Add fix section
              if (parsedData.fix) {
                htmlContent += `<div style="margin-bottom:15px;">
                  <h4 style="color:#6ab0ff;margin-bottom:5px;">Fix</h4>
                  <pre style="white-space:pre-wrap;margin:0;">${escapeHTML(parsedData.fix)}</pre>
                </div>`;
              }

              // Add code example section
              if (parsedData.codeExample) {
                htmlContent += `<div>
                  <h4 style="color:#6ab0ff;margin-bottom:5px;">Code Example</h4>
                  <pre style="background-color:#2d2d2d;padding:10px;border-radius:4px;overflow-x:auto;margin:0;"><code>${escapeHTML(parsedData.codeExample)}</code></pre>
                </div>`;
              }

              contentDiv.innerHTML = htmlContent;
            }
          } catch (e) {
            // If we can't parse the JSON yet, we're still receiving data
            // We'll just wait for more chunks
            console.log('Partial data received, waiting for more...');
          }
        }
      } else {
        throw new Error('Response body is not available for streaming');
      }
    } catch (error) {
      const solutionViewer = createSolutionViewer();
      solutionViewer.innerHTML = `<h3 style="margin-top:0;color:#ccc;">Error</h3>
        <div style="color:#ff6b6b;">Failed to get AI fix: ${error instanceof Error ? error.message : String(error)}</div>`;
      solutionViewer.style.display = 'block';
    }
  };

  // Function to show source code
  const showSource = async (errorId: string) => {
    // Hide tooltip when viewing source
    hideTooltip();

    if (!sourceViewer) return;

    const errorInfo = sourceMap.get(errorId);
    if (!errorInfo || !errorInfo.fileName) {
      sourceViewer.innerHTML = '<div>Source information not available</div>';
      sourceViewer.style.display = 'block';
      return;
    }

    try {
      // Try to fetch the source file
      const response = await fetch(errorInfo.fileName);
      if (!response.ok) {
        throw new Error(`Failed to fetch source: ${response.status} ${response.statusText}`);
      }

      const sourceCode = await response.text();
      const lines = sourceCode.split('\n');

      // Create source view with line numbers
      let sourceHTML = '<div style="position:relative;">';
      sourceHTML += `<h3 style="margin-top:0;color:#ccc;">${errorInfo.fileName}</h3>`;
      sourceHTML += '<pre style="margin:0;padding-bottom:20px;"><code>';

      // Determine range of lines to show (context around the error)
      const lineNumber = errorInfo.lineNumber || 0;
      const startLine = Math.max(0, lineNumber - 5);
      const endLine = Math.min(lines.length, lineNumber + 5);

      // Extract the code context to include with error info
      const codeContext = lines.slice(startLine, endLine).join('\n');

      // Update errorInfo with the code context
      errorInfo.codeContext = codeContext;
      sourceMap.set(errorId, errorInfo);

      // Add line numbers and code
      for (let i = startLine; i < endLine; i++) {
        const lineNum = i + 1;
        const isErrorLine = lineNum === lineNumber;
        const lineStyle = isErrorLine ?
          'background-color:rgba(255,0,0,0.2);font-weight:bold;' : '';

        sourceHTML += `<div style="display:flex;${lineStyle}">`;
        sourceHTML += `<div style="color:#666;text-align:right;padding-right:10px;user-select:none;width:30px;">${lineNum}</div>`;
        sourceHTML += `<div style="white-space:pre;">${escapeHTML(lines[i] || '')}</div>`;
        sourceHTML += '</div>';
      }

      sourceHTML += '</code></pre>';

      // Add error message
      if (errorInfo.message) {
        sourceHTML += `<div style="color:#ff6b6b;margin-top:10px;">Error: ${escapeHTML(errorInfo.message)}</div>`;
      }

      // Add close button
      const closeBtn = document.createElement('span');
      closeBtn.textContent = '×';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '10px';
      closeBtn.style.right = '15px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '20px';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.color = '#999';
      closeBtn.style.userSelect = 'none';
      closeBtn.addEventListener('click', () => {
        if (sourceViewer) {
          sourceViewer.style.display = 'none';
        }
      });

      sourceViewer.innerHTML = sourceHTML;
      sourceViewer.appendChild(closeBtn);
      sourceViewer.style.display = 'block';
    } catch (error) {
      sourceViewer.innerHTML = `<div>Error loading source: ${error instanceof Error ? error.message : String(error)}</div>`;
      sourceViewer.style.display = 'block';
    }
  };

  // Update tooltip position (debounced for performance)
  const updateTooltipPosition = debounce((e: MouseEvent) => {
    if (!tooltip || !tooltipActiveMsgSpan) return;

    const offset = 10; // Distance from cursor

    // Get tooltip dimensions
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate potential position
    let left = e.pageX + offset;
    let top = e.pageY + offset;

    // Adjust if would go off-screen
    if (left + tooltipWidth > viewportWidth - 10) {
      left = e.pageX - tooltipWidth - offset; // Place left of cursor instead
    }

    if (top + tooltipHeight > viewportHeight - 10) {
      top = e.pageY - tooltipHeight - offset; // Place above cursor instead
    }

    // Ensure tooltip is never positioned off-screen
    left = Math.max(10, left);
    top = Math.max(10, top);

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }, 10);

  // Helper to update the error log
  const addErrorToLog = (msg: string, errorInfo: ErrorInfo) => {
    errors.push(msg);

    // Generate a unique ID for this error
    const errorId = `error-${Date.now()}-${errorCount}`;
    sourceMap.set(errorId, errorInfo);

    if (errorList) {
      const li = document.createElement('li');

      // Create error message span (truncated)
      const msgSpan = document.createElement('span');
      const truncatedMsg = truncateText(msg);
      msgSpan.textContent = truncatedMsg;
      msgSpan.style.marginRight = '8px';
      msgSpan.classList.add('error-message');
      li.appendChild(msgSpan);

      // Add source code link if filename exists
      if (errorInfo.fileName) {
        const fileInfo = document.createElement('span');
        fileInfo.textContent = `[${errorInfo.fileName.split('/').pop()}:${errorInfo.lineNumber || '?'}]`;
        fileInfo.style.color = '#aaa';
        fileInfo.style.fontSize = '10px';
        li.appendChild(fileInfo);

        // Create source code button
        const viewSourceBtn = document.createElement('button');
        viewSourceBtn.textContent = 'View Source';
        viewSourceBtn.style.marginLeft = '8px';
        viewSourceBtn.style.fontSize = '10px';
        viewSourceBtn.style.padding = '2px 4px';
        viewSourceBtn.style.backgroundColor = '#555';
        viewSourceBtn.style.color = 'white';
        viewSourceBtn.style.border = 'none';
        viewSourceBtn.style.borderRadius = '3px';
        viewSourceBtn.style.cursor = 'pointer';

        viewSourceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showSource(errorId);
        });

        li.appendChild(viewSourceBtn);

        // Create "Fix with AI" button
        const fixWithAIBtn = document.createElement('button');
        fixWithAIBtn.textContent = 'Fix with AI';
        fixWithAIBtn.style.marginLeft = '8px';
        fixWithAIBtn.style.fontSize = '10px';
        fixWithAIBtn.style.padding = '2px 4px';
        fixWithAIBtn.style.backgroundColor = '#4a76c7';
        fixWithAIBtn.style.color = 'white';
        fixWithAIBtn.style.border = 'none';
        fixWithAIBtn.style.borderRadius = '3px';
        fixWithAIBtn.style.cursor = 'pointer';

        fixWithAIBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fetchAIFix(errorId);
        });

        li.appendChild(fixWithAIBtn);
      }

      // Style for the list item
      li.style.marginBottom = '4px';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.alignItems = 'center';

      // Store the full message as a data attribute
      li.dataset.fullMessage = msg;
      li.dataset.errorId = errorId;

      // Add hover events for tooltip ONLY to the message span
      msgSpan.addEventListener('mouseover', (e) => {
        if (tooltip && msgSpan.textContent?.includes('...')) {
          tooltipActiveMsgSpan = msgSpan;
          const fullMessage = li.dataset.fullMessage || '';

          tooltip.textContent = fullMessage;
          tooltip.style.display = 'block';

          // Position the tooltip next to the cursor
          document.addEventListener('mousemove', updateTooltipPosition);
          updateTooltipPosition(e as MouseEvent);
        }
      });

      msgSpan.addEventListener('mouseout', () => {
        hideTooltip();
      });

      errorList.appendChild(li);
    }

    // Update error count badge
    if (errorCountBadge) {
      errorCountBadge.textContent = errorCount.toString();
    }
  };

  // Extract error information from error objects - memoize for performance
  const errorInfoCache = new WeakMap<Error, ErrorInfo>();

  const extractErrorInfo = (error: Error | ErrorEvent | string): ErrorInfo => {
    if (typeof error === 'string') {
      return { message: error };
    }

    if (error instanceof Error) {
      // Check cache first
      if (errorInfoCache.has(error)) {
        return errorInfoCache.get(error)!;
      }

      // For JS Error objects
      const info: ErrorInfo = {
        message: error.message,
        stack: error.stack
      };

      // Try to parse filename and line number from stack trace
      if (error.stack) {
        const stackLines = error.stack.split('\n');
        for (const line of stackLines) {
          const match = line.match(/at\s+.*\s+\((.*):(\d+):(\d+)\)/);
          if (match) {
            info.fileName = match[1];
            info.lineNumber = parseInt(match[2], 10);
            info.columnNumber = parseInt(match[3], 10);
            break;
          }
        }
      }

      // Cache the result
      errorInfoCache.set(error, info);
      return info;
    } else {
      // For ErrorEvent objects
      return {
        message: error.message,
        fileName: error.filename,
        lineNumber: error.lineno,
        columnNumber: error.colno
      };
    }
  };

  // Save original console methods.
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  // Override console.log.
  console.log = function (...args: any[]): void {
    for (const arg of args) {
      if (arg instanceof Error) {
        errorCount++;
        const msg = formatError(arg);
        const errorInfo = extractErrorInfo(arg);
        addErrorToLog(msg, errorInfo);
      }
    }
    originalConsoleLog.apply(console, args);
  };

  // Override console.error.
  console.error = function (...args: any[]): void {
    errorCount++;
    const msg = formatError(...args);

    // Extract error information if there's an Error object
    let errorInfo: ErrorInfo = { message: msg };
    for (const arg of args) {
      if (arg instanceof Error) {
        errorInfo = extractErrorInfo(arg);
        break;
      }
    }

    addErrorToLog(msg, errorInfo);
    originalConsoleError.apply(console, args);
  };

  // Global error listener - use passive event listener for better performance
  window.addEventListener('error', event => {
    errorCount++;
    const msg = event.error
      ? (event.error.stack || event.error.toString())
      : event.message;

    const errorInfo = event.error
      ? extractErrorInfo(event.error)
      : {
        message: event.message,
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno
      };

    addErrorToLog(msg, errorInfo);
  }, { passive: true });

  const loggerObj: Logger = {
    get errorCount() {
      return errorCount;
    },
    get errors() {
      return errors;
    },
    get sourceMap() {
      return sourceMap;
    },
    showSource
  };

  if (config.attachToWindow) {
    (window as any).logger = loggerObj;
  }

  return loggerObj;
}