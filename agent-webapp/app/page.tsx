"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Settings = {
  baseURL: string;
  apiKey: string;
  model: string;
};

type Health = {
  ok: boolean;
  composioConfigured: boolean;
  serverAIConfigured: boolean;
};

const quickActions = [
  "Summarize my unread Gmail messages from today.",
  "Show my open GitHub pull requests.",
  "Create a calendar event tomorrow at 3 PM.",
  "Find the latest files in my Google Drive.",
];

function getOrCreateUserId() {
  const key = "omni-agent-user-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = "usr_" + crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

function LinkifiedText({ text }: { text: string }) {
  const chunks = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {chunks.map((chunk, index) =>
        /^https?:\/\//.test(chunk) ? (
          <a key={index} href={chunk} target="_blank" rel="noreferrer">
            {chunk}
          </a>
        ) : (
          <span key={index}>{chunk}</span>
        ),
      )}
    </>
  );
}

function ToolCard({ part }: { part: Record<string, unknown> }) {
  const type = String(part.type || "tool");
  const name = type === "dynamic-tool" ? String(part.toolName || "Tool") : type.replace(/^tool-/, "");
  const state = String(part.state || "running");
  const output = part.output ?? part.result ?? part.errorText;

  return (
    <div className="tool-card">
      <div className="tool-card-head">
        <span className="tool-dot" />
        <strong>{name}</strong>
        <span className="tool-state">{state}</span>
      </div>
      {output !== undefined ? (
        <pre>{JSON.stringify(output, null, 2).slice(0, 5000)}</pre>
      ) : null}
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [settings, setSettings] = useState<Settings>({
    baseURL: "",
    apiKey: "",
    model: "",
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    setUserId(getOrCreateUserId());
    const saved = window.localStorage.getItem("omni-agent-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<Settings>;
        setSettings((current) => ({
          ...current,
          baseURL: parsed.baseURL || "",
          model: parsed.model || "",
        }));
      } catch {}
    }

    fetch("/api/health", { cache: "no-store" })
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function saveNonSecretSettings(next: Settings) {
    window.localStorage.setItem(
      "omni-agent-settings",
      JSON.stringify({ baseURL: next.baseURL, model: next.model }),
    );
  }

  async function submit(text: string) {
    const value = text.trim();
    if (!value || busy || !userId) return;
    setInput("");

    await sendMessage(
      { text: value },
      {
        body: {
          userId,
          aiConfig: settings,
        },
      },
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(input);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>
          <div>
            <strong>OMNI AGENT</strong>
            <span>Composio-powered</span>
          </div>
        </div>

        <button className="new-chat" onClick={() => setMessages([])}>
          + New conversation
        </button>

        <div className="side-section">
          <span className="eyebrow">TOOL ACCESS</span>
          <div className="status-row">
            <span className={health?.composioConfigured ? "status-dot ok" : "status-dot"} />
            <div>
              <strong>{health?.composioConfigured ? "Composio ready" : "Composio key missing"}</strong>
              <small>1,500+ toolkits discoverable</small>
            </div>
          </div>
          <div className="status-row">
            <span
              className={
                settings.apiKey || health?.serverAIConfigured ? "status-dot ok" : "status-dot"
              }
            />
            <div>
              <strong>
                {settings.apiKey || health?.serverAIConfigured ? "AI provider ready" : "AI setup needed"}
              </strong>
              <small>OpenAI-compatible endpoint</small>
            </div>
          </div>
        </div>

        <div className="side-section">
          <span className="eyebrow">QUICK TASKS</span>
          <div className="quick-list">
            {quickActions.map((action) => (
              <button key={action} onClick={() => void submit(action)}>
                {action}
              </button>
            ))}
          </div>
        </div>

        <button className="settings-button" onClick={() => setSettingsOpen(true)}>
          Settings
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">UNIVERSAL TOOL AGENT</span>
            <h1>Ask. Connect. Execute.</h1>
          </div>
          <button className="mobile-settings" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
        </header>

        <div className="chat">
          {messages.length === 0 ? (
            <div className="hero">
              <div className="hero-orb">∞</div>
              <h2>One agent. Thousands of actions.</h2>
              <p>
                Ask for a task in Gmail, GitHub, Slack, Drive, Notion, Calendar and other
                supported apps. Omni discovers the required tools and asks you to connect an
                account when needed.
              </p>
              <div className="hero-grid">
                <div><b>Dynamic</b><span>Tool discovery</span></div>
                <div><b>On-demand</b><span>OAuth connections</span></div>
                <div><b>Custom</b><span>AI endpoint</span></div>
              </div>
            </div>
          ) : null}

          <div className="messages">
            {messages.map((message) => (
              <article key={message.id} className={"message " + message.role}>
                <div className="avatar">{message.role === "user" ? "Y" : "O"}</div>
                <div className="bubble">
                  <div className="message-role">
                    {message.role === "user" ? "You" : "Omni Agent"}
                  </div>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <p key={index}>
                          <LinkifiedText text={part.text} />
                        </p>
                      );
                    }

                    if (
                      part.type === "dynamic-tool" ||
                      (typeof part.type === "string" && part.type.startsWith("tool-"))
                    ) {
                      return <ToolCard key={index} part={part as unknown as Record<string, unknown>} />;
                    }

                    return null;
                  })}
                </div>
              </article>
            ))}
            {busy ? (
              <article className="message assistant">
                <div className="avatar">O</div>
                <div className="bubble thinking">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            ) : null}
            {error ? <div className="error-box">{error.message}</div> : null}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="composer-wrap">
          <form className="composer" onSubmit={onSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (busy) stop();
                  else void submit(input);
                }
              }}
              placeholder="Ask Omni to do something across your apps..."
              rows={1}
            />
            <button type={busy ? "button" : "submit"} onClick={busy ? stop : undefined}>
              {busy ? "Stop" : "Send"}
            </button>
          </form>
          <p className="composer-note">
            External apps require their own connection. Tool access does not bypass app permissions.
          </p>
        </div>
      </section>

      {settingsOpen ? (
        <div className="modal-backdrop" onMouseDown={() => setSettingsOpen(false)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">MODEL CONNECTION</span>
                <h3>AI Provider Settings</h3>
              </div>
              <button onClick={() => setSettingsOpen(false)}>×</button>
            </div>

            <label>
              <span>OpenAI-compatible base URL</span>
              <input
                value={settings.baseURL}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, baseURL: event.target.value }))
                }
                placeholder="https://your-endpoint.example/v1"
              />
            </label>

            <label>
              <span>Model</span>
              <input
                value={settings.model}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, model: event.target.value }))
                }
                placeholder="your-model-id"
              />
            </label>

            <label>
              <span>API key</span>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, apiKey: event.target.value }))
                }
                placeholder="Not saved in localStorage"
              />
            </label>

            <p className="settings-help">
              Leave fields blank to use server environment defaults. The API key entered here is
              sent only with chat requests and is not stored by this UI.
            </p>

            <button
              className="save-settings"
              onClick={() => {
                saveNonSecretSettings(settings);
                setSettingsOpen(false);
              }}
            >
              Save settings
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
