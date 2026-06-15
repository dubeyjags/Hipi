"use client";

import { useState } from "react";

import { api } from "@/trpc/react";

interface Props {
  onClose: () => void;
  rightOffset?: number;
}

export function ComposeMessage({ onClose, rightOffset = 24 }: Props) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const utils = api.useUtils();

  const createDraft = api.gmail.createDraft.useMutation({
    onSuccess: async () => {
      await utils.gmail.listDrafts.invalidate();
      setTo("");
      setSubject("");
      setBody("");
    },
  });

  const sendEmail = api.gmail.sendEmail.useMutation({
    onSuccess: async () => {
      await utils.gmail.searchEmails.invalidate();
      setTo("");
      setSubject("");
      setBody("");
      onClose();
    },
  });

  return (
    <div
      className="fixed bottom-0 z-50 w-[400px] overflow-hidden rounded-t-2xl border border-[#dadce0] bg-white shadow-2xl"
      style={{ right: rightOffset }}
    >
      <div className="flex cursor-default items-center justify-between bg-[#404040] px-4 py-3">
        <span className="text-sm font-medium text-white">New Message</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1 text-white transition-colors hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-[#e8eaed] px-4 py-2">
          <span className="w-14 shrink-0 text-xs text-[#5f6368]">To</span>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipients"
            className="flex-1 bg-transparent text-sm text-[#202124] outline-none placeholder:text-[#bdc1c6]"
          />
        </div>
        <div className="flex items-center gap-3 border-b border-[#e8eaed] px-4 py-2">
          <span className="w-14 shrink-0 text-xs text-[#5f6368]">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent text-sm text-[#202124] outline-none placeholder:text-[#bdc1c6]"
          />
        </div>
        <div className="px-4 py-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={8}
            className="w-full resize-none bg-transparent text-sm text-[#202124] outline-none placeholder:text-[#bdc1c6]"
          />
        </div>
        <div className="flex items-center gap-2 border-t border-[#e8eaed] px-4 py-3">
          <button
            type="button"
            onClick={() => sendEmail.mutate({ to, subject, body })}
            disabled={sendEmail.isPending || !to || !subject || !body}
            className="rounded-full bg-[#1a73e8] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1557b0] disabled:opacity-50"
          >
            {sendEmail.isPending ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => createDraft.mutate({ to, subject, body })}
            disabled={createDraft.isPending || !to || !subject || !body}
            className="rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] disabled:opacity-50"
          >
            {createDraft.isPending ? "Saving…" : "Save Draft"}
          </button>
        </div>
        {(createDraft.error ?? sendEmail.error) && (
          <p className="px-4 pb-3 text-sm text-[#d93025]">
            {(createDraft.error ?? sendEmail.error)?.message}
          </p>
        )}
      </form>
    </div>
  );
}
