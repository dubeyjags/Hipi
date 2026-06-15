"use client";

import { useEffect, useState } from "react";

import { api } from "@/trpc/react";
import { getWeekBounds } from "@/lib/week";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface Props {
  onClose: () => void;
  rightOffset?: number;
}

export function CreateEvent({ onClose, rightOffset = 24 }: Props) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [attendees, setAttendees] = useState("");

  useEffect(() => {
    const defaultStart = new Date();
    defaultStart.setMinutes(0, 0, 0);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultEnd.getHours() + 1);
    setStart(toDatetimeLocalValue(defaultStart));
    setEnd(toDatetimeLocalValue(defaultEnd));
  }, []);

  const utils = api.useUtils();
  const week = getWeekBounds(0);

  const createDraft = api.calendar.createDraft.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
      resetForm();
    },
  });

  const sendInvite = api.calendar.sendInvite.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
      resetForm();
      onClose();
    },
  });

  function resetForm() {
    setSummary("");
    setDescription("");
    setLocation("");
    setAttendees("");
  }

  function parseAttendees() {
    return attendees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }

  function buildEventInput() {
    return {
      summary,
      description: description || undefined,
      location: location || undefined,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      attendees: parseAttendees(),
    };
  }

  const inputClass =
    "w-full border-b border-[#dadce0] bg-transparent py-1.5 text-sm text-[#202124] outline-none transition-colors focus:border-[#1a73e8] placeholder:text-[#bdc1c6]";

  return (
    <div
      className="fixed bottom-0 z-50 w-[420px] overflow-hidden rounded-t-2xl border border-[#dadce0] bg-white shadow-2xl"
      style={{ right: rightOffset }}
    >
      <div className="flex cursor-default items-center justify-between bg-[#1a73e8] px-4 py-3">
        <span className="text-sm font-medium text-white">New Event</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1 text-white transition-colors hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto px-5 py-4"
      >
        <div>
          <label className="mb-1 block text-xs text-[#5f6368]">Title</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Add title"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-[#5f6368]">Start</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#5f6368]">End</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#5f6368]">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#5f6368]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#5f6368]">
            Attendees
            <span className="ml-1 text-[#bdc1c6]">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="email@example.com, other@example.com"
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => createDraft.mutate(buildEventInput())}
            disabled={createDraft.isPending || !summary || !start || !end}
            className="rounded-full bg-[#1a73e8] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1557b0] disabled:opacity-50"
          >
            {createDraft.isPending ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => sendInvite.mutate(buildEventInput())}
            disabled={
              sendInvite.isPending ||
              !summary ||
              !start ||
              !end ||
              parseAttendees().length === 0
            }
            className="rounded-full border border-[#dadce0] px-6 py-2 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] disabled:opacity-50"
          >
            {sendInvite.isPending ? "Sending…" : "Send Invite"}
          </button>
        </div>

        {(createDraft.error ?? sendInvite.error) && (
          <p className="text-sm text-[#d93025]">
            {(createDraft.error ?? sendInvite.error)?.message}
          </p>
        )}
      </form>
    </div>
  );
}
