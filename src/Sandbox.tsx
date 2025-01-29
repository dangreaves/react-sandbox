import { useRef, useMemo, useEffect, useState } from "react";

import { buildSandboxContent, type ContentOptions } from "./utils";

export interface SandboxProps extends ContentOptions {
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
  /**
   * Sandbox attribute to apply to iframe.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
   */
  sandbox?: string;
  /**
   * An iframe src attribute if you prefer to point to a URL.
   * This will disable generation of the srcdoc.
   */
  src?: string;
}

export function Sandbox({
  src,
  sandbox,
  className,
  initialHidden,
  ...contentOptions
}: SandboxProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  /**
   * This markup will only be rendered once. You must change the "key" attribute on
   * the Sandbox component to force a remount if you change the child content.
   */
  const markup = useMemo(() => {
    if (!!src) return;
    return buildSandboxContent(contentOptions);
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
      src={src}
      ref={frameRef}
      srcDoc={markup}
      sandbox={sandbox}
      className={className}
      style={{
        width: "100%",
        border: "0",
        ...(isHidden ? { display: "none" } : {}),
      }}
    />
  );
}
