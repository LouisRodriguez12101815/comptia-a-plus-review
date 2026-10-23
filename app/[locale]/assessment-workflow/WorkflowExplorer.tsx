"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./guide.module.css";

const graphPath = "/guides/assessment-workflow/langgraph.html?embed=1";

function requestHeight(frame: HTMLIFrameElement | null) {
  frame?.contentWindow?.postMessage({ type: "assessment-workflow:measure" }, window.location.origin);
}

export default function WorkflowExplorer() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    function receiveHeight(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.origin !== window.location.origin) return;
      const message: unknown = event.data;
      if (typeof message !== "object" || message === null || !("type" in message) || !("height" in message)) return;
      if (message.type !== "assessment-workflow:height" || typeof message.height !== "number" || !Number.isFinite(message.height)) return;
      if (message.height < 400 || message.height > 10000) return;
      setHeight(Math.ceil(message.height));
    }

    window.addEventListener("message", receiveHeight);
    requestHeight(frame.current);
    return () => window.removeEventListener("message", receiveHeight);
  }, []);

  return <iframe
    ref={frame}
    id="workflow-explorer-frame"
    className={styles.explorerFrame}
    src={graphPath}
    title="Interactive LangGraph assessment workflow"
    aria-describedby="workflow-explorer-note"
    loading="lazy"
    onLoad={() => requestHeight(frame.current)}
    style={height ? { height } : undefined}
  />;
}
