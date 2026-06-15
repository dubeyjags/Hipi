"use client";

import { useState } from "react";

import { formatMessageDate, formatSender, LinkifiedText } from "@/lib/display";
import { api } from "@/trpc/react";

const AVATAR_COLORS = [
  "bg-[#1a73e8]",
  "bg-[#0f9d58]",
  "bg-[#f4511e]",
  "bg-[#7986cb]",
  "bg-[#33b679]",
  "bg-[#d50000]",
  "bg-[#8e24aa]",
  "bg-[#f09300]",
];

function avatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export function GmailPanel() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [view, setView] = useState<"inbox" | "drafts">("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const utils = api.useUtils();

  const emails = api.gmail.searchEmails.useQuery(
    { query: activeSearch, limit: 50, offset: 0 },
    { enabled: view === "inbox" },
  );

  const selectedEmail = api.gmail.getMessage.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId },
  );

  const drafts = api.gmail.listDrafts.useQuery(
    { limit: 50, offset: 0 },
    { enabled: view === "drafts" },
  );

  const refreshInbox = api.gmail.refreshInbox.useMutation({
    onSuccess: async () => {
      await utils.gmail.searchEmails.invalidate();
      await utils.gmail.listDrafts.invalidate();
    },
  });

  const sendDraft = api.gmail.sendDraft.useMutation({
    onSuccess: async () => {
      await utils.gmail.searchEmails.invalidate();
      await utils.gmail.listDrafts.invalidate();
    },
  });

  /* ── Email detail view ── */
  if (selectedId) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#dadce0] px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
          >
            ← Back
          </button>
        </div>

        {selectedEmail.isLoading && (
          <div className="px-6 py-10 text-center text-sm text-[#5f6368]">
            Loading…
          </div>
        )}
        {selectedEmail.error && (
          <div className="px-6 py-4 text-sm text-[#d93025]">
            {selectedEmail.error.message}
          </div>
        )}

        {selectedEmail.data && (
          <div className="px-8 py-6">
            <h1 className="mb-4 text-2xl font-normal text-[#202124]">
              {selectedEmail.data.subject || "(no subject)"}
            </h1>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm font-medium text-[#202124]">
                {formatSender(selectedEmail.data.from)}
              </span>
              {selectedEmail.data.date && (
                <span className="text-sm text-[#5f6368]">
                  {formatMessageDate(selectedEmail.data.date)}
                </span>
              )}
            </div>
            {selectedEmail.data.to && (
              <div className="mb-4 text-sm text-[#5f6368]">
                to {formatSender(selectedEmail.data.to)}
              </div>
            )}
            <hr className="my-4 border-[#e8eaed]" />
            <div className="email-body text-sm text-[#202124]">
              <LinkifiedText
                text={
                  selectedEmail.data.body ??
                  selectedEmail.data.snippet ??
                  "(empty)"
                }
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Main view ── */
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#dadce0] bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {(["inbox", "drafts"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v
                  ? "bg-[#e8f0fe] text-[#1a73e8]"
                  : "text-[#5f6368] hover:bg-[#f1f3f4]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => refreshInbox.mutate()}
          disabled={refreshInbox.isPending}
          className="ml-auto rounded-full px-3 py-1.5 text-sm text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] disabled:opacity-50"
        >
          {refreshInbox.isPending ? "Refreshing…" : "↻ Refresh"}
        </button>
        {refreshInbox.data && (
          <span className="text-xs text-[#5f6368]">
            {refreshInbox.data.synced} synced
          </span>
        )}
      </div>

      {/* Search (inbox only) */}
      {view === "inbox" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search);
          }}
          className="flex gap-2"
        >
          <div className="flex flex-1 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 shadow-sm transition-shadow hover:shadow-md">
            <svg
              className="h-4 w-4 shrink-0 text-[#5f6368]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mail"
              className="flex-1 bg-transparent py-3 text-sm text-[#202124] outline-none placeholder:text-[#5f6368]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveSearch("");
                }}
                className="text-lg leading-none text-[#5f6368] hover:text-[#202124]"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1557b0]"
          >
            Search
          </button>
        </form>
      )}

      {/* Inbox list */}
      {view === "inbox" && (
        <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-sm">
          {emails.isLoading && (
            <div className="px-6 py-10 text-center text-sm text-[#5f6368]">
              Loading…
            </div>
          )}
          {emails.error && (
            <div className="px-6 py-4 text-sm text-[#d93025]">
              {emails.error.message}
            </div>
          )}
          {emails.data?.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-[#5f6368]">
              No emails. Try refreshing from Gmail.
            </div>
          )}
          {emails.data && emails.data.length > 0 && (
            <ul className="divide-y divide-[#e8eaed]">
              {emails.data.map((email) => {
                const sender = email.from ?? "";
                const initial = (sender[0] ?? "?").toUpperCase();
                return (
                  <li key={email.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(email.id)}
                      className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-[#f6f8fc]"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${avatarColor(sender)}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-[#202124]">
                            {formatSender(sender)}
                          </span>
                          {email.date && (
                            <span className="shrink-0 text-xs text-[#5f6368]">
                              {formatMessageDate(email.date)}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-sm text-[#202124]">
                          {email.subject || "(no subject)"}
                          {email.snippet && (
                            <span className="text-[#5f6368]">
                              {" "}
                              — {email.snippet}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Drafts list */}
      {view === "drafts" && (
        <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-sm">
          {drafts.isLoading && (
            <div className="px-6 py-10 text-center text-sm text-[#5f6368]">
              Loading…
            </div>
          )}
          {drafts.error && (
            <div className="px-6 py-4 text-sm text-[#d93025]">
              {drafts.error.message}
            </div>
          )}
          {drafts.data?.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-[#5f6368]">
              No drafts.
            </div>
          )}
          {drafts.data && drafts.data.length > 0 && (
            <ul className="divide-y divide-[#e8eaed]">
              {drafts.data.map((draft) => (
                <li
                  key={draft.id}
                  className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-[#f6f8fc]"
                >
                  <span className="text-sm font-medium text-[#d93025]">
                    Draft
                  </span>
                  <span className="flex-1 truncate text-sm text-[#5f6368]">
                    {draft.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => sendDraft.mutate({ draftId: draft.id })}
                    disabled={sendDraft.isPending}
                    className="rounded-full px-3 py-1 text-sm text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] disabled:opacity-50"
                  >
                    Send
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}
