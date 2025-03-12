export interface ContentOptions {
  /**
   * HTML string to render in the body.
   *
   * This prop is not reactive. If you change the content, you must remount this
   * component by changing the `key` prop.
   */
  children?: string;
  /**
   * Optional HTML string to render in the head.
   *
   * This prop is not reactive. If you change the content, you must remount this
   * component by changing the `key` prop.
   */
  headContent?: string;
  /**
   * Optional class name to apply to the <body> element inside the iframe.
   */
  bodyClassName?: string;
}

/**
 * Build HTML content for sandbox.
 * The output includes scripts to automatically adjust the iframe height to the content.
 */
export function buildSandboxContent({
  children,
  headContent,
  bodyClassName,
}: ContentOptions) {
  return `
<html>
  <head>
    <style>${CSS_RESET}</style>
    ${headContent ?? ""}
    <script>
      (() => {
        function sendHeightToParent() {
          const height = document.documentElement.offsetHeight;
          window.parent.postMessage({ eventType: "height", height }, '*');
        }

        window.addEventListener("load", function() {
          // Send event when DOM nodes change.
          const observer = new MutationObserver(sendHeightToParent);
          observer.observe(document.body, { childList: true, subtree: true });

          // Send initial event on load.
          sendHeightToParent();

          // Resend event 1 second after load, just in case the observer misses something.
          setTimeout(() => sendHeightToParent(), 1000);
        });

        // Send event when window is resized.
        window.addEventListener("resize", function() {
          sendHeightToParent();
        });
      })();

      function showSandbox() {
        window.parent.postMessage({ eventType: "show" }, '*');
      }

      function hideSandbox() {
        window.parent.postMessage({ eventType: "hide" }, '*');
      }
    </script>
  </head>
  <body${!!bodyClassName && ` class="${bodyClassName}"`}>
    ${children}
  </body>
</html>
  `;
}

/**
 * CSS reset applied to iframe.
 */
const CSS_RESET = `
/* Apply border-box model to all elements */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Remove default margin */
* {
  margin: 0;
}
`;
