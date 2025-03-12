import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Sandbox } from "./Sandbox.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sandbox>
      {`
      <h1>Sandboxed Widget</h1>
      <p id="message"></p>
      <script>
        setTimeout(() => {
          document.getElementById("message").innerText = "This is a dynamic message.";
        }, 2000);
      </script>
      `}
    </Sandbox>
  </StrictMode>,
);
