import { useRef, useMemo, useEffect, useState } from "react";

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
  /**
   * Optional class name for the iframe.
   */
  className?: string;
  /**
   * If enabled, the iframe will be set to display: none until you call window.showSandbox()
   * from inside the iframe.
   *
   * This is useful for widgets which do not render anything, and you want to hide the
   * iframe node until something visible is rendered.
   */
  initialHidden?: boolean;
}

export function Sandbox({
  children,
  bodyClass,
  className,
  headContent,
  initialHidden,
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
    ${headContent ?? ""}
  </head>
  <body${!!bodyClass && ` class="${bodyClass}"`}>
    <script>
      function showSandbox() {
        window.parent.postMessage({ eventType: "show" }, '*');
      }

      function hideSandbox() {
        window.parent.postMessage({ eventType: "hide" }, '*');
      }
    </script>
    ${children}
    <script>
      (() => {
        function sendHeightToParent() {
          const height = document.documentElement.offsetHeight;
          window.parent.postMessage({ eventType: "height", height }, '*');
        }

        // Send initial event on load.
        window.onload = sendHeightToParent;

        // Send event when window is resized.
        window.onresize = sendHeightToParent;

        // Send event when DOM nodes change.
        const observer = new MutationObserver(sendHeightToParent);
        observer.observe(document.body, { childList: true, subtree: true });
      })();
    </script>
  </body>
</html>
`;
  }, []);

  // Should the iframe be hidden?
  const [isHidden, setIsHidden] = useState(!!initialHidden);

  // Listen for events sent by the iframe.
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

      // Extract event type from event.
      const eventType = event.data?.["eventType"];
      if ("string" !== typeof eventType) return;

      // Resize iframe on "height" events.
      if ("height" === eventType) {
        const height = event.data["height"];
        if ("number" !== typeof height) return;
        frame.style.height = height + "px";
      }

      // Show iframe on "show" events.
      if ("show" === eventType) setIsHidden(false);

      // Hide iframe on "hide" events.
      if ("hide" === eventType) setIsHidden(true);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      srcDoc={markup}
      className={className}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        border: "0",
        ...(isHidden ? { display: "none" } : {}),
      }}
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
