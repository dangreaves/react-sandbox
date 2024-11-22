import { useRef, useMemo, useEffect } from "react";

export interface SandboxProps {
  /**
   * HTML string to render in the body.
   *
   * This prop is not reactive. If you change the content, you must remount this
   * component by changing the `key` prop.
   */
  children: string;
  /**
   * Optional HTML string to render in the head.
   *
   * This prop is not reactive. If you change the content, you must remount this
   * component by changing the `key` prop.
   */
  headContent?: string;
  /**
   * Optional class to apply to the <body> element inside the iframe.
   */
  bodyClass?: string;
}

export function Sandbox({
  children,
  bodyClass = "",
  headContent = "",
}: SandboxProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  /**
   * This markup will only be rendered once. You must change the "key" attribute on
   * the Sandbox component to force a remount if you change the child content.
   */
  const markup = useMemo(() => {
    return `
<html>
  <head>
    <style>${CSS_RESET}</style>
    ${headContent}
  </head>
  <body${!!bodyClass && ` class="${bodyClass}"`}>
    ${children}
    <script>
      function sendHeightToParent() {
        const height = document.documentElement.offsetHeight;
        window.parent.postMessage({ height }, '*');
      }

      // Send initial event on load.
      window.onload = sendHeightToParent;

      // Send event when window is resized.
      window.onresize = sendHeightToParent;

      // Send event when DOM nodes change.
      const observer = new MutationObserver(sendHeightToParent);
      observer.observe(document.body, { childList: true, subtree: true });
    </script>
  </body>
</html>
`;
  }, []);

  /**
   * Listen for events sent by the iframe.
   */
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Cannot do anything if we don't have a frame ref yet.
      const frame = frameRef.current;
      if (!frame) return;

      // Obtain the window from the frame.
      const frameWindow = frame.contentWindow;
      if (!frameWindow) return;

      // Determine if the message was sent from our frame.
      if (frameWindow !== event.source) return;

      // Determine if the message data contains the height.
      const height = event.data["height"];
      if ("number" !== typeof height) return;

      // Resize the iframe.
      frame.style.height = height + "px";
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      srcDoc={markup}
      sandbox="allow-scripts"
      style={{ width: "100%", border: "0" }}
    />
  );
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
